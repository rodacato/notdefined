---
title: 'ui-review: sistematizar el ojo que no tengo'
date: 2026-09-14
tags: ['claude-code', 'skills', 'ui', 'design', 'workflow']
---

Soy backend. Sé cuándo una arquitectura está limpia y cuándo está sucia — veo los dominios, los componentes, las responsabilidades, y puedo decir "esto es mantenible" o "esto es un desastre". Con la UI no tengo ese ojo. Sé que algo se ve raro, pero no puedo nombrarlo.

Construí un skill de Claude Code (`ui-review`) que hace exactamente eso: nombra lo que se ve raro. No hace magia — si tu sitio está mal, sigue estando mal. Pero corre dos pasadas que yo solo jamás haría.

La primera pasada busca lo que está mal: defectos, inconsistencias, cosas que se sienten como "puestas por default". Tiene un concepto que me cambió cómo veo las interfaces: el **transplant test**. Si un elemento se puede pegar en un producto completamente distinto y se ve igual de bien, no es deliberado — es genérico. Es como cuando ves código que podría estar en cualquier repo porque no dice nada sobre el dominio.

La segunda pasada es la que siempre se me olvida: qué falta. Estados que nadie diseñó (vacío, carga, error), jerarquía que podría cargar más, densidad que podría relajarse, pasos que cuestan un click de más.

Lo iteré mucho. Diseñar con LLMs es difícil — son inconsistentes, varían de modelo a modelo, y hay días que Claude parece peor que otros aunque no lo pueda comprobar. Pero un audit no es diseño: es juicio estructurado. Y para eso sí funciona.

Lo he corrido en todos mis proyectos conforme trabajo en ellos. Visualmente se ven más atractivos, menos desperdicio, más intencionales. No me convierte en diseñador — me da un checklist que se parece a lo que yo hago cuando reviso código: ¿es mantenible? ¿es deliberado? ¿qué sobra? ¿qué falta?
