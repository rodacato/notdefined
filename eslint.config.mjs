import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,astro}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    // public/guias holds self-contained artifacts exported from Claude Design
    // — vendored code with its own contract, not the site's toolchain.
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'public/guias/**'],
  },
);
