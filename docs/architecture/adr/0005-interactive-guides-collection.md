# 0005 — Interactive guides as a fourth content type

Date: 2026-07-10
Status: accepted

## Context

Adrian generates interactive learning artifacts with Claude Design (pattern
catalogs, visual guides, language internals) whose audience is the same as the
blog's: future-Adrian. They don't fit the existing content types — they have
no narrative (not blog posts), don't capture a learning moment (not TILs), and
aren't experiments measuring feasibility or cost (not labs). They are
**interactive reference material meant to be revisited**, and they already
exist (10+ artifacts) — this decision gives existing content a home rather
than building a section on speculation.

Panel consulted: C3 (architecture), C4 (design/placement), S11 (future-Adrian
veto), C5 (discoverability). Key concerns raised: link fragility if hosted on
claude.ai, generated-content optics next to a hand-written blog, and the
"shelf of guides nobody re-reads" failure mode.

## Decision

1. **New section "Guías"** at `/guias/`, following the existing Labs pattern:
   a data file (`src/data/guias.ts`), an index page, a home section, no navbar
   item.
2. **Self-hosted static exports.** Each guide is exported from Claude Design
   as plain HTML/CSS/JS ("Project archive") and lives in
   `public/guias/<slug>/` — served as-is, fully independent from the site's
   layout, styles, and analytics. Ownership and permanence over claude.ai
   links.
3. **Own design per guide.** Guides intentionally do NOT share the site's
   design system. The `/guias/` index is the boundary: site-styled index,
   free-styled artifacts.
4. **Export contract.** Guides are generated against a technical contract
   (separate `data.js` content from `app.js` mechanics, relative paths, no
   external requests, es lang, back-link, origin footer, reduced-motion) kept
   in `docs/design/claude-design-prompts.md`.
5. **Curation by use.** Only guides Adrian actually revisits get published.
   Each carries a visible origin note ("Generada con Claude Design · date").

## Consequences

- The generated-content optics risk is mitigated by the per-guide origin note
  and the `/como-escribo/` framing — transparency instead of concealment.
- No framework integrations added to the site (no React, no MDX); artifacts
  are self-contained. If a hand-built guide someday needs islands,
  `astro add react` is the documented upgrade path.
- Removal is cheap by design: deleting a folder and a data entry. If the
  section isn't consulted after a quarter, it goes.
- `check:links` crawls the artifacts; they must remain self-contained (no
  external requests) to keep CI honest.

## Amendment — 2026-07-10

Decision 5's per-guide origin footer is replaced by a single disclosure on
the `/guias/` index page ("las genero con Claude Design y las curo yo").
Inside a guide consulted repeatedly, the footer read as noise; the
transparency obligation is satisfied at the entry point instead.
