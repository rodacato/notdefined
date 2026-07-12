/* ==========================================================================
   data/catalogo.js — FUENTE DE VERDAD del catálogo
   Folio, nombre, familia, estrella, escala y dolores que resuelve cada estilo.
   Las fichas (data/fichas-*.js) referencian por id; el folio vive SOLO aquí.
   escala.complejidad: 1–3 (◆). escala.frecuencia: 'nucleo' | 'medio' | 'cola'.
   ========================================================================== */
(function (G) {
  "use strict";

  G.catalogo = [
    // ---- I · Petición-respuesta clásico (HTTP) ----
    { folio: "01", id: "rest", nombre: "REST", familia: "http", estrella: true,
      tipo: "Recurso sobre HTTP",
      escala: { complejidad: 2, frecuencia: "nucleo" },
      oneliner: "Recursos direccionables por URL y verbos HTTP. El default de la industria — para bien y para mal.",
      dolores: ["partner"] },

    { folio: "02", id: "soap", nombre: "SOAP / Web Services", familia: "http", estrella: false,
      tipo: "RPC sobre XML",
      escala: { complejidad: 3, frecuencia: "cola" },
      oneliner: "Envelope XML con contrato WSDL rígido. Sobrevive donde el contrato pesa más que la ergonomía.",
      dolores: ["partner"] },

    { folio: "03", id: "jsonrpc", nombre: "JSON-RPC", familia: "http", estrella: false,
      tipo: "RPC sobre JSON",
      escala: { complejidad: 1, frecuencia: "medio" },
      oneliner: "Llamas un método por nombre con params y recibes result. Mínimo, sin ceremonia, sin recursos.",
      dolores: ["s2s"] },

    // ---- II · RPC tipado moderno ----
    { folio: "04", id: "grpc", nombre: "gRPC", familia: "rpc", estrella: true,
      tipo: "RPC binario / HTTP2",
      escala: { complejidad: 3, frecuencia: "nucleo" },
      oneliner: "Protobuf sobre HTTP/2 con streaming multiplexado. El estándar de facto servicio-a-servicio.",
      dolores: ["s2s", "movil", "typesafe"] },

    { folio: "05", id: "trpc", nombre: "tRPC", familia: "rpc", estrella: false,
      tipo: "RPC tipado en TS",
      escala: { complejidad: 1, frecuencia: "medio" },
      oneliner: "Los tipos de TypeScript SON el contrato. Cero codegen, cero esquema — dentro de un monorepo TS.",
      dolores: ["typesafe"] },

    // ---- III · Orientadas a consulta ----
    { folio: "06", id: "graphql", nombre: "GraphQL", familia: "consulta", estrella: true,
      tipo: "Query language",
      escala: { complejidad: 3, frecuencia: "nucleo" },
      oneliner: "El cliente pide exactamente los campos que quiere en una sola query. Un endpoint, un grafo.",
      dolores: ["movil", "typesafe"] },

    { folio: "07", id: "odata", nombre: "OData", familia: "consulta", estrella: false,
      tipo: "REST consultable",
      escala: { complejidad: 3, frecuencia: "cola" },
      oneliner: "REST con gramática de consulta estándar ($filter, $expand) y $metadata. Fuerte en el mundo Microsoft/SAP.",
      dolores: ["partner"] },

    // ---- IV · Tiempo real / push ----
    { folio: "08", id: "websockets", nombre: "WebSockets", familia: "tiemporeal", estrella: true,
      tipo: "Canal full-duplex",
      escala: { complejidad: 2, frecuencia: "nucleo" },
      oneliner: "Un handshake y queda un canal bidireccional persistente. Tú defines el protocolo por dentro.",
      dolores: ["dashboard"] },

    { folio: "09", id: "sse", nombre: "SSE", familia: "tiemporeal", estrella: false,
      tipo: "Stream unidireccional",
      escala: { complejidad: 1, frecuencia: "medio" },
      oneliner: "Server-Sent Events: un stream HTTP del servidor al cliente que se reconecta solo. Simple y suficiente.",
      dolores: ["dashboard"] },

    { folio: "10", id: "longpolling", nombre: "Long polling", familia: "tiemporeal", estrella: false,
      tipo: "Push emulado (histórico)",
      escala: { complejidad: 1, frecuencia: "cola" },
      oneliner: "Pides y el servidor retiene la respuesta hasta tener algo. El truco pre-WebSocket; hoy, fallback.",
      dolores: ["dashboard"] },

    // ---- V · Asíncronas / eventos hacia afuera ----
    { folio: "11", id: "webhooks", nombre: "Webhooks", familia: "eventos", estrella: true,
      tipo: "Callback HTTP saliente",
      escala: { complejidad: 2, frecuencia: "nucleo" },
      oneliner: "El servidor te llama a ti: un POST a tu URL cuando algo pasa, con reintentos. Push sin canal abierto.",
      dolores: ["avisar"] },

    { folio: "12", id: "eventos", nombre: "APIs de eventos", familia: "eventos", estrella: false,
      tipo: "Stream / broker",
      escala: { complejidad: 3, frecuencia: "medio" },
      oneliner: "Emites eventos a un stream (Kafka, colas) descrito con AsyncAPI. Consumidores desacoplados y con replay.",
      dolores: ["avisar", "s2s"] },

    { folio: "13", id: "mqtt", nombre: "MQTT", familia: "eventos", estrella: false,
      tipo: "Pub/sub para IoT",
      escala: { complejidad: 2, frecuencia: "medio" },
      oneliner: "Pub/sub ligerísimo con QoS sobre un broker. Header de 2 bytes: hecho para batería y redes malas.",
      dolores: ["iot", "avisar"] }
  ];

  // Índice por id para lookup O(1) desde las fichas y páginas.
  G.catalogoPorId = {};
  G.catalogo.forEach(function (e) { G.catalogoPorId[e.id] = e; });

  // Helper: estilos de una familia, en orden de catálogo.
  G.estilosDeFamilia = function (famId) {
    return G.catalogo.filter(function (e) { return e.familia === famId; });
  };

})(window.GUIA = window.GUIA || {});
