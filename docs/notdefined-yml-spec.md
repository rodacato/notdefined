# `.notdefined.yml` — Spec para proyectos en notdefined.dev

Este documento define el formato del archivo `.notdefined.yml` que cada repositorio público debe tener en su raíz para aparecer en [notdefined.dev/projects](https://notdefined.dev/projects).

---

## Prompt para generar el archivo

Copia y pega esto en Claude Code dentro del repositorio:

```
Lee este documento completo antes de hacer nada: https://raw.githubusercontent.com/rodacato/notdefined/master/docs/notdefined-yml-spec.md

Luego analiza este repositorio (README, código fuente, Gemfile/package.json, estructura) y genera el archivo `.notdefined.yml` en la raíz siguiendo la spec exacta del documento.

Crea también el directorio `docs/screenshots/` si no existe.

NO hagas commit. Solo genera el archivo y dime qué pusiste y por qué.
```

---

## Formato del archivo

```yaml
# .notdefined.yml — metadata para notdefined.dev/projects
# Spec: https://github.com/rodacato/notdefined/blob/master/docs/notdefined-yml-spec.md

# --- Identidad ---
tagline: "Monitorea tu portafolio de inversiones sin depender de nadie"
description: >
  Tracking de acciones, alertas de precio y calendario de earnings.
  Open-source, self-hosted, hecho con Rails 8 y Hotwire.
  Lo construí porque las apps de finanzas gratuitas siempre terminan
  metiéndote un paywall.
icon: docs/icon.svg          # SVG o PNG, cuadrado, mínimo 64x64
background_color: "#1a1a2e"  # hex, se usa como fondo detrás del icon
screenshot: docs/screenshots/notdefined.png  # screenshot para la card

# --- Clasificación ---
category: producto    # producto | utileria
status: activo        # activo | mantenimiento | pausado
lang: Ruby            # lenguaje principal del repo
tags:                 # 3-5 tags, lowercase
  - rails
  - fintech
  - docker

# --- Links ---
repo: https://github.com/rodacato/stockerly
url: https://stockerly.notdefined.dev  # sitio público (omitir si no hay)

# --- Orden en notdefined.dev ---
order: 1  # menor = aparece primero dentro de su categoría
```

---

## Campos

### Obligatorios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tagline` | string | Una línea, máx 80 chars. Lo que ves primero en la card. |
| `description` | string | 2-4 oraciones. Qué hace, para quién, por qué existe. |
| `category` | enum | `producto` (tiene UI, usuarios lo usan) o `utileria` (lib, bot, API, CLI). |
| `status` | enum | `activo`, `mantenimiento`, o `pausado`. |
| `lang` | string | Lenguaje principal (Ruby, JavaScript, TypeScript, etc.). |
| `tags` | list | 3-5 tags en lowercase. |
| `repo` | url | URL del repositorio en GitHub. |
| `order` | number | Orden dentro de su categoría. Menor = primero. |

### Opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `url` | url | Sitio público si existe. Omitir si no hay deploy. |
| `icon` | path | Ruta relativa al repo. SVG preferido, PNG aceptable. Cuadrado, mínimo 64x64. |
| `background_color` | hex | Color de fondo para la card del icon. Hex con `#`. |
| `screenshot` | path | Ruta relativa al repo. PNG o JPG, aspect ratio 16:9 preferido, mínimo 1280x720. |

---

## Reglas de estilo

### Tagline
- Español mexicano casual, directo.
- Sin "plataforma para...", "herramienta que...", "solución de...".
- Piensa en cómo lo dirías en una conversación: "monitorea tu portafolio sin depender de nadie".
- No empieza con el nombre del proyecto.
- Máximo 80 caracteres.

### Description
- Español mexicano casual. Primera persona o impersonal, nunca corporativo.
- Menciona el stack si es relevante para el lector.
- Si resuelve un problema personal, dilo — eso es más interesante que una feature list.
- 2-4 oraciones. Si necesitas más, estás describiendo demasiado.
- Usa `>` en YAML para multiline.

### Icon
- SVG es ideal (escala sin perder calidad).
- Si no tienes icon, omite el campo — notdefined.dev mostrará un fallback con la primera letra del nombre.
- Recomendación: el icon debe verse bien sobre `background_color` y sobre fondo oscuro (#0C0C0E).

### Screenshot
- Captura real de la app funcionando, no mockups.
- Si el proyecto no tiene UI (API, CLI, bot), omite el campo.
- Guárdalo en `docs/screenshots/` dentro del repo.
- Nombre sugerido: `notdefined.png`.

### Background color
- Úsalo para darle identidad visual a la card del proyecto.
- Debe tener buen contraste con el icon.
- Si no lo defines, se usará el color de surface del blog (#141416).

---

## Estructura esperada en el repo

```
mi-proyecto/
  .notdefined.yml          ← este archivo
  docs/
    icon.svg               ← icon del proyecto (opcional)
    screenshots/
      notdefined.png       ← screenshot para la card (opcional)
  README.md
  ...
```

---

## Ejemplos

### Producto con todo

```yaml
tagline: "Monitorea tu portafolio de inversiones sin depender de nadie"
description: >
  Tracking de acciones, alertas de precio y calendario de earnings.
  Open-source, self-hosted, hecho con Rails 8 y Hotwire.
  Lo construí porque las apps de finanzas gratuitas siempre terminan
  metiéndote un paywall.
icon: docs/icon.svg
background_color: "#1a1a2e"
screenshot: docs/screenshots/notdefined.png
category: producto
status: activo
lang: Ruby
tags: [rails, fintech, docker]
repo: https://github.com/rodacato/stockerly
url: https://stockerly.notdefined.dev
order: 1
```

### Utilería sin UI

```yaml
tagline: "Tus suscripciones de LLM como una sola REST API"
description: >
  Unifica Claude, Gemini y otros providers (CLI y API) bajo un
  endpoint compatible con OpenAI. Lo hice porque pago varias
  suscripciones y quería usarlas desde un solo lugar.
category: utileria
status: activo
lang: JavaScript
tags: [ai, llm, api]
repo: https://github.com/rodacato/SheLLM
order: 1
```

### Proyecto pausado

```yaml
tagline: "Tu asistente de IA en Telegram con memoria y personalidad"
description: >
  Bot single-user con historial de conversaciones, memoria de 4 niveles
  y soporte para múltiples LLMs. Corre en un server de $4/mes.
icon: docs/icon.svg
background_color: "#2d1b69"
category: utileria
status: pausado
lang: JavaScript
tags: [ai, bot, telegram]
repo: https://github.com/rodacato/kenobot
order: 2
```
