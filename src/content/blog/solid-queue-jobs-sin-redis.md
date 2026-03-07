---
title: "Solid Queue: background jobs sin Redis"
description: "Rails 8 llega con Solid Queue como backend por defecto para Active Job. Es un queue engine respaldado por tu base de datos. Veamos si es suficiente para tu app."
pubDate: 2025-05-20
tags: ["ruby", "rails", "backend"]
draft: false
---

## TL;DR

- **Solid Queue** usa tu base de datos (PostgreSQL o MySQL) como backend — no necesitas Redis
- Es el **backend por defecto de Active Job en Rails 8** (noviembre 2024)
- Para la mayoría de las apps con **menos de 1000 jobs/minuto**, es suficiente sin configuración extra
- Incluye un **supervisor de procesos** integrado — no necesitas Procfile complicados
- Para **alta concurrencia o volume** (miles de jobs/minuto), Sidekiq con Redis sigue siendo la opción correcta

---

## Rails 8 y el fin de "necesitas Redis para jobs"

Cuando Rails 8 salió en noviembre de 2024, una de las cosas más comentadas fue el nuevo default stack: Solid Queue para jobs, Solid Cache para caché, y Solid Cable para Action Cable. Los tres respaldados por la base de datos, sin dependencias externas adicionales.

La pregunta obvia: ¿por qué harías esto cuando Sidekiq + Redis funciona tan bien?

La respuesta corta: porque Redis en muchos proyectos existe *únicamente* para Sidekiq. Es como tener un segundo departamento solo para guardar las llaves del primero. Solid Queue elimina esa dependencia — tu Postgres ya está ahí, ya tienes backups, ya tienes monitoring. Una dependencia menos que gestionar, actualizar, y pagar.

## Cómo funciona internamente

Solid Queue usa `SELECT ... FOR UPDATE SKIP LOCKED` — una feature de PostgreSQL y MySQL que permite hacer "queues" con una tabla SQL de forma eficiente sin locks bloqueantes:

```sql
-- Lo que Solid Queue hace internamente para agarrar un job
SELECT * FROM solid_queue_ready_executions
WHERE queue_name = 'default'
ORDER BY priority, scheduled_at
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

`SKIP LOCKED` es la clave: si otro worker ya tomó ese job, la query lo salta sin bloquear. Esto permite múltiples workers concurrentes sin contención. Es una feature que existe en PostgreSQL desde la versión 9.5 (2016), así que si ya usas Postgres moderno, está disponible.

## Setup en Rails 8

En un proyecto Rails 8 nuevo, Solid Queue ya viene configurado. Para proyectos existentes en Rails 7.x:

```sh
bundle add solid_queue
bin/rails solid_queue:install:migrations
bin/rails db:migrate
```

```yaml
# config/queue.yml (generado automáticamente)
default: &default
  dispatchers:
    - polling_interval: 1
      batch_size: 500
  workers:
    - queues: "*"
      threads: 3
      processes: 2
      polling_interval: 0.1

development:
  <<: *default

production:
  <<: *default
  workers:
    - queues: "default,mailers"
      threads: 5
      processes: 3
      polling_interval: 0.1
    - queues: "low_priority"
      threads: 2
      processes: 1
      polling_interval: 2
```

```ruby
# config/application.rb
config.active_job.queue_adapter = :solid_queue
```

Para arrancarlo:

```sh
# Desarrollo — un solo comando
bin/jobs  # Rails 8 genera este script automáticamente

# O directamente
bundle exec solid_queue start
```

## Crear y encolar jobs — exactamente igual que siempre

Eso es lo mejor de Solid Queue: tu código de jobs no cambia en absoluto. Active Job es la capa de abstracción, Solid Queue es el backend. Si tenías jobs con Sidekiq o DelayedJob, los migras solo cambiando el adapter.

```ruby
# app/jobs/welcome_email_job.rb
class WelcomeEmailJob < ApplicationJob
  queue_as :mailers

  def perform(user_id)
    user = User.find(user_id)
    UserMailer.welcome(user).deliver_now
  end
end

# Encolar desde cualquier parte
WelcomeEmailJob.perform_later(user.id)

# Con delay
WelcomeEmailJob.set(wait: 5.minutes).perform_later(user.id)

# Con prioridad (Solid Queue los procesa en orden)
WelcomeEmailJob.set(priority: 10).perform_later(user.id)
```

## Monitoreo con Mission Control

Solid Queue incluye Mission Control — una UI de administración montable en tu Rails app:

```ruby
# Gemfile
gem 'mission_control-jobs'
```

```ruby
# config/routes.rb
authenticate :user, ->(u) { u.admin? } do
  mount MissionControl::Jobs::Engine, at: '/jobs'
end
```

Desde `/jobs` puedes ver los jobs pendientes, fallidos, en progreso, reintentarlos manualmente, y ver el historial. Similar a Sidekiq Web pero sin la dependencia de Redis.

## Solid Queue vs Sidekiq: los números que importan

No hay benchmarks universales — depende de tu app, tu hardware, y tu volumen. Pero estas son las métricas relevantes:

| Métrica | Solid Queue | Sidekiq |
|---------|-------------|---------|
| Throughput | ~500–2000 jobs/min por proceso | 10,000–50,000 jobs/min |
| Latencia (job en queue → ejecución) | 100–500ms | 10–50ms |
| Dependencias | Solo DB | DB + Redis |
| Persistencia | Siempre (en DB) | Solo con Redis persistence |
| Setup | Mínimo | Redis + config |
| Concurrencia máxima práctica | Limitada por DB connections | Muy alta |

La latencia de 100–500ms es el trade-off principal. Para jobs que procesan correos, webhooks, reportes — irrelevante. Para jobs que necesitan respuesta "en tiempo real" desde el usuario (ej: generar un preview mientras el usuario espera), 500ms puede sentirse lento.

## Cuándo quedarte con Sidekiq

Solid Queue es suficiente para la mayoría de las apps. Pero hay casos donde Sidekiq sigue siendo la elección correcta:

**Volume alto.** Si procesas más de 1000–2000 jobs por minuto en producción, Solid Queue puede empezar a generar contención en la DB. Sidekiq maneja esto mejor porque Redis está diseñado para operaciones de queue.

**Latencia crítica.** Si tus jobs necesitan ejecutarse en milisegundos de ser encolados (pipelines de procesamiento en tiempo real, por ejemplo), Solid Queue no es la herramienta.

**Ya tienes Redis.** Si Redis ya está en tu stack por Action Cable, caché, o feature flags — no ganas nada removiéndolo para jobs.

**Sidekiq Enterprise features.** Rate limiting, unique jobs con semántica específica, batch jobs con callbacks — Sidekiq Enterprise tiene cosas que no existen en Solid Queue.

## Migrar de Sidekiq a Solid Queue

Si tienes jobs en Sidekiq y quieres migrar:

```ruby
# Antes — Sidekiq
class ProcessOrderJob < ApplicationJob
  queue_as :orders
  sidekiq_options retry: 5, dead: false

  def perform(order_id)
    Order.find(order_id).process!
  end
end

# Después — Solid Queue (el job en sí no cambia)
class ProcessOrderJob < ApplicationJob
  queue_as :orders
  retry_on StandardError, attempts: 5  # Active Job nativo

  def perform(order_id)
    Order.find(order_id).process!
  end
end
```

El único cambio real es el adapter. Los jobs en sí son Active Job estándar. Las opciones específicas de Sidekiq (`sidekiq_options`) se reemplazan con las opciones de Active Job (`retry_on`, `discard_on`).

La migración más cuidadosa es asegurarte de que todos los jobs pendientes en Sidekiq se procesen antes de apagar el worker — no migres jobs mid-flight.

---

Solid Queue es la decisión correcta para proyectos nuevos en Rails 8 y para apps existentes con volumen moderado. Elimina una dependencia de infraestructura sin sacrificar nada en la mayoría de los casos.

Si estás en Rails 8 y todavía tienes Redis solo para Sidekiq — la pregunta no es "¿debería migrar?", es "¿por qué no lo hice ya?"
