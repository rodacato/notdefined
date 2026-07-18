/* ============================================================
   fibers.js — Ficha 06 · Fibers y el scheduler async
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.fibers = {
    slug: "fibers", n: "06", kind: "cooperativo", glyph: "◆◆◇", family: "conc",
    navShort: "Fibers",
    title: "Fibers y el scheduler async",
    tagline: "Concurrencia que cede el control ella misma. Miles de tareas en un solo hilo.",
    chips: ["Fiber", "async", "yield"],
    eyebrowSub: "ceder el control",
    lede: 'Un <b>Fiber</b> es concurrencia <b>cooperativa</b>: una sola línea de ejecución que decide <em>ella misma</em> cuándo cede el control, sin usar hilos del sistema operativo. Es la base de librerías como <code class="ic">async</code>.',

    enBreve: [
      { k: "Modelo",   v: "Cooperativo" },
      { k: "Cede con",  v: "Fiber.yield" },
      { k: "Paralelo",  v: "No · un solo hilo" },
      { k: "Coste",     v: "Miles de fibers" }
    ],

    fundamento: 'Los <a href="#/gvl">hilos</a> los interrumpe el sistema operativo cuando quiere: no controlas <em>dónde</em> se corta tu código, y eso obliga a poner candados. Un <b>Fiber</b> invierte el trato: nunca se le interrumpe por sorpresa; solo cambia de tarea cuando el código dice explícitamente «cedo aquí». Menos peligro de condiciones de carrera, y cambios de contexto baratísimos.',

    comoFunciona: 'Un fiber corre hasta que hace <code class="ic">Fiber.yield</code> (o hasta una operación de I/O, si hay un <em>scheduler</em> conectado), momento en el que otro fiber toma el control. No hay paralelismo —sigue siendo un solo hilo— pero sí concurrencia muy barata: puedes tener miles de fibers atendiendo miles de conexiones, cada una avanzando cuando su I/O está lista.',

    widget: {
      kind: "fibers",
      title: "Una sola línea que salta",
      intro: 'Tres fibers, un solo hilo. Avanza y observa: la ejecución corre <b>un</b> tramo, cede en <code class="ic">yield</code>, y el control salta al siguiente. Nunca hay dos corriendo a la vez, y el salto solo ocurre en los puntos de cesión.',
      labels: [
        ["conecta", "parsea", "responde"],
        ["conecta", "consulta", "responde"],
        ["conecta", "lee disco", "responde"]
      ],
      notes: [
        { key: "Hilos · preemptivo", accent: "var(--data-bad)", text: "El SO corta la ejecución en cualquier punto, sin avisar. Necesitas candados para no corromper datos compartidos." },
        { key: "Fibers · cooperativo", accent: "var(--data-ok)", text: "Cambian solo en puntos de cesión que tú marcas. Entre yields tienes el control en exclusiva: sin sorpresas." }
      ],
      codeTitle: "Miles de peticiones en un solo hilo",
      code: '<span class="tok-str">Async</span> <span class="tok-kw">do</span>\n  urls.each <span class="tok-kw">do</span> |u|\n    <span class="tok-str">Async</span> { fetch(u) }  <span class="tok-dim"># cede el control al esperar I/O</span>\n  <span class="tok-kw">end</span>\n<span class="tok-kw">end</span>'
    },

    callout: { tag: "Mito", text: '«Fibers = paralelismo ligero». No: es <b>concurrencia</b>, un solo hilo. Sirve para solapar esperas de I/O, no para usar varios núcleos — eso es tarea de <a href="#/ractors">Ractors →</a>.' },

    recursos: [
      { title: "Fiber y Fiber::Scheduler", note: "docs oficiales", url: "https://docs.ruby-lang.org/en/master/Fiber.html" },
      { title: "gema async", note: "Samuel Williams, el scheduler de fibers", url: "https://github.com/socketry/async" },
      { title: "Charlas de Samuel Williams sobre async", note: "concurrencia con fibers a escala", url: "https://www.rubyevents.org/talks/the-journey-to-one-million" }
    ]
  };

})(window.GUIA = window.GUIA || {});
