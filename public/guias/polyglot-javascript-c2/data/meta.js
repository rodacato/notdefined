/* meta.js — textos de portada y el guiño de la colección. */
(function (G) {
  "use strict";
  const D = G.data = G.data || { topics: {} };

  D.meta = {
    count: "13 temas \u00b7 4 bloques",
    // Contrato del runner: verify-snippets se niega a correr sin este Node.
    ancla: "evaluado con Node 24.18 · V8 13.6 · ago 2026",
    lede: "JavaScript por dentro: un solo hilo, cuatro niveles de ejecución y un event loop. Entender el motor \u2014 no memorizar la sintaxis \u2014 y recuperar por el mecanismo que quieres ver, no por su nombre. La referencia pr\u00e1ctica es V8 (Chrome, Node, Deno, Edge).",
    tesis: "La pregunta de esta guía es «¿qué hace mi código cuando ya dejé de escribirlo?». Se consulta por el mecanismo que quieres ver — el event loop, las shapes, el GC — no por el nombre del feature.",
    camino: "Si no vienes por un tema en particular, arranca en <b>01 · El pipeline de ejecución</b>: es el mapa que ubica a los otros doce. De ahí, <b>05 · El Event Loop</b> si escribes asíncrono todos los días, o <b>09 · Shapes e Inline Caches</b> si lo tuyo es el rendimiento. Los ◆◆◆ piden segunda sentada; no son el punto de entrada.",
    // Colofón sin crédito de generación; huevo de pascua: el locale de la VM.
    colophon: "Cada ficha arranca del fundamento, lo hace visible con un widget que puedes pausar y avanzar paso a paso, y cierra con las fuentes que construyeron el motor. <span class=\"mono\" style=\"font-size:11px;color:var(--color-fg-faint)\">evaluado con Node 24.18 · V8 13.6 · locale: js-VM</span>",
  };
})(window.GUIA = window.GUIA || {});
