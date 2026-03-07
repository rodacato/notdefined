---
title: "El problema N+1 en ActiveRecord: tres formas de resolverlo, una de prevenirlo"
description: "Todos conocen includes. Pero hay diferencias reales entre includes, preload, y eager_load, y scopes que crean N+1 para quien los usa sin saberlo. Acá está el mapa completo."
pubDate: 2025-09-23
tags: ["ruby", "rails", "activerecord", "performance"]
draft: false
---

## TL;DR

- **`includes`** elige automáticamente entre `preload` y `eager_load` — funciona en la mayoría de casos
- **`preload`** siempre hace queries separadas (2 queries) — mejor cuando no filtras por la asociación
- **`eager_load`** siempre hace JOIN — necesario cuando filtras por campos de la asociación en `where`
- **Bullet gem** detecta N+1 en desarrollo pero tiene falsos positivos — úsala, pero no la sigas ciegamente
- **La prevención real**: profiling en desarrollo antes de que llegue a producción — `rack-mini-profiler` o logs de queries SQL

---

El N+1 viene gratis con el kit del dev Rails. Te lo enseñan (o lo descubres solo cuando la app se pone lenta), lo arreglas con `includes`, y piensas que ya quedó. Y sí, quedó... hasta que alguien escribe un scope con `.map` dentro, o hasta que le agregas un `where` a una asociación y `includes` silenciosamente cambia de comportamiento. Este post es sobre esos casos.

## El N+1 clásico

El problema lo conoces de memoria, pero lo revisamos rápido:

```ruby
# En el controller
@posts = Post.all

# En la vista
@posts.each do |post|
  puts post.author.name  # ← query por cada post
end
```

Con 50 posts: 1 query para los posts + 50 queries para los autores = 51 queries. N+1.

La solución que todos conocen:

```ruby
@posts = Post.includes(:author).all
# 2 queries: SELECT posts, SELECT users WHERE id IN (...)
```

Pero hay tres formas de hacer eager loading, y no son intercambiables.

## `includes` vs `preload` vs `eager_load`

### `preload` — siempre queries separadas

```ruby
Post.preload(:author)
# => SELECT * FROM posts
# => SELECT * FROM users WHERE id IN (1, 2, 3, ...)
```

Dos queries, siempre. Funciona bien para asociaciones simples. El problema: no puedes filtrar por campos del autor en el mismo query:

```ruby
# Esto NO funciona con preload
Post.preload(:author).where('authors.verified = true')
# => ActiveRecord::StatementInvalid: column "authors.verified" does not exist
```

### `eager_load` — siempre LEFT OUTER JOIN

```ruby
Post.eager_load(:author)
# => SELECT posts.*, users.* FROM posts
#    LEFT OUTER JOIN users ON users.id = posts.author_id
```

Un solo query con JOIN. Necesario cuando filtras por la asociación:

```ruby
# Esto SÍ funciona con eager_load
Post.eager_load(:author).where('users.verified = true')
# => SELECT posts.*, users.* FROM posts
#    LEFT OUTER JOIN users ON users.id = posts.author_id
#    WHERE users.verified = true
```

El costo: si hay muchos registros o la asociación tiene muchas columnas, el JOIN puede ser más pesado que dos queries separadas.

### `includes` — elige automáticamente

```ruby
Post.includes(:author)
# → usa preload por defecto (2 queries separadas)

Post.includes(:author).where('users.verified = true')
# → detecta referencia a la tabla users → cambia a eager_load (JOIN)
```

`includes` es inteligente: revisa si el `where` referencia tablas de la asociación y decide qué usar. Para el 90% de los casos, `includes` es la elección correcta.

## El N+1 que aparece en scopes — el que te muerde de noche

Este es el más traicionero porque está oculto. Lo escribes una vez, parece inocente, y cada controller que lo usa sin saberlo te genera N queries extra:

```ruby
class Post < ApplicationRecord
  belongs_to :author
  has_many :comments

  # Este scope crea N+1 para cualquiera que lo use sin saberlo
  def self.with_comment_count
    all.map { |post| post.comments.count }
    # 1 query para posts + 1 query por post para el count
  end
end

# En el controller — parece inocente
@posts = Post.published.with_comment_count
```

El fix: hacer el trabajo en SQL, no en Ruby:

```ruby
def self.with_comment_count
  left_joins(:comments)
    .group('posts.id')
    .select('posts.*, COUNT(comments.id) AS comments_count')
end

# Ahora posts tienen comments_count como atributo virtual
@posts.first.comments_count  # => 12 — sin query extra
```

## La gem Bullet: útil pero no perfecta

Bullet detecta N+1 automáticamente en desarrollo:

```ruby
# Gemfile
gem 'bullet', group: :development

# config/environments/development.rb
config.after_initialize do
  Bullet.enable = true
  Bullet.alert = true        # alerta en browser
  Bullet.rails_logger = true # log en Rails logs
  Bullet.add_footer = true   # footer en cada página
end
```

Con Bullet activo, el N+1 aparece en logs:

```
USE eager loading detected
  Post => [:author]
  Add to your query: .includes([:author])
```

Pero tiene falsos positivos. El más común:

```ruby
# Bullet grita N+1 aquí...
@user = User.find(params[:id])
@user.posts.count  # Un count SQL, no un N+1 real

# ...pero es un solo query:
# SELECT COUNT(*) FROM posts WHERE user_id = ?
```

Bullet no distingue bien entre `user.posts.count` (un query SQL) y iterar sobre `user.posts` para hacer algo con cada uno (N+1 real). Úsala como guía, no como árbitro final.

## `strict_loading`: N+1 como error en producción

Rails 6.1 introdujo `strict_loading` — lanza un error si intentas acceder a una asociación no cargada:

```ruby
# A nivel de modelo — todas las asociaciones requieren eager loading
class Post < ApplicationRecord
  self.strict_loading_by_default = true
end

# O por query
@posts = Post.strict_loading.all

@posts.first.author.name
# => ActiveRecord::StrictLoadingViolationError:
#    `Post` is marked for strict_loading. The `author` association named
#    cannot be lazily loaded.
```

Úsalo en staging o en un porcentaje del tráfico de producción para detectar N+1 que Bullet no ve en desarrollo. No lo actives en producción al 100% — puede romper funcionalidad inesperadamente si hay N+1 en paths poco testeados.

## El caso de las asociaciones nested

```ruby
# Eager loading de múltiples niveles
@posts = Post.includes(comments: :author)
# => posts con comments, cada comment con su author
# => 3 queries: posts, comments IN (...), users IN (...)

# Múltiples asociaciones en paralelo
@posts = Post.includes(:author, :tags, comments: [:author, :reactions])
# => posts → authors, tags, comments → comment authors, reactions
```

Para más de dos niveles de nesting, verifica el query plan — a veces es más eficiente hacer queries separadas que un JOIN masivo.

## La prevención que realmente funciona

`rack-mini-profiler` muestra el número de queries en cada request durante desarrollo:

```ruby
# Gemfile
gem 'rack-mini-profiler', group: :development
gem 'flamegraph', group: :development    # para profiling de CPU
gem 'memory_profiler', group: :development
```

```ruby
# config/initializers/rack_mini_profiler.rb
if Rails.env.development?
  Rack::MiniProfiler.config.position = 'bottom-right'
end
```

Aparece una badge en el browser con el número de queries y el tiempo de cada uno. Si ves "47 queries" en una página que debería hacer 3, tienes un N+1.

La diferencia con Bullet: `rack-mini-profiler` te muestra el estado real de cada request, incluyendo paths que no tienes en tests. Es passive monitoring — siempre está ahí mientras desarrollas.

```ruby
# También puedes agregar al log de Rails cuántos queries hace cada request
# config/environments/development.rb
config.log_level = :debug  # logea cada query SQL
```

---

N+1 no es un bug, es un patrón que aparece naturalmente cuando no pensás en eager loading desde el inicio. La clave es detectarlo en desarrollo, no en producción a las 3am. `rack-mini-profiler` + SQL logs + Bullet para alertas automáticas te da suficiente cobertura para el 95% de los casos.

El 5% restante son los scopes que escribiste tú mismo sin darte cuenta. Ya te la sabes.
