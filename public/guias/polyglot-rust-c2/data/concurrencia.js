/* concurrencia.js — Bloque 4: send-sync, async-futures, executors. */
(function (G) {
  "use strict";
  var T = (G.temas = G.temas || {});

  T["send-sync"] = {
    slug: "send-sync", star: true, difficulty: 3,
    kicker: "El «wow» de Rust",
    title: "Send, Sync y fearless concurrency",
    tagline: "Las carreras de datos son errores de compilación. Sin GIL/GVL. Rc no es Send; Arc sí. La regla del borrow checker, extendida a hilos.",
    avoid: "Compartir un Rc entre hilos: el compilador lo impide antes de ejecutar.",
    lede: 'Las carreras de datos son <em>errores de compilación</em>. Sin GIL, sin GVL, sin candado global — y aun así es imposible, en código seguro, que dos hilos toquen el mismo dato sin sincronizar. La magia son dos traits.',
    enBreve: [
      { k: "Send", v: "El tipo se puede <strong>mover</strong> a otro hilo." },
      { k: "Sync", v: "El tipo se puede <strong>compartir</strong> (<code>&T</code>) entre hilos." },
      { k: "Rc vs Arc", v: "<code>Rc</code> no es Send; <code>Arc</code> sí (contador atómico)." },
      { k: "La garantía", v: "Carreras de datos = <strong>errores de compilación</strong>." }
    ],
    fundamento: {
      fuerza: '<code>Send</code> = «este tipo se puede <strong>mover</strong> a otro hilo». <code>Sync</code> = «se puede <strong>compartir por referencia</strong> (<code>&T</code>) entre hilos». El compilador los deriva solo y <strong>rechaza</strong> cualquier intento inseguro. La misma regla «aliasing XOR mutabilidad», extendida a hilos.',
      prose: 'Por eso <code>Rc</code> (contador no atómico) <strong>no</strong> es <code>Send</code>, pero <code>Arc</code> sí. Y para <em>mutar</em> algo compartido necesitas un <code>Mutex</code>, que hace <code>&T</code> apto para escritura sincronizada — volviéndolo <code>Sync</code>.'
    },
    como: {
      blocks: [
        { title: "compartir un contador entre hilos", code:
'<span class="kw">let</span> contador = Arc::new(Mutex::new(<span class="nm">0</span>));\n<span class="kw">let</span> c2 = Arc::clone(&contador);\nthread::spawn(<span class="kw">move</span> || {\n    <span class="kw">let mut</span> n = c2.lock().unwrap();  <span class="cm">// toma el candado</span>\n    *n += <span class="nm">1</span>;                         <span class="cm">// mutación segura</span>\n});                                    <span class="cm">// el candado se libera al soltar n</span>' }
      ]
    },
    widget: "send-sync",
    sim: { title: "Manda el dato a otro hilo", intro: 'Elige cómo envuelves el contador y trata de compartirlo con un segundo hilo para incrementarlo. El compilador responde <em>antes de ejecutar</em>. Solo <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> pasa — y entonces puedes correrlo.' },
    mito: {
      myth: '«Sin un candado global como el GIL, las carreras de datos son inevitables.»',
      real: 'En Ruby/Python el candado global es en <em>runtime</em>; en Go la carrera se detecta con <code>-race</code>, también en runtime. Rust la <strong>impide antes de ejecutar</strong>: <code>Send</code>/<code>Sync</code> convierten la carrera en un error de tipos.'
    },
    recursos: [
      { kind: "Libro ⭐", label: "Rust Atomics and Locks — Mara Bos (gratis online)", href: "https://marabos.nl/atomics/" },
      { kind: "Nomicon", label: "The Rustonomicon — Send and Sync", href: "https://doc.rust-lang.org/nomicon/send-and-sync.html" },
      { kind: "The Rust Book", label: "Fearless Concurrency (cap. 16)", href: "https://doc.rust-lang.org/book/ch16-00-concurrency.html" }
    ]
  };

  T["async-futures"] = {
    slug: "async-futures", star: false, difficulty: 3,
    kicker: "Nada corre hasta que lo conducen",
    title: "async/await: máquinas de estado",
    tagline: "async no lanza nada: transforma tu fn en un enum de estados que implementa Future. poll la avanza; Pin la fija en memoria.",
    avoid: "Esperar que un Future corra solo: nada ocurre hasta que se le hace poll.",
    lede: 'En Rust, <code>async</code> <em>no lanza hilos ni tareas</em>: transforma tu función en una <em>máquina de estado</em> que implementa <code>Future</code>. Nada corre hasta que alguien la conduce con <code>poll</code>.',
    enBreve: [
      { k: "async fn", v: "No lanza nada: construye un <code>Future</code> inerte." },
      { k: "Future", v: "Un <code>enum</code> cuyos variantes son los estados entre cada <code>await</code>." },
      { k: "poll", v: "Lo avanza; devuelve <code>Pending</code> o <code>Ready</code>." },
      { k: "Pin", v: "Fija la máquina en memoria (puede ser self-referencial)." }
    ],
    fundamento: {
      fuerza: 'Un <code>Future</code> es un valor <em>inerte</em>: describe un cómputo pausable, no lo ejecuta. Esto permite componer miles de tareas sin un hilo por cada una — pero implica que <strong>siempre necesitas un executor</strong> que llame a <code>poll</code> (ver ficha siguiente).',
      prose: 'El compilador <strong>desazucariza</strong> una <code>async fn</code> en un <code>enum</code> cuyos variantes son los <strong>estados</strong> entre cada <code>await</code>. <code>poll(Pin&lt;&mut Self&gt;, Context)</code> devuelve <code>Pending</code> o <code>Ready</code>.'
    },
    como: {
      blocks: [
        { title: "lo que escribes", code:
'<span class="kw">async fn</span> <span class="fn">tarea</span>() -> u32 {\n    <span class="kw">let</span> a = leer_a().<span class="kw">await</span>;\n    <span class="kw">let</span> b = leer_b().<span class="kw">await</span>;\n    a + b\n}' },
        { title: "en lo que se convierte", code:
'<span class="kw">enum</span> TareaFut {\n    Start,\n    EsperaA(FutA),   <span class="cm">// estado tras 1er await</span>\n    EsperaB(FutB, u32),\n    Done,\n}' }
      ]
    },
    widget: "async-futures",
    sim: { title: "poll paso a paso", intro: 'Marca si cada sub-future está listo o pendiente, y pulsa <strong>poll()</strong>. La máquina solo avanza cuando el <code>await</code> actual resuelve; si no, devuelve <code>Pending</code> y se pausa guardando su estado.' },
    mito: {
      myth: '«Llamar a una async fn la pone a ejecutarse, como en JS.»',
      real: 'Solo construye el <code>Future</code> (la struct de estados) y lo devuelve <em>sin ejecutar nada</em>. En JS la promesa ya arrancó; Python en cambio ya es perezoso como Rust — una <code>async def</code> te devuelve una corrutina inerte —, y lo que Rust suma es que tampoco hay event loop implícito: sin un executor que haga <code>poll</code>, nadie la mueve. Es una struct concreta que tú controlas.'
    },
    recursos: [
      { kind: "Oficial ⭐", label: "Asynchronous Programming in Rust (async book)", href: "https://rust-lang.github.io/async-book/" },
      { kind: "Deep-dive", label: "Understanding Rust futures by going way too deep — Amos", href: "https://fasterthanli.me/articles/understanding-rust-futures-by-going-way-too-deep" },
      { kind: "Vídeo", label: "Crust of Rust: async/await — Jon Gjengset", href: "https://www.youtube.com/watch?v=ThjvMReOXYM" }
    ]
  };

  T["executors"] = {
    slug: "executors", star: false, difficulty: 3,
    kicker: "El lenguaje trae el qué; la librería, el cuándo",
    title: "Executors y runtimes (tokio)",
    tagline: "El lenguaje define el qué; tú traes el executor. Cola → poll → aparcar en el reactor → waker → re-encolar. Work-stealing, como Go.",
    avoid: "Creer que async trae runtime: tú eliges tokio / smol.",
    lede: 'Si <code>async</code> solo crea máquinas de estado inertes, <em>¿quién las hace avanzar?</em> Un <strong>executor</strong>. Y como el lenguaje no trae uno, eliges una librería: <strong>tokio</strong> es el estándar de facto.',
    enBreve: [
      { k: "El reparto", v: "El lenguaje trae el modelo; tú traes el <strong>executor</strong>." },
      { k: "El ciclo", v: "cola → poll → aparca en reactor → waker → re-encola." },
      { k: "tokio", v: "Estándar de facto; <em>work-stealing</em> entre hilos, como Go." },
      { k: "Sin runtime", v: "Sin <code>#[tokio::main]</code>, un Future nunca corre." }
    ],
    fundamento: {
      fuerza: 'Separar «lenguaje» de «runtime» es único entre los cinco lenguajes de la serie. Rust define el <em>modelo</em> (<code>Future</code>, <code>poll</code>, <code>Waker</code>) en la stdlib, pero <strong>no incluye scheduler</strong>: eliges tokio, smol o escribes el tuyo, según tu caso.',
      prose: 'El <strong>executor</strong> hace <code>poll</code> sobre las tareas listas. Cuando una devuelve <code>Pending</code>, se <strong>aparca</strong>; el <strong>reactor</strong> (mio/epoll/kqueue) registra el descriptor y, al haber actividad, usa el <strong>waker</strong> para <strong>re-encolarla</strong>. tokio reparte con <em>work-stealing</em> — como el scheduler GMP de Go, pero en una librería.'
    },
    como: {
      blocks: [
        { title: "el runtime conduce los futures", code:
'#[tokio::main]\n<span class="kw">async fn</span> <span class="fn">main</span>() {\n    <span class="kw">let</span> h = tokio::spawn(tarea());  <span class="cm">// encola en el runtime</span>\n    h.<span class="kw">await</span>.unwrap();               <span class="cm">// el executor la conduce</span>\n}' }
      ]
    },
    widget: "executors",
    sim: { title: "Cola → poll → reactor → waker", intro: 'Lanza tareas y da <strong>tick</strong> al scheduler (o pon <strong>auto</strong>). Verás cómo una tarea bloqueada en I/O <em>no ocupa el hilo</em>: se aparca en el reactor y despierta cuando el SO avisa, mientras otras avanzan.' },
    mito: {
      myth: '«<code>async</code> en Rust trae su propio runtime, como las goroutines de Go.»',
      real: 'Sin <code>#[tokio::main]</code> (o un executor equivalente), un <code>Future</code> nunca se ejecuta: el compilador incluso te avisa de futures sin usar. El lenguaje da el modelo; la librería, el motor.'
    },
    recursos: [
      { kind: "tokio ⭐", label: "Tokio Tutorial: Async in depth", href: "https://tokio.rs/tokio/tutorial/async" },
      { kind: "Rust Magazine", label: "How Tokio schedules tasks", href: "https://rustmagazine.org/issue-4/how-tokio-schedule-tasks/" },
      { kind: "async book", label: "Executing Futures and Tasks", href: "https://rust-lang.github.io/async-book/" }
    ]
  };

})(window.GUIA = window.GUIA || {});
