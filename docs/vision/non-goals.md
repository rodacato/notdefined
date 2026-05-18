# Non-Goals — notdefined.dev

> What notdefined.dev is explicitly NOT. These are anti-features: even if they seem like obvious extensions, they get rejected without a fresh ADR.

---

## Not a tutorial site

The blog does not aim to teach a concept from zero. Posts can be didactic when the *learning moment* is the story (TILs are entirely this), but the goal isn't curriculum. There are sites that do tutorials well; this isn't one of them.

**Implication:** "Beginners' guide to..." or "Complete tutorial on..." titles are off-brand. Honest "this is what I learned" framing is on-brand.

---

## Not a newsletter

There is no email capture, no signup form, no "subscribe to my newsletter" CTA anywhere. Distribution is RSS and direct site visits.

**Why:** newsletters are a different product — a different cadence, a different relationship with readers. Adrian doesn't want that contract. RSS is the open-web equivalent that doesn't require capturing anyone's email.

**Implication:** adding email infrastructure (Buttondown, Substack, ConvertKit, even Mailchimp) requires an ADR overturning this. "Maybe later" doesn't get the work started.

---

## Not a course platform

No paywalled content, no premium tiers, no Gumroad embeds, no "support my work" buttons.

**Why:** the blog is a portfolio + personal reference. Monetizing it changes the relationship with the writing. If Adrian wants to teach paid material, that's a different site, a different brand.

---

## Not a discussion forum

No comments section. No Disqus, no Giscus, no GitHub Discussions embed.

**Why:** comments invite an audience the blog isn't optimizing for (see [`audience.md`](audience.md) — HN commenters are explicitly a non-audience). Engagement happens off-site (Twitter, GitHub, email) where it's the reader's choice to engage in a venue Adrian can ignore.

---

## Not a developer tool index / aggregator

The `projects` collection lists Adrian's own projects. It is not a directory of "tools I like", "stack recommendations", or "best of" lists. Those belong in posts if they're worth a post; they don't belong in a structured collection.

---

## Not a multilingual site

Content is español mexicano casual. There is no English translation, no language toggle, no `hreflang` setup. The repo artifacts (commits, code, infra docs) are English; that's where the English audience reads the project.

**Why:** translation doubles maintenance and dilutes the voice. The voice is Spanish street with English technical terms — that mixture IS the product.

---

## Not optimized for SEO above voice

SEO matters (see expert C5 in [`../research/experts.md`](../research/experts.md)) but never to the point of changing the voice. If a clickbait title would rank better than the honest title, the honest title wins.

---

## Not a contribution magnet

No `CONTRIBUTING.md`, no PR templates that invite outsiders to add posts. The repo is public for transparency and portfolio value, not because external contributions are sought.

**Implication:** if someone opens a PR, it can be considered case-by-case. But the project does NOT do the OSS-maintainer work of welcoming and onboarding contributors. That's a different product.
