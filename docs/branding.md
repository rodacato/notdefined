# notdefined.dev — Brand Guide

## Concept

**notdefined.dev** is a personal blog by Adrian Castillo, a full-stack developer with 10+ years of experience, where posts are drafted by AI agents and refined by a human. The name is a programming reference — `not defined` is what happens when something exists but hasn't been given a value yet. Ideas in progress. Things about to become something.

### Tagline options

- `undefined → deployed`
- `ideas that compile before they ship`
- `where the cursor blinks`

---

## Logo

### Wordmark

```
notdefined_
```

The trailing `_` is a **blinking terminal cursor** — the symbol of something waiting to be defined. It's the core visual identity of the brand.

- Rendered in monospace (`JetBrains Mono` or `Inter`)
- The `_` blinks in accent color (`#818CF8` indigo)
- No icon needed — the wordmark is the logo

### Favicon

A single `_` character, bold, centered in a dark rounded square:
- Background: `#141416`
- Character: `#818CF8`
- Padding: ~30% of container size

### CSS implementation (already in codebase)

```css
.cursor-blink {
  color: var(--color-accent);
  animation: blink 1.1s step-start infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
```

### Prompt for AI image generation (Nano Banana / Midjourney / DALL-E)

```
Minimalist tech logo for a developer personal blog called "notdefined.dev".

Wordmark: the text "notdefined" followed by a blinking underscore cursor "_".
The underscore is the focal point, rendered in electric indigo (#818CF8).
All text in near-white (#EBEBEB) on deep dark background (#0C0C0E).

Style: flat, no gradients, no drop shadows, no 3D, no decorative elements.
Aesthetic references: Vercel, Linear, Raycast — brutally minimal.
Font style: monospace, clean, technical.

Also generate a standalone favicon variant: just the "_" character, bold,
centered in a dark rounded square (#141416 background, #818CF8 foreground).

Output: SVG-clean, vector-sharp, transparent background option.
```

---

## Color Palette

All colors defined as CSS custom properties in `src/styles/global.css` using OKLCH.

| Token | OKLCH | Hex approx | Use |
|-------|-------|------------|-----|
| `--color-bg` | `oklch(8% 0.015 250)` | `#0C0C0E` | Page background |
| `--color-surface` | `oklch(12% 0.018 250)` | `#141416` | Cards, sidebar |
| `--color-surface-2` | `oklch(16% 0.018 250)` | `#1C1C1F` | Inline code, hover |
| `--color-border` | `oklch(22% 0.016 250)` | `#27272A` | Borders, dividers |
| `--color-text` | `oklch(92% 0.007 250)` | `#EBEBEB` | Body text |
| `--color-muted` | `oklch(50% 0.012 250)` | `#71717A` | Dates, metadata |
| `--color-accent` | `oklch(68% 0.20 265)` | `#818CF8` | Links, cursor, highlights |
| `--color-accent-dim` | `oklch(45% 0.15 265)` | `#4F46E5` | Quote borders, subtle accent |

### Palette rationale

- **Dark base** (`250` hue) — blue-shifted black, cooler and cleaner than neutral gray
- **Indigo accent** (`265` hue) — associated with AI tools (Linear, Cursor, Vercel AI), modern without being generic
- **Single accent** — enforces minimalism; nothing competes with the cursor `_`

### Light mode (if added later)

Swap these tokens:
```css
@media (prefers-color-scheme: light) {
  :root {
    --color-bg:      oklch(99% 0.005 250);
    --color-surface: oklch(96% 0.008 250);
    --color-text:    oklch(12% 0.015 250);
    --color-muted:   oklch(52% 0.012 250);
    --color-accent:  oklch(52% 0.27 265);  /* darker for contrast on light */
  }
}
```

---

## Typography

### Fonts

| Role | Font | Fallback |
|------|------|---------|
| Headings + UI | **Inter** | `system-ui, -apple-system, sans-serif` |
| Body text | **Inter** | same |
| Code + logo | **JetBrains Mono** | `Fira Code, ui-monospace, monospace` |

Loaded via Google Fonts in `BaseLayout.astro`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### Type scale

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Page title (h1) | `1.875rem` | 600 | Blog post title |
| Section (h2) | `1.375rem` | 600 | |
| Body | `1.05rem` | 400 | Line height 1.8 |
| UI / nav | `0.875rem` | 400–500 | |
| Metadata | `0.8rem` | 400 | Muted color |
| Code | `0.875em` | 400 | JetBrains Mono |

---

## Voice & Tone

Writing style for posts (see GHOSTWRITER.md for full editorial guide):

- **Technical but approachable** — explains concepts clearly, doesn't condescend
- **Opinionated** — has a point of view, says "I think" when it's opinion
- **Practical** — grounded in real experience, favors working examples over theory
- **Occasional humor** — dry, not forced; a well-placed analogy over a pun
- **Concise** — respects the reader's time; 800–1500 words is the sweet spot
- **First-person** — "I've been doing X" not "developers should X"

Avoid: buzzwords, hype, corporate hedging ("leverage", "utilize", "holistic").

---

## File reference

| File | Purpose |
|------|---------|
| [src/styles/global.css](src/styles/global.css) | All design tokens (`@theme`), base styles, cursor animation |
| [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) | Font loading, HTML shell, header/footer |
| [astro.config.mjs](astro.config.mjs) | Shiki theme (`github-dark-dimmed`) for code blocks |
