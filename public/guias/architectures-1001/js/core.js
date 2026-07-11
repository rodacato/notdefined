/* ============================================================================
   1001 — Arquitecturas · js/core.js — MOTOR (base)
   ----------------------------------------------------------------------------
   Publica en window.GUIA: helpers de DOM, el set de iconos SVG inline (reemplazo
   offline de Material Symbols), el glifo de marca y la gestión de tema. Carga
   primero; el resto de js/ y los data-*.js cuelgan del mismo namespace.
   Sin frameworks, sin ES modules: funciones cortas y editables a mano.
   ========================================================================== */
(function (G) {
  "use strict";

  /* ---- Helper de creación de DOM -----------------------------------------
     h("div", { class:"x", onclick:fn, "aria-label":"y" }, hijo1, hijo2, …)
     - class/className → clase · on<evento> → listener · resto → atributos.
     - hijos: string (texto), Node, o arreglo de ellos. null/false se ignoran. */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === "class" || k === "className") el.className = v;
        else if (k === "html") el.innerHTML = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function")
          el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v === true ? "" : v);
      }
    }
    append(el, kids);
    return el;
  }

  function append(el, kids) {
    for (const kid of kids) {
      if (kid == null || kid === false) continue;
      if (Array.isArray(kid)) append(el, kid);
      else el.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  /* ---- Texto con `término` técnico → <code> inline ----------------------- */
  function ticks(text, codeClass) {
    const parts = String(text).split("`");
    return parts.map((p, i) =>
      i % 2 ? h("code", codeClass ? { class: codeClass } : null, p) : document.createTextNode(p));
  }

  /* ---- Iconos SVG inline (stroke = currentColor) -------------------------
     Equivalentes sobrios de los Material Symbols que usaba la versión React.
     El <svg> mide 1em: hereda tamaño del `font-size` del contenedor. */
  const ICONS = {
    light_mode:
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    dark_mode:
      '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
    computer:
      '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
    arrow_upward: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    arrow_downward: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    arrow_forward: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrow_back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    north_east: '<path d="M7 17 17 7M8 7h9v9"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5h.01"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    bolt: '<path d="M13 2 5 13h5l-1 9 8-12h-5l1-8z"/>',
    account_tree:
      '<rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 7v5M6 16v-2h12v2"/>',
    tune:
      '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
    block: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    hub:
      '<circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="4" r="1.8"/><circle cx="12" cy="20" r="1.8"/><circle cx="4.5" cy="8" r="1.8"/><circle cx="19.5" cy="8" r="1.8"/><path d="M12 6.4v3.2M12 14.4v3.8M10 11l-4-1.8M14 11l4-1.8"/>',
    checklist:
      '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 5l1.3 1.3L7.5 3.7M3.5 11l1.3 1.3L7.5 9.7M3.5 17l1.3 1.3L7.5 15.7"/>',
  };

  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = ICONS[name] || "";
    return svg;
  }

  /* ---- Glifo de marca (focal frame): cuatro esquinas + punto ------------- */
  function glyph() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "mark-glyph");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML =
      '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M10 22V10h12"/><path d="M42 10h12v12"/>' +
      '<path d="M10 42v12h12"/><path d="M42 54h12v-12"/></g>' +
      '<circle class="dotfill" cx="32" cy="32" r="5"/>';
    return svg;
  }

  /* ---- Tema: system (por defecto) / light / dark, persistido ------------- */
  const THEME_KEY = "guia-tema";
  let _mq = null;

  function getTheme() {
    try { return localStorage.getItem(THEME_KEY) || "system"; }
    catch (e) { return "system"; }
  }

  function applyTheme(theme) {
    const dark = theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }

  function setTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    applyTheme(theme);
    // Reacciona a cambios del sistema solo cuando el modo es "system".
    if (_mq) { _mq.onchange = null; _mq = null; }
    if (theme === "system") {
      _mq = window.matchMedia("(prefers-color-scheme: dark)");
      _mq.onchange = () => applyTheme("system");
    }
    document.dispatchEvent(new CustomEvent("guia:theme", { detail: theme }));
  }

  function initTheme() { setTheme(getTheme()); }

  G.h = h;
  G.append = append;
  G.clear = clear;
  G.ticks = ticks;
  G.icon = icon;
  G.glyph = glyph;
  G.getTheme = getTheme;
  G.setTheme = setTheme;
  G.initTheme = initTheme;
})(window.GUIA = window.GUIA || {});
