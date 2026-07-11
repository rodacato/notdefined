/* ============================================================================
   fichas-distribuidos.js — Fichas profundas · Familia 4 (Distribuidos)
   Formato de datos: ver el encabezado de fichas-despliegue.js.
   ========================================================================== */
(function (G) {
  const F = (G.fichas = G.fichas || {});

  F["soa"] = {
    n: "15", id: "soa", nombre: "SOA (orientada a servicios)", prominencia: "nicho", vistaPrimaria: "limites",
    queEs: "Servicios de granularidad gruesa coordinados, a menudo vía un bus de servicios (ESB).",
    fuerza: "Integrar sistemas empresariales heterogéneos con reuso.",
    gana: "Integración y reuso a nivel de empresa.",
    paga: "El ESB tiende a volverse cuello de botella y «objeto-dios».",
    cuandoNo: "En un sistema nuevo: hoy su lugar lo toman microservicios + mensajería ligera. Sobrevive sobre todo en contextos empresariales heredados.",
    parientes: "Más histórico que recomendado.",
    ratings: { indep: 3, ops: 3, lat: 2, team: 3, cons: 2, scale: 3, change: 2 },
    diagrama: [
      { t: "node", x: 56, y: 50, w: 102, h: 44, role: "service", label: "CRM" },
      { t: "node", x: 180, y: 50, w: 102, h: 44, role: "service", label: "ERP" },
      { t: "node", x: 304, y: 50, w: 102, h: 44, role: "service", label: "Facturación" },
      { t: "node", x: 36, y: 128, w: 392, h: 34, role: "msg", star: true, label: "Bus de servicios (ESB)" },
      { t: "edge", x1: 107, y1: 94, x2: 107, y2: 128 },
      { t: "edge", x1: 231, y1: 94, x2: 231, y2: 128 },
      { t: "edge", x1: 355, y1: 94, x2: 355, y2: 128 },
      { t: "node", x: 110, y: 196, w: 110, h: 44, role: "service", label: "Pedidos" },
      { t: "node", x: 250, y: 196, w: 110, h: 44, role: "service", label: "Inventario" },
      { t: "edge", x1: 165, y1: 162, x2: 165, y2: 196 },
      { t: "edge", x1: 305, y1: 162, x2: 305, y2: 196 },
    ],
  };

  F["space-based"] = {
    n: "19", id: "space-based", nombre: "Espacio compartido (en memoria)", prominencia: "nicho", vistaPrimaria: "topologia",
    queEs: "Replicar el estado en una malla de memoria distribuida para que la base de datos no sea el cuello bajo carga extrema.",
    fuerza: "Picos masivos donde ninguna base de datos central aguanta.",
    gana: "Escala elástica extrema.",
    paga: "Complejidad alta; sostener la consistencia se vuelve pleito.",
    cuandoNo: "Carga modesta y predecible: la complejidad no se paga sola.",
    parientes: "Muy nicho (alta concurrencia tipo ticketing/trading). Avanzado.",
    ratings: { indep: 3, ops: 4, lat: 4, team: 2, cons: 1, scale: 4, change: 2 },
    diagrama: [
      { t: "node", x: 36, y: 26, w: 116, h: 44, role: "service", label: "Proc." },
      { t: "node", x: 172, y: 26, w: 116, h: 44, role: "service", label: "Proc." },
      { t: "node", x: 308, y: 26, w: 116, h: 44, role: "service", label: "Proc." },
      { t: "frame", x: 36, y: 120, w: 388, h: 132, variant: "grid", label: "Grid de datos en memoria · sin DB central" },
      { t: "node", x: 64, y: 150, w: 96, h: 40, role: "store", label: "shard" },
      { t: "node", x: 182, y: 150, w: 96, h: 40, role: "store", label: "shard" },
      { t: "node", x: 300, y: 150, w: 96, h: 40, role: "store", label: "shard" },
      { t: "node", x: 124, y: 202, w: 96, h: 40, role: "store", label: "réplica" },
      { t: "node", x: 242, y: 202, w: 96, h: 40, role: "store", label: "réplica" },
      { t: "edge", x1: 160, y1: 170, x2: 182, y2: 170 },
      { t: "edge", x1: 278, y1: 170, x2: 300, y2: 170 },
      { t: "path", d: "M 112 190 L 172 202", msg: true },
      { t: "path", d: "M 348 190 L 290 202", msg: true },
      { t: "edge", x1: 94, y1: 70, x2: 110, y2: 150 },
      { t: "edge", x1: 230, y1: 70, x2: 230, y2: 150 },
      { t: "edge", x1: 366, y1: 70, x2: 348, y2: 150 },
    ],
  };
})(window.GUIA = window.GUIA || {});
