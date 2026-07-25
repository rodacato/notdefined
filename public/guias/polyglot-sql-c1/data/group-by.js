/* data/group-by.js — 3.1 GROUP BY avanzado */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "group-by",
    titulo: "GROUP BY avanzado",
    dificultad: 2,
    queEs: "Subtotales y totales en una sola pasada: GROUPING SETS, ROLLUP y CUBE, más la función "
      + "GROUPING() que distingue el NULL de subtotal del NULL de tus datos.",
    enBreve: [
      { k: "ROLLUP (a, b)", v: "Los prefijos: <code>(a, b)</code>, <code>(a)</code>, <code>()</code>. Jerarquía de subtotales + gran total." },
      { k: "CUBE (a, b)", v: "Todas las combinaciones: <code>(a, b)</code>, <code>(a)</code>, <code>(b)</code>, <code>()</code> — 2^n grupos, crece rápido." },
      { k: "GROUPING SETS", v: "Los grupos que tú listes, exactos. <code>ROLLUP</code> y <code>CUBE</code> son azúcar sobre esto." },
      { k: "GROUPING(a, b)", v: "Bitmask: 1 por cada columna que NO participó en ese grupo. <code>0,1</code> = subtotal de <code>a</code>; <code>1,1</code> = gran total." }
    ],
    fundamento: "<p>Un reporte real casi nunca quiere un solo nivel de agregación: quiere el detalle por región y mes, "
      + "el subtotal por región, y el gran total. La versión folklórica son tres queries pegadas con "
      + "<code>UNION ALL</code>, cada una leyendo la tabla otra vez.</p>"
      + "<p><code>GROUPING SETS</code> le dice al motor «agrúpame por estos conjuntos» y él lo resuelve en una pasada, "
      + "reutilizando el sort o el hash. <code>ROLLUP</code> es el atajo para la jerarquía natural (año → mes → día, "
      + "país → estado → ciudad); <code>CUBE</code> para cuando quieres cruzar todo contra todo, con la advertencia de "
      + "que son 2^n grupos.</p>"
      + "<p><code>GROUPING()</code> no es un detalle cosmético: las filas de subtotal llevan NULL en la columna que no "
      + "agruparon, y si tus datos también tienen NULLs reales, ambos se ven idénticos en la salida. Sin "
      + "<code>GROUPING()</code> no puedes distinguirlos — ni tú ni el front que pinta la tabla.</p>",
    comoFunciona: [
      {
        nota: "Subtotales por región + gran total, en una pasada, etiquetados.",
        sql: "SELECT region, mes, SUM(monto) AS monto,\n       GROUPING(region, mes) AS g\nFROM ventas\nGROUP BY ROLLUP (region, mes)\nORDER BY GROUPING(region), region, mes;\n-- => 7 filas: 4 de detalle (g=0), 2 subtotales de región (g=1), 1 gran total (g=3)"
      },
      {
        nota: "Etiquetar el renglón para el reporte: <code>GROUPING</code> decide el texto, no un <code>coalesce</code> a ciegas.",
        sql: "SELECT CASE WHEN GROUPING(region) = 1 THEN 'TOTAL' ELSE region END AS renglon,\n       SUM(monto)\nFROM ventas GROUP BY ROLLUP (region);\n-- => Norte 250 · Sur 250 · TOTAL 500"
      },
      {
        nota: "<code>GROUPING SETS</code> cuando los conjuntos no son una jerarquía: pide exactamente los que quieres.",
        sql: "SELECT region, mes, SUM(monto) FROM ventas\nGROUP BY GROUPING SETS ((region), (mes), ());\n-- => 2 filas por región + 2 por mes + 1 gran total = 5 filas"
      },
      {
        nota: "<code>HAVING</code> filtra grupos, no filas — y puede usar los agregados que el <code>WHERE</code> no ve.",
        sql: "SELECT region, SUM(monto) AS total FROM ventas\nWHERE fecha >= '2026-01-01'      -- filtra filas, antes de agrupar\nGROUP BY region\nHAVING SUM(monto) > 200;          -- filtra grupos, después\n-- => 2 filas"
      }
    ],
    widget: "rollup",
    cuandoNo: "<p>Si agrupas por una sola dimensión, <code>GROUP BY</code> normal y ya: <code>ROLLUP</code> ahí solo "
      + "agrega un renglón que podías calcular en el front.</p>"
      + "<p><code>ROLLUP</code>/<code>CUBE</code> pagan cuando de verdad quieres la jerarquía de subtotales (reportes, "
      + "dashboards, exports contables). Y con <code>CUBE</code> cuenta los grupos antes de escribirlo: cinco "
      + "dimensiones son 32 conjuntos de agregación sobre la misma tabla.</p>",
    mito: {
      creencia: "para subtotales por categoría MÁS el gran total necesito varias queries unidas con UNION",
      veredicto: "falso",
      realidad: "<code>GROUP BY ROLLUP (a, b)</code> y <code>GROUPING SETS (…)</code> te dan subtotales y totales en "
        + "una pasada. Y <code>GROUPING()</code> es necesario porque las filas de subtotal llevan NULL en la columna "
        + "agrupada y CHOCAN con los NULL reales de los datos — <code>GROUPING()</code> los distingue."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · GROUPING SETS, CUBE, ROLLUP", nota: "Sintaxis, equivalencias y el comportamiento de GROUPING().", url: "https://www.postgresql.org/docs/17/queries-table-expressions.html#QUERIES-GROUPING-SETS" },
      { titulo: "modern-sql.com · GROUPING SETS", nota: "Winand: el estándar completo y qué motores lo implementan sin trucos.", url: "https://modern-sql.com/feature/grouping-sets" },
      { titulo: "Use The Index, Luke! · Sorting y grouping", nota: "Cuándo el índice le ahorra al GROUP BY el sort o el hash.", url: "https://use-the-index-luke.com/sql/sorting-grouping" }
    ]
  });
})(window.GUIA = window.GUIA || {});
