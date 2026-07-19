/* ============================================================
   page-pipeline-aot.js — widget de la ficha 01:
   el pipeline AOT, etapa por etapa.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["pipeline-aot"] = function (host, t) {
    var A = acc(t), stages = t.viz.stages, s = { stage: 0 };
    var next = G.button("siguiente etapa", "next", "btn-primary", function () { s.stage = (s.stage + 1) % 5; draw(); });
    var reset = G.button("Reset", "reset", "btn-ghost", function () { s.stage = 0; draw(); });
    var count = el("span.viz-count");
    var w = G.vizCard([next, reset, el(".viz-spacer"), count], "cmd/compile");
    function draw() {
      count.textContent = "etapa " + (s.stage + 1) + "/5";
      var bw = 132, gap = 30, y = 44, bh = 76, x = 24, body = "";
      stages.forEach(function (st, i) {
        var done = i <= s.stage, active = i === s.stage;
        var fill = active ? "color-mix(in srgb, " + A + " 15%, var(--color-bg-canvas))" : done ? "var(--color-bg-canvas)" : "var(--color-bg-muted)";
        var stroke = active ? A : done ? "var(--color-border-strong)" : "var(--color-border-default)";
        body += R(x, y, bw, bh, fill, stroke, 'rx="12" stroke-width="' + (active ? 2 : 1) + '" opacity="' + (done ? 1 : .55) + '"');
        body += T(x + 10, y - 8, "0" + (i + 1), "600 11px var(--font-mono)", active ? A : "var(--color-fg-faint)");
        body += T(x + bw / 2, y + 30, st.label, "600 13px var(--font-mono)", active ? A : "var(--color-fg-default)", "middle", "opacity:" + (done ? 1 : .6));
        body += T(x + bw / 2, y + 50, st.sub, "500 10px var(--font-sans)", "var(--color-fg-subtle)", "middle", "opacity:" + (done ? 1 : .6));
        if (i < 4) {
          var ax = x + bw + 4, on = i < s.stage;
          body += '<path d="M ' + ax + ' ' + (y + bh / 2) + ' L ' + (ax + gap - 8) + ' ' + (y + bh / 2) + '" stroke="' + (on ? A : "var(--color-border-default)") + '" stroke-width="' + (on ? 2 : 1.2) + '" marker-end="url(#pmk' + (on ? "on" : "off") + ')"/>';
        }
        x += bw + gap;
      });
      if (s.stage === 4) {
        var bx = 24 + 4 * (bw + gap);
        body += T(bx + bw / 2, y + bh + 24, "DENTRO:", "600 9px var(--font-mono)", A, "middle", "letter-spacing:.1em");
        ["tu c\u00F3digo", "+ runtime", "GC \u00B7 sched \u00B7 alloc"].forEach(function (tx, i) {
          body += T(bx + bw / 2, y + bh + 40 + i * 15, tx, "500 10px var(--font-mono)", "var(--color-fg-subtle)", "middle");
        });
      }
      body += "<defs>" + marker("pmkon", A) + marker("pmkoff", "var(--color-border-default)") + "</defs>";
      w.canvas.innerHTML = SVG(820, 200, body, 208);
      setMsg(w, stages[s.stage].ev);
    }
    var sec = el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), w.card]);
    append(host, sec); notes(t).forEach(function (n) { append(host, n); });
    draw();
  };

})(window.GUIA = window.GUIA || {});
