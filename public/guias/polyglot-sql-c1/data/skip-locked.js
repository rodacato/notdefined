/* data/skip-locked.js — 4.3 SELECT FOR UPDATE / SKIP LOCKED */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "skip-locked",
    titulo: "FOR UPDATE SKIP LOCKED",
    dificultad: 2,
    queEs: "Locking explícito de uso: cómo N workers jalan trabajos distintos de una tabla-cola sin "
      + "bloquearse, y por qué eso suele bastar antes de meter un broker.",
    enBreve: [
      { k: "La forma", v: "<code>SELECT … FROM jobs WHERE estado = 'pendiente' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1</code>." },
      { k: "Las tres variantes", v: "<code>FOR UPDATE</code> espera el lock; <code>NOWAIT</code> falla de inmediato; <code>SKIP LOCKED</code> salta la fila y sigue." },
      { k: "Duración", v: "El lock se sostiene hasta el <code>COMMIT</code> o <code>ROLLBACK</code> de la transacción. No hay lock «por un rato»." },
      { k: "Techo práctico", v: "Miles de jobs por segundo con esta receta es normal. En decenas de miles/s, una cola dedicada gana." }
    ],
    fundamento: "<p><code>FOR UPDATE</code> le dice al motor «voy a modificar estas filas, no dejes que otro las toque». "
      + "El default es esperar, que es lo correcto para editar un registro y lo peor posible para una cola: los N "
      + "workers se forman detrás de la misma primera fila y tu paralelismo real es uno.</p>"
      + "<p><code>SKIP LOCKED</code> cambia la semántica a «dame la primera que <em>nadie</em> tenga tomada». Con eso, "
      + "una tabla y una sentencia te dan una cola de trabajos con reparto justo, sin duplicados y sin espera. Es la "
      + "receta que usan por dentro varias librerías de jobs sobre Postgres.</p>"
      + "<p>La disciplina que hay que imponer es transaccional, no de SQL: agarra la fila, marca su estado, "
      + "<code>COMMIT</code> rápido. El trabajo pesado va fuera. El mecanismo interno de los locks es «SQL a fondo» "
      + "(C2); aquí importa el patrón de uso y su regla de oro.</p>",
    comoFunciona: [
      {
        nota: "Tomar un job y marcarlo, en una sentencia. El <code>COMMIT</code> llega de inmediato después.",
        sql: "UPDATE jobs SET estado = 'corriendo', tomado_en = now()\nWHERE id = (\n  SELECT id FROM jobs WHERE estado = 'pendiente'\n  ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1\n)\nRETURNING id, payload;\n-- => 1 fila (o 0 si la cola está vacía); tres workers reciben ids distintos"
      },
      {
        nota: "Reparto en lote: cada worker se lleva 10 distintos, ninguno espera.",
        sql: "SELECT id FROM jobs WHERE estado = 'pendiente'\nORDER BY prioridad DESC, id\nFOR UPDATE SKIP LOCKED LIMIT 10;\n-- => 10 filas, disjuntas de las que se llevó cualquier otro worker"
      },
      {
        nota: "<code>NOWAIT</code> cuando esperar es un bug de negocio: prefieres fallar y avisar.",
        sql: "SELECT * FROM inventario WHERE sku = 'A-1' FOR UPDATE NOWAIT;\n-- => ERROR: could not obtain lock on row in relation \"inventario\""
      },
      {
        nota: "El anti-patrón, para reconocerlo en un code review.",
        sql: "-- ✗ el lock vive todo el HTTP call\nBEGIN;\n  SELECT … FOR UPDATE SKIP LOCKED LIMIT 1;   -- toma el job\n  -- 40 s llamando a un API externo, con la transacción abierta\nCOMMIT;\n-- => esa fila queda bloqueada 40 s y la cola parece atascada"
      }
    ],
    widget: "skip-locked",
    cuandoNo: "<p>El lock se sostiene hasta el <code>COMMIT</code>: un worker que hace trabajo lento (llamada HTTP, "
      + "procesamiento de imagen) con la transacción abierta bloquea esa fila TODO ese rato, y la cola se atasca sin "
      + "que nadie entienda por qué.</p>"
      + "<p>Regla: agarra la fila, marca estado, <code>COMMIT</code> rápido; el trabajo pesado va FUERA de la "
      + "transacción del lock. Y a MUY alto throughput (decenas de miles por segundo) una cola dedicada gana: cada "
      + "toma es una escritura, y eso son WAL, vacuum y bloat que tu base paga junto con todo lo demás.</p>",
    mito: {
      creencia: "una cola de jobs necesita Redis, RabbitMQ o Sidekiq — la base no sirve",
      veredicto: "falso a menudo",
      realidad: "<code>SELECT … FOR UPDATE SKIP LOCKED LIMIT 1</code> deja que N workers jalen filas distintas de una "
        + "tabla-cola sin bloquearse ni agarrar la misma, con la ventaja de encolar en la MISMA transacción que crea "
        + "los datos. El mecanismo de los locks es «SQL a fondo» (C2); aquí, el patrón de uso."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · The Locking Clause (FOR UPDATE, SKIP LOCKED)", nota: "Semántica exacta de las tres variantes y su interacción con ORDER BY y LIMIT.", url: "https://www.postgresql.org/docs/17/sql-select.html#SQL-FOR-UPDATE-SHARE" },
      { titulo: "PostgreSQL 17 · Explicit Locking", nota: "Modos de lock de fila y de tabla — el mapa para saber qué compite con qué.", url: "https://www.postgresql.org/docs/17/explicit-locking.html" },
      { titulo: "PGConf · Colas de trabajo sobre PostgreSQL", nota: "Charlas de la comunidad con números reales de throughput, bloat y cuándo migrar a un broker.", url: "https://www.postgresql.org/about/events/" }
    ]
  });
})(window.GUIA = window.GUIA || {});
