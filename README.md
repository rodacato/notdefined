# notdefined.dev

Blog personal y sitio principal de **Adrian Castillo** ([@rodacato](https://github.com/rodacato)), publicado en **notdefined.dev**.

Blog estático construido con **Astro**, **Tailwind CSS** y **Markdown**, con un pipeline agéntico llamado **ghostpen** que genera borradores de posts a partir de issues de GitHub.

---

## Tecnologías

| Herramienta | Rol |
|---|---|
| [Astro](https://astro.build) | Generador de sitio estático, Content Collections |
| [Tailwind CSS](https://tailwindcss.com) | Estilos |
| [GitHub Pages](https://pages.github.com) | Hosting estático |
| [GitHub Actions](https://docs.github.com/actions) | Deploy y pipeline de ghostpen |
| [GitHub Models](https://github.com/marketplace/models) | LLM para generación de posts (sin API keys externas) |

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
      deploy.yml        ← deploy a GitHub Pages al mergear a main
      ghostpen.yml      ← pipeline agéntico de generación de posts
    scripts/
      ghostpen.mjs      ← script que llama a GitHub Models y genera el .md
  astro.config.mjs
  tailwind.config.mjs
  package.json
```

---

## Desarrollo local

```bash
npm install
npm run dev        # servidor en http://localhost:4321
npm run build      # build estático en dist/
npm run preview    # previsualizar el build
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

El workflow [deploy.yml](.github/workflows/deploy.yml) se ejecuta automáticamente en cada push a `main`:

1. Instala dependencias y corre `npm run build`
2. Publica el directorio `dist/` en GitHub Pages
3. El dominio personalizado `notdefined.dev` apunta a este deploy vía CNAME

---

## Ghostpen — pipeline agéntico de posts

Ghostpen es el pipeline que permite escribir posts abriendo un Issue de GitHub. Sin salir del repositorio, sin APIs externas, sin secrets que rotar.

### Cómo funciona

```
Issue con label 'ghostpen'
         │
         ▼
  ghostpen.yml se activa
         │
         ▼
  ghostpen.mjs llama a GitHub Models API
  (usando github.token, modelo gpt-4o)
         │
         ▼
  Genera el .md con frontmatter correcto
  y el estilo de escritura de Adrian
         │
         ▼
  Crea una rama ghostpen/issue-N-slug
  Abre un PR con "Closes #N"
         │
         ▼
  Adrian revisa, edita si hace falta, mergea
         │
         ▼
  deploy.yml publica el post en notdefined.dev
  El issue se cierra automáticamente
```

### Cómo usarlo

1. Abre un nuevo Issue en este repositorio
2. El **título** es el tema del post (e.g., `"El modelo de objetos de Ruby explicado"`)
3. El **cuerpo** es opcional: contexto extra, público objetivo, puntos clave a cubrir, tono
4. Aplica el label **`ghostpen`**
5. En unos minutos aparece un PR con el borrador listo para revisar

### Estrategia de LLM

El pipeline usa **GitHub Models** disponible vía `github.token` en Actions — sin secrets externos, sin costos de API propios. El modelo por defecto es `openai/gpt-4o`.

El prompt del sistema instruye al modelo para escribir con la voz de Adrian: técnico pero cercano, ejemplos reales, humor seco ocasional, sin relleno. Los posts apuntan a 800–1500 palabras con ejemplos de código donde corresponda.

---

## Licencia

Código bajo [MIT](LICENSE). El contenido del blog es propiedad de Adrian Castillo.
