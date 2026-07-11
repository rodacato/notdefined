export interface Guia {
  slug: string;
  title: string;
  blurb: string;
  date: string;
  tags: string[];
}

export const guias: Guia[] = [
  {
    slug: 'algorithms-1001',
    title: 'Algoritmos 1001',
    blurb:
      'Curso interactivo de algoritmos: Big O, búsquedas, ordenamiento, recursión, estructuras de datos, grafos, greedy y DP. Se aprende moviendo — predices, animas y comparas: 23 simulaciones en 7 módulos.',
    date: '2026-07-11',
    tags: ['Algoritmos', 'Big O', 'Estructuras de datos'],
  },
  {
    slug: 'architectures-1001',
    title: 'Arquitecturas 1001',
    blurb:
      'Almanaque de 21 estilos de arquitectura en 5 familias, problema-primero: cada estilo nació de una presión y cobra un precio. Las 21 fichas con topología y trade-offs, filtro por dolor, comparaciones lado a lado y quiz para probar el ojo.',
    date: '2026-07-11',
    tags: ['Arquitectura', 'Trade-offs', 'Sistemas distribuidos'],
  },
  {
    slug: 'design-patterns-1001',
    title: 'Patrones de diseño 1001',
    blurb:
      'El 101 ya te lo sabías; este es el 1001. Almanaque interactivo de los 23 patrones del GoF por el problema que resuelven: catálogo problema-primero, fichas con diagrama, antes → después, y desambiguación de los que se parecen.',
    date: '2026-07-10',
    tags: ['Patterns', 'GoF', 'Arquitectura'],
  },
];
