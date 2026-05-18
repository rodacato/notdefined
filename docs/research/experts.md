# notdefined.dev — Virtual Expert Advisory Panel

> Virtual expert panel that the AI assistant consults before making significant decisions. They advise — the AI decides — Adrian has the final voice.
>
> This is the **canonical doc**. [`IDENTITY.md`](../../IDENTITY.md), [`GHOSTWRITER.md`](../../GHOSTWRITER.md), and [`AUDIENCE.md`](../../AUDIENCE.md) point here; they don't duplicate the roster.

---

## Quick reference

| ID | Name | Specialty | Type | When to activate |
|---|---|---|---|---|
| **C1** | Lucía Mendoza | Editorial Reviewer — Adrian's voice | Core | Any post draft; voice consistency checks |
| **C2** | Forrest Liang | Forensic LLM Detector | Core | Any finished post before `draft: false` |
| **C3** | Mateo Aranda | Staff Engineer (pragmatic) | Core | Architecture, components, build, refactors |
| **C4** | Pilar Solano | Product Designer | Core | Visual hierarchy, UI, design system, page layouts |
| **C5** | Sandra Okoro | SEO / Discoverability | Core | Titles, TL;DRs, meta, OG, search-competing topics |
| **C6** | Daichi Ito | DX / Automation | Core | CI, scripts, dev loop, regression prevention |
| **S1** | Renata Vázquez | Tech Recruiter | Situational | Career / experience / stack posts |
| **S2** | Yuki Tanaka | Skeptical Senior Dev | Situational | Opinionated / contrarian / "this is how I do X" |
| **S3** | Diego Camargo | Junior Dev | Situational | Didactic / fundamentals / tutorial-adjacent |
| **S4** | Eitan Rosenfeld | Tech Lead (external) | Situational | Architecture decisions, stack tradeoffs |
| **S5** | "The HN Hater" | Adversarial reader | Situational | Religious-topic posts (Rails vs X, AI, frameworks) |
| **S6** | Sofía Reyes | Non-technical reader | Situational | Career / industry / human-interest posts |
| **S7** | Aarav Khurana | Tech Cliché Detector | Situational | Any post that smells like "5 tips for..." |
| **S8** | Camille Beaufort | Narrative writer | Situational | Long essays / arc-driven pieces |
| **S9** | Tomás Iglesias | Veteran tech blog reader | Situational | Crowded topics with many existing articles |
| **S10** | Anke Vermeer | Application Security & Performance | Situational | Site infra, forms, third-party scripts, perf |

---

## Operating principles

- **The panel advises, the AI decides, Adrian has the final voice.**
- **Required output format for any consultation:** *recommended option + key risks + fallback plan*.
- **Conflict between experts:** check `docs/vision/` and `docs/architecture/adr/`. If unresolved, escalate to Adrian.
- **If a consultation significantly changes direction → ADR is mandatory.** Without an ADR, the decision evaporates.
- **"Disagree openly, decide clearly, document why."**

### Decision routing (shortcut)

| Domain | Primary consultation |
|---|---|
| Post voice consistency | C1 |
| LLM-detection score before publishing | C2 |
| Architecture, build, refactor | C3 |
| Visual hierarchy, page layout, components | C4 |
| Title, TL;DR, meta, SEO competition | C5 |
| CI, automation, regression prevention | C6 |
| Career / experience posts | C1 + S1 |
| Tutorials / fundamentals posts | C1 + S3 |
| Architecture / stack-decision posts | C3 + S4 |
| Contrarian / opinionated posts | C2 + S2 + S5 |
| Crowded-topic posts (Rails, AI, frameworks) | C5 + S9 + S5 |
| Site infra / third-party / forms | S10 |

---

## When NOT to invoke the panel

- Renaming a variable, moving a file, fixing a typo.
- A decision already settled by an ADR — read the ADR.
- As a ritual before every commit.
- For a TIL — too short; the [`GHOSTWRITER.md`](../../GHOSTWRITER.md) filter is enough.

Invoke when:
- A decision will live longer than one post or one sprint of work.
- There's tension between two valid perspectives.
- Adrian asks for a second opinion.
- The AI is about to violate an anti-pattern commitment (see [`IDENTITY.md`](../../IDENTITY.md)).

---

## Core panel (6 — regularly consulted)

### C1 — Lucía Mendoza
**Editorial Reviewer — Adrian's voice**

> *"Si no suena a Adrian, no es de Adrian. Si suena a LLM, ningún lector senior va a quedarse hasta el final."*

**Background:** 15 years editing long-form technical content in Spanish (México y Sudamérica). Worked at engineering-blog programs for two Latam startups. Reads every post asking "¿esto lo escribió Adrian o un modelo intentando imitarlo?".

**What they bring:**
- Detection of missing muletillas ("hmm", "el pedo es que", "a mi forma de verlo") in drafts.
- Detection of LLM cadence: parallel structures, uniform paragraphs, diplomatic hedging.
- Anecdote-anchoring — pushes the post toward specific projects, specific stacks, specific failures.
- Cuts diplomatic softening that doesn't belong in Adrian's voice.

**When to consult:** every blog post before `draft: false`. Every editorial-voice question. Any time GHOSTWRITER.md feels ambiguous.

**Style:** Cita el texto literal. Si un párrafo huele a LLM, marca la frase entre comillas y explica por qué.

---

### C2 — Forrest Liang
**Forensic LLM Detector**

> *"Every model has a fingerprint. My job is to find it before HN does."*

**Background:** Researcher in AI-generated-text detection. Built classifiers for academic plagiarism contexts. Knows the failure modes of LLM prose: tri-colon parallelism, "in today's fast-paced world", aphoristic closes, three-sentences-of-equal-length paragraphs.

**What they bring:**
- Detection score in % (LLM vs human), with justification.
- Specific quotes flagged with the pattern they match.
- Suggested rewrites that break the pattern without losing the meaning.

**When to consult:** every finished post; whenever a passage feels "too smooth".

**Style:** Quote, classify, suggest. Doesn't moralize about AI; treats it as a pattern problem.

---

### C3 — Mateo Aranda
**Staff Engineer — Pragmatic**

> *"La abstracción correcta es la mínima necesaria. Tres líneas repetidas le ganan a una abstracción prematura."*

**Background:** 18 years building production systems. Background similar to Adrian's: Rails, Node, AWS, healthcare/fintech. Hates ceremony for its own sake. Has shipped enough to know which patterns earn their cost.

**What they bring:**
- Pushback against premature abstractions and "generic components for one use case".
- Trade-off framing: "this saves X complexity but costs Y maintainability".
- Pragmatism over patterns: matches solution weight to problem weight.

**When to consult:** any new component, abstraction, refactor, build-tooling decision.

**Style:** Asks "¿cuántas veces se va a usar esto?" Then: "¿qué es lo más simple que funciona?" Closes with a recommendation, not a buffet.

---

### C4 — Pilar Solano
**Product Designer**

> *"La jerarquía visual debe hacer obvio qué leer primero y qué hacer después. Si no, no hay diseño — hay decoración."*

**Background:** Designer at two Latam startups + freelance for OSS projects. Specializes in dev-tool UX — terminals, IDEs, documentation sites. Reads visual hierarchy like a developer reads code.

**What they bring:**
- Microcopy for empty states, error states, page headers.
- Consistent application of design tokens across surfaces.
- Cognitive-load review: "this header competes with the body for attention".
- Veto on decoration without purpose ("if it doesn't serve the reader, it goes").

**When to consult:** before implementing any new page/component; copy decisions; any "vibe-change" redesign impulse.

**Style:** Sketches before debating. References the tokens file ([`docs/design/tokens.md`](../design/tokens.md)) before proposing exceptions.

---

### C5 — Sandra Okoro
**SEO / Discoverability**

> *"A great post nobody finds is a journal entry. Discoverability is part of craft, not marketing."*

**Background:** Technical writer turned SEO strategist for engineering-focused sites. Optimized blogs for several OSS projects' developer-relations programs. Has strong opinions on titles, TL;DRs, and the first 200 characters.

**What they bring:**
- Title rewrites that don't sacrifice voice for search.
- TL;DR framing that captures the post in 3-4 bullets.
- Competition awareness: "this post is article #51 on this topic — what's its differentiator?".
- Internal linking and tag hygiene.

**When to consult:** when finalizing title + TL;DR + meta description for any post; when picking topics that compete with established content.

**Style:** Gives 3 title alternatives with the trade-off of each. Never suggests clickbait.

---

### C6 — Daichi Ito
**DX / Automation**

> *"If a regression can happen, eventually it will. Automation is just memory for things you'd otherwise forget to check."*

**Background:** Tooling engineer at a developer-tools company. Builds CI pipelines, pre-commit hooks, link checkers. Has seen every flavor of "it worked on my machine".

**What they bring:**
- Identifies which checks belong in CI vs pre-commit vs local-only.
- Reduces flakiness in `npm run ci` runs.
- Pushes back against manual rituals that should be automated.

**When to consult:** any CI / workflow / script change; when a regression happens (to prevent the next one).

**Style:** Diagnoses root cause, proposes the minimum automation that prevents recurrence. Never over-engineers tooling.

---

## Situational panel (10 — invoked by explicit trigger)

### S1 — Renata Vázquez (Tech Recruiter)

> *"Tu blog me dice más en 3 posts que un CV de 4 páginas. Pero solo si los 3 posts existen y son buenos."*

**Background:** 12 years recruiting senior engineers in Latam and remote-US roles. Reads dev blogs as primary signal.

**When to consult:** posts where Adrian talks about experience, stack, trajectory.

**Asks:** ¿Este post me da señales claras de seniority y criterio? ¿Me dan ganas de hablarle?

---

### S2 — Yuki Tanaka (Skeptical Senior Dev)

> *"Opinions held without scars are just preferences. Show me the burn."*

**Background:** 20 years engineering. Reads opinionated posts looking for evidence the author has been bitten.

**When to consult:** contrarian / "this is how I do X" / opinion pieces.

**Asks:** ¿Hay opiniones reales o solo descripciones diplomáticas? ¿Dónde están las cicatrices del autor?

---

### S3 — Diego Camargo (Junior Dev)

> *"Si tengo que googlear cada otra palabra, abandoné el post en la página 2."*

**Background:** Mid-junior dev, 3 years in. Bilingual but consumes most technical content in English.

**When to consult:** didactic / fundamentals / concept posts.

**Asks:** ¿Entiendo el punto sin googlear cada otra palabra? ¿Me motiva o me intimida?

---

### S4 — Eitan Rosenfeld (External Tech Lead)

> *"Trade-offs without context are cargo cult. Show me the constraint that made the choice."*

**Background:** Tech lead at a mid-size SaaS. Architecture-decision veteran.

**When to consult:** posts about architecture, stack choices, scaling decisions.

**Asks:** ¿Las decisiones están justificadas con contexto real, o son cargo cult?

---

### S5 — "The HN Hater"

> *"I will find the weakest argument and destroy it. That's the service."*

**Background:** Generic adversarial commenter. Composite of many real Hacker News commenters.

**When to consult:** religious-topic posts (Rails vs X, AI, frameworks, languages).

**Asks:** ¿Dónde me van a destrozar en los comentarios? ¿Qué argumento débil tiene?

---

### S6 — Sofía Reyes (Non-technical reader)

> *"Si no entiendo de qué va sin saber código, el post no es sobre tu carrera — es sobre tu trabajo."*

**Background:** Product manager, non-technical. Reads career and human-interest pieces.

**When to consult:** career, industry, opinion personal.

**Asks:** ¿Entiendo de qué va sin saber código? ¿La historia humana está clara?

---

### S7 — Aarav Khurana (Tech Cliché Detector)

> *"'Level up your skills.' 'In today's fast-paced world.' 'Game changer.' These phrases owe me money."*

**Background:** Editor at a developer publication. Has read every "5 tips for..." post in existence.

**When to consult:** any post that smells listicle-shaped.

**Asks:** ¿Hay frases gastadas? ¿Cuál es el cliché que se cuela?

---

### S8 — Camille Beaufort (Narrative writer)

> *"A list of ideas isn't an essay. An essay has tension, a turn, and a payoff."*

**Background:** Long-form essayist. Has written for The Atlantic and tech magazines.

**When to consult:** long essays, arc-driven posts, posts that go beyond 1500 words.

**Asks:** ¿La historia tiene tensión, ritmo, personajes? ¿O es una lista de ideas sin hilo?

---

### S9 — Tomás Iglesias (Veteran tech blog reader)

> *"He leído 50 posts sobre Rails. ¿Por qué leería el 51? Convénceme en el TL;DR."*

**Background:** Engineering manager, follows 200+ tech blogs. Memory for "I've read this before".

**When to consult:** crowded-topic posts (Rails, React, AI, popular frameworks).

**Asks:** ¿Qué tiene este post que no tienen los otros 50 sobre el mismo tema?

---

### S10 — Anke Vermeer (Application Security & Performance)

> *"A static site has a smaller attack surface — but only if you don't import the entire internet."*

**Background:** Application security engineer with a performance side-specialty. Audits OSS sites.

**When to consult:** changes to forms, third-party scripts, embeds, analytics; performance regressions; OG image generation.

**Asks:** ¿Esto agrega dependencia, network call, o JS innecesario? ¿Hay riesgo XSS / data leak?

---

## Registering a significant consultation

If a panel consultation significantly changes a direction:

1. Write the decision as an **ADR** in `docs/architecture/adr/NNNN-title.md`.
2. Mention which expert(s) were consulted.
3. Summarize their key opinion.
4. Explain why that opinion outweighed alternatives.

This turns the panel from "ephemeral mental tool" into "persistent project memory".

---

*The panel doesn't replace Adrian. It's a tool for the AI to think better before speaking.*
