---
title: "Ruby 3.4: las features que vale la pena conocer"
description: "Ruby 3.4 salió el 25 de diciembre de 2024. No todo el changelog merece tu atención — acá está lo que realmente cambia cómo escribes código."
pubDate: 2025-02-25
tags: ["ruby"]
draft: false
---

## TL;DR

- **`it`** como parámetro de bloque por defecto — adiós `_1`, hola legibilidad
- **Prism** reemplaza a YARV como parser por defecto — mejor tooling, mejores errores
- Los **mensajes de error** mejoraron significativamente con sugerencias más precisas
- **Pattern matching `find`** tiene refinements importantes para casos con arrays anidados
- La mejora en **performance** es real pero no dramática — de 5–15% en benchmarks típicos

---

Ruby tiene la tradición de salir el 25 de diciembre. Un regalo de navidad anual para los que preferimos pasar las fiestas leyendo changelogs (o al menos fingimos que no). Ruby 3.4 salió el 25 de diciembre de 2024 y — honestamente — no es el release que te hace reescribir tu app. Pero hay cosas que vale la pena conocer.

## `it`: el parámetro de bloque que finalmente tiene nombre

Ruby 2.7 introdujo `_1`, `_2`, etc. como parámetros de bloque numerados. La idea era buena, la ejecución... debatible. Nadie escribe `_1` y piensa "ah sí, el primer argumento" de forma natural — tienes que hacer el mapping mental cada vez.

Ruby 3.4 agrega `it` como el parámetro de bloque singular por defecto:

```ruby
# Ruby 2.7+ — funciona, pero feo
[1, 2, 3].map { _1 * 2 }
# => [2, 4, 6]

# Ruby 3.4 — mucho más legible
[1, 2, 3].map { it * 2 }
# => [2, 4, 6]

# Con operaciones de string
["alice", "bob", "carol"].map { it.capitalize }
# => ["Alice", "Bob", "Carol"]

# Encadenado
users.select { it.active? }.map { it.email }
# => ["alice@example.com", "carol@example.com"]
```

`it` solo funciona cuando el bloque tiene un argumento implícito. Si defines parámetros explícitos (`|x|`), `it` no aplica. Y si necesitas más de un argumento, sigues usando `_1`, `_2` o los parámetros normales.

¿Cuándo usar `it` vs `|x|`? Mi regla: si el bloque es de una sola operación y el contexto hace obvio de qué se trata, `it` está perfecto. Si el bloque tiene lógica o necesitas claridad, nombra el parámetro.

## Prism es el nuevo parser por defecto

Este es el cambio más importante de la versión aunque no lo notes en tu código del día a día.

Prism es un nuevo parser para Ruby escrito desde cero, diseñado para ser portable (funciona en múltiples implementaciones: CRuby, JRuby, TruffleRuby), más rápido, y con mejor manejo de errores.

¿Qué significa para ti?

**Mejores mensajes de error.** Prism puede dar contexto más preciso cuando algo sale mal:

```ruby
# Ruby 3.3 — error genérico
def greet(name
         ^^^^^
SyntaxError: unexpected local variable or method

# Ruby 3.4 con Prism
def greet(name
                ^
SyntaxError: expected a `)` to close the parameters (opened on line 1)
```

**Mejor soporte en herramientas.** Solr, RuboCop, Sorbet, language servers — todos los que analizan código Ruby pueden usar Prism directamente. Menos discrepancias entre "funciona en IRB pero falla en el linter".

**Para ti como usuario:** transparente en la mayoría de los casos. Si tienes gemas muy viejas que hacen parsing de Ruby con RubyParser o Ripper, podrían ver comportamientos distintos, pero en código normal no lo notas.

## Los mensajes de error que ahora sí ayudan

Combinado con Prism, Ruby 3.4 mejoró significativamente los "did you mean?" suggestions:

```ruby
# Tienes un typo en un método
user = User.new
user.fist_name
# => NoMethodError: undefined method 'fist_name' for an instance of User
#    Did you mean? first_name

# Variable no definida
puts usre.name
# => NameError: undefined local variable or method 'usre'
#    Did you mean? user
```

Esto no es nuevo en Ruby 3.4 — existe desde Ruby 2.3 — pero las sugerencias son notablemente más precisas gracias a Prism. Antes podía sugerirte algo completamente irrelevante. Ahora el match es mucho mejor.

## Pattern matching: refinements al `find` pattern

Ruby 3.0 introdujo el `find` pattern (`[*, pattern, *]`) que te permite buscar un elemento que matchea dentro de un array sin saber su posición. En 3.4 se refinaron algunos edge cases con arrays anidados:

```ruby
# Find pattern — busca el primer match en un array
case [1, 2, "hola", 3, 4]
in [*, String => s, *]
  puts "Encontré el string: #{s}"  # => "Encontré el string: hola"
end

# Caso práctico: parsear logs con estructura variable
log_lines = [
  { type: :info, msg: "Server started" },
  { type: :error, msg: "Connection refused", code: 503 },
  { type: :info, msg: "Retry..." },
]

case log_lines
in [*, { type: :error, code: Integer => code }, *]
  puts "Error HTTP: #{code}"  # => "Error HTTP: 503"
end
```

El `find` pattern es útil cuando procesas datos con estructura irregular — JSONs de terceros, logs, configuraciones donde no controlas el formato exacto.

## Performance: real pero no revolucionaria

YJIT (el JIT de Ruby) sigue mejorando en cada versión. En 3.4 los benchmarks muestran:

- Railsbench: ~8% más rápido vs 3.3
- Yjit-bench: 15-20% más rápido en código numérico intensivo
- Aplicaciones Rails típicas: 5-10%

Para activarlo (si no lo tienes ya):

```ruby
# config/environments/production.rb
# Rails lo activa automáticamente si está disponible
# Para verificar:
puts RubyVM::YJIT.enabled? # => true
```

Si usas Ruby en Docker, asegúrate de que tu imagen base tenga YJIT compilado. Las imágenes oficiales `ruby:3.4` ya lo incluyen.

## Tabla de resumen

| Feature | ¿Cambia cómo escribo código? | Impacto |
|---------|------------------------------|---------|
| `it` en bloques | Sí — más legibilidad en bloques cortos | Medio |
| Prism como parser | No visible | Alto en tooling |
| Mejores errores | No — solo los lees mejor | Medio en DX |
| `find` pattern fixes | Sí, si usas pattern matching | Bajo–Medio |
| YJIT mejoras | No | Medio en performance |

---

Ruby 3.4 no es la versión que te hace reescribir tu código — es la versión que te hace el día a día un poco más agradable. `it` en bloques, mensajes de error que por fin sugieren algo útil, y Prism como base sólida para el ecosystem de herramientas.

En tres meses vas a notar que tu linter y tu language server tienen menos discrepancias raras, y no vas a saber exactamente por qué. Ahora ya lo sabes: fue Prism. Feliz navidad con retraso.
