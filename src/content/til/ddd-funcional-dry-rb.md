---
title: "DDD funcional con dry-rb es el mejor sabor de domain modeling en Ruby"
date: 2026-02-03
tags: ["ruby", "architecture", "ddd"]
---

Un coworker que viene de Rails me preguntó por dónde entrar a DDD. Le iba a recomendar el approach clásico — modelos enriquecidos, aggregates, el libro azul de Evans — pero me detuve. "Modelos enriquecidos" en Rails suena demasiado parecido a lo que ya tiene: modelos de ActiveRecord con lógica. La intención es completamente distinta pero el nombre confunde.

Le recomendé el DDD funcional con `dry-rb` directamente. La diferencia se entiende mejor con código:

```ruby
# No es un ActiveRecord — no toca la DB, es inmutable
class Money < Dry::Struct
  attribute :amount, Types::Decimal
  attribute :currency, Types::String.constrained(included_in: %w[MXN USD EUR])
end

# El flujo falla explícitamente con tipos, no con excepciones ni nil
class ProcessPayment
  include Dry::Monads[:result]

  def call(order, payment_method)
    return Failure(:invalid_order) unless order.payable?
    charge = payment_gateway.charge(order.total, payment_method)
    charge.declined? ? Failure(:charge_declined) : Success(charge)
  end
end
```

La lógica de negocio no depende de la DB, se testea sin Rails, y falla de forma explícita. Lo que se pierde es la velocidad de arranque de Rails convencional — vale la pena solo en dominio complejo, no en CRUD.

El libro que lo explica mejor: [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/) de Scott Wlaschin. Está en F# pero `dry-rb` es básicamente la misma filosofía portada a Ruby.
