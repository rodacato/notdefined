/* ============================================================
   page-heap.js — widget de la ficha 09.
   Tres páginas de 16 slots. Crea objetos, libera dispersos para
   fragmentar, y compacta para reagrupar y liberar páginas.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.heap = function (mount) {
    var TOTAL = 48, PER = 16;
    var slots = init();
    function init() { var a = new Array(TOTAL).fill(false); for (var i = 0; i < 14; i++) a[i] = true; return a; }

    mount.innerHTML =
      '<div class="js-pages" style="display:grid; grid-template-columns:repeat(3,1fr); gap:14px;"></div>' +
      '<div style="display:flex; align-items:center; gap:9px; margin-top:18px; flex-wrap:wrap; padding-top:16px; border-top:1px dashed var(--color-border-default);">' +
        '<button class="btn btn--primary js-alloc" type="button">+ crear × 8</button>' +
        '<button class="btn js-frag" type="button" style="color:var(--data-warn); border-color:color-mix(in srgb, var(--data-warn) 45%, transparent);">liberar dispersos</button>' +
        '<button class="btn js-compact" type="button" style="color:var(--fam-mem); border-color:var(--fam-mem);">GC.compact ▸</button>' +
        '<button class="btn btn--ghost js-reset" type="button">↺</button>' +
      '</div>' +
      '<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-top:16px;">' +
        stat("heap_live_slots", "js-live", "var(--fam-mem)") +
        stat("heap_free_slots", "js-free", "var(--color-fg-default)") +
        stat("páginas en uso", "js-pu", "var(--color-fg-default)") +
        stat("fragmentación", "js-frag-label", "var(--color-fg-default)") +
      '</div>';

    function stat(label, cls, color) {
      return '<div style="background:var(--color-bg-muted); border:1px solid var(--color-border-default); border-radius:10px; padding:12px 15px;">' +
        '<div class="eyebrow" style="font-size:9.5px; color:var(--color-fg-faint); margin-bottom:4px;">' + label + '</div>' +
        '<div class="' + cls + ' mono" style="font-size:20px; font-weight:600; color:' + color + ';"></div></div>';
    }

    G.qs(".js-alloc", mount).addEventListener("click", function () {
      var n = 8;
      for (var i = 0; i < TOTAL && n > 0; i++) if (!slots[i]) { slots[i] = true; n--; }
      paint();
    });
    G.qs(".js-frag", mount).addEventListener("click", function () {
      for (var i = 0; i < TOTAL; i++) if (slots[i] && (i % 2 === 0 || i % 5 === 0)) slots[i] = false;
      paint();
    });
    G.qs(".js-compact", mount).addEventListener("click", function () {
      var live = slots.filter(Boolean).length;
      slots = new Array(TOTAL).fill(false);
      for (var i = 0; i < live; i++) slots[i] = true;
      paint();
    });
    G.qs(".js-reset", mount).addEventListener("click", function () { slots = init(); paint(); });

    function paint() {
      var fam = "var(--fam-mem)";
      var live = slots.filter(Boolean).length;
      var lastLive = slots.lastIndexOf(true);
      var holes = 0;
      for (var i = 0; i <= lastLive; i++) if (!slots[i]) holes++;

      var host = G.qs(".js-pages", mount);
      host.innerHTML = "";
      [0, 1, 2].forEach(function (p) {
        var start = p * PER;
        var pageSlots = slots.slice(start, start + PER);
        var liveCount = pageSlots.filter(Boolean).length;
        var reclaimable = liveCount === 0;
        var cells = pageSlots.map(function (occ) {
          return '<div style="aspect-ratio:1; border-radius:4px; transition:all .16s ease;' +
            (occ ? "background:" + fam + "; border:1px solid " + fam + ";" : "background:var(--color-bg-canvas); border:1px dashed var(--color-border-default);") + '"></div>';
        }).join("");
        var badge = reclaimable ? "reclamable" : liveCount + " / 16";
        var badgeStyle = "display:inline-block; font-family:var(--font-mono); font-size:9px; letter-spacing:.06em; text-transform:uppercase; border-radius:999px; padding:2px 8px;" +
          (reclaimable ? "background:color-mix(in srgb, var(--data-ok) 20%, transparent); color:var(--data-ok);" : "background:var(--color-bg-surface); color:var(--color-fg-faint);");
        var page = G.h("div");
        page.style.cssText = "background:var(--color-bg-muted); border:1px solid " + (reclaimable ? "var(--data-ok)" : "var(--color-border-default)") + "; border-radius:12px; padding:13px; transition:all .18s ease;";
        page.innerHTML =
          '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">' +
            '<span class="mono" style="font-size:11px; font-weight:600; color:var(--color-fg-subtle);">página ' + p + '</span>' +
            '<span style="' + badgeStyle + '">' + badge + '</span></div>' +
          '<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:5px;">' + cells + '</div>';
        host.appendChild(page);
      });

      var pagesUsed = [0, 1, 2].filter(function (p) {
        return slots.slice(p * PER, p * PER + PER).filter(Boolean).length > 0;
      }).length;
      var frag = holes === 0 ? "ninguna" : holes < 6 ? "baja" : holes < 14 ? "media" : "alta";

      G.qs(".js-live", mount).textContent = live;
      G.qs(".js-free", mount).textContent = TOTAL - live;
      G.qs(".js-pu", mount).textContent = pagesUsed + " / 3";
      var fl = G.qs(".js-frag-label", mount);
      fl.textContent = frag;
      fl.style.color = holes === 0 ? "var(--data-ok)" : holes < 14 ? "var(--data-warn)" : "var(--data-bad)";
    }

    paint();
  };

})(window.GUIA = window.GUIA || {});
