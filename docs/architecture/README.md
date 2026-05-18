# Architecture — notdefined.dev

> Architectural decisions live in [`adr/`](adr/) as immutable, numbered records. This README is the reading-order index.

The site is intentionally simple — a static Astro site with content collections and a GitHub Pages deploy. Most decisions to record here are about what NOT to add. ADRs document the reasoning so a future "wouldn't it be cool to..." impulse meets a paper trail explaining why the answer was no.

---

## ADR list

| # | Title | Status |
|---|-------|--------|
| [0000](adr/0000-record-architecture-decisions.md) | Record architecture decisions | accepted |
| [0001](adr/0001-no-newsletter-no-comments-no-signup.md) | No newsletter, no comments, no signup | accepted |
| [0002](adr/0002-draft-preview-route.md) | Drafts visible via `/blog/drafts/` route | accepted |
| [0003](adr/0003-content-collections-as-source-of-truth.md) | Content lives in Astro Content Collections | accepted |
| [0004](adr/0004-visual-effects-system.md) | Visual effects system (dot grid, parallax, glow) | accepted |

---

## When to write an ADR

- A decision that future-Adrian (or a future contributor) might second-guess and want to know why.
- A decision that closes off a category of work ("we will not do X").
- A decision where two reasonable paths existed and one was chosen — the loser deserves documentation.
- A consultation with the [expert panel](../research/experts.md) that significantly changed direction.

## When NOT to write an ADR

- Renaming a variable, restructuring a component.
- Following a convention already documented in `IDENTITY.md` or the code itself.
- A guess about the future — ADRs are for decisions actually made, not "we might do X someday".

ADRs are not sequential mandatorily — numbers can be skipped, and not every decision needs one. The test is: would re-deriving the reasoning waste time?
