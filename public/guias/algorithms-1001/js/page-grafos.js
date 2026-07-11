/* ============================================================================
   page-grafos.js — Módulo 05 · Grafos. Pestañas: representación / BFS / DFS /
   topológico / Dijkstra / A* / MST. Motor de frames de components.js; el sim
   de representación y A* son editores interactivos. Registra pages["modulo-05"].
   ========================================================================== */
(function (G) {
  "use strict";
  var h = G.h;

  function cxBlock(html) {
    var panel = h("div.well.cx-panel", { style: { display: "none" } }); panel.innerHTML = html;
    var open = false;
    var toggle = G.togglePill({ pressed: false, icon: "\u03a3", label: "Ver complejidad", onClick: function () {
      open = !open; toggle.setAttribute("aria-pressed", open ? "true" : "false"); panel.style.display = open ? "" : "none"; } });
    return { toggle: toggle, panel: panel };
  }
  function narrHosts() { return { note: h("p.narr-note"), stats: h("div.well.stat-row") }; }
  function adjacency(graph, directed) {
    var adj = {}; graph.nodes.forEach(function (n) { adj[n.id] = []; });
    graph.edges.forEach(function (e) { adj[e.u].push({ to: e.v, w: e.w }); if (!directed) adj[e.v].push({ to: e.u, w: e.w }); });
    Object.keys(adj).forEach(function (k) { adj[k].sort(function (a, b) { return a.to < b.to ? -1 : 1; }); });
    return adj;
  }
  function ekey(u, v) { return [u, v].sort().join("-"); }
  function fbBanner(host, correct, body) {
    G.clear(host);
    host.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"), h("span.fb-glyph", correct ? "\u2713" : "\u25C6"), h("p.fb-text", body)));
  }
  function graphStage(graphHost, sideHost) {
    return h("div.graph-grid", h("div.well.notebook-lines", { style: { padding: "8px" } }, graphHost), sideHost);
  }

  /* ===================================================================== */
  /* 05-a · REPRESENTACIÓN (editor interactivo, sin timeline)              */
  /* ===================================================================== */
  function renderRepr(mountEl) {
    var C = G.DATA.sims["grafo-repr"], NODES = G.DATA.graphs.GRAPH_W.nodes, IDS = NODES.map(function (n) { return n.id; });
    var stx = { directed: false, weighted: false, edges: G.DATA.graphs.GRAPH_W.edges.map(function (e) { return { u: e.u, v: e.v, w: e.w }; }), sel: null, quiz: null, fb: null };
    var graphHost = h("div"), matrixHost = h("div.well", { style: { padding: "12px 14px" } }), listHost = h("div.well", { style: { padding: "12px 14px" } });
    var quizHost = h("div.quiz-host"), noteEl = h("p.narr-note"), statsHost = h("div.well.stat-row");
    var cx = cxBlock("<table class=\"cx\"><thead><tr><th></th><th>matriz</th><th>lista</th></tr></thead><tbody>" +
      "<tr><td>espacio</td><td class=\"mono\" style=\"color:var(--st-out)\">O(V\u00b2)</td><td class=\"mono\" style=\"color:var(--st-done)\">O(V+E)</td></tr>" +
      "<tr><td>\u00bfhay arista u\u2013v?</td><td class=\"mono\" style=\"color:var(--st-done)\">O(1)</td><td class=\"mono\" style=\"color:var(--st-out)\">O(grado)</td></tr>" +
      "<tr><td>recorrer vecinos de u</td><td class=\"mono\">O(V)</td><td class=\"mono\" style=\"color:var(--st-done)\">O(grado)</td></tr></tbody></table>" +
      "<p class=\"faint\" style=\"font-size:11.5px;margin:8px 2px 0\">Misma simetr\u00eda que arreglo vs lista (4.1): la matriz es buena para grafos densos, la lista para dispersos. BFS y DFS son O(V+E) justamente porque usan listas.</p>");

    function has(u, v) { return stx.edges.find(function (e) { return (e.u === u && e.v === v) || (!stx.directed && e.u === v && e.v === u); }); }
    function toggle(u, v) { if (u === v) return; var ex = has(u, v); if (ex) stx.edges = stx.edges.filter(function (e) { return e !== ex; }); else stx.edges.push({ u: u, v: v, w: ((IDS.indexOf(u) + IDS.indexOf(v)) % 8) + 2 }); stx.sel = null; render(); }
    function render() {
      var graph = { nodes: NODES, edges: stx.edges };
      var edgeStates = stx.sel ? (function () { var o = {}; o[stx.sel.u + "-" + stx.sel.v] = "active"; return o; })() : {};
      var nodeStates = stx.sel ? (function () { var o = {}; o[stx.sel.u] = "cand"; o[stx.sel.v] = "cand"; return o; })() : {};
      G.mount(graphHost, G.graphView({ graph: graph, directed: stx.directed, weighted: stx.weighted, nodeStates: nodeStates, edgeStates: edgeStates, height: 250, onEdgeClick: function (e) { stx.sel = { u: e.u, v: e.v }; render(); } }));
      // matriz
      G.clear(matrixHost);
      matrixHost.appendChild(h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "8px" } }, "Matriz de adyacencia \u00b7 V\u00d7V"));
      var thead = h("tr", h("th")); IDS.forEach(function (c) { thead.appendChild(h("th.mx-h", c)); });
      var tb = h("tbody");
      IDS.forEach(function (rId) {
        var tr = h("tr", h("th.mx-h", rId));
        IDS.forEach(function (cId) {
          var e = has(rId, cId), isSel = stx.sel && ((stx.sel.u === rId && stx.sel.v === cId) || (!stx.directed && stx.sel.u === cId && stx.sel.v === rId)), diag = rId === cId;
          tr.appendChild(h("td.mx-cell", { style: { background: diag ? "var(--paper-deep)" : isSel ? "rgba(224,169,59,0.25)" : e ? "rgba(62,124,177,0.12)" : "var(--card)", color: e ? "var(--ink)" : "var(--ink-faint)", fontWeight: e ? "600" : "400" }, onClick: function () { toggle(rId, cId); } }, diag ? "\u00b7" : e ? (stx.weighted ? e.w : 1) : 0));
        });
        tb.appendChild(tr);
      });
      matrixHost.appendChild(h("table.mx-table", h("thead", thead), tb));
      // lista
      G.clear(listHost);
      listHost.appendChild(h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "8px" } }, "Lista de adyacencia \u00b7 libreta por nodo"));
      var listBody = h("div", { style: { display: "flex", flexDirection: "column", gap: "5px" } });
      IDS.forEach(function (id) {
        var nbrs = stx.edges.filter(function (e) { return e.u === id || (!stx.directed && e.v === id); }).map(function (e) { return { to: e.u === id ? e.v : e.u, w: e.w }; });
        var chips = h("div", { style: { display: "flex", gap: "5px", flexWrap: "wrap" } });
        if (!nbrs.length) chips.appendChild(h("span.faint", "\u2205"));
        else nbrs.forEach(function (nb) { var isSel = stx.sel && ((stx.sel.u === id && stx.sel.v === nb.to) || (stx.sel.v === id && stx.sel.u === nb.to)); chips.appendChild(h("span.adj-chip", { style: { border: "1px solid " + (isSel ? "var(--st-active)" : "var(--line)"), background: isSel ? "rgba(224,169,59,0.18)" : "var(--card)" } }, nb.to + (stx.weighted ? "\u00b7" + nb.w : ""))); });
        listBody.appendChild(h("div.adj-row", h("span.adj-id", id), h("span", { style: { color: "var(--ink-faint)" } }, "\u2192"), chips));
      });
      listHost.appendChild(listBody);
      // quiz
      G.clear(quizHost);
      if (stx.quiz) {
        var panel = h("div.well.ask-panel",
          h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
          h("p.ask-q", ["\u00bfExiste una arista entre ", h("b.mono", stx.quiz.u), " y ", h("b.mono", stx.quiz.v), "?"]),
          h("div.ask-btns", h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer(true); } }, "S\u00ed"), h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer(false); } }, "No")));
        if (stx.fb) panel.appendChild(h("p", { style: { fontSize: "13px", marginTop: "12px", color: stx.fb.correct ? "var(--st-done)" : "var(--st-active)" } }, (stx.fb.correct ? "\u2713 " : "\u25C6 ") + (stx.fb.real ? "S\u00ed existe" : "No existe") + ". En la matriz fue mirar una celda (O(1)); en la lista, recorrer la libreta de " + stx.quiz.u + " (O(grado))."));
        quizHost.appendChild(panel);
      }
      // narración
      noteEl.textContent = stx.sel ? ("Arista " + stx.sel.u + "\u2013" + stx.sel.v + " resaltada: aparece en la celda (" + stx.sel.u + "," + stx.sel.v + ") de la matriz y en la libreta de " + stx.sel.u + (stx.directed ? "" : " y de " + stx.sel.v) + ".") : "Toca una arista del grafo, o una celda de la matriz para agregar/quitar. Cambia entre dirigido/ponderado y mira c\u00f3mo reaccionan ambas representaciones.";
      G.clear(statsHost);
      statsHost.appendChild(G.stat("nodos (V)", NODES.length, "var(--st-cand)"));
      statsHost.appendChild(G.stat("aristas (E)", stx.edges.length, "var(--st-cand)"));
      statsHost.appendChild(G.stat("tipo", (stx.directed ? "dirigido" : "no dirigido") + (stx.weighted ? " \u00b7 ponderado" : "")));
      dirBtn.lastChild.textContent = " " + (stx.directed ? "dirigido" : "no dirigido"); dirBtn.setAttribute("aria-pressed", stx.directed ? "true" : "false");
      wBtn.lastChild.textContent = " " + (stx.weighted ? "ponderado" : "sin peso"); wBtn.setAttribute("aria-pressed", stx.weighted ? "true" : "false");
    }
    function ask() { var u = IDS[Math.floor(Math.random() * IDS.length)], v = u; while (v === u) v = IDS[Math.floor(Math.random() * IDS.length)]; stx.quiz = { u: u, v: v }; stx.fb = null; stx.sel = null; render(); }
    function answer(yes) { var real = !!has(stx.quiz.u, stx.quiz.v); stx.fb = { correct: yes === real, real: real }; stx.sel = { u: stx.quiz.u, v: stx.quiz.v }; render(); }
    var dirBtn = G.togglePill({ pressed: false, label: "no dirigido", onClick: function () { stx.directed = !stx.directed; stx.sel = null; render(); } });
    var wBtn = G.togglePill({ pressed: false, label: "sin peso", onClick: function () { stx.weighted = !stx.weighted; render(); } });

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card", dirBtn, wBtn,
        h("span.mono.faint", { style: { fontSize: "11px" } }, "\u00b7 clic en una arista para resaltarla \u00b7 clic en la matriz para agregar/quitar"),
        h("span", { style: { flex: "1" } }), h("button.pill", { type: "button", onClick: ask }, "\u25CE \u00bfhay arista?")),
      h("section.card", { style: { padding: "18px 20px", marginBottom: "16px" } },
        h("div.graph-grid", h("div.well.notebook-lines", { style: { padding: "8px 8px 2px" } }, h("div.eyebrow", { style: { fontSize: "10px", padding: "4px 0 0 8px" } }, "Grafo"), graphHost),
          h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, matrixHost, listHost)),
        quizHost),
      h("section.card.narr-card",
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        noteEl, statsHost, h("div.narr-toggles", cx.toggle), cx.panel));
    render();
    G.mount(mountEl, view);
    return { destroy: function () {} };
  }

  /* ===================================================================== */
  /* Helper para sims con timeline + grafo + panel lateral                 */
  /* ===================================================================== */
  function timelineGraphSim(mountEl, cfg) {
    // cfg: { C, inputRow(reload), build()->frames, needAsk(i,frame), askPanel(i,frame,answerFn),
    //        renderStage(frame, graphHost, sideHost), stats(frame), legendKeys, height }
    var C = cfg.C;
    var graphHost = h("div"), sideHost = h("div.graph-side");
    var askHost = h("div.ask-host"), fbHost = h("div.fb-host");
    var nh = narrHosts(); var cx = cxBlock(C.cx);
    var timeline = G.createTimeline({
      canAdvance: function (i) { return !cfg.needAsk(i, timeline.frame()); },
      onBlocked: function (i) { showAsk(i); },
      onFrame: function (f) { G.clear(askHost); cfg.renderStage(f, graphHost, sideHost); nh.note.textContent = f.note; G.clear(nh.stats); cfg.stats(f).forEach(function (st) { if (st.spacer) nh.stats.appendChild(h("span", { style: { flex: "1" } })); else nh.stats.appendChild(G.stat(st.label, st.value, st.color)); }); },
    });
    function showAsk(i) { timeline.setDisabled(true); var panel = cfg.askPanel(i, timeline.frame(), function (correct, body) { fbBanner(fbHost, correct, body); timeline.setDisabled(false); G.clear(askHost); timeline.next(true); }); G.mount(askHost, panel); }
    var api = {
      timeline: timeline, fbHost: fbHost,
      reload: function (frames) { G.clear(fbHost); timeline.load(frames); },
    };
    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      cfg.inputRow(api),
      h("section.card", { style: { padding: "18px 20px", marginBottom: "16px" } }, graphStage(graphHost, sideHost), askHost),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        nh.note, nh.stats, h("div.narr-toggles", cx.toggle), cx.panel));
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); }, api: api };
  }

  /* ===================================================================== */
  /* 05-b · BFS                                                            */
  /* ===================================================================== */
  function renderBFS(mountEl) {
    var C = G.DATA.sims.bfs, GR = G.DATA.graphs.GRAPH_W, IDS = GR.nodes.map(function (n) { return n.id; }), ADJ = adjacency(GR, false);
    function build(src, dst) {
      var F = [], dist = {}, par = {}, vis = {}, inq = {}; dist[src] = 0; inq[src] = true; var queue = [src], eState = {};
      function states() { var s = {}; IDS.forEach(function (id) { s[id] = vis[id] ? "path" : inq[id] ? "cand" : "neutral"; }); s[src] = vis[src] ? "path" : "cand"; return s; }
      function badges() { var b = {}; IDS.forEach(function (id) { if (dist[id] != null) b[id] = "d" + dist[id]; }); return b; }
      function snap(note, active, decision) { F.push({ queue: queue.slice(), states: states(), badges: badges(), edgeStates: Object.assign({}, eState), note: note, active: active || null, decision: !!decision, answer: queue[0], phase: "run" }); }
      snap("BFS desde " + src + " hacia " + dst + ". Encolamos el origen con distancia 0. La cola decide el orden: primero en entrar, primero en salir.", src);
      while (queue.length) {
        var u = queue[0];
        snap("Al frente de la cola est\u00e1 " + u + " (distancia " + dist[u] + "). Es el pr\u00f3ximo en salir.", u, true);
        queue.shift(); vis[u] = true; var added = [];
        ADJ[u].forEach(function (o) { var w = o.to; if (!vis[w] && !inq[w]) { dist[w] = dist[u] + 1; par[w] = u; inq[w] = true; queue.push(w); eState[u + "-" + w] = "cand"; added.push(w); } });
        snap("Sale " + u + ": lo marco visitado. " + (added.length ? "Encolo sus vecinos nuevos (" + added.join(", ") + ") a distancia " + (dist[u] + 1) + "." : "No tiene vecinos nuevos."), u);
        if (u === dst) break;
      }
      if (dist[dst] != null) {
        var path = [], c = dst; while (c != null) { path.push(c); c = par[c]; } path.reverse();
        var es = {}; for (var i = 0; i < path.length - 1; i++) es[path[i] + "-" + path[i + 1]] = "path";
        var st = {}; IDS.forEach(function (id) { st[id] = vis[id] ? "path" : "neutral"; }); path.forEach(function (id) { st[id] = "done"; }); st[src] = "goal"; st[dst] = "goal";
        F.push({ queue: [], states: st, badges: badges(), edgeStates: es, note: "Camino m\u00e1s corto " + src + " \u2192 " + dst + ": " + path.join(" \u2192 ") + " (" + (path.length - 1) + " saltos). BFS lo garantiza porque explora en orden de distancia.", active: null, phase: "done" });
      } else F.push({ queue: [], states: states(), badges: badges(), edgeStates: eState, note: dst + " no es alcanzable desde " + src + ".", active: null, phase: "done" });
      return F;
    }
    var stx = { src: "A", dst: "F", practice: true, answered: {} };
    var sim = timelineGraphSim(mountEl, {
      C: C,
      needAsk: function (i, f) { return stx.practice && f && f.decision && f.queue.length > 1 && !stx.answered[i]; },
      askPanel: function (i, f, done) {
        var btns = h("div.ask-btns"); f.queue.forEach(function (q) { btns.appendChild(h("button.ctrl.ask-btn", { type: "button", style: { fontFamily: "var(--mono)", fontWeight: "600" }, onClick: function () { stx.answered[i] = true; done(q === f.answer, q === f.answer ? ["Correcto: sale ", h("b.mono", f.answer), "."] : ["Sal\u00eda ", h("b.mono", f.answer), ": la cola es FIFO, sale el que est\u00e1 al frente."]); } }, q)); });
        return h("div.well.ask-panel", h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"), h("p.ask-q", "\u00bfQu\u00e9 nodo sale ahora de la cola?"), btns);
      },
      renderStage: function (f, graphHost, sideHost) {
        G.mount(graphHost, G.graphView({ graph: GR, nodeStates: f.states, edgeStates: f.edgeStates, badges: f.badges, activeId: f.active, height: 250 }));
        G.mount(sideHost, h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } }, G.queueView(f.queue, { note: "sale \u2190" }), G.stateLegend(["neutral", "cand", "path", "done"])));
      },
      stats: function (f) { return [{ label: "en cola", value: f.queue.length, color: "var(--st-cand)" }, { spacer: true }, { label: "recorrido", value: "O(V + E)", color: "var(--st-cand)" }]; },
      inputRow: function (api) {
        function reload() { stx.answered = {}; api.reload(build(stx.src, stx.dst)); }
        var srcSeg = h("div.seg"), dstSeg = h("div.seg"), srcB = {}, dstB = {};
        IDS.forEach(function (id) { srcB[id] = h("button", { type: "button", "aria-pressed": stx.src === id ? "true" : "false", style: { fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "600", padding: "0 10px" }, onClick: function () { stx.src = id; sync(); reload(); } }, id); srcSeg.appendChild(srcB[id]); dstB[id] = h("button", { type: "button", "aria-pressed": stx.dst === id ? "true" : "false", style: { fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "600", padding: "0 10px" }, onClick: function () { stx.dst = id; sync(); reload(); } }, id); dstSeg.appendChild(dstB[id]); });
        var pBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; api.timeline.setDisabled(false); pBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); } });
        function sync() { IDS.forEach(function (id) { srcB[id].setAttribute("aria-pressed", stx.src === id ? "true" : "false"); dstB[id].setAttribute("aria-pressed", stx.dst === id ? "true" : "false"); }); }
        setTimeout(reload, 0);
        return h("section.card.input-card", h("span.eyebrow", { style: { fontSize: "10px" } }, "origen"), srcSeg, h("span.eyebrow", { style: { fontSize: "10px" } }, "destino"), dstSeg, h("span", { style: { flex: "1" } }), pBtn);
      },
    });
    return sim;
  }

  /* ===================================================================== */
  /* 05-c · DFS                                                            */
  /* ===================================================================== */
  function renderDFS(mountEl) {
    var C = G.DATA.sims.dfs, GR = G.DATA.graphs.GRAPH_W, IDS = GR.nodes.map(function (n) { return n.id; }), ADJ = adjacency(GR, false);
    function bfsOrder(src) { var vis = {}; vis[src] = true; var q = [src], out = []; while (q.length) { var u = q.shift(); out.push(u); ADJ[u].forEach(function (o) { if (!vis[o.to]) { vis[o.to] = true; q.push(o.to); } }); } return out; }
    function build(src) {
      var F = [], vis = {}, stack = [], order = [], eState = {};
      function stateMap(active) { var s = {}; IDS.forEach(function (id) { s[id] = id === active ? "active" : stack.indexOf(id) >= 0 ? "cand" : vis[id] ? "path" : "neutral"; }); return s; }
      function snap(note, active, decision, options) { F.push({ stack: stack.slice(), states: stateMap(active), edgeStates: Object.assign({}, eState), order: order.slice(), note: note, active: active || null, decision: !!decision, options: options || [], phase: "run" }); }
      (function go(u) {
        vis[u] = true; stack.push(u); order.push(u);
        var un = ADJ[u].filter(function (e) { return !vis[e.to]; }).map(function (e) { return e.to; });
        snap("Visito " + u + " y lo apilo. DFS se hunde por una rama antes de retroceder." + (un.length ? "" : " No tiene vecinos sin visitar."), u);
        ADJ[u].forEach(function (o) { var w = o.to; if (!vis[w]) { var opts = ADJ[u].filter(function (e) { return !vis[e.to]; }).map(function (e) { return e.to; }); snap("Desde " + u + " bajo al vecino " + w + ".", w, true, opts); eState[u + "-" + w] = "cand"; go(w); } });
        stack.pop(); snap(u + " ya no tiene vecinos nuevos: retrocedo (backtrack) y lo desapilo.", u);
      })(src);
      var st = {}; IDS.forEach(function (id) { st[id] = vis[id] ? "path" : "neutral"; }); st[src] = "goal";
      F.push({ stack: [], states: st, edgeStates: eState, order: order.slice(), note: "DFS termin\u00f3. Orden de visita: " + order.join(" \u2192 ") + ". Se hunde hasta el fondo de cada rama y solo entonces retrocede.", active: null, phase: "done" });
      return F;
    }
    var stx = { src: "A", practice: true, cmp: false, answered: {} };
    var cmpHost = h("div.dfs-cmp-host");
    var sim = timelineGraphSim(mountEl, {
      C: C,
      needAsk: function (i, f) { return stx.practice && f && f.decision && f.options.length > 1 && !stx.answered[i]; },
      askPanel: function (i, f, done) {
        var btns = h("div.ask-btns"); f.options.forEach(function (o) { btns.appendChild(h("button.ctrl.ask-btn", { type: "button", style: { fontFamily: "var(--mono)", fontWeight: "600" }, onClick: function () { stx.answered[i] = true; done(o === f.active, o === f.active ? ["Correcto: baja a ", h("b.mono", f.active), "."] : ["Bajaba a ", h("b.mono", f.active), " (el primer vecino sin visitar)."]); } }, o)); });
        return h("div.well.ask-panel", h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"), h("p.ask-q", "\u00bfHacia qu\u00e9 vecino baja DFS ahora?"), btns);
      },
      renderStage: function (f, graphHost, sideHost) {
        G.mount(graphHost, G.graphView({ graph: GR, nodeStates: f.states, edgeStates: f.edgeStates, activeId: f.active, height: 250 }));
        G.mount(sideHost, h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } }, G.stackView(f.stack), G.stateLegend(["neutral", "cand", "active", "path"])));
        G.clear(cmpHost);
        if (stx.cmp) {
          function orderRow(label, order, color) { var box = h("div", h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "6px" } }, label), h("div", { style: { display: "flex", gap: "5px", flexWrap: "wrap" } }, order.map(function (id) { return h("span.mono.ord-chip", { style: { borderColor: color } }, id); }))); return box; }
          cmpHost.appendChild(h("div.card", { style: { padding: "12px 16px", marginBottom: "16px" } }, h("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px 24px" } }, orderRow("DFS (profundidad)", f.order && f.order.length ? f.order : [], "var(--st-path)"), orderRow("BFS (anchura)", bfsOrder(stx.src), "var(--st-cand)"))));
        }
      },
      stats: function (f) { return [{ label: "en pila", value: f.stack.length, color: "var(--st-active)" }, { spacer: true }, { label: "recorrido", value: "O(V + E)", color: "var(--st-cand)" }]; },
      inputRow: function (api) {
        function reload() { stx.answered = {}; api.reload(build(stx.src)); }
        var srcSeg = h("div.seg"), srcB = {};
        IDS.forEach(function (id) { srcB[id] = h("button", { type: "button", "aria-pressed": stx.src === id ? "true" : "false", style: { fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "600", padding: "0 10px" }, onClick: function () { stx.src = id; IDS.forEach(function (x) { srcB[x].setAttribute("aria-pressed", stx.src === x ? "true" : "false"); }); reload(); } }, id); srcSeg.appendChild(srcB[id]); });
        var pBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; api.timeline.setDisabled(false); pBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); } });
        var cmpBtn = G.togglePill({ pressed: false, label: "comparar con BFS", onClick: function () { stx.cmp = !stx.cmp; cmpBtn.setAttribute("aria-pressed", stx.cmp ? "true" : "false"); api.timeline.seek(api.timeline.index()); } });
        setTimeout(reload, 0);
        return h("div", h("section.card.input-card", h("span.eyebrow", { style: { fontSize: "10px" } }, "origen"), srcSeg, pBtn, h("span", { style: { flex: "1" } }), cmpBtn), cmpHost);
      },
    });
    return sim;
  }

  /* ===================================================================== */
  /* 05-d · TOPOLÓGICO (Kahn)                                              */
  /* ===================================================================== */
  function renderTopo(mountEl) {
    var C = G.DATA.sims.topo, DAG = G.DATA.graphs.DAG, IDS = DAG.nodes.map(function (n) { return n.id; });
    function build(edges) {
      var F = [], adj = {}, indeg = {}; IDS.forEach(function (id) { adj[id] = []; indeg[id] = 0; });
      edges.forEach(function (e) { adj[e.u].push(e.v); indeg[e.v]++; });
      var done = {}, out = [], removed = {}, ready = IDS.filter(function (id) { return indeg[id] === 0; }).sort();
      function states(active) { var s = {}; IDS.forEach(function (id) { s[id] = id === active ? "active" : done[id] ? "done" : ready.indexOf(id) >= 0 ? "cand" : "neutral"; }); return s; }
      function badges() { var b = {}; IDS.forEach(function (id) { if (!done[id]) b[id] = "in:" + indeg[id]; }); return b; }
      function eStates() { var s = {}; Object.keys(removed).forEach(function (k) { s[k] = "out"; }); return s; }
      function snap(note, active, decision) { F.push({ states: states(active), badges: badges(), edgeStates: eStates(), out: out.slice(), ready: ready.slice(), note: note, active: active || null, decision: !!decision, phase: "run" }); }
      snap("Orden topol\u00f3gico por el m\u00e9todo de Kahn. Cada nodo muestra su indegree (flechas que le entran). Empezamos por los que no dependen de nadie: indegree 0.", null);
      while (ready.length) {
        var u = ready[0];
        snap("Listos para salir (indegree 0): " + ready.join(", ") + ". Tomamos " + u + ".", u, true);
        ready = ready.slice(1); done[u] = true; out.push(u);
        adj[u].forEach(function (w) { indeg[w]--; removed[u + "-" + w] = true; if (indeg[w] === 0) ready.push(w); }); ready.sort();
        snap(u + " entra al orden y \"quita\" sus flechas salientes: baja el indegree de sus vecinos. " + (adj[u].length ? "Ahora con indegree 0: " + (ready.join(", ") || "ninguno nuevo") + "." : ""), u);
      }
      if (out.length < IDS.length) { var st = states(null); IDS.forEach(function (id) { if (!done[id]) st[id] = "out"; }); F.push({ states: st, badges: badges(), edgeStates: eStates(), out: out.slice(), ready: [], note: "Atascado: quedan nodos pero ninguno lleg\u00f3 a indegree 0 (" + IDS.filter(function (id) { return !done[id]; }).join(", ") + "). Eso significa que hay un ciclo \u2014 y un grafo con ciclo NO tiene orden topol\u00f3gico.", active: null, phase: "stuck" }); }
      else F.push({ states: states(null), badges: {}, edgeStates: eStates(), out: out.slice(), ready: [], note: "Orden topol\u00f3gico v\u00e1lido: " + out.join(" \u2192 ") + ". Cada nodo aparece despu\u00e9s de todo aquello de lo que depende. Si hab\u00eda empates, era solo uno de varios \u00f3rdenes posibles.", active: null, phase: "done" });
      return F;
    }
    var stx = { cycle: false, practice: true, answered: {} };
    var sim = timelineGraphSim(mountEl, {
      C: C,
      needAsk: function (i, f) { return stx.practice && f && f.decision && f.ready.length > 1 && !stx.answered[i]; },
      askPanel: function (i, f, done) {
        var btns = h("div.ask-btns"); f.ready.forEach(function (o) { btns.appendChild(h("button.ctrl.ask-btn", { type: "button", style: { fontFamily: "var(--mono)", fontWeight: "600" }, onClick: function () { stx.answered[i] = true; done(true, [(o === f.ready[0] ? ["Tomamos ", h("b.mono", f.ready[0]), ". "] : ["Tu elecci\u00f3n ", h("b.mono", o), " tambi\u00e9n ser\u00eda v\u00e1lida \u2014 "]), "cualquiera con indegree 0 da un orden topol\u00f3gico correcto. Ac\u00e1 se elige el primero alfab\u00e9tico."]); } }, o)); });
        return h("div.well.ask-panel", h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"), h("p.ask-q", ["Hay varios con indegree 0 (" + f.ready.join(", ") + "). El orden v\u00e1lido no es \u00fanico \u2014 \u00bfcu\u00e1l tomar\u00edas? (este algoritmo toma el primero alfab\u00e9tico)"]), btns);
      },
      renderStage: function (f, graphHost, sideHost) {
        var edges = stx.cycle ? DAG.edges.concat([{ u: "F", v: "A" }]) : DAG.edges;
        G.mount(graphHost, G.graphView({ graph: { nodes: DAG.nodes, edges: edges }, directed: true, nodeStates: f.states, edgeStates: f.edgeStates, badges: f.badges, activeId: f.active, height: 240 }));
        var outBox = h("div.well", { style: { padding: "12px 14px" } }, h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "8px" } }, "orden de salida"));
        var outRow = h("div", { style: { display: "flex", gap: "5px", flexWrap: "wrap", minHeight: "34px", alignItems: "center" } });
        if (!f.out.length) outRow.appendChild(h("span.faint", { style: { fontSize: "12px" } }, "\u2014"));
        else f.out.forEach(function (id, i) { outRow.appendChild(h("span.mono.topo-chip", id)); if (i < f.out.length - 1) outRow.appendChild(h("span", { style: { color: "var(--ink-faint)" } }, "\u2192")); });
        outBox.appendChild(outRow);
        G.mount(sideHost, h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } }, outBox, G.stateLegend(["neutral", "cand", "active", "done", "out"])));
      },
      stats: function (f) { return [{ label: "en el orden", value: f.out.length + " / " + IDS.length, color: "var(--st-done)" }, { label: "estado", value: f.phase === "stuck" ? "ciclo \u00b7 sin orden" : f.phase === "done" ? "completo" : "en curso", color: f.phase === "stuck" ? "var(--st-out)" : "var(--ink-faint)" }, { spacer: true }, { label: "Kahn", value: "O(V + E)", color: "var(--st-cand)" }]; },
      inputRow: function (api) {
        function reload() { stx.answered = {}; api.reload(build(stx.cycle ? DAG.edges.concat([{ u: "F", v: "A" }]) : DAG.edges)); }
        var pBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; api.timeline.setDisabled(false); pBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); } });
        var cycBtn = G.togglePill({ pressed: false, label: "introducir un ciclo", onClick: function () { stx.cycle = !stx.cycle; cycBtn.setAttribute("aria-pressed", stx.cycle ? "true" : "false"); cycBtn.lastChild.textContent = " " + (stx.cycle ? "ciclo: activo (F\u2192A)" : "introducir un ciclo"); reload(); } });
        setTimeout(reload, 0);
        return h("section.card.input-card", pBtn, h("span.mono.faint", { style: { fontSize: "11px" } }, "\u00b7 \"in:N\" = flechas entrantes"), h("span", { style: { flex: "1" } }), cycBtn);
      },
    });
    return sim;
  }

  /* ===================================================================== */
  /* 05-e · DIJKSTRA                                                       */
  /* ===================================================================== */
  function renderDijkstra(mountEl) {
    var C = G.DATA.sims.dijkstra, GR = G.DATA.graphs.GRAPH_W, IDS = GR.nodes.map(function (n) { return n.id; }), ADJ = adjacency(GR, false), INF = Infinity;
    function build(src) {
      var F = [], dist = {}, par = {}, vis = {}; IDS.forEach(function (id) { dist[id] = INF; }); dist[src] = 0;
      function dl(d) { return d === INF ? "\u221e" : String(d); }
      function states(active, relaxing) { var s = {}; IDS.forEach(function (id) { s[id] = id === active ? "active" : vis[id] ? "path" : (relaxing && relaxing.indexOf(id) >= 0) ? "cand" : dist[id] < INF ? "cand" : "neutral"; }); return s; }
      function badges() { var b = {}; IDS.forEach(function (id) { b[id] = dl(dist[id]); }); return b; }
      function table() { return IDS.map(function (id) { return { id: id, d: dl(dist[id]), vis: !!vis[id] }; }).sort(function (a, b) { return (a.d === "\u221e" ? 1e9 : +a.d) - (b.d === "\u221e" ? 1e9 : +b.d); }); }
      function snap(note, active, decision, relaxing) { F.push({ states: states(active, relaxing), badges: badges(), table: table(), note: note, active: active || null, decision: !!decision, phase: "run", pq: IDS.filter(function (id) { return !vis[id] && dist[id] < INF; }).sort(function (a, b) { return dist[a] - dist[b]; }) }); }
      snap("Dijkstra desde " + src + ". Cada nodo tiene una distancia tentativa: 0 el origen, \u221e los dem\u00e1s. En cada paso visitamos el no-visitado m\u00e1s cercano.", null);
      for (var it = 0; it < IDS.length; it++) {
        var u = null, best = INF; IDS.forEach(function (id) { if (!vis[id] && dist[id] < best) { best = dist[id]; u = id; } });
        if (u == null) break;
        snap("El no-visitado con menor distancia es " + u + " (" + dl(dist[u]) + "). Como los pesos son \u2265 0, su distancia ya es definitiva.", u, true);
        vis[u] = true; var relaxed = [];
        (function (u) { ADJ[u].forEach(function (o) { var w = o.to, wt = o.w; if (!vis[w] && dist[u] + wt < dist[w]) { dist[w] = dist[u] + wt; par[w] = u; relaxed.push(w); } }); })(u);
        snap("Marco " + u + " visitado y relajo sus vecinos: si llegar v\u00eda " + u + " es m\u00e1s corto, actualizo su etiqueta. " + (relaxed.length ? "Mejoraron: " + relaxed.join(", ") + "." : "Ninguno mejor\u00f3."), u, false, relaxed);
      }
      var st = {}; IDS.forEach(function (id) { st[id] = vis[id] ? "path" : "neutral"; }); st[src] = "goal";
      F.push({ states: st, badges: badges(), table: table(), note: "Listo. Las etiquetas son las distancias m\u00ednimas desde " + src + ". Dijkstra funciona porque, sin pesos negativos, el m\u00e1s cercano no-visitado nunca puede mejorarse despu\u00e9s.", active: null, phase: "done", pq: [] });
      return F;
    }
    var stx = { src: "A", practice: true, answered: {} };
    var sim = timelineGraphSim(mountEl, {
      C: C,
      needAsk: function (i, f) { return stx.practice && f && f.decision && f.pq.length > 1 && !stx.answered[i]; },
      askPanel: function (i, f, done) {
        var btns = h("div.ask-btns"); f.pq.forEach(function (o) { btns.appendChild(h("button.ctrl.ask-btn", { type: "button", style: { fontFamily: "var(--mono)", fontWeight: "600" }, onClick: function () { stx.answered[i] = true; done(o === f.pq[0], o === f.pq[0] ? ["Correcto: ", h("b.mono", f.pq[0]), ", el de menor distancia."] : ["Se visita ", h("b.mono", f.pq[0]), ": siempre el no-visitado m\u00e1s cercano."]); } }, o)); });
        return h("div.well.ask-panel", h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"), h("p.ask-q", "\u00bfQu\u00e9 nodo se visita ahora (el no-visitado de menor distancia)?"), btns);
      },
      renderStage: function (f, graphHost, sideHost) {
        G.mount(graphHost, G.graphView({ graph: GR, weighted: true, nodeStates: f.states, badges: f.badges, activeId: f.active, height: 250 }));
        var tbl = h("table.pq-table", h("thead", h("tr", h("th", { style: { textAlign: "left" } }, "nodo"), h("th", { style: { textAlign: "right" } }, "dist"), h("th", { style: { textAlign: "right" } }, "estado"))));
        var tb = h("tbody");
        f.table.forEach(function (r) { tb.appendChild(h("tr", { style: { background: f.active === r.id ? "rgba(224,169,59,0.14)" : "transparent" } }, h("td", { style: { fontWeight: "600" } }, r.id), h("td", { style: { textAlign: "right" } }, r.d), h("td", { style: { textAlign: "right", color: r.vis ? "var(--st-path)" : "var(--ink-faint)" } }, r.vis ? "\u2713 visitado" : "\u2014"))); });
        tbl.appendChild(tb);
        G.mount(sideHost, h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } }, h("div.well", { style: { padding: "12px 14px" } }, h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "8px" } }, "cola de prioridad \u00b7 por distancia"), tbl), G.stateLegend(["neutral", "cand", "active", "path"])));
      },
      stats: function (f) { return [{ label: "en la cola", value: f.pq.length, color: "var(--st-cand)" }, { spacer: true }, { label: "con cola de prioridad", value: "O((V+E) log V)", color: "var(--st-cand)" }]; },
      inputRow: function (api) {
        function reload() { stx.answered = {}; api.reload(build(stx.src)); }
        var srcSeg = h("div.seg"), srcB = {};
        IDS.forEach(function (id) { srcB[id] = h("button", { type: "button", "aria-pressed": stx.src === id ? "true" : "false", style: { fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "600", padding: "0 10px" }, onClick: function () { stx.src = id; IDS.forEach(function (x) { srcB[x].setAttribute("aria-pressed", stx.src === x ? "true" : "false"); }); reload(); } }, id); srcSeg.appendChild(srcB[id]); });
        var pBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; api.timeline.setDisabled(false); pBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); } });
        setTimeout(reload, 0);
        return h("section.card.input-card", h("span.eyebrow", { style: { fontSize: "10px" } }, "origen"), srcSeg, pBtn);
      },
    });
    return sim;
  }

  /* ===================================================================== */
  /* 05-f · A* (editor de grilla)                                          */
  /* ===================================================================== */
  function renderAstar(mountEl) {
    var C = G.DATA.sims.astar, ROWS = 8, COLS = 12;
    function key(r, c) { return r + "," + c; }
    function build(wallSet, start, goal, heurMode) {
      var F = [];
      function heur(r, c) { return heurMode === "zero" ? 0 : Math.abs(r - goal[0]) + Math.abs(c - goal[1]); }
      var g = {}, fpar = {}, hh = {}, open = {}, closed = {};
      var sK = key(start[0], start[1]); g[sK] = 0; hh[sK] = heur(start[0], start[1]); open[sK] = true;
      function fOf(k) { return g[k] + hh[k]; }
      function snap(note, current, path, phase) { F.push({ g: Object.assign({}, g), h: Object.assign({}, hh), open: Object.keys(open), closed: Object.keys(closed), current: current || null, path: path || null, note: note, phase: phase || "run" }); }
      snap("A* desde origen \u25CE hasta meta \u25CE. Cada celda explorada guarda g (costo desde el origen), h (estimaci\u00f3n a la meta) y f = g + h. La frontera crece priorizando f bajo.", null);
      var guard = 0;
      while (Object.keys(open).length && guard++ < 400) {
        var cur = null, bf = Infinity, bh = Infinity;
        Object.keys(open).forEach(function (k) { var f = fOf(k); if (f < bf || (f === bf && hh[k] < bh)) { bf = f; bh = hh[k]; cur = k; } });
        var parts = cur.split(",").map(Number), cr = parts[0], cc = parts[1];
        if (cur === key(goal[0], goal[1])) { var path = [], p = cur; while (p != null) { path.push(p); p = fpar[p]; } path.reverse(); snap("Llegamos a la meta con costo " + g[cur] + ". Reconstruyo el camino siguiendo los padres.", cur, path, "done"); return F; }
        snap("De la frontera tomo la celda de menor f = " + fOf(cur) + " (g=" + g[cur] + ", h=" + hh[cur] + "). La expando.", cur, null);
        delete open[cur]; closed[cur] = true;
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) { var nr = cr + d[0], nc = cc + d[1], nk = key(nr, nc); if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS || wallSet[nk] || closed[nk]) return; var tg = g[cur] + 1; if (!(nk in g) || tg < g[nk]) { g[nk] = tg; hh[nk] = heur(nr, nc); fpar[nk] = cur; open[nk] = true; } });
        snap("Sus vecinos transitables entran (o mejoran) en la frontera, con g+1 desde " + cur + ".", cur, null);
      }
      snap("La frontera se vaci\u00f3 sin llegar a la meta: no hay camino (las paredes la bloquean).", null, null, "fail");
      return F;
    }
    var stx = { walls: (function () { var s = {}; for (var r = 1; r <= 5; r++) s[key(r, 6)] = true; return s; })(), start: [3, 1], goal: [3, 10], mode: "wall", heur: "manhattan" };
    var gridHost = h("div.well", { style: { padding: "14px 10px", display: "flex", justifyContent: "center" } });
    var nh = narrHosts(); var cx = cxBlock(C.cx);
    var painting = false;
    function paint(r, c) {
      var k = key(r, c);
      if (stx.mode === "start") { if (!stx.walls[k] && k !== key(stx.goal[0], stx.goal[1])) stx.start = [r, c]; }
      else if (stx.mode === "goal") { if (!stx.walls[k] && k !== key(stx.start[0], stx.start[1])) stx.goal = [r, c]; }
      else { if (k === key(stx.start[0], stx.start[1]) || k === key(stx.goal[0], stx.goal[1])) return; if (stx.walls[k]) delete stx.walls[k]; else stx.walls[k] = true; }
      reload();
    }
    function cellData(f, r, c) {
      var k = key(r, c), openSet = {}, closedSet = {}, pathSet = {};
      f.open.forEach(function (x) { openSet[x] = 1; }); f.closed.forEach(function (x) { closedSet[x] = 1; }); (f.path || []).forEach(function (x) { pathSet[x] = 1; });
      var isStart = k === key(stx.start[0], stx.start[1]), isGoal = k === key(stx.goal[0], stx.goal[1]);
      function gv() { return f.g[k] != null ? f.g[k] + f.h[k] : null; }
      if (stx.walls[k]) return { bg: "#4b4034", border: "#3a3026" };
      if (isStart || isGoal) return { bg: "rgba(123,94,167,0.18)", border: "var(--st-goal)", mark: "\u25CE", markColor: "var(--st-goal)" };
      if (pathSet[k]) return { bg: "rgba(46,139,139,0.28)", border: "var(--st-path)", fg: "var(--ink)", f: gv(), g: f.g[k], h: f.h[k] };
      if (f.current === k) return { bg: "rgba(224,169,59,0.30)", border: "var(--st-active)", fg: "var(--ink)", f: gv(), g: f.g[k], h: f.h[k] };
      if (closedSet[k]) return { bg: "rgba(46,139,139,0.13)", border: "var(--line)", fg: "var(--ink-soft)", f: gv(), g: f.g[k], h: f.h[k] };
      if (openSet[k]) return { bg: "rgba(62,124,177,0.13)", border: "var(--st-cand)", fg: "var(--ink)", f: gv(), g: f.g[k], h: f.h[k] };
      return { bg: "var(--card)", border: "var(--line)" };
    }
    function renderGrid(f) {
      var grid = h("div.astar-grid", { style: { gridTemplateColumns: "repeat(" + COLS + ", 30px)" } });
      grid.addEventListener("mouseup", function () { painting = false; });
      grid.addEventListener("mouseleave", function () { painting = false; });
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) (function (r, c) {
        var cd = cellData(f, r, c);
        var cell = h("div.astar-cell", { style: { border: "1px solid " + (cd.border || "var(--line)"), background: cd.bg, color: cd.fg || "var(--ink-soft)", cursor: "crosshair" },
          onMousedown: function () { painting = true; paint(r, c); }, onMouseenter: function () { if (painting) paint(r, c); } });
        if (cd.mark) cell.appendChild(h("span", { style: { fontSize: "15px", color: cd.markColor } }, cd.mark));
        else if (cd.f != null) { cell.appendChild(h("span", { style: { fontWeight: "700", fontSize: "11px", color: cd.fg } }, String(cd.f))); cell.appendChild(h("span", { style: { fontSize: "7.5px" } }, cd.g + "+" + cd.h)); }
        grid.appendChild(cell);
      })(r, c);
      G.mount(gridHost, grid);
    }
    var timeline = G.createTimeline({ onFrame: function (f) {
      renderGrid(f);
      nh.note.textContent = f.note;
      G.clear(nh.stats);
      nh.stats.appendChild(G.stat("frontera (abierta)", f.open.length, "var(--st-cand)"));
      nh.stats.appendChild(G.stat("exploradas (cerradas)", f.closed.length, "var(--st-path)"));
      nh.stats.appendChild(h("span", { style: { flex: "1" } }));
      nh.stats.appendChild(G.stat("heur\u00edstica", stx.heur === "zero" ? "cero" : "Manhattan"));
    } });
    function reload() { timeline.load(build(stx.walls, stx.start, stx.goal, stx.heur)); syncInputs(); }
    var modeSeg = h("div.seg"), modeBtns = {}; [["wall", "pared"], ["start", "origen"], ["goal", "meta"]].forEach(function (m) { modeBtns[m[0]] = h("button", { type: "button", style: { fontFamily: "var(--sans)", fontSize: "12px", fontWeight: "600", padding: "0 12px" }, onClick: function () { stx.mode = m[0]; syncInputs(); } }, m[1]); modeSeg.appendChild(modeBtns[m[0]]); });
    var heurSeg = h("div.seg"), heurBtns = {}; [["manhattan", "Manhattan (A*)"], ["zero", "cero (= Dijkstra)"]].forEach(function (m) { heurBtns[m[0]] = h("button", { type: "button", style: { fontFamily: "var(--sans)", fontSize: "12px", fontWeight: "600", padding: "0 12px" }, onClick: function () { stx.heur = m[0]; reload(); } }, m[1]); heurSeg.appendChild(heurBtns[m[0]]); });
    function syncInputs() { Object.keys(modeBtns).forEach(function (k) { modeBtns[k].setAttribute("aria-pressed", stx.mode === k ? "true" : "false"); }); Object.keys(heurBtns).forEach(function (k) { heurBtns[k].setAttribute("aria-pressed", stx.heur === k ? "true" : "false"); }); }

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        h("span.eyebrow", { style: { fontSize: "10px" } }, "pincel"), modeSeg,
        h("span.eyebrow", { style: { fontSize: "10px" } }, "heur\u00edstica"), heurSeg,
        h("span", { style: { flex: "1" } }), h("button.pill", { type: "button", onClick: function () { stx.walls = {}; reload(); } }, "limpiar paredes")),
      h("section.card", { style: { padding: "18px 20px 14px", marginBottom: "16px" } }, gridHost,
        h("p.faint", { style: { fontSize: "11.5px", margin: "10px 2px 0" } }, "Clic/arrastre para dibujar paredes. Cambia el pincel para mover origen/meta. Cada celda muestra f grande y g+h chico.")),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card",
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        nh.note, nh.stats, h("div.narr-toggles", cx.toggle), cx.panel));
    reload();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  /* 05-g · MST (Kruskal / Prim)                                           */
  /* ===================================================================== */
  function renderMST(mountEl) {
    var C = G.DATA.sims.mst, GR = G.DATA.graphs.GRAPH_W, IDS = GR.nodes.map(function (n) { return n.id; });
    function buildKruskal() {
      var F = [], edges = GR.edges.map(function (e) { return { u: e.u, v: e.v, w: e.w }; }).sort(function (a, b) { return a.w - b.w; });
      var par = {}; IDS.forEach(function (id) { par[id] = id; });
      function find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
      var eStates = {}, treeNodes = {}, total = 0, accepted = 0;
      function badges() { var b = {}; IDS.forEach(function (id) { b[id] = find(id); }); return b; }
      function nstates(a, b2, active) { var s = {}; IDS.forEach(function (id) { s[id] = treeNodes[id] ? "path" : "neutral"; }); if (active) { s[a] = "active"; s[b2] = "active"; } return s; }
      function snap(note, eS, a, b2, decision, edge) { F.push({ edgeStates: Object.assign({}, eStates, eS), nodeStates: nstates(a, b2, !!eS), badges: badges(), note: note, total: total, accepted: accepted, decision: !!decision, edge: edge || null, phase: "run" }); }
      snap("Kruskal ordena todas las aristas por peso y las considera de menor a mayor. Acepta una si conecta dos componentes distintos; si formar\u00eda ciclo, la descarta. (Las etiquetas muestran el componente de cada nodo: Union-Find.)");
      for (var i = 0; i < edges.length; i++) {
        var e = edges[i], ra = find(e.u), rb = find(e.v), cycle = ra === rb;
        var o = {}; o[ekey(e.u, e.v)] = "active";
        snap("Considero " + e.u + "\u2013" + e.v + " (peso " + e.w + "). " + e.u + " est\u00e1 en el componente " + ra + ", " + e.v + " en " + rb + ".", o, e.u, e.v, true, Object.assign({}, e, { willCycle: cycle }));
        if (!cycle) { par[ra] = rb; treeNodes[e.u] = treeNodes[e.v] = true; total += e.w; accepted++; eStates[ekey(e.u, e.v)] = "done"; snap("Distintos componentes: la acepto. Se fusionan en uno (peso total " + total + ").", {}, e.u, e.v); }
        else { eStates[ekey(e.u, e.v)] = "out"; snap("Mismo componente: aceptarla cerrar\u00eda un ciclo. La descarto.", {}, e.u, e.v); }
        if (accepted === IDS.length - 1) break;
      }
      F.push({ edgeStates: Object.assign({}, eStates), nodeStates: nstates(null, null, false), badges: {}, note: "\u00c1rbol de expansi\u00f3n m\u00ednima completo: " + accepted + " aristas, peso total " + total + ". Conecta todos los nodos con el m\u00ednimo peso y sin ciclos.", total: total, accepted: accepted, phase: "done" });
      return F;
    }
    function buildPrim(start) {
      var F = [], adj = adjacency(GR, false), inTree = {}; inTree[start] = true; var eStates = {}, total = 0, accepted = 0;
      function frontier() { var fr = []; IDS.forEach(function (u) { if (inTree[u]) adj[u].forEach(function (o) { if (!inTree[o.to]) fr.push({ u: u, v: o.to, w: o.w }); }); }); return fr.sort(function (a, b) { return a.w - b.w; }); }
      function nstates(active) { var s = {}; IDS.forEach(function (id) { s[id] = inTree[id] ? "path" : "neutral"; }); if (active) { s[active.u] = "path"; s[active.v] = "active"; } return s; }
      function eFrontier() { var s = Object.assign({}, eStates); frontier().forEach(function (e) { if (s[ekey(e.u, e.v)] !== "done") s[ekey(e.u, e.v)] = "cand"; }); return s; }
      function snap(note, decision, active, fr) { F.push({ edgeStates: active ? Object.assign({}, eStates, (function () { var o = {}; o[ekey(active.u, active.v)] = "active"; return o; })()) : eFrontier(), nodeStates: nstates(active), badges: {}, note: note, total: total, accepted: accepted, decision: !!decision, frontier: fr || [], phase: "run" }); }
      snap("Prim hace crecer un solo \u00e1rbol desde " + start + ". En cada paso mira la \"frontera\": las aristas que salen del \u00e1rbol hacia un nodo nuevo (azul), y toma la m\u00e1s barata.", false, null, []);
      while (Object.keys(inTree).length < IDS.length) {
        var fr = frontier(); if (!fr.length) break;
        snap("Frontera del \u00e1rbol: " + fr.map(function (e) { return e.u + "\u2013" + e.v + "(" + e.w + ")"; }).join(", ") + ". \u00bfLa m\u00e1s barata?", true, null, fr);
        var e = fr[0]; inTree[e.v] = true; eStates[ekey(e.u, e.v)] = "done"; total += e.w; accepted++;
        snap("La m\u00e1s barata es " + e.u + "\u2013" + e.v + " (peso " + e.w + "): la acepto y " + e.v + " entra al \u00e1rbol (peso total " + total + ").", false, e, []);
      }
      F.push({ edgeStates: Object.assign({}, eStates), nodeStates: nstates(null), badges: {}, note: "\u00c1rbol completo desde " + start + ": peso total " + total + ". Prim eligi\u00f3 las aristas en otro orden que Kruskal, pero el peso total es el mismo.", total: total, accepted: accepted, phase: "done", frontier: [] });
      return F;
    }
    var stx = { algo: "kruskal", start: "A", practice: true, answered: {} };
    var totalHost = h("div.well", { style: { padding: "12px 14px" } }), legendHost = h("div");
    var sim = timelineGraphSim(mountEl, {
      C: C,
      needAsk: function (i, f) {
        if (!stx.practice || !f || !f.decision || stx.answered[i]) return false;
        if (stx.algo === "kruskal") return true;
        return f.frontier && f.frontier.length > 1;
      },
      askPanel: function (i, f, done) {
        if (stx.algo === "kruskal") {
          var ansK = function (choice) { var wc = !!f.edge.willCycle; var correct = (choice === "cycle") === wc; stx.answered[i] = true; done(correct, wc ? "Formaba ciclo." : "Se aceptaba: un\u00eda dos componentes."); };
          return h("div.well.ask-panel", h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
            h("p.ask-q", "La arista " + (f.edge ? f.edge.u + "\u2013" + f.edge.v + " (" + f.edge.w + ")" : "") + ": \u00bfse acepta o formar\u00eda un ciclo?"),
            h("div.ask-btns",
              h("button.ctrl.ask-btn", { type: "button", onClick: function () { ansK("accept"); } }, "se acepta"),
              h("button.ctrl.ask-btn", { type: "button", onClick: function () { ansK("cycle"); } }, "forma ciclo")));
        }
        var btns = h("div.ask-btns"); f.frontier.forEach(function (e) { btns.appendChild(h("button.ctrl.ask-btn", { type: "button", style: { fontFamily: "var(--mono)", fontWeight: "600" }, onClick: function () { var cheapest = f.frontier[0]; stx.answered[i] = true; done(e.w === cheapest.w, e.w === cheapest.w ? "Correcto: la m\u00e1s barata." : ["La m\u00e1s barata era ", h("b.mono", cheapest.u + "\u2013" + cheapest.v), "."]); } }, e.u + "\u2013" + e.v + " (" + e.w + ")")); });
        return h("div.well.ask-panel", h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"), h("p.ask-q", "\u00bfCu\u00e1l es la arista m\u00e1s barata de la frontera?"), btns);
      },
      renderStage: function (f, graphHost, sideHost) {
        G.mount(graphHost, G.graphView({ graph: GR, weighted: true, nodeStates: f.nodeStates, edgeStates: f.edgeStates, badges: f.badges, height: 250 }));
        G.clear(totalHost);
        totalHost.appendChild(h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "6px" } }, "peso total del \u00e1rbol"));
        totalHost.appendChild(h("div.mono", { style: { fontSize: "30px", fontWeight: "600", color: "var(--st-done)" } }, String(f.total)));
        totalHost.appendChild(h("div.mono.faint", { style: { fontSize: "11px", marginTop: "2px" } }, f.accepted + " / " + (IDS.length - 1) + " aristas"));
        G.mount(legendHost, G.stateLegend(stx.algo === "kruskal" ? ["neutral", "active", "done", "out"] : ["neutral", "cand", "active", "path"]));
        G.mount(sideHost, h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } }, totalHost, legendHost));
      },
      stats: function (f) { return [{ label: "peso total", value: f.total, color: "var(--st-done)" }, { label: "aristas", value: f.accepted + "/" + (IDS.length - 1) }, { spacer: true }, { label: stx.algo === "kruskal" ? "Kruskal" : "Prim", value: stx.algo === "kruskal" ? "O(E log E)" : "O((V+E) log V)", color: "var(--st-cand)" }]; },
      inputRow: function (api) {
        function reload() { stx.answered = {}; api.reload(stx.algo === "kruskal" ? buildKruskal() : buildPrim(stx.start)); }
        var algoSeg = h("div.seg"), algoBtns = {}; [["kruskal", "Kruskal"], ["prim", "Prim"]].forEach(function (m) { algoBtns[m[0]] = h("button", { type: "button", style: { fontFamily: "var(--sans)", fontSize: "12.5px", fontWeight: "600", padding: "0 14px" }, onClick: function () { stx.algo = m[0]; sync(); reload(); } }, m[1]); algoSeg.appendChild(algoBtns[m[0]]); });
        var startWrap = h("span.prim-start", { style: { display: "none" } });
        var startSeg = h("div.seg"), startB = {}; IDS.forEach(function (id) { startB[id] = h("button", { type: "button", "aria-pressed": stx.start === id ? "true" : "false", style: { fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "600", padding: "0 9px" }, onClick: function () { stx.start = id; IDS.forEach(function (x) { startB[x].setAttribute("aria-pressed", stx.start === x ? "true" : "false"); }); reload(); } }, id); startSeg.appendChild(startB[id]); });
        startWrap.appendChild(h("span.eyebrow", { style: { fontSize: "10px" } }, "inicio")); startWrap.appendChild(startSeg);
        var pBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; api.timeline.setDisabled(false); pBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); } });
        function sync() { Object.keys(algoBtns).forEach(function (k) { algoBtns[k].setAttribute("aria-pressed", stx.algo === k ? "true" : "false"); }); startWrap.style.display = stx.algo === "prim" ? "inline-flex" : "none"; }
        sync(); setTimeout(reload, 0);
        return h("section.card.input-card", h("span.eyebrow", { style: { fontSize: "10px" } }, "algoritmo"), algoSeg, startWrap, pBtn);
      },
    });
    return sim;
  }

  /* ===================================================================== */
  var SIMS = { "grafo-repr": renderRepr, bfs: renderBFS, dfs: renderDFS, topo: renderTopo, dijkstra: renderDijkstra, astar: renderAstar, mst: renderMST };
  function page(root, sub) {
    document.title = "M\u00f3dulo 05 \u2014 Grafos";
    var current = { destroy: function () {} };
    var host = h("div.sim-host");
    var tabs = G.lessonTabs(
      [{ id: "grafo-repr", n: "1", label: "Representaci\u00f3n" }, { id: "bfs", n: "2", label: "BFS" }, { id: "dfs", n: "3", label: "DFS" },
       { id: "topo", n: "4", label: "Topol\u00f3gico" }, { id: "dijkstra", n: "5", label: "Dijkstra" }, { id: "astar", n: "6", label: "A*" }, { id: "mst", n: "7", label: "MST" }],
      function (id) { switchTo(id); }, SIMS[sub] ? sub : "grafo-repr");
    function switchTo(id) { current.destroy(); current = SIMS[id](host) || { destroy: function () {} }; }
    var wrap = h("div.wrap.app-root",
      G.siteHome(),
      G.moduleHeader({ current: "05", eyebrow: "M\u00f3dulo 05 \u00b7 Grafos" }),
      tabs.node, host,
      h("footer.kbd-hint", h("span.faint", "\u2190 \u2192 paso \u00b7 espacio reproduce/pausa \u00b7 arrastra la l\u00ednea de tiempo")),
      G.siteFooter());
    G.mount(root, wrap);
    switchTo(tabs.current());
    return function () { current.destroy(); };
  }

  G.pages = G.pages || {};
  G.pages["modulo-05"] = page;

})(window.GUIA = window.GUIA || {});
