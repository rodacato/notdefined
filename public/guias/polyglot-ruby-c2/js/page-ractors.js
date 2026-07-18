/* ============================================================
   page-ractors.js — widget de la ficha 05.
   Envía un objeto entre dos Ractors por copiar / mover /
   compartir. Compartir algo mutable dispara IsolationError.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.ractors = function (mount, topic) {
    var w = topic.widget;
    var objs = {}, modes = {};
    w.objs.forEach(function (o) { objs[o.key] = o; });
    w.modes.forEach(function (m) { modes[m.key] = m; });

    var obj = "mut", mode = "copy", phase = "idle";

    mount.innerHTML =
      '<div style="display:flex; gap:22px; flex-wrap:wrap; margin-bottom:8px;">' +
        '<div><div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:7px;">Objeto</div>' +
          '<div class="seg js-objs"></div></div>' +
        '<div><div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:7px;">Cómo enviarlo</div>' +
          '<div class="seg js-modes"></div></div>' +
      '</div>' +
      '<div style="display:grid; grid-template-columns:1fr auto 1fr; gap:0; align-items:stretch; margin-top:20px;" class="ractor-stage">' +
        '<div class="js-r1" style="background:var(--color-bg-lit); border-radius:13px; padding:18px 20px; transition:all .18s ease;">' +
          '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">' +
            '<span style="font-family:var(--font-display); font-weight:600; font-size:17px;">Ractor emisor</span>' +
            '<span class="mono" style="font-size:10px; color:var(--color-fg-faint);">r1</span></div>' +
          '<div class="js-r1-body"></div>' +
        '</div>' +
        '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 20px; gap:8px; min-width:120px;">' +
          '<span class="eyebrow" style="font-size:9.5px; color:var(--color-fg-faint);">canal · mensaje</span>' +
          '<span class="js-arrow" style="font-size:26px; transition:color .2s;">→</span>' +
          '<span class="js-verb mono" style="font-size:11px; font-weight:600;"></span>' +
        '</div>' +
        '<div class="js-r2" style="background:var(--color-bg-lit); border-radius:13px; padding:18px 20px; transition:all .18s ease;">' +
          '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">' +
            '<span style="font-family:var(--font-display); font-weight:600; font-size:17px;">Ractor receptor</span>' +
            '<span class="mono" style="font-size:10px; color:var(--color-fg-faint);">r2</span></div>' +
          '<div class="js-r2-body"></div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex; align-items:center; gap:14px; margin-top:20px; flex-wrap:wrap;">' +
        '<button class="btn btn--primary js-send" type="button"></button>' +
        '<button class="btn btn--ghost js-reset" type="button">↺ reiniciar</button>' +
      '</div>' +
      '<div class="js-result"></div>';

    // botones
    var segObjs = G.qs(".js-objs", mount), segModes = G.qs(".js-modes", mount);
    w.objs.forEach(function (o) {
      var b = G.h("button", { type: "button" }, G.esc(o.label)); b.dataset.k = o.key;
      b.addEventListener("click", function () { obj = o.key; phase = "idle"; paint(); });
      segObjs.appendChild(b);
    });
    w.modes.forEach(function (m) {
      var b = G.h("button", { type: "button" }, G.esc(m.verb)); b.dataset.k = m.key;
      b.addEventListener("click", function () { mode = m.key; phase = "idle"; paint(); });
      segModes.appendChild(b);
    });
    G.qs(".js-send", mount).addEventListener("click", function () {
      var o = objs[obj];
      phase = (mode === "share" && !o.shareable) ? "error" : "done";
      paint();
    });
    G.qs(".js-reset", mount).addEventListener("click", function () { phase = "idle"; paint(); });

    function chip(o) {
      return '<div class="mono" style="display:inline-block; font-size:14px; font-weight:600; color:var(--color-fg-default); background:var(--color-bg-muted); border:1px solid ' +
        (o.shareable ? "var(--fam-conc)" : "var(--color-border-strong)") + '; border-radius:9px; padding:10px 16px;">' + G.esc(o.ruby) + '</div>';
    }
    function empty(label) {
      return '<div class="mono" style="font-size:12.5px; color:var(--color-fg-faint); border:1px dashed var(--color-border-default); border-radius:9px; padding:14px; text-align:center;">' + G.esc(label) + '</div>';
    }

    function paint() {
      var o = objs[obj], fam = "var(--fam-conc)";
      G.qsa("button", segObjs).forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.k === obj ? "true" : "false"); });
      G.qsa("button", segModes).forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.k === mode ? "true" : "false"); });

      var done = phase === "done", error = phase === "error";
      var copied = done && mode === "copy", moved = done && mode === "move", shared = done && mode === "share";

      // R1
      var r1Empty = moved;
      G.qs(".js-r1-body", mount).innerHTML = r1Empty ? empty("movido — inaccesible") : chip(o);
      G.qs(".js-r1", mount).style.border = "1px solid " + (error ? "var(--data-bad)" : (shared ? fam : "var(--color-border-default)"));
      // R2
      var r2Has = copied || moved || shared;
      G.qs(".js-r2-body", mount).innerHTML = r2Has ? chip(o) : empty("esperando…");
      G.qs(".js-r2", mount).style.border = "1px solid " + (error ? "var(--data-bad)" : (r2Has ? fam : "var(--color-border-default)"));

      // canal
      var arrowCol = error ? "var(--data-bad)" : (done ? fam : "var(--color-fg-faint)");
      G.qs(".js-arrow", mount).style.color = arrowCol;
      var verb = G.qs(".js-verb", mount); verb.textContent = modes[mode].verb; verb.style.color = arrowCol;

      // botón enviar
      G.qs(".js-send", mount).textContent = "r2.send(obj" + (mode === "move" ? ", move: true" : "") + ") ▸";

      // resultado
      var box = G.qs(".js-result", mount);
      if (!done && !error) { box.innerHTML = ""; return; }
      var tag, text, accent, border;
      if (error) { tag = "Ractor::IsolationError"; accent = "var(--data-bad)"; border = "var(--data-bad)";
        text = "No se puede compartir un objeto mutable entre Ractors. Congélalo con .freeze o mándalo con copiar / mover."; }
      else if (copied) { tag = "copiado"; accent = fam; border = fam;
        text = "Se hizo un duplicado profundo. Cada Ractor tiene su propio objeto independiente: mutar uno no afecta al otro."; }
      else if (moved) { tag = "movido"; accent = fam; border = fam;
        text = "El objeto pasó al receptor sin copiar. El emisor ya no puede tocarlo: acceder a él ahora lanzaría un error."; }
      else { tag = "compartido"; accent = "var(--data-ok)"; border = "var(--data-ok)";
        text = "Al ser shareable (inmutable), ambos Ractors apuntan al mismo objeto sin copiarlo. Seguro porque nadie puede mutarlo."; }
      box.innerHTML =
        '<div style="display:flex; gap:12px; align-items:flex-start; margin-top:16px; border-radius:11px; padding:14px 17px; background:' +
          (error ? "color-mix(in srgb, var(--data-bad) 12%, var(--color-bg-lit))" : "var(--color-bg-lit)") +
          '; border:1px solid var(--color-border-default); border-left:3px solid ' + border + ';">' +
          '<span class="eyebrow" style="flex:none; margin-top:1px; color:' + accent + ';">' + G.esc(tag) + '</span>' +
          '<p style="font-size:13.5px; line-height:1.55; margin:0; color:var(--color-fg-subtle);">' + G.esc(text) + '</p></div>';
    }

    paint();
  };

})(window.GUIA = window.GUIA || {});
