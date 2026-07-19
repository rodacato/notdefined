/* ============================================================
   page-defer-panic-recover.js — widget de la ficha 04:
   la cadena LIFO de defers, panic y recover.
   El guión (textos, pasos) vive en data/*.js (t.viz); aquí solo
   estado, render y animación.
   ============================================================ */
(function (G) {
  "use strict";
  var el = G.el, append = G.append, SVG = G.SVG;
  var acc = G.vizAcc, T = G.vizT, R = G.vizR, marker = G.vizMarker,
      setMsg = G.vizMsg, notes = G.vizNotes;

  G.widgets["defer-panic-recover"] = function (host, t) {
    var letters = ["A", "B", "C", "D"];
    var s = { defers: [], phase: "build", panicking: false, ranIdx: -1, recovered: false };
    // controles build
    var addBtn = G.button("+ defer", "add", "btn-ctrl", function () {
      if (s.phase !== "build" || s.defers.length >= 4) return;
      s.defers.push({ id: letters[s.defers.length], recovers: false }); draw();
    });
    var retBtn = G.button("return", "callDown", "btn-primary", function () { start(false); });
    var panicBtn = G.button("panic()", "bolt", "btn-primary", function () { start(true); });
    var stepBtn = G.button("paso", "next", "btn-ctrl", function () { stepRun(); });
    var reset = G.button("Reset", "reset", "btn-ghost", function () { s = { defers: [], phase: "build", panicking: false, ranIdx: -1, recovered: false }; draw(); });
    var w = G.vizCard([addBtn, retBtn, panicBtn, stepBtn, reset], "runtime");
    function start(p) { if (!s.defers.length) { setMsg(w, "Registra al menos un defer primero."); return; } s.phase = "run"; s.panicking = p; s.ranIdx = s.defers.length; s.recovered = false; draw(); }
    function stepRun() {
      if (s.phase !== "run") { setMsg(w, "Elige \u00ABreturn\u00BB o \u00ABpanic()\u00BB para arrancar."); return; }
      if (s.ranIdx <= 0) { s.phase = "done"; s.ranIdx = -1; draw(); return; }
      s.ranIdx -= 1;
      var d = s.defers[s.ranIdx];
      if (s.panicking && d.recovers && !s.recovered) { s.recovered = true; }
      draw();
    }
    function draw() {
      // reconstruye barra según fase
      addBtn.disabled = s.phase !== "build" || s.defers.length >= 4;
      retBtn.disabled = s.phase !== "build";
      panicBtn.disabled = s.phase !== "build";
      stepBtn.disabled = s.phase === "build" || s.phase === "done";
      G.clear(w.canvas);
      var col = el("div", { style: "display:flex;gap:22px;flex-wrap:wrap;padding:8px 6px 4px;align-items:flex-start" });
      // func box con stack de defers (LIFO, top arriba)
      var fn = el("div", { style: "flex:1;min-width:260px" });
      append(fn, el("div", { style: "font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;color:var(--color-fg-faint);margin-bottom:8px", html: "func f() &nbsp; \u00B7 &nbsp; cadena de defers (LIFO)" }));
      var stack = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
      // top of stack = último añadido = primero en correr
      s.defers.slice().reverse().forEach(function (d, ri) {
        var realIdx = s.defers.length - 1 - ri;
        var isRunning = s.phase !== "build" && s.ranIdx === realIdx;
        var didRun = (s.phase === "done") || (s.ranIdx < realIdx);
        var border = isRunning ? "var(--topic-accent)" : didRun ? "var(--role-service)" : "var(--color-border-strong)";
        var bg = isRunning ? "color-mix(in srgb, var(--topic-accent) 14%, var(--color-bg-canvas))" : "var(--color-bg-canvas)";
        var chip = el("div", { style: "display:flex;align-items:center;gap:10px;padding:10px 13px;border:1px solid " + border + ";border-radius:10px;background:" + bg + ";transition:all .15s;cursor:" + (s.phase === "build" ? "pointer" : "default") });
        append(chip, el("span", { style: "font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--color-fg-default)", html: "defer g" + d.id + "()" }));
        var rec = el("span", { style: "font-family:var(--font-mono);font-size:11px;padding:3px 9px;border-radius:999px;border:1px solid " + (d.recovers ? "var(--positive)" : "var(--color-border-strong)") + ";color:" + (d.recovers ? "var(--positive)" : "var(--color-fg-faint)") + ";background:" + (d.recovers ? "color-mix(in srgb,var(--positive) 15%,transparent)" : "transparent"), html: d.recovers ? "recover() \u2713" : "recover()?" });
        append(chip, rec);
        if (didRun) append(chip, el("span", { style: "margin-left:auto;font-family:var(--font-mono);font-size:11px;color:var(--role-service)", text: "ejecutado" }));
        if (isRunning) append(chip, el("span", { style: "margin-left:auto;font-family:var(--font-mono);font-size:11px;color:var(--topic-accent)", text: "\u25B6 corriendo" }));
        if (s.phase === "build") chip.addEventListener("click", function () { d.recovers = !d.recovers; draw(); });
        append(stack, chip);
      });
      if (!s.defers.length) append(stack, el("div", { style: "font-family:var(--font-mono);font-size:12px;color:var(--color-fg-faint);padding:14px 0", text: "pila vac\u00EDa \u2014 pulsa \u00AB+ defer\u00BB" }));
      append(fn, stack);
      append(col, fn);

      // panel derecho: open-coded bitmask + estado
      var panel = el("div", { style: "flex:0 0 auto;width:230px" });
      var activeBits = s.defers.map(function (d, i) { return (s.phase === "build" || i < s.ranIdx) ? "1" : "0"; }).join("") || "\u2014";
      append(panel, el("div", { style: "font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;color:var(--color-fg-faint)", text: "OPEN-CODED DEFERS (1.14)" }));
      append(panel, el("div", { style: "font-family:var(--font-mono);font-size:22px;font-weight:600;color:var(--topic-accent);margin-top:4px", html: "deferBits <span style='color:var(--color-fg-default)'>" + activeBits + "</span>" }));
      append(panel, el("p", { style: "font-size:12px;line-height:1.5;color:var(--color-fg-subtle);margin-top:8px", html: "Un bit por defer, inlineado en la funci\u00F3n. El caso com\u00FAn no toca el heap." }));
      var banner;
      if (s.phase === "run" || s.phase === "done") {
        var txt, bc;
        if (s.panicking && s.recovered) { txt = "panic ATRAPADO por recover() \u2192 f() retorna normal."; bc = "var(--positive)"; }
        else if (s.panicking && s.phase === "done") { txt = "panic sin recover \u2192 propaga al llamador tras correr los defers."; bc = "var(--role-fail)"; }
        else if (s.panicking) { txt = "panic: desenrollando la pila, corriendo defers LIFO\u2026"; bc = "var(--role-fail)"; }
        else if (s.phase === "done") { txt = "return normal: todos los defers corrieron en orden LIFO."; bc = "var(--positive)"; }
        else { txt = "return: corriendo defers LIFO antes de salir\u2026"; bc = "var(--topic-accent)"; }
        banner = el("div", { style: "margin-top:14px;padding:11px 13px;border-radius:10px;border:1px solid " + bc + ";background:color-mix(in srgb," + bc + " 12%,transparent);font-size:12.5px;line-height:1.45;color:var(--color-fg-default)", text: txt });
        append(panel, banner);
      }
      append(col, panel);
      append(w.canvas, col);

      var msg;
      if (s.phase === "build") msg = s.defers.length ? "Clic en un defer para que llame recover(). Luego \u00ABreturn\u00BB o \u00ABpanic()\u00BB." : "Registra defers con \u00AB+ defer\u00BB (se apilan LIFO).";
      else if (s.phase === "done") msg = s.panicking ? (s.recovered ? "recover() cort\u00F3 el p\u00E1nico." : "p\u00E1nico propagado.") : "f() retorn\u00F3.";
      // al arrancar, ranIdx apunta una posici\u00F3n arriba de la cima: nada corre todav\u00EDa
      else if (s.ranIdx >= s.defers.length) msg = "g" + s.defers[s.defers.length - 1].id + "() en la cima corre primero. Pulsa \u00ABpaso\u00BB.";
      else msg = "corriendo g" + s.defers[s.ranIdx].id + "(). Pulsa \u00ABpaso\u00BB.";
      setMsg(w, msg);
    }
    append(host, el("div", {}, [el(".eyebrow-line", { text: t.viz.title }), w.card]));
    notes(t).forEach(function (n) { append(host, n); });
    draw();
  };

})(window.GUIA = window.GUIA || {});
