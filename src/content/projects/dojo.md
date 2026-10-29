---
name: Dojo
tagline: El dojo para devs que todavía tienen algo que probarse. A sí mismos.
product: >-
  Práctica self-hosted contra el vibe coding: un kata sorpresa al día, unos
  cinco minutos, sin IA y con el timer corriendo. Un sensei (un LLM con un rol y
  experiencia específicos) te evalúa con feedback honesto, no con la respuesta
  ni con aplausos. Además hospeda scrolls: apps de aprendizaje externas, como
  mis cursos, embebidas en Dojo. No es certificación ni leaderboard: es
  mantenerte técnicamente vivo. Lo corres tú, con tu propia llave de LLM.
technical: >-
  Monorepo pnpm con React 19 + Vite en el front y una API en Hono sobre Node,
  PostgreSQL de datastore. El sensei habla con cualquier endpoint de streaming
  compatible con Anthropic u OpenAI, o con SheLLM sobre tu suscripción. Scrolls
  por iframe con un protocolo postMessage versionado (v0, experimental). Deploy
  con Kamal, calidad con SonarQube y CI en GitHub Actions.
stack:
  - TypeScript
  - React
  - Hono
  - LLM
  - Node.js
  - PostgreSQL
  - Vite
  - pnpm monorepo
repo: https://github.com/rodacato/dojo
site: https://rodacato.github.io/dojo/
accent: '#6366f1'
icon: /projects/icons/dojo.svg
order: 2
posts:
  - /til/cerebro-de-vibe-coder/
---
