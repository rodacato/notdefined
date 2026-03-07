---
title: "ActiveRecord scopes vs class methods: cuándo usar cada uno"
description: "Parecen intercambiables hasta que no lo son. La diferencia entre scope y class method no es solo de estilo — afecta cómo se comporta el encadenamiento y qué pasa cuando el resultado es nil."
pubDate: 2025-04-22
tags: ["ruby", "rails", "activerecord"]
draft: false
---

## TL;DR

- Los **`scope`** siempre devuelven una `ActiveRecord::Relation`, incluso cuando el bloque devuelve `nil` — los **class methods** no
- Esa diferencia importa cuando **encadenas scopes**: un `nil` en medio de la cadena rompe todo
- Usa **scopes para filtros** (`active`, `recent`, `by_status`) — son la herramienta correcta para eso
- Usa **class methods cuando la lógica hace algo más** que filtrar — cálculos, creación de objetos, interacción con servicios externos
- Mezclarlos silenciosamente puede romperte el encadenamiento sin errores obvios

---

Si alguna vez tuviste un `NoMethodError: undefined method 'paid' for nil:NilClass` en producción y tardaste 20 minutos en entender por qué — este post es para ti. La culpa probablemente fue un class method condicional devolviendo `nil` sin que nadie lo esperara.

## La diferencia que importa: nil vs Relation

En la superficie, esto:

```ruby
class User < ApplicationRecord
  scope :active, -> { where(active: true) }
end
```

y esto:

```ruby
class User < ApplicationRecord
  def self.active
    where(active: true)
  end
end
```

parecen equivalentes. Y para el 90% de los casos, lo son:

```ruby
User.active          # ambos devuelven los mismos registros
User.active.count    # ambos funcionan igual
```

El 10% que importa está en qué pasa cuando el bloque del scope devuelve `nil`:

```ruby
class Order < ApplicationRecord
  scope :recent, -> { where('created_at > ?', 30.days.ago) if some_condition? }
  # Si some_condition? es false, el bloque devuelve nil
end

# Con scope: safe
Order.recent.paid.count
# => funciona — scope convierte nil en current_scope (no filtra nada)

# Con class method: kaboom
def self.recent
  where('created_at > ?', 30.days.ago) if some_condition?
  # Si some_condition? es false, devuelve nil
end

Order.recent.paid.count
# => NoMethodError: undefined method 'paid' for nil:NilClass
```

Los scopes tienen un safety net incorporado: si el bloque devuelve `nil`, Rails lo ignora y devuelve la relación actual. Un class method que devuelve `nil` rompe cualquier cadena que venga después.

## Cuándo esto te muerde en la práctica

El patrón típico donde esto duele es en scopes condicionales con parámetros:

```ruby
class Product < ApplicationRecord
  # Scope — safe para encadenar
  scope :by_category, ->(category) {
    where(category: category) if category.present?
  }

  # Class method — peligroso si se encadena
  def self.by_category(category)
    where(category: category) if category.present?
    # Si category es nil, devuelve nil
  end
end

# En el controller
@products = Product
  .by_category(params[:category])  # puede ser nil
  .active
  .paginate(page: params[:page])

# Con scope: si params[:category] es nil → Product.active.paginate(...)
# Con class method: si params[:category] es nil → nil.active → 💥
```

## Regla clara: scopes para filtrar, class methods para hacer

**Usa `scope` cuando:**
- Estás filtrando registros con condiciones WHERE
- El scope puede ser parte de una cadena
- El resultado puede o no aplicarse dependiendo de condiciones

```ruby
class Article < ApplicationRecord
  scope :published, -> { where(published: true) }
  scope :by_author, ->(author) { where(author: author) if author }
  scope :recent, -> { order(created_at: :desc) }
  scope :featured, -> { where(featured: true).limit(5) }
end

# Estos scopes se pueden encadenar libremente:
Article.published.by_author(params[:author]).recent
```

**Usa `def self.*` cuando:**
- La lógica va más allá de filtrar (crea objetos, llama servicios, hace cálculos)
- El método tiene efectos secundarios
- El resultado no necesita ser encadenable

```ruby
class User < ApplicationRecord
  # class method — hace "trabajo", no es un filtro
  def self.create_from_oauth(provider, uid, email)
    find_or_create_by(email: email) do |user|
      user.provider = provider
      user.uid = uid
      user.name = email.split('@').first
    end
  end

  # class method — hace un cálculo, no devuelve Relation
  def self.monthly_signups_report
    group("DATE_TRUNC('month', created_at)")
      .count
      .transform_keys { |k| k.strftime('%B %Y') }
  end
end
```

## El caso de los default scopes: mejor no

Una trampa clásica: usar scopes con `default_scope`:

```ruby
class Article < ApplicationRecord
  default_scope { where(deleted_at: nil) }  # soft delete
end

Article.all         # => solo los no eliminados ✓
Article.unscoped    # => todos, incluyendo eliminados ✓

# El problema: default_scope se aplica también en joins y asociaciones
class User < ApplicationRecord
  has_many :articles
end

user.articles          # => solo artículos no eliminados del user
user.articles.unscoped # => TODOS los artículos de TODOS los users 💥
                       # unscoped elimina TODOS los scopes, incluyendo el de user_id
```

`default_scope` es casi siempre un error. Para soft delete, usa la gema `acts_as_paranoid` o `discard` que manejan estos edge cases correctamente.

## Tabla de referencia rápida

| Situación | Usa | Por qué |
|-----------|-----|---------|
| Filtro simple: `where`, `order`, `limit` | `scope` | Encadenable, safe con nil |
| Filtro condicional (puede no aplicarse) | `scope` | El nil safety es crítico aquí |
| Crear/modificar registros | `class method` | No es un filtro |
| Cálculos que devuelven hash/array | `class method` | No devuelve Relation |
| Lógica que llama servicios externos | `class method` | Tiene efectos secundarios |
| Filtro con parámetros | `scope` con lambda | Más legible, encadenable |

## Un ejemplo que une todo

En un proyecto de e-commerce, el modelo `Order` con ambos correctamente:

```ruby
class Order < ApplicationRecord
  # Scopes — todos filtrables y encadenables
  scope :pending,    -> { where(status: 'pending') }
  scope :completed,  -> { where(status: 'completed') }
  scope :by_user,    ->(user) { where(user: user) if user }
  scope :this_month, -> { where(created_at: Time.current.beginning_of_month..) }
  scope :over,       ->(amount) { where('total > ?', amount) if amount }

  # Class methods — hacen "trabajo"
  def self.revenue_summary(period: :month)
    completed
      .where(completed_at: period_range(period))
      .group("DATE_TRUNC('day', completed_at)")
      .sum(:total)
  end

  def self.process_pending_exports
    pending.find_each do |order|
      ExportService.new(order).call
    end
  end

  private_class_method def self.period_range(period)
    case period
    when :month then Time.current.beginning_of_month..
    when :week  then Time.current.beginning_of_week..
    else raise ArgumentError, "Unknown period: #{period}"
    end
  end
end

# En el controller — todo encadenable y seguro:
@orders = Order.pending.by_user(current_user).this_month.over(params[:min_amount])
```

---

La regla es simple: filtros → `scope`. Lógica que hace trabajo → `class method`. Esa distinción te ahorra el `NoMethodError` en producción a las 3am.

Y si alguien en tu equipo te dice que son lo mismo: muéstrale el ejemplo del `params[:category]` y deja que el 💥 hable por sí solo.
