import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
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
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    product: z.string(),
    technical: z.string(),
    stack: z.array(z.string()).default([]),
    repo: z.string().url(),
    url: z.string().url().nullable().optional(),
    accent: z.string().optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = {
  blog: blogCollection,
  til: tilCollection,
  projects: projectsCollection,
};
