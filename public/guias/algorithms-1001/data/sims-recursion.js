/* ============================================================================
   data/sims-recursion.js — EL GUIÓN de Recursión (módulo 03): call stack y Torres de Hanói.
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


    /* ---- Módulo 03 · La pila de llamadas ---- */
    recursion: {
      title: "La pila de llamadas", scenario: { n: 4 },
      intro: "La recursi\u00f3n asusta hasta que ves la pila. Cada llamada se apila como un marco que <b>espera</b>; al tocar el caso base, los marcos se desapilan devolviendo valores hacia arriba.",
      cx: "<p>Profundidad de pila <b class=\"tag-mono\" style=\"color:var(--st-cand)\">O(n)</b>: hay un marco vivo por cada llamada sin resolver, y llegan a haber n a la vez.</p>" +
        "<ul class=\"cx-list\"><li>Esa memoria es real: por eso la recursi\u00f3n muy profunda puede desbordar la pila.</li><li>El <b>caso base</b> es lo que garantiza que la pila se detenga y empiece a devolver.</li><li>Prueba \u201csin caso base\u201d para ver la pila crecer hasta el stack overflow.</li></ul>",
    },


    /* ---- Módulo 03 · Torres de Hanói ---- */
    hanoi: {
      title: "Torres de Han\u00f3i", scenario: { n: 3 },
      intro: "El salto recursivo: <b>confiar</b> en que la llamada hija ya resuelve el subproblema m\u00e1s chico. Para mover n discos, mueves n\u22121 al poste auxiliar (conf\u00eda), mueves el grande, y mueves los n\u22121 encima (conf\u00eda).",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-out)\">O(2\u207f)</b> movimientos (cada disco extra duplica el trabajo) y profundidad de pila <b class=\"tag-mono\" style=\"color:var(--st-goal)\">O(n)</b>.</p>" +
        "<ul class=\"cx-list\"><li>Lo exponencial es <b>inherente</b>: hay que hacer 2\u207f\u22121 movimientos s\u00ed o s\u00ed.</li><li>Memoizar no ayuda \u2014 y no porque falten subproblemas repetidos (hanoi(1) aparece mont\u00f3n de veces): es que el resultado no es un valor que caches, es <b>trabajo</b>. Los 2\u207f\u22121 movimientos hay que hacerlos todos.</li><li>Usa \u201cconf\u00eda en la recursi\u00f3n\u201d para colapsar un sub\u00e1rbol y sentir el salto de fe.</li></ul>",
    },

  });

})(window.GUIA = window.GUIA || {});
