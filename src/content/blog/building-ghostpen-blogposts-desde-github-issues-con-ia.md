---
title: "Building ghostpen: blogposts desde GitHub Issues con IA"
description: "El meta-post. Cómo un GitHub Issue se convierte en un draft de blog post via GitHub Models API, por qué github.token en lugar de API keys externas, el system prompt que captura una voz, y la automatización de branch + PR."
pubDate: 2026-01-13
tags: ["ai", "github-actions", "devtools", "astro"]
draft: false
---

## TL;DR

- **ghostpen** es un pipeline de GitHub Actions que convierte un Issue en un draft de blog post con IA
- Usa **GitHub Models API** (`models.github.ai`) con `github.token` — cero API keys externas que gestionar
- El **system prompt** codifica la voz del autor: español mexicano, TL;DR, ejemplos progresivos, cierre con punch
- El pipeline hace: genera el post → crea branch → commit → abre PR con `Closes #N`
- Lo que funcionó, lo que tuvo que iterar, y por qué este workflow gana a un CMS para un dev blog

---

## El problema que ghostpen resuelve

Tenía una lista de ideas de posts acumuladas durante meses. IDEAS.md lleno de títulos, notas sueltas, "esto merece un post", "aquí está el ángulo correcto". El cuello de botella no era la investigación ni el conocimiento — era la fricción de sentarme a escribir. Un post me toma 3-4 horas si lo hago bien. Con una agenda llena de trabajo, eso es difícil de justificar con frecuencia.

Resultado: ideas acumulándose, blog sin publicar, culpa creciente. El ciclo de vergüenza del dev blogger.

La idea: ¿qué si el draft inicial (el 60% más tedioso — estructura, código de ejemplo, TL;DR) lo hace la IA, y yo edito y mejoro? El resultado es ghostpen: un sistema donde abro un GitHub Issue con el título + notas del post, le pongo el label `ghostpen`, y en 2 minutos tengo un PR con el draft listo para revisar.

## Por qué GitHub Models API

La elección no fue obvia al principio. Las opciones eran:

1. **OpenAI directamente** — requiere OPENAI_API_KEY en los secrets, costo por token
2. **GitHub Models** — usa `github.token` que ya existe en cualquier Actions workflow, sin costo adicional (dentro de los límites del plan)
3. **Claude API (Anthropic)** — excelente para escritura, pero mismo problema: key externa + costo

GitHub Models ganó por una razón práctica: `github.token` está disponible automáticamente en cualquier workflow sin configuración adicional. Cero onboarding friction para quien quiera usar el mismo sistema en su propio repo.

```yaml
# .github/workflows/ghostpen.yml
permissions:
  contents: write
  issues: write
  pull-requests: write
  models: read  # ← este permiso es lo que habilita GitHub Models
```

```javascript
// El llamado al API — compatible con la SDK de OpenAI
const client = new OpenAI({
  baseURL: 'https://models.github.ai/inference',
  apiKey: process.env.GITHUB_TOKEN,  // el token automático del workflow
});

const response = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [systemMessage, userMessage],
  temperature: 0.7,
});
```

## El system prompt: codificar una voz

Esta fue la parte más iterativa. El primer system prompt genérico generaba posts que sonaban a documentación corporativa — exactamente lo opuesto de lo que quería.

Después de analizar mis posts existentes y probar varias versiones, el system prompt que funciona:

```javascript
const systemPrompt = `
Eres el ghostwriter de Adrian Castillo para notdefined.dev — su blog técnico personal.

VIGA MAESTRA: Escribe en español mexicano casual. Los términos técnicos se dejan en inglés
(threads, block, render, deploy), pero la narración es en español de la calle.

ESTRUCTURA OBLIGATORIA:
1. Frontmatter YAML con: title, description, pubDate (ISO), tags (array), draft: false
2. ## TL;DR — bullet list con 4-6 puntos clave. Negritas en términos clave.
3. Secciones H2 para cada concepto principal. H3 para subconceptos.
4. Código en cada sección, no al final. Comentarios en el código con el output: // => "resultado"
5. Tabla comparativa cuando aplica.
6. Cierre con punch — una o dos líneas con opinión o takeaway directo. NUNCA un resumen.

VOZ:
- Hablarle directamente al lector: "¿No me crees?", "Mira este ejemplo", "Imagina que..."
- Frases coloquiales: "Órale", "Vámonos", "Ya te la sabes"
- Primera persona honesta: "Honestamente, rara vez uso X en producción"
- Humor pop: referencias, analogías del mundo real
- Preguntas retóricas seguidas de respuesta inmediata

CÓDIGO:
- Ejemplos progresivos: primero simple, luego con contexto real
- El ejemplo final siempre tiene contexto práctico (carrito de compras, API real, etc.)
- NUNCA foo/bar. El lenguaje del code fence siempre especificado.

PROHIBIDO:
- "En este post vamos a aprender..." al inicio
- Bullet list de resumen al final (va en TL;DR, no en cierre)
- Tono académico o corporativo
- "es importante mencionar", "cabe destacar", "en conclusión"
`;
```

La diferencia entre la primera versión y esta es notable. El modelo necesita ejemplos de lo que quieres — decirle "escribe casual" no es suficiente. Tienes que darle los patrones específicos.

## El script completo: ghostpen.mjs

```javascript
// .github/scripts/ghostpen.mjs
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const {
  ISSUE_TITLE,
  ISSUE_BODY,
  ISSUE_NUMBER,
  GITHUB_TOKEN,
  GITHUB_OUTPUT,
} = process.env;

// Genera slug desde el título
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // quita acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

const client = new OpenAI({
  baseURL: 'https://models.github.ai/inference',
  apiKey: GITHUB_TOKEN,
});

const systemPrompt = `...`; // (el del bloque anterior)

const userPrompt = `
Escribe un post de blog con este título: "${ISSUE_TITLE}"

Notas del autor:
${ISSUE_BODY}

Genera el post completo en markdown con frontmatter YAML.
`;

console.log(`Generando post para: ${ISSUE_TITLE}`);

const response = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  temperature: 0.7,
  max_tokens: 4000,
});

const content = response.choices[0].message.content;

// Extrae el slug del frontmatter si el modelo lo generó, si no usa el título
const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
const postTitle = titleMatch ? titleMatch[1] : ISSUE_TITLE;
const slug = slugify(postTitle);

const filePath = `src/content/blog/${slug}.md`;
const branchName = `ghostpen/issue-${ISSUE_NUMBER}-${slug}`;

// Escribe el archivo
fs.mkdirSync(path.dirname(filePath), { recursive: true });
fs.writeFileSync(filePath, content);

console.log(`Post generado: ${filePath}`);

// Exporta outputs para el workflow
fs.appendFileSync(GITHUB_OUTPUT, `branch=${branchName}\n`);
fs.appendFileSync(GITHUB_OUTPUT, `file=${filePath}\n`);
fs.appendFileSync(GITHUB_OUTPUT, `slug=${slug}\n`);
```

## El workflow completo

```yaml
# .github/workflows/ghostpen.yml
name: Ghostpen

on:
  issues:
    types: [labeled]

permissions:
  contents: write
  issues: write
  pull-requests: write
  models: read

jobs:
  ghostpen:
    if: github.event.label.name == 'ghostpen'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm install openai

      - name: Generate post
        id: ghostpen
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ISSUE_TITLE: ${{ github.event.issue.title }}
          ISSUE_BODY: ${{ github.event.issue.body }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
        run: node .github/scripts/ghostpen.mjs

      - name: Create branch and commit
        run: |
          git config user.name "ghostpen[bot]"
          git config user.email "ghostpen@notdefined.dev"
          git checkout -b ${{ steps.ghostpen.outputs.branch }}
          git add ${{ steps.ghostpen.outputs.file }}
          git commit -m "draft: ${{ github.event.issue.title }}"
          git push origin ${{ steps.ghostpen.outputs.branch }}

      - name: Open PR
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh pr create \
            --title "draft: ${{ github.event.issue.title }}" \
            --body "Draft generado por ghostpen desde #${{ github.event.issue.number }}.

          Revisa el post, edita lo que necesites, y mergea cuando esté listo.

          Closes #${{ github.event.issue.number }}" \
            --head ${{ steps.ghostpen.outputs.branch }} \
            --base master
```

## Lo que funcionó desde el inicio

**`Closes #N` en el PR**: cuando mergeas el PR, el Issue se cierra automáticamente. El pipeline queda limpio: Issue creado → PR mergeado → Issue cerrado. Sin trabajo manual.

**`github.token` con permiso `models: read`**: después de agregar ese permiso al workflow, cero friction. No hay secrets que configurar, no hay API keys que rotar.

**El slug desde el frontmatter**: generar el slug a partir del título del Issue a veces daba slugs incorrectos cuando el modelo usaba un título diferente al del Issue. La solución fue leer el título del frontmatter generado por el modelo, no del Issue.

## Lo que tuvo que iterar

**El temperature**. Con `temperature: 0.9` el modelo tomaba demasiadas libertades con la estructura — saltaba el TL;DR, usaba emojis en headers que no debía, mezclaba idiomas en formas raras. Con `0.7` el balance es mejor: creatividad en el contenido, disciplina en la estructura.

**La longitud del system prompt**. La primera versión tenía 200 palabras de system prompt. Demasiado vago. La versión actual tiene ~500 palabras con patrones específicos y ejemplos de frases prohibidas. Más largo no siempre es mejor, pero en este caso la especificidad importa.

**El manejo de code fences en el output**. A veces el modelo envuelve todo el markdown en un code fence de markdown:

```
```markdown
---
title: ...
```
```

Tuve que agregar un paso de limpieza que detecta y remueve ese wrapper antes de escribir el archivo.

## Por qué este workflow gana a un CMS

La alternativa era usar un CMS headless (Contentful, Sanity, o similar) con una integración de IA. Más features en teoría, pero:

- Otra cuenta, otra API key, otro costo mensual
- El contenido vive fuera del repo — historial de cambios fragmentado
- Onboarding más complejo para contribuidores (si alguna vez los hubiera)

Con ghostpen, todo el contenido está en el repo como markdown. Git es el historial. El PR es el proceso de revisión. Y el pipeline entero son dos archivos: un script de 80 líneas y un workflow YAML.

La simplicidad operacional es el feature.

---

Aún no lo he probado en producción de forma intensiva — la mayoría de los posts de backfill los escribí directamente. Pero actualizaré este post cuando tenga más datos reales del pipeline en uso.

Por ahora: funciona, es simple, y no tengo que acordarme de rotar API keys. Que en 2026 es el nuevo "funciona en mi máquina".
