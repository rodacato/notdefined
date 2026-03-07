---
title: "Event-driven design: cuándo tu app debe dejar de hablarse a sí misma"
description: "Intro práctica a EDA desde un ángulo DDD. Cuándo las llamadas directas se vuelven un problema, qué son los domain events, y cómo implementarlos en Rails sin pasarte de Kafka cuando no lo necesitas."
pubDate: 2025-09-09
tags: ["architecture", "ddd", "backend", "ruby"]
draft: false
---

## TL;DR

- Las **llamadas directas entre módulos** crean acoplamiento que se convierte en deuda de arquitectura — dificultan testing, deploys independientes, y razonamiento sobre el código
- Un **domain event** es un hecho que ocurrió en el dominio: `OrderPlaced`, `UserRegistered`, `PaymentFailed`
- En Rails puedes empezar con **Active Support Notifications** sin infraestructura adicional
- **Kafka/RabbitMQ** cuando necesitas durabilidad, fanout a múltiples servicios, o replay — no antes
- El costo real de EDA es **operacional**: los errores en handlers async son más difíciles de rastrear que los errores en llamadas síncronas

---

## El problema que llega despacio

Tu app empieza simple. Un usuario se registra:

```ruby
class UsersController < ApplicationController
  def create
    @user = User.create!(user_params)
    WelcomeMailer.send_welcome(@user).deliver_later
    redirect_to dashboard_path
  end
end
```

Dos meses después, el registro de usuario también necesita: crear el workspace por defecto, notificar al equipo de ventas, agregar al usuario a Mailchimp, y trackear el evento en Mixpanel. El controller ahora se ve así:

```ruby
def create
  @user = User.create!(user_params)
  WelcomeMailer.send_welcome(@user).deliver_later
  Workspace.create_default_for(@user)
  SalesNotifier.notify_new_signup(@user)
  MailchimpClient.subscribe(@user.email, 'onboarding')
  Mixpanel.track('user_registered', user_id: @user.id)
  redirect_to dashboard_path
end
```

El problema no es que el código esté "sucio". Es que el `UsersController` ahora sabe de ventas, de marketing, de onboarding, y de analytics. Es como si el recepcionista de un hotel también fuera el chef, el contador, y el de mantenimiento. Puede funcionar, pero nadie quiere hacer el test de esa persona.

Esta es la señal de que necesitas pensar en eventos — separar "qué pasó" de "qué hacemos al respecto".

## Qué es un domain event

Un domain event es simplemente un hecho que ocurrió en tu dominio de negocio:

- `UserRegistered` — un usuario completó el registro
- `OrderPlaced` — se realizó un pedido
- `PaymentFailed` — un pago fue rechazado
- `SubscriptionCancelled` — alguien canceló

La clave: el evento captura **qué pasó**, no **qué hacer al respecto**. `UserRegistered` no sabe nada de Mailchimp, ni de ventas, ni de workspaces. Eso es responsabilidad de quien escucha el evento.

```ruby
# El evento — un hecho simple con los datos relevantes
class UserRegistered
  attr_reader :user_id, :email, :plan, :occurred_at

  def initialize(user)
    @user_id = user.id
    @email = user.email
    @plan = user.plan
    @occurred_at = Time.current
  end
end
```

## Implementación en Rails con Active Support Notifications

Rails ya tiene un sistema de pub/sub incorporado: `ActiveSupport::Notifications`. No necesitas instalar nada:

```ruby
# app/services/user_registration_service.rb
class UserRegistrationService
  def call(params)
    user = User.create!(params)

    # Publica el evento — no sabe quién escucha
    ActiveSupport::Notifications.instrument('user.registered', user: user)

    user
  end
end
```

```ruby
# config/initializers/event_subscribers.rb
# Los handlers se suscriben al evento — no saben quién lo publica

ActiveSupport::Notifications.subscribe('user.registered') do |_name, _start, _finish, _id, payload|
  user = payload[:user]
  WelcomeMailer.send_welcome(user).deliver_later
end

ActiveSupport::Notifications.subscribe('user.registered') do |_name, _start, _finish, _id, payload|
  user = payload[:user]
  Workspace.create_default_for(user)
end

ActiveSupport::Notifications.subscribe('user.registered') do |_name, _start, _finish, _id, payload|
  user = payload[:user]
  SalesNotifier.notify_new_signup(user)
end
```

El controller ahora es:

```ruby
def create
  @user = UserRegistrationService.new.call(user_params)
  redirect_to dashboard_path
end
```

Agregar Mailchimp al flujo de registro ahora significa agregar un subscriber más en el initializer — sin tocar el controller, sin tocar el service.

## El patrón más limpio: Event classes explícitas

Para proyectos más grandes, tener una clase de evento explícita es más mantenible:

```ruby
# app/events/user_registered_event.rb
class UserRegisteredEvent
  attr_reader :user_id, :email, :plan, :occurred_at

  def self.publish(user)
    event = new(user)
    ActiveSupport::Notifications.instrument('UserRegistered', event: event)
  end

  def initialize(user)
    @user_id = user.id
    @email = user.email
    @plan = user.plan
    @occurred_at = Time.current
  end
end

# app/subscribers/welcome_email_subscriber.rb
class WelcomeEmailSubscriber
  def self.subscribe!
    ActiveSupport::Notifications.subscribe('UserRegistered') do |_name, _start, _finish, _id, payload|
      event = payload[:event]
      WelcomeMailer.send_welcome_to(event.user_id).deliver_later
    end
  end
end

# En el service:
UserRegisteredEvent.publish(user)
```

## Cuándo Kafka no es la respuesta

La respuesta es casi siempre. Kafka es increíblemente poderoso y operacionalmente complejo. Lo necesitas cuando:

- Tienes **múltiples servicios** (microservicios reales) que necesitan consumir los mismos eventos
- Necesitas **replay** — poder reprocesar eventos históricos
- Manejas **volúmenes muy altos** (millones de eventos por hora)
- Necesitas **durabilidad garantizada** — el evento debe procesarse aunque el consumidor esté caído

Para una aplicación Rails monolítica o un par de servicios, `ActiveSupport::Notifications` o incluso una tabla de `DomainEvents` en PostgreSQL con un background job es suficiente:

```ruby
# Alternativa: eventos persistidos en DB
class DomainEvent < ApplicationRecord
  # tabla: id, event_type, payload (jsonb), processed_at, created_at

  def self.publish(type, payload)
    create!(event_type: type, payload: payload)
  end
end

# Un job que procesa eventos pendientes
class ProcessDomainEventsJob < ApplicationJob
  def perform
    DomainEvent.where(processed_at: nil).find_each do |event|
      EventRouter.route(event)
      event.update!(processed_at: Time.current)
    end
  end
end
```

Esta versión tiene durabilidad (el evento queda en DB aunque el proceso muera) sin la complejidad operacional de Kafka.

## El costo honesto de EDA

No todo es ventajas. Antes de adoptar event-driven design, considera:

**Trazabilidad más difícil.** En código síncrono, un error tiene un stack trace claro. En código event-driven, el handler que falló puede estar en un proceso diferente o ejecutarse minutos después. El tracing distribuido (OpenTelemetry, Datadog APM) ayuda, pero agrega complejidad.

**Consistencia eventual.** Si el handler de Mailchimp falla después de que el usuario se registró, el usuario existe en tu DB pero no en Mailchimp. Tienes que diseñar para eso: retries, idempotencia, alertas.

**Orden no garantizado.** Si publicas `UserRegistered` y un segundo después `UserEmailVerified`, no hay garantía de que los handlers los procesen en ese orden (especialmente con jobs async).

Estos problemas tienen solución, pero requieren trabajo adicional. Para muchas apps, llamadas síncronas directas son la solución correcta y el acoplamiento que crean es manejable.

---

Event-driven design no es sobre Kafka — es sobre separar "qué pasó" de "qué hacemos al respecto". Y puedes empezar hoy, en tu monolito Rails, con `ActiveSupport::Notifications` y cero infraestructura adicional.

¿Y si en un año necesitas Kafka? Para entonces ya tienes la separación de responsabilidades y la migración es más limpia. Empieza pequeño, aprende el patrón, escala cuando el dolor sea real — no antes.
