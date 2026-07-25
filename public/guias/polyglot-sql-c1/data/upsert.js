/* data/upsert.js — 4.1 Upsert (ON CONFLICT / MERGE) */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "upsert",
    titulo: "Upsert (ON CONFLICT)",
    dificultad: 1,
    postgresEspecifico: true,
    queEs: "Insertar-o-actualizar en una sola sentencia atómica, sin SELECT previo y sin la race condition "
      + "que sí tiene el if de tu aplicación.",
    enBreve: [
      { k: "La forma", v: "<code>INSERT … ON CONFLICT (llave) DO UPDATE SET col = EXCLUDED.col</code>. <code>EXCLUDED</code> es la fila que se intentó insertar." },
      { k: "Requisito", v: "Necesita una constraint o índice único REAL sobre las columnas del conflict target. Sin eso, error." },
      { k: "MERGE (PG15+)", v: "Estándar SQL, con <code>WHEN MATCHED</code>/<code>WHEN NOT MATCHED</code>; en PG17 ya trae <code>RETURNING</code> y <code>WHEN NOT MATCHED BY SOURCE</code>." },
      { k: "La diferencia clave", v: "<code>ON CONFLICT</code> es el upsert atómico idempotente. <code>MERGE</code> NO lo es: bajo inserts concurrentes puede levantar <code>unique_violation</code>." }
    ],
    fundamento: "<p>«Insertar si no existe, actualizar si sí» escrito como <code>SELECT</code> + <code>if</code> + "
      + "<code>INSERT</code>/<code>UPDATE</code> es una race condition con pasos extra. Entre tu <code>SELECT</code> y "
      + "tu <code>INSERT</code> cabe otra transacción, y en producción cabe seguido: contadores de visitas, "
      + "sincronización de un webhook que llega dos veces, importadores que corren en paralelo.</p>"
      + "<p><code>ON CONFLICT</code> mueve la decisión al motor, que ya tiene el índice único como punto de "
      + "serialización. Una sentencia, sin transacción explícita, idempotente: puedes correrla mil veces y el estado "
      + "final es el mismo. Eso es lo que hace que sea la herramienta correcta para consumidores de eventos.</p>"
      + "<p><code>MERGE</code> es más expresivo — insert, update y delete condicionales en una sola pasada contra una "
      + "fuente — y es estándar. Pero resuelve otro problema: reconciliar dos conjuntos, no absorber escrituras "
      + "concurrentes sobre la misma llave.</p>",
    comoFunciona: [
      {
        nota: "El upsert de todos los días. <code>EXCLUDED</code> trae los valores propuestos.",
        sql: "INSERT INTO paginas (ruta, visitas, visto_en)\nVALUES ('/precios', 1, now())\nON CONFLICT (ruta) DO UPDATE\n  SET visitas = paginas.visitas + 1,\n      visto_en = EXCLUDED.visto_en\nRETURNING ruta, visitas;\n-- => /precios | 2   (la segunda vez que corre)"
      },
      {
        nota: "<code>DO NOTHING</code> para «insértalo si no está» — y nada más. Sin <code>RETURNING</code> no sabes si insertó.",
        sql: "INSERT INTO tags (nombre) VALUES ('sql') ON CONFLICT DO NOTHING RETURNING id;\n-- => 0 filas si ya existía; 1 fila con el id si insertó"
      },
      {
        nota: "Índice PARCIAL: hay que repetir el predicado en el conflict target o no matchea.",
        sql: "CREATE UNIQUE INDEX u_email_vivos ON usuarios (email) WHERE borrado_en IS NULL;\n\nINSERT INTO usuarios (email, nombre) VALUES ('a@b.mx', 'Ana')\nON CONFLICT (email) WHERE borrado_en IS NULL DO UPDATE SET nombre = EXCLUDED.nombre;\n-- => UPDATE 1  (sin el WHERE: ERROR, no unique or exclusion constraint matching)"
      },
      {
        nota: "<code>MERGE</code> (PG17) para reconciliar contra una fuente, incluido lo que YA no viene en ella.",
        sql: "MERGE INTO inventario i\nUSING carga_del_dia c ON c.sku = i.sku\nWHEN MATCHED AND c.cantidad = 0 THEN DELETE\nWHEN MATCHED THEN UPDATE SET cantidad = c.cantidad\nWHEN NOT MATCHED THEN INSERT (sku, cantidad) VALUES (c.sku, c.cantidad)\nWHEN NOT MATCHED BY SOURCE THEN UPDATE SET cantidad = 0\nRETURNING merge_action(), i.sku;\n-- => una fila por acción: INSERT/UPDATE/DELETE con su sku"
      }
    ],
    widget: "upsert",
    cuandoNo: "<p><code>ON CONFLICT</code> necesita una constraint o índice único real; sobre un índice PARCIAL "
      + "(<code>UNIQUE … WHERE deleted_at IS NULL</code>) tienes que repetir el predicado en "
      + "<code>ON CONFLICT (…) WHERE …</code> o no matchea.</p>"
      + "<p>Y no uses <code>DO NOTHING</code> para tragarte errores que en realidad querías ver: «no truena» no es lo "
      + "mismo que «funcionó», y un importador que silencia conflictos es un importador que pierde datos sin decírtelo.</p>",
    mito: {
      creencia: "insertar-o-actualizar es un SELECT, un if en la app, y luego INSERT o UPDATE — y rezar que no haya carrera",
      veredicto: "falso y peligroso · la carrera existe",
      realidad: "<code>INSERT … ON CONFLICT (llave) DO UPDATE SET …</code> lo hace atómico en el motor. "
        + "<code>MERGE</code> (PG15+) cubre casos más ricos — insert/update/delete condicional, y en PG17 con "
        + "<code>RETURNING</code> y <code>WHEN NOT MATCHED BY SOURCE</code> — PERO no es el upsert atómico idempotente "
        + "que sí es <code>ON CONFLICT</code>."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · INSERT … ON CONFLICT", nota: "El conflict target, EXCLUDED, índices parciales y las reglas de arbitraje.", url: "https://www.postgresql.org/docs/17/sql-insert.html#SQL-ON-CONFLICT" },
      { titulo: "PostgreSQL 17 · MERGE", nota: "La sentencia estándar, sus cláusulas WHEN y la nota explícita sobre concurrencia.", url: "https://www.postgresql.org/docs/17/sql-merge.html" },
      { titulo: "modern-sql.com · MERGE vs upsert", nota: "Winand compara el estándar con los dialectos y marca dónde cada uno miente.", url: "https://modern-sql.com/caniuse/merge" }
    ]
  });
})(window.GUIA = window.GUIA || {});
