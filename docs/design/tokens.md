# Tokens — notdefined.dev

> Color, typography, spacing tokens. Canonical version of what lives in [`../../src/styles/global.css`](../../src/styles/global.css) `@theme` block. When the CSS changes, this file must change with it — drift makes both useless.

---

## Theme

**Current default:** Light.

The site renders light by default (`color-scheme: light`). Dark mode is a future possibility and is documented at the end of this file as a non-current variant.

---

## Color tokens

All colors in OKLCH. Hex approximations are informational only — OKLCH is the authoritative form.

### Light (current)

| Token | OKLCH | Hex approx | Use |
|-------|-------|------------|-----|
| `--color-bg` | `oklch(99.5% 0.002 250)` | `#FCFCFD` | Page background |
| `--color-surface` | `oklch(96.5% 0.005 250)` | `#F4F4F6` | Cards, sidebar |
| `--color-surface-2` | `oklch(93% 0.007 250)` | `#EAEAEE` | Inline code background, hover, tag pill background |
| `--color-border` | `oklch(87% 0.01 250)` | `#D7D7DC` | Borders, dividers |
| `--color-text` | `oklch(13% 0.012 250)` | `#1E1E22` | Body text |
| `--color-muted` | `oklch(48% 0.012 250)` | `#76767A` | Dates, metadata, secondary text |
| `--color-accent` | `oklch(52% 0.22 275)` | `#5B5BD6` | Links, cursor, active states, accent line |
| `--color-accent-dim` | `oklch(72% 0.14 275)` | `#9B9CE0` | Quote borders, accent gradients, underline color |

### Code blocks

Code blocks intentionally stay dark for contrast, regardless of theme. This is a recipe in [`components.md`](components.md), not a separate token set.

### Palette rationale

- **Light base** (`250` hue) — slightly blue-cooled near-white, less sterile than `#FFFFFF`.
- **Indigo accent** (`275` hue) — associated with AI tools (Linear, Cursor, Vercel AI). Modern without being generic.
- **Single accent** — enforces minimalism. Nothing competes with the cursor `_`.

---

## Typography

### Families

| Role | Font | Fallback |
|------|------|---------|
| Sans (headings, body, UI) | **Inter** | `system-ui, -apple-system, sans-serif` |
| Mono (code + logo wordmark) | **JetBrains Mono** | `Fira Code, ui-monospace, monospace` |

Loaded via Google Fonts in `BaseLayout.astro`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

CSS tokens:

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
```

### Scale

| Element | Size | Weight | Line-height | Notes |
|---------|------|--------|-------------|-------|
| Page title (h1) | `clamp(1.75rem, 3vw, 2rem)` | 600 | 1.25 | Letter-spacing `-0.03em` |
| Section (h2 in prose) | `1.4rem` | 600 | 1.25 | Letter-spacing `-0.02em` |
| Subsection (h3 in prose) | `1.15rem` | 600 | 1.25 | |
| Body | `1.0625rem` | 400 | 1.8 | Inside `.prose` |
| Body (non-prose) | `1rem` | 400 | 1.7 | Default body |
| UI / nav | `0.85rem` – `0.95rem` | 400–500 | — | |
| Page label (uppercase) | `0.75rem` | 500 | — | `letter-spacing: 0.1em`, uppercase, accent color |
| Metadata (dates) | `0.8rem` | 400 | — | Muted color |
| Tag pill | `0.68rem` | 500 | — | `letter-spacing: 0.03em` |
| Code (inline + block) | `0.875em` | 400 | 1.7 | Mono |

---

## Spacing

No formal scale token. Spacing uses Tailwind utilities + a few ad-hoc values inside `.prose`. If a formal scale becomes useful, add it here.

Common rhythm inside `.prose`:

- Paragraph → paragraph: `1.4em` bottom margin
- Heading → next block: `0.6em` bottom from heading, `2em` top before heading
- List items: `0.35em` top + bottom

---

## Radii

| Use | Value |
|-----|-------|
| Card list | `0.75rem` |
| Code block | `0.5rem` |
| Inline code | `0.25rem` |
| Tag pill | `0.25rem` |
| Image in prose | `0.5rem` |

---

## Effects

See [ADR 0004](../architecture/adr/0004-visual-effects-system.md) for the contract.

- **Dot grid background:** radial-gradient of `oklch(70% 0.01 250 / 0.18)` 1px dots on 24px grid.
- **Noise overlay:** SVG turbulence, opacity 0.03, z-index 9999 (above everything, decorative).
- **Cursor glow:** 400px radial-gradient of `oklch(52% 0.22 275 / 0.045)`, follows pointer on devices with `pointer: fine`. Hidden on coarse pointers (touch).
- **Accent line in header:** animated gradient sweep, 8s ease-in-out infinite alternate.
- **Code block glow on hover:** accent-tinted box-shadow, `0 0 20px oklch(52% 0.22 275 / 0.06)`.
- **Staggered fade-in:** `.fade-in-item` with `is-visible` class trigger on scroll.
- **Cursor blink:** `blink 1.1s step-start infinite` on `.cursor-blink`.

All effects respect `prefers-reduced-motion` per ADR 0004.

---

## Dark mode (future, not current)

The brand was originally specced for dark. Light won when the site shipped. Dark mode can return as a `prefers-color-scheme: dark` override if there's a real reason (currently not a JTBD).

Tentative dark tokens, for reference only:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:        oklch(8% 0.015 250);     /* near-black, cool */
    --color-surface:   oklch(12% 0.018 250);
    --color-surface-2: oklch(16% 0.018 250);
    --color-border:    oklch(22% 0.016 250);
    --color-text:      oklch(92% 0.007 250);
    --color-muted:     oklch(60% 0.012 250);
    --color-accent:    oklch(68% 0.20 265);     /* lifted for contrast */
    --color-accent-dim: oklch(45% 0.15 265);
  }
}
```

Switching to dark requires:
- Re-validating prose contrast against the new background.
- Re-validating dot grid density and noise opacity.
- A decision on whether code blocks stay their fixed dark or invert.
- An ADR documenting the trade-off.

---

## Source-of-truth contract

The runtime authority is `src/styles/global.css`. This file documents the tokens for design tooling and contributors. **Two-way sync rule:** when the CSS changes, edit this file in the same commit. When this file changes, edit the CSS in the same commit.
