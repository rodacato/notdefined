---
title: "Debugging memory leaks en Ruby sin perder la cabeza"
description: "El memory bloat en Rails llega despacio y de repente tus pods están reiniciándose cada hora. Acá está el toolkit práctico para encontrar y matar los leaks."
pubDate: 2025-03-18
tags: ["ruby", "performance", "debugging"]
draft: false
---

## TL;DR

- **`derailed_benchmarks`** para medir baseline de memoria al arrancar y bajo carga
- **`memory_profiler`** para análisis por request — te dice exactamente qué está allocando
- **ObjectSpace** para snapshots en producción sin reiniciar el proceso
- Los sospechosos habituales: **memoización en class-level**, **string mutation**, **AR result sets grandes sin scope**
- La estrategia: medir primero, siempre. No adivines dónde está el leak.

---

## El problema que llega en silencio

Lanzas tu app Rails. Todo funciona. Un mes después, tus pods de Kubernetes están usando 800MB cada uno cuando antes usaban 300MB. Dos meses después, el proceso se reinicia solo cada 6 horas — y nadie lo nota porque el reinicio automático "lo arregla". Bienvenido al mundo de los memory leaks en Ruby, donde el síntoma desaparece solo el tiempo suficiente para que lo ignores.

El punto donde la mayoría se rinde: abren el profiler, ven "ActiveRecord" como el culpable número uno, se encojen de hombros y aumentan el límite de memoria del pod. Solución válida. Solución cara. Solución que vuelve a ser insuficiente en dos meses.

La buena noticia: Ruby tiene herramientas decentes para encontrarlos. La mala: requieren que las uses en orden, no al azar. Vamos a ver el toolkit de mayor a menor granularidad.

## Paso 1: Establece un baseline con derailed_benchmarks

Antes de buscar el leak, necesitas saber cuánta memoria usa tu app normalmente. `derailed_benchmarks` te da eso sin complicaciones:

```sh
# Gemfile (solo en development/test)
gem 'derailed_benchmarks', group: :development

bundle install
```

```sh
# Cuánta memoria usa tu app al arrancar (sin requests)
bundle exec derailed bundle:mem

# Cuánta memoria usa al cargar todas las rutas
bundle exec derailed bundle:objects

# Cuánta memoria usa bajo carga real (simula requests)
bundle exec derailed perf:mem
```

El output de `bundle:mem` te muestra qué gemas contribuyen más al footprint inicial:

```
TOP: 54.4492 MiB
  mail: 7.4297 MiB
  active_record: 4.2891 MiB
  action_view: 3.8203 MiB
  sprockets: 3.1289 MiB
```

Si `mail` está usando 7MB solo por estar cargada, considera cargarla lazy. Pero más importante: tienes un número de referencia. Si mañana la memoria base sube 20MB sin que hayas agregado gemas, algo cambió.

## Paso 2: Analiza por request con memory_profiler

Una vez que sabes que hay un leak real (la memoria crece con cada request y no baja), `memory_profiler` te dice exactamente dónde:

```ruby
# Gemfile
gem 'memory_profiler', group: :development
```

```ruby
# En un script de diagnóstico, o en un endpoint temporal
require 'memory_profiler'

report = MemoryProfiler.report do
  # El código sospechoso — puede ser una action, un servicio, lo que sea
  result = ProductCatalog.all_with_prices
end

report.pretty_print
```

El output se ve así:

```
Total allocated: 45.23 MB (423891 objects)
Total retained:  12.87 MB (98234 objects)

allocated memory by gem
-----------------------------------
      34567234  activerecord
       8234123  activesupport
       1234567  your_app/app/services

allocated objects by location
-----------------------------------
      98234  /app/models/product.rb:47
      34521  /app/services/catalog_service.rb:23
```

La diferencia clave: **allocated** es todo lo que se creó. **retained** es lo que sigue en memoria después del GC. Si `retained` es alto, tienes un leak real. Si `allocated` es alto pero `retained` es bajo, tienes ineficiencia (muchos objetos temporales), que es diferente.

## Paso 3: ObjectSpace para snapshots en producción

A veces el leak solo aparece en producción, no en development. Para esos casos, ObjectSpace te permite tomar snapshots sin reiniciar:

```ruby
# config/routes.rb (protegido con autenticación básica en producción)
if Rails.env.production? && ENV['ENABLE_MEMORY_DEBUG']
  namespace :debug do
    get 'memory_snapshot', to: 'memory#snapshot'
  end
end
```

```ruby
# app/controllers/debug/memory_controller.rb
class Debug::MemoryController < ApplicationController
  before_action :require_admin

  def snapshot
    require 'objspace'
    ObjectSpace.trace_object_allocations_start

    GC.start
    snapshot = {}

    ObjectSpace.each_object do |obj|
      klass = obj.class.name rescue 'Unknown'
      snapshot[klass] ||= 0
      snapshot[klass] += 1
    end

    render json: snapshot.sort_by { |_, v| -v }.first(50).to_h
  end
end
```

```json
// Output típico que indica un problema
{
  "String": 2847392,
  "Array": 394823,
  "Hash": 189234,
  "Product": 48392,  // ← ¿48K instancias de Product? Eso no debería pasar
  "ActionView::OutputBuffer": 23841
}
```

Si ves 48K instancias de `Product` cuando tienes 1000 productos en tu catálogo, hay algo reteniendo esos objetos. Hora de buscar.

## Los sospechosos de siempre — y el que nadie quiere admitir que escribió

### Memoización en class-level objects

Este es el más común. Y casi siempre lo escribiste tú mismo con la mejor intención del mundo. Memoizar en una instancia es fine. Memoizar en un class-level object es un leak garantizado:

```ruby
# MAL — este hash vive para siempre en la clase
class ProductCache
  def self.cache
    @cache ||= {}  # Este hash nunca se limpia
  end

  def self.find(id)
    cache[id] ||= Product.find(id)  # Cada producto que busques queda aquí para siempre
  end
end

# BIEN — con expiración
class ProductCache
  def self.find(id)
    Rails.cache.fetch("product/#{id}", expires_in: 1.hour) do
      Product.find(id)
    end
  end
end
```

### ActiveRecord result sets sin scope

```ruby
# MAL — carga todos los usuarios en memoria
def send_newsletter
  User.all.each do |user|  # Si tienes 500K usuarios, tienes 500K objetos en RAM
    NewsletterMailer.weekly(user).deliver_later
  end
end

# BIEN — batches de 1000
def send_newsletter
  User.find_each(batch_size: 1000) do |user|
    NewsletterMailer.weekly(user).deliver_later
  end
end
```

### String mutation con `<<`

```ruby
# Puede generar strings compartidos de formas inesperadas
GREETING = "Hola"

def build_message(name)
  msg = GREETING  # msg y GREETING apuntan al mismo objeto
  msg << ", #{name}!"  # Esto muta GREETING también!
  msg
end

build_message("Alice") # => "Hola, Alice!"
GREETING               # => "Hola, Alice!" — oops

# FIX: usa + o dup
def build_message(name)
  "#{GREETING}, #{name}!"  # Nuevo string, sin mutación
end
```

### Observers y callbacks que acumulan

```ruby
# Si registras callbacks en cada request sin limpiarlos:
class ReportJob
  def perform
    # MAL: cada vez que el job corre, agrega otro callback al array
    ActiveSupport::Notifications.subscribe("sql.active_record") do |*args|
      @queries ||= []
      @queries << args
    end

    run_report
    # Los callbacks nunca se desregistran
  end
end
```

## El flujo de debugging que funciona

```
1. derailed_benchmarks → ¿hay un leak? ¿cuánto crece?
        ↓
2. memory_profiler → ¿qué se está allocando?
        ↓
3. ObjectSpace → ¿qué objetos se están reteniendo?
        ↓
4. Bisect → comenta código sospechoso hasta aislar el problema
        ↓
5. Fix → aplica el fix, mide de nuevo para confirmar
```

No saltes al paso 4 sin los primeros tres. Adivinar qué está causando un memory leak sin datos es como operar a ciegas — puedes remover cosas que no tienen nada que ver y el leak sigue ahí.

## Antes vs después: ejemplo real

Un endpoint de reportes en un proyecto que pasaba de 280MB a 920MB después de 50 requests:

```ruby
# Antes — el leak
def monthly_report
  orders = Order.where(month: params[:month]).includes(:items, :customer)
  # orders tiene potencialmente 50K registros, todos en RAM

  @summary = {
    total: orders.sum(&:total),
    count: orders.count,
    customers: orders.map(&:customer).uniq
  }
end

# Después — sin leak
def monthly_report
  orders = Order.where(month: params[:month])

  @summary = {
    total: orders.sum(:total),           # Query SQL, no Ruby
    count: orders.count,                 # Query SQL, no Ruby
    customers: orders.joins(:customer)
                     .distinct
                     .pluck('customers.id', 'customers.name')
  }
end
```

Resultado: de 920MB a 310MB. La diferencia fue dejar que la base de datos hiciera el trabajo en lugar de cargar 50K objetos en Ruby para hacer math con `.sum(&:total)`.

---

Los memory leaks en Ruby no son misteriosos — son patrones predecibles que se repiten. Mide primero, usa las herramientas correctas en orden, y no te rindas a la primera que el profiler señale una gema de terceros. Más del 80% de las veces el problema está en tu código.

Y si después de todo esto el leak sigue ahí: revisa los callbacks. Siempre es un callback que alguien registró dos veces.
