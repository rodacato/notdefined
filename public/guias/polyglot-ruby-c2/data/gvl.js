/* ============================================================
   gvl.js — Ficha 04 · El GVL (antes GIL)
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.gvl = {
    slug: "gvl", n: "04", kind: "el candado", glyph: "◆◆◇", family: "conc",
    navShort: "El GVL",
    title: "El GVL (antes GIL)",
    tagline: "Un solo hilo ejecuta Ruby a la vez. Por eso más hilos no acelera tareas de CPU.",
    chips: ["Thread", "I/O vs CPU"],
    eyebrowSub: "un hilo a la vez",
    lede: 'El <b>GVL</b> (Global VM Lock) es un candado único: aunque crees muchos hilos, <b>solo uno ejecuta código Ruby a la vez</b>. Por eso los hilos de Ruby no aceleran tareas de CPU en paralelo. Pero sí ayudan cuando el trabajo es <em>esperar</em>.',

    enBreve: [
      { k: "Qué es",      v: "Un candado global" },
      { k: "Nombre viejo", v: "GIL" },
      { k: "Ayuda en",    v: "I/O-bound" },
      { k: "No ayuda en", v: "CPU-bound" }
    ],

    fundamento: 'Muchas estructuras internas de Ruby (la pila de la VM, tablas de objetos, el GC) <b>no son seguras</b> si dos hilos las tocan a la vez. La solución más simple y robusta: un único candado que un hilo debe <b>poseer</b> para ejecutar código Ruby. Sin él, dos hilos podrían corromper la memoria del intérprete. El precio: no hay dos hilos ejecutando Ruby en paralelo, jamás.',

    comoFunciona: 'Un hilo solo corre si <b>posee el GVL</b>. El planificador lo va rotando entre hilos listos en rebanadas de tiempo. La clave está en el <b>I/O</b>: cuando un hilo hace una operación de red o disco, <b>libera el GVL</b> mientras espera, y otro hilo puede avanzar. Por eso los hilos aceleran cargas I/O-bound (muchas esperas que se solapan) pero no CPU-bound (todos pelean por el mismo candado).',

    widget: {
      kind: "gvl",
      title: "El token que se pasan",
      intro: 'Tres hilos, un solo GVL. Cambia entre <b>CPU-bound</b> e <b>I/O-bound</b> y observa el reloj: con I/O los carriles avanzan intercalados y terminan antes; con CPU avanzan de uno en uno.',
      notes: [
        { key: "CPU-bound", accent: "var(--data-bad)", text: "El token nunca se comparte de verdad: solo el hilo que lo tiene calcula. Tres hilos tardan casi lo mismo que uno. Aquí más hilos no ayudan." },
        { key: "I/O-bound", accent: "var(--data-ok)", text: "Cada hilo suelta el GVL al esperar I/O; las esperas se solapan. Tres hilos terminan mucho antes que uno. Aquí los hilos sí valen." }
      ],
      codeTitle: "El patrón, en código",
      code: '<span class="tok-dim"># CPU-bound: los hilos NO se solapan (GVL)</span>\n4.times.map { <span class="tok-str">Thread</span>.new { fib(35) } }.each(&:join)\n\n<span class="tok-dim"># I/O-bound: los hilos SÍ se solapan (sueltan el GVL)</span>\nurls.map { |u| <span class="tok-str">Thread</span>.new { Net::HTTP.get(u) } }.each(&:join)'
    },

    callout: { tag: "Mito", text: '«Más hilos = más rápido, siempre». Solo si esperas I/O. Para trabajo de CPU en paralelo necesitas <a href="#/ractors">Ractors →</a> o varios procesos.' },

    recursos: [
      { title: "The Practical Effects of the GVL on Scaling", note: "Nate Berkopec, Speedshop", url: "https://www.speedshop.co/2020/05/11/the-ruby-gvl-and-scaling.html" },
      { title: "Working with Ruby Threads", note: "Jesse Storimer", url: "https://workingwithruby.com/" },
      { title: "Documentación de Thread", note: "docs.ruby-lang.org", url: "https://docs.ruby-lang.org/en/master/Thread.html" }
    ]
  };

})(window.GUIA = window.GUIA || {});
