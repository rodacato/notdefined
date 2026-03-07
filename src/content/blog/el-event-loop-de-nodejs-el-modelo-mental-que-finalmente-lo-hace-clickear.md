---
title: "El event loop de Node.js: el modelo mental que finalmente lo hace clickear"
description: "La mayoría de explicaciones del event loop son demasiado abstractas o demasiado de bajo nivel. Esta es la versión que conecta con problemas reales: por qué setTimeout(fn, 0) no es 0ms, qué es la microtask queue, y por qué el código síncrono bloquea todo."
pubDate: 2025-06-17
tags: ["javascript", "nodejs", "performance"]
draft: false
---

## TL;DR

- Node.js es **single-threaded** — solo puede hacer una cosa a la vez, aunque parezca concurrente
- El **event loop** es el mecanismo que procesa callbacks cuando la operación asíncrona termina
- **Microtask queue** (Promises, `queueMicrotask`) se vacía **completamente** antes de pasar al siguiente tick
- **Macrotask queue** (setTimeout, setInterval, I/O) procesa **un item** por tick
- `process.nextTick` corre **antes** de las Promises — y puede bloquear el event loop si abusas
- **Código síncrono pesado** bloquea TODO — incluyendo otros requests en tu servidor HTTP

---

## Node.js no es mágicamente concurrente — es un chef muy organizado

Antes de entrar al event loop, hay que desmitificar algo: Node.js no corre tu código en paralelo. Es un solo hilo de ejecución. Lo que hace *parecer* que maneja múltiples cosas a la vez es que **delega las operaciones lentas** (I/O, timers, network) al sistema operativo o a un thread pool (libuv), y mientras espera, puede procesar otras cosas.

Imagínalo como un chef que tiene varios pedidos. No puede cocinar dos platos al mismo tiempo, pero sí puede poner un guiso a fuego lento, ir a preparar una ensalada, volver a revisar el guiso, atender la barra. El chef es single-threaded. La cocina tiene múltiples operaciones en progreso.

¿Y qué pasa si el chef se pone a partir cebolla durante 2 segundos sin parar? Exactamente — todo lo demás espera. Ese es el código síncrono bloqueante, y es el problema más común en Node.js.

## Las fases del event loop

El event loop tiene fases bien definidas que ejecuta en orden:

```
   ┌─────────────────────────────┐
┌─>│         timers              │  setTimeout, setInterval callbacks
│  └──────────────┬──────────────┘
│  ┌──────────────┴──────────────┐
│  │     pending callbacks       │  I/O errors del tick anterior
│  └──────────────┬──────────────┘
│  ┌──────────────┴──────────────┐
│  │       idle, prepare         │  uso interno de Node.js
│  └──────────────┬──────────────┘
│  ┌──────────────┴──────────────┐
│  │           poll              │  espera I/O nuevo, ejecuta callbacks
│  └──────────────┬──────────────┘
│  ┌──────────────┴──────────────┐
│  │          check              │  setImmediate callbacks
│  └──────────────┬──────────────┘
│  ┌──────────────┴──────────────┐
└──┤      close callbacks        │  socket.on('close', ...)
   └─────────────────────────────┘

Entre cada fase: se vacía la microtask queue (nextTick + Promises)
```

Lo más importante: **entre cada fase**, Node.js vacía completamente la microtask queue antes de continuar.

## Por qué `setTimeout(fn, 0)` no es 0ms

```javascript
console.log('1 - inicio');

setTimeout(() => {
  console.log('3 - setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('2 - Promise');
});

console.log('4 - fin del código síncrono');

// Output:
// 1 - inicio
// 4 - fin del código síncrono
// 2 - Promise        ← microtask, va antes que setTimeout
// 3 - setTimeout     ← macrotask, espera al siguiente tick
```

¿Por qué? El flujo es:
1. Se ejecuta el código síncrono completo (líneas 1 y 4)
2. Antes de pasar a la fase de timers, se vacía la microtask queue → corre el `.then()`
3. Ahora sí llega a la fase de timers → corre el `setTimeout`

El delay mínimo real de `setTimeout(fn, 0)` es aproximadamente 1ms en Node.js (4ms en browsers). Pero más importante: siempre corre después de todas las Promises pendientes.

## Microtask queue vs macrotask queue

Las dos queues se comportan diferente:

```javascript
// Microtasks (Promises, queueMicrotask) — se vacían COMPLETAMENTE antes de continuar
Promise.resolve()
  .then(() => {
    console.log('microtask 1');
    // Agregar otra microtask desde dentro de una microtask...
    return Promise.resolve();
  })
  .then(() => console.log('microtask 2'))
  .then(() => console.log('microtask 3'));

// Macrotasks (setTimeout) — solo UNO por vuelta del event loop
setTimeout(() => console.log('macrotask 1'), 0);
setTimeout(() => console.log('macrotask 2'), 0);

// Output:
// microtask 1
// microtask 2
// microtask 3
// macrotask 1
// macrotask 2  ← este tiene que esperar al siguiente tick
```

Esto tiene implicaciones reales: si tienes una cadena larga de Promises, puede bloquear que los timers corran. En la práctica no es un problema frecuente, pero explica comportamientos confusos en código async complejo.

## `process.nextTick` vs `setImmediate` vs `Promise`

```javascript
setImmediate(() => console.log('setImmediate'));
setTimeout(() => console.log('setTimeout 0'), 0);
Promise.resolve().then(() => console.log('Promise'));
process.nextTick(() => console.log('nextTick'));

// Output:
// nextTick      ← primero — antes que Promises
// Promise       ← segundo — microtask
// setTimeout 0  ← tercero o cuarto (depende del timing del sistema)
// setImmediate  ← tercero o cuarto (fase check, después de poll)
```

El orden de prioridad:
1. `process.nextTick` — corre antes de cualquier otra cosa en la microtask queue
2. Promises (`.then`, `async/await`) — microtask queue normal
3. `setImmediate` — fase check del event loop (después de I/O callbacks)
4. `setTimeout(fn, 0)` — fase timers (el orden vs `setImmediate` no está garantizado fuera de I/O callbacks)

**Cuidado con `process.nextTick`**: si llamas `process.nextTick` recursivamente, puedes bloquear el event loop indefinidamente porque la fase de poll nunca llega:

```javascript
// MAL — bloquea el event loop
function recursiveNextTick() {
  process.nextTick(recursiveNextTick);
}
recursiveNextTick();
// Los I/O callbacks nunca corren, tu servidor no puede aceptar requests

// Mejor: setImmediate da un respiro al event loop entre iteraciones
function recursiveSafe() {
  setImmediate(recursiveSafe);
}
```

## El problema real: código síncrono bloqueante

Este es el que más daño hace en producción:

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/slow') {
    // Operación CPU-intensiva síncrona — bloquea el event loop
    const result = heavyComputation(); // Tarda 2 segundos
    res.end(JSON.stringify(result));
  } else {
    res.end('OK');
  }
});

server.listen(3000);
```

Mientras `heavyComputation()` corre durante 2 segundos, **ningún otro request puede ser procesado**. Un usuario pidiendo `/` tiene que esperar esos 2 segundos aunque su request sea trivial.

Las soluciones:

```javascript
// Opción 1: Worker threads para CPU-heavy work
const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  const server = http.createServer((req, res) => {
    if (req.url === '/slow') {
      const worker = new Worker(__filename);
      worker.on('message', result => res.end(JSON.stringify(result)));
      worker.postMessage({ compute: true });
    } else {
      res.end('OK');  // Responde inmediatamente mientras el worker trabaja
    }
  });
} else {
  parentPort.once('message', () => {
    const result = heavyComputation();
    parentPort.postMessage(result);
  });
}

// Opción 2: Dividir el trabajo en chunks con setImmediate
function processChunk(data, index, callback) {
  if (index >= data.length) return callback();

  processItem(data[index]);

  // Da un respiro al event loop entre chunks
  setImmediate(() => processChunk(data, index + 1, callback));
}
```

## async/await y el event loop

`async/await` es syntactic sugar sobre Promises — todo corre en la microtask queue:

```javascript
async function fetchData() {
  console.log('1 - antes del await');
  const data = await fetch('https://api.example.com/data');
  // Todo lo que viene después del await es un .then() implícito
  console.log('3 - después del await');
  return data;
}

fetchData();
console.log('2 - código síncrono después de llamar fetchData');

// Output:
// 1 - antes del await
// 2 - código síncrono después de llamar fetchData
// 3 - después del await  (cuando el fetch resuelve + microtask queue)
```

El `await` suspende la ejecución de la función async y devuelve el control al event loop. No bloquea. Cuando la Promise resuelve, el callback se encola en la microtask queue y continúa.

---

Una vez que tienes este modelo mental claro — event loop, microtask queue antes que macrotask, código síncrono bloquea todo — los comportamientos raros de Node.js dejan de ser magia negra. Son consecuencias predecibles de un sistema bien definido.

Y cuando tu servidor deja de responder sin razón aparente a las 2am, ya sabes dónde buscar: algo está bloqueando el event loop. Busca el `for` loop síncrono procesando 10,000 items. Lo encuentras, lo metes a un Worker thread, y el servidor vuelve a responder. El chef puede seguir cocinando.
