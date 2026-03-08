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
    description: z.string(),
    repo: z.string().url(),
    url: z.string().url().nullable().optional(),
    lang: z.string(),
    status: z.enum(['activo', 'mantenimiento', 'pausado']).default('activo'),
    tags: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

const nowCollection = defineCollection({
  type: 'content',
  schema: z.object({
    updatedAt: z.coerce.date(),
    building: z.array(z.string()).default([]),
    exploring: z.array(z.string()).default([]),
    writing: z.array(z.string()).default([]),
  }),
});

export const collections = {
  blog: blogCollection,
  til: tilCollection,
  projects: projectsCollection,
  now: nowCollection,
};
