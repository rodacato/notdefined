/* ==========================================================================
   js/page-comparador.js — Comparador de escenario (la joya)
   Eliges 2 estilos y un escenario; corren lado a lado: viajes animados, bytes
   por payload y latencia = round-trips × RTT (slider). Números modelados en
   G.fechaEval; son órdenes de magnitud, no benchmarks.
   ========================================================================== */
(function (G) {
  "use strict";
  G.pages = G.pages || {};

  G.pages.comparador = function () {
    var esc0 = G.escenarios[0];
    var estado = {
      escenario: esc0.id,
      rtt: presetMs(esc0.rttDefault),
      preset: esc0.rttDefault,
      a: null, b: null
    };
    initStyles(esc0);

    var lanesWrap = G.el("div", { class: "cmp-lanes" });
    var noteWrap = G.el("div", {});
    var rttValueEl = G.el("span", { class: "rtt-value" });

    /* --- Selector de escenario --- */
    var escSelect = G.el("select", { class: "cmp-select", onchange: function (e) { setEscenario(e.target.value); } },
      G.escenarios.map(function (s) { return G.el("option", { value: s.id, text: s.titulo }); }));

    /* --- RTT presets + slider --- */
    var presetBtns = G.rttPresets.map(function (p) {
      return G.el("button", { class: "rtt-preset", "data-p": p.id, text: p.label + " · " + p.ms + "ms", onclick: function () { setRtt(p.ms, p.id); } });
    });
    var slider = G.el("input", { type: "range", class: "rtt-slider", min: "5", max: "400", step: "5", value: String(estado.rtt), "aria-label": "RTT en milisegundos",
      oninput: function (e) { setRtt(parseInt(e.target.value, 10), null); } });

    var controls = G.el("div", { class: "cmp-controls" }, [
      G.el("div", { class: "cmp-field" }, [G.el("label", { text: "Escenario" }), escSelect]),
      G.el("div", { class: "cmp-field rtt-field" }, [
        G.el("label", {}, [document.createTextNode("Latencia de red (RTT) — "), rttValueEl]),
        G.el("div", { class: "rtt-presets" }, presetBtns),
        slider
      ])
    ]);

    var descEl = G.el("p", { class: "lead", style: { maxWidth: "68ch", marginTop: "var(--space-3)" } });

    var head = G.el("div", {}, [
      G.el("span", { class: "eyebrow", text: "El comparador" }),
      G.el("h1", { style: { marginTop: "var(--space-2)" }, text: "Dos estilos, un escenario, lado a lado" }),
      descEl
    ]);

    var root = G.el("div", {}, [G.shell([
      head,
      G.el("hr", { class: "rule-double", style: { margin: "var(--space-6) 0" } }),
      controls,
      lanesWrap,
      noteWrap
    ])]);

    setEscenario(esc0.id);
    return root;

    /* ---- lógica ---- */
    function initStyles(esc) {
      var ids = Object.keys(esc.planes);
      estado.a = ids[0];
      estado.b = ids[1] || ids[0];
    }
    function presetMs(pid) { var p = G.rttPresets.filter(function (x) { return x.id === pid; })[0]; return p ? p.ms : 80; }

    function setEscenario(id) {
      estado.escenario = id;
      var esc = G.escenarioPorId[id];
      escSelect.value = id;
      estado.preset = esc.rttDefault; estado.rtt = presetMs(esc.rttDefault);
      slider.value = String(estado.rtt);
      initStyles(esc);
      descEl.textContent = esc.descripcion;
      renderRttUi();
      renderLanes(true);
    }
    function setRtt(ms, preset) {
      estado.rtt = ms; estado.preset = preset;
      slider.value = String(ms);
      renderRttUi();
      renderLanes(false);
    }
    function renderRttUi() {
      rttValueEl.textContent = estado.rtt + " ms";
      presetBtns.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-p") === estado.preset); });
    }

    function renderLanes(animate) {
      var esc = G.escenarioPorId[estado.escenario];
      G.clear(lanesWrap);

      var mA = metrics(esc, estado.a), mB = metrics(esc, estado.b);
      var laneA = buildLane("a", esc, estado.a, mA, mB, animate);
      var laneB = buildLane("b", esc, estado.b, mB, mA, animate);
      lanesWrap.appendChild(laneA);
      lanesWrap.appendChild(laneB);

      // Nota honesta
      G.clear(noteWrap);
      noteWrap.appendChild(G.el("div", { class: "cmp-note mt-6" }, [
        G.el("span", { class: "mono", text: "≈" }),
        G.el("span", { html: "Números <b>modelados</b> (órdenes de magnitud), evaluados en " + G.fechaEval + ". Latencia = round-trips en el camino crítico × RTT. No son benchmarks: comparan <em>la forma del protocolo</em>, no productos ni implementaciones concretas." })
      ]));
    }

    function metrics(esc, styleId) {
      var plan = esc.planes[styleId];
      return {
        latencia: plan.setup * estado.rtt,
        viajes: plan.viajes,
        bytes: plan.bytes,
        plan: plan
      };
    }

    function buildLane(which, esc, styleId, mine, other, animate) {
      var estilo = G.catalogoPorId[styleId];
      var famVar = G.famVarOf(estilo.familia);
      var ids = Object.keys(esc.planes);

      var select = G.el("select", { class: "cmp-select", "aria-label": "Estilo " + which,
        onchange: function (e) { estado[which] = e.target.value; renderLanes(true); } },
        ids.map(function (sid) {
          var s = G.catalogoPorId[sid];
          return G.el("option", { value: sid, text: s.folio + " · " + s.nombre, selected: sid === styleId ? "selected" : null });
        }));

      var track = G.el("div", { class: "cmp-track", style: { "--fam": famVar } });
      var tripEls = mine.plan.trips.map(function (t) {
        var arrow = t.dir === "req" ? "→" : "←";
        return G.el("div", { class: "trip " + t.dir }, [
          G.el("span", { class: "tdir", text: arrow }),
          G.el("span", { class: "tlabel", text: t.label + (t.repeat ? "" : "") }),
          G.el("span", { class: "tbytes", text: G.bytesFmt(t.bytes) + (t.repeat ? " ea" : "") })
        ]);
      });
      G.append(track, tripEls);

      // Métricas: menor gana (latencia, viajes, bytes)
      var mBox = G.el("div", { class: "cmp-metrics" }, [
        metric(mine.latencia + " ms", "latencia 1er dato", mine.latencia < other.latencia),
        metric(String(mine.viajes), "viajes de red", mine.viajes < other.viajes),
        metric(G.bytesFmt(mine.bytes), "payload", mine.bytes < other.bytes)
      ]);

      var lane = G.el("div", { class: "cmp-lane", style: { "--fam": famVar } }, [
        G.el("div", { class: "lane-title" }, [
          G.el("span", { class: "folio", text: estilo.folio }),
          select
        ]),
        track,
        mBox,
        G.el("p", { class: "caption", style: { marginTop: "var(--space-3)" }, text: mine.plan.nota })
      ]);

      // Animar aparición de trips
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (animate && !reduce) {
        tripEls.forEach(function (el, i) { setTimeout(function () { el.classList.add("show"); }, 120 + i * 220); });
      } else {
        tripEls.forEach(function (el) { el.classList.add("show"); });
      }
      return lane;
    }

    function metric(value, label, win) {
      return G.el("div", { class: "metric" + (win ? " win" : "") }, [
        G.el("div", { class: "mv", text: value }),
        G.el("div", { class: "ml", text: label })
      ]);
    }
  };

})(window.GUIA = window.GUIA || {});
