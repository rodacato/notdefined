---
title: "Agentes, Copilot, Issues, Projects y un nuevo mundo del que no hay vuelta atrás"
date: 2026-01-18
tags: ["ai", "devtools", "workflow"]
---

Sentí una pequeña crisis esta semana. Terminé de aprender a hacer mis propios plugins de Claude — skills, commands, el flujo completo — y cuando salí a ver qué más había, el momento ya se había movido. La tendencia ya no es "cómo personalizo mi asistente de código" sino "cómo le delego un Issue completo a un agente y reviso el PR".

GitHub se convirtió en la plataforma de agentes más práctica que existe porque Issues, Actions y los modelos de IA ya conviven en el mismo lugar. Copilot Agent toma un Issue, planea, hace commits y abre el PR con `@copilot` desde el backlog. Gemini Code Assist y Claude Code funcionan igual, instalables como GitHub Apps desde el Marketplace — los tres corren sobre Actions, así que no hay infraestructura nueva.

Lo que cambió en cómo trabajo: antes escribía mis tickets a medias porque "yo ya sé qué quiero decir" y "ya sé cómo lo pienso resolver". El contexto vivía en mi cabeza, no en el ticket. Ahora el agente ejecuta literal, así que tengo que escribir desde el *por qué*, no desde el *cómo* — si contamino el Issue con mi solución preferida, el agente la implementa aunque no sea la correcta. Cambié de rol: ya no soy quien sabe cómo resolver, soy quien debe saber por qué vale la pena resolverlo. El Issue o task del proyecto debe ser claro y conciso — lo vago produce código que compila pero no es lo que querías.

El salto mental es pasar de "el AI me ayuda a escribir código" a "el AI ejecuta tickets mientras yo escribo los siguientes". La habilidad que se volvió más valiosa no es programar — es especificar bien.
