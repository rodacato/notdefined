---
title: "Blocks, Lambdas y Procs: Entendiendo la magia en Ruby"
description: "Si cada vez que te preguntan la diferencia entre blocks, procs y lambdas en Ruby te quedas dudando, este post es para ti. Vamos a ver que son, como funcionan y en que se diferencian, con ejemplos practicos y comparaciones para elegir bien en cada caso."
pubDate: 2025-01-18
tags: ["ruby", "programming", "language"]
series: "Ruby Internals"
seriesOrder: 2
draft: false
---

## TL;DR

- **Blocks**: Son fragmentos de código anónimos que pueden pasarse a métodos con `yield` o `&block`. No son objetos y solo existen en el contexto de un método.
- **Procs**: Son objetos que encapsulan bloques reutilizables. Pueden asignarse a variables y ser pasados a métodos.
- **Lambdas**: Son similares a `Procs`, pero con diferencias en validación de argumentos y comportamiento del `return`.
- **Diferencias clave**: Los `Procs` permiten argumentos flexibles y pueden afectar el `return`, mientras que las `Lambdas` son estrictas en argumentos y su `return` solo afecta a la lambda.
- **Casos de uso**: Delegar lógica en métodos, callbacks, DSLs y más.

---

## Blocks en Ruby

Los **Blocks** son la forma más simple de agrupar código. Curiosamente, no son objetos y siempre están asociados a la llamada de un método.

Se pueden definir con `do...end` o `{}`, por ejemplo:

```ruby
# Con llaves (una sola línea)
[1, 2, 3].each { |number| puts number * 2 }

# Con do...end (múltiples líneas)
[1, 2, 3].each do |number|
  puts number * 2
end
```

Los métodos pueden recibir bloques y ejecutarlos con `yield`:

```ruby
def my_method
  puts "Antes del block"
  yield if block_given?
  puts "Después del block"
end

my_method do
  puts "Dentro del block"
end
```

Alternativamente, se pueden capturar con `&block`:

```ruby
def ejecutar(&block)
  block.call
end

ejecutar { puts "Ejecutando un block" } # Ejecutando un block
```


## Procs: Blocks Convertidos en Objetos

Los **Procs** son objetos que encapsulan bloques de código reutilizables, facil almacenar + reutilizar codigo.

```ruby
mi_proc = Proc.new { |name| puts "Hola, #{name}!" }
mi_proc.call("Alice") # Hola, Alice!
```

Pueden capturar variables del contexto:

```ruby
def create_proc(greeting)
  Proc.new { |name| puts "#{greeting}, #{name}!" }
end

greet_proc = create_proc("Buenos días")
greet_proc.call("Bob") # Buenos días, Bob!
```

Órale, suena como bloques, ¿no? ¿O cuál es la diferencia?

- **No validan estrictamente los argumentos:**

```ruby
proc_ejemplo = Proc.new { |x, y| puts "x: #{x}, y: #{y}" }
proc_ejemplo.call(1) # No lanza error, `y` será `nil`
```

- **Afectan el `return` del método que los ejecuta:**

```ruby
def test_proc
  p = Proc.new { return "Me salí del método" }
  p.call
  "Este texto nunca se ejecuta"
end

puts test_proc # Me salí del método
```

## Lambdas: Procs Más Estrictos

Las **Lambdas** son objetos `Proc`, pero con diferencias importantes:

- **Validan el número de argumentos:**
- **El `return` solo afecta dentro de la lambda:**

```ruby
mi_lambda = ->(x, y) { puts "x: #{x}, y: #{y}" }
mi_lambda.call(2, 3)
```

Intentar llamarla con argumentos incorrectos lanza un error:

```ruby
mi_lambda.call(2) # ArgumentError: wrong number of arguments
```

También el `return` funciona diferente. Si no me crees, mira este ejemplo:

```ruby
def my_method_with_lambda
  my_lambda = lambda { return 10 }
  result = my_lambda.call
  puts "Lambda retornó: #{result}"
  puts "Después de la lambda"
end

def my_method_with_proc
  my_proc = Proc.new { return 20 }
  result = my_proc.call
  puts "Proc retornó: #{result}" # Esto nunca se ejecutará
  puts "Después del proc" # Esto tampoco
end

my_method_with_lambda # Lambda retornó: 10 \n Después de la lambda
my_method_with_proc # 20
```

## Comparación de Blocks, Procs y Lambdas

En resumen, podrias diferenciarlos asi:

| Característica   | Code Block | Proc | Lambda |
|-----------------|-----------|------|--------|
| Es un objeto    | ❌        | ✅   | ✅     |
| Validación de argumentos | N/A | ❌   | ✅     |
| `return` afecta método | N/A | ✅   | ❌     |
| Creación        | `do...end`, `{}` | `Proc.new`, `proc` | `lambda`, `->` |

Aquí tienes una guía rápida sobre cuándo usarlos:

- **Blocks**: Para iteraciones y estructuras de control simples.
- **Procs**: Cuando necesitas reutilizar bloques de código y capturar variables de su contexto.
- **Lambdas**: Para validaciones estrictas de argumentos y cuando `return` no debe afectar al método contenedor.


## Ejemplo Avanzado en Contexto Real

Veamos cómo aplicar descuentos flexibles en un carrito de compras usando Procs y Lambdas (nada forzado, súper útil para cualquier día).

```ruby
class Cart
  attr_reader :products, :discount

  def initialize(&discount)
    @products = []
    @discount = discount || Proc.new { 0 }
  end

  def add_product(price)
    products << price
  end

  def total
    subtotal = products.sum
    subtotal - discount.call(subtotal)
  end
end

discount_10 = ->(total) { total * 0.1 }
cart = Cart.new(&discount_10)
cart.add_product(100)
cart.add_product(50)

puts cart.total # 135
```

¡Wow, qué fácil! Vámonos, ya tenemos un nuevo juguete que usar.
