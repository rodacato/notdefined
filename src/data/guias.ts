export interface GuiaTheme {
  // Snapshot de portada de cada guía — NO es espejo vivo de su styles.css.
  // Son los tokens del modo oscuro (la colección es dark-first); si retoco la
  // paleta de una guía, este snapshot se actualiza a mano, a propósito.
  canvas: string;
  ink: string;
  inkSoft: string;
  accent: string;
  border: string;
  texture: 'grid' | 'grain' | 'stripes' | 'arcs';
  displayFamily: string; // nombre de la @font-face declarada en index.astro
}

export interface Guia {
  slug: string;
  title: string;
  blurb: string;
  date: string;
  tags: string[];
  tomo: number; // orden en la colección (I = primera publicada)
  theme: GuiaTheme;
}

export const guias: Guia[] = [
  {
    slug: 'design-patterns-1001',
    title: 'Patrones de diseño 1001',
    blurb:
      'El 101 ya te lo sabías; este es el 1001. Almanaque interactivo de los 23 patrones del GoF por el problema que resuelven: catálogo problema-primero, fichas con diagrama, antes → después, y desambiguación de los que se parecen.',
    date: '2026-07-10',
    tags: ['Patterns', 'GoF', 'Arquitectura'],
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
    slug: 'algorithms-1001',
    title: 'Algoritmos 1001',
    blurb:
      'Curso interactivo de algoritmos: Big O, búsquedas, ordenamiento, recursión, estructuras de datos, grafos, greedy y DP. Se aprende moviendo — predices, animas y comparas: 23 simulaciones en 7 módulos.',
    date: '2026-07-11',
    tags: ['Algoritmos', 'Big O', 'Estructuras de datos'],
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
