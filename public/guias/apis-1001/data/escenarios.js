/* ==========================================================================
   data/escenarios.js — Comparador de escenario
   Números MODELADOS (órdenes de magnitud), evaluados en G.fechaEval.
   No son benchmarks: son estimaciones razonadas para comparar formas, no
   productos. Cada plan declara sus totales honestos; los `trips` son sólo
   para la animación (una muestra representativa).
     setup  = round-trips en el camino crítico hasta el 1er dato útil
     viajes = round-trips totales para completar la tarea
     bytes  = payload total aproximado de la tarea (una dirección + otra)
   Latencia al primer dato = setup × RTT (el RTT lo pone el usuario).
   ========================================================================== */
(function (G) {
  "use strict";

  G.escenarios = [
    {
      id: "app-movil",
      titulo: "App móvil: perfil + últimos 3 pedidos + envío en vivo",
      descripcion: "Una pantalla que necesita datos de tres recursos distintos, sobre una red móvil. La joya: mira cómo el número de viajes define la latencia percibida.",
      rttDefault: "4g",
      metrica: "carga",
      planes: {
        rest: {
          setup: 3, viajes: 3, bytes: 1055,
          nota: "Tres recursos, tres viajes secuenciales. El estado «en vivo» todavía exige polling o un canal aparte encima.",
          trips: [
            { dir: "req", label: "GET /users/42", bytes: 90 },
            { dir: "res", label: "user", bytes: 180 },
            { dir: "req", label: "GET /users/42/orders", bytes: 95 },
            { dir: "res", label: "[orders]", bytes: 420 },
            { dir: "req", label: "GET /shipments?order=…", bytes: 110 },
            { dir: "res", label: "shipment", bytes: 160 }
          ]
        },
        graphql: {
          setup: 1, viajes: 1, bytes: 790,
          nota: "Una query trae perfil, pedidos y envío. El servidor paga el N+1 por dentro; la red hace un solo viaje.",
          trips: [
            { dir: "req", label: "query { user{ orders{ shipment }}}", bytes: 150 },
            { dir: "res", label: "{ data }", bytes: 640 }
          ]
        },
        odata: {
          setup: 1, viajes: 1, bytes: 700,
          nota: "$expand compone todo en un GET — y, a diferencia de GraphQL, la respuesta es cacheable por HTTP.",
          trips: [
            { dir: "req", label: "GET /Users?$expand=Orders($expand=Shipment)", bytes: 160 },
            { dir: "res", label: "{ value:[…] }", bytes: 540 }
          ]
        },
        grpc: {
          setup: 1, viajes: 1, bytes: 340,
          nota: "Un endpoint agregador devuelve todo en protobuf: el más liviano en bytes. En móvil necesita gRPC-Web + proxy.",
          trips: [
            { dir: "req", label: "GetProfileView · protobuf", bytes: 60 },
            { dir: "res", label: "ProfileView · bin", bytes: 280 }
          ]
        }
      }
    },

    {
      id: "s2s",
      titulo: "Servicio-a-servicio: una lectura de catálogo (×500/s)",
      descripcion: "Tráfico interno de alta frecuencia entre microservicios. Aquí cada byte y cada milisegundo de CPU se multiplican por miles. La red es rápida; lo que pesa es el payload.",
      rttDefault: "lan",
      metrica: "carga",
      planes: {
        rest: {
          setup: 1, viajes: 1, bytes: 620,
          nota: "JSON legible pero pesado: los nombres de campo viajan en cada respuesta, y a ×500/s serializar y parsear también cobra CPU.",
          trips: [
            { dir: "req", label: "GET /products/882", bytes: 210 },
            { dir: "res", label: "200 · { product } JSON", bytes: 410 }
          ]
        },
        jsonrpc: {
          setup: 1, viajes: 1, bytes: 560,
          nota: "Mismo orden que REST en bytes; su as bajo la manga es el batch: varias lecturas en un solo viaje.",
          trips: [
            { dir: "req", label: "{ method:'getProduct', id }", bytes: 180 },
            { dir: "res", label: "{ result }", bytes: 380 }
          ]
        },
        grpc: {
          setup: 1, viajes: 1, bytes: 175,
          nota: "Protobuf sobre HTTP/2: ~70% menos bytes que el JSON equivalente y la conexión se reutiliza. Aquí gana claro.",
          trips: [
            { dir: "req", label: "GetProduct · protobuf", bytes: 45 },
            { dir: "res", label: "Product · bin", bytes: 130 }
          ]
        }
      }
    },

    {
      id: "dashboard",
      titulo: "Dashboard en vivo: 60 actualizaciones en 60 s",
      descripcion: "Un precio que cambia ~1×/segundo durante un minuto. El protocolo request-respuesta se ahoga en viajes; el push amortiza todo en un solo canal.",
      rttDefault: "4g",
      metrica: "vivo",
      planes: {
        rest: {
          setup: 1, viajes: 60, bytes: 26400,
          nota: "Polling cada segundo: 60 viajes, la mayoría devolviendo «sin cambios». Simple y derrochador.",
          trips: [
            { dir: "req", label: "GET /price", bytes: 200 },
            { dir: "res", label: "{ price }", bytes: 240 },
            { dir: "req", label: "GET /price … ×60", bytes: 200, repeat: true }
          ]
        },
        longpolling: {
          setup: 1, viajes: 60, bytes: 26000,
          nota: "Un ciclo colgado por update: latencia buena, pero re-mandas todos los headers 60 veces.",
          trips: [
            { dir: "req", label: "GET /price (cuelga)", bytes: 200 },
            { dir: "res", label: "{ price } al cambiar", bytes: 240 },
            { dir: "req", label: "reconecta … ×60", bytes: 200, repeat: true }
          ]
        },
        sse: {
          setup: 1, viajes: 1, bytes: 1500,
          nota: "Un setup y 60 eventos diminutos por el mismo stream. Reconecta solo con Last-Event-ID.",
          trips: [
            { dir: "req", label: "GET /prices · event-stream", bytes: 180 },
            { dir: "res", label: "data: { price } ×60", bytes: 22, repeat: true }
          ]
        },
        websockets: {
          setup: 1, viajes: 1, bytes: 1900,
          nota: "Handshake y luego frames. Bidireccional de sobra: aquí solo empujas del server — casi mejor SSE.",
          trips: [
            { dir: "req", label: "Upgrade: websocket", bytes: 200 },
            { dir: "res", label: "101 Switching", bytes: 150 },
            { dir: "res", label: "← { price } frame ×60", bytes: 26, repeat: true }
          ]
        }
      }
    }
  ];

  G.escenarioPorId = {};
  G.escenarios.forEach(function (e) { G.escenarioPorId[e.id] = e; });

})(window.GUIA = window.GUIA || {});
