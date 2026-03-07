---
title: "Rate limiting de APIs: más que solo contar requests"
description: "Fixed window, sliding window, token bucket — tradeoffs reales, no solo definiciones. Dónde enforcer (nginx, app layer, Redis), cómo manejar sistemas distribuidos, y rate limiting por complejidad de operación."
pubDate: 2025-10-28
tags: ["api", "backend", "architecture"]
draft: false
---

## TL;DR

- **Fixed window** es el más simple pero tiene el problema del "burst en el borde" — sliding window lo resuelve
- **Token bucket** es el mejor para APIs públicas: permite bursts cortos con un promedio controlado
- **Dónde poner el rate limiter importa**: nginx para tráfico masivo, app layer para lógica de negocio, Redis para estado compartido en sistemas distribuidos
- **Un solo Redis key no es suficiente** para rate limiting distribuido — usa Lua scripts o algoritmos probabilísticos
- En Rails, **rack-attack** es la forma más pragmática de implementarlo sin reinventar la rueda

---

Nadie piensa en rate limiting hasta que un cliente manda 50,000 requests en 10 segundos — ya sea por un bug, por un bucle sin control, o porque alguien está siendo malicioso. En ese momento estás a las 2am buscando en Google "cómo limitar requests en Rails" con las manos temblando. Este post es para que tengas la respuesta lista antes de que llegue esa noche.

## Los tres algoritmos que importan

### Fixed window

La implementación más simple: cuenta requests en ventanas de tiempo fijas (por minuto, por hora).

```
12:00:00 → 12:00:59: ventana 1 — límite: 100 requests
13:00:00 → 13:00:59: ventana 2 — límite: 100 requests
```

El problema: un cliente puede hacer 100 requests al final de la ventana 1 y 100 más al inicio de la ventana 2 — 200 requests en 2 segundos, aunque el límite sea 100/minuto.

```ruby
# Implementación básica en Redis
def rate_limited?(user_id, limit: 100, window: 60)
  key = "rate:#{user_id}:#{Time.current.to_i / window}"
  count = redis.incr(key)
  redis.expire(key, window) if count == 1
  count > limit
end
```

**Cuándo usarlo**: para límites simples donde el burst en el borde no es crítico. Billing por API calls (donde el total diario importa más que el burst momentáneo).

### Sliding window

Resuelve el problema del burst manteniendo un log de timestamps de requests recientes:

```ruby
def rate_limited?(user_id, limit: 100, window: 60)
  key = "rate:sliding:#{user_id}"
  now = Time.current.to_f
  window_start = now - window

  # Transacción atómica
  redis.multi do |r|
    r.zremrangebyscore(key, '-inf', window_start)  # elimina requests viejos
    r.zadd(key, now, "#{now}-#{rand}")             # agrega el request actual
    r.zcard(key)                                    # cuenta requests en ventana
    r.expire(key, window)
  end

  result = redis.zcard(key)
  result > limit
end
```

Más preciso pero usa más memoria (un entry por request en el sorted set). Para alta concurrencia puede ser caro.

### Token bucket

El más flexible para APIs públicas. Cada usuario tiene un "bucket" que se llena a una tasa constante. Los requests consumen tokens. Permite bursts cortos mientras el promedio se controla.

```
Tasa de llenado: 10 tokens/segundo
Capacidad máxima: 100 tokens

Usuario inactivo por 10 segundos → tiene 100 tokens (lleno)
Hace 100 requests en ráfaga → se vacía el bucket
Espera 1 segundo → tiene 10 tokens de nuevo
```

```ruby
# Token bucket en Redis con Lua para atomicidad
BUCKET_SCRIPT = <<~LUA
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local rate = tonumber(ARGV[2])      -- tokens por segundo
  local now = tonumber(ARGV[3])
  local requested = tonumber(ARGV[4])

  local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
  local tokens = tonumber(bucket[1]) or capacity
  local last_refill = tonumber(bucket[2]) or now

  -- Rellenar tokens basado en tiempo transcurrido
  local elapsed = now - last_refill
  tokens = math.min(capacity, tokens + elapsed * rate)

  if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    redis.call('EXPIRE', key, 3600)
    return 1  -- permitido
  else
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    return 0  -- denegado
  end
LUA

def allowed?(user_id, requested: 1, capacity: 100, rate: 10)
  result = redis.eval(
    BUCKET_SCRIPT,
    keys: ["bucket:#{user_id}"],
    argv: [capacity, rate, Time.current.to_f, requested]
  )
  result == 1
end
```

El script Lua en Redis es **atómico** — no hay race conditions.

## Dónde poner el rate limiter — y por qué importa la capa

Los tres algoritmos de arriba son el "qué". Ahora el "dónde" — porque puedes tener el mejor token bucket del mundo y seguir recibiendo tráfico basura si lo pones en la capa incorrecta.

### nginx — para protección masiva

```nginx
# nginx.conf
http {
  limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

  server {
    location /api/ {
      limit_req zone=api burst=20 nodelay;
      limit_req_status 429;
      proxy_pass http://app;
    }
  }
}
```

nginx maneja esto en el thread de I/O, antes de que el request llegue a tu app. Ideal para protección contra DDoS básico y ataques volumétricos. El problema: solo puedes limitar por IP, no por usuario o API key.

### App layer con rack-attack — para lógica de negocio

```ruby
# config/initializers/rack_attack.rb
class Rack::Attack
  # Rate limit por IP — protección básica
  throttle('req/ip', limit: 300, period: 5.minutes) do |req|
    req.ip
  end

  # Rate limit por API key — más específico
  throttle('api/key', limit: 1000, period: 1.hour) do |req|
    req.env['HTTP_X_API_KEY'] if req.path.start_with?('/api/')
  end

  # Rate limit por usuario autenticado — más granular
  throttle('api/user', limit: 100, period: 1.minute) do |req|
    # Extrae el user_id del JWT o session
    if req.path.start_with?('/api/')
      token = req.env['HTTP_AUTHORIZATION']&.split(' ')&.last
      JWT.decode(token, Rails.application.secrets.secret_key_base)[0]['user_id'] rescue nil
    end
  end

  # Protección específica para login
  throttle('logins/ip', limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == '/api/sessions' && req.post?
  end

  # Response personalizado para rate limit
  self.throttled_responder = lambda do |env|
    now = Time.current
    match_data = env['rack.attack.match_data']
    retry_after = (match_data[:period] - now.to_i % match_data[:period]).to_s

    [
      429,
      {
        'Content-Type' => 'application/json',
        'Retry-After' => retry_after,
        'X-RateLimit-Limit' => match_data[:limit].to_s,
        'X-RateLimit-Reset' => (now + retry_after.to_i).to_i.to_s,
      },
      [{ error: 'Too many requests', retry_after: retry_after.to_i }.to_json],
    ]
  end
end
```

## El problema de sistemas distribuidos

Si tienes múltiples instancias de tu app, un Redis key central puede tener race conditions:

```ruby
# MAL — race condition con múltiples procesos
count = redis.get("rate:#{user_id}")
if count.to_i < limit
  redis.incr("rate:#{user_id}")  # otro proceso puede haber incrementado entre GET e INCR
  allow_request
end

# BIEN — INCR es atómico en Redis
count = redis.incr("rate:#{user_id}")
redis.expire("rate:#{user_id}", window) if count == 1
count <= limit ? allow_request : reject_request
```

Para el token bucket distribuido, usa siempre Lua scripts (son atómicos en Redis) o una librería que los use internamente como `redis-cell`.

## Rate limiting por complejidad

Para GraphQL o APIs donde una request puede ser exponencialmente más costosa que otra:

```ruby
# Rack::Attack con costo variable
throttle('api/heavy', limit: 1000, period: 1.hour) do |req|
  if req.path.start_with?('/api/graphql')
    body = JSON.parse(req.body.read) rescue {}
    complexity = estimate_query_complexity(body['query'])
    # Retorna el user_id * complexity para consumir más del bucket
    [req.env['HTTP_X_USER_ID'], complexity] if complexity > 0
  end
end
```

La misma idea para APIs REST: endpoints de exportación masiva cuestan más que endpoints de lectura simple.

## Headers de respuesta que deberías incluir siempre

```ruby
# En el controller base o como middleware
after_action :set_rate_limit_headers

def set_rate_limit_headers
  limit = 1000
  remaining = RateLimiter.remaining(current_user)
  reset = RateLimiter.reset_at(current_user)

  response.headers['X-RateLimit-Limit'] = limit.to_s
  response.headers['X-RateLimit-Remaining'] = remaining.to_s
  response.headers['X-RateLimit-Reset'] = reset.to_i.to_s
  response.headers['Retry-After'] = (reset - Time.current).to_i.to_s if remaining == 0
end
```

Sin estos headers, tus clientes no saben cuándo pueden reintentar. Con ellos, pueden implementar backoff inteligente.

---

Rate limiting es uno de esos features que nadie piensa hasta que ya es tarde. Para el 80% de las APIs, `rack-attack` con Redis es todo lo que necesitas — instálalo hoy, configura los throttles básicos, y olvídate. El token bucket lo agregas cuando tienes clientes reales que te pidan flexibilidad para bursts cortos.

No esperes la noche de los 50,000 requests para implementarlo.
