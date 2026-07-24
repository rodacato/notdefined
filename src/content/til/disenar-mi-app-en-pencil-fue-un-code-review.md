---
title: 'Diseñar mi app en Pencil terminó siendo el mejor code review que le he hecho'
date: 2026-07-17
tags: ['design', 'pencil', 'workflow']
---

Me puse a diseñar Mi Feria en Pencil, dentro de VS Code, con una sola regla: cada pantalla tenía que ser espejo 1:1 del código. Nada de mockups bonitos que luego no coinciden — los tokens salen del config real, los textos existen en el código o no van, y la lista de pantallas sale del router, no de mi imaginación.

Pensé que iba a hacer diseño. Terminé haciendo un audit.

El problema es que cuando el diseño no puede pintar un valor que el código no tiene, ni inventar un texto que la app no manda, las inconsistencias se destapan solas: el creep de tokens, las fonts de más que deberían ser un par, los flujos que simplemente no cierran. Todo eso que sientes como "algo está raro" pero nunca alcanzas a nombrar — de repente lo tienes enfrente, con nombre y número.

Y no era solo deuda visual, salieron bugs reales. Uno que me dejó viendo al techo: el indicador de progreso del onboarding mostraba 4 pasos cuando en realidad son 5. Se saltaba uno, y no lo había cachado.

Lo cansado del proceso: la extensión solo actúa confiable sobre el tab activo, así que hay que hacerle un poco de babysit al LLM para que no escriba en el archivo equivocado. Molesto. Pero al mismo tiempo, ver tu app tomar forma visualmente, con todos sus estados uno por uno... woow. No le encuentro otra palabra.

Lo que cambió en cómo trabajo: ahora el diseño es el spec. Lo siguiente no es ajustar el diseño al código — es al revés. Con lo que encontré voy a reorganizar, eliminar y cambiar código para que sea fiel y coherente. El audit ya me dejó la lista.

Dejé el método completo —el README, las plantillas y el registro de decisiones numeradas— en [un gist](https://gist.github.com/rodacato/e430b1c5eb03fdd09e2c7e9f50c939cf), por si quieres aplicarlo a tu proyecto (con Claude, Codex, o a mano; el README está escrito para que lo siga un humano o cualquier LLM).
