# Guías — the interactive reference shelf

> The map for the guides system: what it is, how it's organized, how a guide
> gets made. One screen. The decisions live in ADRs; the prompts live in
> [claude-design-prompts.md](../design/claude-design-prompts.md); the
> operative registry lives in [`src/data/guias.ts`](../../src/data/guias.ts).
> This doc links them — it never duplicates them.

## What they are

Standalone interactive references served from `public/guias/<slug>/` — vanilla
HTML/CSS/JS, no build, work offline by double-click ([ADR 0005]). Audience:
future-Adrian, to RE-consult, not read linearly. All content es-MX; dark
theme by default with a light/dark/system toggle (`guia-tema`).

The index at `/guias` is a deliberately unlinked "secret level" (konami code
from the main site) rendering one shelf per collection.

## Collections ([ADR 0006])

| Collection               | What                                                 | Ordering                                                                          | Identity                                                                                 |
| ------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Almanaque técnico · 1001 | Concepts (patterns, APIs, auth…) — they don't expire | Tomos (roman numerals)                                                            | Per-tomo theme: own palette, texture AND type trio                                       |
| Polyglot                 | Advanced per-language guides                         | CEFR levels: B2 "con soltura" · C1 "dominado" · C2 "a fondo" (no A1–B1 by thesis) | Per-language palette shared across levels; one collection type trio; level as rail badge |
| Manuales (incubating)    | Frameworks, as parody user manuals — expiry embraced | TBD                                                                               | TBD                                                                                      |

Each collection carries one structural joke, used once per guide: 1001
parodies course numbering ("el 101 ya te lo sabías"); Polyglot parodies
language certification ("el B1 te lo dio el tutorial").

## How a guide gets made

```
draft-guia-*.md (root, untracked)      ← content spec + theme + house contract
  → Claude Design (generate or restructure)
  → export "Project archive" → public/guias/<slug>/
  → Prompt 8 integration (agent + reviewer pass; fonts self-hosted,
    check.mjs, voice pass, dark/light smoke-tests)
  → register in guias.ts (collection, tomo/nivel, cover snapshot)
  → gates green → local commit → Adrian pushes
```

Hard rules along the way: zero external requests (Google Fonts self-hosted as
woff2), deterministic widgets, `prefers-reduced-motion` respected, data-color
contracts identical in both themes, the collection's joke appears exactly
once, and no generation colophon inside a guide (disclosure lives on the
`/guias` index, per ADR 0005).

[ADR 0005]: ../architecture/adr/0005-interactive-guides-collection.md
[ADR 0006]: ../architecture/adr/0006-guide-collections-and-polyglot-levels.md
