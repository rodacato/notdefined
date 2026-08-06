/* catalogo.js — estructura del catálogo: los 4 bloques y su orden de temas.
   Carga después de los datos de dominio; sólo referencia slugs existentes. */
(function (G) {
  "use strict";
  const D = G.data = G.data || { topics: {} };

  // `layer` es la capa dominante del bloque, medida sobre sus temas: no hay
  // paleta propia de bloque porque duplicaría la codificación de capa.
  D.blocks = [
    {
      id: "ejecucion",
      folio: "I",
      layer: "motor",
      title: "Ejecución y compilación",
      model: "la fábrica que asciende",
      modelLong: "Tu código no se compila de golpe ni se queda interpretado para siempre. Entra como texto, corre interpretado, y sólo lo que demuestra que se usa mucho <em class=\"serif-italic\">se gana</em> el código máquina. Lo demás se queda abajo, y está bien: compilar cuesta.",
      slugs: ["pipeline-ejecucion", "ignition-bytecode", "niveles-jit", "modulos-esm-cjs"],
    },
    {
      id: "concurrencia",
      folio: "II",
      layer: "runtime",
      title: "Concurrencia — el sello de JavaScript",
      model: "un solo mesero",
      modelLong: "No hay hilos escondidos. Hay <strong>un</strong> hilo atendiendo por turnos, con dos filas: las microtareas se despachan <em class=\"serif-italic\">todas</em> antes de tocar la siguiente macrotarea. <span class=\"inline-code\">await</span> no contrata a nadie — sólo se vuelve a formar.",
      slugs: ["event-loop", "async-await", "workers"],
    },
    {
      id: "memoria",
      folio: "III",
      layer: "motor",
      title: "Memoria y objetos",
      model: "nadie guarda de más",
      modelLong: "El motor evita almacenar lo que puede compartir o deducir: los objetos con la misma forma comparten un plano, los enteros chicos viajan dentro de la palabra sin tocar el heap, y lo que ya nadie alcanza se recoge. Casi todo lo que llamas «rendimiento de JS» sale de aquí.",
      slugs: ["garbage-collector", "shapes-inline-caches", "layout-memoria"],
    },
    {
      id: "objetos",
      folio: "IV",
      layer: "lenguaje",
      title: "El modelo de objetos",
      model: "nada se copia, todo se enlaza",
      modelLong: "Un objeto no hereda una copia: apunta a otro objeto. Una closure no copia variables: retiene su entorno. Y <span class=\"inline-code\">this</span> no se guarda en ningún lado: se decide en cada llamada. Las tres sorpresas del bloque son la misma sorpresa.",
      slugs: ["prototype-chain", "closures", "this-hoisting"],
    },
  ];
})(window.GUIA = window.GUIA || {});
