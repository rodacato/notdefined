/* ============================================================
   gc.js — Ficha 07 · El recolector de basura
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.gc = {
    slug: "gc", n: "07", kind: "el GC", glyph: "◆◆◆", family: "mem",
    navShort: "El GC",
    title: "El recolector de basura",
    tagline: "Marca lo alcanzable, barre lo demás. Generacional, incremental y con compactación.",
    chips: ["GC.stat", "GC.compact", "gc.c"],
    eyebrowSub: "marcar, barrer, compactar",
    lede: 'El <b>GC</b> libera la memoria de objetos que ya nadie usa, para que no tengas que hacerlo a mano. Sin él, tu programa acumularía basura hasta quedarse sin memoria. La pregunta que responde el diagrama: <em>¿cómo sabe Ruby qué es basura?</em>',

    enBreve: [
      { k: "Algoritmo",      v: "Mark &amp; sweep" },
      { k: "Optimización",   v: "Generacional" },
      { k: "Pausas",         v: "Incremental" },
      { k: "Fragmentación",  v: "GC.compact" }
    ],

    fundamento: 'Un objeto es «basura» cuando <b>ya no se puede alcanzar</b> desde tu programa: ninguna variable, constante o estructura viva apunta a él, ni directa ni indirectamente. Si nadie puede llegar a él, nunca lo usarás, así que su memoria se puede reutilizar. El GC parte de un conjunto de <b>raíces</b> (variables globales, la pila, constantes) y sigue las referencias.',

    comoFunciona: 'El GC combina cuatro ideas. <b>Mark &amp; sweep</b>: marca todo lo alcanzable desde las raíces y barre (libera) lo no marcado. <b>Generacional</b>: separa objetos jóvenes y viejos, y revisa los jóvenes más seguido, porque la mayoría muere joven. <b>Incremental</b>: divide el marcado en pasos pequeños para evitar una pausa larga que congele todo. <b>Compactación</b>: mueve los objetos vivos para juntarlos y reducir la fragmentación del heap.',

    widget: {
      kind: "gc",
      title: "Un ciclo de GC, paso a paso",
      intro: 'El heap tiene objetos; las <b>raíces</b> apuntan a algunos. Avanza el ciclo: <b>marcar</b> lo alcanzable, <b>barrer</b> lo demás, <b>compactar</b> para cerrar huecos.',
      steps: ["Heap vivo", "Marcar", "Barrer", "Compactar"],
      roots: ["$global → o1", "stack → o3", "CONST → o7"],
      objs: [
        { id: "o1", gen: "old", reach: true }, { id: "o2", gen: "young", reach: true },
        { id: "o3", gen: "old", reach: true }, { id: "o4", gen: "young", reach: true },
        { id: "o5", gen: "young", reach: true }, { id: "o6", gen: "old", reach: true },
        { id: "o7", gen: "old", reach: true }, { id: "o8", gen: "young", reach: true },
        { id: "o9", gen: "young", reach: false }, { id: "o10", gen: "young", reach: false },
        { id: "o11", gen: "young", reach: false }, { id: "o12", gen: "young", reach: false }
      ],
      texts: [
        "El heap con 12 objetos. Tres raíces apuntan a o1, o3 y o7. Todavía no sabemos qué es basura.",
        "Marcar: se recorre el grafo desde las raíces. 8 objetos son alcanzables (verde). o9–o12 forman una isla sin raíz: basura.",
        "Barrer: los no marcados se liberan y dejan huecos. La memoria está fragmentada — hay libres, pero dispersos.",
        "Compactar (GC.compact): los objetos vivos se reagrupan al frente. Los huecos quedan juntos al final; adiós fragmentación."
      ],
      stats: { live: [12, 12, 8, 8], free: [3, 3, 7, 7], old: [5, 5, 4, 4] }
    },

    callout: { tag: "Mito", text: '«El GC pausa todo el programa cada vez». El GC generacional e incremental evita justo eso: la mayoría de ciclos son cortos, sobre objetos jóvenes, y el marcado se reparte en pasos.' },

    recursos: [
      { title: "Building a Compacting GC for MRI", note: "Aaron Patterson, RubyConf 2017", url: "https://www.youtube.com/watch?v=8Q7M513vewk" },
      { title: "Ruby Under a Microscope", note: "los capítulos de GC", url: "https://patshaughnessy.net/ruby-under-a-microscope" },
      { title: "GC.stat y GC.compact", note: "inspecciona y compacta tú mismo", url: "https://docs.ruby-lang.org/en/master/GC.html" },
      { title: "GC modular (3.4+)", note: "el GC como pieza intercambiable — experimental", url: "https://bugs.ruby-lang.org/issues/20470" }
    ]
  };

})(window.GUIA = window.GUIA || {});
