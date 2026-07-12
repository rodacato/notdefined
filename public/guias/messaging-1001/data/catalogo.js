/* ============================================================
   data/catalogo.js — FUENTE DE VERDAD del catálogo.
   Aquí viven folio, familia, nombre, estrella, modelo, ratings y
   los "dolores" que resuelve cada sistema. Las fichas (prosa) en
   data/fichas-*.js se cuelgan de estos ids y NO redefinen el folio.
   Agregar un sistema = tocar solo este archivo + su ficha.
   ============================================================ */
(function (G) {
  "use strict";

  // Familias (orden de aparición en el catálogo)
  G.familias = [
    { id: "colas",      nombre: "Colas de trabajo",     lema: "entregan y borran",              color: "var(--fam-colas)" },
    { id: "logs",       nombre: "Logs de eventos",       lema: "retienen y re-leen",             color: "var(--fam-logs)" },
    { id: "pubsub",     nombre: "Pub/sub efímero",       lema: "si no estabas, te lo perdiste",  color: "var(--fam-pubsub)" },
    { id: "gestionada", nombre: "Entrega gestionada",    lema: "durabilidad moderna, poca infra", color: "var(--fam-gestionada)" }
  ];

  // Dolores para el filtro problema-primero
  G.dolores = [
    { id: "jobs-sin-infra",   texto: "Jobs en background sin infra nueva" },
    { id: "fanout-equipos",   texto: "Eventos que varios equipos consumen a su ritmo" },
    { id: "auditoria-replay", texto: "Auditoría y replay del pasado" },
    { id: "iot",              texto: "Telemetría IoT con red pobre" },
    { id: "presencia",        texto: "Avisar en tiempo real si estás conectado" },
    { id: "orden-dinero",     texto: "Orden estricto de operaciones de dinero" }
  ];

  // Ejes de rating (orden fijo). "complejidad" es carga, no virtud.
  G.ejes = [
    { id: "durabilidad", label: "Durabilidad" },
    { id: "orden",       label: "Garantías de orden" },
    { id: "throughput",  label: "Throughput" },
    { id: "latencia",    label: "Latencia (más = más rápido)" },
    { id: "fanout",      label: "Fan-out" },
    { id: "replay",      label: "Replay" },
    { id: "complejidad", label: "Complejidad operativa", heavy: true }
  ];

  // Los 11 sistemas. ratings sobre 7.
  G.catalogo = [
    /* ---- Familia: colas de trabajo ---- */
    {
      id: "rabbitmq", folio: "01", familia: "colas", nombre: "RabbitMQ", estrella: true,
      modelo: "Cola · broker AMQP",
      una: "El broker de colas clásico: exchanges que rutean, colas que entregan y borran, ack por mensaje.",
      dolores: ["orden-dinero", "fanout-equipos"],
      ratings: { durabilidad: 6, orden: 4, throughput: 4, latencia: 6, fanout: 5, replay: 1, complejidad: 5 }
    },
    {
      id: "sqs", folio: "02", familia: "colas", nombre: "Amazon SQS", estrella: false,
      modelo: "Cola · gestionada (AWS)",
      una: "La cola como servicio: cero operación. Estándar (at-least-once, orden best-effort) o FIFO (orden y dedup por grupo).",
      dolores: ["orden-dinero", "jobs-sin-infra"],
      ratings: { durabilidad: 6, orden: 3, throughput: 6, latencia: 4, fanout: 2, replay: 1, complejidad: 2 }
    },
    {
      id: "redis-colas", folio: "03", familia: "colas", nombre: "Colas sobre Redis", estrella: false,
      modelo: "Cola · Sidekiq / BullMQ",
      una: "Usar Redis como cola de jobs con una librería encima. Rapidísimo; la durabilidad es la de tu Redis.",
      dolores: ["jobs-sin-infra"],
      ratings: { durabilidad: 3, orden: 3, throughput: 6, latencia: 7, fanout: 2, replay: 1, complejidad: 3 }
    },
    {
      id: "db-colas", folio: "04", familia: "colas", nombre: "Colas sobre la base de datos", estrella: true,
      modelo: "Cola · Solid Queue / DB",
      una: "La cola es una tabla. Cero infra nueva y transaccional con tu dominio. El «empieza aquí» honesto.",
      dolores: ["jobs-sin-infra"],
      ratings: { durabilidad: 6, orden: 4, throughput: 3, latencia: 4, fanout: 1, replay: 1, complejidad: 1 }
    },

    /* ---- Familia: logs de eventos ---- */
    {
      id: "kafka", folio: "05", familia: "logs", nombre: "Apache Kafka", estrella: true,
      modelo: "Log · particionado",
      una: "El log de eventos por antonomasia: retiene, particiona por key y deja que muchos grupos lean a su ritmo — con replay.",
      dolores: ["fanout-equipos", "auditoria-replay"],
      ratings: { durabilidad: 7, orden: 5, throughput: 7, latencia: 4, fanout: 7, replay: 7, complejidad: 6 }
    },
    {
      id: "redis-streams", folio: "06", familia: "logs", nombre: "Redis Streams", estrella: false,
      modelo: "Log · en Redis",
      una: "Un log append-only dentro de Redis, con consumer groups y ack. El «Kafka de bolsillo» cuando ya tienes Redis.",
      dolores: ["fanout-equipos", "auditoria-replay"],
      ratings: { durabilidad: 4, orden: 5, throughput: 6, latencia: 6, fanout: 5, replay: 5, complejidad: 3 }
    },

    /* ---- Familia: pub/sub efímero ---- */
    {
      id: "redis-pubsub", folio: "07", familia: "pubsub", nombre: "Redis pub/sub", estrella: false,
      modelo: "Pub/sub efímero",
      una: "Fire-and-forget puro: si el suscriptor no estaba escuchando, el mensaje no existió. Cero durabilidad, latencia mínima.",
      dolores: ["presencia"],
      ratings: { durabilidad: 0, orden: 2, throughput: 6, latencia: 7, fanout: 5, replay: 0, complejidad: 1 }
    },
    {
      id: "nats-core", folio: "08", familia: "pubsub", nombre: "NATS core", estrella: false,
      modelo: "Pub/sub efímero",
      una: "Pub/sub ligerísimo con subjects jerárquicos y request-reply. Efímero por diseño; la durabilidad la agrega JetStream.",
      dolores: ["presencia"],
      ratings: { durabilidad: 0, orden: 2, throughput: 7, latencia: 7, fanout: 6, replay: 0, complejidad: 2 }
    },

    /* ---- Familia: entrega gestionada moderna ---- */
    {
      id: "nats-jetstream", folio: "09", familia: "gestionada", nombre: "NATS JetStream", estrella: false,
      modelo: "Stream durable",
      una: "La capa durable sobre NATS: streams, consumers durables, at-least-once y replay — sin dejar el ecosistema NATS.",
      dolores: ["fanout-equipos", "auditoria-replay"],
      ratings: { durabilidad: 6, orden: 4, throughput: 6, latencia: 5, fanout: 6, replay: 6, complejidad: 4 }
    },
    {
      id: "google-pubsub", folio: "10", familia: "gestionada", nombre: "Google Pub/Sub", estrella: false,
      modelo: "Pub/sub gestionado",
      una: "Pub/sub global sin operar nada: escala solo, at-least-once, retención configurable y ordering keys opcional.",
      dolores: ["fanout-equipos"],
      ratings: { durabilidad: 6, orden: 3, throughput: 6, latencia: 4, fanout: 6, replay: 4, complejidad: 2 }
    },
    {
      id: "mqtt", folio: "11", familia: "gestionada", nombre: "MQTT", estrella: true,
      modelo: "Pub/sub · IoT",
      una: "El protocolo de mensajería para dispositivos: ligero, tres niveles de QoS y sesiones que sobreviven a la red mala.",
      dolores: ["iot"],
      ratings: { durabilidad: 3, orden: 2, throughput: 5, latencia: 6, fanout: 6, replay: 1, complejidad: 3 }
    }
  ];

  // ---- Accesores (una sola fuente de verdad) ----
  G.getSistema = function (id) {
    return G.catalogo.find(function (s) { return s.id === id; }) || null;
  };
  G.getFamilia = function (id) {
    return G.familias.find(function (f) { return f.id === id; }) || null;
  };
  G.sistemasDeFamilia = function (famId) {
    return G.catalogo.filter(function (s) { return s.familia === famId; });
  };

})(window.GUIA = window.GUIA || {});
