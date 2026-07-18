/* ============================================================
   page-yarv.js — widget de la ficha 02.
   Ejecuta el ISEQ de 2*(3+4) instrucción por instrucción y
   dibuja la pila de la VM subir y bajar.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.yarv = function (mount, topic) {
    var w = topic.widget, insns = w.insns, stacks = w.stacks, texts = w.texts;
    var step = 0;
    var last = insns.length; // pasos = instrucciones + estado final

    mount.innerHTML =
      '<div style="display:grid; grid-template-columns:1.2fr 1fr; gap:20px; align-items:stretch;" class="yarv-grid">' +
        '<div class="codesurface"><div class="codesurface__body" style="padding:18px 20px;">' +
          '<div class="eyebrow" style="color:#C99B7A; margin-bottom:12px;">ISEQ · disasm</div>' +
          '<div class="js-insns" style="display:flex; flex-direction:column; gap:3px;"></div>' +
        '</div></div>' +
        '<div style="display:flex; flex-direction:column;">' +
          '<div class="eyebrow" style="color:var(--color-fg-faint); margin-bottom:12px;">Pila (VM stack)</div>' +
          '<div class="js-stack" style="flex:1; display:flex; flex-direction:column-reverse; gap:7px; background:var(--color-bg-muted); border:1px solid var(--color-border-default); border-radius:10px; padding:14px; min-height:210px;"></div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:18px; flex-wrap:wrap; padding-top:16px; border-top:1px dashed var(--color-border-default);">' +
        '<p class="js-text" style="font-size:13.5px; line-height:1.5; color:var(--color-fg-subtle); margin:0; max-width:54ch;"></p>' +
        '<div style="display:flex; gap:10px; flex:none;">' +
          '<button class="btn btn--ghost js-reset" type="button">↺</button>' +
          '<button class="btn btn--primary js-step" type="button"></button>' +
        '</div>' +
      '</div>';

    var elInsns = G.qs(".js-insns", mount), elStack = G.qs(".js-stack", mount),
        elText = G.qs(".js-text", mount), btnStep = G.qs(".js-step", mount);

    G.qs(".js-reset", mount).addEventListener("click", function () { step = 0; paint(); });
    btnStep.addEventListener("click", function () { if (step < last) { step++; paint(); } });

    function paint() {
      // Listado de instrucciones: resalta la recién ejecutada y la próxima.
      elInsns.innerHTML = "";
      insns.forEach(function (ins, idx) {
        var justRan = idx === step - 1, nextUp = idx === step && step < last;
        var line = G.h("div");
        line.style.cssText = "font-family:var(--font-mono); font-size:13px; line-height:1.55; border-radius:6px; padding:4px 8px; transition:all .15s ease;" +
          (justRan ? "background:color-mix(in srgb, var(--data-warn) 24%, transparent);"
           : nextUp ? "background:color-mix(in srgb, #C99B7A 18%, transparent); box-shadow:inset 2px 0 0 #C99B7A;"
           : "background:transparent;");
        line.innerHTML =
          '<span style="color:var(--code-dim); width:34px; display:inline-block;">' + ins.addr + '</span>' +
          '<span style="color:' + (ins.opt ? "#7FB79A" : "#E0A66F") + '; font-weight:600;">' + ins.op + '</span>' +
          '<span style="color:#7FB0D8; margin-left:8px;">' + ins.arg + '</span>';
        elInsns.appendChild(line);
      });
      // Superficie de código para el listado (fondo oscuro constante)
      elInsns.parentElement.parentElement.style.color = "var(--code-fg)";

      // Pila
      var raw = stacks[step], prev = stacks[Math.max(0, step - 1)];
      elStack.innerHTML = "";
      if (!raw.length) {
        elStack.innerHTML = '<div class="mono" style="font-size:12px; color:var(--color-fg-faint); text-align:center; padding:8px;">vacía</div>';
      } else {
        raw.forEach(function (v, idx) {
          var isTop = idx === raw.length - 1, grew = raw.length > prev.length;
          var cell = G.h("div", null, String(v));
          cell.style.cssText = "font-family:var(--font-mono); font-size:16px; font-weight:600; color:var(--color-fg-default); background:var(--color-bg-surface); border:1px solid " +
            (isTop ? "var(--color-primary)" : "var(--color-border-default)") + "; border-radius:8px; padding:11px 14px; text-align:center; transition:all .15s ease;" +
            (isTop && grew ? "box-shadow:0 0 0 2px color-mix(in srgb, var(--color-primary) 22%, transparent);" : "");
          elStack.appendChild(cell);
        });
      }
      elStack.insertAdjacentHTML("afterbegin", '<div class="mono" style="font-size:10px; color:var(--color-fg-faint); text-align:center; letter-spacing:.1em;">— base —</div>');

      elText.textContent = texts[step];
      btnStep.textContent = step === last ? "fin" : "ejecutar ▸";
      btnStep.disabled = step === last;
    }

    paint();
  };

})(window.GUIA = window.GUIA || {});
