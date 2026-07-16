export type LabStatus = 'live' | 'experimental' | 'archived';

export interface Lab {
  slug: string;
  title: string;
  blurb: string;
  status: LabStatus;
  date: string;
  tags: string[];
  requirements?: string;
  metric?: string;
  post?: { href: string; label: string };
}

export const statusLabel: Record<LabStatus, string> = {
  live: 'live',
  experimental: 'experimental',
  archived: 'archivado',
};

export const labs: Lab[] = [
  {
    slug: 'a11y',
    title: 'Ver tu sitio con otros ojos',
    blurb:
      'Simulador de condiciones visuales: daltonismo con las matrices correctas (Machado 2009), visión baja, cataratas, glaucoma. Aplícalo a este blog o a la URL que quieras.',
    status: 'experimental',
    date: '2026-07-15',
    tags: ['a11y', 'SVG', 'feColorMatrix'],
    requirements: 'cualquier navegador',
    metric: '7 condiciones',
  },
  {
    slug: 'gemma',
    title: 'Gemma 3n en el navegador',
    blurb:
      'Un LLM de 3 GB corriendo 100% local, sin servidor. Mide el costo real —peso, cold start, tok/s— en tu propia máquina.',
    status: 'experimental',
    date: '2026-06-29',
    tags: ['WebGPU', 'LLM', 'MediaPipe'],
    requirements: 'WebGPU · ~3 GB · desktop',
    metric: '~12 tok/s',
    post: {
      href: '/blog/gemma-3n-en-el-navegador-brutal-como-experimento-malo-como-feature/',
      label: 'Lee el post',
    },
  },
];
