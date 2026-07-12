/* data/fichas-forma.js — Familia «Por la forma del dato». */
(function (G) {
  'use strict';
  G.fichas = G.fichas || {};

  G.fichas['grafo'] = {
    queEs: 'Nodos y aristas son ciudadanos de primera clase. Cuando lo importante NO son las entidades sino las relaciones entre ellas — y las quieres recorrer a profundidad — esto brilla.',
    comoGuarda: 'Cada nodo guarda punteros directos a sus aristas (adyacencia física, no una tabla de joins). Saltar de un nodo a su vecino es seguir un puntero: O(1) por salto, sin importar cuántos millones de nodos haya en total. El recorrido no re-escanea; solo camina.',
    modeloConsulta: 'Lenguajes de traversal (Cypher, Gremlin): «amigos de mis amigos que compraron X». Pattern matching sobre caminos. Lo que en SQL son 5 joins encadenados, aquí es un patrón de una línea.',
    gana: ['Recorridos profundos a costo constante por salto', 'Modela relaciones complejas de forma natural', 'Consultas de caminos, ciclos, comunidades y recomendaciones', 'El esquema de relaciones evoluciona sin migraciones dolorosas'],
    paga: ['Fuera de recorrer relaciones, es una base mediocre', 'Escalar horizontalmente un grafo es un problema difícil', 'Ecosistema y talento más chicos'],
    cuandoNo: ['Cuando tus relaciones son pocas y planas (un JOIN basta)', 'Analítica agregada, reportes, CRUD normal', 'Volumen de recorridos que en realidad no necesitas'],
    parientes: 'Se confunde con «relacional con muchas tablas de relación»: el relacional PUEDE modelar un grafo, pero cada salto es un JOIN que se multiplica; el grafo camina punteros. La pregunta «amigos de amigos de amigos» es trivial en grafo y explota en JOINs.',
    arquetipo: 'Neo4j es el arquetipo (Cypher). Memgraph para tiempo real, TigerGraph a escala. Postgres con recursive CTEs o la extensión Apache AGE cubre grafos chicos sin traer otra base. Trae grafo cuando el recorrido profundo ES el producto.',
    ratings: { point: 4, write: 4, analytics: 4, horiz: 3, schema: 6, tx: 5, ops: 4 },
    dolores: ['relaciones'],
    veredicto: 'Deslumbrante para el problema correcto (redes, fraude, recomendaciones) y sobra para casi todo lo demás. Confirma que tus recorridos son profundos de verdad.'
  };

  G.fichas['busqueda'] = {
    queEs: 'Un índice invertido: en vez de guardar «documento → sus palabras», guarda «palabra → los documentos que la contienen». Es el modelo de datos que hace la búsqueda de texto instantánea.',
    comoGuarda: 'Al ingresar, cada documento se tokeniza y por cada término se apunta a la lista de documentos que lo contienen (posting list), con posiciones y frecuencias. Buscar «zapato rojo» es intersectar dos listas ya construidas — no escanear los documentos. Se paga al escribir para que leer sea instantáneo.',
    modeloConsulta: 'Consultas de texto con relevancia (BM25/TF-IDF): ranking, fuzzy/typos, sinónimos, stemming, facetas y agregaciones. No es SQL: es «encuéntrame lo más relevante para estos términos».',
    gana: ['Búsqueda de texto libre con relevancia, rapidísima', 'Tolerancia a typos, sinónimos, idiomas, stemming', 'Facetas y agregaciones para navegación (filtros de tienda)', 'Escala horizontal por shards del índice'],
    paga: ['No es tu base primaria: es un índice derivado (hay que sincronizarlo)', 'Consistencia eventual con la fuente de verdad', 'Operar y afinar un clúster es trabajo real'],
    cuandoNo: ['Como base transaccional primaria (no lo es)', 'Cuando un WHERE campo LIKE o el full-text de Postgres bastan'],
    parientes: 'Es un modelo de datos propio (índice invertido), no un «sabor» de documento — por eso tiene ficha aparte. Se confunde con «base documental»: Elastic guarda documentos, sí, pero su superpoder es el índice invertido, no el almacenamiento. Postgres tiene full-text para casos chicos.',
    arquetipo: 'Elasticsearch/OpenSearch para búsqueda y observabilidad a escala. Meilisearch/Typesense para búsqueda de producto simple y veloz. Postgres full-text (tsvector) o pg_trgm para lo modesto. Casi siempre alimentado por CDC desde tu base primaria.',
    ratings: { point: 5, write: 4, analytics: 5, horiz: 6, schema: 5, tx: 2, ops: 3 },
    dolores: ['typos'],
    veredicto: 'Si tu búsqueda es un LIKE %texto% que ya no da, esto es el salto. Pero es un índice, no tu fuente de verdad: no guardes ahí lo que no puedas reconstruir.'
  };

  G.fichas['vectorial'] = {
    queEs: 'Guarda significado como coordenadas: cada dato es un vector (embedding) en un espacio de cientos de dimensiones. La consulta no es «igual a» sino «lo más parecido a». El motor de las features de AI.',
    comoGuarda: 'Cada item se guarda como un vector de floats. Un índice ANN (HNSW, IVF) organiza el espacio en un grafo o celdas para no comparar contra todos. Buscar es medir distancia (coseno/L2) a los vecinos más cercanos — «aproximado» significa que sacrifica algo de exactitud por muchísima velocidad.',
    modeloConsulta: 'k-NN: «dame los k vectores más cercanos a este». Casi siempre combinado con filtros de metadata (búsqueda híbrida). El resultado es un ranking por similitud, no una coincidencia exacta.',
    gana: ['Búsqueda por similitud semántica (RAG, recomendaciones, dedup)', 'Vecinos más cercanos aproximados a gran velocidad', 'El puente entre tus datos y los modelos de AI', 'Con pgvector, vive dentro de tu Postgres transaccional'],
    paga: ['«Aproximado»: hay un trade-off recall/velocidad que afinar', 'Los índices ANN comen RAM', 'A escala de cientos de millones de vectores, se pone serio'],
    cuandoNo: ['Búsqueda exacta por atributos (para eso está un índice normal)', 'Cuando en realidad querías keyword search (usa índice invertido)'],
    parientes: 'La confusión de moda: «vectorial dedicada vs pgvector». pgvector es el camino simple (transaccional, mismo tooling) y aguanta cómodo hasta decenas de millones de vectores por instancia; las dedicadas ganan a cientos de millones o con features específicas. No es lo mismo que búsqueda de texto: una hace semántica, la otra keywords.',
    arquetipo: 'pgvector si ya usas Postgres — empieza aquí, casi siempre alcanza. Qdrant, Weaviate, Milvus, Pinecone cuando escalas a cientos de millones o quieres features dedicadas. La regla: no traigas una base nueva por un feature que tu Postgres ya hace.',
    ratings: { point: 5, write: 4, analytics: 3, horiz: 4, schema: 4, tx: 5, ops: 5 },
    dolores: ['ai'],
    veredicto: 'El default sano es pgvector hasta que un número concreto (recall, latencia, escala) te empuje a una dedicada. No al revés.'
  };

  G.fichas['ledger'] = {
    queEs: 'Nicho, pero real: un libro mayor inmutable y verificable criptográficamente. Cada cambio se encadena con hashes al anterior, así que el historial no se puede reescribir sin que se note.',
    comoGuarda: 'Un journal append-only donde cada entrada incluye el hash de la anterior (una cadena de Merkle). Nadie edita ni borra: solo se agregan asientos. Verificar la integridad es recalcular la cadena de hashes; si algo se tocó, no cuadra.',
    modeloConsulta: 'SQL o API sobre el estado actual, más pruebas criptográficas de que el historial es íntegro. Consultas «el saldo hoy» y también «demuéstrame que nadie tocó el registro de ayer».',
    gana: ['Historial inmutable y verificable (auditoría, cumplimiento)', 'Prueba criptográfica de integridad, no solo «confía en mí»', 'Trazabilidad completa de quién cambió qué y cuándo'],
    paga: ['Nicho: la mayoría de los sistemas no lo necesitan', 'Menos flexible y más lento que una base normal', 'Ecosistema chico; a veces una tabla de auditoría bien hecha basta'],
    cuandoNo: ['Cuando «necesitamos auditoría» se resuelve con una tabla append-only', 'CRUD normal donde el historial no es el producto'],
    parientes: 'Se confunde con blockchain: comparte la cadena de hashes, pero un ledger es centralizado (un dueño), no descentralizado ni con consenso entre desconocidos. Pariente lejano del time-series (ambos append-only). No lo traigas por moda cripto.',
    arquetipo: 'Amazon QLDB e immudb son los arquetipos. En la práctica, muchos «requisitos de ledger» se cubren con tablas append-only + hashing en tu relacional de siempre. Reserva esto para cumplimiento regulatorio de verdad.',
    ratings: { point: 5, write: 3, analytics: 2, horiz: 3, schema: 2, tx: 7, ops: 3 },
    dolores: ['auditoria'],
    veredicto: 'El 95% de las veces que alguien pide «ledger», una tabla append-only con hashes en Postgres era la respuesta. Para el 5% regulado, es esto.'
  };
})(window.GUIA = window.GUIA || {});
