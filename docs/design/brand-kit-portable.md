# notdefined.dev Brand Kit · v1.0 · Portable

> **Palette:** Indigo Mono — light theme · **Logo:** `notdefined_` (blinking terminal cursor)
> Personal technical blog · Spanish editorial · brutally minimal · 2026

Single-file pegable brand kit for external AI design tools (Claude Design, Google Stitch, Figma AI, v0). Keep in sync with `tokens.md`, `brand.md`, and `components.md` — diff at sprint close.

---

## 1. Concept

**notdefined.dev** is a personal technical blog by Adrian Castillo. The name is the thesis: `not defined` is the language state for "exists but hasn't been given a value yet". Ideas in progress. Things about to become something. The trailing blinking `_` cursor in the wordmark is the visual proof.

**Tone:** brutally minimal, opinion-with-experience, dry humor. Vercel / Linear / Raycast as aesthetic references.

**Anti-tone:** corporate enthusiasm, neon dashboards, cartoon illustration, emoji-heavy chrome, "founder energy".

---

## 2. Color tokens

### 2.1 Token table (light, current)

All colors in OKLCH. Hex is informational.

| Token | OKLCH | Hex |
|---|---|---|
| `color.bg` | `oklch(99.5% 0.002 250)` | `#FCFCFD` |
| `color.surface` | `oklch(96.5% 0.005 250)` | `#F4F4F6` |
| `color.surface-2` | `oklch(93% 0.007 250)` | `#EAEAEE` |
| `color.border` | `oklch(87% 0.01 250)` | `#D7D7DC` |
| `color.text` | `oklch(13% 0.012 250)` | `#1E1E22` |
| `color.muted` | `oklch(48% 0.012 250)` | `#76767A` |
| `color.accent` | `oklch(52% 0.22 275)` | `#5B5BD6` |
| `color.accent-dim` | `oklch(72% 0.14 275)` | `#9B9CE0` |

### 2.2 Usage rules

- **One accent.** Indigo carries every interactive cue (links, cursor, active state, accent line). Never add a second hue.
- **No gradients except the accent line + card hover.** Backgrounds are flat fills.
- **Code blocks stay dark** even in light theme — they're a separate visual island for contrast and readability.

### 2.3 Tailwind CSS 4 `@theme` block

```css
@import "tailwindcss";

@theme {
  --color-bg:           oklch(99.5% 0.002 250);
  --color-surface:      oklch(96.5% 0.005 250);
  --color-surface-2:    oklch(93% 0.007 250);
  --color-border:       oklch(87% 0.01 250);
  --color-text:         oklch(13% 0.012 250);
  --color-muted:        oklch(48% 0.012 250);
  --color-accent:       oklch(52% 0.22 275);
  --color-accent-dim:   oklch(72% 0.14 275);

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}
```

---

## 3. Typography

### 3.1 Families

| Role | Family | Fallback |
|---|---|---|
| Sans (UI, body, headings) | **Inter** | system-ui, -apple-system, sans-serif |
| Mono (code, logo wordmark) | **JetBrains Mono** | Fira Code, ui-monospace, monospace |

Two families. No third. The contrast between sans and mono is intentional — it's the brand.

### 3.2 Scale

| Role | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|
| Page title (h1) | clamp(28px, 3vw, 32px) | 600 | 1.25 | -0.03em |
| Section (h2) | 22px | 600 | 1.25 | -0.02em |
| Subsection (h3) | 18px | 600 | 1.25 | — |
| Body (prose) | 17px | 400 | 1.8 | — |
| Body (UI) | 16px | 400 | 1.7 | — |
| Nav / labels | 14-15px | 400-500 | — | — |
| Uppercase label | 12px | 500 | — | 0.1em, ALL-CAPS |
| Metadata (date) | 13px | 400 | — | — |
| Tag pill | 11px | 500 | — | 0.03em |
| Code | 0.875em of parent | 400 | 1.7 | — |

---

## 4. Spacing & layout

- **Container:** centered, comfortable read width (max ~720px for prose, ~960px for index pages).
- **Vertical rhythm in prose:** paragraphs 1.4em apart; headings get 2em before, 0.6em after.
- **Borders:** 1px in `color.border`. Radii: cards `0.75rem`, code blocks `0.5rem`, inline code / tag pills `0.25rem`.
- **No drop shadows on cards.** A subtle hover effect (left accent border, optional code-block glow) replaces shadows.

---

## 5. Logo

```
notdefined_
```

- Set in **JetBrains Mono**.
- The trailing `_` is the **blinking terminal cursor** — animates opacity 1 → 0 → 1 every 1.1s with `step-start` timing (hard on/off, no fade).
- `_` color: `color.accent`. Rest of the wordmark: `color.text`.
- No icon. The wordmark IS the logo.

**Favicon:** a bold `_` centered in a rounded square. Background `color.surface-2`, character `color.accent`, ~30% padding.

---

## 6. Voice & copy

### Editorial content (blog posts, TILs, page copy)

Español mexicano casual. Technical terms in English (threads, scope, block, render, deploy, hook).

- Direct and opinionated. "Honestamente, rara vez uso esto" beats "this is generally considered useful".
- Sarcasm to exaggerate, not to mock.
- No marketing fluff: avoid "in today's fast-paced world", "level up", "game changer".
- First person: "I've been doing X" not "developers should X".

### UI chrome (nav, buttons, labels)

- Concise. Single-word actions when possible.
- Mexican casual register, but not slangy in UI itself. "Inicio", "Blog", "Sobre mí" — not "Órale, entra al blog".
- Headers in Spanish; tags / categories can stay in their natural form (often English technical terms).

---

## 7. Decorative effects

Subtle, supportive, never competing with content. Every effect respects `prefers-reduced-motion`.

| Effect | Where | Mechanic |
|---|---|---|
| Dot grid background | full viewport (`body::after`) | 1px dots, 24px grid, opacity 0.18 |
| Noise overlay | full viewport (`body::before`, z-index 9999) | SVG fractal turbulence, opacity 0.03 |
| Cursor glow | pointer-tracking (only on `pointer: fine`) | 400px radial gradient at accent, 4.5% alpha |
| Accent line | site header underline | gradient sweep, 8s ease-in-out alternate |
| Code-block glow | code block hover | accent-tinted box-shadow at 6% alpha |
| Tag pills | scroll-triggered | `tag-land` keyframe, 0.35s ease |
| Card hover | left edge | 2px accent gradient stripe, fades in |
| Fade-in items | scroll-triggered | opacity + 12px Y translate, 0.4s |
| Cursor blink | logo `_` only | step-start blink, 1.1s |

---

## 8. Anti-patterns (what the brand REJECTS)

- Multiple accent colors (status colors are NOT introduced — there's no success / warning / error palette yet, and adding one needs an ADR).
- Drop shadows on cards / buttons.
- Gradients in body content.
- Stock illustrations, isometric tech graphics, or 3D renders.
- Hero sections with marketing copy. The site has no hero — the cursor IS the hero.
- Emoji in headers, nav, or UI chrome. Emoji in post body content is editorial choice (rare).
- Generic SaaS-page patterns: "trusted by", "logos bar", testimonials, signup CTAs.

---

## 9. Generated copy guard

When an AI design tool produces mockup copy:

- Replace all placeholder copy with on-brand Spanish examples before reviewing the visual. Placeholder Lorem-style English copy reads as a different brand.
- Headers stay short — never use marketing strings like "Welcome to the future of personal blogs". Use real titles: "blog", "TIL", "proyectos", "sobre mí", "ahora".
- For the wordmark in mockups, render it literally as `notdefined_` with the underscore in accent color. If the tool can't animate the blink, render the static `_` and add a note: "→ blinks on live site".

---

*End of portable kit. Source-of-truth files: `docs/design/{brand,tokens,components}.md`. Runtime tokens: `src/styles/global.css`.*
