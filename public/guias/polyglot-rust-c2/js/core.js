/* core.js — namespace, helpers de DOM, tema, íconos, montaje.
   Carga primero. Todo cuelga de window.GUIA. */
(function (G) {
  "use strict";

  /* ---------- helpers de DOM ---------- */

  // Crea un elemento. attrs admite: class, html, text, on:{evento:fn}, y
  // cualquier atributo/dataset. children: nodo, string o array.
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      var v = attrs[k];
      if (v == null) continue;
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k === "style") node.setAttribute("style", v);
      else if (k === "on") { for (var ev in v) node.addEventListener(ev, v[ev]); }
      else if (k === "dataset") { for (var d in v) node.dataset[d] = v[d]; }
      else node.setAttribute(k, v);
    }
    append(node, children);
    return node;
  }

  function append(node, children) {
    if (children == null) return;
    if (Array.isArray(children)) {
      children.forEach(function (c) { append(node, c); });
    } else if (children instanceof Node) {
      node.appendChild(children);
    } else {
      node.appendChild(document.createTextNode(String(children)));
    }
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- íconos SVG inline (16px, currentColor) ---------- */
  var ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    bug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M8 10H4M20 10h-4M8 15H3M21 15h-5M9 6l-1-2M15 6l1-2"/></svg>',
    brand: '<svg viewBox="0 0 32 32" fill="none"><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 11V8h3M24 11V8h-3M8 21v3h3M24 21v3h-3"/></g><circle cx="16" cy="16" r="2.4" fill="currentColor"/></svg>'
  };
  function icon(name) { return ICONS[name] || ""; }

  /* ---------- tema (light / dark / system) ---------- */
  var THEME_KEY = "guia-tema";

  function currentPref() {
    try { return localStorage.getItem(THEME_KEY) || "dark"; } catch (e) { return "dark"; }
  }
  function applyTheme(pref) {
    var dark = pref === "dark" ||
      (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }
  function setTheme(pref) {
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) {}
    applyTheme(pref);
    document.dispatchEvent(new CustomEvent("guia:theme", { detail: { pref: pref } }));
  }
  // si el usuario está en "system", seguir los cambios del SO
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (currentPref() === "system") applyTheme("system");
  });

  G.dom = { el: el, append: append, clear: clear, qs: qs, escapeHtml: escapeHtml };
  G.icon = icon;
  G.reduceMotion = reduceMotion;
  G.theme = { key: THEME_KEY, current: currentPref, set: setTheme, apply: applyTheme };
  G.temas = G.temas || {};   // catálogo de contenido (lo llenan los data/*.js)

})(window.GUIA = window.GUIA || {});
