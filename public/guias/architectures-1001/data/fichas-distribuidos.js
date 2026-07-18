/* ============================================================================
   fichas-distribuidos.js — Fichas profundas · Familia 4 (Datos y consistencia)
   Formato de datos: ver el encabezado de fichas-despliegue.js.
   ========================================================================== */
(function (G) {
  const F = (G.fichas = G.fichas || {});

  F["cqrs"] = {
    n: "16", id: "cqrs", nombre: "CQRS", prominencia: "situacional", vistaPrimaria: "flujo",
    queEs: "Separar el modelo que escribe (comandos) del que lee (consultas); cada lado con su forma y, si hace falta, su propia base.",
    fuerza: "Leer y escribir tienen cargas o formas tan distintas que un solo modelo sirve mal a ambos.",
    gana: "Cada lado optimizado y escalado por su cuenta: lecturas desnormalizadas rápidas sin ensuciar el modelo de escritura.",
    paga: "Dos modelos que mantener sincronizados; con bases separadas, consistencia eventual y la pregunta «¿por qué no aparece lo que acabo de guardar?».",
    cuandoNo: "CRUD parejo con formas similares de lectura y escritura: separar solo agrega piezas y sincronización que nadie pidió.",
    parientes: "Combina natural con event sourcing (los eventos alimentan las proyecciones de lectura), pero NO lo implica: hay CQRS con dos tablas SQL y ya. Empieza con dos modelos en la misma base antes de separar bases.",
    ratings: { indep: 3, ops: 3, lat: 4, team: 3, cons: 1, scale: 4, change: 2 },
    diagrama: [
      { t: "node", x: 12, y: 104, w: 78, h: 64, role: "actor", label: "Cliente" },
      { t: "node", x: 158, y: 40, w: 150, h: 52, role: "service", label: "Modelo de escritura", sub: "comandos" },
      { t: "node", x: 158, y: 190, w: 150, h: 52, role: "service", label: "Modelo de lectura", sub: "consultas" },
      { t: "edge", x1: 90, y1: 120, x2: 158, y2: 70, arrow: true },
      { t: "label", x: 112, y: 78, text: "escribe" },
      { t: "edge", x1: 90, y1: 152, x2: 158, y2: 212, arrow: true },
      { t: "label", x: 112, y: 200, text: "lee" },
      { t: "node", x: 360, y: 42, w: 88, h: 48, role: "store", label: "DB", sub: "escritura" },
      { t: "node", x: 360, y: 192, w: 88, h: 48, role: "store", label: "DB", sub: "lectura" },
      { t: "edge", x1: 308, y1: 66, x2: 360, y2: 66, arrow: true },
      { t: "edge", x1: 308, y1: 216, x2: 360, y2: 216, arrow: true },
      { t: "path", d: "M 404 90 C 430 130, 430 152, 404 192", msg: true },
      { t: "label", x: 376, y: 141, text: "proyección eventual", cls: "tedge-label msg-label" },
    ],
  };

  F["event-sourcing"] = {
    n: "17", id: "event-sourcing", nombre: "Event Sourcing", prominencia: "nicho", vistaPrimaria: "evolucion",
    queEs: "Persistir cada cambio como un evento inmutable en un log append-only; el estado actual se deriva reproduciendo los eventos.",
    fuerza: "Que el historial completo SEA la fuente de verdad: auditoría exacta y rebobinar a cualquier punto.",
    gana: "Auditoría gratis, debugging con viaje en el tiempo y proyecciones nuevas sobre datos viejos.",
    paga: "Versionar eventos duele: el evento de hace dos años se reproduce con el código de hoy. Snapshots, reprocesos y un modelo mental que pocos equipos dominan.",
    cuandoNo: "Cuando solo necesitas el último estado: un UPDATE honesto es más simple que un log que nadie va a rebobinar.",
    parientes: "No es CQRS, aunque casi siempre van juntos: aquí se decide QUÉ persistir; en CQRS, quién lee y quién escribe. El ledger contable es su ancestro de papel.",
    ratings: { indep: 2, ops: 4, lat: 2, team: 2, cons: 2, scale: 3, change: 1 },
    diagrama: [
      { t: "node", x: 10, y: 36, w: 88, h: 46, role: "actor", label: "Comando" },
      { t: "edge", x1: 98, y1: 59, x2: 140, y2: 59, arrow: true },
      { t: "node", x: 140, y: 36, w: 112, h: 46, role: "service", label: "Agregado", sub: "decide" },
      { t: "node", x: 96, y: 128, w: 268, h: 46, role: "store", star: true, label: "Log de eventos", sub: "append-only · la verdad" },
      { t: "edge", x1: 196, y1: 82, x2: 196, y2: 128, arrow: true },
      { t: "label", x: 222, y: 105, text: "evento" },
      { t: "path", d: "M 300 128 C 316 104, 296 88, 254 66", msg: true },
      { t: "label", x: 334, y: 98, text: "rehidrata", cls: "tedge-label msg-label" },
      { t: "node", x: 110, y: 214, w: 126, h: 46, role: "service", label: "Proyecciones" },
      { t: "edge", x1: 180, y1: 174, x2: 176, y2: 214, arrow: true, msg: true },
      { t: "label", x: 146, y: 196, text: "replay", cls: "tedge-label msg-label" },
      { t: "node", x: 300, y: 214, w: 136, h: 46, role: "store", label: "Vistas de lectura" },
      { t: "edge", x1: 236, y1: 237, x2: 300, y2: 237, arrow: true },
    ],
  };

  F["saga"] = {
    n: "18", id: "saga", nombre: "Saga", prominencia: "situacional", vistaPrimaria: "flujo",
    queEs: "Una transacción que cruza servicios, partida en pasos locales; si un paso falla, se ejecutan compensaciones que deshacen lo anterior.",
    fuerza: "Consistencia entre servicios sin 2PC ni locks distribuidos.",
    gana: "Cada servicio confirma en su propia base y el flujo completo sobrevive fallas parciales sin bloquear a nadie.",
    paga: "Las compensaciones son código de negocio que hay que diseñar y probar (¿cómo des-cobras un pago?); estados intermedios visibles y debugging de flujos a medias.",
    cuandoNo: "Si todo cabe en una sola base, una transacción ACID hace lo mismo con una fracción del esfuerzo.",
    parientes: "Dos sabores: coreografía (eventos, sin dueño) y orquestación (un coordinador explícito). No da ACID: da atomicidad eventual sin aislamiento — otros ven los pasos intermedios.",
    ratings: { indep: 3, ops: 4, lat: 1, team: 3, cons: 2, scale: 3, change: 2 },
    diagrama: [
      { t: "node", x: 18, y: 78, w: 112, h: 56, role: "service", label: "Pedidos", sub: "tx local" },
      { t: "edge", x1: 130, y1: 106, x2: 174, y2: 106, arrow: true, msg: true },
      { t: "node", x: 174, y: 78, w: 112, h: 56, role: "service", label: "Pagos", sub: "tx local" },
      { t: "edge", x1: 286, y1: 106, x2: 330, y2: 106, arrow: true, msg: true },
      { t: "node", x: 330, y: 78, w: 112, h: 56, role: "service", label: "Envíos", sub: "tx local" },
      { t: "label", x: 230, y: 44, text: "cada paso confirma en su base · sin 2PC" },
      { t: "path", d: "M 376 134 C 336 184, 276 184, 236 138", msg: true },
      { t: "path", d: "M 220 134 C 180 184, 120 184, 80 138", msg: true },
      { t: "label", x: 228, y: 210, text: "compensaciones si un paso falla", cls: "tedge-label msg-label" },
    ],
  };

  F["space-based"] = {
    n: "19", id: "space-based", nombre: "Espacio compartido · Space-Based Architecture", prominencia: "nicho", vistaPrimaria: "topologia",
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
