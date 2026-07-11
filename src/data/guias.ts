export interface Guia {
  slug: string;
  title: string;
  blurb: string;
  date: string;
  tags: string[];
}

export const guias: Guia[] = [
  {
    slug: 'architectures-1001',
    title: 'Arquitecturas 1001',
    blurb:
      'Almanaque de 21 estilos de arquitectura en 5 familias, problema-primero: cada estilo nació de una presión y cobra un precio. Filtro por dolor, comparaciones lado a lado y quiz para probar el ojo. Tomo I en progreso: 7 fichas profundas con topología y trade-offs; el resto trae su semilla de catálogo.',
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
