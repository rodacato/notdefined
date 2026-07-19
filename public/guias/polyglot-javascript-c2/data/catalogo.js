/* catalogo.js — estructura del catálogo: los 4 bloques y su orden de temas.
   Carga después de los datos de dominio; sólo referencia slugs existentes. */
(function (G) {
  "use strict";
  const D = G.data = G.data || { topics: {} };

  D.blocks = [
    {
      title: "Ejecuci\u00f3n y compilaci\u00f3n",
      slugs: ["pipeline-ejecucion", "ignition-bytecode", "niveles-jit", "modulos-esm-cjs"],
    },
    {
      title: "Concurrencia \u2014 el sello de JavaScript",
      slugs: ["event-loop", "async-await", "workers"],
    },
    {
      title: "Memoria y objetos",
      slugs: ["garbage-collector", "shapes-inline-caches", "layout-memoria"],
    },
    {
      title: "El modelo de objetos",
      slugs: ["prototype-chain", "closures", "this-hoisting"],
    },
  ];
})(window.GUIA = window.GUIA || {});
