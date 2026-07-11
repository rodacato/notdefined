# Claude Design Prompts — notdefined.dev

> Ready-to-paste prompts for generating screen mockups in Claude Design / Google Stitch / v0 / Figma AI.
>
> **Workflow:**
> 1. Paste [`brand-kit-portable.md`](brand-kit-portable.md) once at the start of the session as system context.
> 2. Use one of the prompts below for the specific screen you want.
> 3. Review the result against the existing implementation (Adrian's screenshot or live URL).
> 4. If the result is right, save the mockup in `.local/design-mockups/<batch-name>/`.
>
> Prompts are written in English so they work consistently across tools. Output copy MUST be Spanish per the brand guard at the end of `brand-kit-portable.md`.

---

## Prompt 0 — Bootstrap (paste FIRST, before any screen)

```
You are designing screens for notdefined.dev — a personal technical blog by Adrian Castillo, an experienced engineer based in Mexico.

Brand brief: brutally minimal, single-accent indigo, monospace logo, dot-grid background, no gradients in body content, no drop shadows. The aesthetic is Vercel / Linear / Raycast — quiet, technical, opinionated. The full brand kit is in the previous message.

Rules for all outputs:
- Light theme. Background near-white (#FCFCFD), text near-black (#1E1E22), single accent indigo (#5B5BD6).
- Typography: Inter for UI/body, JetBrains Mono for code and the logo wordmark.
- Spanish copy. Mexican casual register. Use real-sounding titles, never Lorem-style English placeholders.
- Logo is the literal text "notdefined_" with the trailing underscore in the accent color. If you can't animate the blink, render the static underscore and note "blinks on live site".
- Subtle dot-grid background (24px spacing, very low opacity).
- No drop shadows. No hero sections. No marketing copy. No emoji in chrome.
- Cards: 1px border, 0.75rem radius, hover state = thin left accent stripe.
- Code blocks stay dark even in light theme (dark slate background, mono font).

Output format: a single SVG mockup, viewport 1280×800 for desktop screens. If asked for a component in isolation, output a tight component crop.

Confirm you understand the brief and I'll send the specific screen prompt next.
```

---

## Prompt 1 — Home / index page

```
Design the home page of notdefined.dev.

Sections, top to bottom:

1. Header (site-wide):
   - Left: the logo "notdefined_" — mono, underscore in accent indigo (blinking on live site).
   - Right: nav links — "blog", "TIL", "proyectos", "ahora", "sobre mí". Sans-serif, ~14px, muted text color, hover goes to accent.
   - Below the header: a 2px animated accent line (gradient sweep — render as a static gradient for the mockup).

2. Intro section:
   - Short intro paragraph (3-4 lines, Spanish, Adrian's voice — direct, no marketing). Something like:
     "Blog técnico personal. Posts en español, código en producción, opiniones sostenidas con experiencia. No es un tutorial site, no es un newsletter. Es lo que quería recordar en seis meses."
   - Below the intro, a small "ahora" widget with 1-2 lines of current activity ("construyendo: notdefined.dev", "leyendo: Designing Data-Intensive Applications").

3. Recent posts list (CardList style):
   - Border box, 1px border in light gray, 0.75rem radius.
   - 4-5 items stacked, separated by horizontal rule.
   - Each item: title (h3-sized, dark), date + tags row underneath (muted small text + tag pills).
   - Hover (render one item in hover state to show): thin 2px accent gradient stripe on the left edge.

4. Recent TILs list (CardList style):
   - Same anatomy as posts, shorter rows. Section header "TIL recientes" above.

5. Footer:
   - Muted text, very small. Year + "hecho con Astro" + link to source.

Use the dot-grid background subtly across the whole viewport. Spanish copy throughout. Mono only for the logo and any inline code in post titles (none expected here).
```

---

## Prompt 2 — Blog post page (single post)

```
Design a single blog post page on notdefined.dev.

Layout (1280×800 desktop):

1. Site header (same as home — logo, nav, accent line).

2. Article header (inside the article container, max-width ~720px, centered):
   - Small back-link: "← blog" (muted, hover to accent).
   - Uppercase label "BLOG POST" or the tag, accent color, letter-spacing wide, 12px.
   - Title (h1, ~32px, weight 600, letter-spacing -0.03em). Use a realistic Spanish title like:
     "Google Stitch: diseño para devs que no son diseñadores"
   - Metadata row underneath: date in muted color, dot separator, tag pills.

3. Article body (.prose):
   - First a TL;DR block (bullet list of 4-5 points, **bold key terms**), set inside the same body width.
   - Then h2 sections with body paragraphs.
   - Show a code block: dark background even in light theme, mono font, syntax-highlighted (Ruby or TypeScript). Add a subtle accent box-shadow on the code block to indicate the hover-glow effect.
   - Show a blockquote with the left border in accent-dim.
   - Show a table with 3-4 rows for variety.
   - Show inline code spans inside paragraphs.

4. Footer (same as home).

Body width is generous but not full-page. Surrounding margins reveal the dot-grid background.

Spanish content throughout. The title should be realistic and on-voice.
```

---

## Prompt 3 — TIL index page

```
Design the TIL index page on notdefined.dev.

Layout (1280×800 desktop):

1. Site header (logo, nav, accent line).

2. Page header:
   - Uppercase label "TIL" in accent indigo, wide letter-spacing.
   - Page title (h1): "Today I Learned"
   - Description (muted, max-width ~640px): "Notas cortas sobre cosas que descubrí, rompí, o vi de otra forma. Sin tutorial — solo el momento del aprendizaje."

3. Tag filter row (TagPill components):
   - 10-15 tag pills laid out horizontally with wrap. One pill in active state (background fills with accent, text inverts).

4. TIL list (CardList):
   - 8-10 items stacked.
   - Each item: short title (sentence-cased, h3 size), date underneath in muted.
   - One item rendered in hover state (left accent stripe).

5. Footer.

Spanish titles throughout. Use realistic TIL titles like:
- "Astro Content Collections valida frontmatter en build time"
- "El truco del flag `--no-track` en git branch"
- "JetBrains Mono tiene ligaduras que rompen en algunos terminales"
```

---

## Prompt 4 — About / "Sobre mí" page

```
Design the "Sobre mí" (about) page on notdefined.dev.

Layout (1280×800 desktop):

1. Site header.

2. Page header:
   - Uppercase label "SOBRE MÍ" in accent.
   - Title "Adrian Castillo" (h1).
   - Subtitle line below: "Staff engineer · Colima, México · escribiendo desde 2008".

3. Body (max-width 720px, prose styles):
   - 3-4 paragraphs of bio in Adrian's voice — direct, anchored in real projects (Invoy, michelada.io, Crowd Interactive). Mention Ruby, Rails, healthtech, fintech. Spanish casual mexicano.
   - A subsection "Cosas que me importan" with 4-5 bullet points (e.g., "código que se lee", "decisiones con tradeoffs explícitos", "ser honesto con el lector").
   - A subsection "Stack actual" — a simple table or list of current tools.
   - A subsection "Dónde más" — links to GitHub, Twitter/X, email, RSS. Just links, no social-media-icon bar.

4. Footer.

No photo of Adrian. The page is text-only — the brand is the cursor, not a face.
```

---

## Prompt 5 — Projects page (catalog of repos)

```
Design the projects page on notdefined.dev.

Layout (1280×800 desktop):

1. Site header.

2. Page header:
   - Uppercase label "PROYECTOS".
   - Title (h1): "Proyectos".
   - Description: "Lo que estoy construyendo, lo que dejé andando, lo que sigue vivo en mi GitHub."

3. Grid or list of project cards (use CardList anatomy or a 2-column grid — pick what reads better):
   - Each card: project name (h3 with mono accent), one-line tagline (Spanish), status pill (e.g., "activo", "en pausa", "abandonado"), language tag, GitHub link.
   - 6-8 example projects. Realistic names like "stockerly", "drawhaus", "dojo", "notdefined.dev".

4. Footer.

Status pills use the muted neutral surface — NOT new status colors. The brand has only one accent; activity status is communicated by label, not hue.
```

---

## Prompt 6 — Single component crop (any from `components.md`)

```
Design a tight crop of the [COMPONENT NAME] component from notdefined.dev.

Render the component in isolation against the dot-grid background. Show its anatomy: default state, hover state, active state (where applicable), and any responsive collapse if relevant.

Add small labels next to each state explaining what's being shown.

For TagPill: show default + hover + active.
For CardList: show 3 items, with item 2 in hover state.
For PageHeader: show with all optional props rendered.

Output viewport: 800×600. Single-color background (the page bg with dot grid).
```

---

## Prompt 7 — Interactive guide export contract (for `/guias/`)

Guides are standalone artifacts served from `public/guias/<slug>/` (see
[ADR 0005](../architecture/adr/0005-interactive-guides-collection.md)). They
do NOT use the site's design system — full visual freedom per guide. Append
this block to any guide prompt in Claude Design; on an existing project,
prefix it with "Reestructura este proyecto para cumplir este contrato".
Export as **Project archive** (free) — never Standalone HTML (costs tokens,
produces an uneditable blob). Kept in Spanish because that's how it's pasted
and how it was validated.

Calibrated against a real export (design-patterns-101, 2026-07-10): the
contract was followed almost verbatim — exact file split, data/mechanics
separation with self-documenting comments, vanilla hash-router SPA, origin
footer. The last three rules below exist because the export ALSO shipped
noise: the pre-contract multi-page version, an unrequested `astro-export/`
project, and an unused design-system bundle (`_ds/`). On import, delete
`screenshots/` and `.thumbnail` (Claude Design export cruft — not
prompt-preventable).

```text
## Contrato técnico del proyecto (obligatorio)

Prepara el proyecto para ser exportado como "Project archive" e integrado
a un sitio estático, donde el dueño seguirá editándolo a mano sin tu ayuda.

### Estructura de archivos
- Archivos separados, NUNCA todo inline: `index.html` + `styles.css` + `data.js` + `app.js`.
- Sin build step, sin frameworks, sin npm: vanilla HTML/CSS/JS.
- Regla clave — separa el guión del motor:
  - `data.js` exporta SOLO el contenido: pasos de la simulación, textos,
    definiciones, ejemplos, escenarios. Estructura de datos plana y comentada
    con un ejemplo de cómo agregar una entrada nueva.
  - `app.js` contiene SOLO la mecánica: estado, render, controles, animaciones.
  - Criterio de éxito: agregar o corregir contenido debe requerir tocar
    únicamente `data.js`.

### Portabilidad
- Rutas relativas siempre (`./styles.css`, `./app.js`) — el proyecto vivirá
  bajo un subdirectorio (`/guias/<slug>/`).
- Cero requests externos: nada de CDNs, sin Google Fonts (usa `system-ui`),
  imágenes como SVG inline. Prueba de fuego: debe funcionar offline
  abriendo `index.html` con doble click.
- Sin analytics, sin trackers, sin service workers.

### Metadata y navegación
- `<html lang="es">`, `<title>` descriptivo y `<meta name="description">`.
- Arriba a la izquierda, discreto: `<a href="/">← notdefined.dev</a>`.
- Al pie: "Generada con Claude Design · {mes año}".

### Interacción y accesibilidad
- Responsive real — se consultará desde el celular.
- Si hay animación o simulación: controles de play/pausa/paso operables con
  teclado, y respetar `prefers-reduced-motion` (mostrar el estado final sin
  animar).
- Cada paso de una simulación cambia UNA sola cosa visible, con una línea de
  narración de qué acaba de pasar.

### Código
- JavaScript claro y editable a mano: nombres descriptivos, funciones cortas,
  sin minificar, sin abstracciones genéricas "por si acaso".
- Comentarios solo donde el porqué no es obvio, en español.

### Entrega
- La entrega final son EXACTAMENTE estos archivos: `index.html`,
  `styles.css`, `data.js`, `app.js`. Elimina páginas HTML de versiones
  anteriores del proyecto.
- No generes exports alternativos (Astro, React, Vite) — solo la versión
  vanilla.
- No incluyas design systems externos ni bundles de otros proyectos.
```

Import checklist (manual, per guide): copy the four files to
`public/guias/<slug>/`, add the entry to `src/data/guias.ts`, delete export
cruft, verify offline double-click + the `←  notdefined.dev` link.

---

## Iteration loop

After Claude Design returns a mockup:

1. Save the SVG / PNG to `.local/design-mockups/<batch>/<screen>.svg`.
2. Compare to the live site (or current implementation) — does it preserve the brand? Use the panel in [`../research/experts.md`](../research/experts.md), expert **C4 (Pilar Solano)**.
3. If divergent: identify which rule was missed, refine the bootstrap prompt or the screen prompt, regenerate.
4. If aligned but missing detail: regenerate with a more specific instruction ("the code block needs a thin accent shadow on hover").

Per [ADR 0004](../architecture/adr/0004-visual-effects-system.md) and anti-pattern #6 (fragmenting redesigns), only one screen redesign at a time. Close it (mockup → SPEC → implementation → screenshot) before starting another.

---

## When to update these prompts

- A token in [`tokens.md`](tokens.md) changes → update Prompt 0 and the [`brand-kit-portable.md`](brand-kit-portable.md).
- A new component lands in [`components.md`](components.md) → add a Prompt N for the new component.
- A generated mockup repeatedly drifts on a rule → add the rule explicitly to Prompt 0.

The prompts are living artifacts. Keep them in sync with the runtime tokens; otherwise the generated mockups will lie.
