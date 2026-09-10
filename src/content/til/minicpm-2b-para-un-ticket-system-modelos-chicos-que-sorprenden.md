---
title: 'MiniCPM 2B para un ticket system: modelos chicos que sorprenden'
date: 2026-09-10
tags: ['llm', 'small-models', 'minicpm', 'openrouter', 'ai']
---

En el trabajo queremos un ticket system asistido por LLM. La idea es simple: el usuario describe su problema, el modelo intenta orientarlo con la documentación que ya tenemos, y si no puede ayudar, escala a un humano. No necesita generar código ni razonar sobre cosas complejas — necesita buscar en un centro de ayuda y dar una respuesta corta que apunte en la dirección correcta.

Probamos con MiniCPM 5 de 2B parámetros (`maternion/minicpm5:2b`). Le cargamos nuestro centro de ayuda real como knowledge base y lo dejamos responder. Lo primero que hice fue correrlo local con LM Studio para iterar el prompt rápido.

La sorpresa: respondía bien. No perfecto, el prompt necesitó refinamiento, pero las respuestas no estaban fuera de contexto. Eran útiles, como un buscador con esteroides al estilo de cómo funciona Google hoy: te regresa una respuesta corta, educativa, que te orienta sin cerrarte la puerta de hablar con alguien. Para un 2B eso me impresionó.

El tema del costo fue lo que me remató. Correrlo local con LM Studio funciona para prototipar, pero llevarlo a producción en AWS se complica rápido y los beneficios se acaban. La opción que tiene más sentido es OpenRouter: modelos chicos que gastan poco, sin configuración de infra, y hasta que el consumo justifique algo custom no tiene rival. Con $10 USD he probado bastante y no me he gastado ni la mitad.

Lo que me llevo de esto: no todo necesita Opus ni GPT-4. Para tareas acotadas con contexto definido —buscar en docs, clasificar, dar una primera respuesta— los modelos de 2B son sorprendentemente capaces. Escribí antes sobre [context windows y por qué tu feature de IA es lento](/blog/llm-context-windows-por-que-tu-feature-de-ia-es-mas-lento-de-lo-que-necesita).
