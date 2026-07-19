/* ============================================================
   page-scheduler-gmp.js — widget de la ficha 05:
   el scheduler GMP y el work-stealing.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["scheduler-gmp"] = function (host, t) {
    var A = "var(--fam-conc)";
    var s = { gmp: 2, running: false, tick: 0, goroutines: [], nextId: 1 };
    var timer = null;
    G.addCleanup(function () { if (timer) clearInterval(timer); });

    function localsOf(p) { return s.goroutines.filter(function (g) { return g.loc.t === "local" && g.loc.p === p; }); }
    function runOf(p) { return s.goroutines.find(function (g) { return g.loc.t === "run" && g.loc.p === p; }); }
    function globals() { return s.goroutines.filter(function (g) { return g.loc.t === "global"; }); }

    function seed() { var id = 1, gs = []; for (var i = 0; i < 6; i++) gs.push({ id: id++, loc: { t: "global" }, remaining: 0 }); s.goroutines = gs; s.nextId = id; s.tick = 0; draw("6 goroutines esperan en la cola global."); }
    // runqput real: la goroutine nueva entra a la cola LOCAL del P que la crea;
    // solo el desborde (cola llena) se va a la global.
    function enqueue(g, p) { if (localsOf(p).length < 4) { g.loc = { t: "local", p: p }; return "local"; } g.loc = { t: "global" }; return "global"; }
    function step() {
      var ev = "", gmp = s.gmp;
      for (var p = 0; p < gmp; p++) { var r = runOf(p); if (r) { r.remaining -= 1; if (r.remaining <= 0) { s.goroutines = s.goroutines.filter(function (g) { return g.id !== r.id; }); ev = "P" + p + " terminó g" + r.id + "."; } } }
      for (var p2 = 0; p2 < gmp; p2++) {
        if (runOf(p2)) continue;
        var locals = localsOf(p2);
        if (locals.length) { locals[0].loc = { t: "run", p: p2 }; locals[0].remaining = 2 + Math.floor(Math.random() * 3); if (!ev) ev = "P" + p2 + " ejecuta g" + locals[0].id + " de su cola local."; continue; }
        var victim = -1, best = 1;
        for (var q = 0; q < gmp; q++) { if (q === p2) continue; var n = localsOf(q).length; if (n > best) { best = n; victim = q; } }
        if (victim >= 0) { var vl = localsOf(victim), take = Math.ceil(vl.length / 2); for (var k = 0; k < take; k++) vl[k].loc = { t: "local", p: p2 }; ev = "P" + p2 + " roba " + take + " de P" + victim + " (work-stealing)."; continue; }
        var gl = globals(); if (gl.length) { var tk = Math.min(2, gl.length); for (var m = 0; m < tk; m++) gl[m].loc = { t: "local", p: p2 }; if (!ev) ev = "P" + p2 + " toma " + tk + " de la cola global."; }
      }
      s.tick += 1;
      if (s.tick % 4 === 0 && s.goroutines.length < 16) { var nn = 3 + Math.floor(Math.random() * 3), src = Math.floor(Math.random() * gmp), spill = 0; for (var j = 0; j < nn; j++) { var ng = { id: s.nextId++, loc: { t: "global" }, remaining: 0 }; s.goroutines.push(ng); if (enqueue(ng, src) !== "local") spill++; } ev = "nacen " + nn + " goroutines en P" + src + " → su cola local" + (spill ? " (" + spill + " desbordan a la global)." : "."); }
      draw(ev || null);
    }
    function spawn() {
      var src = 0;
      for (var p = 0; p < s.gmp; p++) if (runOf(p)) { src = p; break; }
      var spill = 0;
      for (var k = 0; k < 5; k++) { var g = { id: s.nextId++, loc: { t: "global" }, remaining: 0 }; s.goroutines.push(g); if (enqueue(g, src) !== "local") spill++; }
      draw("go f() ×5 desde P" + src + " → a su cola LOCAL (runqput)" + (spill ? "; " + spill + " desbordan a la global." : " — a la global solo iría el desborde."));
    }
    function setGmp(v) { s.gmp = Math.max(1, Math.min(4, parseInt(v, 10))); gmpVal.textContent = s.gmp; s.goroutines.forEach(function (g) { if ((g.loc.t === "local" || g.loc.t === "run") && g.loc.p >= s.gmp) g.loc = { t: "global" }; }); draw("GOMAXPROCS = " + s.gmp + " → " + s.gmp + (s.gmp === 1 ? " P (sin paralelismo real)." : " P ejecutan en paralelo.")); }

    var playBtn = G.button("Reproducir", "play", "btn-primary", function () { s.running = !s.running; sync(); });
    var stepBtn = G.button("Paso", "next", "btn-ctrl", function () { step(); });
    var spawnBtn = G.button("go f() ×5", "add", "btn-ctrl", function () { spawn(); });
    var resetBtn = G.button("Reset", "reset", "btn-ghost", function () { s.running = false; seed(); sync(); });
    var gmpVal = el("span.val", { text: "2" });
    var gmpIn = el("input", { type: "range", min: "1", max: "4", step: "1", value: "2", style: "width:120px", on: { input: function (e) { setGmp(e.target.value); } } });
    var w = G.vizCard([playBtn, stepBtn, spawnBtn, resetBtn, el(".viz-spacer"),
      el(".slider-group", {}, [el("span.viz-label", { text: "GOMAXPROCS" }), gmpIn, gmpVal])], "scheduler");
    function sync() { playBtn.querySelector("span:last-child").textContent = s.running ? "Pausa" : "Reproducir"; playBtn.querySelector("svg").outerHTML = G.icon(s.running ? "pause" : "play", 18); }

    function draw(ev) {
      var gmp = s.gmp, W = 760, H = 360, pad = 40, gap = 16, cardW = (W - pad * 2 - gap * (gmp - 1)) / gmp;
      var pX = function (p) { return pad + p * (cardW + gap); };
      var gy = 34, cardTop = 92, cardH = 246, runY = cardTop + 44, queTop = cardTop + 104, b = "";
      b += T(pad, 16, "COLA GLOBAL (GRQ)", "600 10px var(--font-mono)", "var(--color-fg-faint)", null, "letter-spacing:.12em");
      b += R(pad, gy - 18, W - pad * 2, 36, "var(--color-bg-muted)", "var(--color-border-default)", 'rx="9"');
      for (var p = 0; p < gmp; p++) {
        var x = pX(p);
        b += R(x, cardTop, cardW, cardH, "var(--color-bg-canvas)", "var(--color-border-strong)", 'rx="12"');
        b += T(x + 14, cardTop + 22, "P" + p, "600 16px var(--font-mono)", "var(--role-gateway)");
        b += T(x + cardW - 14, cardTop + 22, "M" + p, "600 12px var(--font-mono)", "var(--fam-comp)", "end");
        b += R(x + cardW / 2 - 26, runY - 20, 52, 40, "none", A, 'rx="8" stroke-dasharray="3 3" opacity="0.6"');
        b += T(x + cardW / 2, cardTop + 74, "M ejecuta", "500 8.5px var(--font-mono)", "var(--color-fg-faint)", "middle", "letter-spacing:.1em");
        b += T(x + cardW / 2, queTop - 14, "COLA LOCAL", "500 8.5px var(--font-mono)", "var(--color-fg-faint)", "middle", "letter-spacing:.1em");
      }
      var pos = function (g) {
        if (g.loc.t === "global") { var idx = globals().indexOf(g); return [pad + 20 + idx * 34, gy]; }
        if (g.loc.t === "run") return [pX(g.loc.p) + cardW / 2, runY];
        var i = localsOf(g.loc.p).indexOf(g); return [pX(g.loc.p) + cardW / 2, queTop + i * 30];
      };
      var sorted = s.goroutines.slice().sort(function (a, c) { return a.id - c.id; });
      sorted.forEach(function (g) {
        var p2 = pos(g), isRun = g.loc.t === "run", isGlobal = g.loc.t === "global";
        var fill = isRun ? A : isGlobal ? "var(--color-bg-surface)" : "var(--color-bg-lit)";
        var stroke = isRun ? A : isGlobal ? "var(--role-actor)" : A;
        var txt = isRun ? "var(--on-accent)" : "var(--color-fg-default)";
        b += '<g transform="translate(' + p2[0] + ',' + p2[1] + ')"><circle r="' + (isRun ? 15 : 12) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (isRun ? 2 : 1.5) + '"/>' + T(0, 0, "g" + g.id, (isRun ? "600 12px" : "500 10.5px") + " var(--font-mono)", txt, "middle", "dominant-baseline:middle") + "</g>";
      });
      w.canvas.innerHTML = SVG(W, H, b, 380);
      if (ev) setMsg(w, ev);
    }
    timer = setInterval(function () { if (s.running) step(); }, 760);
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), w.card]));
    notes(t).forEach(function (n) { append(host, n); });
    seed();
  };

})(window.GUIA = window.GUIA || {});
