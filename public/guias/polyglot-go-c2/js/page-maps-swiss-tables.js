/* ============================================================
   page-maps-swiss-tables.js — widget de la ficha 13:
   inserción, palabra de control y split.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["maps-swiss-tables"] = function (host, t) {
    var s = { tables: [{ slots: new Array(8).fill(null) }], nextK: 1, lookup: null, splits: 0 };
    var loadSpan = el("span.viz-count", { text: "load 0% \u00B7 m\u00E1x 87.5%" });
    var insertBtn = G.button("insertar clave", "add", "btn-primary", function () { insert(); });
    var lookupBtn = G.button("buscar \u00FAltima", "search", "btn-ctrl", function () { lookup(); });
    var reset = G.button("Reset", "reset", "btn-ghost", function () { s.tables = [{ slots: new Array(8).fill(null) }]; s.nextK = 1; s.lookup = null; s.splits = 0; draw("Reiniciado."); });
    var w = G.vizCard([insertBtn, lookupBtn, reset, el(".viz-spacer"), loadSpan], "runtime");
    function hashOf(k) { var x = (k * 2654435761) >>> 0; return { group: x >>> 29, h2: (x & 0x7f) }; }
    function insert() {
      var key = "k" + s.nextK, hp = hashOf(s.nextK), tIdx = hp.group % s.tables.length, tb = s.tables[tIdx], placed = -1, start = hp.h2 % 8;
      for (var i = 0; i < 8; i++) { var j = (start + i) % 8; if (!tb.slots[j]) { tb.slots[j] = { key: key, h2: hp.h2 }; placed = j; break; } }
      var ev = placed < 0 ? "Tabla llena \u2014 split antes de insertar." : "insertar " + key + " \u2192 tabla " + tIdx + ", H2=0x" + hp.h2.toString(16).padStart(2, "0") + " \u2192 slot " + placed;
      var filled = tb.slots.filter(Boolean).length;
      s.lookup = { key: key, tIdx: tIdx, slot: placed, h2: hp.h2 };
      if (filled >= 7) { var nt1 = { slots: new Array(8).fill(null) }, nt2 = { slots: new Array(8).fill(null) }, a = 0, bb = 0; tb.slots.filter(Boolean).forEach(function (e, i) { if (i % 2 === 0) nt1.slots[a++ % 8] = e; else nt2.slots[bb++ % 8] = e; }); s.tables.splice(tIdx, 1, nt1, nt2); s.splits++; ev += " \u00B7 load 87.5% \u2192 SPLIT (aqu\u00ED, del grupo lleno en 2)."; s.lookup = null; }
      s.nextK++; draw(ev);
    }
    function lookup() { if (s.nextK <= 1) return; var k = s.nextK - 1, hp = hashOf(k), tIdx = hp.group % s.tables.length; s.lookup = { key: "k" + k, tIdx: tIdx, slot: null, h2: hp.h2, scanning: true }; draw("buscar k" + k + " \u2192 tabla " + tIdx + ": compara H2=0x" + hp.h2.toString(16).padStart(2, "0") + " contra los 8 bytes de control de un golpe."); }
    function draw(ev) {
      var W = 780, H = 232, b = "", tW = 340, tGap = 30, totalW = s.tables.length * tW + (s.tables.length - 1) * tGap, ox = Math.max(20, (W - totalW) / 2);
      s.tables.forEach(function (tb, ti) {
        var x0 = ox + ti * (tW + tGap);
        b += T(x0, 22, "TABLA " + ti + "  \u00B7  grupo de 8", "600 10px var(--font-mono)", "var(--fam-tipos)", null, "letter-spacing:.1em");
        b += T(x0, 44, "palabra de control (H2 por slot) \u2192", "500 9px var(--font-mono)", "var(--color-fg-faint)");
        var cw = 38, gp = 4, cy = 54;
        for (var i = 0; i < 8; i++) { var cx = x0 + i * (cw + gp), slot = tb.slots[i], isHit = s.lookup && s.lookup.tIdx === ti && slot && slot.h2 === s.lookup.h2, scanning = s.lookup && s.lookup.scanning && s.lookup.tIdx === ti; b += R(cx, cy, cw, 22, isHit && scanning ? "var(--role-service)" : slot ? "var(--color-bg-muted)" : "var(--color-bg-canvas)", scanning ? "var(--fam-tipos)" : "var(--color-border-default)", 'rx="4" stroke-width="' + (scanning ? 1.4 : 1) + '"'); b += T(cx + cw / 2, cy + 15, slot ? slot.h2.toString(16).padStart(2, "0") : "\u00B7\u00B7", "500 9px var(--font-mono)", isHit && scanning ? "var(--on-accent)" : slot ? "var(--color-fg-subtle)" : "var(--color-fg-faint)", "middle"); }
        var sy = 86, sh = 44;
        for (var j = 0; j < 8; j++) { var cx2 = x0 + j * (cw + gp), slot2 = tb.slots[j], jp = s.lookup && !s.lookup.scanning && s.lookup.tIdx === ti && s.lookup.slot === j; b += R(cx2, sy, cw, sh, slot2 ? (jp ? "color-mix(in srgb,var(--fam-tipos) 18%,var(--color-bg-canvas))" : "var(--color-bg-canvas)") : "var(--color-bg-muted)", jp ? "var(--fam-tipos)" : "var(--color-border-default)", 'rx="6" stroke-width="' + (jp ? 1.6 : 1) + '"' + (slot2 ? "" : ' stroke-dasharray="3 3"')); if (slot2) b += T(cx2 + cw / 2, sy + 27, slot2.key, "600 12px var(--font-mono)", "var(--color-fg-default)", "middle"); b += T(cx2 + cw / 2, sy + sh + 13, String(j), "500 8px var(--font-mono)", "var(--color-fg-faint)", "middle"); }
      });
      if (s.splits > 0) b += T(W / 2, H - 6, s.splits + " split(s) \u00B7 extendible hashing: los bits altos del hash eligen la tabla", "500 10px var(--font-sans)", "var(--fam-tipos)", "middle");
      w.canvas.innerHTML = SVG(W, H, b, 244);
      var totalSlots = s.tables.length * 8, filled = s.tables.reduce(function (a, tb) { return a + tb.slots.filter(Boolean).length; }, 0);
      loadSpan.textContent = "load " + Math.round(filled / totalSlots * 100) + "% \u00B7 m\u00E1x 87.5%";
      if (ev) setMsg(w, ev);
    }
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), w.card]));
    notes(t).forEach(function (n) { append(host, n); });
    draw("Un directorio con 1 tabla \u00B7 grupos de 8 slots. Inserta claves y observa H1/H2.");
  };

})(window.GUIA = window.GUIA || {});
