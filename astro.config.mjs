import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://notdefined.dev',
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
