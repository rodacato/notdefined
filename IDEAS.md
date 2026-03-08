# Blog Post Ideas — Backfill Feb 2025 → Feb 2026

Two options per month. Pick one, or use both if you're feeling prolific.
Use ghostpen to generate drafts: open a GitHub Issue with the title + notes as body, add label `ghostpen`.

---

## Guía de estilo — Cómo escribir estos posts

Basado en el análisis de los 4 posts existentes: ruby-blocks-lambdas-procs, ruby-object-model, docker-crash-course, y ruby-parallelism-and-concurrency.

### Idioma
**Español**, siempre. Español casual mexicano — no traducción corporativa. Los términos técnicos se dejan en inglés (`threads`, `block`, `render`, `deploy`), pero la narración es en español de la calle.

### Estructura obligatoria

```
## TL;DR
Bullet list con los 4-6 puntos clave del post. El lector debe poder leer solo el TL;DR
y entender qué va a aprender. Van en negritas los términos clave.

---

## Secciones con H2
Cada concepto principal tiene su H2. Los subsconceptos van en H3.
Los bloques de código van dentro de las secciones, no al final.

## Tabla comparativa (cuando aplica)
Al final o dentro del post, una tabla que resuma las diferencias entre opciones.

Cierre con punch
Una o dos líneas finales con opinión, humor o takeaway directo. No un resumen.
```

### Voz y tono

**Sí:**
- Hablarle directamente al lector: "¿No me crees?", "Mira este ejemplo", "Imagina que..."
- Frases coloquiales: "Órale", "Vámonos", "Ya te la sabes", "basta con...", "oops"
- Primera persona honesta: "Honestamente, rara vez uso fibers", "Aún no lo he probado en producción pero actualizaré el post"
- Humor pop: referencias a películas, analogías del mundo real (Fast & Furious, chefs, cocinas)
- Preguntas retóricas seguidas de la respuesta: "¿Confundido? No te preocupes."
- "Vamos a..." para introducir secciones

**No:**
- "En este post vamos a aprender..." al inicio
- Bullet list de resumen al final (eso va en el TL;DR, no en el cierre)
- Tono académico o de documentación
- Palabras de relleno corporativo: "es importante mencionar", "cabe destacar", "en conclusión"

### Código

- Ejemplos de código en cada sección, no al final del todo
- Comentarios en el código explicando el output: `# => "Hola, Alice!"`
- Ejemplos progresivos: primero simple, luego con más contexto real
- El ejemplo "real" de cierre siempre tiene contexto práctico (carrito de compras, API Node, etc.) — nunca `foo`/`bar`
- Lenguaje del code fence siempre especificado: ` ```ruby `, ` ```sh `, ` ```yaml `

### Emojis
Opcionales. El post de Docker los usa en headers (🐳, 🔑, 📌), los de Ruby no. Regla general: úsalos en posts de referencia/comandos, no en posts conceptuales. Nunca en el título ni en el TL;DR.

### Tablas comparativas
Casi siempre hay una. Columnas claras, sin sobrecargar. Ver el patrón del post de concurrencia:

```
| Método   | Ideal para...          | No recomendado para... |
```

### Longitud
- Posts conceptuales (Ruby, arquitectura): 800–1200 palabras
- Posts de referencia/crash course (Docker, comandos): pueden ser más largos, son tipo cheatsheet

### Cierre
Siempre termina con punch. Ejemplos reales:
- *"¡Wow, qué fácil! Vámonos, ya tenemos un nuevo juguete que usar."*
- *"Ya te la sabes — Threads para I/O, Processes para CPU, Fibers para control fino. Y si todo falla, prueba Elixir o Rust."*
- *"Buttt nada es gratis. Luego actualizaré el post para reflejar lo que aprenda."*

### Instrucción para ghostpen
Cuando uses el pipeline para generar un draft, agrega esto al cuerpo del issue:

```
Idioma: español mexicano casual.
Incluir TL;DR con bullets al inicio.
Tono: dev senior hablándole a un colega, no tutorial corporativo.
Código: ejemplos progresivos, comentarios en el código, cierre con ejemplo real.
Cerrar con un takeaway con actitud, no con resumen.
```

---

## March 2026

### SolidJS: el sabor de React sin la amargura — EN PROGRESO
**pubDate:** 2026-03-07
**tags:** javascript, frontend, solidjs
**archivo:** `solidjs-el-sabor-de-react-sin-la-amargura.md`

SolidJS usa JSX idéntico a React pero sin virtual DOM — compila directo
a operaciones del DOM real usando signals como primitiva de reactividad.
Cubre: signals vs useState, createEffect sin array de dependencias,
createMemo, tabla comparativa vs React, el ángulo DHH (menos overhead
de framework = más espacio para tu lógica), y el futuro del frontend
moviéndose hacia signals (Angular, Vue, Svelte 5 ya los tienen).

---

## Notes

- `draft: true` while editing, flip to `false` to publish
- To use ghostpen: open an Issue with the title + these notes as body, apply label `ghostpen`
- Dates are suggestions — ±2 weeks is fine
- Only Option A for Feb 2025 and Mar 2025 are tied to real releases (Tailwind v4, DeepSeek R1) — keep those dates accurate
