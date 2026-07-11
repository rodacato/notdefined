/* ============================================================================
   page-estructuras.js — Módulo 04 · Estructuras de datos. Pestañas: arreglo vs lista /
   tabla hash / BST / heap. Frames precomputados; motor de components.js.
   Registra GUIA.pages["modulo-04"].
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

  /* ===================================================================== */
  /* ARREGLO vs LISTA                                                      */
  /* ===================================================================== */
  function renderArrList(mountEl) {
    var C = G.DATA.sims["array-lista"], VALUES = C.values, N = VALUES.length;
    function neutral() { return VALUES.map(function () { return "neutral"; }); }
    function list(states) { return VALUES.map(function (v, i) { return { id: "n" + i, value: v, state: states ? states[i] : "neutral" }; }); }
    function buildFrames(op, p, val) {
      var F = [];
      if (op === "access") {
        var k = p;
        F.push({ arr: VALUES.slice(), arrStates: neutral(), arrPtr: -1, listNodes: list(), listPtr: -1, costArr: 0, costList: 0, note: "Operaci\u00f3n: acceder al elemento en el \u00edndice " + k + ".", phase: "intro" });
        for (var t = 0; t <= k; t++) {
          var as = neutral(); as[k] = "active";
          var ls = VALUES.map(function (v, i) { return i === t ? "active" : i < t ? "path" : "neutral"; });
          F.push({ arr: VALUES.slice(), arrStates: as, arrPtr: k, listNodes: list(ls), listPtr: t, costArr: 1, costList: t + 1,
            note: t === 0 ? "Arreglo: direcci\u00f3n directa al casillero " + k + " \u2192 una operaci\u00f3n. Lista: empiezo en head." : "Lista: sigo la flecha al nodo " + t + (t === k ? " \u2014 llegu\u00e9 tras " + (k + 1) + " saltos." : "\u2026"), phase: "run" });
        }
        var asd = neutral(); asd[k] = "done";
        F.push({ arr: VALUES.slice(), arrStates: asd, arrPtr: k, listNodes: list(VALUES.map(function (v, i) { return i === k ? "done" : i < k ? "path" : "neutral"; })), listPtr: k, costArr: 1, costList: k + 1,
          note: "Acceso al \u00edndice " + k + ": el arreglo lo hizo en 1 operaci\u00f3n, la lista en " + (k + 1) + ". Ese acceso aleatorio O(1) es lo que hace al arreglo \u2014 y lo que binary search necesita para saltar al medio.", phase: "done" });
        return F;
      }
      if (op === "insert") {
        F.push({ arr: VALUES.slice(), arrStates: neutral(), arrPtr: -1, listNodes: list(), listPtr: -1, costArr: 0, costList: 0, note: "Operaci\u00f3n: insertar " + val + " en la posici\u00f3n " + p + ".", phase: "intro" });
        var as1 = neutral(); for (var i1 = p; i1 < N; i1++) as1[i1] = "cand";
        var li1 = list(); li1.splice(p, 0, { id: "new", value: val, state: "active" });
        F.push({ arr: VALUES.slice(), arrStates: as1, arrPtr: p, listNodes: li1, listPtr: p, rewire: [Math.max(0, p - 1)], costArr: N - p, costList: 1,
          note: "Arreglo: para abrir hueco en " + p + " hay que correr " + (N - p) + " celdas a la derecha. Lista: con el nodo previo en mano, solo re-engancho dos flechas.", phase: "run" });
        var a2 = VALUES.slice(); a2.splice(p, 0, val);
        var li2 = list(); li2.splice(p, 0, { id: "new", value: val, state: "done" });
        F.push({ arr: a2, arrStates: a2.map(function (x, i) { return i === p ? "done" : "neutral"; }), arrPtr: p, listNodes: li2, listPtr: p, costArr: N - p + 1, costList: 1,
          note: "Insertado. Arreglo: " + (N - p + 1) + " operaciones (correr + escribir) \u2192 O(n) en medio. Lista: 1 sola (re-cablear) \u2192 O(1) con el nodo en mano.", phase: "done" });
        return F;
      }
      F.push({ arr: VALUES.slice(), arrStates: neutral(), arrPtr: -1, listNodes: list(), listPtr: -1, costArr: 0, costList: 0, note: "Operaci\u00f3n: borrar el elemento en la posici\u00f3n " + p + ".", phase: "intro" });
      var asx = neutral(); asx[p] = "out"; for (var i2 = p + 1; i2 < N; i2++) asx[i2] = "cand";
      F.push({ arr: VALUES.slice(), arrStates: asx, arrPtr: p, listNodes: list(VALUES.map(function (v, i) { return i === p ? "out" : "neutral"; })), listPtr: p, rewire: [Math.max(0, p - 1)], costArr: N - p - 1, costList: 1,
        note: "Arreglo: quito " + VALUES[p] + " y corro " + (N - p - 1) + " celdas a la izquierda para tapar el hueco. Lista: re-engancho la flecha del previo directo al siguiente.", phase: "run" });
      var a2d = VALUES.slice(); a2d.splice(p, 1);
      F.push({ arr: a2d, arrStates: a2d.map(function () { return "neutral"; }), arrPtr: -1, listNodes: list().filter(function (_, i) { return i !== p; }), listPtr: -1, costArr: N - p, costList: 1,
        note: "Borrado. Arreglo: " + (N - p) + " operaciones \u2192 O(n). Lista: 1 \u2192 O(1). Ah\u00ed est\u00e1 la simetr\u00eda: lo barato en una estructura es caro en la otra.", phase: "done" });
      return F;
    }
    var OPS = [{ id: "access", label: "acceder" }, { id: "insert", label: "insertar" }, { id: "delete", label: "borrar" }];
    function predictWinner(op, p) { return op === "access" ? (p === 0 ? "tie" : "list") : "array"; }

    var stx = { op: "access", p: 4, practice: true, answered: false };
    var arrHost = h("div.well.notebook-lines.track-host"), listHost = h("div.well", { style: { padding: "16px 14px" } });
    var arrBadge = h("span.cost-badge"), listBadge = h("span.cost-badge");
    var askHost = h("div.ask-host"), fbHost = h("div.fb-host");
    var nh = narrHosts(); var cx = cxBlock(C.cx);
    var posSeg = h("div.seg", { role: "group", "aria-label": "Posici\u00f3n" });

    function costBadge(el, label, value, hot) { G.clear(el); el.className = "cost-badge" + (hot ? " hot" : ""); el.appendChild(h("span.mono.cb-l", label)); el.appendChild(h("span.mono.cb-v", String(value))); }
    function needAsk(i) { var f = timeline.frame(); return stx.practice && f && f.phase === "intro" && !stx.answered; }
    var timeline = G.createTimeline({
      canAdvance: function (i) { return !needAsk(i); },
      onBlocked: function () { showAsk(); },
      onFrame: function (f) {
        G.clear(askHost);
        G.mount(arrHost, G.arrayTrack({ values: f.arr, states: f.arrStates, pointer: f.arrPtr, markers: f.arrPtr >= 0 ? (function () { var m = {}; m[f.arrPtr] = stx.op === "access" ? "k" : "p"; return m; })() : {} }));
        G.mount(listHost, G.listView({ nodes: f.listNodes, pointer: f.listPtr, rewire: f.rewire || [] }));
        var hotArr = f.costArr > f.costList, hotList = f.costList > f.costArr;
        costBadge(arrBadge, "ops", f.costArr, hotArr); costBadge(listBadge, "ops", f.costList, hotList);
        nh.note.textContent = f.note;
        G.clear(nh.stats);
        nh.stats.appendChild(G.stat("arreglo", f.costArr + " ops", hotArr ? "var(--st-out)" : "var(--st-cand)"));
        nh.stats.appendChild(G.stat("lista", f.costList + " ops", hotList ? "var(--st-out)" : "var(--st-cand)"));
        nh.stats.appendChild(h("span", { style: { flex: "1" } }));
        nh.stats.appendChild(G.stat("fase", f.phase === "run" ? "ejecutando" : f.phase === "done" ? "listo" : "\u2014"));
      },
    });
    function showAsk() {
      timeline.setDisabled(true);
      G.mount(askHost, h("div.well.ask-panel",
        h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
        h("p.ask-q", "Para esta operaci\u00f3n, \u00bfen cu\u00e1l estructura va a costar m\u00e1s?"),
        h("div.ask-btns",
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("array"); } }, "Arreglo"),
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("list"); } }, "Lista"),
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("tie"); } }, "Igual"))));
    }
    function answer(choice) {
      var winner = predictWinner(stx.op, stx.p); stx.answered = true;
      var correct = choice === winner;
      G.clear(fbHost);
      fbHost.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"),
        h("span.fb-glyph", correct ? "\u2713" : "\u25C6"),
        h("p.fb-text", winner === "tie" ? "Empate: en el \u00edndice 0 ambas cuestan lo mismo."
          : winner === "list" ? ["La ", h("b", "lista"), " cuesta m\u00e1s: para acceder tiene que caminar nodo por nodo, mientras el arreglo salta directo."]
          : ["El ", h("b", "arreglo"), " cuesta m\u00e1s: insertar/borrar en medio obliga a correr todo lo de la derecha; la lista solo re-engancha flechas."])));
      timeline.setDisabled(false); G.clear(askHost); timeline.next(true);
    }
    function load() { stx.answered = false; G.clear(fbHost); timeline.load(buildFrames(stx.op, stx.p, 99)); buildPos(); sync(); }
    function buildPos() {
      var maxP = stx.op === "access" ? N - 1 : stx.op === "insert" ? N : N - 1;
      G.clear(posSeg);
      for (var i = 0; i <= maxP; i++) (function (i) { posSeg.appendChild(h("button", { type: "button", "aria-pressed": stx.p === i ? "true" : "false", style: { fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "600", padding: "0 10px" }, onClick: function () { stx.p = i; load(); } }, String(i))); })(i);
    }
    var opSeg = h("div.seg", { role: "group", "aria-label": "Operaci\u00f3n" }); var opBtns = {};
    OPS.forEach(function (o) { var b = h("button", { type: "button", style: { fontFamily: "var(--sans)", fontSize: "12px", fontWeight: "600", padding: "0 13px" }, onClick: function () { stx.op = o.id; stx.p = Math.min(stx.p, o.id === "insert" ? N : N - 1); load(); } }, o.label); opBtns[o.id] = b; opSeg.appendChild(b); });
    var practiceBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "modo pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; G.clear(askHost); timeline.setDisabled(false); sync(); } });
    var posLabel = h("span.eyebrow", { style: { fontSize: "10px", whiteSpace: "nowrap" } });
    function sync() { OPS.forEach(function (o) { opBtns[o.id].setAttribute("aria-pressed", stx.op === o.id ? "true" : "false"); }); practiceBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); posLabel.textContent = stx.op === "access" ? "\u00edndice k" : "posici\u00f3n p"; }

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        h("span.eyebrow", { style: { fontSize: "10px" } }, "operaci\u00f3n"), opSeg, posLabel, posSeg,
        h("span", { style: { flex: "1" } }), practiceBtn),
      h("section.card", { style: { padding: "20px 22px", marginBottom: "16px" } },
        h("div.al-head", h("span.eyebrow", { style: { fontSize: "10px" } }, "Arreglo \u00b7 memoria contigua"), arrBadge),
        h("div", { style: { marginBottom: "18px" } }, arrHost),
        h("div.al-head", h("span.eyebrow", { style: { fontSize: "10px" } }, "Lista enlazada \u00b7 eslabones dispersos"), listBadge),
        listHost, askHost),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        nh.note, nh.stats, h("div.narr-toggles", cx.toggle), cx.panel));
    load();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  /* TABLA HASH                                                            */
  /* ===================================================================== */
  function renderHash(mountEl) {
    var C = G.DATA.sims.hash, B = C.buckets;
    function sumCodes(k) { var s = 0; for (var i = 0; i < k.length; i++) s += k.charCodeAt(i); return s; }
    function H(k, mode) { return mode === "bad" ? 0 : sumCodes(k) % B; }
    function buckets(entries, mode) { var arr = []; for (var i = 0; i < B; i++) arr.push([]); entries.forEach(function (e) { arr[H(e, mode)].push(e); }); return arr; }
    function cloneBk(bk) { return bk.map(function (b) { return b.slice(); }); }
    function buildStatic(entries, mode) { return [{ phase: "idle", key: null, buckets: buckets(entries, mode), active: -1, note: entries.length ? "Tabla con " + entries.length + " clave(s). Inserta o busca una para ver el camino hash \u2192 bucket." : "Tabla vac\u00eda. Inserta claves: cada una pasa por la funci\u00f3n hash y cae en un bucket." }]; }
    function buildInsert(entries, key, mode) {
      var pre = buckets(entries, mode), idx = H(key, mode), sum = sumCodes(key), F = [];
      F.push({ phase: "in", key: key, hashState: "idle", idx: -1, buckets: cloneBk(pre), active: -1, note: "Insertar \"" + key + "\". Primero pasa por la funci\u00f3n hash." });
      F.push({ phase: "hash", key: key, hashState: "active", idx: idx, sum: sum, buckets: cloneBk(pre), active: -1, note: mode === "bad" ? "Hash malo: ignora la clave y devuelve 0, siempre." : "Hash: suma de c\u00f3digos = " + sum + "; " + sum + " % " + B + " = " + idx + "." });
      var post = cloneBk(pre), collision = post[idx].length > 0; post[idx] = post[idx].concat([key]);
      F.push({ phase: "place", key: key, hashState: "done", idx: idx, sum: sum, buckets: post, active: idx, hot: key, note: collision ? "El bucket " + idx + " ya estaba ocupado: colisi\u00f3n. Se encadena como una lista enlazada que sale del bucket." : "El bucket " + idx + " estaba vac\u00edo: la clave entra directo." });
      return F;
    }
    function buildSearch(entries, key, mode) {
      var pre = buckets(entries, mode), idx = H(key, mode), sum = sumCodes(key), F = [];
      F.push({ phase: "in", key: key, hashState: "idle", idx: -1, buckets: cloneBk(pre), active: -1, note: "Buscar \"" + key + "\"." });
      F.push({ phase: "hash", key: key, hashState: "active", idx: idx, sum: sum, buckets: cloneBk(pre), active: -1, note: mode === "bad" ? "Hash malo: manda todo al bucket 0." : "Hash: " + sum + " % " + B + " = " + idx + ". Vamos directo a ese bucket." });
      var chain = pre[idx], found = false;
      for (var c = 0; c < chain.length; c++) {
        var m = chain[c] === key; if (m) found = true;
        F.push({ phase: "scan", key: key, idx: idx, buckets: cloneBk(pre), active: idx, cmpIdx: c, match: m, note: "Bucket " + idx + ": comparo con \"" + chain[c] + "\"\u2026 " + (m ? "coincide \u25CE." : "no, sigo la cadena.") });
        if (m) break;
      }
      if (!found) F.push({ phase: "miss", key: key, idx: idx, buckets: cloneBk(pre), active: idx, note: "Recorr\u00ed el bucket " + idx + " sin encontrar \"" + key + "\": no est\u00e1 en la tabla." });
      return F;
    }
    function hashBoxEl(active, sum, idx, mode) {
      var box = h("div.hashbox-wrap",
        h("div.hashbox" + (active ? ".on" : ""),
          h("div", { style: { fontWeight: "600" } }, "hash( clave )"),
          h("div.faint", { style: { fontSize: "10.5px", marginTop: "2px" } }, mode === "bad" ? "return 0" : "\u03a3 c\u00f3digos % 7")));
      if (sum != null) box.appendChild(h("div.mono", { style: { fontSize: "11.5px", color: "var(--ink-soft)" } }, mode === "bad" ? "\u2192 0" : sum + " % " + B + " \u2192 " + idx));
      return box;
    }
    function bucketEl(i, chain, active, frame) {
      var slot = h("div.hb-slot" + (active ? ".on" : ""));
      if (!chain.length) slot.appendChild(h("span.faint", { style: { fontSize: "11px", paddingLeft: "4px" } }, "vac\u00edo"));
      else chain.forEach(function (k, c) {
        var st = "neutral";
        if (frame.hot === k && active) st = "active";
        if (frame.phase === "scan" && active && frame.cmpIdx === c) st = frame.match ? "done" : "cand";
        var b = G.BAR[st] || G.BAR.neutral;
        slot.appendChild(h("div.hb-key", { style: { border: "1.5px solid " + b.bd, background: b.bg } }, k));
        if (c < chain.length - 1) slot.appendChild(h("span.hb-arrow", "\u2192"));
      });
      return h("div.hb-row", h("div.mono.hb-idx" + (active ? ".on" : ""), String(i)), slot);
    }

    var stx = { entries: C.initial.slice(), mode: "good", op: null, text: "" };
    var hashHost = h("div.well.notebook-lines.hash-left"), bucketsHost = h("div.well.hash-right");
    var nh = narrHosts(); var cx = cxBlock(C.cx);
    var input = h("input.num-input", { type: "text", placeholder: "clave (ej. mar)", maxlength: "8", style: { width: "130px" } });
    var timeline = G.createTimeline({ onFrame: function (f) {
      G.clear(hashHost);
      if (f.key) hashHost.appendChild(h("div.hash-key", "\"" + f.key + "\""));
      else hashHost.appendChild(h("span.faint", { style: { fontSize: "12px" } }, "sin operaci\u00f3n activa"));
      hashHost.appendChild(h("span", { style: { color: "var(--ink-faint)" } }, "\u2193"));
      hashHost.appendChild(hashBoxEl(f.hashState === "active", (f.phase === "hash" || f.phase === "place" || f.phase === "scan") ? f.sum : null, f.idx, stx.mode));
      G.clear(bucketsHost);
      bucketsHost.appendChild(h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "2px" } }, "Buckets (" + B + ")"));
      f.buckets.forEach(function (chain, i) { bucketsHost.appendChild(bucketEl(i, chain, f.active === i, f)); });
      nh.note.textContent = f.note;
      var loadPct = Math.round((stx.entries.length / B) * 100);
      G.clear(nh.stats);
      nh.stats.appendChild(G.stat("claves", stx.entries.length, "var(--st-cand)"));
      nh.stats.appendChild(G.stat("buckets", B));
      nh.stats.appendChild(G.stat("factor de carga", (stx.entries.length / B).toFixed(2), loadPct > 100 ? "var(--st-out)" : "var(--ink-faint)"));
      nh.stats.appendChild(h("span", { style: { flex: "1" } }));
      nh.stats.appendChild(G.stat("prom \u00b7 peor", "O(1) \u00b7 O(n)"));
    } });
    function reloadStatic() { timeline.load(buildStatic(stx.entries, stx.mode)); }
    function doInsert(k) { k = (k || "").trim().toLowerCase(); if (!k) return; var base = stx.entries.slice(); stx.entries.push(k); stx.op = { kind: "insert", key: k, base: base }; input.value = ""; timeline.load(buildInsert(base, k, stx.mode)); }
    function doSearch(k) { k = (k || "").trim().toLowerCase(); if (!k) return; stx.op = { kind: "search", key: k }; timeline.load(buildSearch(stx.entries, k, stx.mode)); }
    function reset() { stx.entries = []; stx.op = null; reloadStatic(); }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") doInsert(input.value); });
    var presetRow = h("div.chip-row");
    C.presets.forEach(function (k) { presetRow.appendChild(h("button.pill", { type: "button", style: { padding: "4px 10px", fontSize: "12px" }, onClick: function () { doInsert(k); } }, "+" + k)); });
    var badBtn = G.togglePill({ pressed: false, label: "probar hash malo", onClick: function () { stx.mode = stx.mode === "bad" ? "good" : "bad"; stx.op = null; badBtn.setAttribute("aria-pressed", stx.mode === "bad" ? "true" : "false"); badBtn.lastChild.textContent = " " + (stx.mode === "bad" ? "hash malo: activo" : "probar hash malo"); reloadStatic(); } });

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        input,
        h("button.pill", { type: "button", onClick: function () { doInsert(input.value); } }, "insertar"),
        h("button.pill", { type: "button", onClick: function () { doSearch(input.value); } }, "buscar"),
        presetRow, h("span", { style: { flex: "1" } }), badBtn,
        h("button.pill", { type: "button", onClick: reset }, "\u21ba vaciar")),
      h("section.card", { style: { padding: "20px 22px", marginBottom: "16px" } },
        h("div.hash-grid", hashHost, bucketsHost)),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card",
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        nh.note, nh.stats, h("div.narr-toggles", cx.toggle), cx.panel));
    reloadStatic();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  /* BST                                                                   */
  /* ===================================================================== */
  function renderBST(mountEl) {
    var C = G.DATA.sims.bst;
    function buildBST(seq) {
      var nodes = {}, root = null, seen = {};
      function ins(v) {
        var node = { id: "v" + v, value: v, left: null, right: null, parent: null };
        if (!root) { root = node.id; nodes[node.id] = node; return; }
        var cur = nodes[root];
        while (true) {
          if (v < cur.value) { if (cur.left == null) { cur.left = node.id; node.parent = cur.id; break; } cur = nodes[cur.left]; }
          else { if (cur.right == null) { cur.right = node.id; node.parent = cur.id; break; } cur = nodes[cur.right]; }
        }
        nodes[node.id] = node;
      }
      seq.forEach(function (v) { if (!seen[v]) { seen[v] = 1; ins(v); } });
      var xc = 0, maxd = { v: 0 };
      (function lay(id, d) { if (id == null) return; var nd = nodes[id]; lay(nd.left, d + 1); nd.x = xc++; nd.y = d; maxd.v = Math.max(maxd.v, d); lay(nd.right, d + 1); })(root, 0);
      return { nodes: nodes, root: root, maxd: maxd.v };
    }
    function baseStates(t) { var s = {}; Object.keys(t.nodes).forEach(function (id) { s[id] = "neutral"; }); return s; }
    function F1(st, active, note, out) { return { states: Object.assign({}, st), active: active, note: note, out: out || [] }; }
    function framesInsert(t, v) {
      var F = [], st = baseStates(t), tid = "v" + v;
      if (t.root === tid) { st[tid] = "active"; return [F1(st, tid, "El \u00e1rbol estaba vac\u00edo: " + v + " se vuelve la ra\u00edz.")]; }
      var cur = t.nodes[t.root];
      F.push(F1(st, t.root, "Insertar " + v + ": empezamos en la ra\u00edz " + cur.value + " y comparamos hacia abajo."));
      while (cur.id !== tid) { st[cur.id] = "cand"; var goLeft = v < cur.value; F.push(F1(st, cur.id, v + " " + (goLeft ? "<" : ">") + " " + cur.value + ": " + (goLeft ? "voy a la izquierda" : "voy a la derecha") + ".")); cur = t.nodes[goLeft ? cur.left : cur.right]; }
      st[tid] = "active"; F.push(F1(st, tid, v + " encontr\u00f3 su lugar y cuelga como hoja nueva. Menores a la izquierda, mayores a la derecha \u2014 en cada nodo."));
      return F;
    }
    function framesSearch(t, v) {
      var F = [], st = baseStates(t), cur = t.root ? t.nodes[t.root] : null;
      F.push(F1(st, t.root, "Buscar " + v + ": empezamos en la ra\u00edz."));
      while (cur) {
        if (v === cur.value) { st[cur.id] = "done"; F.push(Object.assign(F1(st, cur.id, v + " = " + cur.value + ": encontrado \u25CE."), { found: true })); return F; }
        var goLeft = v < cur.value; st[cur.id] = "cand";
        F.push(Object.assign(F1(st, cur.id, v + " " + (goLeft ? "<" : ">") + " " + cur.value + ": " + (goLeft ? "izquierda" : "derecha") + "."), { decision: true, answer: goLeft ? "left" : "right" }));
        cur = t.nodes[goLeft ? cur.left : cur.right];
      }
      F.push(Object.assign(F1(st, -1, "Llegamos a un enlace vac\u00edo: " + v + " no est\u00e1 en el \u00e1rbol."), { miss: true }));
      return F;
    }
    function framesInorder(t) {
      var F = [], st = baseStates(t), out = [];
      (function go(id) { if (id == null) return; var nd = t.nodes[id]; go(nd.left); st[nd.id] = "active"; out.push(nd.value); F.push(F1(st, nd.id, "Visito " + nd.value + " y lo deposito. In-order = izquierda, nodo, derecha.", out.slice())); st[nd.id] = "done"; go(nd.right); })(t.root);
      F.push(F1(st, -1, "Recorrido in-order: " + out.join(", ") + ". Salen ordenados sin ordenar nada: el invariante del \u00e1rbol ya hab\u00eda hecho ese trabajo.", out.slice()));
      return F;
    }
    function treeNodes(t, states) { return Object.keys(t.nodes).map(function (id) { var nd = t.nodes[id]; return { id: nd.id, value: nd.value, label: nd.value, x: nd.x, y: nd.y, parent: nd.parent, state: states[nd.id] || "neutral" }; }); }

    var stx = { seq: C.initial.slice(), op: null, practice: true, answered: {} };
    var tree = buildBST(stx.seq);
    var treeHost = h("div.well.notebook-lines", { style: { padding: "10px 8px" } });
    var outHost = h("div.bst-out-host"), askHost = h("div.ask-host"), fbHost = h("div.fb-host");
    var headLabel = h("span.eyebrow", { style: { fontSize: "10px" } });
    var nh = narrHosts(); var cx = cxBlock(C.cx);
    var input = h("input.num-input", { type: "text", inputmode: "numeric", placeholder: "valor", style: { width: "78px" } });

    function needAsk(i) { var f = timeline.frame(); return stx.practice && stx.op && stx.op.kind === "search" && f && f.decision && !stx.answered[i]; }
    var timeline = G.createTimeline({
      canAdvance: function (i) { return !needAsk(i); },
      onBlocked: function (i) { showAsk(i); },
      onFrame: function (f) {
        G.clear(askHost);
        G.mount(treeHost, G.treeView(treeNodes(tree, f.states || {}), { activeId: f.active }));
        G.clear(outHost);
        if (f.out && f.out.length) { var box = h("div.well.bst-out", h("span.eyebrow", { style: { fontSize: "10px" } }, "in-order")); f.out.forEach(function (v) { box.appendChild(h("span.mono.bst-chip", String(v))); }); outHost.appendChild(box); }
        var degenerate = tree.maxd >= Object.keys(tree.nodes).length - 1 && Object.keys(tree.nodes).length > 2;
        headLabel.textContent = "\u00c1rbol" + (degenerate ? " \u00b7 degenerado en lista" : "");
        nh.note.textContent = f.note;
        var count = Object.keys(tree.nodes).length;
        G.clear(nh.stats);
        nh.stats.appendChild(G.stat("nodos", count, "var(--st-cand)"));
        nh.stats.appendChild(G.stat("altura", tree.maxd + (count ? 1 : 0), degenerate ? "var(--st-out)" : "var(--st-done)"));
        nh.stats.appendChild(h("span", { style: { flex: "1" } }));
        nh.stats.appendChild(G.stat("balanceado \u00b7 degenerado", "O(log n) \u00b7 O(n)"));
      },
    });
    function showAsk(i) {
      var f = timeline.frame(); timeline.setDisabled(true);
      G.mount(askHost, h("div.well.ask-panel",
        h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
        h("p.ask-q", ["Comparando con ", h("b.mono", tree.nodes[f.active] ? String(tree.nodes[f.active].value) : ""), " \u00bfhacia d\u00f3nde seguimos?"]),
        h("div.ask-btns",
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("left", i, f); } }, "\u2190 izquierda"),
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("right", i, f); } }, "derecha \u2192"))));
    }
    function answer(c, i, f) {
      var correct = c === f.answer; stx.answered[i] = true;
      G.clear(fbHost);
      fbHost.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"),
        h("span.fb-glyph", correct ? "\u2713" : "\u25C6"),
        h("p.fb-text", correct ? ["Correcto: hacia la ", h("b", f.answer === "left" ? "izquierda" : "derecha"), "."] : ["Iba a la ", h("b", f.answer === "left" ? "izquierda" : "derecha"), ": menor \u2192 izquierda, mayor \u2192 derecha."])));
      timeline.setDisabled(false); G.clear(askHost); timeline.next(true);
    }
    function loadOp() { stx.answered = {}; G.clear(fbHost); if (!stx.op) timeline.load([F1(baseStates(tree), -1, stx.seq.length ? "\u00c1rbol listo. Inserta un valor, busca uno (prediciendo izquierda/derecha) o recorre in-order." : "\u00c1rbol vac\u00edo. Inserta valores para construirlo.")]); else if (stx.op.kind === "insert") timeline.load(framesInsert(stx.op.tree, stx.op.value)); else if (stx.op.kind === "search") timeline.load(framesSearch(tree, stx.op.value)); else timeline.load(framesInorder(tree)); }
    function rebuild() { tree = buildBST(stx.seq); loadOp(); }
    function doInsert(v) { v = parseInt(v, 10); if (isNaN(v) || stx.seq.indexOf(v) >= 0) { input.value = ""; return; } stx.seq = stx.seq.concat([v]); tree = buildBST(stx.seq); stx.op = { kind: "insert", value: v, tree: tree }; input.value = ""; loadOp(); }
    function doSearch(v) { v = parseInt(v, 10); if (isNaN(v)) return; stx.op = { kind: "search", value: v }; loadOp(); }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") doInsert(input.value); });
    var practiceBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; G.clear(askHost); timeline.setDisabled(false); practiceBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); } });

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        input,
        h("button.pill", { type: "button", onClick: function () { doInsert(input.value); } }, "insertar"),
        h("button.pill", { type: "button", onClick: function () { doSearch(input.value); } }, "buscar"),
        h("button.pill", { type: "button", onClick: function () { stx.op = { kind: "inorder" }; loadOp(); } }, "recorrido in-order"),
        practiceBtn, h("span", { style: { flex: "1" } }),
        h("button.pill", { type: "button", onClick: function () { stx.seq = [1, 2, 3, 4, 5, 6, 7]; stx.op = null; rebuild(); } }, "insertar 1..7 ordenado"),
        h("button.pill", { type: "button", onClick: function () { stx.seq = []; stx.op = null; rebuild(); } }, "\u21ba")),
      h("section.card", { style: { padding: "18px 20px 16px", marginBottom: "16px" } },
        h("div.stage-head", headLabel, G.stateLegend(["neutral", "cand", "active", "done"])),
        treeHost, outHost, askHost),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        nh.note, nh.stats, h("div.narr-toggles", cx.toggle), cx.panel));
    loadOp();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  /* HEAP                                                                  */
  /* ===================================================================== */
  function renderHeap(mountEl) {
    var C = G.DATA.sims.heap;
    function layout(n) { var x = new Array(n), y = new Array(n), xc = 0; (function lay(i, d) { if (i >= n) return; lay(2 * i + 1, d + 1); x[i] = xc++; y[i] = d; lay(2 * i + 2, d + 1); })(0, 0); return { x: x, y: y }; }
    function treeNodes(arr, states) { var lo = layout(arr.length); return arr.map(function (v, i) { return { id: "h" + i, value: v, label: v, x: lo.x[i], y: lo.y[i], parent: i === 0 ? null : "h" + Math.floor((i - 1) / 2), state: states[i] || "neutral", sub: "[" + i + "]" }; }); }
    function neu(n) { return new Array(n).fill("neutral"); }
    function framesInsert(heap, v) {
      var arr = heap.concat([v]), F = [], i = arr.length - 1;
      function snap(states, note, extra) { F.push(Object.assign({ arr: arr.slice(), states: states.slice(), active: i, note: note }, extra || {})); }
      var st = neu(arr.length); st[i] = "active";
      snap(st, "Insertamos " + v + " al final del arreglo (\u00edndice " + i + ") \u2014 la \u00faltima hoja del \u00e1rbol. Ahora hace sift-up hasta cumplir la propiedad.");
      while (i > 0) {
        var par = Math.floor((i - 1) / 2);
        st = neu(arr.length); st[i] = "active"; st[par] = "cand";
        var up = arr[i] < arr[par];
        snap(st, "Comparo " + arr[i] + " (\u00edndice " + i + ") con su padre " + arr[par] + " (\u00edndice " + par + "): " + (up ? "es menor, debe subir." : "no es menor, se queda."), { decision: true, answer: up ? "up" : "stay" });
        if (!up) break;
        var t = arr[i]; arr[i] = arr[par]; arr[par] = t;
        var st2 = neu(arr.length); st2[par] = "active"; st2[i] = "path";
        snap(st2, "Intercambio: " + arr[par] + " sube a la posici\u00f3n " + par + ".");
        i = par;
      }
      var stf = neu(arr.length); stf[i] = "done";
      F.push({ arr: arr.slice(), states: stf, active: i, note: "Listo: " + v + " qued\u00f3 en su lugar. La ra\u00edz sigue siendo el m\u00ednimo.", settle: true });
      return F;
    }
    function framesExtract(heap) {
      if (heap.length === 0) return [{ arr: [], states: [], active: -1, note: "El heap est\u00e1 vac\u00edo." }];
      var arr = heap.slice(), F = [], root = arr[0];
      var st = neu(arr.length); st[0] = "out";
      F.push({ arr: arr.slice(), states: st.slice(), active: 0, note: "Extraer-m\u00edn: la ra\u00edz " + root + " es el m\u00ednimo y sale." });
      var last = arr.pop();
      if (arr.length === 0) return F.concat([{ arr: [], states: [], active: -1, note: "Sale " + root + ". El heap queda vac\u00edo.", settle: true }]);
      arr[0] = last; var i = 0;
      var s2 = neu(arr.length); s2[0] = "active";
      F.push({ arr: arr.slice(), states: s2, active: 0, note: "La \u00faltima hoja (" + last + ") ocupa la ra\u00edz. Ahora hace sift-down hasta reacomodarse." });
      while (true) {
        var l = 2 * i + 1, r = 2 * i + 2, sm = i;
        if (l < arr.length && arr[l] < arr[sm]) sm = l;
        if (r < arr.length && arr[r] < arr[sm]) sm = r;
        var sc = neu(arr.length); sc[i] = "active"; if (l < arr.length) sc[l] = "cand"; if (r < arr.length) sc[r] = "cand";
        F.push({ arr: arr.slice(), states: sc, active: i, note: l >= arr.length ? arr[i] + " ya no tiene hijos: termina." : "Comparo " + arr[i] + " con su(s) hijo(s): el menor es " + arr[sm] + "." });
        if (sm === i) break;
        var t = arr[i]; arr[i] = arr[sm]; arr[sm] = t;
        var ss = neu(arr.length); ss[sm] = "active"; ss[i] = "path";
        F.push({ arr: arr.slice(), states: ss, active: sm, note: arr[i] + " > " + arr[sm] + ": bajan. El menor sube a la posici\u00f3n " + i + "." });
        i = sm;
      }
      var stf = neu(arr.length); F.push({ arr: arr.slice(), states: stf, active: -1, note: "Reacomodado. Sali\u00f3 " + root + "; la nueva ra\u00edz " + arr[0] + " es el nuevo m\u00ednimo.", settle: true });
      return F;
    }

    var stx = { heap: C.initial.slice(), op: null, practice: true, answered: {} };
    var treeHost = h("div.well.notebook-lines", { style: { padding: "8px 8px" } });
    var arrHost = h("div.well", { style: { padding: "12px 10px 4px" } });
    var askHost = h("div.ask-host"), fbHost = h("div.fb-host");
    var nh = narrHosts(); var cx = cxBlock(C.cx);
    var input = h("input.num-input", { type: "text", inputmode: "numeric", placeholder: "valor", style: { width: "78px" } });

    function needAsk(i) { var f = timeline.frame(); return stx.practice && stx.op && stx.op.kind === "insert" && f && f.decision && !stx.answered[i]; }
    var timeline = G.createTimeline({
      canAdvance: function (i) { return !needAsk(i); },
      onBlocked: function (i) { showAsk(i); },
      onFrame: function (f) {
        G.clear(askHost);
        G.mount(treeHost, G.treeView(treeNodes(f.arr, f.states), { activeId: f.active >= 0 ? "h" + f.active : -1 }));
        G.mount(arrHost, G.arrayTrack({ values: f.arr, states: f.states, pointer: f.active }));
        nh.note.textContent = f.note;
        G.clear(nh.stats);
        nh.stats.appendChild(G.stat("tama\u00f1o", f.arr.length, "var(--st-cand)"));
        nh.stats.appendChild(G.stat("m\u00ednimo (ra\u00edz)", f.arr.length ? f.arr[0] : "\u2014", "var(--st-done)"));
        nh.stats.appendChild(h("span", { style: { flex: "1" } }));
        nh.stats.appendChild(G.stat("insert/extraer \u00b7 ver-m\u00edn", "O(log n) \u00b7 O(1)"));
      },
    });
    function showAsk(i) {
      timeline.setDisabled(true);
      G.mount(askHost, h("div.well.ask-panel",
        h("div.eyebrow", { style: { color: "var(--st-goal)", marginBottom: "8px" } }, "\u25CE Predice antes de revelar"),
        h("p.ask-q", "El valor en \u00e1mbar, \u00bfsube un nivel o se queda donde est\u00e1?"),
        h("div.ask-btns",
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("up", i); } }, "\u2191 sube"),
          h("button.ctrl.ask-btn", { type: "button", onClick: function () { answer("stay", i); } }, "se queda"))));
    }
    function answer(c, i) {
      var f = timeline.frame(), correct = c === f.answer; stx.answered[i] = true;
      G.clear(fbHost);
      fbHost.appendChild(h("div.card.fb-card" + (correct ? ".fb-ok" : ".fb-warn"),
        h("span.fb-glyph", correct ? "\u2713" : "\u25C6"),
        h("p.fb-text", correct ? "Correcto: " + (f.answer === "up" ? "sube, porque es menor que su padre." : "se queda: ya no es menor que su padre.")
          : (f.answer === "up" ? "Sub\u00eda: era menor que su padre." : "Se quedaba: no era menor que su padre."))));
      timeline.setDisabled(false); G.clear(askHost); timeline.next(true);
    }
    function loadIdle() { timeline.load([{ arr: stx.heap.slice(), states: neu(stx.heap.length), active: -1, note: stx.heap.length ? "Min-heap: cada padre es menor que sus hijos, as\u00ed que el m\u00ednimo est\u00e1 en la ra\u00edz. Inserta o extrae el m\u00ednimo." : "Heap vac\u00edo. Inserta valores." }]); }
    function doInsert(v) { v = parseInt(v, 10); if (isNaN(v)) return; var fr = framesInsert(stx.heap, v); stx.op = { kind: "insert" }; stx.answered = {}; G.clear(fbHost); stx.heap = fr[fr.length - 1].arr; input.value = ""; timeline.load(fr); }
    function doExtract() { if (!stx.heap.length) return; var fr = framesExtract(stx.heap); stx.op = { kind: "extract" }; stx.answered = {}; G.clear(fbHost); stx.heap = fr[fr.length - 1].arr; timeline.load(fr); }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") doInsert(input.value); });
    var practiceBtn = G.togglePill({ pressed: true, icon: "\u25CE", label: "pr\u00e1ctica", onClick: function () { stx.practice = !stx.practice; G.clear(askHost); timeline.setDisabled(false); practiceBtn.setAttribute("aria-pressed", stx.practice ? "true" : "false"); } });

    var view = h("div.sim",
      h("h1.display.sim-title", C.title), h("p.sim-intro", { html: C.intro }),
      h("section.card.input-card",
        input,
        h("button.pill", { type: "button", onClick: function () { doInsert(input.value); } }, "insertar (sift-up)"),
        h("button.pill", { type: "button", onClick: doExtract }, "extraer-m\u00edn (sift-down)"),
        practiceBtn, h("span", { style: { flex: "1" } }),
        h("button.pill", { type: "button", onClick: function () { stx.heap = C.initial.slice(); stx.op = null; stx.answered = {}; G.clear(fbHost); loadIdle(); } }, "\u21ba reiniciar")),
      h("section.card", { style: { padding: "18px 20px 16px", marginBottom: "16px" } },
        h("div.stage-head", h("span.eyebrow", { style: { fontSize: "10px" } }, "Vista de \u00e1rbol (conceptual)"), G.stateLegend(["neutral", "cand", "active", "done"])),
        treeHost,
        h("div.heap-arr-head", h("span.eyebrow", { style: { fontSize: "10px" } }, "Vista de arreglo (donde viven los datos)"), h("span.mono.faint", { style: { fontSize: "10.5px" } }, "\u00b7 nodo i \u2192 hijos 2i+1, 2i+2 \u00b7 padre \u230a(i\u22121)/2\u230b")),
        arrHost, askHost),
      h("section.card.ctrl-card", timeline.node),
      h("section.card.narr-card", fbHost,
        h("div.eyebrow", { style: { marginBottom: "10px" } }, "Qu\u00e9 est\u00e1 pasando"),
        nh.note, nh.stats, h("div.narr-toggles", cx.toggle), cx.panel));
    loadIdle();
    G.mount(mountEl, view);
    return { destroy: function () { timeline.destroy(); } };
  }

  /* ===================================================================== */
  var SIMS = { "array-lista": renderArrList, hash: renderHash, bst: renderBST, heap: renderHeap };
  function page(root, sub) {
    document.title = "M\u00f3dulo 04 \u2014 Estructuras de datos";
    var current = { destroy: function () {} };
    var host = h("div.sim-host");
    var tabs = G.lessonTabs(
      [{ id: "array-lista", n: "1", label: "Arreglo vs lista" }, { id: "hash", n: "2", label: "Tabla hash" },
       { id: "bst", n: "3", label: "\u00c1rbol (BST)" }, { id: "heap", n: "4", label: "Heap" }],
      function (id) { switchTo(id); }, SIMS[sub] ? sub : "array-lista");
    function switchTo(id) { current.destroy(); current = SIMS[id](host) || { destroy: function () {} }; }
    var wrap = h("div.wrap.app-root",
      G.siteHome(),
      G.moduleHeader({ current: "04", eyebrow: "M\u00f3dulo 04 \u00b7 Estructuras de datos" }),
      tabs.node, host,
      h("footer.kbd-hint", h("span.faint", "\u2190 \u2192 paso \u00b7 espacio reproduce/pausa \u00b7 arrastra la l\u00ednea de tiempo")),
      G.siteFooter());
    G.mount(root, wrap);
    switchTo(tabs.current());
    return function () { current.destroy(); };
  }

  G.pages = G.pages || {};
  G.pages["modulo-04"] = page;

})(window.GUIA = window.GUIA || {});
