/* data/subqueries.js — 2.3 Subqueries con criterio (y la trampa de NULL) */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "subqueries",
    titulo: "Subqueries con criterio",
    dificultad: 2,
    queEs: "Cuál de las cuatro formas usar — escalar, correlacionada, derived table, EXISTS — y la lógica de "
      + "tres valores que convierte una de ellas en un bug silencioso.",
    enBreve: [
      { k: "Escalar", v: "Devuelve 1 fila × 1 columna; puede ir en el <code>SELECT</code> o comparada con <code>=</code>. Si devuelve 2 filas, error en tiempo de ejecución." },
      { k: "EXISTS", v: "Semi-join: corta al primer match, no le importa qué columnas devuelvas (<code>SELECT 1</code> es idiomático) y es inmune a NULL." },
      { k: "Tres valores", v: "<code>x = NULL</code> no es false: es NULL. Y el <code>WHERE</code> solo deja pasar lo que es true — ni false ni NULL." },
      { k: "NOT IN", v: "Con un solo NULL en la lista o en la subquery, devuelve CERO filas siempre. Sin error, sin warning." }
    ],
    fundamento: "<p><code>IN</code>, <code>EXISTS</code> y un <code>JOIN</code> suelen dar el mismo plan: el planner "
      + "reescribe casi todo a semi-joins. Esa equivalencia es real y es la razón del folklore de «da lo mismo». "
      + "Hay una excepción, y muerde: la negación.</p>"
      + "<p><code>NOT IN (subquery)</code> se expande a <code>x &lt;&gt; a AND x &lt;&gt; b AND …</code>. Si alguno de "
      + "esos valores es NULL, ese <code>AND</code> nunca puede ser true — a lo más NULL — y el <code>WHERE</code> "
      + "descarta la fila. Resultado: cero filas, siempre, calladamente. Es el bug que no truena: solo devuelve nada, "
      + "y en un reporte «nada» se lee como «no hay datos».</p>"
      + "<p><code>NOT EXISTS</code> pregunta otra cosa — «¿existe al menos una fila que empareje?» — y ahí NULL no "
      + "es una respuesta ambigua: o existe o no. Por eso es el default para negaciones.</p>",
    comoFunciona: [
      {
        nota: "La trampa, en cuatro renglones. La columna de la subquery admite NULL: eso es todo lo que se necesita.",
        sql: "SELECT count(*) FROM pedidos WHERE id NOT IN (1, 2, NULL);\n-- => 0\nSELECT count(*) FROM pedidos WHERE NOT EXISTS (\n  SELECT 1 FROM excluidos e WHERE e.pedido_id = pedidos.id);\n-- => 3   (las filas correctas)"
      },
      {
        nota: "«¿Existe al menos uno?» — <code>EXISTS</code> corta al primer match y no necesita <code>DISTINCT</code> como haría el join.",
        sql: "SELECT c.id, c.nombre FROM clientes c\nWHERE EXISTS (SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id AND p.total > 5000);\n-- => 1 fila por cliente, sin duplicar por cada pedido grande"
      },
      {
        nota: "Subquery escalar en el <code>SELECT</code>: un valor por fila. Si puede devolver más de una fila, revienta en ejecución.",
        sql: "SELECT c.nombre,\n       (SELECT max(creado) FROM pedidos p WHERE p.cliente_id = c.id) AS ultimo\nFROM clientes c;\n-- => 1 fila por cliente; ultimo = NULL si nunca pidió"
      },
      {
        nota: "Derived table: cuando de verdad necesitas columnas del otro lado, es un join — no lo disfraces de subquery.",
        sql: "SELECT c.nombre, r.pedidos, r.gastado\nFROM clientes c\nJOIN (SELECT cliente_id, count(*) AS pedidos, SUM(total) AS gastado\n      FROM pedidos GROUP BY cliente_id) r ON r.cliente_id = c.id;\n-- => 1 fila por cliente con pedidos, con sus dos métricas"
      }
    ],
    widget: "not-in-null",
    cuandoNo: "<p>Usa <code>EXISTS</code>/<code>NOT EXISTS</code> para «¿existe al menos uno?»: corta al primer match "
      + "y es inmune al NULL.</p>"
      + "<p>Reserva <code>IN</code> para listas chicas y conocidas (constantes, enums), no para subqueries que pueden "
      + "traer NULL. Y usa un <code>JOIN</code> cuando de verdad necesitas columnas del otro lado — si no las "
      + "necesitas, el join solo te obliga a un <code>DISTINCT</code> que no debiste pagar.</p>",
    mito: {
      creencia: "IN, EXISTS y un JOIN dan lo mismo, elige el que quieras",
      veredicto: "falso en un caso que muerde",
      realidad: "<code>NOT IN (subquery)</code> donde la subquery devuelve aunque sea UN <code>NULL</code> regresa "
        + "CERO filas, siempre y calladamente (<code>x NOT IN (1, NULL)</code> nunca es true — tres valores). "
        + "<code>NOT EXISTS</code> no tiene esa trampa."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · Subquery Expressions", nota: "EXISTS, IN, ANY/ALL y la semántica exacta con NULL, escrita sin rodeos.", url: "https://www.postgresql.org/docs/17/functions-subquery.html" },
      { titulo: "modern-sql.com · NULL y three-valued logic", nota: "Winand desarma la lógica de tres valores y sus consecuencias en el estándar.", url: "https://modern-sql.com/concept/three-valued-logic" },
      { titulo: "Use The Index, Luke! · Semi-joins e índices", nota: "Cómo se indexa un EXISTS correlacionado para que corte de verdad.", url: "https://use-the-index-luke.com/sql/join/nested-loops-join-n1-problem" }
    ]
  });
})(window.GUIA = window.GUIA || {});
