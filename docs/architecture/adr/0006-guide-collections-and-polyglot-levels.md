# 0006 — Guide collections, and CEFR levels for Polyglot

Date: 2026-07-18
Status: accepted

## Context

The guides shelf (ADR 0005) grew past a single series. Two collections now
exist with different identities: the **Almanaque técnico · 1001** (concept
almanacs, numbered tomos, a per-tomo visual theme) and **Polyglot** (advanced
per-language guides). More are incubating (a parody "user manual" collection
for frameworks). Without a structure, every guide title repeated its series
name, non-almanac guides had no ordering system, and "advanced" had no
defined floor — the first Polyglot guide mixed engine internals with language
semantics in one volume.

## Decision

**Collections are shelves.** Each guide belongs to exactly one collection
(`collection` field in `src/data/guias.ts`); the shelf section header carries
the collection's name and hook, so spine titles drop redundant suffixes.
Collections registered before their first guide simply don't render.

**Polyglot uses a CEFR-style scale** — the leveling system for human
languages, which is the collection's joke and its structure at once:

| Level | Name              | Question it answers                               |
| ----- | ----------------- | ------------------------------------------------- |
| C1    | "«Lang» dominado" | what do _I_ do with the language, at expert level |
| C2    | "«Lang» a fondo"  | what does the _machine_ do underneath             |

- **A1–B2 do not exist** in Polyglot. The collection's thesis is "the basics
  are everywhere; this isn't". B2 "con soltura" (fluent everyday use) was
  initially included but dropped: fluent usage is the least advanced rung and
  overlaps with what tutorials and docs already cover, so it sits on the wrong
  side of the thesis. Only C1 (expert use) and C2 (internals) qualify — both
  unmistakably "not found just anywhere". The B1→C1 jump _is_ the collection.
- Displayed **ascending, C1 → C2**: the natural path is master the language,
  then go under the hood.
- The level is the collection's ordering device, shown as a rail badge on the
  spine (where almanac tomos show roman numerals). Data: optional `nivel`
  field, typed `'C1' | 'C2'`.
- **The palette identifies the language and is shared across its levels**
  (O'Reilly model: same book design, different cover per language; Polyglot
  additionally shares one type trio — Spectral / Source Sans 3 / Spline Sans
  Mono). The level badge and title differentiate volumes of one language.
- **Partition rules** between C1/C2 of one language: mechanics live in C2,
  expert judgment lives in C1. Applied consistently: concurrency (engine
  constraints → C2; which primitive to use → C1) and error handling (stack
  unwinding → C2; advanced criteria — cause chains, hierarchies, errors as
  values — → C1; basic rescue/try is B1 and therefore out of scope). A topic
  lives in exactly ONE guide; cross-links connect levels.
- A language ships its C2 first (the existing generated guides are all C2);
  a C1 is built as its own guide, never by thinning a published C2 — when a
  C1 lands, any language-semantics fichas migrate from C2 in the same change.
- **The wink**: as the 1001 collection parodies course numbering, Polyglot's
  meta description carries the CEFR joke exactly once per guide ("El B1 te lo
  dio el tutorial…"). Optional garnish: the VM locale (rb-VM, py-VM) in the
  colophon.

**Taxonomy across collections**: 1001 = concepts (don't expire) · Polyglot =
languages (CEFR levels) · future Manuales = frameworks (expiry embraced as
the joke). TypeScript is a future language guide of its own (its "machine" is
the type system/tsc), not a level of JavaScript. Frameworks (React, React
Native, Rails…) belong to Manuales, never to Polyglot.

## Consequences

- `guias.ts` carries the operative registry (collections, `nivel`); this ADR
  carries the rationale; `docs/design/claude-design-prompts.md` carries the
  generation/integration prompts. One source per type.
- The shelf renders any number of collections without redesign; empty ones
  are free to pre-register.
- Guide drafts (working docs, untracked) must state collection and level;
  the restructure prompts encode the level in the hero and the wink in the
  meta description.
- Opening a new level for a language requires its lower/upper sibling
  boundaries to be re-checked against the partition rules — never duplicated
  content between levels.
