/* ============================================================
   page-singleton.js — widget de la ficha 11.
   Define métodos singleton sobre un objeto y sobre su clase, y
   mira aparecer las eigenclasses en la cadena de lookup.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.singleton = function (mount) {
    var obj = false, cls = false;

    mount.innerHTML =
      '<div style="display:flex; gap:9px; flex-wrap:wrap; margin-bottom:20px;">' +
        '<button class="btn js-obj" type="button">def perro.hablar</button>' +
        '<button class="btn js-cls" type="button">def Perro.crear</button>' +
        '<button class="btn btn--ghost js-reset" type="button">↺ reiniciar</button>' +
      '</div>' +
      '<div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:12px;">Cadena de lookup de perro</div>' +
      '<div class="js-chain" style="display:flex; flex-direction:column; gap:0;"></div>' +
      '<div class="js-note"></div>' +
      '<div style="display:flex; gap:12px; align-items:flex-start; margin-top:14px;">' +
        '<span class="eyebrow" style="color:var(--color-fg-faint); flex:none; margin-top:2px;">Estado</span>' +
        '<p class="js-state" style="font-size:13.5px; line-height:1.55; margin:0; color:var(--color-fg-subtle);"></p>' +
      '</div>';

    G.qs(".js-obj", mount).addEventListener("click", function () { obj = !obj; paint(); });
    G.qs(".js-cls", mount).addEventListener("click", function () { cls = !cls; paint(); });
    G.qs(".js-reset", mount).addEventListener("click", function () { obj = false; cls = false; paint(); });

    function paint() {
      var fam = "var(--fam-obj)";
      styleToggle(G.qs(".js-obj", mount), obj);
      styleToggle(G.qs(".js-cls", mount), cls);

      var nodeBase = "display:flex; align-items:center; justify-content:space-between; gap:12px; border-radius:11px; padding:13px 16px; transition:all .16s ease;";
      var chain = [];
      chain.push({ name: "perro", kind: "instancia · Perro.new", style: nodeBase + "background:var(--color-bg-muted); border:1px solid var(--color-border-default);", edge: null });
      if (obj) chain.push({ name: "#⟨perro⟩", kind: "singleton class (eigenclass)",
        style: nodeBase + "background:var(--color-bg-lit); border:1px solid " + fam + "; box-shadow:0 0 0 2px color-mix(in srgb, var(--fam-obj) 16%, transparent);",
        edge: "class ⇢ (oculta)", edgeItalic: true, method: "hablar" });
      chain.push({ name: "Perro", kind: "class", style: nodeBase + "background:var(--color-bg-surface); border:1px solid var(--color-border-default);", edge: obj ? "superclass →" : "class ⇢" });
      chain.push({ name: "Object", kind: "class", style: nodeBase + "background:var(--color-bg-surface); border:1px solid var(--color-border-default); opacity:.85;", edge: "superclass →" });
      chain.push({ name: "BasicObject", kind: "class", style: nodeBase + "background:var(--color-bg-surface); border:1px solid var(--color-border-default); opacity:.7;", edge: "superclass →" });

      G.qs(".js-chain", mount).innerHTML = chain.map(function (c) {
        var edge = c.edge
          ? '<div style="display:flex; align-items:center; gap:8px; padding:3px 0 3px 22px;"><span style="font-size:16px; color:var(--color-fg-faint);">↑</span>' +
            '<span class="mono" style="font-size:10.5px; color:var(--color-fg-faint);' + (c.edgeItalic ? "font-style:italic;" : "") + '">' + G.esc(c.edge) + '</span></div>'
          : '';
        var methodBadge = c.method
          ? '<span class="mono" style="font-size:10.5px; letter-spacing:.05em; text-transform:uppercase; background:color-mix(in srgb, var(--data-ok) 18%, transparent); color:var(--data-ok); border-radius:999px; padding:3px 10px;">define ' + c.method + '</span>'
          : '';
        return '<div>' + edge + '<div style="' + c.style + '">' +
          '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">' +
            '<span class="mono" style="font-size:14.5px; font-weight:600; color:var(--color-fg-default);">' + G.esc(c.name) + '</span>' +
            '<span class="mono" style="font-size:10px; letter-spacing:.05em; text-transform:uppercase; color:var(--color-fg-faint);">' + G.esc(c.kind) + '</span></div>' +
          methodBadge + '</div></div>';
      }).join("");

      var note = G.qs(".js-note", mount);
      note.innerHTML = cls
        ? '<div style="display:flex; gap:12px; align-items:flex-start; margin-top:18px; background:var(--color-bg-lit); border:1px solid var(--color-border-default); border-left:3px solid ' + fam + '; border-radius:11px; padding:14px 17px;">' +
            '<span class="eyebrow" style="color:' + fam + '; flex:none; margin-top:1px;">método de clase</span>' +
            '<p style="font-size:13.5px; line-height:1.55; margin:0; color:var(--color-fg-subtle);"><code class="ic">Perro.crear</code> no vive «en Perro»: vive en la singleton class de Perro, <code class="ic">#⟨Perro⟩</code>. Por eso <code class="ic">def self.crear</code> dentro de la clase es exactamente lo mismo. Un «método de clase» es un método de instancia de la eigenclass de la clase.</p></div>'
        : '';

      var s;
      if (!obj && !cls) s = "perro es un Perro corriente. Su cadena de lookup va directo de perro a Perro. Aún no hay eigenclass.";
      else if (obj && !cls) s = "Al definir perro.hablar, Ruby creó #⟨perro⟩ y la insertó antes de Perro. hablar vive ahí: solo este perro lo tiene.";
      else if (!obj && cls) s = "Perro.crear es un método de clase: vive en la eigenclass de Perro, no en la cadena de instancias de perro.";
      else s = "Ambos: perro tiene su eigenclass con hablar, y Perro tiene la suya con crear. Mismo mecanismo, distinto objeto.";
      G.qs(".js-state", mount).textContent = s;
    }

    function styleToggle(btn, on) {
      btn.style.background = on ? "var(--fam-obj)" : "var(--color-bg-lit)";
      btn.style.color = on ? "#fff" : "var(--color-fg-default)";
      btn.style.borderColor = on ? "var(--fam-obj)" : "var(--color-border-default)";
    }

    paint();
  };

})(window.GUIA = window.GUIA || {});
