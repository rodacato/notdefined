/* ==========================================================================
   data/fichas-eventos.js — Familia V · Asíncronas / eventos hacia afuera
   Webhooks · APIs de eventos (AsyncAPI / streams) · MQTT
   ========================================================================== */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.webhooks = {
    contratoTag: "Doc del payload (AsyncAPI emergente)",
    contrato: "Casi siempre documentación del payload y un secreto de firma para verificar el origen. Cada proveedor inventa su formato de evento; AsyncAPI empieza a estandarizarlos, pero no es la norma aún.",
    transporte: "HTTP · JSON (POST saliente del servidor a tu URL)",
    gana: [
      "Push sin canal abierto: te enteras al instante sin hacer polling.",
      "El servidor te llama a ti: barato, sin conexiones sostenidas de tu lado.",
      "Reintentos con backoff: si tu endpoint cae, el evento no se pierde de inmediato.",
      "El patrón universal para integrar SaaS de terceros (pagos, CI, mensajería)."
    ],
    paga: [
      "Necesitas un endpoint público y seguro, siempre disponible.",
      "Entrega al-menos-una-vez: los duplicados son tu problema (idempotencia obligatoria).",
      "Orden no garantizado y sin replay estándar si perdiste eventos.",
      "Verificación de firma, IP allowlist y protección contra reenvíos son tuyas."
    ],
    cuandoNo: [
      "El consumidor no puede exponer un endpoint público — usa polling o un stream con pull.",
      "Necesitas orden estricto, replay y garantías fuertes — eso es una API de eventos con broker.",
      "El evento es interno entre tus servicios — un broker de eventos encaja mejor."
    ],
    parientes: [
      { nombre: "Polling", desc: "La alternativa que webhooks evita. Ver webhooks vs polling.", link: "#/desambiguacion" },
      { nombre: "APIs de eventos", desc: "Cuando necesitas orden, replay y garantías fuertes.", link: "#/ficha/eventos" },
      { nombre: "SSE", desc: "Push en vivo pero hacia un cliente conectado, no a un endpoint tuyo.", link: "#/ficha/sse" }
    ],
    ratings: { contrato: 3, caching: 1, tooling: 4, adopcion: 5, overhead: 4, realtime: 5, evolucion: 3 },
    verdict: "La forma correcta de que un tercero te avise sin que estés preguntando cada 5 segundos. Trátalos como entrega no confiable: firma, idempotencia y una cola propia detrás. No es «una respuesta que te llega tarde».",
    sim: {
      titulo: "El servidor te llama a ti — con reintento",
      actors: [
        { id: "prv", label: "Proveedor", role: "third" },
        { id: "you", label: "Tu servidor", role: "server" }
      ],
      steps: [
        { from: "prv", to: "you", dir: "right", kind: "req", label: "POST /webhooks · payment.succeeded", bytes: "~380 B", narracion: "Pasa algo en el proveedor (un pago). Él hace un POST a tu URL: te llama a ti, sin que preguntes." },
        { from: "you", to: "prv", dir: "left", kind: "res", label: "200 OK", bytes: "~40 B", narracion: "Respondes 200 rápido para confirmar recepción. La regla de oro: encola y procesa aparte." },
        { from: "prv", to: "you", dir: "right", kind: "fail", label: "POST (reintento) · tu 5xx", bytes: "~380 B", narracion: "Si tu endpoint falla o tarda, el proveedor reintenta con backoff. El mismo evento otra vez." },
        { from: "you", to: "prv", dir: "left", kind: "res", label: "200 OK · idempotente", bytes: "~40 B", narracion: "Al reintento respondes 200 y, como ya lo procesaste, lo ignoras. Por eso la idempotencia no es opcional." }
      ]
    }
  };

  G.fichas.eventos = {
    contratoTag: "AsyncAPI + schema registry",
    contrato: "AsyncAPI describe canales, mensajes y bindings (el «OpenAPI de lo asíncrono»). Con un schema registry (Avro/Protobuf/JSON Schema) los esquemas se versionan y se valida compatibilidad entre productores y consumidores.",
    transporte: "Broker/stream (Kafka, NATS, Pulsar, colas) · binario o JSON",
    gana: [
      "Desacople total: el productor emite sin saber quién ni cuántos consumen.",
      "Replay e historial: un consumidor nuevo relee desde un offset pasado.",
      "Absorbe picos: el stream amortigua entre productores y consumidores lentos.",
      "Base de arquitecturas event-driven, event sourcing y CQRS."
    ],
    paga: [
      "Infra pesada: un broker que operar, monitorear y escalar.",
      "Consistencia eventual: razonar sobre el sistema es más difícil.",
      "Debugging distribuido: seguir un evento entre servicios cuesta.",
      "Evolución de esquemas y compatibilidad hacia atrás como disciplina constante."
    ],
    cuandoNo: [
      "Una integración simple con un tercero — un webhook es mil veces menos infra.",
      "Necesitas respuesta síncrona inmediata — esto es fire-and-forget.",
      "El volumen y el desacople no justifican operar un broker."
    ],
    parientes: [
      { nombre: "Webhooks", desc: "El push a terceros «ligero»; esto es su versión con garantías.", link: "#/ficha/webhooks" },
      { nombre: "MQTT", desc: "Pub/sub también, pero optimizado para IoT y dispositivos.", link: "#/ficha/mqtt" },
      { nombre: "gRPC", desc: "Cuando el s2s vuelve a ser petición-respuesta síncrona.", link: "#/ficha/grpc" }
    ],
    ratings: { contrato: 5, caching: 1, tooling: 5, adopcion: 3, overhead: 3, realtime: 6, evolucion: 5 },
    verdict: "La columna vertebral de los sistemas grandes que no quieren acoplarse a sí mismos. Es una decisión de arquitectura, no de endpoint: si dudas si lo necesitas, todavía no lo necesitas.",
    sim: {
      titulo: "Publicar a un stream, consumir y hacer replay",
      actors: [
        { id: "prd", label: "Productor", role: "server" },
        { id: "brk", label: "Broker", role: "broker" },
        { id: "cns", label: "Consumidor", role: "client" }
      ],
      steps: [
        { from: "prd", to: "brk", dir: "right", kind: "req", label: "publish · OrderCreated", bytes: "~120 B", narracion: "El productor emite un evento al stream. No sabe ni le importa quién lo va a leer." },
        { from: "brk", to: "cns", dir: "right", kind: "frame", label: "→ OrderCreated · offset 118", bytes: "~120 B", narracion: "El broker entrega a los consumidores suscritos. Productor y consumidor jamás se hablan directo." },
        { from: "cns", to: "brk", dir: "left", kind: "res", label: "commit offset 118", bytes: "~20 B", narracion: "El consumidor confirma su offset: 'hasta aquí ya procesé'. Así retoma tras un reinicio." },
        { from: "brk", to: "cns", dir: "right", kind: "frame", label: "replay desde offset 90", bytes: "~1 KB", narracion: "¿Consumidor nuevo o un bug a corregir? Relee desde un offset viejo: el stream guarda el historial." }
      ]
    }
  };

  G.fichas.mqtt = {
    contratoTag: "Convención de topics (sin schema std)",
    contrato: "MQTT define el transporte pub/sub y los niveles de QoS, pero no el formato del payload ni un esquema. El «contrato» es tu jerarquía de topics (envio/42/temp) y lo que acuerdes meter en el mensaje.",
    transporte: "TCP (o WebSocket) vía broker · payload binario libre",
    gana: [
      "Ligerísimo: header de 2 bytes. Hecho para batería, CPU chico y redes malas.",
      "Tres niveles de QoS: a-lo-más-una, al-menos-una, exactamente-una vez.",
      "Pub/sub con comodines en topics: desacople entre miles de dispositivos.",
      "Last Will & Testament: el broker avisa si un dispositivo se cae de golpe."
    ],
    paga: [
      "Necesitas operar un broker (Mosquitto, EMQX, HiveMQ).",
      "Sin esquema estándar: el formato del payload es acuerdo entre las partes.",
      "No es petición-respuesta: modelar RPC encima es incómodo.",
      "Seguridad (TLS, auth por dispositivo) hay que montarla con cuidado."
    ],
    cuandoNo: [
      "Es tráfico web normal entre servicios con buena red — usa gRPC o REST.",
      "Necesitas replay e historial largo con garantías — eso es un stream tipo Kafka.",
      "Quieres petición-respuesta síncrona — MQTT es pub/sub, no RPC."
    ],
    parientes: [
      { nombre: "APIs de eventos", desc: "Pub/sub también, pero para streams de datos a gran escala.", link: "#/ficha/eventos" },
      { nombre: "WebSockets", desc: "MQTT puede correr sobre WebSocket para llegar al browser.", link: "#/ficha/websockets" }
    ],
    ratings: { contrato: 3, caching: 1, tooling: 5, adopcion: 5, overhead: 1, realtime: 6, evolucion: 3 },
    verdict: "El rey indiscutido del IoT. Cuando cada byte y cada mAh cuentan —sensores, flotas, dispositivos con red intermitente— nada le compite. Fuera de ese mundo, rara vez es la respuesta.",
    sim: {
      titulo: "Publish / subscribe con QoS 1 vía broker",
      actors: [
        { id: "sen", label: "Sensor", role: "client" },
        { id: "brk", label: "Broker", role: "broker" },
        { id: "app", label: "App", role: "client" }
      ],
      steps: [
        { from: "app", to: "brk", dir: "right", kind: "req", label: "SUBSCRIBE envio/+/temp · QoS 1", bytes: "~18 B", narracion: "La app se suscribe a un topic con comodín (+). QoS 1 pide entrega 'al menos una vez'." },
        { from: "sen", to: "brk", dir: "right", kind: "frame", label: "PUBLISH envio/42/temp", bytes: "~12 B", narracion: "El sensor publica. El header MQTT son 2 bytes: pensado para batería y redes pobres." },
        { from: "brk", to: "app", dir: "right", kind: "frame", label: "→ envio/42/temp: 6.4°C", bytes: "~12 B", narracion: "El broker enruta a todos los suscritos al topic. Sensor y app nunca se hablan directo." },
        { from: "app", to: "brk", dir: "left", kind: "res", label: "PUBACK", bytes: "~4 B", narracion: "Con QoS 1 la app confirma con PUBACK. El broker reintenta hasta el ack: entrega garantizada." }
      ]
    }
  };

})(window.GUIA = window.GUIA || {});
