/* data/coleccion.js — identidad de la guía y estructura de bloques.
   DATOS, no motor: para cambiar textos de portada se edita solo este archivo. */
(function (G) {
  "use strict";
  var D = G.data;

  D.coleccion = {
    eyebrow: "Polyglot · notdefined",
    nivel: "PYTHON · NIVEL C2",
    titulo: "Python a fondo",
    lede: "CPython por dentro, del .py que escribes a la máquina que lo corre: " +
          "el pipeline de bytecode, el GIL y su final, el refcount y el modelo de objetos. " +
          "Cada tema trae fundamento, cómo funciona por dentro y una visualización paso a paso.",

    // Cuatro hechos del runtime que atraviesan todo el catálogo.
    contexto: {
      titulo: "El runtime, en 2026 — cuatro hechos que atraviesan todo",
      hechos: [
        { fam: 1, html: "<b>Es un intérprete de bytecode.</b> El fuente se compila y lo ejecuta una máquina de pila, el <em>eval loop</em>." },
        { fam: 1, html: "<b>Es adaptativo (3.11+) y con JIT (3.13+).</b> Especializa bytecode en caliente por tipo." },
        { fam: 2, html: "<b>El GIL ya es opcional (3.14).</b> El <em>free-threading</em> sin GIL pasó a estar soportado oficialmente." },
        { fam: 3, html: "<b>Memoria híbrida.</b> Reference counting inmediato + un GC generacional solo para ciclos." }
      ]
    },

    bloques: [
      { n: 1, fam: 1, titulo: "Compilación y ejecución", desc: "cómo pasa tu .py a correr" },
      { n: 2, fam: 2, titulo: "Concurrencia — el GIL y su fin", desc: "el candado global, y la transición de 2025–2026" },
      { n: 3, fam: 3, titulo: "Memoria y objetos", desc: "cómo se reserva, libera y representa todo" },
      { n: 4, fam: 4, titulo: "Modelo de objetos y estructuras", desc: "despacho de atributos y las estructuras de cada día" }
    ],

    colofon: "Parte de la colección <b>Polyglot</b> — junto a Ruby y Go a fondo: misma estructura, otro runtime. " +
             "La escala: C1 «dominado», lo que haces tú con el lenguaje · C2 «a fondo», lo que hace la máquina por debajo. " +
             "No sustituye al código de <b>python/cpython</b> ni a la documentación oficial: es el mapa para entrarles. " +
             "Locale de la VM: py-VM."
  };

})(window.GUIA = window.GUIA || {});
