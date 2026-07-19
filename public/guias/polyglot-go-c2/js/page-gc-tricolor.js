/* ============================================================
   page-gc-tricolor.js — widget de la ficha 08:
   marcado tricolor, write barrier y pacer.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["gc-tricolor"] = function (host, t) {
    function initGraph() {
      var nodes = [
        { id: "r0", x: 52, y: 78, root: true }, { id: "r1", x: 52, y: 168, root: true },
        { id: "n1", x: 168, y: 54 }, { id: "n2", x: 168, y: 150 }, { id: "n3", x: 168, y: 220 },
        { id: "n4", x: 288, y: 40 }, { id: "n5", x: 288, y: 120 }, { id: "n6", x: 288, y: 210 },
        { id: "n7", x: 410, y: 70 }, { id: "n8", x: 410, y: 175 },
        { id: "g1", x: 560, y: 70 }, { id: "g2", x: 560, y: 170 }, { id: "g3", x: 648, y: 120 },
        // huérfano: nadie lo apunta nunca, es la basura que el barrido sí libera en ambos modos
        { id: "x1", x: 560, y: 242 }
      ].map(function (n) { return Object.assign({ color: "white", gone: false, wrong: false }, n); });
      var edges = [["r0", "n1"], ["r0", "n2"], ["r1", "n3"], ["n1", "n4"], ["n2", "n5"], ["n3", "n6"], ["n5", "n7"], ["n6", "n8"], ["n4", "n7"], ["g1", "g2"], ["g2", "g3"]].map(function (e) { return { f: e[0], t: e[1] }; });
      return { nodes: nodes, edges: edges };
    }
    var g = initGraph();
    var s = { nodes: g.nodes, edges: g.edges, phase: "idle", running: false, mutatorDone: false, blackened: 0, barrier: true, gogc: 100 };
    var timer = null;
    G.addCleanup(function () { if (timer) clearInterval(timer); });

    var playBtn = G.button("Reproducir", "play", "btn-primary", function () { if (s.phase === "done") doReset(); s.running = !s.running; syncPlay(); });
    var stepBtn = G.button("Paso", "next", "btn-ctrl", function () { step(); });
    var resetBtn = G.button("Reset", "reset", "btn-ghost", function () { doReset(); });
    var barrierBtn = el("button.mini-toggle.on", { type: "button", text: "ON", on: { click: function () { s.barrier = !s.barrier; doReset(); } } });
    var w = G.vizCard([playBtn, stepBtn, resetBtn, el(".viz-spacer"),
      el("span.viz-label", { text: "write barrier" }), barrierBtn], "en reposo");

    function node(id) { return s.nodes.find(function (n) { return n.id === id; }); }
    function edgesFrom(id) { return s.edges.filter(function (e) { return e.f === id; }); }
    // nodos que el programa volvió alcanzables vía una arista de mutación:
    // si el barrido los toca aún blancos, eso es el puntero colgante que la
    // write barrier existe para evitar.
    function mutatorReachable() {
      var seen = {}, stack = s.edges.filter(function (e) { return e.mut; }).map(function (e) { return e.t; });
      while (stack.length) { var id = stack.pop(); if (seen[id]) continue; seen[id] = true; edgesFrom(id).forEach(function (e) { stack.push(e.t); }); }
      return seen;
    }
    function syncPlay() { playBtn.querySelector("span:last-child").textContent = s.running ? "Pausa" : (s.phase === "done" ? "Completo" : "Reproducir"); playBtn.querySelector("svg").outerHTML = G.icon(s.running ? "pause" : "play", 18); }
    function step() {
      var color;
      if (s.phase === "done") { return; }
      if (s.phase === "idle") { s.nodes.forEach(function (n) { if (n.root) n.color = "gray"; }); s.phase = "mark"; return draw("Marcado iniciado: las ra\u00EDces se pintan grises."); }
      if (s.phase === "mark") {
        if (!s.mutatorDone && node("n4").color === "black") {
          s.edges.push({ f: "n4", t: "g1", mut: true }); s.mutatorDone = true;
          if (s.barrier) { var g1 = node("g1"); if (g1.color === "white") g1.color = "gray"; return draw("\u270E El programa conecta n4 \u2192 g1 durante el marcado. La WRITE BARRIER pinta g1 gris: se salva.", "var(--positive)"); }
          return draw("\u270E El programa conecta n4 \u2192 g1, pero la write barrier est\u00E1 APAGADA: el GC no se entera.", "var(--role-fail)");
        }
        var gray = s.nodes.find(function (n) { return n.color === "gray"; });
        if (gray) { gray.color = "black"; s.blackened++; var kids = edgesFrom(gray.id).map(function (e) { return node(e.t); }).filter(Boolean), grayed = []; kids.forEach(function (k) { if (k.color === "white") { k.color = "gray"; grayed.push(k.id); } }); return draw("Escaneo de " + gray.id + " \u2192 negro." + (grayed.length ? " Hijos a gris: " + grayed.join(", ") + "." : " Sin hijos blancos.")); }
        s.phase = "sweep"; return draw("No quedan grises. Lo blanco es basura \u2192 barrido.");
      }
      if (s.phase === "sweep") {
        var white = s.nodes.find(function (n) { return n.color === "white" && !n.gone; });
        if (white) { white.gone = true; if (mutatorReachable()[white.id]) { white.wrong = true; return draw("\u26A0 Se recolecta " + white.id + " \u2014 \u00A1pero el programa lo hab\u00EDa hecho vivo! Puntero colgante.", "var(--role-fail)"); } return draw("Barrido: se libera " + white.id + " (basura)."); }
        s.phase = "done"; s.running = false; return draw("Ciclo completo. El heap vivo permanece; la basura (x1) fue liberada.", "var(--positive)");
      }
    }
    function doReset() { var ng = initGraph(); s.nodes = ng.nodes; s.edges = ng.edges; s.phase = "idle"; s.running = false; s.mutatorDone = false; s.blackened = 0; draw("Reiniciado. " + (s.barrier ? "Write barrier ON." : "Write barrier OFF \u2014 ver\u00E1s el bug.")); }
    // el color del nodo ES el dato: fijo en ambos temas (ver --tri-* en styles.css)
    function fillFor(c) { return c === "black" ? "var(--tri-black)" : c === "gray" ? "var(--tri-gray)" : "var(--tri-white)"; }
    function inkFor(c) { return c === "black" ? "var(--tri-ink-on-dark)" : "var(--tri-ink-on-light)"; }
    function draw(ev, color) {
      var W = 720, H = 264, b = "";
      b += R(24, 34, 60, 200, "var(--color-bg-muted)", "var(--color-border-default)", 'rx="10" stroke-dasharray="4 4"');
      b += T(54, 24, "RA\u00CDCES", "500 9px var(--font-mono)", "var(--color-fg-faint)", "middle", "letter-spacing:.1em");
      s.edges.forEach(function (e) { var a = node(e.f), c = node(e.t); if (!a || !c) return; var faded = (a.gone || c.gone) ? 0.12 : 1; b += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + c.x + '" y2="' + c.y + '" stroke="' + (e.mut ? "var(--role-fail)" : "var(--color-border-strong)") + '" stroke-width="' + (e.mut ? 2 : 1.3) + '"' + (e.mut ? ' stroke-dasharray="5 3"' : "") + ' opacity="' + faded + '"/>'; });
      s.nodes.forEach(function (n) { var stroke = n.wrong ? "var(--role-fail)" : "var(--tri-edge)"; var txtC = inkFor(n.color); var op = n.gone ? (n.wrong ? 0.4 : 0) : 1; b += '<g opacity="' + op + '"><circle cx="' + n.x + '" cy="' + n.y + '" r="15" fill="' + (n.wrong ? "color-mix(in srgb,var(--role-fail) 20%,var(--color-bg-canvas))" : fillFor(n.color)) + '" stroke="' + stroke + '" stroke-width="1.8"/>' + T(n.x, n.y + 3, n.id, "600 10px var(--font-mono)", n.wrong ? "var(--role-fail)" : txtC, "middle") + "</g>"; });
      w.canvas.innerHTML = SVG(W, H, b, 300);
      var tag = { idle: "en reposo", mark: "fase \u00B7 marcado", sweep: "fase \u00B7 barrido", done: "completo" }[s.phase];
      w.statusTag.textContent = tag;
      if (ev) setMsg(w, ev, color);
      syncPlay();
    }
    timer = setInterval(function () { if (s.running) step(); }, 760);

    // ---- pacer ----
    var pacerCanvas = el("div", { style: "margin-top:14px" });
    var gogcVal = el("span.gogc-val", { text: "100" });
    var gogcNote = el("p.note", {});
    var gogcIn = el("input", { type: "range", min: "25", max: "400", step: "25", value: "100", style: "width:220px", on: { input: function (e) { s.gogc = parseInt(e.target.value, 10); drawPacer(); } } });
    function drawPacer() {
      gogcVal.textContent = s.gogc;
      gogcNote.textContent = s.gogc <= 50 ? "GC muy frecuente: m\u00EDnima RAM, m\u00E1s CPU en recolecci\u00F3n." : s.gogc >= 250 ? "GC infrecuente: m\u00E1xima CPU libre, pico de RAM alto." : "Equilibrio por defecto (GOGC=100): el heap dobla su tama\u00F1o vivo antes de recolectar.";
      // H deja aire para la etiqueta bajo la barra (barY+barH+22 = 62)
      var W = 640, H = 76, barY = 18, barH = 22, x0 = 8, bw = W - 16, live = 30, th = Math.max(24, Math.min(94, 22 + s.gogc / 5.4)), b = "";
      b += R(x0, barY, bw, barH, "var(--color-bg-muted)", "var(--color-border-default)", 'rx="6"');
      b += R(x0, barY, bw * live / 100, barH, "color-mix(in srgb,var(--fam-mem) 30%,transparent)", null, 'rx="6"');
      b += T(x0 + 8, barY + 15, "heap vivo", "600 10px var(--font-mono)", "var(--fam-mem)");
      var tx = x0 + bw * th / 100;
      b += '<line x1="' + tx + '" y1="' + (barY - 8) + '" x2="' + tx + '" y2="' + (barY + barH + 8) + '" stroke="var(--color-primary)" stroke-width="2"/>';
      b += T(tx, barY - 12, "arranca GC", "600 9.5px var(--font-mono)", "var(--color-primary)", "middle");
      b += T(x0 + bw, barY + barH + 22, "crecimiento del heap \u2192", "500 9px var(--font-mono)", "var(--color-fg-faint)", "end");
      pacerCanvas.innerHTML = SVG(W, H, b, 86);
    }

    // ensamblado
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), w.card]));
    if (notes(t)[0]) append(host, notes(t)[0]);
    append(host, el(".section", {}, [
      el(".eyebrow-line", { html: t.viz.pacerTitle }),
      el(".pacer-box", {}, [
        el(".pacer-row", {}, [el("span.gogc-lbl", { text: "GOGC" }), gogcIn, gogcVal, gogcNote]),
        pacerCanvas
      ])
    ]));
    if (notes(t)[1]) append(host, notes(t)[1]);
    draw("Ra\u00EDces en la pila (izquierda). Pulsa \u00ABPaso\u00BB o reproduce para marcar.");
    drawPacer();
  };

})(window.GUIA = window.GUIA || {});
