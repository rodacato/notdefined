/* ============================================================================
   data/sims-busqueda.js — EL GUIÓN de Búsqueda (módulo 01): lineal y binaria.
   Solo contenido: textos, escenarios y complejidades; la mecánica vive en js/.
   ── Cómo agregar una simulación nueva ────────────────────────────────────
   1. Añade su entrada en el sims-*.js de su familia con esta forma:
        miClave: {
          title: "Título visible",
          intro: "Párrafo de introducción (admite <b>, <i>).",
          scenario: { seed: 7, len: 12 },   // parámetros del PRNG
          cx: "<p>Explicación de complejidad en HTML…</p>",
        }
   2. En el módulo correspondiente (js/page-<dominio>.js) referencia esa clave.
   Para corregir un texto o cambiar el arreglo de ejemplo, edita aquí y ya.
   ========================================================================== */
(function (G) {
  "use strict";

  var DATA = (G.DATA = G.DATA || {});
  DATA.sims = DATA.sims || {};

  Object.assign(DATA.sims, {


    /* ---- Módulo 01 · Búsqueda lineal ---- */
    lineal: {
      title: "B\u00fasqueda lineal",
      intro: "La forma m\u00e1s directa: mirar casilla por casilla, de izquierda a derecha, hasta encontrar el valor o agotar el arreglo. Es la l\u00ednea base contra la que se mide todo lo dem\u00e1s.",
      scenario: { seed: 7, len: 12 },
      cx: "<p style=\"margin:0 0 8px\"><b class=\"tag-mono\" style=\"color:var(--st-cand)\">O(n)</b> \u2014 el n\u00famero de comparaciones crece en l\u00ednea recta con el tama\u00f1o. Si el objetivo est\u00e1 en la posici\u00f3n <span class=\"mono\">k</span>, hacemos <span class=\"mono\">k+1</span> comparaciones.</p>" +
          "<ul class=\"cx-list\">" +
          "<li>Mejor caso: el objetivo est\u00e1 al inicio \u2192 <span class=\"mono\">1</span> comparaci\u00f3n.</li>" +
          "<li>Peor caso: al final o ausente \u2192 <span class=\"mono\">n</span> comparaciones.</li>" +
          "<li>No necesita que el arreglo est\u00e9 ordenado: por eso funciona siempre, pero nunca es r\u00e1pido.</li>" +
          "</ul>",
    },


    /* ---- Módulo 01 · Búsqueda binaria ---- */
    binaria: {
      title: "B\u00fasqueda binaria",
      intro: "Como buscar una palabra en el diccionario: abres por la mitad, ves de qu\u00e9 lado cae y tiras la otra mitad. En cada paso el problema se reduce a la mitad \u2014 pero exige que el arreglo est\u00e9 <b>ordenado</b>.",
      scenario: { seed: 4, len: 15 },
      // Filas de la tabla de complejidad: n → pasos máximos (log2) vs lineal.
      cxRows: [8, 16, 32, 64, 128, 1024],
      cxIntro: "<b class=\"tag-mono\" style=\"color:var(--st-path)\">O(log n)</b> \u2014 cada paso descarta la mitad del rango, as\u00ed que el n\u00famero de pasos crece muy despacio. <b>Duplicar n agrega un solo paso.</b>",
    },

  });

})(window.GUIA = window.GUIA || {});
