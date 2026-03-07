---
title: "DeepSeek R1 y lo que el momento open-source en LLMs realmente significa"
description: "DeepSeek R1 llegó el 20 de enero de 2025 y rompió el supuesto de que los modelos de razonamiento frontier requieren clusters de $100M. Qué cambió, qué no, y qué significa para developers."
pubDate: 2025-03-04
tags: ["ai", "llm", "open-source"]
draft: false
---

## TL;DR

- **DeepSeek R1** es un modelo de razonamiento open-source (MIT license) competitivo con o1 de OpenAI
- Fue entrenado con **reinforcement learning puro** — sin RLHF convencional — lo cual es el avance real
- La **licencia MIT** significa que puedes hacer self-hosting, fine-tuning, y usarlo en producción sin restricciones
- Los tradeoffs vs modelos de API: **latencia más alta**, necesitas infraestructura, y el contexto en auto-hosting es limitado
- Para developers building on LLMs: más leverage, más decisiones, y la brecha entre "modelo poderoso" y "producto" se acortó

---

## Qué es DeepSeek R1 y por qué importa

El 20 de enero de 2025, DeepSeek — un laboratorio chino relativamente nuevo — lanzó R1 con licencia MIT. En las siguientes 24 horas, el modelo llegó al #1 en la App Store de Estados Unidos y el precio de las acciones de NVIDIA cayó 17%.

Dramático. Mi Twitter/X ese día fue básicamente: "el fin de OpenAI", "el fin de NVIDIA", "el fin de Occidente" — elige tu narrativa favorita. Pero lo importante para los que construimos software no es el drama financiero de un día ni los takes calientes de LinkedIn. Es qué significa técnicamente.

R1 es un **modelo de razonamiento**. A diferencia de los LLMs convencionales que responden directamente, los modelos de razonamiento "piensan en voz alta" antes de dar una respuesta. El modelo escribe un proceso de chain-of-thought interno, lo evalúa, y da una respuesta más precisa. O1 de OpenAI hace lo mismo.

La diferencia: OpenAI no te dice cómo entrenaron o1. DeepSeek publicó el paper completo.

## El avance técnico real: RL sin RLHF

La mayoría de los LLMs se entrenan con RLHF (Reinforcement Learning from Human Feedback): humanos califican respuestas, esas calificaciones entrenan un modelo de recompensa, y ese modelo guía el entrenamiento. Caro, lento, y difícil de escalar.

DeepSeek R1 usa **Group Relative Policy Optimization (GRPO)** — RL puro donde el modelo aprende a razonar comparando sus propias respuestas entre sí. No necesita humanos calificando respuestas. La señal de recompensa viene de verificar si la respuesta final es correcta (en matemáticas y código, esto es automáticamente verificable).

El resultado: un modelo de razonamiento frontier entrenado con una fracción del costo. DeepSeek reportó costos de entrenamiento de ~$5.6M vs estimados de $100M+ para GPT-4. Los números exactos son debatibles, pero el orden de magnitud es real.

¿Confundido? Imagínalo así: antes necesitabas un ejército de anotadores humanos para enseñarle a un modelo a razonar mejor. DeepSeek encontró una forma de que el modelo se enseñe a sí mismo, usando matemáticas como juez.

## MIT license: lo que realmente cambia

Modelos anteriores de código "abierto" como LLaMA tienen restricciones — no puedes usarlos comercialmente a cierta escala, no puedes hacer ciertas cosas con los pesos. MIT no tiene restricciones. Punto.

Puedes:
- **Hacer self-hosting** en tu propia infraestructura
- **Fine-tunear** los pesos para tu dominio específico
- **Distribuir** aplicaciones basadas en él sin licencias especiales
- **Usarlo en producción** sin royalties ni restricciones de uso

La versión completa (R1 671B) necesita infraestructura seria — múltiples GPUs A100/H100. Pero las versiones destiladas son más accesibles:

| Modelo | Parámetros | VRAM aprox | Dónde correrlo |
|--------|-----------|------------|----------------|
| R1-Distill-Qwen-7B | 7B | ~8GB | Laptop con GPU |
| R1-Distill-Qwen-14B | 14B | ~16GB | RTX 4090 o similar |
| R1-Distill-Qwen-32B | 32B | ~40GB | A6000 o similar |
| R1 full | 671B | ~800GB | Cluster completo |
| R1 via API | — | — | platform.deepseek.com |

## Tradeoffs reales vs los APIs de siempre

Antes de que te emociones demasiado con el self-hosting, acá están las cosas que nadie te cuenta en Twitter:

**Latencia.** Los modelos de razonamiento son lentos por naturaleza — generan tokens de "pensamiento" antes de la respuesta. En la API de OpenAI, o1 puede tardar 30–60 segundos en respuestas complejas. Self-hosting R1 en hardware no optimizado puede ser peor.

**Infraestructura.** Correr el modelo completo requiere expertise en MLOps, no solo `ollama pull deepseek-r1`. Para las versiones pequeñas destiladas, Ollama sí funciona bien.

**Ventana de contexto.** La API de DeepSeek ofrece 128K tokens de contexto. En self-hosting con hardware limitado, el contexto efectivo baja dramáticamente.

**El "thinking" es verbose.** R1 expone su chain-of-thought. Eso es útil para debugging, pero en producción necesitas filtrar ese output antes de mostrárselo al usuario.

## Lo que significa para developers building on LLMs

Antes de R1, si querías capacidades de razonamiento serias (código complejo, matemáticas, lógica multi-paso), dependías de o1 o de Gemini 2.0 Flash Thinking — ambas APIs propietarias con sus propias limitaciones de pricing y rate limits.

Ahora tienes opciones reales:

**Opción 1: API de DeepSeek.** Más barato que OpenAI para tokens de input/output, misma facilidad de uso. Compatible con el SDK de OpenAI (drop-in replacement en muchos casos).

**Opción 2: Self-hosting con Ollama.** Para versiones destiladas medianas (7B, 14B), puedes correr localmente o en un VPS. Cero costo por token, cero privacidad concerns si los datos son sensibles.

**Opción 3: Proveedores de inference.** Groq, Fireworks, Together AI ya ofrecen R1 con inference optimizada. Mejor latencia que self-hosting básico, sin el drama de la infraestructura.

```javascript
// API de DeepSeek — compatible con el SDK de OpenAI
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const response = await client.chat.completions.create({
  model: 'deepseek-reasoner', // R1
  messages: [{ role: 'user', content: 'Explica el problema del vendedor viajero' }],
});

// El campo `reasoning_content` tiene el chain-of-thought
console.log(response.choices[0].message.reasoning_content);
// => "Vamos a analizar el problema paso a paso..."

console.log(response.choices[0].message.content);
// => La respuesta final
```

## ¿Es el fin de OpenAI?

No. Pero es el fin del monopolio de facto.

Lo que cambió: ya no hay un solo actor que defina qué es un "modelo frontier". Meta (LLaMA), DeepSeek (R1), Mistral, y otros están compitiendo en capacidades reales, no solo en benchmarks de marketing. Eso fuerza a OpenAI, Google y Anthropic a ser más competitivos en precio y a ser más transparentes sobre sus modelos.

Para nosotros como developers, el resultado es más leverage: más opciones, mejores precios, y la posibilidad real de no depender de un proveedor único. La decisión de qué modelo usar ahora tiene dimensiones que antes no existían — privacidad de datos, latencia, costo, capacidades específicas.

---

El momento open-source en LLMs no significa que todos vamos a correr modelos localmente en nuestras laptops. Significa que las APIs propietarias ya no son la única forma de acceder a capacidades frontier, y que la decisión de "qué modelo uso" ahora tiene dimensiones reales: privacidad de datos, costo, latencia, y vendor lock-in.

Eso, honestamente, es lo que hacía falta. Más opciones, más decisiones, y el fin del monopolio de facto. Bienvenido a la competencia real en LLMs.
