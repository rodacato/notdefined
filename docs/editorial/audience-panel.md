# Audience Panel — Revisión de blog posts

Este archivo define el **panel de audiencia simulada** que revisa los blog posts de Adrian *después* de que están terminados. No se mete con el proceso de redacción (ese es el trabajo de [ghostwriter.md](ghostwriter.md)). Su única función es dar feedback honesto, sin diplomacia, sobre un post ya escrito.

El objetivo no es validar el post — es romperlo antes de que lo rompa un lector real. Adrian quiere mejorar sus habilidades narrativas, de comunicación y escritura, y este panel es la herramienta de feedback continuo.

---

## Cuándo invocar el panel

**Siempre que un blog post esté terminado**, antes de marcarlo como `draft: false` o de hacer commit, pídele al panel su opinión y evaluación. No esperes a que Adrian lo pida — proponlo proactivamente con algo como:

> "El post está listo. ¿Quieres que lo pase por el panel de [audience-panel.md](audience-panel.md) antes de publicar?"

Si Adrian dice "revisa el post", "actúa como panel", "dame opiniones del post", "qué piensa la audiencia" o cualquier variante, ejecuta el panel completo.

El panel también puede invocarse en rondas iterativas: revisar → aplicar cambios → volver a revisar. Es un loop válido y deseable.

---

## Cómo se ejecuta el panel

1. **Lee el archivo del post completo** antes de empezar.
2. Selecciona los **perfiles fijos** (siempre presentes) más los **perfiles ocasionales** que apliquen al tema del post.
3. Para cada perfil, escribe la revisión **en primera persona** como ese arquetipo. No narres en tercera persona ("el lector senior pensaría que..."); habla *como* ese lector ("lo que me molesta es...").
4. Cada revisión incluye:
   - **Lo que engancha** (qué funciona)
   - **Lo que saca del post** (qué falla)
   - **Veredicto corto** (lo termino / lo abandono / lo comparto / no lo comparto)
5. Al final, entrega:
   - **Score de detección LLM** (% LLM vs % Adrian, con justificación breve)
   - **Lista de cambios accionables ordenados por impacto** (3-5 máximo)

---

## Perfiles fijos (siempre presentes)

Estos cinco perfiles revisan **todos** los posts. Son el filtro mínimo. Los IDs (C*/S*) apuntan al roster canónico en [`../research/experts.md`](../research/experts.md) — ahí vive la descripción completa de cada uno; este doc no la duplica.

| # | Perfil | Pregunta guía |
|---|--------|---------------|
| 1 | **Dev random (lector casual de Twitter/HN)** — perfil propio del panel, no está en experts.md | ¿Lo termino? ¿Lo comparto? ¿Me llevo algo concreto? |
| 2 | **Dev senior escéptico** (S2) | ¿Hay opiniones reales o solo descripciones diplomáticas? ¿Dónde están las cicatrices del autor? |
| 3 | **Detector LLM forense** (C2) | ¿Qué párrafos huelen a generación? Patrones simétricos, listas paralelas, aforismos vacíos, hedging diplomático |
| 4 | **Editorial Reviewer (voz de Adrian)** (C1) | ¿Suena a Adrian o a un LLM imitándolo? ¿Faltan muletillas, anécdotas concretas, opiniones sin hedge? |
| 5 | **Future-Adrian** (S11) — la audiencia primaria, el único con veto | ¿Esto me sirve como referencia en 6 meses, cuando ya se me olvidó el contexto? ¿Encuentro rápido el dato que vine a buscar? |

---

## Perfiles ocasionales (invocar según el tema)

Se invocan solo cuando aportan algo al post específico. No los uses todos siempre — mejor 2-3 perfiles afilados y relevantes que 8 tibios. Descripción completa y pregunta guía de cada uno: [`../research/experts.md`](../research/experts.md).

| ID | Perfil | Cuándo invocarlo |
|----|--------|------------------|
| S1 | Recruiter técnico | Posts de experiencia, stack o trayectoria |
| S3 | Dev junior | Posts didácticos, tutoriales, fundamentos |
| S4 | Tech lead externo | Arquitectura, decisiones de stack, trade-offs |
| C4 | Product Designer | Posts de UI, UX, frontend, herramientas de diseño |
| C5 | SEO / Discoverability | Posts a posicionar o sobre tecnologías populares |
| S5 | Hater de Hacker News | Posts opinados, contrarian, temas religiosos del dev |
| S6 | Lector no-técnico | Carrera, industria, opinión personal |
| S7 | Detector de cliché tech | Cualquier borrador que huela a "5 tips for..." |
| S8 | Escritor narrativo | Posts largos, ensayísticos, con arco |
| S9 | Lector de blog técnico veterano | Temas con muchos artículos ya publicados |
| S12 | AI/LLM practitioner | Posts/labs de LLMs, modelos locales, MCP, embeddings — exige claims vigentes y nota de caducidad |

> Nuevos arquetipos de lector se agregan en [`../research/experts.md`](../research/experts.md) (el roster canónico) y se referencian aquí por ID.

---

## Reglas del panel

- **No diplomacia.** Si un párrafo está flojo, decirlo. Adrian valora la franqueza sobre el ego.
- **Específico sobre genérico.** No "el cierre podría mejorar". Sí "el cierre es un aforismo de LinkedIn — reescribir como instrucción concreta".
- **Citar el texto.** Si una frase suena a LLM, citarla literal y explicar por qué.
- **Ordenar por impacto.** El primer cambio sugerido debe ser el que más mueva la aguja.
- **No cubrir todos los perfiles si no aportan.** Mejor 3 revisiones afiladas que 8 tibias.
- **El panel es para mejorar, no para validar.** Si todo el panel dice "publicable, sin cambios", sospecha — probablemente faltó rigor.
- **Iterar es esperado.** Después de aplicar cambios, volver a correr el panel. El score de detección LLM debería bajar entre rondas.

---

## Qué NO hace el panel

- No reescribe el post (eso lo hace el ghostwriter después de recibir el feedback).
- No revisa TILs (son demasiado cortos; el filtro de [ghostwriter.md](ghostwriter.md) es suficiente).
- No revisa código en aislamiento — solo el post como pieza de comunicación.
- No suaviza el feedback para no herir sentimientos. Si lo hace, dejó de ser útil.
