/* ============================================================================
   components.js — Piezas compartidas entre páginas y el MOTOR de línea de
   tiempo. Presentacional + mecánica genérica de reproducción; nada de
   contenido de algoritmos concretos (eso vive en data/ y en las páginas).
   Depende de core.js (window.GUIA).
   ========================================================================== */
(function (G) {
  "use strict";
  var h = G.h, s = G.s, STATES = G.STATES, cellStyle = G.cellStyle, REDUCED = G.REDUCED;

  /* =========================================================================
     Cromo del sitio: barra con enlace de regreso + toggle de tema + pie.
     ========================================================================= */
  var THEME_ICONS = {
    light: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
    dark: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z",
    system: "M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 14.5zM9 20h6M12 16v4",
  };

  function themeToggle() {
    var box = h("div.theme-toggle", { role: "group", "aria-label": "Tema" });
    function paint() {
      var cur = G.getTheme();
      Array.prototype.forEach.call(box.children, function (b) {
        var on = b.getAttribute("data-theme") === cur;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    ["light", "dark", "system"].forEach(function (v) {
      var icon = s("svg.ticon", { viewBox: "0 0 24 24", "aria-hidden": "true" },
        s("path", { d: THEME_ICONS[v] }));
      box.appendChild(h("button", {
        type: "button", title: v, "data-theme": v,
        onclick: function () { G.setTheme(v); paint(); },
      }, icon));
    });
    document.addEventListener("guia:theme", paint);
    paint();
    return box;
  }

  function siteHome() {
    return h("div.site-bar",
      h("a.site-home", { href: "/guias/", title: "Volver al \u00edndice de gu\u00edas" }, "\u2190 notdefined.dev/guias"),
      themeToggle());
  }
  function siteFooter() {
    return h("footer.site-foot", h("span", "Algoritmos 1001 \u00b7 almanaque t\u00e9cnico"));
  }

  /* =========================================================================
     Navegación entre módulos (lee el manifiesto de data/catalogo.js).
     current: id de módulo activo ("00".."06") o null en índice/guía.
     ========================================================================= */
  function moduleNav(current) {
    var mods = (G.DATA && G.DATA.MODULES) || [];
    var nav = h("nav.mod-nav");
    nav.appendChild(h("a.mod-nav-home", { href: "#/" },
      h("span.mono", "\u2190"), " \u00cdndice"));
    mods.forEach(function (m) {
      var on = m.id === current;
      nav.appendChild(h("a.mod-nav-pill" + (on ? ".is-on" : ""), {
        href: "#/modulo-" + m.id,
        "aria-current": on ? "page" : null,
      }, h("span.mn-no", m.id), h("span.mn-name", m.short)));
    });
    return nav;
  }

  /* =========================================================================
     Cabecera de página de módulo (nav + eyebrow + título + intro).
     ========================================================================= */
  function moduleHeader(opts) {
    var head = h("header.mod-header");
    head.appendChild(moduleNav(opts.current));
    if (opts.eyebrow) head.appendChild(h("div.eyebrow", opts.eyebrow));
    if (opts.title) head.appendChild(h("h1.display.mod-title", { html: opts.title }));
    if (opts.intro) head.appendChild(h("p.mod-intro", { html: opts.intro }));
    return head;
  }

  /* =========================================================================
     Pestañas de sub-lección. tabs:[{id,n,label}], onSelect(id).
     Devuelve { node, select(id), current() }. Mantiene una sola vista viva.
     ========================================================================= */
  function lessonTabs(tabs, onSelect, initial) {
    var current = initial || tabs[0].id;
    var bar = h("div.tabbar", { role: "tablist", "aria-label": "Sub-lecciones" });
    var btns = {};
    tabs.forEach(function (t) {
      var b = h("button.lesson-tab", {
        role: "tab", type: "button",
        "aria-selected": t.id === current ? "true" : "false",
        onClick: function () { select(t.id); },
      }, h("span.mono.tab-no", t.n), t.label);
      btns[t.id] = b;
      bar.appendChild(b);
    });
    function select(id) {
      if (id === current) return;
      current = id;
      tabs.forEach(function (t) { btns[t.id].setAttribute("aria-selected", t.id === id ? "true" : "false"); });
      onSelect(id);
    }
    return { node: bar, select: select, current: function () { return current; } };
  }

  /* =========================================================================
     Celda + pista de arreglo. Estado por celda + marcadores (lo/mid/hi) +
     puntero (▲). Réplica del contrato visual del curso.
     ========================================================================= */
  var MARKER_HEX = { actual: "#E0A93B", mid: "#E0A93B", lo: "#3E7CB1", hi: "#3E7CB1",
    "lo\u00b7hi": "#3E7CB1", "lo\u00b7mid": "#E0A93B", "mid\u00b7hi": "#E0A93B" };

  function cell(value, state, marker, index, size, showPointer) {
    var st = cellStyle(state);
    var big = size >= 46;
    var meta = STATES[state] || STATES.neutral;
    var badge = meta.glyph && (state === "done" || state === "out" || state === "goal");

    var box = h("div.cell-box", {
      style: Object.assign({
        width: size + "px", height: size + "px",
        fontSize: (big ? 17 : 13.5) + "px",
      }, st),
    }, String(value));
    if (badge) {
      box.appendChild(h("span.cell-badge", { style: { background: meta.hex } }, meta.glyph));
    }

    var top = h("div.cell-marker");
    if (marker) {
      top.appendChild(h("span.mono.cell-marker-tag", {
        style: { background: MARKER_HEX[marker] || "var(--color-fg-default)" },
      }, marker));
    }

    var bottom = h("div.cell-index");
    if (showPointer) bottom.appendChild(h("span.cell-pointer", "\u25B2"));
    else bottom.appendChild(h("span.mono.cell-idx", String(index)));

    return h("div.cell", { style: { width: size + "px" } }, top, box, bottom);
  }

  function arrayTrack(opts) {
    var values = opts.values, states = opts.states || [], markers = opts.markers || {};
    var pointer = opts.pointer == null ? -1 : opts.pointer;
    var n = values.length;
    var size = n <= 12 ? 54 : n <= 18 ? 44 : n <= 24 ? 36 : 30;
    var row = h("div.track-row");
    values.forEach(function (v, i) {
      row.appendChild(cell(v, states[i] || "neutral", markers[i], i, size, pointer === i));
    });
    return h("div.track-scroll", row);
  }

  /* =========================================================================
     Leyenda del contrato de estados. Acepta keys de STATES o entradas locales
     { label, hex, dashed } para estados propios de una vista (pila, Hanói).
     ========================================================================= */
  function stateLegend(keys) {
    var wrap = h("div.state-legend");
    keys.forEach(function (k) {
      var meta = typeof k === "string" ? STATES[k] : k;
      if (!meta) return;
      var dashed = k === "out" || meta.dashed;
      var sw = h("span.sl-swatch", {
        style: {
          border: (dashed ? "1.5px dashed " : "2px solid ") + meta.hex,
          background: k === "neutral" ? "var(--color-bg-surface)" : meta.hex + "22",
        },
      });
      wrap.appendChild(h("span.sl-item", sw,
        h("span.mono.sl-label", meta.label + (meta.glyph ? " " + meta.glyph : ""))));
    });
    return wrap;
  }

  /* =========================================================================
     Fila de estadísticas (stat) + pastilla toggle.
     ========================================================================= */
  function stat(label, value, color) {
    return h("span.stat",
      h("span.mono.stat-label", { style: { color: color || "var(--color-fg-faint)" } }, label),
      h("span.mono.stat-value", String(value)));
  }
  function statRow() {
    return h("div.well.stat-row");
  }
  function togglePill(opts) {
    var b = h("button.pill", {
      type: "button",
      "aria-pressed": opts.pressed ? "true" : "false",
      disabled: opts.disabled || null,
      onClick: opts.onClick,
    });
    if (opts.icon) b.appendChild(h("span.mono", { style: { fontSize: "12px" } }, opts.icon));
    b.appendChild(document.createTextNode(" " + (opts.label || "")));
    return b;
  }

  /* =========================================================================
     MOTOR DE LÍNEA DE TIEMPO — mecánica de reproducción reutilizable.
     El estado de UI = (frames precomputados + cursor). Los controles SÓLO
     mueven el cursor; nunca recalculan el algoritmo. Cada simulación aporta
     sus frames y una función onFrame(frame, i, api) que pinta escenario y
     narración.

     opts:
       onFrame(frame, index, api)  requerido
       canAdvance(index)  -> bool  opcional: false bloquea avanzar
       onBlocked(index)            opcional: se llama cuando canAdvance bloquea
       unit                        etiqueta del scrubber (default "paso")
       speeds                      arreglo de velocidades (default [1,2,4])
     Devuelve api: { node, load, seek, next, prev, play, reset, setSpeed,
                     setDisabled, index(), frame(), destroy }
     ========================================================================= */
  function createTimeline(opts) {
    var frames = [];
    var i = 0, playing = false, speed = 1, disabled = false, timer = null;
    var SPEEDS = opts.speeds || [1, 2, 4];
    var unit = opts.unit || "paso";

    // --- controles ---
    function iconBtn(icon, label, onClick, variant) {
      return h("button.ctrl" + (variant === "play" ? ".ctrl-play" : ".ctrl-icon"),
        { type: "button", title: label, "aria-label": label, onClick: onClick },
        h("span", icon));
    }
    var btnReset = iconBtn("\u23EE", "Reiniciar", function () { reset(); });
    var btnBack = iconBtn("\u25C0", "Paso atr\u00e1s (\u2190)", function () { prev(); });
    var btnPlay = iconBtn("\u25B6", "Reproducir (espacio)", function () { togglePlay(); }, "play");
    var btnFwd = iconBtn("\u25B6\u25B6", "Paso adelante (\u2192)", function () { next(); });

    var segWrap = h("div.seg", { role: "group", "aria-label": "Velocidad de reproducci\u00f3n" });
    var segBtns = {};
    SPEEDS.forEach(function (sp) {
      var b = h("button", { type: "button", "aria-pressed": sp === speed ? "true" : "false",
        onClick: function () { setSpeed(sp); } }, sp + "x");
      segBtns[sp] = b; segWrap.appendChild(b);
    });

    var controlsRow = h("div.controls-row",
      h("div.ctrl-group", btnReset, btnBack, btnPlay, btnFwd),
      h("div.ctrl-group",
        h("span.eyebrow", { style: { fontSize: "10px" } }, "velocidad"), segWrap));

    // --- scrubber ---
    var fill = h("div.scrub-fill");
    var range = h("input.scrub", { type: "range", min: 0, max: 0, step: 1, value: 0,
      "aria-label": "L\u00ednea de tiempo de la animaci\u00f3n" });
    range.addEventListener("input", function () { seek(parseInt(range.value, 10)); });
    var labLeft = h("span.mono.scrub-lab");
    var labRight = h("span.mono.scrub-lab");
    var scrubBlock = h("div.scrub-block",
      h("div.scrub-wrap", h("div.scrub-track", fill), range),
      h("div.scrub-labels", labLeft, labRight));

    var node = h("div.timeline", controlsRow, scrubBlock);

    // --- render de controles según cursor ---
    function paint() {
      var last = frames.length - 1;
      var atStart = i <= 0, atEnd = i >= last;
      btnReset.disabled = disabled || atStart;
      btnBack.disabled = disabled || atStart;
      btnFwd.disabled = disabled || atEnd;
      btnPlay.disabled = disabled;
      btnPlay.querySelector("span").textContent = playing ? "\u275A\u275A" : "\u25B6";
      btnPlay.setAttribute("aria-label", playing ? "Pausa (espacio)" : "Reproducir (espacio)");
      range.disabled = disabled;
      range.max = last < 0 ? 0 : last;
      range.value = i;
      var pct = last <= 0 ? 0 : (i / last) * 100;
      fill.style.width = pct + "%";
      labLeft.textContent = unit + " " + i + " / " + (last < 0 ? 0 : last);
      labRight.textContent = "frame " + (i + 1) + " de " + (frames.length || 1);
      SPEEDS.forEach(function (sp) { segBtns[sp].setAttribute("aria-pressed", sp === speed ? "true" : "false"); });
    }

    function emit() { if (opts.onFrame) opts.onFrame(frames[i], i, api); }
    function render() { paint(); emit(); }

    // --- transiciones de cursor ---
    function seek(n) {
      var last = frames.length - 1;
      i = Math.max(0, Math.min(last, n));
      stop();
      render();
    }
    function prev() { if (i > 0) { stop(); i--; render(); } }
    function next(force) {
      var last = frames.length - 1;
      if (i >= last) return;
      if (!force && opts.canAdvance && !opts.canAdvance(i)) {
        if (opts.onBlocked) opts.onBlocked(i);
        return;
      }
      stop(); i++; render();
    }
    function tick() {
      var last = frames.length - 1;
      if (i >= last) { stop(); return; }
      if (opts.canAdvance && !opts.canAdvance(i)) { stop(); if (opts.onBlocked) opts.onBlocked(i); return; }
      i++; render();
      if (i >= last) stop();
    }
    function play() {
      if (disabled) return;
      var last = frames.length - 1;
      if (i >= last) i = 0;
      playing = true;
      loop();
      render();
    }
    function togglePlay() { if (playing) stop(); else play(); render(); }
    function loop() {
      clearTimer();
      var ms = REDUCED ? 120 : Math.round(760 / speed);
      timer = setInterval(tick, ms);
    }
    function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function stop() { playing = false; clearTimer(); }
    function reset() { stop(); i = 0; render(); }
    function setSpeed(sp) { speed = sp; if (playing) loop(); paint(); }
    function setDisabled(v) { disabled = v; if (v) stop(); paint(); }

    // --- teclado (una sola simulación viva a la vez) ---
    function onKey(e) {
      if (disabled) return;
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (e.key === "ArrowLeft") { if (tag === "INPUT") return; e.preventDefault(); prev(); }
      else if (e.key === "ArrowRight") { if (tag === "INPUT") return; e.preventDefault(); next(); }
      else if (e.key === " " || e.code === "Space") {
        if (tag === "BUTTON" || tag === "INPUT" || tag === "SELECT") return;
        e.preventDefault(); togglePlay(); render();
      }
    }
    window.addEventListener("keydown", onKey);

    var api = {
      node: node,
      load: function (fr, opt) { frames = fr || []; i = (opt && opt.index) || 0; stop(); render(); return api; },
      seek: seek, next: next, prev: prev, play: play, reset: reset,
      setSpeed: setSpeed, setDisabled: setDisabled,
      index: function () { return i; },
      frame: function () { return frames[i]; },
      last: function () { return frames.length - 1; },
      destroy: function () { stop(); window.removeEventListener("keydown", onKey); },
    };
    return api;
  }

  /* =========================================================================
     BarTrack — pista de barras con identidad estable por elemento, para que
     swaps y desplazamientos se animen solos (transición en `left`/`height`).
     Reutilizada por el módulo de ordenamiento. update(frame, maxVal) reposiciona.
     ========================================================================= */
  var BAR = {
    neutral: { bg: "#CDC3B1", bd: "#B3A892" },
    active:  { bg: "#E0A93B", bd: "#B07F1d" },
    cand:    { bg: "#3E7CB1", bd: "#2f5f8a" },
    goal:    { bg: "#7B5EA7", bd: "#5d4682" },
    done:    { bg: "#4C9A6A", bd: "#3a7a52" },
    out:     { bg: "#E3CFC9", bd: "#B05B4D" },
    path:    { bg: "#2E8B8B", bd: "#246d6d" },
  };
  function barMarkerColor(label) {
    if (/pivote|piv/.test(label)) return "#7B5EA7";
    if (/m\u00edn|mano|activo|\u25CE|fijad|inicio|queda|insert/.test(label)) return "#E0A93B";
    if (/i\b|j\b|compar|izq|der|mayor/.test(label)) return "#3E7CB1";
    return "#1F1B16";
  }
  function createBarTrack(opts) {
    opts = opts || {};
    var height = opts.height || 172, TOP = 24, BOT = 24;
    var scroll = h("div.bar-scroll");
    var stage = h("div.bar-stage");
    var overlay = h("div.bar-overlay");
    stage.appendChild(overlay);
    scroll.appendChild(stage);
    var bars = {};   // id -> nodos persistentes

    function update(frame, maxVal) {
      var order = frame.order, n = order.length;
      var slot = n <= 8 ? 54 : n <= 10 ? 46 : n <= 12 ? 40 : 34, gap = 8;
      var W = n * slot;
      var mv = maxVal || Math.max.apply(null, order.map(function (e) { return e.value; }));
      stage.style.width = W + "px";
      stage.style.height = (TOP + height + BOT) + "px";

      var pos = {}; order.forEach(function (e, i) { pos[e.id] = i; });
      var seen = {};
      order.forEach(function (e) {
        var i = pos[e.id], stt = frame.states[i] || "neutral", c = BAR[stt] || BAR.neutral;
        var barH = 14 + (e.value / mv) * (height - 14);
        var b = bars[e.id];
        if (!b) {
          b = {};
          b.el = h("div.bar-el");
          b.marker = h("div.bar-marker");
          b.val = h("div.mono.bar-val");
          b.bar = h("div.bar-fill");
          b.idx = h("div.mono.bar-idx");
          b.el.appendChild(b.marker); b.el.appendChild(b.val); b.el.appendChild(b.bar); b.el.appendChild(b.idx);
          stage.appendChild(b.el);
          bars[e.id] = b;
        }
        seen[e.id] = true;
        b.el.style.left = (i * slot + gap / 2) + "px";
        b.el.style.bottom = BOT + "px";
        b.el.style.width = (slot - gap) + "px";
        b.val.textContent = e.value;
        b.val.style.bottom = (barH + 2) + "px";
        b.bar.style.height = barH + "px";
        b.bar.style.background = c.bg;
        b.bar.style.borderColor = c.bd;
        b.idx.textContent = i;
        b.idx.style.bottom = (-BOT + 4) + "px";
        var mk = frame.markers && frame.markers[i];
        if (mk) {
          b.marker.style.display = "";
          b.marker.style.bottom = (barH + 16) + "px";
          G.mount(b.marker, h("span.mono.bar-marker-tag", { style: { background: barMarkerColor(mk) } }, mk));
        } else { b.marker.style.display = "none"; }
      });
      // eliminar barras que ya no existen (regenerar)
      Object.keys(bars).forEach(function (id) { if (!seen[id]) { stage.removeChild(bars[id].el); delete bars[id]; } });

      // overlays: frontera + brackets (sin animación)
      G.clear(overlay);
      if (frame.boundary > 0 && frame.boundary < n) {
        overlay.appendChild(h("div.bar-boundary", { style: { left: (frame.boundary * slot - gap / 2) + "px", top: (TOP - 6) + "px", bottom: BOT + "px" } }));
      }
      (frame.brackets || []).forEach(function (br) {
        var el = h("div.bar-bracket", { style: {
          left: (br.lo * slot + 2) + "px", width: ((br.hi - br.lo) * slot - 4) + "px",
          bottom: (BOT - 14) + "px", borderTopColor: br.color || "var(--color-fg-subtle)" } });
        if (br.label) el.appendChild(h("span.mono.bar-bracket-lab", { style: { color: br.color || "var(--color-fg-subtle)" } }, br.label));
        overlay.appendChild(el);
      });
    }

    function reset() { Object.keys(bars).forEach(function (id) { stage.removeChild(bars[id].el); delete bars[id]; }); }

    return { node: scroll, update: update, reset: reset };
  }

  /* =========================================================================
     TreeView — árbol posicionado (nodos con x,y precomputados). Usado por BST,
     heap. nodes: {id,value,label,x,y,parent,state,sub}. Estado colorea desde BAR.
     ========================================================================= */
  function treeView(nodes, opts) {
    opts = opts || {};
    var activeId = opts.activeId == null ? -1 : opts.activeId;
    var xStep = opts.xStep || 50, yStep = opts.yStep || 58, r = opts.r || 16, pad = opts.pad || 26;
    if (!nodes || !nodes.length) return h("div.faint", { style: { padding: "34px 0", textAlign: "center", fontSize: "13px" } }, "\u00e1rbol vac\u00edo");
    var xs = nodes.map(function (n) { return n.x; }), ys = nodes.map(function (n) { return n.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), maxY = Math.max.apply(null, ys);
    var W = (maxX - minX) * xStep + pad * 2, H = opts.height || (maxY * yStep + pad * 2 + 12);
    function px(n) { return pad + (n.x - minX) * xStep; } function py(n) { return pad + n.y * yStep + 6; }
    var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });
    var svg = s("svg", { width: Math.max(W, 160), height: H, style: { display: "block", margin: "0 auto" } });
    nodes.forEach(function (n) {
      if (n.parent != null && byId[n.parent]) svg.appendChild(s("line", { x1: px(byId[n.parent]), y1: py(byId[n.parent]), x2: px(n), y2: py(n), stroke: "var(--color-border-strong)", "stroke-width": "1.2" }));
    });
    nodes.forEach(function (n) {
      var b = BAR[n.state] || BAR.neutral, on = n.id === activeId;
      if (n.sub) svg.appendChild(s("text", { x: px(n), y: py(n) - r - 5, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "9.5", fill: "var(--color-fg-faint)" }, n.sub));
      svg.appendChild(s("circle", { cx: px(n), cy: py(n), r: on ? r + 2 : r, fill: b.bg, stroke: on ? "var(--color-fg-default)" : b.bd, "stroke-width": on ? "2.5" : "1.4", "stroke-dasharray": n.state === "out" ? "3 2" : "0" }));
      svg.appendChild(s("text", { x: px(n), y: py(n) + 4.5, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "12.5", "font-weight": "600", fill: (n.state === "neutral" || n.state === "out") ? "var(--color-fg-default)" : "var(--color-bg-canvas)" }, String(n.label)));
    });
    return h("div.tree-scroll", svg);
  }

  /* =========================================================================
     ListView — lista enlazada de nodos {id,value,state}. rewire: índices con
     la flecha resaltada. pointer: índice activo.
     ========================================================================= */
  function listView(opts) {
    var nodes = opts.nodes, pointer = opts.pointer == null ? -1 : opts.pointer, rewire = opts.rewire || [];
    var sz = opts.compact ? 36 : 42;
    var row = h("div.listview", h("span.mono.lv-head", "head"), h("span.lv-arrow0", "\u2192"));
    nodes.forEach(function (nd, i) {
      var st = i === pointer ? "active" : (nd.state || "neutral");
      var b = BAR[st] || BAR.neutral;
      var hot = rewire.indexOf(i) >= 0;
      row.appendChild(h("div.lv-node", { style: { minWidth: sz + "px", height: sz + "px", border: "1.5px solid " + b.bd, background: b.bg } }, String(nd.value)));
      row.appendChild(h("span.lv-arrow", { style: { color: hot ? "var(--st-active)" : "var(--color-fg-faint)", fontWeight: hot ? "700" : "400" } }, i === nodes.length - 1 ? "\u2192 \u2300" : "\u2192"));
    });
    return row;
  }

  /* =========================================================================
     GraphView — grafo con coordenadas fijas. nodeStates/edgeStates colorean
     desde BAR/edgeStyle. Soporta dirigido (flechas), ponderado (peso), badges
     y clics en aristas/nodos. Se reconstruye por frame.
     ========================================================================= */
  function edgeStyle(state) {
    switch (state) {
      case "cand":   return { stroke: "#3E7CB1", w: 2.6, dash: "0" };
      case "active": return { stroke: "#E0A93B", w: 3.6, dash: "0" };
      case "done":   return { stroke: "#4C9A6A", w: 3.6, dash: "0" };
      case "path":   return { stroke: "#2E8B8B", w: 5, dash: "0" };
      case "out":    return { stroke: "#B05B4D", w: 2, dash: "5 3" };
      default:       return { stroke: "var(--color-border-strong)", w: 1.6, dash: "0" };
    }
  }
  function graphView(opts) {
    var graph = opts.graph, nodeStates = opts.nodeStates || {}, edgeStates = opts.edgeStates || {};
    var directed = !!opts.directed, weighted = !!opts.weighted, badges = opts.badges || {};
    var activeId = opts.activeId == null ? null : opts.activeId;
    var width = opts.width || 400, height = opts.height || 250, r = opts.r || 19;
    var pos = {}; graph.nodes.forEach(function (n) { pos[n.id] = n; });
    function eState(u, v) { return edgeStates[u + "-" + v] || edgeStates[v + "-" + u] || "neutral"; }
    var svg = s("svg", { viewBox: "0 0 " + width + " " + height, width: "100%", style: { display: "block", maxHeight: (height + 10) + "px" } });
    var defs = s("defs"); var marker = s("marker", { id: "ah", markerWidth: "9", markerHeight: "9", refX: "7", refY: "3", orient: "auto" }, s("path", { d: "M0,0 L7,3 L0,6 Z", fill: "var(--color-fg-subtle)" })); defs.appendChild(marker); svg.appendChild(defs);
    graph.edges.forEach(function (e) {
      var a = pos[e.u], b = pos[e.v], st = eState(e.u, e.v), sty = edgeStyle(st);
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      var x1 = a.x + ux * r, y1 = a.y + uy * r, x2 = b.x - ux * (r + (directed ? 5 : 0)), y2 = b.y - uy * (r + (directed ? 5 : 0));
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      var g = s("g", opts.onEdgeClick ? { style: { cursor: "pointer" }, onClick: function () { opts.onEdgeClick(e); } } : {});
      g.appendChild(s("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: sty.stroke, "stroke-width": sty.w, "stroke-dasharray": sty.dash, "marker-end": directed ? "url(#ah)" : null, "stroke-linecap": "round" }));
      if (weighted) { g.appendChild(s("rect", { x: mx - 11, y: my - 9, width: "22", height: "17", rx: "4", fill: "var(--color-bg-canvas)", stroke: "var(--color-border-default)", "stroke-width": "1" })); g.appendChild(s("text", { x: mx, y: my + 3.5, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "11", "font-weight": "600", fill: "var(--color-fg-default)" }, String(e.w))); }
      svg.appendChild(g);
    });
    graph.nodes.forEach(function (n) {
      var st = nodeStates[n.id] || "neutral", f = BAR[st] || BAR.neutral, on = n.id === activeId;
      var g = s("g", opts.onNodeClick ? { style: { cursor: "pointer" }, onClick: function () { opts.onNodeClick(n); } } : {});
      if (badges[n.id] != null) {
        var bw = String(badges[n.id]).length * 7 + 10;
        g.appendChild(s("rect", { x: n.x + r - 6, y: n.y - r - 9, width: bw, height: "16", rx: "8", fill: "var(--color-fg-default)" }));
        g.appendChild(s("text", { x: n.x + r - 6 + bw / 2, y: n.y - r + 2.5, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "10", "font-weight": "600", fill: "var(--color-bg-canvas)" }, String(badges[n.id])));
      }
      g.appendChild(s("circle", { cx: n.x, cy: n.y, r: on ? r + 2 : r, fill: f.bg, stroke: on ? "var(--color-fg-default)" : f.bd, "stroke-width": on ? "2.6" : "1.6", "stroke-dasharray": st === "out" ? "3 2" : "0" }));
      g.appendChild(s("text", { x: n.x, y: n.y + 5, "text-anchor": "middle", "font-family": "var(--font-mono)", "font-size": "14", "font-weight": "600", fill: (st === "neutral" || st === "out") ? "var(--color-fg-default)" : "var(--color-bg-canvas)" }, n.label || n.id));
      svg.appendChild(g);
    });
    return h("div.graph-scroll", svg);
  }

  /* -------- Cola FIFO / Pila LIFO -------- */
  function queueView(items, opts) {
    opts = opts || {};
    var wrap = h("div.well.qv", h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "8px" } }, opts.label || "cola (FIFO)"));
    var row = h("div.qv-row");
    if (opts.note) row.appendChild(h("span.mono", { style: { fontSize: "9.5px", color: "var(--color-fg-faint)" } }, opts.note));
    if (!items.length) row.appendChild(h("span.faint", { style: { fontSize: "12px" } }, "vac\u00eda"));
    else items.forEach(function (it, i) { row.appendChild(h("div.qv-item" + (i === 0 ? ".head" : ""), String(it))); });
    wrap.appendChild(row); return wrap;
  }
  function stackView(items, opts) {
    opts = opts || {};
    var wrap = h("div.well.sv", h("div.eyebrow", { style: { fontSize: "10px", marginBottom: "8px" } }, opts.label || "pila (LIFO)"));
    var col = h("div.sv-col");
    if (!items.length) col.appendChild(h("span.faint", { style: { fontSize: "12px" } }, "vac\u00eda"));
    else items.forEach(function (it, i) { col.appendChild(h("div.sv-item" + (i === items.length - 1 ? ".top" : ""), it + (i === items.length - 1 ? "  \u2190 tope" : ""))); });
    wrap.appendChild(col); return wrap;
  }

  /* --- Publicar --- */
  G.siteHome = siteHome;
  G.siteFooter = siteFooter;
  G.moduleNav = moduleNav;
  G.moduleHeader = moduleHeader;
  G.lessonTabs = lessonTabs;
  G.cell = cell;
  G.arrayTrack = arrayTrack;
  G.stateLegend = stateLegend;
  G.stat = stat;
  G.statRow = statRow;
  G.togglePill = togglePill;
  G.createTimeline = createTimeline;
  G.createBarTrack = createBarTrack;
  G.BAR = BAR;
  G.treeView = treeView;
  G.listView = listView;
  G.graphView = graphView;
  G.edgeStyle = edgeStyle;
  G.queueView = queueView;
  G.stackView = stackView;

})(window.GUIA = window.GUIA || {});
