/* data/quiz.js — Guión del quiz «cuál uso». Abre con la tesis honesta y
   luego escenarios reales: el lector adivina, el almanaque da el veredicto
   razonado y sus bordes. Determinista, sin puntaje competitivo. */
(function (G) {
  'use strict';

  G.quiz = {
    tesis: {
      titulo: 'Antes de elegir: empieza en Postgres',
      cuerpo: 'La respuesta honesta a «¿qué base uso?» casi siempre empieza igual: Postgres. Con jsonb, pgvector y TimescaleDB cubre más de lo que crees. Sal de ahí cuando un número concreto te duela —no por moda— y con los bordes claros: pgvector no es para cientos de millones de vectores; una tabla con timestamp no es una time-series DB. Este quiz es para reconocer ese momento.'
    },
    preguntas: [
      {
        escenario: 'Guardar sesiones de usuario con expiración automática y lecturas por debajo del milisegundo.',
        opciones: ['clave-valor', 'relacional', 'documento'],
        respuesta: 'clave-valor',
        porque: 'Acceso por una sola llave (el id de sesión), TTL nativo y latencia sub-ms: es el caso de libro del clave-valor en memoria (Redis).',
        borde: 'Es caché/estado efímero, no tu fuente de verdad. Si pierdes Redis, no debes perder nada que importe.'
      },
      {
        escenario: 'Reporte analítico ad-hoc que agrega miles de millones de filas históricas de eventos.',
        opciones: ['columnar', 'relacional', 'wide-column'],
        respuesta: 'columnar',
        porque: 'Agregar sobre tablas gigantes leyendo solo las columnas que tocas es exactamente para lo que nació el columnar (10–1,000× más rápido que un row store).',
        borde: 'No lo pongas a servir point lookups fila-a-fila: ahí pierde. Vive junto a tu OLTP, alimentado por ETL/CDC.'
      },
      {
        escenario: 'Detectar fraude siguiendo cadenas de transacciones entre cuentas, a varios saltos de profundidad.',
        opciones: ['grafo', 'relacional', 'documento'],
        respuesta: 'grafo',
        porque: 'Recorrer relaciones profundas a costo constante por salto es el superpoder del grafo; en SQL eso son joins encadenados que explotan.',
        borde: 'Confirma que los recorridos son profundos de verdad. Si son uno o dos saltos, un JOIN en Postgres basta y te ahorras otra base.'
      },
      {
        escenario: 'Búsqueda de productos tolerante a typos, con sinónimos y filtros facetados.',
        opciones: ['busqueda', 'relacional', 'vectorial'],
        respuesta: 'busqueda',
        porque: 'El índice invertido con relevancia, fuzzy y facetas es la herramienta de la búsqueda de texto. Un LIKE no da esta experiencia.',
        borde: 'Es un índice derivado, no la fuente de verdad. Y no confundas keywords (esto) con similitud semántica (vectorial).'
      },
      {
        escenario: 'RAG: recuperar los fragmentos de documento más parecidos semánticamente a una pregunta.',
        opciones: ['vectorial', 'busqueda', 'documento'],
        respuesta: 'vectorial',
        porque: 'Similitud semántica = vecinos más cercanos en el espacio de embeddings. Es el motor de las features de AI.',
        borde: 'Empieza con pgvector si ya usas Postgres: aguanta cómodo hasta decenas de millones de vectores. Salta a una dedicada solo si un número te empuja.'
      },
      {
        escenario: 'App de escritorio que guarda datos localmente, sin servidor y sin conexión.',
        opciones: ['embebida', 'relacional', 'clave-valor'],
        respuesta: 'embebida',
        porque: 'SQLite es una librería y un archivo: cero operación, SQL completo, lecturas locales instantáneas. Para esto es imbatible.',
        borde: 'Su techo es la concurrencia de escritura: no la pongas de backend multi-usuario de alta carga.'
      },
      {
        escenario: 'Métricas de infraestructura por segundo, con retención y downsampling automáticos.',
        opciones: ['time-series', 'columnar', 'relacional'],
        respuesta: 'time-series',
        porque: 'Dato append-only con el tiempo como eje, ventanas, retención y downsampling nativos: la time-series DB te ahorra reinventar medio motor.',
        borde: 'Si el dato NO es fundamentalmente temporal, una columna de fecha en Postgres no justifica traer otra base.'
      },
      {
        escenario: 'Órdenes de pago con consistencia fuerte a través de tres regiones geográficas.',
        opciones: ['newsql', 'relacional', 'wide-column'],
        respuesta: 'newsql',
        porque: 'Consistencia fuerte + escala horizontal + sobrevivir a la caída de una región es justo el hueco que llena NewSQL (consenso por quórum).',
        borde: 'Es la respuesta correcta a un problema que casi nadie tiene. Si un Postgres con réplicas te alcanza, no pagues el consenso.'
      },
      {
        escenario: 'Un CRUD normal con algunas relaciones y tráfico moderado. Un equipo chico que quiere avanzar.',
        opciones: ['relacional', 'documento', 'newsql'],
        respuesta: 'relacional',
        porque: 'Este es el 80% de los casos. Postgres: ACID, joins, ecosistema, talento. La carga de la prueba la tiene quien quiera otra cosa.',
        borde: 'La tesis en acción: no hay ningún número que te duela todavía. Elegir algo «más escalable» aquí es sobre-ingeniería.'
      }
    ]
  };
})(window.GUIA = window.GUIA || {});
