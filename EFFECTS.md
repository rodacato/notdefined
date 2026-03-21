# EFFECTS.md — Efectos visuales del sitio

Catálogo de efectos implementados y planeados. El objetivo es que el sitio se sienta vivo, alegre e inteligente sin distraer del contenido.

---

## Implementados

| Efecto | Dónde aplica | Tipo | Archivo principal |
|--------|-------------|------|-------------------|
| Dot grid background | Global (todas las páginas) | CSS | `global.css` |
| Noise texture overlay | Global (todas las páginas) | CSS | `global.css` |
| Cursor glow sutil | Global (solo desktop) | CSS + JS | `global.css`, `BaseLayout.astro` |
| Header accent line animada | Global (header) | CSS | `global.css`, `BaseLayout.astro` |
| Scroll-aware header blur | Global (header, sticky) | CSS + JS | `BaseLayout.astro` |
| Gradient mesh en hero | Landing (`/`) | CSS | `index.astro` |
| Staggered fade-in al scroll | Landing, Blog index, TIL index, Projects | CSS + JS | `global.css`, `BaseLayout.astro` |
| Hover accent border en cards | Todas las listas con `card-list-item` | CSS | `global.css` |
| Glow border en code blocks | Blog post, TIL post (`.prose pre`) | CSS | `global.css` |
| Tag pills float animation | Blog index, TIL index, Projects, Blog post | CSS + JS | `global.css`, `BaseLayout.astro` |
| Parallax sections | Landing (`/`) — posts recientes y TILs | JS | `index.astro`, `BaseLayout.astro` |

---

## Propuestos (sin confirmar)

Efectos sugeridos pendientes de decisión.

### Reading progress bar

Barra delgada (3px) en el top de la página que avanza conforme scrolleas el artículo.

- **Dónde:** Blog post individual (`/blog/[slug]/`)
- **Tipo:** CSS + JS

### Heading anchor reveal

Al hacer hover sobre un H2/H3, aparece un `#` link sutil a la izquierda para copiar el anchor.

- **Dónde:** Blog post individual
- **Tipo:** CSS + JS

### Pulse dot en fecha

Punto con animación pulse al lado de la fecha, como "recién aprendido".

- **Dónde:** TIL individual (`/til/[slug]/`)
- **Tipo:** CSS

### Status dot pulse

Los badges de status "activo" en proyectos tienen un dot con pulse animation (LED encendido).

- **Dónde:** Projects (`/projects/`)
- **Tipo:** CSS

### Card tilt on hover

Micro-rotate (1-2deg) en la card al hover para dar profundidad.

- **Dónde:** Projects (`/projects/`)
- **Tipo:** CSS

### Input glow on focus

Campo de búsqueda con box-shadow accent animado al enfocarlo.

- **Dónde:** Search (`/search/`)
- **Tipo:** CSS
