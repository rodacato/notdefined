/* core.js — namespace, helpers DOM/SVG, tema, marca. Carga primero. */
(function (G) {
  "use strict";

  /* ---- registro de contenido (lo llenan los data/*.js) ---- */
  G.topics = G.topics || [];        // en orden de folio
  G.blocks = G.blocks || [];        // {id, label, accent}
  G.widgets = G.widgets || {};      // slug -> fn(host, topic)

  /* limpieza entre vistas (timers de widgets) */
  G.cleanups = G.cleanups || [];
  G.addCleanup = function (fn) { G.cleanups.push(fn); };
  G.runCleanups = function () { G.cleanups.forEach(function (f) { try { f(); } catch (e) {} }); G.cleanups = []; };

  G.registerBlock = function (b) { G.blocks.push(b); };
  G.registerTopics = function (arr) { arr.forEach(function (t) { G.topics.push(t); }); };
  G.topicBySlug = function (slug) { return G.topics.find(function (t) { return t.slug === slug; }); };
  G.blockById = function (id) { return G.blocks.find(function (b) { return b.id === id; }); };

  /* ---- helpers DOM ---------------------------------------- */
  // el("div.clase", {attr}, ...hijos) — tag admite .clase y #id
  G.el = function (spec, props, children) {
    var tagMatch = spec.match(/^[a-zA-Z0-9]+/);
    var tag = tagMatch ? tagMatch[0] : "div";
    var node = document.createElement(tag);
    var classes = spec.match(/\.[\w-]+/g);
    if (classes) classes.forEach(function (c) { node.classList.add(c.slice(1)); });
    var idMatch = spec.match(/#([\w-]+)/);
    if (idMatch) node.id = idMatch[1];
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k === "style") node.setAttribute("style", v);
      else if (k === "on") Object.keys(v).forEach(function (ev) { node.addEventListener(ev, v[ev]); });
      else if (k in node && k !== "list") { try { node[k] = v; } catch (e) { node.setAttribute(k, v); } }
      else node.setAttribute(k, v);
    });
    if (children != null) G.append(node, children);
    return node;
  };

  G.append = function (node, children) {
    if (children == null) return node;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      if (typeof c === "string" || typeof c === "number") node.appendChild(document.createTextNode(String(c)));
      else node.appendChild(c);
    });
    return node;
  };

  G.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };

  G.frag = function () {
    var f = document.createDocumentFragment();
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) f.appendChild(arguments[i]);
    return f;
  };

  /* ---- helper SVG (por string; se re-renderiza completo) --
     Uso: svgHost.innerHTML = SVG(width,height, cuerpo)          */
  G.SVG = function (vbW, vbH, body, maxH) {
    return '<svg viewBox="0 0 ' + vbW + ' ' + vbH + '" width="100%" style="display:block;max-height:' +
      (maxH || vbH) + 'px">' + body + "</svg>";
  };
  // atajos para nodos SVG como string
  G.svgText = function (x, y, str, style, anchor) {
    return '<text x="' + x + '" y="' + y + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") +
      ' style="' + style + '">' + G.esc(str) + "</text>";
  };
  G.svgRect = function (x, y, w, h, attrs) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" ' + G.attrs(attrs) + "/>";
  };
  G.attrs = function (o) {
    return Object.keys(o).map(function (k) { return k + '="' + o[k] + '"'; }).join(" ");
  };
  G.esc = function (s) {
    return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
  };

  G.reduceMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  /* ---- iconos SVG inline (16-20px, currentColor) ---------- */
  var I = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    play: '<path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
    next: '<path d="M6 4l10 8-10 8z" fill="currentColor" stroke="none"/><rect x="17" y="4" width="3" height="16" fill="currentColor" stroke="none"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    add: '<path d="M12 5v14M5 12h14"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>',
    send: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    recv: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    cut: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 12.5L20 20M8.1 8.1L12 12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    callUp: '<path d="M7 17L17 7M9 7h8v8"/>',
    callDown: '<path d="M17 7L7 17M15 17H7V9"/>',
    // fuerza icons
    cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    hub: '<circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/>',
    swap: '<path d="M7 7h13l-4-4M17 17H4l4 4"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    build: '<path d="M14 6l4 4-9 9-4 1 1-4z"/><path d="M16 4l4 4"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6"/>',
    recycle: '<path d="M7 19H4l3-5M17 5l2 4-5 1M12 21l-3-4 5-1"/><path d="M7 19a8 8 0 0 1 1-13M17 5a8 8 0 0 1 2 11"/>',
    box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    stacks: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>',
    tree: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-2h12v2"/>',
    columns: '<rect x="4" y="4" width="6" height="16" rx="1"/><rect x="14" y="4" width="6" height="16" rx="1"/>',
    gridv: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l6-6M10 14l-6 6"/>',
    err: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>',
  };
  G.icon = function (name, size) {
    var body = I[name] || "";
    var s = size || 18;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      body + "</svg>";
  };

  /* ---- marca focal-frame (glifo de la casa) --------------- */
  G.markSVG = function (size) {
    var s = size || 26;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
      '<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>' +
      '<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>';
  };

  /* ---- tema (dark default + toggle 3 estados) ------------- */
  var KEY = "guia-tema";
  G.getThemeMode = function () {
    var v = null;
    try { v = localStorage.getItem(KEY); } catch (e) {}
    return v === "light" || v === "dark" || v === "system" ? v : "dark";
  };
  G.effectiveDark = function (mode) {
    mode = mode || G.getThemeMode();
    if (mode === "dark") return true;
    if (mode === "light") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  };
  G.applyTheme = function (mode) {
    document.documentElement.classList.toggle("dark", G.effectiveDark(mode));
    G.updateFavicon();
  };
  G.setThemeMode = function (mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    G.applyTheme(mode);
    document.dispatchEvent(new CustomEvent("guia:theme", { detail: { mode: mode, dark: G.effectiveDark(mode) } }));
  };

  G.updateFavicon = function () {
    var dark = document.documentElement.classList.contains("dark");
    var ink = dark ? "#0B1F26" : "#ECF2F2";
    var teal = dark ? "#45C0CE" : "#147A8C";
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<rect width="24" height="24" rx="5" fill="' + ink + '"/>' +
      '<g fill="none" stroke="' + teal + '" stroke-width="1.8" stroke-linecap="round">' +
      '<path d="M5 9V5h4M19 9V5h-4M5 15v4h4M19 15v4h-4"/></g>' +
      '<circle cx="12" cy="12" r="1.8" fill="' + teal + '"/></svg>';
    var href = "data:image/svg+xml," + encodeURIComponent(svg);
    var link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.type = "image/svg+xml";
    link.href = href;
  };

  // reacciona a cambios del SO cuando el modo es "system"
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () { if (G.getThemeMode() === "system") G.applyTheme("system"); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

})(window.GUIA = window.GUIA || {});
