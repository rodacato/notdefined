/* ============================================================
   page-fibers.js — widget de la ficha 06.
   Tres fibers en un solo hilo: cada avance corre un tramo del
   fiber activo y cede en yield al siguiente. Click-driven, así
   que funciona bien con prefers-reduced-motion.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.fibers = function (mount, topic) {
    var labels = topic.widget.labels;
    var N = 3;
    var done = [0, 0, 0], active = 0, order = [], finished = false;

    mount.innerHTML =
      '<div class="js-fibers" style="display:flex; flex-direction:column; gap:12px;"></div>' +
      '<div style="display:flex; align-items:center; gap:12px; margin-top:20px; padding-top:16px; border-top:1px dashed var(--color-border-default); flex-wrap:wrap;">' +
        '<span class="eyebrow" style="color:var(--color-fg-faint);">Orden de ejecución</span>' +
        '<span class="js-order mono" style="font-size:13px; color:var(--fam-conc); font-weight:600;">—</span>' +
      '</div>' +
      '<div style="display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:14px; flex-wrap:wrap;">' +
        '<p class="js-text" style="font-size:13.5px; line-height:1.5; color:var(--color-fg-subtle); margin:0; max-width:52ch;"></p>' +
        '<div style="display:flex; gap:10px; flex:none;">' +
          '<button class="btn btn--ghost js-reset" type="button">↺</button>' +
          '<button class="btn btn--primary js-step" type="button"></button>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:16px;" class="fib-notes"></div>' +
      '<div style="margin-top:16px;"><div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:8px;">' + G.esc(topic.widget.codeTitle) + '</div>' +
        '<div class="codesurface"><div class="codesurface__body"><pre>' + topic.widget.code + '</pre></div></div></div>';

    G.qs(".fib-notes", mount).innerHTML = topic.widget.notes.map(function (n) {
      return '<div style="background:var(--color-bg-lit); border:1px solid var(--color-border-default); border-left:3px solid ' + n.accent + '; border-radius:11px; padding:15px 18px;">' +
        '<div class="eyebrow" style="color:' + n.accent + '; margin-bottom:8px;">' + G.esc(n.key) + '</div>' +
        '<p style="font-size:13.5px; line-height:1.55; color:var(--color-fg-subtle); margin:0;">' + G.esc(n.text) + '</p></div>';
    }).join("");

    function nextReady(from) {
      for (var k = 1; k <= N; k++) { var i = (from + k) % N; if (done[i] < N) return i; }
      return from;
    }
    G.qs(".js-step", mount).addEventListener("click", function () {
      if (finished || done[active] >= N) return;
      done[active] += 1;
      order.push("F" + (active + 1));
      finished = done.every(function (d) { return d >= N; });
      if (!finished) active = nextReady(active);
      paint();
    });
    G.qs(".js-reset", mount).addEventListener("click", function () {
      done = [0, 0, 0]; active = 0; order = []; finished = false; paint();
    });

    function paint() {
      var fam = "var(--fam-conc)";
      var host = G.qs(".js-fibers", mount);
      host.innerHTML = "";
      done.forEach(function (d, i) {
        var isDone = d >= N, isActive = i === active && !finished && !isDone;
        var badge, badgeBg, badgeCol;
        if (isDone) { badge = "listo"; badgeBg = "color-mix(in srgb, var(--data-ok) 20%, transparent)"; badgeCol = "var(--data-ok)"; }
        else if (isActive) { badge = "▶ ejecuta"; badgeBg = fam; badgeCol = "#fff"; }
        else { badge = "⏸ yield"; badgeBg = "var(--color-bg-surface)"; badgeCol = "var(--color-fg-faint)"; }

        var slices = labels[i].map(function (label, j) {
          var filled = j < d, running = isActive && j === d;
          var st = "font-family:var(--font-mono); font-size:11px; border-radius:7px; padding:6px 11px; transition:all .15s ease;";
          if (filled) st += "background:" + fam + "; color:#fff; border:1px solid " + fam + ";";
          else if (running) st += "background:var(--color-bg-surface); color:" + fam + "; border:1px dashed " + fam + ";";
          else st += "background:var(--color-bg-surface); color:var(--color-fg-faint); border:1px solid var(--color-border-soft);";
          return '<span style="' + st + '">' + G.esc(label) + '</span>';
        }).join("");

        var row = G.h("div");
        row.style.cssText = "display:flex; align-items:center; gap:14px; border-radius:11px; padding:12px 15px; transition:all .16s ease;" +
          (isActive ? "background:var(--color-bg-lit); border:1px solid " + fam + "; box-shadow:0 0 0 2px color-mix(in srgb, var(--fam-conc) 16%, transparent);"
                    : "background:var(--color-bg-muted); border:1px solid var(--color-border-default);");
        row.innerHTML =
          '<div style="display:flex; align-items:center; gap:10px; width:150px; flex:none;">' +
            '<span class="mono" style="font-size:14px; font-weight:600; color:var(--color-fg-default);">F' + (i + 1) + '</span>' +
            '<span class="mono" style="display:inline-block; font-size:9.5px; letter-spacing:.06em; text-transform:uppercase; border-radius:999px; padding:2px 8px; white-space:nowrap; background:' + badgeBg + '; color:' + badgeCol + ';">' + badge + '</span></div>' +
          '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">' + slices + '</div>';
        host.appendChild(row);
      });

      G.qs(".js-order", mount).textContent = order.length ? order.join(" → ") + (finished ? "" : " → …") : "—";
      G.qs(".js-text", mount).textContent = order.length === 0
        ? "Tres fibers listos. F1 tiene el control. Avanza para que corra su primer tramo y ceda."
        : (finished ? "Todos los fibers terminaron. Una sola línea de ejecución los atendió a todos, saltando en cada yield."
                    : "El fiber activo corrió un tramo y cedió en yield; el control saltó al siguiente fiber listo.");
      var btn = G.qs(".js-step", mount);
      btn.textContent = finished ? "terminado" : "avanzar ▸";
      btn.disabled = finished;
    }

    paint();
  };

})(window.GUIA = window.GUIA || {});
