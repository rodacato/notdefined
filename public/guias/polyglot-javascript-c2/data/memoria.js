/* memoria.js — Bloque 3: garbage collector, shapes e inline caches, layout. */
(function (G) {
  "use strict";
  const D = G.data = G.data || { topics: {} };

  D.topics["garbage-collector"] = {
    slug: "garbage-collector", folio: "08", tag: "motor", difficulty: "\u25C6\u25C6\u25C6",
    title: "Garbage Collector (Orinoco)",
    tagline: "Generacional: Scavenger copia los j\u00f3venes, Mark-Compact limpia los viejos, sin congelar la app.",
    avoid: "creer que poner x = null libera la memoria al instante.",
    lede: "El GC libera la memoria de objetos que ya nadie alcanza. \u00bfC\u00f3mo sabe el motor qu\u00e9 es basura, y c\u00f3mo evita <em class=\"serif-italic\">congelar</em> la app mientras limpia?",
    breve: [
      { k: "Capa", v: "Motor \u00b7 V8" },
      { k: "Nombre", v: "Orinoco" },
      { k: "Modelo", v: "Generacional" },
      { k: "Basura", v: "Lo inalcanzable" },
    ],
    quees: "<p>La basura no es \u00ablo que no uso\u00bb: es <strong>lo que no se alcanza</strong>. Se parte de las <em class=\"serif-italic\">ra\u00edces</em> (globales, variables en la pila) y se sigue cada referencia. Todo lo que quede fuera de ese recorrido es inalcanzable \u2014 y por tanto, recuperable.</p>",
    fundamento: "<p>\u00abLa mayor\u00eda de los objetos muere joven.\u00bb Orinoco lo aprovecha: la <strong>young generation</strong> se limpia seguido y barato con el <em class=\"serif-italic\">Scavenger</em>; la <strong>old generation</strong>, donde sobreviven los longevos, se limpia con <em class=\"serif-italic\">Mark-Compact</em>, menos veces.</p>",
    como: [
      "<strong>Scavenger</strong> (minor GC): copia los vivos de la young gen entre semiespacios (Cheney). R\u00e1pido, frecuente y en paralelo.",
      "<strong>Mark-Compact</strong> (major GC): recorre todo el heap, marca lo vivo y compacta para reducir fragmentaci\u00f3n.",
      "<strong>Concurrente / incremental</strong>: parte del trabajo corre en otros hilos o en trozos.",
      "As\u00ed las pausas \u00abstop-the-world\u00bb visibles son m\u00ednimas.",
    ],
    mito: "<p>\u00abPoner <span class=\"inline-code\">x = null</span> libera la memoria al instante.\u00bb No: s\u00f3lo <em class=\"serif-italic\">rompe una referencia</em>. El objeto se recuperar\u00e1 cuando el GC decida correr y confirme que ya nadie lo alcanza. Y \u00abel GC congela todo\u00bb: hoy la mayor parte del trabajo de Orinoco es concurrente/incremental \u2014 las pausas visibles son m\u00ednimas.</p>",
    recursos: [
      { kind: "V8 blog", star: true, title: "Trash talk: the Orinoco garbage collector", sub: "v8.dev \u2014 la visi\u00f3n general de Orinoco", href: "https://v8.dev/blog/trash-talk" },
      { kind: "V8 blog", title: "Orinoco: young generation GC", sub: "v8.dev \u2014 el Scavenger paralelo", href: "https://v8.dev/blog/orinoco-parallel-scavenger" },
      { kind: "Notas", title: "v8-perf: gc.md", sub: "Thorsten Lorenz \u2014 el GC condensado", href: "https://github.com/thlorenz/v8-perf/blob/master/gc.md" },
    ],
    widget: {
      storeKey: "gc",
      zones: [
        { id: "roots", label: "Ra\u00edces (GC roots)", cls: "stack", wrap: true },
        { id: "heap", label: "Heap", cls: "heap", wrap: true },
      ],
      variants: [
        {
          id: "mc", label: "Mark-Compact (old gen)", codeCap: "old space",
          code: ["// objetos alcanzables desde", "// window y la pila = vivos;", "// el resto = basura"],
          frames: [
            { phase: "Inicio", roots: ["window", "stack"], heap: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"],
              cap: "El old space tras varias asignaciones. Unos objetos siguen alcanzables desde las ra\u00edces; otros ya no. A\u00fan no sabemos cu\u00e1les." },
            { phase: "Marcado", roots: ["window", "stack"], heap: ["A \u2713", "B \u2713", "C \u2717", "D \u2713", "E \u2717", "F \u2717", "G \u2713", "H \u2717", "I \u2713", "J \u2717", "K \u2713", "L \u2717"],
              cap: "Partiendo de las ra\u00edces se sigue cada referencia y se MARCA todo lo alcanzable (\u2713). Lo que quede sin marcar (\u2717) es basura." },
            { phase: "Barrido", roots: ["window", "stack"], heap: ["A", "B", "D", "G", "I", "K"],
              cap: "Los objetos no marcados se liberan: su espacio queda disponible. Pero el heap queda fragmentado, con huecos entre los vivos." },
            { phase: "Compactaci\u00f3n", roots: ["window", "stack"], heap: ["A", "B", "D", "G", "I", "K"],
              cap: "Los objetos vivos se mueven juntos al principio del espacio. Sin fragmentaci\u00f3n: las pr\u00f3ximas asignaciones vuelven a ser un simple avance de puntero." },
          ],
        },
        {
          id: "sc", label: "Scavenger (young gen)", codeCap: "new space",
          code: ["// la mayoria muere joven;", "// se copian solo los vivos", "// de 'From' a 'To'"],
          frames: [
            { phase: "Inicio \u00b7 espacio From", roots: ["stack"], heap: ["n1", "n2", "n3", "n4", "n5"],
              cap: "La young generation vive en el espacio \u00abFrom\u00bb. Nacieron 5 objetos; la mayor\u00eda morir\u00e1 joven. El espacio \u00abTo\u00bb est\u00e1 vac\u00edo." },
            { phase: "Copia \u2192 To", roots: ["stack"], heap: ["n1 \u2192 To", "n3 \u2192 To"],
              cap: "El Scavenger COPIA los objetos vivos (n1, n3) a \u00abTo\u00bb (algoritmo de Cheney). S\u00f3lo toca los vivos: n2, n4 y n5 ni se visitan." },
            { phase: "Intercambio", roots: ["stack"], heap: ["n1 (To)", "n3 (To)"],
              cap: "\u00abFrom\u00bb se vac\u00eda de golpe (los muertos se descartan sin recorrerlos) y los espacios se intercambian. R\u00e1pido, barato y en paralelo. Los que sobreviven varias rondas se promueven a la old generation." },
          ],
        },
      ],
    },
  };

  D.topics["shapes-inline-caches"] = {
    slug: "shapes-inline-caches", folio: "09", tag: "motor", star: true, difficulty: "\u25C6\u25C6\u25C6",
    title: "Shapes e Inline Caches",
    tagline: "El plano secreto de cada objeto y por qu\u00e9 el orden de las propiedades s\u00ed importa.",
    avoid: "asumir que el orden en que asignas propiedades no afecta el rendimiento.",
    lede: "Los objetos JS parecen diccionarios din\u00e1micos, pero eso ser\u00eda lent\u00edsimo. El motor les asigna en secreto una <em class=\"serif-italic\">Shape</em>: un plano compartido que dice qu\u00e9 propiedades tiene y en qu\u00e9 offset.",
    breve: [
      { k: "Capa", v: "Motor \u00b7 V8" },
      { k: "Shape", v: "Hidden Class / Map" },
      { k: "Comparte", v: "Nombres + offsets" },
      { k: "IC", v: "Mono / poli / mega" },
    ],
    quees: "<p>Objetos con las <strong>mismas propiedades en el mismo orden</strong> comparten una Shape (Hidden Class / Map). La Shape guarda los nombres y offsets <em class=\"serif-italic\">una vez</em>; cada objeto s\u00f3lo guarda sus valores. Agregar una propiedad nueva provoca una <strong>transici\u00f3n</strong> a otra Shape.</p>",
    fundamento: "<p>Junto a cada acceso <span class=\"inline-code\">obj.x</span>, el motor recuerda \u00aben la Shape <em class=\"serif-italic\">S</em>, x est\u00e1 en el offset <em class=\"serif-italic\">n</em>\u00bb. Si el pr\u00f3ximo objeto tiene esa misma Shape, salta la b\u00fasqueda. Seg\u00fan cu\u00e1ntas Shapes distintas vea, el acceso es <strong>mono</strong>, <strong>poli</strong> o <strong>megam\u00f3rfico</strong>.</p>",
    como: [
      "Un objeto vac\u00edo arranca en la <strong>Shape ra\u00edz</strong>.",
      "Cada propiedad a\u00f1adida lo mueve a una <strong>Shape hija</strong> (una transici\u00f3n).",
      "Otro objeto con esas mismas props en el mismo orden <strong>comparte</strong> la Shape.",
      "El <strong>inline cache</strong> memoriza offset por Shape: 1 Shape = mono, 2-4 = poli, muchas = mega.",
    ],
    mito: "<p>\u00abEl orden en que asigno las propiedades no importa.\u00bb Para el resultado, no; para el <strong>rendimiento</strong>, s\u00ed. <span class=\"inline-code\">{a, b}</span> y <span class=\"inline-code\">{b, a}</span> terminan en Shapes <em class=\"serif-italic\">distintas</em>, y mezclarlas convierte un acceso monom\u00f3rfico (rapid\u00edsimo) en poli o megam\u00f3rfico (lento). Inicializa tus objetos con la misma forma y en el mismo orden.</p>",
    recursos: [
      { kind: "Art\u00edculo", star: true, title: "JS engine fundamentals: Shapes and Inline Caches", sub: "Mathias Bynens & Benedikt Meurer \u2014 la referencia", href: "https://mathiasbynens.be/notes/shapes-ics" },
      { kind: "Motor", title: "Fundamentals: optimizing prototypes", sub: "misma dupla \u2014 c\u00f3mo V8 optimiza el acceso", href: "https://mathiasbynens.be/notes/prototypes" },
      { kind: "Fuente", title: "V8 blog", sub: "v8.dev \u2014 posts sobre Maps y feedback", href: "https://v8.dev/blog" },
    ],
    widget: {
      storeKey: "shapes",
      zones: [{ id: "shapes", label: "Shapes", cls: "stack" }],
      variants: [
        {
          id: "build", label: "construir un objeto",
          frames: [
            { code: ["const o = {};"], phase: "Shape ra\u00edz", shapes: ["Shape0  { }  (vac\u00edo)"],
              cap: "Objeto vac\u00edo, en la Shape ra\u00edz. A\u00fan no guarda ninguna propiedad." },
            { code: ["const o = {};", "o.x = 1;"], phase: "+ x", shapes: ["Shape0  { }", "Shape1  { x }"],
              cap: "Agregar <span class=\"inline-code\">x</span> mueve el objeto a <strong>Shape1</strong>: una transici\u00f3n desde la ra\u00edz." },
            { code: ["const o = {};", "o.x = 1;", "o.y = 2;"], phase: "+ y", shapes: ["Shape0  { }", "Shape1  { x }", "Shape2  { x, y }"],
              cap: "Agregar <span class=\"inline-code\">y</span> transiciona a <strong>Shape2</strong>. La cadena de Shapes se comparte entre todos los objetos que sigan este orden." },
            { code: ["const o = {};", "o.x = 1;", "o.y = 2;", "o.z = 3;"], phase: "+ z", shapes: ["Shape0  { }", "Shape1  { x }", "Shape2  { x, y }", "Shape3  { x, y, z }"],
              cap: "<strong>Shape3</strong>: cualquier otro objeto con <span class=\"inline-code\">x, y, z</span> en este orden compartir\u00e1 esta misma Shape \u2014 y el mismo inline cache." },
          ],
        },
        {
          id: "ic", label: "acceso repetido (IC)",
          frames: [
            { code: ["function getX(o) {", "  return o.x;", "}"], phase: "IC vac\u00edo", shapes: [],
              cap: "El acceso <span class=\"inline-code\">o.x</span> a\u00fan no se ha ejecutado: su inline cache est\u00e1 vac\u00edo." },
            { code: ["getX({ x, y });"], phase: "Monom\u00f3rfico", shapes: ["A  {x, y}"],
              cap: "<strong>Monom\u00f3rfico</strong>: una sola Shape vista. El IC guarda el offset y el acceso es directo. Lo m\u00e1s r\u00e1pido." },
            { code: ["getX({ x, y });", "getX({ y, x });"], phase: "Polim\u00f3rfico", shapes: ["A  {x, y}", "B  {y, x}"],
              cap: "<strong>Polim\u00f3rfico</strong>: <span class=\"inline-code\">{y, x}</span> es OTRA Shape (distinto orden). El IC prueba una lista corta. A\u00fan razonable." },
            { code: ["getX({ x, y });", "getX({ y, x });", "getX({ x, y, z });"], phase: "Megam\u00f3rfico", shapes: ["A  {x, y}", "B  {y, x}", "C  {x, y, z}"],
              cap: "<strong>Megam\u00f3rfico</strong>: demasiadas Shapes. El IC se rinde y cae a la b\u00fasqueda gen\u00e9rica. Lento \u2014 esto es lo que evitas usando la misma forma." },
          ],
        },
      ],
    },
  };

  D.topics["layout-memoria"] = {
    slug: "layout-memoria", folio: "10", tag: "motor", difficulty: "\u25C6\u25C6\u25C7",
    title: "Layout de memoria y valores",
    tagline: "Smi tagging: un entero peque\u00f1o va inline; un n\u00famero grande o decimal va como puntero al heap.",
    avoid: "pensar que todos los n\u00fameros en JS son doubles de 64 bits.",
    lede: "\u00bfC\u00f3mo guarda el motor un n\u00famero, un booleano o una referencia a objeto en el mismo espacio? Con trucos de <em class=\"serif-italic\">etiquetado</em> que hacen barat\u00edsimas las operaciones comunes.",
    breve: [
      { k: "Capa", v: "Motor \u00b7 V8" },
      { k: "T\u00e9cnica", v: "Pointer tagging" },
      { k: "Smi", v: "Entero peque\u00f1o inline" },
      { k: "Grande", v: "HeapNumber (double)" },
    ],
    quees: "<p>Una \u00abpalabra\u00bb de memoria puede guardar un valor <em class=\"serif-italic\">o</em> un puntero. V8 los distingue mirando los <strong>bits de etiqueta</strong> (los de menor peso): un <span class=\"inline-code\">Smi</span> (Small Integer) termina en <span class=\"inline-code\">0</span> y va inline; un puntero a objeto termina en <span class=\"inline-code\">1</span>.</p>",
    fundamento: "<p>Un entero peque\u00f1o (Smi) se guarda <strong>dentro</strong> de la palabra: sumar dos es casi gratis, sin tocar el heap. Un n\u00famero grande o decimal no cabe: se guarda como <em class=\"serif-italic\">heap number</em> (un double en el heap) y la palabra guarda un puntero hacia \u00e9l.</p>",
    como: [
      "<strong>new space</strong>: la young generation, donde nacen los objetos.",
      "<strong>old space</strong>: los que sobrevivieron varias rondas; Mark-Compact los gestiona.",
      "<strong>large object space</strong>: objetos tan grandes que se asignan aparte, sin mover nunca.",
      "<strong>code / map space</strong>: c\u00f3digo compilado y las Shapes (Maps) viven en espacios propios.",
    ],
    mito: "<p>\u00abTodos los n\u00fameros en JS son doubles de 64 bits.\u00bb En la <em class=\"serif-italic\">spec</em>, s\u00ed. Pero el motor hace trampa: los enteros peque\u00f1os se guardan como Smi inline, sin heap ni double. Por eso un bucle con \u00edndices enteros es mucho m\u00e1s barato de lo que la spec sugerir\u00eda \u2014 hasta que el n\u00famero crece y se vuelve un heap number.</p>",
    recursos: [
      { kind: "Art\u00edculo", title: "JS engine fundamentals", sub: "Mathias Bynens & Benedikt Meurer \u2014 representaci\u00f3n de valores", href: "https://mathiasbynens.be/notes/shapes-ics" },
      { kind: "Fuente", title: "V8 blog", sub: "v8.dev \u2014 value representation y pointer compression", href: "https://v8.dev/blog" },
    ],
    widget: {
      storeKey: "layout",
      zones: [
        { id: "palabra", label: "Palabra en memoria (32 bits)", cls: "stack" },
        { id: "heap", label: "Heap", cls: "heap" },
      ],
      variants: [{
        id: "smi", label: "Smi vs HeapNumber",
        frames: [
          { code: ["let x = 42;"], phase: "Smi \u00b7 inline", palabra: ["valor: 0\u20260101010", "tag: 0"], heap: [],
            cap: "El bit de tag es <strong>0</strong> \u2192 es un <strong>Smi</strong>. El valor entero vive DENTRO de la palabra. Operar con \u00e9l no toca el heap: rapid\u00edsimo." },
          { code: ["let x = 3_000_000_000;"], phase: "Fuera de rango Smi", palabra: ["puntero \u2192", "tag: 1"], heap: ["HeapNumber \u00b7 3,000,000,000 \u00b7 double 64b"],
            cap: "3.000 millones no cabe en el rango Smi (~2\u00b3\u00b9). El bit de tag es <strong>1</strong> \u2192 es un puntero; el n\u00famero real (un double) vive en el heap." },
          { code: ["let x = 3.14;"], phase: "Decimal \u2192 HeapNumber", palabra: ["puntero \u2192", "tag: 1"], heap: ["HeapNumber \u00b7 3.14 \u00b7 double 64b"],
            cap: "Un decimal tampoco es Smi: se guarda como <strong>HeapNumber</strong> (double de 64 bits) en el heap, y la palabra s\u00f3lo guarda su direcci\u00f3n." },
        ],
      }],
    },
  };
})(window.GUIA = window.GUIA || {});
