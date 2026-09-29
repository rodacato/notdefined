---
name: SheLLM
tagline: Tu suscripción de LLM, como API REST para tus propias apps.
product: >-
  Pagas Claude Code o Codex, pero tus apps no pueden usar esa suscripción: piden
  crédito de API aparte. SheLLM corre el CLI oficial que ya tienes, sin
  modificarlo, detrás de un endpoint HTTP que responde en formato OpenAI y
  Anthropic, así que un SDK oficial apuntado a él funciona a la primera. Un
  dueño y sus propias apps; nada de compartir suscripciones.
technical: >-
  Express sobre Node 24 envolviendo los binarios oficiales de Claude Code y
  Codex: nunca extrae tokens ni se hace pasar por otro cliente. Tope de procesos
  concurrentes, health checks que no gastan cuota, sin reintentos automáticos y
  el fallback entre proveedores apagado por default. SQLite para el estado.
stack:
  - Node.js
  - Express
  - REST API
  - SQLite
  - JavaScript
repo: https://github.com/rodacato/SheLLM
site: https://rodacato.github.io/SheLLM/
order: 3
---
