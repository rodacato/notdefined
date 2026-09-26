---
title: 'Jev y los decision models: la IA que no genera texto'
date: 2026-09-22
tags: ['jev', 'laya', 'ai', 'agents', 'decision-models']
---

Me dieron acceso al beta cerrado de [Jev](https://www.jev.ai/) esta semana y descubrí una categoría de modelos que no conocía: decision models. No generan texto. Les mandas un estado (JSON, un ticket, un email, lo que sea) y preguntas tipadas, y te regresan decisiones con probabilidades. Sin prosa, sin tokens de salida que cobrar. ~100 milisegundos por decisión.

La idea es que un agente de IA toma muchas decisiones pequeñas antes de producir una respuesta: ¿enruto esto al usuario o al sistema? ¿reintento o escalo? ¿esta pregunta es sobre facturación o soporte técnico? Pedirle a un modelo grande que genere texto para decidir "sí o no" es como contratar un abogado para prender la luz. Jev hace la parte de decidir, y solo cuando necesitas lenguaje llamas al modelo grande.

Lo probé con el getting started y me gustó la facilidad. Es hosted, es gratis en el beta, no hay setup. Tres días después salió [Laya](https://github.com/convai-innovations/laya) como alternativa open-source: Apache 2.0, 421 millones de parámetros, corre hasta en el browser. La velocidad con la que apareció me sorprendió — Jev ni había salido del beta cerrado.

No probé Laya todavía. Jev me ganó porque me lo dieron listo para usar y no tuve que descargar nada. Pero el contraste es interesante: la misma historia de siempre — cloud managed vs open weights — pero comprimida en una semana. El hype alrededor de Laya es fuerte y la comunidad empuja duro, como siempre pasa cuando algo closed saca un rival open.

Mi siguiente paso sería construir algo chico que muestre la diferencia, un lab de decisiones con BYOK donde puedas comparar Jev, Laya y un modelo grande haciendo la misma tarea. Pero eso ya es otro día.

Lo que me llevo por ahora: hay una nueva capa en los agentes de IA que no es generación de texto. Es juicio estructurado. Y eso se parece mucho a [lo que hice con SheLLM](/blog/shellm-lo-que-aprendi-construyendo-mi-propio-api-wrapper-de-llms) — entender las APIs por dentro te enseña dónde el modelo grande es overkill.
