/* ============================================================
   page-channels-select.js — widget de la ficha 06:
   handshake del channel y el select.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["channels-select"] = function (host, t) {
    var A = acc(t);
    // ---- Widget A: handshake ----
    var s = { buf: 0, queue: [], blockedSend: null, waitingRecv: false, delivered: null, nextId: 1 };
    var sendBtn = G.button("ch <- v", "send", "btn-ctrl", function () { send(); });
    var recvBtn = G.button("<- ch", "recv", "btn-ctrl", function () { recv(); });
    var resetBtn = G.button("Reset", "reset", "btn-ghost", function () { s.queue = []; s.blockedSend = null; s.waitingRecv = false; s.delivered = null; draw("Reiniciado."); });
    var bufVal = el("span.val", { text: "0" });
    var bufIn = el("input", { type: "range", min: "0", max: "3", step: "1", value: "0", style: "width:110px", on: { input: function (e) { setBuf(e.target.value); } } });
    var w = G.vizCard([sendBtn, recvBtn, resetBtn, el(".viz-spacer"),
      el(".slider-group", {}, [el("span.viz-label", { text: "buffer (cap)" }), bufIn, bufVal])], "runtime");

    function setBuf(v) { s.buf = Math.max(0, Math.min(3, parseInt(v, 10))); bufVal.textContent = s.buf; s.queue = []; s.blockedSend = null; s.waitingRecv = false; s.delivered = null; draw(s.buf === 0 ? "Sin buffer (cap 0): cada env\u00EDo es una cita directa con un receptor." : "Buffer " + s.buf + ": caben " + s.buf + " env\u00EDos sin receptor."); }
    function send() {
      var ev;
      if (s.blockedSend) { draw("Emisor ya BLOQUEADO: espera a que alguien reciba."); return; }
      var tok = { id: s.nextId, val: s.nextId };
      if (s.waitingRecv) { s.waitingRecv = false; s.delivered = tok; ev = "Rendezvous: el receptor esperaba \u2192 g" + tok.val + " pasa directo, sin tocar el buffer."; }
      else if (s.queue.length < s.buf) { s.queue.push(tok); ev = "Encolado en buffer (" + s.queue.length + "/" + s.buf + "). El env\u00EDo NO bloquea."; }
      else { s.blockedSend = tok; ev = s.buf === 0 ? "Env\u00EDo BLOQUEADO: sin buffer y sin receptor. La goroutine se aparca." : "Env\u00EDo BLOQUEADO: buffer lleno (" + s.buf + "/" + s.buf + ")."; }
      s.nextId++; draw(ev);
    }
    function recv() {
      var ev;
      if (s.queue.length > 0) { var tok = s.queue.shift(); s.delivered = tok; if (s.blockedSend) { s.queue.push(s.blockedSend); s.blockedSend = null; ev = "Receptor toma g" + tok.val + " del buffer; el emisor bloqueado entra al buffer."; } else ev = "Receptor toma g" + tok.val + " del buffer."; }
      else if (s.blockedSend) { s.delivered = s.blockedSend; ev = "Rendezvous: el emisor bloqueado entrega g" + s.blockedSend.val + " y se desbloquea."; s.blockedSend = null; }
      else if (s.waitingRecv) { ev = "Receptor ya BLOQUEADO esperando dato."; }
      else { s.waitingRecv = true; ev = "Receptor BLOQUEADO: canal vac\u00EDo. La goroutine se aparca hasta que llegue un env\u00EDo."; }
      draw(ev);
    }
    function draw(ev) {
      var W = 760, H = 210, sx = 30, sw = 168, rx = W - 30 - sw, midY = 108, boxY = 62, boxH = 92;
      var pipeL = sx + sw + 24, pipeR = rx - 24, pipeW = pipeR - pipeL, b = "";
      b += R(sx, boxY, sw, boxH, s.blockedSend ? "color-mix(in srgb,var(--role-fail) 12%,var(--color-bg-canvas))" : "var(--color-bg-canvas)", s.blockedSend ? "var(--role-fail)" : "var(--color-border-strong)", 'rx="12"');
      b += T(sx + 14, boxY + 22, "goroutine A", "600 12px var(--font-mono)", "var(--role-actor)");
      b += T(sx + 14, boxY + 40, "ch <- v", "500 11px var(--font-mono)", "var(--color-fg-subtle)");
      b += T(sx + 14, boxY + 78, s.blockedSend ? "\u23F8 aparcada (bloqueada)" : "lista", "500 10px var(--font-sans)", s.blockedSend ? "var(--role-fail)" : "var(--color-fg-faint)");
      b += R(rx, boxY, sw, boxH, s.waitingRecv ? "color-mix(in srgb,var(--role-fail) 12%,var(--color-bg-canvas))" : "var(--color-bg-canvas)", s.waitingRecv ? "var(--role-fail)" : "var(--color-border-strong)", 'rx="12"');
      b += T(rx + sw - 14, boxY + 22, "goroutine B", "600 12px var(--font-mono)", "var(--fam-conc)", "end");
      b += T(rx + sw - 14, boxY + 40, "v := <- ch", "500 11px var(--font-mono)", "var(--color-fg-subtle)", "end");
      b += T(rx + sw - 14, boxY + 78, s.waitingRecv ? "\u23F8 aparcada (bloqueada)" : "lista", "500 10px var(--font-sans)", s.waitingRecv ? "var(--role-fail)" : "var(--color-fg-faint)", "end");
      b += T(pipeL, boxY - 8, s.buf === 0 ? "CHANNEL \u00B7 SIN BUFFER (cita directa)" : "CHANNEL \u00B7 BUFFER " + s.buf, "500 9px var(--font-mono)", "var(--color-fg-faint)", null, "letter-spacing:.12em");
      var cellW = 52, gap = 12, total, startX;
      if (s.buf === 0) b += R(pipeL, midY - 22, pipeW, 44, "var(--color-bg-muted)", "var(--color-border-default)", 'rx="10" stroke-dasharray="4 4"');
      else { total = s.buf * cellW + (s.buf - 1) * gap; startX = pipeL + (pipeW - total) / 2; for (var i = 0; i < s.buf; i++) { var filled = i < s.queue.length; b += R(startX + i * (cellW + gap), midY - 22, cellW, 44, "var(--color-bg-muted)", filled ? A : "var(--color-border-default)", 'rx="9"'); } }
      b += '<path d="M ' + (sx + sw + 4) + ' ' + midY + ' L ' + (pipeL - 4) + ' ' + midY + '" stroke="var(--color-border-strong)" stroke-width="1.5" marker-end="url(#arh)"/>';
      b += '<path d="M ' + (pipeR + 4) + ' ' + midY + ' L ' + (rx - 4) + ' ' + midY + '" stroke="var(--color-border-strong)" stroke-width="1.5" marker-end="url(#arh)"/>';
      function tokPos(loc, i) { if (loc === "sender") return [sx + sw - 30, midY]; if (loc === "receiver") return [rx + 30, midY]; if (s.buf === 0) return [pipeL + pipeW / 2, midY]; var st = pipeL + (pipeW - (s.buf * cellW + (s.buf - 1) * gap)) / 2; return [st + i * (cellW + gap) + cellW / 2, midY]; }
      var toks = [];
      if (s.blockedSend) toks.push([s.blockedSend, "sender", 0]);
      s.queue.forEach(function (tk, i) { toks.push([tk, "buf", i]); });
      if (s.delivered) toks.push([s.delivered, "receiver", 0]);
      toks.forEach(function (tk) { var p = tokPos(tk[1], tk[2]), isR = tk[1] === "receiver"; b += '<g transform="translate(' + p[0] + ',' + p[1] + ')"><circle r="14" fill="' + (isR ? "var(--role-service)" : A) + '"/>' + T(0, 0, "g" + tk[0].val, "600 11px var(--font-mono)", "var(--on-accent)", "middle", "dominant-baseline:middle") + "</g>"; });
      b += "<defs>" + marker("arh", "var(--color-border-strong)") + "</defs>";
      w.canvas.innerHTML = SVG(W, H, b, 220);
      if (ev) setMsg(w, ev);
    }

    // ---- Widget B: select ----
    var sel = { chans: [{ id: 1, ready: false }, { id: 2, ready: false }, { id: 3, ready: false }], winner: null };
    var selCanvas = el("div", { style: "padding:10px 14px 4px" });
    var selMsg = el("div", { style: "padding:11px 16px;border-top:1px solid var(--color-border-default);background:var(--color-bg-muted);font-family:var(--font-mono);font-size:12.5px;color:var(--color-fg-default)", text: "elige ramas y ejecuta" });
    var runSel = G.button("ejecutar select", "bolt", "btn-primary", function () {
      var ready = sel.chans.filter(function (c) { return c.ready; });
      if (!ready.length) { sel.winner = "default"; } else { sel.winner = ready[Math.floor(Math.random() * ready.length)].id; }
      drawSel();
    });
    var clearSel = G.button("limpiar", null, "btn-ghost", function () { sel.chans.forEach(function (c) { c.ready = false; }); sel.winner = null; drawSel(); });
    function drawSel() {
      G.clear(selCanvas);
      var row = el("div", { style: "display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:6px 0 14px" });
      sel.chans.forEach(function (c) {
        var won = sel.winner === c.id;
        var chip = el("button", { type: "button", "aria-pressed": c.ready ? "true" : "false", style: "font-family:var(--font-mono);font-size:12px;font-weight:600;padding:8px 16px;border-radius:10px;cursor:pointer;transition:all .14s;background:" + (won ? "var(--role-service)" : c.ready ? "color-mix(in srgb,var(--role-warning) 20%,var(--color-bg-canvas))" : "var(--color-bg-muted)") + ";color:" + (won ? "var(--on-accent)" : "var(--color-fg-default)") + ";border:1px solid " + (won ? "var(--role-service)" : c.ready ? "var(--role-warning)" : "var(--color-border-default)"), on: { click: function () { c.ready = !c.ready; sel.winner = null; drawSel(); } } });
        chip.innerHTML = "ch" + c.id + " <span style='font-weight:400;opacity:.8'>" + (c.ready ? "listo" : "vac\u00EDo") + "</span>";
        append(row, chip);
      });
      append(selCanvas, row);
      var selBox = el("div", { style: "text-align:center;font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--color-bg-canvas);background:var(--color-fg-default);border-radius:10px;padding:8px;max-width:120px;margin:0 auto", text: "select" });
      append(selCanvas, selBox);
      var label = sel.winner === "default" ? "nada listo \u2192 default" : sel.winner ? "gana ch" + sel.winner : "si varias est\u00E1n listas, elige una al azar";
      selMsg.textContent = label;
      selMsg.style.color = sel.winner && sel.winner !== "default" ? "var(--role-service)" : "var(--color-fg-default)";
    }
    var selCard = el(".viz-card", {}, [
      el(".viz-bar", {}, [el("span.viz-label", { text: "clic para marcar un channel \u00ABlisto\u00BB, luego ejecuta el select" })]),
      selCanvas,
      el(".viz-bar.bottom", {}, [runSel, clearSel]),
      selMsg
    ]);
    var codeB = G.codeblock("select \u00B7 una rama gana", t.viz.selectCode);

    // ensamblado
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.titleA }), w.card]));
    append(host, notes(t)[0] || el("span"));
    append(host, el(".section", {}, [
      el(".eyebrow-line", { html: t.viz.titleB }),
      el(".grid-2", {}, [selCard, codeB])
    ]));
    if (notes(t)[1]) append(host, notes(t)[1]);
    draw(s.buf === 0 ? "Sin buffer (cap 0): un env\u00EDo espera a un receptor. Pulsa \u00ABch <- v\u00BB." : "");
    drawSel();
  };

})(window.GUIA = window.GUIA || {});
