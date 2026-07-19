/* ============================================================
   page-ssa-pgo.js — widget de la ficha 02:
   pases de optimización sobre la SSA, con PGO.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["ssa-pgo"] = function (host, t) {
    var A = acc(t), s = { step: 0, pgo: false };
    function passes() { return s.pgo ? t.viz.passes.on : t.viz.passes.off; }
    var applyBtn = G.button("aplicar pase", "bolt", "btn-primary", function () { s.step = Math.min(s.step + 1, passes().length - 1); draw(); });
    var reset = G.button("Reset", "reset", "btn-ghost", function () { s.step = 0; draw(); });
    var pill = G.pill(s.pgo ? "PGO on" : "PGO off", s.pgo, function () {
      s.pgo = !s.pgo; s.step = 0; pill.textContent = s.pgo ? "PGO on" : "PGO off"; pill.setAttribute("aria-pressed", s.pgo); draw();
    });
    var w = G.vizCard([applyBtn, reset, el(".viz-spacer"), el("span.viz-label", { text: "perfil" }), pill], "pase");
    function draw() {
      var ps = passes(), cur = ps[s.step], W = 780, H = 250, body = "";
      var railY = 20, pw = W / ps.length;
      ps.forEach(function (p, i) {
        var on = i <= s.step, active = i === s.step, cx = i * pw + 12;
        body += '<circle cx="' + (cx + 6) + '" cy="' + railY + '" r="6" fill="' + (active ? A : on ? "var(--color-fg-default)" : "var(--color-bg-muted)") + '"' + (on ? "" : ' stroke="var(--color-border-strong)"') + "/>";
        if (i < ps.length - 1) body += '<line x1="' + (cx + 12) + '" y1="' + railY + '" x2="' + (cx + pw) + '" y2="' + railY + '" stroke="' + (i < s.step ? "var(--color-fg-default)" : "var(--color-border-default)") + '" stroke-width="1.5"/>';
        body += T(cx + 6, railY + 22, p.name, (active ? 600 : 500) + " 9.5px var(--font-mono)", active ? A : on ? "var(--color-fg-subtle)" : "var(--color-fg-faint)");
      });
      var bx = 24, by = 64, bw = W - 48, bh = H - 74;
      body += R(bx, by, bw, bh, "var(--color-bg-canvas)", "var(--color-border-strong)", 'rx="12"');
      cur.lines.forEach(function (ln, i) {
        var ly = by + 30 + i * 24, hl = cur.hl === ln[0];
        if (hl) body += R(bx + 12, ly - 15, bw - 24, 22, "color-mix(in srgb, " + A + " 12%, transparent)", null, 'rx="5"');
        body += T(bx + 24, ly, ln[0], "600 13px var(--font-mono)", hl ? A : "var(--color-primary)");
        body += T(bx + 90, ly, ln[1], "500 13px var(--font-mono)", hl ? "var(--color-fg-default)" : "var(--color-fg-subtle)");
      });
      body += T(bx + bw - 16, by + 24, cur.lines.length + " VALORES SSA", "500 10px var(--font-mono)", "var(--color-fg-faint)", "end", "letter-spacing:.1em");
      w.canvas.innerHTML = SVG(W, H, body, 258);
      setMsg(w, cur.ev);
    }
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), w.card]));
    notes(t).forEach(function (n) { append(host, n); });
    draw();
  };

})(window.GUIA = window.GUIA || {});
