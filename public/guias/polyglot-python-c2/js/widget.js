/* widget.js — motor de las visualizaciones deterministas paso a paso.
   El GUIÓN (qué muestra cada paso) vive en data/. Aquí solo el MOTOR:
   normaliza el spec del tema, arma los pasos y controla prev/next/auto/reset.
   Cada paso cambia una sola cosa visible y trae una narración de una línea. */
(function (G) {
  "use strict";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---- Builders: expanden un spec compacto en una lista de pasos --------- */
  var build = {
    // Cadena de etapas resaltadas una a una (p. ej. el pipeline).
    etapas: function (spec) {
      var etapas = spec.etapas;
      return etapas.map(function (e, i) {
        var chain = etapas.map(function (s, j) {
          var cls = j < i ? "w-stage done" : (j === i ? "w-stage active" : "w-stage");
          return "<div class='" + cls + "'><span class='k'>" + esc(s.k) + "</span><pre>" + esc(s.rep) + "</pre></div>";
        }).join("");
        var vis = "<div class='w-stages'>" + chain + "</div>";
        if (spec.cacheLabel) {
          var on = i >= (spec.cacheDesde || 0);
          vis += "<div style='margin-top:12px'><span class='w-pill " + (on ? "ok" : "") +
            "' style='" + (on ? "" : "background:var(--color-bg-muted);color:var(--color-fg-faint);border:1px dashed var(--color-border-strong)") + "'>" +
            (on ? "✓ " : "— ") + esc(spec.cacheLabel) + "</span></div>";
        }
        return { vis: vis, nota: e.nota };
      });
    },
    // Carriles de progreso (GIL, event loop, free-threading…).
    carriles: function (spec) {
      var lanes = spec.lanes;
      return spec.pasos.map(function (p) {
        var rows = lanes.map(function (lbl, i) {
          var fill = (p.fills && p.fills[i]) || 0;
          var cls = (p.cls && p.cls[i]) || "";
          var tok = (p.token === i) ? "<span class='w-token'>GIL</span>" : "";
          var st = p.states ? (p.states[i] || "") : "";
          return "<div class='w-lane'><span class='lbl'>" + esc(lbl) + "</span>" +
            (spec.conToken ? "<span style='width:32px;flex:0 0 auto;text-align:center'>" + tok + "</span>" : "") +
            "<span class='track'><i class='" + cls + "' style='width:" + fill + "%'></i></span>" +
            "<span class='st'>" + esc(st) + "</span></div>";
        }).join("");
        return { vis: "<div class='w-col'>" + rows + "</div>", nota: p.nota, tone: p.tone };
      });
    }
  };

  function pasosDe(spec) {
    if (spec.tipo && build[spec.tipo]) return build[spec.tipo](spec);
    return (spec.pasos || []).map(function (p) {
      return { vis: p.vis, nota: p.nota, tone: p.tone };
    });
  }

  function normalize(widget) {
    var vistas;
    if (widget.vistas) {
      vistas = widget.vistas.map(function (v, i) {
        return { id: v.id || ("v" + i), label: v.label || ("Vista " + (i + 1)), pasos: pasosDe(v) };
      });
    } else {
      vistas = [{ id: "v0", label: "", pasos: pasosDe(widget) }];
    }
    return { intro: widget.intro || "", vistas: vistas };
  }

  /* ---- Montaje interactivo ---------------------------------------------- */
  G.montarWidget = function (host, widget, fam) {
    var W = normalize(widget);
    host.classList.add("widget");
    host.style.setProperty("--fam", "var(--fam-" + fam + ")");
    G.clear(host);

    var st = { vista: 0, paso: 0, auto: false, timer: null };

    if (W.intro) host.appendChild(G.el("p.widget-intro", { text: W.intro }));

    // Segmented (solo si hay varias vistas)
    var segHost = null;
    if (W.vistas.length > 1) {
      segHost = G.el("div.segmented", { role: "group", "aria-label": "Vistas" });
      host.appendChild(segHost);
    }
    var stage = G.el("div.widget-stage");
    var note = G.el("div.widget-note");
    var controls = G.el("div.widget-controls");
    host.appendChild(stage); host.appendChild(note); host.appendChild(controls);

    function pasos() { return W.vistas[st.vista].pasos; }
    function stopAuto() { if (st.timer) { clearInterval(st.timer); st.timer = null; } st.auto = false; }

    function render() {
      var P = pasos(), p = P[st.paso];
      // Segmented
      if (segHost) {
        G.clear(segHost);
        W.vistas.forEach(function (v, i) {
          segHost.appendChild(G.el("button", {
            type: "button", text: v.label, "aria-pressed": i === st.vista ? "true" : "false",
            onClick: function () { stopAuto(); st.vista = i; st.paso = 0; render(); }
          }));
        });
      }
      // Escenario
      stage.innerHTML = p.vis;
      // Nota (narración de una línea)
      note.className = "widget-note" + (p.tone ? " " + p.tone : "");
      G.clear(note);
      note.appendChild(G.el("span.idx", { text: String(st.paso + 1) + "/" + P.length }));
      note.appendChild(G.el("p", { html: p.nota }));
      // Controles
      G.clear(controls);
      var atStart = st.paso === 0, atEnd = st.paso >= P.length - 1;
      controls.appendChild(btn("Anterior", "prev", function () { stopAuto(); if (st.paso > 0) { st.paso--; render(); } }, atStart));
      controls.appendChild(btn("Siguiente", "next", function () { stopAuto(); if (st.paso < P.length - 1) { st.paso++; render(); } }, atEnd));
      if (!G.reducedMotion()) {
        controls.appendChild(btn(st.auto ? "Pausar" : "Auto", st.auto ? "pausa" : "play", toggleAuto, false, "play" + (st.auto ? " on" : "")));
      }
      controls.appendChild(btn("Reiniciar", "reinicia", function () { stopAuto(); st.paso = 0; render(); }, false));
      // Puntos de progreso
      var dots = G.el("div.widget-dots", { "aria-hidden": "true" });
      P.forEach(function (_, i) { dots.appendChild(G.el("i" + (i === st.paso ? ".on" : ""))); });
      controls.appendChild(dots);
    }

    function btn(label, icon, on, disabled, extra) {
      return G.el("button.btn" + (extra ? "." + extra.split(" ").join(".") : ""), {
        type: "button", disabled: !!disabled, onClick: on,
        html: G.icon(icon, 17) + "<span>" + label + "</span>"
      });
    }

    function toggleAuto() {
      var P = pasos();
      if (st.auto) { stopAuto(); render(); return; }
      if (st.paso >= P.length - 1) st.paso = 0;
      st.auto = true;
      st.timer = setInterval(function () {
        var PP = pasos();
        if (st.paso >= PP.length - 1) { stopAuto(); render(); return; }
        st.paso++; render();
      }, 1150);
      render();
    }

    render();
  };

})(window.GUIA = window.GUIA || {});
