/* data/desambiguacion.js — Guión de la sección de desambiguación.
   Las confusiones de nombres que cuestan malas decisiones. Cada una: dos
   lados enfrentados y LA clave que los separa. La primera es la madre. */
(function (G) {
  'use strict';

  G.desambiguaciones = [
    {
      id: 'wide-vs-columnar',
      madre: true,
      titulo: 'Wide-column vs columnar',
      gancho: 'La madre de todas las confusiones: nombres gemelos, workloads opuestos.',
      ladoA: { nombre: 'Wide-column', ej: 'Cassandra · Bigtable', que: 'OLTP de escritura clave-valor. Guarda filas con millones de columnas dinámicas y traga torrentes de escrituras vía LSM.', workload: 'Escribir muchísimo, leer por llave.' },
      ladoB: { nombre: 'Columnar (OLAP)', ej: 'ClickHouse · DuckDB', que: 'Analítico. Guarda cada columna por separado para agregar miles de millones de filas leyendo solo lo que toca.', workload: 'Leer y agregar muchísimo.' },
      clave: 'Los dos hablan de «columnas», pero wide-column es para ESCRIBIR a escala (transaccional) y columnar es para LEER y agregar (analítico). Suenan igual; hacen lo contrario.',
      veredicto: 'Elegir Cassandra para analítica es comprar un tráiler para ir por tortillas.'
    },
    {
      id: 'nosql',
      titulo: '«NoSQL» no es un tipo',
      gancho: 'Es una etiqueta de mercadeo, no un modelo de datos.',
      ladoA: { nombre: 'Lo que la gente dice', ej: '«usemos NoSQL»', que: 'Como si «NoSQL» fuera UNA cosa que se elige. No lo es: no describe cómo guardas ni cómo consultas.', workload: 'Ninguno en concreto.' },
      ladoB: { nombre: 'Lo que en realidad hay', ej: 'clave-valor · documento · wide-column · grafo', que: 'Cuatro modelos distintos con workloads que no se tocan, agrupados solo por «no ser SQL relacional».', workload: 'Uno distinto por cada uno.' },
      clave: 'Decir «NoSQL» no decide nada. La pregunta útil es cuál de los cuatro modelos —y para qué acceso—, no «SQL o NoSQL».',
      veredicto: 'Cuando alguien diga «necesitamos NoSQL», pregunta «¿cuál, y para qué query?». Casi siempre se descubre que era Postgres con jsonb.'
    },
    {
      id: 'doc-vs-kv',
      titulo: 'Documento vs clave-valor',
      gancho: 'Ambos guardan «un valor por llave». La diferencia es si miran dentro.',
      ladoA: { nombre: 'Clave-valor', ej: 'Redis · DynamoDB', que: 'El valor es opaco: le das la llave, te da el blob. No indexa ni consulta el interior.', workload: 'Acceso por llave, punto.' },
      ladoB: { nombre: 'Documento', ej: 'MongoDB', que: 'El valor es un JSON cuyo interior SÍ se indexa y consulta: filtras por campos anidados.', workload: 'Consultar por dentro del documento.' },
      clave: 'Si necesitas preguntar por un campo dentro del valor, es documento. Si siempre conoces la llave exacta y el valor es opaco, es clave-valor.',
      veredicto: 'La pregunta decisiva: ¿vas a consultar por algo que no sea la llave? Sí → documento. No → clave-valor.'
    },
    {
      id: 'ts-vs-timestamp',
      titulo: 'Time-series vs «tabla con timestamp»',
      gancho: 'Tener una columna de fecha no te da una time-series DB.',
      ladoA: { nombre: 'Tabla con timestamp', ej: 'una columna created_at', que: 'Una tabla relacional normal con fecha. Sirve para volúmenes modestos y consultas simples por rango.', workload: 'Poco volumen, consultas ocasionales.' },
      ladoB: { nombre: 'Time-series DB', ej: 'TimescaleDB · InfluxDB', que: 'Particionado por tiempo, ingesta masiva, buckets, downsampling y retención automáticos.', workload: 'Ingesta brutal, ventanas de tiempo.' },
      clave: 'La time-series DB te da buckets, retención y compresión que una columna de fecha no. Pero si no ingieres torrentes ni consultas por ventanas, la columna basta.',
      veredicto: 'No traigas una time-series DB por tener fechas. Tráela cuando la ingesta y las ventanas de tiempo sean el problema.'
    },
    {
      id: 'vec-vs-pgvector',
      titulo: 'Vectorial dedicada vs pgvector',
      gancho: 'La confusión de moda con las features de AI.',
      ladoA: { nombre: 'pgvector', ej: 'extensión de Postgres', que: 'Vectores dentro de tu Postgres: transaccional, mismo tooling, cero base nueva. Cómodo hasta decenas de millones de vectores por instancia.', workload: 'Similitud + tu dato relacional, junto.' },
      ladoB: { nombre: 'Vectorial dedicada', ej: 'Qdrant · Pinecone · Milvus', que: 'Motor especializado en ANN a gran escala, con features específicas de vectores.', workload: 'Cientos de millones de vectores o features dedicadas.' },
      clave: 'pgvector es el camino simple y casi siempre alcanza. Las dedicadas ganan a escala grande o con necesidades muy específicas de vectores.',
      veredicto: 'Empieza en pgvector y salta a una dedicada cuando un número (recall, latencia, escala) te empuje. No al revés.'
    },
    {
      id: 'newsql-vs-replicas',
      titulo: 'NewSQL vs réplicas de lectura',
      gancho: 'Las dos «escalan», pero cosas distintas.',
      ladoA: { nombre: 'Réplicas de lectura', ej: 'Postgres primario + réplicas', que: 'Un solo primario que escribe; copias que solo leen. Escalan LECTURAS, no escrituras.', workload: 'Muchas lecturas, un cuello de escritura.' },
      ladoB: { nombre: 'NewSQL', ej: 'CockroachDB · Spanner', que: 'Múltiples líderes por rango de llaves, con consenso. Escalan ESCRITURAS y sobreviven caídas de región.', workload: 'Escrituras a escala, multi-región.' },
      clave: 'Si tu cuello es de lecturas, réplicas de Postgres y listo. Si es de escrituras o necesitas multi-región consistente, ahí sí NewSQL.',
      veredicto: 'La mayoría de los «no escala» son cuellos de lectura. Prueba réplicas antes de pagar la complejidad de NewSQL.'
    }
  ];
})(window.GUIA = window.GUIA || {});
