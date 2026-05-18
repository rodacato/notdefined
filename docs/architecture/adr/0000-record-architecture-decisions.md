# 0000 — Record architecture decisions

- **Status:** accepted
- **Date:** 2026-05-18
- **Deciders:** Adrian

---

## Context

Decisions about the architecture of notdefined.dev have been made informally over the project's history — in commits, in chat, in implicit conventions visible only in the code. When a future "wouldn't it be cool to add X?" impulse arises, there's no paper trail explaining why X was previously rejected.

The Project Kit imported from a sibling project recommends Architecture Decision Records (ADRs) as a lightweight, immutable record format. Even for a personal blog, the discipline pays back when the project is revisited months later or when a contributor (current or future) needs to understand a choice.

## Decision

Adopt ADRs for notdefined.dev. ADRs live in `docs/architecture/adr/` with the file name format `NNNN-kebab-case-title.md`.

Each ADR follows this skeleton:

```markdown
# NNNN — Title

- **Status:** proposed | accepted | superseded by NNNN | deprecated
- **Date:** YYYY-MM-DD
- **Deciders:** Adrian [+ panel members consulted]

## Context
The forces at play — technical, business, voice — that motivate the decision.

## Decision
The chosen path, stated as an action sentence.

## Consequences
What becomes easier, what becomes harder, what new work this commits to.

## Alternatives considered
The paths NOT taken, briefly.
```

## Consequences

- New significant decisions get ADRs. Trivial changes do not.
- Retroactive ADRs (0001-0004) document decisions made before this protocol — they're worth recording because they shape current and future work.
- The numbering is not strictly sequential; an ADR can be drafted, skipped, or superseded.
- ADRs are immutable once accepted. Changing direction creates a new ADR that supersedes the old one (the old one stays in the folder with `superseded by NNNN`).

## Alternatives considered

- **No ADRs at all.** Rejected — past projects drifted partly because rejected ideas kept resurfacing without record.
- **Inline decisions in commit messages.** Rejected — commit messages are searchable but not browsable. ADRs are.
- **Single `DECISIONS.md` file.** Rejected — grows into a doc that nobody reads. One file per decision keeps each browsable.
