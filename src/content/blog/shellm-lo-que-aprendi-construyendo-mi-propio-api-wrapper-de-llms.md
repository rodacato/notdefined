---
title: 'SheLLM: lo que aprendí construyendo mi propio API wrapper de LLMs'
description: 'Quería usar mis suscripciones de Claude y Codex sin pagar API aparte para cada prototipo. Terminé construyendo un servicio completo, respetando las APIs oficiales, y descubriendo que construir para mí mismo fue el mejor cambio de mentalidad del año.'
pubDate: 2026-09-05
tags: ['shellm', 'llm', 'api', 'node', 'open-source', 'architecture']
draft: true
---

## TL;DR

- [SheLLM](https://rodacato.github.io/SheLLM/) es un servicio local que expone tus suscripciones de LLMs (Claude, Codex) a través de endpoints compatibles con las APIs oficiales. Self-hosted, personal, sin costo extra por request.
- Empezó como "no quiero pagar doble" y se volvió un proyecto donde aprendí más de APIs de lo que aprendí usándolas.
- El cambio más grande no fue técnico — fue dejar de pensar en qué necesitaría "la gente" y empezar a pensar en qué quiero yo. Eso hizo todo más fácil.

---

Todo se mueve demasiado rápido. Cada semana un modelo nuevo, cada mes un framework nuevo, y si quieres probarlos con proyectos reales —no solo un chat— estás pagando suscripción por un lado y API por otro. Quiero probar Claude, quiero probar Codex, quiero validar ideas rápido, quiero aprender sin que cada request equivocado se sienta como tirar dinero. Eso era el problema.

[SheLLM](https://rodacato.github.io/SheLLM/) empezó como la respuesta obvia: un wrapper que tomara los CLIs oficiales de Claude y Codex y los expusiera como REST. Mismo formato, mismos endpoints, compatible con los SDKs estándar. La idea era simple: ya pagas la suscripción, el request marginal no te cuesta nada.

## De script a proyecto

Eventualmente me pregunté: ¿cuál es la utilidad real? Es para una persona. No quiero evadir las APIs — es para aprendizaje, para experimentar sin la presión del costo. Ahí fue donde dejó de ser un script.

Le puse dashboard con tracking de requests y costos. API keys por aplicación con rate limits y restricciones de modelo. Health tracking de los providers. Un playground para probar requests antes de mandarlos a un proyecto. Streaming, JSON Schema output, inputs de imagen. Respuestas compatibles tanto con el formato de Anthropic como con el de OpenAI.

No suena a "script rápido" porque dejó de serlo hace mucho.

## Los demos que probaron la tesis

Construí dos demos públicos para validar que SheLLM funciona como reemplazo real de las APIs oficiales:

[**Knotty**](https://rodacato.github.io/knotty/) — le mandas fotos de un mueble y te regresa un diseño en triplay. Después puedes ajustarlo hablando con un "carpintero experto". Usa visión, streaming, y conversación multi-turno.

[**AI Town**](https://rodacato.github.io/ai-town/) — veinte aldeanos escuchan una proclamación y cada uno decide qué hacer. Mismo prompt, cualquier modelo. Puedes comparar las decisiones, la latencia, los tokens y el costo entre proveedores. Ese demo desnuda todo: qué tan rápido responde cada modelo, qué tan distinto interpreta el mismo contexto, y cuánto cuesta.

Entre los dos probaron API, compatibilidad, performance, límites. Mi tesis —que se puede usar como reemplazo sin que te cueste nada extra— aguantó. Y de paso aprendí cosas sobre cómo funcionan las APIs internamente que uno da por sentado. Después de meses de construir esto, tengo más respeto y admiración por el trabajo que ponen Anthropic y OpenAI en hacer que sus APIs se sientan smooth. No es trivial.

## Lo que aprendí que no esperaba

El cambio más grande fue de mentalidad. Cuando pensaba en SheLLM como un producto —qué se ocuparía, quién lo usaría, qué features agregar— me paralizaba. Siempre había algo que faltaba, siempre alguien hipotético con un caso de uso que no cubría.

Cuando lo traté como lo que es — OSS, self-hosted, yo como audiencia principal — todo se hizo más fácil. Ya no era "qué se necesitaría". Era "qué quiero, cómo lo quiero". Ese alivio cambió más que cualquier refactor.

Escribí sobre [el cerebro de vibe coder](/til/cerebro-de-vibe-coder) y la ansiedad de delegar demasiado. SheLLM es lo contrario: es el proyecto donde hago todo yo, donde el punto es entender, no solo usar. Y el post sobre [context windows](/blog/llm-context-windows-por-que-tu-feature-de-ia-es-mas-lento-de-lo-que-necesita) fue lo que me hizo empezar a entender las APIs por dentro — SheLLM me obligó a vivirlas.

A mi forma de verlo, en una época donde todos pueden construir lo mismo con AI, lo que queda es ofrecer tu experiencia y una base para que otros comiencen. No un producto cerrado. Una herramienta que resuelve tu propio problema, abierta por si a alguien más le sirve.
