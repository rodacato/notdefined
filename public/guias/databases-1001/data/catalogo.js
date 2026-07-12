/* data/catalogo.js — FUENTE DE VERDAD del almanaque.
   El folio de cada tipo y su familia viven aquí y solo aquí; las fichas
   y las vistas lo respetan. Agregar un tipo = tocar este archivo + su ficha. */
(function (G) {
  'use strict';

  // Familias. Los colores son CONTRATO FIJO de codificación de datos:
  // idénticos en claro y oscuro, saturación media (funcionan sobre manila y
  // sobre verde botella). No son cromo, no se tocan por tema.
  G.familias = [
    { id: 'oltp',      nombre: 'Fila por fila',            sub: 'OLTP · transaccional',      color: '#C4633A' },
    { id: 'escala',    nombre: 'Acceso simple a escala',   sub: 'clave directa, sin joins',  color: '#2E8A86' },
    { id: 'analitica', nombre: 'Analítica y tiempo',       sub: 'leer mucho, agregar',       color: '#8A5296' },
    { id: 'forma',     nombre: 'Por la forma del dato',    sub: 'la estructura manda',       color: '#4E6BA8' }
  ];

  // Los 7 ejes fijos de rating (0–7). El orden es el que se dibuja.
  G.ejes = [
    { id: 'point',    label: 'Point lookups' },
    { id: 'write',    label: 'Escritura masiva' },
    { id: 'analytics',label: 'Consultas analíticas' },
    { id: 'horiz',    label: 'Escalado horizontal' },
    { id: 'schema',   label: 'Flexibilidad de esquema' },
    { id: 'tx',       label: 'Transacciones / consistencia' },
    { id: 'ops',      label: 'Simplicidad operativa' }
  ];

  // Dolores para el catálogo problema-primero. Cada tipo se etiqueta con los
  // que resuelve bien (ver campo `dolores` en cada ficha).
  G.dolores = [
    { id: 'clave-ms',    label: 'Lecturas por clave en milisegundos' },
    { id: 'agg-billones',label: 'Agregaciones sobre miles de millones de filas' },
    { id: 'esquema',     label: 'Esquema que cambia cada sprint' },
    { id: 'relaciones',  label: 'Relaciones profundas' },
    { id: 'typos',       label: 'Búsqueda con typos' },
    { id: 'ai',          label: 'Features de AI / similitud' },
    { id: 'write-masivo',label: 'Escritura masiva sostenida' },
    { id: 'sin-operar',  label: 'No quiero operar nada' },
    { id: 'consistencia',label: 'Consistencia fuerte a escala' },
    { id: 'auditoria',   label: 'Auditoría inmutable' }
  ];

  // El catálogo: folio, familia, slug, nombre, arquetipo, estrella, tagline.
  // El contenido largo de cada uno vive en data/fichas-<familia>.js.
  G.catalogo = [
    { folio: '01', familia: 'oltp',      slug: 'relacional',  nombre: 'Relacional',                arquetipo: 'PostgreSQL · MySQL',            estrella: true,  tagline: 'La opción por defecto. Filas, esquema, joins, ACID.' },
    { folio: '02', familia: 'oltp',      slug: 'embebida',    nombre: 'Embebida',                  arquetipo: 'SQLite · DuckDB embebido',      estrella: false, tagline: 'La base de datos que es un archivo. Cero servidor.' },
    { folio: '03', familia: 'oltp',      slug: 'newsql',      nombre: 'SQL distribuido · NewSQL',  arquetipo: 'CockroachDB · Spanner',         estrella: false, tagline: 'SQL y ACID que sobreviven a que se caiga una región.' },

    { folio: '04', familia: 'escala',    slug: 'clave-valor', nombre: 'Clave-valor',               arquetipo: 'Redis · DynamoDB',              estrella: true,  tagline: 'Un diccionario gigante. Le das la llave, te da el valor.' },
    { folio: '05', familia: 'escala',    slug: 'documento',   nombre: 'Documento',                 arquetipo: 'MongoDB',                       estrella: true,  tagline: 'El registro entero vive en un JSON. Sin esquema rígido.' },
    { folio: '06', familia: 'escala',    slug: 'wide-column', nombre: 'Wide-column',               arquetipo: 'Cassandra · Bigtable',          estrella: false, tagline: 'Clave-valor que escribe torrentes. NO es columnar.' },

    { folio: '07', familia: 'analitica', slug: 'columnar',    nombre: 'Columnar OLAP',             arquetipo: 'ClickHouse · DuckDB',           estrella: true,  tagline: 'Guarda por columna. Agrega miles de millones de filas.' },
    { folio: '08', familia: 'analitica', slug: 'time-series', nombre: 'Time-series',               arquetipo: 'TimescaleDB · InfluxDB · QuestDB', estrella: false, tagline: 'El tiempo es el eje. Ingesta brutal, ventanas y downsampling.' },

    { folio: '09', familia: 'forma',     slug: 'grafo',       nombre: 'Grafo',                     arquetipo: 'Neo4j',                         estrella: false, tagline: 'Nodos y aristas de primera clase. El join es el modelo.' },
    { folio: '10', familia: 'forma',     slug: 'busqueda',    nombre: 'Búsqueda · índice invertido', arquetipo: 'Elasticsearch · OpenSearch',  estrella: false, tagline: 'De término a documentos. Relevancia, typos, facetas.' },
    { folio: '11', familia: 'forma',     slug: 'vectorial',   nombre: 'Vectorial',                 arquetipo: 'pgvector · dedicadas',          estrella: false, tagline: 'Guarda significado como coordenadas. Vecinos cercanos.' },
    { folio: '12', familia: 'forma',     slug: 'ledger',      nombre: 'Ledger · inmutable',        arquetipo: 'QLDB · immudb',                 estrella: false, tagline: 'Nicho. Historial criptográfico que nadie reescribe.' }
  ];

  // Índice slug → entrada de catálogo, para búsquedas O(1).
  G.porSlug = {};
  G.catalogo.forEach(function (t) { G.porSlug[t.slug] = t; });

  G.familiaDe = function (id) {
    return G.familias.find(function (f) { return f.id === id; });
  };
})(window.GUIA = window.GUIA || {});
