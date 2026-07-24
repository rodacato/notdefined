// Registry of blog series — the single source for their intent.
//
// Membership (which posts belong) lives in each post's `series` frontmatter.
// This file holds what the frontmatter can't: the thesis, the audience, the
// status, and the curation order shown on /blog/series. It doubles as the
// editorial guide — before starting a post, check whether it extends a series.
//
// The `name` MUST match the `series:` value in the post frontmatter exactly, or
// the series renders without its thesis.

export type SeriesStatus = 'active' | 'complete' | 'paused';

export interface Series {
  name: string;
  thesis: string;
  audience?: string;
  status: SeriesStatus;
  order: number;
}

export const series: Series[] = [
  {
    name: 'Ruby Internals',
    thesis:
      'Cómo funciona Ruby por dentro: el modelo del objeto, la concurrencia y el runtime. El modelo mental de la máquina, no recetas de gemas.',
    audience: 'Para quien ya escribe Ruby y quiere el porqué.',
    status: 'active',
    order: 1,
  },
  {
    name: 'Rails 8 Stack',
    thesis:
      'El stack que Rails 8 trae por defecto: background jobs, caché y deploy sin Redis ni Kubernetes.',
    audience: 'Para quien evalúa qué tan lejos llegan los defaults de Rails 8.',
    status: 'active',
    order: 2,
  },
  // Solo 2 partes — decidir si es serie de verdad (con arco planeado) o si
  // debería ser tag. Ver docs/editorial: umbral ≥3 posts + tesis.
  {
    name: 'DDD funcional',
    thesis:
      'DDD funcional en la práctica: el modelo mental que fui armando en tres empresas, y por qué su boilerplate se volvió ventaja con la IA.',
    audience: 'Para quien modela dominio y sospecha que Rails no basta.',
    status: 'active',
    order: 3,
  },
  // Solo 2 partes — misma decisión pendiente que DDD funcional.
  {
    name: 'Docker en la práctica',
    thesis:
      'Docker aplicado, de la primera imagen a builds multi-stage que no pesan 2 GB.',
    audience: 'Para quien ya containeriza y quiere apretar.',
    status: 'active',
    order: 4,
  },
];

export const seriesByName = (name: string): Series | undefined =>
  series.find((s) => s.name === name);

export const statusLabel: Record<SeriesStatus, string> = {
  active: 'En curso',
  complete: 'Completa',
  paused: 'En pausa',
};
