/* propiedad.js — Bloque 1: ownership, borrowing, lifetimes.
   Solo contenido (el "guión"). La mecánica vive en js/widgets.js. */
(function (G) {
  "use strict";
  var T = (G.temas = G.temas || {});

  T["ownership"] = {
    slug: "ownership", star: true, difficulty: 2,
    kicker: "El tema estrella",
    title: "Ownership y move semantics",
    tagline: "Cada valor tiene un único dueño. Al salir de ámbito se libera — sin GC. Asignar mueve la propiedad e invalida al anterior.",
    avoid: "Pensar que b = a copia: para un String, mueve y deja a inválido.",
    lede: 'Cada valor tiene <em>un único dueño</em>. Cuando el dueño sale de ámbito, el valor se libera — automáticamente, de forma determinista, <em>sin recolector de basura</em>. Es lo que hace la memoria segura sin GC.',
    enBreve: [
      { k: "La regla", v: "Un valor, <strong>un dueño</strong>. Al salir de ámbito, se libera." },
      { k: "Asignar", v: "<strong>Mueve</strong> la propiedad e invalida al dueño anterior." },
      { k: "Tipos Copy", v: "Enteros, <code>bool</code>, <code>char</code>: se copian bit a bit." },
      { k: "Sin GC", v: "Liberación <strong>determinista</strong> vía <code>drop</code> (RAII)." }
    ],
    fundamento: {
      fuerza: 'La propiedad única elimina de raíz el <strong>doble-free</strong> y las <strong>fugas</strong>: si solo un dueño puede liberar, y lo hace exactamente al final de su ámbito, no hay ambigüedad sobre <em>quién libera y cuándo</em>. Ese contrato es lo que en Ruby, JS, Go y Python resuelve un recolector en ejecución.',
      prose: 'Asignar o pasar un valor lo <strong>mueve</strong>: transfiere la propiedad e <strong>invalida</strong> al dueño anterior. Los tipos que implementan <code>Copy</code> (enteros, <code>bool</code>, <code>char</code>…) se copian bit a bit en vez de moverse, porque son baratos y no poseen recursos del heap.'
    },
    como: {
      blocks: [
        { title: "Un String — se mueve", code:
'<span class="kw">let</span> a = String::from(<span class="st">"hola"</span>);\n<span class="kw">let</span> b = a;            <span class="cm">// a se MUEVE a b</span>\n<span class="cm">// a ya no es válido aquí</span>\nprintln!(<span class="st">"{}"</span>, b);   <span class="cm">// ✓ ok</span>' },
        { title: "Un i32 — se copia (Copy)", code:
'<span class="kw">let</span> a = <span class="nm">5</span>;\n<span class="kw">let</span> b = a;            <span class="cm">// a se COPIA a b</span>\n<span class="cm">// a sigue válido</span>\nprintln!(<span class="st">"{}"</span>, a);   <span class="cm">// ✓ ok</span>' }
      ],
      prose: 'Cuando el dueño muere, Rust llama a <code>drop</code> (RAII) y libera el heap asociado. Nunca hay doble liberación ni fuga: es una propiedad <em>del diseño del lenguaje</em>, no de una heurística en runtime.'
    },
    widget: "ownership",
    sim: { title: "Mira la propiedad transferirse", intro: 'Cambia el tipo, avanza el programa y observa el dueño saltar de <code>a</code> a <code>b</code>. Luego pulsa «usar a» y deja que el borrow checker responda.' },
    mito: {
      myth: '«<code>let b = a</code> copia el valor, como en Python o JS.»',
      real: 'Para un tipo que posee heap, <strong>mueve</strong> la propiedad y deja el original inválido. En Python/JS, <code>b = a</code> comparte una referencia y el GC decide más tarde cuándo liberar. Aquí no hay «más tarde»: la liberación es un punto exacto del programa.'
    },
    recursos: [
      { kind: "The Rust Book", label: "Ownership — «What is Ownership?» (cap. 4.1)", href: "https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html" },
      { kind: "Libro ⭐", label: "Rust for Rustaceans — Jon Gjengset (tipos y memoria)", href: "https://rust-for-rustaceans.com/" },
      { kind: "Vídeo", label: "Visualizing memory layout of Rust's data types", href: "https://www.youtube.com/watch?v=rDoqT-a6UFg" }
    ]
  };

  T["borrowing"] = {
    slug: "borrowing", star: true, difficulty: 2,
    kicker: "La regla de oro",
    title: "Borrowing y referencias",
    tagline: "Prestar acceso sin transferir la propiedad. La regla de oro: muchas & inmutables, o una sola &mut — nunca ambas.",
    avoid: "Un &mut mientras viven lectores: aliasing XOR mutabilidad.",
    lede: 'A veces solo quieres <em>prestar</em> acceso a un valor sin transferir la propiedad. La regla que garantiza la seguridad: <em>o muchas referencias inmutables, o una sola mutable</em> — nunca ambas a la vez.',
    enBreve: [
      { k: "&T", v: "Préstamo <strong>compartido</strong>: solo lectura, muchos a la vez." },
      { k: "&mut T", v: "Préstamo <strong>exclusivo</strong>: lectura/escritura, único." },
      { k: "La regla", v: "Aliasing <strong>XOR</strong> mutabilidad." },
      { k: "Garantiza", v: "Cero carreras de datos — verificado en compilación." }
    ],
    fundamento: {
      fuerza: 'La exclusividad del <code>&mut</code> es lo que <strong>elimina las carreras de datos y el aliasing peligroso</strong> — en compilación. Si nadie más puede leer mientras alguien escribe, no hay estado a medio actualizar que otro pueda observar.',
      prose: '<code>&T</code> es un préstamo <strong>compartido</strong> (solo lectura, puede haber muchos). <code>&mut T</code> es un préstamo <strong>exclusivo</strong> (lectura/escritura, único). El compilador prohíbe un <code>&mut</code> mientras existan otros préstamos activos.'
    },
    como: {
      blocks: [
        { title: "aliasing XOR mutabilidad", code:
'<span class="kw">let mut</span> s = String::from(<span class="st">"hola"</span>);\n<span class="kw">let</span> r1 = &s;        <span class="cm">// préstamo compartido</span>\n<span class="kw">let</span> r2 = &s;        <span class="cm">// otro más → ok, ambos leen</span>\n<span class="kw">let</span> w  = &<span class="kw">mut</span> s;    <span class="cm">// ✗ E0502: ya hay lectores</span>' }
      ]
    },
    widget: "borrowing",
    sim: { title: "El tablero de préstamos", intro: 'Saca préstamos sobre <code>s</code>. Muchos <code>&</code> conviven (verde). Pide un <code>&mut</code> mientras hay lectores y el borrow checker te para en seco.' },
    mito: {
      myth: '«El borrow checker es un capricho que estorba.»',
      real: 'El caso clásico: mutar un <code>Vec</code> mientras lo iteras. El iterador tiene un <code>&</code> vivo; un <code>push</code> pide <code>&mut</code> y podría reubicar el buffer, invalidando al iterador. La misma regla que te frena aquí es la que en C++ es un bug silencioso.'
    },
    recursos: [
      { kind: "The Rust Book", label: "References and Borrowing (cap. 4.2)", href: "https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html" },
      { kind: "Nomicon", label: "The Rustonomicon — Aliasing", href: "https://doc.rust-lang.org/nomicon/aliasing.html" },
      { kind: "Referencia", label: "std — el tipo referencia &T / &mut T", href: "https://doc.rust-lang.org/std/primitive.reference.html" }
    ]
  };

  T["lifetimes"] = {
    slug: "lifetimes", star: false, difficulty: 3,
    kicker: "Sin punteros colgantes",
    title: "Lifetimes y el borrow checker",
    tagline: "Ninguna referencia sobrevive al dato que apunta. Lifetimes (casi siempre inferidos) lo expresan; NLL y Polonius lo verifican.",
    avoid: "Anotar lifetimes a mano cuando la inferencia ya basta.",
    lede: '¿Cómo garantiza Rust que una referencia <em>nunca</em> sobreviva al dato que apunta? Con <em>lifetimes</em>: regiones de validez, casi siempre inferidas, que el borrow checker verifica sobre el flujo del programa.',
    enBreve: [
      { k: "Qué es", v: "Una <strong>región de validez</strong> asignada a cada referencia." },
      { k: "Garantía", v: "Ninguna referencia sobrevive a su dato." },
      { k: "NLL (2018)", v: "La región se ajusta al <strong>uso real</strong>, no a las llaves." },
      { k: "En la práctica", v: "Casi siempre <strong>inferidos</strong> (elisión); rara vez a mano." }
    ],
    fundamento: {
      fuerza: 'Un lifetime dice: <em>«esta referencia vive, como mucho, tanto como aquel dato»</em>. El borrow checker asigna a cada referencia una región y comprueba que no se use fuera de la vida de su referente. Así, un puntero colgante deja de existir como categoría de error.',
      prose: 'Desde <strong>NLL</strong> (Non-Lexical Lifetimes, 2018) las regiones se ajustan al <strong>uso real</strong>, no a las llaves <code>{}</code>. <strong>Polonius</strong> (nueva generación, en nightly rumbo a estabilización) es un análisis basado en flujo de datos aún más preciso, que acepta patrones correctos que el checker actual todavía rechaza.'
    },
    como: {
      blocks: [
        { title: "una referencia no puede sobrevivir a su dato", code:
'<span class="kw">let</span> r;\n{\n    <span class="kw">let</span> x = String::from(<span class="st">"dato"</span>);\n    r = &x;          <span class="cm">// r toma prestado x</span>\n}                    <span class="cm">// x muere aquí ── fin de su región</span>\nprintln!(<span class="st">"{}"</span>, r);  <span class="cm">// ✗ E0597: x no vive lo suficiente</span>' }
      ]
    },
    widget: "lifetimes",
    sim: { title: "Barras de vida", intro: 'Mueve el <strong>último uso de <code>r</code></strong> con el deslizador. Mientras la vida de <code>r</code> quepa dentro de la de <code>x</code>, todo verde. Crúzala y verás el préstamo colgante. Cambia el modelo del checker para ver la diferencia NLL vs léxico.' },
    mito: {
      myth: '«Los lifetimes son anotaciones que tengo que escribir a mano por todas partes.»',
      real: 'Casi siempre se <strong>infieren</strong> (elisión de lifetimes). Solo los escribes cuando la relación entre varias referencias es ambigua. Y desde NLL, el checker razona sobre el <em>flujo real</em>, no sobre las llaves — Polonius lo afina aún más.'
    },
    recursos: [
      { kind: "The Rust Book", label: "Validating References with Lifetimes (cap. 10.3)", href: "https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html" },
      { kind: "Vídeo", label: "Crust of Rust: Subtyping and Variance — Jon Gjengset", href: "https://www.youtube.com/watch?v=iVYWDIW71jk" },
      { kind: "Oficial", label: "Polonius — current status", href: "https://rust-lang.github.io/polonius/current_status.html" }
    ]
  };

})(window.GUIA = window.GUIA || {});
