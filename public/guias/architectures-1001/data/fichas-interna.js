/* ============================================================================
   fichas-interna.js — Fichas profundas · Familia 2 (Organización interna)
   Formato de datos: ver el encabezado de fichas-despliegue.js.
   ========================================================================== */
(function (G) {
  const F = (G.fichas = G.fichas || {});

  F["microkernel"] = {
    n: "09", id: "microkernel", nombre: "Microkernel · Plugins", prominencia: "nicho", vistaPrimaria: "limites",
    queEs: "Un núcleo mínimo + plugins que extienden la funcionalidad.",
    fuerza: "Un producto extensible por terceros o con features opcionales.",
    gana: "Extensibilidad y aislamiento de features.",
    paga: "Diseñar un buen contrato de plugin es difícil.",
    cuandoNo: "Cuando el dominio aún no estabiliza qué es núcleo y qué es plugin.",
    parientes: "Ejemplos claros: IDEs (VS Code), navegadores, sistemas de plugins.",
    ratings: { indep: 1, ops: 2, lat: 3, team: 3, cons: 3, scale: 2, change: 4 },
    diagrama: [
      { t: "node", x: 168, y: 106, w: 124, h: 66, role: "gateway", star: true, label: "Núcleo", sub: "contrato estable" },
      { t: "node", x: 186, y: 20, w: 88, h: 40, role: "service", label: "Plugin A" },
      { t: "node", x: 340, y: 116, w: 92, h: 46, role: "service", label: "Plugin B" },
      { t: "node", x: 186, y: 218, w: 88, h: 40, role: "service", label: "Plugin C" },
      { t: "node", x: 28, y: 116, w: 92, h: 46, role: "service", label: "Plugin D" },
      { t: "edge", x1: 230, y1: 60, x2: 230, y2: 106 },
      { t: "edge", x1: 292, y1: 139, x2: 340, y2: 139 },
      { t: "edge", x1: 230, y1: 172, x2: 230, y2: 218 },
      { t: "edge", x1: 168, y1: 139, x2: 120, y2: 139 },
    ],
  };
})(window.GUIA = window.GUIA || {});
