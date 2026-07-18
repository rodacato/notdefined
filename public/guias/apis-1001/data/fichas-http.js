/* ==========================================================================
   data/fichas-http.js — Familia I · Petición-respuesta clásico
   REST · SOAP · JSON-RPC
   Cada ficha define el guión de su simulación (actors + steps). El motor que
   lo anima vive en js/components.js — aquí sólo el contenido.
   step.kind: 'req' | 'res' | 'fail' | 'open' | 'frame'
   ========================================================================== */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.rest = {
    contratoTag: "OpenAPI (opcional)",
    contrato: "Lo define quien publica la API, y casi siempre de forma laxa: un OpenAPI/Swagger si hay suerte, o nada más que documentación en Markdown. El contrato no se impone en tiempo de ejecución.",
    transporte: "HTTP/1.1 o /2 · JSON (a veces XML)",
    gana: [
      "Caching gratis de CDN y browser: ETags, Cache-Control, 304. Ninguna otra familia lo trae de fábrica.",
      "Todo el mundo lo entiende: cero curva, tooling infinito, se depura con curl.",
      "Recursos direccionables: cada cosa tiene su URL, se comparte y se marca.",
      "Escala en lecturas sin estado gracias a los intermediarios HTTP."
    ],
    paga: [
      "Over-fetching y under-fetching: la vista casi nunca calza con un recurso.",
      "El N+1 de recursos: componer una pantalla toma varios round-trips.",
      "Versionado incómodo: /v1, /v2 y la migración eterna.",
      "«RESTful» es aspiracional; casi nadie pasa del nivel 2 de Richardson."
    ],
    cuandoNo: [
      "Necesitas armar una vista con datos de 4 recursos en una llamada — eso es GraphQL.",
      "Tráfico interno de alta frecuencia donde los bytes y el CPU importan — eso es gRPC.",
      "Empujar datos en vivo al cliente — HTTP pide-respuesta no empuja; usa SSE o WebSockets."
    ],
    parientes: [
      { nombre: "JSON sobre HTTP", desc: "El 90% de las «APIs REST» reales. Ver desambiguación: madurez de Richardson.", link: "#/desambiguacion" },
      { nombre: "GraphQL", desc: "Resuelve el over-fetching que REST arrastra.", link: "#/ficha/graphql" },
      { nombre: "OData", desc: "REST + gramática de consulta estándar encima.", link: "#/ficha/odata" },
      { nombre: "Cliente-Servidor", desc: "El estilo de arquitectura debajo de todo request-response (Tomo II).", link: "/guias/architectures-1001/#/familia/3/cliente-servidor" }
    ],
    ratings: { contrato: 3, caching: 7, tooling: 7, adopcion: 7, overhead: 4, realtime: 1, evolucion: 4 },
    verdict: "El default correcto para APIs públicas y CRUD. Deja de pretender que es «RESTful» y aprovecha lo que sí te regala: caching HTTP.",
    sim: {
      titulo: "Componer la vista de perfil — el N+1 de recursos",
      actors: [
        { id: "cli", label: "App móvil", role: "client" },
        { id: "api", label: "API REST", role: "server" }
      ],
      steps: [
        { from: "cli", to: "api", dir: "right", kind: "req", label: "GET /users/42", bytes: "~90 B", narracion: "Pides el usuario por la URL de su recurso." },
        { from: "api", to: "cli", dir: "left", kind: "res", label: "200 · user", bytes: "~180 B", narracion: "Llega el usuario — pero sus pedidos son otro recurso aparte." },
        { from: "cli", to: "api", dir: "right", kind: "req", label: "GET /users/42/orders", bytes: "~95 B", narracion: "Segundo viaje: ahora los últimos pedidos." },
        { from: "api", to: "cli", dir: "left", kind: "res", label: "200 · [orders]", bytes: "~420 B", narracion: "Llegan los pedidos… pero sin el estado de envío en vivo." },
        { from: "cli", to: "api", dir: "right", kind: "req", label: "GET /shipments?order=…", bytes: "~110 B", narracion: "Tercer viaje para el envío. Tres round-trips para una sola pantalla." },
        { from: "api", to: "cli", dir: "left", kind: "res", label: "200 · shipment", bytes: "~160 B", narracion: "Recién ahora la vista está completa. Eso es el N+1 de recursos." }
      ]
    }
  };

  G.fichas.soap = {
    contratoTag: "WSDL (estricto)",
    contrato: "WSDL: un contrato XML formal y máquina-legible que define operaciones, tipos y bindings. Rígido y verificable — un cliente se autogenera del WSDL y el servidor rechaza lo que no calce.",
    transporte: "HTTP (u otros) · XML con envelope SOAP",
    gana: [
      "Contrato fuerte y formal: WSDL + XSD, ideal para acuerdos entre empresas.",
      "Estándares WS-* para seguridad, transacciones y confiabilidad a nivel de mensaje.",
      "Independiente del transporte: SOAP también corre sobre colas, SMTP, etc.",
      "Tooling maduro en ecosistemas Java/.NET: stubs generados del WSDL."
    ],
    paga: [
      "Overhead brutal: el envelope XML pesa mucho más que el dato útil.",
      "Ergonomía dolorosa: namespaces, WS-*, verbosidad y herramientas pesadas.",
      "Sin caching HTTP: todo es POST a un endpoint.",
      "El status HTTP no discrimina el error: sea 200 o un 500 genérico, la semántica del fallo vive en el XML del <soap:Fault>."
    ],
    cuandoNo: [
      "Empiezas algo nuevo sin un mandato de contrato formal — REST o gRPC te dan más por menos.",
      "Ancho de banda o batería importan — el XML te sangra bytes.",
      "Quieres que el browser consuma la API directo sin capas de traducción."
    ],
    parientes: [
      { nombre: "REST", desc: "Le ganó la web pública por ergonomía. Ver por qué perdió SOAP.", link: "#/desambiguacion" },
      { nombre: "gRPC", desc: "El «RPC con contrato fuerte» de hoy, pero binario y eficiente.", link: "#/ficha/grpc" }
    ],
    ratings: { contrato: 7, caching: 1, tooling: 4, adopcion: 2, overhead: 7, realtime: 1, evolucion: 5 },
    verdict: "SOAP sobrevive donde el contrato pesa más que la ergonomía: bancos, gobierno, seguros, legacy que paga bien. No lo elijas para algo nuevo; convive con lo que ya existe.",
    sim: {
      titulo: "Pedir un usuario — el peso del envelope",
      actors: [
        { id: "cli", label: "Cliente", role: "client" },
        { id: "srv", label: "Web Service", role: "server" }
      ],
      steps: [
        { from: "cli", to: "srv", dir: "right", kind: "req", label: "POST · <Envelope>", bytes: "~1.2 KB", narracion: "Mandas un envelope XML: <Header> WS-* + <Body>. ~1.2 KB para pedir un usuario." },
        { from: "srv", to: "cli", dir: "left", kind: "res", label: "200 · <Envelope>", bytes: "~1.4 KB", narracion: "Responde otro envelope. El dato útil son ~180 B; el resto es ceremonia XML." },
        { from: "srv", to: "cli", dir: "left", kind: "fail", label: "500 · <soap:Fault>", bytes: "~900 B", narracion: "El binding devuelve un 500 genérico, pero el status no te dice qué falló: la semántica del error viene dentro del <soap:Fault>, en el XML." }
      ]
    }
  };

  G.fichas.jsonrpc = {
    contratoTag: "Ninguno estándar",
    contrato: "La especificación JSON-RPC 2.0 fija el sobre (method, params, id, result, error) pero no los tipos de tus métodos. No hay esquema estándar: el contrato de datos vive en tu documentación o en convenciones internas.",
    transporte: "HTTP, WebSocket o TCP · JSON",
    gana: [
      "Mínimo absoluto: method + params + id. Se implementa en una tarde.",
      "Batch nativo: varias llamadas en un solo request.",
      "Agnóstico de transporte: HTTP, WebSocket o crudo sobre TCP.",
      "Modelo mental de «llamar funciones», sin forzar recursos ni verbos."
    ],
    paga: [
      "Sin esquema estándar: cada quien inventa su tipado y su doc.",
      "Sin caching HTTP: es POST opaco a un endpoint.",
      "Tooling y descubribilidad pobres comparado con REST u OpenAPI.",
      "Manejo de errores por convención de códigos, no por semántica HTTP."
    ],
    cuandoNo: [
      "Necesitas contrato fuerte y codegen — gRPC o tRPC te lo dan.",
      "Quieres caching y recursos direccionables — eso es REST.",
      "Vas a exponerla a terceros que esperan OpenAPI y descubrimiento."
    ],
    parientes: [
      { nombre: "gRPC", desc: "La versión con contrato binario fuerte del mismo modelo RPC.", link: "#/ficha/grpc" },
      { nombre: "tRPC", desc: "RPC tipado, pero atado a TypeScript de punta a punta.", link: "#/ficha/trpc" }
    ],
    ratings: { contrato: 2, caching: 2, tooling: 3, adopcion: 6, overhead: 3, realtime: 2, evolucion: 3 },
    verdict: "El RPC honesto y sin ceremonia. Brilla en nichos —wallets de blockchain, plugins, control interno— donde «llamar un método» es el modelo natural y nadie necesita OpenAPI. Y lo usas a diario sin saberlo: LSP, el protocolo que conecta tu editor con cada lenguaje, es JSON-RPC.",
    sim: {
      titulo: "Llamar un método, y luego un batch",
      actors: [
        { id: "cli", label: "Cliente", role: "client" },
        { id: "srv", label: "Servidor", role: "server" }
      ],
      steps: [
        { from: "cli", to: "srv", dir: "right", kind: "req", label: "{ method:'getUser', id:1 }", bytes: "~55 B", narracion: "Llamas un método por nombre. No hay recurso ni verbo: solo method + params + id." },
        { from: "srv", to: "cli", dir: "left", kind: "res", label: "{ result, id:1 }", bytes: "~190 B", narracion: "Vuelve result con el mismo id. La correlación es por id, no por URL." },
        { from: "cli", to: "srv", dir: "right", kind: "req", label: "[ getUser, getOrders ]", bytes: "~110 B", narracion: "Mandas un batch: dos llamadas empaquetadas en un request." },
        { from: "srv", to: "cli", dir: "left", kind: "res", label: "[ r1, r2 ]", bytes: "~610 B", narracion: "Vuelven las dos respuestas en un array. Un viaje, dos métodos." }
      ]
    }
  };

})(window.GUIA = window.GUIA || {});
