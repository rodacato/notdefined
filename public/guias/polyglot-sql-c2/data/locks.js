/* ============================================================================
   data/locks.js — Ficha 08 · Locks y deadlocks.
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.locks = {
    slug: "locks",

    queEs: [
      "MVCC te quita los locks de lectura, no los de escritura. Dos transacciones que quieren modificar la misma fila se serializan una detrás de otra, y eso sí es un lock de verdad.",
      "Hay tres familias: los de fila, los de tabla (los que toma el DDL) y los <em>advisory</em>, que pides tú. Y un mecanismo aparte para cuando dos se esperan en círculo."
    ],

    enBreve: [
      "<b>Row locks</b>: <code>FOR UPDATE</code>, <code>FOR NO KEY UPDATE</code>, <code>FOR SHARE</code>, <code>FOR KEY SHARE</code>, más el implícito de todo <code>UPDATE</code>. No viven en RAM: se marcan en el propio tuple (en <code>xmax</code>), con un <em>multixact</em> cuando hay varios interesados.",
      "<b>Table locks</b>: 8 modos con una matriz de conflictos. <code>ACCESS EXCLUSIVE</code> es el que toma el DDL y choca con <b>todo</b>, incluidos los <code>SELECT</code>.",
      "<b>Advisory locks</b>: <code>pg_advisory_lock(clave)</code>. El motor solo los contabiliza; el significado es tuyo. Duran hasta que los sueltas o se cierra la sesión.",
      "Un <b>deadlock</b> se detecta con un grafo de espera después de <code>deadlock_timeout</code> (1s por default). El motor elige una víctima y la aborta con SQLSTATE <code>40P01</code>."
    ],

    fundamento: [
      { p: "Un <code>UPDATE</code> tiene que decidir sobre qué versión aplica su cambio, y solo puede haber <em>una</em> cadena de versiones válida por fila. Si dos transacciones actualizan la misma fila al mismo tiempo, la segunda no tiene otra opción que esperar a que la primera resuelva: si commiteó, aplica sobre la versión nueva (o aborta, en Repeatable Read); si abortó, aplica sobre la vieja. Ese es el lock de escritura, y es inevitable en cualquier diseño." },
      { p: "El truco de implementación es que los row locks no se guardan en una tabla de locks en memoria — serían millones. Se marcan en el tuple mismo, reusando el campo <code>xmax</code>. Cuando varias transacciones tienen interés simultáneo en la misma fila, ahí va un <em>multixact id</em> que apunta a una lista aparte. Por eso «lockear» un millón de filas no consume memoria proporcional: consume escrituras." },
      { p: "Los table locks son otra historia: sí viven en una estructura compartida, son pocos y su semántica está en una matriz de conflictos. Lo importante de esa matriz es una asimetría: los modos de lectura conviven entre ellos, pero <code>ACCESS EXCLUSIVE</code> choca con todos — y <b>los locks se conceden en orden de llegada</b>. Un solo DDL esperando forma una cola detrás de sí." }
    ],

    comoFunciona: [
      { p: "<b>Row locks explícitos.</b> El patrón «lee, decide, escribe» sin carreras. <code>FOR UPDATE</code> reserva las filas; los demás esperan ahí mismo:" },
      { code: { tag: "SQL", caption: "FOR UPDATE y sus dos escapes", text:
"BEGIN;\n" +
"SELECT saldo FROM cuentas WHERE id = 7 FOR UPDATE;\n" +
"--  Cualquier otro FOR UPDATE o UPDATE sobre la fila 7 espera aquí.\n" +
"UPDATE cuentas SET saldo = saldo - 100 WHERE id = 7;\n" +
"COMMIT;\n" +
"\n" +
"-- No quiero esperar: fallo inmediato\n" +
"SELECT ... FOR UPDATE NOWAIT;\n" +
"-- ERROR:  could not obtain lock on row in relation \"cuentas\"\n" +
"\n" +
"-- No quiero esperar: sáltate las filas ocupadas (patrón de cola de trabajos)\n" +
"SELECT * FROM jobs WHERE estado = 'pendiente'\n" +
"  ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED;"
      }},
      { p: "<code>SKIP LOCKED</code> es el que convierte una tabla en una cola de trabajos decente sin broker externo: cada worker toma el primer job que nadie más tenga tomado." },
      { p: "<b>Ver quién tiene qué.</b> La query que resuelve el 90% de los incidentes de locks. Fíjate en el patrón: un DDL sin conceder, y todo lo demás formado detrás:" },
      { code: { tag: "SQL", caption: "pg_locks · la cola detrás de un ALTER TABLE", text:
"SELECT l.pid, l.mode, l.granted, left(a.query, 34) AS query\n" +
"  FROM pg_locks l JOIN pg_stat_activity a USING (pid)\n" +
" WHERE l.relation = 'pedidos'::regclass ORDER BY a.query_start;\n" +
"\n" +
"  pid  |        mode         | granted |               query\n" +
"-------+---------------------+---------+------------------------------------\n" +
" 18432 | AccessShareLock     | t       | SELECT count(*) FROM pedidos WHER\n" +
" 18519 | AccessExclusiveLock | f       | ALTER TABLE pedidos ADD COLUMN no\n" +
" 18604 | AccessShareLock     | f       | SELECT * FROM pedidos WHERE id =\n" +
" 18655 | AccessShareLock     | f       | SELECT * FROM pedidos WHERE id =\n" +
"\n" +
"-- 18432 lleva 20 minutos con un SELECT y no suelta.\n" +
"-- 18519 (el ALTER) espera detrás de él.\n" +
"-- 18604 y 18655 son SELECT que NO chocan con 18432... pero chocan con\n" +
"-- el ALTER que está formado antes. La cola es FIFO: se atoran igual."
      }},
      { p: "Ese es el modo en que un <code>ALTER TABLE</code> «instantáneo» tira un servicio: no por su propio trabajo, sino por la fila india que forma. La mitigación es <code>SET lock_timeout</code> antes del DDL, para que se rinda en vez de acumular gente detrás:" },
      { code: { tag: "SQL", caption: "DDL defensivo", text:
"SET lock_timeout = '3s';\n" +
"ALTER TABLE pedidos ADD COLUMN nota text;\n" +
"-- Si en 3s no consiguió el lock, falla y suelta la cola:\n" +
"-- ERROR:  canceling statement due to lock timeout"
      }},
      { p: "<b>Deadlocks.</b> Dos transacciones que se esperan en círculo. Nadie puede avanzar, así que no hay timeout que lo resuelva solo — hay que <em>detectarlo</em>. Postgres espera <code>deadlock_timeout</code> antes de molestarse en revisar (asume que la mayoría de las esperas son normales), y si encuentra un ciclo en el grafo de espera, mata a una:" },
      { code: { tag: "SQL", caption: "deadlock detectado · el error real", text:
"-- Txn A                                  -- Txn B\n" +
"BEGIN;                                    BEGIN;\n" +
"UPDATE cuentas SET saldo = saldo - 100    UPDATE cuentas SET saldo = saldo - 50\n" +
"  WHERE id = 1;                             WHERE id = 2;\n" +
"UPDATE cuentas SET saldo = saldo + 100    UPDATE cuentas SET saldo = saldo + 50\n" +
"  WHERE id = 2;   -- espera a B             WHERE id = 1;   -- espera a A\n" +
"\n" +
"-- ERROR:  deadlock detected\n" +
"-- DETAIL:  Process 18432 waits for ShareLock on transaction 2417;\n" +
"--          blocked by process 18519.\n" +
"--          Process 18519 waits for ShareLock on transaction 2416;\n" +
"--          blocked by process 18432.\n" +
"-- HINT:  See server log for query details.\n" +
"-- CONTEXT:  while updating tuple (0,3) in relation \"cuentas\"\n" +
"\n" +
"-- La víctima recibe 40P01. La otra continúa como si nada."
      }},
      { p: "La causa de fondo casi siempre es la misma: dos rutas de código que tocan las mismas filas <b>en orden distinto</b>. La cura no es un lock más grande, es acordar un orden — por ejemplo, actualizar siempre por <code>id</code> ascendente." },
      { p: "<b>Advisory locks.</b> Cuando lo que quieres proteger no es una fila sino una <em>sección crítica</em>: un cron que no debe correr dos veces, una migración, un job único. El motor no sabe qué significa tu número:" },
      { code: { tag: "SQL", caption: "advisory lock · exclusión mutua a nivel aplicación", text:
"-- Intento no bloqueante: si otro proceso ya lo tiene, me retiro.\n" +
"SELECT pg_try_advisory_lock(982451653);\n" +
"--  t  → soy el único, adelante\n" +
"--  f  → alguien más está corriendo, me salgo\n" +
"\n" +
"SELECT pg_advisory_unlock(982451653);\n" +
"\n" +
"-- Variante atada a la transacción (se suelta sola en COMMIT/ROLLBACK):\n" +
"SELECT pg_advisory_xact_lock(982451653);"
      }}
    ],

    cuandoDuele: {
      sym: "Síntoma: un ALTER TABLE de dos milisegundos tira el servicio diez minutos",
      paras: [
        "Agregas una columna nullable — operación instantánea en PG17, no reescribe la tabla — y en treinta segundos el pool de conexiones está saturado y todo da timeout. El <code>ALTER</code> «no hizo nada» y aun así el incidente es real.",
        "Lo que pasó: el <code>ALTER</code> pidió <b>ACCESS EXCLUSIVE</b> y quedó esperando detrás de un <code>SELECT</code> largo o de una transacción idle. Como los locks se conceden <b>FIFO</b>, todos los <code>SELECT</code> que llegaron después — y que no chocaban con nada — se formaron detrás del <code>ALTER</code>. Un lock que nunca se concedió congeló la tabla. La receta: <code>lock_timeout</code> corto antes de todo DDL, y cazar <code>idle in transaction</code> antes de migrar."
      ]
    },

    mito: {
      claim: "Postgres es MVCC y no bloquea",
      truth: "Falso a la mitad, que es la peor forma de estar equivocado. MVCC elimina los locks de <b>lectura</b>: nadie espera para leer. Los de <b>escritura sobre la misma fila</b> siguen ahí y siempre estuvieron — dos <code>UPDATE</code> a la fila 42 se serializan uno detrás de otro. Y el DDL toma locks de tabla que sí bloquean lecturas.",
      more: [
        { html: "<b>«Un deadlock se resuelve solo esperando.»</b> No: un deadlock es circular por definición, nadie va a soltar. Postgres lo detecta con un grafo de espera y <b>aborta a una víctima</b>; alguien pierde su transacción, siempre." },
        { html: "<b>«Lockear muchas filas consume mucha memoria.»</b> No: los row locks se marcan en el propio tuple, no en una tabla de locks. Lo que consumen es escritura al heap y al WAL." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Explicit Locking (13.3)", note: "Los 8 modos de table lock con su matriz de conflictos, los row locks y los advisory. La referencia." },
      { kind: "Docs oficiales", title: "PostgreSQL 17 — pg_locks + Deadlocks (13.3.5)", note: "Cómo leer pg_locks y cómo funciona la detección por grafo de espera con deadlock_timeout." },
      { kind: "Charla / Web", title: "Postgres Wiki — Lock Monitoring", note: "Las queries listas para pegar en un incidente: quién bloquea a quién y desde cuándo." }
    ]
  };

})(window.GUIA = window.GUIA || {});
