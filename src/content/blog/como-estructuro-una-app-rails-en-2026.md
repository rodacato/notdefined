---
title: "Cómo estructuro una app Rails en 2026"
description: "No es 'el Rails way' y tampoco DDD desde cero. Un approach pragmático después de 10+ años: dónde va la lógica de negocio, cómo usar concerns sin crear un desastre, y cómo los nuevos defaults de Rails 8 cambian las decisiones de arquitectura."
pubDate: 2026-01-27
tags: ["ruby", "rails", "architecture"]
draft: false
---

## TL;DR

- La **lógica de negocio no va en el modelo** — el modelo es persistencia y relaciones, nada más
- Los **concerns son para comportamiento compartido**, no para ocultar complejidad dentro del modelo
- **Service objects** para flujos complejos, **módulos** para operaciones sin estado, **modelos puros** para queries y asociaciones
- Rails 8 con **Solid Queue + Solid Cache + Kamal** cambia el stack por defecto — menos decisiones de infraestructura, más tiempo para el producto
- La arquitectura correcta es la más simple que puedes defender en un code review — no la más sofisticada que puedas imaginar

---

## De dónde vengo

Llevo más de diez años escribiendo Rails. He visto apps de todos los tamaños: desde startups con un modelo `User` y un modelo `Post`, hasta monolitos con 200 modelos y 50K líneas de código. He trabajado con DDD estricto, con "pure Rails way", con hexagonal architecture que nadie en el equipo entendía excepto el que la propuso, y con todo lo que hay en el medio.

Esta no es la arquitectura definitiva. Es la que uso hoy, en 2026, para proyectos que tienen que crecer de forma manejable sin un equipo de arquitectos. Si trabajas en un equipo de 50 devs con requerimientos de compliance, esto probablemente no es suficiente para ti. Para todos los demás: sigue leyendo.

## El modelo: persistencia y relaciones, nada más

El error más común que veo en código Rails: meter lógica de negocio en el modelo porque "es donde vive el dato".

```ruby
# Lo que no quiero en el modelo
class User < ApplicationRecord
  def send_welcome_sequence
    WelcomeMailer.day_1(self).deliver_later
    WelcomeMailer.day_3(self).deliver_later(wait: 3.days)
    SlackNotifier.new_user(self)
    HubspotClient.create_contact(self)
  end

  def calculate_ltv
    orders.completed.sum(:total) * renewal_probability
  end

  def upgrade_to_pro!(payment_token)
    # lógica de Stripe, actualización de plan, emails, jobs...
  end
end

# Lo que sí quiero en el modelo
class User < ApplicationRecord
  belongs_to :company
  has_many :orders
  has_many :subscriptions

  scope :active, -> { where(deactivated_at: nil) }
  scope :pro, -> { where(plan: 'pro') }
  scope :trial_expiring, -> { where(trial_ends_at: 1.week.from_now..) }

  def pro?
    plan == 'pro'
  end

  def trial_expired?
    trial_ends_at&.past?
  end

  def display_name
    full_name.presence || email.split('@').first
  end
end
```

El modelo guarda datos, define relaciones y scopes, y tiene predicados simples (`pro?`, `trial_expired?`). Todo lo que implique hablar con servicios externos, orquestar múltiples modelos, o tener efectos secundarios, sale del modelo.

## Dónde va la lógica de negocio

```
app/
  models/          ← persistencia, relaciones, scopes, predicados simples
  controllers/     ← HTTP: parsea input, llama services, renderiza respuesta
  services/        ← flujos de negocio complejos con efectos secundarios
  queries/         ← queries AR complejas que no pertenecen a un solo modelo
  lib/             ← código que no depende de Rails (parsers, clients, utils)
  jobs/            ← background work
  mailers/         ← emails
  policies/        ← autorización (Pundit)
```

### Services para flujos complejos

```ruby
# app/services/user_upgrade_service.rb
class UserUpgradeService
  def initialize(user, payment_params)
    @user = user
    @payment_params = payment_params
  end

  def call
    charge = process_payment
    activate_pro_features
    notify_user
    track_conversion
    charge
  end

  private

  def process_payment
    Stripe::Subscription.create(
      customer: @user.stripe_customer_id,
      items: [{ price: ENV['STRIPE_PRO_PRICE_ID'] }],
      payment_behavior: 'default_incomplete',
    )
  rescue Stripe::CardError => e
    raise PaymentError, e.message
  end

  def activate_pro_features
    @user.update!(plan: 'pro', upgraded_at: Time.current)
    @user.company.update!(plan: 'pro') if @user.company.on_team_plan?
  end

  def notify_user
    UserMailer.upgrade_confirmation(@user).deliver_later
  end

  def track_conversion
    Analytics.track('user_upgraded', user_id: @user.id, plan: 'pro')
  end
end
```

### Queries para consultas complejas

```ruby
# app/queries/churned_users_query.rb
class ChurnedUsersQuery
  def initialize(relation = User.all)
    @relation = relation
  end

  def call(period: 30.days)
    @relation
      .where(plan: 'pro')
      .where('last_active_at < ?', period.ago)
      .where(churned_at: nil)
      .left_joins(:subscriptions)
      .where(subscriptions: { status: 'canceled' })
      .select('users.*, subscriptions.canceled_at')
  end
end

# Uso
ChurnedUsersQuery.new.call(period: 14.days)
ChurnedUsersQuery.new(company.users).call  # scoped a una company
```

Las queries complejas que involucran múltiples modelos o condiciones complicadas no pertenecen a ningún modelo en particular. La clase `Query` las contiene y las hace testeables en aislamiento.

## Concerns: solo para comportamiento compartido real

Los concerns tienen mala reputación porque se usan para ocultar fat models en lugar de resolverlos. El uso correcto:

```ruby
# BIEN — comportamiento real compartido entre modelos
module Publishable
  extend ActiveSupport::Concern

  included do
    scope :published, -> { where.not(published_at: nil) }
    scope :draft, -> { where(published_at: nil) }
  end

  def published?
    published_at.present?
  end

  def publish!
    update!(published_at: Time.current)
  end

  def unpublish!
    update!(published_at: nil)
  end
end

class Post < ApplicationRecord
  include Publishable
end

class Page < ApplicationRecord
  include Publishable
end

# MAL — concern como escondite de complejidad
module UserBillingConcern
  # 200 líneas de lógica de Stripe que "viven" en el modelo User
  # porque alguien no quería tener un modelo "gordo"
  # → el modelo sigue siendo gordo, solo está fragmentado
end
```

La pregunta para validar un concern: ¿este comportamiento existe en más de un modelo y tiene sentido como unidad cohesiva? Si la respuesta es "no, solo es para dividir el modelo User en partes más pequeñas", es el uso incorrecto.

## El stack de Rails 8 en 2026

Rails 8 llegó con defaults que eliminan decisiones de infraestructura que antes eran obligatorias:

**Solid Queue** (ya lo cubrimos): jobs sin Redis. Para la mayoría de las apps, es suficiente. Solo llegas a Sidekiq si tienes volume real.

**Solid Cache**: caché sin Redis. Mismo argumento — si ya tienes Postgres, tienes caché.

**Kamal**: deploy sin Kubernetes. Un VPS con Docker, zero-downtime deploys, sin la complejidad de k8s.

**Propshaft**: asset pipeline simplificado. Sin Webpack, sin complicaciones.

El resultado en práctica: una app Rails 8 nueva puede desplegarse en un VPS de $20/mes con Kamal, sin Redis, sin Kubernetes, con Postgres manejando tanto la DB como los jobs y el caché. Para una startup en sus primeras etapas, eso es mucho menos overhead operacional.

```yaml
# config/deploy.yml — Kamal en 2026
service: myapp
image: ghcr.io/myuser/myapp

servers:
  web:
    hosts:
      - 123.45.67.89
    options:
      network: myapp

  workers:
    hosts:
      - 123.45.67.89
    cmd: bundle exec rake solid_queue:start

proxy:
  ssl: true
  host: myapp.com

env:
  clear:
    RAILS_ENV: production
    SOLID_QUEUE_IN_PUMA: false
  secret:
    - RAILS_MASTER_KEY
    - DATABASE_URL
```

## La decisión más importante: cuándo NO agregar capas

La tentación de over-engineerear es real. Después de suficiente tiempo leyendo sobre DDD, hexagonal architecture, y CQRS, es fácil querer aplicar todo a una app que tiene 50 users. He hecho esto. Le he explicado a un cliente por qué su CRUD de tareas "necesitaba" un domain layer. No fue mi momento más honesto.

Mi regla práctica: **no agregues una capa de arquitectura hasta que el dolor de no tenerla sea concreto y frecuente**.

- Si el controller tiene 10 líneas y hace una cosa, no necesita un service object
- Si el modelo tiene 5 métodos simples, no necesita concerns
- Si tienes una query que se usa en un solo lugar, ponla ahí directamente

La deuda técnica real no es código simple — es código innecesariamente complejo que alguien tiene que navegar el día que hay un bug en producción.

```ruby
# Esto está perfectamente bien para un CRUD simple
class PostsController < ApplicationController
  def create
    @post = current_user.posts.build(post_params)

    if @post.save
      redirect_to @post, notice: 'Post creado'
    else
      render :new, status: :unprocessable_entity
    end
  end
end
```

No necesita un `CreatePostService`. No hasta que el proceso de crear un post tenga efectos secundarios, lógica condicional compleja, o necesite ser reutilizado en otro contexto.

---

La arquitectura que funciona es la que puedes explicarle a un developer nuevo en 20 minutos y que puedan empezar a contribuir ese mismo día. Rails ya tiene buenos defaults — el trabajo es no alejarse demasiado de ellos sin una razón concreta.

Y en 2026, con Rails 8, esos defaults son mejores que nunca. No los desperdicies tratando de convertir Rails en algo que no es.
