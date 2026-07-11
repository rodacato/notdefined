/* ============================================================================
   fichas-codigo.js — Fichas profundas · Familia 5 (Organización del código)
   Formato de datos: ver el encabezado de fichas-despliegue.js.
   ========================================================================== */
(function (G) {
  const F = (G.fichas = G.fichas || {});

  F["monorepo"] = {
    n: "20", id: "monorepo", nombre: "Monorepo", prominencia: "esencial", vistaPrimaria: "limites",
    queEs: "Todo el código del sistema (o de la organización) en un solo repositorio, con módulos y ownership internos.",
    fuerza: "Un cambio atómico que cruza módulos: un PR toca la lib compartida y a todos sus consumidores a la vez.",
    gana: "Refactors globales atómicos, una sola versión de cada dependencia y código compartido sin publicar paquetes.",
    paga: "El build y el CI crecen con el repo: sin tooling incremental (Nx, Turborepo, Bazel) todo se vuelve lento, y el ownership exige CODEOWNERS y disciplina.",
    cuandoNo: "Equipos que necesitan ciclos de release y permisos de acceso realmente separados: un repo compartido los acopla en calendario y en tooling.",
    parientes: "Ortogonal al runtime: hay monorepo con microservicios (estilo Google) y polyrepo con monolito — ver «los dos ejes» en el índice. La pregunta del repo es sobre el código, no sobre el deploy.",
    ratings: { indep: 1, ops: 3, lat: 3, team: 2, cons: 4, scale: 2, change: 4 },
    diagrama: [
      { t: "frame", x: 36, y: 26, w: 388, h: 214, label: "Un repositorio" },
      { t: "node", x: 64, y: 66, w: 104, h: 48, role: "service", label: "App web" },
      { t: "node", x: 188, y: 66, w: 104, h: 48, role: "service", label: "API" },
      { t: "node", x: 312, y: 66, w: 88, h: 48, role: "service", label: "Infra" },
      { t: "node", x: 140, y: 158, w: 164, h: 48, role: "service", star: true, label: "Lib compartida" },
      { t: "edge", x1: 116, y1: 114, x2: 190, y2: 158, arrow: true },
      { t: "edge", x1: 240, y1: 114, x2: 230, y2: 158, arrow: true },
      { t: "edge", x1: 356, y1: 114, x2: 280, y2: 158, arrow: true },
      { t: "label", x: 230, y: 260, text: "un PR atómico puede cruzar todos los módulos" },
    ],
  };

  F["polyrepo"] = {
    n: "21", id: "polyrepo", nombre: "Polyrepo", prominencia: "situacional", vistaPrimaria: "limites",
    queEs: "Cada componente o servicio en su propio repositorio, con versionado y release independientes.",
    fuerza: "Equipos que liberan en su propio calendario, con permisos y CI propios.",
    gana: "Autonomía real por equipo: repos chicos, builds rápidos y accesos acotados.",
    paga: "El cambio que cruza repos se vuelve proyecto: N PRs coordinados, versionar la lib compartida y esperar a que todos actualicen — el version skew es el estado normal.",
    cuandoNo: "Cuando el código compartido cambia seguido y todos deben moverse juntos: el costo de coordinación se come la autonomía.",
    parientes: "El default mental de microservicios, pero es otro eje (ver «los dos ejes» en el índice). Su pieza clave es el registro de paquetes: sin releases versionados de lo compartido, es un monorepo roto en pedazos.",
    ratings: { indep: 4, ops: 2, lat: 3, team: 4, cons: 1, scale: 3, change: 2 },
    diagrama: [
      { t: "frame", x: 14, y: 26, w: 132, h: 128, label: "repo A" },
      { t: "node", x: 34, y: 66, w: 92, h: 52, role: "service", label: "Servicio A", sub: "su release" },
      { t: "frame", x: 164, y: 26, w: 132, h: 128, label: "repo B" },
      { t: "node", x: 184, y: 66, w: 92, h: 52, role: "service", label: "Servicio B", sub: "su release" },
      { t: "frame", x: 314, y: 26, w: 132, h: 128, label: "repo C" },
      { t: "node", x: 334, y: 66, w: 92, h: 52, role: "service", label: "Lib común", sub: "v0.9.2" },
      { t: "node", x: 150, y: 204, w: 160, h: 48, role: "store", label: "Registro de paquetes" },
      { t: "edge", x1: 380, y1: 118, x2: 296, y2: 212, arrow: true, msg: true },
      { t: "label", x: 360, y: 172, text: "publica", cls: "tedge-label msg-label" },
      { t: "edge", x1: 164, y1: 212, x2: 82, y2: 118, arrow: true, msg: true },
      { t: "label", x: 98, y: 172, text: "consume", cls: "tedge-label msg-label" },
      { t: "edge", x1: 222, y1: 204, x2: 228, y2: 118, arrow: true, msg: true },
    ],
  };
})(window.GUIA = window.GUIA || {});
