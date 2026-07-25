/* data/pivot.js — 3.2 Pivot / crosstab */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "pivot",
    titulo: "Pivot con FILTER",
    dificultad: 2,
    postgresEspecifico: true,
    queEs: "Girar filas a columnas dentro de la query: agregación condicional con FILTER, crosstab() de "
      + "tablefunc, y el camino de regreso (unpivot) con LATERAL y VALUES.",
    enBreve: [
      { k: "FILTER", v: "<code>SUM(x) FILTER (WHERE cond)</code> — estándar SQL desde SQL:2003, más limpio que <code>CASE</code> y aplica a cualquier agregado, incluido <code>count(*)</code>." },
      { k: "crosstab()", v: "De la extensión <code>tablefunc</code> (<code>CREATE EXTENSION tablefunc</code>). Necesitas declarar las columnas de salida: el tipo de retorno no puede ser dinámico." },
      { k: "Unpivot", v: "Columnas → filas con <code>LATERAL (VALUES …)</code> o <code>unnest()</code>. No hay palabra clave para esto." },
      { k: "Dinámico", v: "Si las categorías no se conocen de antemano, no hay pivot puro: o generas el SQL, o devuelves <code>jsonb_object_agg</code> y giras en el front." }
    ],
    fundamento: "<p>El pivote no es una operación exótica: es un <code>GROUP BY</code> donde los renglones los define "
      + "la clave de agrupación y las columnas las define un conjunto conocido de condiciones. Una vez que lo ves así, "
      + "<code>FILTER</code> es todo lo que necesitas.</p>"
      + "<p><code>FILTER</code> le pone un predicado a un agregado individual, no a la query. Tres categorías, tres "
      + "columnas, tres <code>FILTER</code>. Es explícito y verboso, y eso está bien: la lista de columnas es "
      + "justamente la parte que un pivote necesita fijar.</p>"
      + "<p><code>crosstab()</code> automatiza el mismo giro cuando el conjunto de categorías es estable y largo. El "
      + "límite es de tipos: SQL exige conocer las columnas de salida al planear, así que un pivote de verdad "
      + "dinámico siempre acaba en SQL generado o en JSON.</p>",
    comoFunciona: [
      {
        nota: "El pivote manual: una columna por categoría, con <code>FILTER</code>.",
        sql: "SELECT fecha,\n       SUM(monto) FILTER (WHERE categoria = 'Bebidas')  AS bebidas,\n       SUM(monto) FILTER (WHERE categoria = 'Lácteos')  AS lacteos,\n       SUM(monto) FILTER (WHERE categoria = 'Especias') AS especias\nFROM movimientos GROUP BY fecha ORDER BY fecha;\n-- => 2 filas × 4 columnas (los huecos vienen NULL, no 0)"
      },
      {
        nota: "<code>FILTER</code> también para contar solo los que cumplen — sin el <code>CASE … END</code> y su NULL implícito.",
        sql: "SELECT count(*) AS total,\n       count(*) FILTER (WHERE estado = 'pagado')    AS pagados,\n       count(*) FILTER (WHERE estado = 'pendiente') AS pendientes\nFROM pedidos;\n-- => 1 fila: 4 | 3 | 1"
      },
      {
        nota: "<code>crosstab()</code> con categorías estables. Nota las columnas de salida declaradas a mano.",
        sql: "CREATE EXTENSION IF NOT EXISTS tablefunc;\nSELECT * FROM crosstab(\n  'SELECT fecha, categoria, SUM(monto) FROM movimientos GROUP BY 1,2 ORDER BY 1,2',\n  'VALUES (''Bebidas''), (''Lácteos''), (''Especias'')'\n) AS t(fecha date, bebidas numeric, lacteos numeric, especias numeric);\n-- => las mismas 2 filas × 4 columnas"
      },
      {
        nota: "Unpivot: de columnas a filas, con <code>LATERAL (VALUES …)</code>.",
        sql: "SELECT m.fecha, v.categoria, v.monto\nFROM pivoteado m\nCROSS JOIN LATERAL (VALUES\n  ('Bebidas', m.bebidas), ('Lácteos', m.lacteos), ('Especias', m.especias)\n) AS v(categoria, monto)\nWHERE v.monto IS NOT NULL;\n-- => de 2 filas × 4 columnas de vuelta a 4 filas largas"
      }
    ],
    widget: "pivot",
    cuandoNo: "<p>Si las columnas del pivote son DINÁMICAS — no sabes las categorías de antemano — el pivote en SQL "
      + "puro es doloroso: acabas generando SQL con <code>format()</code> y ejecutándolo, o escribiendo una función "
      + "que devuelve <code>setof record</code>.</p>"
      + "<p>Ahí a veces conviene pivotar en la app, o devolver <code>jsonb_object_agg(categoria, monto)</code> y dejar "
      + "que el front arme las columnas: una fila por grupo, un objeto con lo que haya.</p>",
    mito: {
      creencia: "Postgres no hace pivot como el PIVOT de SQL Server o una tabla dinámica",
      veredicto: "falso",
      realidad: "<code>SUM(x) FILTER (WHERE cond)</code> hace el pivote manual (una columna por categoría) y "
        + "<code>crosstab()</code> lo automatiza. <code>FILTER</code> es más limpio que <code>CASE</code> para «cuenta "
        + "solo los que cumplen»."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · tablefunc (crosstab)", nota: "La extensión, sus dos firmas y por qué hay que declarar las columnas.", url: "https://www.postgresql.org/docs/17/tablefunc.html" },
      { titulo: "modern-sql.com · FILTER", nota: "Winand: FILTER es estándar y el CASE dentro del agregado es el workaround, no lo contrario.", url: "https://modern-sql.com/feature/filter" },
      { titulo: "PostgreSQL 17 · Aggregate Expressions", nota: "Dónde vive FILTER en la gramática y cómo interactúa con ORDER BY y DISTINCT.", url: "https://www.postgresql.org/docs/17/sql-expressions.html#SYNTAX-AGGREGATES" }
    ]
  });
})(window.GUIA = window.GUIA || {});
