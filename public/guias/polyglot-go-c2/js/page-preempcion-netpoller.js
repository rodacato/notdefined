/* ============================================================
   page-preempcion-netpoller.js — widget de la ficha 07:
   preempción, netpoller y syscall bloqueante.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["preempcion-netpoller"] = function (host, t) {
    var scen = t.viz.scenarios, s = { sc: "preempt", step: 0 };
    var seg = G.segmented(t.viz.options, s.sc, function (v) { s.sc = v; s.step = 0; draw(); });
    var stepBtn = G.button("avanzar", "next", "btn-primary", function () { s.step = Math.min(s.step + 1, scen[s.sc].length - 1); draw(); });
    var reset = G.button("Reset", "reset", "btn-ghost", function () { s.step = 0; draw(); });
    var w = G.vizCard([seg, el(".viz-spacer"), stepBtn, reset], "runtime");
    function drawM(x, label, blocked, hasP) {
      var y = 96, mw = 150, mh = 64, b = "";
      b += R(x, y, mw, mh, blocked ? "color-mix(in srgb,var(--role-fail) 12%,var(--color-bg-canvas))" : "var(--color-bg-canvas)", blocked ? "var(--role-fail)" : "var(--color-border-strong)", 'rx="12" stroke-width="' + (blocked ? 1.8 : 1) + '"');
      b += T(x + 12, y + 22, label, "600 13px var(--font-mono)", "var(--fam-comp)");
      b += T(x + 12, y + 40, blocked ? "bloqueado en kernel" : "hilo del SO", "500 10px var(--font-sans)", blocked ? "var(--role-fail)" : "var(--color-fg-subtle)");
      if (hasP) { b += R(x + mw - 44, y + 8, 34, 20, "var(--role-gateway)", null, 'rx="5"'); b += T(x + mw - 27, y + 22, "P", "600 11px var(--font-mono)", "var(--on-accent)", "middle"); }
      return b;
    }
    function drawG(x, y, label, color, note) {
      var b = '<circle cx="' + x + '" cy="' + y + '" r="17" fill="' + color + '"/>';
      b += T(x, y + 4, label, "600 12px var(--font-mono)", "var(--on-accent)", "middle");
      if (note) b += T(x, y + 34, note, "500 9px var(--font-sans)", "var(--color-fg-subtle)", "middle");
      return b;
    }
    function draw() {
      var sc = s.sc, step = s.step, b = "";
      if (sc === "preempt") {
        var act = step >= 1;
        b += R(300, 12, 180, 40, act ? "color-mix(in srgb,var(--role-fail) 15%,var(--color-bg-canvas))" : "var(--color-bg-canvas)", act ? "var(--role-fail)" : "var(--color-border-strong)", 'rx="10" stroke-width="' + (act ? 1.8 : 1) + '"');
        b += T(390, 30, "sysmon", "600 12px var(--font-mono)", act ? "var(--role-fail)" : "var(--color-fg-default)", "middle");
        b += T(390, 46, act ? "\u2192 SIGURG" : "monitor de fondo", "500 9px var(--font-sans)", "var(--color-fg-subtle)", "middle");
        if (step >= 1) b += '<path d="M 390 52 L 210 96" stroke="var(--role-fail)" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#emk)"/>';
      }
      if (sc === "net") {
        var act2 = step >= 1;
        b += R(300, 12, 180, 40, act2 ? "color-mix(in srgb,var(--role-service) 15%,var(--color-bg-canvas))" : "var(--color-bg-canvas)", act2 ? "var(--role-service)" : "var(--color-border-strong)", 'rx="10" stroke-width="' + (act2 ? 1.8 : 1) + '"');
        b += T(390, 30, "netpoller", "600 12px var(--font-mono)", act2 ? "var(--role-service)" : "var(--color-fg-default)", "middle");
        b += T(390, 46, "epoll / kqueue / IOCP", "500 9px var(--font-sans)", "var(--color-fg-subtle)", "middle");
      }
      if (sc === "syscall") {
        b += drawM(120, "M1", step >= 1, step < 2);
        b += drawM(470, "M2", false, step >= 2);
        b += drawG(195, 128, "G1", step >= 1 ? "var(--role-fail)" : "var(--fam-conc)", step >= 1 ? "syscall" : "corriendo");
        if (step >= 3) { b += drawG(545, 128, "G2", "var(--role-service)", "sigue"); b += drawG(590, 128, "G3", "var(--fam-comp)", ""); }
        if (step >= 2) b += '<path d="M 250 118 Q 360 70 470 118" stroke="var(--role-gateway)" stroke-width="2" fill="none" stroke-dasharray="5 4" marker-end="url(#gmk)"/>';
      } else {
        b += drawM(120, "M1", false, true);
        var gColor = sc === "preempt" ? (step >= 2 ? "var(--color-fg-faint)" : step >= 1 ? "var(--role-fail)" : "var(--fam-conc)") : (step >= 1 ? "var(--color-fg-faint)" : "var(--fam-conc)");
        var gNote = sc === "preempt" ? (step >= 2 ? "aparcada" : step === 1 ? "recibe se\u00F1al" : "en CPU") : (step >= 1 ? "en netpoller" : "lee red");
        b += drawG(195, 128, "G1", gColor, gNote);
        b += R(470, 96, 230, 64, "var(--color-bg-muted)", "var(--color-border-default)", 'rx="12" stroke-dasharray="4 4"');
        b += T(480, 90, "COLA LOCAL DEL P", "500 9px var(--font-mono)", "var(--color-fg-faint)", null, "letter-spacing:.1em");
        b += drawG(520, 128, "G2", step >= 3 ? "var(--role-service)" : "var(--role-gateway)", step >= 3 ? "\u2192 a M1" : "");
        b += drawG(580, 128, "G3", "var(--fam-comp)", "");
        if (step >= 3) b += '<path d="M 500 128 L 250 128" stroke="var(--role-service)" stroke-width="2" fill="none" marker-end="url(#gmk)"/>';
      }
      b += "<defs>" + marker("emk", "var(--role-fail)") + marker("gmk", "var(--role-service)") + "</defs>";
      w.canvas.innerHTML = SVG(780, 200, b, 220);
      setMsg(w, scen[s.sc][s.step]);
    }
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), w.card]));
    notes(t).forEach(function (n) { append(host, n); });
    draw();
  };

})(window.GUIA = window.GUIA || {});
