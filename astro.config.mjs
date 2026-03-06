import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://notdefined.dev',
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
    plugins: [tailwindcss()],
  },
});
