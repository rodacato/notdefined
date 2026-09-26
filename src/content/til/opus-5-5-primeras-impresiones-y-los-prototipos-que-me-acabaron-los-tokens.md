---
title: 'Opus 5.5: primeras impresiones y los prototipos que me acabaron los tokens'
date: 2026-09-24
tags: ['opus-5-5', 'claude', 'openai', 'llm', 'ai', 'prototypes']
---

Opus 5.5 salió el 22 de septiembre y lo probé el mismo día. Primera impresión: mis tokens duran más. El resultado es igual de bueno o mejor — valida más, lo que entrega es de mayor calidad, a veces hace cosas que antes le tenía que pedir dos veces. Me lo acabé en días y terminé pagando usage extra esta semana. No me quejo.

Justo antes había pagado los $20 USD del Pro plan de OpenAI para probar GPT-6 Astra. El hype era fuerte y quería verlo por mí mismo. Me gustó. No está mal. Pero no me hace extrañar a Claude para nada, y cuando salió Opus 5.5 la diferencia se sintió.

Lo que me voló la cabeza no fue un benchmark. Fueron los prototipos.

Construí [Knotty](https://rodacato.github.io/knotty/) — le mandas fotos de un mueble y te regresa un diseño en triplay, y después lo ajustas hablando con un carpintero virtual. [AI Town](https://rodacato.github.io/ai-town/) — veinte aldeanos escuchan una proclamación y cada uno decide qué hacer, mismo prompt, cualquier modelo, y comparas decisiones, latencia y costo. Y [Pattern Circuit](https://github.com/rodacato/pattern-circuit), un prototipo más chico que hice rápido para validar otra idea.

Los tres me sirvieron para probar [SheLLM](/blog/shellm-lo-que-aprendi-construyendo-mi-propio-api-wrapper-de-llms) contra las APIs reales. Pero también me dejaron un detalle curioso: Knotty — [el que construí desde el celular con Remote](/til/claude-code-remote-desde-mi-celular) — salió con código en español. Variables con ñ, `if mi_texto`, todo. Pattern Circuit, con la misma conversación en español, salió en inglés perfecto. Mismo modelo, misma sesión, distinto resultado. No sé qué lo dispara, pero la lección sigue siendo la misma: pon un `CLAUDE.md` con reglas claras antes de empezar.

Con cada modelo nuevo la velocidad para prototipar sube. Eso es lo emocionante y lo que asusta al mismo tiempo — escribí sobre [ese vértigo](/til/cerebro-de-vibe-coder) hace meses y sigue ahí. Pero si algo cambió es que ya no me paralizo. Construyo, pruebo, y si funciona, lo sigo. Si no, fueron tokens bien gastados.
