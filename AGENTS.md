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

## GitHub Project safety

El workflow editorial corre en un **Project v2 privado** a nivel de usuario (`rodacato`) con **solo draft items**. Los items viven dentro del Project, **no como issues en ningún repo**. El repo público `rodacato/notdefined` debe tener **cero issues internos**.

**Acciones prohibidas:**
- `gh issue create -R rodacato/notdefined ...` — crea issue público, expone el contenido.
- "Convert to issue" en la UI del Project apuntando al repo público — misma fuga, cerrar el issue después NO lo oculta.
- Toggle del Project de Private → Public — expone todos los drafts.
- Agregar linked items que apunten a issues de `rodacato/notdefined` (esos issues ya son públicos).

**Acciones seguras (defaults):**

| Necesitas | gh CLI |
|-----------|--------|
| Crear idea / draft | `gh project item-create <N> --owner rodacato --title "..." --body "..."` |
| Listar items del Project | `gh project item-list <N> --owner rodacato` |
| Editar campo (Status, Type, etc.) | `gh project item-edit --id <ITEM_ID> --field-id <F_ID> --single-select-option-id <OPT_ID>` |
| Borrar item | `gh project item-delete --id <ITEM_ID>` |

**Check de fuga:** `npm run check:project` lista issues del repo público. Debería estar vacío salvo issues externos legítimos filed por lectores.

Detalle operativo completo: [`.kwik-e/memory/feedback_project_v2_no_convert.md`](.kwik-e/memory/feedback_project_v2_no_convert.md) (local).

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

| Recurso | Propósito |
|---------|-----------|
| GitHub Project v2 privado [`rodacato/projects/7`](https://github.com/users/rodacato/projects/7) | Ideas de posts (draft items) — contexto, ángulo, experto sugerido, preguntas pendientes. Solo Adrian tiene acceso. |

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
