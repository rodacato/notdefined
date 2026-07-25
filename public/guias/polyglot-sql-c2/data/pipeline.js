/* ============================================================================
   data/pipeline.js — Ficha 01 · El pipeline de ejecución.
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.pipeline = {
    slug: "pipeline",

    queEs: [
      "Un query no «se ejecuta». Cruza cinco etapas antes de tocar un solo byte de tus datos: <em>parse → analyze → rewrite → plan → execute</em>. Cada etapa recibe una estructura y produce otra distinta.",
      "Saber qué produce cada una es lo que te deja leer un error, un <code>EXPLAIN</code> o un tiempo de planeación raro sin andar adivinando."
    ],

    enBreve: [
      "Cinco etapas y tres estructuras intermedias: <code>parse tree</code> (sintaxis), <code>query tree</code> (semántica ya resuelta contra el catálogo) y <code>plan tree</code> (la receta de ejecución).",
      "El parser solo valida <b>sintaxis</b>. No tiene idea de si <code>pedidoss</code> existe: ese error lo lanza <code>analyze</code>, que resuelve nombres contra el catálogo del sistema.",
      "En <code>rewrite</code> se expanden las VIEWS y se aplican las <em>rules</em>. Una view no es una tabla: aquí se sustituye por su definición y desaparece del plan.",
      "Ojo de nombres: la etapa <code>analyze</code> es el <b>análisis semántico</b>. NO es el comando <code>ANALYZE</code> que recolecta estadísticas (ficha 04). Misma palabra, dos cosas distintas."
    ],

    fundamento: [
      { p: "El motor no puede costear lo que no entiende. Antes de que el planner pueda estimar si conviene un índice, alguien tiene que haber resuelto <em>qué tabla es <code>pedidos</code></em>, <em>qué tipo tiene <code>estado</code></em> y <em>qué operador es ese <code>=</code></em>. Esa resolución es el trabajo de las primeras dos etapas, y produce el <code>query tree</code>: tu query, pero con todo apuntando a OIDs del catálogo en vez de a nombres." },
      { p: "La etapa <code>rewrite</code> existe para que el planner no tenga que saber de views ni de reglas. Cuando llega al planner, una view ya se disolvió en su definición — por eso en el <code>EXPLAIN</code> nunca ves el nombre de tu view, ves las tablas de abajo. Es separación de responsabilidades pura: cada capa recibe algo más simple que la anterior." },
      { p: "Al final el <code>plan tree</code> es un árbol de nodos ejecutables y el executor lo recorre jalando tuplas de arriba hacia abajo (modelo <em>pull</em>, estilo Volcano): cada nodo le pide la siguiente fila a su hijo. Por eso un <code>LIMIT</code> puede cortar el trabajo a medias — el nodo de arriba simplemente deja de pedir." }
    ],

    comoFunciona: [
      { p: "<b>1 · parse.</b> Puro análisis léxico y gramatical. Produce el <code>parse tree</code>. Aquí se cachan los dedazos de sintaxis, y nada más:" },
      { code: { tag: "SQL", caption: "las dos etapas fallan distinto", text:
"-- Etapa 1 (parse): falla la SINTAXIS\n" +
"SELECT * FORM pedidos;\n" +
"ERROR:  syntax error at or near \"FORM\"\n" +
"LINE 1: SELECT * FORM pedidos;\n" +
"                 ^\n" +
"\n" +
"-- Etapa 2 (analyze): la sintaxis está bien; falla la SEMÁNTICA\n" +
"SELECT * FROM pedidoss;\n" +
"ERROR:  relation \"pedidoss\" does not exist\n" +
"LINE 1: SELECT * FROM pedidoss;\n" +
"                      ^"
      }},
      { p: "<b>2 · analyze (semántico).</b> Recorre el parse tree y lo resuelve contra el catálogo: tablas → OIDs, columnas → números de atributo, operadores → funciones concretas. Sale el <code>query tree</code>, con su <em>range table</em> (de dónde se lee), su <em>target list</em> (qué se devuelve) y sus <em>quals</em> (las condiciones)." },
      { p: "<b>3 · rewrite.</b> Aplica el sistema de reglas. En la práctica: expande views. Fíjate cómo la view desaparece del plan y su filtro se fusiona con el tuyo:" },
      { code: { tag: "SQL", caption: "la view se disuelve en rewrite", text:
"CREATE VIEW pedidos_mx AS\n" +
"  SELECT * FROM pedidos WHERE pais = 'MX';\n" +
"\n" +
"EXPLAIN SELECT count(*) FROM pedidos_mx WHERE total > 500;\n" +
"                                QUERY PLAN\n" +
"-----------------------------------------------------------------------\n" +
" Aggregate  (cost=24810.00..24810.01 rows=1 width=8)\n" +
"   ->  Seq Scan on pedidos  (cost=0.00..24805.00 rows=2431 width=0)\n" +
"         Filter: ((total > 500) AND (pais = 'MX'::text))"
      }},
      { p: "No hay ni rastro de <code>pedidos_mx</code>: el planner nunca supo que existía." },
      { p: "<b>4 · plan.</b> El planner/optimizer convierte el query tree en <code>plan tree</code>, eligiendo scans y joins por costo. Es la ficha 03 completa." },
      { p: "<b>5 · execute.</b> El executor recorre el plan tree jalando tuplas. En <code>EXPLAIN ANALYZE</code> ves las dos mitades del pipeline separadas: <code>Planning Time</code> (etapas 1-4) y <code>Execution Time</code> (etapa 5)." },
      { p: "Si el mismo query se repite, puedes saltarte las primeras cuatro etapas con un prepared statement — el plan se guarda y se reusa:" },
      { code: { tag: "SQL", caption: "PREPARE se salta las etapas 1-4", text:
"PREPARE p AS SELECT * FROM pedidos WHERE estado = $1;\n" +
"EXPLAIN EXECUTE p('enviado');\n" +
"                                     QUERY PLAN\n" +
"-----------------------------------------------------------------------------------\n" +
" Index Scan using pedidos_estado_idx on pedidos  (cost=0.42..44.19 rows=11 width=96)\n" +
"   Index Cond: (estado = 'enviado'::text)\n" +
"\n" +
"-- Tras 5 ejecuciones Postgres considera un GENERIC PLAN (uno solo para\n" +
"-- cualquier $1). Lo controlas con plan_cache_mode."
      }}
    ],

    cuandoDuele: {
      sym: "Síntoma: Planning Time más grande que Execution Time",
      paras: [
        "Un query trivial que reporta <code>Planning Time: 18.442 ms</code> y <code>Execution Time: 0.311 ms</code>. Estás pagando 60 veces más por <em>decidir</em> que por <em>hacer</em>.",
        "Casi siempre son views anidadas sobre views, muchos joins (el espacio de planes crece factorialmente) o una tabla particionada con cientos de particiones que hay que considerar. Las salidas: prepared statements para amortizar la planeación, aplanar las views, o subir <code>from_collapse_limit</code>/<code>join_collapse_limit</code> si el problema es el número de joins."
      ]
    },

    mito: {
      claim: "el SQL se ejecuta tal como lo escribiste",
      truth: "Falso. Tu texto es una <b>petición declarativa</b>, no un programa. Antes de ejecutarse se reescribe (views, reglas) y se planea (el orden de joins que elijas en el <code>FROM</code> le da bastante igual). El motor se compromete con el <em>resultado</em> que pediste, nunca con el <em>camino</em>.",
      more: [
        { html: "<b>«La etapa analyze recolecta estadísticas.»</b> No. La etapa <code>analyze</code> es el análisis semántico del pipeline. El comando <code>ANALYZE</code> que llena <code>pg_stats</code> es otra cosa — ficha 04." },
        { html: "<b>«Mi view está precalculada.»</b> No: una view es texto que se expande en <code>rewrite</code>. La que sí guarda resultados es una <code>MATERIALIZED VIEW</code>." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Overview of PostgreSQL Internals", note: "«Chapter 52»: las cinco etapas contadas por los que las escribieron. Corto y directo." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 3, «Query Processing»: el pipeline con las estructuras dibujadas etapa por etapa." },
      { kind: "Docs oficiales", title: "PostgreSQL 17 — The Rule System / PREPARE", note: "«Chapter 41» para cómo se expanden views y reglas; la página de PREPARE para planes genéricos vs. custom." }
    ]
  };

})(window.GUIA = window.GUIA || {});
