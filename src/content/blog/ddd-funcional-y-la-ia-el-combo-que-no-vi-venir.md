---
title: "DDD funcional + IA: el combo que no vi venir"
description: "El principal contra del approach funcional + DDD siempre fue el boilerplate. Resulta que es justo el código que los LLMs escriben sin enredarse. Por qué DDD funcional con dry-rb es terreno fértil para trabajar con IA, código lado a lado vs ActiveRecord, y los costos que el approach sigue teniendo aunque la IA se haga cargo del andamio."
pubDate: 2026-05-23
tags: ["ddd", "architecture", "ruby", "functional", "ai"]
draft: true
series: "DDD funcional"
seriesOrder: 2
---

## TL;DR

- El **boilerplate** del approach funcional siempre fue el contra — hoy es justo lo que la IA escupe sin enredarse
- **ActiveRecord + DDD OOP** es terreno minado para la IA: callbacks que disparan side effects ocultos y estado mutable por todas partes
- **dry-rb + actions** es terreno fértil: cada paso tiene contrato explícito y los errores se devuelven como datos en vez de excepciones
- La IA hace bien la parte mecánica; **tú haces la parte que importa** (modelar el dominio y nombrar las cosas)
- El approach **sigue costando entrar** — pero ahora el costo se paga en cabeza, no en horas tecleando andamio

---

En la [parte 1](/blog/de-rails-accidental-a-ddd-funcional-tres-paradas-un-modelo-mental) conté cómo pasé de Clean Architecture con chispitas de DDD en Pay By Group, a DDD funcional con dry-rb en Invoy y Monato. La línea con la que cerré era una corazonada: **controlas estas piezas de lego una a la vez, y la IA te da alas**.

Esta parte 2 es la corazonada desarrollada. Por qué pasa, qué hace bien la IA con este approach, qué sigue siendo trabajo tuyo, y cuánto cuesta el approach aunque tengas a Claude o GPT de copiloto.

## El problema real con código generado por IA

No es que la IA escriba mal. Escribe sorprendentemente bien para tareas acotadas. El pedo es otro: **escribe mucho, y rápido**.

Y todo ese código generado es código que vas a mantener. Alguien lo va a leer en seis meses cuando un bug aparezca en prod. Lo van a refactorizar cuando el negocio cambie. Y va a pasar por code reviews donde alguien tiene que decidir si está bien o solo se ve bien.

La pregunta de fondo no es "¿la IA puede generar esto?". La respuesta es casi siempre sí. La pregunta es: **¿el código que genera es revisable, extensible, y resistente a regresiones?**

Eso depende menos del modelo y más del shape del codebase donde lo metes.

## Por qué ActiveRecord + DDD OOP es terreno minado

Mira esta `Subscription` que cualquiera de nosotros ha escrito o leído mil veces:

```ruby
class Subscription < ApplicationRecord
  belongs_to :user
  has_many :invoices

  enum status: { active: 0, paused: 1, cancelled: 2 }

  after_update :send_status_change_email, if: :saved_change_to_status?
  after_create :generate_first_invoice

  def renew!
    raise InvalidState unless active?

    transaction do
      invoice = invoices.create!(amount: price, due_date: 30.days.from_now)
      ChargeCardService.new(user, invoice).call
      update!(renewed_at: Time.current, next_renewal_at: 30.days.from_now)
      AnalyticsTracker.track(self, 'renewed')
    end
  rescue StandardError => e
    update!(status: :paused, paused_reason: e.message)
    raise
  end
end
```

¿Qué tiene? Lo de siempre. Persistencia, asociaciones, callbacks, business logic, side effects, analytics, manejo de errores. Todo en el mismo archivo.

Ahora imagina que le pides a la IA: *"agrega soporte para Strong Customer Authentication: si el banco requiere desafío 3DS, no cobres todavía — devuelve una URL de challenge para que el frontend lo maneje."*

¿Qué hace la IA? Tiene que decidir:

- ¿Modifica `renew!`?
- ¿Agrega un callback nuevo?
- ¿Toca `ChargeCardService`?
- ¿Y el flujo de errores? ¿Lanza una excepción o devuelve algo?
- ¿Qué pasa con `update!(status: :paused...)` del rescue? ¿Aplica si solo es un challenge?

El LLM va a generar algo. Va a funcionar en el happy path. Pero los **invariantes implícitos** del modelo (el rescue marca como paused, el callback dispara email cuando cambia status, el `update!` puede disparar otro callback) son **terreno donde el LLM se enreda**. Y donde un humano revisando también se va a enredar.

El código sale, el test pasa en CI, y a la primera semana en prod descubres que el callback de email se está disparando con un mensaje raro porque el flujo de SCA pasaba por un estado intermedio.

Este no es un problema de la IA. Es un problema del shape del código.

## Por qué dry-rb + actions es terreno fértil

La misma operación, modelada con dry-rb:

```ruby
# domain/values/money.rb
class Money < Dry::Struct
  attribute :cents, Types::Integer
  attribute :currency, Types::String.enum('USD', 'MXN')
end

# domain/entities/subscription.rb
class Subscription < Dry::Struct
  attribute :id, Types::UUID
  attribute :user_id, Types::UUID
  attribute :status, Types::String.enum('active', 'paused', 'cancelled')
  attribute :price, Money
  attribute :next_renewal_at, Types::Time
end
```

```ruby
# application/actions/renew_subscription.rb
class RenewSubscription
  include Dry::Monads[:result, :do]

  def initialize(subscription_repo:, charge_card:, event_bus:)
    @subscription_repo = subscription_repo
    @charge_card = charge_card
    @event_bus = event_bus
  end

  def call(subscription_id:)
    subscription = yield fetch_active(subscription_id)
    charge      = yield @charge_card.call(subscription)
    renewed     = yield mark_renewed(subscription)
    yield publish_renewed(renewed)

    Success(renewed)
  end

  private

  def fetch_active(id)
    subscription = @subscription_repo.find(id)
    return Failure(:subscription_not_found) unless subscription
    return Failure(:subscription_not_active) unless subscription.status == 'active'

    Success(subscription)
  end

  def mark_renewed(subscription)
    renewed = Subscription.new(**subscription.to_h, next_renewal_at: 30.days.from_now)
    @subscription_repo.persist(renewed)

    Success(renewed)
  end

  def publish_renewed(subscription)
    @event_bus.publish(SubscriptionRenewed.new(subscription_id: subscription.id))

    Success(:published)
  end
end
```

Ahora cada paso es explícito. Tiene un contrato — entra algo, sale `Success` o `Failure`. No hay callbacks ocultos. No hay estado mutable. Las dependencias (`subscription_repo`, `charge_card`, `event_bus`) están inyectadas, no instanciadas adentro.

Le pides al LLM lo mismo: *"agrega soporte para SCA"*. Ahora el LLM ve un shape distinto. Ve que `call` es una pipeline de `yield`. Ve que cada step devuelve `Result`. Ve que `@charge_card` es una dependencia abstracta.

Lo que va a generar:

```ruby
def call(subscription_id:)
  subscription = yield fetch_active(subscription_id)
  charge_result = yield @charge_card.call(subscription)

  return Success(sca_challenge: charge_result.challenge_url) if charge_result.requires_sca?

  renewed = yield mark_renewed(subscription)
  yield publish_renewed(renewed)

  Success(renewed)
end
```

O — más limpio aún — una variante con tipo de resultado nuevo:

```ruby
return Failure([:sca_required, charge_result.challenge_url]) if charge_result.requires_sca?
```

El cambio es **local al action**, no toca otros archivos, no rompe los pasos anteriores, y el lector ve el flujo completo en una pantalla. El LLM no tiene que inferir cómo interactúa con un callback porque no hay callbacks. No tiene que recordar que `update!` puede disparar otro side effect porque no hay `update!`.

## Mismo cambio, dos resultados

Pongamos las dos versiones del cambio lado a lado:

| Aspecto | AR + DDD OOP | dry-rb + actions |
|---|---|---|
| Dónde edita el LLM | Posiblemente 2-3 archivos (modelo, service, callback) | Un archivo, un método |
| Riesgo de romper algo existente | Alto — callbacks pueden disparar cosas inesperadas | Bajo — los steps son aislados |
| Qué tan revisable es el diff | Diff esparcido, hay que jumpear archivos | Diff localizado, una sola pieza |
| Tests que tienes que actualizar | Tests del modelo, del service, integration | Test del action, solo |
| Tiempo para entender el cambio en code review | 10-15 minutos saltando archivos | 2-3 minutos en un archivo |

La diferencia se nota más cuando hay **veinte cambios como este por semana**. Que es donde estamos hoy.

## Lo que la IA hace bien con este approach

El boilerplate de dry-rb es exactamente lo que los LLMs escriben sin enredarse:

- Definir un `Dry::Struct` con sus tipos — predecible y mecánico
- Escribir un action con `include Dry::Monads[:result, :do]` y la pipeline de `yield` — patrón claro
- Implementar un repository con métodos explícitos (`find`, `persist`, `delete_by_id`) — shape estándar
- Agregar un nuevo case al `Result` de un step existente — extensión local

Cuando el shape del codebase es consistente, le das al LLM dos o tres ejemplos del patrón y arma el resto. No te bombardea con preguntas. No te ofrece "tres formas distintas, ¿cuál prefieres?". Sale algo coherente al primer intento.

Y lo importante: el cambio **se queda en su lugar**. El LLM no tiene que decidir si tocar un callback en otra clase porque no hay callbacks. No tiene que rastrear side effects entre archivos porque el side effect es explícito en un step del action.

## Lo que la IA NO hace bien (todavía)

Esto es lo que sigue requiriendo tu cabeza. La IA no resuelve:

- **Nombrar bien**. Decidir si una operación se llama `RenewSubscription` o `BillSubscription` o `ProcessRecurringCharge` es decisión humana. Si el equipo lo llama distinto que producto, tú vas a tener que arbitrar — la IA va a aceptar cualquier nombre que le des.
- **Decidir qué es entity vs value object**. Una `Address` con `street`, `city`, `zip` ¿es entity (tiene identidad) o value object (igualdad por valor)? Depende del dominio. La IA no sabe.
- **Decidir dónde corta un action**. ¿`RenewSubscription` incluye enviar el email de renovación o eso es responsabilidad de un subscriber del evento `SubscriptionRenewed`? Decisión arquitectónica. La IA propone, tú decides.
- **Cuándo NO aplicar la disciplina**. Un endpoint que solo lista cosas no necesita action + domain service + repository + DTO. La IA por default va a aplicar todo el patrón. Tú tienes que decir "para este caso no, esto es CRUD, un módulo con un método".

La IA es buena escribiendo el patrón. Tú sigues siendo necesario para decidir cuándo aplicarlo, dónde aplicarlo, y cómo nombrarlo.

## Lo que cuesta el approach (sigue costando, aunque menos)

No quiero pintar esto como gratis. dry-rb sigue teniendo fricciones reales que la IA no resuelve:

- **Documentación dispersa**. El sitio oficial mejoró, pero sigues googleando issues de GitHub para casos no obvios. La IA puede ayudarte a navegar pero no inventa la doc que no existe.
- **Runtime types, no compile-time**. dry-types valida en runtime — no es Haskell, no es F#. Si pasas un valor mal tipado, te enteras en producción, no en CI. Esto es honestidad técnica importante: "make illegal states unrepresentable" (la frase clave de Wlaschin) **no aplica con la misma fuerza** en Ruby.
- **Curva de aprendizaje real**. Para un dev que llegó con `User.create!`, ver un action con `yield` y `Result` por primera vez es shock. La IA puede explicar el código, pero el dev tiene que internalizar el modelo mental.
- **El equipo necesita disciplina**. Si el equipo no entiende por qué los lugares importan, va a meter lógica en `application/actions/` que debió ir en `domain/services/`. La IA no detecta esto sola — un code review humano sí.

El approach sigue costando entrar. Lo que cambió con la IA es **dónde se paga el costo**: antes pagabas en horas tecleando andamio, ahora pagas en horas pensando el modelo. Eso es mejor trade.

## Por qué el combo se siente perfecto

A mi forma de verlo: el approach funcional siempre tuvo dos críticas legítimas. Una era el boilerplate. Otra era la curva de entrada.

La IA absorbe la primera. El boilerplate ya no es un costo real — la IA lo escribe, tú lo revisas. Lo que queda es la curva de entrada, que **siempre fue lo importante**: entender boundaries, entender ubiquitous language, entender qué cosa va dónde.

Y resulta que esa parte — la que la IA no puede absorber — es **justo lo que un humano debería estar haciendo con su tiempo**.

---

DDD funcional no fue diseñado para la IA. Wlaschin escribió "Domain Modeling Made Functional" en 2018, cuando los LLMs apenas balbuceaban código. Pero el shape del approach — funciones puras, types explícitos, dependencias inyectadas, results en vez de excepciones — resulta ser el shape que la IA necesita para no enredarse.

Wlaschin no escribió esto pensando en LLMs. Yo no adopté dry-rb pensando en LLMs. Y aquí estamos.
