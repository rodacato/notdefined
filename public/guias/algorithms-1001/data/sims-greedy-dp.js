/* ============================================================================
   data/sims-greedy-dp.js — EL GUIÓN de Greedy y DP (módulo 06): actividades, Fibonacci + memo y mochila 0/1.
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


    /* ---- Módulo 06 · Greedy: selección de actividades ---- */
    greedy: {
      title: "Greedy: selecci\u00f3n de actividades",
      intro: "La idea greedy: en cada paso elegir lo que se ve mejor <b>ahora</b>, sin volver atr\u00e1s. Ac\u00e1 queremos el mayor n\u00famero de actividades sin solapamiento \u2014 y la <b>estrategia</b> de elecci\u00f3n decide si llegamos al \u00f3ptimo.",
      acts: [{ id: "A", s: 1, e: 5 }, { id: "B", s: 6, e: 10 }, { id: "C", s: 10, e: 13 }, { id: "D", s: 4, e: 7 }, { id: "E", s: 0, e: 11 }],
      T: 13, optimo: 3,
      strats: [{ id: "end", label: "termina antes", optimal: true }, { id: "short", label: "m\u00e1s corto" }, { id: "start", label: "empieza antes" }],
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-cand)\">O(n log n)</b>: el trabajo est\u00e1 en ordenar las actividades; despu\u00e9s, una sola pasada lineal.</p>" +
        "<ul class=\"cx-list\"><li>Elegir siempre <b>la que termina antes</b> deja el mayor hueco para el resto: es \u00f3ptima (se puede demostrar).</li><li>Prueba \u201cm\u00e1s corto\u201d o \u201cempieza antes\u201d: son greedy tambi\u00e9n, pero ac\u00e1 caen en 2 y 1 actividades (la madrugadora E acapara el d\u00eda entero). La estrategia importa.</li><li>Greedy es r\u00e1pido, pero solo da el \u00f3ptimo cuando el problema tiene la estructura adecuada.</li></ul>",
    },


    /* ---- Módulo 06 · Fibonacci + memoización ---- */
    fib: {
      title: "Fibonacci: recursi\u00f3n y memoizaci\u00f3n",
      intro: "fib(n) = fib(n\u22121) + fib(n\u22122). La recursi\u00f3n ingenua recalcula los mismos subproblemas una y otra vez. <b>Memoizar</b> \u2014guardar cada resultado la primera vez\u2014 los elimina: el \u00e1rbol se desploma. Es el \u201caj\u00e1\u201d de la programaci\u00f3n din\u00e1mica.",
      cx: "<p>Sin memo: <b class=\"tag-mono\" style=\"color:var(--st-out)\">~O(2\u207f)</b> (el \u00e1rbol casi se duplica por nivel). Con memo: <b class=\"tag-mono\" style=\"color:var(--st-done)\">O(n)</b> (cada fib(k) se calcula una vez).</p>" +
        "<ul class=\"cx-list\"><li>La clave de la DP: <b>subproblemas que se solapan</b>. Si se repiten, vale la pena guardarlos.</li><li>Esto es memoizaci\u00f3n <b>top-down</b> (recursi\u00f3n + cach\u00e9). La mochila (6.3) usa una tabla <b>bottom-up</b>.</li><li>Contrasta con Han\u00f3i (m\u00f3dulo 03): all\u00e1 el subproblema no devuelve un n\u00famero que cachear, sino movimientos que igual hay que ejecutar \u2014 por eso memoizar no ayuda.</li><li>Es el patr\u00f3n de cach\u00e9 en miniatura: la misma jugada que un Proxy de cach\u00e9 (Tomo I \u00b7 patrones), aqu\u00ed dentro de una funci\u00f3n.</li></ul>",
    },


    /* ---- Módulo 06 · Mochila 0/1 (DP) ---- */
    knapsack: {
      title: "Mochila 0/1 \u2014 programaci\u00f3n din\u00e1mica",
      intro: "Maximizar el valor que cabe en una mochila de capacidad fija, tomando o no cada item entero. En vez de recursi\u00f3n exponencial, se llena una <b>tabla</b>: cada celda re\u00fasa subproblemas ya resueltos en la fila de arriba.",
      items: [{ w: 1, v: 1 }, { w: 3, v: 4 }, { w: 4, v: 5 }, { w: 5, v: 7 }], W: 7,
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-cand)\">O(n\u00b7W)</b> en tiempo y espacio: una celda por (item, capacidad), cada una en O(1) mirando dos celdas de arriba.</p>" +
        "<ul class=\"cx-list\"><li>Cada celda = \u201ctomar\u201d (valor + subproblema con menos capacidad) vs \u201cno tomar\u201d (celda de arriba). Se queda con el m\u00e1ximo.</li><li>Es <b>pseudo-polinomial</b>: depende de W (el n\u00famero), no de su tama\u00f1o en bits \u2014 por eso no es realmente polinomial.</li><li>Comp\u00e1ralo con el \u00e1rbol ingenuo (bot\u00f3n de arriba): la tabla calcula cada subproblema una sola vez.</li></ul>",
    },

  });

})(window.GUIA = window.GUIA || {});
