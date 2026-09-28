export type LabStatus = 'live' | 'experimental' | 'archived';

export interface Lab {
  slug: string;
  href?: string;
  title: string;
  blurb: string;
  status: LabStatus;
  date: string;
  tags: string[];
  requirements?: string;
  metric?: string;
  post?: { href: string; label: string };
}

export const labHref = (lab: Lab) => lab.href ?? `/lab/${lab.slug}`;

export const labLinkAttrs = (lab: Lab) =>
  lab.href ? { target: '_blank', rel: 'noopener noreferrer' } : {};

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
    metric: '8 modos',
    post: {
      href: '/blog/ver-tu-sitio-con-otros-ojos/',
      label: 'Lee el post',
    },
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
  {
    slug: 'pattern-circuit',
    href: 'https://rodacato.github.io/pattern-circuit/',
    title: 'Pattern Circuit',
    blurb:
      'Patrones de diseño que se ven en vez de leerse: una cafetería es un circuito, cada pedido un pulso de luz, y enchufas un patrón para arreglar lo que falla. Con el código en Ruby o TypeScript.',
    status: 'experimental',
    date: '2026-09-24',
    tags: ['juego', 'patrones de diseño', 'TypeScript'],
    requirements: 'desktop',
    metric: '27 niveles · 20 patrones',
  },
  {
    slug: 'knotty',
    href: 'https://rodacato.github.io/knotty/',
    title: 'Knotty',
    blurb:
      'De unas fotos a un mueble de triplay en 3D que ajustas platicando con un carpintero experto (un LLM): cómo se arma y cuántas hojas comprar. Tu propia API key, sin backend.',
    status: 'experimental',
    date: '2026-09-24',
    tags: ['LLM', 'React Three Fiber', 'BYOK'],
    requirements: 'sin API key corre en modo simulado',
  },
  {
    slug: 'ai-town',
    href: 'https://rodacato.github.io/ai-town/',
    title: 'AI Town',
    blurb:
      'Un pueblo de vecinos con personalidad y memoria que reaccionan a pregones verdaderos o falsos. Sirve para comparar modelos con los mismos pregones —decisiones, latencia, tokens y costo— o para dejar que una IA gobierne el terrario.',
    status: 'experimental',
    date: '2026-09-23',
    tags: ['LLM', 'multi-agente', 'PixiJS'],
    requirements: 'sin API key corre en modo simulado',
    metric: '20 residentes',
  },
];
