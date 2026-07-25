/* data/jsonb.js — 5.2 JSON / JSONB de uso */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "jsonb",
    titulo: "JSONB de uso",
    dificultad: 2,
    queEs: "Consultar, filtrar y expandir JSON DENTRO de la query: operadores clásicos, JSONPath, y los "
      + "estándar SQL/JSON que llegaron en PG17.",
    enBreve: [
      { k: "Operadores", v: "<code>-&gt;</code> devuelve jsonb, <code>-&gt;&gt;</code> devuelve text, <code>#&gt;&gt;</code> toma una ruta como arreglo. Confundir <code>-&gt;</code> con <code>-&gt;&gt;</code> es el error #1." },
      { k: "Contención", v: "<code>@&gt;</code> «contiene», <code>?</code> «tiene esta llave», <code>@?</code> «esta ruta JSONPath encuentra algo». Los tres son indexables con GIN." },
      { k: "PG17 estándar", v: "<code>JSON_TABLE</code> expande JSON a filas; <code>JSON_VALUE</code>, <code>JSON_QUERY</code> y <code>JSON_EXISTS</code> extraen con JSONPath." },
      { k: "jsonb vs json", v: "<code>jsonb</code> es binario, normaliza llaves, deduplica y es indexable. <code>json</code> conserva el texto original. Usa <code>jsonb</code> salvo que necesites el texto tal cual." }
    ],
    fundamento: "<p>Un <code>jsonb</code> no es un blob: es un valor estructurado que el motor entiende. Puedes filtrar "
      + "por un campo anidado, ordenar por él, agrupar por él, expandirlo a filas y volverlo a armar — todo en SQL. "
      + "Traerse la columna completa para hacer <code>JSON.parse</code> y filtrar en la app es tirar el índice y la red "
      + "a la basura.</p>"
      + "<p>Hay dos generaciones de sintaxis conviviendo. La clásica de Postgres (<code>-&gt;&gt;</code>, "
      + "<code>@&gt;</code>, <code>jsonb_to_recordset</code>) es la que verás en todo el código existente. La estándar "
      + "SQL/JSON (<code>JSON_TABLE</code>, <code>JSON_VALUE</code>, <code>JSON_EXISTS</code>), completada en PG17, es "
      + "más verbosa y más portable — y <code>JSON_TABLE</code> es genuinamente mejor que su antecesor para expandir "
      + "arreglos con varias columnas.</p>"
      + "<p>La decisión de diseño sigue siendo la de siempre: qué merece ser columna. <code>jsonb</code> es para lo "
      + "genuinamente variable — payloads de webhooks, atributos por tipo de producto, snapshots — no para ahorrarte "
      + "una migración.</p>",
    comoFunciona: [
      {
        nota: "Extraer y filtrar dentro. Nota <code>-&gt;&gt;</code> (text) para comparar y <code>-&gt;</code> (jsonb) para seguir bajando.",
        sql: "SELECT id, payload ->> 'tipo' AS tipo, (payload -> 'monto')::numeric AS monto\nFROM eventos\nWHERE payload ->> 'tipo' = 'pago'\n  AND (payload -> 'monto')::numeric > 500;\n-- => 2 filas: 84121|pago|990 · 84130|pago|1200"
      },
      {
        nota: "Contención y JSONPath, los dos que aprovechan un índice GIN.",
        sql: "SELECT count(*) FROM eventos WHERE payload @> '{\"tipo\":\"pago\",\"moneda\":\"MXN\"}';\n-- => 12\nSELECT count(*) FROM eventos WHERE payload @? '$.renglones[*] ? (@.cantidad > 3)';\n-- => 4"
      },
      {
        nota: "<code>JSON_TABLE</code> (PG17): expandir un arreglo anidado a filas con columnas tipadas, en el <code>FROM</code>.",
        sql: "SELECT e.id, r.sku, r.cantidad\nFROM eventos e,\n     JSON_TABLE(e.payload, '$.renglones[*]' COLUMNS (\n       sku text PATH '$.sku',\n       cantidad int PATH '$.cantidad'\n     )) AS r\nWHERE e.id = 84121;\n-- => 2 filas: 84121|A-1|2 · 84121|B-7|1"
      },
      {
        nota: "Armar JSON de salida: una fila por pedido con sus renglones anidados, listo para el front.",
        sql: "SELECT jsonb_build_object(\n         'pedido', p.id,\n         'renglones', jsonb_agg(jsonb_build_object('sku', r.sku) ORDER BY r.sku)\n       ) AS doc\nFROM pedidos p JOIN renglones r ON r.pedido_id = p.id\nGROUP BY p.id;\n-- => {\"pedido\": 84121, \"renglones\": [{\"sku\":\"A-1\"},{\"sku\":\"B-7\"}]}"
      }
    ],
    widget: "jsonb-dentro",
    cuandoNo: "<p>Si el esquema es estable y conocido, columnas normales le ganan a <code>jsonb</code> en claridad, "
      + "integridad (puedes poner constraints y llaves foráneas de verdad) y velocidad.</p>"
      + "<p><code>jsonb</code> no es excusa para no modelar. Y ojo con la cardinalidad: el planner estima mal dentro de "
      + "un jsonb, así que un filtro selectivo sobre un campo anidado puede producir planes malos aunque el índice "
      + "exista. Indexar jsonb con GIN es «SQL a fondo» (C2); aquí, el uso de las consultas.</p>",
    mito: {
      creencia: "un jsonb es un blob: lo guardas y lo lees entero; el filtrado se hace en la app",
      veredicto: "falso",
      realidad: "Consultas y filtras DENTRO. En breve (PG17): <code>JSON_TABLE</code> expande JSON a filas (el modo SQL "
        + "estándar del clásico <code>jsonb_to_recordset</code>), y <code>JSON_VALUE</code>/<code>JSON_QUERY</code>/"
        + "<code>JSON_EXISTS</code> extraen con JSONPath."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · JSON Functions and Operators", nota: "El catálogo completo: operadores, JSONPath, JSON_TABLE y las funciones de construcción.", url: "https://www.postgresql.org/docs/17/functions-json.html" },
      { titulo: "PostgreSQL 17 · JSON Types", nota: "json vs jsonb, normalización, y las notas de diseño sobre cuándo usar cada uno.", url: "https://www.postgresql.org/docs/17/datatype-json.html" },
      { titulo: "modern-sql.com · SQL/JSON y JSON_TABLE", nota: "Winand: qué parte del estándar SQL/JSON implementa cada motor, con las trampas de sintaxis.", url: "https://modern-sql.com/blog/2017-06/whats-new-in-sql-2016" }
    ]
  });
})(window.GUIA = window.GUIA || {});
