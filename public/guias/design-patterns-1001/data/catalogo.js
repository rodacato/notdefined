/* ============================================================================
   data/ — EL CONTENIDO del almanaque (y solo el contenido)
   ----------------------------------------------------------------------------
   Aquí vive TODO lo editable: patrones, textos, diagramas, código, escenarios.
   La mecánica (render, animaciones, router) está en app.js — no la toques para
   corregir contenido.

   Se expone como un único objeto global: window.PATRONES, armado por
   varios scripts clásicos cargados en orden (ver index.html):
     data/catalogo.js               ← este archivo: categorías + portada
     data/patrones-creacional.js    ← 5 patrones
     data/patrones-estructural.js   ← 7 patrones
     data/patrones-comportamiento.js← 11 patrones
     data/desambiguacion.js         ← 8 comparaciones

   Estructura:
     .categorias      metadatos de las 3 categorías (nombre, color, blurb)
     .catalogo        la portada: problemas, roles y frecuencia
     .patrones        los 23 patrones (fuente de verdad), ordenados 01..23
     .desambiguacion  8 comparaciones de patrones parecidos

   --------------------------------------------------------------------------
   CÓMO AGREGAR UN PATRÓN NUEVO — copia un objeto de .patrones y ajusta:
     {
       id: "mi-patron",           // slug único (sale en la URL: #/patron/mi-patron)
       no: "24",                  // número de orden
       name: "Mi Patrón",
       category: "creacional",    // creacional | estructural | comportamiento
       categoryName: "Creacional",
       categoryColor: "#A4552E",
       freq: "half",              // star (núcleo) | half (medio) | open (cola rara)
       warn: false,               // true = patrón con advertencia (p. ej. Singleton)
       primary: "antes-despues",  // vista inicial: estructura | antes-despues | en-accion
       intent: "…", star: "…", smell: "…",
       fowler: "…",               // opcional: smell/refactor formal (Fowler) del dolor
       realWorld: "…", whenNot: "…", relatives: "…", paradigm: "…",
       diagram: { vb:[ancho,alto], nodes:[…], edges:[…] },  // coords fijas del SVG
       beforeAfter: { before:{…}, after:{…}, why:[…] },
       action: { caption:"…", steps:[{from,to,label,note}, …] },
       code: { ts:"…", py:"…", rb:"…", go:"…" }
     }
   Para que aparezca en la portada, su id ya queda incluido por su categoría.
   Si quieres que un problema lo ilumine, agrega su id al array "hits" del
   problema correspondiente en .catalogo.problems.
   ============================================================================ */

window.PATRONES = {
  categorias: {
    creacional: {
      key: 'creacional',
      name: 'Creacional',
      blurb:
        'Cómo nacen los objetos sin que el cliente se case con clases concretas al instanciar.',
      primaryNote:
        'Vista primaria de la categoría: Antes → Después (cómo cambia la creación).',
      color: '#A4552E',
      varc: '--cat-crea',
    },
    estructural: {
      key: 'estructural',
      name: 'Estructural',
      color: '#2F6A6B',
      count: 7,
      blurb:
        'Cómo ensamblar objetos y clases en estructuras más grandes manteniéndolas flexibles.',
      primaryNote:
        'Vista primaria de la categoría: Estructura (el ensamblaje / el envoltorio).',
      varc: '--cat-estr',
    },
    comportamiento: {
      key: 'comportamiento',
      name: 'De comportamiento',
      color: '#79415F',
      blurb: 'Quién hace qué y cómo se hablan los objetos en runtime.',
      primaryNote:
        'Vista primaria de la categoría: En acción (el flujo de mensajes en runtime).',
      varc: '--cat-comp',
    },
  },
  catalogo: {
    categories: {
      creacional: {
        name: 'Creacional',
        varc: '--cat-crea',
        desc: 'Cómo nacen los objetos: desacoplar el código del acto de instanciar.',
      },
      estructural: {
        name: 'Estructural',
        varc: '--cat-estr',
        desc: 'Cómo se ensamblan objetos y clases en estructuras más grandes.',
      },
      comportamiento: {
        name: 'De comportamiento',
        varc: '--cat-comp',
        desc: 'Cómo colaboran los objetos y reparten responsabilidades en runtime. Interpreter va al final a propósito: el más raro cierra el tomo.',
      },
    },
    problems: [
      {
        id: 'new-acoplados',
        label: 'Demasiados `new` acoplados',
        hits: [
          'factory-method',
          'abstract-factory',
          'builder',
          'prototype',
          'singleton',
        ],
      },
      {
        id: 'condicionales',
        label: 'Explosión de condicionales',
        hits: ['strategy', 'state', 'command', 'visitor', 'factory-method'],
      },
      {
        id: 'subclases',
        label: 'Subclases que se multiplican',
        hits: ['bridge', 'decorator', 'strategy', 'composite'],
      },
      {
        id: 'acoplados',
        label: 'Objetos demasiado acoplados entre sí',
        hits: ['mediator', 'facade', 'observer', 'adapter'],
      },
      {
        id: 'deshacer',
        label: 'Necesito deshacer / rehacer',
        hits: ['command', 'memento'],
      },
      {
        id: 'variar-algoritmo',
        label: 'Variar un algoritmo en runtime',
        hits: ['strategy', 'template-method', 'state'],
      },
      {
        id: 'api-compleja',
        label: 'Una API es demasiado difícil de usar',
        hits: ['facade', 'adapter', 'proxy'],
      },
      {
        id: 'recorrer',
        label: 'Recorrer estructuras sin exponer su interior',
        hits: ['iterator', 'composite', 'visitor'],
      },
    ],
    roles: [
      {
        key: 'cliente',
        label: 'Cliente',
        sub: 'quien usa el patrón',
        varc: '--role-cliente',
        txt: '',
      },
      {
        key: 'interfaz',
        label: 'Interfaz',
        sub: 'el contrato',
        varc: '--role-interfaz',
        txt: '',
      },
      {
        key: 'impl',
        label: 'Implementación',
        sub: 'clase concreta',
        varc: '--role-impl',
        txt: '',
      },
      {
        key: 'estrella',
        label: 'El patrón',
        sub: 'lo que introduce',
        varc: '--role-estrella',
        txt: '',
      },
      {
        key: 'dolor',
        label: 'Dolor',
        sub: 'en el «antes»',
        varc: '--color-negative',
        txt: '',
        dolor: true,
      },
      {
        key: 'mejora',
        label: 'Mejora',
        sub: 'en el «después»',
        varc: '--color-positive',
        txt: '✓',
      },
    ],
    freq: {
      glyph: {
        star: '★',
        half: '◐',
        open: '○',
      },
      label: {
        star: 'núcleo cotidiano',
        half: 'uso medio',
        open: 'cola rara',
      },
    },
  },
  patrones: [],
  desambiguacion: [],
};
