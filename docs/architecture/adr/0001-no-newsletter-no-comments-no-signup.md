# 0001 — No newsletter, no comments, no signup

- **Status:** accepted
- **Date:** 2026-05-18 (retroactive — decision predates this ADR)
- **Deciders:** Adrian

---

## Context

Personal blogs commonly add three engagement features:

1. **Newsletter** — email capture, periodic digest, sometimes paid tiers.
2. **Comments** — Disqus, Giscus, GitHub Discussions embed, or homegrown.
3. **Signup / account system** — required for premium content, saved-posts, profile pages.

Each is plausibly "what blogs do". Each also imposes a different product on top of the blog:

- Newsletter creates a cadence contract with readers and an email-list to maintain.
- Comments invite an audience (HN-style commenters) explicitly listed as a non-audience for this site.
- Signup requires backend, auth, security review — fundamentally changes the site from "static Astro on Pages" to "app".

Adrian wants the blog to be: a personal reference, a portfolio signal, a venue to write. Not a product, not a community.

## Decision

notdefined.dev does NOT include:

- Newsletter / email capture / signup form
- Comments section (Disqus, Giscus, GitHub Discussions embed, or any other)
- User accounts / saved-posts / profile pages
- "Support my work" / Buy-Me-A-Coffee / Gumroad embed

Distribution is RSS (`/rss.xml`) and direct site visits. Discussion happens off-site at the reader's choice (Twitter, GitHub, email).

This rule is **hard**. Overturning it requires a new ADR superseding this one with a documented reason.

## Consequences

**Easier:**
- No GDPR / privacy policy work for email handling.
- No moderation work, no banning trolls, no flame wars to triage.
- Site stays fully static — deploy is `astro build` + Pages.
- The voice doesn't optimize for engagement signals (likes, comment count) that would distort writing toward outrage.

**Harder:**
- No direct feedback loop with readers. Feedback comes via Twitter / email if at all.
- Inbound metrics are limited to RSS subscribers and page views. No "comment count" as a quality proxy.
- "Featured by [X person]" or "discussed in HN" is invisible from the site itself.

**New work committed to:**
- Periodic reminder to NOT add these features when the impulse appears. The anti-pattern #2 (PRD-as-gospel) hooks here: if a "comment section" idea surfaces, the response is "we don't build for non-audiences".

## Alternatives considered

- **Add a newsletter via Buttondown / Substack.** Rejected — creates a separate publishing channel with its own cadence, dilutes the "the blog is the artifact" stance.
- **Add Giscus comments tied to GitHub Discussions.** Rejected — invites HN-style commenters, requires moderation work, makes the site feel like a forum.
- **Add a "tip jar" button.** Rejected — monetization changes the relationship with the writing.
