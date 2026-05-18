# 0003 — Content lives in Astro Content Collections

- **Status:** accepted
- **Date:** 2026-05-18 (retroactive — convention from project start)
- **Deciders:** Adrian

---

## Context

The site has four content types: blog posts, TILs, projects, and the `now` snapshot. Each could be stored as:

1. **Hardcoded JSX/Astro components.** Direct, but mixes content and presentation; renames a content edit into a code edit.
2. **External CMS (Contentful, Sanity, Notion).** Decouples content from code, but adds a network dependency and a paid service for a personal blog.
3. **Astro Content Collections** (Markdown + frontmatter + Zod schemas). Native to the framework, validated at build time, file-system-backed.

Option 3 fits a static personal blog perfectly: posts are files, type-safe via Zod, deployable as part of the site build, and free of external dependencies.

## Decision

All content lives in `src/content/`, organized by collection:

| Collection | Path | Frontmatter required fields |
|---|---|---|
| Blog posts | `src/content/blog/` | `title`, `pubDate`, `tags`, `draft` |
| TILs | `src/content/til/` | `title`, `date`, `tags` |
| Projects | `src/content/projects/` | `name`, `repo`, `status`, `lang`, `tags`, `order` |
| Now | `src/content/now/` | `updatedAt`, `building`, `exploring`, `writing` |

Schemas are defined in `src/content.config.ts` using Zod. Build fails if a content file violates its schema.

Site-level metadata (author, social URLs, site description) lives in `src/data/site.ts`, NOT hardcoded in pages.

## Consequences

**Easier:**
- Adding a post is creating a file in `src/content/blog/` — no code edit.
- Schema validation catches typos in frontmatter at build time.
- Content is part of the git history — every post change is reviewable as a commit.
- No external service to authenticate against, no API rate limits, no CMS outage.

**Harder:**
- A non-technical contributor would need to learn frontmatter + Markdown + git. (This is acceptable — see [`../../vision/non-goals.md`](../../vision/non-goals.md) "Not a contribution magnet".)
- Editing on mobile is awkward (no native CMS interface). Mitigation: drafts can be edited via GitHub.dev or codespaces if needed.

**New work committed to:**
- Schemas in `src/content.config.ts` are the source of truth for content shape. Adding a new field to a collection requires updating the schema first.
- Pages that consume content must use the collection API (`getCollection`, `getEntry`), not raw file reads.

## Alternatives considered

- **Hardcoded components.** Rejected — mixes content with presentation, makes a post edit into a code review.
- **External CMS.** Rejected — adds dependency, cost, and operational surface for marginal benefit on a personal blog.
- **MDX everywhere.** Considered — MDX is supported for the rare post that needs inline components, but plain Markdown is the default to keep posts portable and grep-able.
