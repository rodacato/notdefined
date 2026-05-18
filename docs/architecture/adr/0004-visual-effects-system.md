# 0004 — Visual effects system (dot grid, parallax, glow)

- **Status:** accepted
- **Date:** 2026-05-18 (retroactive — shipped in commit `53903f9`)
- **Deciders:** Adrian

---

## Context

The site shipped a coordinated set of subtle visual effects:

- Dot grid background
- Header backdrop blur on scroll
- Parallax movement of certain elements
- Glow accent on code blocks

Each effect is small in isolation. Together they constitute a "visual system" — they share tokens, breakpoints, and the `prefers-reduced-motion` contract. The risk is drift: each effect added ad-hoc with its own constants, no shared system, eventually contradicting itself.

This decision codifies the system so future effects (or their removal) follow the same shape.

## Decision

Visual effects on the site follow these rules:

1. **Shared tokens.** Effect-related variables (opacity levels, blur radii, glow color, dot grid spacing) live in `src/styles/global.css` under `@theme` or `:root`. No inline magic numbers in components.
2. **`prefers-reduced-motion` is mandatory.** Every effect respects the system preference. If the user has reduced motion on, the effect either disables or degrades to a static equivalent. No effect ships without this branch.
3. **Effects are decorative, not load-bearing.** A reader with JavaScript off, or with reduced motion on, must still get the full content and navigation. Effects enhance, they don't enable.
4. **No effect blocks reading.** Effects must not cause layout shift, attention competition with body text, or readability loss on body content.
5. **Effects are reviewed against the expert panel.** Adding a new effect category requires consultation with C4 (Product Designer) per [`../../research/experts.md`](../../research/experts.md). Anti-pattern #6 (fragmenting redesigns) hooks here.

## Consequences

**Easier:**
- New effects find their constants in one place.
- Disabling effects globally (for debugging, for a "minimal" mode) is one change.
- Reduced-motion behavior is consistent across effects.

**Harder:**
- Adding an effect that doesn't fit the existing token vocabulary requires extending the tokens — a deliberate change, not a one-off.
- Effects that depend on scroll or pointer events need to remain accessible (focus-visible, keyboard navigation unaffected).

**New work committed to:**
- New effect proposals are filtered through: (a) does it serve the reader? (b) does it survive reduced-motion? (c) does it use existing tokens or require new ones?
- Periodic audit: are the existing effects still earning their cost, or is one a habit that should be retired?

## Alternatives considered

- **No effects at all.** Considered — would match the "brutally minimal" aesthetic referenced in the brand guide. Rejected because subtle effects add character that pure minimalism doesn't, and the anti-LLM-detection stance applies visually too: too-clean sites also feel generated.
- **Effects per-component, no shared system.** Rejected — guarantees drift over time.
- **A heavy animation library (Framer Motion / GSAP).** Rejected — overkill for the scale and adds a runtime dependency.
