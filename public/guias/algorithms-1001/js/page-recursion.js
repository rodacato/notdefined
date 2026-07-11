/* ============================================================================
   page-recursion.js — Módulo 03 · Recursión. Pestañas: call stack / Torres de
   Hanói. Frames precomputados; el motor de components.js mueve el cursor.
   Registra GUIA.pages["modulo-03"].
   ========================================================================== */
(function (G) {
  "use strict";
  var h = G.h, s = G.s;
  var P = ["A", "B", "C"];

  /* helper: bloque toggle de complejidad */
  function cxBlock(html) {
    var panel = h("div.well.cx-panel", { style: { display: "none" } }); panel.innerHTML = html;
    var open = false;
    var toggle = G.togglePill({ pressed: false, icon: "\u03a3", label: "Ver complejidad", onClick: function () {
      open = !open; toggle.setAttribute("aria-pressed", open ? "true" : "false"); panel.style.display = open ? "" : "none"; } });
    return { toggle: toggle, panel: panel };
  }

  /* ===================================================================== */
  /* CALL STACK — factorial(n)                                             */
  /* ===================================================================== */
  var CAP = 11;
  function framesStack(n) {
    var F = [], stack = [];
    function snap(note, phase, extra) { F.push(Object.assign({ stack: stack.map(function (fr) { return Object.assign({}, fr); }), note: note, phase: phase }, extra || {})); }
    snap("Vamos a calcular factorial(" + n + "). Cada llamada se apila como un \"marco\": guarda su n y queda esperando hasta que la de adentro le devuelva un valor.", "intro");
    for (var k = n; k >= 1; k--) {
      stack.forEach(function (fr) { fr.state = "waiting"; });
      if (k > 1) { stack.push({ k: k, value: null, state: "active" }); snap("factorial(" + k + "): como " + k + " > 1, no puede responder todav\u00eda. Necesita factorial(" + (k - 1) + ") primero, as\u00ed que se apila y espera.", "descend"); }
      else { stack.push({ k: 1, value: 1, state: "base" }); snap("Caso base: factorial(1) = 1. Aqu\u00ed la recursi\u00f3n deja de descender \u2014 sin caso base, no parar\u00eda nunca.", "base"); }
    }
    var ret = null;
    while (stack.length) {
      var top = stack[stack.length - 1];
      if (top.state === "base") { top.state = "returning"; ret = 1; snap("factorial(1) devuelve 1 sin m\u00e1s llamadas. Empieza el regreso hacia arriba.", "return", { ret: 1, k: 1, value: 1 }); }
      else { var inc = ret; top.value = top.k * inc; top.state = "returning"; snap("factorial(" + top.k + ") ya recibi\u00f3 " + inc + " de abajo: " + top.k + " \u00d7 " + inc + " = " + top.value + ". Lo devuelve y se desapila.", "return", { ret: inc, k: top.k, value: top.value }); ret = top.value; }
      stack.pop();
      if (stack.length) stack[stack.length - 1].state = "active";
    }
    snap("factorial(" + n + ") = " + ret + ". La pila qued\u00f3 vac\u00eda: cada marco esper\u00f3, multiplic\u00f3 y se fue. Su profundidad m\u00e1xima fue " + n + ".", "done", { result: ret });
    return F;
  }
  function framesNoBase(n) {
    var F = [], stack = [];
    function snap(note, phase, extra) { F.push(Object.assign({ stack: stack.map(function (fr) { return Object.assign({}, fr); }), note: note, phase: phase }, extra || {})); }
    snap("Misma funci\u00f3n, pero le quitamos el caso base: factorial(k) siempre llama a factorial(k\u22121), sin condici\u00f3n de parada.", "intro");
    var k = n;
    for (var i = 0; i < CAP; i++) { stack.forEach(function (fr) { fr.state = "waiting"; }); stack.push({ k: k, value: null, state: "active" }); snap("factorial(" + k + ") llama a factorial(" + (k - 1) + ")\u2026 y nada lo detiene: " + (k - 1) + " sigue sin ser el caso base.", "descend"); k--; }
    stack.push({ k: k, value: null, state: "overflow" });
    snap("La pila sigui\u00f3 creciendo hasta reventar: RangeError \u2014 Maximum call stack size exceeded. Eso es un stack overflow: recursi\u00f3n infinita por falta de caso base.", "overflow", { overflow: true });
    return F;
  }
  var STACK_TONE = {
    active: { bd: "var(--st-active)", bg: "rgba(224,169,59,0.14)" },
    waiting: { bd: "var(--line-strong)", bg: "var(--card)" },
    base: { bd: "var(--st-done)", bg: "rgba(76,154,106,0.16)" },
    returning: { bd: "var(--st-done)", bg: "rgba(76,154,106,0.12)" },
    overflow: { bd: "var(--st-out)", bg: "rgba(176,91,77,0.12)" },
  };
  function stackFrameEl(fr, idx) {
    var tone = STACK_TONE[fr.state] || { bd: "var(--line)", bg: "var(--card)" };
    var right = fr.state === "base" ? "= 1  \u25CE" : fr.state === "returning" ? "= " + fr.value + " \u2191" : fr.state === "overflow" ? "\u2715" : fr.value != null ? "= " + fr.value : "espera\u2026";
    return h("div.stack-frame", { style: { marginLeft: (idx * 16) + "px", border: (fr.state === "overflow" ? "1.5px dashed " : "1.5px solid ") + tone.bd, background: tone.bg } },
      h("span.mono.sf-name", fr.state === "overflow" ? "\u2715 overflow\u2026" : "factorial(" + fr.k + ")"),
      h("span.mono.sf-val", right));
  }
  function callStackView(stack) {
    var wrap = h("div.callstack",
      h("div.cs-top", h("span.eyebrow", { style: { fontSize: "10px" } }, "tope de la pila"), h("span.cs-rule")));
    if (!stack.length) wrap.appendChild(h("div.faint", { style: { fontSize: "13px", padding: "20px 0" } }, "pila vac\u00eda"));
    else stack.forEach(function (fr, i) { wrap.appendChild(stackFrameEl(fr, i)); });
    wrap.appendChild(h("div.cs-base", h("span.eyebrow", { style: { fontSize: "9px" } }, "base de la pila \u00b7 main()")));
    return wrap;
  }

  function renderStack(mountEl) {
    var C = G.DATA.sims.recursion;
    var stx = { n: C.scenario.n, noBase: false, practice: true, decided: {}, feedback: null };
    var stackHost = h("div.well.stack-host"), sideHost = h("div.stack-side");
    var askHost = h("div.ask-host"), fbHost = h("div.fb-host");
    var noteEl = h("p.narr-note"), statsHost = h("div.well.stat-row");
    var cx = cxBlock(C.cx);
    var nSeg, practiceBtn, noBaseBtn;

    function needAsk(i) {
      var f = timeline.frame();
      if (!f || stx.noBase || !stx.practice) return false;
      if (f.phase === "intro" && !stx.decided["base"]) return "base";
      if (f.phase === "return" && f.k > 1 && !stx.decided[i]) return "ret";
      return false;
    }
    var timeline = G.createTimeline({
      canAdvance: function (i) { return !needAsk(i); },
      onBlocked: function (i) { showAsk(i, needAsk(i)); },
      onFrame: function (f) {
        G.clear(askHost);
        G.mount(stackHost, callStackView(f.stack));
        G.clear(sideHost);
        sideHost.appendChild(G.stateLegend(stx.noBase
          ? [{ label: "activo", hex: "#E0A93B" }, { label: "overflow ✕", hex: "#B05B4D", dashed: true }]
          : [{ label: "activo", hex: "#E0A93B" }, { label: "espera", hex: "#C6B896" }, { label: "caso base / devuelve", hex: "#4C9A6A" }]));
        if (f.phase === "done") sideHost.appendChild(h("div.well.result-box", { style: { borderColor: "var(--st-done)" } },
          h("div.eyebrow", { style: { fontSize: "10px" } }, "resultado"), h("div.mono.result-n", String(f.result))));
        if (f.phase === "overflow") sideHost.appendChild(h("div.well.overflow-box",
          h("div.mono", { style: { fontSize: "11.5px", color: "var(--st-out)", lineHeight: "1.5" } }, "RangeError: Maximum call stack size exceeded")));
        noteEl.textContent = f.note;
        G.clear(statsHost);
        statsHost.appendChild(G.stat("profundidad", f.stack.length, "var(--st-active)"));
        statsHost.appendChild(G.stat("fase", f.phase === "descend" ? "apilando" : f.phase === "return" ? "desapilando" : f.phase === "base" ? "caso base" : f.phase === "overflow" ? "overflow" : "\u2014"));
        statsHost.appendChild(h("span", { style: { flex: "1" } }));
        statsHost.appendChild(G.stat("pila", "O(n)", "var(--st-cand)"));
      },
    });

    function showAsk(i, kind) {
      var f = timeline.frame(); timeline.setDisabled(true);
      if (kind === "base") {
        var btns = h("div.ask-btns");
        [0, 1, 2].forEach(function (v) { btns.appendChild(h("button.ctrl.ask-btn", { type: "button", onClick: function () { answerBase(v); } }, "factorial(" + v + ")")); });
        G.mount(askHost, h("div.well.ask-panel",
          h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
          h("p.ask-q", "\u00bfCu\u00e1l es el caso base \u2014 d\u00f3nde deja de descender la recursi\u00f3n?"), btns));
      } else {
        // distractores: el valor real, la suma (error típico) y el que subió; en orden ascendente
        var opts = uniq([f.value, f.k + f.ret, f.ret]).slice(0, 3).sort(function (a, b) { return a - b; });
        var btns2 = h("div.ask-btns");
        opts.forEach(function (v) { btns2.appendChild(h("button.ctrl.ask-btn", { type: "button", style: { fontFamily: "var(--mono)", fontWeight: "600" }, onClick: function () { answerRet(v, i, f); } }, String(v))); });
        G.mount(askHost, h("div.well.ask-panel",
          h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
          h("p.ask-q", ["factorial(" + f.k + ") recibi\u00f3 ", h("b.mono", String(f.ret)), " de abajo. \u00bfQu\u00e9 va a devolver?"]), btns2));
      }
    }
    function answerBase(choice) {
      stx.decided["base"] = true;
      showFb(choice === 1, choice === 1
        ? ["Exacto: ", h("b.mono", "factorial(1)"), " es el caso base; devuelve 1 sin volver a llamarse."]
        : ["El caso base es ", h("b.mono", "factorial(1)"), ": el punto donde se deja de recursar. Sin \u00e9l, la pila no para."]);
      timeline.setDisabled(false); G.clear(askHost);
    }
    function answerRet(val, i, f) {
      stx.decided[i] = true;
      var correct = val === f.value;
      showFb(correct, correct ? ["Correcto: se ", h("b", "multiplica"), ", no se suma. El valor sube y el de arriba lo usa."]
        : ["Devuelve ", h("b.mono", String(f.value)), ": factorial(k) = k \u00d7 (lo que devolvi\u00f3 k\u22121). Es multiplicaci\u00f3n, no suma."]);
      timeline.setDisabled(false); G.clear(askHost); timeline.next(true);
    }
    function showFb(correct, body) {
      G.clear(fbHost);
      fbHost.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"),
        h("span.fb-glyph", correct ? "\u2713" : "\u25C6"), h("p.fb-text", body)));
    }
    function load() {
      stx.decided = {}; G.clear(fbHost);
      timeline.load(stx.noBase ? framesNoBase(stx.n) : framesStack(stx.n));
      sync();
    }
    function sync() {
      [1, 2, 3, 4, 5, 6].forEach(function (v) { nBtns[v].setAttribute("aria-pressed", stx.n === v ? "true" : "false"); nBtns[v].disabled = stx.noBase; });
      practiceBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); practiceBtn.disabled = stx.noBase;
      noBaseBtn.setAttribute("aria-pressed", stx.noBase ? "true" : "false");
      noBaseBtn.textContent = stx.noBase ? "\u21ba con caso base" : "sin caso base";
      noBaseBtn.classList.toggle("danger-pill", stx.noBase);
    }
    nSeg = h("div.seg", { role: "group", "aria-label": "Elegir n" });
    var nBtns = {};
    [1, 2, 3, 4, 5, 6].forEach(function (v) { var b = h("button", { type: "button", style: { fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "600", padding: "0 12px" }, onClick: function () { stx.n = v; load(); } }, String(v)); nBtns[v] = b; nSeg.appendChild(b); });
    practiceBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "modo pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; G.clear(askHost); timeline.setDisabled(false); sync(); } });
    noBaseBtn = h("button.pill", { type: "button", onClick: function () { stx.noBase = !stx.noBase; load(); } });

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        h("span.eyebrow", { style: { fontSize: "10px", whiteSpace: "nowrap" } }, "factorial( n )"), nSeg, practiceBtn,
        h("span", { style: { flex: "1" } }), noBaseBtn),
      h("section.card", { style: { padding: "20px 22px", marginBottom: "16px" } },
        h("div.stack-layout", stackHost, sideHost), askHost),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost, h("div.narr-toggles", cx.toggle), cx.panel));
    load();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
    function uniq(a) { var seen = {}, out = []; a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }
  }

  /* ===================================================================== */
  /* TORRES DE HANÓI                                                       */
  /* ===================================================================== */
  function buildHanoi(n) {
    var idc = 0, nodes = [];
    function mk(k, from, to, aux, depth, parent) {
      var id = idc++; var nd = { id: id, n: k, from: from, to: to, aux: aux, depth: depth, parent: parent, left: -1, right: -1, leaf: k === 1 };
      nodes.push(nd);
      if (k > 1) { nd.left = mk(k - 1, from, aux, to, depth + 1, id); nd.right = mk(k - 1, aux, to, from, depth + 1, id); }
      return id;
    }
    var root = mk(n, 0, 2, 1, 0, -1);
    var lx = 0;
    (function layout(id) { var nd = nodes[id]; if (nd.leaf) nd.x = lx++; else { layout(nd.left); layout(nd.right); nd.x = (nodes[nd.left].x + nodes[nd.right].x) / 2; } nd.y = nd.depth; })(root);
    var maxX = lx - 1, maxDepth = Math.max.apply(null, nodes.map(function (d) { return d.depth; }));
    var F = [], pegs = [[], [], []]; for (var d = n; d >= 1; d--) pegs[0].push(d);
    var st = {}; nodes.forEach(function (nd) { st[nd.id] = "pending"; });
    var enterIdx = {}, exitIdx = {}, count = 0;
    function snap(note, phase, activeId, move) { F.push({ pegs: pegs.map(function (p) { return p.slice(); }), nodeStates: Object.assign({}, st), note: note, phase: phase, activeId: activeId == null ? -1 : activeId, move: move || null, count: count }); }
    snap("Tres postes. Queremos pasar la torre de " + n + " discos de A a C usando B, sin poner nunca un disco grande sobre uno chico. La idea recursiva: mover n\u22121 discos al medio (conf\u00eda), mover el grande, y mover los n\u22121 encima (conf\u00eda).", "intro", root);
    function move(from, to, id) { var disc = pegs[from][pegs[from].length - 1]; pegs[from].pop(); pegs[to].push(disc); count++; snap("Movimiento " + count + ": disco " + disc + " de " + P[from] + " a " + P[to] + ".", "move", id, { disc: disc, from: from, to: to }); }
    function exec(id) {
      var nd = nodes[id]; st[id] = "active"; enterIdx[id] = F.length;
      snap("hanoi(" + nd.n + ", " + P[nd.from] + "\u2192" + P[nd.to] + "): " + (nd.leaf ? "es el caso base \u2014 un solo disco, se mueve directo." : "confiamos en que las dos llamadas hijas resuelven mover " + (nd.n - 1) + " discos. Solo nos ocupamos del disco " + nd.n + ".") , "enter", id);
      if (nd.leaf) { move(nd.from, nd.to, id); } else { exec(nd.left); move(nd.from, nd.to, id); exec(nd.right); }
      st[id] = "done"; exitIdx[id] = F.length;
      snap("hanoi(" + nd.n + ", " + P[nd.from] + "\u2192" + P[nd.to] + ") termin\u00f3: ese subproblema qued\u00f3 resuelto.", "exit", id);
    }
    exec(root);
    snap("Resuelto en " + count + " movimientos = 2^" + n + " \u2212 1. Lo exponencial es inherente: no hay subproblemas repetidos que memoizar (a diferencia de Fibonacci).", "done", -1);
    return { frames: F, nodes: nodes, maxX: maxX, maxDepth: maxDepth, root: root, enterIdx: enterIdx, exitIdx: exitIdx, total: count };
  }
  function towersEl(pegs, n, moveDisc) {
    var maxW = 116, minW = 30;
    function dw(size) { return minW + ((size - 1) / Math.max(1, n - 1)) * (maxW - minW); }
    var row = h("div.towers", { style: { height: (n * 20 + 56) + "px" } });
    pegs.forEach(function (peg, pi) {
      var stackEl = h("div.tower-stack", { style: { minHeight: (n * 19) + "px" } });
      peg.forEach(function (size, k) {
        var moving = size === moveDisc && k === peg.length - 1;
        stackEl.appendChild(h("div.disc", { style: { width: dw(size) + "px", background: moving ? "#E0A93B" : "#B7A98C", borderColor: moving ? "#B07F1d" : "#9c8e72" } }, String(size)));
      });
      row.appendChild(h("div.tower", stackEl, h("div.tower-base"), h("div.mono.tower-label", P[pi])));
    });
    return row;
  }
  var NCOL = { active: "#E0A93B", done: "#4C9A6A", pending: "#CDC3B1" };
  function recTreeEl(data, nodeStates, activeId) {
    var xStep = data.maxX <= 4 ? 64 : data.maxX <= 8 ? 44 : 32, yStep = 52, r = data.maxX <= 4 ? 15 : 12, padX = 26, padY = 20;
    var W = data.maxX * xStep + padX * 2, H = data.maxDepth * yStep + padY * 2 + 14;
    function cx(nd) { return padX + nd.x * xStep; } function cy(nd) { return padY + nd.y * yStep; }
    var svg = s("svg", { width: Math.max(W, 200), height: H, style: { display: "block", margin: "0 auto" } });
    data.nodes.forEach(function (nd) {
      [nd.left, nd.right].filter(function (c) { return c >= 0; }).forEach(function (cId) {
        var c = data.nodes[cId];
        svg.appendChild(s("line", { x1: cx(nd), y1: cy(nd), x2: cx(c), y2: cy(c), stroke: "var(--line-strong)", "stroke-width": "1" }));
      });
    });
    data.nodes.forEach(function (nd) {
      var stt = nodeStates[nd.id] || "pending", on = nd.id === activeId;
      svg.appendChild(s("circle", { cx: cx(nd), cy: cy(nd), r: on ? r + 2 : r, fill: NCOL[stt], stroke: on ? "var(--ink)" : "var(--line-strong)", "stroke-width": on ? "2" : "1" }));
      svg.appendChild(s("text", { x: cx(nd), y: cy(nd) + 3.5, "text-anchor": "middle", "font-family": "var(--mono)", "font-size": r >= 14 ? "11" : "9.5", "font-weight": "600", fill: stt === "pending" ? "var(--ink-soft)" : "var(--paper)" }, String(nd.n)));
    });
    return h("div.rectree-scroll", svg);
  }

  function renderHanoi(mountEl) {
    var C = G.DATA.sims.hanoi;
    var stx = { n: C.scenario.n, practice: true, decided: {} };
    var data = buildHanoi(stx.n);
    var towerHost = h("div.well.notebook-lines.hanoi-towers"), treeHost = h("div.well.hanoi-tree");
    var askHost = h("div.ask-host"), fbHost = h("div.fb-host");
    var noteEl = h("p.narr-note"), statsHost = h("div.well.stat-row");
    var cx = cxBlock(C.cx);
    var practiceBtn, trustBtn, nSeg, nBtns = {};

    function needAsk(i) { var f = timeline.frame(); return stx.practice && f && f.phase === "move" && !stx.decided[i]; }
    var timeline = G.createTimeline({
      canAdvance: function (i) { return !needAsk(i); },
      onBlocked: function (i) { showAsk(i); },
      onFrame: function (f) {
        G.clear(askHost);
        var node = f.activeId >= 0 ? data.nodes[f.activeId] : null;
        G.mount(towerHost, h("div", h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "8px" } }, "Postes"), towersEl(f.pegs, stx.n, f.move ? f.move.disc : -1)));
        var treeInner = h("div",
          h("div.hanoi-tree-head", h("span.eyebrow", { style: { fontSize: "10px" } }, "\u00c1rbol de recursi\u00f3n"), G.stateLegend([{ label: "pendiente", hex: "#CDC3B1" }, { label: "activo", hex: "#E0A93B" }, { label: "resuelto", hex: "#4C9A6A" }])),
          recTreeEl(data, f.nodeStates, f.activeId));
        if (node) treeInner.appendChild(h("div.mono.hanoi-call", "llamada: hanoi(" + node.n + ", " + P[node.from] + "\u2192" + P[node.to] + ", aux " + P[node.aux] + ")"));
        G.mount(treeHost, treeInner);
        noteEl.textContent = f.note;
        // botón confía
        var canTrust = f.phase === "enter" && node && !node.leaf;
        trustBtn.disabled = !canTrust;
        G.clear(statsHost);
        statsHost.appendChild(G.stat("movimientos", G.fmt(f.count), "var(--st-active)"));
        statsHost.appendChild(G.stat("total (2^n\u22121)", G.fmt(data.total), "var(--st-cand)"));
        statsHost.appendChild(G.stat("profundidad", stx.n, "var(--st-goal)"));
        statsHost.appendChild(h("span", { style: { flex: "1" } }));
        statsHost.appendChild(G.stat("movimientos", "O(2\u207f)", "var(--st-out)"));
      },
    });
    function showAsk(i) {
      var f = timeline.frame(); timeline.setDisabled(true);
      var btns = h("div.ask-btns");
      [0, 1, 2].forEach(function (p) { btns.appendChild(h("button.ctrl.ask-btn", { type: "button", style: { fontFamily: "var(--mono)", fontWeight: "600" }, onClick: function () { answer(p, i, f); } }, P[p])); });
      G.mount(askHost, h("div.well.ask-panel",
        h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
        h("p.ask-q", ["Se va a mover el disco ", h("b.mono", String(f.move.disc)), " desde ", h("b.mono", P[f.move.from]), ". \u00bfA qu\u00e9 poste va?"]), btns));
    }
    function answer(choice, i, f) {
      var correct = choice === f.move.to; stx.decided[i] = true;
      G.clear(fbHost);
      fbHost.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"),
        h("span.fb-glyph", correct ? "\u2713" : "\u25C6"),
        h("p.fb-text", correct ? ["Correcto: el disco " + f.move.disc + " va a ", h("b.mono", P[f.move.to]), "."]
          : ["Iba a ", h("b.mono", P[f.move.to]), ". El destino lo fija la llamada actual (su par\u00e1metro \u201cto\u201d)."])));
      timeline.setDisabled(false); G.clear(askHost); timeline.next(true);
    }
    function trust() { var f = timeline.frame(); var ex = data.exitIdx[f.activeId]; if (ex != null) timeline.seek(ex); }
    function load() { data = buildHanoi(stx.n); stx.decided = {}; G.clear(fbHost); timeline.load(data.frames); sync(); }
    function sync() { [3, 4, 5].forEach(function (v) { nBtns[v].setAttribute("aria-pressed", stx.n === v ? "true" : "false"); }); practiceBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); }
    nSeg = h("div.seg", { role: "group", "aria-label": "Elegir n" });
    [3, 4, 5].forEach(function (v) { var b = h("button", { type: "button", style: { fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "600", padding: "0 13px" }, onClick: function () { stx.n = v; load(); } }, String(v)); nBtns[v] = b; nSeg.appendChild(b); });
    practiceBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "modo pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; G.clear(askHost); timeline.setDisabled(false); sync(); } });
    trustBtn = h("button.pill", { type: "button", disabled: "", title: "Asume resuelto este sub\u00e1rbol y salta a su final", onClick: trust }, "\u2933 conf\u00eda en la recursi\u00f3n");

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        h("span.eyebrow", { style: { fontSize: "10px", whiteSpace: "nowrap" } }, "discos n"), nSeg, practiceBtn,
        h("span", { style: { flex: "1" } }), trustBtn),
      h("section.card", { style: { padding: "18px 20px 16px", marginBottom: "16px" } },
        h("div.hanoi-grid", towerHost, treeHost), askHost),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost, h("div.narr-toggles", cx.toggle), cx.panel));
    load();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  var SIMS = { recursion: renderStack, hanoi: renderHanoi };
  function page(root, sub) {
    document.title = "M\u00f3dulo 03 \u2014 Recursi\u00f3n";
    var current = { destroy: function () {} };
    var host = h("div.sim-host");
    var tabs = G.lessonTabs(
      [{ id: "recursion", n: "1", label: "Call stack" }, { id: "hanoi", n: "2", label: "Torres de Han\u00f3i" }],
      function (id) { switchTo(id); }, SIMS[sub] ? sub : "recursion");
    function switchTo(id) { current.destroy(); current = SIMS[id](host) || { destroy: function () {} }; }
    var wrap = h("div.wrap.app-root",
      G.siteHome(),
      G.moduleHeader({ current: "03", eyebrow: "M\u00f3dulo 03 \u00b7 Recursi\u00f3n" }),
      tabs.node, host,
      h("footer.kbd-hint", h("span.faint", "\u2190 \u2192 paso \u00b7 espacio reproduce/pausa \u00b7 arrastra la l\u00ednea de tiempo")),
      G.siteFooter());
    G.mount(root, wrap);
    switchTo(tabs.current());
    return function () { current.destroy(); };
  }

  G.pages = G.pages || {};
  G.pages["modulo-03"] = page;

})(window.GUIA = window.GUIA || {});
