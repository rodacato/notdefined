/* ============================================================
   page-lookup.js — widget de la ficha 10.
   Llama un método sobre un Perro y anima el puntero bajando por
   la cadena de ancestros hasta el primero que lo define.
   Respeta prefers-reduced-motion (salta al resultado final).
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.lookup = function (mount, topic) {
    var w = topic.widget, DEFS = w.defs, KIND = w.kind_of, METHODS = w.methods;
    var prepend = true, order = "A", method = null, probe = -1, done = false;
    var timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    mount.innerHTML =
      '<div style="display:flex; gap:22px; flex-wrap:wrap; align-items:flex-start;">' +
        '<div><div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:7px;">prepend Ruidoso</div>' +
          '<div class="seg js-prep"><button type="button" data-v="on">con</button><button type="button" data-v="off">sin</button></div></div>' +
        '<div><div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:7px;">Orden de include</div>' +
          '<div class="seg js-ord"><button type="button" data-v="A">Saludable → Nadador</button><button type="button" data-v="B">Nadador → Saludable</button></div></div>' +
      '</div>' +
      '<div style="margin-top:20px; padding-top:16px; border-top:1px dashed var(--color-border-default);">' +
        '<div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:9px;">perro.___</div>' +
        '<div class="js-methods" style="display:flex; gap:8px; flex-wrap:wrap;"></div>' +
      '</div>' +
      '<div class="js-chain" style="display:grid; grid-template-columns:1fr; gap:6px; margin-top:20px;"></div>' +
      '<div class="js-result"></div>';

    G.qsa(".js-prep button", mount).forEach(function (b) {
      b.addEventListener("click", function () { prepend = b.dataset.v === "on"; resetCall(); });
    });
    G.qsa(".js-ord button", mount).forEach(function (b) {
      b.addEventListener("click", function () { order = b.dataset.v; resetCall(); });
    });
    var mHost = G.qs(".js-methods", mount);
    METHODS.forEach(function (m) {
      var b = G.h("button", { type: "button", class: "btn" }, m);
      b.dataset.m = m;
      b.addEventListener("click", function () { call(m); });
      mHost.appendChild(b);
    });

    function chainNames() {
      var pre = prepend ? ["Ruidoso"] : [];
      var inc = order === "A" ? ["Nadador", "Saludable"] : ["Saludable", "Nadador"];
      return pre.concat(["Perro"], inc, ["Animal", "Object", "Kernel", "BasicObject"]);
    }
    function foundIndex(chain, m) { return chain.findIndex(function (n) { return DEFS[n].indexOf(m) !== -1; }); }

    function resetCall() { clearInterval(timer); method = null; probe = -1; done = false; paint(); }
    function call(m) {
      clearInterval(timer);
      var chain = chainNames(), fi = foundIndex(chain, m);
      method = m;
      if (reduce) { probe = fi === -1 ? chain.length - 1 : fi; done = true; paint(); return; }
      probe = 0; done = false; paint();
      timer = setInterval(function () {
        if ((fi !== -1 && probe >= fi) || probe >= chain.length - 1) {
          clearInterval(timer); done = true; paint();
        } else { probe++; paint(); }
      }, 260);
    }

    function paint() {
      var fam = "var(--fam-obj)";
      G.qsa(".js-prep button", mount).forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.v === "on") === prepend ? "true" : "false"); });
      G.qsa(".js-ord button", mount).forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === order ? "true" : "false"); });
      G.qsa("button", mHost).forEach(function (b) {
        var act = b.dataset.m === method;
        b.style.background = act ? fam : "var(--color-bg-lit)";
        b.style.color = act ? "#fff" : "var(--color-fg-default)";
        b.style.borderColor = act ? fam : "var(--color-border-default)";
      });

      var names = chainNames();
      var fi = method ? foundIndex(names, method) : -2;
      var host = G.qs(".js-chain", mount);
      host.innerHTML = "";
      names.forEach(function (n, i) {
        var defines = method && DEFS[n].indexOf(method) !== -1;
        var isFound = done && i === fi;
        var scanned = method != null && (i < probe || (done && i <= (fi === -1 ? names.length : fi)));
        var scanning = method != null && !done && i === probe;
        var cardBase = "flex:1; display:flex; align-items:center; justify-content:space-between; gap:12px; border-radius:10px; padding:11px 15px; transition:all .16s ease;";
        var style, ptr = "", ptrColor = "transparent", badge = "", badgeStyle = "display:none;";
        var bChip = "font-family:var(--font-mono); font-size:9.5px; letter-spacing:.06em; text-transform:uppercase; border-radius:999px; padding:2px 8px;";
        if (isFound) {
          style = cardBase + "background:var(--color-bg-lit); border:1px solid var(--data-ok); box-shadow:0 0 0 2px color-mix(in srgb, var(--data-ok) 16%, transparent);";
          ptr = "▸"; ptrColor = "var(--data-ok)"; badge = "ejecuta"; badgeStyle = bChip + "background:color-mix(in srgb, var(--data-ok) 18%, transparent); color:var(--data-ok);";
        } else if (scanning) {
          style = cardBase + "background:var(--color-bg-lit); border:1px solid " + fam + "; box-shadow:0 0 0 2px color-mix(in srgb, var(--fam-obj) 16%, transparent);";
          ptr = "▸"; ptrColor = fam; badge = "¿está aquí?"; badgeStyle = bChip + "background:var(--color-bg-muted); color:" + fam + ";";
        } else if (scanned && !isFound) {
          style = cardBase + "background:var(--color-bg-canvas); border:1px solid var(--color-border-soft); opacity:.62;";
          badge = "no está"; badgeStyle = bChip + "background:var(--color-bg-muted); color:var(--color-fg-faint);";
        } else {
          style = cardBase + "background:var(--color-bg-muted); border:1px solid var(--color-border-default);";
          if (defines) { badge = "define " + method; badgeStyle = bChip + "background:var(--color-bg-surface); color:var(--color-fg-subtle); border:1px solid var(--color-border-default);"; }
        }
        var row = G.h("div");
        row.style.cssText = "display:flex; align-items:center; gap:12px;";
        row.innerHTML =
          '<span class="mono" style="font-size:14px; width:20px; text-align:center; flex:none; color:' + ptrColor + ';">' + ptr + '</span>' +
          '<div style="' + style + '">' +
            '<div style="display:flex; align-items:center; gap:10px;">' +
              '<span class="mono" style="font-size:14px; font-weight:600; color:var(--color-fg-default);">' + n + '</span>' +
              '<span class="mono" style="font-size:10px; letter-spacing:.06em; text-transform:uppercase; color:var(--color-fg-faint);">' + KIND[n] + '</span></div>' +
            '<div style="display:flex; align-items:center; gap:8px;">' +
              '<span class="mono" style="font-size:11px; color:var(--color-fg-faint);">' + DEFS[n].join(" · ") + '</span>' +
              '<span style="' + badgeStyle + '">' + badge + '</span></div>' +
          '</div>';
        host.appendChild(row);
      });

      var box = G.qs(".js-result", mount);
      if (!done) { box.innerHTML = ""; return; }
      var tag, text, accent, border;
      if (fi === -1) {
        tag = "method_missing"; accent = "var(--data-bad)"; border = "var(--data-bad)";
        text = "Ningún ancestro define «" + method + "». Ruby recorre toda la cadena hasta BasicObject y, al no encontrarlo, dispara method_missing (que por defecto lanza NoMethodError).";
      } else {
        var winner = names[fi];
        tag = "resuelto en " + winner; accent = "var(--data-ok)"; border = "var(--data-ok)";
        text = "«" + method + "» se ejecuta desde " + winner + " (" + KIND[winner] + "): es el primer ancestro que lo define. Cualquier definición más abajo en la cadena queda tapada.";
      }
      box.innerHTML =
        '<div style="display:flex; gap:12px; align-items:flex-start; margin-top:16px; border-radius:11px; padding:14px 17px; background:' +
          (fi === -1 ? "color-mix(in srgb, var(--data-bad) 12%, var(--color-bg-lit))" : "var(--color-bg-lit)") +
          '; border:1px solid var(--color-border-default); border-left:3px solid ' + border + ';">' +
          '<span class="eyebrow" style="flex:none; margin-top:1px; color:' + accent + ';">' + G.esc(tag) + '</span>' +
          '<p style="font-size:13.5px; line-height:1.55; margin:0; color:var(--color-fg-subtle);">' + G.esc(text) + '</p></div>';
    }

    // limpia el intervalo al reemplazar la vista
    var obs = new MutationObserver(function () {
      if (!document.body.contains(mount)) { clearInterval(timer); obs.disconnect(); }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    paint();
  };

})(window.GUIA = window.GUIA || {});
