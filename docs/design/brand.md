# Brand — notdefined.dev

> Concept, voice, logo. Qualitative side of the brand. For tokens and components, see [`tokens.md`](tokens.md) and [`components.md`](components.md). For a single-file pegable kit for external AI design tools, see [`brand-kit-portable.md`](brand-kit-portable.md).

---

## Concept

**notdefined.dev** is the personal technical blog of Adrian Castillo, where posts are drafted by AI agents and refined by Adrian. The name is the thesis — `not defined` is the JS / Ruby / Python state of "exists but hasn't been given a value yet". Ideas in progress. Things about to become something.

The trailing blinking `_` in the wordmark is the visual proof. It IS the brand.

---

## Tagline candidates

In rotation; one per surface, not all at once:

- `undefined → deployed`
- `ideas that compile before they ship`
- `where the cursor blinks`

---

## Logo

### Wordmark

```
notdefined_
```

- Set in monospace (JetBrains Mono is canonical; Inter as semi-fallback).
- The trailing `_` blinks via `.cursor-blink` (CSS animation `blink 1.1s step-start infinite`).
- The `_` is the accent color; the rest of the wordmark is body text color.
- **No icon** — the wordmark is the logo.

### Favicon

A single `_` character, bold, centered in a rounded square:

- Background: `--color-surface-2`
- Character: `--color-accent`
- Padding: ~30% of container size

---

## Voice

For visual / interaction design:

- **Brutally minimal.** Vercel / Linear / Raycast as references. No gradients, no drop shadows, no 3D, no decorative chrome.
- **Subtle effects, not loud ones.** Dot grid background, cursor glow on pointer, hover accent on cards — present but never competing with text.
- **Monospace as a character note.** The logo is mono; code blocks are mono; UI labels use the sans (Inter) — the contrast is intentional.
- **One accent, never two.** Indigo carries every interactive cue. Adding a second accent dilutes the cursor metaphor.
- **Reduced motion is mandatory.** Every effect ships with a `prefers-reduced-motion` branch — see [ADR 0004](../architecture/adr/0004-visual-effects-system.md).

For copy:

- See [`../../GHOSTWRITER.md`](../../GHOSTWRITER.md) for editorial voice (blog posts, TILs).
- For UI / chrome / nav: español mexicano casual, technical terms in English. Direct, no marketing fluff.

---

## What this brand is NOT

- **Not corporate.** "We are excited to announce..." is not the voice.
- **Not playful.** No emojis in chrome, no cartoonish illustrations, no playful microcopy that fights the brutalist aesthetic.
- **Not high-contrast neon.** The accent is muted indigo, not Vercel-style cyan-magenta.
- **Not a "tech bro" brand.** The tone is opinion-with-experience, not "founder energy".

---

## File reference

| File | Purpose |
|------|---------|
| [`tokens.md`](tokens.md) | Color, typography, spacing — canonical tokens |
| [`components.md`](components.md) | Recipes for PageHeader, CardList, TagPill, primitives |
| [`brand-kit-portable.md`](brand-kit-portable.md) | Single-file pegable kit for Claude Design / Stitch / v0 |
| [`claude-design-prompts.md`](claude-design-prompts.md) | Ready-to-paste prompts for generating screens |
| [`../../src/styles/global.css`](../../src/styles/global.css) | The actual runtime tokens — source of truth |
| [`../../src/layouts/BaseLayout.astro`](../../src/layouts/BaseLayout.astro) | Font loading, HTML shell, header/footer |
| [`../../astro.config.mjs`](../../astro.config.mjs) | Shiki theme (`github-dark-dimmed`) for code blocks |
