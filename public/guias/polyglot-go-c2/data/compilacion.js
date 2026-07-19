/* data/compilacion.js — Bloque 1 · Del código al binario.
   Contenido (textos, ejemplos, pasos). Editar aquí no toca el motor. */
(function (G) {
  "use strict";
  G.registerBlock({ id: "compilacion", label: "Bloque 1 · Del código al binario", short: "Compilación", accent: "var(--fam-comp)" });

  G.registerTopics([
    {
      slug: "pipeline-aot", folio: "01", block: "compilacion", difficulty: 2, star: false,
      title: "El pipeline de compilación (AOT → binario)", shortTitle: "Pipeline",
      tagline: "No hay bytecode ni VM: obtienes un ejecutable nativo con el runtime dentro.",
      avoid: "Pensar que Go «arranca» un intérprete o JIT al ejecutar.",
      lede: "Compilar Go no da bytecode para una VM: da un <em>ejecutable nativo</em> que ya lleva dentro tu código <strong>más el runtime</strong>. No hay arranque en frío de un JIT ni intérprete.",
      fuerza: { icon: "box", html: "Ruby y JS necesitan un intérprete y un JIT presentes en tiempo de ejecución para arrancar y acelerar. Go elimina esa capa: compila <em>ahead-of-time</em> a código máquina y empaqueta un binario autocontenido. El runtime (scheduler, GC, allocator) no es un proceso aparte — viaja incrustado dentro del propio ejecutable." },
      brief: [
        "AOT: compila a código máquina nativo, no a bytecode.",
        "El runtime (sched · GC · alloc) va enlazado dentro del binario.",
        "Sin warm-up ni recompilación en caliente al ejecutar.",
        "Precio: binarios más grandes y sin adaptación dinámica tipo JIT."
      ],
      mito: { claim: "Go compila a bytecode como Java o Python.", body: "No. Go genera <strong>código máquina nativo</strong> directamente; no hay una VM que interprete instrucciones intermedias en ejecución. La «IR» (SSA) es interna al compilador y desaparece antes de producir el binario. Lo que sí viaja siempre es el <em>runtime</em> de Go, enlazado estáticamente." },
      recursos: [
        { star: true, title: "Go compiler internals (cmd/compile README)", desc: "el recorrido oficial de las fases del compilador.", kind: "código", href: "https://github.com/golang/go/tree/master/src/cmd/compile" },
        { star: false, title: "Introduction to the SSA backend", desc: "qué pasa entre el AST y el código máquina.", kind: "código", href: "https://github.com/golang/go/blob/master/src/cmd/compile/internal/ssa/README.md" }
      ],
      viz: {
        title: "Visualízalo · de la fuente al binario",
        stages: [
          { label: "Fuente .go", sub: "scanner → parser", ev: "El scanner tokeniza y el parser construye el AST a partir del texto." },
          { label: "AST + tipos", sub: "type checking", ev: "Árbol sintáctico con verificación de tipos: aquí se atrapan los errores de tipo." },
          { label: "SSA IR", sub: "optimización", ev: "Forma intermedia SSA: decenas de pases de optimización (inlining, DCE, bounds-check…)." },
          { label: "Código máquina", sub: "codegen", ev: "Generación de asm nativo para la arquitectura destino (amd64, arm64…)." },
          { label: "Binario estático", sub: "linker + runtime", ev: "El linker une tu código con el runtime (scheduler + GC + allocator): un ejecutable autocontenido." }
        ],
        notes: [
          { html: "Todo esto ocurre <strong>una vez, al compilar</strong>. El binario resultante corre directo sobre la CPU: sin warm-up, sin recompilación en caliente. El precio: binarios más grandes (llevan el runtime) y sin las adaptaciones dinámicas que un JIT hace observando la ejecución real." }
        ]
      }
    },

    {
      slug: "ssa-pgo", folio: "02", block: "compilacion", difficulty: 3, star: false,
      title: "El compilador y la SSA IR", shortTitle: "SSA",
      tagline: "El taller invisible: forma SSA + pases de optimización, ahora guiados por PGO.",
      avoid: "Creer que optimizar es cosa del runtime, como en un JIT.",
      lede: "Antes de generar código máquina, Go transforma tu programa a <em>SSA</em>, donde cada variable se asigna una sola vez. Es el taller invisible donde tu código se hace rápido.",
      fuerza: { icon: "build", html: "Optimizar directamente sobre el AST es difícil: una variable cambia de valor muchas veces y seguir su rastro es enredado. En SSA cada nombre se asigna <em>exactamente una vez</em>, así que el flujo de datos es explícito y los pases (inlining, código muerto, bounds-check) se vuelven mecánicos y seguros." },
      brief: [
        "SSA: cada variable se asigna exactamente una vez.",
        "Decenas de pases: inlining, DCE, bounds-check elimination.",
        "PGO (GA en 1.21) sube el umbral de inlining en rutas calientes.",
        "GOSSAFUNC=Foo vuelca la SSA a un HTML navegable, pase por pase."
      ],
      recursos: [
        { star: true, title: "Profile-guided optimization", desc: "go.dev — la guía oficial de PGO (GA desde 1.21).", kind: "doc", href: "https://go.dev/doc/pgo" },
        { star: false, title: "SSA backend README", desc: "la estructura de la IR y sus pases.", kind: "código", href: "https://github.com/golang/go/blob/master/src/cmd/compile/internal/ssa/README.md" }
      ],
      viz: {
        title: "Visualízalo · pases de optimización sobre la SSA",
        passes: {
          off: [
            { name: "SSA inicial", lines: [["v1", "= ConstInt 2"], ["v2", "= ConstInt 3"], ["v3", "= Add v1 v2"], ["v4", "= Call square(v3)"], ["v5", "= BoundsCheck arr v4"], ["v6", "= Load arr v4"], ["ret", "v6"]], ev: "SSA recién construida: una asignación por variable. Sin optimizar." },
            { name: "constant folding", hl: "v3", lines: [["v3", "= ConstInt 5"], ["v4", "= Call square(v3)"], ["v5", "= BoundsCheck arr v4"], ["v6", "= Load arr v4"], ["ret", "v6"]], ev: "Plegado de constantes: 2+3 se calcula en compilación → v3 = 5. v1, v2 desaparecen." },
            { name: "inlining", hl: "v4", lines: [["v3", "= ConstInt 5"], ["v4", "= Call square(v3)"], ["v5", "= BoundsCheck arr v4"], ["v6", "= Load arr v4"], ["ret", "v6"]], ev: "Sin perfil, square() queda bajo el umbral: NO se inlinea. Activa PGO y repite." },
            { name: "constant folding (2ª ronda)", hl: "v4", lines: [["v3", "= ConstInt 5"], ["v4", "= Call square(v3)"], ["v5", "= BoundsCheck arr v4"], ["v6", "= Load arr v4"], ["ret", "v6"]], ev: "Sin inline no hay nada nuevo que plegar." },
            { name: "bounds-check elimination", hl: "v6", lines: [["v3", "= ConstInt 5"], ["v4", "= Call square(v3)"], ["v6", "= Load arr v4"], ["ret", "v6"]], ev: "Se elimina el bounds-check redundante; el Call sigue ahí sin PGO." }
          ],
          on: [
            { name: "SSA inicial", lines: [["v1", "= ConstInt 2"], ["v2", "= ConstInt 3"], ["v3", "= Add v1 v2"], ["v4", "= Call square(v3)"], ["v5", "= BoundsCheck arr v4"], ["v6", "= Load arr v4"], ["ret", "v6"]], ev: "SSA recién construida: una asignación por variable. Sin optimizar." },
            { name: "constant folding", hl: "v3", lines: [["v3", "= ConstInt 5"], ["v4", "= Call square(v3)"], ["v5", "= BoundsCheck arr v4"], ["v6", "= Load arr v4"], ["ret", "v6"]], ev: "Plegado de constantes: 2+3 se calcula en compilación → v3 = 5. v1, v2 desaparecen." },
            { name: "inlining (PGO: ruta caliente)", hl: "v4", lines: [["v3", "= ConstInt 5"], ["v4", "= Mul v3 v3"], ["v5", "= BoundsCheck arr v4"], ["v6", "= Load arr v4"], ["ret", "v6"]], ev: "PGO: square() es ruta caliente en el perfil → se INLINEA a v4 = Mul v3 v3." },
            { name: "constant folding (2ª ronda)", hl: "v4", lines: [["v4", "= ConstInt 25"], ["v5", "= BoundsCheck arr v4"], ["v6", "= Load arr v4"], ["ret", "v6"]], ev: "El inline reveló nuevo plegado: 5*5 = 25 en compilación." },
            { name: "bounds-check elimination", hl: "v6", lines: [["v4", "= ConstInt 25"], ["v6", "= Load arr 25"], ["ret", "v6"]], ev: "Índice constante y probablemente en rango → se ELIMINA el BoundsCheck. Código mínimo." }
          ]
        },
        notes: [
          { html: "Con <strong>PGO</strong> activado, el compilador lee un perfil de ejecución real (<code>default.pgo</code>) y sube el umbral de <em>inlining</em> para las rutas calientes: inlinea funciones que normalmente no tocaría. Es el análogo <em>en tiempo de compilación</em> de lo que un JIT haría observando el programa en marcha." },
          { html: "<code>GOSSAFUNC=Foo go build</code> vuelca la SSA de la función <code>Foo</code> a un HTML navegable, pase por pase — exactamente lo que anima este widget, pero con tu propio código." }
        ]
      }
    },

    {
      slug: "escape-analysis", folio: "03", block: "compilacion", difficulty: 2, star: false,
      title: "Escape analysis: stack vs heap", shortTitle: "Escape",
      tagline: "El compilador decide qué vive en la pila (gratis) y qué escapa al heap (GC).",
      avoid: "Asumir que <code>new</code> / <code>&amp;</code> siempre significa heap.",
      lede: "¿Por qué una variable a veces vive en la <em>pila</em> (barata, se libera sola) y a veces en el <em>heap</em> (la maneja el GC)? Lo decide el compilador — no la palabra <code>new</code>.",
      fuerza: { icon: "route", html: "La memoria de pila se libera sola al volver de la función: cero trabajo para el GC. Pero si un valor debe sobrevivir a la función que lo creó, no puede quedarse en la pila. El compilador prueba estáticamente si un valor «escapa»; si lo hace, lo promueve al heap." },
      brief: [
        "La pila se libera sola al <code>return</code>: gratis para el GC.",
        "Si un valor sobrevive a su función, escapa al heap.",
        "<code>new</code> / <code>&amp;T{}</code> pueden quedarse en la pila si no escapan.",
        "<code>go build -gcflags=-m</code> te dice qué escapó y por qué."
      ],
      mito: { claim: "<code>new</code> reserva en el heap y <code>&amp;</code> también.", body: "No en Go. <code>new(T)</code> o <code>&amp;T{}</code> pueden acabar <strong>en la pila</strong> si el compilador prueba que no escapan — y una variable «normal» puede ir al <strong>heap</strong> si se devuelve su dirección. Lo decide el <em>escape analysis</em>, no la sintaxis. Devolver un puntero a un local es seguro precisamente por esto." },
      recursos: [
        { star: true, title: "Language Mechanics On Escape Analysis", desc: "Ardan Labs — el recorrido más claro del tema.", kind: "blog", href: "https://www.ardanlabs.com/blog/2017/05/language-mechanics-on-escape-analysis.html" },
        { star: false, title: "A Guide to the Go GC", desc: "por qué menos escapes = menos presión de GC.", kind: "doc", href: "https://go.dev/doc/gc-guide" }
      ],
      viz: {
        title: "Visualízalo · elige el caso y mira dónde cae x",
        options: [{ value: "stack", label: "queda local" }, { value: "pointer", label: "return &x" }, { value: "iface", label: "vía any" }],
        cases: {
          stack: { code: [["func sum() int {", 0], ["    x := 42", 1], ["    y := x * 2", 1], ["    return y", 0], ["}", 0]], escapes: false, varName: "x", ev: "x no sale de la función → queda en la PILA. Cero trabajo para el GC." },
          pointer: { code: [["func make() *int {", 0], ["    x := 42", 1], ["    return &x", 2], ["}", 0]], escapes: true, varName: "x", ev: "return &x: la dirección sobrevive a la función → x escapa al HEAP. (moved to heap)" },
          iface: { code: [["func log(v any) {", 0], ["    fmt.Println(v)", 2], ["}", 0], ["log(x)  // x → any", 0]], escapes: true, varName: "x", ev: "Pasar x por interface a una función que puede retenerlo → x escapa al HEAP." }
        },
        notes: [
          { html: "Devolver <code>&amp;x</code>, guardarlo en algo que escapa, o pasarlo a una interface cuya vida no se conoce: todos hacen que <code>x</code> vaya al <strong>heap</strong>. Si el compilador prueba que <code>x</code> no sobrevive a la función, se queda en la <strong>pila</strong>." }
        ]
      }
    },

    {
      slug: "defer-panic-recover", folio: "04", block: "compilacion", difficulty: 2, star: false,
      title: "defer, panic y recover por dentro", shortTitle: "defer",
      tagline: "Open-coded defers (1.14): de una lista enlazada en el heap a casi gratis.",
      avoid: "Evitar <code>defer</code> «por performance» — eso era antes de Go 1.14.",
      lede: "Desde Go 1.14 los <code>defer</code> son casi gratis: los <em>open-coded defers</em> los inlinean en el flujo normal de la función. <code>panic</code> desenrolla la pila corriendo defers en orden LIFO; <code>recover</code> corta ahí — pero solo si se llama directo desde un defer.",
      fuerza: { icon: "layers", html: "Antes, cada <code>defer</code> registraba un nodo en una lista enlazada en el heap: caro si lo usabas en caliente. Los <em>open-coded defers</em> (1.14) inlinean las llamadas diferidas directamente en la función y usan un <strong>bitmask</strong> para saber cuáles deben correr, así el caso común casi no cuesta. Solo los defers dentro de bucles o condicionales impredecibles caen al mecanismo antiguo." },
      brief: [
        "Open-coded defers (1.14): de lista enlazada en heap a inline.",
        "Un bitmask (deferBits) marca qué defers deben ejecutarse.",
        "panic recorre la cadena LIFO desenrollando y corriendo defers.",
        "recover solo corta si se llama directamente desde un defer."
      ],
      mito: { claim: "Evita defer «por performance».", body: "Eso era cierto antes de Go 1.14. Hoy el <em>open-coded defer</em> del caso común cuesta casi lo mismo que llamar la función a mano; el compilador lo inlinea. Solo los defers dentro de bucles o rutas condicionales impredecibles caen al camino lento con la lista enlazada. Escribe <code>defer</code> por claridad: cerrar recursos bien importa más que un nanosegundo." },
      recursos: [
        { star: true, title: "Defer, Panic, and Recover", desc: "The Go Blog — el modelo mental base.", kind: "blog", href: "https://go.dev/blog/defer-panic-and-recover" },
        { star: true, title: "Proposal: Low-cost defers through inline code", desc: "Dan Scales — el diseño de los open-coded defers (1.14).", kind: "doc", href: "https://github.com/golang/proposal/blob/master/design/34481-opencoded-defers.md" },
        { star: false, title: "runtime/panic.go", desc: "el desenrollado de panic y cómo recover corta la cadena.", kind: "código", href: "https://github.com/golang/go/blob/master/src/runtime/panic.go" }
      ],
      viz: {
        title: "Visualízalo · registra defers, luego return o panic()",
        notes: [
          { html: "Los <code>defer</code> corren en orden <strong>LIFO</strong>: el último registrado es el primero en ejecutarse, tanto al <code>return</code> como durante un <code>panic</code>. Marca un defer con <code>recover()</code> (clic en el chip) y lanza <code>panic()</code>: verás el desenrollado detenerse en ese defer y la función retornar normal." },
          { faint: true, html: "Vista simplificada: <code>recover()</code> solo surte efecto si se llama <em>directamente</em> dentro de una función diferida. Llamarlo en una función anidada por el defer no atrapa el pánico." }
        ]
      }
    }
  ]);

})(window.GUIA = window.GUIA || {});
