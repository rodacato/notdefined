/* ==========================================================================
   data/fichas-consulta.js — Familia III · Orientadas a consulta
   GraphQL · OData
   ========================================================================== */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.graphql = {
    contratoTag: "SDL (schema)",
    contrato: "Un schema en SDL define tipos, campos y operaciones, y se valida en tiempo de ejecución: una query que pide un campo inexistente se rechaza. El schema es introspectable, así que el tooling (autocompletado, codegen) sale gratis.",
    transporte: "HTTP · JSON (POST a un endpoint)",
    gana: [
      "El cliente pide exactamente los campos que necesita: adiós over/under-fetching.",
      "Una query compone lo que en REST eran varios recursos y round-trips.",
      "Schema introspectable: type-safety en el front vía codegen, Playground gratis.",
      "Evoluciona sin versiones: deprecas campos, no publicas /v2."
    ],
    paga: [
      "Pierde el caching HTTP nativo: es POST a un solo endpoint (~20–40% más CPU de servidor).",
      "El N+1 no desaparece: se muda al servidor (necesitas DataLoader).",
      "Rate-limiting y seguridad se complican: una query puede pedir el universo.",
      "Complejidad de servidor real: resolvers, análisis de costo, profundidad."
    ],
    cuandoNo: [
      "Tu app vive del caching de CDN/browser — REST te lo regala y GraphQL te lo quita.",
      "Es un CRUD simple con vistas 1:1 a recursos; el schema es peso muerto.",
      "Tráfico interno servicio-a-servicio de alta frecuencia — eso es gRPC."
    ],
    parientes: [
      { nombre: "OData", desc: "También «consulta flexible», pero sobre REST/GET. Ver diferencia.", link: "#/desambiguacion" },
      { nombre: "REST", desc: "Lo que GraphQL intenta arreglar — a costa del caching.", link: "#/ficha/rest" },
      { nombre: "tRPC", desc: "Otra vía al type-safety, sin el peso del servidor GraphQL.", link: "#/ficha/trpc" }
    ],
    ratings: { contrato: 6, caching: 2, tooling: 6, adopcion: 4, overhead: 3, realtime: 4, evolucion: 6 },
    verdict: "Gana cuando muchos clientes distintos (web, iOS, Android) consumen el mismo grafo de datos con necesidades distintas. Si tienes un solo cliente y vistas simples, estás pagando complejidad de servidor por un problema que no tienes.",
    sim: {
      titulo: "La misma vista de perfil — en una query (y quién paga)",
      actors: [
        { id: "cli", label: "App móvil", role: "client" },
        { id: "gql", label: "GraphQL", role: "server" },
        { id: "db",  label: "DB", role: "db" }
      ],
      steps: [
        { from: "cli", to: "gql", dir: "right", kind: "req", label: "query { user{ orders{ shipment }}}", bytes: "~150 B", narracion: "Describes en UNA query exactamente los campos que quieres, anidando pedidos y envío." },
        { from: "gql", to: "db", dir: "right", kind: "req", label: "resolver · user", bytes: "—", narracion: "El servidor resuelve campo por campo: primero el usuario." },
        { from: "gql", to: "db", dir: "right", kind: "req", label: "resolver · orders", bytes: "—", narracion: "Luego los pedidos… aquí acecha el N+1, ahora del lado del servidor." },
        { from: "gql", to: "db", dir: "right", kind: "req", label: "resolver · shipment", bytes: "—", narracion: "Y el envío. El N+1 no desapareció: se mudó del cliente al servidor (por eso DataLoader)." },
        { from: "gql", to: "cli", dir: "left", kind: "res", label: "200 · { data }", bytes: "~640 B", narracion: "El cliente recibe UN solo round-trip con la forma exacta pedida. Pagó el servidor, no la red." }
      ]
    }
  };

  G.fichas.odata = {
    contratoTag: "$metadata (CSDL/EDMX)",
    contrato: "OData estandariza tanto la gramática de consulta ($filter, $expand, $select, $orderby) como un documento $metadata (CSDL/EDMX) que describe el modelo entero. Cliente y herramientas se autoconfiguran de ese metadata.",
    transporte: "HTTP · JSON o Atom/XML (GET consultable)",
    gana: [
      "Consulta flexible como GraphQL pero sobre GET: filtros, expansiones y proyección en la URL.",
      "Al ser GET, es cacheable por HTTP — algo que GraphQL sacrifica.",
      "$metadata estándar: Excel, Power BI y clientes se conectan solos.",
      "Convención uniforme: paginación, conteo y filtros iguales en toda API OData."
    ],
    paga: [
      "URLs monstruosas y una gramática de consulta con mucha superficie que asegurar.",
      "Ecosistema concentrado en Microsoft/SAP; fuera de ahí, tooling escaso.",
      "Exponer $filter arbitrario contra tu DB es un riesgo de rendimiento y seguridad.",
      "Percibido como pesado y «enterprise»; poca tracción en startups."
    ],
    cuandoNo: [
      "API pública moderna orientada a devs — la ergonomía juega en contra.",
      "No estás en el ecosistema Microsoft/SAP ni necesitas conectores BI.",
      "No quieres exponer una superficie de consulta grande contra tu base de datos."
    ],
    parientes: [
      { nombre: "GraphQL", desc: "El otro «consulta flexible», con POST y sin caching HTTP. Ver diferencia.", link: "#/desambiguacion" },
      { nombre: "REST", desc: "OData es REST + una gramática de consulta estándar encima.", link: "#/ficha/rest" }
    ],
    ratings: { contrato: 6, caching: 5, tooling: 3, adopcion: 2, overhead: 5, realtime: 1, evolucion: 4 },
    verdict: "Donde ya vives en el ecosistema Microsoft/SAP y necesitas que analistas conecten Excel/Power BI a tus datos, OData es un atajo enorme. A mi forma de verlo, fuera de ese mundo casi nadie lo elige de cero.",
    sim: {
      titulo: "Consulta en la URL — y el metadata que autoconfigura clientes",
      actors: [
        { id: "cli", label: "Cliente", role: "client" },
        { id: "svc", label: "OData", role: "server" }
      ],
      steps: [
        { from: "cli", to: "svc", dir: "right", kind: "req", label: "GET /Users?$filter=…&$expand=Orders&$select=name", bytes: "~160 B", narracion: "Metes la consulta en la URL: filtro, expansión y selección con gramática estándar." },
        { from: "svc", to: "cli", dir: "left", kind: "res", label: "200 · { value:[…] }", bytes: "~520 B", narracion: "Vuelve justo lo pedido y, como es GET, es cacheable por HTTP — a diferencia de GraphQL." },
        { from: "cli", to: "svc", dir: "right", kind: "req", label: "GET /$metadata", bytes: "~40 B", narracion: "Pides $metadata: el esquema completo, máquina-legible, para generar clientes." },
        { from: "svc", to: "cli", dir: "left", kind: "res", label: "200 · <edmx>", bytes: "~4 KB", narracion: "Llega el CSDL/EDMX. Por eso Excel y Power BI se conectan a una fuente OData sin escribir código." }
      ]
    }
  };

})(window.GUIA = window.GUIA || {});
