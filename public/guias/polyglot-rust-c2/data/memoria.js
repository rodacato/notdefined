/* memoria.js — Bloque 3: stack-heap-drop, panic, rc-refcell, layout. */
(function (G) {
  "use strict";
  var T = (G.temas = G.temas || {});

  T["stack-heap-drop"] = {
    slug: "stack-heap-drop", star: true, difficulty: 1,
    kicker: "Liberación determinista",
    title: "Stack, heap, Box y RAII/Drop",
    tagline: "Sin GC, la liberación es determinista: al final del ámbito, vía Drop, en orden inverso. Box mueve un valor al heap.",
    avoid: "Buscar un recolector: aquí sabes el punto exacto de liberación.",
    lede: 'Sin GC, ¿quién libera y cuándo? La respuesta es <em>determinista</em>: cuando el dueño sale de ámbito, vía RAII y el trait <code>Drop</code>. Sabes <em>exactamente</em> en qué línea se libera cada cosa.',
    enBreve: [
      { k: "Pila", v: "Los valores viven ahí por defecto: baratos, LIFO." },
      { k: "Box<T>", v: "Mueve el valor al <strong>heap</strong>; deja un puntero en la pila." },
      { k: "RAII", v: "Se libera al morir el dueño — punto conocido en compilación." },
      { k: "Orden", v: "Los <code>drop</code> corren en <strong>orden inverso</strong> de declaración." }
    ],
    fundamento: {
      fuerza: 'RAII (Resource Acquisition Is Initialization): un recurso se libera <strong>solo</strong> cuando su dueño muere, en un punto <em>conocido en compilación</em>. Nada de finalizadores impredecibles ni pausas de recolector — la limpieza (cerrar archivos, liberar buffers) ocurre en orden inverso de declaración.',
      prose: 'Los valores viven en la <strong>pila</strong> por defecto (baratos, LIFO). <code>Box&lt;T&gt;</code> mueve un valor al <strong>heap</strong> y deja un puntero en la pila; al morir el <code>Box</code>, se libera el heap.'
    },
    como: {
      blocks: [
        { title: "drop en orden inverso", code:
'<span class="kw">fn</span> <span class="fn">main</span>() {\n    <span class="kw">let</span> a = <span class="nm">1</span>;                  <span class="cm">// pila</span>\n    <span class="kw">let</span> b = Box::new(<span class="nm">2</span>);         <span class="cm">// heap; puntero en la pila</span>\n    <span class="kw">let</span> c = String::from(<span class="st">"x"</span>);   <span class="cm">// heap; ptr/len/cap en la pila</span>\n}   <span class="cm">// drop(c) → drop(b) → drop(a)  (orden inverso)</span>' }
      ]
    },
    widget: "stack-heap-drop",
    sim: { title: "Mira la memoria crecer y liberarse", intro: 'Avanza el programa: las variables se apilan (LIFO); <code>Box</code> y <code>String</code> reservan en el heap. Al cerrar el ámbito, los <code>drop</code> se disparan en <em>orden inverso</em> — obsérvalo en la consola.' },
    mito: {
      myth: '«Sin GC tendré que liberar memoria a mano, como en C.»',
      real: 'No hay ni <code>free</code> manual ni recolector: el compilador <strong>inserta el drop por ti</strong> al final del ámbito. Determinismo de C++ RAII, seguridad garantizada. En Go/Python/JS el GC decide «más tarde»; aquí es una línea exacta.'
    },
    recursos: [
      { kind: "The Rust Book", label: "Using Box<T> to Point to Data on the Heap (15.1)", href: "https://doc.rust-lang.org/book/ch15-01-box.html" },
      { kind: "Nomicon", label: "The Rustonomicon — Destructors (Drop)", href: "https://doc.rust-lang.org/nomicon/destructors.html" },
      { kind: "Libro", label: "Rust Atomics and Locks — Mara Bos (básicos de memoria)", href: "https://marabos.nl/atomics/" }
    ]
  };

  T["panic"] = {
    slug: "panic", star: false, difficulty: 2,
    kicker: "Cuando un invariante se rompe",
    title: "panic: unwind vs abort",
    tagline: "El desenrollado de pila corre los Drop en orden inverso; catch_unwind lo atrapa. panic=abort corta en seco — y por eso existe.",
    avoid: "Usar panic como control de flujo — ? y panic son mecanismos distintos.",
    lede: 'Un panic no es una excepción que atrapas de rutina: es el aviso de que un <em>invariante se rompió</em>. Por defecto Rust desenrolla la pila corriendo cada <code>Drop</code>; en release puedes elegir abortar en seco.',
    enBreve: [
      { k: "Por defecto", v: "<strong>Unwind</strong>: desenrolla la pila y corre cada <code>Drop</code>." },
      { k: "panic=abort", v: "Corta en seco: sin desenrollado, binario más pequeño." },
      { k: "catch_unwind", v: "Atrapa un unwind en un límite (FFI, thread)." },
      { k: "No es try/catch", v: "Para errores esperados: <code>Result</code> y <code>?</code>." }
    ],
    fundamento: {
      fuerza: 'El unwind es lo que mantiene la seguridad incluso al fallar: cada valor de la pila que se desenrolla corre su <code>Drop</code>, así que los archivos se cierran y los locks se sueltan aunque el programa esté cayendo. <code>panic=abort</code> renuncia a eso a cambio de un binario más pequeño y sin la maquinaria de unwinding.',
      prose: 'Con <code>panic = "unwind"</code> (default), un <code>panic!</code> recorre la pila hacia atrás corriendo destructores hasta el borde del hilo. <code>std::panic::catch_unwind</code> detiene ese desenrollado en un punto — útil en el límite con C o para que un thread no tumbe al proceso. Con <code>panic = "abort"</code>, el proceso llama a <code>abort()</code> de inmediato: nada de <code>Drop</code>, nada que atrapar.'
    },
    como: {
      blocks: [
        { title: "unwind corre los Drop", code:
'<span class="kw">fn</span> <span class="fn">trabaja</span>() {\n    <span class="kw">let</span> _f = File::create(<span class="st">"x"</span>).unwrap();\n    panic!(<span class="st">"algo se rompió"</span>);\n}   <span class="cm">// unwind: drop(_f) cierra el archivo al caer</span>' },
        { title: "? y panic son distintos", code:
'<span class="cm">// error esperado → Result + ?</span>\n<span class="kw">let</span> texto = fs::read_to_string(ruta)?;\n\n<span class="cm">// bug / invariante roto → panic</span>\n<span class="kw">assert!</span>(saldo &gt;= <span class="nm">0</span>, <span class="st">"saldo negativo: bug"</span>);' }
      ]
    },
    widget: "panic",
    sim: { title: "Desenrolla o aborta", intro: 'Elige el modo y provoca un <code>panic!</code>. En <em>unwind</em>, la pila se desenrolla marco a marco corriendo cada <code>Drop</code>; activa <code>catch_unwind</code> para atraparlo. En <em>abort</em>, el proceso muere sin correr nada.' },
    mito: {
      myth: '«panic es el try/catch de Rust: lo uso para manejar errores.»',
      real: '<code>panic</code> es para invariantes rotos e irrecuperables (un bug). Los errores esperados —archivo ausente, entrada inválida— se modelan con <code>Result</code> y se propagan con <code>?</code>. <code>catch_unwind</code> existe para límites (FFI, aislar un thread), no para control de flujo cotidiano.'
    },
    recursos: [
      { kind: "The Rust Book", label: "To panic! or Not to panic! (cap. 9.3)", href: "https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html" },
      { kind: "Referencia", label: "std::panic::catch_unwind", href: "https://doc.rust-lang.org/std/panic/fn.catch_unwind.html" },
      { kind: "Nomicon", label: "The Rustonomicon — Unwinding", href: "https://doc.rust-lang.org/nomicon/unwinding.html" }
    ]
  };

  T["rc-refcell"] = {
    slug: "rc-refcell", star: false, difficulty: 3,
    kicker: "Propiedad compartida sin GC",
    title: "Rc/Arc e interior mutability",
    tagline: "Propiedad compartida con refcount explícito (Rc/Arc) y mutabilidad interior (RefCell/Mutex): un mini-GC local y controlado.",
    avoid: "Ciclos de Rc: fugan memoria — por eso existe Weak.",
    lede: 'La regla «un solo dueño» es estricta. ¿Y cuando de verdad necesitas <em>compartir</em>? Rust ofrece conteo de referencias explícito (<code>Rc</code>/<code>Arc</code>) y mutabilidad interior — como «optar» por un mini-GC local y controlado.',
    enBreve: [
      { k: "Rc<T>", v: "Refcount de un solo hilo; libera al llegar a 0." },
      { k: "Arc<T>", v: "La versión atómica, segura entre hilos." },
      { k: "RefCell", v: "Mueve «aliasing XOR mut» a <strong>runtime</strong> (panic si se viola)." },
      { k: "Ciclos", v: "Un <code>Rc</code> en ciclo fuga; <code>Weak</code> lo rompe." }
    ],
    fundamento: {
      fuerza: 'Grafos, árboles con padres, cachés compartidas: estructuras donde un valor tiene <em>varios</em> dueños legítimos. <code>Rc</code> cuenta referencias y libera al llegar a 0; <code>RefCell</code> mueve el chequeo de préstamos a runtime cuando el compilador no puede probarlo estáticamente.',
      prose: '<code>Rc&lt;T&gt;</code>: refcount de un solo hilo. <code>Arc&lt;T&gt;</code>: la versión atómica, segura entre hilos. Patrón típico: <code>Rc&lt;RefCell&lt;T&gt;&gt;</code> (single-thread) o <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> (multi-thread).'
    },
    como: {
      blocks: [
        { title: "compartir + mutar por dentro", code:
'<span class="kw">let</span> a = Rc::new(Gato);        <span class="cm">// strong = 1</span>\n<span class="kw">let</span> b = Rc::clone(&a);        <span class="cm">// strong = 2 (no copia el Gato)</span>\n\n<span class="kw">let</span> c = Rc::new(RefCell::new(<span class="nm">0</span>));\n*c.borrow_mut() += <span class="nm">1</span>;         <span class="cm">// chequeo en runtime</span>' }
      ]
    },
    widget: "rc-refcell",
    sim: { title: "Cuenta, presta y ata cabos", intro: 'Tres pestañas: sube y baja el <code>strong_count</code> de un <code>Rc</code>; pide préstamos a un <code>RefCell</code> hasta hacerlo paniquear en runtime; y arma un ciclo para verlo fugar — hasta que cambias una arista a <code>Weak</code>.' },
    mito: {
      myth: '«Rust no tiene GC, así que nunca puede haber fugas de memoria.»',
      real: 'Un ciclo de <code>Rc</code> <strong>sí</strong> fuga: los contadores nunca llegan a 0. La seguridad de memoria (sin dangling) está garantizada, pero las fugas son «seguras» y posibles. La cura: <code>Weak</code>, que no incrementa el contador fuerte.'
    },
    recursos: [
      { kind: "The Rust Book", label: "Rc<T>, the Reference Counted Smart Pointer (15.4)", href: "https://doc.rust-lang.org/book/ch15-04-rc.html" },
      { kind: "The Rust Book", label: "RefCell<T> and Interior Mutability (15.5)", href: "https://doc.rust-lang.org/book/ch15-05-interior-mutability.html" },
      { kind: "Vídeo", label: "Crust of Rust: Smart Pointers and Interior Mutability", href: "https://www.youtube.com/watch?v=8O0Nt9qY_vo" }
    ]
  };

  T["layout"] = {
    slug: "layout", star: false, difficulty: 3,
    kicker: "Bytes, padding y trucos",
    title: "Layout de memoria y niche",
    tagline: "Structs con padding (Rust puede reordenar campos); enums como uniones etiquetadas; niche optimization elimina el discriminante.",
    avoid: "Asumir el orden de campos de tu declaración salvo repr(C).",
    lede: '¿Cómo se guardan exactamente un <code>struct</code>, un <code>enum</code> o un <code>Option</code>? Rust da control y hace optimizaciones inteligentes. El layout explica el rendimiento y el interop con C.',
    enBreve: [
      { k: "Reordena", v: "Rust reordena campos por alineación (salvo <code>repr(C)</code>)." },
      { k: "enum", v: "Unión etiquetada: discriminante + espacio del variante mayor." },
      { k: "niche", v: "Valores imposibles eliminan el discriminante." },
      { k: "FFI", v: "<code>#[repr(C)]</code> fija el orden — aceptas el padding." }
    ],
    fundamento: {
      fuerza: 'Por defecto Rust <strong>reordena los campos</strong> de un struct para minimizar el padding — no respeta el orden en que los declaras (salvo <code>repr(C)</code>). Y con la <strong>niche optimization</strong>, envolver en <code>Option</code> puede costar 0 bytes.',
      prose: 'Los <code>enum</code> son <strong>uniones etiquetadas</strong>: un discriminante + el espacio del variante más grande. El nicho usa valores imposibles (p.ej. el puntero nulo) para eliminar ese discriminante.'
    },
    como: {
      blocks: [
        { title: "el mismo struct, dos tamaños", code:
'<span class="kw">struct</span> Foo { a: u8, b: u64, c: u16 }\n\nsize_of::&lt;Foo&gt;()            <span class="cm">// 16 (Rust reordena)</span>\nsize_of::&lt;Foo&gt;() <span class="cm">con repr(C)   // 24 (padding forzado)</span>' }
      ]
    },
    widget: "layout",
    sim: { title: "Cuenta los bytes", intro: 'Tres pestañas: mira el padding de un struct cambiar entre el orden de Rust y <code>#[repr(C)]</code>; el tamaño de un <code>enum</code> según su variante; y cómo el nicho mantiene <code>Option&lt;&T&gt;</code> en 8 bytes.' },
    mito: {
      myth: '«Los campos de mi struct están en memoria en el orden en que los escribí.»',
      real: 'Rust los reordena por alineación para compactar el padding. Si necesitas el orden exacto (FFI con C, formatos binarios), pides <code>#[repr(C)]</code> — y aceptas el padding que eso implica.'
    },
    recursos: [
      { kind: "Nomicon", label: "The Rustonomicon — Data Layout", href: "https://doc.rust-lang.org/nomicon/data.html" },
      { kind: "Libro", label: "Rust for Rustaceans — cap. Types", href: "https://rust-for-rustaceans.com/" },
      { kind: "Vídeo", label: "Visualizing Rust data layout", href: "https://www.youtube.com/watch?v=rDoqT-a6UFg" }
    ]
  };

})(window.GUIA = window.GUIA || {});
