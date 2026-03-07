---
title: "LLM context windows: por qué tu feature de IA es más lento de lo que necesita ser"
description: "El tamaño del contexto afecta directamente latencia y costo. Cómo medir qué estás enviando realmente, cuándo chunking vs summarization vs retrieval, y por qué streaming cambia el UX aunque el tiempo total sea el mismo."
pubDate: 2025-08-05
tags: ["ai", "llm", "backend", "performance"]
draft: false
---

## TL;DR

- El **contexto que envías al LLM** determina latencia y costo — más tokens = más lento y más caro
- **Mide** qué estás enviando antes de optimizar — muchos devs no saben cuántos tokens consume su system prompt
- **Chunking** cuando el documento es grande y la pregunta es local; **summarization** cuando necesitas el hilo completo; **retrieval (RAG)** cuando tienes muchos documentos
- **Streaming** no reduce el tiempo total, pero cambia radicalmente cómo se siente para el usuario
- El token counting no requiere llamar al API — hazlo localmente con `tiktoken` o equivalente

---

## El problema que nadie mide (hasta que la factura llega)

Construyes una feature con un LLM. Funciona. Pero es lenta. El API tarda 8 segundos en responder, el costo por request es más alto de lo que calculaste, y no sabes exactamente por qué.

La primera cosa que deberías revisar — y que la mayoría no hace — es **¿cuántos tokens estás enviando?** No cuántos tokens *crees* que envías. Cuántos envías de verdad.

```javascript
import { encoding_for_model } from 'tiktoken';

const enc = encoding_for_model('gpt-4o');

function countTokens(messages) {
  let total = 0;
  for (const msg of messages) {
    total += 4; // overhead por mensaje
    total += enc.encode(msg.content).length;
  }
  total += 2; // overhead del reply
  return total;
}

// Antes de cada llamada al API:
const tokens = countTokens(messages);
console.log(`Enviando ${tokens} tokens al API`);
// => Enviando 12847 tokens al API  ← ¿sabías que era tanto?
```

La correlación entre tokens y latencia no es lineal — modelos como GPT-4o tienen latencia de prefill que escala con el contexto de entrada. 12,000 tokens de input puede ser 3-4x más lento que 2,000 tokens, aunque el output sea el mismo.

## Qué está engordando tu contexto sin que te des cuenta

### El system prompt que creció sin que nadie lo notara

Es fácil ir agregando instrucciones al system prompt hasta que tiene 3,000 tokens cuando podría tener 500. Cada semana alguien agrega "y asegúrate de..." al prompt, y nadie cuenta cuánto cuesta eso:

```javascript
// System prompt típico que fue creciendo
const systemPrompt = `
Eres un asistente de soporte para TechCorp. Ayudas a los usuarios con preguntas sobre nuestros productos.
Siempre sé amable y profesional. No menciones a competidores. Si no sabes algo, dilo honestamente.
Nuestros productos son: ProductoA (descripción larga...), ProductoB (descripción larga...),
ProductoC (descripción larga...). Precios: ProductoA cuesta $49/mes, $99/mes plan pro...
Política de reembolsos: Los clientes tienen 30 días para solicitar reembolso...
[800 tokens más de contexto que el modelo no necesita para la mayoría de preguntas]
`;
```

La solución: separa el contexto estático del dinámico. El system prompt base debería ser corto y genérico. El contexto específico de la conversación (productos relevantes, política aplicable) se inyecta dinámicamente según la pregunta:

```javascript
const baseSystemPrompt = `
Eres un asistente de soporte para TechCorp. Responde en español, sé directo y honesto.
Si no tienes información suficiente, dilo.
`; // ~30 tokens

// Se agrega dinámicamente según el contexto detectado
const relevantContext = await retrieveRelevantDocs(userMessage);

const messages = [
  { role: 'system', content: baseSystemPrompt + relevantContext },
  ...conversationHistory,
  { role: 'user', content: userMessage },
];
```

### El historial de conversación completo

Incluir toda la conversación en cada request es el patrón más común de context inflation:

```javascript
// MAL — envía toda la conversación siempre
const messages = [
  systemMessage,
  ...allConversationHistory,  // puede ser 50+ turnos
  { role: 'user', content: newMessage }
];

// MEJOR — ventana deslizante con resumen
const MAX_HISTORY_TOKENS = 2000;

function trimHistory(history, maxTokens) {
  const recent = [];
  let tokens = 0;

  for (const msg of [...history].reverse()) {
    const msgTokens = countTokens([msg]);
    if (tokens + msgTokens > maxTokens) break;
    recent.unshift(msg);
    tokens += msgTokens;
  }

  return recent;
}

const trimmedHistory = trimHistory(conversationHistory, MAX_HISTORY_TOKENS);
```

Para conversaciones largas, considera summarization: cuando el historial supera N tokens, llama al LLM para que resuma los primeros M turnos y reemplaza esos turnos por el resumen.

## Cuándo usar qué estrategia

### Chunking

Para documentos grandes donde la pregunta probablemente se responde en una sección específica:

```javascript
function chunkDocument(text, chunkSize = 500, overlap = 50) {
  const words = text.split(' ');
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  return chunks;
}

// Úsalo cuando el documento tiene >4000 tokens y la pregunta es específica
// "¿Cuál es la política de devoluciones?" → busca en chunks relevantes
```

### Summarization

Cuando necesitas el hilo completo pero reducido:

```javascript
async function summarizeConversation(history) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',  // modelo barato para la tarea auxiliar
    messages: [
      {
        role: 'system',
        content: 'Resume esta conversación en 3-5 puntos clave. Preserva los detalles técnicos importantes.',
      },
      {
        role: 'user',
        content: history.map(m => `${m.role}: ${m.content}`).join('\n'),
      },
    ],
    max_tokens: 300,
  });

  return response.choices[0].message.content;
}
```

### RAG (Retrieval-Augmented Generation)

Cuando tienes muchos documentos y necesitas encontrar los relevantes:

```javascript
// 1. Embed la pregunta del usuario
const queryEmbedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: userQuestion,
});

// 2. Busca documentos similares en tu vector store
const relevantDocs = await vectorDB.similaritySearch(
  queryEmbedding.data[0].embedding,
  { topK: 3, threshold: 0.75 }
);

// 3. Solo inyecta los documentos relevantes
const context = relevantDocs.map(d => d.content).join('\n\n');
const messages = [
  { role: 'system', content: `Responde basándote en este contexto:\n${context}` },
  { role: 'user', content: userQuestion },
];
```

## Streaming: no hace la respuesta más rápida, la hace más usable

Una aclaración que vale la pena hacer: **streaming no reduce el tiempo total de la respuesta**. El LLM tarda lo mismo en generar todos los tokens. La diferencia es cuándo el usuario ve el primer token.

```
Sin streaming:  [=====8 segundos de espera=====] [respuesta completa aparece]
Con streaming:  [~1s] [texto aparece...gradualmente...mientras se genera...]
```

Para el usuario, la segunda experiencia se siente 8x más rápida aunque el tiempo total sea igual.

```javascript
// Streaming con la SDK de OpenAI
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages,
  stream: true,
});

// En un endpoint HTTP de Node.js
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content || '';
  if (delta) {
    res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
  }
}

res.write('data: [DONE]\n\n');
res.end();
```

La regla: si tu respuesta puede tardar más de 2 segundos en completarse, implementa streaming. La inversión de tiempo es pequeña y el impacto en UX es enorme.

## Tabla de estrategias por caso de uso

| Escenario | Estrategia | Tokens ahorrados |
|-----------|-----------|-----------------|
| Sistema de soporte con base de conocimiento | RAG | 80-90% |
| Chat con historial largo | Sliding window + summarization | 50-70% |
| Análisis de documento grande | Chunking | 60-90% |
| System prompt inflado | Refactor + context dinámico | 30-60% |
| Respuesta que tarda >2s | Streaming (UX, no tokens) | 0% (percepción) |

---

La optimización de contexto en LLMs es como la optimización de queries SQL: no la necesitas hasta que la necesitas, y cuando la necesitas, es urgente. Mide primero con `tiktoken` antes de optimizar. Muchas veces el 80% del problema está en el system prompt gordo o en el historial completo que nadie recortó.

Honestamente, me pasó construyendo SheLLM: el system prompt había crecido a 4,000 tokens sin que me diera cuenta. Con 800 tokens bien escritos hacía lo mismo. Mide antes de asumir que necesitas un modelo más barato.
