/* data/recursivas.js — 2.2 CTEs recursivas */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "recursivas",
    titulo: "CTEs recursivas",
    dificultad: 3,
    queEs: "Una query que se alimenta de su propio resultado hasta que ya no produce filas: jerarquías, "
      + "grafos y series generadas, en una sola sentencia.",
    enBreve: [
      { k: "La forma", v: "<code>WITH RECURSIVE t AS (ancla UNION ALL parte_recursiva)</code> — la parte recursiva se refiere a <code>t</code> y ve solo las filas de la iteración anterior (la <em>working table</em>)." },
      { k: "Cuándo para", v: "Cuando una iteración devuelve 0 filas. No hay límite de profundidad implícito: un grafo con ciclo NO termina." },
      { k: "Ciclos (PG14+)", v: "<code>CYCLE col SET es_ciclo USING camino</code> — la cláusula estándar que rastrea la ruta por ti y corta la vuelta." },
      { k: "UNION vs UNION ALL", v: "<code>UNION</code> deduplica en cada paso (útil contra ciclos simples, más caro). <code>UNION ALL</code> es lo normal y lo rápido." }
    ],
    fundamento: "<p><code>WITH RECURSIVE</code> no es recursión de verdad: es iteración. Arranca con el ancla, mete "
      + "sus filas en una working table, corre la parte recursiva contra ESA working table, sustituye, repite. "
      + "Entender que la parte recursiva solo ve la iteración anterior — no el acumulado — explica el 90% de los "
      + "resultados raros.</p>"
      + "<p>El caso típico es la jerarquía: árbol de categorías, organigrama, hilos de comentarios, lista de "
      + "materiales. En la app eso es un loop con una query por nivel (o peor, por nodo). Aquí es una query, y de "
      + "paso te llevas el nivel y la ruta completa gratis.</p>"
      + "<p>El segundo caso, menos glamoroso y más usado: series. <code>generate_series</code> más un "
      + "<code>LEFT JOIN</code> rellena los días sin ventas que un <code>GROUP BY</code> normal simplemente no "
      + "reporta — y esa es la diferencia entre una gráfica correcta y una que miente.</p>",
    comoFunciona: [
      {
        nota: "Árbol completo con nivel y ruta. El ancla es la raíz; cada iteración baja un nivel.",
        sql: "WITH RECURSIVE arbol AS (\n  SELECT id, nombre, padre_id, 1 AS nivel, nombre::text AS ruta\n  FROM categorias WHERE padre_id IS NULL\n  UNION ALL\n  SELECT c.id, c.nombre, c.padre_id, a.nivel + 1, a.ruta || ' > ' || c.nombre\n  FROM categorias c JOIN arbol a ON c.padre_id = a.id\n)\nSELECT nivel, ruta FROM arbol ORDER BY ruta;\n-- => 7 filas, niveles 1..4 ('Catálogo > Bebidas > Cafés > Espresso')"
      },
      {
        nota: "Grafo con ciclos: la cláusula estándar <code>CYCLE</code> (PG14+) en vez de rastrear visitados a mano.",
        sql: "WITH RECURSIVE ruta AS (\n  SELECT origen, destino FROM vuelos WHERE origen = 'MEX'\n  UNION ALL\n  SELECT v.origen, v.destino FROM vuelos v JOIN ruta r ON v.origen = r.destino\n) CYCLE destino SET es_ciclo USING camino\nSELECT * FROM ruta WHERE NOT es_ciclo;\n-- => termina: las filas que cerrarían el ciclo vienen marcadas es_ciclo = true"
      },
      {
        nota: "Rellenar fechas sin ventas. No es recursiva, pero resuelve el mismo tipo de hueco.",
        sql: "SELECT d::date AS dia, COALESCE(SUM(v.monto), 0) AS monto\nFROM generate_series('2026-03-01'::date, '2026-03-05', '1 day') d\nLEFT JOIN ventas v ON v.fecha = d::date\nGROUP BY d ORDER BY d;\n-- => 5 filas, incluidos los días en cero (el GROUP BY solo habría dado 3)"
      }
    ],
    widget: "recursiva",
    cuandoNo: "<p>Si la profundidad es fija y chica (siempre dos niveles), joins explícitos son más claros y más "
      + "rápidos. La recursiva paga con profundidad variable o desconocida.</p>"
      + "<p>Y cuida los ciclos: un grafo con vuelta no termina. Rastrea los visitados con un arreglo de ruta, o usa "
      + "<code>CYCLE … SET … USING</code> desde PG14. Sin eso, la query no es lenta: es infinita.</p>",
    mito: {
      creencia: "recorrer una jerarquía o un grafo es un loop en la app, o N+1 queries",
      veredicto: "falso",
      realidad: "<code>WITH RECURSIVE</code> recorre el árbol o el grafo en UNA query, nivel por nivel, hasta que "
        + "no hay más filas. Y para reportes, <code>generate_series</code> + <code>LEFT JOIN</code> rellena los días "
        + "con cero ventas que un <code>GROUP BY</code> normal se salta."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · Recursive Queries", nota: "El algoritmo iterativo explicado paso a paso, con CYCLE y SEARCH.", url: "https://www.postgresql.org/docs/17/queries-with.html#QUERIES-WITH-RECURSIVE" },
      { titulo: "modern-sql.com · WITH RECURSIVE", nota: "Winand: el estándar, los usos (jerarquías, series, dedup) y las trampas.", url: "https://modern-sql.com/feature/with/recursive" },
      { titulo: "PGConf · Recursive queries y grafos en Postgres", nota: "Material de charlas sobre grafos, ciclos y cuándo conviene una base de grafos.", url: "https://www.pgcon.org/" }
    ]
  });
})(window.GUIA = window.GUIA || {});
