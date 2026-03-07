---
title: "Tailwind CSS v4: lo que realmente cambió y por qué importa"
description: "Tailwind v4 salió el 22 de enero de 2025 y rompió bastantes cosas. Te cuento qué cambió, por qué, y cómo migrar sin morir en el intento."
pubDate: 2025-02-10
tags: ["css", "tailwind", "frontend"]
draft: false
---

## TL;DR

- **`@import "tailwindcss"`** reemplaza los tres viejos `@tailwind` directives — una sola línea
- **`tailwind.config.js` ya no existe** — la configuración vive en CSS con `@theme`
- **`@tailwindcss/vite`** reemplaza el plugin de PostCSS (para proyectos Vite/Astro)
- El sistema de colores migró a **oklch** — más consistente, mejor en pantallas modernas
- Los **utility names cambiaron** en algunos casos (`shadow-sm` ahora es `shadow-xs`, etc.)
- La migración no es opcional si quieres seguir usando el ecosistema — pero vale la pena

---

## Por qué Tailwind v4 es un rediseño, no un bump de versión

Tailwind v4 salió el 22 de enero de 2025 y en las primeras horas de ese día mi Twitter/X se llenó de "¿por qué ya no me funciona nada?". Con razón — no es una actualización incremental. Es una reescritura del motor CSS completo usando [Lightning CSS](https://lightningcss.dev/) como base, lo que significa parseo y generación de clases hasta 5x más rápido.

Pero el cambio que más va a afectar tu código del día a día es la configuración. Adiós `tailwind.config.js`, hola CSS puro. Sí, la configuración ahora vive en CSS. Sí, al principio se siente raro. Después de una semana: no lo extrañas.

## De `tailwind.config.js` a `@theme`

Antes vivías con algo así:

```javascript
// tailwind.config.js — ya no existe en v4
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#6366f1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
      },
    },
  },
}
```

Ahora todo eso va directo en tu CSS:

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-brand: oklch(52% 0.22 275);
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

¿Por qué es mejor esto? Porque tu configuración ahora es una CSS custom property. Puedes referenciarla en cualquier parte de tu CSS sin plugins adicionales, y el browser la entiende nativamente. No más `theme('colors.brand')` dentro de tu CSS — solo `var(--color-brand)`.

## Los tres directives se fusionaron en uno

Antes necesitabas esto al inicio de tu CSS:

```css
/* v3 — ya no */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

En v4 es simplemente:

```css
/* v4 */
@import "tailwindcss";
```

Una línea. Listo. Si quieres importar solo partes (por ejemplo, solo utilities sin el preflight), puedes hacer:

```css
@import "tailwindcss/utilities";
```

## El plugin de PostCSS ya no es la forma recomendada

Si usas Vite (o Astro, que usa Vite internamente), el camino oficial ahora es `@tailwindcss/vite`:

```bash
npm install tailwindcss @tailwindcss/vite
```

```javascript
// vite.config.js o astro.config.mjs
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
});
```

El plugin de PostCSS todavía existe (`@tailwindcss/postcss`), pero para proyectos Vite el plugin nativo es más rápido y tiene mejor HMR. En producción la diferencia no es dramática, pero en desarrollo se nota.

## oklch en lugar de hex

v4 migró el sistema de colores a oklch. Tus clases de color predeterminadas (`bg-blue-500`, `text-gray-700`) siguen funcionando igual visualmente, pero internamente usan:

```css
/* v4 genera esto para bg-blue-500 */
background-color: oklch(62.8% 0.258 264.4);
```

oklch es perceptualmente uniforme — significa que el paso de `blue-400` a `blue-500` es visualmente consistente, no un salto arbitrario como con hex. En pantallas P3 (básicamente cualquier Mac moderno e iPhone), los colores son más saturados y precisos.

Si tienes colores personalizados en tu `@theme`, te recomiendo definirlos también en oklch. Herramientas como [oklch.com](https://oklch.com) te ayudan a convertir.

## Los utility names que cambiaron

Acá están los cambios que más probablemente van a romper tu proyecto:

| v3 | v4 | Notas |
|----|----|-------|
| `shadow-sm` | `shadow-xs` | Escalas renombradas |
| `shadow` | `shadow-sm` | |
| `rounded` | `rounded-sm` | |
| `blur-sm` | `blur-xs` | |
| `text-sm` | igual | Estos no cambiaron |
| `ring-offset-*` | `ring-offset-*` | Igual |
| `flex-shrink-0` | `shrink-0` | Alias más cortos |
| `overflow-ellipsis` | `text-ellipsis` | |

¿La forma fácil de migrar? Instala el codemod oficial:

```sh
npx @tailwindcss/upgrade@next
```

No es perfecto, pero cubre el 90% de los cambios automáticamente. Lo que queda lo resuelves con los warnings del build.

## Lo honesto: los rough edges

No todo es miel sobre hojuelas. Algunas cosas que te vas a topar:

**`@tailwindcss/typography` no es compatible con v4 todavía.** El plugin internamente importa paths de Tailwind v3 que ya no existen. Si lo tienes en tu proyecto, lo tienes que remover y escribir tus propios estilos de `.prose` manualmente — o esperar a que saquen una versión compatible.

**Algunos plugins de la comunidad todavía no migraron.** Antes de actualizar, revisa tus dependencias. `@tailwindcss/forms`, `@tailwindcss/aspect-ratio`, `@tailwindcss/container-queries` ya tienen versiones v4. Otros siguen en proceso.

**El DX en proyectos grandes puede ser raro al inicio.** El nuevo motor genera CSS diferente y la extensión de VS Code tardó un poco en actualizarse. Si ves clases que no se aplican en el editor pero sí en el browser, actualiza la extensión de Tailwind CSS IntelliSense.

## El diff de migración real

Si tienes un proyecto sencillo de Astro + Tailwind, la migración se ve más o menos así:

```sh
# Antes
npm install tailwindcss @astrojs/tailwind

# Después
npm install tailwindcss @tailwindcss/vite
npm uninstall @astrojs/tailwind @tailwindcss/typography
```

```javascript
// astro.config.mjs — antes
import tailwind from '@astrojs/tailwind';
export default defineConfig({
  integrations: [tailwind()],
});

// astro.config.mjs — después
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
});
```

```css
/* global.css — antes */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* global.css — después */
@import "tailwindcss";

@theme {
  /* tus tokens aquí */
}
```

---

La migración duele un poco, especialmente si tienes plugins o un `tailwind.config.js` muy customizado. Pero la dirección es la correcta — CSS-first configuration, menos JavaScript en el pipeline, mejor performance en dev.

Usa el codemod, acepta que va a quedar al 90%, arregla el 10% con los warnings del build, y sigue adelante. Una vez que lo tienes andando, no extrañas el archivo de config. Lo prometo.
