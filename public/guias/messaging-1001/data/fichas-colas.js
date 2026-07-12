/* ============================================================
   data/fichas-colas.js — prosa de las fichas de la familia
   "colas de trabajo". Se cuelga de G.fichas[id]; el folio y la
   identidad viven en data/catalogo.js.
   ============================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas["rabbitmq"] = {
    que: "Un broker de mensajes AMQP: los productores publican a un exchange, que rutea a colas por reglas (routing keys, topics, fanout). El consumidor lee, procesa y manda ack; sin ack, el mensaje se re-entrega.",
    semantica: "Por default es at-least-once: el mensaje se re-entrega hasta que llega un ack. Subir a algo parecido a exactly-once cuesta idempotencia en tu consumidor + publisher confirms + colas quorum durables — RabbitMQ no te lo regala.",
    orden: "Orden FIFO por cola, y solo mientras haya un único consumidor sin requeue. Con varios consumidores (prefetch > 1) o reintentos, el orden se rompe. No existe orden global entre colas.",
    gana: [
      "Ruteo riquísimo: fanout, topic, headers, RPC con request-reply.",
      "Ack por mensaje y control fino de reintentos y DLQ nativa.",
      "Prioridades, TTL y colas quorum para durabilidad seria."
    ],
    paga: [
      "Throughput menor que un log; empuja mensajes, no los retiene.",
      "Sin replay: consumido es borrado, no hay rebobinar.",
      "Operarlo bien (clústeres, quorum, flow control) tiene curva."
    ],
    cuandoNo: "Si necesitas releer el pasado o que varios equipos consuman el mismo flujo a su ritmo, RabbitMQ es la herramienta equivocada — eso es un log. Y si solo quieres jobs con la infra que ya tienes, una cola sobre tu DB es menos broker que mantener.",
    scar: {
      tag: "Cicatriz de producción",
      text: "Lo puse bajo el order-book de un exchange (michelada). Cuando el consumo se atoraba, la cola crecía en silencio y las órdenes de dinero llegaban tarde. Dos lecciones: RabbitMQ te da orden por cola, nunca global; y sin backpressure explícito el broker se llena sin avisar."
    },
    parientes: [
      { label: "SQS", note: "misma familia cola, pero gestionada y sin ruteo tan rico." },
      { label: "Kafka", note: "confusión clásica: Kafka es log, no cola — no compiten en lo mismo." },
      { label: "NATS JetStream", note: "alternativa moderna con durabilidad y menos peso operativo." }
    ],
    sim: "el-duplicado"
  };

  G.fichas["sqs"] = {
    que: "La cola de AWS como servicio administrado: no operas nada. Viene en dos sabores — Standard (throughput casi ilimitado) y FIFO (orden y deduplicación por message group).",
    semantica: "Standard es at-least-once con orden best-effort: espera duplicados y ordénalos en tu consumidor. FIFO da exactly-once processing y orden estricto por grupo, a cambio de throughput limitado (300 msg/s por grupo sin batch, ~3000 con batch — evaluado jul 2026).",
    orden: "Standard: sin garantía de orden. FIFO: orden estricto por message group id — grupos distintos avanzan en paralelo, dentro de un grupo es una fila. Elegir bien el group id es todo el diseño.",
    gana: [
      "Cero operación: sin clústeres, sin parches, escala sola.",
      "FIFO resuelve orden + dedup por grupo sin que escribas plomería.",
      "DLQ, visibility timeout y reintentos integrados."
    ],
    paga: [
      "FIFO topa en throughput; Standard te obliga a idempotencia.",
      "Fan-out real necesita SNS enfrente (SQS sola es punto a punto).",
      "Te casa con AWS; sin replay del pasado."
    ],
    cuandoNo: "Si tu carga es un flujo que muchos equipos deben re-consumir o auditar, SQS se queda corta — eso pide un log (Kafka/Kinesis). Y si no vives en AWS, montar SQS no tiene sentido: usa la cola de tu stack.",
    parientes: [
      { label: "RabbitMQ", note: "el equivalente autogestionado con ruteo más rico." },
      { label: "SNS", note: "el compañero para fan-out; SQS sola no reparte a varios." },
      { label: "Colas sobre DB", note: "la alternativa cuando no quieres una nube encima." }
    ],
    sim: null
  };

  G.fichas["redis-colas"] = {
    que: "Usar Redis como backend de una cola de jobs mediante una librería (Sidekiq en Ruby, BullMQ en Node, RQ en Python). La cola son estructuras de Redis (listas, sorted sets, streams) manejadas por la lib.",
    semantica: "At-least-once en las libs serias: el job se marca en proceso y vuelve si el worker muere. La durabilidad es la de tu Redis — si Redis no persiste (o pierde el último fsync), pierdes jobs. Idempotencia sigue siendo tu trabajo.",
    orden: "Best-effort. Con un solo worker y una lista es FIFO; con varios workers y reintentos, el orden deja de estar garantizado. No es la herramienta para orden estricto.",
    gana: [
      "Latencia mínima y throughput altísimo: es memoria.",
      "Si ya tienes Redis, es cero infra nueva y arranca hoy.",
      "Ecosistema maduro: retries, scheduling, dashboards (Sidekiq/BullMQ)."
    ],
    paga: [
      "Durabilidad atada a la config de persistencia de Redis.",
      "Memoria como límite: una cola que crece te tumba el Redis.",
      "Sin replay ni auditoría; es una cola, no un log."
    ],
    cuandoNo: "Si perder un job es inaceptable y no puedes garantizar la persistencia de Redis, sube a una cola transaccional (DB) o a un broker durable. Y no lo uses como bus de eventos entre equipos: no es pub/sub durable.",
    parientes: [
      { label: "Colas sobre DB", note: "hermana más lenta pero transaccional con tu dominio." },
      { label: "Redis Streams", note: "el mismo binario, pero log con consumer groups — otra cosa." },
      { label: "Redis pub/sub", note: "no confundir: pub/sub es efímero, esto es cola durable-ish." }
    ],
    sim: null
  };

  G.fichas["db-colas"] = {
    que: "La cola es una tabla en tu base de datos relacional. Un worker hace SELECT ... FOR UPDATE SKIP LOCKED, procesa y borra. Solid Queue (Rails 8) es el ejemplo canónico 2026, pero el patrón es viejo y sólido.",
    semantica: "At-least-once y, mejor aún, transaccional con tu dominio: encolar el job y escribir tu negocio pasan en la misma transacción. Eso mata de raíz el dual-write. El job vuelve si el worker cae antes de borrarlo.",
    orden: "FIFO por columna de orden (id o timestamp) con SKIP LOCKED. Suficiente para casi todo lo transaccional; no busques orden distribuido aquí.",
    gana: [
      "Cero infra nueva: usas la DB que ya operas y respaldas.",
      "Transaccional con tu dominio — el outbox te sale gratis.",
      "Visibilidad total: es SQL, lo depuras con un SELECT."
    ],
    paga: [
      "Throughput limitado por tu DB; no es para millones/seg.",
      "El polling y los locks presionan la base bajo carga alta.",
      "Sin fan-out ni replay: es una cola de trabajo, punto."
    ],
    cuandoNo: "Cuando el volumen supera lo que tu DB tolera sin sufrir, o cuando necesitas fan-out a muchos consumidores. Ahí toca mudarse a un broker o a un log. Pero para el 80% de los jobs, empezar aquí es lo correcto.",
    parientes: [
      { label: "Redis colas", note: "más rápida, menos durable, no transaccional con tu dominio." },
      { label: "Outbox", note: "este patrón ES el outbox cuando publicas eventos después." },
      { label: "SQS / RabbitMQ", note: "el siguiente escalón cuando la DB ya no da." }
    ],
    sim: "outbox"
  };

})(window.GUIA = window.GUIA || {});
