/* ============================================================
   data/fichas-logs.js — familia "logs de eventos".
   ============================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas["kafka"] = {
    que: "Un log de commits distribuido: los mensajes se anexan a particiones y se retienen (por tiempo o tamaño), no se borran al leer. Cada consumer group mantiene su propio offset y avanza a su ritmo; leer es mover un cursor.",
    semantica: "At-least-once por default: el consumidor confirma offsets y, si falla antes, re-lee. Kafka ofrece exactly-once (transacciones + idempotent producer) dentro de Kafka, pero end-to-end sigue exigiendo idempotencia en tus sinks externos. La honestidad: efectivamente-una-vez, no magia.",
    orden: "Orden estricto por partición, jamás global. La key decide la partición, así que todo lo que comparte key va ordenado. Si te importa el orden de una entidad, esa entidad es tu key. Kinesis (shards) y Redpanda (compatible) juegan igual.",
    gana: [
      "Replay: rebobinas el offset y vuelves a procesar el pasado.",
      "Fan-out real: N grupos leen el mismo flujo sin estorbarse.",
      "Throughput altísimo y retención larga — el pasado es un activo."
    ],
    paga: [
      "Operación pesada: particiones, ISR, rebalances, retención.",
      "Latencia peor que un pub/sub en memoria para caso simple.",
      "Sobrado para 'solo quiero correr jobs' — es un martillo grande."
    ],
    cuandoNo: "Si lo único que quieres es despachar tareas y borrarlas, Kafka es sobreingeniería: usa una cola. Si tu equipo no puede sostener la operación (o pagar un gestionado), el costo te come. Kafka brilla cuando el pasado importa y muchos lo consumen.",
    parientes: [
      { label: "Kinesis", note: "el 'Kafka de AWS': mismo modelo de shards, gestionado." },
      { label: "Redpanda", note: "reimplementación compatible con la API, sin JVM ni ZooKeeper." },
      { label: "RabbitMQ", note: "la confusión estrella: cola (empuja y borra) vs log (retiene)." }
    ],
    sim: "particiones"
  };

  G.fichas["redis-streams"] = {
    que: "Un tipo de dato de Redis: un log append-only con ids monotónicos, consumer groups, ack y pending-entries-list. Es el intermedio honesto entre 'cola en Redis' y 'necesito Kafka de verdad'.",
    semantica: "At-least-once con consumer groups: cada entrega queda pendiente hasta el XACK; lo no confirmado se reclama con XCLAIM. La durabilidad es la de tu Redis (AOF/RDB). Idempotencia sigue de tu lado.",
    orden: "Orden total dentro del stream por id de entrada. Con consumer groups, el trabajo se reparte entre consumidores (no cada quien ve todo), así que el orden por-consumidor no está garantizado — como en Kafka por partición.",
    gana: [
      "Log con replay y groups sin montar Kafka, si ya tienes Redis.",
      "Rápido y simple de operar comparado con un clúster Kafka.",
      "XCLAIM/PEL te dan reintentos y recuperación de consumidores caídos."
    ],
    paga: [
      "Durabilidad y capacidad topadas por la memoria de Redis.",
      "No escala a la retención larga ni al throughput de Kafka.",
      "Ecosistema de tooling mucho más chico."
    ],
    cuandoNo: "Cuando la retención que necesitas no cabe en memoria, o el throughput/fan-out ya es de escala Kafka. Y si de plano no requieres replay, una cola normal es más simple.",
    parientes: [
      { label: "Kafka", note: "el mismo modelo de log, a otra escala y con más operación." },
      { label: "Redis pub/sub", note: "el mismo binario pero efímero — no confundir." },
      { label: "Redis colas", note: "otra vez el mismo binario: esto retiene, la cola borra." }
    ],
    sim: "cola-vs-log"
  };

})(window.GUIA = window.GUIA || {});
