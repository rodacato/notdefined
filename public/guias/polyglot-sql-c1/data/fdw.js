/* data/fdw.js — 5.1 FDW / dblink */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "fdw",
    titulo: "FDW y dblink",
    dificultad: 2,
    postgresEspecifico: true,
    queEs: "Montar tablas de otra base como si fueran locales y consultarlas en SQL: postgres_fdw para "
      + "tablas foráneas persistentes, dblink para queries ad-hoc.",
    enBreve: [
      { k: "Las piezas", v: "<code>CREATE EXTENSION postgres_fdw</code> → <code>CREATE SERVER</code> → <code>CREATE USER MAPPING</code> → <code>IMPORT FOREIGN SCHEMA</code>." },
      { k: "Pushdown", v: "Predicados, proyección de columnas, <code>ORDER BY</code>, agregados y joins entre tablas del MISMO servidor foráneo se empujan al remoto." },
      { k: "Lo que no se empuja", v: "Joins entre una tabla local y una foránea: las filas viajan y se juntan aquí. Ahí muere el rendimiento." },
      { k: "dblink", v: "Función, no tabla: <code>SELECT * FROM dblink('conn', 'SELECT …') AS t(col tipo)</code>. Declaras los tipos a mano; sin pushdown ni planner." }
    ],
    fundamento: "<p>Cuando los datos viven en dos bases —el monolito y el servicio nuevo, producción y el warehouse— el "
      + "reflejo es escribir código que consulte las dos y las junte en memoria. Funciona, y te deja con paginación, "
      + "filtros y agregaciones implementados a mano en Ruby.</p>"
      + "<p><code>postgres_fdw</code> declara la tabla remota como una tabla más del catálogo local. Desde ahí es SQL "
      + "normal: joins, agregados, vistas, incluso escrituras. El planner sabe que es remota y empuja lo que puede — "
      + "los filtros y las columnas, casi siempre; los joins, solo si ambos lados están en el mismo servidor foráneo.</p>"
      + "<p><code>dblink</code> es el hermano viejo y más crudo: manda una cadena de SQL y te devuelve un conjunto cuyo "
      + "tipo tú declaras. Sirve para lo puntual, para DDL remoto, para llamadas asíncronas. Para consultas normales, "
      + "FDW es mejor porque el planner participa.</p>",
    comoFunciona: [
      {
        nota: "El montaje completo, cuatro sentencias. <code>IMPORT FOREIGN SCHEMA</code> te ahorra declarar tabla por tabla.",
        sql: "CREATE EXTENSION IF NOT EXISTS postgres_fdw;\nCREATE SERVER facturacion FOREIGN DATA WRAPPER postgres_fdw\n  OPTIONS (host 'db-fact.interno', dbname 'facturacion', port '5432');\nCREATE USER MAPPING FOR app SERVER facturacion\n  OPTIONS (user 'lector', password '…');\nIMPORT FOREIGN SCHEMA public LIMIT TO (facturas, notas)\n  FROM SERVER facturacion INTO fact;\n-- => 2 tablas foráneas listas: fact.facturas, fact.notas"
      },
      {
        nota: "Ya montadas, son SQL normal — y el filtro se ejecuta allá, no aquí.",
        sql: "EXPLAIN (VERBOSE) SELECT SUM(total) FROM fact.facturas WHERE emitida_en >= '2026-07-01';\n-- => Foreign Scan  Remote SQL: SELECT sum(total) FROM public.facturas WHERE emitida_en >= …"
      },
      {
        nota: "El join local↔foráneo: aquí las filas cruzan la red. Mira el <code>rows</code> del Foreign Scan antes de confiarte.",
        sql: "EXPLAIN SELECT c.nombre, f.total\nFROM clientes c JOIN fact.facturas f ON f.cliente_id = c.id\nWHERE c.plan = 'enterprise';\n-- => Hash Join  ->  Foreign Scan on fact.facturas (rows=1 200 000)  ← todas viajan"
      },
      {
        nota: "<code>dblink</code> para lo puntual: una query ad-hoc con tipos declarados a mano.",
        sql: "CREATE EXTENSION IF NOT EXISTS dblink;\nSELECT * FROM dblink('dbname=facturacion host=db-fact.interno',\n                     'SELECT id, total FROM facturas WHERE total > 10000')\n  AS t(id bigint, total numeric);\n-- => 8 filas"
      }
    ],
    widget: "fdw-pushdown",
    cuandoNo: "<p>FDW no es para joins pesados cross-servidor de alto volumen: el planner empuja solo parte del trabajo "
      + "(predicados sí, joins complejos no siempre) y la red manda. Un join entre tabla local y foránea trae las filas "
      + "para juntarlas aquí, y ahí se te va la tarde.</p>"
      + "<p>Para eso, réplica o ETL — materializa lo que necesitas del otro lado y consúltalo local — no FDW en "
      + "caliente en el camino del request. Tampoco te da transacciones distribuidas: no hay 2PC entre servidores.</p>",
    mito: {
      creencia: "para juntar datos de dos bases distintas necesito código que consulte cada una y las una en la app",
      veredicto: "falso",
      realidad: "<code>postgres_fdw</code> monta tablas de otra base como si fueran locales y las consultas o joineas "
        + "en SQL; <code>dblink</code> corre queries ad-hoc. El planner empuja filtros y agregados al remoto — el "
        + "trabajo se hace allá, no en tu proceso."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · postgres_fdw", nota: "Opciones del server, pushdown soportado y las notas de costo remoto.", url: "https://www.postgresql.org/docs/17/postgres-fdw.html" },
      { titulo: "PostgreSQL 17 · IMPORT FOREIGN SCHEMA", nota: "Importar el esquema remoto completo o con LIMIT TO / EXCEPT.", url: "https://www.postgresql.org/docs/17/sql-importforeignschema.html" },
      { titulo: "PostgreSQL 17 · dblink", nota: "Las funciones, incluidas las asíncronas, y sus límites frente a FDW.", url: "https://www.postgresql.org/docs/17/dblink.html" }
    ]
  });
})(window.GUIA = window.GUIA || {});
