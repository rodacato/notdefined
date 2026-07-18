/* ============================================================
   page-pipeline.js — widget de la ficha 01.
   Recorre las 4 etapas del pipeline mostrando el artefacto de
   cada una. Los datos (etapas, código, notas) viven en data/.
   ============================================================ */
(function (G) {
  "use strict";

  G.widgets.pipeline = function (mount, topic) {
    var stages = topic.widget.stages;
    var i = 0;

    mount.innerHTML =
      '<div class="pl-row" style="display:grid; grid-template-columns:repeat(4,1fr); gap:9px;"></div>' +
      '<div class="codesurface" style="margin-top:18px;">' +
        '<div class="codesurface__bar"><span class="eyebrow js-title"></span>' +
          '<span class="count js-count"></span></div>' +
        '<div class="codesurface__body" style="min-height:210px;">' +
          '<pre class="js-code"></pre><p class="codenote js-note"></p></div>' +
      '</div>' +
      '<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:16px; flex-wrap:wrap;">' +
        '<button class="btn btn--ghost js-reset" type="button">↺ reiniciar</button>' +
        '<div style="display:flex; gap:10px;">' +
          '<button class="btn js-prev" type="button">← anterior</button>' +
          '<button class="btn btn--primary js-next" type="button">siguiente etapa →</button>' +
        '</div>' +
      '</div>';

    var row = G.qs(".pl-row", mount);
    stages.forEach(function (s, idx) {
      var b = G.h("button", { type: "button", class: "pl-stage" });
      b.style.cssText = "display:flex; flex-direction:column; gap:4px; text-align:left; padding:14px 15px; border-radius:11px; cursor:pointer; transition:all .14s ease; font-family:inherit;";
      b.innerHTML =
        '<span class="mono" style="font-size:10.5px; letter-spacing:.08em; opacity:.75;">' + G.esc(s.tool) + '</span>' +
        '<span style="font-family:var(--font-display); font-weight:600; font-size:17px; line-height:1.15;">' + G.esc(s.label) + '</span>' +
        '<span style="font-size:11.5px; opacity:.85; line-height:1.35;">' + G.esc(s.sub) + '</span>';
      b.addEventListener("click", function () { i = idx; paint(); });
      row.appendChild(b);
    });

    var stageBtns = G.qsa(".pl-stage", mount);
    var elTitle = G.qs(".js-title", mount), elCount = G.qs(".js-count", mount),
        elCode = G.qs(".js-code", mount), elNote = G.qs(".js-note", mount),
        btnPrev = G.qs(".js-prev", mount), btnNext = G.qs(".js-next", mount);

    G.qs(".js-reset", mount).addEventListener("click", function () { i = 0; paint(); });
    btnPrev.addEventListener("click", function () { if (i > 0) { i--; paint(); } });
    btnNext.addEventListener("click", function () { if (i < stages.length - 1) { i++; paint(); } });

    function paint() {
      stageBtns.forEach(function (b, idx) {
        if (idx === i) b.style.cssText += ";background:var(--color-primary); border:1px solid var(--color-primary); color:#fff; box-shadow:var(--shadow-md);";
        else if (idx < i) b.style.cssText = base(b) + "background:var(--color-bg-lit); border:1px solid var(--color-primary); color:var(--color-fg-default);";
        else b.style.cssText = base(b) + "background:var(--color-bg-muted); border:1px solid var(--color-border-default); color:var(--color-fg-faint);";
      });
      // reafirma el activo (después de reescribir cssText en el bucle)
      stageBtns[i].style.cssText = base(stageBtns[i]) + "background:var(--color-primary); border:1px solid var(--color-primary); color:#fff; box-shadow:var(--shadow-md);";
      var s = stages[i];
      elTitle.textContent = s.title;
      elCount.textContent = "etapa " + (i + 1) + " / " + stages.length;
      elCode.innerHTML = s.code;
      elNote.innerHTML = s.note;
      btnPrev.disabled = i === 0;
      btnNext.disabled = i === stages.length - 1;
    }

    // estilo base de una tarjeta de etapa (sin el estado de color)
    function base() {
      return "display:flex; flex-direction:column; gap:4px; text-align:left; padding:14px 15px; border-radius:11px; cursor:pointer; transition:all .14s ease; font-family:inherit;";
    }

    paint();
  };

})(window.GUIA = window.GUIA || {});
