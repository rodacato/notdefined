/* data/sims-extra.js — Guión (narración) de los 5 simuladores adicionales.
   La mecánica de dibujo vive en js/sim-renderers.js; aquí solo el texto,
   los pasos y qué tipo ilustra cada uno. Determinista: un paso = una idea. */
(function (G) {
  'use strict';
  G.sims = G.sims || {};

  G.sims['btree-vs-lsm'] = {
    titulo: 'B-tree vs LSM · el camino de escritura',
    subtitulo: 'La misma serie de claves escritas de dos formas opuestas: el B-tree actualiza en su lugar; el LSM apila y compacta después.',
    ilustra: ['relacional', 'wide-column', 'time-series'],
    pasos: [
      { narr: 'Vamos a insertar una serie de claves y seguir el CAMINO DE ESCRITURA en cada motor.' },
      { narr: 'B-tree: la clave 50 va directo a su hoja ordenada y se escribe EN SU LUGAR en disco. LSM: entra a la memtable, en memoria, sin tocar disco.' },
      { narr: 'Entran 20 y 70. El B-tree las coloca en la hoja correcta (acceso aleatorio a disco); la memtable solo las acomoda en RAM.' },
      { narr: 'La hoja del B-tree se llenó al insertar 40: se DIVIDE en dos y sube un separador. Reescribe páginas — caro bajo escritura masiva.' },
      { narr: 'La memtable se llenó: el LSM la vuelca de un jalón como un SSTable inmutable. Escritura secuencial; nunca reescribe lo ya escrito.' },
      { narr: 'Siguen entrando claves: memtable nueva → otro SSTable apilado. El B-tree, otra vez, reacomoda en su lugar.' },
      { narr: 'Con varios SSTables, la compactación los fusiona en segundo plano en uno ordenado. El costo se paga después, fuera del camino crítico.' },
      { narr: 'Por eso la escritura masiva ama al LSM: appends secuenciales en vez de I/O aleatorio en su lugar. El B-tree gana en lecturas por clave y por rango.' }
    ]
  };

  G.sims['hash-lookup'] = {
    titulo: 'Hash lookup del clave-valor',
    subtitulo: 'Le das la llave, te da el valor: un salto directo O(1). Y su límite — sin la llave exacta, no hay query.',
    ilustra: ['clave-valor'],
    pasos: [
      { narr: 'Un diccionario gigante repartido en buckets. Pedimos la llave «user:42».' },
      { narr: 'La llave pasa por una función hash → un número.' },
      { narr: 'Ese número apunta DIRECTO al bucket exacto. No se recorre nada, no se compara nada.' },
      { narr: 'Se lee el valor: un solo salto, O(1). Es lo más rápido que existe para acceso por llave.' },
      { narr: '¿Y «todas las llaves entre user:40 y user:50»? El hash dispersa a propósito: llaves vecinas caen en buckets lejanos.' },
      { narr: 'El límite del clave-valor: por llave exacta, instantáneo; por rango, imposible. Si no conoces la llave, no hay query.' }
    ]
  };

  G.sims['grafo-vs-joins'] = {
    titulo: 'Grafo vs JOINs · amigos de mis amigos',
    subtitulo: 'La misma pregunta de dos saltos: el grafo camina punteros; los JOINs encadenados multiplican filas.',
    ilustra: ['grafo', 'relacional'],
    pasos: [
      { narr: 'La pregunta: «amigos de los amigos de Ana». Dos formas de responderla.' },
      { narr: 'Grafo: parto del nodo Ana y sigo sus aristas «amigo» — primer salto.' },
      { narr: 'Segundo salto: desde cada amigo sigo sus aristas. Cada salto es seguir un puntero: O(1), sin importar el tamaño total.' },
      { narr: 'Respondido caminando el grafo. El costo depende de los vecinos visitados, no de cuántos millones de nodos existan.' },
      { narr: 'SQL: la misma pregunta son JOINs encadenados sobre la tabla friendships.' },
      { narr: 'Cada salto = otro JOIN. Dos saltos ya inflan el resultado intermedio; tres, explotan.' },
      { narr: 'Relaciones profundas: el grafo camina, los JOINs multiplican. Para uno o dos saltos, un JOIN basta.' }
    ]
  };

  G.sims['indice-invertido'] = {
    titulo: 'Índice invertido',
    subtitulo: 'De documentos a términos: el trabajo se hace al escribir para que buscar «zapato rojo» sea instantáneo.',
    ilustra: ['busqueda'],
    pasos: [
      { narr: 'Tres documentos cortos. Queremos buscar «zapato rojo».' },
      { narr: 'Al ingresar, cada documento se parte en términos (se tokeniza).' },
      { narr: 'Se construye el índice invertido: cada término apunta a la lista de documentos que lo contienen (posting list).' },
      { narr: 'Buscar «zapato»: voy directo a su posting list. Buscar «rojo»: a la suya. Sin abrir ningún documento.' },
      { narr: 'Intersecto las dos listas: los documentos que tienen AMBOS términos. Eso es el resultado.' },
      { narr: 'Buscar es instantáneo porque el trabajo se hizo al escribir. Es un índice derivado, no tu fuente de verdad.' }
    ]
  };

  G.sims['vectorial'] = {
    titulo: 'Similarity search vectorial',
    subtitulo: 'Cada item es un punto en un espacio de significado. La consulta no es «igual a» sino «lo más parecido a».',
    ilustra: ['vectorial'],
    pasos: [
      { narr: 'Cada item se convierte en un punto (embedding) en un espacio de muchas dimensiones — aquí, aplanado a dos.' },
      { narr: 'La cercanía entre puntos = similitud semántica. Cosas parecidas caen juntas.' },
      { narr: 'Llega la consulta: se convierte en un punto en el MISMO espacio.' },
      { narr: 'Buscamos los vecinos más cercanos (k-NN): los k puntos a menor distancia de la consulta.' },
      { narr: '«Aproximado» (ANN): no compara contra todos —usa un índice— así que a veces omite un vecino a cambio de muchísima velocidad.' },
      { narr: 'Similitud, no igualdad. pgvector cubre hasta decenas de millones de vectores; a más escala, una dedicada.' }
    ]
  };
})(window.GUIA = window.GUIA || {});
