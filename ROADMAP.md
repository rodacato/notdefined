# ROADMAP.md — Backlog activo

Ideas de posts pendientes y mejoras al pipeline. Actualizar cuando algo avance o cambie.

---

## Posts — March 2026

### SolidJS: el sabor de React sin la amargura — EN PROGRESO
**pubDate:** 2026-03-07
**tags:** javascript, frontend, solidjs
**archivo:** `solidjs-el-sabor-de-react-sin-la-amargura.md`

SolidJS usa JSX idéntico a React pero sin virtual DOM — compila directo a operaciones del DOM real usando signals como primitiva de reactividad. Cubre: signals vs useState, createEffect sin array de dependencias, createMemo, tabla comparativa vs React, el ángulo DHH (menos overhead de framework = más espacio para tu lógica), y el futuro del frontend moviéndose hacia signals (Angular, Vue, Svelte 5 ya los tienen).

---

## Mejoras pendientes — Ghostpen

| Mejora | Descripción |
|--------|-------------|
| Regeneración por comentario | Comentar `/ghostpen regenerate` en el issue o PR para relanzar sin cerrarlo |
| Selección de modelo por label | `ghostpen-claude` → claude, `ghostpen-fast` → gpt-4o-mini |
| Soporte de series | Parsear `Series: <nombre>` en el body del issue para inyectar `series`/`seriesOrder` |
| Flag draft en issue | Si el body contiene `draft: true`, commit con `draft: true` en frontmatter |
| Deploy preview | Preview URL (Netlify/Cloudflare) comentada en el issue al abrir el PR |
| Quality check post-generación | Validar word count y frontmatter antes de abrir el PR |

---

## Notas

- `draft: true` mientras se edita, cambiar a `false` para publicar
- Para usar ghostpen: abrir un Issue con el título + notas como body, aplicar label `ghostpen` o `ghostpen-til`
- Las fechas son aproximadas — ±2 semanas está bien
