/* ============================================================================
   page-greedy-dp.js — Módulo 06 · Greedy y programación dinámica. Pestañas:
   selección de actividades / Fibonacci + memo / mochila 0/1. Motor de frames;
   Fibonacci es un explorador interactivo. Registra pages["modulo-06"].
   ========================================================================== */
(function (G) {
  "use strict";
  var h = G.h, s = G.s;
  var COLORS = ["#B05B4D", "#E0A93B", "#4C9A6A", "#3E7CB1", "#7B5EA7", "#2E8B8B", "#A6772F", "#8A6D9E"];

  function cxBlock(html) {
    var panel = h("div.well.cx-panel", { style: { display: "none" } }); panel.innerHTML = html;
    var open = false;
    var toggle = G.togglePill({ pressed: false, icon: "\u03a3", label: "Ver complejidad", onClick: function () {
      open = !open; toggle.setAttribute("aria-pressed", open ? "true" : "false"); panel.style.display = open ? "" : "none"; } });
    return { toggle: toggle, panel: panel };
  }

  /* ===================================================================== */
  /* 06-a · GREEDY (selección de actividades)                              */
  /* ===================================================================== */
  function renderGreedy(mountEl) {
    var C = G.DATA.sims.greedy, ACTS = C.acts, T = C.T, STRATS = C.strats;
    function actById(id) { return ACTS.find(function (a) { return a.id === id; }); }
    function overlap(a, b) { return a.s < b.e && b.s < a.e; }
    function keyFn(id) { return id === "end" ? function (x) { return x.e; } : id === "short" ? function (x) { return x.e - x.s; } : function (x) { return x.s; }; }
    function build(stratId) {
      var strat = STRATS.find(function (x) { return x.id === stratId; }), kf = keyFn(stratId);
      var order = ACTS.slice().sort(function (a, b) { return kf(a) - kf(b) || (a.id < b.id ? -1 : 1); });
      var F = [], st = {}; ACTS.forEach(function (a) { st[a.id] = "neutral"; }); var chosen = [];
      function snap(note, active, decision, ans) { F.push({ states: Object.assign({}, st), order: order.map(function (o) { return o.id; }), note: note, active: active || null, decision: !!decision, answer: ans, chosenCount: chosen.length, phase: "run" }); }
      snap("Estrategia: \"" + strat.label + "\". Ordenamos las actividades por ese criterio y las recorremos, qued\u00e1ndonos con cada una que no choque con las ya elegidas.", null);
      order.forEach(function (a) {
        var conflict = chosen.some(function (c) { return overlap(a, c); });
        snap("Considero " + a.id + " (" + a.s + "\u2013" + a.e + "). " + (conflict ? "Se solapa con algo ya elegido." : "No choca con ninguna elegida."), a.id, true, conflict ? "discard" : "pick");
        if (!conflict) { st[a.id] = "done"; chosen.push(a); snap(a.id + " se queda. Ocupa " + a.s + "\u2013" + a.e + ".", a.id); }
        else { st[a.id] = "out"; snap(a.id + " se descarta.", a.id); }
      });
      snap("Con \"" + strat.label + "\" quedaron " + chosen.length + " actividades" + (strat.optimal
        ? " \u2014 y es el m\u00e1ximo posible (elegir la que termina antes es la estrategia \u00f3ptima)."
        : chosen.length === C.optimo
          ? " \u2014 esta vez empat\u00f3 con el \u00f3ptimo, pero no est\u00e1 garantizado: con otros datos esta estrategia falla."
          : ". Pero el \u00f3ptimo es " + C.optimo + ": esta estrategia greedy NO siempre acierta."), null);
      return F;
    }
    function timelineEl(order, states) {
      var wrap = h("div.acts");
      order.forEach(function (id) {
        var a = actById(id), st = states[id] || "neutral", b = G.BAR[st] || G.BAR.neutral;
        wrap.appendChild(h("div.act-row", h("span.mono.act-id", id),
          h("div.act-track", h("div.act-bar", { style: { left: (a.s / T * 100) + "%", width: ((a.e - a.s) / T * 100) + "%", background: b.bg, border: "1.5px solid " + b.bd, borderStyle: st === "out" ? "dashed" : "solid", textDecoration: st === "out" ? "line-through" : "none" } }, a.s + "\u2013" + a.e))));
      });
      var ticks = h("div.act-ticks"); for (var i = 0; i <= T; i++) ticks.appendChild(h("span.mono.act-tick", String(i)));
      wrap.appendChild(ticks);
      return wrap;
    }
    var stx = { strat: "end", practice: true, answered: {} };
    var stageHost = h("div.well.notebook-lines", { style: { padding: "14px 16px" } });
    var askHost = h("div.ask-host"), fbHost = h("div.fb-host");
    var noteEl = h("p.narr-note"), statsHost = h("div.well.stat-row");
    var cx = cxBlock(C.cx);
    function needAsk(i) { var f = timeline.frame(); return stx.practice && f && f.decision && !stx.answered[i]; }
    var timeline = G.createTimeline({
      canAdvance: function (i) { return !needAsk(i); },
      onBlocked: function (i) { showAsk(i); },
      onFrame: function (f) {
        G.clear(askHost);
        G.mount(stageHost, timelineEl(f.order, f.states));
        noteEl.textContent = f.note;
        G.clear(statsHost);
        statsHost.appendChild(G.stat("elegidas", f.chosenCount, "var(--st-done)"));
        statsHost.appendChild(G.stat("\u00f3ptimo posible", C.optimo, "var(--st-cand)"));
        statsHost.appendChild(h("span", { style: { flex: "1" } }));
        statsHost.appendChild(G.stat("por el ordenamiento", "O(n log n)"));
      },
    });
    function showAsk(i) {
      var f = timeline.frame(); timeline.setDisabled(true);
      G.mount(askHost, h("div.well.ask-panel",
        h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
        h("p.ask-q", ["La actividad ", h("b.mono", f.active), ", \u00bfse elige o se descarta?"]),
        h("div.ask-btns",
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("pick", i, f); } }, "se elige"),
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("discard", i, f); } }, "se descarta"))));
    }
    function answer(c, i, f) {
      var correct = c === f.answer; stx.answered[i] = true;
      G.clear(fbHost);
      fbHost.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"), h("span.fb-glyph", correct ? "\u2713" : "\u25C6"),
        h("p.fb-text", correct ? "Correcto: se " + (f.answer === "pick" ? "elige" : "descarta") + "." : "Se " + (f.answer === "pick" ? "elige" : "descarta") + ": greedy la acepta solo si no choca con ninguna ya elegida.")));
      timeline.setDisabled(false); G.clear(askHost); timeline.next(true);
    }
    function load() { stx.answered = {}; G.clear(fbHost); timeline.load(build(stx.strat)); sync(); }
    var stratSeg = h("div.seg"), stratBtns = {};
    STRATS.forEach(function (m) { stratBtns[m.id] = h("button", { type: "button", style: { fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: "600", padding: "0 12px" }, onClick: function () { stx.strat = m.id; load(); } }, m.label); stratSeg.appendChild(stratBtns[m.id]); });
    var pBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; timeline.setDisabled(false); pBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); } });
    function sync() { STRATS.forEach(function (m) { stratBtns[m.id].setAttribute("aria-pressed", stx.strat === m.id ? "true" : "false"); }); }

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card", h("span.eyebrow", { style: { fontSize: "10px" } }, "elegir por"), stratSeg, pBtn),
      h("section.card", { style: { padding: "20px 22px", marginBottom: "16px" } },
        h("div.stage-head", h("span.eyebrow", { style: { fontSize: "10px" } }, "l\u00ednea de tiempo (orden de consideraci\u00f3n \u2193)"), G.stateLegend(["neutral", "active", "done", "out"])),
        stageHost, askHost),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost, h("div.narr-toggles", cx.toggle), cx.panel));
    load();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  /* 06-b · FIBONACCI + MEMO (explorador interactivo)                      */
  /* ===================================================================== */
  function renderFib(mountEl) {
    var C = G.DATA.sims.fib;
    function vcolor(k) { return COLORS[k % COLORS.length]; }
    function fib(k) { var a = 0, b = 1; for (var i = 0; i < k; i++) { var t = b; b = a + b; a = t; } return a; }
    function buildTree(n, memo) {
      var idc = 0, nodes = [], seen = {}, calls = 0;
      function rec(k, depth, parent) {
        var id = idc++; calls++;
        var hit = memo && seen[k] !== undefined;
        var node = { id: id, k: k, depth: depth, parent: parent, hit: hit, children: [] }; nodes.push(node);
        if (!hit) { if (k > 1) { node.children.push(rec(k - 1, depth + 1, id)); node.children.push(rec(k - 2, depth + 1, id)); } if (memo) seen[k] = true; }
        return id;
      }
      rec(n, 0, -1);
      var xc = 0;
      (function lay(id) { var nd = nodes[id]; if (!nd.children.length) nd.x = xc++; else { nd.children.forEach(lay); nd.x = (nodes[nd.children[0]].x + nodes[nd.children[nd.children.length - 1]].x) / 2; } nd.y = nd.depth; })(0);
      return { nodes: nodes, calls: calls, maxX: xc - 1, maxD: Math.max.apply(null, nodes.map(function (x) { return x.depth; })) };
    }
    function memoOrder(n) { var seen = [], sm = {}; (function rec(k) { if (sm[k] !== undefined) return; if (k > 1) { rec(k - 1); rec(k - 2); } sm[k] = true; seen.push(k); })(n); return seen; }
    function fibTreeEl(tree, mark) {
      var xStep = tree.maxX <= 8 ? 40 : tree.maxX <= 16 ? 24 : 17, yStep = 46, r = tree.maxX <= 8 ? 14 : 11, pad = 18;
      var W = tree.maxX * xStep + pad * 2, H = tree.maxD * yStep + pad * 2 + 10;
      function px(n) { return pad + n.x * xStep; } function py(n) { return pad + n.y * yStep + 5; }
      var svg = s("svg", { width: Math.max(W, 180), height: H, style: { display: "block", margin: "0 auto" } });
      tree.nodes.forEach(function (n) { if (n.parent >= 0) svg.appendChild(s("line", { x1: px(tree.nodes[n.parent]), y1: py(tree.nodes[n.parent]), x2: px(n), y2: py(n), stroke: "var(--color-border-strong)", "stroke-width": "1" })); });
      tree.nodes.forEach(function (n) {
        var c = vcolor(n.k), m = mark === n.id;
        svg.appendChild(s("circle", { cx: px(n), cy: py(n), r: m ? r + 2 : r, fill: n.hit ? "var(--color-bg-canvas)" : c + "33", stroke: m ? "var(--color-fg-default)" : c, "stroke-width": m ? "2.6" : "1.8", "stroke-dasharray": n.hit ? "3 2" : "0" }));
        svg.appendChild(s("text", { x: px(n), y: py(n) + 4, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": r >= 13 ? "11.5" : "9.5", "font-weight": "600", fill: "var(--color-fg-default)" }, String(n.k)));
        if (n.hit) svg.appendChild(s("text", { x: px(n), y: py(n) - r - 3, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "8", fill: "var(--st-done)" }, "hit"));
      });
      return h("div.tree-scroll", svg);
    }

    var stx = { n: 5, memo: false, mark: null, fb: null };
    var callHost = h("div.card", { style: { padding: "12px 18px", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "8px 26px", alignItems: "center" } });
    var treeHost = h("div.well.notebook-lines", { style: { padding: "8px" } });
    var memoHost = h("div.well", { style: { padding: "12px 14px" } });
    var noteEl = h("p.narr-note"), statsHost = h("div.well.stat-row"), fbHost = h("div.fb-host"), askHost = h("div.ask-host");
    var cx = cxBlock(C.cx);
    var slider = h("input.fib-slider", { type: "range", min: "2", max: "7", value: "5" });
    var nLabel = h("span.eyebrow", { style: { fontSize: "10px", whiteSpace: "nowrap" } });
    var memoBtn, cxToggle = cx.toggle;

    function render() {
      var tree = buildTree(stx.n, stx.memo), treeNo = buildTree(stx.n, false), treeYes = buildTree(stx.n, true), order = memoOrder(stx.n);
      nLabel.textContent = "fib( n = " + stx.n + " )"; slider.value = stx.n;
      memoBtn.setAttribute("aria-pressed", stx.memo ? "true" : "false"); memoBtn.lastChild.textContent = " " + (stx.memo ? "memoizaci\u00f3n: ON" : "memoizaci\u00f3n: OFF");
      G.clear(callHost);
      callHost.appendChild(h("span.eyebrow", { style: { fontSize: "10px" } }, "llamadas para fib(" + stx.n + ")"));
      callHost.appendChild(G.stat("sin memo", treeNo.calls, "var(--st-out)"));
      callHost.appendChild(G.stat("con memo", treeYes.calls, "var(--st-done)"));
      callHost.appendChild(h("span.mono.faint", { style: { fontSize: "11px" } }, "\u00b7 fib(" + stx.n + ") = " + fib(stx.n)));
      G.mount(treeHost, h("div", h("div.eyebrow", { style: { fontSize: "10px", padding: "2px 0 6px 6px" } }, "\u00e1rbol de recursi\u00f3n " + (stx.memo ? "\u00b7 con memo (podado)" : "\u00b7 sin memo")), fibTreeEl(tree, stx.mark)));
      G.clear(memoHost);
      memoHost.appendChild(h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "8px" } }, "tabla de memo (orden de c\u00e1lculo)"));
      var rows = h("div", { style: { display: "flex", flexDirection: "column", gap: "4px" } });
      order.forEach(function (k) { rows.appendChild(h("div.fib-memo-row", h("span.fib-sw", { style: { background: vcolor(k) + "55", border: "1.5px solid " + vcolor(k) } }), "fib(" + k + ") = ", h("b", String(fib(k))))); });
      memoHost.appendChild(rows);
      memoHost.appendChild(h("p.faint", { style: { fontSize: "11px", margin: "8px 0 0" } }, "Mismo color = mismo subproblema. Con memo, cada uno se calcula una sola vez."));
      noteEl.textContent = stx.memo
        ? "Con memoizaci\u00f3n, la primera vez que se resuelve fib(k) se guarda; las siguientes apariciones (borde punteado, \"hit\") se sirven de la tabla y su rama se poda. Para fib(" + stx.n + "): " + treeYes.calls + " llamadas en vez de " + treeNo.calls + "."
        : "Sin memo, cada fib(k) se recalcula desde cero cada vez que aparece \u2014 f\u00edjate cu\u00e1ntas veces se repite el mismo color. Para fib(" + stx.n + "): " + treeNo.calls + " llamadas, y crece exponencialmente.";
      G.clear(statsHost);
      statsHost.appendChild(G.stat("nodos en el \u00e1rbol", tree.nodes.length, stx.memo ? "var(--st-done)" : "var(--st-out)"));
      statsHost.appendChild(h("span", { style: { flex: "1" } }));
      statsHost.appendChild(G.stat("sin memo \u00b7 con memo", "O(2\u207f) \u00b7 O(n)"));
      // feedback / ask
      G.clear(fbHost); G.clear(askHost);
      if (stx.fb && stx.fb.pending) {
        askHost.appendChild(h("div.well.ask-panel",
          h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice \u2014 nodo marcado en el \u00e1rbol"),
          h("p.ask-q", ["El nodo resaltado (fib(" + stx.fb.k + ")), \u00bfse recalcula o es un hit de cach\u00e9?"]),
          h("div.ask-btns",
            h("button.ctrl.ask-btn", { type: "button", onClick: function () { answerFib(false); } }, "se recalcula"),
            h("button.ctrl.ask-btn", { type: "button", onClick: function () { answerFib(true); } }, "hit de cach\u00e9"))));
      } else if (stx.fb && !stx.fb.pending) {
        fbHost.appendChild(h("div.card.fb-card" + (stx.fb.correct ? ".fb-ok" : ".fb-warn"), h("span.fb-glyph", stx.fb.correct ? "\u2713" : "\u25C6"),
          h("p.fb-text", ["El nodo fib(" + stx.fb.k + ") marcado ", stx.fb.hit ? ["es un ", h("b", "hit de cach\u00e9"), ": ya estaba resuelto, se sirve de la tabla."] : ["se ", h("b", "recalcula"), stx.memo ? " (es su primera aparici\u00f3n)." : " (sin memo, siempre se recalcula)."]])));
      }
    }
    function quiz() { var tree = buildTree(stx.n, stx.memo); var cands = tree.nodes.filter(function (x) { return x.parent >= 0; }); var pick = cands[Math.floor(Math.random() * cands.length)]; stx.mark = pick.id; stx.fb = { pending: true, hit: pick.hit, k: pick.k }; render(); }
    function answerFib(isHit) { stx.fb.pending = false; stx.fb.correct = isHit === stx.fb.hit; render(); }
    slider.addEventListener("input", function () { stx.n = +slider.value; stx.mark = null; stx.fb = null; render(); });
    memoBtn = G.togglePill({ pressed: false, icon: "\u2713", label: "memoizaci\u00f3n: OFF", onClick: function () { stx.memo = !stx.memo; stx.mark = null; stx.fb = null; render(); } });

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card", nLabel, slider, memoBtn, h("span", { style: { flex: "1" } }), h("button.pill", { type: "button", onClick: quiz }, "\u25CE \u00bfrecalcula o hit?")),
      callHost,
      h("section.card", { style: { padding: "18px 20px", marginBottom: "16px" } },
        h("div.fib-grid", treeHost, memoHost)),
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost, askHost, h("div.narr-toggles", cxToggle), cx.panel));
    render();
    G.mount(mountEl, view);
    return { destroy: function () {} };
  }

  /* ===================================================================== */
  /* 06-c · MOCHILA 0/1 (DP)                                               */
  /* ===================================================================== */
  function renderKnapsack(mountEl) {
    var C = G.DATA.sims.knapsack, ITEMS = C.items, W = C.W, N = ITEMS.length;
    function key(i, w) { return i + "," + w; }
    function build() {
      var dp = []; for (var r = 0; r <= N; r++) dp.push(new Array(W + 1).fill(0));
      var F = [], filled = {}; for (var w0 = 0; w0 <= W; w0++) filled[key(0, w0)] = true;
      function snap(note, cur, srcs, decision, took, phase, path) { F.push({ dp: dp.map(function (row) { return row.slice(); }), filled: Object.assign({}, filled), cur: cur || null, srcs: srcs || [], note: note, decision: !!decision, took: took, path: path || null, phase: phase || "run" }); }
      snap("Tabla DP: filas = items (cu\u00e1ntos puedo usar), columnas = capacidad. La fila 0 (ning\u00fan item) es todo 0. Cada celda reusa resultados de la fila de arriba.", null);
      for (var i = 1; i <= N; i++) {
        var wt = ITEMS[i - 1].w, val = ITEMS[i - 1].v;
        for (var w = 0; w <= W; w++) {
          var notTake = dp[i - 1][w], canTake = wt <= w, take = canTake ? val + dp[i - 1][w - wt] : -1;
          var srcs = [{ i: i - 1, w: w }]; if (canTake) srcs.push({ i: i - 1, w: w - wt });
          var took = canTake && take > notTake;
          snap("Celda (item " + i + ", cap " + w + "): el item " + i + " pesa " + wt + ". " + (canTake ? "Comparo NO tomar (" + notTake + ") vs tomar (" + val + "+" + dp[i - 1][w - wt] + "=" + take + ")." : "No cabe (pesa " + wt + " > " + w + "): heredo " + notTake + " de arriba."), { i: i, w: w }, srcs, canTake, took);
          dp[i][w] = Math.max(notTake, take); filled[key(i, w)] = true;
          snap("(item " + i + ", cap " + w + ") = " + dp[i][w] + " \u2014 " + (took ? "conviene tomar el item " + i + "." : "mejor no tomarlo."), { i: i, w: w }, srcs, false, took);
        }
      }
      var path = {}, taken = [], wc = W;
      for (var ii = N; ii >= 1; ii--) { path[key(ii, wc)] = true; if (dp[ii][wc] !== dp[ii - 1][wc]) { taken.push(ii); wc -= ITEMS[ii - 1].w; } }
      path[key(0, wc)] = true;
      F.push({ dp: dp.map(function (row) { return row.slice(); }), filled: Object.assign({}, filled), cur: { i: N, w: W }, srcs: [], note: "Valor \u00f3ptimo: " + dp[N][W] + " (esquina inferior derecha). Reconstruyo hacia atr\u00e1s: si una celda difiere de la de arriba, ese item se tom\u00f3 \u2192 items {" + taken.reverse().join(", ") + "}.", path: path, phase: "done" });
      return F;
    }
    function buildNaive() {
      var idc = 0, nodes = [];
      function rec(i, w, depth, parent) { var id = idc++; var node = { id: id, i: i, w: w, depth: depth, parent: parent, children: [] }; nodes.push(node); if (i > 0 && w > 0) { node.children.push(rec(i - 1, w, depth + 1, id)); if (ITEMS[i - 1].w <= w) node.children.push(rec(i - 1, w - ITEMS[i - 1].w, depth + 1, id)); } return id; }
      rec(N, W, 0, -1);
      var xc = 0;
      (function lay(id) { var nd = nodes[id]; if (!nd.children.length) nd.x = xc++; else { nd.children.forEach(lay); nd.x = (nodes[nd.children[0]].x + nodes[nd.children[nd.children.length - 1]].x) / 2; } nd.y = nd.depth; })(0);
      return { nodes: nodes, maxX: xc - 1, maxD: Math.max.apply(null, nodes.map(function (n) { return n.depth; })), count: nodes.length };
    }
    function naiveCol(i, w) { return COLORS[((i * 31 + w) % COLORS.length + COLORS.length) % COLORS.length]; }
    function naiveTreeEl(tree) {
      var xStep = 16, yStep = 38, r = 13, pad = 16;
      var W2 = tree.maxX * xStep + pad * 2, H = tree.maxD * yStep + pad * 2 + 10;
      function px(n) { return pad + n.x * xStep; } function py(n) { return pad + n.y * yStep + 5; }
      var svg = s("svg", { width: Math.max(W2, 200), height: H, style: { display: "block", margin: "0 auto" } });
      tree.nodes.forEach(function (n) { if (n.parent >= 0) svg.appendChild(s("line", { x1: px(tree.nodes[n.parent]), y1: py(tree.nodes[n.parent]), x2: px(n), y2: py(n), stroke: "var(--color-border-strong)", "stroke-width": "0.8" })); });
      tree.nodes.forEach(function (n) { var c = naiveCol(n.i, n.w); svg.appendChild(s("circle", { cx: px(n), cy: py(n), r: r, fill: c + "30", stroke: c, "stroke-width": "1.4" })); svg.appendChild(s("text", { x: px(n), y: py(n) + 3.5, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "8.5", "font-weight": "600", fill: "var(--color-fg-default)" }, n.i + "," + n.w)); });
      return h("div.tree-scroll", svg);
    }

    var naive = buildNaive();
    var stx = { practice: true, showNaive: false, answered: {} };
    var stageHost = h("div.knap-stage");
    var askHost = h("div.ask-host"), fbHost = h("div.fb-host");
    var noteEl = h("p.narr-note"), statsHost = h("div.well.stat-row");
    var cx = cxBlock(C.cx);
    var ctrlCard = h("section.card.ctrl-card");

    function cellStyle(f, i, w) {
      var k = key(i, w);
      var srcSet = {}; f.srcs.forEach(function (sc) { srcSet[key(sc.i, sc.w)] = true; });
      if (f.path && f.path[k]) return { bg: "rgba(76,154,106,0.20)", bd: "var(--st-done)" };
      if (f.cur && f.cur.i === i && f.cur.w === w) return { bg: "rgba(224,169,59,0.22)", bd: "var(--st-active)" };
      if (srcSet[k]) return { bg: "rgba(62,124,177,0.16)", bd: "var(--st-cand)" };
      if (f.filled[k]) return { bg: "var(--color-bg-surface)", bd: "var(--color-border-default)" };
      return { bg: "var(--color-bg-muted)", bd: "var(--color-border-default)" };
    }
    function tableEl(f) {
      var srcSet = {}; f.srcs.forEach(function (sc) { srcSet[key(sc.i, sc.w)] = true; });
      var thead = h("tr", h("th.knap-h", "item\u2193 \\ cap\u2192")); for (var w = 0; w <= W; w++) thead.appendChild(h("th.knap-h", String(w)));
      var tb = h("tbody");
      for (var i = 0; i <= N; i++) (function (i) {
        var tr = h("tr", h("th.knap-rh", i === 0 ? "\u2205" : "i" + i + " (" + ITEMS[i - 1].w + "\u00b7" + ITEMS[i - 1].v + ")"));
        for (var w = 0; w <= W; w++) { var cs = cellStyle(f, i, w); var show = f.filled[key(i, w)] || (f.cur && f.cur.i === i && f.cur.w === w); tr.appendChild(h("td.knap-cell", { style: { border: "1.5px solid " + cs.bd, background: cs.bg } }, show ? String(f.dp[i][w]) : "")); }
        tb.appendChild(tr);
      })(i);
      return h("div.well", { style: { padding: "16px 14px", overflowX: "auto" } }, h("table.knap-table", h("thead", thead), tb));
    }
    function needAsk(i) { var f = timeline.frame(); return stx.practice && !stx.showNaive && f && f.decision && !stx.answered[i]; }
    var timeline = G.createTimeline({
      unit: "celda",
      canAdvance: function (i) { return !needAsk(i); },
      onBlocked: function (i) { showAsk(i); },
      onFrame: function (f) {
        G.clear(askHost);
        G.clear(stageHost);
        if (stx.showNaive) stageHost.appendChild(h("div.well.notebook-lines", { style: { padding: "10px 8px" } }, h("div.eyebrow", { style: { fontSize: "10px", padding: "2px 0 6px 6px" } }, "\u00e1rbol recursivo ingenuo \u00b7 " + naive.count + " llamadas \u00b7 nodos (i,w) del mismo color = mismo subproblema"), naiveTreeEl(naive), h("p.faint", { style: { fontSize: "11.5px", padding: "6px 8px 0" } }, "Mismos subproblemas (i,w) reaparecen por todo el \u00e1rbol: ese desperdicio es justo lo que la tabla elimina, calculando cada uno una sola vez.")));
        else stageHost.appendChild(tableEl(f));
        noteEl.textContent = stx.showNaive ? "Versi\u00f3n recursiva sin memo: " + naive.count + " llamadas, con subproblemas (i,w) repetidos por todo el \u00e1rbol. La tabla DP los resuelve una sola vez." : f.note;
        G.clear(statsHost);
        statsHost.appendChild(G.stat("valor \u00f3ptimo", f.phase === "done" ? f.dp[N][W] : "\u2014", "var(--st-done)"));
        statsHost.appendChild(G.stat("celdas", (N + 1) * (W + 1), "var(--st-cand)"));
        statsHost.appendChild(h("span", { style: { flex: "1" } }));
        statsHost.appendChild(G.stat("DP \u00b7 ingenuo", "O(n\u00b7W) \u00b7 " + naive.count + " llamadas"));
        ctrlCard.style.display = stx.showNaive ? "none" : "";
      },
    });
    function showAsk(i) {
      var f = timeline.frame(); timeline.setDisabled(true);
      G.mount(askHost, h("div.well.ask-panel",
        h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
        h("p.ask-q", "En la celda (item " + f.cur.i + ", cap " + f.cur.w + "): \u00bfconviene tomar el item " + f.cur.i + "?"),
        h("div.ask-btns",
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer(true, i, f); } }, "s\u00ed, tomarlo"),
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer(false, i, f); } }, "no tomarlo"))));
    }
    function answer(yes, i, f) {
      var correct = yes === f.took; stx.answered[i] = true;
      G.clear(fbHost);
      fbHost.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"), h("span.fb-glyph", correct ? "\u2713" : "\u25C6"),
        h("p.fb-text", correct ? "Correcto: " + (f.took ? "conviene tomarlo." : "mejor no tomarlo.") : (f.took ? ["Conven\u00eda ", h("b", "tomarlo"), ": tomar daba m\u00e1s valor."] : ["Mejor ", h("b", "no tomarlo"), ": no tomar daba al menos lo mismo."]))));
      timeline.setDisabled(false); G.clear(askHost); timeline.next(true);
    }
    var pBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; timeline.setDisabled(false); pBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); } });
    var naiveBtn = G.togglePill({ pressed: false, label: "versi\u00f3n recursiva ingenua", onClick: function () { stx.showNaive = !stx.showNaive; naiveBtn.setAttribute("aria-pressed", stx.showNaive ? "true" : "false"); G.clear(askHost); timeline.setDisabled(false); timeline.seek(timeline.index()); } });

    ctrlCard.appendChild(timeline.node);
    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        h("span.mono.faint", { style: { fontSize: "11px" } }, "items (peso\u00b7valor): " + ITEMS.map(function (it, i) { return "i" + (i + 1) + "=" + it.w + "\u00b7" + it.v; }).join("  ") + " \u00b7 capacidad W=" + W),
        h("span", { style: { flex: "1" } }), pBtn, naiveBtn),
      h("section.card", { style: { padding: "18px 20px", marginBottom: "16px" } }, stageHost, askHost),
      ctrlCard,
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost, h("div.narr-toggles", cx.toggle), cx.panel));
    timeline.load(build());
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  var SIMS = { greedy: renderGreedy, fib: renderFib, knapsack: renderKnapsack };
  function page(root, sub) {
    document.title = "M\u00f3dulo 06 \u2014 Greedy y programaci\u00f3n din\u00e1mica";
    var current = { destroy: function () {} };
    var host = h("div.sim-host");
    var tabs = G.lessonTabs(
      [{ id: "greedy", n: "1", label: "Greedy" }, { id: "fib", n: "2", label: "Fibonacci + memo" }, { id: "knapsack", n: "3", label: "Mochila 0/1" }],
      function (id) { switchTo(id); }, SIMS[sub] ? sub : "greedy");
    function switchTo(id) { current.destroy(); current = SIMS[id](host) || { destroy: function () {} }; }
    var wrap = h("div.wrap.app-root",
      G.siteHome(),
      G.moduleHeader({ current: "06", eyebrow: "M\u00f3dulo 06 \u00b7 Greedy y programaci\u00f3n din\u00e1mica" }),
      tabs.node, host,
      h("footer.kbd-hint", h("span.faint", "\u2190 \u2192 paso \u00b7 espacio reproduce/pausa \u00b7 arrastra la l\u00ednea de tiempo")),
      G.siteFooter());
    G.mount(root, wrap);
    switchTo(tabs.current());
    return function () { current.destroy(); };
  }

  G.pages = G.pages || {};
  G.pages["modulo-06"] = page;

})(window.GUIA = window.GUIA || {});
