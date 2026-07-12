/* data/escenarios.js — Guión del comparador de escenario.
   Cada caso lista sus candidatos honestos (comparar Cassandra vs Neo4j para
   un carrito no tiene sentido) y, por candidato: cómo lo modela, qué le sale
   natural y dónde sufre. El motor solo pinta; agregar un caso = editar aquí. */
(function (G) {
  'use strict';

  G.escenarios = [
    {
      id: 'ecommerce',
      titulo: 'Catálogo de e-commerce con búsqueda y recomendaciones',
      descripcion: 'Miles de productos con atributos variados, búsqueda tolerante a typos, y «también te puede gustar». Rara vez es UNA sola base.',
      recomendacion: 'Postgres como fuente de verdad del catálogo y las órdenes; un índice invertido para la búsqueda; pgvector para las recomendaciones. No es «elige uno»: es una base primaria + índices derivados.',
      candidatos: [
        { slug: 'relacional', modela: 'Productos, variantes, inventario y órdenes en tablas con relaciones. jsonb para atributos que varían por categoría.', natural: 'Consistencia de inventario y precios, transacciones de compra, la fuente de verdad.', sufre: 'La búsqueda con typos y el ranking por relevancia se le atragantan (el full-text ayuda solo hasta cierto punto).' },
        { slug: 'documento', modela: 'Cada producto es un documento con todos sus atributos anidados, sin esquema fijo por categoría.', natural: 'Atributos heterogéneos por categoría sin migraciones; leer la ficha completa de un jalón.', sufre: 'La consistencia de inventario y las órdenes con varias entidades relacionadas van a contracorriente.' },
        { slug: 'busqueda', modela: 'Índice invertido de los productos: términos → productos, con facetas (marca, precio, talla) y relevancia.', natural: 'Búsqueda con typos, sinónimos, filtros facetados, autocompletado. La experiencia de búsqueda.', sufre: 'No es tu fuente de verdad: hay que sincronizarlo desde la base primaria (consistencia eventual).' },
        { slug: 'vectorial', modela: 'Cada producto como embedding; «parecidos a este» es buscar vecinos cercanos en el espacio.', natural: 'Recomendaciones por similitud, «productos relacionados», búsqueda semántica.', sufre: 'No sustituye la búsqueda por keywords ni la fuente de verdad; es un índice más que mantener.' }
      ]
    },
    {
      id: 'telemetria',
      titulo: 'Telemetría de 200k dispositivos',
      descripcion: 'Cada dispositivo emite métricas cada pocos segundos. Append puro, consultas por ventanas de tiempo, retención de meses.',
      recomendacion: 'Time-series (TimescaleDB si ya usas Postgres). El dato es fundamentalmente temporal y append-only: esto te da buckets, compresión y retención sin reinventarlos.',
      candidatos: [
        { slug: 'time-series', modela: 'Hypertables particionadas por tiempo; agregados continuos para los dashboards; retención automática del dato viejo.', natural: 'Ingesta de millones de filas/seg, ventanas de tiempo, downsampling y retención. Hecho para esto.', sufre: 'Fuera del eje tiempo es una base normal; cardinalidad extrema puede doler según el motor.' },
        { slug: 'columnar', modela: 'Eventos en una tabla ancha; agrega por dispositivo/tiempo escaneando solo las columnas que toca.', natural: 'Analítica histórica sobre miles de millones de eventos, compresión brutal.', sufre: 'La ingesta fila-a-fila y las consultas «último valor por dispositivo» no son su fuerte sin ayuda.' },
        { slug: 'wide-column', modela: 'Partición por dispositivo, clustering por timestamp; cada lectura es un append más.', natural: 'Tragar el torrente de escrituras a escala, multi-región, sin líder único.', sufre: 'Los dashboards analíticos y las agregaciones ad-hoc: no es para preguntar, es para escribir.' },
        { slug: 'relacional', modela: 'Una tabla con columna timestamp e índices por dispositivo y fecha.', natural: 'Arrancar rápido si el volumen es modesto y ya tienes Postgres.', sufre: 'A 200k dispositivos la tabla se vuelve inmanejable sin particionado; te falta compresión y retención nativas.' }
      ]
    },
    {
      id: 'feed',
      titulo: 'Feed social',
      descripcion: 'Usuarios, seguidores, publicaciones y un timeline que se arma leyendo mucho y rápido. Lecturas dominan; el grafo social importa.',
      recomendacion: 'Postgres para el dato canónico (usuarios, posts) + clave-valor para cachear timelines precalculados. Grafo solo si las consultas de relaciones profundas son el producto, no un extra.',
      candidatos: [
        { slug: 'clave-valor', modela: 'El timeline ya armado de cada usuario guardado por su llave; se lee de un golpe.', natural: 'Servir timelines precalculados con latencia sub-milisegundo (fan-out on write).', sufre: 'No es fuente de verdad ni sabe de relaciones; hay que precalcular y mantener los timelines.' },
        { slug: 'documento', modela: 'Cada post y cada perfil como documento; el feed se compone consultando por autor y fecha.', natural: 'Perfiles y posts con forma flexible; leer un objeto completo rápido.', sufre: 'El grafo de seguidores y las consultas «amigos de amigos» se vuelven joins forzados.' },
        { slug: 'grafo', modela: 'Usuarios y posts como nodos; «sigue a», «le gustó», «comentó» como aristas de primera clase.', natural: 'Recomendaciones sociales, caminos entre personas, «a quién seguir».', sufre: 'El volumen bruto de lecturas de timeline no es su fuerte; escalar el grafo es difícil.' },
        { slug: 'relacional', modela: 'Tablas de usuarios, posts y una tabla follows; el timeline es un join con orden por fecha.', natural: 'La fuente de verdad consistente; consultas moderadas sin traer otra base.', sufre: 'El fan-out del timeline a gran escala pega duro; necesitas caché delante sí o sí.' }
      ]
    },
    {
      id: 'carrito',
      titulo: 'Carrito y órdenes',
      descripcion: 'Dinero de por medio: agregar al carrito, aplicar descuentos, cobrar, descontar inventario. La consistencia no es negociable.',
      recomendacion: 'Relacional, sin dudarlo. ACID de verdad para no cobrar de más ni vender lo que no hay. Sal a NewSQL solo si necesitas esa consistencia a través de varias regiones.',
      candidatos: [
        { slug: 'relacional', modela: 'Órdenes, líneas, pagos e inventario en tablas con transacciones ACID y constraints.', natural: 'No cobrar dos veces, no vender stock inexistente, cerrar la orden atómicamente.', sufre: 'Escalar escrituras más allá de una máquina cuesta; casi nunca es tu problema aquí.' },
        { slug: 'newsql', modela: 'El mismo modelo relacional, pero repartido y replicado por consenso entre regiones.', natural: 'Consistencia fuerte de pagos a través de varias regiones, sobreviviendo caídas.', sufre: 'Latencia extra por el consenso y operación compleja; sobra si un Postgres te alcanza.' },
        { slug: 'documento', modela: 'La orden entera como un documento con sus líneas anidadas.', natural: 'Leer/escribir la orden completa como un objeto; forma flexible.', sufre: 'Las transacciones multi-documento (inventario + pago + orden) van contra el modelo: riesgo de inconsistencia con dinero.' },
        { slug: 'clave-valor', modela: 'El carrito en curso guardado por llave de sesión, con expiración.', natural: 'El carrito efímero antes de cobrar: rápido y desechable.', sufre: 'La orden confirmada y el cobro necesitan ACID; aquí no vive la verdad del dinero.' }
      ]
    }
  ];
})(window.GUIA = window.GUIA || {});
