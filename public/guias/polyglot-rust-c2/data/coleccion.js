/* coleccion.js — identidad Polyglot, hero, bloques y orden del catálogo.
   El contenido de cada tema vive en su archivo de dominio (propiedad.js,
   compilacion.js, …). Aquí solo va la estructura de la colección. */
(function (G) {
  "use strict";

  G.coleccion = {
    marca: "Polyglot · notdefined",
    metaTop: "RUST · NIVEL C2",
    titulo: "Rust a fondo",
    lede: "La memoria segura sin recolector, la concurrencia sin miedo y el async sin runtime — no como recetas, sino como mecanismos. Cada ficha arranca del fundamento, lo vuelve visible con una simulación jugable y te deja en la fuente seria.",

    // CEFR — el guiño de la colección
    nivel: {
      code: "C2",
      escala: 'C1 «dominado», lo que haces tú con el lenguaje · C2 «a fondo», lo que hace la máquina por debajo.'
    },

    // tarjetas "lo que hace a Rust distinto"
    why: [
      { eyebrow: "Sin GC · sin runtime",
        html: 'La seguridad de memoria no se paga en ejecución: se <em>demuestra en compilación</em> con ownership y el borrow checker.' },
      { eyebrow: "Abstracciones de costo cero",
        html: 'Iteradores, genéricos y <code>async</code> compilan a código tan eficiente como escrito a mano. Los genéricos se <em>monomorfizan</em>.' },
      { eyebrow: "Concurrencia sin miedo",
        html: 'Las carreras de datos son <em>errores de compilación</em> (<code>Send</code>/<code>Sync</code>). No hay candado global porque no hace falta.' }
    ],

    // bloques en orden; cada uno lista los slugs de sus temas
    bloques: [
      { n: 1, fam: "var(--fam-1)", label: "El sistema de propiedad — el corazón de Rust",
        temas: ["ownership", "borrowing", "lifetimes"] },
      { n: 2, fam: "var(--fam-2)", label: "Compilación y ejecución",
        temas: ["pipeline", "dispatch", "zero-cost", "macros"] },
      { n: 3, fam: "var(--fam-3)", label: "Memoria",
        temas: ["stack-heap-drop", "panic", "rc-refcell", "layout"] },
      { n: 4, fam: "var(--fam-4)", label: "Concurrencia y async",
        temas: ["send-sync", "async-futures", "executors"] },
      { n: 5, fam: "var(--fam-5)", label: "Profundizaciones",
        temas: ["unsafe", "atomics", "closures", "orphan-rule", "impl-trait"] }
    ],

    // fila cross-serie (el hilo de la colección: ¿quién libera y cuándo?)
    cross: {
      eyebrow: "El hilo de la colección · ¿quién libera la memoria y cuándo?",
      cells: [
        { k: "Ruby · JS · Go", v: "GC decide" },
        { k: "Python", v: "Refcount + GC de ciclos" },
        { k: "Rust", v: "Ownership sin GC — fin del ámbito", rust: true }
      ],
      nota: 'Otros lenguajes resuelven velocidad, memoria y concurrencia <em>en ejecución</em> (JIT, GC, candados, schedulers). Rust las resuelve <em>en compilación</em>.'
    },

    colofon: {
      serie: "Polyglot · Ruby · JavaScript · Go · Python · Rust",
      evaluado: "al día con Rust 1.93",
      locale: "rs-VM"   // huevo de pascua: el locale de la máquina virtual
    }
  };

  // devuelve los temas de un bloque, en orden, ya resueltos desde G.temas
  G.temasDeBloque = function (bloque) {
    return bloque.temas.map(function (slug) {
      var t = G.temas[slug];
      if (!t) console.warn("Tema no encontrado:", slug);
      return t;
    }).filter(Boolean);
  };

  // lista plana en orden de catálogo (para prev/next)
  G.ordenPlano = function () {
    var out = [];
    G.coleccion.bloques.forEach(function (b) {
      b.temas.forEach(function (s) { out.push(s); });
    });
    return out;
  };

})(window.GUIA = window.GUIA || {});
