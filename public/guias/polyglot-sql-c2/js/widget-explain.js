/* ============================================================================
   js/widget-explain.js — LA JOYA. EXPLAIN visual: la misma query sobre la
   misma tabla; el slider mueve la selectividad y el planner cambia de vía.
   Modelo de costo DETERMINISTA (constantes de PostgreSQL 17). Cero Math.random.
   ============================================================================ */
(function (G) {
  "use strict";
  var el = G.el;

  // -------- Modelo de costo (relativo a seq_page_cost = 1.0) -----------------
  // Devuelve, para N filas que hacen match, el costo total de cada vía y sus
  // números de plan (startup..total) para pintar el EXPLAIN.
  function modelo(cfg, N) {
    var t = cfg.tabla, c = cfg.costos;
    var T = t.reltuples, P = t.relpages, RPP = t.rowsPerPage;
    N = Math.max(1, Math.min(T, Math.round(N)));

    // --- Seq Scan: barre todas las páginas + CPU por fila. Constante. ---
    var seqTotal = P * c.seq_page_cost + T * c.cpu_tuple_cost;

    // --- Index Scan: baja el árbol y salta al heap fila por fila (random I/O). ---
    var idxStartup = 0.42;
    var heapPages = Math.min(N, P);              // páginas distintas (aprox)
    var idxHeap = heapPages * c.random_page_cost;
    var idxCpuIndex = N * (c.cpu_index_tuple_cost + c.cpu_operator_cost);
    var idxCpuTuple = N * c.cpu_tuple_cost;
    var idxTotal = idxStartup + idxHeap + idxCpuIndex + idxCpuTuple;

    // --- Bitmap Heap Scan: arma bitmap (startup) y lee páginas en orden físico. ---
    // Páginas con >= 1 match; a más páginas, lectura más secuencial (más barata por página).
    var pages = P * (1 - Math.pow(1 - N / T, RPP));
    pages = Math.min(P, Math.max(1, pages));
    var frac = pages / P;
    var perPage = c.seq_page_cost + (c.random_page_cost - c.seq_page_cost) * (1 - frac);
    var bmIndexTotal = N * (c.cpu_index_tuple_cost + c.cpu_operator_cost) + 0.29;
    var bmStartup = bmIndexTotal + c.bitmap_build_overhead;   // el bitmap se arma antes de la 1ª fila
    var bmHeap = pages * perPage;
    var bmCpu = N * c.cpu_tuple_cost;
    var bmTotal = bmStartup + bmHeap + bmCpu;

    return {
      N: N,
      rutas: {
        idx:    { nombre: "Index Scan",       startup: idxStartup, total: idxTotal },
        bitmap: { nombre: "Bitmap Heap Scan", startup: bmStartup,  total: bmTotal, idxTotal: bmIndexTotal, pages: pages },
        seq:    { nombre: "Seq Scan",         startup: 0,          total: seqTotal }
      }
    };
  }

  function ganadora(m) {
    var r = m.rutas, best = "idx", bestCost = r.idx.total;
    if (r.bitmap.total < bestCost) { best = "bitmap"; bestCost = r.bitmap.total; }
    if (r.seq.total < bestCost) { best = "seq"; bestCost = r.seq.total; }
    return best;
  }

  // -------- Formato ----------------------------------------------------------
  function cost(x) { return x.toFixed(2); }
  // Concordancia de número: "1 fila" vs "32 filas".
  function filas(n) { return G.fmt(n) + (n === 1 ? " fila" : " filas"); }
  function pct(N, T) {
    var p = N / T * 100;
    if (p >= 1) return p.toFixed(1) + "%";
    if (p >= 0.01) return p.toFixed(2) + "%";
    return "~" + p.toFixed(4) + "%";
  }

  // Slider (0..1000) → filas, en dos tramos: logarítmico hasta el 1% de la tabla
  // (para que la banda de index scan sea navegable) y lineal de ahí al 100%
  // (para que la banda de seq scan — el remate de la ficha — tenga recorrido).
  var PIVOTE = 700;
  function rowsPivote(T) { return Math.max(2, Math.round(T / 100)); }

  function sliderToRows(v, T) {
    var RP = rowsPivote(T);
    if (v <= PIVOTE) return Math.round(Math.exp((v / PIVOTE) * Math.log(RP)));
    return Math.round(RP + ((v - PIVOTE) / (1000 - PIVOTE)) * (T - RP));
  }
  function rowsToSlider(N, T) {
    var RP = rowsPivote(T);
    if (N <= RP) return Math.round(PIVOTE * Math.log(N) / Math.log(RP));
    return Math.round(PIVOTE + (1000 - PIVOTE) * (N - RP) / (T - RP));
  }

  // -------- EXPLAIN del plan elegido (texto con números en vivo) -------------
  function planText(key, m, cfg) {
    var t = cfg.tabla, r = m.rutas, N = m.N, T = t.reltuples;
    var idx = t.indice, tbl = t.nombre, w = t.width;
    if (key === "idx") {
      return "Index Scan using " + idx + " on " + tbl + "\n" +
             "    (cost=" + cost(r.idx.startup) + ".." + cost(r.idx.total) + " rows=" + N + " width=" + w + ")\n" +
             "  Index Cond: (estado = $1)";
    }
    if (key === "bitmap") {
      return "Bitmap Heap Scan on " + tbl + "  (cost=" + cost(r.bitmap.startup) + ".." + cost(r.bitmap.total) + " rows=" + N + " width=" + w + ")\n" +
             "  Recheck Cond: (estado = $1)\n" +
             "  ->  Bitmap Index Scan on " + idx + "  (cost=0.00.." + cost(r.bitmap.idxTotal) + " rows=" + N + " width=0)\n" +
             "        Index Cond: (estado = $1)";
    }
    return "Seq Scan on " + tbl + "  (cost=0.00.." + cost(r.seq.total) + " rows=" + N + " width=" + w + ")\n" +
           "  Filter: (estado = $1)\n" +
           "  Rows Removed by Filter: " + G.fmt(T - N);
  }

  var NOMBRES = { idx: "Index Scan", bitmap: "Bitmap Heap Scan", seq: "Seq Scan" };

  // -------- Montaje ----------------------------------------------------------
  G.widgets = G.widgets || {};
  G.widgets.explain = function (cfg) {
    var T = cfg.tabla.reltuples;
    var widget = el("div.widget");

    // Barra
    widget.appendChild(el("div.widget__bar", null, [
      el("div.widget__title", null, [el("span.dot"), cfg.titulo]),
      el("button.widget__reset", { type: "button", text: "Reiniciar" })
    ]));

    var body = el("div.widget__body");
    widget.appendChild(body);

    // Query fija
    body.appendChild(el("div.widget__query", { html:
      '<span class="kw">SELECT</span> * <span class="kw">FROM</span> pedidos <span class="kw">WHERE</span> estado = <span class="val">$1</span>;   ' +
      '<span style="opacity:.6">— tabla: 1,000,000 filas · índice btree pedidos_estado_idx(estado)</span>'
    }));

    // Slider
    var read = el("span.slider-read");
    var input = el("input", {
      type: "range", min: "0", max: "1000", step: "1",
      "aria-label": "¿Cuántas filas hacen match?"
    });
    body.appendChild(el("div.slider-row", null, [
      el("div.slider-head", null, [
        el("label", { html: "¿Cuántas filas hacen match?", for: "" }),
        read
      ]),
      input,
      el("div.slider-ticks", null, [
        el("span", { text: "1 fila" }),
        el("span", { text: "banda media" }),
        el("span", { text: "100% · 1 M" })
      ])
    ]));

    // Narración
    var narr = el("div.widget__narr");
    body.appendChild(narr);

    // Comparativa de rutas
    var routes = {};
    var routesWrap = el("div.routes");
    ["idx", "bitmap", "seq"].forEach(function (key) {
      var signal = el("span.route__signal");
      var fill = el("span.route__fill");
      var cst = el("span.route__cost");
      var row = el("div.route", null, [
        el("span.route__name", null, [signal, NOMBRES[key]]),
        el("span.route__track", null, [fill]),
        cst
      ]);
      row.dataset.key = key;
      routes[key] = { row: row, fill: fill, cost: cst };
      routesWrap.appendChild(row);
    });
    body.appendChild(el("div", { style: "margin-top:20px" }, [
      el("div.section__label", { text: "Costo estimado por vía · más barato gana", style: "margin-bottom:12px" }),
      routesWrap
    ]));

    // Árbol de plan / EXPLAIN elegido
    var planBarWin = el("span.win");
    var planPre = el("pre");
    var plan = el("div.plan", null, [
      el("div.plan__bar", null, [el("span", { text: "Plan elegido" }), planBarWin]),
      planPre
    ]);
    body.appendChild(plan);

    // -------- Render en vivo -------------------------------------------------
    function render() {
      var N = sliderToRows(+input.value, T);
      var m = modelo(cfg, N);
      var win = ganadora(m);
      var maxCost = Math.max(m.rutas.idx.total, m.rutas.bitmap.total, m.rutas.seq.total);

      read.innerHTML = filas(N) + " <span class=\"pct\">(" + pct(N, T) + ")</span>";
      input.setAttribute("aria-valuetext",
        filas(N) + ", " + pct(N, T) + " de la tabla — plan elegido: " + NOMBRES[win]);

      ["idx", "bitmap", "seq"].forEach(function (key) {
        var r = routes[key];
        r.fill.style.width = (m.rutas[key].total / maxCost * 100).toFixed(1) + "%";
        r.cost.textContent = cost(m.rutas[key].total);
        r.row.classList.toggle("is-chosen", key === win);
      });

      narr.innerHTML = cfg.narr[win]
        .replace(/\{filas\}/g, filas(N))
        .replace(/\{pct\}/g, pct(N, T));

      planBarWin.textContent = NOMBRES[win];
      planPre.innerHTML = G.highlightPlan(planText(win, m, cfg));
    }

    var DEFAULT = rowsToSlider(20, T); // abre en régimen index scan (match chico)
    function reset() { input.value = DEFAULT; render(); }

    input.addEventListener("input", render);
    widget.querySelector(".widget__reset").addEventListener("click", reset);

    reset();
    return widget;
  };

})(window.GUIA = window.GUIA || {});
