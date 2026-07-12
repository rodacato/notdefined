/* ============================================================
   data/fichas-pubsub.js — familia "pub/sub efímero".
   ============================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas["redis-pubsub"] = {
    que: "El comando PUBLISH/SUBSCRIBE de Redis: publicas a un canal y llega a quien esté suscrito en ese instante. No hay cola, no hay historial, no hay ack. Fire-and-forget en su forma más pura.",
    semantica: "At-most-once y punto: si el suscriptor no estaba conectado, el mensaje no existió para él. Cero durabilidad, cero reintentos. No hay 'subirle' la garantía — para eso existe Redis Streams, que es otra cosa.",
    orden: "Orden de entrega por canal en el momento, pero irrelevante: sin persistencia el orden no es una garantía en la que puedas apoyar lógica.",
    gana: [
      "Latencia mínima absoluta: no toca disco ni estructura.",
      "Trivial de usar: dos comandos y ya.",
      "Ideal para señales vivas: presencia, invalidación de caché, ticks."
    ],
    paga: [
      "Cero durabilidad: un suscriptor caído pierde todo lo de ese rato.",
      "Sin ack ni reintentos ni replay.",
      "No es un bus de eventos confiable, aunque se le parezca."
    ],
    cuandoNo: "Cualquier cosa que no puedas perder. Si el mensaje importa aunque el receptor esté caído, necesitas durabilidad: Streams, una cola, o un stream durable. Pub/sub es para lo que solo vale ahora.",
    parientes: [
      { label: "NATS core", note: "el mismo modelo efímero, pero dedicado y con subjects." },
      { label: "Redis Streams", note: "la versión durable con historial — no es lo mismo." },
      { label: "Redis colas", note: "tercer uso del mismo binario: cola de trabajo, no señal." }
    ],
    sim: null
  };

  G.fichas["nats-core"] = {
    que: "Un sistema de mensajería ligerísimo con subjects jerárquicos (orders.mx.*), pub/sub y request-reply nativo. El core es efímero por diseño: entrega a quien escucha ahora y sigue.",
    semantica: "At-most-once en el core: sin suscriptor, no hay entrega. Es una decisión de diseño, no una carencia — cuando quieres durabilidad activas JetStream, que es una capa distinta encima del mismo servidor.",
    orden: "Orden por subject en la conexión, pero al ser efímero no es garantía de negocio. Para orden con durabilidad, JetStream.",
    gana: [
      "Rendimiento y latencia excelentes, footprint minúsculo.",
      "Subjects con comodines y request-reply para RPC ligero.",
      "Un solo binario, malla (clustering) sencilla."
    ],
    paga: [
      "Sin durabilidad ni replay en el core.",
      "Menos ecosistema/tooling que Kafka o los gestionados.",
      "Si quieres garantías, ya estás usando JetStream (otra ficha)."
    ],
    cuandoNo: "Cuando el mensaje debe sobrevivir a un consumidor caído: eso es JetStream, no core. Y si tu organización ya vive en Kafka para eventos durables, meter NATS solo para efímero puede no valer la pieza extra.",
    parientes: [
      { label: "NATS JetStream", note: "la capa durable sobre el mismo servidor NATS." },
      { label: "Redis pub/sub", note: "misma semántica efímera, distinto ecosistema." },
      { label: "MQTT", note: "también pub/sub ligero, pero pensado para dispositivos." }
    ],
    sim: null
  };

})(window.GUIA = window.GUIA || {});
