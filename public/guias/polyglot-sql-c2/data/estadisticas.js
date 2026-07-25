/* ============================================================================
   data/estadisticas.js — Ficha 04 · Estadísticas (pg_stats).
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.estadisticas = {
    slug: "estadisticas",

    queEs: [
      "Las estadísticas son la única cosa que el planner sabe de tus datos: cuántos valores distintos hay, cuáles son los más comunes y cómo se reparte el resto. Las recolecta el comando <code>ANALYZE</code> por muestreo.",
      "De ahí sale la <b>selectividad</b>: cuántas filas <em>cree</em> el planner que va a tocar. Todo el modelo de costo de la ficha 03 se apoya en ese número."
    ],

    enBreve: [
      "<code>ANALYZE</code> <b>muestrea</b>, no lee todo: toma 300 × <code>default_statistics_target</code> filas (por default 100 → 30,000 filas) y guarda el resultado en <code>pg_statistic</code>. Lo lees por la vista <code>pg_stats</code>.",
      "Tres piezas hacen el trabajo: <code>n_distinct</code>, los valores más comunes con su frecuencia (<code>most_common_vals</code> / <code>most_common_freqs</code>) y un <code>histogram_bounds</code> para todo lo demás.",
      "Puedes subir la resolución por columna: <code>ALTER TABLE t ALTER COLUMN c SET STATISTICS 500</code>. Más buckets, mejor estimación, <code>ANALYZE</code> más lento.",
      "Para columnas correlacionadas el planner multiplica selectividades y se equivoca por mucho. <code>CREATE STATISTICS</code> (con <code>ndistinct</code>, <code>dependencies</code>, <code>mcv</code>) le enseña la correlación."
    ],

    fundamento: [
      { p: "El planner tiene que estimar el tamaño de cada resultado intermedio <em>antes</em> de ejecutar nada. Si sabe que <code>estado = 'reembolsado'</code> devuelve 11 filas de un millón, cotiza un index scan; si cree que devuelve medio millón, cotiza un seq scan. Toda la decisión cuelga de una fracción." },
      { p: "Para valores comunes usa la lista de MCV, que es exacta: «<code>pagado</code> aparece en el 49.8% de las filas». Para lo que no está en la lista, interpola sobre el histograma. Por eso las estimaciones de valores raros son buenas y las de distribuciones raras son malas." },
      { p: "Y como es muestreo, es una foto. Cargas dos millones de filas nuevas y la foto se vuelve mentira: el planner sigue creyendo la distribución de ayer. Autovacuum dispara <code>ANALYZE</code> por umbral de filas modificadas, pero un bulk load seguido de queries inmediatos le gana la carrera." }
    ],

    comoFunciona: [
      { p: "<b>Qué guarda.</b> Asómate directo a la vista. Aquí está por qué la ficha 03 estima 11 filas para un valor y medio millón para otro:" },
      { code: { tag: "SQL", caption: "pg_stats: los valores más comunes y su frecuencia", text:
"SELECT attname, n_distinct, most_common_vals, most_common_freqs\n" +
"  FROM pg_stats\n" +
" WHERE tablename = 'pedidos' AND attname = 'estado';\n" +
"\n" +
" attname | n_distinct |                 most_common_vals                 |             most_common_freqs\n" +
"---------+------------+-------------------------------------------------+---------------------------------------------\n" +
" estado  |          5 | {pagado,enviado,pendiente,cancelado,reembolsado} | {0.4982,0.3011,0.1504,0.0492,0.0011}\n" +
"\n" +
"-- 0.0011 × 1,000,000 = 1,100 filas para 'reembolsado'.\n" +
"-- 0.4982 × 1,000,000 = 498,200 para 'pagado'. Misma query, otro plan."
      }},
      { p: "<b>El histograma.</b> Para columnas continuas no hay MCV que sirva: guarda fronteras de buckets de frecuencia equivalente. Estimar <code>total > 500</code> es contar buckets:" },
      { code: { tag: "SQL", caption: "histogram_bounds sobre una columna numérica", text:
"SELECT histogram_bounds\n" +
"  FROM pg_stats WHERE tablename = 'pedidos' AND attname = 'total';\n" +
"\n" +
" {12.00,48.50,97.25,152.00,218.75,299.00,401.50,528.00,712.25,1043.00,9820.50}\n" +
"\n" +
"-- 10 buckets, 10% de las filas cada uno. 'total > 500' cae dentro del\n" +
"-- bucket 7 (401.50–528.00): el planner interpola linealmente ahí."
      }},
      { p: "<b>Estadísticas extendidas.</b> El caso clásico: <code>WHERE ciudad = 'Monterrey' AND estado_mx = 'Nuevo León'</code>. El planner asume independencia y multiplica las dos selectividades, así que estima ~200 filas donde hay 40,000 — porque toda Monterrey <em>está</em> en Nuevo León. Se lo tienes que decir:" },
      { code: { tag: "SQL", caption: "CREATE STATISTICS para columnas correlacionadas", text:
"CREATE STATISTICS pedidos_geo (dependencies, ndistinct)\n" +
"  ON ciudad, estado_mx FROM pedidos;\n" +
"ANALYZE pedidos;\n" +
"\n" +
"-- Antes:  Seq Scan ... rows=204     (actual rows=40118)   ← 196x abajo\n" +
"-- Después: Seq Scan ... rows=39640  (actual rows=40118)   ← ya casi"
      }},
      { p: "<b>Cómo se lee el diagnóstico.</b> <code>EXPLAIN ANALYZE</code> te pone las dos cifras lado a lado: <code>rows=</code> estimadas contra <code>actual rows=</code>. Una brecha de un orden de magnitud o más, en el nodo más profundo donde aparezca, es tu culpable. No mires el nodo de arriba: el error se propaga hacia arriba desde abajo." },
      { p: "<b>Cuándo corre solo.</b> Autovacuum lanza <code>ANALYZE</code> cuando las filas modificadas pasan <code>autovacuum_analyze_scale_factor</code> (0.1 por default, o sea 10% de la tabla) más <code>autovacuum_analyze_threshold</code>. En tablas enormes ese 10% es muchísimas filas — de ahí que valga bajarlo por tabla." }
    ],

    cuandoDuele: {
      sym: "Síntoma: «tengo el índice, ¿por qué no lo usa?» — justo después de un deploy",
      paras: [
        "Migras, cargas datos, y el query que ayer volaba ahora tarda ocho segundos con un seq scan. El índice está ahí, intacto. Nada cambió en el código.",
        "Cambió la <b>foto</b>: la tabla creció o se redistribuyó y las estadísticas son de antes. El planner está estimando con datos viejos y su decisión es correcta <em>para el mundo que cree que existe</em>. Un <code>ANALYZE tabla</code> lo suele arreglar en un segundo — y por eso todo pipeline de carga masiva debe terminar con un <code>ANALYZE</code>, no con un rezo."
      ]
    },

    mito: {
      claim: "el planner es tonto",
      truth: "Falso, y es el mito más caro de todos porque te lleva a pelearte con la herramienta equivocada. El planner casi siempre está <b>mal informado</b>, no mal diseñado: dale estadísticas frescas y elige bien. Antes de meter un <code>/*+ hint */</code> — que además Postgres no trae en core — corre <code>ANALYZE</code> y compara <code>rows=</code> estimadas contra reales.",
      more: [
        { html: "<b>«ANALYZE lee toda la tabla.»</b> No: muestrea 300 × <code>default_statistics_target</code> filas. Es rápido y es aproximado, a propósito." },
        { html: "<b>«VACUUM ANALYZE es lo mismo que VACUUM.»</b> No: son dos trabajos pegados. <code>VACUUM</code> limpia tuples muertas (ficha 06), <code>ANALYZE</code> recolecta estadísticas. Puedes necesitar uno sin el otro." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Statistics Used by the Planner", note: "«14.2» y «Chapter 76: How the Planner Uses Statistics». Ahí están las fórmulas de selectividad." },
      { kind: "Docs oficiales", title: "PostgreSQL 17 — CREATE STATISTICS", note: "Los tres tipos (ndistinct, dependencies, mcv) con el ejemplo canónico de columnas correlacionadas." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 3.1: cómo se calcula la selectividad a partir de MCV e histograma, paso por paso." }
    ]
  };

})(window.GUIA = window.GUIA || {});
