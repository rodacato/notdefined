export interface Guia {
  slug: string;
  title: string;
  blurb: string;
  date: string;
  tags: string[];
}

export const guias: Guia[] = [
  {
    slug: 'design-patterns-1001',
    title: 'Patrones de diseño 1001',
    blurb:
      'El 101 ya te lo sabías; este es el 1001. Almanaque interactivo de los 23 patrones del GoF por el problema que resuelven: catálogo problema-primero, fichas con diagrama, antes → después, y desambiguación de los que se parecen.',
    date: '2026-07-10',
    tags: ['Patterns', 'GoF', 'Arquitectura'],
  },
];
