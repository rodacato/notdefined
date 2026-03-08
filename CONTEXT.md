# notdefined

## What is this?

Personal blog and main site for **Adrian Castillo** ([@rodacato](https://github.com/rodacato)), deployed at **notdefined.dev**.

This is a static blog built with **Astro**, **Tailwind CSS**, and **markdown**. It includes an agentic blog pipeline (codename: ghostpen) that lets you create blog posts by opening a GitHub Issue — a GitHub-native LLM generates the draft, opens a PR, and you review and merge.

## Why?

- Adrian has 10+ years of experience as a full-stack developer (Ruby, JS, backend architectures) and wants a space to share learnings, experiments, and opinions
- The old blog (`notdefined-blog`) was a Next.js app that was overengineered for a content site — this replaces it with a simpler static approach
- The agentic pipeline is both a practical tool (lower the friction of writing) and a showcase of AI-augmented workflows
- The domain `notdefined.dev` is already owned and was previously pointed at `rodacato.github.io` — it will be redirected to this repo's GitHub Pages deployment

## Tech Stack

- **Astro** — static site generator, markdown-first, Content Collections for type-safe blog posts
- **Tailwind CSS** — styling
- **GitHub Pages** — hosting (static output, zero cost)
- **GitHub Actions** — two workflows:
  - `deploy.yml` — builds Astro and deploys to GitHub Pages on push/merge to main
  - `ghostpen.yml` — triggers on GitHub Issue with `ghostpen` label, uses GitHub-native AI (Copilot/Models) to generate a blog post, opens a PR with the draft

## LLM Strategy — No External API Keys

The ghostpen pipeline uses **GitHub's built-in AI capabilities** so there are no external API keys to manage:

- **GitHub Models** — available via `github.token` in Actions, supports GPT-4o, Claude, and others through the GitHub Models marketplace. Call them via the `@azure/ai-inference` npm package or REST API at `https://models.github.ai/inference`.
- **GitHub Copilot in Actions** — Copilot can be used in workflows for code generation tasks.
- **Fallback: OpenAI Codex** — if GitHub Models doesn't cover the use case, Codex is available as a GitHub-integrated option.

The key advantage: everything stays within the GitHub ecosystem. No secrets to rotate, no billing surprises, no external dependencies.

## Architecture

```
notdefined/
  src/
    content/
      blog/           <- markdown posts live here (frontmatter + content)
    layouts/           <- Astro layouts (BaseLayout, BlogPostLayout)
    pages/
      index.astro      <- homepage (latest posts, about snippet)
      blog/
        index.astro    <- blog listing page
        [...slug].astro <- dynamic blog post pages
    components/        <- reusable Astro/HTML components
    styles/            <- global styles + Tailwind config
  public/              <- static assets (images, favicons)
  .github/
    workflows/
      deploy.yml       <- GitHub Pages deployment
      ghostpen.yml     <- agentic blog post pipeline
    scripts/
      ghostpen.mjs     <- script called by ghostpen workflow (GitHub Models API call, markdown generation)
  astro.config.mjs
  tailwind.config.mjs
  package.json
```

## Blog Post Format

Each post is a markdown file in `src/content/blog/` with this frontmatter:

```markdown
---
title: "Post Title"
description: "A short description for SEO and listing pages"
pubDate: 2026-03-06
tags: ["ruby", "ai", "backend"]
draft: false
---

Post content in markdown here...
```

## Ghostpen Agentic Pipeline

### How it works

1. Adrian opens a GitHub Issue with the `ghostpen` label
2. Issue title = blog post topic (e.g., "Ruby's object model explained")
3. Issue body = optional extra context, target audience, tone preferences, key points to cover
4. GitHub Action triggers, reads the issue, calls GitHub Models API (using `github.token`)
5. LLM generates a complete blog post in markdown with proper frontmatter
6. Action creates a new branch, commits the `.md` file, opens a PR referencing the original issue
7. Adrian reviews the PR, edits if needed, merges
8. `deploy.yml` triggers on merge, builds and deploys to GitHub Pages
9. Original issue is auto-closed when PR merges

### LLM Prompt Strategy

The ghostpen script should:
- Use Adrian's voice/tone: technical but approachable, occasional humor, practical examples
- Generate posts that reflect real experience (10+ years Ruby/JS/backend)
- Include code examples where relevant
- Keep posts focused (800-1500 words default)
- Add appropriate tags from the issue content

## Content to Migrate

The old `notdefined-blog` repo has these existing posts worth migrating:
- `docker-crash-course.md`
- `ruby-blocks-lambdas-procs.md`
- `ruby-object-model.md`
- `ruby-parallelism-and-concurrency.md`

These should be adapted to the new frontmatter format and placed in `src/content/blog/`.

## Design Direction

- Clean, minimal, dark-friendly (support dark mode)
- Code-focused — good syntax highlighting (Astro has built-in Shiki support)
- Fast — zero JS shipped unless needed
- Personality — this isn't a corporate blog, it should feel like Adrian's space

## Deployment

1. Astro builds to static HTML in `dist/`
2. GitHub Action deploys `dist/` to GitHub Pages
3. Custom domain `notdefined.dev` configured via CNAME
4. The old `rodacato.github.io` repo's CNAME should be removed to free up the domain

## Next Steps (in order)

1. Scaffold Astro project with Tailwind and Content Collections
2. Create base layout, blog listing page, and blog post template
3. Set up `deploy.yml` GitHub Action for GitHub Pages
4. Configure custom domain (`notdefined.dev`)
5. Migrate existing posts from `notdefined-blog`
6. Build the ghostpen workflow (`ghostpen.yml` + `ghostpen.mjs`) using GitHub Models API
7. Test end-to-end: open issue -> PR generated -> merge -> deployed
8. Update GitHub profile README to link to the new blog
