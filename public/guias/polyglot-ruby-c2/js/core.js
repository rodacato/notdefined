/* ============================================================
   core.js — núcleo del motor de la guía
   Namespace window.GUIA, constantes de datos, helpers de DOM,
   y el control de tema. Se carga primero.
   ============================================================ */
(function (G) {
  "use strict";

  // ---- Familias de temas: color = codificación de datos (var --fam-*) ----
  G.FAMILIES = {
    exec: { label: "Ejecución y compilación",            color: "var(--fam-exec)" },
    conc: { label: "Concurrencia y paralelismo",         color: "var(--fam-conc)" },
    mem:  { label: "Memoria y objetos",                  color: "var(--fam-mem)"  },
    obj:  { label: "Modelo de objetos y metaprogramación", color: "var(--fam-obj)" }
  };

  // ---- Helpers de DOM ----------------------------------------------------

  // Escapa texto para meterlo seguro en HTML.
  G.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  // Atajo para crear un elemento con atributos y contenido HTML.
  G.h = function (tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") el.className = attrs[k];
      else if (k === "style") el.style.cssText = attrs[k];
      else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function")
        el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    }
    if (html != null) el.innerHTML = html;
    return el;
  };

  G.qs  = function (sel, root) { return (root || document).querySelector(sel); };
  G.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Registro de widgets. Cada page-<slug>.js cuelga su iniciador aquí.
  G.widgets = G.widgets || {};
  // Contenedor de datos. Cada data/<dominio>.js llena esto.
  G.data = G.data || { topics: {} };

  // ---- Marca focal-frame (glifo del autor) ----
  G.markSVG = function (size) {
    size = size || 26;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 38 38" ' +
      'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">' +
      '<path d="M3 11V3h8M35 11V3h-8M3 27v8h8M35 27v8h-8"></path>' +
      '<circle cx="19" cy="19" r="3.3" fill="var(--color-primary)" stroke="none"></circle></svg>';
  };

  // ---- Iconos del toggle (16px, trazo currentColor) ----
  G.icons = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
  };

  // ---- Control de tema ---------------------------------------------------
  var THEME_KEY = "guia-tema";

  G.getThemePref = function () {
    try { return localStorage.getItem(THEME_KEY) || "dark"; } catch (e) { return "dark"; }
  };

  G.applyTheme = function (pref) {
    var dark = pref === "dark" ||
      (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  };

  G.setTheme = function (pref) {
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) {}
    G.applyTheme(pref);
    document.dispatchEvent(new CustomEvent("guia:theme", { detail: { pref: pref } }));
  };

  // Si el usuario eligió "system", sigue los cambios del sistema operativo.
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (G.getThemePref() === "system") G.applyTheme("system");
    });
  }

})(window.GUIA = window.GUIA || {});
