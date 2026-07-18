/* ============================================================
   page-gvl.js — widget de la ficha 04.
   Tres hilos compiten por un único GVL. En modo CPU avanzan de
   uno en uno; en modo I/O sueltan el candado al esperar y se
   solapan. Corre en un bucle; respeta prefers-reduced-motion.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.gvl = function (mount, topic) {
    var w = topic.widget;
    var N = 3;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var state;
    function fresh(mode) {
      return { mode: mode, running: !reduce, clock: 0, done: false,
        threads: [mk("T1"), mk("T2"), mk("T3")] };
    }
    function mk(name) { return { name: name, p: 0, phase: "ready", runLeft: 0, ioLeft: 0 }; }
    state = fresh("cpu");

    mount.innerHTML =
      '<div style="display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">' +
        '<div class="seg"><button type="button" data-mode="cpu">CPU-bound</button><button type="button" data-mode="io">I/O-bound</button></div>' +
        '<div style="display:flex; align-items:center; gap:18px;">' +
          '<div style="text-align:right;"><div class="eyebrow" style="color:var(--color-fg-faint);">Reloj</div>' +
            '<div class="js-clock mono" style="font-size:22px; font-weight:600; color:var(--color-fg-default); line-height:1;">000</div></div>' +
          '<button class="btn btn--primary js-run" type="button" style="min-width:96px;"></button>' +
          '<button class="btn btn--ghost js-reset" type="button">↺</button>' +
        '</div>' +
      '</div>' +
      '<div class="js-lanes" style="display:flex; flex-direction:column; gap:12px; margin-top:22px;"></div>' +
      '<div style="display:flex; align-items:center; gap:12px; margin-top:20px; padding-top:16px; border-top:1px dashed var(--color-border-default); flex-wrap:wrap;">' +
        '<span class="eyebrow" style="color:var(--color-fg-faint);">GVL</span>' +
        '<span class="js-token mono" style="font-size:11px; font-weight:600; border-radius:999px; padding:4px 11px;"></span>' +
        '<span class="js-status" style="font-size:13px; color:var(--color-fg-subtle); line-height:1.4;"></span>' +
      '</div>' +
      // tarjetas explicativas + código (contenido, viene de data/)
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:16px;" class="gvl-notes"></div>' +
      '<div style="margin-top:16px;"><div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:8px;">' + G.esc(w.codeTitle) + '</div>' +
        '<div class="codesurface"><div class="codesurface__body"><pre>' + w.code + '</pre></div></div></div>';

    // notas
    var notesHtml = w.notes.map(function (n) {
      return '<div style="background:var(--color-bg-lit); border:1px solid var(--color-border-default); border-left:3px solid ' + n.accent + '; border-radius:11px; padding:15px 18px;">' +
        '<div class="eyebrow" style="color:' + n.accent + '; margin-bottom:8px;">' + G.esc(n.key) + '</div>' +
        '<p style="font-size:13.5px; line-height:1.55; color:var(--color-fg-subtle); margin:0;">' + G.esc(n.text) + '</p></div>';
    }).join("");
    G.qs(".gvl-notes", mount).innerHTML = notesHtml;

    var seg = G.qsa(".seg button", mount);
    seg.forEach(function (b) {
      b.addEventListener("click", function () { state = fresh(b.dataset.mode); paint(); });
    });
    var btnRun = G.qs(".js-run", mount);
    btnRun.addEventListener("click", function () {
      if (state.done) { state = fresh(state.mode); }
      else state.running = !state.running;
      paint();
    });
    G.qs(".js-reset", mount).addEventListener("click", function () { state = fresh(state.mode); paint(); });

    function tick() {
      if (!state.running || state.done) return;
      var io = state.mode === "io";
      var ts = state.threads;
      // el I/O avanza en paralelo (solo modo I/O)
      if (io) ts.forEach(function (t) {
        if (t.phase === "io") { t.p = Math.min(100, t.p + 5.5); t.ioLeft -= 1;
          if (t.ioLeft <= 0 && t.p < 100) t.phase = "ready"; if (t.p >= 100) t.phase = "done"; }
      });
      // asegura un poseedor del GVL (solo uno corre)
      var holder = ts.findIndex(function (t) { return t.phase === "run"; });
      if (holder === -1) {
        var cand = ts.findIndex(function (t) { return t.phase === "ready"; });
        if (cand !== -1) { ts[cand].phase = "run"; ts[cand].runLeft = 4; holder = cand; }
      }
      if (holder !== -1) {
        var t = ts[holder];
        t.p = Math.min(100, t.p + (io ? 2 : 2.6));
        t.runLeft -= 1;
        if (t.p >= 100) t.phase = "done";
        else if (t.runLeft <= 0) { if (io) { t.phase = "io"; t.ioLeft = 6; } else t.phase = "ready"; }
      }
      state.clock++;
      state.done = ts.every(function (t) { return t.p >= 100; });
      if (state.done) state.running = false;
      paint();
    }

    function paint() {
      var fam = "var(--fam-conc)", io = state.mode === "io";
      seg.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === state.mode ? "true" : "false"); });
      G.qs(".js-clock", mount).textContent = String(state.clock).padStart(3, "0");
      btnRun.textContent = state.done ? "listo" : (state.running ? "pausar" : "seguir");

      var lanes = G.qs(".js-lanes", mount);
      lanes.innerHTML = "";
      state.threads.forEach(function (t) {
        var badge, badgeBg, badgeCol, fill;
        if (t.p >= 100) { badge = "listo"; badgeBg = "color-mix(in srgb, var(--data-ok) 20%, transparent)"; badgeCol = "var(--data-ok)"; fill = "var(--data-ok)"; }
        else if (t.phase === "run") { badge = "ejecuta · GVL"; badgeBg = fam; badgeCol = "#fff"; fill = fam; }
        else if (t.phase === "io") { badge = "en I/O"; badgeBg = "color-mix(in srgb, var(--data-warn) 22%, transparent)"; badgeCol = "var(--data-warn)"; fill = "var(--data-warn)"; }
        else { badge = "espera GVL"; badgeBg = "var(--color-bg-muted)"; badgeCol = "var(--color-fg-faint)"; fill = "var(--color-border-strong)"; }
        var row = G.h("div");
        row.style.cssText = "display:flex; align-items:center; gap:14px;";
        row.innerHTML =
          '<span class="mono" style="font-size:13px; font-weight:600; color:var(--color-fg-subtle); width:34px; flex:none;">' + t.name + '</span>' +
          '<div style="width:118px; flex:none;"><span class="mono" style="display:inline-block; font-size:10px; letter-spacing:.06em; text-transform:uppercase; border-radius:999px; padding:3px 9px; white-space:nowrap; background:' + badgeBg + '; color:' + badgeCol + ';">' + badge + '</span></div>' +
          '<div style="flex:1; height:26px; background:var(--color-bg-muted); border:1px solid var(--color-border-default); border-radius:8px; overflow:hidden;"><div style="height:100%; width:' + Math.round(t.p) + '%; background:' + fill + '; transition:width .12s linear;"></div></div>' +
          '<span class="mono" style="font-size:12px; color:var(--color-fg-faint); width:38px; text-align:right; flex:none;">' + Math.round(t.p) + '%</span>';
        lanes.appendChild(row);
      });

      var holder = state.threads.findIndex(function (t) { return t.phase === "run"; });
      var held = holder !== -1;
      var token = G.qs(".js-token", mount);
      token.textContent = held ? "lo tiene " + state.threads[holder].name : "libre";
      token.style.cssText = "font-size:11px; font-weight:600; border-radius:999px; padding:4px 11px;" +
        (held ? "background:" + fam + "; color:#fff;" : "background:var(--color-bg-muted); color:var(--color-fg-faint); border:1px dashed var(--color-border-default);");
      G.qs(".js-status", mount).textContent = io
        ? (held ? "un hilo calcula; los demás avanzan su I/O en paralelo" : "todos en I/O — el candado está libre")
        : "solo el poseedor del candado avanza; el resto espera su turno";
    }

    var timer = setInterval(tick, 95);
    // limpia el intervalo cuando la vista se reemplaza
    var obs = new MutationObserver(function () {
      if (!document.body.contains(mount)) { clearInterval(timer); obs.disconnect(); }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    paint();
  };

})(window.GUIA = window.GUIA || {});
