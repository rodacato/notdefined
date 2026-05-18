# AGENTS.md — Contexto para agentes AI

Este archivo es el índice de contexto para agentes AI (Claude Code, Copilot, etc.) trabajando en `notdefined.dev`.

---

## Antes de cualquier tarea

1. **Memoria local del agente** — si existe `.kwik-e/memory/MEMORY.md` en este workspace, léelo. Es el índice de memoria persistente (perfil de Adrian, feedback acumulado, decisiones del proyecto). La carpeta `.kwik-e/` está gitignored — solo existe en la máquina de Adrian; en un clon público no estará.
2. **Persona según la tarea** — abajo.

---

## ¿Qué archivo leer?

| Si tu tarea es... | Lee |
|-------------------|-----|
| Código, arquitectura, componentes, pipelines, CI, fix de bugs, refactors | [IDENTITY.md](IDENTITY.md) |
| Redactar o editar posts, TILs, copy del sitio | [docs/editorial/ghostwriter.md](docs/editorial/ghostwriter.md) |
| Revisar un blog post terminado con panel de audiencia simulada | [docs/editorial/audience-panel.md](docs/editorial/audience-panel.md) |
| Consultar al panel de expertos (Core + Situational) | [docs/research/experts.md](docs/research/experts.md) |
| Diseño visual / generar pantallas con AI design tools | [docs/design/](docs/design/) |
| Ambas cosas (técnico + editorial) | Lee los dos |

---

## Sobre el proyecto

`notdefined.dev` es el blog técnico personal de Adrian Castillo.
Stack: Astro + Tailwind, deploy en GitHub Pages, contenido en Markdown via Content Collections.

El proyecto tiene dos "modos" principales de trabajo:

**Técnico** — construir y mantener el sitio.
Guiado por [IDENTITY.md](IDENTITY.md): estándares de código, arquitectura, Definition of Done, mapa del repo, comandos.

**Editorial** — escribir y editar contenido.
Guiado por [docs/editorial/ghostwriter.md](docs/editorial/ghostwriter.md): voz de Adrian, guía de blog posts y TILs, prohibiciones de estilo. Revisión post-escritura con [docs/editorial/audience-panel.md](docs/editorial/audience-panel.md).

---

## Reglas para agentes

- **No agregar `Co-Authored-By` ni trailers de coautoría en commits.** Adrian es el único autor.
- **No abrir PRs ni hacer push sin pedido explícito.** Default: commits locales.
- **Chat en español; commits / issues / docs en inglés; contenido editorial en es-MX casual.**
- **Para diseño: escribe prompts** (ver [docs/design/claude-design-prompts.md](docs/design/claude-design-prompts.md)) — no intentes mockups directos. Adrian los corre en Claude Design / Stitch / v0.

---

## Documentación completa

### Personas y operación

| Archivo | Propósito |
|---------|-----------|
| `AGENTS.md` | Este archivo — índice de contexto para agentes AI |
| `IDENTITY.md` | Persona técnica: arquitectura, estándares, repo map, comandos |
| `docs/editorial/ghostwriter.md` | Persona editorial — voz, estilo, guía de redacción |
| `docs/editorial/audience-panel.md` | Panel de audiencia simulada — revisión post-escritura |
| `docs/research/experts.md` | Panel de expertos canónico (6 Core + 10 Situational) |

### Pipeline editorial

| Archivo | Propósito |
|---------|-----------|
| `BACKLOG.md` | Ideas de posts en bruto — validación, preguntas pendientes, experto sugerido |
| `ROADMAP.md` | Posts en progreso con fecha tentativa |

### Vision y arquitectura

| Carpeta / archivo | Propósito |
|-------------------|-----------|
| `docs/vision/` | North star, audiencia, non-goals, JTBDs |
| `docs/architecture/adr/` | Decisiones arquitectónicas inmutables (ADRs) |
| `docs/design/` | Brand, tokens, componentes, kit portable para AI design |

### Memoria local del agente

| Carpeta | Propósito |
|---------|-----------|
| `.kwik-e/memory/` | Memoria persistente (gitignored, local-only). Entry point: `.kwik-e/memory/MEMORY.md`. |

### Público

| Archivo | Propósito |
|---------|-----------|
| `README.md` | Overview público: tech stack, dev setup, deploy |
