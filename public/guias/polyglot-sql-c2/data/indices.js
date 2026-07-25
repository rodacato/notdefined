/* ============================================================================
   data/indices.js — Ficha 02 · Índices por dentro.
   Incluye la config del widget "B-tree por dentro" (motor: js/widget-btree.js).
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.indices = {
    slug: "indices",

    queEs: [
      "Un índice es una estructura de datos aparte, con su propia forma, que responde <em>ciertas</em> preguntas rápido. La forma decide qué preguntas: un B-tree sabe de orden, un GIN sabe de «contiene», un BRIN sabe de rangos físicos.",
      "Va antes del planner porque es el <em>inventario de vías</em> que el planner tiene disponible. Si la forma no responde tu pregunta, el índice no entra al concurso."
    ],

    enBreve: [
      "<b>B-tree</b> es el default y el único que sirve para orden: <code>=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>BETWEEN</code>, <code>ORDER BY</code> y prefijos <code>LIKE 'abc%'</code>. Para millones de filas su altura típica es de 3 a 4 niveles.",
      "<b>GIN</b> es un índice invertido: una entrada por <em>valor</em> apuntando a listas de tuples. Para muchos valores por fila — <code>jsonb</code>, full-text (<code>tsvector</code>), arrays. Siempre se consume vía bitmap.",
      "<b>GiST</b> es un árbol de cajas contenedoras: rangos, geometría, vecindad (<code>ORDER BY punto &lt;-&gt; punto</code>). <b>Hash</b> solo hace igualdad y es WAL-logged desde PG10. <b>SP-GiST</b> existe para particiones no balanceadas; queda nombrado.",
      "<b>BRIN</b> no indexa filas: guarda min/max por <em>rango de páginas</em>. Diminuto y baratísimo, pero solo sirve si el valor correlaciona con el orden físico de la tabla."
    ],

    fundamento: [
      { p: "Postgres no tiene «el índice»: tiene una interfaz de <em>access methods</em> enchufables (ficha 14). Cada método declara qué operadores puede responder mediante una <em>operator class</em>. Por eso el planner puede preguntar mecánicamente «¿alguno de los índices de esta tabla sabe contestar <code>meta @&gt; '{...}'</code>?» sin saber nada de jsonb." },
      { p: "Y por eso un índice que no matchea tu operador es invisible para el planner. No es que «no lo quiera usar»: es que su operator class no incluye ese operador. Un B-tree no sabe qué significa <code>@&gt;</code>, y un GIN no sabe qué significa <code>&lt;</code>." },
      { p: "El otro lado de la moneda: cada índice es una estructura más que hay que mantener en cada <code>INSERT</code>, <code>UPDATE</code> y <code>DELETE</code>, y que hay que escribir al WAL. Un índice es un préstamo — lecturas rápidas hoy, escrituras más lentas siempre." }
    ],

    comoFunciona: [
      { p: "<b>B-tree.</b> Árbol balanceado, ancho y bajo: cada página interna guarda cientos de separadores, así que con 3 o 4 niveles cubres millones de filas. Las hojas están encadenadas entre sí, y de ahí sale gratis el escaneo de rangos y el <code>ORDER BY</code> sin sort. Descender el árbol es el widget de arriba." },
      { p: "<b>GIN.</b> Para cada valor extraído de la fila (cada clave de un jsonb, cada lema de un tsvector) guarda una lista ordenada de punteros. Buscar es intersectar listas — y como el resultado es un montón de punteros desordenados, GIN <em>siempre</em> se sirve vía <code>Bitmap Index Scan</code>:" },
      { code: { tag: "SQL", caption: "GIN sobre jsonb · siempre por bitmap", text:
"CREATE INDEX pedidos_meta_gin ON pedidos USING gin (meta jsonb_path_ops);\n" +
"\n" +
"EXPLAIN SELECT * FROM pedidos WHERE meta @> '{\"canal\":\"app\"}';\n" +
"                                     QUERY PLAN\n" +
"---------------------------------------------------------------------------------\n" +
" Bitmap Heap Scan on pedidos  (cost=32.04..3218.44 rows=982 width=132)\n" +
"   Recheck Cond: (meta @> '{\"canal\": \"app\"}'::jsonb)\n" +
"   ->  Bitmap Index Scan on pedidos_meta_gin  (cost=0.00..31.79 rows=982 width=0)\n" +
"         Index Cond: (meta @> '{\"canal\": \"app\"}'::jsonb)"
      }},
      { p: "<b>BRIN.</b> El truco es que no indexa filas sino bloques: para cada rango de 128 páginas guarda el mínimo y el máximo. Consultar es descartar rangos enteros. Es una apuesta a la correlación física — y cuando la apuesta sale, el ahorro de tamaño es absurdo:" },
      { code: { tag: "SQL", caption: "BRIN vs B-tree sobre la misma columna", text:
"SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid))\n" +
"  FROM pg_stat_user_indexes WHERE relname = 'eventos';\n" +
"     indexrelname      | pg_size_pretty\n" +
"-----------------------+----------------\n" +
" eventos_creado_btree  | 214 MB\n" +
" eventos_creado_brin   | 32 kB\n" +
"\n" +
"EXPLAIN SELECT * FROM eventos WHERE creado_en >= '2026-07-01';\n" +
"                                      QUERY PLAN\n" +
"---------------------------------------------------------------------------------\n" +
" Bitmap Heap Scan on eventos  (cost=52.11..18422.30 rows=98204 width=64)\n" +
"   Recheck Cond: (creado_en >= '2026-07-01'::date)\n" +
"   Rows Removed by Index Recheck: 4180\n" +
"   ->  Bitmap Index Scan on eventos_creado_brin  (cost=0.00..40.55 rows=102400 width=0)\n" +
"         Index Cond: (creado_en >= '2026-07-01'::date)"
      }},
      { p: "Ese <code>Rows Removed by Index Recheck</code> es la firma de BRIN: el índice te dice «en estas páginas <em>puede</em> haber algo», y el heap descarta lo que sobra. Es aproximado por diseño." },
      { p: "<b>Qué puede ELEGIR el planner de cada uno.</b> B-tree: <code>Index Scan</code>, <code>Index Only Scan</code> o <code>Bitmap</code>, y puede aprovecharlo para ordenar. GIN y BRIN: solo <code>Bitmap</code>. GiST: <code>Index Scan</code> (incluido el orden por distancia). Hash: <code>Index Scan</code> por igualdad, y nada más. Ese menú es literalmente lo que el planner cotiza en la ficha 03." }
    ],

    widget: {
      kind: "btree",
      seccion: "Widget · B-tree por dentro: descender el árbol",
      titulo: "Buscar id = 148,203 en 1,000,000 de filas",
      buscar: "148,203",
      niveles: [
        { label: "Root · nivel 0 · 1 página",
          nodos: ["1 – 250,000", "250,001 – 500,000", "500,001 – 750,000", "750,001 – 1,000,000"] },
        { label: "Internal · nivel 1 · 1 página",
          nodos: ["1 – 62,500", "62,501 – 125,000", "125,001 – 187,500", "187,501 – 250,000"] },
        { label: "Leaf · nivel 2 · 1 página",
          nodos: ["125,001 – 140,000", "140,001 – 155,000", "155,001 – 170,000", "170,001 – 187,500"] }
      ],
      pasos: [
        { nivel: 0, nodo: 0, paginas: 1,
          narr: "Entras por el <b>root</b>: una sola página. Comparas 148,203 contra los separadores y cae en el primer rango." },
        { nivel: 1, nodo: 2, paginas: 2,
          narr: "Bajas un nivel. Segunda página leída: 148,203 cae en <b>125,001 – 187,500</b>." },
        { nivel: 2, nodo: 1, paginas: 3,
          narr: "Bajas a la <b>hoja</b>. Tercera página: aquí sí viven las claves reales, cada una con su puntero al heap." },
        { nivel: "clave", paginas: 3,
          narr: "Encontrada. La entrada 148,203 no trae la fila: trae un <b>ctid</b> — <code>(12058,7)</code>, o sea página 12,058, item 7." },
        { nivel: "heap", paginas: 4,
          narr: "Un salto más, al heap, y tienes la fila. Total: <b>3 páginas de índice + 1 de tabla</b> para encontrar 1 fila entre un millón. El árbol es ancho y bajo — por eso son poquitos saltos." }
      ]
    },

    cuandoDuele: {
      sym: "Síntoma: la tabla escribe cada vez más lento y nadie sabe por qué",
      paras: [
        "Una tabla caliente que acumuló ocho índices a lo largo de dos años, de los cuales tres nadie consulta. Cada <code>INSERT</code> mantiene los ocho y los escribe al WAL; cada <code>UPDATE</code> que toca una columna indexada obliga a una versión nueva en cada índice (adiós a los updates HOT — ficha 10).",
        "La cuenta se paga en latencia de escritura, en bloat y en tiempo de <code>VACUUM</code>. <code>pg_stat_user_indexes.idx_scan</code> te dice cuáles nunca se usaron: <b>un índice no usado no es neutral, solo pesa</b>."
      ]
    },

    mito: {
      claim: "un índice siempre acelera",
      truth: "Falso, por tres lados a la vez. <b>Uno:</b> cuesta escritura — cada índice se mantiene y se WAL-loguea en cada cambio. <b>Dos:</b> el planner puede ignorarlo con toda la razón, porque para muchas filas el seq scan es más barato (ficha 03). <b>Tres:</b> si su forma no responde tu operador, ni entra al concurso. Un índice que nadie consulta solo ocupa disco y frena tus escrituras.",
      more: [
        { html: "<b>«Creo un índice por columna y ya.»</b> No: un índice compuesto <code>(a, b)</code> sirve para <code>a</code> y para <code>a, b</code>, pero no para <code>b</code> sola. La regla del prefijo izquierdo." },
        { html: "<b>«El índice guarda la fila.»</b> Solo guarda la clave y un <code>ctid</code>. Por eso existe el <code>Index Only Scan</code> como caso <em>especial</em>: cuando de casualidad el índice ya trae todo lo que pediste." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Indexes (Chapter 11) + Index Types", note: "«11.2 Index Types» para el menú, y «Chapter 64» para la interfaz de access methods." },
      { kind: "Libro / Web", title: "Use The Index, Luke! — Markus Winand", note: "La mejor explicación de por dentro del B-tree y de por qué el orden de columnas importa." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 1 y 5: estructura de página de índice y cómo se recorre un B-tree, con diagramas." }
    ]
  };

})(window.GUIA = window.GUIA || {});
