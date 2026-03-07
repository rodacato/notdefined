---
title: "Rust ownership para devs que crecieron con garbage collectors"
description: "No es otro tutorial de Rust. Es el cambio de modelo mental para alguien que viene de Ruby o JavaScript: por qué el borrow checker existe, las tres reglas sin jerga de CS, y cuándo Rust es la herramienta correcta."
pubDate: 2025-07-01
tags: ["rust"]
draft: false
---

## TL;DR

- En Rust **no hay garbage collector** — la memoria se libera cuando el owner sale de scope, automáticamente
- **Tres reglas de ownership**: cada valor tiene un único owner, cuando el owner sale de scope el valor se libera, puedes mover o prestar (borrow) valores
- **El borrow checker** es el compilador verificando esas reglas — sus errores no son bugs, son el compilador haciendo tu trabajo
- La fricción mayor al principio: **devolver referencias**, **mutabilidad explícita**, `String` vs `&str`
- Rust es la herramienta correcta para: sistemas, CLI tools, WebAssembly, o cuando necesitas control total sobre memoria. No para un CRUD API que ya funciona en Rails.

---

Si ya intentaste aprender Rust antes y cerraste el editor frustrado después de 20 minutos peleando con el borrow checker — bienvenido al club. Casi todos pasamos por eso. Este post no es para convencerte de que Rust es fácil (no lo es) sino para darte el modelo mental que hace que los errores del compilador *tengan sentido* en lugar de sentirse arbitrarios.

## Por qué existe el ownership

En Ruby y JavaScript, olvidar liberar memoria es básicamente imposible — el garbage collector lo hace por ti. Creas objetos, el GC los limpia cuando ya nadie los referencia. Conveniente, pero con un costo: el GC puede pausar tu programa en momentos arbitrarios, y no tienes control sobre cuándo se libera la memoria.

Rust eligió otro camino: **el compilador garantiza la seguridad de memoria en tiempo de compilación**, sin GC. Para hacer eso, necesita reglas estrictas sobre quién posee qué dato y por cuánto tiempo.

La idea central: **cada valor tiene exactamente un dueño (owner)**. Cuando ese dueño desaparece (sale de scope), el valor se libera. Sin GC, sin runtime overhead, sin pausas.

## Las tres reglas, sin jerga

**Regla 1: Cada valor tiene un único owner**

```rust
let s1 = String::from("hola");  // s1 es el owner de este String
let s2 = s1;                     // ownership se MUEVE a s2

println!("{}", s1);  // Error: s1 ya no es válido, se movió a s2
println!("{}", s2);  // ✓
```

Esto se llama **move semantics**. No hay copia implícita de valores heap-allocated (como `String`). Si quieres dos copias, tienes que ser explícito:

```rust
let s1 = String::from("hola");
let s2 = s1.clone();  // copia explícita — ahora hay dos Strings en heap

println!("{}", s1);   // ✓
println!("{}", s2);   // ✓
```

**Regla 2: Cuando el owner sale de scope, el valor se libera**

```rust
fn main() {
    let s = String::from("hola");  // s entra en scope
    // ... usa s
}  // s sale de scope — Rust llama drop() automáticamente
   // La memoria del String se libera AQUÍ, sin GC
```

Para tipos que viven en el stack (integers, booleans, floats), Rust hace copia automática porque es barato. Para tipos heap-allocated (`String`, `Vec`, `Box`), mueve el ownership.

**Regla 3: Puedes prestar (borrow) referencias**

En lugar de mover el ownership, puedes prestar una referencia — con o sin permisos de mutación:

```rust
fn calcular_largo(s: &String) -> usize {
    s.len()  // solo lee, no toma ownership
}

fn main() {
    let s = String::from("hola mundo");
    let largo = calcular_largo(&s);  // pasamos una referencia, no movemos
    println!("{} tiene {} caracteres", s, largo);  // s sigue siendo válido ✓
}
```

Las reglas para referencias:
- Puedes tener **múltiples referencias inmutables** (`&T`) al mismo tiempo
- O **una sola referencia mutable** (`&mut T`)
- Pero nunca ambas al mismo tiempo

```rust
let mut s = String::from("hola");

let r1 = &s;      // referencia inmutable
let r2 = &s;      // otra referencia inmutable — ok
let r3 = &mut s;  // Error: no puedes tener mutable mientras existen inmutables
```

Esto es lo que previene data races en código concurrente — el compilador garantiza que nadie muta un valor mientras alguien más lo está leyendo.

## La fricción real al empezar

### "No puedo devolver una referencia"

```rust
// Esto no compila — y tiene sentido cuando lo piensas
fn primera_palabra(s: &String) -> &str {
    let palabra = String::from("hola");
    &palabra  // Error: palabra sale de scope al final de la función
              // devolver una referencia a algo que ya no existe = bug garantizado
}

// La solución: devolver el valor, no una referencia a algo local
fn primera_palabra(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[..i];  // referencia al input, no a local — ok
        }
    }
    &s[..]
}
```

El error del borrow checker aquí no es un bug de Rust — es el compilador diciéndote "lo que intentas hacer causaría un use-after-free en C". En Ruby/JavaScript nunca lo verías porque el GC lo maneja. En Rust, te lo ataja en compilación.

### `String` vs `&str`

```rust
// String — owned, heap-allocated, mutable
let mut s = String::from("hola");
s.push_str(", mundo");  // ✓ puedes mutar

// &str — borrowed string slice, inmutable, puede apuntar a heap o stack
let saludo: &str = "hola, mundo";  // string literal, vive en el binario
let slice: &str = &s[0..4];        // referencia a parte de un String

// Regla práctica: usa &str en parámetros de funciones (más flexible)
fn saludar(nombre: &str) {  // acepta tanto &String como &str
    println!("Hola, {}!", nombre);
}

saludar("Alice");                    // &str literal ✓
saludar(&String::from("Bob"));       // &String coerce a &str ✓
```

### Mutabilidad explícita

En Ruby y JavaScript, las variables son mutables por defecto. En Rust, son inmutables por defecto:

```rust
let x = 5;
x = 6;  // Error: cannot assign twice to immutable variable

let mut y = 5;  // explícitamente mutable
y = 6;          // ✓
```

Al principio parece molesto. Después te das cuenta de que en Rust, si ves `mut`, sabes que esa variable va a cambiar. Si no ves `mut`, puedes razonar sobre el código con certeza de que el valor no cambiará. En Ruby tienes que leer todo el código para saberlo.

## Un ejemplo real: procesamiento de texto

```rust
use std::collections::HashMap;

fn contar_palabras(texto: &str) -> HashMap<&str, usize> {
    let mut conteo = HashMap::new();

    for palabra in texto.split_whitespace() {
        let entrada = conteo.entry(palabra).or_insert(0);
        *entrada += 1;  // el * desreferencia para modificar el valor
    }

    conteo
}

fn main() {
    let texto = "hola mundo hola rust hola";
    let conteo = contar_palabras(texto);

    let mut pares: Vec<(&&str, &usize)> = conteo.iter().collect();
    pares.sort_by(|a, b| b.1.cmp(a.1));

    for (palabra, n) in pares {
        println!("{}: {}", palabra, n);
    }
    // hola: 3
    // mundo: 1
    // rust: 1
}
```

Este código no puede tener memory leaks, data races, o use-after-free. El compilador lo garantiza. Sin GC, sin overhead de runtime.

## Cuándo Rust es la herramienta correcta

| Caso de uso | Rust | Ruby/Node |
|-------------|------|-----------|
| Sistemas operativos, drivers | ✓✓ | No aplica |
| CLI tools de alta performance | ✓✓ | ✓ (pero más lento) |
| WebAssembly | ✓✓ | No aplica |
| Microservicios con latencia crítica | ✓ | ✓ (con más trabajo) |
| APIs CRUD con PostgreSQL | Excesivo | ✓✓ |
| Scripts de automatización | Excesivo | ✓✓ |
| Prototipado rápido | Lento para iterar | ✓✓ |

La pregunta que vale hacerse antes de elegir Rust: ¿el problema que tengo justifica la inversión en tiempo de desarrollo y la curva de aprendizaje? Rust es más lento de escribir que Ruby o JavaScript, especialmente al principio. Para una API que Rails puede manejar perfectamente, Rust es dolor sin beneficio. Para una herramienta de CLI que tiene que procesar 10GB de logs en segundos, Rust gana fácil.

---

El borrow checker no es tu enemigo — es ese dev senior muy estricto que siempre pregunta "¿pero y si esto se ejecuta en paralelo?" en el code review. La primera semana pelearás con él. La segunda semana empezarás a entender por qué tiene razón. La tercera semana vas a agradecer que exista.

Y para el CRUD API que ya funciona en Rails: déjalo en Rails. Rust es para cuando lo necesitas de verdad, no para sufrir innecesariamente.
