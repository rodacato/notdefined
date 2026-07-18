/* ============================================================
   catalog.js — el índice de la guía: bloques, orden, cita,
   bibliografía y colofón. Contenido puro; edítalo a mano.
   ============================================================ */
(function (G) {
  "use strict";

  G.data.catalog = {
    meta: {
      count: "13 temas · 5 bloques",
      lede: 'En Ruby tu texto nunca se ejecuta tal cual: viaja por <em>Prism</em>, la máquina <em>YARV</em> y —si algo se calienta— el <em>JIT</em>. Trece piezas: doce del motor, cada una desde el fundamento hasta verla <em>moverse</em>, y un cierre de taller para medirlas en tu app.',
      facts: [
        { k: "Parser",     v: "Prism, por defecto",              sub: "reemplazó a parse.y" },
        { k: "JIT",        v: "YJIT + ZJIT",                     sub: "conviven en 4.0" },
        { k: "Lock global", v: 'GVL <small>(antes GIL)</small>', sub: "paralelismo con Ractors" },
        { k: "Versión",    v: "Ruby 4.0",                        sub: "diciembre 2025" }
      ]
    },

    // Orden lineal de las fichas (anterior / siguiente sale de aquí).
    order: ["pipeline", "yarv", "jit", "gvl", "ractors", "fibers", "gc", "heap", "shapes", "lookup", "singleton", "caches", "perfila"],

    blocks: [
      { family: "exec", eyebrow: "Bloque 1 · Ejecución y compilación", hint: "del texto al código máquina",
        topics: ["pipeline", "yarv", "jit"] },
      { family: "conc", eyebrow: "Bloque 2 · Concurrencia y paralelismo", hint: "concurrente no es paralelo",
        topics: ["gvl", "ractors", "fibers"] },
      { family: "mem", eyebrow: "Bloque 3 · Memoria y objetos", hint: "dónde viven los objetos",
        topics: ["gc", "heap", "shapes"] },
      { family: "obj", eyebrow: "Bloque 4 · Modelo de objetos y metaprogramación", hint: "cómo se resuelve un método",
        topics: ["lookup", "singleton", "caches"] },
      { family: "taller", eyebrow: "Bloque 5 · El taller", hint: "observa todo lo anterior en TU app",
        topics: ["perfila"] }
    ],

    quote: {
      eyebrow: "Del mito a la realidad",
      html: 'Cada ficha desmonta un malentendido: que los hilos de Ruby corren en paralelo, que el GC lo pausa todo, que el JIT compila el programa entero. La regla de la colección: nomenclatura de hoy <span style="color:var(--color-fg-faint);">(GVL, YARV, ISEQ)</span>, con el nombre histórico entre paréntesis cuando ayuda a reconocerlo.'
    },

    biblio: [
      { title: "Libros", items: [
        { star: true,  title: "Ruby Under a Microscope", note: "Pat Shaughnessy — la referencia de internals", url: "https://patshaughnessy.net/ruby-under-a-microscope" },
        { star: true,  title: "Metaprogramming Ruby 2", note: "Paolo Perrotta — modelo de objetos", url: "https://pragprog.com/titles/ppmetr2/metaprogramming-ruby-2/" },
        { star: false, title: "The Well-Grounded Rubyist", note: "David A. Black — reflection y threading", url: "https://www.manning.com/books/the-well-grounded-rubyist-third-edition" },
        { star: false, title: "Working with Ruby Threads", note: "Jesse Storimer — GVL y concurrencia", url: "https://workingwithruby.com/" }
      ]},
      { title: "Charlas y videos", items: [
        { star: true,  title: "Building a Compacting GC for MRI", note: "Aaron Patterson, RubyConf 2017", url: "https://www.youtube.com/watch?v=8Q7M513vewk" },
        { star: true,  title: "Implementing Object Shapes in CRuby", note: "Jemma Issroff, RubyKaigi 2022", url: "https://rubykaigi.org/2022/presentations/jemmaissroff.html" },
        { star: true,  title: "ZJIT: Building a Next Generation Ruby JIT", note: "equipo YJIT / Shopify", url: "https://www.rubyevents.org/talks/zjit-building-a-next-generation-ruby-jit" },
        { star: false, title: "Ractor on Ruby 3.4", note: "perfil de Koichi Sasada (ko1)", url: "https://www.rubyevents.org/talks/ractor-on-ruby-3-4" }
      ]},
      { title: "Blogs de ingeniería", items: [
        { star: true,  title: "YJIT: Building a New JIT Compiler for CRuby", note: "Shopify Engineering", url: "https://shopify.engineering/yjit-just-in-time-compiler-cruby" },
        { star: true,  title: "Rails at Scale", note: "YJIT / ZJIT y performance del runtime", url: "https://railsatscale.com/" },
        { star: true,  title: "The Practical Effects of the GVL on Scaling", note: "Nate Berkopec, Speedshop", url: "https://www.speedshop.co/2020/05/11/the-ruby-gvl-and-scaling.html" },
        { star: false, title: "What's The Deal With Ractors?", note: "Jean Boussier (byroot), core team", url: "https://byroot.github.io/ruby/performance/2025/02/27/whats-the-deal-with-ractors.html" },
        { star: false, title: "Ruby's JIT Journey: MJIT → YJIT → ZJIT", note: "Codemancers", url: "https://www.codemancers.com/blog/rubys-jit-journey" },
        { star: false, title: "What's New In Ruby 4.0", note: "Saeloun", url: "https://blog.saeloun.com/2025/12/24/what-is-new-in-ruby-4/" }
      ]},
      { title: "Fuentes primarias", items: [
        { star: false, title: "Ruby 4.0.0 Release Notes", note: "ruby-lang.org", url: "https://www.ruby-lang.org/en/news/2025/12/25/ruby-4-0-0-released/" },
        { star: false, title: "Docs oficiales de YJIT", note: "docs.ruby-lang.org", url: "https://docs.ruby-lang.org/en/3.4/yjit/yjit_md.html" },
        { star: false, title: "Propuesta de ZJIT (Feature #21221)", note: "bugs.ruby-lang.org", url: "https://bugs.ruby-lang.org/issues/21221" },
        { star: false, title: "Propuesta de Object Shapes (#18776)", note: "bugs.ruby-lang.org", url: "https://bugs.ruby-lang.org/issues/18776" },
        { star: false, title: "Código fuente ruby/ruby", note: "compile.c · gc.c · vm_*.c · shape.c · ractor.c", url: "https://github.com/ruby/ruby" },
        { star: false, title: "DeepWiki de ruby/ruby", note: "recorrido navegable del código", url: "https://deepwiki.com/ruby/ruby" }
      ]}
    ],

    colofon: 'Primera entrega de la colección <b>Polyglot</b> — temas avanzados de cada lenguaje, con el mismo sistema visual: una idea por diagrama, el código a un lado y el comportamiento interno al otro. No sustituye al código fuente de <b>ruby/ruby</b> ni a la documentación oficial — es el mapa para entenderlos.'
  };

})(window.GUIA = window.GUIA || {});
