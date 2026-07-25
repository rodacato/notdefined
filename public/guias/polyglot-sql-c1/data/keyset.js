/* data/keyset.js — 1.4 Keyset / seek pagination */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "keyset",
    titulo: "Keyset pagination",
    dificultad: 2,
    queEs: "Paginar por la última llave vista en vez de por número de página: el motor arranca donde te "
      + "quedaste, sin generar y tirar todo lo anterior.",
    enBreve: [
      { k: "La forma", v: "<code>WHERE (creado, id) &lt; (:last_creado, :last_id) ORDER BY creado DESC, id DESC LIMIT 20</code> — comparación de tuplas, no de columnas sueltas." },
      { k: "Costo", v: "O(página): cada página lee ~20 filas. <code>OFFSET n</code> es O(n + límite): genera y descarta las n anteriores, cada vez." },
      { k: "Índice", v: "Uno solo, sobre <code>(creado DESC, id DESC)</code> — o su inverso completo; la dirección importa para poder recorrerlo sin sort." },
      { k: "Estabilidad", v: "Keyset no salta filas ni duplica cuando se insertan datos mientras paginas; <code>OFFSET</code> sí — la página 3 se corre." }
    ],
    fundamento: "<p><code>LIMIT 20 OFFSET 100000</code> no le pide al motor «empieza en la fila 100 001»: le pide "
      + "«produce 100 020 filas en orden y tira las primeras 100 000». El trabajo crece con la profundidad, y el "
      + "usuario que llega al final del feed es justo el que más te cuesta.</p>"
      + "<p>Keyset invierte la pregunta: no «¿qué página?» sino «¿qué venía después de esto?». Como la respuesta es "
      + "un predicado sobre las columnas ordenadas, el índice te deja aterrizar directo en el punto de corte y leer "
      + "20 filas contiguas. Es el ejemplo puro de la tesis: el junior usa <code>OFFSET</code>.</p>"
      + "<p>La comparación de tuplas es la parte que la gente escribe mal. <code>(a, b) &lt; (x, y)</code> es "
      + "lexicográfico y lo entiende el índice; <code>a &lt;= x AND b &lt; y</code> no es lo mismo y además pierde filas.</p>",
    comoFunciona: [
      {
        nota: "Primera página y siguientes. El cursor es la última fila que entregaste, no un número.",
        sql: "-- página 1\nSELECT id, creado FROM pedidos ORDER BY creado DESC, id DESC LIMIT 20;\n\n-- siguientes: pasa la última (creado, id) que devolviste\nSELECT id, creado FROM pedidos\nWHERE (creado, id) < ('2026-05-02 10:00:00', 84120)\nORDER BY creado DESC, id DESC LIMIT 20;\n-- => 20 filas leídas, sea la página 2 o la 5001"
      },
      {
        nota: "El índice que lo hace O(página). Sin él, keyset sigue ordenando toda la tabla.",
        sql: "CREATE INDEX idx_pedidos_feed ON pedidos (creado DESC, id DESC);\n-- => EXPLAIN: Index Scan Backward … rows=20, sin Sort"
      },
      {
        nota: "Lo que NO es keyset: esto pierde filas cuando hay empates en <code>creado</code>.",
        sql: "-- ✗ mal\nWHERE creado <= '2026-05-02 10:00:00' AND id < 84120\n-- ✓ bien\nWHERE (creado, id) < ('2026-05-02 10:00:00', 84120)"
      }
    ],
    widget: "keyset",
    cuandoNo: "<p>Keyset no te da «salta a la página 47» ni total de páginas — no hay número de página. Si la UI los "
      + "exige, <code>OFFSET</code> (o un <code>count</code> aparte, o un conteo aproximado) es el precio.</p>"
      + "<p>Keyset paga en feeds, scroll infinito y exports. Y la tupla del <code>WHERE</code> debe casar EXACTO con "
      + "el <code>ORDER BY</code> (mismas columnas, mismo orden) o el índice no ayuda y vuelves a ordenar la tabla "
      + "completa sin darte cuenta.</p>",
    mito: {
      creencia: "para paginar uso LIMIT n OFFSET m y listo",
      veredicto: "falso a escala",
      realidad: "<code>OFFSET 100000</code> hace que el motor GENERE y TIRE las 100 000 filas anteriores en cada "
        + "página — más lento entre más avanzas. El patrón senior es keyset (seek): arranca donde quedaste, sin contar "
        + "lo anterior; con un índice sobre <code>(creado, id)</code> es O(página), no O(offset)."
    },
    recursos: [
      { titulo: "Use The Index, Luke! · Paginación (seek method)", nota: "El texto canónico de Winand sobre OFFSET vs keyset, con los planes al lado.", url: "https://use-the-index-luke.com/no-offset" },
      { titulo: "PostgreSQL 17 · LIMIT y OFFSET", nota: "La advertencia está en la doc: OFFSET calcula y descarta las filas omitidas.", url: "https://www.postgresql.org/docs/17/queries-limit.html" },
      { titulo: "modern-sql.com · Row values", nota: "La comparación de tuplas que hace posible el keyset, y qué motores la soportan de verdad.", url: "https://modern-sql.com/feature/row-values" }
    ]
  });
})(window.GUIA = window.GUIA || {});
