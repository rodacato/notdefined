---
title: 'Probé Claude Code Remote desde mi celular y terminé vigilando mi usage'
date: 2026-08-18
tags: ['claude-code', 'remote', 'mobile', 'ai', 'devtools']
---

Siempre fue una limitante con los LLMs: tenías que estar frente a tu compu para aprobar cada paso y revisar lo que hacía. Claude Code mejoró eso, pero seguías atado al escritorio. Cuando descubrí [T3 Code](https://t3.chat/) de Theo, algo hizo click — podía trabajar desde cualquiera de mis máquinas sin fricción, y pensé "quiero esto pero en Claude". Primero llegó el modo auto. Después Remote Connection. Y finalmente la app.

El flujo es simple: abro una sesión en alguno de mis proyectos desde la compu, la conecto remotamente, y sigo desde el celular. La compu hace el trabajo pesado, el cel es el control remoto. La primera vez que lo probé construí un demo completo tirado en el sillón.

Lo gracioso fue el código. La conversación empezó en español —le explicaba la idea, le daba dirección, qué sí quería, qué no— y Claude siguió el idioma. El sitio salió en español, lo cual no me importó, es un demo. Pero cuando abrí los archivos para entender qué había hecho... variables con ñ, condiciones que se leían como spanglish. `if mi_texto`. `const título_principal`. Me dio risa y lo dejé — nunca había visto código así.

La lección ahí fue que necesitas un `CLAUDE.md` desde el inicio, con reglas claras. Código en inglés. Nada de push forzado ni borrar archivos. Sin eso, el modelo asume cosas por ti. Ahora todos mis proyectos tienen uno y Remote se siente como mi escritorio, nada más que en el bolsillo.

Tiene sus limitantes. No puedo guardar archivos de Pencil, no puedo ejecutar ciertos comandos por las restricciones que yo mismo le puse, y las sesiones se mueven de orden así que tengo que nombrarlas para encontrarlas. Pero funciona. Y funciona lo suficiente como para que mi problema hoy sea otro: antes no checaba mi usage, ahora lo reviso como reviso el clima. El cuello de botella ya no es dónde estoy — es si me van a alcanzar mis tokens.

Escribí hace poco sobre el [cerebro de vibe coder](/til/cerebro-de-vibe-coder) y la ansiedad de delegar demasiado. Esto es la otra cara: hay cosas que vale la pena delegar, y poder hacerlo desde donde sea amplifica lo bueno y lo malo. El truco es tener las reglas puestas antes de abrir la sesión.
