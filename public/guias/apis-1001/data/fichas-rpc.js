/* ==========================================================================
   data/fichas-rpc.js — Familia II · RPC tipado moderno
   gRPC · tRPC
   ========================================================================== */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.grpc = {
    contratoTag: "Protobuf (.proto)",
    contrato: "Protocol Buffers: un archivo .proto define servicios, métodos y mensajes con tipos y números de campo. De ahí se genera cliente y servidor en cualquier lenguaje. Contrato fuerte, binario y verificado.",
    transporte: "HTTP/2 · Protobuf binario",
    gana: [
      "Payload binario compacto: ~60–80% menos bytes que JSON en tráfico servicio-a-servicio.",
      "HTTP/2 multiplexado: muchas llamadas por una conexión, sin head-of-line de HTTP/1.",
      "Streaming de primera clase: server, client y bidireccional.",
      "Codegen fuerte en ~10 lenguajes: el contrato no se puede violar por accidente."
    ],
    paga: [
      "El browser no habla gRPC directo: necesitas gRPC-Web y un proxy.",
      "Binario = no lo lees con curl; necesitas herramientas (grpcurl, reflection).",
      "Sin caching HTTP: los intermediarios no entienden el payload.",
      "Infra y curva: HTTP/2, proxies, generación de código en el pipeline."
    ],
    cuandoNo: [
      "Es una API pública para terceros que esperan REST/JSON y curl — la fricción no vale.",
      "El consumidor es un browser sin capa de proxy — usa REST o tRPC.",
      "Es un CRUD de baja frecuencia donde los bytes no importan; gRPC es sobre-ingeniería."
    ],
    parientes: [
      { nombre: "tRPC", desc: "RPC tipado también, pero sin codegen y atado a TypeScript. Ver diferencia.", link: "#/desambiguacion" },
      { nombre: "SOAP", desc: "El «RPC con contrato fuerte» de la generación anterior, en XML.", link: "#/ficha/soap" },
      { nombre: "APIs de eventos", desc: "Cuando el s2s deja de ser petición-respuesta y pasa a streams.", link: "#/ficha/eventos" },
      { nombre: "Cliente-Servidor", desc: "El estilo de arquitectura debajo de todo request-response (Tomo II).", link: "/guias/architectures-1001/#/familia/3/cliente-servidor" }
    ],
    ratings: { contrato: 7, caching: 1, tooling: 6, adopcion: 4, overhead: 2, realtime: 6, evolucion: 6 },
    verdict: "El estándar de facto puertas adentro. Entre tus microservicios es difícil justificar JSON sobre HTTP cuando gRPC te ahorra bytes, CPU y bugs de contrato. Puertas afuera, casi nunca.",
    sim: {
      titulo: "Dos llamadas multiplexadas en una conexión HTTP/2",
      actors: [
        { id: "a", label: "Servicio A", role: "client" },
        { id: "b", label: "Servicio B", role: "server" }
      ],
      steps: [
        { from: "a", to: "b", dir: "right", kind: "open", label: "HTTP/2 · conn", bytes: "1×", narracion: "Se abre UNA conexión HTTP/2 y se reutiliza para todo lo que venga." },
        { from: "a", to: "b", dir: "right", kind: "req", label: "GetUser · protobuf", bytes: "~30 B", narracion: "Mensaje protobuf binario: sin llaves ni nombres de campo, solo números de campo." },
        { from: "a", to: "b", dir: "right", kind: "req", label: "GetOrders · protobuf", bytes: "~26 B", narracion: "Segunda llamada multiplexada en LA MISMA conexión, en paralelo con la anterior." },
        { from: "b", to: "a", dir: "left", kind: "res", label: "user · bin", bytes: "~120 B", narracion: "Vuelve el primer response, binario y compacto — una fracción del JSON equivalente." },
        { from: "b", to: "a", dir: "left", kind: "frame", label: "orders · frame 1/2", bytes: "~90 B", narracion: "GetOrders es server-streaming: los pedidos llegan en frames por el canal." },
        { from: "b", to: "a", dir: "left", kind: "frame", label: "orders · frame 2/2", bytes: "~85 B", narracion: "Segundo frame, mismo canal. Sin handshakes nuevos, sin overhead de texto." }
      ]
    }
  };

  G.fichas.trpc = {
    contratoTag: "Tipos de TypeScript",
    contrato: "No hay esquema ni codegen: los tipos de TypeScript del servidor SON el contrato, y el cliente los infiere directo por import de tipos. Contrato fortísimo… pero solo dentro del mundo TS y solo en tiempo de compilación.",
    transporte: "HTTP · JSON (con superjson opcional)",
    gana: [
      "Type-safety end-to-end sin generar nada: cambias el server y el client deja de compilar.",
      "Autocompletado y refactors atómicos: es como llamar una función local.",
      "Cero boilerplate: sin OpenAPI, sin .proto, sin SDK que mantener.",
      "Integración directa con React Query para caching de cliente."
    ],
    paga: [
      "TypeScript en las dos puntas o no hay magia. Adiós clientes en Go, Python, móvil nativo.",
      "El contrato existe solo en build: en runtime es JSON sin validar (salvo que sumes zod).",
      "Acopla client y server al mismo repo/versión de tipos; no es para APIs públicas.",
      "Sin los beneficios HTTP: es POST/GET opaco, sin caching de recursos."
    ],
    cuandoNo: [
      "Cualquier consumidor no-TypeScript va a tocar la API — quedas fuera de juego.",
      "Es una API pública con clientes que no controlas — usa REST/OpenAPI o gRPC.",
      "Necesitas validación de contrato en runtime garantizada por el protocolo."
    ],
    parientes: [
      { nombre: "gRPC", desc: "Contrato fuerte también, pero políglota y en runtime. Ver diferencia.", link: "#/desambiguacion" },
      { nombre: "GraphQL", desc: "Otra ruta al type-safety en front, vía SDL + codegen.", link: "#/ficha/graphql" },
      { nombre: "JSON-RPC", desc: "El mismo modelo «llamar métodos», sin la magia de tipos.", link: "#/ficha/jsonrpc" }
    ],
    ratings: { contrato: 6, caching: 2, tooling: 5, adopcion: 6, overhead: 4, realtime: 3, evolucion: 4 },
    verdict: "Dentro de un monorepo full-stack de TypeScript es casi imbatible por productividad. El pedo es que fuera de ahí no existe. No es una API: es un pegamento tipado entre tu front y tu back.",
    sim: {
      titulo: "Llamar un procedure tipado — y el error que nunca llega a prod",
      actors: [
        { id: "cli", label: "Front (TS)", role: "client" },
        { id: "srv", label: "Back (TS)", role: "server" }
      ],
      steps: [
        { from: "cli", to: "srv", dir: "right", kind: "req", label: "user.get.query(42)", bytes: "~70 B", narracion: "Llamas el procedure como una función TS normal: autocompletado y tipos del server, sin cliente generado." },
        { from: "srv", to: "cli", dir: "left", kind: "res", label: "{ user } : User", bytes: "~180 B", narracion: "Bajo el capó es HTTP+JSON; arriba, el tipo de retorno se infiere del server automáticamente." },
        { from: "cli", to: "cli", dir: "right", kind: "fail", label: "tsc ✗  esperaba number", bytes: "build", narracion: "Pasas user.get.query('42') y tsc lo caza en tu editor. El bug muere en build, no en producción." }
      ]
    }
  };

})(window.GUIA = window.GUIA || {});
