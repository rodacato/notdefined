import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    lab: z
      .object({
        href: z.string(),
        title: z.string().optional(),
        blurb: z.string().optional(),
        meta: z.string().optional(),
        cta: z.string().optional(),
      })
      .optional(),
  }),
});

const tilCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/til' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

const projectsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    why: z.string().optional(),
    product: z.string(),
    technical: z.string(),
    stack: z.array(z.string()).default([]),
    repo: z.url(),
    site: z.url().optional(),
    accent: z.string().optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
    order: z.number().default(0),
    posts: z.array(z.string().regex(/^\/(blog|til)\/[^/]+\/$/)).default([]),
  }),
});

export const collections = {
  blog: blogCollection,
  til: tilCollection,
  projects: projectsCollection,
};
