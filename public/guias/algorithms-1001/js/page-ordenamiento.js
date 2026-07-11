/* ============================================================================
   page-ordenamiento.js — Módulo 02 · Ordenamiento. Pestañas: selection / insertion /
   quicksort / merge. Barras con identidad estable (swaps animados), motor de
   frames de components.js. Contenido en data/sims-ordenamiento.js.
   Registra GUIA.pages["modulo-02"].
   ========================================================================== */
(function (G) {
  "use strict";
  var h = G.h;

  /* -------- valores reproducibles -------- */
  function genValues(seed, n, mode) {
    var r = G.mulberry32(seed), vals;
    if (mode === "sorted" || mode === "nearly" || mode === "reverse") {
      vals = []; for (var i = 0; i < n; i++) vals.push(8 + i * Math.floor(86 / n));
      if (mode === "reverse") vals.reverse();
      if (mode === "nearly") { var sw = Math.max(1, Math.floor(n / 4));
        for (var k = 0; k < sw; k++) { var a = Math.floor(r() * n), b = Math.min(n - 1, a + 1); var t = vals[a]; vals[a] = vals[b]; vals[b] = t; } }
    } else { var used = {}; vals = []; while (vals.length < n) { var v = 6 + Math.floor(r() * 92); if (!used[v]) { used[v] = 1; vals.push(v); } } }
    return vals.map(function (value, i) { return { id: "e" + i, value: value }; });
  }
  function maxOf(init) { return Math.max.apply(null, init.map(function (e) { return e.value; })); }
  function clone(arr) { return arr.map(function (e) { return { id: e.id, value: e.value }; }); }

  /* -------- helper: bloque toggle de complejidad -------- */
  function cxBlock(html) {
    var panel = h("div.well.cx-panel", { style: { display: "none" } }); panel.innerHTML = html;
    var open = false;
    var toggle = G.togglePill({ pressed: false, icon: "\u03a3", label: "Ver complejidad", onClick: function () {
      open = !open; toggle.setAttribute("aria-pressed", open ? "true" : "false"); panel.style.display = open ? "" : "none"; } });
    return { toggle: toggle, panel: panel };
  }

  /* ===================================================================== */
  /* SELECTION SORT                                                        */
  /* ===================================================================== */
  function framesSelection(init) {
    var arr = clone(init), n = arr.length, F = [], comps = 0, swaps = 0;
    function snap(states, markers, boundary, note) { F.push({ order: clone(arr), states: states.slice(), markers: Object.assign({}, markers), boundary: boundary, comps: comps, swaps: swaps, note: note }); }
    snap(arr.map(function () { return "neutral"; }), {}, 0, "La regi\u00f3n ordenada (verde, a la izquierda) empieza vac\u00eda. En cada pasada buscamos el m\u00ednimo de lo que falta y lo traemos al frente.");
    for (var i = 0; i < n - 1; i++) {
      var min = i;
      var st = arr.map(function (e, k) { return k < i ? "done" : "neutral"; }); st[min] = "active";
      var mk = {}; mk[i] = "inicio"; mk[min] = "m\u00edn";
      snap(st, mk, i, "Pasada " + (i + 1) + ": el m\u00ednimo provisional es " + arr[min].value + " (posici\u00f3n " + i + "). Lo compararemos contra todo lo que queda.");
      for (var j = i + 1; j < n; j++) {
        comps++;
        var less = arr[j].value < arr[min].value;
        var stc = arr.map(function (e, k) { return k < i ? "done" : "neutral"; }); stc[min] = "active"; stc[j] = "cand";
        var mk2 = {}; mk2[min] = "m\u00edn"; mk2[j] = "compara";
        snap(stc, mk2, i, "Comparamos " + arr[j].value + " contra el m\u00ednimo " + arr[min].value + ": " + (less ? "es menor, hay nuevo candidato." : "no es menor, seguimos."));
        if (less) { min = j; var st2 = arr.map(function (e, k) { return k < i ? "done" : "neutral"; }); st2[min] = "active"; var mk3 = {}; mk3[min] = "m\u00edn"; snap(st2, mk3, i, "Nuevo m\u00ednimo: " + arr[min].value + " en la posici\u00f3n " + min + "."); }
      }
      if (min !== i) { swaps++; var tmp = arr[i]; arr[i] = arr[min]; arr[min] = tmp; var st3 = arr.map(function (e, k) { return k <= i ? "done" : "neutral"; }); var mk4 = {}; mk4[i] = "fijado"; snap(st3, mk4, i + 1, "Intercambio: el m\u00ednimo " + arr[i].value + " viaja a la posici\u00f3n " + i + ". La regi\u00f3n ordenada ya mide " + (i + 1) + "."); }
      else { var st3b = arr.map(function (e, k) { return k <= i ? "done" : "neutral"; }); var mk5 = {}; mk5[i] = "fijado"; snap(st3b, mk5, i + 1, "El m\u00ednimo ya estaba en su sitio (" + arr[i].value + "); no hace falta intercambio. La regi\u00f3n ordenada mide " + (i + 1) + "."); }
    }
    snap(arr.map(function () { return "done"; }), {}, n, "Ordenado. Selection sort hizo " + comps + " comparaciones: siempre ~n\u00b2/2, sin importar el orden inicial \u2014 por eso es O(n\u00b2) en todos los casos.");
    return F;
  }

  function renderSelection(mountEl) {
    var C = G.DATA.sims.selection, sc = C.scenario;
    var stx = { seed: sc.seed };
    var bt = G.createBarTrack();
    var noteEl = h("p.narr-note"); var statsHost = h("div.well.stat-row");
    var cx = cxBlock(C.cx);
    var timeline = G.createTimeline({ onFrame: function (f) {
      bt.update(f, maxOf(init()));
      noteEl.textContent = f.note;
      G.clear(statsHost);
      statsHost.appendChild(G.stat("comparaciones", G.fmt(f.comps), "var(--st-cand)"));
      statsHost.appendChild(G.stat("intercambios", G.fmt(f.swaps), "var(--st-active)"));
      statsHost.appendChild(G.stat("regi\u00f3n ordenada", f.boundary + " / " + f.order.length, "var(--st-done)"));
      statsHost.appendChild(h("span", { style: { flex: "1" } }));
      statsHost.appendChild(G.stat("siempre", "O(n\u00b2)", "var(--st-out)"));
    } });
    var _init = genValues(stx.seed, sc.len, "random");
    function init() { return _init; }
    function load() { _init = genValues(stx.seed, sc.len, "random"); bt.reset(); timeline.load(framesSelection(_init)); }

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        G.stateLegend(["neutral", "active", "cand", "done"]),
        h("span", { style: { flex: "1" } }),
        h("button.pill", { type: "button", onClick: function () { stx.seed++; load(); } }, "\u21bb regenerar arreglo"),
        h("button.pill", { type: "button", onClick: function () { timeline.reset(); setTimeout(function () { timeline.play(); }, 60); } }, "\u25B6 ejemplo resuelto")),
      h("section.card.stage-card", h("div.well.notebook-lines.track-host", bt.node)),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card",
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost, h("div.narr-toggles", cx.toggle), cx.panel));
    load();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  /* INSERTION SORT                                                        */
  /* ===================================================================== */
  function framesInsertion(init) {
    var arr = clone(init), n = arr.length, F = [], comps = 0, shifts = 0;
    function snap(states, markers, boundary, note, extra) { F.push(Object.assign({ order: clone(arr), states: states.slice(), markers: Object.assign({}, markers), boundary: boundary, comps: comps, shifts: shifts, note: note }, extra || {})); }
    snap(arr.map(function (e, k) { return k === 0 ? "done" : "neutral"; }), {}, 1, "La regi\u00f3n ordenada empieza con la primera carta. Tomamos la siguiente y la deslizamos a la izquierda hasta su lugar.");
    for (var i = 1; i < n; i++) {
      var scount = 0, jj = i; while (jj > 0 && arr[jj - 1].value > arr[jj].value) { scount++; jj--; }
      var st = arr.map(function (e, k) { return k < i ? "done" : "neutral"; }); st[i] = "active";
      var mk = {}; mk[i] = "en mano";
      snap(st, mk, i, "Tomamos " + arr[i].value + " (posici\u00f3n " + i + "). La deslizamos a la izquierda mientras la vecina sea mayor.", { decision: true, answer: scount, keyVal: arr[i].value });
      var j = i;
      while (j > 0 && arr[j - 1].value > arr[j].value) {
        comps++;
        var stc = arr.map(function (e, k) { return k < i ? "done" : "neutral"; }); stc[j] = "active"; stc[j - 1] = "cand";
        var mk2 = {}; mk2[j] = "en mano"; mk2[j - 1] = "mayor";
        snap(stc, mk2, i, arr[j - 1].value + " es mayor que " + arr[j].value + ": se corre a la derecha y la carta sigue bajando.");
        var tmp = arr[j - 1]; arr[j - 1] = arr[j]; arr[j] = tmp; shifts++; j--;
      }
      if (j > 0) comps++;
      var stf = arr.map(function (e, k) { return k <= i ? "done" : "neutral"; });
      var mkf = {}; mkf[j] = j === i ? "queda" : "insertada";
      snap(stf, mkf, i + 1, j === i ? (arr[j].value + " ya era \u2265 que su vecina: se queda en su lugar. La regi\u00f3n ordenada mide " + (i + 1) + ".")
        : (arr[j].value + " encontr\u00f3 su lugar en la posici\u00f3n " + j + " tras retroceder " + (i - j) + ". La regi\u00f3n ordenada mide " + (i + 1) + "."));
    }
    snap(arr.map(function () { return "done"; }), {}, n, "Ordenado con " + comps + " comparaciones y " + shifts + " desplazamientos. El trabajo depende de qu\u00e9 tan desordenado ven\u00eda: ah\u00ed est\u00e1 la gracia de insertion sort.");
    return F;
  }

  function renderInsertion(mountEl) {
    var C = G.DATA.sims.insertion, sc = C.scenario;
    var stx = { seed: sc.seed, mode: "random", practice: true, decided: {} };
    var MODES = [{ id: "random", label: "aleatorio" }, { id: "nearly", label: "casi ordenado" }, { id: "reverse", label: "orden inverso" }];
    var PRED = ["0", "1", "2", "3", "4+"];
    var bt = G.createBarTrack();
    var askHost = h("div.ask-host"), fbHost = h("div.fb-host");
    var noteEl = h("p.narr-note"), statsHost = h("div.well.stat-row");
    var cx = cxBlock(C.cx);
    var _init = genValues(stx.seed, sc.len, stx.mode);
    function needAsk(i) { var f = timeline.frame(); return stx.practice && f && f.decision && !stx.decided[i]; }
    var timeline = G.createTimeline({
      canAdvance: function (i) { return !needAsk(i); },
      onBlocked: function (i) { showAsk(i); },
      onFrame: function (f) {
        G.clear(askHost);
        bt.update(f, maxOf(_init));
        noteEl.textContent = f.note;
        G.clear(statsHost);
        statsHost.appendChild(G.stat("comparaciones", G.fmt(f.comps), "var(--st-cand)"));
        statsHost.appendChild(G.stat("desplazamientos", G.fmt(f.shifts), "var(--st-active)"));
        statsHost.appendChild(G.stat("regi\u00f3n ordenada", f.boundary + " / " + f.order.length, "var(--st-done)"));
        statsHost.appendChild(h("span", { style: { flex: "1" } }));
        statsHost.appendChild(G.stat("mejor / peor", "O(n) \u00b7 O(n\u00b2)"));
      },
    });
    function showAsk(i) {
      var f = timeline.frame();
      timeline.setDisabled(true);
      var btns = h("div.ask-btns");
      PRED.forEach(function (p) { btns.appendChild(h("button.ctrl.ask-btn", { type: "button", style: { fontFamily: "var(--font-mono)", fontWeight: "600" }, onClick: function () { answer(p, i, f); } }, p)); });
      G.mount(askHost, h("div.well.ask-panel",
        h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
        h("p.ask-q", ["La carta en mano es ", h("b.mono", String(f.keyVal)), ". \u00bfCu\u00e1ntas posiciones va a retroceder hasta encajar?"]), btns));
    }
    function answer(pred, i, f) {
      var actual = f.answer, correct = pred === "4+" ? actual >= 4 : parseInt(pred, 10) === actual;
      stx.decided[i] = true;
      G.clear(fbHost);
      fbHost.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"),
        h("span.fb-glyph", correct ? "\u2713" : "\u25C6"),
        h("p.fb-text", correct ? ["Bien: retrocedi\u00f3 ", h("b.mono", String(actual)), " posici\u00f3n" + (actual === 1 ? "" : "es") + "."]
          : ["Retrocedi\u00f3 ", h("b.mono", String(actual)), " posici\u00f3n" + (actual === 1 ? "" : "es") + " (predijiste " + pred + "). En datos casi ordenados casi no se mueve; en orden inverso cruza toda la regi\u00f3n."])));
      timeline.setDisabled(false); G.clear(askHost); timeline.next(true);
    }
    function load() { _init = genValues(stx.seed, sc.len, stx.mode); stx.decided = {}; G.clear(fbHost); bt.reset(); timeline.load(framesInsertion(_init)); syncModes(); }
    var modeSeg = h("div.seg", { role: "group", "aria-label": "Tipo de arreglo" });
    var modeBtns = {};
    MODES.forEach(function (m) { var b = h("button", { type: "button", style: { fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: "600", padding: "0 12px" }, onClick: function () { stx.mode = m.id; load(); } }, m.label); modeBtns[m.id] = b; modeSeg.appendChild(b); });
    function syncModes() { MODES.forEach(function (m) { modeBtns[m.id].setAttribute("aria-pressed", stx.mode === m.id ? "true" : "false"); }); practiceBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); }
    var practiceBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "modo pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; G.clear(askHost); timeline.setDisabled(false); syncModes(); } });

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        G.stateLegend(["neutral", "active", "cand", "done"]),
        h("span", { style: { flex: "1" } }), practiceBtn, modeSeg,
        h("button.pill", { type: "button", onClick: function () { stx.seed++; load(); } }, "\u21bb")),
      h("section.card.stage-card", h("div.well.notebook-lines.track-host", bt.node), askHost),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost, h("div.narr-toggles", cx.toggle), cx.panel));
    load();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  /* QUICKSORT                                                             */
  /* ===================================================================== */
  function labelStrat(s) { return s === "first" ? "primero" : s === "random" ? "aleatorio" : "\u00faltimo"; }
  function framesQuick(init, strategy, seed) {
    var arr = clone(init), n = arr.length, F = [], rng = G.mulberry32(seed * 131 + 9), comps = 0, swaps = 0;
    var done = new Array(n).fill(false);
    function base() { return arr.map(function (e, k) { return done[k] ? "done" : "neutral"; }); }
    function snap(states, markers, bracket, note, stack) { F.push({ order: clone(arr), states: states, markers: Object.assign({}, markers), brackets: bracket ? [bracket] : [], stack: stack.map(function (s) { return s.slice(); }), comps: comps, swaps: swaps, note: note }); }
    function br(lo, hi) { return { lo: lo, hi: hi + 1, label: "rango [" + lo + ".." + hi + "]", color: "var(--st-goal)" }; }
    var stack = [[0, n - 1]];
    snap(base(), {}, null, "Quicksort: elegimos un pivote, empujamos los menores a la izquierda y los mayores a la derecha (partici\u00f3n de Lomuto), y repetimos en cada mitad. Es una de varias particiones posibles.", stack);
    while (stack.length) {
      var pair = stack.pop(), lo = pair[0], hi = pair[1];
      if (lo > hi) continue;
      if (lo === hi) { done[lo] = true; snap(base(), {}, br(lo, hi), "Un solo elemento en [" + lo + "]: ya qued\u00f3 en su lugar.", stack); continue; }
      var pidx = strategy === "first" ? lo : strategy === "random" ? lo + Math.floor(rng() * (hi - lo + 1)) : hi;
      if (pidx !== hi) { swaps++; var t0 = arr[pidx]; arr[pidx] = arr[hi]; arr[hi] = t0; var st = base(); st[hi] = "goal"; var m0 = {}; m0[hi] = "pivote \u25CE"; snap(st, m0, br(lo, hi), "Pivote (" + labelStrat(strategy) + "): " + arr[hi].value + ". Lo llevamos al final del rango para particionar.", stack); }
      else { var stb = base(); stb[hi] = "goal"; var m0b = {}; m0b[hi] = "pivote \u25CE"; snap(stb, m0b, br(lo, hi), "Pivote (" + labelStrat(strategy) + "): " + arr[hi].value + ", en el extremo del rango [" + lo + ".." + hi + "].", stack); }
      var pivot = arr[hi].value, i = lo;
      for (var j = lo; j < hi; j++) {
        comps++; var less = arr[j].value < pivot;
        var st2 = base(); st2[hi] = "goal"; st2[i] = "active"; st2[j] = st2[j] === "done" ? "done" : "cand";
        var mk = {}; mk[hi] = "pivote \u25CE"; mk[j] = "j"; mk[i] = i === j ? "i\u00b7j" : "i";
        snap(st2, mk, br(lo, hi), "Comparamos " + arr[j].value + " con el pivote " + pivot + ": " + (less ? "es menor \u2192 al bloque izquierdo." : "es mayor o igual \u2192 se queda."), stack);
        if (less) { if (i !== j) { swaps++; var t1 = arr[i]; arr[i] = arr[j]; arr[j] = t1; } i++; }
      }
      if (i !== hi) { swaps++; var t2 = arr[i]; arr[i] = arr[hi]; arr[hi] = t2; }
      done[i] = true; var stp = base(); stp[i] = "done"; var mp = {}; mp[i] = "pivote fijo";
      snap(stp, mp, br(lo, hi), "El pivote " + pivot + " cae en la posici\u00f3n " + i + ": a su izquierda todos menores, a su derecha mayores. Queda fijo para siempre.", stack);
      stack.push([i + 1, hi]); stack.push([lo, i - 1]);
      snap(base(), {}, null, "Partido en dos subarreglos: [" + lo + ".." + (i - 1) + "] y [" + (i + 1) + ".." + hi + "]. Cada uno se resuelve igual \u2014 ah\u00ed est\u00e1 la recursi\u00f3n.", stack);
    }
    snap(arr.map(function () { return "done"; }), {}, null, "Ordenado con " + comps + " comparaciones. Con buenos pivotes el rango se parte por la mitad \u2192 O(n log n); con pivotes malos degenera a O(n\u00b2).", []);
    return F;
  }

  function renderQuick(mountEl) {
    var C = G.DATA.sims.quick, sc = C.scenario;
    var STRATS = [{ id: "last", label: "\u00faltimo" }, { id: "first", label: "primero" }, { id: "random", label: "aleatorio" }];
    var stx = { seed: sc.seed, strategy: "last", worst: false };
    var bt = G.createBarTrack();
    var stackHost = h("div.qs-stack"), noteEl = h("p.narr-note"), statsHost = h("div.well.stat-row");
    var cx = cxBlock(C.cx);
    var _init = genValues(stx.seed, sc.len, stx.worst ? "sorted" : "random");
    var timeline = G.createTimeline({ onFrame: function (f) {
      bt.update(f, maxOf(_init));
      noteEl.textContent = f.note;
      G.clear(stackHost);
      stackHost.appendChild(h("span.eyebrow", { style: { fontSize: "10px" } }, "Pila de llamadas pendientes"));
      if (f.stack.length === 0) stackHost.appendChild(h("span.mono", { style: { fontSize: "12px", color: "var(--color-fg-faint)" } }, "vac\u00eda \u2014 terminado"));
      else f.stack.slice().reverse().forEach(function (r) { stackHost.appendChild(h("span.chip", { style: { borderColor: "var(--st-goal)", color: "var(--st-goal)" } }, "[" + r[0] + ".." + r[1] + "]")); });
      G.clear(statsHost);
      statsHost.appendChild(G.stat("comparaciones", G.fmt(f.comps), "var(--st-cand)"));
      statsHost.appendChild(G.stat("intercambios", G.fmt(f.swaps), "var(--st-active)"));
      statsHost.appendChild(G.stat("pendientes en pila", f.stack.length, "var(--st-goal)"));
      statsHost.appendChild(h("span", { style: { flex: "1" } }));
      statsHost.appendChild(G.stat("prom. / peor", "O(n log n) \u00b7 O(n\u00b2)"));
    } });
    function load() { _init = genValues(stx.seed, sc.len, stx.worst ? "sorted" : "random"); bt.reset(); timeline.load(framesQuick(_init, stx.strategy, stx.seed)); syncInputs(); }
    var stratSeg = h("div.seg", { role: "group", "aria-label": "Estrategia de pivote" }); var stratBtns = {};
    STRATS.forEach(function (m) { var b = h("button", { type: "button", style: { fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: "600", padding: "0 12px" }, onClick: function () { stx.strategy = m.id; load(); } }, m.label); stratBtns[m.id] = b; stratSeg.appendChild(b); });
    var worstBtn = G.togglePill({ pressed: false, label: "peor caso (ya ordenado)", onClick: function () { stx.worst = !stx.worst; load(); } });
    function syncInputs() { STRATS.forEach(function (m) { stratBtns[m.id].setAttribute("aria-pressed", stx.strategy === m.id ? "true" : "false"); }); worstBtn.setAttribute("aria-pressed", stx.worst ? "true" : "false"); worstBtn.lastChild.textContent = " " + (stx.worst ? "peor caso: activo" : "peor caso (ya ordenado)"); }

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        h("span.eyebrow", { style: { fontSize: "10px" } }, "Pivote"), stratSeg, worstBtn,
        h("span", { style: { flex: "1" } }),
        h("button.pill", { type: "button", onClick: function () { stx.seed++; load(); } }, "\u21bb regenerar")),
      h("section.card.stage-card",
        h("div.stage-head", G.stateLegend(["neutral", "cand", "active", "goal", "done"])),
        h("div.well.notebook-lines.track-host", bt.node), stackHost),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card",
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost, h("div.narr-toggles", cx.toggle), cx.panel));
    load();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  /* MERGE SORT                                                            */
  /* ===================================================================== */
  function levelBrackets(n, width) { var br = []; for (var lo = 0; lo < n; lo += width) br.push({ lo: lo, hi: Math.min(lo + width, n), label: "", color: "var(--color-fg-faint)" }); return br; }
  function framesMerge(init) {
    var arr = clone(init), n = arr.length, F = [], comps = 0;
    var cls = new Array(n).fill("neutral");
    function snap(extra) { F.push(Object.assign({ order: clone(arr), comps: comps }, extra)); }
    function statesWith(over) { var sarr = cls.slice(); if (over) for (var k in over) sarr[k] = over[k]; return sarr; }
    snap({ states: cls.slice(), markers: {}, brackets: [], tray: null, phase: "intro", note: "Merge sort divide el arreglo en mitades hasta tener piezas de una carta, y luego las mezcla de a dos: dos punteros comparan las cabezas y van depositando en orden. Lo hacemos por niveles, de abajo hacia arriba." });
    for (var width = 1; width < n; width *= 2) {
      snap({ states: cls.slice(), markers: {}, brackets: levelBrackets(n, width), tray: null, phase: "level", level: width, note: "Nivel con runs de tama\u00f1o " + width + ": ya est\u00e1n ordenados por dentro. Vamos a mezclarlos de a pares para formar runs de " + Math.min(2 * width, n) + "." });
      for (var lo = 0; lo + width < n; lo += 2 * width) {
        var mid = lo + width, hi = Math.min(lo + 2 * width, n);
        var left = arr.slice(lo, mid), right = arr.slice(mid, hi);
        var li = 0, ri = 0, result = [];
        var runBr = [{ lo: lo, hi: mid, label: "izq", color: "var(--st-path)" }, { lo: mid, hi: hi, label: "der", color: "var(--st-cand)" }];
        while (li < left.length && ri < right.length) {
          comps++;
          var pickLeft = left[li].value <= right[ri].value;
          var over = {}; over[lo + li] = "cand"; over[mid + ri] = "cand";
          var mk = {}; mk[lo + li] = "i"; mk[mid + ri] = "j";
          snap({ states: statesWith(over), markers: mk, brackets: runBr,
            tray: { left: left.map(function (e) { return e.value; }), right: right.map(function (e) { return e.value; }), li: li, ri: ri, out: result.map(function (e) { return e.value; }) },
            phase: "merge", decision: true, answer: pickLeft ? "left" : "right",
            note: "Comparamos cabezas: " + left[li].value + " (izquierda) vs " + right[ri].value + " (derecha). La menor, " + (pickLeft ? left[li].value : right[ri].value) + ", va a la salida." });
          if (pickLeft) { result.push(left[li]); li++; } else { result.push(right[ri]); ri++; }
        }
        while (li < left.length) result.push(left[li++]);
        while (ri < right.length) result.push(right[ri++]);
        for (var kk = 0; kk < result.length; kk++) arr[lo + kk] = result[kk];
        for (var kc = lo; kc < hi; kc++) cls[kc] = "path";
        snap({ states: cls.slice(), markers: {}, brackets: [{ lo: lo, hi: hi, label: "run [" + lo + ".." + (hi - 1) + "]", color: "var(--st-path)" }],
          tray: { left: left.map(function (e) { return e.value; }), right: right.map(function (e) { return e.value; }), li: left.length, ri: right.length, out: result.map(function (e) { return e.value; }) },
          phase: "placed", note: "Run [" + lo + ".." + (hi - 1) + "] mezclado y ordenado (teal). Las barras se reacomodan a su orden." });
      }
    }
    for (var kd = 0; kd < n; kd++) cls[kd] = "done";
    snap({ states: cls.slice(), markers: {}, brackets: [], tray: null, phase: "done", note: "Ordenado en " + comps + " comparaciones. Merge sort siempre divide a la mitad: log n niveles \u00d7 n trabajo por nivel = O(n log n) garantizado, sin peor caso. El costo es memoria extra O(n)." });
    return F;
  }
  function trayView(tray) {
    function box(v, head, kind, dim) {
      var border = head ? (kind === "out" ? "var(--st-done)" : kind === "left" ? "var(--st-path)" : "var(--st-cand)") : "var(--color-border-strong)";
      var bg = head ? (kind === "left" ? "rgba(46,139,139,0.14)" : "rgba(62,124,177,0.12)") : "var(--color-bg-surface)";
      return h("div.tray-box", { style: { border: (head ? "2px solid " : "1px solid ") + border, background: bg, color: dim ? "var(--color-fg-faint)" : "var(--color-fg-default)", opacity: dim ? 0.5 : 1 } }, String(v));
    }
    function row(label, items, headIdx, kind) {
      var boxes = h("div.tray-boxes");
      if (!items.length) boxes.appendChild(h("span.faint", { style: { fontSize: "12px" } }, "\u2014"));
      else items.forEach(function (v, k) { boxes.appendChild(box(v, k === headIdx, kind, headIdx >= 0 && k < headIdx)); });
      return h("div.tray-row", h("span.mono.tray-label", label), boxes);
    }
    return h("div.well.tray",
      row("izquierda", tray.left, tray.li < tray.left.length ? tray.li : -1, "left"),
      row("derecha", tray.right, tray.ri < tray.right.length ? tray.ri : -1, "right"),
      h("div.tray-div"),
      row("salida", tray.out, -1, "out"));
  }

  function renderMerge(mountEl) {
    var C = G.DATA.sims.merge, sc = C.scenario;
    var stx = { seed: sc.seed, practice: true, decided: {} };
    var bt = G.createBarTrack();
    var trayHost = h("div.tray-host"), askHost = h("div.ask-host"), fbHost = h("div.fb-host");
    var noteEl = h("p.narr-note"), statsHost = h("div.well.stat-row");
    var cx = cxBlock(C.cx);
    var _init = genValues(stx.seed, sc.len, "random");
    function needAsk(i) { var f = timeline.frame(); return stx.practice && f && f.decision && !stx.decided[i]; }
    var timeline = G.createTimeline({
      canAdvance: function (i) { return !needAsk(i); },
      onBlocked: function (i) { showAsk(i); },
      onFrame: function (f) {
        G.clear(askHost);
        bt.update(f, maxOf(_init));
        G.clear(trayHost); if (f.tray) trayHost.appendChild(trayView(f.tray));
        noteEl.textContent = f.note;
        G.clear(statsHost);
        statsHost.appendChild(G.stat("comparaciones", G.fmt(f.comps), "var(--st-cand)"));
        statsHost.appendChild(G.stat("nivel (run)", f.level ? f.level : "\u2014", "var(--st-path)"));
        statsHost.appendChild(h("span", { style: { flex: "1" } }));
        statsHost.appendChild(G.stat("garantizado", "O(n log n)", "var(--st-done)"));
      },
    });
    function showAsk(i) {
      var f = timeline.frame(); timeline.setDisabled(true);
      G.mount(askHost, h("div.well.ask-panel",
        h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
        h("p.ask-q", ["Cabezas: ", h("b.mono", String(f.tray.left[f.tray.li])), " (izquierda) y ", h("b.mono", String(f.tray.right[f.tray.ri])), " (derecha). \u00bfCu\u00e1l se deposita primero?"]),
        h("div.ask-btns",
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("left", i, f); } }, "\u2190 izquierda"),
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("right", i, f); } }, "derecha \u2192"))));
    }
    function answer(choice, i, f) {
      var correct = choice === f.answer; stx.decided[i] = true;
      G.clear(fbHost);
      fbHost.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"),
        h("span.fb-glyph", correct ? "\u2713" : "\u25C6"),
        h("p.fb-text", correct ? "Correcto: la cabeza " + (f.answer === "left" ? "izquierda" : "derecha") + " era menor."
          : "Iba la " + (f.answer === "left" ? "izquierda" : "derecha") + ": siempre se deposita la cabeza menor de las dos.")));
      timeline.setDisabled(false); G.clear(askHost); timeline.next(true);
    }
    function load() { _init = genValues(stx.seed, sc.len, "random"); stx.decided = {}; G.clear(fbHost); bt.reset(); timeline.load(framesMerge(_init)); practiceBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); }
    var practiceBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "modo pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; G.clear(askHost); timeline.setDisabled(false); practiceBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); } });

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        G.stateLegend(["neutral", "cand", "path", "done"]),
        h("span", { style: { flex: "1" } }), practiceBtn,
        h("button.pill", { type: "button", onClick: function () { stx.seed++; load(); } }, "\u21bb regenerar")),
      h("section.card.stage-card", h("div.well.notebook-lines.track-host", bt.node), trayHost, askHost),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost, h("div.narr-toggles", cx.toggle), cx.panel));
    load();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  var SIMS = { selection: renderSelection, insertion: renderInsertion, quick: renderQuick, merge: renderMerge };

  function page(root, sub) {
    document.title = "M\u00f3dulo 02 \u2014 Ordenamiento";
    var current = { destroy: function () {} };
    var host = h("div.sim-host");
    var tabs = G.lessonTabs(
      [{ id: "selection", n: "1", label: "Selection" }, { id: "insertion", n: "2", label: "Insertion" },
       { id: "quick", n: "3", label: "Quicksort" }, { id: "merge", n: "4", label: "Merge sort" }],
      function (id) { switchTo(id); }, SIMS[sub] ? sub : "selection");
    function switchTo(id) { current.destroy(); current = SIMS[id](host) || { destroy: function () {} }; }
    var wrap = h("div.wrap.app-root",
      G.siteHome(),
      G.moduleHeader({ current: "02", eyebrow: "M\u00f3dulo 02 \u00b7 Ordenamiento" }),
      tabs.node, host,
      h("footer.kbd-hint", h("span.faint", "\u2190 \u2192 paso \u00b7 espacio reproduce/pausa \u00b7 arrastra la l\u00ednea de tiempo")),
      G.siteFooter());
    G.mount(root, wrap);
    switchTo(tabs.current());
    return function () { current.destroy(); };
  }

  G.pages = G.pages || {};
  G.pages["modulo-02"] = page;

})(window.GUIA = window.GUIA || {});
