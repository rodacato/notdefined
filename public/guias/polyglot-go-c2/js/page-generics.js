/* ============================================================
   page-generics.js — widget de la ficha 14:
   instanciaciones → copias por GCShape.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["generics"] = function (host, t) {
    var A = "var(--fam-tipos)";
    // instanciaciones fijas: (nombre, shape, esPuntero)
    var insts = [
      { name: "int", shape: "int", ptr: false },
      { name: "float64", shape: "float64", ptr: false },
      { name: "string", shape: "string", ptr: false },
      { name: "*User", shape: "*T", ptr: true },
      { name: "*Order", shape: "*T", ptr: true },
      { name: "[]byte", shape: "[]byte", ptr: false }
    ];
    var s = { mode: "gcshape" };
    var seg = G.segmented([{ value: "mono", label: "monomorfizaci\u00F3n (C++/Rust)" }, { value: "gcshape", label: "GCShape stenciling (Go)" }], s.mode, function (v) { s.mode = v; draw(); });
    var w = G.vizCard([el("span.viz-label", { text: "estrategia" }), seg], "cmd/compile");
    function draw() {
      var W = 780, H = 300, b = "", rowH = 40, x0 = 30, iy0 = 40;
      b += T(x0, 24, "INSTANCIACIONES  Min[T]", "500 10px var(--font-mono)", "var(--color-fg-faint)", null, "letter-spacing:.1em");
      // columna izquierda: instanciaciones
      insts.forEach(function (it, i) {
        var y = iy0 + i * rowH;
        b += R(x0, y, 150, 30, "var(--color-bg-canvas)", it.ptr ? A : "var(--color-border-strong)", 'rx="7"' + (it.ptr ? ' stroke-width="1.6"' : ""));
        b += T(x0 + 12, y + 20, "Min[" + it.name + "]", "600 12px var(--font-mono)", it.ptr ? A : "var(--color-fg-default)");
      });
      // columna derecha: copias compiladas
      var copies;
      if (s.mode === "mono") copies = insts.map(function (it) { return { key: it.name, members: [it.name] }; });
      else { var map = {}; insts.forEach(function (it) { (map[it.shape] = map[it.shape] || { key: it.shape, members: [] }).members.push(it.name); }); copies = Object.keys(map).map(function (k) { return map[k]; }); }
      var cx = 470, cw = 280, gapc = (H - 60) / copies.length, ch = Math.min(rowH + 4, gapc - 8);
      b += T(cx, 24, s.mode === "mono" ? copies.length + " COPIAS DE C\u00D3DIGO (una por tipo)" : copies.length + " COPIAS (una por GCShape) + " + insts.length + " DICTIONARIES", "500 10px var(--font-mono)", A, null, "letter-spacing:.06em");
      copies.forEach(function (cp, i) {
        var y = 40 + i * gapc;
        b += R(cx, y, cw, ch, "color-mix(in srgb," + A + " 10%,var(--color-bg-canvas))", A, 'rx="9"');
        var label = s.mode === "mono" ? "func Min\u3008" + cp.key + "\u3009" : "stencil shape=" + cp.key;
        b += T(cx + 14, y + 20, label, "600 12px var(--font-mono)", A);
        b += T(cx + cw - 14, y + 20, cp.members.length > 1 ? "comparten: " + cp.members.join(", ") : cp.members[0], "500 10px var(--font-mono)", "var(--color-fg-subtle)", "end");
      });
      // conexiones instancia -> copia
      insts.forEach(function (it, i) {
        var y1 = iy0 + i * rowH + 15;
        var ci = copies.findIndex(function (cp) { return cp.members.indexOf(it.name) >= 0; });
        var y2 = 40 + ci * gapc + ch / 2;
        var shared = it.ptr && s.mode === "gcshape";
        b += '<path d="M ' + (x0 + 150) + ' ' + y1 + ' C ' + (x0 + 260) + ' ' + y1 + ', ' + (cx - 120) + ' ' + y2 + ', ' + cx + ' ' + y2 + '" fill="none" stroke="' + (shared ? A : "var(--color-border-strong)") + '" stroke-width="' + (shared ? 2 : 1.2) + '"' + (shared ? "" : ' stroke-dasharray="4 3"') + ' opacity="0.85"/>';
        // dictionary chip en gcshape
        if (s.mode === "gcshape") b += R(x0 + 158, y1 - 9, 40, 18, "var(--color-bg-muted)", "var(--color-border-default)", 'rx="4"') + T(x0 + 178, y1 + 4, "dict", "500 8.5px var(--font-mono)", "var(--color-fg-faint)", "middle");
      });
      w.canvas.innerHTML = SVG(W, H, b, 300);
      setMsg(w, s.mode === "mono"
        ? "Monomorfizaci\u00F3n: una copia de c\u00F3digo por tipo (6). R\u00E1pido en dispatch, pero infla el binario."
        : "GCShape: *User y *Order comparten UNA copia (shape *T). 5 copias, pero cada llamada pasa un dictionary \u2192 indirecci\u00F3n.");
    }
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), w.card]));
    notes(t).forEach(function (n) { append(host, n); });
    draw();
  };

})(window.GUIA = window.GUIA || {});
