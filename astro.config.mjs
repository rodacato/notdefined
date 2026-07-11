import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

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
  site: 'https://notdefined.dev',
  redirects: {
    '/now': '/about',
    '/uses': '/about',
  },
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
