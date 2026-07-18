/* ============================================================================
   data/sims-estructuras.js — EL GUIÓN de Estructuras de datos (módulo 04): arreglo vs lista, hash, BST y heap.
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


    /* ---- Módulo 04 · Arreglo vs lista enlazada ---- */
    "array-lista": {
      title: "Arreglo vs lista enlazada", values: [17, 42, 8, 30, 25, 11],
      intro: "Las dos estructuras lineales base. El arreglo es una fila de casilleros numerados: vas directo al k. La lista es una cadena de eslabones: para llegar al k, caminas. Lo barato en una es caro en la otra.",
      cx: "<table class=\"cx\"><thead><tr><th>operaci\u00f3n</th><th>arreglo</th><th>lista enlazada</th></tr></thead><tbody>" +
        "<tr><td>acceso al \u00edndice k</td><td class=\"mono\" style=\"color:var(--st-done)\">O(1)</td><td class=\"mono\" style=\"color:var(--st-out)\">O(n)</td></tr>" +
        "<tr><td>insertar / borrar en medio</td><td class=\"mono\" style=\"color:var(--st-out)\">O(n)</td><td class=\"mono\" style=\"color:var(--st-done)\">O(1)*</td></tr>" +
        "<tr><td>buscar un valor</td><td class=\"mono\">O(n)</td><td class=\"mono\">O(n)</td></tr></tbody></table>" +
        "<p class=\"faint\" style=\"font-size:11.5px;margin:8px 2px 0\">* O(1) en la lista <b>con el nodo en mano</b>; llegar hasta \u00e9l es O(n). Binary search solo funciona sobre el arreglo: necesita saltar al medio en O(1), algo que la lista no puede.</p>",
    },


    /* ---- Módulo 04 · Tabla hash ---- */
    hash: {
      title: "Tabla hash", buckets: 7, initial: ["sol", "luna", "mar"], presets: ["sol", "luna", "mar", "rio", "pan", "ola"],
      intro: "La funci\u00f3n hash convierte una clave en un \u00edndice de bucket, as\u00ed la b\u00fasqueda promedio es O(1). Cuando dos claves caen en el mismo bucket hay una <b>colisi\u00f3n</b>, y se resuelve encadenando.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-done)\">O(1)</b> promedio, <b class=\"tag-mono\" style=\"color:var(--st-out)\">O(n)</b> en el peor caso (todo colisiona en un bucket).</p>" +
        "<ul class=\"cx-list\"><li>El <b>factor de carga</b> (claves / buckets) controla las colisiones; al crecer, conviene agrandar la tabla.</li><li>Prueba \u201chash malo\u201d: manda todo al bucket 0 y la b\u00fasqueda degenera a recorrer una lista, O(n).</li><li>Esta funci\u00f3n hash es de juguete (suma de c\u00f3digos % tama\u00f1o); las reales distribuyen mucho mejor.</li></ul>",
    },


    /* ---- Módulo 04 · Árbol de búsqueda ---- */
    bst: {
      title: "\u00c1rbol binario de b\u00fasqueda", initial: [50, 30, 70, 20, 40, 60, 80],
      intro: "En cada nodo: menores a la izquierda, mayores a la derecha. Esa regla da b\u00fasqueda e inserci\u00f3n en O(log n) cuando el \u00e1rbol est\u00e1 balanceado \u2014 y hace que el recorrido in-order salga ordenado.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-done)\">O(log n)</b> balanceado (la altura es ~log n), <b class=\"tag-mono\" style=\"color:var(--st-out)\">O(n)</b> degenerado.</p>" +
        "<ul class=\"cx-list\"><li>Buscar e insertar bajan un nivel por comparaci\u00f3n: el costo es la altura del \u00e1rbol.</li><li>Inserta <b>1..7 en orden</b>: el \u00e1rbol se vuelve una lista inclinada y la b\u00fasqueda cae a O(n).</li><li>Para evitarlo existen \u00e1rboles auto-balanceados (AVL, rojo-negro). Aqu\u00ed no se balancea: se ve el problema.</li></ul>",
    },


    /* ---- Módulo 04 · Heap (min-heap) ---- */
    heap: {
      title: "Heap binario (min-heap)", initial: [10, 20, 15, 40, 25, 18],
      intro: "Un \u00e1rbol donde cada padre es menor que sus hijos, as\u00ed el m\u00ednimo siempre est\u00e1 en la ra\u00edz. La clave: el \u00e1rbol es <b>conceptual</b> \u2014 los datos viven en un arreglo y \u201cpadre/hijos\u201d son pura aritm\u00e9tica de \u00edndices.",
      cx: "<p>Insertar y extraer-m\u00edn son <b class=\"tag-mono\" style=\"color:var(--st-done)\">O(log n)</b> (el sift recorre una rama); ver el m\u00ednimo es <b class=\"tag-mono\" style=\"color:var(--st-cand)\">O(1)</b> (siempre la ra\u00edz).</p>" +
        "<ul class=\"cx-list\"><li>Mira las dos vistas a la par: el \u00e1rbol es solo una forma de leer el arreglo con aritm\u00e9tica de \u00edndices.</li><li>Esto es una <b>cola de prioridad</b>: lo que usan Dijkstra y Prim (m\u00f3dulo 05) para sacar siempre el m\u00e1s barato.</li><li>No est\u00e1 ordenado del todo \u2014 solo garantiza que el m\u00ednimo est\u00e1 arriba.</li></ul>",
    },

  });

})(window.GUIA = window.GUIA || {});
