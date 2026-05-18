# Components — notdefined.dev

> Recipes for the components and CSS primitives currently in use. Source files in [`../../src/components/`](../../src/components/) and [`../../src/styles/global.css`](../../src/styles/global.css). When a component changes, update its recipe here.

---

## PageHeader

[`src/components/PageHeader.astro`](../../src/components/PageHeader.astro)

The top of every section page (blog index, TIL index, about, projects, etc.).

**Anatomy:**

```
┌─────────────────────────────────────┐
│ ← back-link        (optional)       │
│                                     │
│ PAGE LABEL         (uppercase)      │
│ Page title here    (h1)             │
│ Page description.  (muted, narrow)  │
└─────────────────────────────────────┘
```

**Props:**

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `label` | string | optional | Uppercase, accent color, letter-spacing wide |
| `title` | string | required | h1, clamp-sized |
| `description` | string | optional | Muted, max-width 40rem |
| `backLink` | `{ href: string; label: string }` | optional | Renders the `← back` link |

**CSS classes:** `.page-header`, `.page-back-link`, `.page-label`, `.page-title`, `.page-desc` (all in `global.css`).

---

## CardList

[`src/components/CardList.astro`](../../src/components/CardList.astro)

The list rendering used for blog posts, TILs, projects. Bordered container with stacked items separated by horizontal rules and a subtle accent border on hover (left edge).

**Anatomy:**

```
┌─────────────────────────────────────┐
│▎ Item 1 — title                     │
│  metadata · tags                    │
├─────────────────────────────────────┤
│▎ Item 2                             │
├─────────────────────────────────────┤
│▎ Item 3                             │
└─────────────────────────────────────┘
```

The `▎` is the hover accent border — invisible by default, opaque on `:hover` of the item (gradient from accent to accent-dim, top to bottom, 2px wide on the left edge).

**Slots:** the component takes children directly. Each child should be a `<div class="card-list-item">` containing the row content.

**CSS classes:** `.card-list`, `.card-list-item`, plus the `::before` pseudo for the hover accent.

---

## TagPill

[`src/components/TagPill.astro`](../../src/components/TagPill.astro)

Small pill rendering a single tag. Three states: default, hover, active.

**Anatomy:**

```
┌──────────┐
│  ruby    │
└──────────┘
```

**Props:**

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `tag` | string | required | The tag text |
| `href` | string | optional | If present, renders as `<a>` linking to the tag page |
| `active` | boolean | optional | Applies `.is-active` (background accent, text on accent) |

**States:**

- Default: muted text on `surface-2`, thin border.
- Hover: border + text shift to accent.
- Active: background fills with accent, text inverts to background color.

**Animation:** tags animate in (`tag-land`) when the parent enters `.is-visible` — see "Staggered fade-in" below.

**CSS classes:** `.tag-pill`, `.tag-pill.is-active`, `.tag-pill.is-landed`.

---

## Cursor primitives

### `.cursor-blink`

Inline span around the trailing `_` in the wordmark. Animates opacity 1 → 0 → 1 every 1.1s with `step-start` timing (no fade — hard on/off, like a terminal).

```css
.cursor-blink {
  color: var(--color-accent);
  animation: blink 1.1s step-start infinite;
  font-weight: 400;
}
```

### `.cursor-glow`

A 400px circular radial gradient that follows the pointer on devices with `pointer: fine` (hidden on touch). Position is updated via JS in `BaseLayout.astro`. Opacity transitions on enter/leave with `.is-visible`.

```css
.cursor-glow {
  position: fixed;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle, oklch(52% 0.22 275 / 0.045) 0%, transparent 70%);
  transition: opacity 0.4s ease;
}
```

---

## Background primitives

### Dot grid

Rendered as `body::after`, fixed across the viewport, 1px dots on a 24px grid at opacity 0.18.

### Noise overlay

Rendered as `body::before` at `z-index: 9999` (above all UI), opacity 0.03. SVG fractal turbulence baked into the CSS as a data-URL. Decorative — never blocks pointer events.

---

## Animated header accent line

`.header-accent-line` — 2px tall, full-width strip with an animated gradient sweep (accent-dim → accent → accent-dim) over 8 seconds, alternating direction. Used as a horizontal rule under the site header.

---

## Staggered fade-in

`.fade-in-item` — class for any element that should fade + translate in on scroll. Combined with `.is-visible` (toggled by an IntersectionObserver in `BaseLayout.astro`) to trigger the animation.

```css
.fade-in-item {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-in-item.is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

---

## Prose container

`.prose` — the container for blog post / TIL body content. Sets text size 1.0625rem, line-height 1.8, customized headings, link styles, list styles, blockquote, table, image, and code block treatments. See `global.css` lines 99-254 for the full spec.

The container does NOT use `prose` from Tailwind Typography — it's hand-rolled so every rule is reviewable.

---

## Component / token contract

Every component above uses tokens from [`tokens.md`](tokens.md). Hardcoded values inside components are violations of the contract. When introducing a new color or font size, add the token first, then reference it.

When adding a new component:

1. Define its anatomy here first (ASCII or screenshot is fine).
2. Identify which tokens it needs. If a needed token doesn't exist, add it to [`tokens.md`](tokens.md) AND [`global.css`](../../src/styles/global.css) first.
3. Implement the component in `src/components/`.
4. Cross-link this recipe to the source file.
