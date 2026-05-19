# Jobs to be Done — notdefined.dev

> Concrete jobs the blog does for Adrian (primary user). Each JTBD drives what gets built and what gets refused. Without a JTBD anchor, a feature doesn't ship.

---

## Format

Each JTBD follows: *When [situation], I want [motivation], so that [outcome].*

---

## JTBD-1 — Capture the learning moment

> When I learn something concrete (a behavior I didn't know, a tool I tried, a perspective change), I want to record it in 5-10 minutes, so that future-me has it as a personal reference and doesn't have to re-derive it.

**Form:** TIL (`src/content/til/`). Short (150-350 words), no formal structure, direct voice.

**Metric:** does Adrian come back to read his own TILs? If yes, JTBD is working.

---

## JTBD-2 — Crystallize opinions held with experience

> When I have a strong opinion about a tool, stack, or approach that I've used in production and can defend, I want to write it down with concrete anecdotes, so that I stop re-explaining the same things in conversations and so that the position is documented for myself and others.

**Form:** Blog post (`src/content/blog/`). 800-1500 words, structured with TL;DR + sections + closing punch.

**Metric:** has Adrian linked one of his own posts in a conversation in the last 3 months? If yes, working.

---

## JTBD-3 — Signal seniority and voice to recruiters / peers

> When a recruiter or peer dev lands on my CV / GitHub / Twitter, I want them to find a blog that signals 17+ years of experience and a clear voice, so that they understand my level without me explaining it.

**Form:** archive of finished posts; the site itself with its visual identity and clean structure.

**Metric:** indirect — quality and density of inbound conversations from people who mention reading the blog.

**Implication:** posts must signal seniority without screaming about it. Anecdotes do the work. "I have 17 years of experience" never appears as a sentence.

---

## JTBD-4 — Validate thinking by writing it out

> When I'm forming an opinion about something I'm working through (vibe coding, AI in workflows, new tooling), I want a venue to write the thinking out and have it pass through a critical panel, so that I find the weak spots before I commit to the position publicly.

**Form:** blog post draft → [`audience-panel.md`](../editorial/audience-panel.md) panel → iteration → publish. Or: draft that stays draft, because the panel found it wasn't ready.

**Metric:** percentage of drafts that get killed or significantly reshaped after panel review. A 0% kill rate means the panel is rubber-stamping.

---

## What JTBDs are NOT

- "Build an audience" — not a job. Followers may happen as a byproduct; they are not the goal.
- "Make money" — not a job. See [`non-goals.md`](non-goals.md).
- "Teach beginners" — not a job. Tutorial-shaped posts get rejected by the panel.
- "Win debates online" — not a job. Posts are not designed to be HN-comment-proof.

---

## How JTBDs are used

- Every idea in the editorial Project (`rodacato/projects/7`) references which JTBD it serves (or proposes a new JTBD with the same 4-filter rigor).
- Every proposal that doesn't fit a JTBD gets rejected with the reason "no JTBD anchor".
- When a JTBD turns out not to actually be a job (no usage, no inbound, no re-read), it gets retired here with a note.
