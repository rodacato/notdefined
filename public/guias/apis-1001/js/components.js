/* ==========================================================================
   js/components.js — Piezas compartidas
   · Simulador de conversación (diagrama de secuencia animado, data-driven)
   · Barras de ratings (7 ejes con polaridad)
   · Glifos de escala, chips, tarjeta de catálogo, cabecera de familia
   El MOTOR vive aquí; el GUIÓN de cada simulación vive en data/. Agregar un
   estilo no debería tocar este archivo.
   ========================================================================== */
(function (G) {
  "use strict";

  /* ---- Color de rol / familia ---------------------------------------- */
  G.famVarOf = function (famId) {
    var f = G.familias.filter(function (x) { return x.id === famId; })[0];
    return f ? "var(" + f.famVar + ")" : "var(--fam-1)";
  };
  G.familiaDe = function (famId) {
    return G.familias.filter(function (x) { return x.id === famId; })[0];
  };

  /* ---- Glifos de escala (contenido, no cromo) ------------------------- */
  G.complejidadGlyph = function (n) {
    var s = ""; for (var i = 0; i < 3; i++) s += (i < n ? "◆" : "◇"); return s;
  };
  G.FRECUENCIA = { nucleo: { g: "★", l: "núcleo" }, medio: { g: "◐", l: "uso medio" }, cola: { g: "○", l: "cola rara" } };

  /* ====================================================================
     SIMULADOR DE CONVERSACIÓN
     sim = { titulo, actors:[{id,label,role}], steps:[{from,to,dir,kind,label,bytes,narracion}] }
     Determinista: sin Math.random. Cada paso revela UN mensaje nuevo.
     ==================================================================== */

  var KIND_COLOR = {
    req:   "var(--color-fg-subtle)",
    res:   "FAM",           // se reemplaza por el color de familia
    frame: "FAM",
    open:  "var(--color-fg-faint)",
    fail:  "var(--color-negative)"
  };

  G.buildSim = function (sim, famVar) {
    var steps = sim.steps, actors = sim.actors, N = actors.length;
    var idx = {}; actors.forEach(function (a, i) { idx[a.id] = i; });
    var laneX = function (i) { return ((i + 0.5) / N) * 100; };
    var rowH = 46;

    var state = { cur: 0, playing: false, timer: null };

    // --- Cabezas de carril ---
    var heads = G.el("div", { class: "lane-heads", style: { gridTemplateColumns: "repeat(" + N + ", 1fr)" } });
    actors.forEach(function (a) {
      var roleVar = "var(" + (G.roleVar[a.role] || "--role-client") + ")";
      var head = G.el("div", { class: "lane-head", style: { "--lc": roleVar } }, [
        G.el("div", { class: "node", text: a.label }),
        G.el("div", { class: "role", text: a.role })
      ]);
      heads.appendChild(head);
    });

    // --- Área de mensajes ---
    var msgArea = G.el("div", { class: "msg-area", style: { height: (steps.length * rowH + 10) + "px" } });
    var lifelines = G.el("div", { class: "lifelines" });
    actors.forEach(function (a, i) {
      lifelines.appendChild(G.el("div", { class: "lifeline", style: { left: laneX(i) + "%" } }));
    });
    msgArea.appendChild(lifelines);

    var rows = steps.map(function (st, i) {
      var color = KIND_COLOR[st.kind] || "var(--color-fg-subtle)";
      if (color === "FAM") color = famVar;
      var row = G.el("div", { class: "msg-row", style: { top: (i * rowH) + "px", height: rowH + "px", "--mc": color } });

      if (st.from === st.to) {
        // Mensaje a sí mismo (p.ej. error de compilación tRPC)
        var x = laneX(idx[st.from]);
        row.appendChild(G.el("div", {
          class: "msg-self" + (st.kind === "fail" ? " fail" : ""),
          style: { left: x + "%" },
          text: st.label
        }));
        if (st.bytes) row.appendChild(G.el("div", { class: "msg-bytes", style: { left: x + "%", transform: "translate(10px, 6px)" }, text: st.bytes }));
      } else {
        var fx = laneX(idx[st.from]), tx = laneX(idx[st.to]);
        var left = Math.min(fx, tx), width = Math.abs(tx - fx);
        var arrowCls = "msg-arrow " + (st.dir === "left" ? "to-left" : "to-right") +
          (st.kind === "open" ? " dashed" : "");
        row.appendChild(G.el("div", { class: arrowCls, "data-arrow": "1", style: { left: left + "%", width: width + "%" } }));
        row.appendChild(G.el("div", { class: "msg-label", style: { left: (left + width / 2) + "%" }, text: st.label }));
        if (st.bytes && st.bytes !== "—") {
          var bx = st.dir === "left" ? left : (left + width);
          row.appendChild(G.el("div", { class: "msg-bytes", style: { left: bx + "%", transform: (st.dir === "left" ? "translate(8px,35%)" : "translate(-108%,35%)") }, text: st.bytes }));
        }
      }
      msgArea.appendChild(row);
      return row;
    });

    // --- Narración ---
    var snNum = G.el("span", { class: "sn-num" });
    var snText = G.el("span", { class: "sn-text" });
    var narration = G.el("div", { class: "sim-narration" }, [snNum, snText]);

    // --- Controles ---
    var btnReset = ctrlBtn("replay", "Reiniciar", function () { stop(); go(0); });
    var btnPrev = ctrlBtn(null, "Antes", function () { stop(); go(state.cur - 1); }, "back");
    var btnPlay = G.el("button", { class: "sim-btn primary", "aria-label": "Reproducir" });
    var btnNext = ctrlBtn("step", "Paso", function () { stop(); go(state.cur + 1); });
    btnPlay.addEventListener("click", function () { state.playing ? stop() : play(); });

    var dots = G.el("div", { class: "sim-dots" });
    var dotEls = steps.map(function (st, i) {
      var d = G.el("button", { class: "dot", "aria-label": "Paso " + (i + 1), onclick: function () { stop(); go(i); } });
      dots.appendChild(d); return d;
    });

    var stepCount = G.el("span", { class: "step-count" });

    var controls = G.el("div", { class: "sim-controls" }, [btnReset, btnPrev, btnPlay, btnNext, dots]);

    var stage = G.el("div", { class: "sim-stage" }, [G.el("div", { class: "lanes" }, [heads]), msgArea]);

    var simNode = G.el("div", { class: "sim", tabindex: "0", style: { "--fam": famVar }, role: "group", "aria-label": "Simulador: " + sim.titulo }, [
      G.el("div", { class: "sim-head" }, [
        G.el("span", { class: "st", text: "Simulador" }),
        G.el("span", { class: "grow", text: sim.titulo, style: { fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--color-fg-default)", flex: "1" } }),
        stepCount
      ]),
      stage, narration, controls
    ]);

    // Teclado: ← → paso, espacio play/pausa
    simNode.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(state.cur + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(state.cur - 1); }
      else if (e.key === " ") { e.preventDefault(); state.playing ? stop() : play(); }
    });

    function ctrlBtn(ico, label, fn, altIco) {
      var b = G.el("button", { class: "sim-btn", onclick: fn }, [
        G.icon(ico || altIco, altIco === "back" ? "flip" : null),
        G.el("span", { text: label })
      ]);
      return b;
    }

    function render() {
      rows.forEach(function (row, i) {
        var shown = i <= state.cur;
        row.classList.toggle("show", shown);
        var arrow = row.querySelector('[data-arrow]');
        if (arrow) {
          arrow.classList.toggle("animate", i === state.cur);
        }
        row.classList.toggle("cur", i === state.cur);
      });
      dotEls.forEach(function (d, i) { d.classList.toggle("on", i === state.cur); });
      var st = steps[state.cur];
      snNum.textContent = String(state.cur + 1).padStart(2, "0");
      snText.textContent = st.narracion;
      stepCount.textContent = "Paso " + (state.cur + 1) + " / " + steps.length;
      btnPrev.disabled = state.cur === 0;
      btnNext.disabled = state.cur === steps.length - 1;
      btnPlay.innerHTML = "";
      btnPlay.appendChild(G.icon(state.playing ? "pause" : "play"));
      btnPlay.appendChild(G.el("span", { text: state.playing ? "Pausa" : "Reproducir" }));
    }

    function go(n) {
      state.cur = Math.max(0, Math.min(steps.length - 1, n));
      render();
    }
    function play() {
      if (state.cur >= steps.length - 1) state.cur = 0;
      state.playing = true; render();
      state.timer = setInterval(function () {
        if (state.cur >= steps.length - 1) { stop(); return; }
        state.cur++; render();
      }, 1300);
    }
    function stop() {
      state.playing = false;
      if (state.timer) { clearInterval(state.timer); state.timer = null; }
      render();
    }

    render();
    // Guarda el stop para que el router pueda detener timers al cambiar de vista.
    G._activeTimers = G._activeTimers || [];
    G._activeTimers.push(stop);
    return simNode;
  };

  /* ====================================================================
     RATINGS — 7 ejes con polaridad
     ==================================================================== */
  G.buildRatings = function (ratings, famVar) {
    var grid = G.el("div", { class: "ratings", style: { "--fam": famVar } });
    G.ejes.forEach(function (eje) {
      var v = ratings[eje.id] || 0;
      var down = eje.pol === "down";
      var row = G.el("div", { class: "rating-row" }, [
        G.el("div", { class: "rr-top" }, [
          G.el("span", { class: "rr-label", text: eje.label }),
          G.el("span", { class: "rr-pol", text: down ? "↓ mejor" : "↑ mejor" }),
          G.el("span", { class: "rr-val", text: v + "/7" })
        ]),
        G.barSegments(v, { warn: down })
      ]);
      grid.appendChild(row);
    });
    return grid;
  };

  /* ====================================================================
     TARJETA DE CATÁLOGO
     ==================================================================== */
  G.buildCatCard = function (estilo) {
    var famVar = G.famVarOf(estilo.familia);
    var freq = G.FRECUENCIA[estilo.escala.frecuencia];
    var card = G.el("button", {
      class: "cat-card", style: { "--fam": famVar },
      "data-estilo": estilo.id,
      onclick: function () { location.hash = "#/ficha/" + estilo.id; }
    }, [
      G.el("div", { class: "row1" }, [
        G.el("span", { class: "folio", text: estilo.folio }),
        G.el("span", { class: "chip", text: estilo.tipo }),
        G.el("span", { class: "scale", text: G.complejidadGlyph(estilo.escala.complejidad) })
      ]),
      G.el("h3", { text: estilo.nombre }),
      G.el("p", { class: "oneliner", text: estilo.oneliner }),
      G.el("div", { class: "foot" }, [
        estilo.estrella ? G.el("span", { class: "pill-star", text: "★ estrella" }) :
          G.el("span", { class: "tag", text: freq.g + " " + freq.l }),
        G.el("span", { class: "go", html: "entrar " + G.iconStr("arrowRight") })
      ])
    ]);
    return card;
  };

  /* ---- Cabecera de familia ------------------------------------------- */
  G.buildFamilyHead = function (fam, count) {
    return G.el("div", { class: "family-head", style: { "--fam": "var(" + fam.famVar + ")" } }, [
      G.el("span", { class: "dot", style: { background: "var(" + fam.famVar + ")" } }),
      G.el("span", { class: "fnum", text: "Familia " + fam.num }),
      G.el("h2", { text: fam.nombre }),
      G.el("span", { class: "fcount", text: count + (count === 1 ? " estilo" : " estilos") })
    ]);
  };

})(window.GUIA = window.GUIA || {});
