---
title: "API versioning: por qué el versionado en URL no está siempre mal"
description: "Header versioning es más correcto en teoría. URL versioning es lo que los equipos realmente shippen de forma confiable. Las cuatro estrategias, sus tradeoffs reales, y cómo manejar deprecación sin romper clientes."
pubDate: 2025-08-19
tags: ["api", "backend", "architecture"]
draft: false
---

## TL;DR

- Hay **cuatro estrategias principales**: URL path, header (`Accept` o custom), query param, y content negotiation
- **URL versioning** (`/v1/users`) tiene la mejor visibilidad, cacheabilidad, y es la más simple de operar — el argumento REST purista en contra no es tan práctico como parece
- **Header versioning** es más "correcto" según REST, pero más difícil de debuggear y de usar desde browsers/curl sin config adicional
- **Deprecar bien** importa más que qué estrategia elegiste: headers de warning, sunset dates, y tiempo real para migrar
- La versión es del **recurso** o de la **representación** — entender esa diferencia ayuda a decidir cuándo crear una versión nueva

---

## Por qué este debate nunca termina (y nunca va a terminar)

Pregúntale a cinco arquitectos cómo versionar una API y vas a obtener cuatro respuestas distintas y una pelea. El quinto va a decir "depende" y va a tener razón, lo cual es más frustrante todavía. El problema real es que el debate mezcla dos cosas: lo que es técnicamente correcto según los principios REST, y lo que funciona en práctica para equipos reales.

URL versioning (`/api/v1/users`) viola el principio de que una URL debe identificar un recurso único — `/v1/users` y `/v2/users` son el mismo recurso, solo representaciones distintas. Header versioning mantiene la URL limpia. Pero los principios REST también dicen que los recursos deben ser cacheables, y header versioning complica el caching si no configuras `Vary` correctamente.

La respuesta honesta: todas las estrategias tienen tradeoffs. Aquí están.

## Las cuatro estrategias

### 1. URL Path versioning

```
GET /api/v1/users
GET /api/v2/users
```

**A favor:**
- Visible en logs, browser, curl — trivial de debuggear
- Cacheable sin configuración especial
- Simple de implementar y de routear
- Los clientes saben exactamente qué versión están usando

**En contra:**
- "Viola REST" — la URL ya no identifica solo el recurso
- Si tienes muchas versiones, el mantenimiento se complica
- Hace más difícil tener recursos que evolucionen independientemente

**Cuándo usarla:** APIs públicas con clientes externos que no controlas, equipos sin expertise en HTTP headers, cuando la simplicidad operacional importa más que la pureza REST.

### 2. Header versioning

```http
GET /api/users
Accept: application/vnd.myapp.v2+json

# O con custom header
GET /api/users
API-Version: 2
```

**A favor:**
- La URL identifica el recurso — más "correcto" según REST
- Permite que cada recurso evolucione en su propia cadencia
- Más flexible para versionar solo partes de la API

**En contra:**
- No visible en browser sin herramientas de dev
- Más difícil de testear con curl/Postman sin recordar el header
- Requiere configurar `Vary: Accept` en el cache para no servir versiones incorrectas
- Muchos developers no están familiarizados con media types custom

**Cuándo usarla:** APIs privadas o con clientes sofisticados, cuando tienes control total sobre los consumidores y el tooling.

### 3. Query parameter

```
GET /api/users?version=2
GET /api/users?v=2025-08-01
```

**A favor:**
- Visible en URL, fácil de testear
- Compatible con caching (la URL completa es diferente)

**En contra:**
- Mezcla versioning con parámetros funcionales de la query
- Semánticamente raro — la versión no es un filtro del recurso
- Menos predecible que path versioning

**Cuándo usarla:** Honestamente, rara vez. Es una especie de peor de ambos mundos — tiene la visibilidad de URL versioning pero menos semántica clara.

### 4. Date-based versioning (Stripe-style)

```
GET /api/users
Stripe-Version: 2024-06-20
```

Stripe versiona por fecha, no por número. Cada cambio breaking tiene una fecha, y los clientes especifican qué fecha del API quieren usar. Tu cuenta tiene una versión default (la del día que creaste tu API key) y solo migras cuando estás listo.

**A favor:**
- Granularidad fina — no tienes que versionar toda la API cuando cambia un endpoint
- Los clientes migran a su propio ritmo sin urgencia artificial
- Muy claro el historial de cambios

**En contra:**
- Complejo de mantener internamente — tienes que soportar múltiples "fechas" en paralelo
- Requiere mucha disciplina de documentación
- Puede acumular deuda técnica si no limpias versiones viejas

**Cuándo usarla:** APIs públicas de plataforma con muchos clientes externos y larga vida útil. Stripe, Twilio. No para tu API interna de microservicio.

## Cómo implementar URL versioning en Rails

```ruby
# config/routes.rb
namespace :api do
  namespace :v1 do
    resources :users
    resources :posts
  end

  namespace :v2 do
    resources :users  # solo lo que cambió
    resources :posts  # hereda de v1 si no cambió
  end
end

# app/controllers/api/v1/users_controller.rb
module Api
  module V1
    class UsersController < ApiController
      def index
        render json: User.all.map(&method(:serialize_v1))
      end

      private

      def serialize_v1(user)
        { id: user.id, name: user.name, email: user.email }
      end
    end
  end
end

# app/controllers/api/v2/users_controller.rb
module Api
  module V2
    class UsersController < Api::V1::UsersController
      # Hereda todo de V1, solo override lo que cambió
      private

      def serialize_v2(user)
        {
          id: user.id,
          full_name: user.full_name,   # cambió de name a full_name
          email: user.email,
          avatar_url: user.avatar_url, # campo nuevo
        }
      end
    end
  end
end
```

## Versionar el recurso vs la representación

Esta distinción ayuda a decidir cuándo crear una versión nueva:

- **Cambio en la representación**: el dato es el mismo, cambia cómo lo expones (renombrar un campo, cambiar formato de fecha). Aquí el versionado tiene sentido — es el mismo recurso con distinta forma.

- **Cambio en el recurso**: el dominio cambió (el concepto de `User` ahora tiene algo fundamentalmente diferente). Considera si debería ser un recurso diferente (`/accounts`) en lugar de una versión nueva.

Ejemplos:

```
# Cambio en representación → versiona
v1: { "name": "Alice Smith", "created": "2025-01-01" }
v2: { "full_name": "Alice Smith", "created_at": "2025-01-01T00:00:00Z" }

# Cambio en recurso → considera nuevo endpoint
v1: GET /users/123 → User con autenticación simple
v2: GET /accounts/123 → Account con múltiples usuarios y roles
# Quizás /accounts es mejor que versionar /users
```

## Deprecar bien: la parte que todos ignoran hasta que rompen clientes en producción

No importa qué estrategia elegiste si no tienes un proceso claro de deprecación. Y aquí es donde las buenas intenciones mueren: "vamos a deprecar v1 cuando todos migren" es una frase que en algunos equipos lleva viviendo cinco años.

**Headers de warning en responses:**

```ruby
# Agrega este header cuando el endpoint está deprecated
response.headers['Deprecation'] = 'true'
response.headers['Sunset'] = 'Sat, 01 Mar 2026 00:00:00 GMT'
response.headers['Link'] = '</api/v2/users>; rel="successor-version"'
```

**Sunset date claro:** anuncia con al menos 6 meses de anticipación para APIs públicas, 3 meses para APIs internas.

**Monitoring de uso:** antes de apagar una versión, verifica que nadie la esté usando:

```ruby
# En un before_action del controller V1
def track_api_version_usage
  StatsD.increment('api.version.v1.calls', tags: ["endpoint:#{controller_path}"])
end
```

Si ves cero calls durante 30 días, es seguro apagar.

---

URL versioning no es el camino del mal. Header versioning no es intrínsecamente superior solo porque los puristas REST lo dicen. La estrategia correcta es la que tu equipo puede operar, documentar, y deprecar de forma confiable.

Y el mejor versionado es el que tienes hoy — el que vive en tu cabeza "para después" es el que va a romperte los clientes el día que finalmente tengas que cambiar algo.
