/* ============================================================================
   data/sims-ordenamiento.js — EL GUIÓN de Ordenamiento (módulo 02): selection, insertion, quick y merge.
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


    /* ---- Módulo 02 · Selection sort ---- */
    selection: {
      title: "Selection sort", scenario: { seed: 11, len: 10 },
      intro: "El ordenamiento O(n\u00b2) m\u00e1s simple. Recorre lo que falta, encuentra el m\u00ednimo y lo pone al frente \u2014 una y otra vez. Sienta el patr\u00f3n <b>regi\u00f3n ordenada / regi\u00f3n pendiente</b>.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-out)\">O(n\u00b2)</b> en todos los casos. La pasada <span class=\"mono\">i</span> hace <span class=\"mono\">n\u2212i\u22121</span> comparaciones; sumadas dan <span class=\"mono\">n(n\u22121)/2</span>.</p>" +
        "<ul class=\"cx-list\"><li>Las pasadas se acortan, pero el total sigue creciendo como n\u00b2.</li><li>No importa si el arreglo ya ven\u00eda ordenado: hace las mismas comparaciones.</li><li>Pocos intercambios (a lo sumo n\u22121): \u00fatil si escribir en memoria es caro.</li></ul>",
    },


    /* ---- Módulo 02 · Insertion sort ---- */
    insertion: {
      title: "Insertion sort", scenario: { seed: 5, len: 10 },
      intro: "Como ordenar una mano de cartas: tomas la siguiente y la deslizas hasta su sitio entre las que ya tienes ordenadas. La regi\u00f3n ordenada se <b>construye insertando</b>, no seleccionando.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-done)\">O(n)</b> en el mejor caso (casi ordenado) y <b class=\"tag-mono\" style=\"color:var(--st-out)\">O(n\u00b2)</b> en el peor (orden inverso).</p>" +
        "<ul class=\"cx-list\"><li>Cada carta solo retrocede mientras encuentre vecinas mayores: si ya est\u00e1n casi en orden, casi no se mueve.</li><li>Por eso se usa en datos casi ordenados y como remate de sorts h\u00edbridos (Timsort, introsort).</li><li>Prueba \u201corden inverso\u201d y mira los desplazamientos dispararse.</li></ul>",
    },


    /* ---- Módulo 02 · Quicksort ---- */
    quick: {
      title: "Quicksort", scenario: { seed: 3, len: 10 },
      intro: "Elige un pivote, manda los menores a un lado y los mayores al otro, y repite en cada lado. De esa <b>partici\u00f3n</b> emerge la recursi\u00f3n \u2014 y la elecci\u00f3n del pivote lo cambia todo.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-path)\">O(n log n)</b> en promedio, <b class=\"tag-mono\" style=\"color:var(--st-out)\">O(n\u00b2)</b> en el peor caso. Lo decide el pivote: si parte el rango por la mitad hay <span class=\"mono\">log n</span> niveles; si siempre deja un lado vac\u00edo, hay <span class=\"mono\">n</span>.</p>" +
        "<ul class=\"cx-list\"><li>Activa \u201cpeor caso\u201d con pivote <b>\u00faltimo</b>: arreglo ya ordenado \u2192 particiones de tama\u00f1o 1, O(n\u00b2).</li><li>Cambia a pivote <b>aleatorio</b> y mira c\u00f3mo se recupera el O(n log n) esperado.</li><li>Esta es la partici\u00f3n de <b>Lomuto</b> (la m\u00e1s f\u00e1cil de ver); existen otras, como Hoare.</li></ul>",
    },


    /* ---- Módulo 02 · Merge sort ---- */
    merge: {
      title: "Merge sort", scenario: { seed: 8, len: 8 },
      intro: "El otro divide-y-vencer\u00e1s: partir hasta lo trivial y <b>mezclar ordenando</b>. Dos runs ya ordenados se combinan comparando sus cabezas. El \u00e1rbol de niveles es el protagonista.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-done)\">O(n log n)</b> garantizado, en todos los casos. Hay <span class=\"mono\">log n</span> niveles y cada nivel toca los <span class=\"mono\">n</span> elementos una vez.</p>" +
        "<ul class=\"cx-list\"><li>A diferencia de quicksort, no tiene peor caso O(n\u00b2): siempre parte exacto a la mitad.</li><li>El precio es memoria extra <b>O(n)</b> para mezclar (la fila \u201csalida\u201d).</li><li>Es estable: conserva el orden relativo de valores iguales.</li></ul>",
    },

  });

})(window.GUIA = window.GUIA || {});
