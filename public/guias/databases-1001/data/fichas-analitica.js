/* data/fichas-analitica.js — Familia «Analítica y tiempo». */
(function (G) {
  'use strict';
  G.fichas = G.fichas || {};

  G.fichas['columnar'] = {
    queEs: 'Da vuelta al disco: guarda por columna, no por fila. Nació para leer miles de millones de filas y agregarlas — sumar, promediar, agrupar — a velocidades imposibles para un row store.',
    comoGuarda: 'Cada columna se guarda contigua y por separado: todos los «monto» juntos, todos los «region» juntos. Una agregación lee SOLO las columnas que toca y salta el resto del disco. Como una columna es un tipo homogéneo, comprime durísimo (5–10× típico), así que además lees menos bytes.',
    modeloConsulta: 'SQL analítico: GROUP BY, agregados, ventanas, sobre rangos enormes. No está pensado para traer una fila por su llave (ahí sufre: tiene que juntar la fila de muchos archivos de columna).',
    gana: ['Agregaciones sobre tablas gigantes: 10–1,000× más rápido que row', 'Compresión brutal (5–10×): menos disco, menos I/O', 'Escala a miles de millones de filas cómodamente', 'Escaneos de columnas específicas casi gratis'],
    paga: ['Point lookups y updates fila-a-fila: lento (no es lo suyo)', 'Escrituras de a una fila son ineficientes: quiere lotes', 'Consistencia transaccional fila-a-fila no es su fuerte'],
    cuandoNo: ['OLTP: pedidos, carritos, usuarios — cualquier cosa fila-a-fila', 'Cuando lees y escribes registros individuales todo el tiempo'],
    parientes: 'LA confusión de la colección: columnar (OLAP, ClickHouse) vs wide-column (OLTP, Cassandra). Suena igual, hace lo opuesto. Pariente del time-series (que es columnar especializado en el eje tiempo). Convive con tu OLTP: los datos llegan por ETL/CDC.',
    arquetipo: 'ClickHouse para analítica a escala autohospedada. DuckDB para analítica embebida/local (el «SQLite del OLAP»). BigQuery, Snowflake, Redshift en la nube. Databricks/Parquet para el lago. No reemplaza tu Postgres: lo complementa.',
    ratings: { point: 2, write: 4, analytics: 7, horiz: 6, schema: 3, tx: 2, ops: 4 },
    dolores: ['agg-billones'],
    veredicto: 'Cuando un dashboard tarda 40 segundos en Postgres, no es que Postgres esté mal: es que le pediste OLAP a un motor OLTP.'
  };

  G.fichas['time-series'] = {
    queEs: 'El tiempo es el eje protagonista. Métricas, telemetría, sensores, precios: datos que solo crecen, casi siempre append-only, y que consultas por ventanas de tiempo.',
    comoGuarda: 'Particiona por tiempo (chunks/hypertables) y casi siempre guarda por columna dentro de cada chunk. Los datos viejos se comprimen y hacen downsampling; los recientes viven calientes. La ingesta es append puro, así que escribe a millones de filas por segundo.',
    modeloConsulta: 'SQL o DSL con superpoderes temporales: buckets de tiempo, agregados continuos, gap-filling, retención automática. Todo gira alrededor de «entre este momento y este otro».',
    gana: ['Ingesta bestial: millones de filas/seg', 'Consultas por ventana de tiempo y downsampling nativos', 'Retención y compresión automáticas del dato viejo', 'Agregados continuos precalculados'],
    paga: ['Fuera del eje tiempo, es una base normal (o peor)', 'Updates y deletes arbitrarios van a contracorriente', 'Cardinalidad alta puede doler (según el motor)'],
    cuandoNo: ['Datos que no son fundamentalmente temporales', 'Cuando en realidad una tabla con una columna timestamp bastaba'],
    parientes: 'La confusión: «time-series vs una tabla con timestamp». Una columna de fecha NO te da una time-series DB: te faltan buckets, retención, downsampling e ingesta optimizada. Pariente del columnar (comparte el guardar por columna). TimescaleDB literalmente vive sobre Postgres.',
    arquetipo: 'TimescaleDB si quieres quedarte en Postgres (hypertables, millones de filas/seg). InfluxDB 3 para cardinalidad ilimitada. QuestDB por velocidad de ingesta. Prometheus para métricas de infra. Empieza con Timescale si ya usas Postgres.',
    ratings: { point: 4, write: 7, analytics: 6, horiz: 5, schema: 3, tx: 4, ops: 5 },
    dolores: ['write-masivo', 'agg-billones'],
    veredicto: 'Si tu dato tiene un timestamp Y solo crece Y lo consultas por ventanas, esto te ahorra reinventar medio motor. Si no, es una tabla con fecha.'
  };
})(window.GUIA = window.GUIA || {});
