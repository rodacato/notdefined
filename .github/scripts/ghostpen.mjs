#!/usr/bin/env node
/**
 * ghostpen.mjs — AI blog post generator for notdefined.dev
 *
 * Reads a GitHub Issue title/body, calls GitHub Models API,
 * writes the generated markdown post to src/content/blog/,
 * and outputs branch/file metadata to $GITHUB_OUTPUT.
 *
 * Required env vars:
 *   GITHUB_TOKEN   — provided by Actions automatically
 *   ISSUE_TITLE    — issue title (= blog post topic)
 *   ISSUE_NUMBER   — issue number (used in branch name)
 *   ISSUE_BODY     — optional context from issue body
 */

import { writeFileSync, mkdirSync, appendFileSync } from 'fs';

const { GITHUB_TOKEN, ISSUE_TITLE, ISSUE_NUMBER, ISSUE_BODY = '', GITHUB_OUTPUT } = process.env;

if (!GITHUB_TOKEN || !ISSUE_TITLE || !ISSUE_NUMBER) {
  console.error('Missing required env vars: GITHUB_TOKEN, ISSUE_TITLE, ISSUE_NUMBER');
  process.exit(1);
}

// --- Slug & metadata --------------------------------------------------------

const slug = ISSUE_TITLE
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 60);

const pubDate = new Date().toISOString().slice(0, 10);
const branchName = `ghostpen/issue-${ISSUE_NUMBER}-${slug}`;
const filePath = `src/content/blog/${slug}.md`;

// --- Prompt -----------------------------------------------------------------

const systemPrompt = `You are writing for Adrian Castillo's personal tech blog at notdefined.dev.
Adrian is a full-stack developer with 10+ years of experience in Ruby, JavaScript, and backend architecture.

Voice and tone:
- Technical but approachable and conversational
- Practical, experience-driven — real examples over theory
- Occasional dry humor, never forced
- Direct — no filler phrases, no corporate speak
- Feels like advice from a senior dev, not a tutorial mill

Post format:
- Length: 800–1500 words
- Include code examples where relevant (fenced code blocks with language hints)
- Good structure: hook intro, H2 sections, concrete takeaway at the end
- Do NOT start with "In this post..." or "Today we'll learn..."
- Do NOT end with a bullet-point summary — end with an opinion or next step

Output ONLY the raw markdown file, starting with the YAML frontmatter block.

Use this exact frontmatter format (no extra fields):
---
title: "Post Title"
description: "One-sentence description for SEO, max 160 chars"
pubDate: ${pubDate}
tags: ["tag1", "tag2"]
draft: false
---`;

const userPrompt = ISSUE_BODY.trim()
  ? `Topic: ${ISSUE_TITLE}\n\nContext from the issue:\n${ISSUE_BODY}`
  : `Topic: ${ISSUE_TITLE}`;

// --- GitHub Models API call -------------------------------------------------

console.log(`Calling GitHub Models API for: "${ISSUE_TITLE}"`);

const res = await fetch('https://models.github.ai/inference/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 4096,
    temperature: 0.7,
  }),
});

if (!res.ok) {
  const body = await res.text();
  console.error(`GitHub Models API error ${res.status}: ${body}`);
  process.exit(1);
}

const data = await res.json();
const content = data.choices?.[0]?.message?.content;

if (!content) {
  console.error('Empty response from GitHub Models API:', JSON.stringify(data));
  process.exit(1);
}

// --- Write file -------------------------------------------------------------

mkdirSync('src/content/blog', { recursive: true });
writeFileSync(filePath, content, 'utf8');

console.log(`Written: ${filePath}`);

// --- Export outputs for the workflow ----------------------------------------

if (GITHUB_OUTPUT) {
  appendFileSync(GITHUB_OUTPUT, `branch=${branchName}\n`);
  appendFileSync(GITHUB_OUTPUT, `file=${filePath}\n`);
  appendFileSync(GITHUB_OUTPUT, `slug=${slug}\n`);
}
