/* profundizaciones.js — Bloque 5: unsafe, atomics, closures, orphan-rule, impl-trait. */
(function (G) {
  "use strict";
  var T = (G.temas = G.temas || {});

  T["unsafe"] = {
    slug: "unsafe", star: false, difficulty: 3,
    kicker: "La frontera de las garantías",
    title: "unsafe y los límites del checker",
    tagline: "unsafe no apaga el borrow checker: levanta cinco superpoderes concretos y te hace responsable de las invariantes que el compilador ya no prueba.",
    avoid: "Creer que unsafe es «Rust en modo C»: el checker sigue activo.",
    lede: '<code>unsafe</code> no apaga el borrow checker: <em>levanta cinco superpoderes</em> concretos y, a cambio, te hace responsable de mantener las invariantes que el compilador ya no puede probar por ti.',
    enBreve: [
      { k: "No apaga", v: "El borrow checker <strong>sigue activo</strong> dentro del bloque." },
      { k: "5 poderes", v: "deref crudo, FFI, <code>static mut</code>, traits unsafe, unions." },
      { k: "El contrato", v: "Tú garantizas la invariante que el compilador no prueba." },
      { k: "El objetivo", v: "<strong>Encapsular</strong> ese contrato tras una API 100% segura." }
    ],
    fundamento: {
      fuerza: 'Hay cosas correctas que el borrow checker no sabe demostrar: desreferenciar un puntero crudo, hablar con C, escribir en un registro. <code>unsafe</code> es un <em>contrato</em>: «yo, humano, garantizo lo que el compilador no puede». El objetivo es encapsular ese contrato tras una API segura.',
      prose: 'Dentro de un bloque <code>unsafe</code> puedes: desreferenciar punteros crudos (<code>*const T</code>/<code>*mut T</code>), llamar funciones <code>unsafe</code> o de FFI, acceder a <code>static mut</code>, implementar traits <code>unsafe</code> (<code>Send</code>/<code>Sync</code>) y acceder a campos de <code>union</code>. <strong>Nada más</strong>: el resto de reglas siguen vigentes.'
    },
    como: {
      blocks: [
        { title: "crear un ptr crudo es seguro; desreferenciarlo no", code:
'<span class="kw">let mut</span> num = <span class="nm">5</span>;\n<span class="kw">let</span> p = &<span class="kw">mut</span> num <span class="kw">as</span> *<span class="kw">mut</span> i32;  <span class="cm">// crear: permitido en safe</span>\n<span class="kw">unsafe</span> {\n    *p += <span class="nm">1</span>;                    <span class="cm">// deref *mut: solo dentro de unsafe</span>\n}' }
      ]
    },
    widget: "unsafe",
    sim: { title: "Dentro y fuera de la burbuja", intro: 'Intenta cada operación <strong>fuera</strong> y <strong>dentro</strong> del bloque <code>unsafe</code>. Fuera: error de compilación. Dentro: permitido — pero fíjate en la <em>invariante</em> que ahora te toca cumplir a ti.' },
    mito: {
      myth: '«<code>unsafe</code> desactiva todas las comprobaciones: es Rust en modo C.»',
      real: 'El borrow checker <strong>sigue activo</strong> incluso dentro del bloque. <code>unsafe</code> solo habilita cinco operaciones extra. Su valor real es <em>encapsular</em>: <code>Vec</code>, <code>Mutex</code> y casi toda la stdlib usan unsafe por dentro tras una fachada 100% segura.'
    },
    recursos: [
      { kind: "Nomicon ⭐", label: "The Rustonomicon — the dark arts of unsafe Rust", href: "https://doc.rust-lang.org/nomicon/" },
      { kind: "The Rust Book", label: "Unsafe Rust (cap. 20.1)", href: "https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html" },
      { kind: "Libro ⭐", label: "Rust for Rustaceans — Jon Gjengset (cap. Unsafe)", href: "https://rust-for-rustaceans.com/" }
    ]
  };

  T["atomics"] = {
    slug: "atomics", star: false, difficulty: 3,
    kicker: "El tema más difícil de la concurrencia",
    title: "Atomics y memory ordering",
    tagline: "Atómico ≠ ordenado. Relaxed / Acquire / Release / SeqCst deciden qué reordenamientos permite la CPU alrededor de una operación atómica.",
    avoid: "Usar SeqCst «por si acaso»: elige el ordering mínimo correcto.",
    lede: 'La CPU y el compilador <em>reordenan</em> instrucciones para ir más rápido. En un solo hilo no se nota; entre varios, sí. El <em>ordering</em> de una operación atómica dice qué reordenamientos se permiten alrededor.',
    enBreve: [
      { k: "Atómico ≠ ordenado", v: "La operación es indivisible; el orden lo decides con el <code>Ordering</code>." },
      { k: "Relaxed", v: "Atómico, pero sin garantías de reordenamiento." },
      { k: "Release/Acquire", v: "Pareja: lo escrito antes del store es visible tras el load." },
      { k: "SeqCst", v: "Además, un orden total único para todos los hilos." }
    ],
    fundamento: {
      fuerza: 'Un <code>AtomicUsize</code> garantiza que la operación en sí es indivisible. Pero eso no basta: necesitas decidir cómo se ordena <em>respecto a las lecturas y escrituras de alrededor</em>. Ese es el trabajo del <code>Ordering</code> — la parte que de verdad cuesta entender.',
      prose: '<strong>Relaxed:</strong> atómico, pero sin garantías de orden. <strong>Release</strong> (en escrituras) + <strong>Acquire</strong> (en lecturas) forman una pareja: todo lo escrito antes del <code>Release</code> es visible tras el <code>Acquire</code> que lee ese valor. <strong>SeqCst:</strong> además, un orden total único para todos los hilos.'
    },
    como: {
      blocks: [
        { title: "publicar un dato entre hilos", code:
'<span class="cm">// Hilo A (productor)          // Hilo B (consumidor)</span>\ndatos = <span class="nm">42</span>;                     <span class="kw">while</span> !listo.load(Acquire) {}\nlisto.store(<span class="kw">true</span>, Release);     leer datos → <span class="nm">42</span>  <span class="cm">// garantizado</span>' }
      ]
    },
    widget: "atomics",
    sim: { title: "El patrón «publicar un dato»", intro: 'Hilo A escribe un dato y luego pone la bandera <code>listo=true</code>. Hilo B espera la bandera y lee el dato. Elige el ordering y pulsa <strong>ejecutar</strong>: con <code>Relaxed</code>, B puede ver la bandera antes que el dato; con <code>Release/Acquire</code>, nunca. Ojo con el atajo mental de «lee basura»: <code>datos</code> es una escritura normal, no atómica, así que sin la pareja Release/Acquire eso es una <em>carrera de datos</em> — comportamiento indefinido, no un 0 que puedas razonar.' },
    mito: {
      myth: '«Si es atómico, ya es seguro; usa siempre <code>SeqCst</code> por si acaso.»',
      real: 'Atómico ≠ ordenado: <code>Relaxed</code> permite reordenar y romper el patrón. <code>SeqCst</code> es correcto pero puede costar barreras extra; <code>Release/Acquire</code> suele ser justo lo necesario. Elegir el ordering mínimo correcto es el arte.'
    },
    recursos: [
      { kind: "Libro ⭐", label: "Rust Atomics and Locks — Mara Bos (memory ordering)", href: "https://marabos.nl/atomics/" },
      { kind: "std docs", label: "std::sync::atomic::Ordering", href: "https://doc.rust-lang.org/std/sync/atomic/enum.Ordering.html" },
      { kind: "Nomicon", label: "The Rustonomicon — Atomics", href: "https://doc.rust-lang.org/nomicon/atomics.html" }
    ]
  };

  T["closures"] = {
    slug: "closures", star: false, difficulty: 2,
    kicker: "Cómo capturan el entorno",
    title: "Closures: Fn / FnMut / FnOnce",
    tagline: "Una closure es una struct anónima que captura su entorno. Lo que el cuerpo hace con lo capturado (leer, mutar, consumir) decide a cuál de los tres traits pertenece.",
    avoid: "Pensar que move la hace FnOnce: move cambia la captura, no el trait.",
    lede: 'Una closure es <em>una struct anónima</em> que guarda las variables que captura, más un método que la ejecuta. Lo que el cuerpo <em>hace</em> con lo capturado determina cuál de los tres traits implementa; el modo de captura lo infiere el compilador — y <code>move</code> lo fuerza por valor sin cambiar el trait.',
    enBreve: [
      { k: "Qué es", v: "Una <strong>struct anónima</strong> que captura su entorno + un método." },
      { k: "Fn", v: "Solo lee lo capturado (captura por <code>&</code>): llamable muchas veces." },
      { k: "FnMut", v: "Muta lo capturado (captura por <code>&mut</code>): muchas veces, exclusivo." },
      { k: "FnOnce", v: "Consume lo capturado (captura por valor): <strong>una sola</strong> llamada." }
    ],
    fundamento: {
      fuerza: 'Rust <em>infiere el modo de captura menos restrictivo posible</em> según lo que hagas con la variable dentro de la closure. No lo declaras: se deduce del uso. Esa struct oculta es lo que hace que las closures sean cero-costo.',
      prose: '<code>Fn</code>: captura por <code>&</code>, solo lee — se puede llamar muchas veces. <code>FnMut</code>: captura por <code>&mut</code>, muta el entorno — muchas veces, pero necesita acceso exclusivo. <code>FnOnce</code>: captura <strong>por valor</strong> y consume lo capturado — se puede llamar <em>una sola vez</em>.'
    },
    como: {
      blocks: [
        { title: "lo que escribes", code:
'<span class="kw">let</span> x = String::from(<span class="st">"hola"</span>);\n<span class="kw">let</span> c = <span class="kw">move</span> || {\n    println!(<span class="st">"{}"</span>, x);   <span class="cm">// solo lee → Fn</span>\n};' },
        { title: "compila a (aprox.)", code:
'<span class="kw">struct</span> Anon {\n    x: String,       <span class="cm">// move → capturado por valor</span>\n}\n<span class="kw">impl</span> Fn <span class="kw">for</span> Anon { ... }  <span class="cm">// solo lee → sigue siendo Fn</span>' }
      ]
    },
    widget: "closures",
    sim: { title: "Deduce el trait", intro: 'Elige qué hace la closure con la variable capturada <code>x</code>. Verás el modo de captura, la struct a la que compila, y a qué trait pertenece — y qué puedes hacer con ella después.' },
    mito: {
      myth: '«<code>move</code> hace que la closure sea <code>FnOnce</code>.»',
      real: '<code>move</code> solo cambia <em>cómo se capturan</em> (por valor), no qué trait implementa. Una closure <code>move</code> que solo <em>lee</em> un <code>Copy</code> sigue siendo <code>Fn</code>. El trait lo decide qué haces con lo capturado, no la palabra clave.'
    },
    recursos: [
      { kind: "The Rust Book", label: "Closures: capturing the environment (cap. 13.1)", href: "https://doc.rust-lang.org/book/ch13-01-closures.html" },
      { kind: "Reference", label: "Closure types — the Rust Reference", href: "https://doc.rust-lang.org/reference/types/closure.html" },
      { kind: "Libro ⭐", label: "Rust for Rustaceans — Jon Gjengset", href: "https://rust-for-rustaceans.com/" }
    ]
  };

  T["orphan-rule"] = {
    slug: "orphan-rule", star: false, difficulty: 3,
    kicker: "Una sola implementación, siempre",
    title: "Coherencia y la orphan rule",
    tagline: "Como mucho una implementación por par (trait, tipo). Solo puedes implementar un trait para un tipo si posees al menos uno de los dos.",
    avoid: "impl de trait+tipo ambos ajenos: usa el patrón newtype.",
    lede: 'Rust exige que para cada par (trait, tipo) exista <em>como mucho una</em> implementación en todo el programa. Eso es <strong>coherencia</strong>. La <strong>orphan rule</strong> es la regla local que la garantiza sin ver el resto del universo de crates.',
    enBreve: [
      { k: "Coherencia", v: "Como mucho <strong>una</strong> impl por par (trait, tipo)." },
      { k: "La regla", v: "Implementas si posees el trait <strong>o</strong> el tipo." },
      { k: "Huérfano", v: "Trait y tipo ambos ajenos → prohibido (E0117)." },
      { k: "La salida", v: "El patrón <strong>newtype</strong> envuelve al tipo ajeno." }
    ],
    fundamento: {
      fuerza: 'Sin coherencia, dos crates podrían implementar el mismo trait para el mismo tipo de forma distinta, y al juntarlas el compilador no sabría cuál elegir. La orphan rule previene ese conflicto <em>de antemano</em>: puedes implementar un trait para un tipo solo si <strong>tú posees al menos uno de los dos</strong>.',
      prose: 'Regla práctica: para escribir <code>impl Trait for Tipo</code>, el <code>Trait</code> es local a tu crate <strong>o</strong> el <code>Tipo</code> es local a tu crate. Si ambos son ajenos (p.ej. <code>impl Display for Vec&lt;T&gt;</code>), está prohibido — son «huérfanos». Esa es la primera aproximación: la regla completa es más sutil con genéricos (hay casos como <code>impl TraitAjeno&lt;MiTipo&gt; for TipoAjeno</code> que sí pasan, por los llamados <em>covered types</em>).'
    },
    como: {
      blocks: [
        { title: "local ✓ · huérfano ✗", code:
'<span class="kw">impl</span> MiTrait <span class="kw">for</span> Vec&lt;T&gt; { ... }   <span class="cm">// ✓ trait local</span>\n<span class="kw">impl</span> Display <span class="kw">for</span> MiTipo { ... }   <span class="cm">// ✓ tipo local</span>\n<span class="kw">impl</span> Display <span class="kw">for</span> Vec&lt;T&gt; { ... }   <span class="cm">// ✗ ambos ajenos: E0117</span>' }
      ]
    },
    widget: "orphan-rule",
    sim: { title: "¿Local o huérfano?", intro: 'Marca de quién es el <strong>trait</strong> y de quién es el <strong>tipo</strong>. La regla se ilumina: verde si posees al menos uno, rojo si ambos son de otra crate — con el patrón newtype como salida.' },
    mito: {
      myth: '«La orphan rule es una limitación arbitraria que estorba.»',
      real: 'Es lo que permite añadir una dependencia sin miedo a que dos crates definan impls contradictorios que rompan la tuya. Garantiza que <code>actualizar</code> una librería no cambie <em>qué</em> implementación se usa. El newtype cubre los casos legítimos.'
    },
    recursos: [
      { kind: "The Rust Book", label: "Traits: implementing on a type (cap. 10.2 · orphan rule)", href: "https://doc.rust-lang.org/book/ch10-02-traits.html" },
      { kind: "Libro ⭐", label: "Rust for Rustaceans — Jon Gjengset (coherencia)", href: "https://rust-for-rustaceans.com/" },
      { kind: "Reference", label: "Trait implementation coherence — the Reference", href: "https://doc.rust-lang.org/reference/items/implementations.html#trait-implementation-coherence" }
    ]
  };

  T["impl-trait"] = {
    slug: "impl-trait", star: false, difficulty: 3,
    kicker: "Dispatch estático elegante",
    title: "Genéricos, asociados e impl Trait",
    tagline: "Parámetro genérico vs tipo asociado; impl Trait en argumento (azúcar de genérico) vs en retorno (un tipo concreto oculto). Todo dispatch estático.",
    avoid: "Confundir -> impl Trait con dyn: el primero no lleva vtable.",
    lede: '¿Parámetro genérico o tipo asociado? ¿<code>impl Trait</code> en argumento o en retorno? Todas son formas de dispatch estático — pero cambian <em>cuántas</em> implementaciones caben y <em>quién</em> elige el tipo.',
    enBreve: [
      { k: "Genérico", v: "Muchos impls; <strong>quien llama</strong> elige T." },
      { k: "Tipo asociado", v: "Uno por implementador (<code>Iterator::Item</code>)." },
      { k: "impl Trait (arg)", v: "Azúcar de genérico: quien llama elige." },
      { k: "-> impl Trait", v: "Un tipo concreto oculto; estático, sin vtable." }
    ],
    fundamento: {
      fuerza: 'La pregunta clave: ¿el trait puede implementarse <em>varias veces</em> para un mismo tipo con parámetros distintos, o <em>una sola</em>? Un <strong>parámetro genérico</strong> del trait (<code>From&lt;T&gt;</code>) permite muchas; un <strong>tipo asociado</strong> (<code>Iterator::Item</code>) fuerza una única.',
      prose: 'Y <code>impl Trait</code>: en <strong>argumento</strong> es azúcar de un genérico (quien llama elige el tipo); en <strong>retorno</strong> es lo contrario — la función fija <em>un</em> tipo concreto oculto, y quien llama solo sabe qué trait cumple.'
    },
    como: {
      blocks: [
        { title: "argumento vs retorno", code:
'<span class="kw">fn</span> <span class="fn">imprime</span>&lt;T: Display&gt;(x: T)      <span class="cm">// genérico: quien llama elige T</span>\n<span class="kw">fn</span> <span class="fn">contador</span>() -> <span class="kw">impl</span> Iterator   <span class="cm">// retorno: tipo concreto oculto</span>' }
      ]
    },
    widget: "impl-trait",
    sim: { title: "Cuatro formas de decir «algo que cumple un trait»", intro: 'Recorre las cuatro formas de dispatch estático y compara quién elige el tipo, cuántas implementaciones caben, y cuándo conviene cada una.' },
    mito: {
      myth: '«<code>impl Trait</code> en retorno es lo mismo que <code>dyn Trait</code>.»',
      real: '<code>-&gt; impl Trait</code> es <strong>dispatch estático</strong>: la función devuelve <em>un</em> tipo concreto (solo oculto para quien llama), sin vtable ni asignación. <code>-&gt; Box&lt;dyn Trait&gt;</code> sí es dinámico. Por eso no puedes devolver dos tipos distintos con <code>impl Trait</code>.'
    },
    recursos: [
      { kind: "The Rust Book", label: "Generic types (cap. 10.1)", href: "https://doc.rust-lang.org/book/ch10-01-syntax.html" },
      { kind: "Reference", label: "impl Trait — the Rust Reference", href: "https://doc.rust-lang.org/reference/types/impl-trait.html" },
      { kind: "Libro ⭐", label: "Rust for Rustaceans — Jon Gjengset (traits)", href: "https://rust-for-rustaceans.com/" }
    ]
  };

})(window.GUIA = window.GUIA || {});
