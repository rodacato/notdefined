/* ==========================================================================
   js/core.js — Núcleo: namespace, helpers de DOM, iconos SVG inline, tema,
   cromo (topbar) y montaje. Carga PRIMERO. Sin dependencias externas.
   ========================================================================== */
(function (G) {
  "use strict";

  /* ---- Helpers de DOM ------------------------------------------------- */

  // Crea un elemento. attrs admite: class, text, html, on* (eventos), y
  // cualquier atributo HTML/data-* directo. children: nodo, string o array.
  G.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "style" && typeof v === "object") {
        Object.keys(v).forEach(function (p) {
          if (p.indexOf("--") === 0) node.style.setProperty(p, v[p]);
          else node.style[p] = v[p];
        });
      }
      else if (k.indexOf("on") === 0 && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    G.append(node, children);
    return node;
  };

  G.append = function (node, children) {
    if (children == null) return node;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  };

  G.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };
  G.$ = function (sel, root) { return (root || document).querySelector(sel); };
  G.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---- Iconos SVG inline (cero requests externos) --------------------- */

  var ICONS = {
    arrowRight: { inner: '<path d="M5 12h14M13 6l6 6-6 6"/>' },
    play:  { fill: true, inner: '<path d="M7 4.5v15l12-7.5z"/>' },
    pause: { fill: true, inner: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>' },
    step:  { fill: true, inner: '<path d="M6 4.5v15l10-7.5z"/><rect x="17" y="4.5" width="2.6" height="15" rx="1"/>' },
    replay:{ inner: '<path d="M4.5 12a7.5 7.5 0 1 1 2.4 5.5"/><path d="M4 18.5V13h5.5"/>' },
    check: { inner: '<path d="M5 13l4 4L19 7"/>' },
    cross: { inner: '<path d="M6 6l12 12M18 6L6 18"/>' },
    sun:   { inner: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>' },
    moon:  { inner: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>' },
    monitor: { inner: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>' },
    menu:  { inner: '<path d="M4 7h16M4 12h16M4 17h16"/>' },
    back:  { inner: '<path d="M15 6l-6 6 6 6"/>' },
    mark:  { v: "0 0 38 38", sw: 2.4, cap: "square", inner: '<path d="M3 11V3h8M35 11V3h-8M3 27v8h8M35 27v8h-8"/><circle cx="19" cy="19" r="3.3" fill="currentColor" stroke="none"/>' }
  };

  // Devuelve un <svg> como string, listo para innerHTML.
  G.iconStr = function (name) {
    var i = ICONS[name]; if (!i) return "";
    var v = i.v || "0 0 24 24";
    var fill = i.fill ? 'fill="currentColor" stroke="none"' :
      'fill="none" stroke="currentColor" stroke-width="' + (i.sw || 2) + '" stroke-linecap="' + (i.cap || "round") + '" stroke-linejoin="round"';
    return '<svg viewBox="' + v + '" ' + fill + ' aria-hidden="true">' + i.inner + '</svg>';
  };

  // Devuelve un <span> contenedor del icono (para insertar como nodo).
  G.icon = function (name, cls) {
    var s = G.el("span", { class: "ico" + (cls ? " " + cls : ""), html: G.iconStr(name) });
    return s;
  };

  /* ---- Utilidades varias ---------------------------------------------- */

  G.bytesFmt = function (n) {
    if (n == null || isNaN(n)) return "—";
    if (n >= 1024) return (n / 1024).toFixed(n >= 10240 ? 0 : 1) + " KB";
    return n + " B";
  };

  // Rellena barras 0–7 en un track (para ratings). value entero.
  G.barSegments = function (value, opts) {
    opts = opts || {};
    var track = G.el("div", { class: "bar-track" });
    for (var i = 0; i < 7; i++) {
      var on = i < value;
      var cls = "bar-seg" + (on ? " on" : "") + (on && opts.warn ? " warn" : "");
      track.appendChild(G.el("div", { class: cls }));
    }
    return track;
  };

  /* ---- Tema (3 modos: claro / oscuro / sistema) -----------------------
     Clave "guia-tema", valores "light"|"dark"|"system", default "dark".
     El script inline del <head> ya puso la clase antes del primer paint;
     aquí sincronizamos toggle, escuchamos el sistema y emitimos "guia:theme". */

  var THEME_KEY = "guia-tema";
  var mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  G.getThemePref = function () {
    try { return localStorage.getItem(THEME_KEY) || "dark"; } catch (e) { return "dark"; }
  };
  G.effectiveDark = function (pref) {
    if (pref === "dark") return true;
    if (pref === "light") return false;
    return !!(mql && mql.matches); // system
  };
  // Aplica la preferencia guardada: clase en <html>, estado del toggle y evento.
  G.applyTheme = function (pref) {
    pref = pref || G.getThemePref();
    var dark = G.effectiveDark(pref);
    document.documentElement.classList.toggle("dark", dark);
    G.$$("[data-theme-mode]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-theme-mode") === pref);
    });
    window.dispatchEvent(new CustomEvent("guia:theme", { detail: { pref: pref, dark: dark } }));
  };
  // Cambia y persiste la preferencia.
  G.setTheme = function (pref) {
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) {}
    G.applyTheme(pref);
  };
  // Si el usuario está en "system", re-aplicar cuando cambia el SO.
  if (mql) {
    var onSys = function () { if (G.getThemePref() === "system") G.applyTheme("system"); };
    if (mql.addEventListener) mql.addEventListener("change", onSys);
    else if (mql.addListener) mql.addListener(onSys);
  }

  /* ---- Montaje de una vista ------------------------------------------- */

  G.mount = function (node) {
    var app = G.$("#app");
    G.clear(app);
    var view = G.el("div", { class: "view" });
    view.appendChild(node);
    app.appendChild(view);
    window.scrollTo(0, 0);
  };

  // Cascarón de página: shell centrado.
  G.shell = function (children) {
    return G.el("div", { class: "shell" }, children);
  };

})(window.GUIA = window.GUIA || {});
