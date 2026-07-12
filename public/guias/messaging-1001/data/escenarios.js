/* ============================================================
   data/escenarios.js — quiz "¿cuál uso?", desambiguaciones y la
   escalera honesta. Todo texto/veredicto vive aquí (no en el motor).
   Datos de referencia evaluados jul 2026.
   ============================================================ */
(function (G) {
  "use strict";

  /* ---- Quiz de escenarios (veredicto razonado) ---- */
  G.escenarios = [
    {
      q: "Tienes un monolito en Rails y quieres mandar correos y generar PDFs en background. Cero infra nueva. ¿Qué usas?",
      opts: [
        { t: "Kafka: es lo que usan los grandes", correct: false },
        { t: "Una cola sobre tu base de datos (Solid Queue)", correct: true },
        { t: "Redis pub/sub", correct: false }
      ],
      verdict: "Cola sobre la DB. Es transaccional con tu dominio, no agregas piezas que operar y para jobs de background sobra. Kafka aquí es un martillo para clavar una tachuela; Redis pub/sub ni siquiera es durable — perderías correos."
    },
    {
      q: "Tres equipos distintos (facturación, analítica, notificaciones) quieren consumir el mismo flujo de 'pedido creado', cada uno a su ritmo. ¿Qué encaja?",
      opts: [
        { t: "Un log de eventos (Kafka / JetStream / Google Pub/Sub)", correct: true },
        { t: "Una cola de RabbitMQ compartida", correct: false },
        { t: "Colas sobre la DB, una por equipo", correct: false }
      ],
      verdict: "Un log. El fan-out con offsets independientes es exactamente su superpotencia: cada grupo lee todo el flujo a su velocidad sin quitarle el mensaje a los demás. Una cola compartida se los repartiría (cada mensaje a un solo consumidor); una cola por equipo te obliga a re-publicar N veces."
    },
    {
      q: "Necesitas mostrar un puntito verde de 'usuario en línea' que se apaga si se desconecta. Si nadie está viendo, no importa. ¿Qué usas?",
      opts: [
        { t: "Kafka con retención de 7 días", correct: false },
        { t: "Pub/sub efímero (Redis pub/sub o NATS core)", correct: true },
        { t: "SQS FIFO", correct: false }
      ],
      verdict: "Pub/sub efímero. La presencia es la definición de 'solo importa ahora': si el suscriptor no estaba, no perdiste nada valioso. Pagar durabilidad y retención (Kafka) o exactly-once (SQS FIFO) aquí es tirar dinero y latencia."
    },
    {
      q: "Operaciones de dinero de una misma cuenta deben aplicarse en orden estricto, y no puedes procesar la misma dos veces. En AWS. ¿Qué usas?",
      opts: [
        { t: "SQS estándar + idempotencia", correct: false },
        { t: "SQS FIFO con message group = id de cuenta", correct: true },
        { t: "Redis pub/sub", correct: false }
      ],
      verdict: "SQS FIFO, con el id de cuenta como message group: orden estricto por cuenta y exactly-once processing, y cuentas distintas avanzan en paralelo. SQS estándar te daría orden best-effort (tú re-ordenas) y Redis pub/sub no da ninguna garantía. Ojo: FIFO topa el throughput — por eso el group id fino es todo el diseño."
    },
    {
      q: "Miles de dispositivos GPS con red celular intermitente reportan posición. Algunos se desconectan por minutos. ¿Qué protocolo?",
      opts: [
        { t: "MQTT con QoS y sesiones persistentes", correct: true },
        { t: "HTTP polling cada segundo", correct: false },
        { t: "Kafka directo desde el dispositivo", correct: false }
      ],
      verdict: "MQTT. Está hecho para redes malas: header minúsculo, QoS por tópico y sesiones que guardan lo pendiente durante la desconexión. Kafka desde el borde es pesado y frágil ahí; el polling HTTP quema batería y datos. Patrón común: MQTT en el borde → Kafka como sink del histórico."
    },
    {
      q: "Un compañero dice: 'nuestro pipeline es exactly-once end-to-end, garantizado'. ¿Qué respondes?",
      opts: [
        { t: "Perfecto, entonces no necesito idempotencia", correct: false },
        { t: "Si no incluye la palabra idempotencia, es at-least-once con mercadotecnia", correct: true },
        { t: "Imposible, exactly-once no existe en ningún caso", correct: false }
      ],
      verdict: "El exactly-once real de punta a punta es efectivamente-una-vez: entrega repetida + consumidor idempotente. Kafka y SQS FIFO dan garantías fuertes dentro de su frontera, pero en cuanto tocas un sink externo (una DB, un cobro), la idempotencia vuelve a ser tuya. No es que 'no exista' — es que su nombre honesto lleva idempotencia adentro."
    }
  ];

  /* ---- La escalera honesta ---- */
  G.escalera = {
    titulo: "La escalera honesta",
    pasos: [
      { t: "Empieza con la <strong>cola sobre tu DB</strong>", d: "transaccional, cero infra, depurable con un SELECT. Cubre el 80% de los jobs." },
      { t: "Múdate a un <strong>broker</strong> (RabbitMQ / SQS)", d: "cuando el throughput, el ruteo o la operación ya no caben en la DB." },
      { t: "Sube a un <strong>log</strong> (Kafka / Streams / JetStream)", d: "cuando el pasado importa: replay, auditoría o varios equipos consumiendo el mismo flujo." }
    ],
    cierre: "No brinques escalones por moda. Cada uno se justifica por un dolor concreto, no por el organigrama de otra empresa."
  };

  /* ---- Desambiguaciones ---- */
  G.desambiguaciones = [
    {
      title: "Cola", vs: "Log", tag: "LA madre de todas",
      sides: [
        { h: "Cola (RabbitMQ, SQS, Redis, DB)", body: "Entrega y <strong>borra</strong>. Cada mensaje va a <em>un</em> consumidor del grupo; una vez procesado y confirmado, desaparece. Sin historial, sin releer." },
        { h: "Log (Kafka, Kinesis, Streams)", body: "<strong>Retiene</strong> y re-lee. Los mensajes se quedan; cada consumer group avanza su propio offset. Muchos leen lo mismo, y puedes rebobinar." }
      ],
      punch: "Regla de bolsillo: si necesitas <strong>replay o fan-out a varios equipos</strong>, es un log. Si solo necesitas <strong>hacer un trabajo y olvidarlo</strong>, es una cola."
    },
    {
      title: "At-most-once", vs: "at-least-once vs exactly-once", tag: "las tres semánticas", tri: true,
      sides: [
        { h: "At-most-once", body: "Cero o una entrega. Puede <strong>perder</strong> mensajes, nunca duplica. Es el pub/sub efímero y MQTT QoS 0." },
        { h: "At-least-once", body: "Una o más entregas. Nunca pierde, pero <strong>puede duplicar</strong>. El default de casi todo (Kafka, RabbitMQ, SQS estándar). Deduplica en el consumidor." },
        { h: "Exactly-once", body: "Ni pérdida ni duplicado. Real solo dentro de una frontera (Kafka tx, SQS FIFO). End-to-end = <strong>efectivamente-una-vez</strong> con idempotencia." }
      ],
      punch: "Si tu «exactly-once» no incluye la palabra <strong>idempotencia</strong>, es at-least-once con mercadotecnia."
    },
    {
      title: "Pub/sub efímero", vs: "pub/sub durable", tag: "el matiz que cuesta caro",
      sides: [
        { h: "Efímero (Redis pub/sub, NATS core)", body: "Entrega a quien escucha <strong>ahora</strong>. Si el suscriptor estaba caído, se lo perdió. Latencia mínima, cero garantías." },
        { h: "Durable (JetStream, Google Pub/Sub)", body: "El mensaje <strong>espera</strong> al suscriptor: se persiste y se entrega cuando vuelva, con ack y reintentos." }
      ],
      punch: "«Pub/sub» no dice nada sobre durabilidad. Siempre pregunta: <strong>¿qué pasa si el receptor está caído?</strong>"
    },
    {
      title: "Redis pub/sub", vs: "Streams vs Redis-como-cola", tag: "tres cosas, un binario", tri: true,
      sides: [
        { h: "Redis pub/sub", body: "Efímero. Publica a un canal, llega a quien esté suscrito. <strong>Sin historial, sin ack.</strong>" },
        { h: "Redis Streams", body: "Log durable-ish. Append-only, consumer groups, ack, replay. <strong>Retiene.</strong>" },
        { h: "Redis como cola", body: "Sidekiq/BullMQ sobre listas. Cola de <strong>trabajo</strong>: entrega y borra, con reintentos." }
      ],
      punch: "El mismo Redis hace las tres — y son <strong>decisiones distintas</strong>. No las confundas por compartir binario."
    },
    {
      title: "NATS core", vs: "JetStream", tag: "misma casa, otro piso",
      sides: [
        { h: "NATS core", body: "Pub/sub <strong>efímero</strong>, request-reply, subjects con comodines. Footprint mínimo, sin persistencia." },
        { h: "JetStream", body: "Capa <strong>durable</strong> sobre el mismo servidor: streams, consumers durables, at-least-once y replay." }
      ],
      punch: "Es el mismo binario con una capa encendida. <strong>«NATS» sin apellido normalmente significa el core efímero.</strong>"
    },
    {
      title: "Broker", vs: "brokerless", tag: "el intermediario",
      sides: [
        { h: "Con broker (Kafka, RabbitMQ, NATS)", body: "Un intermediario recibe, guarda y reparte. Desacopla productor y consumidor; agrega durabilidad, ruteo y una pieza que operar." },
        { h: "Brokerless (ZeroMQ, gRPC directo)", body: "Los servicios se hablan <strong>directo</strong>. Menos latencia y menos infra, pero tú cargas con descubrimiento, reintentos y buffering." }
      ],
      punch: "El broker te cobra una pieza de operación a cambio de <strong>desacoplar y durar</strong>. Casi siempre vale la pena; el brokerless es nicho."
    }
  ];

})(window.GUIA = window.GUIA || {});
