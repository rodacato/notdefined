/* ============================================================================
   data/conexiones.js — Ficha 13 · Proceso por conexión.
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.conexiones = {
    slug: "conexiones",

    queEs: [
      "Postgres es <b>proceso por conexión</b>: el postmaster hace <code>fork()</code> y te da un proceso del sistema operativo dedicado, no un thread de un pool.",
      "Eso te compra aislamiento y robustez brutales — un backend que se cae no se lleva a nadie — y te cobra memoria y tiempo de arranque por cada cliente."
    ],

    enBreve: [
      "Un <b>proceso del SO completo</b> por conexión, con su propio espacio de memoria. No son threads. Al desconectar, el proceso muere y no se recicla.",
      "Abrir una conexión cuesta un <code>fork</code> más la inicialización del backend: del orden de <b>milisegundos</b>, no microsegundos. Y hay un handshake de autenticación encima.",
      "<code>work_mem</code> se asigna <b>por operación de sort/hash, por backend</b> — no por query y no por conexión. Un query con tres sorts puede usar tres veces <code>work_mem</code>.",
      "<code>max_connections</code> reserva estructuras al arrancar el servidor. <b>PostgreSQL 17 no trae pooler en core</b>: PgBouncer es externo, y a escala no es opcional."
    ],

    fundamento: [
      { p: "La decisión viene de los años noventa y sigue siendo defendible: un proceso por conexión te da aislamiento de memoria de verdad. Un bug en una función C de una extensión, un backend que corrompe su propio heap, un <code>OOM</code> de un query monstruoso — todo eso mata <em>un</em> proceso, y el postmaster limpia y sigue. En un modelo de threads, ese mismo bug se lleva el servidor entero." },
      { p: "El precio es que un proceso es una unidad caruja. Tiene su propio catálogo cacheado, su caché de planes, sus buffers locales, y todo eso <b>crece con el uso</b>: un backend de larga vida que ha tocado muchas tablas ocupa bastante más que uno recién nacido. Multiplica por el número de conexiones y ahí está tu factura de RAM, completamente aparte de <code>shared_buffers</code> (ficha 12)." },
      { p: "Y hay un costo peor que la memoria: <b>contención</b>. Cientos de procesos que quieren el mismo lock ligero, el mismo snapshot, la misma línea de caché del CPU, más el context switching del kernel. Pasado cierto punto — que suele estar bastante antes de lo que la gente cree — agregar conexiones <em>baja</em> el throughput total. La curva no se aplana: baja." },
      { p: "De ahí que el pooler no sea una optimización sino parte de la arquitectura. Su trabajo es desacoplar «cuántos clientes tengo» de «cuántos backends existen»: mil clientes de aplicación multiplexados sobre veinte o cincuenta conexiones reales que nunca se cierran." }
    ],

    comoFunciona: [
      { p: "<b>Míralo con los ojos del sistema operativo.</b> Los procesos de arriba son fijos; los de abajo son tus clientes, uno por uno:" },
      { code: { tag: "shell", caption: "ps · los procesos de un Postgres con dos clientes", text:
"$ ps -o pid,rss,cmd -u postgres\n" +
"\n" +
"  PID   RSS CMD\n" +
" 1041 41208 postgres: 17/main: checkpointer\n" +
" 1042 12844 postgres: 17/main: background writer\n" +
" 1043 18220 postgres: 17/main: walwriter\n" +
" 1044  9612 postgres: 17/main: autovacuum launcher\n" +
" 8891 48732 postgres: 17/main: app appdb 10.0.1.14(51244) idle\n" +
" 8892 51204 postgres: 17/main: app appdb 10.0.1.15(51250) SELECT\n" +
"\n" +
"-- Los cuatro primeros existen siempre y son los del bloque 3.\n" +
"-- Los dos últimos son conexiones. Uno está IDLE y ocupa 48 MB de RSS\n" +
"-- sin hacer absolutamente nada."
      }},
      { p: "<b>La cuenta de work_mem.</b> Es el error de capacity planning más común, porque el nombre engaña:" },
      { code: { tag: "SQL", caption: "work_mem no es por conexión: es por operación", text:
"SHOW work_mem;   --  4MB\n" +
"\n" +
"-- Un query con 2 sorts + 1 hash join:  3 × 4MB = 12MB en UN backend.\n" +
"-- 200 backends activos haciendo algo parecido: ~2.4 GB.\n" +
"-- Eso NO sale de shared_buffers: es memoria aparte, por proceso.\n" +
"\n" +
"-- En el plan se ve cuánta usó de verdad y si se fue a disco:\n" +
"EXPLAIN (ANALYZE, BUFFERS) SELECT ... ORDER BY total;\n" +
"   ->  Sort  (cost=...) (actual time=...)\n" +
"         Sort Method: external merge  Disk: 42184kB   ← se desbordó\n" +
"\n" +
"-- \"quicksort  Memory: 3204kB\" = cupo. \"external merge Disk:\" = no cupo.\n" +
"-- Súbelo por sesión para el query pesado, no globalmente:\n" +
"SET work_mem = '64MB';"
      }},
      { p: "<b>Quién está conectado y en qué estado.</b> Esta query te dice si tu problema es de conexiones o de otra cosa:" },
      { code: { tag: "SQL", caption: "pg_stat_activity · el diagnóstico de un pool saturado", text:
"SELECT state, count(*), max(now() - state_change) AS mas_viejo\n" +
"  FROM pg_stat_activity WHERE backend_type = 'client backend'\n" +
" GROUP BY state ORDER BY count(*) DESC;\n" +
"\n" +
"        state        | count |   mas_viejo\n" +
"---------------------+-------+---------------\n" +
" idle                |   287 | 00:41:12\n" +
" active              |    12 | 00:00:00.412\n" +
" idle in transaction |     8 | 02:14:38\n" +
"\n" +
"-- 287 idle: 287 procesos ocupando RAM para nada. Eso es lo que arregla\n" +
"--   un pooler: esas conexiones no deberían existir del lado del servidor.\n" +
"-- 12 active: el trabajo REAL que la base está haciendo. Doce.\n" +
"-- 8 idle in transaction, la más vieja de 2 horas: el asesino silencioso.\n" +
"--   Cada una congela el horizonte de VACUUM (fichas 05 y 06)."
      }},
      { p: "Ese contraste — 287 conexiones para hacer el trabajo de 12 — es exactamente el argumento del pooler, y no requiere ninguna teoría." },
      { p: "<b>Los tres modos de PgBouncer.</b> La elección no es de rendimiento, es de qué features de sesión estás dispuesto a perder:" },
      { code: { tag: "shell", caption: "pgbouncer.ini · el modo lo decide tu aplicación", text:
"[databases]\n" +
"appdb = host=10.0.0.5 dbname=appdb\n" +
"\n" +
"[pgbouncer]\n" +
"pool_mode = transaction        ; el que casi siempre quieres\n" +
"max_client_conn = 2000         ; clientes que PgBouncer acepta\n" +
"default_pool_size = 25         ; conexiones REALES a Postgres\n" +
"\n" +
"; session      una conexión real por cliente mientras esté conectado.\n" +
";              Casi no ahorra nada; solo sirve para reciclar.\n" +
"; transaction  la conexión se devuelve al pool en cada COMMIT.\n" +
";              El punto dulce. PIERDES: prepared statements de sesión,\n" +
";              advisory locks de sesión (ficha 08), LISTEN/NOTIFY,\n" +
";              temp tables, SET de sesión.\n" +
"; statement    se devuelve en cada statement. Prohíbe transacciones\n" +
";              multi-statement. Solo para cargas muy específicas."
      }},
      { p: "El detalle que muerde: en modo <code>transaction</code>, los <b>advisory locks de sesión</b> de la ficha 08 dejan de tener sentido, porque no controlas en qué conexión real caes. Hay que usar las variantes <code>_xact</code>. Lo mismo con <code>LISTEN/NOTIFY</code> — y por eso muchas colas caseras se rompen justo cuando se mete el pooler." }
    ],

    cuandoDuele: {
      sym: "Síntoma: el servicio escala a 500 conexiones y la base se cae más rápido que con 50",
      paras: [
        "Cada réplica de la app abre su pool de 20, hay 25 réplicas, y en el pico hay 500 conexiones directas. La base tiene CPU de sobra y aun así todo va lento: latencias parejas y altas en <em>todos</em> los queries, no en uno.",
        "No es un query lento: es <b>contención</b>. Cientos de procesos peleándose los mismos lightweight locks y quemando el CPU en context switching, más la memoria por backend que ya no deja RAM para caché. El arreglo no es subir <code>max_connections</code> — eso empeora todo. Es meter <b>PgBouncer en modo transaction</b> y bajar las conexiones reales a algo cercano al paralelismo útil de la máquina (una heurística vieja pero decente: <code>núcleos × 2 + husos de disco</code>). Y de paso, cazar los <code>idle in transaction</code>, que son un problema aparte y peor."
      ]
    },

    mito: {
      claim: "las conexiones son baratas, abre las que quieras",
      truth: "Falso: cada conexión es un <b>proceso del sistema operativo</b>. Cuesta un <code>fork</code> al abrirse, decenas de megas de RAM mientras viva —aunque esté <code>idle</code>— y, sobre todo, contención con todas las demás. A los cientos de conexiones directas el throughput <b>baja</b>; el que sobrevive es el que puso un pooler. Y Postgres 17 no trae uno en core: te toca a ti.",
      more: [
        { html: "<b>«Subo max_connections y ya.»</b> Al revés: <code>max_connections</code> alto es permiso para hacerte daño. Reserva estructuras al arrancar y no resuelve nada de la contención." },
        { html: "<b>«work_mem es por conexión.»</b> No: es <b>por operación</b> de sort o hash, por backend. Un solo query puede multiplicarlo varias veces, y la cuenta se sale de control rápido." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Connections and Authentication (19.3)", note: "max_connections, superuser_reserved_connections y el modelo de arranque del postmaster." },
      { kind: "Docs oficiales", title: "PgBouncer — pool modes", note: "Los tres modos y la lista exacta de qué features de sesión pierdes en cada uno. Léela antes de migrar." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 2: la arquitectura de procesos — postmaster, backends y los procesos de fondo." }
    ]
  };

})(window.GUIA = window.GUIA || {});
