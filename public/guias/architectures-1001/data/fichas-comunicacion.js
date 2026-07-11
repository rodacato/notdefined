/* ============================================================================
   fichas-comunicacion.js — Fichas profundas · Familia 3 (Comunicación)
   Formato de datos: ver el encabezado de fichas-despliegue.js.
   Pendiente en esta familia: eda (13) trae solo la semilla de catálogo.
   ========================================================================== */
(function (G) {
  const F = (G.fichas = G.fichas || {});

  F["cliente-servidor"] = {
    n: "10", id: "cliente-servidor", nombre: "Cliente-Servidor", prominencia: "esencial", vistaPrimaria: "flujo",
    queEs: "Un cliente pide, un servidor responde: petición-respuesta síncrona sobre un contrato conocido.",
    fuerza: "El contrato más directo entre dos partes: pido y me contestas ahora.",
    gana: "Simplicidad, respuesta inmediata y fallas fáciles de rastrear: el error está en la llamada.",
    paga: "Acoplamiento temporal: si el servidor no está, el cliente espera o falla; cada consumidor nuevo suma carga directa al servicio.",
    cuandoNo: "Cuando muchos consumidores dependen del mismo servicio síncrono y sus caídas se propagan en cadena: ahí conviene desacoplar con mensajería.",
    parientes: "La base de casi todo: REST, gRPC y GraphQL son variantes del mismo contrato. Pub-sub es su opuesto — renuncia a la respuesta inmediata para desacoplar.",
    ratings: { indep: 1, ops: 1, lat: 4, team: 1, cons: 4, scale: 2, change: 2 },
    diagrama: [
      { t: "node", x: 20, y: 106, w: 100, h: 64, role: "actor", label: "Cliente" },
      { t: "node", x: 186, y: 106, w: 128, h: 64, role: "service", label: "Servidor" },
      { t: "node", x: 372, y: 112, w: 76, h: 52, role: "store", label: "DB" },
      { t: "edge", x1: 120, y1: 124, x2: 186, y2: 124, arrow: true },
      { t: "label", x: 153, y: 112, text: "request" },
      { t: "edge", x1: 186, y1: 152, x2: 120, y2: 152, arrow: true },
      { t: "label", x: 153, y: 166, text: "response" },
      { t: "edge", x1: 314, y1: 138, x2: 372, y2: 138, arrow: true },
    ],
  };

  F["api-gateway"] = {
    n: "11", id: "api-gateway", nombre: "API Gateway · BFF", prominencia: "situacional", vistaPrimaria: "flujo",
    queEs: "Una puerta única frente a muchos servicios: enruta, autentica y adapta las respuestas por tipo de cliente (BFF).",
    fuerza: "Que los clientes no conozcan la topología interna ni cada servicio repita auth, rate limiting y agregación.",
    gana: "Cross-cutting concerns (auth, límites, caché) resueltos una sola vez, y payloads a la medida de cada cliente.",
    paga: "Un hop extra de latencia y un punto único que concentra riesgo; si le metes lógica de negocio, se vuelve un mini-monolito frente a todo.",
    cuandoNo: "Un cliente y dos servicios: el gateway es una pieza más que operar sin nada que agregue.",
    parientes: "El BFF es su variante por tipo de cliente (uno para web, otro para móvil). Casi obligado con microservicios; irrelevante frente a un monolito.",
    ratings: { indep: 3, ops: 2, lat: 2, team: 3, cons: 2, scale: 3, change: 3 },
    diagrama: [
      { t: "node", x: 14, y: 56, w: 80, h: 46, role: "actor", label: "Web" },
      { t: "node", x: 14, y: 170, w: 80, h: 46, role: "actor", label: "Móvil" },
      { t: "node", x: 158, y: 108, w: 134, h: 62, role: "gateway", star: true, label: "API Gateway", sub: "auth · rate limit" },
      { t: "edge", x1: 94, y1: 82, x2: 158, y2: 124, arrow: true },
      { t: "edge", x1: 94, y1: 190, x2: 158, y2: 154, arrow: true },
      { t: "node", x: 344, y: 36, w: 102, h: 46, role: "service", label: "Pedidos" },
      { t: "node", x: 344, y: 116, w: 102, h: 46, role: "service", label: "Pagos" },
      { t: "node", x: 344, y: 196, w: 102, h: 46, role: "service", label: "Perfil" },
      { t: "edge", x1: 292, y1: 122, x2: 344, y2: 62, arrow: true },
      { t: "edge", x1: 292, y1: 139, x2: 344, y2: 139, arrow: true },
      { t: "edge", x1: 292, y1: 156, x2: 344, y2: 216, arrow: true },
    ],
  };

  F["pub-sub"] = {
    n: "12", id: "pub-sub", nombre: "Publicación-Suscripción", prominencia: "situacional", vistaPrimaria: "topologia",
    queEs: "El emisor publica mensajes a un tópico; el broker los entrega a quien esté suscrito. Emisor y receptores no se conocen.",
    fuerza: "Desacoplar en identidad y en tiempo: publicar sin saber quién escucha ni si está disponible ahora.",
    gana: "Agregar consumidores sin tocar al emisor; el broker amortigua los picos.",
    paga: "Sin respuesta inmediata, entrega at-least-once que exige consumidores idempotentes, y flujos que ya no se leen de corrido.",
    cuandoNo: "Cuando el emisor necesita la respuesta para continuar o el orden global es requisito: ahí el desacople estorba.",
    parientes: "Es el mecanismo de transporte; EDA es el estilo de arquitectura que se construye encima. Pipes & filters también encadena etapas, pero en línea con orden fijo — aquí la topología es un abanico.",
    ratings: { indep: 3, ops: 3, lat: 2, team: 3, cons: 1, scale: 4, change: 3 },
    diagrama: [
      { t: "node", x: 14, y: 112, w: 112, h: 56, role: "service", label: "Publicador" },
      { t: "edge", x1: 126, y1: 140, x2: 174, y2: 140, arrow: true, msg: true },
      { t: "node", x: 174, y: 114, w: 118, h: 52, role: "msg", star: true, label: "Tópico", sub: "broker" },
      { t: "node", x: 336, y: 34, w: 110, h: 48, role: "service", label: "Suscriptor A" },
      { t: "node", x: 336, y: 116, w: 110, h: 48, role: "service", label: "Suscriptor B" },
      { t: "node", x: 336, y: 198, w: 110, h: 48, role: "service", label: "Suscriptor C" },
      { t: "edge", x1: 292, y1: 126, x2: 336, y2: 60, arrow: true, msg: true },
      { t: "edge", x1: 292, y1: 140, x2: 336, y2: 140, arrow: true, msg: true },
      { t: "edge", x1: 292, y1: 154, x2: 336, y2: 220, arrow: true, msg: true },
      { t: "label", x: 118, y: 196, text: "no sabe quién escucha" },
    ],
  };

  F["pipes-filters"] = {
    n: "14", id: "pipes-filters", nombre: "Tubería y filtros", prominencia: "situacional", vistaPrimaria: "flujo",
    queEs: "Un flujo de datos que atraviesa filtros independientes conectados en tubería: cada filtro transforma y pasa el resultado al siguiente.",
    fuerza: "Componer un procesamiento complejo con etapas simples, cada una con una sola responsabilidad.",
    gana: "Filtros reutilizables y testeables por separado; cambiar el pipeline es reordenar piezas.",
    paga: "Latencia por cada etapa extra y un mal encaje cuando los pasos necesitan compartir estado o conversar entre sí.",
    cuandoNo: "Flujos interactivos con ida y vuelta de estado entre pasos: la tubería es unidireccional por diseño.",
    parientes: "El pipe de Unix es el ejemplo canónico; ETL y stream processing son sus versiones a escala. A diferencia de pub-sub, aquí el orden de etapas es fijo y lineal, no un abanico de suscriptores.",
    ratings: { indep: 2, ops: 2, lat: 2, team: 2, cons: 2, scale: 3, change: 4 },
    diagrama: [
      { t: "node", x: 6, y: 114, w: 76, h: 52, role: "actor", label: "Fuente" },
      { t: "edge", x1: 82, y1: 140, x2: 100, y2: 140, arrow: true },
      { t: "node", x: 100, y: 114, w: 80, h: 52, role: "service", label: "Filtro", sub: "parsea" },
      { t: "edge", x1: 180, y1: 140, x2: 198, y2: 140, arrow: true },
      { t: "node", x: 198, y: 114, w: 80, h: 52, role: "service", label: "Filtro", sub: "transforma" },
      { t: "edge", x1: 278, y1: 140, x2: 296, y2: 140, arrow: true },
      { t: "node", x: 296, y: 114, w: 80, h: 52, role: "service", label: "Filtro", sub: "agrega" },
      { t: "edge", x1: 376, y1: 140, x2: 392, y2: 140, arrow: true },
      { t: "node", x: 392, y: 118, w: 62, h: 44, role: "store", label: "Salida" },
      { t: "label", x: 230, y: 206, text: "el dato fluye en un solo sentido" },
    ],
  };
})(window.GUIA = window.GUIA || {});
