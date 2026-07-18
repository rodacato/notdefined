/* ============================================================
   ractors.js — Ficha 05 · Ractors, paralelismo real
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.ractors = {
    slug: "ractors", n: "05", kind: "paralelo real", glyph: "◆◆◆", family: "conc",
    navShort: "Ractors",
    title: "Ractors: paralelismo real",
    tagline: "Memoria aislada y paso de mensajes: la respuesta de Ruby a «usa todos mis núcleos».",
    chips: ["Ractor::Port", "shareable"],
    eyebrowSub: "memoria aislada",
    lede: 'Un <b>Ractor</b> es una unidad de ejecución con <b>memoria aislada</b> que se comunica por <b>paso de mensajes</b>. Como no comparte estado mutable, esquiva el GVL y corre en paralelo de verdad. Es la respuesta de Ruby a <em>«cómo uso todos mis núcleos»</em>.',

    enBreve: [
      { k: "Memoria",  v: "Aislada por Ractor" },
      { k: "Comunica", v: "Paso de mensajes" },
      { k: "Paralelo", v: "Sí, esquiva el GVL" },
      { k: "Ruby 4.0", v: "Ractor::Port" }
    ],

    fundamento: 'El <a href="#/gvl">GVL</a> existe porque los hilos comparten memoria y eso es peligroso. La idea del Ractor invierte el problema: si <b>no comparten memoria mutable</b>, no hace falta candado, y pueden correr a la vez. El coste: ya no puedes pasar objetos libremente entre ellos — tienes que mandarte mensajes, y hay reglas sobre qué se puede compartir.',

    comoFunciona: 'Los Ractors se mandan objetos, y hay tres destinos posibles. <b>Copiar</b>: se hace un duplicado profundo, cada Ractor tiene el suyo. <b>Mover</b>: el objeto pasa al receptor y el emisor <b>pierde el acceso</b> (útil para objetos grandes, sin copiar). <b>Compartir</b>: solo los objetos <em>shareable</em> —inmutables o congelados— pueden compartirse por referencia sin copiar. Intentar compartir un objeto mutable es un error. La letra chica: buena parte del ecosistema (gemas, partes de la stdlib) aún no es Ractor-safe, así que hoy brillan en cargas puras de CPU con pocas dependencias — no como reemplazo general de hilos.',

    widget: {
      kind: "ractors",
      title: "Manda un mensaje",
      intro: 'Elige un objeto y cómo enviarlo entre dos Ractors. Prueba a <b>compartir</b> un String mutable para ver saltar la regla de aislamiento.',
      objs: [
        { key: "mut",    label: "String mutable", ruby: '"hola"',         shareable: false },
        { key: "frozen", label: "String .freeze", ruby: '"hola".freeze',  shareable: true },
        { key: "int",    label: "Integer",        ruby: "42",             shareable: true }
      ],
      modes: [
        { key: "copy",  verb: "copiar" },
        { key: "move",  verb: "mover" },
        { key: "share", verb: "compartir" }
      ]
    },

    callout: { tag: "Regla", text: 'Solo se comparten objetos <b>shareable</b>: inmutables por naturaleza (Integer, Symbol, true/false) o congelados con <code class="ic">.freeze</code>. Todo lo demás se copia o se mueve.' },

    recursos: [
      { title: "doc/ractor.md", note: "la referencia oficial, en ruby/ruby", url: "https://github.com/ruby/ruby/blob/master/doc/ractor.md" },
      { title: "What's The Deal With Ractors?", note: "Jean Boussier (byroot), core team", url: "https://byroot.github.io/ruby/performance/2025/02/27/whats-the-deal-with-ractors.html" },
      { title: "Notas de release de Ruby 4.0", note: "Ractor::Port y shareable_proc", url: "https://www.ruby-lang.org/en/news/2025/12/25/ruby-4-0-0-released/" }
    ]
  };

})(window.GUIA = window.GUIA || {});
