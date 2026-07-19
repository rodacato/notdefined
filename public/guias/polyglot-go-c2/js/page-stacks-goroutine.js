/* ============================================================
   page-stacks-goroutine.js — widget de la ficha 10:
   grow & copy de la pila de una goroutine.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["stacks-goroutine"] = function (host, t) {
    var s = { frames: 1, capacity: 4, grewAt: null };
    var callBtn = G.button("llamar (push frame)", "callUp", "btn-ctrl", function () { call(); });
    var retBtn = G.button("return (pop)", "callDown", "btn-ctrl", function () { ret(); });
    var reset = G.button("Reset", "reset", "btn-ghost", function () { s.frames = 1; s.capacity = 4; s.grewAt = null; draw("Reiniciado a 2 KB."); });
    var w = G.vizCard([callBtn, retBtn, reset], "runtime");
    function call() { s.frames++; if (s.frames > s.capacity) { var old = s.capacity; s.capacity *= 2; s.grewAt = s.frames; draw("El marco no cabe \u2192 GROW: pila nueva del doble (" + s.capacity + " marcos), copia de marcos y reajuste de punteros."); } else { s.grewAt = null; draw("push frame #" + s.frames + " \u00B7 cabe en la pila actual (" + s.frames + "/" + s.capacity + ")."); } }
    function ret() { if (s.frames <= 1) { draw("Solo queda el marco ra\u00EDz."); return; } s.frames--; var ev = "return \u00B7 pop frame (" + s.frames + "/" + s.capacity + ")."; if (s.capacity > 4 && s.frames <= s.capacity / 4) { s.capacity /= 2; ev = "return \u00B7 uso bajo \u2192 SHRINK: pila reducida a " + s.capacity + " marcos."; } s.grewAt = null; draw(ev); }
    function draw(ev) {
      var W = 780, H = 260, b = "", frameH = 30, gap = 4, baseY = H - 30, stackX = 300, stackW = 200;
      var kb = Math.round(s.capacity / 4 * 2 * 10) / 10;
      var capY = baseY - (s.capacity * (frameH + gap) + gap), top = Math.max(10, capY - 8);
      b += R(stackX - 8, top, stackW + 16, baseY - top + 8, "var(--color-bg-muted)", s.grewAt ? "var(--role-service)" : "var(--color-border-strong)", 'rx="12" stroke-width="' + (s.grewAt ? 2 : 1) + '" stroke-dasharray="5 4"');
      b += T(stackX + stackW / 2, top - 8, "PILA \u00B7 cap " + s.capacity + " marcos \u00B7 ~" + kb + " KB", "600 11px var(--font-mono)", s.grewAt ? "var(--role-service)" : "var(--color-fg-faint)", "middle");
      for (var i = 0; i < s.frames; i++) { var y = baseY - (i + 1) * (frameH + gap), isTop = i === s.frames - 1; b += R(stackX, y, stackW, frameH, isTop ? "color-mix(in srgb,var(--role-service) 20%,var(--color-bg-canvas))" : "var(--color-bg-canvas)", isTop ? "var(--role-service)" : "var(--color-border-strong)", 'rx="6" stroke-width="' + (isTop ? 1.6 : 1) + '"'); b += T(stackX + 12, y + 20, i === 0 ? "main()" : "recurse() #" + i, "500 12px var(--font-mono)", "var(--color-fg-default)"); }
      if (s.grewAt) { var gy = baseY - s.frames * (frameH + gap); b += T(stackX + stackW + 28, gy + 18, "\u21BB copiada a pila nueva", "600 12px var(--font-mono)", "var(--role-service)"); b += T(stackX + stackW + 28, gy + 36, "punteros reajustados", "500 11px var(--font-sans)", "var(--color-fg-subtle)"); }
      b += T(40, 30, "ESCALA", "500 10px var(--font-mono)", "var(--color-fg-faint)", null, "letter-spacing:.1em");
      b += R(40, 46, 18, 24, "var(--role-service)", null, 'rx="3"'); b += T(66, 62, "goroutine ~2 KB", "500 11px var(--font-sans)", "var(--color-fg-subtle)");
      b += R(40, 82, 18, 120, "var(--fam-comp)", null, 'rx="3" opacity="0.5"'); b += T(66, 146, "hilo SO 1\u20138 MB (fijo)", "500 11px var(--font-sans)", "var(--color-fg-subtle)");
      w.canvas.innerHTML = SVG(W, H, b, 268);
      if (ev) setMsg(w, ev);
    }
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), w.card]));
    notes(t).forEach(function (n) { append(host, n); });
    draw("Pila de 2 KB, capacidad 4 marcos. Llama funciones para llenarla.");
  };

})(window.GUIA = window.GUIA || {});
