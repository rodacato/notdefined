export interface Guia {
  slug: string;
  title: string;
  blurb: string;
  date: string;
  tags: string[];
}

export const guias: Guia[] = [
  {
    slug: 'design-patterns-101',
    title: 'Patrones de diseño 101',
    blurb:
      'Almanaque interactivo de los 23 patrones del GoF, ordenados por el problema que resuelven: catálogo problema-primero, fichas con diagrama, antes → después, y desambiguación de los que se parecen.',
    date: '2026-07-10',
    tags: ['Patterns', 'GoF', 'Arquitectura'],
  },
];
