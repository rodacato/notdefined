export interface GuiaTheme {
  // Snapshot de portada de cada guía — NO es espejo vivo de su styles.css.
  // Son los tokens del modo oscuro (la colección es dark-first); si retoco la
  // paleta de una guía, este snapshot se actualiza a mano, a propósito.
  canvas: string;
  ink: string;
  inkSoft: string;
  accent: string;
  border: string;
  texture:
    | 'grid'
    | 'grain'
    | 'stripes'
    | 'arcs'
    | 'rules'
    | 'morse'
    | 'facets'
    | 'twill'
    | 'lattice'
    | 'crosshatch'
    | 'bulbs';
  displayFamily: string; // nombre de la @font-face declarada en index.astro
}

export type GuiaCollectionId = 'almanaque-1001' | 'polyglot';

export interface GuiaCollection {
  id: GuiaCollectionId;
  name: string; // encabezado del estante en /guias
  hook: string; // una línea bajo el encabezado
  itemLabel: string; // "tomos" | "guías" — para el contador del estante
}

// El orden aquí es el orden de los estantes en /guias. Un estante sin guías
// no se renderiza, así que registrar una colección futura no cuesta nada.
export const collections: GuiaCollection[] = [
  {
    id: 'almanaque-1001',
    name: 'Almanaque técnico · 1001',
    hook: 'El 101 ya te lo sabías. Tomos numerados, cada uno con su tema, su paleta y su tipografía.',
    itemLabel: 'tomos',
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    hook: 'Temas avanzados de cada lenguaje, en escala de idiomas: C1 y C2. Las bases están en todos lados; esto no.',
    itemLabel: 'guías',
  },
];

// Escala CEFR de Polyglot (ADR 0006): C1 "dominado" · C2 "a fondo".
// A1–B2 no existen — B2 "con soltura" quedó fuera por ser el eslabón menos
// avanzado (uso fluido ≈ lo que ya cubren tutoriales y docs).
export type GuiaNivel = 'C1' | 'C2';

export interface Guia {
  slug: string;
  title: string;
  blurb: string;
  date: string;
  tags: string[];
  collection: GuiaCollectionId;
  tomo?: number; // solo almanaque-1001: orden en la colección (I = primera publicada)
  nivel?: GuiaNivel; // solo polyglot: el "tomo" de esa colección
  theme: GuiaTheme;
}

export const guias: Guia[] = [
  {
    slug: 'design-patterns-1001',
    title: 'Patrones de diseño 1001',
    blurb:
      'Almanaque interactivo de los 23 patrones del GoF por el problema que resuelven: catálogo problema-primero, fichas con diagrama, antes → después, y desambiguación de los que se parecen.',
    date: '2026-07-10',
    tags: ['Patterns', 'GoF', 'Arquitectura'],
    collection: 'almanaque-1001',
    tomo: 1,
    theme: {
      canvas: '#231a0e',
      ink: '#f3e8d2',
      inkSoft: '#c4ae8a',
      accent: '#dfa050',
      border: '#4a3a1f',
      texture: 'grain',
      displayFamily: 'Guia Bitter',
    },
  },
  {
    slug: 'architectures-1001',
    title: 'Arquitecturas 1001',
    blurb:
      'Almanaque de 21 estilos de arquitectura en 5 familias, problema-primero: cada estilo nació de una presión y cobra un precio. Las 21 fichas con topología y trade-offs, filtro por dolor, comparaciones lado a lado y quiz para probar el ojo.',
    date: '2026-07-11',
    tags: ['Arquitectura', 'Trade-offs', 'Sistemas distribuidos'],
    collection: 'almanaque-1001',
    tomo: 2,
    theme: {
      canvas: '#0e2440',
      ink: '#e4eef6',
      inkSoft: '#9db4c8',
      accent: '#82b6e4',
      border: '#2a4e74',
      texture: 'grid',
      displayFamily: 'Guia Chakra Petch',
    },
  },
  {
    slug: 'apis-1001',
    title: 'APIs 1001',
    blurb:
      'Almanaque de 13 estilos de API en 5 familias: REST, gRPC, GraphQL, WebSockets, webhooks y compañía. Cada ficha con su contrato, su cuándo-no y su simulador de conversación; comparador de escenario con round-trips y bytes honestos, quiz y desambiguación de los que se confunden.',
    date: '2026-07-11',
    tags: ['APIs', 'REST', 'gRPC', 'Tiempo real'],
    collection: 'almanaque-1001',
    tomo: 4,
    theme: {
      canvas: '#221418',
      ink: '#f4e9e4',
      inkSoft: '#c2a8a4',
      accent: '#e07856',
      border: '#4a2e33',
      texture: 'stripes',
      displayFamily: 'Guia Fraunces',
    },
  },
  {
    slug: 'auth-1001',
    title: 'Auth 1001',
    blurb:
      'Almanaque de 14 métodos de autenticación y autorización en 4 familias: sesiones, JWT, passkeys, OAuth 2.1, OIDC, mTLS y las tres caras de la autorización. Cada ficha dice quién guarda el secreto y cómo se revoca; simuladores de baile paso a paso y el simulador de logout corrido en tres mundos.',
    date: '2026-07-11',
    tags: ['Auth', 'OAuth', 'Passkeys', 'Seguridad'],
    collection: 'almanaque-1001',
    tomo: 5,
    theme: {
      canvas: '#191430',
      ink: '#ede9f7',
      inkSoft: '#aba3c4',
      accent: '#a78bda',
      border: '#383060',
      texture: 'arcs',
      displayFamily: 'Guia Playfair',
    },
  },
  {
    slug: 'databases-1001',
    title: 'Bases de datos 1001',
    blurb:
      'Almanaque de 12 tipos de bases de datos en 4 familias — el catálogo es de tipos, con productos como arquetipos: los productos caducan, los tipos no. El layout físico animado es el corazón: row vs columnar lado a lado, B-tree vs LSM, grafo vs JOINs; comparador de escenario y la tesis honesta de empezar en Postgres hasta que un número te duela.',
    date: '2026-07-11',
    tags: ['Bases de datos', 'Postgres', 'OLAP', 'Modelos de datos'],
    collection: 'almanaque-1001',
    tomo: 6,
    theme: {
      canvas: '#0e241e',
      ink: '#e9f2ec',
      inkSoft: '#a3bcaf',
      accent: '#c9a45d',
      border: '#26473c',
      texture: 'rules',
      displayFamily: 'Guia Lora',
    },
  },
  {
    slug: 'messaging-1001',
    title: 'Mensajería 1001',
    blurb:
      'Almanaque de 11 sistemas de colas y mensajería en 4 familias: RabbitMQ, Kafka, SQS, NATS, MQTT y compañía. La división que manda es cola vs log; las sims enseñan el duplicado del at-least-once, el replay, la DLQ y el outbox — porque "exactly-once end-to-end" es marketing y lo real es idempotencia.',
    date: '2026-07-11',
    tags: ['Mensajería', 'Kafka', 'RabbitMQ', 'Eventos'],
    collection: 'almanaque-1001',
    tomo: 7,
    theme: {
      canvas: '#101822',
      ink: '#e7eef4',
      inkSoft: '#9fb1bf',
      accent: '#56c4d6',
      border: '#2a3a4a',
      texture: 'morse',
      displayFamily: 'Guia Barlow Condensed',
    },
  },
  {
    slug: 'polyglot-ruby-c2',
    title: 'Ruby a fondo',
    blurb:
      'Los internals de Ruby, de Prism al código máquina: 12 piezas del motor en 4 bloques — pipeline de ejecución, YARV, YJIT/ZJIT, la GVL y los Ractors, Fibers, el GC compactador, object shapes, heap y method lookup. Cada tema desmonta un malentendido, al día con Ruby 4.0.',
    date: '2026-07-18',
    tags: ['Ruby', 'Internals', 'YARV', 'GC'],
    collection: 'polyglot',
    nivel: 'C2',
    theme: {
      canvas: '#1c1116',
      ink: '#f5e9ed',
      inkSoft: '#c2a6b1',
      accent: '#e24d68',
      border: '#442a38',
      texture: 'facets',
      displayFamily: 'Guia Spectral',
    },
  },
  {
    slug: 'polyglot-go-c2',
    title: 'Go a fondo',
    blurb:
      'El runtime de Go viaja dentro del binario: sin VM, sin JIT. 14 temas en 4 bloques — el pipeline AOT y la SSA, escape analysis, defer/panic/recover, el scheduler GMP con su work-stealing, channels, el GC tricolor y su pacer, el allocator por-P, interfaces e itables, slices, Swiss Tables y los generics por dentro. Cada tema desmonta un malentendido, al día con Go 1.25.',
    date: '2026-07-18',
    tags: ['Go', 'Internals', 'Scheduler', 'GC'],
    collection: 'polyglot',
    nivel: 'C2',
    theme: {
      canvas: '#0b1f26',
      ink: '#e6f1f3',
      inkSoft: '#9db8bc',
      accent: '#45c0ce',
      border: '#24444c',
      texture: 'twill',
      displayFamily: 'Guia Spectral',
    },
  },
  {
    slug: 'polyglot-python-c2',
    title: 'Python a fondo',
    blurb:
      'Python sí compila: a bytecode, y una máquina de pila lo ejecuta. 14 temas en 4 bloques — el pipeline y el eval loop, generadores y frames suspendidos, el import system, el intérprete adaptativo y el JIT, el GIL y el free-threading de 3.14, asyncio, refcount con GC de ciclos, pymalloc, PyObject, MRO y descriptores, el compact dict con key-sharing, y list/int/str por dentro. Cada tema desmonta un malentendido, al día con Python 3.14.',
    date: '2026-07-18',
    tags: ['Python', 'Internals', 'GIL', 'CPython'],
    collection: 'polyglot',
    nivel: 'C2',
    theme: {
      canvas: '#16233b',
      ink: '#eaf0f8',
      inkSoft: '#a6b4c8',
      accent: '#e8b93e',
      border: '#2c4266',
      texture: 'lattice',
      displayFamily: 'Guia Spectral',
    },
  },
  {
    slug: 'polyglot-rust-c2',
    title: 'Rust a fondo',
    blurb:
      'Lo que otros lenguajes resuelven en ejecución —con GC, con candado global, con scheduler—, Rust lo resuelve en compilación. 19 temas en 5 bloques: ownership, borrowing y lifetimes (el borrow checker corre sobre MIR, no sobre tu texto), el pipeline de compilación, monomorfización contra trait objects, cómo se expanden las macros, RAII y el drop en orden inverso, panic entre unwind y abort, Rc/Arc con mutabilidad interior, el layout de memoria y el niche, Send/Sync, async como máquina de estados, executors, unsafe, atomics y memory ordering. Cada tema desmonta un malentendido.',
    date: '2026-07-18',
    tags: ['Rust', 'Internals', 'Ownership', 'Async'],
    collection: 'polyglot',
    nivel: 'C2',
    theme: {
      canvas: '#1d1310',
      ink: '#f2eae4',
      inkSoft: '#c0ac9f',
      accent: '#d97742',
      border: '#463023',
      texture: 'crosshatch',
      displayFamily: 'Guia Spectral',
    },
  },
  {
    slug: 'polyglot-javascript-c2',
    title: 'JavaScript a fondo',
    blurb:
      'Un solo hilo, cuatro compiladores y un event loop que no es del lenguaje sino del runtime. 13 temas en 4 bloques: el pipeline de V8, Ignition y su bytecode, los cuatro niveles del JIT con su desoptimización, módulos ESM contra CommonJS, el event loop y las microtareas que siempre le ganan a los timers, Workers, el GC Orinoco, shapes e inline caches, Smi tagging, prototipos, closures y this. Cada ficha dice en qué capa vive —motor, runtime o lenguaje— y desmonta un malentendido.',
    date: '2026-07-18',
    tags: ['JavaScript', 'Internals', 'V8', 'Event loop'],
    collection: 'polyglot',
    nivel: 'C2',
    theme: {
      canvas: '#1a1712',
      ink: '#f4efdf',
      inkSoft: '#c0b694',
      accent: '#e8c93f',
      border: '#453d24',
      texture: 'bulbs',
      displayFamily: 'Guia Spectral',
    },
  },
  {
    slug: 'algorithms-1001',
    title: 'Algoritmos 1001',
    blurb:
      'Curso interactivo de algoritmos: Big O, búsquedas, ordenamiento, recursión, estructuras de datos, grafos, greedy y DP. Se aprende moviendo — predices, animas y comparas: 23 simulaciones en 7 módulos.',
    date: '2026-07-11',
    tags: ['Algoritmos', 'Big O', 'Estructuras de datos'],
    collection: 'almanaque-1001',
    tomo: 3,
    theme: {
      canvas: '#17211a',
      ink: '#e9f1e8',
      inkSoft: '#a5b8a6',
      accent: '#74c79d',
      border: '#30402f',
      texture: 'grid',
      displayFamily: 'Guia Space Grotesk',
    },
  },
];
