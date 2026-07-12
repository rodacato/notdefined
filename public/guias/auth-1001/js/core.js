/* ============================================================================
   js/core.js — base del namespace GUIA. Carga después de los datos, antes
   del resto de js/.
   ----------------------------------------------------------------------------
   Sin frameworks, sin módulos: todo cuelga de window.GUIA. Aquí viven los
   helpers de DOM, los iconos SVG inline (cero requests externos), la marca y
   el manejo de tema.
   ========================================================================== */
(function (G) {
  "use strict";

  /* --- Helper de creación de DOM ---
     el("div", {class:"x", onClick:fn}, [hijos | "texto"]) */
  G.el = function (tag, attrs, hijos) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null) return;
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k === "onClick") node.addEventListener("click", v);
      else if (k === "onKeydown") node.addEventListener("keydown", v);
      else if (k === "style" && typeof v === "object") aplicarEstilo(node, v);
      else if (k.indexOf("data-") === 0 || k.indexOf("aria-") === 0) node.setAttribute(k, v);
      else node[k] = v;
    });
    if (hijos != null) {
      (Array.isArray(hijos) ? hijos : [hijos]).forEach(function (h) {
        if (h == null) return;
        node.appendChild(typeof h === "string" || typeof h === "number"
          ? document.createTextNode(String(h)) : h);
      });
    }
    return node;
  };

  // Aplica un objeto de estilos. Las custom properties (--foo) necesitan
  // setProperty; Object.assign las ignora en silencio.
  function aplicarEstilo(node, obj) {
    Object.keys(obj).forEach(function (k) {
      if (k.indexOf("--") === 0) node.style.setProperty(k, obj[k]);
      else node.style[k] = obj[k];
    });
  }

  G.frag = function (hijos) {
    var f = document.createDocumentFragment();
    hijos.forEach(function (h) { if (h) f.appendChild(h); });
    return f;
  };

  G.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };

  /* --- Iconos SVG inline (trazo, viewBox 24) --- */
  var ICONS = {
    "arrow-left":  "M19 12H5M12 19l-7-7 7-7",
    "arrow-right": "M5 12h14M12 5l7 7-7 7",
    "play":        "M6 4l14 8-14 8z",
    "pause":       "M7 5v14M17 5v14",
    "step-fwd":    "M5 4l10 8-10 8zM19 5v14",
    "step-back":   "M19 20L9 12l10-8zM5 5v14",
    "reset":       "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
    "sun":         "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19",
    "moon":        "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
    "monitor":     "M3 4h18v12H3zM8 20h8M12 16v4",
    "browser":     "M3 5h18v14H3zM3 9h18",
    "app":         "M4 4h16v16H4zM4 10h16",
    "key":         "M15 7a4 4 0 1 1-3.9 5H7v3H4v-3H2.5l1.5-1.5M15 7h.01",
    "api":         "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01",
    "idp":         "M4 21V5l8-2 8 2v16M9 9h.01M9 13h.01M15 9h.01M15 13h.01M9 21v-4h6v4",
    "alert":       "M12 3l9 16H3zM12 10v4M12 17h.01",
    "finger":      "M8 11a4 4 0 0 1 8 0v2a8 8 0 0 1-2 5M12 11v4M6 14a10 10 0 0 1 1-6",
    "server":      "M4 4h16v6H4zM4 14h16v6H4zM7 7h.01M7 17h.01",
    "target":      "M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
  };

  G.icon = function (name) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", ICONS[name] || ICONS["target"]);
    svg.appendChild(p);
    return svg;
  };

  // Marca focal-frame del almanaque (los cuatro corchetes + punto).
  G.markSVG = function () {
    return '<svg viewBox="0 0 38 38" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">' +
      '<path d="M3 11V3h8M35 11V3h-8M3 27v8h8M35 27v8h-8"></path>' +
      '<circle cx="19" cy="19" r="3.3" fill="currentColor" stroke="none"></circle></svg>';
  };

  /* --- Tema (persistente) · claves de la serie ---
     Preferencia guardada: "light" | "dark" | "system" (default "dark").
     El tema efectivo resuelve "system" contra el SO. Emite "guia:theme". */
  var TEMA_KEY = "guia-tema";

  G.leerTema = function () {
    try {
      var v = localStorage.getItem(TEMA_KEY);
      if (v === "light" || v === "dark" || v === "system") return v;
    } catch (e) {}
    return "dark"; // el pasaporte es el default de la colección
  };

  G.temaEfectivo = function (pref) {
    pref = pref || G.leerTema();
    if (pref === "system") {
      return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    }
    return pref;
  };

  G.aplicarTema = function (pref) {
    try { localStorage.setItem(TEMA_KEY, pref); } catch (e) {}
    var efectivo = G.temaEfectivo(pref);
    document.documentElement.classList.toggle("dark", efectivo === "dark");
    try {
      window.dispatchEvent(new CustomEvent("guia:theme", { detail: { pref: pref, efectivo: efectivo } }));
    } catch (e) {}
  };

  // Reacciona a cambios del SO cuando la preferencia es "system".
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onSystem = function () { if (G.leerTema() === "system") G.aplicarTema("system"); };
    if (mq.addEventListener) mq.addEventListener("change", onSystem);
    else if (mq.addListener) mq.addListener(onSystem);
  }

  // Sincroniza la clase al arrancar (el script inline del <head> ya evitó el flash).
  G.aplicarTema(G.leerTema());

  /* --- Utilidades varias --- */
  G.scrollTop = function () { window.scrollTo(0, 0); };

})(window.GUIA = window.GUIA || {});
