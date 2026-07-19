/* compilacion.js — Bloque 2: pipeline, dispatch, zero-cost, macros. */
(function (G) {
  "use strict";
  var T = (G.temas = G.temas || {});

  T["pipeline"] = {
    slug: "pipeline", star: false, difficulty: 2,
    kicker: "Dónde vive cada garantía",
    title: "El pipeline de compilación",
    tagline: "Fuente → AST → HIR → MIR → LLVM IR → nativo. El borrow checker corre sobre MIR, no sobre el texto.",
    avoid: "Creer que el borrow check mira el código fuente literal.",
    lede: 'Rust compila <em>ahead-of-time</em> a código máquina, pero pasa por varias representaciones intermedias. Entender la cadena ubica <em>dónde</em> ocurre cada verificación y optimización.',
    enBreve: [
      { k: "Modelo", v: "AOT nativo: Fuente → AST → HIR → MIR → LLVM IR → asm." },
      { k: "HIR", v: "Se resuelven <strong>tipos y traits</strong>." },
      { k: "MIR", v: "Corre el <strong>borrow checker</strong> — sobre el flujo, no el texto." },
      { k: "Binario", v: "Sin runtime incrustado: autónomo." }
    ],
    fundamento: {
      fuerza: 'El dato que sorprende: el <strong>borrow checker no mira tu código fuente</strong>. Opera sobre <strong>MIR</strong>, un grafo de flujo de control simplificado. Por eso razona sobre el <em>uso real</em> (NLL) y no sobre las llaves del texto.',
      prose: 'Fuente → <strong>AST</strong> → <strong>HIR</strong> (se resuelven tipos y traits) → <strong>MIR</strong> (corre el borrow checker y muchas optimizaciones) → <strong>LLVM IR</strong> → código máquina. Un binario sin runtime incrustado.'
    },
    como: {
      blocks: [
        { title: "una función, cinco representaciones", code:
'rustc main.rs\n  <span class="cm">├─ AST      // sintaxis</span>\n  <span class="cm">├─ HIR      // tipos + traits</span>\n  <span class="kw">├─ MIR      // borrow check ← aquí</span>\n  <span class="cm">├─ LLVM IR  // inline + optimización</span>\n  <span class="cm">└─ asm      // nativo, sin runtime</span>' }
      ]
    },
    widget: "pipeline",
    sim: { title: "El mismo código, cinco representaciones", intro: 'Pulsa <strong>compilar</strong> para ver el código descender por el pipeline, o haz clic en cualquier etapa. Fíjate dónde ocurre cada cosa: tipos y traits en HIR, <em>borrow check</em> en MIR, optimización en LLVM.' },
    mito: {
      myth: '«El borrow checker analiza el texto de mi código, línea por línea.»',
      real: 'Opera sobre <strong>MIR</strong>, ya desazucarado y convertido en un grafo de flujo. Por eso entiende bucles, <code>break</code> y retornos tempranos — y por eso NLL pudo afinar tanto las regiones de préstamo.'
    },
    recursos: [
      { kind: "rustc Dev Guide", label: "Overview of the compiler", href: "https://rustc-dev-guide.rust-lang.org/overview.html" },
      { kind: "rustc Dev Guide", label: "The MIR (Mid-level IR)", href: "https://rustc-dev-guide.rust-lang.org/mir/index.html" },
      { kind: "Herramienta", label: "cargo-show-asm — ver el asm generado", href: "https://github.com/pacak/cargo-show-asm" }
    ]
  };

  T["dispatch"] = {
    slug: "dispatch", star: true, difficulty: 2,
    kicker: "Dispatch estático vs dinámico",
    title: "Monomorfización vs trait objects",
    tagline: "Dispatch estático (genéricos, copia por tipo, cero costo) frente a dinámico (dyn Trait, fat pointer + vtable, salto indirecto).",
    avoid: "dyn Trait por defecto: pagas indirección que no siempre necesitas.",
    lede: 'Rust ofrece polimorfismo de dos maneras con costos distintos: <em>genéricos</em> (resueltos en compilación, rapidísimos) y <em>trait objects</em> (<code>dyn Trait</code>, resueltos en runtime, flexibles).',
    enBreve: [
      { k: "Estático", v: "Genéricos <strong>monomorfizados</strong>: una copia por tipo, inline." },
      { k: "Dinámico", v: "<code>dyn Trait</code>: fat pointer = datos + vtable." },
      { k: "Costo estático", v: "Binario más grande, compilación más lenta (<em>code bloat</em>)." },
      { k: "Costo dinámico", v: "Un salto indirecto por llamada; una sola copia de código." }
    ],
    fundamento: {
      fuerza: 'Elegir entre estático y dinámico es un <em>trade-off</em> explícito: el genérico regala velocidad a cambio de tamaño de binario; el <code>dyn Trait</code> regala un binario compacto y flexibilidad a cambio de un salto indirecto por llamada. Tú decides, y el costo es visible.',
      prose: '<strong>Monomorfización:</strong> por cada tipo concreto, el compilador genera una copia especializada. <strong>Trait object:</strong> <code>&dyn Trait</code> es un <em>fat pointer</em> = (puntero a datos, puntero a vtable); la llamada salta por la vtable a la implementación concreta.'
    },
    como: {
      blocks: [
        { title: "genérico — dispatch estático", code:
'<span class="kw">fn</span> <span class="fn">dibuja</span>&lt;T: Draw&gt;(x: &T) {\n    x.draw();     <span class="cm">// resuelto en compilación</span>\n}\n<span class="cm">// una copia por cada T usado</span>' },
        { title: "trait object — dispatch dinámico", code:
'<span class="kw">fn</span> <span class="fn">dibuja</span>(x: &<span class="kw">dyn</span> Draw) {\n    x.draw();     <span class="cm">// salto por la vtable en runtime</span>\n}\n<span class="cm">// una sola copia; cada valor lleva su vtable</span>' }
      ]
    },
    widget: "dispatch",
    sim: { title: "Estático o dinámico", intro: 'Cambia el modo de dispatch y llama a <code>dibuja()</code> con distintos tipos. En estático, cada tipo <em>clona</em> la función en el binario. En dinámico, hay una sola copia y la llamada salta por la vtable.' },
    mito: {
      myth: '«Los genéricos son siempre la mejor opción por ser cero-costo.»',
      real: 'La monomorfización infla el binario y el tiempo de compilación (<em>code bloat</em>). Cuando guardas tipos heterogéneos en un <code>Vec&lt;Box&lt;dyn Trait&gt;&gt;</code> o quieres compilar rápido, <code>dyn</code> es la opción correcta.'
    },
    recursos: [
      { kind: "Deep-dive", label: "Rust Dynamic Dispatching deep-dive", href: "https://medium.com/digitalfrontiers/rust-dynamic-dispatching-deep-dive-236a5896e49b" },
      { kind: "The Rust Book", label: "Using Trait Objects (cap. 18.2)", href: "https://doc.rust-lang.org/book/ch18-02-trait-objects.html" },
      { kind: "Vídeo", label: "Crust of Rust: Dispatch and Fat Pointers", href: "https://www.youtube.com/watch?v=xcygqF5LVmM" }
    ]
  };

  T["zero-cost"] = {
    slug: "zero-cost", star: false, difficulty: 2,
    kicker: "No pagas por lo que no usas",
    title: "Zero-cost abstractions",
    tagline: "iter().map().filter().sum() compila al mismo loop que un for a mano. Option<&T> ocupa lo mismo que &T (nicho).",
    avoid: "Suponer que el estilo funcional cuesta más en el binario.",
    lede: 'El lema heredado de C++: <em>«no pagas por lo que no usas, y lo que usas es tan eficiente como escribirlo a mano»</em>. Iteradores, <code>Option</code>, closures y genéricos compilan a bajo nivel sin sobrecosto.',
    enBreve: [
      { k: "El lema", v: "«No pagas por lo que no usas»." },
      { k: "Iteradores", v: "<code>iter().map().sum()</code> → el <strong>mismo loop</strong> que un for." },
      { k: "Nicho", v: "<code>Option&lt;&T&gt;</code> ocupa lo mismo que <code>&T</code> — 0 bytes extra." },
      { k: "Lazy", v: "Los iteradores son perezosos y se inlinean, sin boxing." }
    ],
    fundamento: {
      fuerza: 'Puedes escribir en estilo funcional y expresivo <em>sin culpa</em>: el compilador inlinea y funde las abstracciones hasta que desaparecen del binario. La ergonomía no cuesta rendimiento.',
      prose: 'Una cadena <code>iter().map().filter().sum()</code> compila al <strong>mismo loop</strong> que un <code>for</code> con acumulador. Y <code>Option&lt;&T&gt;</code> no ocupa memoria extra sobre <code>&T</code> gracias a la <strong>optimización de nicho</strong>.'
    },
    como: {
      blocks: [
        { title: "la abstracción se desvanece", code:
'<span class="kw">let</span> s: i32 = v.iter()\n    .map(|x| x * <span class="nm">2</span>)\n    .filter(|x| x % <span class="nm">3</span> != <span class="nm">0</span>)\n    .sum();\n<span class="cm">// ⇣ compila EXACTAMENTE a</span>\n<span class="kw">let mut</span> s = <span class="nm">0</span>;\n<span class="kw">for</span> x <span class="kw">in</span> &v { <span class="kw">let</span> d = x*<span class="nm">2</span>; <span class="kw">if</span> d%<span class="nm">3</span>!=<span class="nm">0</span> { s += d; } }' }
      ]
    },
    widget: "zero-cost",
    sim: { title: "Compila y compara", intro: 'Dos pestañas: mira la cadena de iteradores fundirse en el mismo asm que un bucle a mano, o explora cómo la <em>niche optimization</em> mantiene <code>Option</code> en 0 bytes de sobrecosto.' },
    mito: {
      myth: '«El estilo funcional (map/filter) es más lento que un bucle a mano.»',
      real: 'Idéntico asm. Los iteradores de Rust son <em>lazy</em> y se inlinean; no hay boxing ni indirección oculta. En Ruby/JS/Python cada <code>.map</code> asigna estructuras y paga en runtime — aquí no queda ni rastro.'
    },
    recursos: [
      { kind: "Libro ⭐", label: "Rust for Rustaceans — Jon Gjengset", href: "https://rust-for-rustaceans.com/" },
      { kind: "Blog", label: "without.boats — diseño y zero-cost", href: "https://without.boats/blog/" },
      { kind: "Libro", label: "Programming Rust — Blandy, Orendorff & Tindall", href: "https://www.oreilly.com/library/view/programming-rust-2nd/9781492052586/" }
    ]
  };

  T["macros"] = {
    slug: "macros", star: false, difficulty: 3,
    kicker: "Código que escribe código",
    title: "Macros: cómo se expanden",
    tagline: "macro_rules! (declarativas, con higiene) vs proc-macros (token streams, crate aparte). Cuándo cada una y qué le cuestan al build.",
    avoid: "Una proc-macro donde un macro_rules! alcanza.",
    lede: 'Las macros se expanden <em>antes</em> de la comprobación de tipos: reciben tokens y producen tokens. Rust tiene dos familias con costos muy distintos — las <em>declarativas</em>, higiénicas y baratas, y las <em>procedurales</em>, potentísimas y caras.',
    enBreve: [
      { k: "Cuándo", v: "Se expanden <strong>antes</strong> del type-check, sobre tokens." },
      { k: "macro_rules!", v: "Declarativas: <strong>patrón → plantilla</strong>, con higiene." },
      { k: "proc-macros", v: "Funciones que transforman un <code>TokenStream</code>." },
      { k: "Costo", v: "Las proc-macros <strong>compilan primero</strong> — inflan el build." }
    ],
    fundamento: {
      fuerza: 'La higiene de <code>macro_rules!</code> es la fuerza silenciosa: las variables locales y los <em>labels</em> que introduce la macro no chocan con los tuyos. No es sustitución de texto como el preprocesador de C — el compilador respeta ámbitos. Eso sí, la higiene es <strong>parcial</strong>: no cubre items ni tipos, que se resuelven en el ámbito donde expandes.',
      prose: '<code>macro_rules!</code> empareja fragmentos (<code>$x:expr</code>, <code>$t:ty</code>, <code>$($xs:expr),*</code>) y los pega en una plantilla. Una <strong>proc-macro</strong> (derive, atributo o function-like) es una función que recibe un <code>TokenStream</code> y devuelve otro; vive en su propio crate con <code>proc-macro = true</code> y se compila <em>antes</em> que quien la usa.'
    },
    como: {
      blocks: [
        { title: "macro_rules! — patrón → plantilla", code:
'<span class="kw">macro_rules!</span> <span class="fn">mi_vec</span> {\n    ($($x:expr),*) => {{\n        <span class="kw">let mut</span> v = Vec::new();\n        $( v.push($x); )*   <span class="cm">// repite por cada $x</span>\n        v\n    }};\n}' },
        { title: "proc-macro — en un crate aparte", code:
'<span class="cm">// crate `mi_derive`, con proc-macro = true</span>\n#[proc_macro_derive(Saluda)]\n<span class="kw">pub fn</span> <span class="fn">saluda</span>(input: TokenStream) -> TokenStream {\n    <span class="cm">// parsea el AST del struct y emite un impl</span>\n}\n<span class="cm">// uso: #[derive(Saluda)] struct P;</span>' }
      ]
    },
    widget: "macros",
    sim: { title: "Míralas expandirse", intro: 'Elige la familia y avanza la expansión paso a paso: la declarativa empareja el patrón y repite la plantilla; la procedural corre como un programa aparte. Observa el efecto en el grafo de compilación.' },
    mito: {
      myth: '«Las macros de Rust son como #define de C: sustitución de texto.»',
      real: '<code>macro_rules!</code> opera sobre árboles de tokens con <strong>higiene</strong> de identificadores, no sobre texto crudo. Y las proc-macros son programas Rust completos que manipulan el AST — con el costo de compilar un crate extra antes que el tuyo.'
    },
    recursos: [
      { kind: "The Rust Book", label: "Macros (cap. 20.5)", href: "https://doc.rust-lang.org/book/ch20-05-macros.html" },
      { kind: "Libro", label: "The Little Book of Rust Macros", href: "https://veykril.github.io/tlborm/" },
      { kind: "Taller", label: "proc-macro-workshop — dtolnay", href: "https://github.com/dtolnay/proc-macro-workshop" }
    ]
  };

})(window.GUIA = window.GUIA || {});
