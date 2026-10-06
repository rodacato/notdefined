---
title: 'SheLLM: lo que aprendí construyendo mi propio API wrapper de LLMs'
description: 'Con 10 USD al mes de API me quedaba sin tokens antes de terminar el mes, y la idea se enfriaba en la espera. Construí SheLLM para usar mis suscripciones de Claude y Codex como una API normal. Exponerlas fue lo fácil. Lo caro fue la latencia: hoy la mediana es de 13 segundos y una de cada veinte pasa de 86.'
pubDate: 2026-09-05
tags: ['shellm', 'llm', 'api', 'node', 'open-source', 'architecture']
draft: false
---

## TL;DR

- [SheLLM](https://rodacato.github.io/SheLLM/) corre los CLIs oficiales de Claude y Codex detrás de endpoints con el formato de OpenAI y de Anthropic. Un SDK oficial apuntado a él funciona.
- La API es el mesero y el CLI es la cocina. Pasarle el pedido a la cocina parecía trivial. Al principio tardaba unos 2 minutos y daba timeouts. Hoy la mediana es de 12.9 segundos.
- Lo que acortó el tiempo fue quitarle al CLI todo lo que carga por defecto. El streaming no acelera nada, pero con respuestas de más de 60 segundos dejó de ser opcional: el primer token llega en 5.5 s de mediana, contra 12.9 s de la respuesta completa.
- No es más rápido que la API oficial ni pretende serlo. Sirve para probar y tener control antes de pagar esos requests.

---

Tenía un presupuesto de 10 USD al mes en API. Para estirarlo usaba el modelo más básico, y aun así se me acababan antes de fin de mes. Lo que sigue después de eso es esperar, y muchas veces cuando volvía ya había perdido la idea o las ganas. Me quedaba la cabeza llena de cosas a medio probar, y eso me costaba más que los tokens.

La suscripción ya la pagas, y con una de 20 USD alcanza de sobra para explorar. Si encima cada prueba rápida cuesta 1 o 2 USD, hacer proyectos de casa deja de tener sentido. Exploras menos y aprendes menos.

Existen servicios como OpenRouter, que te dan una sola API para varios modelos. Los descarté en su mayoría porque no soportan usar mi suscripción. No los comparo con SheLLM: el modelo de uso es distinto. Wrappers de CLI completos no encontré ninguno que me diera lo que quería, así que hice el mío, como OSS.

## La cocina es lenta

La API es el mesero: le pides algo, te responde. El CLI es la cocina completa, con todo lo que trae. Yo pensé que sería pasarle el pedido a la cocina y ya. Pero la cocina carga sus herramientas, sus skills, sus hooks y el contexto del directorio donde la abras, y no tiene lo que una API sí.

Al inicio me desesperé. Un request tardaba unos 2 minutos, y los timeouts y las fallas eran más comunes que ahora. No medí el "antes", lo recuerdo así.

Lo que sirvió fue quitarle a la cocina todo lo que no era cocinar. Este es el comando base de Claude, y cada flag tiene una razón:

```bash
claude --print --tools "" --disable-slash-commands --strict-mcp-config \
  --settings '{"disableAllHooks":true}' --permission-mode dontAsk
```

`--tools ""` fue la decisión principal: un workdir vacío no tiene nada que leer, y creo que las definiciones de las herramientas eran lo que más latencia agregaba. No lo medí flag por flag. `--strict-mcp-config` ignora los MCP servers de mi máquina, que es código que nadie revisó. `--permission-mode dontAsk` evita que se quede esperando una aprobación que nadie va a dar. Cada request corre además en un directorio temporal vacío: si no, el CLI carga el `CLAUDE.md` del repo y podría leer un `.env`.

Con Codex es parecido: `codex exec --ephemeral -s read-only --json`, sandbox de solo lectura y sin guardar sesión. Dos cosas me mordieron ahí. Sin `-m` explícito cae al modelo de su `config.toml`, y la cuenta de ChatGPT responde "model is not supported". Y tuve que ponerle un mutex de concurrencia 1: dos procesos a la vez compiten por el refresh de OAuth y lo corrompen ([openai/codex#17340](https://github.com/openai/codex/issues/17340)).

## Lo que dice el dashboard

Estos son los números de SheLLM hoy, con `claude` 2.1.278 y `codex` 0.154.0. El historial que lleva es nuevo: unos 2,000 requests, casi todos de Claude Sonnet 5, que es el que uso en Knotty ahora que trabajo en ese proyecto.

| Métrica               | Valor   |
| --------------------- | ------- |
| Mediana               | 12.9 s  |
| P95                   | 86.2 s  |
| P99                   | 143.9 s |
| Primer token, mediana | 5.5 s   |

La mediana es de 13 segundos, pero una de cada veinte pasa de 86, y el P99 de 144 s es casi mis 2 minutos de antes: esos no han desaparecido, solo son raros. Por modelo cambia mucho: Sonnet 5 promedia 24.3 s, Haiku entre 4 y 13 s, y Codex unos 7 s. Usé prompts cortos, y aun así, según el modelo, pasar de 60 segundos es posible.

El dashboard también separa la cola de la ejecución, y en el P95 la cola es de 0 ms. Los 86 segundos son del CLI, no de mi wrapper, y no hay fila de espera de por medio.

Por eso streaming no era opcional. No acelera nada, pero un cliente que espera la respuesta completa se queda mirando una pantalla en blanco. Con streaming va viendo el texto conforme llega, y con la cola que tengo eso cambia todo.

Lo que se sintió como un cambio fue poder usarlo desde el otro lado como un cliente normal, igual que si usara OpenAI o Anthropic. Quitó una traba de mi lado. Quizá era mental, pero me motivó mucho. Terminé usándolo para explorar ideas en proyectos que ya tenía: Stockerly, Dojo y Drawhaus.

En la última semana el dashboard marca 855 requests y 18 millones de tokens, con 37 USD de costo que reportan los propios CLIs. Es un costo nocional, lo que habría pagado en API: yo pago la suscripción.

## Lo que no es

Es un sustituto para pruebas y uso personal. Me apegué a lo que ofrecen sus CLIs, sin hacks, y no ofrezco nada comercialmente: un dueño y sus propias apps. Las políticas y los CLIs cambian, así que esto es lo que me funciona con las versiones de arriba. Si vas a hacer algo parecido, lee los términos vigentes de tu proveedor antes de copiarme.

## De script a proyecto

Cuando me pregunté para qué servía en realidad, la respuesta fue para una sola persona, y ahí dejó de ser un script. Le agregué el dashboard de arriba y API keys por aplicación con rate limits. Después fue sumando lo que necesitaba: JSON Schema e imágenes.

Para ver si aguantaba construí dos demos. [Knotty](https://rodacato.github.io/knotty/) recibe fotos de un mueble y te regresa un diseño en triplay, que luego ajustas hablando con un carpintero experto. [AI Town](https://rodacato.github.io/ai-town/) pone veinte aldeanos a escuchar una proclamación, cada uno decide qué hacer, y puedes comparar modelos por decisión, latencia y costo.

## Lo que me cambió

Cuando pensaba en SheLLM como producto, qué se ocuparía, quién lo usaría, qué features agregar, me paralizaba. Siempre faltaba algo, siempre había alguien hipotético con un caso que no cubría.

Cuando lo traté como lo que es, OSS, self-hosted y yo como audiencia principal, todo se hizo más fácil. Ya no era "qué se necesitaría". Era "qué quiero y cómo lo quiero". Ese alivio cambió más que cualquier refactor.

Si algo me dejó es esto: no le tengas miedo al costo de experimentar. Si ya pagas suscripciones, úsalas. SheLLM me da la opción de explorar, y lo que vale la pena después sí lo pago.

Escribí sobre [el cerebro de vibe coder](/til/cerebro-de-vibe-coder) y la ansiedad de delegar demasiado. Con SheLLM hice casi todo yo, a propósito, porque quería entenderlo. El post sobre [context windows](/blog/llm-context-windows-por-que-tu-feature-de-ia-es-mas-lento-de-lo-que-necesita) me empezó a explicar las APIs por dentro, y construir esto me obligó a vivirlas.

## Lo que sigue

Soportar OpenRouter y modelos locales desde la misma interfaz de SheLLM. Otra vez por motivos personales: aprender y experimentar. El código está abierto por si a alguien más le sirve.
