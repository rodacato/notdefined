/* ============================================================
   page-caches.js — widget de la ficha 12.
   El inline cache de un sitio de llamada: primera llamada miss,
   siguientes hit, y una redefinición que invalida por versión.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.caches = function (mount) {
    var cache = "empty", version = 1, hits = 0, misses = 0, log = "start";

    mount.innerHTML =
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;" class="cache-grid">' +
        '<div class="codesurface"><div class="codesurface__body" style="padding:16px 18px;">' +
          '<div class="eyebrow" style="color:#C99B7A; margin-bottom:10px;">Sitio de llamada</div>' +
          '<div class="mono" style="font-size:14px; color:var(--code-fg);">perro.hablar</div>' +
          '<div style="margin-top:12px; padding-top:10px; border-top:1px solid var(--code-line);">' +
            '<div class="mono" style="font-size:10px; color:var(--code-dim); margin-bottom:5px;">inline cache</div>' +
            '<div class="js-cache mono" style="font-size:12.5px; font-weight:600;"></div></div>' +
        '</div></div>' +
        '<div style="border-radius:12px; padding:16px 18px; background:var(--color-bg-muted); border:1px solid var(--color-border-default); display:flex; flex-direction:column; gap:2px;">' +
          '<div class="eyebrow" style="color:var(--color-fg-faint);">Última llamada</div>' +
          '<div class="js-speed" style="font-family:var(--font-display); font-weight:600; font-size:24px; margin-top:4px;"></div>' +
          '<div class="js-speed-sub" style="font-size:12.5px; color:var(--color-fg-subtle); line-height:1.45; margin-top:2px;"></div>' +
          '<div style="display:flex; gap:16px; margin-top:12px;">' +
            counter("hits", "js-hits", "var(--data-ok)") +
            counter("misses", "js-misses", "var(--data-warn)") +
            counter("global version", "js-ver", "var(--fam-obj)") +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="eyebrow" style="color:var(--color-fg-faint); margin:18px 0 10px;">Cadena de ancestros</div>' +
      '<div class="js-chain" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;"></div>' +
      '<div style="display:flex; align-items:center; gap:10px; margin-top:18px; flex-wrap:wrap; padding-top:16px; border-top:1px dashed var(--color-border-default);">' +
        '<button class="btn btn--primary js-call" type="button">perro.hablar ▸</button>' +
        '<button class="btn js-redef" type="button" style="color:var(--data-warn); border-color:color-mix(in srgb, var(--data-warn) 45%, transparent);">redefinir hablar ⟳</button>' +
        '<button class="btn btn--ghost js-reset" type="button">↺</button>' +
      '</div>' +
      '<div class="js-log"></div>';

    function counter(label, cls, color) {
      return '<div><div class="mono" style="font-size:9.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--color-fg-faint);">' + label + '</div>' +
        '<div class="' + cls + ' mono" style="font-size:18px; font-weight:600; color:' + color + ';"></div></div>';
    }

    G.qs(".js-call", mount).addEventListener("click", function () {
      if (cache === "empty") { cache = "filled"; misses++; log = "miss"; }
      else { hits++; log = "hit"; }
      paint();
    });
    G.qs(".js-redef", mount).addEventListener("click", function () {
      version++; cache = "empty"; log = "invalidate"; paint();
    });
    G.qs(".js-reset", mount).addEventListener("click", function () {
      cache = "empty"; version = 1; hits = 0; misses = 0; log = "start"; paint();
    });

    function paint() {
      var fam = "var(--fam-obj)", filled = cache === "filled";

      var cacheEl = G.qs(".js-cache", mount);
      cacheEl.textContent = filled ? "→ Perro#hablar (v" + version + ")" : "vacía";
      cacheEl.style.color = filled ? "#7FB79A" : "var(--code-dim)";

      var speed = log === "hit" ? "hit · directo" : log === "miss" ? "miss · recorre" : log === "invalidate" ? "invalidada" : "—";
      var speedColor = log === "hit" ? "var(--data-ok)" : log === "miss" ? "var(--data-warn)" : log === "invalidate" ? "var(--data-bad)" : "var(--color-fg-subtle)";
      var speedSub = log === "hit" ? "resolución en un paso" : log === "miss" ? "recorrió la cadena una vez" : log === "invalidate" ? "la caché se descartó" : "aún sin llamar";
      var sp = G.qs(".js-speed", mount); sp.textContent = speed; sp.style.color = speedColor;
      G.qs(".js-speed-sub", mount).textContent = speedSub;
      G.qs(".js-hits", mount).textContent = hits;
      G.qs(".js-misses", mount).textContent = misses;
      G.qs(".js-ver", mount).textContent = "v" + version;

      // cadena
      var names = ["perro", "Perro", "Object", "BasicObject"];
      G.qs(".js-chain", mount).innerHTML = names.map(function (n, i) {
        var target = n === "Perro", bg, border, color;
        if (log === "hit") {
          if (target) { bg = "var(--color-bg-lit)"; border = "var(--data-ok)"; color = "var(--color-fg-default)"; }
          else { bg = "var(--color-bg-canvas)"; border = "var(--color-border-soft)"; color = "var(--color-fg-faint)"; }
        } else if (log === "miss") {
          if (i <= 1) { bg = "var(--color-bg-lit)"; border = fam; color = "var(--color-fg-default)"; }
          else { bg = "var(--color-bg-canvas)"; border = "var(--color-border-soft)"; color = "var(--color-fg-faint)"; }
        } else { bg = "var(--color-bg-muted)"; border = "var(--color-border-default)"; color = "var(--color-fg-subtle)"; }
        var chip = '<span class="mono" style="font-size:12.5px; font-weight:600; border-radius:8px; padding:8px 13px; transition:all .16s ease; background:' + bg + '; border:1px solid ' + border + '; color:' + color + ';">' + n + '</span>';
        return chip + (i < names.length - 1 ? '<span style="color:var(--color-fg-faint);">→</span>' : '');
      }).join("");

      var logs = {
        start:      { tag: "listo", accent: "var(--color-fg-faint)", bd: "var(--color-border-strong)", bg: "var(--color-bg-muted)", text: "La caché arranca vacía. La primera llamada tendrá que recorrer la cadena de ancestros." },
        miss:       { tag: "cache miss", accent: "var(--data-warn)", bd: "var(--data-warn)", bg: "var(--color-bg-lit)", text: "Primera llamada: la caché estaba vacía, así que Ruby recorrió la cadena, encontró Perro#hablar y lo guardó en el inline cache." },
        hit:        { tag: "cache hit", accent: "var(--data-ok)", bd: "var(--data-ok)", bg: "var(--color-bg-lit)", text: "La caché tenía la respuesta (y la global version coincide): salta directo a Perro#hablar sin recorrer nada. Mucho más rápido." },
        invalidate: { tag: "invalidación", accent: "var(--data-bad)", bd: "var(--data-bad)", bg: "color-mix(in srgb, var(--data-bad) 12%, var(--color-bg-lit))", text: "Redefiniste hablar: la global version subió a v" + version + ". La huella del inline cache ya no coincide, así que se descarta. La próxima llamada será otra vez un miss." }
      };
      var lg = logs[log];
      G.qs(".js-log", mount).innerHTML =
        '<div style="display:flex; gap:12px; align-items:flex-start; margin-top:16px; border-radius:11px; padding:13px 16px; background:' + lg.bg + '; border:1px solid var(--color-border-default); border-left:3px solid ' + lg.bd + ';">' +
          '<span class="eyebrow" style="flex:none; margin-top:1px; color:' + lg.accent + ';">' + lg.tag + '</span>' +
          '<p style="font-size:13.5px; line-height:1.5; margin:0; color:var(--color-fg-subtle);">' + lg.text + '</p></div>';
    }

    paint();
  };

})(window.GUIA = window.GUIA || {});
