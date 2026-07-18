/* ============================================================================
   fichas-despliegue.js — Fichas profundas · Familia 1 (Despliegue)
   ----------------------------------------------------------------------------
   Solo CONTENIDO. Cada ficha profunda expande un estilo del catálogo con:
   queEs · fuerza · gana/paga · cuándoNo · parientes · ratings (ejes fijos) y,
   opcional, un `diagrama` de topología como lista de primitivas.

   Primitivas del diagrama (viewBox 0 0 460 280, coords fijas):
     { t:"node",  x,y,w,h, role, label, sub?, dashed?, star?, ghost? }
     { t:"edge",  x1,y1,x2,y2, arrow?, msg? }   // arrow:true dibuja la flecha
     { t:"path",  d, msg? }                       // curva/línea con flecha
     { t:"frame", x,y,w,h, label?, variant? }     // marco de contexto
     { t:"label", x,y, text, cls? }               // etiqueta suelta
   role ∈ actor · gateway · service · store · msg   (ver contrato de color).

   Para agregar una ficha nueva: copia un bloque de G.fichas["id"] y edítalo.
   ========================================================================== */
(function (G) {
  const F = (G.fichas = G.fichas || {});

  F["monolito"] = {
    n: "01", id: "monolito", nombre: "Monolito", prominencia: "esencial", vistaPrimaria: "limites",
    queEs: "Toda la app en un solo desplegable / proceso.",
    fuerza: "El punto de partida natural: simplicidad para desarrollar, desplegar y depurar.",
    gana: "Deploy simple, transacciones ACID y debugging local.",
    paga: "Acoplamiento si crece sin disciplina; escala como un solo bloque.",
    cuandoNo: "Cuando partes distintas deben escalar o desplegarse por separado y el equipo es grande.",
    parientes: "Antes de saltar a microservicios, el upgrade correcto suele ser el monolito modular.",
    ratings: { indep: 0, ops: 1, lat: 4, team: 1, cons: 4, scale: 1, change: 3 },
    diagrama: [
      { t: "node", x: 10, y: 112, w: 58, h: 46, role: "actor", label: "Cliente" },
      { t: "edge", x1: 68, y1: 135, x2: 104, y2: 135, arrow: true },
      { t: "frame", x: 104, y: 36, w: 342, h: 208, label: "Aplicación · 1 desplegable" },
      { t: "node", x: 126, y: 78, w: 156, h: 38, role: "service", label: "Interfaz" },
      { t: "node", x: 126, y: 126, w: 156, h: 38, role: "service", label: "Lógica de negocio" },
      { t: "node", x: 126, y: 174, w: 156, h: 38, role: "service", label: "Acceso a datos" },
      { t: "edge", x1: 204, y1: 116, x2: 204, y2: 126 },
      { t: "edge", x1: 204, y1: 164, x2: 204, y2: 174 },
      { t: "node", x: 314, y: 122, w: 112, h: 70, role: "store", label: "DB", sub: "un esquema" },
      { t: "edge", x1: 282, y1: 193, x2: 314, y2: 168, arrow: true },
    ],
  };

  F["monolito-modular"] = {
    n: "02", id: "monolito-modular", nombre: "Monolito modular", prominencia: "esencial", vistaPrimaria: "limites",
    queEs: "Un monolito con módulos de límites internos fuertes (casi contextos acotados), un solo desplegable.",
    fuerza: "Ganar modularidad y una futura extracción sin pagar el costo operativo de microservicios.",
    gana: "Modularidad, cohesión y una ruta de extracción fácil; sigue siendo un solo deploy.",
    paga: "Exige disciplina para mantener los límites; sin ella, recae en el monolito enredado.",
    cuandoNo: "Rara vez sobra: es el «sweet spot» moderno y la recomendación por defecto antes de distribuir.",
    parientes: "Paso intermedio natural del Strangler Fig.",
    ratings: { indep: 1, ops: 1, lat: 4, team: 2, cons: 4, scale: 1, change: 4 },
    diagrama: [
      { t: "node", x: 10, y: 116, w: 54, h: 44, role: "actor", label: "Cliente" },
      { t: "edge", x1: 64, y1: 138, x2: 92, y2: 138, arrow: true },
      { t: "frame", x: 92, y: 34, w: 354, h: 212, label: "Un solo desplegable" },
      { t: "node", x: 110, y: 72, w: 98, h: 56, role: "service", dashed: true, label: "Pedidos" },
      { t: "node", x: 224, y: 72, w: 98, h: 56, role: "service", dashed: true, label: "Pagos" },
      { t: "node", x: 338, y: 72, w: 96, h: 56, role: "service", dashed: true, label: "Envíos" },
      { t: "edge", x1: 208, y1: 100, x2: 224, y2: 100, arrow: true },
      { t: "edge", x1: 322, y1: 100, x2: 338, y2: 100, arrow: true },
      { t: "label", x: 216, y: 90, text: "iface" },
      { t: "label", x: 330, y: 90, text: "iface" },
      { t: "node", x: 196, y: 168, w: 150, h: 52, role: "store", label: "DB compartida" },
      { t: "edge", x1: 159, y1: 128, x2: 230, y2: 168 },
      { t: "edge", x1: 273, y1: 128, x2: 271, y2: 168 },
      { t: "edge", x1: 386, y1: 128, x2: 312, y2: 168 },
    ],
  };

  F["microservicios"] = {
    n: "03", id: "microservicios", nombre: "Microservicios", prominencia: "situacional", vistaPrimaria: "topologia",
    queEs: "El sistema descompuesto en servicios pequeños, desplegables de forma independiente, cada uno dueño de sus datos.",
    fuerza: "Escalar equipos y partes del sistema de forma independiente.",
    gana: "Autonomía de equipos; deploy y escala independientes.",
    paga: "Complejidad operativa enorme: red, observabilidad, consistencia eventual, transacciones distribuidas.",
    cuandoNo: "Equipo chico o dominio inmaduro → te ganas un «monolito distribuido», lo peor de ambos mundos.",
    parientes: "El anti-patrón estrella del sobre-alcance. Ver Familia 4 para las piezas que lo hacen viable.",
    ratings: { indep: 4, ops: 4, lat: 2, team: 4, cons: 1, scale: 4, change: 3 },
    diagrama: [
      { t: "node", x: 8, y: 18, w: 56, h: 44, role: "actor", label: "Cliente" },
      { t: "node", x: 170, y: 16, w: 120, h: 46, role: "gateway", star: true, label: "API Gateway" },
      { t: "edge", x1: 64, y1: 40, x2: 170, y2: 40, arrow: true },
      { t: "node", x: 36, y: 116, w: 108, h: 46, role: "service", label: "Pedidos" },
      { t: "node", x: 176, y: 116, w: 108, h: 46, role: "service", label: "Pagos" },
      { t: "node", x: 316, y: 116, w: 108, h: 46, role: "service", label: "Envíos" },
      { t: "edge", x1: 210, y1: 62, x2: 110, y2: 116, arrow: true },
      { t: "edge", x1: 230, y1: 62, x2: 230, y2: 116, arrow: true },
      { t: "edge", x1: 250, y1: 62, x2: 350, y2: 116, arrow: true },
      { t: "node", x: 50, y: 214, w: 80, h: 42, role: "store", label: "DB" },
      { t: "node", x: 190, y: 214, w: 80, h: 42, role: "store", label: "DB" },
      { t: "node", x: 330, y: 214, w: 80, h: 42, role: "store", label: "DB" },
      { t: "edge", x1: 90, y1: 162, x2: 90, y2: 214 },
      { t: "edge", x1: 230, y1: 162, x2: 230, y2: 214 },
      { t: "edge", x1: 370, y1: 162, x2: 370, y2: 214 },
      { t: "path", d: "M 144 150 C 210 196, 250 196, 316 150", msg: true },
      { t: "label", x: 230, y: 200, text: "eventos", cls: "tedge-label msg-label" },
    ],
  };

  F["serverless"] = {
    n: "04", id: "serverless", nombre: "Serverless · FaaS", prominencia: "situacional", vistaPrimaria: "flujo",
    queEs: "Funciones efímeras gestionadas por el proveedor; sin servidores que administres.",
    fuerza: "Escalar a cero, pagar por uso y operaciones mínimas.",
    gana: "Escala automática, cero gestión de infra y costo por uso.",
    paga: "Cold starts, vendor lock-in, límites de ejecución y debugging distribuido.",
    cuandoNo: "Cargas constantes de alto volumen (sale caro) o latencia crítica.",
    parientes: "Su cancha: cargas event-driven y glue code.",
    ratings: { indep: 4, ops: 2, lat: 2, team: 3, cons: 1, scale: 4, change: 3 },
    diagrama: [
      { t: "node", x: 12, y: 104, w: 96, h: 60, role: "actor", label: "Evento", sub: "HTTP · cola" },
      { t: "edge", x1: 108, y1: 134, x2: 150, y2: 134, arrow: true },
      { t: "node", x: 162, y: 92, w: 116, h: 60, role: "service", ghost: true },
      { t: "node", x: 156, y: 98, w: 116, h: 60, role: "service", ghost: true },
      { t: "node", x: 150, y: 104, w: 116, h: 60, role: "service", star: true, label: "Función λ", sub: "escala 0..N" },
      { t: "edge", x1: 266, y1: 134, x2: 332, y2: 134, arrow: true },
      { t: "node", x: 332, y: 104, w: 114, h: 60, role: "store", label: "DB / servicio" },
      { t: "label", x: 208, y: 186, text: "instancias efímeras" },
    ],
  };
})(window.GUIA = window.GUIA || {});
