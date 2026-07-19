/* core.js — namespace GUIA, helpers de DOM, iconos y toggle de tema.
   Carga primero. Todo cuelga de window.GUIA. Sin módulos ES. */
(function (G) {
  "use strict";

  // Contenedor de datos: lo pueblan los archivos de data/.
  G.data = G.data || { coleccion: null, temas: [] };

  /* ---- Helpers de DOM ---------------------------------------------------- */
  // el("div.clase", {attrs}, [hijos | "texto"])  → HTMLElement
  G.el = function (spec, attrs, children) {
    var parts = spec.split(".");
    var tag = parts[0] || "div";
    var node = document.createElement(tag);
    if (parts.length > 1) node.className = parts.slice(1).join(" ");
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else if (k === "onClick") node.addEventListener("click", v);
        else if (k === "style") node.setAttribute("style", v);
        else if (k in node && k !== "list") { try { node[k] = v; } catch (e) { node.setAttribute(k, v); } }
        else node.setAttribute(k, v);
      });
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null || c === false) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  };
  G.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };
  G.qs = function (sel, root) { return (root || document).querySelector(sel); };

  G.reducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  /* ---- Iconos (SVG inline, currentColor) --------------------------------- */
  var P = { fill: "none", stroke: "currentColor", "stroke-width": "1.7", "stroke-linecap": "round", "stroke-linejoin": "round" };
  var ICONS = {
    marca: "<path d='M6 6h5M6 6v5M18 6h-5M18 6v5M6 18h5M6 18v-5M18 18h-5M18 18v-5'/><circle cx='12' cy='12' r='1.6' fill='currentColor' stroke='none'/>",
    sol: "<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'/>",
    luna: "<path d='M20 14.5A8 8 0 1 1 9.5 4a6.2 6.2 0 0 0 10.5 10.5z'/>",
    monitor: "<rect x='3' y='4' width='18' height='12' rx='1.6'/><path d='M8 20h8M12 16v4'/>",
    fundamento: "<path d='M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6'/>",
    como: "<circle cx='12' cy='12' r='3'/><path d='M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1'/>",
    visualiza: "<path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z'/><circle cx='12' cy='12' r='3'/>",
    mito: "<path d='M9.5 21h5M8 17a6 6 0 1 1 8 0c-.8.7-1 1.2-1 2H9c0-.8-.2-1.3-1-2z'/>",
    recursos: "<path d='M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 3v18'/>",
    fuerza: "<path d='M13 2 4 14h7l-1 8 9-12h-7z'/>",
    estrella: "<path d='M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.9 1-5.8L3.5 9.2l5.9-.9z' fill='currentColor' stroke='none'/>",
    prev: "<path d='M15 6l-6 6 6 6'/>",
    next: "<path d='M9 6l6 6-6 6'/>",
    play: "<path d='M7 5l12 7-12 7z' fill='currentColor' stroke='none'/>",
    pausa: "<path d='M8 5v14M16 5v14'/>",
    reinicia: "<path d='M4 4v6h6M20 20v-6h-6'/><path d='M20 10a8 8 0 0 0-14-4M4 14a8 8 0 0 0 14 4'/>",
    check: "<path d='M20 6L9 17l-5-5'/>",
    flecha: "<path d='M5 12h14M13 6l6 6-6 6'/>"
  };
  G.icon = function (name, size) {
    var body = ICONS[name] || ICONS.flecha;
    var s = size || 24;
    var attr = 'viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="' + P.fill +
      '" stroke="' + P.stroke + '" stroke-width="' + P["stroke-width"] +
      '" stroke-linecap="' + P["stroke-linecap"] + '" stroke-linejoin="' + P["stroke-linejoin"] + '"';
    return '<svg xmlns="http://www.w3.org/2000/svg" ' + attr + ">" + body + "</svg>";
  };

  /* ---- Toggle de tema (light / dark / system) ---------------------------- */
  var KEY = "guia-tema";
  function pref() { try { return localStorage.getItem(KEY) || "dark"; } catch (e) { return "dark"; } }
  function apply(p) {
    var dark = p === "dark" || (p === "system" && window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }
  G.setTheme = function (p) {
    try { localStorage.setItem(KEY, p); } catch (e) {}
    apply(p);
    renderToggle();
    document.dispatchEvent(new CustomEvent("guia:theme", { detail: { pref: p } }));
  };
  function renderToggle() {
    var host = document.getElementById("theme-toggle");
    if (!host) return;
    var cur = pref();
    var opts = [["light", "sol", "Tema claro"], ["dark", "luna", "Tema oscuro"], ["system", "monitor", "Según el sistema"]];
    G.clear(host);
    opts.forEach(function (o) {
      host.appendChild(G.el("button", {
        type: "button", title: o[2], "aria-label": o[2],
        "aria-pressed": cur === o[0] ? "true" : "false",
        html: G.icon(o[1], 16), onClick: function () { G.setTheme(o[0]); }
      }));
    });
  }
  // Si el usuario está en "system", seguir los cambios del SO en vivo.
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onCh = function () { if (pref() === "system") { apply("system"); } };
    if (mq.addEventListener) mq.addEventListener("change", onCh); else if (mq.addListener) mq.addListener(onCh);
  }
  G.renderToggle = renderToggle;

  // Búsqueda de tema por slug (útil en varias vistas).
  G.temaPorSlug = function (slug) {
    return G.data.temas.filter(function (t) { return t.slug === slug; })[0] || null;
  };
  G.temaPorIndice = function (i) { return G.data.temas[i] || null; };

})(window.GUIA = window.GUIA || {});
