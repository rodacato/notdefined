# notdefined.dev

Blog personal y sitio principal de **Adrian Castillo** ([@rodacato](https://github.com/rodacato)), publicado en **notdefined.dev**.

Blog estático construido con **Astro**, **Tailwind CSS** y **Markdown**.

---

## Tecnologías

| Herramienta | Rol |
|---|---|
| [Astro](https://astro.build) | Generador de sitio estático, Content Collections |
| [Tailwind CSS](https://tailwindcss.com) | Estilos |
| [GitHub Pages](https://pages.github.com) | Hosting estático |
| [GitHub Actions](https://docs.github.com/actions) | CI/CD y deploy |

---

## Estructura del proyecto

```
notdefined/
  src/
    content/
      blog/             ← posts en markdown
    layouts/
      BaseLayout.astro  ← layout base HTML
    pages/
      index.astro       ← homepage (últimos posts)
      blog/
        index.astro     ← listado de posts
        [...slug].astro ← página individual de post
    styles/
      global.css        ← estilos globales + Tailwind
  public/               ← assets estáticos
  .github/
    workflows/
      deploy.yml        ← deploy a GitHub Pages al mergear a master
  astro.config.mjs
  tailwind.config.mjs
  package.json
```

---

## Desarrollo local

```bash
npm install
npm run dev        # servidor en http://localhost:4321
npm run check      # type checking con Astro
npm run lint       # lint de código (Astro + JS/TS)
npm run format:check
npm run lint:md
npm run build      # build estático en dist/
npm run preview    # previsualizar el build
npm run check:links # valida enlaces internos
npm run ci         # quality gate completo (local/CI)
```

---

## Formato de los posts

Cada post es un archivo `.md` en `src/content/blog/` con este frontmatter:

```markdown
---
title: "Título del post"
description: "Descripción corta para SEO y el listado"
pubDate: 2026-03-06
tags: ["ruby", "ai", "backend"]
draft: false
---

Contenido del post en markdown...
```

Los posts con `draft: true` no aparecen en el sitio.

---

## Deploy

El workflow [deploy.yml](.github/workflows/deploy.yml) se ejecuta automáticamente en cada push a `master`:

1. Instala dependencias y corre `npm run build`
2. Publica el directorio `dist/` en GitHub Pages
3. El dominio personalizado `notdefined.dev` apunta a este deploy vía CNAME

---

## Licencia

Código bajo [MIT](LICENSE). El contenido del blog es propiedad de Adrian Castillo.
