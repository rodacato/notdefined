/* ============================================================================
   data/aislamiento.js — Ficha 07 · Niveles de aislamiento.
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.aislamiento = {
    slug: "aislamiento",

    queEs: [
      "Los niveles de aislamiento son las garantías que el motor te da sobre lo que puedes ver de las transacciones de los demás. En Postgres los tres se implementan sobre la misma maquinaria de MVCC.",
      "Lo único que cambia entre Read Committed y Repeatable Read es <em>cuándo se toma el snapshot</em>. Serializable añade encima algo distinto: vigilancia activa de conflictos."
    ],

    enBreve: [
      "<b>Read Committed</b> (default): snapshot nuevo <em>por cada statement</em>. <b>Repeatable Read</b>: un solo snapshot para <em>toda</em> la transacción. Esa es toda la diferencia mecánica.",
      "Postgres no tiene <b>Read Uncommitted</b> de verdad: si lo pides, te da Read Committed. Los <em>dirty reads</em> son imposibles aquí porque una versión sin commit nunca es visible.",
      "El <b>Repeatable Read</b> de Postgres también previene <em>phantom reads</em> — es más fuerte que lo que exige el estándar SQL. Lo que NO previene es el <b>write skew</b>.",
      "<b>Serializable</b> usa <b>SSI</b> (Serializable Snapshot Isolation): rastrea dependencias lectura-escritura y <b>aborta</b> con <code>serialization_failure</code> (SQLSTATE <code>40001</code>). Tu aplicación <em>tiene</em> que reintentar."
    ],

    fundamento: [
      { p: "El estándar SQL define los niveles por las anomalías que prohíben: dirty read (leer algo sin commitear), non-repeatable read (leer dos veces y obtener distinto), phantom read (una segunda consulta trae filas nuevas). Es una definición por síntomas, y le queda grande a Postgres — aquí los dirty reads simplemente no son expresables, porque la regla de visibilidad de MVCC nunca muestra un tuple cuyo <code>xmin</code> no esté committed." },
      { p: "Con snapshots, subir de nivel es abaratar decisiones: si tomas un snapshot por statement, cada statement ve el mundo más reciente y dos lecturas seguidas pueden diferir. Si tomas uno solo al principio, toda la transacción vive en un instante congelado y es consistente consigo misma. No hay locks nuevos en ninguno de los dos casos." },
      { p: "Pero snapshot isolation, por fuerte que sea, no es serializabilidad. Dos transacciones pueden leer un estado consistente, escribir cosas distintas y producir un resultado que <em>ninguna ejecución en serie</em> habría producido: eso es el <b>write skew</b>. Ahí es donde Serializable deja de ser pasivo. SSI vigila el grafo de dependencias entre transacciones y, cuando detecta un patrón peligroso, mata a una. No espera: aborta." }
    ],

    comoFunciona: [
      { p: "<b>Read Committed.</b> Snapshot por statement. La consecuencia práctica es que dentro de una misma transacción dos <code>SELECT</code> idénticos pueden dar distinto:" },
      { code: { tag: "SQL", caption: "Read Committed · non-repeatable read, a propósito", text:
"-- Txn A (default: READ COMMITTED)          -- Txn B\n" +
"BEGIN;\n" +
"SELECT total FROM pedidos WHERE id = 42;\n" +
"--  250.00\n" +
"                                            UPDATE pedidos SET total = 310\n" +
"                                              WHERE id = 42;\n" +
"                                            COMMIT;\n" +
"SELECT total FROM pedidos WHERE id = 42;\n" +
"--  310.00     ← cambió dentro de la misma transacción\n" +
"COMMIT;"
      }},
      { p: "<b>Repeatable Read.</b> Un snapshot para toda la transacción: el mismo <code>SELECT</code> da lo mismo siempre. Y si intentas escribir algo que alguien más ya modificó después de tu snapshot, no te deja pisarlo: te aborta." },
      { code: { tag: "SQL", caption: "Repeatable Read · el error que tienes que reintentar", text:
"-- Txn A                                    -- Txn B\n" +
"BEGIN ISOLATION LEVEL REPEATABLE READ;\n" +
"SELECT total FROM pedidos WHERE id = 42;\n" +
"--  250.00\n" +
"                                            UPDATE pedidos SET total = 310\n" +
"                                              WHERE id = 42;\n" +
"                                            COMMIT;\n" +
"SELECT total FROM pedidos WHERE id = 42;\n" +
"--  250.00     ← sigue viendo su snapshot. Consistente.\n" +
"\n" +
"UPDATE pedidos SET total = 400 WHERE id = 42;\n" +
"-- ERROR:  could not serialize access due to concurrent update"
      }},
      { p: "<b>Serializable (SSI).</b> Todo lo de Repeatable Read, más detección de ciclos de dependencia peligrosa. El ejemplo canónico es el write skew — dos transacciones que por separado respetan la regla de negocio y juntas la rompen:" },
      { code: { tag: "SQL", caption: "write skew · lo único que Serializable atrapa y RR no", text:
"-- Regla de negocio: SIEMPRE al menos un doctor de guardia.\n" +
"-- Hay 2 activos. Cada uno pide su día libre al mismo tiempo.\n" +
"\n" +
"-- Txn A                                    -- Txn B\n" +
"BEGIN ISOLATION LEVEL SERIALIZABLE;         BEGIN ISOLATION LEVEL SERIALIZABLE;\n" +
"SELECT count(*) FROM guardia                SELECT count(*) FROM guardia\n" +
"  WHERE activo;  -- 2, puedo irme             WHERE activo;  -- 2, puedo irme\n" +
"UPDATE guardia SET activo = false           UPDATE guardia SET activo = false\n" +
"  WHERE id = 1;                               WHERE id = 2;\n" +
"COMMIT;  -- OK\n" +
"                                            COMMIT;\n" +
"-- ERROR:  could not serialize access due to read/write dependencies\n" +
"--         among transactions\n" +
"-- DETAIL:  Reason code: Canceled on identification as a pivot.\n" +
"-- HINT:  The transaction might succeed if retried.\n" +
"\n" +
"-- En REPEATABLE READ las dos habrían commiteado: cero doctores de guardia.\n" +
"-- Ninguna tocó la fila de la otra, así que no hay conflicto de escritura."
      }},
      { p: "Fíjate en el <code>HINT</code>: el motor te está diciendo que el reintento es <em>parte del contrato</em>. SSI es optimista — asume que casi nunca hay conflicto y paga con abortos cuando se equivoca, incluidos <b>falsos positivos</b> (aborta transacciones que en realidad eran seguras, porque el rastreo es conservador)." },
      { p: "<b>Cómo se pide y cómo se atrapa.</b> El nivel se fija al inicio de la transacción y no se puede cambiar después del primer statement:" },
      { code: { tag: "SQL", caption: "fijar el nivel y los códigos que hay que capturar", text:
"BEGIN ISOLATION LEVEL SERIALIZABLE;\n" +
"-- o para toda la sesión:\n" +
"SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL REPEATABLE READ;\n" +
"\n" +
"SHOW transaction_isolation;   --  read committed\n" +
"\n" +
"-- Los dos SQLSTATE que tu capa de datos DEBE reintentar:\n" +
"--   40001  serialization_failure   (RR y Serializable)\n" +
"--   40P01  deadlock_detected       (cualquier nivel — ficha 08)"
      }},
      { p: "Y un detalle de mecánica: SSI necesita memoria para rastrear predicados. Cuando se le acaba (<code>max_pred_locks_per_transaction</code>) escala granularidad — de fila a página a tabla — y con eso <em>aumenta</em> la tasa de falsos positivos. El aislamiento fuerte no es gratis, pero lo que cuesta son abortos, no esperas." }
    ],

    cuandoDuele: {
      sym: "Síntoma: 40001 esporádicos en producción que «no se pueden reproducir»",
      paras: [
        "Errores intermitentes bajo carga, siempre en el endpoint más concurrido, que desaparecen en staging porque ahí nadie compite. El equipo los trata como flakiness y los reintenta a mano donde se acuerda.",
        "El <code>40001</code> no es un bug: es el mecanismo funcionando. Con Repeatable Read o Serializable, <b>el reintento es parte del contrato de la aplicación</b> — y tiene que estar en un solo lugar (la capa de transacción, con backoff y un límite), no salpicado por los handlers. El error de diseño más común es abrir la transacción en Serializable y dejar el retry «para después»."
      ]
    },

    mito: {
      claim: "SERIALIZABLE es READ COMMITTED pero más lento",
      truth: "Falso, y creerlo te lleva a producción con una bomba. La diferencia no es velocidad: es que <b>SSI aborta transacciones</b> — incluso algunas que eran perfectamente seguras, por falsos positivos del rastreo conservador. Si activas Serializable sin lógica de reintento, no compraste consistencia: compraste errores <code>40001</code> intermitentes bajo carga.",
      more: [
        { html: "<b>«Repeatable Read no bloquea nada.»</b> Sí bloquea: los <em>phantom reads</em>, que el estándar SQL le permitiría. El Repeatable Read de Postgres es más fuerte que el del papel." },
        { html: "<b>«SERIALIZABLE serializa de verdad, una tras otra.»</b> No: corren en paralelo con snapshots. Postgres solo garantiza que el <em>resultado</em> sea equivalente a algún orden serial, y para lograrlo mata a la que rompe el patrón." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Transaction Isolation (13.2)", note: "Los tres niveles con las anomalías que bloquea cada uno y el ejemplo de write skew de la casa." },
      { kind: "Charla / Paper", title: "Serializable Snapshot Isolation — Cahill, Röhm, Fekete", note: "El paper de 2008 detrás de SSI. La wiki de Postgres tiene el resumen «Serializable» digerido." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 5.9: SSI implementado, con los predicate locks y el grafo de dependencias." }
    ]
  };

})(window.GUIA = window.GUIA || {});
