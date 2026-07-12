/* ==========================================================================
   data/desambiguacion.js — Los que se confunden
   Dos columnas + veredicto. El primero incluye la escalera de Richardson en
   3 líneas (sin academicismo).
   ========================================================================== */
(function (G) {
  "use strict";

  G.desambiguacion = [
    {
      a: "REST", b: "«JSON sobre HTTP»",
      cols: [
        { name: "REST (de verdad)", text: "Recursos con URLs estables, verbos HTTP con su semántica, códigos de estado que significan algo y —el nivel que casi nadie alcanza— hipermedia: la respuesta te dice qué puedes hacer después." },
        { name: "JSON sobre HTTP", text: "Endpoints tipo /getUserData que devuelven JSON, ignorando verbos y códigos. Funciona perfecto. Simplemente no es REST: es RPC disfrazado con acento HTTP." }
      ],
      richardson: [
        { l: "Nivel 0", t: "Un solo endpoint, todo por POST. Es RPC con ropa de HTTP." },
        { l: "Nivel 1", t: "Recursos con URL propia (/users/42), pero un solo verbo." },
        { l: "Nivel 2", t: "Verbos HTTP + códigos de estado con significado. Aquí vive el 90% de las «APIs REST»." },
        { l: "Nivel 3", t: "Hipermedia (HATEOAS): la respuesta enlaza las siguientes acciones. El REST del paper — rarísimo en la práctica." }
      ],
      verdict: "La mayoría de las «APIs REST» son nivel 2, y está perfecto. El punto no es sentir culpa: es dejar de invocar la palabra «REST» como bendición y aprovechar lo concreto que HTTP sí te da — caching, verbos, códigos."
    },
    {
      a: "GraphQL", b: "OData",
      cols: [
        { name: "GraphQL", text: "Query language propio sobre POST a un endpoint. Schema en SDL, un grafo de tipos, subscriptions. Rey del ecosistema JS/móvil. Sacrifica el caching HTTP." },
        { name: "OData", text: "Gramática de consulta ($filter, $expand) sobre REST/GET. $metadata estándar, cacheable por HTTP. Fuerte en Microsoft/SAP y en conectar BI (Excel, Power BI)." }
      ],
      verdict: "Los dos dan «consulta flexible». GraphQL cambia caching por un grafo y un ecosistema de tooling moderno; OData conserva el GET cacheable y los conectores enterprise. Eliges por dónde vives, no por cuál es «mejor»."
    },
    {
      a: "WebSockets", b: "SSE",
      cols: [
        { name: "WebSockets", text: "Canal full-duplex sobre TCP tras un upgrade. Ambos lados empujan. Binario o texto. Tú inventas el protocolo, la reconexión y el estado. Más potencia, más costo operativo." },
        { name: "SSE", text: "Stream unidireccional server→cliente sobre HTTP normal. EventSource nativo, reconexión automática con Last-Event-ID. Solo texto. Muchísimo más simple." }
      ],
      verdict: "Pregunta una cosa: ¿el cliente necesita empujar en vivo por el mismo canal? Si no —y casi nunca—, SSE. El reflejo de ir directo a WebSockets para «tiempo real» es sobre-ingeniería en la mayoría de los dashboards."
    },
    {
      a: "Webhooks", b: "Polling",
      cols: [
        { name: "Webhooks", text: "El proveedor te hace un POST cuando algo pasa. Cero latencia de sondeo, pero necesitas endpoint público, idempotencia y manejar reintentos y duplicados." },
        { name: "Polling", text: "Tú preguntas cada X «¿ya?». Trivial de implementar y sin endpoint expuesto, pero latencia = tu intervalo, y quemas requests devolviendo «todavía no» el 99% de las veces." }
      ],
      verdict: "Webhooks para enterarte al instante sin desperdiciar viajes; polling cuando no puedes exponer un endpoint o el evento es raro y tolera retraso. Muchos SaaS ofrecen ambos por algo: no siempre puedes recibir un webhook."
    },
    {
      a: "gRPC", b: "tRPC",
      cols: [
        { name: "gRPC", text: "Contrato en protobuf, codegen para ~10 lenguajes, binario sobre HTTP/2, streaming. Políglota y validado en runtime. Infra: proxies, generación de código, HTTP/2." },
        { name: "tRPC", text: "Los tipos de TypeScript SON el contrato, inferidos sin codegen. Solo TS en ambas puntas, solo en build-time. Cero infra, productividad brutal dentro del monorepo." }
      ],
      verdict: "Nombres parecidos, mundos opuestos. gRPC es para sistemas políglotas que cruzan procesos y lenguajes; tRPC es pegamento tipado entre tu front y tu back de TS. Si alguien no-TS va a llamar la API, tRPC ni siquiera está en la conversación."
    },
    {
      a: "SOAP", b: "REST",
      cols: [
        { name: "SOAP", text: "Envelope XML + WSDL rígido + WS-* (seguridad, transacciones a nivel mensaje). Contrato formal y verificable, pesado y ceremonioso. Independiente del transporte." },
        { name: "REST", text: "Recursos sobre HTTP con JSON, ligero y ergonómico. Caching gratis, curva plana, contrato laxo (OpenAPI opcional). Ganó la web pública por comodidad." }
      ],
      verdict: "REST ganó la web abierta porque la ergonomía venció al formalismo. SOAP no murió: sobrevive donde el contrato formal y WS-Security pesan más que la comodidad —banca, gobierno, seguros, EDI—. Ahí, su rigidez es una feature, no un defecto."
    }
  ];

})(window.GUIA = window.GUIA || {});
