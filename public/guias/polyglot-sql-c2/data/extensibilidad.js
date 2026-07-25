/* ============================================================================
   data/extensibilidad.js — Ficha 14 · Extensibilidad. Cierra el arco.
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.extensibilidad = {
    slug: "extensibilidad",

    queEs: [
      "Todo el motor que acabas de recorrer está construido sobre puntos de extensión públicos. Los tipos de índice del bloque 1 no son casos especiales del código: son <em>access methods</em> registrados en el catálogo, por la misma interfaz que puede usar cualquiera.",
      "«Postgres para todo» no es terquedad de sus usuarios. Es que la plataforma lo permite por diseño."
    ],

    enBreve: [
      "Los índices de la ficha 02 están registrados en <code>pg_am</code> como cualquier extensión los registraría. Desde PG12 hasta el <b>almacenamiento</b> es un access method (<code>heap</code> es uno de ellos).",
      "Puntos de extensión: tipos de dato con sus <b>operator classes</b>, funciones, lenguajes procedurales (<code>PL/pgSQL</code>, <code>PL/Python</code>…), <b>foreign data wrappers</b>, hooks de planner y executor, y background workers.",
      "Una extensión es un paquete versionado: <code>CREATE EXTENSION</code> la instala en el esquema que le digas, <code>ALTER EXTENSION ... UPDATE</code> la migra, y <code>pg_available_extensions</code> lista lo que tienes a la mano.",
      "Los tres casos que la gente cree que exigen otra base — vectores, geo, series de tiempo — son <b>pgvector</b>, <b>PostGIS</b> y <b>TimescaleDB</b>: el mismo motor, el mismo MVCC, el mismo WAL."
    ],

    fundamento: [
      { p: "El truco de fondo es que en Postgres <b>el catálogo es datos</b>. Qué tipos existen, qué operadores hay, qué índice sabe responder qué operador, qué función implementa cada cosa: todo eso son filas en tablas del sistema, no <code>switch</code> compilados. Extender el motor es, literalmente, insertar filas en el catálogo y apuntar a código." },
      { p: "Por eso el planner de la ficha 03 puede cotizar un índice HNSW de <code>pgvector</code> — que no existía cuando se escribió el planner — exactamente igual que un B-tree. No hubo que enseñarle nada: le pregunta al catálogo qué operator classes existen y qué operadores cubren. La ficha 02 describía un mecanismo genérico, y esta ficha te dice quién más lo usa." },
      { p: "Ahí está el cierre del arco. Cada capa que recorriste — el pipeline, los índices, el planner, MVCC, el WAL, las páginas, el buffer manager — es una capa que una extensión hereda gratis. Un tipo de dato nuevo obtiene MVCC sin escribir una línea; un índice nuevo obtiene durabilidad porque escribe al WAL como todos. <b>Extender Postgres no es rodearlo: es enchufarse a lo mismo que usa su propio código.</b>" }
    ],

    comoFunciona: [
      { p: "<b>Los access methods, en el catálogo.</b> La lista completa de lo que tu servidor sabe hacer, y la sorpresa de la última fila:" },
      { code: { tag: "SQL", caption: "pg_am · los índices de la ficha 02 son filas de una tabla", text:
"SELECT amname, amtype FROM pg_am ORDER BY amtype, amname;\n" +
"\n" +
" amname | amtype\n" +
"--------+--------\n" +
" brin   | i        i = index access method\n" +
" btree  | i\n" +
" gin    | i\n" +
" gist   | i\n" +
" hash   | i\n" +
" spgist | i\n" +
" heap   | t        t = TABLE access method\n" +
"\n" +
"-- Hasta el almacenamiento en heap (fichas 10 y 11) es enchufable desde\n" +
"-- PG12. \"La tabla\" también es una implementación entre varias posibles."
      }},
      { p: "<b>Una extensión registrando su propio índice.</b> Aquí es donde el arco se cierra de verdad — <code>pgvector</code> no pide permiso especial, usa la misma puerta que el B-tree:" },
      { code: { tag: "SQL", caption: "pgvector · un access method nuevo y su operator class", text:
"CREATE EXTENSION vector;\n" +
"\n" +
"CREATE TABLE docs (id bigserial PRIMARY KEY, embedding vector(1536));\n" +
"CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);\n" +
"\n" +
"SELECT amname, amtype FROM pg_am WHERE amname IN ('hnsw', 'ivfflat');\n" +
" amname | amtype\n" +
"--------+--------\n" +
" hnsw   | i\n" +
" ivfflat| i\n" +
"\n" +
"EXPLAIN SELECT id FROM docs ORDER BY embedding <=> $1 LIMIT 10;\n" +
"                              QUERY PLAN\n" +
"----------------------------------------------------------------------\n" +
" Limit  (cost=0.42..8.61 rows=10 width=16)\n" +
"   ->  Index Scan using docs_embedding_idx on docs\n" +
"         (cost=0.42..3204.18 rows=4000 width=16)\n" +
"         Order By: (embedding <=> $1)\n" +
"\n" +
"-- El planner cotiza este índice como cualquier otro. \"vector_cosine_ops\"\n" +
"-- es la operator class que le dice qué operadores puede responder:\n" +
"-- exactamente el mecanismo de la ficha 02, usado por código de terceros."
      }},
      { p: "Y ese índice hereda todo lo demás sin pedirlo: sus páginas pasan por el buffer manager (ficha 12), sus cambios se escriben al WAL y sobreviven un crash (ficha 09), y sus tuples respetan MVCC (ficha 05)." },
      { p: "<b>Foreign data wrappers.</b> Otra tabla del catálogo, otro punto de extensión — y otra vez el planner participando:" },
      { code: { tag: "SQL", caption: "postgres_fdw · el planner empuja el filtro al servidor remoto", text:
"CREATE EXTENSION postgres_fdw;\n" +
"CREATE SERVER remoto FOREIGN DATA WRAPPER postgres_fdw\n" +
"  OPTIONS (host 'db2.interno', dbname 'ventas');\n" +
"IMPORT FOREIGN SCHEMA public LIMIT TO (facturas)\n" +
"  FROM SERVER remoto INTO ext;\n" +
"\n" +
"EXPLAIN (VERBOSE) SELECT count(*) FROM ext.facturas WHERE total > 500;\n" +
"                              QUERY PLAN\n" +
"----------------------------------------------------------------------\n" +
" Foreign Scan  (cost=102.84..102.85 rows=1 width=8)\n" +
"   Relations: Aggregate on (ext.facturas)\n" +
"   Remote SQL: SELECT count(*) FROM public.facturas\n" +
"               WHERE ((total > 500))\n" +
"\n" +
"-- No trajo las filas para contarlas aquí: empujó el filtro Y el count\n" +
"-- al otro servidor. Un FDW participa en el modelo de costo de la ficha 03."
      }},
      { p: "<b>Qué tienes disponible.</b> Antes de meter otra pieza de infraestructura, vale la pena revisar la lista:" },
      { code: { tag: "SQL", caption: "el inventario de tu servidor", text:
"SELECT name, default_version, installed_version, left(comment, 42)\n" +
"  FROM pg_available_extensions\n" +
" WHERE name IN ('vector','postgis','pg_stat_statements','pg_trgm','hstore')\n" +
" ORDER BY name;\n" +
"\n" +
"        name        | default_version | installed_version |          left\n" +
"--------------------+-----------------+-------------------+----------------------\n" +
" pg_stat_statements | 1.11            | 1.11              | track planning and ex\n" +
" pg_trgm            | 1.6             |                   | text similarity measu\n" +
" postgis            | 3.4.2           |                   | PostGIS geometry and\n" +
" vector             | 0.7.4           | 0.7.4             | vector data type and\n" +
"\n" +
"-- installed_version vacío = está disponible pero no instalada."
      }},
      { p: "<b>Los límites, para no venderte humo.</b> Una extensión no es magia: hereda las propiedades del motor, buenas y malas. <code>pgvector</code> hereda el modelo de escritura de Postgres, así que una carga masiva de embeddings pesa lo que pesa. TimescaleDB no convierte el proceso-por-conexión de la ficha 13 en otra cosa. Y en un servicio administrado no puedes instalar lo que quieras: la lista la decide tu proveedor. La pregunta «¿me alcanza con una extensión o de verdad necesito otro <em>tipo</em> de base?» es una pregunta legítima — y es de otra guía, no de esta." }
    ],

    cuandoDuele: {
      sym: "Síntoma: la extensión existe, pero tu proveedor administrado no la tiene",
      paras: [
        "Diseñaste sobre una extensión que resuelve tu problema con elegancia y a la hora de desplegar descubres que tu servicio administrado no la ofrece — porque muchas requieren código nativo con privilegios que el proveedor no concede.",
        "El otro dolor es el de las <b>versiones</b>: una extensión con código C está atada a la versión mayor de Postgres. Un upgrade de 17 a 18 no es solo el motor, es esperar a que <em>cada</em> extensión tenga su build compatible — y con una en el camino crítico, tu calendario de upgrades ya no es tuyo. La disciplina es sencilla: verifica disponibilidad y política de versiones <b>antes</b> de diseñar encima, no después."
      ]
    },

    mito: {
      claim: "para vectores, geo o series de tiempo necesitas otra base",
      truth: "Falso la mayoría de las veces: son <b>extensiones sobre el mismo motor</b> — pgvector, PostGIS, TimescaleDB — con el mismo MVCC, el mismo WAL y el mismo planner que acabas de recorrer. Meter otra base de datos también trae su costo: otra cosa que operar, respaldar, monitorear y mantener consistente. Con sus límites reales, la respuesta correcta suele ser una extensión, no un sistema más.",
      more: [
        { html: "<b>«Una extensión es un parche por fuera del motor.»</b> No: usa los mismos puntos de extensión que el código propio de Postgres. Un índice de extensión se registra en <code>pg_am</code> junto al B-tree y el planner lo cotiza igual." },
        { html: "<b>«Si es una extensión, no es de verdad transaccional.»</b> Sí lo es: hereda MVCC y WAL del motor. Un <code>INSERT</code> en una tabla de PostGIS es tan durable y tan versionado como cualquier otro." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Extending SQL (Chapter 38) + CREATE EXTENSION", note: "Tipos, operadores, operator classes y cómo se empaqueta todo en una extensión versionada." },
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Table & Index Access Method Interfaces (60, 64)", note: "Las dos interfaces que hacen enchufable el almacenamiento y los índices. Densas y reveladoras." },
      { kind: "Charla / Web", title: "PGConf — «Postgres is a platform», charlas de pgconf.dev", note: "El argumento completo con casos reales: cuándo una extensión alcanza y cuándo de verdad no." }
    ]
  };

})(window.GUIA = window.GUIA || {});
