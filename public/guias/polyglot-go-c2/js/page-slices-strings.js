/* ============================================================
   page-slices-strings.js — widget de la ficha 12:
   el header del slice y los bytes del string.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["slices-strings"] = function (host, t) {
    var A = "var(--fam-conc)";
    var s = { arrId: 0, backing: [4, 1, 5, 9], cap: 4, sOff: 0, sLen: 4, tOff: null, tLen: 0 };
    var appendBtn = G.button("append(s, x)", "add", "btn-ctrl", function () { doAppend(); });
    var resliceBtn = G.button("t := s[1:3]", "cut", "btn-ctrl", function () { reslice(); });
    var mutateBtn = G.button("t[0] = 9", "edit", "btn-ctrl", function () { mutate(); });
    var reset = G.button("Reset", "reset", "btn-ghost", function () { s.arrId++; s.backing = [4, 1, 5, 9]; s.cap = 4; s.sOff = 0; s.sLen = 4; s.tOff = null; s.tLen = 0; draw("s := []int{4,1,5,9} \u00B7 len=4 cap=4."); });
    var w = G.vizCard([appendBtn, resliceBtn, mutateBtn, reset], "runtime");
    function doAppend() {
      if (s.sLen < s.cap) { var idx = s.sOff + s.sLen; s.backing[idx] = 7; s.sLen++; draw("Cabe en cap (" + s.sLen + "/" + s.cap + "): escribe in situ. Quien comparta el array lo ve."); }
      else { var cur = s.backing.slice(s.sOff, s.sOff + s.sLen); cur.push(7); var oldCap = s.cap; s.cap = s.cap * 2; s.backing = cur.slice(); s.arrId++; s.sOff = 0; s.sLen = cur.length; s.tOff = null; s.tLen = 0; draw("No cab\u00EDa: array NUEVO (cap " + oldCap + "\u2192" + s.cap + "), copia y se desliga. t sigue apuntando al array viejo, que ya sali\u00F3 del dibujo: desde aqu\u00ED s y t no comparten memoria."); }
    }
    function reslice() { if (s.sLen < 3) { setMsg(w, "s es corto; reinicia para probar t := s[1:3]."); return; } s.tOff = s.sOff + 1; s.tLen = 2; draw("t := s[1:3] \u00B7 comparte el MISMO array de respaldo que s (offset 1)."); }
    function mutate() { if (s.tOff == null) { setMsg(w, "Primero crea t con \u00ABt := s[1:3]\u00BB."); return; } s.backing[s.tOff] = 9; draw("t[0] = 9 escribe en el array compartido \u2192 s[1] TAMBI\u00C9N cambia a 9. Aliasing."); }
    function draw(ev) {
      var W = 780, H = 200, cellW = 66, gap = 8, startX = 40, rowY = 96, cellH = 48, b = "", n = Math.max(s.backing.length, s.cap);
      b += T(startX, rowY - 16, "ARRAY DE RESPALDO #" + s.arrId + "  \u00B7  cap " + s.cap, "500 10px var(--font-mono)", "var(--color-fg-faint)", null, "letter-spacing:.12em");
      for (var i = 0; i < n; i++) { var x = startX + i * (cellW + gap), inCap = i < s.cap, hasVal = i < s.backing.length; b += R(x, rowY, cellW, cellH, hasVal ? "var(--color-bg-canvas)" : "var(--color-bg-muted)", inCap ? "var(--color-border-strong)" : "var(--color-border-default)", 'rx="8"' + (hasVal ? "" : ' stroke-dasharray="4 4"')); if (hasVal) b += T(x + cellW / 2, rowY + 31, String(s.backing[i]), "600 17px var(--font-mono)", "var(--color-fg-default)", "middle"); b += T(x + cellW / 2, rowY + cellH + 15, "[" + i + "]", "500 10px var(--font-mono)", "var(--color-fg-faint)", "middle"); }
      function bracket(off, len, y, color, label, capTxt) { if (len <= 0) return ""; var x0 = startX + off * (cellW + gap) - 3, x1 = startX + (off + len - 1) * (cellW + gap) + cellW + 3; var r = '<path d="M ' + x0 + ' ' + (y + 10) + ' L ' + x0 + ' ' + y + ' L ' + x1 + ' ' + y + ' L ' + x1 + ' ' + (y + 10) + '" stroke="' + color + '" stroke-width="2" fill="none"/>'; r += T((x0 + x1) / 2, y - 6, label + " len=" + len + " cap=" + capTxt, "600 12px var(--font-mono)", color, "middle"); return r; }
      b += bracket(s.sOff, s.sLen, rowY - 4 + cellH + 30, A, "s", String(s.cap - s.sOff));
      if (s.tOff != null) b += bracket(s.tOff, s.tLen, 40, "var(--fam-mem)", "t", "\u2026");
      w.canvas.innerHTML = SVG(W, H, b, 210);
      if (ev) setMsg(w, ev);
    }

    // widget B: string bytes
    var str = { word: "café" };
    var strCanvas = el("div", { style: "padding:12px 14px 6px" });
    var strMsg = el("div", { style: "padding:11px 16px;border-top:1px solid var(--color-border-default);background:var(--color-bg-muted);font-family:var(--font-mono);font-size:12.5px;color:var(--color-fg-default)" });
    var wordSeg = G.segmented(t.viz.wordOptions, str.word, function (v) { str.word = v; drawStr(); });
    var strCard = el(".viz-card", {}, [el(".viz-bar", {}, [wordSeg]), strCanvas, strMsg]);
    function drawStr() {
      var glyphs = t.viz.words[str.word], W = 420, H = 176, b = "", bx = 24, byteIdx = 0, bw = 34, bh = 40, gp = 5, ry = 40;
      glyphs.forEach(function (g) { var ch = g[0], nb = g[1], gw = nb * bw + (nb - 1) * gp, color = nb > 1 ? A : "var(--role-service)"; b += T(bx + gw / 2, ry - 10, ch, "600 15px var(--font-mono)", color, "middle"); for (var k = 0; k < nb; k++) { b += R(bx, ry, bw, bh, "var(--color-bg-canvas)", color, 'rx="6"'); b += T(bx + bw / 2, ry + bh + 15, String(byteIdx), "500 10px var(--font-mono)", "var(--color-fg-faint)", "middle"); bx += bw + gp; byteIdx++; } bx += 10; });
      b += T(24, 130, byteIdx + " bytes (len)", "500 11px var(--font-sans)", "var(--color-fg-subtle)");
      b += T(24, 150, glyphs.length + " runas \u00B7 cajas dobles = 2 bytes", "500 11px var(--font-sans)", "var(--color-fg-subtle)");
      strCanvas.innerHTML = SVG(W, H, b, 180);
      strMsg.textContent = 'len("' + str.word + '") = ' + byteIdx + " bytes \u00B7 " + glyphs.length + " runas.";
    }
    var codeB = G.codeblock("len() cuenta bytes, no runas", t.viz.strCode);

    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.titleA }), w.card]));
    if (notes(t)[0]) append(host, notes(t)[0]);
    if (notes(t)[1]) append(host, notes(t)[1]);
    append(host, el(".section", {}, [el(".eyebrow-line", { html: t.viz.titleB }), el(".grid-2", {}, [strCard, codeB])]));
    if (notes(t)[2]) append(host, notes(t)[2]);
    draw("s := []int{4,1,5,9} \u00B7 len=4 cap=4. Prueba append: no cabe \u2192 reasigna.");
    drawStr();
  };

})(window.GUIA = window.GUIA || {});
