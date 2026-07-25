/* data/ctes.js — 2.1 CTEs (WITH) */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "ctes",
    titulo: "CTEs (WITH)",
    dificultad: 1,
    queEs: "Pasos nombrados al principio de la query: nombras un resultado intermedio, lo reusas, y la "
      + "consulta se lee de arriba abajo en vez de anidada hacia adentro.",
    enBreve: [
      { k: "Desde PG12", v: "Una CTE no recursiva, sin efectos secundarios y referenciada UNA vez se INLINEA por default. Referenciada 2+ veces, se MATERIALIZA." },
      { k: "El par de control", v: "<code>WITH x AS MATERIALIZED (…)</code> clava el resultado; <code>AS NOT MATERIALIZED</code> fuerza el inline. Tú decides, no la estética." },
      { k: "Alcance", v: "Cada CTE ve a las declaradas antes que ella (y a sí misma con <code>RECURSIVE</code>). Vive solo durante la sentencia." },
      { k: "Escritura", v: "Una CTE puede contener <code>INSERT</code>/<code>UPDATE</code>/<code>DELETE … RETURNING</code>; eso es la ficha 4.2, y ahí la materialización siempre ocurre." }
    ],
    fundamento: "<p>Una CTE no es magia de rendimiento: es un nombre. Su valor es de lectura — «esto es el conjunto "
      + "de clientes activos», «esto es el resumen mensual» — y de reuso: el mismo paso referenciado dos veces sin "
      + "copiar y pegar la subquery.</p>"
      + "<p>Lo que cambió en PG12 es quién decide si ese nombre se convierte en una materialización real. Antes, "
      + "siempre: la CTE era una barrera de optimización y la gente la usaba de martillo para «forzar» planes. Hoy el "
      + "planner la funde con el query externo cuando le conviene, y tú tienes dos palabras para anular esa "
      + "decisión cuando sabes algo que el planner no sabe.</p>"
      + "<p>El criterio práctico: <code>MATERIALIZED</code> cuando el paso es caro, lo referencias una vez y no "
      + "quieres que se re-evalúe ni se re-planee dentro del query externo. <code>NOT MATERIALIZED</code> cuando lo "
      + "referencias varias veces pero quieres que los predicados del exterior se empujen hacia adentro.</p>",
    comoFunciona: [
      {
        nota: "Pasos nombrados, de arriba abajo. Se lee como una función con variables locales.",
        sql: "WITH activos AS (\n  SELECT id FROM clientes WHERE cancelado_en IS NULL\n),\nresumen AS (\n  SELECT cliente_id, SUM(total) AS gastado\n  FROM pedidos WHERE cliente_id IN (SELECT id FROM activos)\n  GROUP BY cliente_id\n)\nSELECT * FROM resumen WHERE gastado > 10000;\n-- => 1 fila por cliente activo que rebasó 10 000"
      },
      {
        nota: "<code>MATERIALIZED</code> para clavar un paso caro que se usa una vez: se calcula una y ya.",
        sql: "WITH pesado AS MATERIALIZED (\n  SELECT categoria_id, percentile_cont(0.95) WITHIN GROUP (ORDER BY precio) AS p95\n  FROM productos GROUP BY categoria_id\n)\nSELECT p.nombre FROM productos p JOIN pesado h USING (categoria_id)\nWHERE p.precio > h.p95;\n-- => EXPLAIN: CTE Scan on pesado (una sola evaluación)"
      },
      {
        nota: "<code>NOT MATERIALIZED</code> para que el filtro del exterior entre a la CTE en vez de correr después.",
        sql: "WITH v AS NOT MATERIALIZED (SELECT * FROM ventas)\nSELECT * FROM v WHERE region = 'Norte';\n-- => EXPLAIN: Index Scan … Index Cond: (region = 'Norte'), sin CTE Scan"
      }
    ],
    widget: "cte-inline",
    cuandoNo: "<p>No metas cada subquery en un <code>WITH</code> por estética: si una subquery en el "
      + "<code>FROM</code> se lee igual de claro, la CTE solo agrega ceremonia y un nombre más que rastrear.</p>"
      + "<p>Y no la uses como barrera de optimización «por costumbre»: desde PG12 eso ya no es cierto por default, "
      + "y el día que quieras la barrera de verdad se escribe <code>MATERIALIZED</code>, explícito, para que el "
      + "siguiente que lea sepa que fue una decisión.</p>",
    mito: {
      creencia: "una CTE siempre materializa / es una barrera de optimización que puedes usar para «forzar» un plan",
      veredicto: "cierto hasta PG11 · falso desde PG12",
      realidad: "Una CTE no recursiva, sin efectos secundarios y referenciada UNA sola vez se INLINEA por default; "
        + "una referenciada 2+ veces se MATERIALIZA por default. Tú decides con el par "
        + "<code>MATERIALIZED</code> / <code>NOT MATERIALIZED</code>. El PORQUÉ del inline es el planner — eso es «SQL a fondo», C2."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · WITH Queries", nota: "Las reglas exactas de inline vs materialización, con las condiciones que las disparan.", url: "https://www.postgresql.org/docs/17/queries-with.html" },
      { titulo: "modern-sql.com · WITH (Common Table Expressions)", nota: "El estándar, y qué parte de él implementa cada motor.", url: "https://modern-sql.com/feature/with" },
      { titulo: "PGConf · «CTEs are not optimization fences anymore»", nota: "Charlas y notas de la comunidad sobre el cambio de PG12 y cómo re-auditar queries viejas.", url: "https://www.postgresql.org/about/news/postgresql-12-released-1976/" }
    ]
  });
})(window.GUIA = window.GUIA || {});
