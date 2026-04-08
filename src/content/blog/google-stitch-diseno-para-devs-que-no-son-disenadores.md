---
title: "Google Stitch — diseño de interfaces para devs que no son diseñadores"
description: "Desde Don't Make Me Think hasta generar UIs con AI. Cómo usar Google Stitch para prototipar, iterar y crear productos con diseño real sin ser diseñador."
pubDate: 2026-03-30
tags: ["ai", "design", "tools", "stitch"]
draft: false
---

## TL;DR

- **Google Stitch** es una herramienta de Google Labs que genera interfaces de alta fidelidad a partir de texto, imágenes o sketches — gratis, en el browser.
- El secreto no es el prompt, es **la visión previa**: definir colores, tipografía y sentimiento antes de pedirle pantallas.
- **Saber nombrar las cosas** (visual hierarchy, whitespace, grid, typography scale) te ahorra prompts largos y resultados malos.
- Stitch exporta un **DESIGN.md** con tu sistema de diseño completo — lo conectas a Claude Code y tu código sale consistente desde el primer componente.
- No reemplaza a Figma ni a un diseñador senior, pero para un dev construyendo sus propios productos, es un antes y después.

---

## De Don't Make Me Think a tener alas

Hace como diez años leí [Don't Make Me Think](https://sensible.com/dont-make-me-think/) de Steve Krug. Era la era de Twitter Bootstrap, cuando todo se veía igual pero al menos se veía *decente*. El libro me hizo click en algo que después de trabajar en agencias era obvio: cuando los usuarios no encontraban lo que buscaban, no era su culpa. Era la mía. Yo tenía que hacerlo más fácil.

El pedo es que saberlo y poder hacerlo son cosas muy diferentes.

Durante años mi proceso de diseño fue: agarrar un framework de CSS, buscar plugins de JavaScript, y construir todo yo. React mejoró la parte de componentes pero no la de diseño. Las dependencias crecían, la uniformidad no existía, y al final terminaba haciéndolo a mano porque ningún template se ajustaba a lo que necesitaba.

A inicios de este año empecé probando [Lovable](https://lovable.dev/) para prototipar. Funcionaba, pero se sentía limitado. Luego descubrí Stitch en la página de alpha apps de Google Labs y decidí probarlo. Al principio no sabía ni qué pedirle — el clásico de tener una herramienta poderosa y sentirte idiota enfrente de ella. Pero conforme fui entendiendo más de LLMs, de prompting, y con Stitch 2.0, la cosa cambió. Se volvió mi herramienta principal de diseño.

Todos mis productos — [shellm](https://shellm.dev), [stockerly](https://stockerly.dev), [dojo](https://github.com/rodacato/dojo), [drawhaus](https://drawhaus.dev) — han pasado por Stitch de una u otra forma.

## El workflow que llegué a tener (después de varios productos)

Al principio abría Stitch y tiraba prompts directo. Los resultados eran mediocres y me frustraba. Hoy hago algo distinto, y llegué a esto después de cagarla varias veces.

Antes de tocar Stitch, trabajo la idea del producto en un documento tipo BRANDING.md. Qué hace, para quién, qué existe ya, quiénes son los competidores, qué tono visual busco. Suena obvio pero antes me lo saltaba — y se notaba en los resultados.

Después viene la parte que me costó más entender: no empezar por los colores. Suena cursi, lo sé, pero el orden importa. No empiezo eligiendo `#3B82F6` porque se ve bonito. Me detengo a pensar qué emoción quiero provocar en los primeros 10 segundos que el usuario ve la pantalla. De ahí salen los colores, no al revés.

Esto no me lo inventé yo — es teoría del color, lleva décadas estudiada. Azul transmite seguridad, verde confort, negro y morado elegancia y misterio. No hay magia ahí, hay psicología. Y aun así la mayoría de devs (yo incluido por años) elegimos colores porque "se ven bien en Tailwind". Para [dojo](https://github.com/rodacato/dojo) elegí negro y morado porque la idea era que se sintiera como entrar a un dojo de verdad — silencioso, serio, un lugar donde vienes a sufrir voluntariamente. Si hubiera empezado por "qué color se ve bien hoy", habría terminado con otro SaaS azul más.

Para anclar ese sentimiento busco una referencia del mundo real. Un lugar, un objeto, una experiencia. No es decoración, es un ancla para tomar decisiones consistentes sin ser diseñador.

Con eso ya definido, armo la lista de pantallas y entro a Stitch con prompts guiados. Nada de "hazme una landing page bonita". Más bien algo así:

```text
Landing page para shellm — terminal commands asistidos con AI.
Estilo: minimalista, dark mode, monospace typography.
Sensación: técnico pero accesible, como la documentación de Stripe.
Secciones: hero con demo animado, features en grid de 3 columnas,
pricing cards, footer con links y social.
Colores: slate-900 base, cyan-400 accents, white text.
```

Con un prompt así, el primer resultado ya viene al 70-80%. Sin esa preparación previa, te la pasas iterando en círculos y culpando a Stitch.

## Lo que no es tan obvio — hablar el idioma del diseño

Hmm, esta es la parte que más me hubiera gustado saber antes. Hay veces que pude haber sido explícito con una palabra o una frase — un nombre de componente, un concepto de diseño — y en vez de eso terminé dando direcciones larguísimas, confusas, que llevaban a Stitch por el camino equivocado. Rehaciendo cosas que con el término correcto salían a la primera.

Estos son los conceptos que más impacto tienen cuando le hablas a Stitch (o a cualquier herramienta de diseño con AI):

| Concepto | Qué es | Cómo usarlo |
|----------|--------|-------------|
| **Visual hierarchy** | El orden en que el ojo recorre la página — tamaño, contraste, posición | Antes decía "que el botón se vea importante". Ahora digo "el CTA debe dominar la visual hierarchy del hero" y Stitch lo entiende a la primera |
| **Whitespace** | El espacio vacío que deja respirar el contenido | "Generous whitespace, no cramming" — la palabra mágica es *generous* |
| **Typography scale** | Sistema de tamaños de texto consistente | "Typography scale: H1 48px, H2 32px, body 16px, line-height 1.6". Si no lo defines, Stitch te mete tres tamaños random |
| **Grid system** | La estructura invisible que alinea elementos | "12-column grid, max-width 1200px" |
| **Affordance** | Lo que un elemento sugiere que puedes hacer con él | Esta palabra me la regaló *The Design of Everyday Things*. Es la diferencia entre un botón que parece botón y uno que parece etiqueta |

A mi forma de verlo, aprender estos términos es como aprender los nombres de los ingredientes antes de cocinar. Puedes describir que quieres "la cosa verde que pica" o puedes decir "jalapeño". Los dos te llevan al mismo lugar, pero uno te ahorra tres rondas de iteración.

## El styleguide como base de todo

Cuando estaba haciendo shellm con Stitch 1.0, sufrí algo que cualquiera que haya usado esa versión va a reconocer: el primer prompt salía perfecto. El segundo, casi. Para el noveno, el header y el sidebar ya ni se parecían a las primeras pantallas. Era como si cada generación olvidara lo anterior. Botones que cambiaban de color, menús que migraban de lugar, footers que aparecían y desaparecían.

Al final dejé de pelearme con eso. Ignoraba el layout y me enfocaba solo en el contenido del body. No es que haya sido una decisión heroica — fue rendirme con estilo. Pero esa rendición me obligó a hacer algo que terminó siendo lo más útil: crear un styleguide de componentes *antes* de generar pantallas. Botones, inputs, cards, headers definidos como referencia fija.

Resulta que esa limitación fue un regalo disfrazado.

Crear el styleguide primero es el mejor consejo que puedo dar. Si empiezas por las pantallas, cada una va a tener su propia personalidad. Si empiezas por los componentes, todo se ve como parte del mismo producto.

Stitch ahora exporta un **DESIGN.md** — un archivo markdown con tu sistema de diseño completo: paleta de colores con hex values y roles semánticos, typography scale, spacing scale, border radius, shadows, y patrones de componentes con sus estados.

Lo interesante es que ese archivo está diseñado para agentes de AI. Le pasas el DESIGN.md a Claude Code y genera código que respeta tu design system desde el primer componente:

```markdown
# En tu CLAUDE.md
Siempre consulta design.md al generar componentes de UI.
Usa los colores semánticos definidos, nunca hardcodees hex values.
Respeta la typography scale y el spacing system.
```

Yo empecé con algo similar antes de que existiera DESIGN.md — un BRANDING.md con el contexto de mi sitio, competidores y la imagen que quería proyectar. La idea es la misma: **un documento que sea la fuente de verdad visual de tu producto**.

## Referencias para devs que quieren diseñar mejor

No necesitas carrera en diseño. Necesitas tres libros y curiosidad.

El primero ya lo mencioné: **[Don't Make Me Think](https://sensible.com/dont-make-me-think/)** de Steve Krug. Si vas a leer uno, ese. La regla número uno es brutal en su simplicidad: si algo requiere que el usuario piense, no es suficientemente usable. La gente escanea páginas, no las lee. Ese libro me cambió cómo veía cada formulario, cada menú, cada flow de checkout.

El segundo es **[Refactoring UI](https://refactoringui.com/)** de Adam Wathan y Steve Schoger. Escrito por devs, para devs. Si solo te llevas un consejo de ese libro que sea este: diseña en escala de grises primero. Te obliga a crear jerarquía con spacing y contraste, no escondiéndote detrás de colores. Funciona hasta en herramientas como Stitch — empieza grayscale en tus prompts y agrega color al final.

Y **[The Design of Everyday Things](https://www.nngroup.com/books/design-everyday-things-revised/)** de Don Norman. El que acuñó "user experience". Después de leerlo nunca vuelves a ver una puerta de la misma forma. Suena exagerado pero es literal.

## El cierre

Stitch no me convirtió en diseñador y no va a convertirte a ti. Lo que sí hace es darte la velocidad para explorar ideas visuales al ritmo que las piensas, sin depender de un framework de CSS o de un diseñador que interprete lo que tienes en la cabeza.

Si llevas años haciendo wireframes en Notion o copiando templates de Tailwind que nunca se sienten tuyos — hazte el favor y abre Stitch este weekend. Pero antes lee un capítulo de Don't Make Me Think. En ese orden.
