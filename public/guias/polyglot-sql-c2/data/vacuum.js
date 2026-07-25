/* ============================================================================
   data/vacuum.js — Ficha 06 · VACUUM y autovacuum.
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.vacuum = {
    slug: "vacuum",

    queEs: [
      "El conserje que MVCC necesita por diseño. Recorre la tabla, decide qué versiones muertas ya no le sirven a ninguna transacción viva, y libera su espacio <em>dentro</em> de la tabla para reusarlo.",
      "De paso hace dos trabajos que no parecen suyos y son igual de importantes: mantiene el <b>visibility map</b> y <b>congela</b> tuples viejas para que los xid de 32 bits no den la vuelta."
    ],

    enBreve: [
      "<code>VACUUM</code> recupera espacio <b>para reusarlo dentro de la tabla</b>, no para el sistema operativo. El archivo casi nunca se encoge.",
      "Mantiene el <b>visibility map</b>: un bit por página que dice «aquí todo es visible para todos». Es lo que habilita el <code>Index Only Scan</code> y lo que deja que el siguiente vacuum se salte páginas enteras.",
      "<b>Congela</b> (freeze) tuples viejas marcándolas como visibles para siempre. Los xid son de <b>32 bits</b>: hay que congelar antes de dar la vuelta, y <code>autovacuum_freeze_max_age</code> (200 M por default) fuerza un vacuum aunque nadie lo pida.",
      "Autovacuum dispara por umbral: <code>autovacuum_vacuum_scale_factor</code> 0.2 (20% de la tabla) + <code>autovacuum_vacuum_threshold</code> 50 filas muertas. En tablas enormes ese 20% es demasiado tarde."
    ],

    fundamento: [
      { p: "MVCC produce basura como subproducto obligatorio (ficha 05): cada <code>UPDATE</code> y cada <code>DELETE</code> deja un tuple que ya nadie va a leer. Pero nadie puede borrarlo <em>en el momento</em>, porque una transacción con snapshot viejo todavía tiene derecho a verlo. Se necesita un proceso que llegue después, cuando ya se sabe que nadie lo necesita." },
      { p: "El criterio es un solo número: el <em>xmin horizon</em>, el xid más viejo que alguna transacción viva pueda necesitar. Todo lo muerto y anterior a esa frontera es basura removible; todo lo posterior es intocable. Por eso una sola transacción abierta desde hace horas paraliza la limpieza de toda la base: mueve la frontera hacia el pasado y nada nuevo califica." },
      { p: "El freeze es un problema distinto y más serio. Los xid son enteros de 32 bits: dan la vuelta cada ~4 mil millones de transacciones, y cuando eso pasa, comparar «este xid es más viejo que el mío» deja de tener sentido — filas vivas se volverían invisibles. Congelar significa marcar «esta tuple es visible para todos, ya no compares su xmin con nada». Es una operación de supervivencia, y si te descuidas el motor <em>se detiene</em> para forzarla." }
    ],

    comoFunciona: [
      { p: "<b>Cuánta basura tienes.</b> El primer lugar donde mirar, siempre:" },
      { code: { tag: "SQL", caption: "tuples muertas y último autovacuum", text:
"SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_autoanalyze\n" +
"  FROM pg_stat_user_tables WHERE relname = 'pedidos';\n" +
"\n" +
" relname | n_live_tup | n_dead_tup |        last_autovacuum        |       last_autoanalyze\n" +
"---------+------------+------------+-------------------------------+-------------------------------\n" +
" pedidos |    1000000 |     184203 | 2026-07-23 04:12:38.221+00    | 2026-07-23 04:12:41.884+00"
      }},
      { p: "<b>Qué reporta cuando corre.</b> El <code>VERBOSE</code> te dice exactamente qué encontró y qué no pudo tocar:" },
      { code: { tag: "SQL", caption: "VACUUM VERBOSE · leer las tres líneas que importan", text:
"VACUUM (VERBOSE) pedidos;\n" +
"\n" +
"INFO:  vacuuming \"app.public.pedidos\"\n" +
"INFO:  finished vacuuming \"app.public.pedidos\": index scans: 1\n" +
"pages: 0 removed, 12500 remain, 4812 scanned (38.50% of total)\n" +
"tuples: 184203 removed, 1000000 remain, 12 are dead but not yet removable\n" +
"removable cutoff: 8814, which was 3 XIDs old when operation ended\n" +
"new relfrozenxid: 8790, which is 2410 XIDs ahead of previous value\n" +
"\n" +
"-- \"0 removed, 12500 remain\": no devolvió NI UNA página al sistema operativo.\n" +
"-- \"4812 scanned (38.50%)\": el visibility map le dejó saltarse el 61.5% restante.\n" +
"-- \"12 are dead but not yet removable\": alguien tiene un snapshot viejo abierto."
      }},
      { p: "Esa tercera línea es tu alarma. Si «dead but not yet removable» crece, no tienes un problema de vacuum: tienes una transacción larga abierta (ficha 05)." },
      { p: "<b>El visibility map.</b> Un bit por página, y de ahí salen dos beneficios encadenados: el <code>Index Only Scan</code> puede confiar en el índice sin visitar el heap, y el vacuum siguiente se salta las páginas ya marcadas. Es la razón por la que un vacuum sobre una tabla mayormente estática es casi gratis." },
      { p: "<b>VACUUM vs VACUUM FULL.</b> Aquí está la diferencia que le cuesta caro a la gente:" },
      { code: { tag: "SQL", caption: "las dos son cosas distintas", text:
"VACUUM pedidos;\n" +
"--  Libera espacio DENTRO de la tabla para reusarlo.\n" +
"--  Lock: ShareUpdateExclusive. Los SELECT, INSERT y UPDATE siguen corriendo.\n" +
"--  El archivo en disco NO se encoge.\n" +
"\n" +
"VACUUM FULL pedidos;\n" +
"--  REESCRIBE la tabla entera en un archivo nuevo, compacto, y tira el viejo.\n" +
"--  Lock: ACCESS EXCLUSIVE. Bloquea TODO, incluidos los SELECT.\n" +
"--  Necesita espacio libre para una segunda copia completa.\n" +
"--  Esto sí le devuelve disco al sistema operativo."
      }},
      { p: "En producción, <code>VACUUM FULL</code> sobre una tabla grande es una ventana de mantenimiento, no un comando. La alternativa sin bloqueo larga es la extensión <code>pg_repack</code>." },
      { p: "<b>Afinarlo por tabla.</b> Los defaults son para una base promedio; una tabla caliente necesita otros:" },
      { code: { tag: "SQL", caption: "bajar el umbral en una tabla que se actualiza mucho", text:
"ALTER TABLE pedidos SET (\n" +
"  autovacuum_vacuum_scale_factor = 0.02,   -- 2% en vez de 20%\n" +
"  autovacuum_vacuum_cost_delay   = 0       -- que no se autolimite\n" +
");\n" +
"\n" +
"-- Ver qué tan cerca del wraparound anda cada tabla:\n" +
"SELECT relname, age(relfrozenxid) AS xids_desde_freeze\n" +
"  FROM pg_class WHERE relkind = 'r' ORDER BY age(relfrozenxid) DESC LIMIT 3;\n" +
"\n" +
"   relname   | xids_desde_freeze\n" +
"-------------+-------------------\n" +
" eventos     |         148920114\n" +
" pedidos     |           2410883"
      }}
    ],

    cuandoDuele: {
      sym: "Síntoma: «database is not accepting commands to avoid wraparound data loss»",
      paras: [
        "El peor mensaje que puede darte Postgres. La base se pone en modo solo-lectura y no acepta escrituras hasta que corras un vacuum de freeze. Producción caída, y la única salida es esperar a que el vacuum termine.",
        "Nunca llega de sorpresa: hay avisos en el log durante millones de transacciones antes. Llega cuando autovacuum estuvo <b>desactivado</b> en alguna tabla, cuando una transacción abierta desde hace días congeló la frontera, o cuando el vacuum se autolimita tanto (<code>autovacuum_vacuum_cost_delay</code>) que no alcanza el ritmo de escritura. La vigilancia es una sola query: <code>age(relfrozenxid)</code> acercándose a <code>autovacuum_freeze_max_age</code>."
      ]
    },

    mito: {
      claim: "VACUUM le devuelve disco al sistema operativo",
      truth: "Falso, y por eso la gente corre <code>VACUUM</code> esperando que el disco baje y se desespera. <code>VACUUM</code> marca el espacio como <b>reusable por la propia tabla</b>: el archivo mantiene su tamaño y las inserciones futuras rellenan los huecos. Para devolvérselo al SO necesitas <code>VACUUM FULL</code>, que reescribe la tabla completa y toma un <b>ACCESS EXCLUSIVE</b> que bloquea hasta los <code>SELECT</code>.",
      more: [
        { html: "<b>«Autovacuum me tiene cubierto.»</b> A medias: sus defaults son conservadores. En una tabla de millones de filas, esperar al 20% de tuples muertas es esperar demasiado — hay que bajarle el <code>scale_factor</code> por tabla." },
        { html: "<b>«VACUUM bloquea la tabla.»</b> No: <code>VACUUM</code> normal toma <code>ShareUpdateExclusive</code> y convive con lecturas y escrituras. La que bloquea todo es <code>VACUUM FULL</code>." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Routine Vacuuming (Chapter 25)", note: "«25.1»: recuperación de espacio, visibility map, freezing y el detalle del wraparound." },
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Autovacuum + storage parameters", note: "«25.1.6 The Autovacuum Daemon» y los parámetros por tabla de CREATE TABLE." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 6, «VACUUM Processing»: el algoritmo completo, incluido el visibility map." }
    ]
  };

})(window.GUIA = window.GUIA || {});
