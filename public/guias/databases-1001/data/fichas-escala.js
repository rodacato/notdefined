/* data/fichas-escala.js — Familia «Acceso simple a escala». */
(function (G) {
  'use strict';
  G.fichas = G.fichas || {};

  G.fichas['clave-valor'] = {
    queEs: 'Un diccionario gigante y distribuido. Le das la llave, te devuelve el valor. No hay joins, no hay queries por otros campos: hay llaves.',
    comoGuarda: 'Una tabla hash: la llave pasa por una función hash que apunta directo al bucket donde vive el valor. No hay que recorrer un árbol ni ordenar: es un salto O(1) al lugar exacto. En memoria (Redis) o en disco distribuido por hash de la llave (DynamoDB).',
    modeloConsulta: 'GET / PUT / DELETE por llave. Punto. Algunos agregan estructuras (listas, sets, contadores) pero el acceso siempre parte de la llave. Si no conoces la llave, no hay query.',
    gana: ['Lecturas y escrituras por llave: lo más rápido que existe', 'Escala horizontal trivial: repartir por hash de la llave', 'Ideal como caché, sesiones, rate-limits, colas, contadores', 'Latencia sub-milisegundo (en memoria)'],
    paga: ['No puedes preguntar por rangos ni por otros campos', 'Sin joins, sin agregaciones, sin ad-hoc', 'Modelar el acceso es tu trabajo: diseñas por la query, no por el dato'],
    cuandoNo: ['Cuando necesitas consultar por algo que no sea la llave', 'Reportes, analítica, o cualquier cosa exploratoria', 'Relaciones entre entidades'],
    parientes: 'Se confunde con documento: documento TAMBIÉN indexa el interior del valor y consulta por campos; clave-valor no mira dentro. Pariente del wide-column (que es clave-valor con columnas y rangos). Redis en memoria es otra bestia que DynamoDB en disco.',
    arquetipo: 'Redis para caché, colas y estructuras en memoria. DynamoDB para clave-valor gestionado a escala planetaria. Valkey (fork de Redis) y Memcached como alternativas. Casi siempre convive con tu base primaria, no la reemplaza.',
    ratings: { point: 7, write: 6, analytics: 1, horiz: 6, schema: 6, tx: 2, ops: 6 },
    dolores: ['clave-ms', 'esquema', 'write-masivo'],
    veredicto: 'La navaja suiza de la latencia. Casi ningún sistema serio vive sin una, pero casi ninguno la usa como base primaria.'
  };

  G.fichas['documento'] = {
    queEs: 'El registro entero vive como un documento (JSON/BSON): objetos anidados, arreglos, campos que aparecen y desaparecen. Sin esquema rígido, sin joins como primera opción.',
    comoGuarda: 'Cada documento se guarda completo y contiguo, como un blob de JSON binario dentro de una colección. Índices secundarios (B-tree) sobre los campos que eliges permiten consultar por su interior. Leer un documento entero es una lectura contigua; no hay que reensamblar de varias tablas.',
    modeloConsulta: 'Consultas por cualquier campo del documento, incluidos los anidados. Filtros, proyecciones, y un pipeline de agregación. Los joins existen pero van a contrapelo: el modelo premia guardar junto lo que lees junto.',
    gana: ['Esquema flexible: agrega campos sin migración', 'El objeto de tu app mapea 1:1 al documento (poco impedance mismatch)', 'Escala horizontal por sharding', 'Rápido para leer/escribir agregados completos'],
    paga: ['Los joins y las transacciones multi-documento van contra la corriente', 'Datos muy relacionados terminan duplicados o inconsistentes', 'La flexibilidad sin disciplina se vuelve un basurero de esquemas'],
    cuandoNo: ['Datos altamente relacionales (ahí gana relacional o grafo)', 'Reportes analíticos pesados', 'Cuando en realidad querías un esquema y te mentiste'],
    parientes: 'La gran confusión: «documento vs clave-valor». Clave-valor no mira dentro del valor; documento SÍ indexa y consulta el interior. También se confunde con relacional-con-jsonb: Postgres hace documento razonablemente bien dentro de una tabla.',
    arquetipo: 'MongoDB es el arquetipo. Couchbase y DocumentDB como alternativas. Pero antes de traer Mongo, prueba jsonb en Postgres: muchas veces el «necesitamos NoSQL» se resuelve con una columna jsonb.',
    ratings: { point: 6, write: 5, analytics: 3, horiz: 6, schema: 7, tx: 4, ops: 5 },
    dolores: ['esquema', 'clave-ms'],
    veredicto: 'Excelente cuando tu dato es de verdad un documento. La mitad de las veces que se elige, un jsonb en Postgres bastaba.'
  };

  G.fichas['wide-column'] = {
    queEs: 'Clave-valor con superpoderes: la llave apunta a una fila que puede tener millones de columnas dinámicas, ordenadas. Diseñada para tragar escrituras a escala brutal. NO es una base columnar.',
    comoGuarda: 'Escritura vía LSM-tree: todo entra primero a una memtable en memoria y a un log; cuando se llena, se vuelca a disco como un SSTable inmutable ordenado por llave. La compactación fusiona SSTables en segundo plano. Nunca actualiza en su lugar: siempre apila. Por eso escribe torrentes sin despeinarse.',
    modeloConsulta: 'Consultas por llave de partición y rango de llave de clustering. NO hay joins ni agregaciones ad-hoc. Igual que clave-valor: diseñas las tablas por la query que vas a correr, no por el dato.',
    gana: ['Escritura masiva sostenida: su razón de existir', 'Escala horizontal lineal, multi-región, sin líder único', 'Alta disponibilidad: sigue viva aunque caigan nodos', 'Predecible bajo carga extrema'],
    paga: ['Consistencia eventual por defecto (afinable, con costo)', 'Cero flexibilidad de consulta: sin la llave correcta, no hay query', 'Operar un clúster es un oficio en sí mismo'],
    cuandoNo: ['Analítica — para eso está columnar (¡el error clásico!)', 'Cuando necesitas consultar de formas que no anticipaste', 'Volúmenes que un Postgres bien puesto ya aguanta'],
    parientes: 'LA MADRE DE LAS CONFUSIONES: wide-column ≠ columnar. Wide-column (Cassandra) es OLTP de escritura clave-valor; columnar (ClickHouse) es OLAP analítico. Nombres gemelos, workloads opuestos. Pariente real del clave-valor y del LSM de todo lo que escribe fuerte.',
    arquetipo: 'Cassandra/ScyllaDB para escritura masiva autohospedada; Bigtable (Google) y HBase en su linaje. DynamoDB pisa terreno parecido con otra piel. Elige esto cuando de verdad escribes más de lo que una máquina relacional aguanta.',
    ratings: { point: 5, write: 7, analytics: 2, horiz: 7, schema: 5, tx: 2, ops: 3 },
    dolores: ['write-masivo', 'clave-ms'],
    veredicto: 'Elegir Cassandra para analítica es comprar un tráiler para ir por tortillas. Es para escribir torrentes, no para preguntar cosas raras.'
  };
})(window.GUIA = window.GUIA || {});
