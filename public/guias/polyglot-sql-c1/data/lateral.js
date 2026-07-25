/* data/lateral.js — 1.2 LATERAL joins */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "lateral",
    titulo: "LATERAL joins",
    dificultad: 2,
    queEs: "Un join cuya subquery derecha puede ver las columnas de la izquierda y corre una vez por cada "
      + "fila. Es el foreach del motor: el idiom canónico del top-N por grupo.",
    enBreve: [
      { k: "La forma", v: "<code>FROM a JOIN LATERAL (SELECT … WHERE x = a.id LIMIT n) s ON true</code>. El <code>ON true</code> no es adorno: la correlación ya vive dentro." },
      { k: "Qué habilita", v: "<code>LIMIT</code>/<code>ORDER BY</code> por cada fila de la izquierda — lo único que una subquery escalar no puede darte (devuelve un valor, no n filas)." },
      { k: "ANSI", v: "<code>LATERAL</code> es estándar SQL. Las funciones que devuelven conjuntos (<code>generate_series</code>, <code>jsonb_to_recordset</code>) en el <code>FROM</code> ya son laterales implícitas en Postgres." },
      { k: "Costo", v: "El plan típico es Nested Loop: la subquery se ejecuta N veces. Con índice sobre la llave de correlación es barato; sin él, N scans." }
    ],
    fundamento: "<p>Un join normal evalúa los dos lados por separado y luego los cruza; por eso la derecha no "
      + "puede mirar a la izquierda. <code>LATERAL</code> rompe esa simetría a propósito: la subquery derecha "
      + "recibe la fila actual de la izquierda como si fuera un parámetro.</p>"
      + "<p>Eso desbloquea la clase de pregunta donde la respuesta es <em>un subconjunto ordenado por cada fila</em>: "
      + "los 3 productos más caros de cada categoría, el último pago de cada cliente, los 2 eventos siguientes de "
      + "cada usuario. En la app eso es un N+1 (una query por categoría) o traerse todo y cortar en memoria. "
      + "Con <code>LATERAL</code> es una sola query, y el <code>LIMIT</code> vive donde debe.</p>"
      + "<p>El otro uso es cadena de cálculos: nombrar un valor intermedio en el <code>FROM</code> y reusarlo en "
      + "el <code>SELECT</code> sin repetir la expresión tres veces.</p>",
    comoFunciona: [
      {
        nota: "Top-2 por categoría. La subquery corre una vez por categoría, con su propio <code>ORDER BY … LIMIT</code>.",
        sql: "SELECT c.nombre, p.nombre, p.precio\nFROM categorias c\nJOIN LATERAL (\n  SELECT nombre, precio FROM productos\n  WHERE productos.categoria_id = c.id\n  ORDER BY precio DESC LIMIT 2\n) p ON true;\n-- => 5 filas: 2 de Bebidas, 2 de Lácteos, 1 de Especias (Vinos no aparece)"
      },
      {
        nota: "<code>LEFT JOIN LATERAL</code> conserva las filas cuya subquery devolvió 0 filas.",
        sql: "SELECT c.nombre, p.nombre\nFROM categorias c\nLEFT JOIN LATERAL (\n  SELECT nombre FROM productos WHERE categoria_id = c.id ORDER BY precio DESC LIMIT 2\n) p ON true;\n-- => 6 filas: la de Vinos sale con nombre = NULL"
      },
      {
        nota: "Valor intermedio nombrado: calcúlalo una vez, úsalo tres.",
        sql: "SELECT o.id, m.margen, ROUND(m.margen / o.total * 100, 1) AS pct\nFROM ordenes o,\n     LATERAL (SELECT o.total - o.costo AS margen) m\nWHERE m.margen > 0;\n-- => una fila por orden con margen > 0, sin repetir (total - costo)"
      }
    ],
    widget: "lateral",
    cuandoNo: "<p>Si la subquery no se correlaciona con la izquierda, un <code>JOIN</code> normal o una CTE es más "
      + "claro — <code>LATERAL</code> ahí solo agrega ruido.</p>"
      + "<p>Y recuerda que corre por-fila: si la subquery es pesada y la izquierda trae 200 000 filas, pagas "
      + "200 000 ejecuciones. Cuando el top-N por grupo se puede resolver con <code>ROW_NUMBER()</code> sobre una "
      + "sola pasada y la izquierda es grande, mide las dos: la window suele ganar en volumen alto, "
      + "<code>LATERAL</code> gana cuando la izquierda es chica y hay índice para la derecha.</p>",
    mito: {
      creencia: "para «los 3 productos más caros por categoría» me traigo todo y corto en la app (o hago N+1: una query por categoría)",
      veredicto: "falso",
      realidad: "<code>JOIN LATERAL (…) ON true</code> deja que la subquery de la derecha vea cada fila de la "
        + "izquierda y corra una vez por fila — el top-N por grupo en una sola query. Usa "
        + "<code>LEFT JOIN LATERAL</code> para no perder las categorías cuya subquery devuelve 0-1 filas "
        + "(el inner las descarta)."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · LATERAL subqueries", nota: "La sección de FROM: reglas de visibilidad y el porqué del ON true.", url: "https://www.postgresql.org/docs/17/queries-table-expressions.html#QUERIES-LATERAL" },
      { titulo: "modern-sql.com · LATERAL", nota: "Winand: LATERAL como estándar, y su relación con las funciones tabla.", url: "https://modern-sql.com/feature/lateral" },
      { titulo: "Use The Index, Luke! · Top-N por grupo", nota: "Qué índice hace que el LIMIT por fila sea gratis.", url: "https://use-the-index-luke.com/sql/partial-results/top-n-queries" }
    ]
  });
})(window.GUIA = window.GUIA || {});
