/* ============================================================
   page-allocator-mcache.js — widget de la ficha 09:
   el camino de una asignación.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["allocator-mcache"] = function (host, t) {
    var s = { size: "small", path: [], mcacheHas: false };
    var seg = G.segmented(t.viz.options, s.size, function (v) { s.size = v; s.path = []; draw(v === "large" ? "Objeto grande: ir\u00E1 directo al mheap." : v === "medium" ? "Objeto mediano: size class mayor, mismo camino." : "Objeto peque\u00F1o (\u226432 KB): size class + mcache."); });
    var allocBtn = G.button("asignar", "bolt", "btn-primary", function () { alloc(); });
    var reset = G.button("Reset", "reset", "btn-ghost", function () { s.size = "small"; s.path = []; s.mcacheHas = false; seg._set("small"); draw("Reiniciado. El primer alloc de una size class rellena desde abajo."); });
    var w = G.vizCard([el("span.viz-label", { text: "tama\u00F1o" }), seg, allocBtn, reset], "runtime");
    function animate(path, ev) {
      setMsg(w, ev); s.path = [];
      if (G.reduceMotion()) { s.path = path.slice(); draw(); return; }
      path.forEach(function (n, i) { setTimeout(function () { s.path.push(n); draw(); }, i * 300); });
    }
    function alloc() {
      if (s.size === "large") { animate(["obj", "mheap"], "Objeto GRANDE (>32 KB): salta el mcache/mcentral y va directo al mheap."); return; }
      if (!s.mcacheHas) { animate(["obj", "mcache", "mcentral", "mheap", "mcentral", "mcache"], "mcache vac\u00EDo para esa size class \u2192 pide al mcentral \u2192 mheap parte un span nuevo \u2192 sube y rellena."); setTimeout(function () { s.mcacheHas = true; }, 100); }
      else animate(["obj", "mcache"], "Camino R\u00C1PIDO: el mcache local (sin locks) tiene span libre. Asignaci\u00F3n casi gratis.");
    }
    function draw(ev) {
      var W = 780, H = 300, b = "", active = function (id) { return s.path.indexOf(id) >= 0; }, last = function (id) { return s.path[s.path.length - 1] === id; };
      var tiers = [
        { id: "mcache", label: "mcache", sub: "por-P \u00B7 sin locks \u00B7 CAMINO R\u00C1PIDO", y: 46, color: "var(--role-service)" },
        { id: "mcentral", label: "mcentral", sub: "compartido por size class \u00B7 con lock", y: 130, color: "var(--role-gateway)" },
        { id: "mheap", label: "mheap", sub: "heap global \u00B7 pide arenas al SO", y: 214, color: "var(--role-store)" }
      ];
      var tx = 250, tw = 380, th = 62, objColor = s.size === "large" ? "var(--fam-comp)" : "var(--fam-conc)";
      b += R(40, 130, 150, 62, active("obj") ? "color-mix(in srgb," + objColor + " 16%,var(--color-bg-canvas))" : "var(--color-bg-canvas)", objColor, 'rx="12" stroke-width="1.5"');
      b += T(115, 156, s.size === "large" ? "obj >32KB" : s.size === "medium" ? "obj ~2KB" : "obj 48B", "600 13px var(--font-mono)", objColor, "middle");
      b += T(115, 176, s.size === "large" ? "objeto grande" : "size class " + (s.size === "medium" ? "#40" : "#5"), "500 10px var(--font-sans)", "var(--color-fg-subtle)", "middle");
      tiers.forEach(function (tr) {
        var on = active(tr.id), lst = last(tr.id);
        b += R(tx, tr.y, tw, th, on ? "color-mix(in srgb," + tr.color + " 14%,var(--color-bg-canvas))" : "var(--color-bg-canvas)", lst ? tr.color : on ? tr.color : "var(--color-border-strong)", 'rx="12" stroke-width="' + (lst ? 2 : on ? 1.5 : 1) + '"');
        b += T(tx + 18, tr.y + 27, tr.label, "600 15px var(--font-mono)", on ? tr.color : "var(--color-fg-default)");
        b += T(tx + 18, tr.y + 46, tr.sub, "500 11px var(--font-sans)", "var(--color-fg-subtle)");
        if (tr.id === "mcache") { b += T(tx + 200, tr.y + 14, "SPANS POR SIZE CLASS", "500 8px var(--font-mono)", "var(--color-fg-faint)"); for (var i = 0; i < 6; i++) { var filled = on && (s.mcacheHas || s.path.length > 4) && i === (s.size === "medium" ? 3 : 1); b += R(tx + 200 + i * 28, tr.y + 18, 22, 26, filled ? tr.color : "var(--color-bg-muted)", "var(--color-border-default)", 'rx="4"'); } }
      });
      b += T(tx + tw / 2, 296, "\u2193 SISTEMA OPERATIVO (mmap)", "500 10px var(--font-mono)", "var(--color-fg-faint)", "middle", "letter-spacing:.1em");
      function arr(y1, y2, on) { b += '<path d="M ' + (tx + tw / 2) + ' ' + y1 + ' L ' + (tx + tw / 2) + ' ' + y2 + '" stroke="' + (on ? "var(--color-fg-default)" : "var(--color-border-default)") + '" stroke-width="' + (on ? 2 : 1) + '"' + (on ? ' marker-end="url(#amk)"' : ' stroke-dasharray="3 3"') + "/>"; }
      arr(108, 130, active("mcentral")); arr(192, 214, active("mheap"));
      var ft = s.size === "large" ? 214 : 46;
      b += '<path d="M 190 161 L ' + tx + ' ' + (ft + 31) + '" fill="none" stroke="' + (active("obj") ? objColor : "var(--color-border-default)") + '" stroke-width="' + (active("obj") ? 2 : 1) + '"' + (active("obj") ? ' marker-end="url(#amk)"' : ' stroke-dasharray="3 3"') + "/>";
      b += "<defs>" + marker("amk", "var(--color-fg-default)") + "</defs>";
      w.canvas.innerHTML = SVG(W, H, b, 300);
      if (ev) setMsg(w, ev);
    }
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), w.card]));
    notes(t).forEach(function (n) { append(host, n); });
    draw("Elige un tama\u00F1o y pulsa \u00ABasignar\u00BB para ver el camino.");
  };

})(window.GUIA = window.GUIA || {});
