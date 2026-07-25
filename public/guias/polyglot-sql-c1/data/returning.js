/* data/returning.js — 4.2 RETURNING & data-modifying CTEs */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "returning",
    titulo: "RETURNING y CTEs que escriben",
    dificultad: 2,
    queEs: "Que la escritura te devuelva filas, y que esas filas alimenten otra escritura en la misma "
      + "sentencia atómica: mover, archivar y bifurcar datos sin round-trips.",
    enBreve: [
      { k: "RETURNING", v: "Va en <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code> y (PG17) <code>MERGE</code>. Puede devolver cualquier expresión, no solo columnas." },
      { k: "old/new (PG17)", v: "<code>RETURNING WITH (OLD AS o, NEW AS n) o.saldo, n.saldo</code> — el antes y el después en la misma fila." },
      { k: "Snapshot", v: "Todas las sub-sentencias de una sentencia ven el MISMO snapshot y NO se ven entre sí. El orden de ejecución no está definido." },
      { k: "Materialización", v: "Una CTE que escribe siempre se ejecuta, exactamente una vez, incluso si el query externo no la referencia." }
    ],
    fundamento: "<p><code>RETURNING</code> es lo básico: el id generado, el saldo resultante, la fila que acabas de "
      + "actualizar. Un round-trip menos y, más importante, cero ambigüedad sobre <em>qué</em> fila tocaste — algo que "
      + "un <code>SELECT</code> posterior no te garantiza bajo concurrencia.</p>"
      + "<p>El peso C1 está en combinarlo con <code>WITH</code>: una CTE puede ser un <code>DELETE … RETURNING *</code>, "
      + "y su resultado, la fuente de un <code>INSERT</code>. Mover filas a una tabla de archivo deja de ser «lee, "
      + "inserta, borra, y espero que nada falle en medio» y se vuelve una sentencia: atómica por definición.</p>"
      + "<p>El precio es una regla que hay que tener tatuada: dentro de una sentencia, las sub-sentencias no se ven "
      + "entre sí. Todas leen el snapshot del inicio. Sirve para bifurcar (una fuente, varios destinos), no para "
      + "pipelines donde el paso 2 depende de lo que hizo el paso 1.</p>",
    comoFunciona: [
      {
        nota: "Lo básico: el id sin segundo <code>SELECT</code>, y el antes/después con la sintaxis de PG17.",
        sql: "INSERT INTO pedidos (cliente_id, total) VALUES (7, 1200) RETURNING id, creado;\n-- => 84121 | 2026-07-24 11:03:22\n\nUPDATE cuentas SET saldo = saldo - 500 WHERE id = 3\nRETURNING WITH (OLD AS o, NEW AS n) o.saldo AS antes, n.saldo AS despues;\n-- => 2300 | 1800"
      },
      {
        nota: "Mover filas entre tablas en UNA sentencia atómica. Este es el idiom que hay que aprender.",
        sql: "WITH movidos AS (\n  DELETE FROM pedidos WHERE creado < '2025-01-01' RETURNING *\n)\nINSERT INTO pedidos_archivo SELECT * FROM movidos;\n-- => INSERT 0 3  (si algo falla, no se borró nada)"
      },
      {
        nota: "Bifurcar: una fuente, dos destinos. Las tres partes ven el mismo snapshot.",
        sql: "WITH entrada AS (\n  INSERT INTO eventos (tipo, payload) VALUES ('pago', '{\"monto\":990}')\n  RETURNING id, payload\n),\nauditoria AS (\n  INSERT INTO bitacora (evento_id, nota) SELECT id, 'ingresado' FROM entrada RETURNING 1\n)\nSELECT id FROM entrada;\n-- => 1 fila con el id; las dos escrituras ocurrieron"
      },
      {
        nota: "Lo que NO puedes hacer: encadenar escrituras que dependan de verse entre sí.",
        sql: "WITH borrado AS (DELETE FROM pedidos WHERE id = 1 RETURNING *)\nSELECT count(*) FROM pedidos;\n-- => 10   (el count NO ve el DELETE: mismo snapshot)"
      }
    ],
    widget: "dmcte",
    cuandoNo: "<p>Una CTE con varias sub-sentencias de escritura ve un SNAPSHOT del inicio: los sub-statements NO se "
      + "ven entre sí como esperarías, y el orden en que corren no está definido.</p>"
      + "<p>No la uses para pipelines de escritura que dependen del orden («primero actualiza el saldo, luego calcula "
      + "el interés sobre el saldo nuevo»). Ahí van sentencias separadas dentro de una transacción, donde cada una sí "
      + "ve lo que hizo la anterior.</p>",
    mito: {
      creencia: "tras un INSERT necesito otro SELECT para el id",
      veredicto: "falso",
      realidad: "<code>RETURNING</code> te lo da. Pero el peso C1 está en la data-modifying CTE: "
        + "<code>WITH movidos AS (DELETE … RETURNING *) INSERT INTO archivo SELECT * FROM movidos</code> mueve filas "
        + "entre tablas en UNA sentencia atómica."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · Data-Modifying Statements in WITH", nota: "La sección con las reglas de snapshot y de orden — el texto que hay que releer.", url: "https://www.postgresql.org/docs/17/queries-with.html#QUERIES-WITH-MODIFYING" },
      { titulo: "PostgreSQL 17 · RETURNING (y OLD/NEW)", nota: "La cláusula en INSERT/UPDATE/DELETE/MERGE, con la sintaxis nueva de old y new.", url: "https://www.postgresql.org/docs/17/dml-returning.html" },
      { titulo: "modern-sql.com · Data change delta (RETURNING)", nota: "Winand: cómo el estándar resuelve esto y qué hace cada motor en su lugar.", url: "https://modern-sql.com/caniuse/insert...returning" }
    ]
  });
})(window.GUIA = window.GUIA || {});
