import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Draft posts still build to a reachable URL so /blog/drafts can link them;
// the sitemap is where we stop telling search engines they exist.
const draftUrls = readdirSync('src/content/blog')
  .filter((file) => file.endsWith('.md'))
  .filter((file) => {
    const frontmatter =
      readFileSync(`src/content/blog/${file}`, 'utf8').split('---')[1] ?? '';
    return /^draft:\s*true\s*$/m.test(frontmatter);
  })
  .map((file) => `/blog/${file.replace(/\.md$/, '')}/`);

const excludedFromSitemap = new Set(['/blog/drafts/', ...draftUrls]);

const withTrailingSlash = (path) => (path.endsWith('/') ? path : `${path}/`);

const site = 'https://notdefined.dev';

// Guides ship as prebuilt HTML under public/, so they are not Astro routes and
// the sitemap integration cannot discover them on its own.
const guideUrls = readdirSync('public/guias', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${site}/guias/${entry.name}/`);

// Dev-only: Vite serves public/ by exact path and won't resolve a directory
// URL to its index.html (GitHub Pages and `astro preview` do). Without this,
// /guias/<slug>/ 404s in dev while working in prod.
const guiasDirIndex = {
  name: 'guias-dir-index',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url && /^\/guias\/[^/]+\/$/.test(req.url)) {
        req.url += 'index.html';
      }
      next();
    });
  },
};

export default defineConfig({
  site,
  redirects: {
    '/now': '/about',
    '/uses': '/about',
  },
  integrations: [
    sitemap({
      customPages: guideUrls,
      filter: (page) =>
        !excludedFromSitemap.has(withTrailingSlash(new URL(page).pathname)),
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
    },
  },
  server: {
    host: true,
    port: 4321,
  },
  vite: {
    plugins: [tailwindcss(), guiasDirIndex],
  },
});
