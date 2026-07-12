/* ==========================================================================
   data/ejes.js — Definiciones estables de la colección
   Ejes de rating (con polaridad), familias y presets de RTT del comparador.
   Editar aquí cambia toda la guía a la vez.
   ========================================================================== */
(function (G) {
  "use strict";

  // Los 7 ejes fijos con los que se califica cada estilo.
  // valor 0–7. polaridad 'up' = más es mejor; 'down' = menos es mejor (overhead).
  G.ejes = [
    { id: "contrato",  label: "Contrato / tipado",   pol: "up"   },
    { id: "caching",   label: "Caching HTTP",        pol: "up"   },
    { id: "tooling",   label: "Tooling / ecosistema", pol: "up"  },
    { id: "adopcion",  label: "Facilidad de adopción", pol: "up" },
    { id: "overhead",  label: "Overhead de payload", pol: "down" },
    { id: "realtime",  label: "Aptitud tiempo-real", pol: "up"   },
    { id: "evolucion", label: "Evolución / versionado", pol: "up" }
  ];

  // Familias del catálogo. El color es codificación de datos estable.
  G.familias = [
    { id: "http",       num: "I",   nombre: "Petición-respuesta clásico", nota: "El modelo HTTP de toda la vida: pides, esperas, recibes.",       famVar: "--fam-1" },
    { id: "rpc",        num: "II",  nombre: "RPC tipado moderno",         nota: "Llamas a una función remota; el contrato viaja en el tipo.",     famVar: "--fam-2" },
    { id: "consulta",   num: "III", nombre: "Orientadas a consulta",      nota: "El cliente describe qué datos quiere; el servidor los arma.",    famVar: "--fam-3" },
    { id: "tiemporeal", num: "IV",  nombre: "Tiempo real / push",         nota: "El canal queda abierto para que los datos lleguen solos.",       famVar: "--fam-4" },
    { id: "eventos",    num: "V",   nombre: "Asíncronas / eventos hacia afuera", nota: "El productor emite; quien quiera escucha, sin pedir.",    famVar: "--fam-5" }
  ];

  // Dolores para el catálogo problema-primero.
  G.dolores = [
    { id: "partner",   label: "Integración con partner enterprise" },
    { id: "s2s",       label: "Servicio-a-servicio de alta frecuencia" },
    { id: "dashboard", label: "Dashboard en vivo" },
    { id: "avisar",    label: "Avisar a terceros cuando algo pasa" },
    { id: "movil",     label: "App móvil con ancho de banda limitado" },
    { id: "typesafe",  label: "Type-safety end-to-end en TypeScript" },
    { id: "iot",       label: "IoT con batería y red pobres" }
  ];

  // Presets de latencia de ida y vuelta para el comparador.
  G.rttPresets = [
    { id: "lan", label: "LAN", ms: 10 },
    { id: "4g",  label: "4G",  ms: 80 },
    { id: "sat", label: "Satélite", ms: 300 }
  ];

  // Fecha de evaluación de los números de referencia — visible en la UI.
  G.fechaEval = "julio 2026";

  // Mapa rol de diagrama → variable de color CSS.
  G.roleVar = {
    client: "--role-client",
    server: "--role-server",
    broker: "--role-broker",
    third:  "--role-third",
    db:     "--role-db",
    fail:   "--role-fail"
  };

})(window.GUIA = window.GUIA || {});
