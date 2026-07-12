/* ============================================================
   data/fichas-gestionada.js — familia "entrega gestionada moderna".
   ============================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas["nats-jetstream"] = {
    que: "La capa de persistencia de NATS: streams que capturan mensajes de subjects y consumers (durables o efímeros) que los leen con ack. Le da a NATS lo que el core no tiene — durabilidad, replay y at-least-once.",
    semantica: "At-least-once con ack explícito y reintentos; opción de exactly-once dedup por message id dentro de una ventana. Como siempre, end-to-end real = idempotencia en tu consumidor. Retención por límites (tiempo, tamaño, número).",
    orden: "Orden por stream/consumer; con particionado por subject repartes carga a costa del orden global — el mismo trade-off de todos los logs.",
    gana: [
      "Durabilidad y replay sin salir del ecosistema NATS ligero.",
      "Consumers durables, pull/push, dedup por id.",
      "Mucho menos peso operativo que un clúster Kafka."
    ],
    paga: [
      "Ecosistema y tooling menores que Kafka.",
      "Menos madurez en integraciones (connectors, streaming SQL).",
      "Otra pieza con estado que respaldar y vigilar."
    ],
    cuandoNo: "Si tu casa ya es Kafka y necesitas su ecosistema (Connect, ksqlDB, particionado masivo), JetStream compite en desventaja. Y si solo necesitas efímero, el core basta.",
    parientes: [
      { label: "NATS core", note: "la base efímera sobre la que corre JetStream." },
      { label: "Kafka", note: "el competidor grande en logs durables." },
      { label: "Google Pub/Sub", note: "alternativa gestionada si no quieres operar nada." }
    ],
    sim: null
  };

  G.fichas["google-pubsub"] = {
    que: "El pub/sub global de Google Cloud, totalmente administrado: publicas a un topic y cada subscription entrega a sus consumidores. Escala sola a millones de mensajes sin que operes servidores.",
    semantica: "At-least-once por default (espera duplicados; deduplica tú). Ofrece exactly-once delivery en subscriptions pull dentro de una región, y ordering keys opcionales. Retención configurable permite un replay acotado por seek.",
    orden: "Sin orden por default; con ordering key, orden por esa key (como partición). Sin key, best-effort. El seek por tiempo/snapshot da un replay limitado, no el log infinito de Kafka.",
    gana: [
      "Cero operación y escala elástica global.",
      "Fan-out por múltiples subscriptions sobre un topic.",
      "Dead-letter, retry policy y exactly-once (pull) integrados."
    ],
    paga: [
      "Te casa con GCP; costos por volumen.",
      "Replay más limitado que un log de retención larga.",
      "Menos control fino que operar tu propio broker."
    ],
    cuandoNo: "Si necesitas retención larga y replay arbitrario del pasado como activo central, un log dedicado encaja mejor. Y fuera de GCP, no tiene sentido.",
    parientes: [
      { label: "Kafka / Kinesis", note: "logs con replay más profundo si el pasado es el producto." },
      { label: "SQS + SNS", note: "el análogo en AWS para cola + fan-out." },
      { label: "NATS JetStream", note: "alternativa autogestionada con durabilidad." }
    ],
    sim: null
  };

  G.fichas["mqtt"] = {
    que: "Un protocolo (no un producto) de pub/sub pensado para dispositivos: header minúsculo, tópicos jerárquicos y tres niveles de QoS. Corre sobre un broker (Mosquitto, EMQX, HiveMQ) y es el estándar de facto en IoT.",
    semantica: "La eliges por tópico con QoS: 0 = at-most-once (dispara y olvida), 1 = at-least-once (duplicados posibles), 2 = exactly-once (handshake de 4 pasos, más caro). Las sesiones persistentes guardan mensajes para un cliente desconectado.",
    orden: "Orden por tópico en QoS 1/2 dentro de una sesión; con red intermitente y reconexiones, el orden estricto no es algo en lo que apoyarte. Retained message guarda solo el último valor por tópico, no un historial.",
    gana: [
      "Diseñado para redes malas: keep-alive, last-will, sesiones persistentes.",
      "QoS por tópico: pagas durabilidad solo donde importa.",
      "Footprint ínfimo — corre en un microcontrolador."
    ],
    paga: [
      "No es un log: sin replay ni auditoría del histórico.",
      "QoS 2 es caro; el orden bajo red mala es frágil.",
      "Necesitas un broker robusto para muchos dispositivos."
    ],
    cuandoNo: "Para eventos entre servicios de backend, MQTT no aporta sobre un broker o log normal. Y si necesitas historial/replay de la telemetría, MQTT solo mueve; el almacenamiento lo pones tú detrás.",
    scar: {
      tag: "Cicatriz de producción",
      text: "En el iotHub de Encontrack la red de los equipos era pésima. QoS 0 perdía posiciones y QoS 2 saturaba el enlace. Lo que salvó el proyecto: tratar el QoS como decisión por-tópico (no global) y apoyarse en sesiones persistentes para las reconexiones."
    },
    parientes: [
      { label: "NATS / Redis pub/sub", note: "pub/sub ligero, pero para servicios, no dispositivos." },
      { label: "Kafka", note: "a menudo el sink: MQTT en el borde, Kafka guarda el histórico." },
      { label: "Google Pub/Sub", note: "puente típico de telemetría a la nube." }
    ],
    sim: null
  };

})(window.GUIA = window.GUIA || {});
