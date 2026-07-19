/* ============================================================
   page-escape-analysis.js — widget de la ficha 03:
   dónde cae la variable: pila o heap.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["escape-analysis"] = function (host, t) {
    var cases = t.viz.cases, s = { cur: "stack" };
    var seg = G.segmented(t.viz.options, s.cur, function (v) { s.cur = v; draw(); });
    var bar = el(".viz-bar", {}, [el("span.viz-label", { text: "caso" }), seg]);
    var codePane = el("div", { style: "padding:16px 8px 12px 16px;border-right:1px solid var(--color-border-default)" });
    var memPane = el("div", { style: "padding:14px 16px 12px 12px" });
    var status = el(".viz-status", {}, [el("span.tag", { text: "gcflags -m" }), el("span.msg")]);
    var card = el(".viz-card", {}, [bar, el("div", { style: "display:grid;grid-template-columns:1fr 1fr" }, [codePane, memPane]), status]);
    var w = { status: status.querySelector(".msg") };
    function draw() {
      var c = cases[s.cur];
      // código
      var W = 380, b = T(4, 14, "C\u00D3DIGO", "500 10px var(--font-mono)", "var(--color-fg-faint)", null, "letter-spacing:.1em");
      c.code.forEach(function (ln, i) {
        var y = 40 + i * 26, esc2 = ln[1] === 2, decl = ln[1] === 1;
        if (esc2) b += R(0, y - 15, W, 22, "color-mix(in srgb, var(--fam-mem) 16%, transparent)", null, 'rx="4"');
        if (decl) b += R(0, y - 15, W, 22, "color-mix(in srgb, var(--role-service) 14%, transparent)", null, 'rx="4"');
        b += T(6, y, ln[0], (esc2 || decl ? 600 : 500) + " 13px var(--font-mono)", esc2 ? "var(--fam-mem)" : decl ? "var(--role-service)" : "var(--color-fg-default)", null, "white-space:pre");
      });
      codePane.innerHTML = SVG(W, 190, b, 190);
      // memoria
      var esc3 = c.escapes, m = "";
      m += R(20, 30, 140, 150, "var(--color-bg-canvas)", esc3 ? "var(--color-border-strong)" : "var(--role-improve)", 'rx="12" stroke-width="' + (esc3 ? 1 : 2) + '"');
      m += T(90, 22, "PILA", "600 11px var(--font-mono)", "var(--role-improve)", "middle", "letter-spacing:.08em");
      m += T(90, 172, "se libera al return", "500 9px var(--font-sans)", "var(--color-fg-faint)", "middle");
      m += R(200, 30, 140, 150, "var(--color-bg-canvas)", esc3 ? "var(--fam-mem)" : "var(--color-border-strong)", 'rx="12" stroke-width="' + (esc3 ? 2 : 1) + '"');
      m += T(270, 22, "HEAP", "600 11px var(--font-mono)", "var(--fam-mem)", "middle", "letter-spacing:.08em");
      m += T(270, 172, "lo maneja el GC", "500 9px var(--font-sans)", "var(--color-fg-faint)", "middle");
      var vx = esc3 ? 235 : 55, vy = 78, vc = esc3 ? "var(--fam-mem)" : "var(--role-improve)";
      m += '<g transform="translate(' + vx + ',' + vy + ')">';
      m += R(0, 0, 70, 44, "color-mix(in srgb, " + vc + " 18%, var(--color-bg-canvas))", vc, 'rx="8" stroke-width="1.6"');
      m += T(35, 20, c.varName, "600 14px var(--font-mono)", vc, "middle");
      m += T(35, 36, "int", "500 10px var(--font-mono)", "var(--color-fg-subtle)", "middle") + "</g>";
      memPane.innerHTML = SVG(360, 190, m, 190);
      setMsg(w, c.ev);
    }
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), card]));
    notes(t).forEach(function (n) { append(host, n); });
    draw();
  };

})(window.GUIA = window.GUIA || {});
