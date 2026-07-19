/* meta.js — textos de portada y el guiño de la colección. */
(function (G) {
  "use strict";
  const D = G.data = G.data || { topics: {} };

  D.meta = {
    count: "13 temas \u00b7 4 bloques",
    lede: "JavaScript por dentro: un solo hilo, cuatro compiladores y un event loop. Entender el motor \u2014 no memorizar la sintaxis \u2014 y recuperar por el mecanismo que quieres ver, no por su nombre. La referencia pr\u00e1ctica es V8 (Chrome, Node, Deno, Edge).",
    // Colofón sin crédito de generación; huevo de pascua: el locale de la VM.
    colophon: "Cada ficha arranca del fundamento, lo hace visible con un widget que puedes pausar y avanzar paso a paso, y cierra con las fuentes que construyeron el motor. <span class=\"mono\" style=\"font-size:11px;color:var(--color-fg-faint)\">locale: js-VM</span>",
  };
})(window.GUIA = window.GUIA || {});
