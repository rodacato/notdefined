/* ============================================================
   page-perfila.js — widget de la ficha 13.
   Una corrida de benchmark-ips cuadro por cuadro: warmup que
   se descarta, medición con contadores fijos y compare! final.
   Determinista; respeta prefers-reduced-motion (estado final).
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.perfila = function (mount, topic) {
    var w = topic.widget;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var last = w.steps.length - 1;
    var step = reduce ? last : 0;
    var playing = false, timer = null;

    var maxIps = Math.max(w.impls[0].ips, w.impls[1].ips);
    var ratio = (Math.max(w.impls[0].ips, w.impls[1].ips) / Math.min(w.impls[0].ips, w.impls[1].ips)).toFixed(2);
    var FASES = [
      { key: "listo",  label: "Listo" },
      { key: "warmup", label: "Warmup" },
      { key: "mide",   label: "Medición" },
      { key: "fin",    label: "Resultado" }
    ];

    function fmtIps(n) {
      if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
      if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
      return String(n);
    }

    mount.innerHTML =
      '<div class="js-chips" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:18px;"></div>' +
      '<div class="codesurface"><div class="codesurface__bar"><span class="eyebrow">bench.rb</span>' +
        '<span class="count">ruby --yjit bench.rb</span></div>' +
        '<div class="codesurface__body"><pre>' + w.code + '</pre></div></div>' +
      '<div class="js-lanes" style="display:flex; flex-direction:column; gap:12px; margin-top:20px;"></div>' +
      '<div style="display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:18px; flex-wrap:wrap; padding-top:16px; border-top:1px dashed var(--color-border-default);">' +
        '<p class="js-text" aria-live="polite" style="font-size:13.5px; line-height:1.5; color:var(--color-fg-subtle); margin:0; max-width:56ch;"></p>' +
        '<div style="display:flex; gap:10px; flex:none;">' +
          '<button class="btn btn--ghost js-reset" type="button" aria-label="Reiniciar">↺</button>' +
          '<button class="btn js-step" type="button">paso ▸</button>' +
          '<button class="btn btn--primary js-play" type="button" style="min-width:118px;"></button>' +
        '</div>' +
      '</div>' +
      '<div class="js-result" style="margin-top:16px;"></div>';

    var btnPlay = G.qs(".js-play", mount), btnStep = G.qs(".js-step", mount), btnReset = G.qs(".js-reset", mount);
    btnPlay.addEventListener("click", function () {
      if (step >= last) { step = 0; play(true); return; }
      play(!playing);
    });
    btnStep.addEventListener("click", function () { play(false); advance(); });
    btnReset.addEventListener("click", function () { play(false); step = 0; paint(); });

    function play(on) {
      playing = on;
      if (timer) { clearInterval(timer); timer = null; }
      if (playing) timer = setInterval(function () {
        if (step >= last) { play(false); return; }
        step++; paint();
      }, 1400);
      paint();
    }
    function advance() { if (step < last) { step++; paint(); } }

    function paint() {
      var fam = "var(--fam-taller)";
      var s = w.steps[step];
      var faseIdx = FASES.findIndex(function (f) { return f.key === s.fase; });

      G.qs(".js-chips", mount).innerHTML = FASES.map(function (f, i) {
        var active = i === faseIdx, done = i < faseIdx;
        var st = "font-family:var(--font-mono); font-size:11px; font-weight:600; border-radius:999px; padding:5px 12px;";
        if (active) st += "background:" + fam + "; color:#fff;";
        else if (done) st += "background:var(--color-bg-lit); color:" + fam + "; border:1px solid " + fam + ";";
        else st += "background:var(--color-bg-muted); color:var(--color-fg-faint);";
        return '<span style="' + st + '">' + (i + 1) + " · " + G.esc(f.label) + '</span>';
      }).join("");

      var lanes = G.qs(".js-lanes", mount);
      lanes.innerHTML = "";
      w.impls.forEach(function (im, i) {
        var val = s.vals ? s.vals[i] : (s.fase === "fin" ? im.ips : 0);
        var pct = Math.round((val / maxIps) * 100);
        var warm = s.fase === "warmup";
        var fill = s.fase === "fin"
          ? (im.ips === maxIps ? "var(--data-ok)" : fam)
          : (warm ? "var(--data-warn)" : fam);
        var tag = warm ? "warmup · se descarta" : (s.fase === "mide" ? "midiendo" : (s.fase === "fin" ? "± " + im.dev.toFixed(1) + "%" : "en espera"));
        var row = G.h("div");
        row.style.cssText = "display:flex; align-items:center; gap:14px; flex-wrap:wrap;";
        row.innerHTML =
          '<div style="width:150px; flex:none;">' +
            '<div class="mono" style="font-size:13px; font-weight:600; color:var(--color-fg-default);">' + G.esc(im.label) + '</div>' +
            '<div style="font-size:11.5px; color:var(--color-fg-faint); line-height:1.35;">' + G.esc(im.sub) + '</div></div>' +
          '<div style="flex:1; min-width:160px; height:26px; background:var(--color-bg-muted); border:1px solid var(--color-border-default); border-radius:8px; overflow:hidden;">' +
            '<div style="height:100%; width:' + pct + '%; background:' + fill + '; opacity:' + (warm ? ".55" : "1") + '; transition:width .3s ease;"></div></div>' +
          '<div style="width:150px; flex:none; text-align:right;">' +
            '<div class="mono" style="font-size:14px; font-weight:600; color:' + (val ? "var(--color-fg-default)" : "var(--color-fg-faint)") + ';">' + (val ? fmtIps(val) + " i/s" : "—") + '</div>' +
            '<div class="mono" style="font-size:10px; letter-spacing:.06em; text-transform:uppercase; color:' + (warm ? "var(--data-warn)" : "var(--color-fg-faint)") + ';">' + G.esc(tag) + '</div></div>';
        lanes.appendChild(row);
      });

      G.qs(".js-text", mount).textContent = s.text;

      var result = G.qs(".js-result", mount);
      if (s.fase === "fin") {
        var fast = w.impls[0].ips >= w.impls[1].ips ? w.impls[0] : w.impls[1];
        var slow = fast === w.impls[0] ? w.impls[1] : w.impls[0];
        result.innerHTML =
          '<div class="codesurface"><div class="codesurface__body" style="padding:16px 20px;">' +
            '<div class="eyebrow" style="color:#C99B7A; margin-bottom:10px;">Comparison:</div>' +
            '<div class="mono" style="font-size:13px; line-height:2; color:var(--code-fg);">' +
              '<div>' + G.esc(fast.label) + ':  <span class="tok-num">' + fmtIps(fast.ips) + '</span> i/s <span class="tok-dim">(± ' + fast.dev.toFixed(1) + '%)</span></div>' +
              '<div>' + G.esc(slow.label) + ':  <span class="tok-num">' + fmtIps(slow.ips) + '</span> i/s <span class="tok-dim">(± ' + slow.dev.toFixed(1) + '%)</span> - <b style="color:var(--data-warn);">' + ratio + 'x  slower</b></div>' +
            '</div>' +
            '<p class="codenote">' + G.esc(w.nota) + '</p>' +
          '</div></div>';
      } else {
        result.innerHTML = "";
      }

      btnPlay.textContent = step >= last ? "otra vez ▸" : (playing ? "pausar" : "reproducir ▸");
      btnStep.disabled = step >= last;
    }

    // limpia el intervalo cuando la vista se reemplaza
    var obs = new MutationObserver(function () {
      if (!document.body.contains(mount)) { if (timer) clearInterval(timer); obs.disconnect(); }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    paint();
  };

})(window.GUIA = window.GUIA || {});
