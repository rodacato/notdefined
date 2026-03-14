---
title: "Ruby 4.0 y async: el event loop que le faltaba a Ruby"
description: "Ruby 4.0 (diciembre 2025) entregó lo que Ruby 3.x prometió: I/O concurrente real con Fibers, Ractor::Port para paralelismo sin drama, y ZJIT que optimiza workloads concurrentes. Te explico cómo funciona, cómo se compara con Node.js, y si puedes usarlo con tu app Rails hoy."
pubDate: 2026-03-14
tags: ["ruby", "concurrency", "performance", "rails"]
series: "Ruby Internals"
seriesOrder: 4
draft: false
---

## TL;DR

- **Ruby 4.0** (25 dic 2025) estabilizó el modelo async que Ruby 3.x fue construyendo desde 2020
- **`Ractor::Port`** es la novedad grande: comunicación limpia entre Ractors para pipelines I/O + CPU
- El **Fiber Scheduler** ya no es "experimental con asterisco" — Falcon y la gema `async` se benefician directamente
- **ZJIT** optimiza mejor el código concurrente que YJIT (que sigue disponible para Rails)
- Puedes usarlo con Rails vía **Falcon**, con caveats en el ORM
- Benchmarks con I/O de red real muestran async en Ruby 4.0 un **21% más rápido** que en 3.4 — la diferencia crece con más concurrencia

---

## Ruby 4.0: cinco años de promesas entregadas

Tuve un endpoint en un proyecto que hacía entre 8 y 12 llamadas a APIs externas por request — enriquecimiento de datos, validaciones contra servicios terceros, ese tipo de cosas. Cada llamada tardaba entre 80 y 200ms. Puma con 5 threads, y el endpoint tardaba 1.5 segundos en promedio porque todo era secuencial dentro del mismo thread. La solución obvia era async, pero en Ruby 3.x todavía se sentía como apostar a algo experimental.

Ruby 4.0 cambió eso. Salió el 25 de diciembre de 2025 y es donde cinco años de trabajo en el Fiber Scheduler se vuelven producción sin asterisco.

El problema de fondo: si ya leiste [el post sobre el event loop de Node.js](/blog/el-event-loop-de-nodejs-el-modelo-mental-que-finalmente-lo-hace-clickear), sabes que Node puede manejar miles de conexiones concurrentes con un solo thread porque delega la I/O al sistema operativo y procesa callbacks cuando llegan. Ruby con Puma no — cada request ocupa un thread mientras espera la DB o el servicio externo. Con 10 threads y 10 requests bloqueados esperando respuesta, el numero 11 espera. Eso escala mal cuando el 90% del tiempo es esperar I/O.

---

## Lo nuevo en Ruby 4.0

### `Ractor::Port` — el puente entre I/O y CPU

Los Ractors llegaron en Ruby 3.0 como el modelo de paralelismo sin GVL de Ruby, pero eran frágiles: muchas gemas no eran Ractor-safe, y la comunicación entre Ractors era torpe y con contención notable de locks. Ruby 4.0 los estabiliza con **`Ractor::Port`**, una primitiva de comunicación mas limpia.

El caso de uso mas interesante es combinar el event loop de Fibers para I/O con Ractors para computo CPU-intensivo. Imagina que descargas JSONs grandes de una API y tienes que parsear y transformar cada uno — la descarga es I/O, la transformación puede ser CPU:

```ruby
require 'async'
require 'json'

# Ractor worker: procesa el JSON en paralelo real, sin GVL
port   = Ractor::Port.new
worker = Ractor.new(port) do |port|
  loop do
    raw = port.receive
    parsed = JSON.parse(raw)
    # normalización costosa del payload
    result = parsed.transform_values(&:to_s).sort.to_h
    Ractor.yield(result)
  end
end

# Fibers manejan las descargas concurrentes
Async do
  tasks = api_endpoints.map do |url|
    Async do
      response = Async::HTTP::Internet.new.get(url)
      raw_body = response.read          # I/O no bloqueante
      port.send(raw_body)               # manda al Ractor
      worker.take                       # recibe resultado procesado
    end
  end

  tasks.each { |t| puts t.wait.inspect }
end
```

Antes de 4.0, conectar `Async` con Ractors requeria workarounds. `Ractor::Port` hace que este patron sea idiomatico.

### Fiber Scheduler production-ready

El `Fiber::Scheduler` de Ruby 3.0 era correcto en concepto pero rugoso en implementación. Cada versión 3.x fue limpiando casos edge. En Ruby 4.0 las APIs internas se estabilizaron y la integración con `io_uring` en Linux es mas eficiente que en cualquier versión anterior.

¿Que significa eso en practica? La gema `async` y el servidor Falcon ya no necesitan workarounds para comportarse correctamente. El scheduler se engancha transparentemente en `IO.read`, `sleep`, `Socket`, y llamadas de red — sin que tengas que cambiar tu código:

```ruby
# Este código se vuelve no bloqueante si hay un scheduler activo
# No cambia nada desde la perspectiva del que lo escribe
def fetch_orders(user_id)
  db.query("SELECT * FROM orders WHERE user_id = #{user_id}")
  # ^ se pausa aquí, otro Fiber corre mientras la DB responde
end
```

### ZJIT

Honestamente, ZJIT es la pieza que menos he podido probar directamente todavía. Lo que sí está documentado: es el sucesor del JIT que el core team está priorizando sobre YJIT. YJIT sigue disponible y sigue siendo la mejor opción para Rails convencional, pero ZJIT esta diseñado para ser mas modular y optimizar mejor el código con mucha concurrencia. En workloads con cientos de Fibers el gain es medible según los benchmarks del core team — en tu app específica puede variar.

---

## Cómo llegamos aquí: Ruby 3.x en contexto

| Versión | Qué aportó al modelo async |
|---------|---------------------------|
| 3.0 (2020) | `Fiber::Scheduler` — la interfaz que hace posible todo |
| 3.0 (2020) | Ractors — paralelismo sin GVL, pero experimental y frágil |
| 3.2 (2022) | Soporte experimental de `io_uring` vía la gema `io-event` |
| 3.4 (2024) | Refinamiento de APIs del scheduler, menos overhead |
| **4.0 (2025)** | **`Ractor::Port`, Fiber Scheduler estable, ZJIT** |

La gema [`async`](https://github.com/socketry/async) de Samuel Williams construyó el event loop encima de esta base, y estuvo empujando los límites del scheduler desde Ruby 3.0. Ruby 4.0 es en buena parte resultado de ese feedback — Samuel reportando casos edge, el core team limpiando las APIs, repeat.

---

## La gema `async`: el event loop en la práctica

```ruby
require 'async'
require 'async/http/internet'

Async do
  internet = Async::HTTP::Internet.new

  # Estos dos requests corren concurrentemente — igual que Promise.all en Node
  task1 = Async { internet.get("https://api.github.com/users/rails") }
  task2 = Async { internet.get("https://api.github.com/users/matz") }

  puts task1.wait.status  # => 200
  puts task2.wait.status  # => 200
ensure
  internet&.close
end
```

Sin `async`, esos requests serían secuenciales. Con `async` + Ruby 4.0, el Fiber Scheduler los hace concurrentes sin que tengas que escribir callbacks ni manejar Promises.

---

## Comparación con Node.js

Ambos modelos resuelven el mismo problema: I/O concurrente sin bloquear el hilo principal. Pero tienen diferencias importantes:

| | **Node.js** | **Ruby 4.0 + async** |
|---|---|---|
| Modelo base | Callbacks / Promises | Fibers (coroutines) |
| API pública | `async/await`, `.then()` | `Async { }`, `task.wait` |
| Código bloqueante | Contamina todo el proceso | Solo bloquea ese Fiber |
| Paralelismo CPU | Worker Threads | Ractors (sin GVL) |
| GIL / GVL en I/O | N/A | No aplica — I/O libera el GVL |
| JIT | V8 (maduro) | ZJIT (nuevo, prometedor) |

La ventaja de Ruby que no se menciona suficiente: si un Fiber hace algo bloqueante sin que el scheduler lo sepa, solo ese Fiber se para — el resto del proceso continua. En Node, una función bloqueante detiene todo. Eso en producción se siente.

---

## ¿Puedo usarlo con Rails?

**Sí, con el servidor Falcon.**

[Falcon](https://falcon.socketry.io/) es compatible con Rack y usa el event loop de `async` para manejar cada request en su propio Fiber. Con Ruby 4.0, la integración es más limpia que en versiones anteriores:

```ruby
# Gemfile
gem 'falcon'

# bundle exec falcon serve
```

Lo que funciona bien en Rails + Falcon hoy:

- Requests normales con lógica de negocio tradicional
- WebSockets y Server-Sent Events (donde más brilla)
- LLM streaming
- Cualquier I/O que use adaptadores `async`-compatible

Lo que necesita atención:

- La gem `pg` bloquea. Para sacar el máximo necesitas [`async-postgres`](https://github.com/socketry/async-postgres)
- Código legacy que asume threading puede tener race conditions — revisa tus gems
- Algunos middlewares de Rails no fueron diseñados para Fibers — la mayoría funciona, pero testea

Si tu app Rails va bien con Puma, no migres solo por migrar. La ganancia real aparece en endpoints con mucho I/O externo, streaming, o WebSockets. Para ese tipo de workloads, Falcon con Ruby 4.0 es hoy una opción real de producción.

---

## Benchmark rápido

Dos benchmarks: uno que muestra el modelo conceptual, otro con I/O de red real donde Ruby 4.0 marca diferencia.

### Modelo conceptual — sleep como proxy de latencia

```ruby
require 'benchmark'
require 'async'

REQUESTS = 20
LATENCY  = 0.1  # 100ms simulando latencia de red

def sequential
  REQUESTS.times { sleep(LATENCY) }
end

def with_threads
  threads = REQUESTS.times.map { Thread.new { sleep(LATENCY) } }
  threads.each(&:join)
end

def with_async
  Async do
    tasks = REQUESTS.times.map { Async { sleep(LATENCY) } }
    tasks.each(&:wait)
  end
end

Benchmark.bm(12) do |x|
  x.report("sequential:")  { sequential }
  x.report("threads:")     { with_threads }
  x.report("async:")       { with_async }
end
```

Resultados — Ruby 3.4.9 y 4.0.1 son idénticos aquí, y eso es correcto: `sleep` es interceptado por el scheduler en ambos, pero no ejercita syscalls de red reales. Sirve para entender el modelo, no para comparar versiones.

```
                   user     system      total        real
sequential:    0.001443   0.000111   0.001554 (  2.057247)  # 20 × 100ms, uno por uno
threads:       0.008665   0.004129   0.012794 (  0.110737)  # paralelo, overhead de threads
async:         0.002106   0.000000   0.002106 (  0.104634)  # concurrente, sin overhead
```

### I/O de red real — donde Ruby 4.0 marca diferencia

50 requests TCP con 5ms de latencia y ~5.7KB de payload por request — más cercano a lo que hace un endpoint real contra servicios externos:

```ruby
require 'benchmark'
require 'async'
require 'socket'

LOREM   = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' * 100
PAYLOAD = LOREM.bytesize
N       = 50

# Servidor TCP echo que simula latencia de red
server = TCPServer.new('127.0.0.1', 0)
PORT   = server.addr[1]

Thread.new do
  loop do
    client = server.accept
    Thread.new(client) do |c|
      data = c.read(PAYLOAD)
      sleep 0.005  # 5ms latencia simulada
      c.write(data)
      c.close
    end
  end
end

def sequential(port, data, n)
  n.times do
    s = TCPSocket.new('127.0.0.1', port)
    s.write(data); s.shutdown(1); s.read; s.close
  end
end

def with_threads(port, data, n)
  threads = n.times.map do
    Thread.new do
      s = TCPSocket.new('127.0.0.1', port)
      s.write(data); s.shutdown(1); s.read; s.close
    end
  end
  threads.each(&:join)
end

def with_async(port, data, n)
  Async do
    tasks = n.times.map do
      Async do
        s = Socket.new(:INET, :STREAM)
        s.connect(Socket.sockaddr_in(port, '127.0.0.1'))
        s.write(data); s.shutdown(1); s.read; s.close
      end
    end
    tasks.each(&:wait)
  end
end

Benchmark.bm(12) do |x|
  x.report('sequential:') { sequential(PORT, LOREM, N) }
  x.report('threads:')    { with_threads(PORT, LOREM, N) }
  x.report('async:')      { with_async(PORT, LOREM, N) }
end
```

**Ruby 3.4.9:**
```
                   user     system      total        real
sequential:    0.010859   0.020086   0.030945 (  0.345855)  # 50 × 5ms + overhead, secuencial
threads:       0.019686   0.024672   0.044358 (  0.055746)  # paralelo, overhead de threads
async:         0.013086   0.009219   0.022305 (  0.026513)  # concurrente, scheduler 3.x
```

**Ruby 4.0.1:**
```
                   user     system      total        real
sequential:    0.011986   0.012919   0.024905 (  0.336071)  # igual — secuencial es secuencial
threads:       0.019365   0.025927   0.045292 (  0.047300)  # comparable
async:         0.006890   0.010355   0.017245 (  0.021044)  # scheduler 4.0 con io_uring mejorado
```

Async en Ruby 4.0.1 termina en **21ms vs 27ms** en Ruby 3.4.9 — un 21% más rápido con I/O de red real. Y la brecha contra threads ya es visible: 21ms vs 47ms, más del doble. La diferencia viene del scheduler más eficiente y la mejor integración con `io_uring` en Linux. En workloads con más concurrencia o latencias más altas, el gap se amplía.

Pero el gain real no es solo velocidad — es cómo escala la memoria:

- **Threads**: ~1MB de stack por thread. 1000 requests concurrentes → ~1GB solo en stacks.
- **Fibers**: ~4KB por Fiber. 1000 Fibers → ~4MB.

Para un servidor Rails con 8 threads Puma, si cada thread espera 50ms de DB, atiendes 8 requests concurrentes. Con async, atiendes cientos — limitado por tu connection pool a la DB, no por el servidor.

---

## Fuentes

- **Ruby 4.0.0 release notes** (Ractor::Port, ZJIT, Fiber Scheduler): [ruby-lang.org/en/news/2025/12/25/ruby-4-0-0-released](https://www.ruby-lang.org/en/news/2025/12/25/ruby-4-0-0-released/)
- **Gema async** — código fuente y docs: [github.com/socketry/async](https://github.com/socketry/async)
- **Falcon web server**: [falcon.socketry.io](https://falcon.socketry.io)
- **Ruby 3.0 release notes** (Fiber Scheduler + Ractors): [ruby-lang.org/en/news/2020/12/25/ruby-3-0-0-released](https://www.ruby-lang.org/en/news/2020/12/25/ruby-3-0-0-released/)
- **Samuel Williams — "Async Ruby"** (RubyConf 2021): [youtu.be/Y29SSOS4UoU](https://youtu.be/Y29SSOS4UoU)
- **async-postgres**: [github.com/socketry/async-postgres](https://github.com/socketry/async-postgres)
- Post relacionado: [Ruby, Concurrencia y Paralelismo: La Verdad](/blog/ruby-parallelism-and-concurrency)
