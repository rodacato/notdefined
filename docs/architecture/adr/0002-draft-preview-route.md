# 0002 — Drafts visible via `/blog/drafts/` route

- **Status:** accepted
- **Date:** 2026-05-18 (retroactive — feature shipped in commit `04f5a51`)
- **Deciders:** Adrian

---

## Context

The editorial pipeline (see [`../../vision/jobs-to-be-done.md`](../../vision/jobs-to-be-done.md) — JTBD-4) requires a venue to preview a post in its final rendered form before flipping `draft: false`. Options:

1. **Local-only preview.** Run `npm run dev` and view the post locally. Works but means panel review (per [`audience-panel.md`](../../editorial/audience-panel.md)) requires Adrian to be at his machine to see the rendered version.
2. **Separate preview deploy.** Provision a second Pages / Netlify environment for drafts. Heavy for the value.
3. **Drafts visible in production at a known route.** A `/blog/drafts/` page lists in-progress posts. URLs are not linked from the main feed, not in RSS, not in the sitemap — but are reachable.

Option 3 is the lightest infra-wise and matches the workflow: write a draft anywhere, see it rendered anywhere.

## Decision

Posts with `draft: true` in their frontmatter are:

- **Built** into the static site at their normal URL (`/blog/<slug>/`).
- **Listed** in a `/blog/drafts/` index page.
- **Excluded** from:
  - The main blog index (`/blog/`)
  - RSS feed
  - Sitemap
  - Tag pages
  - Search index
  - Internal links from other pages

A reader visiting `/blog/drafts/` sees the list of in-progress drafts. A reader visiting the direct URL of a draft sees the rendered post. No login, no obscure URL — the discipline is "drafts are public but unlinked".

## Consequences

**Easier:**
- Panel review (per `docs/editorial/audience-panel.md`) works from any device — share the URL.
- Iterating on a post and re-reading it as a real reader would is trivial.
- No second deploy environment to maintain.

**Harder:**
- A determined visitor (or crawler) can find `/blog/drafts/`. The site treats drafts as effectively public, but unpolished.
- Search engines may index drafts (the route is reachable). Mitigation: drafts are not in the sitemap, and Adrian can add `noindex` to draft frontmatter if a specific draft must stay out of search.

**New work committed to:**
- Maintain the exclusion logic in `src/content/blog/` queries (filter `draft: true` everywhere except the drafts index).
- Periodic check that drafts are not leaking into RSS / sitemap / tag pages.

## Alternatives considered

- **Local preview only.** Rejected — friction for panel review.
- **Separate Netlify preview deploy.** Rejected — over-engineered for a personal blog.
- **Password-protect drafts.** Rejected — Pages doesn't support it natively, and the discipline of "drafts are public but unlinked" matches the open spirit of the site.
- **Use a feature branch + GitHub Pages preview.** Rejected — Pages doesn't support per-branch previews on a free tier.
