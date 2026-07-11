export interface GuiaTheme {
  // Snapshot de portada de cada guía — NO es espejo vivo de su styles.css.
  // Son los tokens del modo oscuro (la colección es dark-first); si retoco la
  // paleta de una guía, este snapshot se actualiza a mano, a propósito.
  canvas: string;
  ink: string;
  inkSoft: string;
  accent: string;
  border: string;
  texture: 'grid' | 'grain';
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
