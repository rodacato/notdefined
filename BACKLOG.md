# BACKLOG.md — Ideas de posts

Ideas en bruto, sin compromiso de fecha. Cuando una madure lo suficiente, pasa a `ROADMAP.md` con fecha tentativa y crea el archivo `.md` con `draft: true`.

---

## Cómo usar este backlog

### Para Adrian

Agrega ideas conforme se te ocurran. No te preocupes por el formato perfecto — con el título y el contexto de qué estabas haciendo es suficiente.

Cuando quieras desarrollar una idea, pídeme:
- "Toma la idea de [tema] del backlog y vamos a expandirla"
- "Hazme las preguntas de descubrimiento para [tema]"
- "Pasa [tema] a draft"

### Para Claude (instrucciones de operación)

Cuando Adrian pida trabajar una idea del backlog:

1. **Lee la entrada completa** — el contexto, el ángulo y las preguntas pendientes.
2. **Consulta al experto sugerido** — simula la perspectiva del experto para validar la idea antes de escribir. Busca: puntos ciegos, sesgos, ángulos que Adrian no está viendo, si el post tiene sustancia suficiente o está demasiado cargado a un lado.
3. **Fase de descubrimiento** (ver `GHOSTWRITER.md`) — hazle las 5 preguntas obligatorias a Adrian para extraer experiencia real, opiniones y anécdotas.
4. **Propón estructura** — título, secciones, ángulo principal. Adrian aprueba antes de escribir.
5. **Escribe el draft** — crea el archivo con `draft: true` y muévelo del backlog al `ROADMAP.md`.

Si una idea no tiene pies o cabeza después de la validación del experto, dilo. Es mejor matar una idea temprano que publicar un post vacío.

---

## Ideas

### Hono vs Express
**Contexto:** Proyecto personal para no oxidarse. Hono salió como alternativa moderna a Express.
**Ángulo:** Comparar ambos desde la experiencia práctica — DX, rendimiento, middleware, lo que se siente usarlos día a día.
**Experto sugerido:** Backend engineer con experiencia en Node.js que haya migrado proyectos entre frameworks HTTP (Express, Fastify, Hono). Que valide si la comparativa tiene sustancia real o si es otra "X vs Y" genérica.
**Preguntas pendientes:**
- ¿Ya tienes el proyecto andando con Hono? ¿Qué partes migraste desde Express?
- ¿Hay algo que Hono no pudo hacer que Express sí?
- ¿El ángulo es "migrar" o "elegir desde cero"?

### El glosario que JavaScript te debe
**Contexto:** Vite, Bun, npx vs npm, pnpm, Turbo... las líneas que los hacen diferentes son cada vez más tenues.
**Ángulo:** Aclarar qué hace cada uno, dónde se solapan y por qué existen tantos. Post de referencia para dejar de adivinar.
**Experto sugerido:** Frontend/tooling engineer que viva en el ecosistema JS día a día. Que valide si las categorías están bien separadas, si falta alguna herramienta clave, y si el post no va a quedar obsoleto en 3 meses.
**Preguntas pendientes:**
- ¿Cuáles son los que más confusión te causan a ti?
- ¿Lo enfocas a "qué uso yo y por qué" o a "guía objetiva"?
- ¿Incluyes runtimes (Bun, Deno) o solo tooling?

### Cómo uso AI para escribir código
**Contexto:** Inspiración en Clawbot y sus archivos markdown (AGENTS.md, GHOSTWRITER.md, etc.) aplicados a proyectos propios.
**Ángulo:** Cómo guiar LLMs con contexto, cómo pedirles cosas, cómo obtener validaciones de expertos, el workflow real.
**Experto sugerido:** Developer advocate o ingeniero que use AI assistants diario en producción (no solo demos). Que valide si el workflow es reproducible, si hay trampas que Adrian no está viendo, y si el post aporta algo nuevo vs los 500 posts de "how I use AI".
**Preguntas pendientes:**
- ¿Qué archivos markdown usas y para qué sirve cada uno?
- ¿Cómo llegaste a este sistema? ¿Iteraste mucho?
- ¿Hay algo que no funciona bien todavía?

### Deep dive: Kamal fuera de Rails
**Contexto:** Lo usa como herramienta de facto para releases en proyectos no-Rails.
**Ángulo:** Cómo juega con GitHub Actions, la satisfacción de tener deploys simples sin Kubernetes.
**Experto sugerido:** DevOps/platform engineer que conozca Kamal y alternativas (Coolify, CapRover, Dokku). Que valide si el post no está vendiendo Kamal como bala de plata y si cubre las limitaciones reales.
**Preguntas pendientes:**
- ¿Qué tipo de proyectos has deployado con Kamal que no son Rails?
- ¿Qué configuración tuviste que adaptar?
- ¿Dónde sientes que Kamal se queda corto?

### GitHub Packages como tu infraestructura
**Contexto:** Usar GitHub Packages en lugar de npm para publicar, tener un registry de Docker privado, levantar cosas rápido (ej. un MCP HTTP server) sin fricción.
**Ángulo:** GitHub como plataforma completa de infraestructura para proyectos personales y equipos chicos.
**Experto sugerido:** Platform engineer que use GitHub Packages en producción (no solo en demos). Que valide si hay gotchas de pricing, límites, o experiencias donde GitHub Packages se queda corto vs alternativas.
**Preguntas pendientes:**
- ¿Qué publicas ahí hoy? ¿npm packages, Docker images, ambos?
- ¿Cómo es el flujo desde tu CI hasta el registry?
- ¿Has tenido pedos con límites, permisos o pricing?

### MCP a profundidad
**Contexto:** Qué son realmente, cómo se comparan contra una API, cómo necesitan de una API, los diferentes tipos (stdio, HTTP, etc.), diferencias entre los CLIs.
**Ángulo:** Todos parecidos y similares pero únicos. Desmitificar MCP para devs que ya saben de APIs.
**Experto sugerido:** Ingeniero que haya implementado MCP servers en producción y conozca la spec. Que valide si las comparativas son justas, si hay matices técnicos que Adrian está simplificando de más, y si el post no confunde más de lo que aclara.
**Preguntas pendientes:**
- ¿Cuántos MCP servers has hecho? ¿De qué tipo?
- ¿Dónde sientes que la gente más se confunde con MCP?
- ¿El ángulo es "qué es MCP" o "cuándo usar MCP vs API directa"?
