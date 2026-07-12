/* ==========================================================================
   data/quiz.js — «Cuál uso»: escenarios con veredicto razonado
   La última pregunta enseña la lección de fondo: los sistemas reales combinan
   estilos. `correcta` es el id de la opción correcta.
   ========================================================================== */
(function (G) {
  "use strict";

  G.quiz = [
    {
      escenario: "Vas a publicar una API para desarrolladores externos: CRUD de recursos, y quieres que se depure con curl y que el caching de CDN y browser funcione solo.",
      opciones: [
        { id: "rest", label: "REST" },
        { id: "grpc", label: "gRPC" },
        { id: "graphql", label: "GraphQL" },
        { id: "soap", label: "SOAP" }
      ],
      correcta: "rest",
      veredicto: [
        "REST. Es el único de la lista que te regala caching HTTP (ETags, Cache-Control) y que cualquier dev consume con curl sin capas extra.",
        "gRPC necesita proxy para el browser; GraphQL tira el caching HTTP por la ventana; SOAP espantaría a tus usuarios. Para una API pública de recursos, REST sigue siendo el default correcto."
      ]
    },
    {
      escenario: "Cientos de microservicios internos se hablan miles de veces por segundo. Los bytes en el cable y el CPU de serialización se multiplican por todo ese volumen.",
      opciones: [
        { id: "rest", label: "REST / JSON" },
        { id: "grpc", label: "gRPC" },
        { id: "websockets", label: "WebSockets" },
        { id: "odata", label: "OData" }
      ],
      correcta: "grpc",
      veredicto: [
        "gRPC. Protobuf binario sobre HTTP/2 te ahorra ~60–80% de bytes frente a JSON y reutiliza la conexión. A ese volumen, la diferencia es dinero y latencia.",
        "REST/JSON funcionaría, pero estás quemando ancho de banda y CPU sin razón puertas adentro. Aquí el JSON legible no compra nada: nadie lo lee con curl en producción."
      ]
    },
    {
      escenario: "Una app móvil con muchas pantallas distintas (web, iOS, Android) que consumen el mismo grafo de datos, cada una con necesidades de campos diferentes.",
      opciones: [
        { id: "rest", label: "REST" },
        { id: "graphql", label: "GraphQL" },
        { id: "soap", label: "SOAP" },
        { id: "mqtt", label: "MQTT" }
      ],
      correcta: "graphql",
      veredicto: [
        "GraphQL. Este es exactamente su caso: muchos clientes con necesidades distintas pidiendo del mismo grafo sin over-fetching ni un endpoint nuevo por pantalla.",
        "Con REST acabarías inventando endpoints «BFF» a mano o trayendo de más. Aceptas pagar más CPU de servidor y perder caching HTTP a cambio de que el cliente pida justo lo que necesita."
      ]
    },
    {
      escenario: "Un dashboard muestra un feed de eventos del servidor que se actualiza en vivo. El cliente solo mira: no manda nada de vuelta por ese canal.",
      opciones: [
        { id: "websockets", label: "WebSockets" },
        { id: "sse", label: "SSE" },
        { id: "longpolling", label: "Long polling" },
        { id: "webhooks", label: "Webhooks" }
      ],
      correcta: "sse",
      veredicto: [
        "SSE. Flujo unidireccional server→cliente = el caso de libro de Server-Sent Events. Es HTTP normal, reconecta solo con Last-Event-ID y no montas infra de conexiones con estado.",
        "WebSockets funcionaría pero es bidireccional que no vas a usar: más costo operativo por nada. El reflejo de saltar a WebSockets para «tiempo real» es el error más común de esta familia."
      ]
    },
    {
      escenario: "Integras Stripe. Quieres enterarte en el momento en que un pago se concreta, sin estar preguntando cada pocos segundos si ya pasó.",
      opciones: [
        { id: "poll", label: "Polling a la API de Stripe" },
        { id: "webhooks", label: "Webhooks" },
        { id: "grpc", label: "gRPC" },
        { id: "graphql", label: "GraphQL" }
      ],
      correcta: "webhooks",
      veredicto: [
        "Webhooks. El proveedor te llama a ti con un POST cuando el pago ocurre: cero polling, cero latencia de sondeo. Es el patrón universal para integrar SaaS de terceros.",
        "Trátalos como entrega no confiable: verifica la firma, sé idempotente (te llegarán duplicados) y encola antes de procesar. No son «una respuesta que llega tarde»."
      ]
    },
    {
      escenario: "Una flota de sensores a batería, en camiones, reportando temperatura sobre una red celular intermitente y pobre.",
      opciones: [
        { id: "mqtt", label: "MQTT" },
        { id: "rest", label: "REST" },
        { id: "websockets", label: "WebSockets" },
        { id: "soap", label: "SOAP" }
      ],
      correcta: "mqtt",
      veredicto: [
        "MQTT. Header de 2 bytes, QoS para redes que se caen, Last Will para detectar dispositivos muertos. Fue diseñado literalmente para este escenario.",
        "REST por cada lectura desperdiciaría batería y datos en headers; SOAP sería una broma cruel sobre una SIM. En IoT, MQTT rara vez pierde."
      ]
    },
    {
      escenario: "Diseñas el sistema completo de un e-commerce: API pública para partners, comunicación interna entre tus servicios, y avisar a integraciones externas cuando cambia un pedido. ¿Con qué te quedas?",
      opciones: [
        { id: "unrest", label: "Todo REST, consistencia ante todo" },
        { id: "mix", label: "REST público + gRPC interno + webhooks hacia afuera" },
        { id: "ungql", label: "Todo GraphQL" },
        { id: "ungrpc", label: "Todo gRPC" }
      ],
      correcta: "mix",
      veredicto: [
        "La combinación. REST público + gRPC interno + webhooks hacia afuera no es una derrota ni una inconsistencia: es EL patrón de los sistemas reales.",
        "Cada frontera tiene su presión distinta —ergonomía pública, eficiencia interna, desacople externo— y ningún estilo gana en las tres. La madurez no es elegir uno: es saber cuál va en cada borde."
      ]
    }
  ];

})(window.GUIA = window.GUIA || {});
