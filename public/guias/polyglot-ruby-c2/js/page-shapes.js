/* ============================================================
   page-shapes.js — widget de la ficha 08.
   Añade ivars a un objeto y construye el árbol de shapes que
   comparten las instancias con la misma estructura.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.shapes = function (mount, topic) {
    var IVARS = topic.widget.ivars, presets = topic.widget.presets;
    var nodes = [];      // {key, ivar, parent}
    var current = "";    // key de la shape actual del objeto
    var objIvars = [];

    mount.innerHTML =
      '<div style="display:grid; grid-template-columns:1fr 1.2fr; gap:20px; align-items:start;" class="shapes-grid">' +
        '<div>' +
          '<div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:9px;">Objeto actual</div>' +
          '<div style="background:var(--color-bg-muted); border:1px solid var(--color-border-default); border-radius:11px; padding:16px;">' +
            '<div class="mono" style="font-size:12.5px; color:var(--color-fg-subtle); margin-bottom:10px;">punto = Punto.new</div>' +
            '<div class="js-obj" style="display:flex; flex-direction:column; gap:6px;"></div>' +
            '<div style="margin-top:12px; padding-top:10px; border-top:1px dashed var(--color-border-default); font-family:var(--font-mono); font-size:11.5px; color:var(--color-fg-subtle);">shape actual: <b class="js-shape" style="color:var(--fam-mem);"></b></div>' +
          '</div>' +
          '<div class="eyebrow" style="color:var(--color-fg-faint); margin:16px 0 9px;">Añadir ivar</div>' +
          '<div class="js-add" style="display:flex; gap:7px; flex-wrap:wrap;"></div>' +
          '<div class="js-presets" style="display:flex; gap:7px; flex-wrap:wrap; margin-top:12px;"></div>' +
          '<button class="btn btn--ghost js-resetobj" type="button" style="margin-top:10px; font-size:11.5px;">↺ objeto nuevo (desde raíz)</button>' +
        '</div>' +
        '<div>' +
          '<div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:9px;">Árbol de shapes · compartido</div>' +
          '<div style="background:var(--color-bg-muted); border:1px solid var(--color-border-default); border-radius:11px; padding:16px; min-height:230px;">' +
            '<div class="js-root" style="display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:8px;">' +
              '<span class="mono" style="font-size:11px; color:var(--color-fg-faint);">shape 0</span>' +
              '<span style="font-size:13px; color:var(--color-fg-default);">raíz · sin ivars</span></div>' +
            '<div class="js-tree" style="display:flex; flex-direction:column; gap:5px; margin-top:5px;"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var addHost = G.qs(".js-add", mount);
    IVARS.forEach(function (v) {
      var b = G.h("button", { type: "button", class: "btn" }, "+ " + v);
      b.dataset.v = v;
      b.addEventListener("click", function () { add(v); });
      addHost.appendChild(b);
    });
    var presetHost = G.qs(".js-presets", mount);
    presets.forEach(function (p) {
      var b = G.h("button", { type: "button", class: "btn" }, G.esc(p.label));
      b.style.fontSize = "11.5px";
      b.addEventListener("click", function () { applyPreset(p.seq); });
      presetHost.appendChild(b);
    });
    G.qs(".js-resetobj", mount).addEventListener("click", function () { current = ""; objIvars = []; paint(); });

    function add(v) {
      if (objIvars.indexOf(v) !== -1) return;
      var key = current ? current + ">" + v : v;
      if (!nodes.find(function (n) { return n.key === key; })) nodes.push({ key: key, ivar: v, parent: current });
      current = key; objIvars = objIvars.concat(v);
      paint();
    }
    function applyPreset(seq) {
      var cur = "", ivars = [];
      seq.forEach(function (v) {
        var nk = cur ? cur + ">" + v : v;
        if (!nodes.find(function (n) { return n.key === nk; })) nodes.push({ key: nk, ivar: v, parent: cur });
        cur = nk; ivars.push(v);
      });
      current = cur; objIvars = ivars;
      paint();
    }
    function idOf(key) { return nodes.findIndex(function (n) { return n.key === key; }) + 1; }

    function paint() {
      var fam = "var(--fam-mem)";
      // objeto
      var objHost = G.qs(".js-obj", mount);
      if (!objIvars.length) {
        objHost.innerHTML = '<div class="mono" style="font-size:12px; color:var(--color-fg-faint); text-align:center; padding:8px; border:1px dashed var(--color-border-default); border-radius:7px;">sin ivars todavía</div>';
      } else {
        objHost.innerHTML = objIvars.map(function (v) {
          return '<div class="mono" style="font-size:13px; color:var(--color-fg-default); background:var(--color-bg-surface); border:1px solid var(--color-border-default); border-left:3px solid ' + fam + '; border-radius:7px; padding:8px 12px;">punto.' + G.esc(v) + ' = …</div>';
        }).join("");
      }
      G.qs(".js-shape", mount).textContent = current === "" ? "shape 0 (raíz)" : "shape " + idOf(current);

      // botones add (deshabilita las ya presentes)
      G.qsa("button", addHost).forEach(function (b) { b.disabled = objIvars.indexOf(b.dataset.v) !== -1; });

      // raíz resaltada cuando el objeto está en shape 0
      G.qs(".js-root", mount).style.cssText = "display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:8px;" +
        (current === "" ? "background:var(--color-bg-lit); border:1px solid " + fam + ";" : "background:var(--color-bg-surface); border:1px solid var(--color-border-default);");

      // árbol (DFS respetando orden de inserción)
      var out = [];
      (function walk(parentKey, depth) {
        nodes.filter(function (n) { return n.parent === parentKey; }).forEach(function (n) {
          var onPath = current === n.key || current.indexOf(n.key + ">") === 0;
          var isCurrent = current === n.key;
          var style = "display:inline-flex; align-items:center; gap:8px; border-radius:8px; padding:6px 11px; transition:all .15s ease;";
          if (isCurrent) style += "background:var(--color-bg-lit); border:1px solid " + fam + "; box-shadow:0 0 0 2px color-mix(in srgb, var(--fam-mem) 16%, transparent); color:var(--color-fg-default);";
          else if (onPath) style += "background:var(--color-bg-surface); border:1px solid " + fam + "; color:var(--color-fg-default);";
          else style += "background:var(--color-bg-surface); border:1px solid var(--color-border-default); color:var(--color-fg-subtle);";
          out.push(
            '<div style="display:flex; align-items:center; margin-left:' + (depth * 22) + 'px;">' +
              '<span class="mono" style="color:var(--color-fg-faint); margin-right:6px;">└─</span>' +
              '<div style="' + style + '">' +
                '<span class="mono" style="font-size:10.5px; opacity:.7;">shape ' + idOf(n.key) + '</span>' +
                '<span class="mono" style="font-size:13px; font-weight:600;">+' + G.esc(n.ivar) + '</span>' +
                (isCurrent ? '<span class="mono" style="font-size:9.5px; letter-spacing:.06em; text-transform:uppercase; background:' + fam + '; color:#fff; border-radius:999px; padding:2px 7px;">aquí</span>' : '') +
              '</div></div>');
          walk(n.key, depth + 1);
        });
      })("", 0);
      G.qs(".js-tree", mount).innerHTML = out.join("");
    }

    paint();
  };

})(window.GUIA = window.GUIA || {});
