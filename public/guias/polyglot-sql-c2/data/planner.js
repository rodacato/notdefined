/* ============================================================================
   data/planner.js — Ficha 03 · ★ El query planner (LA JOYA).
   Todo el guión de la ficha vive aquí: textos, snippets, salidas de EXPLAIN
   (reales/plausibles de PostgreSQL 17) y la config del widget.
   La mecánica del widget (modelo de costo, render) vive en js/widget-explain.js.
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.planner = {
    slug: "planner",

    // "qué es" — 2 líneas
    queEs: [
      "El planner es la pieza que decide <em>cómo</em> se ejecuta tu query. No corre el SQL tal como lo escribiste: enumera planes posibles, le estima un costo a cada uno y ejecuta el más barato.",
      "Es <em>cost-based</em>, no basado en reglas: la vía «obvia» pierde seguido contra una que el modelo de costo calcula más barata."
    ],

    // "en breve" — 4 datos duros, verificables contra PG17
    enBreve: [
      "Cost-based: estima un costo abstracto por plan y ejecuta el más barato. La unidad es relativa a <code>seq_page_cost = 1.0</code> — no son milisegundos.",
      "<code>EXPLAIN</code> <b>estima</b>; <code>EXPLAIN ANALYZE</code> <b>ejecuta y mide</b> de verdad: compara <code>cost=</code> contra <code>actual time=</code>, y <code>rows</code> estimadas contra reales.",
      "Arriba de cierto costo reparte el escaneo en workers: el plan muestra <code>Workers Planned: N</code>. El techo por gather es <code>max_parallel_workers_per_gather</code> = 2 por defecto.",
      "Desde PG12 los CTE (<code>WITH</code>) no recursivos se <b>inlinean</b> por defecto; <code>MATERIALIZED</code> restaura la vieja barrera de optimización."
    ],

    // "fundamento" — por qué el motor lo hace así
    fundamento: [
      { p: "El motor no puede probar todos los planes ni conocer el dato exacto que va a tocar antes de ejecutarlo. Así que <em>apuesta</em>: con las estadísticas de la tabla (ficha 04) estima cuántas filas devolverá cada operación — la <b>selectividad</b> — y de ahí saca un costo abstracto para cada plan candidato." },
      { p: "El costo mezcla lecturas de página (secuenciales baratas vs. aleatorias caras) y trabajo de CPU por fila. Por eso una misma query puede tener tres planes ganadores distintos según cuántas filas haga match: leer poquito por índice, armar un bitmap, o barrer la tabla entera. El planner no es terco con «usa el índice»; usa el que su modelo cotiza más barato." },
      { p: "Ese modelo es lo único que el planner tiene. Si las estadísticas están viejas, elige mal — no porque sea tonto, sino porque está <em>mal informado</em>. Ahí es donde entra la ficha 04." }
    ],

    // "cómo funciona" — la mecánica, con SQL/EXPLAIN mínimo como ejemplo
    comoFunciona: [
      { p: "<b>Scan types.</b> Cómo lee una tabla: <b>Seq Scan</b> (barre todo, barato por página pero muchas páginas), <b>Index Scan</b> (baja por el índice y salta al heap fila por fila — random I/O), <b>Index Only Scan</b> (si el índice ya trae las columnas pedidas, ni toca el heap) y <b>Bitmap Heap Scan</b> (arma un mapa de qué páginas tocar y las lee en orden físico — el punto medio)." },
      { p: "Para pocas filas, el índice gana; para casi toda la tabla, el seq scan gana. Se ve en el costo estimado:" },
      { code: {
        caption: "EXPLAIN · pocas filas → index scan",
        text:
"EXPLAIN SELECT * FROM pedidos WHERE estado = 'reembolsado';\n" +
"                                     QUERY PLAN\n" +
"------------------------------------------------------------------------------------\n" +
" Index Scan using pedidos_estado_idx on pedidos  (cost=0.42..44.19 rows=11 width=96)\n" +
"   Index Cond: (estado = 'reembolsado'::text)"
      }},
      { p: "<b>EXPLAIN vs EXPLAIN ANALYZE.</b> <code>EXPLAIN</code> solo estima; <code>ANALYZE</code> ejecuta el query y te da los números reales. Ojo con la brecha entre <code>rows=</code> (estimado) y <code>rows=</code> (real): si difieren por órdenes de magnitud, tus stats mienten." },
      { code: {
        caption: "EXPLAIN ANALYZE · valor común → seq scan (y mide de verdad)",
        text:
"EXPLAIN ANALYZE SELECT * FROM pedidos WHERE estado = 'pagado';\n" +
"                                              QUERY PLAN\n" +
"------------------------------------------------------------------------------------\n" +
" Seq Scan on pedidos  (cost=0.00..22310.00 rows=498472 width=96)\n" +
"              (actual time=0.011..138.902 rows=498210 loops=1)\n" +
"   Filter: (estado = 'pagado'::text)\n" +
"   Rows Removed by Filter: 501790\n" +
" Planning Time: 0.088 ms\n" +
" Execution Time: 165.331 ms"
      }},
      { p: "<b>Join strategies.</b> Al unir tablas elige entre <b>Nested Loop</b> (bueno cuando el lado externo es chico y el interno tiene índice), <b>Hash Join</b> (arma una tabla hash del lado chico y sondea — el default para joins grandes por igualdad) y <b>Merge Join</b> (si ambas entradas ya vienen ordenadas por la clave de join)." },
      { code: {
        caption: "EXPLAIN · el planner elige Hash Join",
        text:
"EXPLAIN SELECT c.nombre, p.total\n" +
"  FROM clientes c JOIN pedidos p ON p.cliente_id = c.id\n" +
"  WHERE c.pais = 'MX';\n" +
"                                    QUERY PLAN\n" +
"------------------------------------------------------------------------------------\n" +
" Hash Join  (cost=1834.00..29984.55 rows=48210 width=42)\n" +
"   Hash Cond: (p.cliente_id = c.id)\n" +
"   ->  Seq Scan on pedidos p  (cost=0.00..22310.00 rows=1000000 width=12)\n" +
"   ->  Hash  (cost=1421.00..1421.00 rows=33040 width=38)\n" +
"         ->  Seq Scan on clientes c  (cost=0.00..1421.00 rows=33040 width=38)\n" +
"               Filter: (pais = 'MX'::text)"
      }},
      { p: "<b>Parallel query.</b> Para escaneos y joins grandes el planner puede repartir el trabajo en <em>worker processes</em>: <code>Parallel Seq Scan</code>, <code>Parallel Hash Join</code>, y un nodo <code>Gather</code> que junta los resultados. Es una decisión de costo más — por eso el plan muestra <code>Workers Planned: N</code>: calculó que paralelizar sale a cuenta. Lo gobiernan <code>max_parallel_workers_per_gather</code> y los umbrales de costo. (Es paralelismo de un nodo; la replicación multi-nodo está fuera de alcance — ver colofón.)" },
      { code: {
        caption: "EXPLAIN · el planner paraleliza (Workers Planned: 2)",
        text:
"EXPLAIN SELECT count(*) FROM pedidos WHERE total > 500;\n" +
"                                        QUERY PLAN\n" +
"------------------------------------------------------------------------------------\n" +
" Finalize Aggregate  (cost=13478.55..13478.56 rows=1 width=8)\n" +
"   ->  Gather  (cost=13478.33..13478.54 rows=2 width=8)\n" +
"         Workers Planned: 2\n" +
"         ->  Partial Aggregate  (cost=12478.33..12478.34 rows=1 width=8)\n" +
"               ->  Parallel Seq Scan on pedidos  (cost=0.00..11436.67 rows=416667 width=0)\n" +
"                     Filter: (total > 500)"
      }},
      { p: "<b>Partition pruning.</b> Si la tabla está particionada, el planner descarta en tiempo de plan las particiones que la condición no puede tocar — nunca las escanea. <b>JIT:</b> arriba de cierto costo el executor compila las expresiones con LLVM en vez de interpretarlas; por eso el plan a veces trae una sección <code>JIT:</code>. Lo ves, ya sabes qué es." }
    ],

    // "cuándo duele" — el síntoma real en producción
    cuandoDuele: {
      sym: "Síntoma: «tengo el índice, ¿por qué no lo usa?»",
      paras: [
        "El planner ignora tu índice y hace un seq scan que tarda segundos. Tu primer instinto es que el planner es tonto. Casi nunca lo es.",
        "Casi siempre son <b>stats viejas</b>: el planner cree que tu <code>WHERE</code> hace match con medio millón de filas cuando en realidad son doce, así que cotiza el seq scan más barato. Un <code>ANALYZE</code> a la tabla suele arreglarlo. La otra causa: tu condición no es <em>sargable</em> (una función sobre la columna, un tipo que no cuadra) y el índice literalmente no aplica."
      ]
    },

    // "mito a desmontar"
    mito: {
      claim: "un index scan siempre gana al seq scan",
      truth: "Falso. Para la mayoría de la tabla, el seq scan gana — leer páginas en orden secuencial es barato; brincar por el índice fila por fila es random I/O carísimo. <b>El planner lo calcula</b>, y por eso cambia de vía según cuántas filas haga match. Míralo tú mismo en el widget de arriba.",
      more: [
        { html: "<b>«Un CTE (WITH) siempre materializa / es una barrera de optimización.»</b> Era verdad hasta PG11. Desde PG12 el planner inlinea los CTE no recursivos salvo que pidas <code>MATERIALIZED</code>." },
        { html: "<b>«EXPLAIN me dice cuánto tardó.»</b> No: <code>EXPLAIN</code> estima. El que ejecuta y mide es <code>EXPLAIN ANALYZE</code>." }
      ]
    },

    // "recursos" — 3 de primera
    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Using EXPLAIN & Planner/Optimizer", note: "«14.1. Using EXPLAIN» y «Chapter 71. Planner/Optimizer». La fuente de verdad de los números." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 3, «Query Processing»: cómo se estima el costo y se elige el plan, con diagramas." },
      { kind: "Libro / Web", title: "Use The Index, Luke! — Markus Winand", note: "Cuándo el planner usa (o ignora) un índice, y por qué. Legendario y gratis en línea." }
    ],

    // -------- Config del widget (LA JOYA). El motor está en widget-explain.js.
    widget: {
      kind: "explain",
      seccion: "La joya · ver al despachador cambiar de riel",
      titulo: "EXPLAIN visual · el despachador cambia de riel",
      // La MISMA query sobre la MISMA tabla; el slider mueve la selectividad.
      querySQL: "SELECT * FROM pedidos WHERE estado = $1;",
      tabla: {
        nombre: "pedidos",
        reltuples: 1000000,   // filas
        relpages: 12500,      // páginas de 8KB (≈80 filas/página, width 96)
        rowsPerPage: 80,
        width: 96,
        indice: "pedidos_estado_idx"  // btree sobre (estado)
      },
      // Constantes de costo por defecto de PostgreSQL 17.
      costos: {
        seq_page_cost: 1.0,
        random_page_cost: 4.0,
        cpu_tuple_cost: 0.01,
        cpu_index_tuple_cost: 0.005,
        cpu_operator_cost: 0.0025,
        bitmap_build_overhead: 25  // costo fijo de armar/ordenar el bitmap
      },
      // Narración por vía ganadora ({rows} y {pct} se interpolan en vivo).
      narr: {
        idx:    "Con <b>{filas}</b> de match ({pct} de la tabla), el planner elige <b>Index Scan</b>: baja por el árbol y salta a las poquitas páginas que necesita. Barrer la tabla entera sería tirar el trabajo.",
        bitmap: "Banda media ({pct}): gana <b>Bitmap Heap Scan</b>. Primero arma un mapa de bits de qué páginas tocar, luego las lee en orden físico. Ni salto random por fila ni tabla completa.",
        seq:    "Con {pct} de la tabla haciendo match, el <b>Seq Scan</b> gana: si vas a tocar casi todas las páginas, leerlas en secuencia es más barato que brincar por el índice. <b>El planner lo sabe.</b>"
      }
    }
  };

})(window.GUIA = window.GUIA || {});
