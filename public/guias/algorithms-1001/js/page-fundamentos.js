/* ============================================================================
   page-fundamentos.js — Módulo 00 · Big O: la intuición del crecimiento.
   El "algoritmo" es el modelo de crecimiento: recorrer n de 1→100 es la
   reproducción; cada n es un frame. Los controles sólo mueven el cursor.
   Contenido (textos, complejidades, pseudocódigo) en data/sims-fundamentos.js.
   Registra GUIA.pages["modulo-00"].
   ========================================================================== */
(function (G) {
  "use strict";
  var h = G.h, s = G.s;

  /* --- Fórmulas de crecimiento (mecánica; el resto del contenido en data/sims-fundamentos.js) --- */
  var FN = {
    one:   function (n) { return 1; },
    log:   function (n) { return n <= 1 ? 0 : Math.log2(n); },
    lin:   function (n) { return n; },
    nlogn: function (n) { return n <= 1 ? n : n * Math.log2(n); },
    quad:  function (n) { return n * n; },
  };

  function page(root) {
    var C = G.DATA.sims.bigO;
    document.title = "M\u00f3dulo 00 \u2014 Big O";
    var COMPS = C.complexities;
    var N_MAX = C.nMax, Y_MAX = C.yMax, BOX_CAP = C.boxCap;

    // --- frames precomputados ---
    function opsAt(n) { var o = {}; COMPS.forEach(function (c) { o[c.key] = Math.max(0, Math.round(FN[c.key](n))); }); return o; }
    function noteAt(n) {
      var o = opsAt(n);
      if (n <= 3) return "Con n tan chico, todas las complejidades hacen un trabajo parecido. La diferencia todav\u00eda no se nota: por eso medimos crecimiento, no casos peque\u00f1os.";
      if (n <= 11) return "En n=" + n + ", O(n\u00b2) ya hace " + G.fmt(o.quad) + " operaciones y empieza a salirse del recuadro, mientras O(log n) lleva apenas " + G.fmt(o.log) + ". Las curvas comienzan a separarse.";
      if (n <= 30) return "O(n\u00b2) hace rato dej\u00f3 el plano y ahora O(n log n) (" + G.fmt(o.nlogn) + ") tambi\u00e9n se despega. O(n) sube en l\u00ednea recta; O(log n) y O(1) siguen pegadas al piso.";
      if (n <= 70) return "En n=" + n + ", al duplicar la entrada el trabajo de O(n\u00b2) se cuadruplica: " + G.fmt(o.quad) + " operaciones. La distancia entre las curvas ya es abismal.";
      return "En n=" + n + ": O(n\u00b2)=" + G.fmt(o.quad) + " operaciones contra " + G.fmt(o.log) + " de O(log n). Misma tarea, mundos distintos. Eso es lo que mide Big O: c\u00f3mo escala, no cu\u00e1nto tarda hoy.";
    }
    function milestoneAt(n) {
      if (n >= 100) return "Final: O(n\u00b2) lleg\u00f3 a 10\u00a0000 operaciones; O(log n), a 7. Dobla n y vuelve a mirar la diferencia.";
      if (n >= 50) return "n=50 \u2014 la brecha es enorme. O(n\u00b2) cuadruplica su trabajo cada vez que n se duplica.";
      if (n >= 25) return "n=25 \u2014 O(n log n) tambi\u00e9n abandona el plano por arriba. S\u00f3lo O(n), O(log n) y O(1) quedan a la vista.";
      if (n >= 11) return "n\u224810 \u2014 O(n\u00b2) toca las 100 operaciones y se sale por el techo. Las dem\u00e1s casi no se movieron.";
      if (n >= 4) return "Subiendo n\u2026 mant\u00e9n la vista en O(n\u00b2) (rojo): es la primera en dispararse.";
      return "Arrancamos en n peque\u00f1o: todas las curvas salen casi juntas desde abajo.";
    }
    var FRAMES = [];
    for (var nn = C.nMin; nn <= N_MAX; nn++) FRAMES.push({ n: nn, ops: opsAt(nn), note: noteAt(nn), milestone: milestoneAt(nn) });

    // --- geometría del plano ---
    var PW = 580, PH = 420, ML = 52, MR = 108, MT = 18, MB = 44;
    var X0 = ML, X1 = PW - MR, Y0 = PH - MB, Y1 = MT;
    function sx(n) { return X0 + (n / N_MAX) * (X1 - X0); }
    function sy(o) { return Y0 - (Math.min(o, Y_MAX) / Y_MAX) * (Y0 - Y1); }
    function buildPath(fn) {
      var d = "", exit = null, started = false;
      for (var n = 0; n <= N_MAX; n += 0.5) {
        var o = fn(n), px = sx(n);
        if (o > Y_MAX) { d += (started ? "L" : "M") + px.toFixed(1) + "," + Y1.toFixed(1); exit = { x: px }; break; }
        d += (started ? "L" : "M") + px.toFixed(1) + "," + sy(o).toFixed(1); started = true;
      }
      return { d: d, exit: exit };
    }
    var PATHS = COMPS.map(function (c) { var p = buildPath(FN[c.key]); return { c: c, d: p.d, exit: p.exit }; });

    // --- estado de UI ---
    var st = { predicting: true, prediction: null, highlight: null, solved: false,
      fbDismissed: false, showCx: false, showPseudo: false, pseudoWhich: "quad" };

    // --- hosts ---
    var plotHost = h("div.well.notebook-lines.bigo-plot");
    var boxHost = h("div.well.bigo-boxes");
    var legendHost = h("div.bigo-legend");
    var overlayHost = h("div.predict-overlay-host");
    var noteEl = h("p.narr-note");
    var statsHost = h("div.well.stat-row");
    var fbHost = h("div.fb-host");
    var solvedBadgeHost = h("span.solved-badge-host");
    var cxPanel = h("div", { style: { display: "none" } });
    var pseudoPanel = h("div", { style: { display: "none" } });
    var presetHost = h("div.chip-row");
    var solvedBtn;

    var stageCard = h("section.card.stage-card", { style: { position: "relative" } });

    // --- plano (rebuild por frame + highlight) ---
    function renderPlot(frame, reveal) {
      var n = frame.n, markerX = sx(n), hl = st.highlight;
      var svg = s("svg", { viewBox: "0 0 " + PW + " " + PH, width: "100%", role: "img",
        "aria-label": "Plano de crecimiento: operaciones contra tama\u00f1o n",
        style: { display: "block", maxHeight: "440px" } });
      var ticks = [0, 25, 50, 75, 100];
      ticks.forEach(function (t) {
        svg.appendChild(s("line", { x1: X0, x2: X1, y1: sy(t), y2: sy(t), stroke: "var(--color-border-default)", "stroke-width": "1",
          "stroke-dasharray": t === 0 ? "0" : "2 4", opacity: t === 0 ? 1 : 0.7 }));
        svg.appendChild(s("text", { x: X0 - 9, y: sy(t) + 4, "text-anchor": "end",
          "font-family": "var(--font-mono)", "font-size": "10.5", fill: "var(--color-fg-faint)" }, String(t)));
        svg.appendChild(s("line", { x1: sx(t), x2: sx(t), y1: Y0, y2: Y0 + 5, stroke: "var(--color-border-strong)", "stroke-width": "1" }));
        svg.appendChild(s("text", { x: sx(t), y: Y0 + 19, "text-anchor": "middle",
          "font-family": "var(--font-mono)", "font-size": "10.5", fill: "var(--color-fg-faint)" }, String(t)));
      });
      svg.appendChild(s("line", { x1: X0, x2: X0, y1: Y1 - 4, y2: Y0, stroke: "var(--color-fg-default)", "stroke-width": "1.4" }));
      svg.appendChild(s("line", { x1: X0, x2: X1 + 4, y1: Y0, y2: Y0, stroke: "var(--color-fg-default)", "stroke-width": "1.4" }));
      svg.appendChild(s("text", { x: X0 - 38, y: (Y0 + Y1) / 2, "text-anchor": "middle",
        transform: "rotate(-90 " + (X0 - 38) + " " + ((Y0 + Y1) / 2) + ")",
        "font-family": "var(--font-mono)", "font-size": "10.5", "letter-spacing": "0.14em", fill: "var(--color-fg-subtle)" }, "OPERACIONES \u2192"));
      svg.appendChild(s("text", { x: (X0 + X1) / 2, y: PH - 6, "text-anchor": "middle",
        "font-family": "var(--font-mono)", "font-size": "10.5", "letter-spacing": "0.14em", fill: "var(--color-fg-subtle)" }, "n \u2014 TAMA\u00d1O DE LA ENTRADA \u2192"));

      if (!reveal) { G.mount(plotHost, svg); return; }

      // marcador n
      svg.appendChild(s("line", { x1: markerX, x2: markerX, y1: Y1 - 2, y2: Y0, stroke: "var(--color-fg-default)", "stroke-width": "1", "stroke-dasharray": "3 3", opacity: "0.55" }));
      // curvas
      PATHS.forEach(function (p) {
        var dim = hl && hl !== p.c.key;
        svg.appendChild(s("path", { d: p.d, fill: "none", stroke: p.c.hex,
          "stroke-width": hl === p.c.key ? "3.4" : "2.2", "stroke-linecap": "round", "stroke-linejoin": "round",
          opacity: dim ? 0.16 : 1 }));
      });
      // etiquetas/exits
      PATHS.forEach(function (p) {
        var dim = hl && hl !== p.c.key;
        if (p.exit) {
          svg.appendChild(s("path", { d: "M" + p.exit.x + "," + (Y1 + 8) + " l-4,7 l8,0 z", fill: p.c.hex, opacity: dim ? 0.2 : 1 }));
          svg.appendChild(s("text", { x: p.exit.x + 8, y: Y1 + 12, "font-family": "var(--font-mono)", "font-size": "11", "font-weight": "600", fill: p.c.hex, opacity: dim ? 0.2 : 1 }, p.c.label));
        } else {
          var endY = sy(FN[p.c.key](N_MAX));
          svg.appendChild(s("text", { x: X1 + 8, y: endY + 4, "font-family": "var(--font-mono)", "font-size": "11", "font-weight": "600", fill: p.c.hex, opacity: dim ? 0.2 : 1 }, p.c.label));
        }
      });
      // puntos en n
      PATHS.forEach(function (p) {
        var o = FN[p.c.key](n), dim = hl && hl !== p.c.key, off = o > Y_MAX;
        var cy = off ? Y1 + 2 : sy(o);
        svg.appendChild(s("circle", { cx: markerX, cy: cy, r: hl === p.c.key ? "5" : "3.6",
          fill: "var(--color-bg-canvas)", stroke: p.c.hex, "stroke-width": "2", opacity: dim ? 0.18 : 1 }));
        if (off) svg.appendChild(s("text", { x: markerX + 7, y: Y1 + 6, "font-family": "var(--font-mono)", "font-size": "10", fill: p.c.hex, "font-weight": "600", opacity: dim ? 0.18 : 1 }, "\u2191"));
      });
      // etiqueta n
      svg.appendChild(s("rect", { x: markerX - 19, y: Y0 + 1, width: "38", height: "16", rx: "3", fill: "var(--color-fg-default)" }));
      svg.appendChild(s("text", { x: markerX, y: Y0 + 12.5, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "10.5", "font-weight": "600", fill: "var(--color-bg-canvas)" }, "n=" + n));
      G.mount(plotHost, svg);
    }

    // --- cajas de trabajo ---
    var NSEG = 16;
    function renderBoxes(frame) {
      var hl = st.highlight;
      var head = h("div.boxes-head",
        h("span.eyebrow", "Cajas de trabajo"),
        h("span.mono", { style: { fontSize: "12px", color: "var(--color-fg-subtle)" } }, "para n = " + frame.n));
      var desc = h("p.subtle", { style: { fontSize: "12.5px", margin: "0 0 14px", lineHeight: "1.4" } },
        "Cu\u00e1ntas operaciones apila cada complejidad con esta entrada. Conteos ilustrativos.");
      var cols = h("div.boxes-cols");
      COMPS.forEach(function (c) {
        var count = frame.ops[c.key];
        var frac = Math.min(count, BOX_CAP) / BOX_CAP;
        var overflow = count > BOX_CAP;
        var filled = Math.round(frac * NSEG); if (count > 0 && filled === 0) filled = 1;
        var dim = hl && hl !== c.key;
        var stack = h("div.box-stack");
        for (var i = 0; i < NSEG; i++) {
          var lit = i < filled;
          stack.appendChild(h("div.box-seg", { style: {
            background: lit ? c.hex : "transparent",
            border: lit ? "none" : "1px solid var(--color-border-default)",
            opacity: lit ? (overflow && i >= NSEG - 2 ? 0.55 : 0.92) : 0.6,
          } }));
        }
        var stackWrap = h("div.box-stack-wrap");
        if (overflow) stackWrap.appendChild(h("div.box-overflow", { style: { color: c.hex } }, "\u2191"));
        stackWrap.appendChild(stack);
        cols.appendChild(h("div.box-col", { style: { opacity: dim ? 0.4 : 1 } },
          h("div.box-label", h("span", { style: { color: c.hex, fontSize: "10px" } }, c.glyph), h("span.tag-mono", { style: { fontSize: "11.5px" } }, c.label)),
          stackWrap,
          h("div.box-count", h("div.mono.box-count-n", G.fmt(count)), h("div.mono.box-count-u", "OPS"))));
      });
      G.mount(boxHost, h("div", head, desc, cols));
    }

    // --- leyenda con highlight ---
    function renderLegend() {
      G.clear(legendHost);
      COMPS.forEach(function (c) {
        var on = st.highlight === c.key, dim = st.highlight && !on;
        legendHost.appendChild(h("button.pill", { type: "button", "aria-pressed": on ? "true" : "false",
          title: on ? "Mostrar todas" : "Resaltar esta curva",
          style: { opacity: dim ? 0.45 : 1, padding: "5px 11px", fontSize: "12.5px" },
          onClick: function () { st.highlight = on ? null : c.key; renderLegend(); rerender(); } },
          h("span", { style: { color: c.hex, fontSize: "11px" } }, c.glyph),
          h("span.tag-mono", { style: { fontSize: "12px" } }, c.label)));
      });
      if (st.highlight) legendHost.appendChild(h("button.pill", { type: "button", style: { padding: "5px 11px", fontSize: "12.5px" },
        onClick: function () { st.highlight = null; renderLegend(); rerender(); } }, "mostrar todas"));
    }

    // --- narración ---
    function renderNarr(frame) {
      // feedback banner
      G.clear(fbHost);
      if (!st.predicting && st.prediction && !st.fbDismissed) {
        var guess = COMPS.find(function (c) { return c.key === st.prediction; });
        var correct = st.prediction === C.fastestKey;
        var body = correct
          ? ["Tu apuesta fue ", h("b.tag-mono", guess.label), ", y es la que m\u00e1s crece. Al doblar n, su trabajo se cuadruplica: por eso O(n\u00b2) se dispara fuera del recuadro casi de inmediato."]
          : ["Apostaste por ", h("b.tag-mono", guess.label), ". La que m\u00e1s crece es ", h("b.tag-mono", { style: { color: "var(--st-out)" } }, "O(n\u00b2)"), ": al doblar n su trabajo se cuadruplica. Mu\u00e9vela t\u00fa mismo y compara c\u00f3mo deja atr\u00e1s a las dem\u00e1s."];
        fbHost.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"),
          h("span.fb-glyph", correct ? "\u2713" : "\u25C6"), h("p.fb-text", body),
          h("button.pill", { type: "button", style: { padding: "3px 10px", fontSize: "12px" },
            onClick: function () { st.fbDismissed = true; renderNarr(frame); } }, "entendido")));
      }
      // badge
      G.clear(solvedBadgeHost);
      if (st.solved) solvedBadgeHost.appendChild(h("span.tag-mono.solved-badge", "ejemplo resuelto"));
      // nota
      noteEl.textContent = st.predicting ? "Haz tu predicci\u00f3n arriba para revelar las curvas y empezar a recorrer n."
        : (st.solved ? frame.milestone : frame.note);
      // stats
      G.clear(statsHost);
      if (!st.predicting) {
        var o = frame.ops;
        var ratio = o.log > 0 ? Math.round(o.quad / o.log) : o.quad;
        statsHost.appendChild(G.stat("n", frame.n));
        statsHost.appendChild(G.stat("O(n\u00b2)", G.fmt(o.quad), "var(--st-out)"));
        statsHost.appendChild(G.stat("O(n log n)", G.fmt(o.nlogn), "var(--st-active)"));
        statsHost.appendChild(G.stat("O(n)", G.fmt(o.lin), "var(--st-cand)"));
        statsHost.appendChild(G.stat("O(log n)", G.fmt(o.log), "var(--st-path)"));
        statsHost.appendChild(h("span", { style: { flex: "1" } }));
        statsHost.appendChild(G.stat("raz\u00f3n n\u00b2 / log n", "\u00d7" + G.fmt(ratio)));
        statsHost.style.display = "";
      } else { statsHost.style.display = "none"; }
    }

    function rerender() {
      var frame = timeline.frame();
      renderPlot(frame, !st.predicting);
      renderBoxes(frame);
      renderNarr(frame);
    }

    // --- timeline ---
    var timeline = G.createTimeline({
      unit: "n",
      onFrame: function () { rerender(); },
    });

    // --- predict overlay ---
    function showOverlay() {
      var grid = h("div.predict-grid");
      COMPS.forEach(function (c) {
        grid.appendChild(h("button.ctrl.predict-opt", { type: "button",
          onClick: function () { doPredict(c.key); } },
          h("span", { style: { color: c.hex, fontSize: "13px" } }, c.glyph),
          h("span.tag-mono", { style: { fontSize: "13px" } }, c.label),
          h("span.subtle", { style: { fontSize: "11px", marginLeft: "auto" } }, c.name)));
      });
      G.mount(overlayHost, h("div.predict-overlay",
        h("div.card.predict-card",
          h("div.eyebrow", { style: { color: "var(--st-goal)" } }, "\u25CE Predice antes de revelar"),
          h("h3.display.predict-title", C.predict.title),
          h("p.subtle.predict-sub", C.predict.sub),
          grid)));
      ctrlCard.classList.add("is-locked");
    }
    function doPredict(key) {
      st.prediction = key; st.predicting = false; st.fbDismissed = false;
      G.clear(overlayHost);
      ctrlCard.classList.remove("is-locked");
      timeline.setDisabled(false);
      timeline.seek(0);
      rerender();
    }

    // --- toggles cx / pseudo ---
    function buildCxPanel() {
      var tbl = h("table.cx",
        h("thead", h("tr", h("th", "Notaci\u00f3n"), h("th", "Nombre"), h("th", "Ejemplo cotidiano"),
          h("th", { style: { textAlign: "right" } }, "n=10"), h("th", { style: { textAlign: "right" } }, "n=100"))));
      var tb = h("tbody");
      COMPS.forEach(function (c) {
        tb.appendChild(h("tr",
          h("td", h("span", { style: { color: c.hex, marginRight: "6px" } }, c.glyph), h("span.tag-mono", c.label)),
          h("td.subtle", c.name),
          h("td", { style: { maxWidth: "240px" } }, c.everyday),
          h("td.num", G.fmt(FN[c.key](10))),
          h("td.num", G.fmt(FN[c.key](100)))));
      });
      tbl.appendChild(tb);
      G.mount(cxPanel, h("div", h("div.well", { style: { overflow: "hidden", marginTop: "12px" } }, tbl),
        h("p.faint", { style: { fontSize: "11.5px", margin: "8px 2px 0" } }, C.cxNote)));
    }
    function buildPseudoPanel() {
      var picks = h("div.chip-row", { style: { marginBottom: "10px" } });
      var pre = h("pre.code");
      function show(k) { st.pseudoWhich = k; pre.innerHTML = C.pseudo[k];
        Array.prototype.forEach.call(picks.children, function (b) { b.setAttribute("aria-pressed", b.dataset.k === k ? "true" : "false"); }); }
      COMPS.forEach(function (c) {
        picks.appendChild(h("button.pill", { type: "button", dataset: { k: c.key }, "aria-pressed": st.pseudoWhich === c.key ? "true" : "false",
          style: { padding: "4px 10px", fontSize: "12px" }, onClick: function () { show(c.key); } },
          h("span", { style: { color: c.hex, fontSize: "10px" } }, c.glyph), h("span.tag-mono", { style: { fontSize: "11.5px" } }, c.label)));
      });
      G.mount(pseudoPanel, h("div", { style: { marginTop: "12px" } }, picks, h("div.well", { style: { padding: "14px 16px" } }, pre)));
      show(st.pseudoWhich);
    }

    // --- presets + solved ---
    [10, 25, 50, 100].forEach(function (q) {
      presetHost.appendChild(h("button.pill", { type: "button", style: { padding: "5px 12px" },
        onClick: function () { if (!st.predicting) timeline.seek(q - 1); } }, h("span.mono", { style: { fontSize: "12px" } }, String(q))));
    });
    solvedBtn = h("button.pill", { type: "button", onClick: function () {
      if (st.solved) { st.solved = false; timeline.reset(); }
      else { st.solved = true; st.highlight = null; renderLegend(); timeline.setSpeed(1); timeline.reset(); timeline.play(); }
      solvedBtn.setAttribute("aria-pressed", st.solved ? "true" : "false");
      solvedBtn.textContent = st.solved ? "Detener ejemplo" : "Mostrar ejemplo resuelto";
    } }, "Mostrar ejemplo resuelto");

    // --- ensamblado ---
    stageCard.appendChild(h("div.stage-head",
      h("span.eyebrow", "Carrera de curvas"), legendHost));
    stageCard.appendChild(h("div.bigo-grid", plotHost, boxHost));
    stageCard.appendChild(overlayHost);

    var cxToggle = G.togglePill({ pressed: false, icon: "\u03a3", label: "Ver complejidad", onClick: function () {
      st.showCx = !st.showCx; cxToggle.setAttribute("aria-pressed", st.showCx ? "true" : "false"); cxPanel.style.display = st.showCx ? "" : "none"; } });
    var pseudoToggle = G.togglePill({ pressed: false, icon: "</>", label: "Ver pseudoc\u00f3digo", onClick: function () {
      st.showPseudo = !st.showPseudo; pseudoToggle.setAttribute("aria-pressed", st.showPseudo ? "true" : "false"); pseudoPanel.style.display = st.showPseudo ? "" : "none"; } });

    var ctrlCard = h("section.card.ctrl-card",
      timeline.node,
      h("div.bigo-presets",
        h("span.eyebrow", { style: { fontSize: "10px" } }, "Definir la entrada \u00b7 saltar a n"),
        presetHost, h("span", { style: { flex: "1" } }), solvedBtn));

    var wrap = h("div.wrap.app-root",
      G.siteHome(),
      G.moduleHeader({ current: "00", eyebrow: C.eyebrow, title: C.title, intro: C.intro }),
      stageCard,
      ctrlCard,
      h("section.card.narr-card",
        fbHost,
        h("div.stage-head-l", { style: { marginBottom: "10px" } }, h("span.eyebrow", "Qu\u00e9 est\u00e1 pasando"), solvedBadgeHost),
        noteEl, statsHost,
        h("div.narr-toggles", cxToggle, pseudoToggle),
        cxPanel, pseudoPanel),
      h("footer.kbd-hint", h("span.faint", "\u2190 \u2192 paso \u00b7 espacio reproduce/pausa \u00b7 arrastra la l\u00ednea de tiempo para escudri\u00f1ar cualquier n")),
      G.siteFooter());

    buildCxPanel();
    buildPseudoPanel();
    renderLegend();
    timeline.load(FRAMES);
    timeline.setDisabled(true);   // bloqueado hasta predecir
    showOverlay();
    rerender();

    G.mount(root, wrap);
    return function () { timeline.destroy(); };
  }

  G.pages = G.pages || {};
  G.pages["modulo-00"] = page;

})(window.GUIA = window.GUIA || {});
