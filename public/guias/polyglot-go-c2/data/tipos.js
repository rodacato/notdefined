/* data/tipos.js — Bloque 4 · El modelo de tipos. */
(function (G) {
  "use strict";
  G.registerBlock({ id: "tipos", label: "Bloque 4 · El modelo de tipos", short: "Tipos", accent: "var(--fam-tipos)" });

  G.registerTopics([
    {
      slug: "interfaces-itable", folio: "11", block: "tipos", difficulty: 3, star: true,
      title: "Interfaces: iface, eface e itable", shortTitle: "Interfaces",
      tagline: "Polimorfismo sin herencia: un par (itab, data) y dispatch por tabla de métodos.",
      avoid: "Confiar en que «una interface nil siempre es nil».",
      lede: "Una interface guarda dos cosas: <em>qué tipo concreto</em> hay dentro y <em>dónde está el valor</em>. Así hace Go polimorfismo sin herencia — y así se explica el <em>dispatch</em> dinámico.",
      fuerza: { icon: "tree", html: "Sin herencia de clases, ¿cómo llama Go al método correcto de un valor cuyo tipo no conoce en compilación? Guardando junto al dato un puntero a una <em>tabla de métodos</em> (la itable) del tipo concreto, y saltando por ella en tiempo de ejecución." },
      infoCards: { layout: 2, items: [
        { kv: "iface", big: "(itab, data)", accent: "var(--fam-tipos)", body: "Interface con métodos. El <strong>itab</strong> enlaza el tipo concreto con su tabla de punteros a métodos." },
        { kv: "eface", big: "any / interface{}", accent: "var(--role-actor)", body: "Par <code>(_type, data)</code> <strong>sin métodos</strong>. Para llamar algo, primero un <em>type assertion</em>." }
      ] },
      brief: [
        "iface = (itab, data); eface / any = (_type, data).",
        "El itab enlaza tipo concreto → tabla de métodos.",
        "Dispatch: salta por el slot del método en la itable.",
        "any no tiene itable: primero un type assertion."
      ],
      mito: { claim: "Una interface nil siempre es nil.", body: "Falso. Una interface es <code>nil</code> solo si <em>ambas</em> casillas lo son. Si metes un <code>*T</code> nil en una interface, el itab queda <strong>no-nil</strong> (conoce el tipo <code>*T</code>) y el dato nil — así que <code>err != nil</code> aunque el puntero sea nil. Es la causa clásica del bug del «error que no debería existir».", code: "var p *MyErr = nil\nvar err error = p        <span class=\"faint\">// itab=*MyErr, data=nil</span>\nfmt.Println(err == nil)  <span class=\"bad\">// false  ← sorpresa</span>" },
      recursos: [
        { star: true, title: "Go Data Structures: Interfaces", desc: "Russ Cox (core team) — la representación de iface/itab, de primera mano.", kind: "blog", href: "https://research.swtch.com/interfaces" },
        { star: false, title: "Errors are values", desc: "The Go Blog — contexto del mito del typed nil y las interfaces de error.", kind: "blog", href: "https://go.dev/blog/errors-are-values" }
      ],
      viz: {
        title: "Visualízalo · el dispatch dinámico",
        concreteOptions: [{ value: "Circle", label: "Circle" }, { value: "Rect", label: "Rect" }],
        kindOptions: [{ value: "iface", label: "Shape (iface)" }, { value: "eface", label: "any (eface)" }],
        types: {
          Circle: { data: "{ r: 3.0 }", methods: [{ name: "Area", body: "π·r·r" }, { name: "Perimeter", body: "2·π·r" }] },
          Rect: { data: "{ w: 4, h: 2 }", methods: [{ name: "Area", body: "w·h" }, { name: "Perimeter", body: "2·(w+h)" }] }
        },
        notes: [
          { html: "Al llamar un método por interface, el runtime toma el <strong>itab</strong>, busca el <em>slot</em> del método en la <strong>itable</strong> y salta a la implementación concreta. Con <code>any</code> (eface) no hay itable: no puedes llamar métodos hasta hacer un <em>type assertion</em>." }
        ]
      }
    },

    {
      slug: "slices-strings", folio: "12", block: "tipos", difficulty: 2, star: true,
      title: "Slices, arrays y strings", shortTitle: "Slices",
      tagline: "Un slice es una ventana (ptr/len/cap) sobre un array; un string, bytes UTF-8 inmutables.",
      avoid: "Olvidar que <code>append</code> puede mudar el array y romper el aliasing.",
      lede: "Un slice no es un array: es una <em>ventana</em> (ptr, len, cap) sobre un array de respaldo. Confundirlos causa los bugs más clásicos de Go.",
      fuerza: { icon: "columns", html: "Necesitas listas de tamaño variable sin copiar todo a cada cambio. El slice comparte un array de respaldo: barato de pasar y recortar… hasta que un <code>append</code> supera la capacidad y el array «se muda» — y dos slices que creías unidos dejan de compartir memoria." },
      brief: [
        "Un slice es un header: (ptr, len, cap) sobre un array.",
        "append in situ mientras quepa en cap; si no, reasigna.",
        "Crecimiento: ×2 hasta ~256 elementos, luego ~1.25×.",
        "Un string es (ptr, len) inmutable de bytes UTF-8."
      ],
      mito: { claim: "append siempre me devuelve un slice independiente.", body: "Depende de la capacidad. Si hay <code>cap</code> de sobra, <code>append</code> escribe <em>in situ</em> y pisa datos que otro slice todavía ve — el bug clásico del sub-slice compartido. Si no cabe, reasigna y se desliga. Nunca asumas cuál de los dos ocurrió: usa el «three-index slice» <code>s[a:b:b]</code> para forzar un cap ajustado." },
      recursos: [
        { star: true, title: "Go Slices: usage and internals", desc: "The Go Blog — el header, el array de respaldo y el gotcha de append.", kind: "blog", href: "https://go.dev/blog/slices-intro" },
        { star: true, title: "Strings, bytes, runes and characters in Go", desc: "The Go Blog — por qué len(\"café\") sorprende.", kind: "blog", href: "https://go.dev/blog/strings" }
      ],
      viz: {
        titleA: "Visualízalo · el header y el array de respaldo",
        titleB: "Visualízalo · un string son bytes, no caracteres",
        wordOptions: [{ value: "café", label: "café" }, { value: "go", label: "go" }, { value: "señor", label: "señor" }],
        words: { "café": [["c", 1], ["a", 1], ["f", 1], ["é", 2]], "go": [["g", 1], ["o", 1]], "señor": [["s", 1], ["e", 1], ["ñ", 2], ["o", 1], ["r", 1]] },
        strCode: "s := \"café\"\nlen(s)                    // 5  ← 'é' son 2 bytes\nutf8.RuneCountInString(s) // 4\n\nfor i, r := range s {\n    // i = 0, 1, 2, 3 — nunca 4:\n    // 'é' ocupa los bytes 3 y 4\n}\n\nfor i := range \"señor\" {\n    // i = 0, 1, 2, 4, 5 — salta el 3\n}",
        notes: [
          { html: "Mientras el <code>append</code> quepa en <strong>cap</strong>, escribe en el mismo array — y quien comparta ese array <em>ve</em> el cambio. Cuando excede <strong>cap</strong>, el runtime asigna un array nuevo (suele duplicar cap), copia, y el slice se desliga: a partir de ahí ya no comparte memoria con nadie." },
          { faint: true, html: "El factor de crecimiento no es siempre ×2: desde Go 1.18 duplica solo hasta ~256 elementos y a partir de ahí crece ~1.25× (transición suave). Para fijar un cap exacto y evitar el aliasing sorpresa, usa el <em>three-index slice</em> <code>s[a:b:b]</code>." },
          { html: "Un <strong>string</strong> es un header inmutable de <code>puntero + len</code> sobre bytes UTF-8. <code>len(s)</code> cuenta <em>bytes</em>; un carácter fuera de ASCII ocupa 2–4. Por eso <code>range</code> devuelve el índice de byte de cada runa, no un contador 0,1,2…" }
        ]
      }
    },

    {
      slug: "maps-swiss-tables", folio: "13", block: "tipos", difficulty: 3, star: false,
      title: "Maps: Swiss Tables (Go 1.24+)", shortTitle: "Maps",
      eyebrowExtra: "novedad Go 1.24",
      tagline: "Grupos de 8 slots + palabra de control: búsquedas vectorizadas y menos RAM.",
      avoid: "Depender del orden de iteración: es aleatorio a propósito.",
      lede: "Un map es una tabla hash. Desde Go 1.24 su implementación es <em>Swiss Tables</em>: grupos de 8 slots con una palabra de control que se escanea casi de un golpe.",
      fuerza: { icon: "gridv", html: "Buscar en un hash map tradicional salta de bucket en bucket siguiendo cadenas de colisión. Las Swiss Tables agrupan 8 entradas y guardan un byte de control por slot; con una comparación vectorizada se filtran los 8 candidatos casi a la vez, y solo se comparan claves en los que «pintan»." },
      brief: [
        "Swiss Tables (Go 1.24): grupos de 8 slots.",
        "H2 (7 bits del hash) va a la palabra de control por slot.",
        "Un SIMD compara los 8 bytes de control de un golpe.",
        "El orden de iteración es aleatorio a propósito."
      ],
      mito: { claim: "El orden de iteración de un map es estable, solo que no lo ordené.", body: "Es <strong>aleatorio a propósito</strong>. Go arranca el <code>range</code> de un map en un slot inicial al azar en cada recorrido, para que nadie dependa del orden y el código no se rompa cuando cambie la implementación (como acaba de pasar con Swiss Tables). Si necesitas orden, extrae las claves y ordénalas." },
      recursos: [
        { star: true, title: "Faster Go maps with Swiss Tables", desc: "The Go Blog — la fuente oficial del diseño de Go 1.24.", kind: "blog", href: "https://go.dev/blog/swisstable" },
        { star: false, title: "How Go 1.24's Swiss Tables saved us hundreds of GB", desc: "Datadog Eng — el impacto real en memoria.", kind: "blog", href: "https://www.datadoghq.com/blog/engineering/go-swiss-tables/" }
      ],
      viz: {
        title: "Visualízalo · inserción, palabra de control y split",
        notes: [
          { html: "Los <strong>bits altos</strong> del hash eligen el <em>grupo</em>; los <strong>7 bits bajos</strong> (H2) van a la palabra de control del slot. Buscar = comparar H2 contra los 8 bytes de control de un golpe → los que coinciden se verifican por clave. Al superar el 87.5% de ocupación, la tabla se <strong>divide</strong> en dos." },
          { faint: true, html: "Vista simplificada: aquí <strong>1 tabla = 1 grupo de 8</strong> para que el <em>split</em> quepa en pantalla. En el runtime real una tabla contiene <em>muchos</em> grupos de 8 y se divide al llegar a <strong>128 grupos</strong> (~1024 slots); el 87.5% es el <em>load factor</em> máximo sobre esa estructura, no sobre un solo grupo." }
        ]
      }
    },

    {
      slug: "generics", folio: "14", block: "tipos", difficulty: 3, star: false,
      title: "Generics por dentro: stenciling y dictionaries", shortTitle: "Generics",
      eyebrowExtra: "novedad Go 1.18",
      tagline: "GCShape stenciling + dictionaries: ni monomorfización total ni boxing puro.",
      avoid: "Creer que los generics de Go monomorfizan por tipo completo, como C++/Rust.",
      lede: "Los generics de Go no monomorfizan como C++/Rust ni hacen boxing puro: el compilador agrupa tipos por su <em>GCShape</em> y genera una copia de código por forma, pasándole un <em>dictionary</em> con lo específico del tipo.",
      fuerza: { icon: "tree", html: "Una copia de código por cada tipo (monomorfización) infla el binario; meter todo en interfaces (boxing) es lento. Go toma un punto medio: agrupa los tipos por su <strong>GCShape</strong> (tamaño y disposición de punteros) y compila <em>una</em> copia por shape. Todos los tipos puntero comparten la misma copia; a cada instanciación se le pasa un <strong>dictionary</strong> oculto con la info concreta (itabs, tipos, funciones)." },
      brief: [
        "Una copia de código por GCShape, no por tipo.",
        "Todos los tipos puntero comparten un shape (*T).",
        "Cada instanciación recibe un dictionary oculto.",
        "El dictionary añade indirección: no es gratis como C++."
      ],
      mito: { claim: "Los generics de Go monomorfizan como C++/Rust.", body: "No. Go agrupa por <strong>GCShape</strong>: los tipos puntero (<code>*User</code>, <code>*Order</code>…) comparten <em>una sola</em> copia de código stenciled y se distinguen por un <em>dictionary</em> pasado en runtime. Eso ahorra tamaño de binario, pero mete una indirección en el dispatch que la monomorfización total de C++/Rust no tiene — a veces el genérico es más lento que la versión escrita a mano." },
      recursos: [
        { star: true, title: "An Introduction to Generics", desc: "The Go Blog — el punto de partida de los type parameters.", kind: "blog", href: "https://go.dev/blog/intro-generics" },
        { star: true, title: "Generics implementation: Stenciling & Dictionaries", desc: "el design doc oficial de Go 1.18.", kind: "doc", href: "https://github.com/golang/proposal/blob/master/design/generics-implementation-dictionaries-go1.18.md" },
        { star: false, title: "Generics can make your Go code slower", desc: "PlanetScale — el costo real del dispatch por dictionary.", kind: "blog", href: "https://planetscale.com/blog/generics-can-make-your-go-code-slower" }
      ],
      viz: {
        title: "Visualízalo · instanciaciones → copias por GCShape",
        notes: [
          { html: "Con <strong>monomorfización</strong> (C++/Rust) el compilador emite una copia de código por cada tipo: dispatch directo y rápido, pero el binario crece. Con <strong>GCShape stenciling</strong> Go emite una copia por <em>forma de memoria</em>: <code>*User</code> y <code>*Order</code> comparten la misma copia porque ambos son punteros, y se distinguen con un <em>dictionary</em>." },
          { faint: true, html: "El dictionary lleva los itabs, tipos y funciones que la copia stenciled necesita. Ese nivel extra de indirección es la razón por la que un genérico a veces rinde por debajo de la versión monomorfizada a mano." }
        ]
      }
    }
  ]);

})(window.GUIA = window.GUIA || {});
