/* ============================================================================
   data/sims-fundamentos.js — EL GUIÓN de Fundamentos (módulo 00): Big O.
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


    /* ---- Módulo 00 · Big O ---- */
    bigO: {
      eyebrow: "M\u00f3dulo 00 \u00b7 Complejidad \u00b7 Modelo mental base",
      title: "Big\u00a0O: la intuici\u00f3n del crecimiento",
      intro: "No mide cu\u00e1nto tarda hoy, sino c\u00f3mo se infla el trabajo cuando le das m\u00e1s datos. Misma tarea, distinta entrada: unas complejidades casi no se mueven y otras explotan.",
      // Rango del plano y topes visuales (parámetros del escenario).
      nMin: 1, nMax: 100, yMax: 110, boxCap: 100,
      fastestKey: "quad",
      // Las cinco complejidades: contenido (etiqueta, nombre, color, glifo, ejemplo).
      // La fórmula de crecimiento (fn) vive en la mecánica: js/page-fundamentos.js.
      complexities: [
        { key: "one",   label: "O(1)",       name: "constante",     hex: "#4C9A6A", glyph: "\u25CF", everyday: "Mirar la primera entrada de tu agenda." },
        { key: "log",   label: "O(log n)",   name: "logar\u00edtmica",  hex: "#2E8B8B", glyph: "\u25C6", everyday: "Buscar un nombre en una agenda ordenada, partiendo a la mitad." },
        { key: "lin",   label: "O(n)",       name: "lineal",        hex: "#3E7CB1", glyph: "\u25B2", everyday: "Leer toda la agenda, contacto por contacto, una sola vez." },
        { key: "nlogn", label: "O(n log n)", name: "loglineal",  hex: "#E0A93B", glyph: "\u25A0", everyday: "Ordenar la agenda completa de la A a la Z." },
        { key: "quad",  label: "O(n\u00b2)",      name: "cuadr\u00e1tica",   hex: "#B05B4D", glyph: "\u2726", everyday: "Comparar a cada contacto contra todos los dem\u00e1s." },
      ],
      predict: {
        title: "Cuando n se hace grande, \u00bfcu\u00e1l crees que crece m\u00e1s r\u00e1pido?",
        sub: "Antes de mover el deslizador, haz tu apuesta. Luego ver\u00e1s correr las curvas y comparar\u00e1s con tu intuici\u00f3n.",
      },
      cxNote: "Conteos ilustrativos: lo que importa es la forma del crecimiento, no la cifra exacta. Doblar n \u21d2 O(n\u00b2) hace \u00d74 el trabajo; O(log n) apenas suma uno.",
      // Pseudocódigo representativo por complejidad.
      pseudo: {
        one:
"<span class=\"cm\"># O(1) \u2014 trabajo fijo, no depende de n</span>\n<span class=\"kw\">func</span> <span class=\"fn\">primero</span>(lista):\n    <span class=\"kw\">return</span> lista[0]   <span class=\"cm\"># 1 operaci\u00f3n, siempre</span>",
        log:
"<span class=\"cm\"># O(log n) \u2014 parte el problema a la mitad cada vez</span>\n<span class=\"kw\">func</span> <span class=\"fn\">busquedaBinaria</span>(lista, x):\n    lo, hi = 0, len(lista) - 1\n    <span class=\"kw\">while</span> lo <= hi:                <span class=\"cm\"># ~log2(n) vueltas</span>\n        m = (lo + hi) // 2\n        <span class=\"kw\">if</span> lista[m] == x: <span class=\"kw\">return</span> m\n        <span class=\"kw\">if</span> lista[m] < x: lo = m + 1\n        <span class=\"kw\">else</span>:            hi = m - 1",
        lin:
"<span class=\"cm\"># O(n) \u2014 toca cada elemento una vez</span>\n<span class=\"kw\">func</span> <span class=\"fn\">contiene</span>(lista, x):\n    <span class=\"kw\">for</span> e <span class=\"kw\">in</span> lista:            <span class=\"cm\"># n vueltas</span>\n        <span class=\"kw\">if</span> e == x: <span class=\"kw\">return</span> <span class=\"kw\">true</span>\n    <span class=\"kw\">return</span> <span class=\"kw\">false</span>",
        nlogn:
"<span class=\"cm\"># O(n log n) \u2014 divide (log n) y combina (n) en cada nivel</span>\n<span class=\"kw\">func</span> <span class=\"fn\">mergeSort</span>(lista):\n    <span class=\"kw\">if</span> len(lista) <= 1: <span class=\"kw\">return</span> lista\n    mid = len(lista) // 2\n    izq = <span class=\"fn\">mergeSort</span>(lista[:mid])    <span class=\"cm\"># log n niveles\u2026</span>\n    der = <span class=\"fn\">mergeSort</span>(lista[mid:])\n    <span class=\"kw\">return</span> <span class=\"fn\">mezclar</span>(izq, der)        <span class=\"cm\"># \u2026\u00d7n por nivel</span>",
        quad:
"<span class=\"cm\"># O(n\u00b2) \u2014 para cada elemento, recorre todos otra vez</span>\n<span class=\"kw\">func</span> <span class=\"fn\">hayDuplicado</span>(lista):\n    <span class=\"kw\">for</span> i <span class=\"kw\">in</span> 0..n-1:          <span class=\"cm\"># n vueltas\u2026</span>\n        <span class=\"kw\">for</span> j <span class=\"kw\">in</span> 0..n-1:      <span class=\"cm\"># \u2026\u00d7n vueltas = n\u00b2</span>\n            <span class=\"kw\">if</span> i != j <span class=\"kw\">and</span> lista[i] == lista[j]: <span class=\"kw\">return</span> <span class=\"kw\">true</span>\n    <span class=\"kw\">return</span> <span class=\"kw\">false</span>",
      },
    },

  });

})(window.GUIA = window.GUIA || {});
