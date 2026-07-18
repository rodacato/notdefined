/* ============================================================
   page-gc.js — widget de la ficha 07.
   Un ciclo de mark & sweep & compact sobre un heap de 15 slots,
   con un toggle de generaciones que colorea joven / viejo.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.gc = function (mount, topic) {
    var w = topic.widget;
    var step = 0, gen = false;

    mount.innerHTML =
      '<div class="js-chips" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:18px;"></div>' +
      '<div style="display:grid; grid-template-columns:150px 1fr; gap:20px; align-items:start;" class="gc-grid">' +
        '<div><div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:9px;">GC roots</div>' +
          '<div style="display:flex; flex-direction:column; gap:7px;">' +
            w.roots.map(function (r) {
              return '<div class="mono" style="font-size:11.5px; color:var(--color-fg-subtle); background:var(--color-bg-muted); border:1px solid var(--color-border-default); border-radius:8px; padding:8px 10px;">' + G.esc(r) + '</div>';
            }).join("") +
          '</div></div>' +
        '<div><div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:9px;">Heap · 15 slots</div>' +
          '<div class="js-slots" style="display:grid; grid-template-columns:repeat(5,1fr); gap:8px;"></div></div>' +
      '</div>' +
      '<div style="display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:20px; flex-wrap:wrap; padding-top:16px; border-top:1px dashed var(--color-border-default);">' +
        '<p class="js-text" style="font-size:13.5px; line-height:1.5; color:var(--color-fg-subtle); margin:0; max-width:52ch;"></p>' +
        '<div style="display:flex; gap:10px; flex:none;">' +
          '<button class="btn btn--ghost js-reset" type="button">↺</button>' +
          '<button class="btn btn--primary js-next" type="button"></button>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex; align-items:stretch; gap:12px; margin-top:16px; flex-wrap:wrap;">' +
        '<div class="codesurface" style="flex:1; min-width:280px;"><div class="codesurface__body" style="padding:14px 18px;">' +
          '<div class="eyebrow" style="color:#C99B7A; margin-bottom:10px;">GC.stat</div>' +
          '<div class="mono" style="font-size:12.5px; line-height:1.9; color:var(--code-fg);">' +
            '<div>heap_live_slots  <span class="tok-num js-live"></span></div>' +
            '<div>heap_free_slots  <span class="tok-num js-free"></span></div>' +
            '<div>old_objects      <span class="tok-num js-old"></span></div>' +
          '</div></div></div>' +
        '<button class="btn js-gen" type="button" style="flex:none; display:flex; flex-direction:column; gap:3px; text-align:left; padding:12px 18px; min-width:170px; height:auto;">' +
          '<span class="eyebrow" style="opacity:.75;">Ver generaciones</span>' +
          '<span class="js-gen-label" style="font-family:var(--font-display); font-weight:600; font-size:16px;"></span>' +
          '<span style="font-size:11.5px; opacity:.85;">◐ joven · ● viejo</span></button>' +
      '</div>';

    G.qs(".js-next", mount).addEventListener("click", function () { if (step < 3) { step++; paint(); } });
    G.qs(".js-reset", mount).addEventListener("click", function () { step = 0; paint(); });
    G.qs(".js-gen", mount).addEventListener("click", function () { gen = !gen; paint(); });

    function paint() {
      var fam = "var(--fam-mem)";
      // chips
      G.qs(".js-chips", mount).innerHTML = w.steps.map(function (label, i) {
        var active = i === step, done = i < step;
        var st = "font-family:var(--font-mono); font-size:11px; font-weight:600; border-radius:999px; padding:5px 12px;";
        if (active) st += "background:" + fam + "; color:#fff;";
        else if (done) st += "background:var(--color-bg-lit); color:" + fam + "; border:1px solid " + fam + ";";
        else st += "background:var(--color-bg-muted); color:var(--color-fg-faint);";
        return '<span style="' + st + '">' + (i + 1) + " · " + G.esc(label) + '</span>';
      }).join("");

      // slots
      var display;
      if (step < 2) display = w.objs.slice();
      else if (step === 2) display = w.objs.map(function (o) { return o.reach ? o : null; });
      else display = w.objs.filter(function (o) { return o.reach; });
      while (display.length < 15) display.push(null);

      var host = G.qs(".js-slots", mount);
      host.innerHTML = "";
      display.forEach(function (o) {
        var cell = G.h("div");
        var base = "border-radius:9px; padding:9px 10px; min-height:46px; transition:all .18s ease;";
        if (!o) {
          cell.style.cssText = base + "background:var(--color-bg-canvas); border:1px dashed var(--color-border-default); display:flex; align-items:center; justify-content:center;";
          cell.innerHTML = '<span class="mono" style="font-size:10px; color:var(--color-fg-faint);">libre</span>';
          host.appendChild(cell); return;
        }
        var marked = step >= 1 && o.reach, garbage = step === 1 && !o.reach;
        var style = base, tag;
        if (marked) { style += "background:var(--color-bg-lit); border:1px solid var(--data-ok); box-shadow:0 0 0 2px color-mix(in srgb, var(--data-ok) 18%, transparent);"; tag = "marcado ✓"; }
        else if (garbage) { style += "background:color-mix(in srgb, var(--data-bad) 12%, var(--color-bg-lit)); border:1px solid color-mix(in srgb, var(--data-bad) 40%, transparent);"; tag = "basura"; }
        else { style += "background:var(--color-bg-muted); border:1px solid var(--color-border-default);"; tag = "vivo"; }
        var dot;
        if (gen) dot = o.gen === "young" ? "var(--data-warn)" : "var(--fam-conc)";
        else dot = marked ? "var(--data-ok)" : (garbage ? "var(--data-bad)" : "var(--color-fg-faint)");
        var genTag = gen ? (o.gen === "young" ? "joven" : "viejo") : tag;
        cell.style.cssText = style;
        cell.innerHTML =
          '<div style="display:flex; align-items:center; justify-content:space-between;">' +
            '<span class="mono" style="font-size:13px; font-weight:600; color:var(--color-fg-default);">' + o.id + '</span>' +
            '<span style="width:8px; height:8px; border-radius:50%; background:' + dot + ';"></span></div>' +
          '<div class="mono" style="font-size:10px; color:var(--color-fg-faint); margin-top:5px;">' + (garbage && !gen ? "basura" : genTag) + '</div>';
        host.appendChild(cell);
      });

      G.qs(".js-text", mount).textContent = w.texts[step];
      G.qs(".js-live", mount).textContent = w.stats.live[step];
      G.qs(".js-free", mount).textContent = w.stats.free[step];
      G.qs(".js-old", mount).textContent = gen ? w.stats.old[step] : "—";

      var btn = G.qs(".js-next", mount);
      btn.textContent = step === 3 ? "ciclo completo" : (step === 0 ? "marcar ▸" : step === 1 ? "barrer ▸" : "compactar ▸");
      btn.disabled = step === 3;

      var genBtn = G.qs(".js-gen", mount);
      G.qs(".js-gen-label", mount).textContent = gen ? "activado" : "desactivado";
      genBtn.style.borderColor = gen ? "var(--fam-mem)" : "var(--color-border-default)";
      genBtn.style.background = gen ? "var(--color-bg-lit)" : "var(--color-bg-lit)";
    }

    paint();
  };

})(window.GUIA = window.GUIA || {});
