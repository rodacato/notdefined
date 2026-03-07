---
title: "Caching en Rails: de cache do a Redis y de vuelta"
description: "Rails 8 trae Solid Cache — un backend de caché respaldado por DB sin Redis. Cubrimos el stack completo: fragment caching, Rails.cache, HTTP caching con ETags, Russian doll caching, e invalidación."
pubDate: 2025-12-16
tags: ["ruby", "rails", "performance"]
draft: false
series: "Rails 8 Stack"
seriesOrder: 2
---

## TL;DR

- **Fragment caching** (`cache do`) es el más común y fácil — cachea partes de la vista
- **`Rails.cache`** es la interfaz de bajo nivel — usa el mismo backend configurado
- **HTTP caching** con ETags y `stale?` — el más eficiente porque el response ni siquiera sale del servidor
- **Russian doll caching** — cachés anidados que se invalidan en cascada automáticamente
- **Solid Cache** (Rails 8) usa PostgreSQL/MySQL como backend — suficiente para la mayoría de apps sin Redis
- La invalidación es la parte difícil — los `touch` de ActiveRecord son tu amigo

---

Phil Karlton dijo que hay dos problemas difíciles en computación: invalidar cachés y nombrar cosas. Y tenía razón. Pero Rails lo hace más fácil de lo que parece — especialmente en 2025, donde Rails 8 trae Solid Cache y ya no necesitas Redis solo para cachear. Vamos por capas.

## La jerarquía del caching en Rails

Antes de elegir qué cachear, entiende dónde en el stack puedes hacerlo. La regla: entre más arriba en la jerarquía, más eficiente — pero también más global e inflexible.

```
Browser (cache de HTTP)
  ↓
CDN/Proxy (cache de HTTP/Varnish)
  ↓
Rails (HTTP cache: ETags, Last-Modified)
  ↓
Fragment cache (vistas, parciales)
  ↓
Low-level cache (Rails.cache — objetos, queries)
  ↓
Database (query cache de AR — automático por request)
```

Cada capa es más específica pero más fácil de implementar. Empieza arriba cuando puedas.

## Fragment caching: cachear partes de la vista

```erb
<%# app/views/products/show.html.erb %>

<% cache @product do %>
  <div class="product-card">
    <h1><%= @product.name %></h1>
    <p><%= @product.description %></p>
    <span class="price"><%= number_to_currency(@product.price) %></span>
  </div>
<% end %>
```

La cache key se genera automáticamente usando el cache_key del modelo:

```ruby
@product.cache_key  # => "products/42-20251216120000"
# id + updated_at — si el producto cambia, la key cambia
```

Cuando el producto se actualiza (`update!`), `updated_at` cambia, la key cambia, y el fragmento se regenera automáticamente. Cero invalidación manual.

## Russian doll caching: cachés anidados (el que más impresiona en code reviews)

El patrón más poderoso: cachés dentro de cachés donde la invalidación se propaga en cascada. El nombre viene de las muñecas rusas que se contienen entre sí — misma idea, más elegante.

```erb
<%# Lista de productos %>
<% cache ['v1', @products] do %>
  <%= render @products %>  <%# Renderiza el partial de cada producto %>
<% end %>

<%# El partial de cada producto — también cacheado %>
<%# app/views/products/_product.html.erb %>
<% cache ['v1', product] do %>
  <div class="product">
    <%= product.name %>
    <% cache ['v1', product, product.category] do %>
      <%= product.category.name %>
    <% end %>
  </div>
<% end %>
```

Si la categoría cambia, solo se invalida el fragmento interno (product + category). El fragmento externo (product solo) sigue en cache. Si el producto cambia, se invalida el fragmento del producto y el padre (lista) también.

Para que el padre sepa que un hijo cambió, usa `touch`:

```ruby
class Product < ApplicationRecord
  belongs_to :category, touch: true
  # Cuando el producto se actualiza, también actualiza category.updated_at
  # → la cache key de category cambia → los cachés que usan category se invalidan
end

class Review < ApplicationRecord
  belongs_to :product, touch: true
  # Nueva reseña → product.updated_at cambia → cache del producto se invalida
end
```

## `Rails.cache`: caché de bajo nivel

Para cachear objetos arbitrarios (resultados de queries costosos, respuestas de APIs externas):

```ruby
# Fetch con bloque — lee si existe, ejecuta y guarda si no
expensive_data = Rails.cache.fetch('homepage_stats', expires_in: 1.hour) do
  {
    total_users: User.count,
    active_subscriptions: Subscription.active.count,
    revenue_this_month: Order.this_month.sum(:total),
  }
end

# Write y read manual
Rails.cache.write('last_deploy', Time.current, expires_in: 24.hours)
Rails.cache.read('last_deploy')

# Delete manual (cuando necesitas invalidar explícitamente)
Rails.cache.delete('homepage_stats')

# Delete por patrón (solo algunos backends lo soportan)
Rails.cache.delete_matched('user_*')
```

```ruby
# En el model — cachear queries costosas
class Product < ApplicationRecord
  def self.featured_for_homepage
    Rails.cache.fetch('featured_products', expires_in: 30.minutes) do
      where(featured: true)
        .includes(:category, :images)
        .order(sales_count: :desc)
        .limit(8)
        .to_a  # importante: to_a para materializar el resultado
    end
  end
end
```

El `to_a` al final es crítico — sin él, estarías cacheando un `ActiveRecord::Relation` que se re-ejecuta al accederla, no los resultados.

## HTTP caching con ETags

El más eficiente: el response ni siquiera se serializa si el cliente tiene la versión actual.

```ruby
class ProductsController < ApplicationController
  def show
    @product = Product.find(params[:id])

    # Si el cliente tiene la versión actual, responde 304 Not Modified
    # sin ejecutar el bloque
    if stale?(@product)
      render :show  # solo se ejecuta si el producto cambió
    end
  end

  # Para múltiples objetos
  def index
    @products = Product.all
    fresh_when(@products)
  end

  # Control total sobre el ETag y Last-Modified
  def dashboard
    @data = DashboardData.current

    if stale?(etag: @data.etag, last_modified: @data.updated_at, public: true)
      render :dashboard
    end
  end
end
```

```ruby
# HTTP caching + fragment caching juntos — la combinación ideal
def show
  @product = Product.find(params[:id])

  if stale?(@product)
    respond_to do |format|
      format.html  # usa fragment caching en la vista
      format.json { render json: @product }
    end
  end
end
```

Para páginas públicas (no autenticadas), agrega `public: true` — permite que CDNs y proxies cacheen el response también.

## Solid Cache: Redis opcional en Rails 8

Rails 8 introdujo Solid Cache como backend por defecto. Usa tu base de datos como store de caché:

```ruby
# config/environments/production.rb
# Rails 8 default — sin Redis
config.cache_store = :solid_cache_store

# config/cache.yml (Rails 8)
default: &default
  database: cache
  store_options:
    max_age: 1.week.to_i
    max_size: 256.megabytes

production:
  <<: *default
  max_size: 512.megabytes
```

Solid Cache usa una tabla `solid_cache_entries` con expiración automática. Para la mayoría de las apps, es equivalente a Redis Cache en funcionalidad con zero configuración adicional.

Cuándo seguir usando Redis como cache:
- Necesitas `delete_matched` con patrones complejos
- Tienes millones de entries con alta rotación (Solid Cache puede ser más lento con writes masivos)
- Ya tienes Redis por otros motivos (Sidekiq) y no tiene sentido quitar esa dependencia

## La invalidación: siempre "la parte difícil"

```ruby
# Invalidación por tiempo (la más simple)
Rails.cache.fetch('expensive_count', expires_in: 5.minutes) { User.count }

# Invalidación por evento (más precisa)
class Order < ApplicationRecord
  after_create :invalidate_stats_cache
  after_update :invalidate_stats_cache

  private

  def invalidate_stats_cache
    Rails.cache.delete('homepage_stats')
    Rails.cache.delete('revenue_this_month')
  end
end

# Invalidación con versioning (más segura para refactors)
# Cambia 'v1' a 'v2' en todos los cache keys cuando cambias la estructura
<% cache ['v2', @product] do %>
  <%# nueva estructura %>
<% end %>
```

La estrategia más robusta para fragment caching: confía en `updated_at` y `touch`. Para low-level cache, usa `expires_in` generoso + invalidación en callbacks. Para datos que cambian frecuentemente, evalúa si el cache realmente ayuda — si la invalidación es muy frecuente, el hit rate será bajo y el overhead puede superar el beneficio.

## Tabla de herramientas por escenario

| Escenario | Herramienta | Beneficio |
|-----------|-------------|-----------|
| Partes de vistas que cambian poco | Fragment cache | 5x–50x más rápido el render |
| Queries costosas que se repiten | `Rails.cache.fetch` | Evita DB queries |
| APIs externas (weather, precios) | `Rails.cache.fetch` + TTL | Reduce llamadas externas |
| Páginas públicas completas | HTTP caching + ETags | 0 bytes transferidos si no cambió |
| Show/index con datos estables | `fresh_when` + CDN | Escala a millones sin DB |
| Todo en producción simple | Solid Cache | Sin dependencias extra |

---

El caching en Rails es uno de esos temas donde la teoría es simple y los detalles son complicados — Phil Karlton tenía razón. Pero si usas `touch` correctamente y confías en los cache keys automáticos de ActiveRecord, el 80% de los casos de invalidación se resuelven solos. El 20% restante son los cachés de bajo nivel con estrategia explícita, y para esos `expires_in` + callback de invalidación es casi siempre suficiente.

La trampa no es implementar el caching — es recordar limpiar el caché cuando el dato cambia. Úsa `touch`, úsa Russian dolls, y duerme tranquilo.
