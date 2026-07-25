/* data/window.js — 1.1 Window functions (la joya) */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "window-functions",
    titulo: "Window functions",
    dificultad: 3,
    esJoya: true,
    queEs: "Cálculos que ven un grupo de filas vecinas sin colapsarlas: numerar, rankear, acumular y "
      + "comparar cada fila contra su grupo, manteniendo el detalle en la misma salida.",
    enBreve: [
      { k: "La forma", v: "<code>funcion() OVER (PARTITION BY … ORDER BY … [frame])</code>. La cláusula <code>WINDOW w AS (…)</code> te deja nombrarla y reusarla en el mismo SELECT." },
      { k: "Cuándo corre", v: "Después de <code>WHERE</code>, <code>GROUP BY</code> y <code>HAVING</code>; antes de <code>ORDER BY</code> final. Por eso no puedes filtrar por una window en el <code>WHERE</code>: envuélvela en una subquery o CTE." },
      { k: "Frame default", v: "Con <code>ORDER BY</code> y sin frame: <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code>. Sin <code>ORDER BY</code>: toda la partición." },
      { k: "PG17", v: "<code>ROW_NUMBER, RANK, DENSE_RANK, PERCENT_RANK, NTILE, LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE</code> + cualquier agregado. <code>GROUPS</code> y <code>EXCLUDE</code> en el frame desde PG11." }
    ],
    fundamento: "<p>Un agregado contesta «¿cuánto en total?» y te cobra el detalle: seis filas entran, una sale. "
      + "Una window function contesta «¿cuánto <em>hasta aquí</em>, dentro de <em>este</em> grupo?» y no te cobra nada: "
      + "seis filas entran, seis salen, con una columna más.</p>"
      + "<p>Ese es el corte entre el SQL de junior y el de senior. Ranking, running total, «cuánto creció "
      + "contra el mes pasado», «qué tan lejos está esta fila del promedio de su región» son todos el mismo "
      + "movimiento: una partición, un orden dentro de ella, y una ventana de filas visibles. Traértelas a la "
      + "app para eso es pagar red y memoria por lo que el motor ya sabe hacer ordenando una vez.</p>"
      + "<p><code>PARTITION BY</code> define el grupo, <code>ORDER BY</code> define el orden dentro del grupo, "
      + "y el <em>frame</em> define cuántas de esas filas ve la función. El frame es el que casi nadie escribe "
      + "y el que muerde en producción.</p>",
    comoFunciona: [
      {
        nota: "Ranking dentro de la partición, sin perder ninguna fila. <code>RANK</code> deja huecos en los empates, <code>DENSE_RANK</code> no, <code>ROW_NUMBER</code> nunca empata.",
        sql: "SELECT region, monto,\n       ROW_NUMBER() OVER w  AS n,\n       RANK()       OVER w  AS rnk,\n       DENSE_RANK() OVER w  AS drnk\nFROM ventas\nWINDOW w AS (PARTITION BY region ORDER BY monto DESC);\n-- => Norte 120|1|1|1 · Norte 80|2|2|2 · Norte 80|3|2|2 · Norte 60|4|4|3"
      },
      {
        nota: "Running total fila-por-fila: el frame va escrito. Y <code>LAG</code> para comparar contra la fila anterior sin self-join.",
        sql: "SELECT fecha, monto,\n       SUM(monto) OVER (ORDER BY fecha\n                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS acum,\n       monto - LAG(monto) OVER (ORDER BY fecha) AS delta\nFROM ventas;\n-- => 2026-03-01 120|120|NULL · 2026-03-02 80|200|-40 · 2026-03-04 60|260|-20"
      },
      {
        nota: "«Cada fila contra el promedio de su grupo»: el agregado como window, sin subquery correlacionada.",
        sql: "SELECT region, monto,\n       ROUND(AVG(monto) OVER (PARTITION BY region), 2) AS prom_region,\n       monto - AVG(monto) OVER (PARTITION BY region) AS desvio\nFROM ventas ORDER BY region, monto DESC;\n-- => 4 filas: cada venta con el promedio de su región al lado"
      },
      {
        nota: "Filtrar por el resultado de una window: envuélvela. El <code>WHERE</code> corre antes que ella.",
        sql: "SELECT * FROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY region ORDER BY monto DESC) AS n\n  FROM ventas\n) t\nWHERE n <= 2;   -- => top-2 por región (el idiom portable de LATERAL)"
      }
    ],
    widget: "window",
    widgetExtra: "frame",
    cuandoNo: "<p>Si solo necesitas el agregado por grupo — un total, no el detalle <em>más</em> el total en el "
      + "mismo renglón — <code>GROUP BY</code> es más simple y más barato.</p>"
      + "<p>Y ojo con el gotcha de prod: un running total con <code>ORDER BY</code> SIN frame explícito usa el "
      + "default <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code>. Con valores empatados en el "
      + "<code>ORDER BY</code>, <code>RANGE</code> suma TODOS los empates de golpe (no fila por fila). Se ve "
      + "«casi bien» y pasa a prod mal. Para acumulado fila-por-fila escribe "
      + "<code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> explícito.</p>",
    mito: {
      creencia: "para un ranking, un running total o «compara cada fila con el promedio de su grupo» tengo que traerme las filas y calcular en la app (o un self-join carísimo)",
      veredicto: "falso",
      realidad: "<code>OVER (PARTITION BY … ORDER BY …)</code> te da número de fila, ranking, acumulado y acceso "
        + "a filas vecinas (<code>LAG</code>/<code>LEAD</code>) SIN colapsar el detalle. Una pasada, un orden, cero post-proceso."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · Window Functions", nota: "La referencia: sintaxis del frame, orden de evaluación, lista completa de funciones.", url: "https://www.postgresql.org/docs/17/tutorial-window.html" },
      { titulo: "modern-sql.com · Window functions", nota: "Markus Winand: qué es ANSI, qué soporta cada motor, y el frame explicado en serio.", url: "https://modern-sql.com/feature/over" },
      { titulo: "Use The Index, Luke! · Window functions y paginación", nota: "Cómo se indexa una window function y cuándo el ORDER BY sale gratis.", url: "https://use-the-index-luke.com/sql/partial-results/window-functions" }
    ]
  });
})(window.GUIA = window.GUIA || {});
