/* ==========================================================================
   data/fichas-tiempo-real.js — Familia IV · Tiempo real / push
   WebSockets · SSE · Long polling (histórico)
   ========================================================================== */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.websockets = {
    contratoTag: "Ninguno (tú lo defines)",
    contrato: "El protocolo WebSocket estandariza el canal, no lo que viaja por dentro. El contrato de mensajes lo inventas tú: JSON ad-hoc, un sub-protocolo, o algo como GraphQL subscriptions encima. Cero validación de fábrica.",
    transporte: "TCP vía upgrade HTTP · frames binarios o texto",
    gana: [
      "Full-duplex real: cliente y servidor empujan cuando quieren, por el mismo canal.",
      "Baja latencia y poco overhead por mensaje una vez abierto.",
      "Ideal para interacción viva: chat, juegos, edición colaborativa, trading.",
      "Un solo canal reemplaza decenas de requests de polling."
    ],
    paga: [
      "Conexiones con estado: escalar y balancear es más difícil que HTTP sin estado.",
      "No hay caching, ni semántica HTTP, ni contrato: reinventas todo por dentro.",
      "Reconexión, heartbeats y reenvío de estado son tu problema.",
      "Si el flujo es solo servidor→cliente, es más máquina de la necesaria (usa SSE)."
    ],
    cuandoNo: [
      "El flujo es unidireccional server→cliente — SSE es más simple y reconecta solo.",
      "Actualizaciones esporádicas donde un polling ocasional basta.",
      "No puedes sostener conexiones persistentes por infra o costo."
    ],
    parientes: [
      { nombre: "SSE", desc: "Push unidireccional y más simple. Ver cuándo cada uno.", link: "#/desambiguacion" },
      { nombre: "Long polling", desc: "El truco que WebSockets volvió obsoleto.", link: "#/ficha/longpolling" },
      { nombre: "MQTT", desc: "Pub/sub que a veces corre sobre WebSockets.", link: "#/ficha/mqtt" }
    ],
    ratings: { contrato: 1, caching: 1, tooling: 5, adopcion: 4, overhead: 2, realtime: 7, evolucion: 2 },
    verdict: "La respuesta correcta cuando de verdad necesitas bidireccional en vivo. Si solo empujas del server al cliente, WebSockets es sobre-ingeniería con costo operativo: baja a SSE.",
    sim: {
      titulo: "Handshake, y luego frames en ambos sentidos",
      actors: [
        { id: "cli", label: "Cliente", role: "client" },
        { id: "srv", label: "Servidor", role: "server" }
      ],
      steps: [
        { from: "cli", to: "srv", dir: "right", kind: "open", label: "GET /ws · Upgrade: websocket", bytes: "~200 B", narracion: "Empieza como un GET normal con cabecera Upgrade: pide cambiar de protocolo." },
        { from: "srv", to: "cli", dir: "left", kind: "open", label: "101 Switching Protocols", bytes: "~150 B", narracion: "El server acepta con 101. A partir de aquí ya no es HTTP: es un canal crudo persistente." },
        { from: "cli", to: "srv", dir: "right", kind: "frame", label: "→ { subscribe: 'envio/42' }", bytes: "~28 B", narracion: "El cliente manda un frame. Sin cabeceras HTTP: solo el payload, mínimo overhead." },
        { from: "srv", to: "cli", dir: "left", kind: "frame", label: "← { estado: 'en_ruta' }", bytes: "~30 B", narracion: "El server empuja cuando cambia el estado, sin que el cliente vuelva a pedir." },
        { from: "srv", to: "cli", dir: "left", kind: "frame", label: "← { estado: 'cerca' }", bytes: "~26 B", narracion: "Otro frame por el mismo canal. Full-duplex: ambos hablan cuando tienen algo." },
        { from: "cli", to: "srv", dir: "right", kind: "frame", label: "→ { ack }", bytes: "~14 B", narracion: "El cliente responde por el mismo canal. Bidireccional de verdad, no dos tubos." }
      ]
    }
  };

  G.fichas.sse = {
    contratoTag: "Formato text/event-stream",
    contrato: "SSE estandariza el formato del stream (líneas data:, event:, id:, retry:) pero no el contenido de los eventos. El contrato de datos lo defines tú. La API de cliente (EventSource) es nativa del browser.",
    transporte: "HTTP · text/event-stream (unidireccional)",
    gana: [
      "Simplísimo: es HTTP normal que no cierra la respuesta. Pasa por proxies y firewalls.",
      "Reconexión automática con Last-Event-ID: retoma donde iba, sin código tuyo.",
      "EventSource es nativo del browser; nada que instalar.",
      "Perfecto para feeds server→cliente: notificaciones, progreso, precios, logs."
    ],
    paga: [
      "Unidireccional: para mandar al server usas HTTP aparte.",
      "Solo texto (UTF-8); binario hay que codificarlo (base64) y engorda.",
      "Límite de conexiones por dominio en HTTP/1.1 (mitigado con HTTP/2).",
      "Sin el músculo de WebSockets para interacción intensa bidireccional."
    ],
    cuandoNo: [
      "Necesitas que el cliente también empuje en vivo — eso es WebSockets.",
      "El payload es binario pesado y frecuente — la codificación a texto duele.",
      "Es un evento cada varios minutos: un polling barato quizá basta."
    ],
    parientes: [
      { nombre: "WebSockets", desc: "Bidireccional y más pesado. Ver cuándo cada uno.", link: "#/desambiguacion" },
      { nombre: "Long polling", desc: "El antecesor que SSE reemplaza para push unidireccional.", link: "#/ficha/longpolling" }
    ],
    ratings: { contrato: 2, caching: 2, tooling: 5, adopcion: 6, overhead: 3, realtime: 6, evolucion: 3 },
    verdict: "El default olvidado del tiempo real. Antes de saltar a WebSockets, pregúntate si el flujo es solo server→cliente: casi siempre lo es, y SSE te da reconexión gratis con una décima parte del dolor.",
    sim: {
      titulo: "Stream unidireccional que se reconecta solo",
      actors: [
        { id: "cli", label: "Cliente", role: "client" },
        { id: "srv", label: "Servidor", role: "server" }
      ],
      steps: [
        { from: "cli", to: "srv", dir: "right", kind: "req", label: "GET /events · Accept: text/event-stream", bytes: "~180 B", narracion: "Un GET normal, pero pides text/event-stream: el server no cerrará la respuesta." },
        { from: "srv", to: "cli", dir: "left", kind: "open", label: "200 · stream abierto", bytes: "—", narracion: "El server mantiene la conexión abierta y va escribiendo eventos a su ritmo." },
        { from: "srv", to: "cli", dir: "left", kind: "frame", label: "data: { tick 1 }", bytes: "~22 B", narracion: "Primer evento empujado por el server. Unidireccional: el cliente no manda nada por aquí." },
        { from: "srv", to: "cli", dir: "left", kind: "frame", label: "data: { tick 2 }  id: 42", bytes: "~30 B", narracion: "Cada evento puede llevar un id, para saber por dónde ibas si algo se corta." },
        { from: "srv", to: "cli", dir: "left", kind: "fail", label: "✗ conexión perdida", bytes: "—", narracion: "Se cae la red a mitad del stream." },
        { from: "cli", to: "srv", dir: "right", kind: "open", label: "GET · Last-Event-ID: 42", bytes: "~190 B", narracion: "EventSource reconecta SOLO y manda Last-Event-ID: 42. Retoma sin perder eventos, sin código tuyo." }
      ]
    }
  };

  G.fichas.longpolling = {
    contratoTag: "Ninguno (sobre REST)",
    contrato: "No es un protocolo: es un patrón sobre HTTP normal. El servidor retiene la respuesta hasta tener algo que devolver. Contrato y formato son los de tu REST subyacente.",
    transporte: "HTTP · JSON (respuesta retenida)",
    gana: [
      "Funciona en cualquier lado: proxies viejos, firewalls corporativos, HTTP/1.0.",
      "Latencia mucho mejor que el polling normal: respondes apenas hay algo.",
      "Cero infra especial: es tu stack HTTP de siempre.",
      "Fallback razonable cuando WebSockets/SSE no están disponibles."
    ],
    paga: [
      "Desperdicia una conexión sostenida por cliente esperando sin datos.",
      "Cada ciclo re-manda todos los headers HTTP: overhead acumulado alto.",
      "Ventana de carrera entre respuesta y re-conexión: puedes perder eventos.",
      "Escalar miles de peticiones colgadas estresa el servidor."
    ],
    cuandoNo: [
      "Puedes usar SSE o WebSockets — casi siempre puedes, y son mejores.",
      "Alto volumen de clientes concurrentes: las conexiones colgadas te ahogan.",
      "Necesitas bidireccional o baja latencia sostenida."
    ],
    parientes: [
      { nombre: "SSE", desc: "El sucesor natural para push unidireccional.", link: "#/ficha/sse" },
      { nombre: "WebSockets", desc: "Lo que volvió histórico al long polling. Ver desambiguación.", link: "#/desambiguacion" }
    ],
    ratings: { contrato: 2, caching: 2, tooling: 6, adopcion: 6, overhead: 6, realtime: 3, evolucion: 3 },
    verdict: "Pieza de museo que todavía salva el día como fallback universal. Si tu infra no deja abrir SSE/WebSockets, sigue siendo la red de seguridad. Si sí deja, no lo elijas.",
    sim: {
      titulo: "Pedir y esperar colgado — el truco pre-WebSocket",
      actors: [
        { id: "cli", label: "Cliente", role: "client" },
        { id: "srv", label: "Servidor", role: "server" }
      ],
      steps: [
        { from: "cli", to: "srv", dir: "right", kind: "req", label: "GET /updates", bytes: "~200 B", narracion: "Pides actualizaciones. Pero todavía no hay nada nuevo que darte." },
        { from: "cli", to: "srv", dir: "right", kind: "open", label: "… servidor retiene …", bytes: "—", narracion: "El server NO responde: sostiene la petición abierta, esperando que pase algo." },
        { from: "srv", to: "cli", dir: "left", kind: "res", label: "200 · { evento }", bytes: "~240 B", narracion: "Aparece un evento y recién ahí responde. Baja latencia, pero gastaste una conexión esperando." },
        { from: "cli", to: "srv", dir: "right", kind: "req", label: "GET /updates (de nuevo)", bytes: "~200 B", narracion: "Apenas recibes, reconectas al instante — y re-mandas todos los headers otra vez." },
        { from: "srv", to: "cli", dir: "left", kind: "res", label: "200 · { evento 2 }", bytes: "~240 B", narracion: "Llega el segundo evento. Funciona hasta en proxies antiguos: por eso fue EL truco de su época." }
      ]
    }
  };

})(window.GUIA = window.GUIA || {});
