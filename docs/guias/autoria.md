# Authoring a guide — the method

> How a guide is written and why its parts exist. The map of the system is
> [`vision/guias.md`](../vision/guias.md); the decisions are [ADR 0005] and [ADR 0006]; the
> registry is [`src/data/guias.ts`](../../src/data/guias.ts). This doc never repeats them — it
> covers the one thing they don't: how to decide what goes in a ficha, and how to prove it.
>
> **Part A is universal. Part B is per collection, and they differ a lot** — Polyglot's parts
> are not the Almanaque's, and applying one collection's contract to the other produces
> ceremony.

---

# Part A — universal

## A1. Does this topic deserve interactivity?

One question, and it is not "would a widget look good here":

> **Can the reader be wrong here, and can the material prove it?**

If there is no surprising answer the reader could get wrong, there is no widget worth
building — there is prose with buttons. A ficha with **no widget** is a valid, finished
ficha; `check.mjs` must not treat it as incomplete.

**The number of steps belongs to the topic, not to a template.** Ruby dominado shipped with 14
of 15 widgets at exactly six steps — that number is the fingerprint of a mould nobody
questioned, and it is why the interactions read as short and contextless. Four steps is a fine
answer. So is nine.

## A2. Widgets are claims, and nothing executes them

A widget's steps are prose. Every false claim found in Ruby dominado lived in **two** places:
the snippet and the widget narrating it — one widget even described a local variable that
exists in no version of the code. Whatever verification a collection has, check the widget by
hand until its stage *is* the verified artefact.

When a harness accuses something strange, **verify it as a plain file** before believing it.
`using` and `binding` depend on lexical scope, and a statement-by-statement evaluator can
manufacture failures that do not exist.

## A3. Containers span, paragraphs measure

**One text measure per guide — 72ch — and it lives on the paragraph, never on the box.** A
callout, an aviso, a prediction button and a widget all reach the same right edge; only the
prose inside them is capped. Put the measure on the container and boxes stop lining up, which
reads as "some cards are cut short" long before anyone can name why.

Ruby a fondo had drifted to five: 78ch on two boxes, 70ch inline on prose, 66ch on a lede, 64ch
on a code note. Measuring the rendered right edge of every container is how you find it — the
CSS looks reasonable rule by rule.

## A4. Colour encodes, it does not write

The `--fam-*` tokens are a **fixed data-encoding contract**: identical in light and dark, so a
colour means the same thing in both. Measured against the light canvas they run 2.64:1 to
3.29:1 — two of them miss even AA-large. Use them for borders and marks; never for text.

Same rule for the difficulty ramp: render ◆ with an `aria-label`. The diamonds alone say
nothing to a screen reader.

## A5. Before a guide ships

```
npm run check:guias        # integridad de los datos de todas las guías
npm run check:snippets     # solo guías con código ejecutable (ver B1)
npm run check:render       # abre cada guía en un navegador y verifica que pinte
npm run ci                 # el gate del sitio
```

`check:render` exists because the others read data and none of them opens the page. Deleting
three components along with a dead engine left one guide painting an empty `<main>` while every
other gate stayed green.

**Its coverage is partial and the number it prints is the disclosure.** It walks `#/` anchors
transitively, so a guide whose index navigates by `onclick: location.hash = …` instead of by
link exposes only its top-level views — `apis-1001` reports 4 routes against 17. When you read
a route count far below a guide's ficha count, that gap is unchecked pages, not a clean bill.

Then the **S13 gate** ([`research/experts.md`](../research/experts.md)): the instructional
designer reviews the draft *and* the shipped artefact. The second pass is not optional — Ruby
dominado shipped from a pre-panel draft and the whole pedagogical review evaporated between
the prompt and the generated guide without any check noticing. A finding that lives only in
the prompt is a finding that did not ship.

---

# Part B — per collection

## B1. Polyglot — one language per guide, CEFR levels

The contract is fixed and every ficha carries all of it.

| Part | Job |
|---|---|
| `quees` · `enBreve` · `fundamento` | what it is, the facts, why it exists at all |
| `comoFunciona` + `snippet` | the mechanism, and the code that is the ficha's evidence |
| widget | where the reader predicts and is corrected |
| `callout` | one line the reader pastes into their own console |
| `cuandoNo` | when this knowledge should **not** change their code |
| `mito` | the wrong belief, dismantled |

The last two are the collection's signature move. A Polyglot guide missing them is a manual —
Ruby a fondo shipped with 0 of 11 and had to have them written after the fact.

**Sources do not close a ficha.** Ending on "para seguir" makes the next step look like a book
when it is the next ficha. They live at `#/bibliografia`, linked from the rail *after* the last
block, and grouped **by chapter in the guide's own order** — a reader arrives wanting more of
ficha 09, not wanting "a book". Each group heads back to its ficha and carries its block colour.
Add a "transversal" section only when something actually spans fichas: measure it. And before
deleting per-ficha resources, check the overlap — in Ruby a fondo, 17 of 34 existed nowhere else.

**`cuandoNo` reframes by level.** In a C1 ("dominado") it is *don't use this technique here*.
In a C2 ("a fondo") you do not *use* the GC — there it becomes *when this knowledge should not
touch your code*, which is what stops a reader from reading about shapes and going off to
reorder their ivars.

**Blocks carry a mental model**, not just a name: "la fila de casilleros" beats "El modelo de
objetos".

### Code in English, prose in es-MX

**The code is English — all of it.** Identifiers *and* string literals: `class Box`, not
`class Caja`; `raise "something bad"`, not `raise "algo grave"`. The reader will meet
`ancestors` and `prepend` in English, and mixing them with Spanish names produces a dialect
that exists in no repository and does not survive a grep of their own codebase.

**Comments inside a snippet may be es-MX, and should be rare.** A comment there is a last
resort: if the snippet needs one to be understood, the snippet is unclear. Fix the names or
the shape first. What the comment must never do is narrate what the line already says —
it earns its place only by marking the moment that matters (`# ⚠️ la excepción desaparece`)
or by carrying the expected output (`# => …`, which is an assertion, not a comment).

**A snippet must read as intent.** Names carry the lesson: `swallows_it` and `cleans_only`
teach the ficha before a single comment does. If you cannot name the example so its point is
visible, you do not understand the point yet.

Everything outside the code block — prose, notes, myths, the widget's narration — stays
**es-MX**. This refines `feedback_repo_language`; its es-MX exception is prose, never code.

> **Whole-ficha consistency.** An identifier appears in four places: the snippet, the widget's
> steps, the `<code>` spans in the prose, and the runner's `# =>` assertions. Renaming one and
> not the others is how a guide starts contradicting itself. `check:snippets` catches only the
> assertions; the other three are yours.

### Snippets are executable, and they get executed

Polyglot ships real code for a real runtime, so it is verified by running it:

```
npm run check:snippets
```

The `ancla` is a contract. If the guide says "evaluado con Ruby 4.0" and no Ruby 4.0 is
installed, the runner refuses to run rather than quietly verifying against whatever is on
PATH. Conventions, read by [`scripts/lib/ruby-doctest.rb`](../../scripts/lib/ruby-doctest.rb):

| Annotation | Meaning |
|---|---|
| `expr   # => valor` | the statement's `inspect` must equal it |
| `expr   # => AlgunError` | the statement **must** raise that class |
| `...` inside a value | wildcard — object ids, paths, anything not reproducible |
| `expr   # ~> salida` | illustrative: it must run, its value is not compared |

`# ~>` exists for measurements that are real but not reproducible (benchmark timings). It is
counted and reported, never silently skipped.

**An expected error does not abort the run.** Six of Ruby dominado's fifteen snippets raise on
purpose — a bare `rescue` letting `Exception` through, a shallow `freeze`, strict lambda
arity. A runner demanding exit 0 would reject the guide's own pedagogy.

Adding a language means registering it in
[`scripts/verify-snippets.mjs`](../../scripts/verify-snippets.mjs) with its data files, and
writing a doctest for its runtime. Only Ruby exists today.

## B2. Almanaque técnico · 1001 — concepts, not languages

> **PLACEHOLDER.** This section records what the collection measurably *is*, not what it
> should be. Its contract gets decided after Polyglot closes; until then, treat the tomos as
> unreviewed and do not extend the collection on the strength of this section.

**It has no agreed part-set, and that is a real gap, not an omission here.** Measured across
its four published tomos:

| Tomo | `mito` | `cuandoNo` | code |
|---|---|---|---|
| design-patterns-1001 | — | — | in 4 files |
| auth-1001 | 1 | 4 | — |
| databases-1001 | — | 4 | — |
| algorithms-1001 | — | — | pseudocode, declared as such in its own `check.mjs` |

Four tomos, four shapes. What is settled:

- **Its code is pseudocode**, not a runnable program for one runtime — `algorithms-1001`
  states this in its check. **`check:snippets` does not apply**, and pretending otherwise
  would mean inventing a runtime for language-agnostic material.
- **Do not import Polyglot's contract wholesale.** `mito` works for a language's folklore;
  whether a pattern or an auth flow has an equivalent "wrong belief worth dismantling" is a
  question this collection has not answered yet. `cuandoNo` clearly transfers — three tomos
  reached for it independently.

Part A applies in full. Before extending this collection, decide its part-set and record it
here; do not settle it by copying whatever the last tomo did.

## B3. Manuales — framework parodies

Incubating ([ADR 0006]). Nothing decided; nothing to follow yet.

[ADR 0005]: ../architecture/adr/0005-interactive-guides-collection.md
[ADR 0006]: ../architecture/adr/0006-guide-collections-and-polyglot-levels.md
