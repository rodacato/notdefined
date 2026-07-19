/* ============================================================
   page-interfaces-itable.js — widget de la ficha 11:
   el dispatch dinámico por itable.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["interfaces-itable"] = function (host, t) {
    var types = t.viz.types;
    var s = { kind: "iface", concrete: "Circle", calling: null };
    var segC = G.segmented(t.viz.concreteOptions, s.concrete, function (v) { s.concrete = v; s.calling = null; buildMethods(); draw("valor concreto: " + v); });
    var segK = G.segmented(t.viz.kindOptions, s.kind, function (v) { s.kind = v; s.calling = null; buildMethods(); draw(v === "eface" ? "any: par (_type, data), sin m\u00E9todos." : "Shape: par (itab, data), con tabla de m\u00E9todos."); });
    var reset = G.button("Reset", "reset", "btn-ghost", function () { s.kind = "iface"; s.concrete = "Circle"; s.calling = null; segC._set("Circle"); segK._set("iface"); buildMethods(); draw("Elige un valor y pulsa un m\u00E9todo para ver el dispatch."); });
    var topBar = el(".viz-bar", {}, [el("span.viz-label", { text: "valor" }), segC, el("span", { style: "width:1px;height:24px;background:var(--color-border-strong)" }), el("span.viz-label", { text: "tipo est\u00E1tico" }), segK, el(".viz-spacer"), reset]);
    var canvas = el(".viz-canvas");
    var methodWrap = el("div", { style: "display:flex;gap:8px" });
    var statusMsg = el("span.msg");
    var botBar = el(".viz-bar.bottom", {}, [el("span.viz-label", { text: "llamar m\u00E9todo \u2192" }), methodWrap, el(".viz-spacer"), statusMsg]);
    var card = el(".viz-card", {}, [topBar, canvas, botBar]);
    var w = { canvas: canvas, status: statusMsg, statusTag: { textContent: "" } };
    function buildMethods() {
      G.clear(methodWrap);
      types[s.concrete].methods.forEach(function (m) {
        var b = el("button.mbtn", { type: "button", text: "." + m.name + "()", on: { click: function () { call(m.name); } } });
        if (s.kind === "eface") b.disabled = true;
        b.setAttribute("aria-pressed", s.calling === m.name ? "true" : "false");
        append(methodWrap, b);
      });
    }
    function call(m) { if (s.kind === "eface") { setMsg(w, "any no tiene m\u00E9todos \u2014 hace falta un type assertion primero."); return; } s.calling = m; buildMethods(); draw("dispatch: itab \u2192 itable[" + m + "] \u2192 " + s.concrete + "." + m + "()"); }
    function box(x, y, w2, h, fill, stroke, sw, dash) { return R(x, y, w2, h, fill || "var(--color-bg-canvas)", stroke || "var(--color-border-strong)", 'rx="10" stroke-width="' + (sw || 1) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "")); }
    function draw(ev) {
      var ty = types[s.concrete], isE = s.kind === "eface", W = 780, H = 356, A = "var(--fam-tipos)", b = "";
      if (s.concrete === "Rect") A = "var(--fam-conc)";
      // interface var (izq)
      b += R(24, 118, 150, 120, "var(--color-bg-lit)", A, 'rx="12" stroke-width="1.5"');
      b += T(34, 108, isE ? "var x any" : "var s Shape", "500 10px var(--font-mono)", "var(--color-fg-faint)");
      b += R(40, 132, 118, 40, "var(--color-bg-muted)", null, 'rx="7"');
      b += R(40, 182, 118, 40, "var(--color-bg-muted)", null, 'rx="7"');
      b += T(50, 149, isE ? "_type" : "tab", "500 10px var(--font-mono)", "var(--color-fg-faint)");
      b += T(50, 165, isE ? "*Type" : "*itab", "600 12px var(--font-mono)", A);
      b += T(50, 199, "data", "500 10px var(--font-mono)", "var(--color-fg-faint)");
      b += T(50, 215, "*val", "600 12px var(--font-mono)", "var(--color-fg-default)");
      var itX = 268, itY = 34, itW = 232;
      if (isE) { b += box(itX, itY, itW, 74, "var(--color-bg-canvas)", "var(--role-actor)", 1.5); b += T(itX + 14, itY + 24, "_type  \u00B7  " + s.concrete, "600 11px var(--font-mono)", "var(--role-actor)"); b += T(itX + 14, itY + 48, "sin tabla de m\u00E9todos", "400 12px var(--font-sans)", "var(--color-fg-subtle)"); }
      else {
        var rows = ty.methods.length;
        b += box(itX, itY, itW, 46 + rows * 34, "var(--color-bg-canvas)", A, 1.5);
        b += T(itX + 14, itY + 24, "itab \u00B7 " + s.concrete + " \u2192 Shape", "600 11px var(--font-mono)", A);
        b += '<line x1="' + itX + '" y1="' + (itY + 34) + '" x2="' + (itX + itW) + '" y2="' + (itY + 34) + '" stroke="var(--color-border-default)"/>';
        ty.methods.forEach(function (m, i) { var ry = itY + 34 + i * 34, hot = s.calling === m.name; b += R(itX + 10, ry + 6, itW - 20, 26, hot ? A : "var(--color-bg-muted)", hot ? A : "var(--color-border-default)", 'rx="6"'); b += T(itX + 20, ry + 23, "fun[" + i + "]", "500 10px var(--font-mono)", hot ? "var(--on-accent)" : "var(--color-fg-faint)"); b += T(itX + itW - 20, ry + 23, m.name, "600 11.5px var(--font-mono)", hot ? "var(--on-accent)" : "var(--color-fg-default)", "end"); });
      }
      var dvY = 236;
      b += box(itX, dvY, itW, 62, "var(--color-bg-lit)", "var(--color-border-strong)");
      b += T(itX + 14, dvY + 24, s.concrete + " (valor)", "500 11px var(--font-mono)", "var(--color-fg-faint)");
      b += T(itX + 14, dvY + 46, ty.data, "600 13px var(--font-mono)", "var(--color-fg-default)");
      var imX = 566, imW = 190;
      b += T(imX, 22, "IMPLEMENTACIONES CONCRETAS", "500 10px var(--font-mono)", "var(--color-fg-faint)");
      ty.methods.forEach(function (m, i) { var iy = 34 + i * 74, hot = !isE && s.calling === m.name; b += box(imX, iy, imW, 58, hot ? "color-mix(in srgb," + A + " 14%,var(--color-bg-canvas))" : "var(--color-bg-canvas)", hot ? A : "var(--color-border-default)", hot ? 1.6 : 1); b += T(imX + 14, iy + 24, "func (" + (s.concrete === "Circle" ? "c Circle" : "r Rect") + ")", "600 12px var(--font-mono)", hot ? A : "var(--color-fg-default)"); b += T(imX + 14, iy + 42, m.name + "() \u2192 " + m.body, "600 12.5px var(--font-mono)", hot ? A : "var(--color-fg-default)"); });
      function arrow(x1, y1, x2, y2, on) { b += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (on ? A : "var(--color-border-strong)") + '" stroke-width="' + (on ? 2 : 1.2) + '" marker-end="url(#ar' + (on ? "on" : "off") + ')"/>'; }
      arrow(158, 152, itX, isE ? itY + 37 : itY + 17, s.calling && !isE);
      arrow(158, 202, itX, dvY + 20, false);
      if (!isE && s.calling) { var idx = ty.methods.findIndex(function (m) { return m.name === s.calling; }); arrow(itX + itW, itY + 34 + idx * 34 + 19, imX, 34 + idx * 74 + 29, true); }
      b += "<defs>" + '<marker id="aron" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="' + A + '"/></marker>' + '<marker id="aroff" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-border-strong)"/></marker>' + "</defs>";
      canvas.innerHTML = SVG(W, H, b, 372);
      if (ev) setMsg(w, ev);
    }
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), card]));
    notes(t).forEach(function (n) { append(host, n); });
    buildMethods();
    draw("Elige un valor y pulsa un m\u00E9todo para ver el dispatch.");
  };

})(window.GUIA = window.GUIA || {});
