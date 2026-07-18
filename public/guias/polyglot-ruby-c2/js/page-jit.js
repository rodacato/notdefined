/* ============================================================
   page-jit.js — widget de la ficha 03.
   Calienta un método hasta que compila, y provoca un side-exit
   pasándole un tipo que rompe la suposición.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.jit = function (mount, topic) {
    var threshold = topic.widget.threshold || 20;
    var calls = 0, mode = "yjit", sideExits = 0, log = "start";

    mount.innerHTML =
      // selector de compilador
      '<div style="display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">' +
        '<div><div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:7px;">Compilador</div>' +
          '<div class="seg"><button type="button" data-mode="yjit">YJIT</button><button type="button" data-mode="zjit">ZJIT</button></div></div>' +
        '<div class="js-note mono" style="font-size:12px; color:var(--color-fg-subtle); background:var(--color-bg-lit); border:1px solid var(--color-border-default); border-radius:9px; padding:9px 13px; max-width:44ch; line-height:1.4;"></div>' +
      '</div>' +
      // método + estado
      '<div style="display:grid; grid-template-columns:1.1fr .9fr; gap:16px; margin-top:20px; align-items:stretch;" class="jit-grid">' +
        '<div class="codesurface"><div class="codesurface__body" style="display:flex; flex-direction:column; justify-content:center; min-height:120px;">' +
          '<pre><span class="tok-kw">def</span> cuadrado(x)\n  x <span class="tok-op">*</span> x\n<span class="tok-kw">end</span></pre>' +
          '<div style="margin-top:14px; padding-top:12px; border-top:1px solid var(--code-line); font-family:var(--font-mono); font-size:11.5px; color:#B8A6AE;">suposición activa: <span class="js-guard" style="font-weight:600;">x es Integer</span></div>' +
        '</div></div>' +
        '<div class="js-status" style="border-radius:12px; padding:16px 18px; display:flex; flex-direction:column; gap:2px; transition:all .18s ease;">' +
          '<div class="eyebrow" style="color:var(--color-fg-faint);">Estado del método</div>' +
          '<div class="js-status-label" style="font-family:var(--font-display); font-weight:600; font-size:26px; margin-top:4px;"></div>' +
          '<div class="js-status-sub" style="font-size:12.5px; color:var(--color-fg-subtle); line-height:1.45; margin-top:2px;"></div>' +
          '<div style="margin-top:12px;">' +
            '<div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:10.5px; color:var(--color-fg-faint); margin-bottom:5px;"><span>temperatura</span><span class="js-temp-label"></span></div>' +
            '<div style="height:10px; background:var(--color-bg-muted); border:1px solid var(--color-border-default); border-radius:999px; overflow:hidden;">' +
              '<div class="js-temp-bar" style="height:100%; width:0; transition:width .2s ease;"></div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // controles
      '<div style="display:flex; align-items:center; gap:10px; margin-top:18px; flex-wrap:wrap;">' +
        '<button class="btn btn--primary js-call1" type="button">cuadrado(4) ▸</button>' +
        '<button class="btn js-call10" type="button">× 10 ▸▸</button>' +
        '<button class="btn js-callstr" type="button" style="color:var(--data-bad); border-color:color-mix(in srgb, var(--data-bad) 45%, transparent);">cuadrado("ab") ⚠</button>' +
        '<button class="btn btn--ghost js-reset" type="button">↺</button>' +
        '<span class="mono" style="font-size:11.5px; color:var(--color-fg-faint); margin-left:auto;">side-exits: <b class="js-se" style="color:var(--color-fg-subtle);">0</b></span>' +
      '</div>' +
      // registro de eventos
      '<div class="js-log" style="display:flex; gap:12px; align-items:flex-start; margin-top:16px; border-radius:11px; padding:13px 16px;">' +
        '<span class="js-log-tag eyebrow" style="flex:none; margin-top:1px;"></span>' +
        '<p class="js-log-text" style="font-size:13.5px; line-height:1.5; margin:0; color:var(--color-fg-subtle);"></p>' +
      '</div>';

    var seg = G.qsa(".seg button", mount);
    seg.forEach(function (b) {
      b.addEventListener("click", function () { mode = b.dataset.mode; paint(); });
    });
    G.qs(".js-call1", mount).addEventListener("click", function () { bump(1); });
    G.qs(".js-call10", mount).addEventListener("click", function () { bump(10); });
    G.qs(".js-callstr", mount).addEventListener("click", callStr);
    G.qs(".js-reset", mount).addEventListener("click", function () {
      calls = 0; sideExits = 0; log = "start"; paint();
    });

    function bump(n) {
      var wasCold = calls < threshold;
      calls = Math.min(threshold + 5, calls + n);
      log = (wasCold && calls >= threshold) ? "compiled" : "int";
      paint();
    }
    function callStr() {
      if (calls >= threshold) { sideExits++; log = "sideexit"; }
      else log = "strcold";
      paint();
    }

    function logData(hot) {
      return {
        start:    { tag: "listo", accent: "var(--color-fg-faint)", text: "El método arranca frío, interpretado. Llámalo muchas veces para calentarlo." },
        int:      { tag: "llamada", accent: "var(--color-fg-faint)", text: hot ? "cuadrado(4) → 16. Ejecutado directo en código máquina: sin buscar tipos ni métodos." : "cuadrado(4) → 16. Interpretado. El contador sube; cerca del umbral se compilará." },
        compiled: { tag: "compilado ✓", accent: "var(--data-ok)", text: mode === "zjit" ? "Umbral alcanzado. ZJIT usó el perfil del intérprete para compilar el método a código máquina, con una guarda de tipo." : "Umbral alcanzado. YJIT compiló el bloque a código máquina bajo demanda, especializado a los tipos observados (Integer)." },
        sideexit: { tag: "side-exit · deopt", accent: "var(--data-bad)", text: 'cuadrado("ab"): el argumento no es Integer, la suposición falla. Se abandona el código máquina y se vuelve al intérprete para atender esta llamada.' },
        strcold:  { tag: "llamada", accent: "var(--color-fg-faint)", text: 'cuadrado("ab") → "abab". Aún frío: nada que deshacer, todo pasa por el intérprete.' }
      };
    }

    function paint() {
      var hot = calls >= threshold;
      seg.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === mode ? "true" : "false"); });
      G.qs(".js-note", mount).textContent = mode === "yjit"
        ? "YJIT · Lazy Basic Block Versioning: compila cada bloque bajo demanda, con los tipos que ve."
        : "ZJIT · perfila primero en el intérprete, luego optimiza sobre una IR (SSA/HIR).";
      G.qs(".js-guard", mount).style.color = hot ? "#7FB79A" : "#9A7E88";

      var box = G.qs(".js-status", mount);
      G.qs(".js-status-label", mount).textContent = hot ? "compilado" : "frío";
      G.qs(".js-status-label", mount).style.color = hot ? "var(--color-primary)" : "var(--color-fg-subtle)";
      G.qs(".js-status-sub", mount).textContent = hot ? "código máquina nativo, especializado a Integer" : "se ejecuta en el intérprete";
      box.style.background = hot ? "var(--color-bg-lit)" : "var(--color-bg-muted)";
      box.style.border = "1px solid " + (hot ? "var(--color-primary)" : "var(--color-border-default)");

      var pct = Math.min(100, Math.round((calls / threshold) * 100));
      G.qs(".js-temp-label", mount).textContent = calls + " / " + threshold;
      var bar = G.qs(".js-temp-bar", mount);
      bar.style.width = pct + "%";
      bar.style.background = hot ? "var(--color-primary)" : (pct > 60 ? "var(--data-warn)" : "var(--data-cool)");

      G.qs(".js-se", mount).textContent = sideExits;

      var lg = logData(hot)[log];
      var logBox = G.qs(".js-log", mount);
      logBox.style.cssText = "display:flex; gap:12px; align-items:flex-start; margin-top:16px; border-radius:11px; padding:13px 16px;" +
        (log === "sideexit" ? "background:color-mix(in srgb, var(--data-bad) 12%, var(--color-bg-lit)); border:1px solid color-mix(in srgb, var(--data-bad) 40%, transparent); border-left:3px solid var(--data-bad);"
         : log === "compiled" ? "background:var(--color-bg-lit); border:1px solid var(--color-border-default); border-left:3px solid var(--data-ok);"
         : "background:var(--color-bg-muted); border:1px solid var(--color-border-default); border-left:3px solid var(--color-border-strong);");
      var tag = G.qs(".js-log-tag", mount);
      tag.textContent = lg.tag; tag.style.color = lg.accent;
      G.qs(".js-log-text", mount).textContent = lg.text;
    }

    paint();
  };

})(window.GUIA = window.GUIA || {});
