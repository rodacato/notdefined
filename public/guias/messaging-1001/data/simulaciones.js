/* ============================================================
   data/simulaciones.js — el GUIÓN de cada simulación.
   El motor (js/components.js) es tonto: aquí viven los pasos.
   Cada paso es un snapshot COMPLETO de la escena; el motor
   difería por id de token y anima el movimiento (FLIP).
   Regla: cada paso cambia UNA sola cosa visible + narración.
   Deterministas: sin Math.random, sin relojes.

   Token: { id, lane, st, label, sub? }
     st ∈ viaje | ok | dup | perdido | veneno | retenido | ack
   Lane roles: productor | broker | consumidor | neutral
   ============================================================ */
(function (G) {
  "use strict";

  G.simulaciones = {

    /* ---------------------------------------------------------
       LA JOYA: at-least-once, el ack perdido, el doble cobro,
       y la defensa con idempotencia. 8 pasos.
       --------------------------------------------------------- */
    "el-duplicado": {
      title: "El duplicado",
      blurb: "At-least-once en vivo: el ack se pierde, el broker re-entrega y el consumidor cobra dos veces. Luego, la misma escena con idempotencia — donde el duplicado rebota inofensivo.",
      layout: "lanes",
      lanes: [
        { id: "prod",  label: "Productor",       role: "productor" },
        { id: "brk",   label: "Broker (cola)",   role: "broker" },
        { id: "cons",  label: "Consumidor",      role: "consumidor" },
        { id: "efec",  label: "Cobros (efecto)", role: "neutral" }
      ],
      steps: [
        { narr: "El productor emite <strong>M#42 · cobra $500</strong>.",
          tokens: [ { id: "m42", lane: "prod", st: "viaje", label: "M#42", sub: "$500" } ] },

        { narr: "El broker lo <strong>entrega</strong> al consumidor.",
          tokens: [ { id: "m42", lane: "cons", st: "viaje", label: "M#42", sub: "$500" } ] },

        { narr: "El consumidor procesa: <strong>cobra $500</strong> ✓.",
          tokens: [ { id: "m42", lane: "cons", st: "ok", label: "M#42", sub: "$500" },
                    { id: "c1", lane: "efec", st: "ok", label: "−$500", sub: "cobro 1" } ] },

        { narr: "El consumidor manda <strong>ACK</strong>… pero el ACK <strong>se pierde</strong> en la red.",
          tokens: [ { id: "m42", lane: "cons", st: "ok", label: "M#42", sub: "$500" },
                    { id: "c1", lane: "efec", st: "ok", label: "−$500", sub: "cobro 1" },
                    { id: "ack", lane: "cons", st: "perdido", label: "ACK", sub: "perdido" } ] },

        { narr: "El broker nunca vio el ack → <strong>re-entrega</strong> M#42. Llega un <strong>duplicado</strong>.",
          tokens: [ { id: "c1", lane: "efec", st: "ok", label: "−$500", sub: "cobro 1" },
                    { id: "m42d", lane: "cons", st: "dup", label: "M#42", sub: "duplicado" } ] },

        { narr: "Consumidor <strong>ingenuo</strong>: lo procesa otra vez y <strong>cobra $500 de nuevo</strong>. ✗ Doble cobro.",
          tokens: [ { id: "c1", lane: "efec", st: "ok", label: "−$500", sub: "cobro 1" },
                    { id: "m42d", lane: "cons", st: "dup", label: "M#42", sub: "duplicado" },
                    { id: "c2", lane: "efec", st: "perdido", label: "−$500", sub: "cobro DUP" } ] },

        { narr: "<strong>Rebobinemos con idempotencia.</strong> El consumidor guarda los ids ya cobrados. Vuelve a llegar el duplicado M#42…",
          tokens: [ { id: "c1", lane: "efec", st: "ok", label: "−$500", sub: "cobro 1" },
                    { id: "vistos", lane: "cons", st: "ack", label: "vistos", sub: "{ #42 }" },
                    { id: "m42d", lane: "cons", st: "dup", label: "M#42", sub: "duplicado" } ] },

        { narr: "…ya está en <strong>vistos</strong> → <strong>rebota inofensivo</strong>. Un solo cobro. Eso es <em>efectivamente-una-vez</em>.",
          tokens: [ { id: "c1", lane: "efec", st: "ok", label: "−$500", sub: "cobro 1" },
                    { id: "vistos", lane: "cons", st: "ack", label: "vistos", sub: "{ #42 }" },
                    { id: "m42d", lane: "brk", st: "ok", label: "M#42", sub: "descartado" } ] }
      ]
    },

    /* ---------------------------------------------------------
       COLA vs LOG lado a lado + replay. 7 pasos. layout split.
       --------------------------------------------------------- */
    "cola-vs-log": {
      title: "Cola vs log",
      blurb: "El mismo evento: consumido-y-borrado en la cola, vs retenido en el log con dos consumer groups leyendo a su ritmo — y el replay rebobinando el offset.",
      layout: "split",
      columns: [
        { title: "Cola", sub: "entrega y borra" },
        { title: "Log", sub: "retiene y re-lee" }
      ],
      lanes: [
        { id: "cq", label: "Cola", role: "broker", col: 0 },
        { id: "cc", label: "Consumidor", role: "consumidor", col: 0 },
        { id: "log", label: "Log (retiene)", role: "broker", col: 1 },
        { id: "ga", label: "Grupo A", role: "consumidor", col: 1 },
        { id: "gb", label: "Grupo B", role: "consumidor", col: 1 }
      ],
      steps: [
        { narr: "Llega el evento <strong>E1</strong>. La cola lo encola; el log lo <strong>anexa</strong> y lo conserva.",
          tokens: [ { id: "q_e1", lane: "cq", st: "viaje", label: "E1" },
                    { id: "l_e1", lane: "log", st: "retenido", label: "E1", sub: "off 0" } ] },

        { narr: "El consumidor de la cola <strong>lee E1</strong>. En el log, el <strong>Grupo A</strong> lee E1 — pero E1 <strong>sigue ahí</strong>.",
          tokens: [ { id: "q_e1", lane: "cc", st: "ok", label: "E1" },
                    { id: "l_e1", lane: "log", st: "retenido", label: "E1", sub: "off 0" },
                    { id: "ga_off", lane: "ga", st: "ok", label: "leyó E1", sub: "off→1" } ] },

        { narr: "La cola <strong>borra</strong> E1 tras el ack: no queda nada. En el log, el <strong>Grupo B</strong> apenas va llegando a E1.",
          tokens: [ { id: "l_e1", lane: "log", st: "retenido", label: "E1", sub: "off 0" },
                    { id: "ga_off", lane: "ga", st: "ok", label: "leyó E1", sub: "off→1" },
                    { id: "gb_off", lane: "gb", st: "ok", label: "leyó E1", sub: "off→1" } ] },

        { narr: "Llega <strong>E2</strong>. El log lo anexa detrás de E1 (que <strong>sigue guardado</strong>); la cola solo tiene E2.",
          tokens: [ { id: "q_e2", lane: "cq", st: "viaje", label: "E2" },
                    { id: "l_e1", lane: "log", st: "retenido", label: "E1", sub: "off 0" },
                    { id: "l_e2", lane: "log", st: "retenido", label: "E2", sub: "off 1" },
                    { id: "ga_off", lane: "ga", st: "ok", label: "leyó E1", sub: "off→1" },
                    { id: "gb_off", lane: "gb", st: "ok", label: "leyó E1", sub: "off→1" } ] },

        { narr: "El <strong>Grupo A</strong> lee E2 a su ritmo; el <strong>Grupo B</strong> va atrás. Cada grupo tiene <strong>su propio offset</strong>.",
          tokens: [ { id: "q_e2", lane: "cc", st: "ok", label: "E2" },
                    { id: "l_e1", lane: "log", st: "retenido", label: "E1", sub: "off 0" },
                    { id: "l_e2", lane: "log", st: "retenido", label: "E2", sub: "off 1" },
                    { id: "ga_off", lane: "ga", st: "ok", label: "leyó E2", sub: "off→2" },
                    { id: "gb_off", lane: "gb", st: "ok", label: "leyó E1", sub: "off→1" } ] },

        { narr: "<strong>Replay:</strong> el Grupo A <strong>rebobina su offset a 0</strong> y vuelve a leer E1 y E2. En la cola no hay <em>nada</em> que releer: se borró.",
          tokens: [ { id: "l_e1", lane: "log", st: "retenido", label: "E1", sub: "off 0" },
                    { id: "l_e2", lane: "log", st: "retenido", label: "E2", sub: "off 1" },
                    { id: "ga_off", lane: "ga", st: "dup", label: "seek→0", sub: "re-lee E1,E2" },
                    { id: "gb_off", lane: "gb", st: "ok", label: "leyó E1", sub: "off→1" } ] },

        { narr: "Esa es toda la diferencia: la <strong>cola empuja y olvida</strong>; el <strong>log retiene y deja rebobinar</strong>. El replay es la superpotencia del log.",
          tokens: [ { id: "l_e1", lane: "log", st: "retenido", label: "E1", sub: "off 0" },
                    { id: "l_e2", lane: "log", st: "retenido", label: "E2", sub: "off 1" },
                    { id: "ga_off", lane: "ga", st: "ok", label: "al día", sub: "off→2" },
                    { id: "gb_off", lane: "gb", st: "ok", label: "al día", sub: "off→2" } ] }
      ]
    },

    /* ---------------------------------------------------------
       PARTICIONES Y ORDEN (Kafka). 6 pasos.
       --------------------------------------------------------- */
    "particiones": {
      title: "Particiones y orden",
      blurb: "Por qué Kafka ordena por partición y no global: la key rutea el mensaje, y el rebalance del consumer group reasigna particiones en vivo.",
      layout: "lanes",
      lanes: [
        { id: "prod", label: "Productor", role: "productor" },
        { id: "p0", label: "Partición 0", role: "broker" },
        { id: "p1", label: "Partición 1", role: "broker" },
        { id: "cons", label: "Consumer group", role: "consumidor" }
      ],
      steps: [
        { narr: "El productor emite <strong>A1</strong> con key <strong>cuenta-7</strong>. La <strong>key</strong> decide la partición.",
          tokens: [ { id: "a1", lane: "prod", st: "viaje", label: "A1", sub: "cuenta-7" } ] },

        { narr: "hash(cuenta-7) cae en <strong>Partición 1</strong>.",
          tokens: [ { id: "a1", lane: "p1", st: "retenido", label: "A1", sub: "cuenta-7" } ] },

        { narr: "Llega <strong>B1</strong> con key <strong>cuenta-3</strong> → cae en <strong>Partición 0</strong>. Otra cuenta, otra partición.",
          tokens: [ { id: "a1", lane: "p1", st: "retenido", label: "A1", sub: "cuenta-7" },
                    { id: "b1", lane: "p0", st: "retenido", label: "B1", sub: "cuenta-3" } ] },

        { narr: "<strong>A2</strong> (cuenta-7 otra vez) cae en P1, <strong>detrás de A1</strong>: el orden de una cuenta está <strong>garantizado</strong> — dentro de su partición.",
          tokens: [ { id: "a1", lane: "p1", st: "retenido", label: "A1", sub: "cuenta-7" },
                    { id: "a2", lane: "p1", st: "retenido", label: "A2", sub: "cuenta-7" },
                    { id: "b1", lane: "p0", st: "retenido", label: "B1", sub: "cuenta-3" } ] },

        { narr: "El grupo asigna <strong>un consumidor por partición</strong>: C1 lee P0, C2 lee P1. No hay orden <em>global</em> entre P0 y P1.",
          tokens: [ { id: "a1", lane: "p1", st: "retenido", label: "A1", sub: "cuenta-7" },
                    { id: "a2", lane: "p1", st: "retenido", label: "A2", sub: "cuenta-7" },
                    { id: "b1", lane: "p0", st: "retenido", label: "B1", sub: "cuenta-3" },
                    { id: "c1", lane: "cons", st: "ok", label: "C1", sub: "lee P0" },
                    { id: "c2", lane: "cons", st: "ok", label: "C2", sub: "lee P1" } ] },

        { narr: "C2 <strong>cae</strong> → <strong>rebalance</strong>: C1 asume P0 y P1. El orden por cuenta se mantiene; el grupo se recompone solo.",
          tokens: [ { id: "a1", lane: "p1", st: "retenido", label: "A1", sub: "cuenta-7" },
                    { id: "a2", lane: "p1", st: "retenido", label: "A2", sub: "cuenta-7" },
                    { id: "b1", lane: "p0", st: "retenido", label: "B1", sub: "cuenta-3" },
                    { id: "c1", lane: "cons", st: "ok", label: "C1", sub: "lee P0 + P1" },
                    { id: "c2", lane: "cons", st: "perdido", label: "C2", sub: "caído" } ] }
      ]
    },

    /* ---------------------------------------------------------
       DLQ: mensaje venenoso, reintentos, dead-letter. 6 pasos.
       --------------------------------------------------------- */
    "dlq": {
      title: "Dead-letter queue",
      blurb: "El mensaje venenoso que no se puede procesar: reintenta N veces y, al superar el máximo, cae a la dead-letter en vez de bloquear la cola para siempre.",
      layout: "lanes",
      lanes: [
        { id: "brk", label: "Cola", role: "broker" },
        { id: "cons", label: "Consumidor", role: "consumidor" },
        { id: "dlq", label: "Dead-letter", role: "neutral" }
      ],
      steps: [
        { narr: "Llega <strong>M#7</strong> con un payload corrupto: un <strong>mensaje venenoso</strong> (aún no lo sabemos).",
          tokens: [ { id: "m7", lane: "brk", st: "viaje", label: "M#7", sub: "payload ✗" } ] },

        { narr: "El consumidor lo procesa y <strong>falla</strong>. Sin ack, vuelve a la cola.",
          tokens: [ { id: "m7", lane: "cons", st: "veneno", label: "M#7", sub: "falla 1/3" } ] },

        { narr: "<strong>Reintento 2/3.</strong> Falla otra vez — el dato sigue corrupto.",
          tokens: [ { id: "m7", lane: "cons", st: "veneno", label: "M#7", sub: "falla 2/3" } ] },

        { narr: "<strong>Reintento 3/3.</strong> Falla. Se agotan los intentos.",
          tokens: [ { id: "m7", lane: "cons", st: "veneno", label: "M#7", sub: "falla 3/3" } ] },

        { narr: "Superó el máximo → el broker lo manda a la <strong>dead-letter queue</strong>.",
          tokens: [ { id: "m7", lane: "dlq", st: "veneno", label: "M#7", sub: "dead-letter" } ] },

        { narr: "La cola <strong>queda libre</strong> para el resto. El veneno se inspecciona aparte, sin bloquear a nadie.",
          tokens: [ { id: "m7", lane: "dlq", st: "veneno", label: "M#7", sub: "en cuarentena" },
                    { id: "m8", lane: "cons", st: "ok", label: "M#8", sub: "procesa ✓" } ] }
      ]
    },

    /* ---------------------------------------------------------
       OUTBOX vs dual-write. 7 pasos.
       --------------------------------------------------------- */
    "outbox": {
      title: "Outbox vs dual-write",
      blurb: "El dual-write pierde eventos cuando el proceso muere entre la escritura al dominio y la publicación. El outbox escribe el evento en la misma transacción y lo publica después.",
      layout: "lanes",
      lanes: [
        { id: "db", label: "Transacción (DB)", role: "broker" },
        { id: "pub", label: "Relay / publicador", role: "productor" },
        { id: "brk", label: "Broker", role: "consumidor" }
      ],
      steps: [
        { narr: "<strong>Dual-write:</strong> primero escribes el <strong>dominio</strong> en la DB.",
          tokens: [ { id: "dom", lane: "db", st: "ok", label: "orden", sub: "guardada" } ] },

        { narr: "Luego, por separado, publicas el <strong>evento</strong> al broker.",
          tokens: [ { id: "dom", lane: "db", st: "ok", label: "orden", sub: "guardada" },
                    { id: "ev", lane: "pub", st: "viaje", label: "evento", sub: "publicando" } ] },

        { narr: "El proceso <strong>muere</strong> entre ambos pasos → el evento <strong>nunca sale</strong>. DB y broker quedan <strong>inconsistentes</strong>.",
          tokens: [ { id: "dom", lane: "db", st: "ok", label: "orden", sub: "guardada" },
                    { id: "ev", lane: "pub", st: "perdido", label: "evento", sub: "perdido" } ] },

        { narr: "<strong>Rebobinemos con outbox.</strong> En la <strong>misma transacción</strong> escribes el dominio <em>y</em> una fila en la tabla outbox.",
          tokens: [ { id: "dom", lane: "db", st: "ok", label: "orden", sub: "guardada" },
                    { id: "row", lane: "db", st: "retenido", label: "outbox", sub: "fila evento" } ] },

        { narr: "La transacción <strong>commitea las dos o ninguna</strong>. Atómico: es imposible tener una sin la otra.",
          tokens: [ { id: "dom", lane: "db", st: "ok", label: "orden", sub: "commit ✓" },
                    { id: "row", lane: "db", st: "ok", label: "outbox", sub: "commit ✓" } ] },

        { narr: "Un <strong>relay</strong> lee la fila outbox y <strong>publica</strong> el evento al broker.",
          tokens: [ { id: "dom", lane: "db", st: "ok", label: "orden", sub: "commit ✓" },
                    { id: "row", lane: "db", st: "ok", label: "outbox", sub: "leída" },
                    { id: "ev", lane: "pub", st: "viaje", label: "evento", sub: "relay" } ] },

        { narr: "Publicado, marca la fila. Si el relay muere, <strong>reintenta</strong> (at-least-once) → cero eventos perdidos.",
          tokens: [ { id: "dom", lane: "db", st: "ok", label: "orden", sub: "commit ✓" },
                    { id: "row", lane: "db", st: "ok", label: "outbox", sub: "enviada ✓" },
                    { id: "ev", lane: "brk", st: "ok", label: "evento", sub: "entregado" } ] }
      ]
    },

    /* ---------------------------------------------------------
       BACKPRESSURE: consumidor lento, cola creciendo. 7 pasos.
       --------------------------------------------------------- */
    "backpressure": {
      title: "Backpressure",
      blurb: "El consumidor no alcanza al productor: la cola crece. Sin límite, revienta; con límite, el sistema frena al productor y se degrada con gracia.",
      layout: "lanes",
      lanes: [
        { id: "prod", label: "Productor (rápido)", role: "productor" },
        { id: "brk", label: "Cola", role: "broker" },
        { id: "cons", label: "Consumidor (lento)", role: "consumidor" }
      ],
      steps: [
        { narr: "El productor es <strong>rápido</strong>: mete mensajes a buen ritmo. La cola empieza a llenarse.",
          tokens: [ { id: "m1", lane: "brk", st: "viaje", label: "1" },
                    { id: "m2", lane: "brk", st: "viaje", label: "2" } ] },

        { narr: "El consumidor es <strong>lento</strong>: procesa uno mientras entran dos. El saldo crece.",
          tokens: [ { id: "m1", lane: "cons", st: "ok", label: "1" },
                    { id: "m2", lane: "brk", st: "viaje", label: "2" },
                    { id: "m3", lane: "brk", st: "viaje", label: "3" },
                    { id: "m4", lane: "brk", st: "viaje", label: "4" } ] },

        { narr: "La cola sigue <strong>creciendo</strong>: el consumidor no alcanza.",
          tokens: [ { id: "m1", lane: "cons", st: "ok", label: "1" },
                    { id: "m2", lane: "brk", st: "viaje", label: "2" },
                    { id: "m3", lane: "brk", st: "viaje", label: "3" },
                    { id: "m4", lane: "brk", st: "viaje", label: "4" },
                    { id: "m5", lane: "brk", st: "viaje", label: "5" },
                    { id: "m6", lane: "brk", st: "viaje", label: "6" } ] },

        { narr: "<strong>Sin límite:</strong> la cola crece sin techo → memoria y latencia por las nubes → el broker <strong>cae</strong> y se pierden mensajes.",
          tokens: [ { id: "m2", lane: "brk", st: "perdido", label: "2" },
                    { id: "m3", lane: "brk", st: "perdido", label: "3" },
                    { id: "m4", lane: "brk", st: "perdido", label: "4" },
                    { id: "m5", lane: "brk", st: "perdido", label: "5" },
                    { id: "m6", lane: "brk", st: "perdido", label: "6" } ] },

        { narr: "<strong>Rebobinemos con backpressure.</strong> La cola tiene un <strong>límite</strong> de tamaño.",
          tokens: [ { id: "m1", lane: "cons", st: "ok", label: "1" },
                    { id: "m2", lane: "brk", st: "viaje", label: "2" },
                    { id: "m3", lane: "brk", st: "viaje", label: "3", sub: "tope" } ] },

        { narr: "Llena hasta el tope → el broker <strong>frena al productor</strong> (bloquea o rechaza). No entra más de lo que aguanta.",
          tokens: [ { id: "m2", lane: "brk", st: "viaje", label: "2" },
                    { id: "m3", lane: "brk", st: "viaje", label: "3", sub: "tope" },
                    { id: "mp", lane: "prod", st: "veneno", label: "prod", sub: "frenado" } ] },

        { narr: "El sistema se <strong>degrada con gracia</strong> en vez de reventar. La presión viaja hacia atrás: eso es backpressure.",
          tokens: [ { id: "m2", lane: "cons", st: "ok", label: "2" },
                    { id: "m3", lane: "brk", st: "viaje", label: "3" },
                    { id: "mp", lane: "prod", st: "ok", label: "prod", sub: "reanuda" } ] }
      ]
    }

  };

  // Orden de la galería de simulaciones
  G.simOrden = ["el-duplicado", "cola-vs-log", "particiones", "dlq", "outbox", "backpressure"];

})(window.GUIA = window.GUIA || {});
