---
name: Drawhaus
tagline: Tu pizarrón, en tu servidor.
product: >-
  Alternativa self-hosted a Excalidraw para devs y equipos chicos que quieren
  control total de su herramienta de diagramación. Colaboración en tiempo real,
  el editor completo de Excalidraw, sin suscripción de $6 al mes — lo deployeas
  en tu servidor y tus datos son tuyos. Trae API REST, un servidor MCP para que
  herramientas de IA creen y editen diagramas, y diagramas como código desde
  Mermaid.
technical: >-
  Monorepo con frontend React + Vite montado sobre Excalidraw y backend Express
  en Node, PostgreSQL para persistencia. Colaboración en vivo con Socket.IO,
  escalable entre contenedores vía Redis. El MCP vive en su propio paquete
  (`@rodacato/drawhaus-mcp`). Deploy con Kamal detrás de Cloudflare Tunnel,
  calidad con SonarQube por workspace y suite e2e.
stack:
  - TypeScript
  - React
  - WebSockets
  - Kamal
  - Express
  - Node.js
  - PostgreSQL
  - Excalidraw
repo: https://github.com/rodacato/drawhaus
accent: '#3b82f6'
icon: /projects/icons/drawhaus.svg
image: /projects/shots/drawhaus.webp
order: 5
---
