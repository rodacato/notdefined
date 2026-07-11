/* ============================================================================
   page-busqueda.js — Módulo 01 · Búsqueda en un arreglo. Pestañas: lineal /
   binaria. Cada simulación: lógica pura → frames inmutables; el motor de
   línea de tiempo (components.js) sólo mueve el cursor.
   Contenido (títulos, intros, escenarios, complejidad) vive en data/sims-busqueda.js.
   Registra GUIA.pages["modulo-01"].
   ========================================================================== */
(function (G) {
  "use strict";
  var h = G.h;

  /* =====================================================================
     BÚSQUEDA LINEAL — mecánica
     ===================================================================== */
  function genArrayLineal(seed, len) {
    var r = G.mulberry32(seed), a = [], used = {};
    while (a.length < len) {
      var v = 2 + Math.floor(r() * 96);
      if (!used[v]) { used[v] = true; a.push(v); }
    }
    return a;
  }
  function absentValue(arr, seed) {
    var r = G.mulberry32(seed * 7 + 1), v;
    do { v = 2 + Math.floor(r() * 96); } while (arr.indexOf(v) >= 0);
    return v;
  }
  function framesLineal(arr, target) {
    var N = arr.length, frames = [], comps = 0, found = -1;
    frames.push({
      states: arr.map(function () { return "neutral"; }), pointer: -1, comps: 0, kind: "init",
      note: "Arreglo de " + N + " elementos, sin ning\u00fan orden. Empezamos por la izquierda y avanzamos una casilla a la vez.",
    });
    for (var i = 0; i < N; i++) {
      comps++;
      var match = arr[i] === target;
      frames.push({
        states: arr.map(function (v, j) { return j < i ? "out" : j === i ? "active" : "neutral"; }),
        pointer: i, comps: comps, kind: "compare", match: match,
        note: "Posici\u00f3n " + i + ": comparamos el valor " + arr[i] + " contra el objetivo " + target + ". " +
          (match ? "Coinciden." : "No coinciden, la descartamos y seguimos."),
      });
      if (match) {
        found = i;
        frames.push({
          states: arr.map(function (v, j) { return j < i ? "out" : j === i ? "done" : "neutral"; }),
          pointer: i, comps: comps, kind: "found",
          note: "Encontrado en la posici\u00f3n " + i + " tras " + comps + " comparaci\u00f3n" + (comps > 1 ? "es" : "") +
            ". El n\u00famero de comparaciones es exactamente la posici\u00f3n + 1.",
        });
        break;
      }
    }
    if (found < 0) {
      frames.push({
        states: arr.map(function () { return "out"; }), pointer: N - 1, comps: comps, kind: "notfound",
        note: "Recorrimos las " + N + " posiciones sin coincidencia: el objetivo no est\u00e1. Este es el peor caso de O(n): " +
          comps + " comparaciones, una por elemento.",
      });
    }
    return { frames: frames, found: found };
  }

  function renderLineal(mountEl) {
    var C = G.DATA.sims.lineal, sc = C.scenario;
    var st = { seed: sc.seed, arr: genArrayLineal(sc.seed, sc.len), target: 0, showCx: false };
    st.target = st.arr[st.arr.length - 2]; // presente, casi al final

    // --- DOM ---
    var objTag = h("span.tag-mono.obj-tag");
    var statusEl = h("span.mono.stage-status");
    var trackHost = h("div.well.notebook-lines.track-host");
    var noteEl = h("p.narr-note");
    var statsHost = G.statRow();
    var chipHost = h("div.chip-row");
    var targetInput = h("input.num-input", { type: "number", value: st.target });
    var cxPanel = h("div.well.cx-panel", { style: { display: "none" } });

    targetInput.addEventListener("change", function () {
      setTarget(parseInt(targetInput.value || "0", 10));
    });

    var timeline = G.createTimeline({
      unit: "paso",
      onFrame: function (frame) {
        G.mount(trackHost, G.arrayTrack({ values: st.arr, states: frame.states, pointer: frame.pointer }));
        var s = frame.kind === "found" ? { t: "Encontrado en la posici\u00f3n " + frame.pointer, c: "var(--st-done)" }
          : frame.kind === "notfound" ? { t: "No est\u00e1 en el arreglo", c: "var(--st-out)" }
          : frame.kind === "compare" ? { t: "Revisando posici\u00f3n " + frame.pointer + "\u2026", c: "var(--st-active)" }
          : { t: "Listo para empezar", c: "var(--color-fg-subtle)" };
        statusEl.textContent = s.t; statusEl.style.color = s.c;
        noteEl.textContent = frame.note;
        G.clear(statsHost);
        statsHost.appendChild(G.stat("comparaciones", G.fmt(frame.comps), "var(--st-active)"));
        statsHost.appendChild(G.stat("longitud n", st.arr.length));
        statsHost.appendChild(G.stat("posici\u00f3n actual", frame.pointer < 0 ? "\u2014" : frame.pointer));
        statsHost.appendChild(h("span", { style: { flex: "1" } }));
        statsHost.appendChild(G.stat("peor caso", st.arr.length + " comp.", "var(--st-out)"));
      },
    });

    function syncInputs() {
      objTag.textContent = "\u25CE objetivo " + st.target;
      targetInput.value = st.target;
      var present = uniq([st.arr[0], st.arr[Math.floor(st.arr.length / 2)], st.arr[st.arr.length - 1]]);
      G.clear(chipHost);
      present.forEach(function (v) {
        chipHost.appendChild(h("button.pill", { type: "button",
          "aria-pressed": st.target === v ? "true" : "false",
          onClick: function () { setTarget(v); } }, h("span.mono", { style: { fontSize: "12px" } }, String(v))));
      });
    }
    function reload() { var r = framesLineal(st.arr, st.target); timeline.load(r.frames); syncInputs(); }
    function setTarget(v) { st.target = v; reload(); }
    function regen() { st.seed += 1; st.arr = genArrayLineal(st.seed, sc.len);
      if (st.arr.indexOf(st.target) < 0) st.target = st.arr[Math.floor(st.arr.length / 2)]; reload(); }
    function worstEnd() { st.target = st.arr[st.arr.length - 1]; reload(); }
    function worstAbsent() { st.target = absentValue(st.arr, st.seed); reload(); }

    var view = h("div.sim",
      h("h1.display.sim-title", C.title),
      h("p.sim-intro", { html: C.intro }),
      // definir input
      h("section.card.input-card",
        h("label.input-label",
          h("span.eyebrow", { style: { fontSize: "10px", whiteSpace: "nowrap" } }, "Objetivo \u25CE"),
          targetInput),
        chipHost,
        h("span", { style: { flex: "1" } }),
        h("div.chip-row",
          h("button.pill", { type: "button", onClick: worstEnd }, "peor caso: al final"),
          h("button.pill", { type: "button", onClick: worstAbsent }, "peor caso: ausente"),
          h("button.pill", { type: "button", onClick: regen }, "\u21bb regenerar arreglo"))),
      // stage
      h("section.card.stage-card",
        h("div.stage-head",
          h("span.stage-head-l",
            h("span.tag-mono.obj-pill", objTag),
            statusEl),
          G.stateLegend(["neutral", "active", "out", "done"])),
        trackHost),
      // controles
      h("section.card.ctrl-card", timeline.node),
      // narración
      h("section.card.narr-card",
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost,
        h("div.narr-toggles",
          (function () {
            var b = G.togglePill({ pressed: st.showCx, icon: "\u03a3", label: "Ver complejidad",
              onClick: function () {
                st.showCx = !st.showCx;
                b.setAttribute("aria-pressed", st.showCx ? "true" : "false");
                cxPanel.style.display = st.showCx ? "" : "none";
              } });
            return b;
          })()),
        cxPanel));

    cxPanel.innerHTML = C.cx;
    reload();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };

    function uniq(a) { var seen = {}, out = []; a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }
  }

  /* =====================================================================
     BÚSQUEDA BINARIA — mecánica (lo/hi/mid enteros) + predecir-antes-de-revelar
     ===================================================================== */
  function genSorted(seed, len) {
    var r = G.mulberry32(seed), v = 1 + Math.floor(r() * 6), a = [];
    for (var i = 0; i < len; i++) { a.push(v); v += 2 + Math.floor(r() * 7); }
    return a;
  }
  function shuffle(arr, seed) {
    var r = G.mulberry32(seed * 13 + 5), a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function framesBinaria(arr, target) {
    var N = arr.length, frames = [], steps = 0, found = -1, lo = 0, hi = N - 1;
    function baseMarkers() { var m = {}; m[lo] = "lo"; m[hi] = m[hi] ? "lo\u00b7hi" : "hi"; return m; }
    frames.push({
      states: arr.map(function () { return "neutral"; }), markers: baseMarkers(), lo: lo, hi: hi, mid: -1, steps: 0, kind: "init",
      note: "Arreglo ordenado de " + N + " elementos. El rango activo va de lo=" + lo + " a hi=" + hi +
        ". La idea: mirar el medio y tirar la mitad que no puede contener al objetivo.",
    });
    while (lo <= hi) {
      var mid = Math.floor((lo + hi) / 2);
      steps++;
      var cmp = Math.sign(target - arr[mid]);
      var markers = {}; markers[lo] = "lo"; if (hi !== lo) markers[hi] = "hi";
      markers[mid] = mid === lo && mid === hi ? "mid" : mid === lo ? "lo\u00b7mid" : mid === hi ? "mid\u00b7hi" : "mid";
      (function (lo, hi, mid, cmp, steps) {
        frames.push({
          states: arr.map(function (v, j) { return j < lo || j > hi ? "out" : j === mid ? "active" : "neutral"; }),
          markers: markers, lo: lo, hi: hi, mid: mid, cmp: cmp, steps: steps, kind: "probe",
          note: "Paso " + steps + ": el rango va de " + lo + " a " + hi + ". Miramos el medio: posici\u00f3n " + mid + ", valor " + arr[mid] + ".",
        });
      })(lo, hi, mid, cmp, steps);
      if (cmp === 0) {
        found = mid;
        (function (lo, hi, mid, steps) {
          var m = {}; m[mid] = "mid";
          frames.push({
            states: arr.map(function (v, j) { return j === mid ? "done" : j < lo || j > hi ? "out" : "neutral"; }),
            markers: m, lo: lo, hi: hi, mid: mid, steps: steps, kind: "found",
            note: "arr[" + mid + "] = " + target + ". Encontrado en " + steps + " paso" + (steps > 1 ? "s" : "") +
              ". Cada paso descart\u00f3 la mitad del rango: por eso son tan pocos.",
          });
        })(lo, hi, mid, steps);
        break;
      }
      if (cmp > 0) {
        var nLo = mid + 1;
        (function (lo, hi, mid, nLo, steps) {
          var m = {}; m[nLo] = "lo"; if (hi !== nLo) m[hi] = "hi";
          frames.push({
            states: arr.map(function (v, j) { return j < nLo || j > hi ? "out" : "neutral"; }),
            markers: m, lo: nLo, hi: hi, mid: -1, steps: steps, kind: "narrow",
            note: arr[mid] + " < " + target + ": el objetivo, si est\u00e1, queda a la derecha. Descartamos las posiciones " +
              lo + "\u2013" + mid + " y seguimos con " + nLo + "\u2013" + hi + ".",
          });
        })(lo, hi, mid, nLo, steps);
        lo = nLo;
      } else {
        var nHi = mid - 1;
        (function (lo, hi, mid, nHi, steps) {
          var m = {}; m[lo] = "lo"; if (nHi !== lo && nHi >= 0) m[nHi] = "hi";
          frames.push({
            states: arr.map(function (v, j) { return j < lo || j > nHi ? "out" : "neutral"; }),
            markers: m, lo: lo, hi: nHi, mid: -1, steps: steps, kind: "narrow",
            note: arr[mid] + " > " + target + ": el objetivo queda a la izquierda. Descartamos las posiciones " +
              mid + "\u2013" + hi + " y seguimos con " + lo + "\u2013" + nHi + ".",
          });
        })(lo, hi, mid, nHi, steps);
        hi = nHi;
      }
    }
    if (found < 0) {
      var actual = arr.indexOf(target);
      frames.push({
        states: arr.map(function () { return "out"; }), markers: {}, lo: lo, hi: hi, mid: -1, steps: steps, kind: "notfound", actual: actual,
        note: actual >= 0
          ? "El rango se cerr\u00f3 y binary search dijo \u201cno est\u00e1\u201d \u2014 pero el valor S\u00cd est\u00e1, en la posici\u00f3n " + actual +
            ". Descart\u00f3 la mitad equivocada porque el arreglo no estaba ordenado."
          : "El rango se cerr\u00f3 sin coincidencia: el objetivo no est\u00e1 en el arreglo. " + steps + " pasos, O(log n).",
      });
    }
    return { frames: frames, found: found };
  }

  function renderBinaria(mountEl) {
    var C = G.DATA.sims.binaria, sc = C.scenario;
    var st = {
      seed: sc.seed, sorted: true, target: 0, showCx: false,
      practice: true, decided: {}, asking: false, feedback: null,
    };
    st.arr = genSorted(st.seed, sc.len);
    st.target = st.arr[st.arr.length - 3];

    var objTag = h("span.tag-mono.obj-tag");
    var statusEl = h("span.mono.stage-status");
    var trackHost = h("div.well.notebook-lines.track-host");
    var askHost = h("div.ask-host");
    var warnHost = h("div.warn-host");
    var fbHost = h("div.fb-host");
    var noteEl = h("p.narr-note");
    var statsHost = G.statRow();
    var chipHost = h("div.chip-row");
    var targetInput = h("input.num-input", { type: "number", value: st.target });
    var cxPanel = h("div.well.cx-panel", { style: { display: "none" } });
    var practiceBtn, sortedBtn, hintEl = h("p.faint.ask-hint", { style: { display: "none" } },
      "Responde la predicci\u00f3n para continuar \u2014 o arrastra la l\u00ednea de tiempo para revelar sin predecir.");

    targetInput.addEventListener("change", function () { setTarget(parseInt(targetInput.value || "0", 10)); });

    function needAsk(i) {
      var fr = timeline.frame();
      return st.sorted && st.practice && fr && fr.kind === "probe" && !st.decided[i];
    }

    var timeline = G.createTimeline({
      unit: "paso",
      canAdvance: function (i) { return !needAsk(i); },
      onBlocked: function (i) { showAsk(i); },
      onFrame: function (frame, i) {
        hideAsk();
        G.mount(trackHost, G.arrayTrack({ values: st.arr, states: frame.states, markers: frame.markers, pointer: -1 }));
        var s = frame.kind === "found" ? { t: "Encontrado en la posici\u00f3n " + frame.mid, c: "var(--st-done)" }
          : frame.kind === "notfound" ? { t: st.sorted ? "No est\u00e1 en el arreglo" : "Fall\u00f3: precondici\u00f3n rota", c: "var(--st-out)" }
          : frame.kind === "probe" ? { t: "Evaluando el medio (pos " + frame.mid + ")\u2026", c: "var(--st-active)" }
          : { t: "Rango " + frame.lo + "\u2013" + frame.hi, c: "var(--color-fg-subtle)" };
        statusEl.textContent = s.t; statusEl.style.color = s.c;
        noteEl.textContent = frame.note;
        G.clear(statsHost);
        statsHost.appendChild(G.stat("pasos", G.fmt(frame.steps), "var(--st-active)"));
        statsHost.appendChild(G.stat("lo", frame.lo, "var(--st-cand)"));
        statsHost.appendChild(G.stat("hi", frame.hi, "var(--st-cand)"));
        statsHost.appendChild(G.stat("mid", frame.mid < 0 ? "\u2014" : frame.mid, "var(--st-active)"));
        statsHost.appendChild(h("span", { style: { flex: "1" } }));
        statsHost.appendChild(G.stat("rango activo", Math.max(0, frame.hi - frame.lo + 1) + " / " + st.arr.length));
      },
    });

    function showAsk(i) {
      st.asking = true;
      timeline.setDisabled(true);
      hintEl.style.display = "";
      var fr = timeline.frame();
      var panel = h("div.well.ask-panel",
        h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
        h("p.ask-q", ["El medio es ", h("b.mono", String(st.arr[fr.mid])), " y el objetivo es ", h("b.mono", String(st.target)),
          ". \u00bfDe qu\u00e9 lado de ", h("span.mono", "mid"), " quedar\u00eda el objetivo?"]),
        h("div.ask-btns",
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("left", i); } }, "\u2190 izquierda (menor)"),
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("here", i); } }, "= aqu\u00ed (igual)"),
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("right", i); } }, "derecha (mayor) \u2192")));
      G.mount(askHost, panel);
    }
    function hideAsk() { st.asking = false; timeline.setDisabled(false); hintEl.style.display = "none"; G.clear(askHost); }
    function answer(choice, i) {
      var fr = timeline.frame();
      var correctAns = fr.cmp < 0 ? "left" : fr.cmp > 0 ? "right" : "here";
      st.feedback = { choice: choice, correctAns: correctAns, correct: choice === correctAns, val: st.arr[fr.mid] };
      st.decided[i] = true;
      renderFeedback();
      hideAsk();
      timeline.next(true);
    }
    function renderFeedback() {
      G.clear(fbHost);
      if (!st.feedback) return;
      var f = st.feedback;
      var body = f.correct
        ? ["Correcto. Como ", h("span.mono", String(f.val)), " " +
            (f.correctAns === "here" ? "es el objetivo" : f.correctAns === "left" ? "es mayor que el objetivo, este queda a la izquierda" : "es menor que el objetivo, este queda a la derecha") +
            ", descartamos esa mitad."]
        : ["Casi. El medio era ", h("span.mono", String(f.val)), "; el objetivo " +
            (f.correctAns === "here" ? "era exactamente ese valor" : f.correctAns === "left" ? "es menor, as\u00ed que iba a la izquierda" : "es mayor, as\u00ed que iba a la derecha") + "."];
      fbHost.appendChild(h("div.card.fb-card" + (f.correct ? ".fb-ok" : ".fb-warn"),
        h("span.fb-glyph", f.correct ? "\u2713" : "\u25C6"),
        h("p.fb-text", body)));
    }

    function syncInputs() {
      objTag.textContent = "\u25CE objetivo " + st.target;
      targetInput.value = st.target;
      var present = uniq([st.arr[1], st.arr[Math.floor(st.arr.length / 2)], st.arr[st.arr.length - 2]]);
      G.clear(chipHost);
      present.forEach(function (v) {
        chipHost.appendChild(h("button.pill", { type: "button",
          "aria-pressed": st.target === v ? "true" : "false",
          onClick: function () { setTarget(v); } }, h("span.mono", { style: { fontSize: "12px" } }, String(v))));
      });
      if (practiceBtn) { practiceBtn.setAttribute("aria-pressed", st.practice ? "true" : "false"); practiceBtn.disabled = !st.sorted; }
      if (sortedBtn) {
        sortedBtn.setAttribute("aria-pressed", !st.sorted ? "true" : "false");
        sortedBtn.textContent = st.sorted ? "\u00bfy si no est\u00e1 ordenado?" : "\u21ba volver a ordenar";
        sortedBtn.classList.toggle("danger-pill", !st.sorted);
      }
      // aviso de precondición rota
      G.clear(warnHost);
      if (!st.sorted) {
        warnHost.appendChild(h("div.card.warn-card",
          h("span.warn-glyph", "\u2715"),
          h("p.warn-text", { html: "Precondici\u00f3n rota: este arreglo <b>no est\u00e1 ordenado</b>. Binary search descarta mitades confiando en el orden; aqu\u00ed va a tirar mitades que s\u00ed conten\u00edan al objetivo. M\u00edralo fallar, luego vuelve a ordenar." })));
      }
    }
    function reload() {
      st.decided = {}; st.feedback = null; renderFeedback();
      var r = framesBinaria(st.arr, st.target); timeline.load(r.frames); syncInputs();
    }
    function setTarget(v) { st.target = v; reload(); }
    function togglePractice() { st.practice = !st.practice; hideAsk(); syncInputs(); }
    function toggleSorted() {
      st.sorted = !st.sorted;
      var sortedArr = genSorted(st.seed, sc.len);
      st.arr = st.sorted ? sortedArr : shuffle(sortedArr, st.seed);
      if (st.arr.indexOf(st.target) < 0) st.target = st.arr[Math.floor(st.arr.length / 2)];
      reload();
    }
    function regen() {
      st.seed += 1;
      var sortedArr = genSorted(st.seed, sc.len);
      st.arr = st.sorted ? sortedArr : shuffle(sortedArr, st.seed);
      st.target = st.arr[Math.floor(st.arr.length / 2)];
      reload();
    }

    practiceBtn = G.togglePill({ pressed: st.practice, icon: "\u25CE", label: "modo pr\u00e1ctica", onClick: togglePractice, disabled: !st.sorted });
    sortedBtn = h("button.pill", { type: "button", onClick: toggleSorted });
    var regenBtn = h("button.pill", { type: "button", onClick: regen }, "\u21bb regenerar");

    var cxToggle = G.togglePill({ pressed: st.showCx, icon: "\u03a3", label: "Ver complejidad",
      onClick: function () {
        st.showCx = !st.showCx;
        cxToggle.setAttribute("aria-pressed", st.showCx ? "true" : "false");
        cxPanel.style.display = st.showCx ? "" : "none";
      } });

    // tabla de complejidad
    (function buildCx() {
      var tbl = h("table.cx",
        h("thead", h("tr", h("th", "tama\u00f1o n"), h("th", { style: { textAlign: "right" } }, "pasos (m\u00e1x)"), h("th", "lineal comparar\u00eda"))));
      var tb = h("tbody");
      C.cxRows.forEach(function (n) {
        tb.appendChild(h("tr",
          h("td.mono", G.fmt(n)),
          h("td.num", String(Math.ceil(Math.log2(n + 1)))),
          h("td.mono.subtle", G.fmt(n))));
      });
      tbl.appendChild(tb);
      cxPanel.appendChild(h("p.cx-intro", { html: C.cxIntro }));
      cxPanel.appendChild(tbl);
    })();

    var view = h("div.sim",
      h("h1.display.sim-title", C.title),
      h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        h("label.input-label",
          h("span.eyebrow", { style: { fontSize: "10px", whiteSpace: "nowrap" } }, "Objetivo \u25CE"),
          targetInput),
        chipHost,
        h("span", { style: { flex: "1" } }),
        h("div.chip-row", practiceBtn, sortedBtn, regenBtn)),
      warnHost,
      h("section.card.stage-card",
        h("div.stage-head",
          h("span.stage-head-l", h("span.tag-mono.obj-pill", objTag), statusEl),
          G.stateLegend(["neutral", "cand", "active", "out", "done"])),
        trackHost, askHost),
      h("section.card.ctrl-card", timeline.node, hintEl),
      h("section.card.narr-card",
        fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost,
        h("div.narr-toggles", cxToggle), cxPanel));

    reload();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };

    function uniq(a) { var seen = {}, out = []; a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }
  }

  /* =====================================================================
     Shell del módulo con pestañas
     ===================================================================== */
  var SIMS = {
    lineal: renderLineal,
    binaria: renderBinaria,
  };

  function page(root, sub) {
    document.title = "M\u00f3dulo 01 \u2014 B\u00fasqueda lineal y binaria";
    var current = { destroy: function () {} };
    var host = h("div.sim-host");

    var tabs = G.lessonTabs(
      [{ id: "lineal", n: "1", label: "B\u00fasqueda lineal" }, { id: "binaria", n: "2", label: "B\u00fasqueda binaria" }],
      function (id) { switchTo(id); },
      SIMS[sub] ? sub : "lineal");

    function switchTo(id) {
      current.destroy();
      current = SIMS[id](host) || { destroy: function () {} };
    }

    var wrap = h("div.wrap.app-root",
      G.siteHome(),
      G.moduleHeader({ current: "01", eyebrow: "M\u00f3dulo 01 \u00b7 B\u00fasqueda en un arreglo" }),
      tabs.node,
      host,
      h("footer.kbd-hint", h("span.faint", "\u2190 \u2192 paso \u00b7 espacio reproduce/pausa \u00b7 arrastra la l\u00ednea de tiempo para escudri\u00f1ar cualquier frame")),
      G.siteFooter());

    G.mount(root, wrap);
    switchTo(tabs.current());
    return function () { current.destroy(); };
  }

  G.pages = G.pages || {};
  G.pages["modulo-01"] = page;

})(window.GUIA = window.GUIA || {});
