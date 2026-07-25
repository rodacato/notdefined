/* data/distinct-on.js — 1.3 DISTINCT ON */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "distinct-on",
    titulo: "DISTINCT ON",
    dificultad: 1,
    postgresEspecifico: true,
    queEs: "Una fila por grupo, la que tú elijas, en una sola cláusula: «la más reciente por usuario» sin "
      + "subquery de MAX ni re-join contra la tabla.",
    enBreve: [
      { k: "La forma", v: "<code>SELECT DISTINCT ON (expr) * FROM t ORDER BY expr, criterio DESC</code> — el <code>ORDER BY</code> DEBE abrir con las expresiones del <code>DISTINCT ON</code>." },
      { k: "Qué devuelve", v: "La PRIMERA fila de cada grupo según ese <code>ORDER BY</code>. «Primera» la defines tú con las columnas que siguen." },
      { k: "Portabilidad", v: "Postgres-específico: no es ANSI. El equivalente portable es <code>ROW_NUMBER() … = 1</code> en una subquery." },
      { k: "Índice", v: "Un índice sobre <code>(user_id, creado DESC)</code> lo resuelve con un Index Scan y salta el sort." }
    ],
    fundamento: "<p>«Dame el último pedido de cada cliente» es la consulta más pedida de cualquier sistema y la "
      + "que peor se escribe. La versión folklórica agrupa por cliente para sacar <code>MAX(creado)</code> y luego "
      + "vuelve a joinear contra la tabla para recuperar las demás columnas — dos pasadas, y un bug latente si dos "
      + "filas empatan en la fecha.</p>"
      + "<p><code>DISTINCT ON</code> lo dice directo: agrupa por esta expresión, ordena así, quédate con la "
      + "primera. Es de las cosas que hacen que valga la pena estar en Postgres.</p>",
    comoFunciona: [
      {
        nota: "El último evento de cada usuario, con todas sus columnas, en una pasada.",
        sql: "SELECT DISTINCT ON (user_id) id, user_id, creado\nFROM eventos\nORDER BY user_id, creado DESC;\n-- => 2 filas: (92, 7, 2026-07-03 18:40) y (95, 12, 2026-07-04 22:10)"
      },
      {
        nota: "Desempate determinista: agrega una segunda columna al <code>ORDER BY</code> para que dos fechas iguales no devuelvan «cualquiera».",
        sql: "SELECT DISTINCT ON (user_id) *\nFROM eventos\nORDER BY user_id, creado DESC, id DESC;   -- => siempre la misma fila"
      },
      {
        nota: "El equivalente ANSI, por si el código tiene que correr en otro motor.",
        sql: "SELECT * FROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY creado DESC) AS n\n  FROM eventos\n) t WHERE n = 1;   -- => las mismas 2 filas, más ceremonia"
      }
    ],
    widget: "distinct-on",
    cuandoNo: "<p>Si necesitas más de una fila por grupo (top-N, no top-1), <code>DISTINCT ON</code> no te sirve: "
      + "usa window (<code>ROW_NUMBER</code>) o <code>LATERAL</code>.</p>"
      + "<p>Y si te importa la portabilidad ANSI, <code>DISTINCT ON</code> no existe fuera de Postgres — el día "
      + "que migres, cada uno se convierte en una subquery con <code>ROW_NUMBER</code>.</p>",
    mito: {
      creencia: "para «la última fila por usuario» necesito una subquery con MAX(created_at) y re-join contra la tabla",
      veredicto: "falso",
      realidad: "<code>SELECT DISTINCT ON (user_id) * … ORDER BY user_id, created_at DESC</code> te da una fila "
        + "por grupo, la que elijas (el <code>ORDER BY</code> debe abrir con las columnas del <code>DISTINCT ON</code>)."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · DISTINCT ON", nota: "La cláusula, sus reglas de ORDER BY y su carácter no estándar.", url: "https://www.postgresql.org/docs/17/sql-select.html#SQL-DISTINCT" },
      { titulo: "modern-sql.com · Fetch first rows per group", nota: "Winand compara DISTINCT ON con las alternativas portables, motor por motor.", url: "https://modern-sql.com/use-case/fetch-first-rows-per-group" },
      { titulo: "Use The Index, Luke! · Índices para ORDER BY", nota: "Cómo el índice compuesto convierte el sort en un scan ordenado.", url: "https://use-the-index-luke.com/sql/sorting-grouping" }
    ]
  });
})(window.GUIA = window.GUIA || {});
