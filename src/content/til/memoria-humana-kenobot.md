---
title: "El sueño no es descanso — es cuando el cerebro compila la memoria"
date: 2026-03-08
tags: ["ai", "cognitive-science", "kenobot"]
---

Con el hype de OpenClaw me puse a hacer mi propio bot — porque no — y lo primero que quería diseñar bien era la memoria, quería algo que *recuerda de verdad*. Terminé leyendo sobre psicología cognitiva para modelarlo y lo que más me sorprendió no fue técnico.

La memoria humana no es una sola cosa, son cuatro sistemas completamente distintos. La *working memory* es la RAM del cerebro: temporal, volátil, con capacidad de ~7 ítems — por eso los números de teléfono tienen 7 dígitos y las juntas largas te dejan sin poder procesar nada nuevo al final. La *episodic memory* guarda eventos con contexto completo: quién, cuándo, dónde — es lo que se deteriora primero en el Alzheimer. La *semantic memory* son hechos atemporales que ya no sabes cuándo aprendiste: sabes que París es la capital de Francia pero no recuerdas el momento en que lo leíste. Y la *procedural memory* son hábitos y habilidades motoras — alguien con amnesia severa puede no poder formar nuevos recuerdos episódicos y aun así aprender a andar en bici. Son circuitos completamente separados.

Pero el giro que cambió cómo diseñé todo fue descubrir que durante el sueño profundo, el hipocampo *reproduce* los episodios del día y los transfiere a la corteza para almacenamiento a largo plazo. El sueño no es pausa — es el proceso de compilar experiencias en conocimiento. Y el olvido no es falla: es la poda que hace que lo importante permanezca y el ruido desaparezca. Terminé implementando exactamente eso en kenobot: un ciclo de consolidación periódico que analiza episodios recientes, extrae patrones a memoria semántica y poda lo que ya caducó. Lo llamé "ciclo de sueño" — y no fue solo metáfora, fue el modelo de diseño real. [La arquitectura completa está documentada aquí](https://github.com/rodacato/kenobot/blob/master/docs/memory.md).
