# Ghostpen — Plan & Reference

Ghostpen is the agentic blog pipeline for notdefined.dev. It lets you create a blog post by opening a GitHub Issue — an LLM generates the draft, opens a PR, and you review and merge.

## Status

| Component | State |
|---|---|
| `.github/workflows/ghostpen.yml` | Done |
| `.github/scripts/ghostpen.mjs` | Done |
| GitHub Models API integration | Done |
| PR auto-creation | Done |
| Issue auto-close on merge | Done |
| TIL support (`ghostpen-til` label) | Done |
| Style guides (`docs/style-blog.md`, `docs/style-til.md`) | Done |
| Series support | Not implemented |
| Custom model selection via issue | Not implemented |
| Draft preview (Netlify/Vercel deploy preview) | Not implemented |
| Regeneration (comment-triggered re-run) | Not implemented |

---

## How It Works (current implementation)

```
GitHub Issue (label: ghostpen)
        |
        v
ghostpen.yml triggers
        |
        v
ghostpen.mjs runs
  - reads ISSUE_TITLE, ISSUE_BODY, ISSUE_NUMBER from env
  - generates slug and pubDate
  - calls GitHub Models API (openai/gpt-4o)
  - writes src/content/blog/<slug>.md
  - exports branch, file, slug to $GITHUB_OUTPUT
        |
        v
workflow commits the .md file
  - creates branch: ghostpen/issue-<number>-<slug>
  - opens PR: "ghostpen: <issue title>"
  - PR body says "Closes #<number>"
        |
        v
You review the PR, edit if needed, merge
        |
        v
deploy.yml triggers on merge to main
  - builds Astro
  - deploys to GitHub Pages
        |
        v
Original issue auto-closed (via "Closes #N" in PR)
```

---

## How to Use

### Blog post

1. Go to the repo's **Issues** tab
2. Create a new issue:
   - **Title** = the blog post topic (e.g., `Ruby's object model explained`)
   - **Body** = optional extra context (see below)
3. Apply the `ghostpen` label
4. A PR appears in ~1 minute: `ghostpen(blog): <your title>`
5. Review, edit if needed, merge

### TIL (Today I Learned)

Same flow, different label:

1. Create an issue:
   - **Title** = the learning (e.g., `Ruby's Comparable module changes sort order of everything`)
   - **Body** = the context, what triggered it, a code snippet if relevant
2. Apply the `ghostpen-til` label
3. A PR appears: `ghostpen(til): <your title>` — file lands in `src/content/til/`

### Issue body format

The body is freeform, but the more context you give, the better the output:

```
Key points to cover:
- singleton classes
- method lookup chain
- eigenclass vs metaclass naming

Avoid: explaining basic OOP concepts
```

For a TIL, the body can be even shorter — just the context that triggered the learning:

```
A coworker asked why Array#sort behaves differently after including Comparable.
```

Everything in the body is passed verbatim to the LLM as context.

### Editing the style guides

The LLM's voice and format are controlled by two files:

- [`docs/style-blog.md`](docs/style-blog.md) — tone, structure, forbidden patterns for blog posts
- [`docs/style-til.md`](docs/style-til.md) — same for TILs

Edit these files to change how ghostpen writes. No code changes needed — the script reads them at runtime.

---

## Style Guides

The LLM's voice, tone, and post structure are defined in plain markdown files:

| File | Used for | Key rules |
|---|---|---|
| `docs/style-blog.md` | `ghostpen` label | Spanish MX, TL;DR, H2 sections, 800–1500 words, punch ending |
| `docs/style-til.md` | `ghostpen-til` label | Spanish MX, 150–350 words, no TL;DR, no H2, enter direct |

These files are read at runtime by `ghostpen.mjs` and injected as the system prompt prefix.
To change how ghostpen writes, edit the style file — no code changes needed.

## File Naming

The post filename is derived from the issue title:

- Lowercased
- Non-alphanumeric characters stripped
- Spaces replaced with hyphens
- Truncated to 60 characters

Example: `Ruby's object model explained` → `rubys-object-model-explained.md`

---

## Generated Frontmatter

**Blog post** (`src/content/blog/`):
```markdown
---
title: "Ruby's Object Model Explained"
description: "One-sentence SEO description, max 160 chars"
pubDate: 2026-03-07
tags: ["ruby", "internals"]
draft: false
---
```

**TIL** (`src/content/til/`):
```markdown
---
title: "Ruby's Comparable module changes sort order of everything"
date: 2026-03-07
tags: ["ruby", "stdlib"]
---
```

The `draft` field is always `false` on blog posts — the PR itself acts as the gate. If you want to keep the post hidden after merging, manually change it to `true` before merging. TIL entries have no `draft` field.

---

## LLM Configuration

**Model:** `openai/gpt-4o` via GitHub Models API (`https://models.github.ai/inference`)
**Auth:** `GITHUB_TOKEN` from Actions — no external secrets needed
**Max tokens:** 4096 (blog) / 1024 (TIL)
**Temperature:** 0.7

The system prompt is built by concatenating the relevant style guide file (`docs/style-blog.md` or `docs/style-til.md`) with a frontmatter hint. The style files define Adrian's voice — edit them to change how ghostpen writes without touching code.

---

## Permissions Required

The workflow needs these GitHub token permissions (already set in `ghostpen.yml`):

```yaml
permissions:
  contents: write      # push branch, commit file
  issues: write        # comment on / close issue
  pull-requests: write # open PR
  models: read         # call GitHub Models API
```

These are granted automatically via `GITHUB_TOKEN` — no manual setup needed.

---

## Potential Improvements

### Regeneration via issue comment
Trigger a re-run by commenting `/ghostpen regenerate` on the issue or PR. Useful when the first draft misses the mark without closing and re-opening the issue.

```yaml
on:
  issue_comment:
    types: [created]
# filter: comment body == '/ghostpen regenerate'
# re-run ghostpen.mjs, force-push to existing branch
```

### Model selection via issue label
Use different models for different post types:

| Label | Model |
|---|---|
| `ghostpen` | `openai/gpt-4o` (default) |
| `ghostpen-claude` | `anthropic/claude-3-5-sonnet` |
| `ghostpen-fast` | `openai/gpt-4o-mini` |

### Series support
Add a `series` and `seriesOrder` field to the frontmatter for multi-part posts. The issue body could include a `Series: <name>` line that ghostpen parses and injects.

### Draft flag support
If the issue body contains `draft: true`, set `draft: true` in the frontmatter so the post is committed but not publicly listed. Merge when ready to publish.

### PR deploy preview
Connect a Netlify or Cloudflare Pages project to the repo so every PR gets a live preview URL. The workflow could post the preview URL as a comment on the issue.

### Word count / quality check step
Add a Node step after generation that:
- Counts words and warns if < 600 or > 2000
- Checks that frontmatter fields are valid
- Fails the step (and blocks the PR) if the output looks malformed

---

## Troubleshooting

**Workflow didn't trigger**
- Confirm the `ghostpen` label exists in the repo (create it if not)
- Check that the label was applied *after* the issue was opened — editing the issue does not re-trigger

**API error 401**
- The `GITHUB_TOKEN` may lack `models: read` permission
- Check repo Settings > Actions > General > Workflow permissions

**Empty or garbled markdown**
- GitHub Models API occasionally returns partial content at `max_tokens: 4096`
- Regenerate by closing and re-opening the issue, or increase `max_tokens`

**PR targets wrong base branch**
- The `--base main` flag in `ghostpen.yml` is hardcoded
- If your default branch is `master`, update line 64 of `ghostpen.yml`
