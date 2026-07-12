/* ============================================================
   js/core.js — base del motor. Carga PRIMERO.
   Namespace window.GUIA: helpers de DOM, iconos SVG inline,
   marca focal-frame y el sistema de tema (dark default).
   ============================================================ */
(function (G) {
  "use strict";

  /* ---------- Hyperscript mínimo ----------
     h("div", {class:"x", onClick:fn, html:"<b>x</b>"}, hijo1, hijo2)
     Atributos especiales: class, html, dataset{}, style{}, on*  */
  G.h = function (tag, attrs) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null) return;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style" && typeof v === "object") Object.keys(v).forEach(function (p) {
        if (p.indexOf("--") === 0) el.style.setProperty(p, v[p]); // custom props: Object.assign no las setea
        else el.style[p] = v[p];
      });
      else if (k === "dataset") Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, "");
      else if (v !== false) el.setAttribute(k, v);
    });
    var kids = Array.prototype.slice.call(arguments, 2);
    G.append(el, kids);
    return el;
  };

  G.append = function (el, kids) {
    kids.forEach(function (c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) return G.append(el, c);
      el.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
    });
    return el;
  };

  G.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };

  G.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };

  /* ---------- Iconos SVG inline (sin dependencias externas) ---------- */
  var ICONS = {
    sol:      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    luna:     '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    monitor:  '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    play:     '<path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none"/>',
    pausa:    '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>',
    paso:     '<path d="M5 4l10 8-10 8z" fill="currentColor" stroke="none"/><rect x="17" y="4" width="2.5" height="16" rx="1" fill="currentColor" stroke="none"/>',
    reset:    '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    flecha:   '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  G.icon = function (name, size) {
    var s = size || 16;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + '</svg>';
  };

  /* ---------- Marca focal-frame (firma del autor) ---------- */
  G.markSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M3 8V5a2 2 0 0 1 2-2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/>' +
    '<path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/>' +
    '<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>';

  /* ============================================================
     TEMA — dark default, persistido en localStorage("guia-tema").
     Valores: "light" | "dark" | "system". Emite evento "guia:theme".
     ============================================================ */
  G.theme = {
    KEY: "guia-tema",
    get: function () {
      try { return localStorage.getItem(G.theme.KEY) || "dark"; }
      catch (e) { return "dark"; }
    },
    prefiereDark: function () {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    },
    esDark: function (pref) {
      pref = pref || G.theme.get();
      return pref === "dark" || (pref === "system" && G.theme.prefiereDark());
    },
    aplicar: function (pref) {
      document.documentElement.classList.toggle("dark", G.theme.esDark(pref));
    },
    set: function (pref) {
      try { localStorage.setItem(G.theme.KEY, pref); } catch (e) {}
      G.theme.aplicar(pref);
      window.dispatchEvent(new CustomEvent("guia:theme", { detail: { pref: pref } }));
    }
  };

  // Toggle de 3 botones. Se monta en #theme-mount.
  G.montarTemaToggle = function (host) {
    if (!host) return;
    G.clear(host);
    var opciones = [
      { pref: "light", icon: "sol", titulo: "Claro" },
      { pref: "dark", icon: "luna", titulo: "Oscuro" },
      { pref: "system", icon: "monitor", titulo: "Sistema" }
    ];
    var grupo = G.h("div", { class: "theme-toggle", role: "group", "aria-label": "Tema" });
    function pintar() {
      var actual = G.theme.get();
      Array.prototype.forEach.call(grupo.children, function (b) {
        b.setAttribute("aria-pressed", b.dataset.pref === actual ? "true" : "false");
      });
    }
    opciones.forEach(function (o) {
      var b = G.h("button", {
        html: G.icon(o.icon, 16),
        title: o.titulo, "aria-label": o.titulo, dataset: { pref: o.pref },
        onClick: function () { G.theme.set(o.pref); pintar(); }
      });
      grupo.appendChild(b);
    });
    host.appendChild(grupo);
    pintar();
    // Si el sistema cambia y estamos en "system", re-aplicar.
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (G.theme.get() === "system") G.theme.aplicar("system");
      });
    }
  };

  /* ---------- Utilidad: color de familia ---------- */
  G.colorFamilia = function (famId) {
    var f = G.getFamilia(famId);
    return f ? f.color : "var(--color-primary)";
  };

  /* ---------- prefers-reduced-motion ---------- */
  G.reduceMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  /* ---------- Scroll al tope de forma segura (sin scrollIntoView) ---------- */
  G.scrollTop = function () {
    try { window.scrollTo({ top: 0, behavior: G.reduceMotion() ? "auto" : "smooth" }); }
    catch (e) { window.scrollTo(0, 0); }
  };

})(window.GUIA = window.GUIA || {});
