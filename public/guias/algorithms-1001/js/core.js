/* ============================================================================
   core.js — Cimientos de la guía. Carga PRIMERO.
   Publica el namespace global window.GUIA con:
     · constantes (movimiento reducido, formato de números, paleta de estados)
     · helpers de DOM (h, s, clear, mount) — hiperscript sin frameworks
     · PRNG reproducible (mulberry32)
   No contiene contenido ni mecánica de ningún algoritmo: solo herramientas.
   ========================================================================== */
(function (G) {
  "use strict";

  /* --- ¿el usuario pidió menos movimiento? Se respeta en toda la guía. --- */
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Formato de números en español de México (1,234) --- */
  function fmt(x) { return Math.round(x).toLocaleString("es-MX"); }

  /* =========================================================================
     Hiperscript — construye nodos DOM sin JSX ni innerHTML frágil.
       h("div.card", { style:{padding:10}, onClick:fn }, hijo1, hijo2)
       h("span", "texto")
     · El primer argumento "tag.clase1.clase2#id" define etiqueta/clases/id.
     · props reconoce: style (objeto), class/className, dataset (objeto),
       html (innerHTML crudo, úsese con contenido propio), on<Evento>, y
       cualquier atributo (aria-*, role, type, value, disabled, etc.).
     · Los hijos pueden ser nodos, strings, números, arrays o null/false.
     ========================================================================= */
  function h(spec) {
    var parts = String(spec).split(/(?=[.#])/);
    var tag = parts[0] || "div";
    var el = document.createElement(tag);
    for (var i = 1; i < parts.length; i++) {
      var p = parts[i];
      if (p[0] === "#") el.id = p.slice(1);
      else if (p[0] === ".") el.classList.add(p.slice(1));
    }
    var args = Array.prototype.slice.call(arguments, 1);
    var start = 0;
    // ¿el segundo argumento es un objeto de props (y no un nodo/texto)?
    if (args.length && isProps(args[0])) { applyProps(el, args[0]); start = 1; }
    for (var k = start; k < args.length; k++) appendChild(el, args[k]);
    return el;
  }

  function isProps(x) {
    return x != null && typeof x === "object" &&
      !(x instanceof Node) && !Array.isArray(x);
  }

  function applyProps(el, props) {
    for (var key in props) {
      if (!Object.prototype.hasOwnProperty.call(props, key)) continue;
      var val = props[key];
      if (val == null || val === false) continue;
      if (key === "style" && typeof val === "object") {
        for (var sk in val) if (val[sk] != null) el.style.setProperty(cssName(sk), String(val[sk]));
      } else if (key === "class" || key === "className") {
        String(val).split(/\s+/).forEach(function (c) { if (c) el.classList.add(c); });
      } else if (key === "dataset" && typeof val === "object") {
        for (var dk in val) el.dataset[dk] = val[dk];
      } else if (key === "html") {
        el.innerHTML = val;
      } else if (key.slice(0, 2) === "on" && typeof val === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      } else {
        el.setAttribute(key, val === true ? "" : String(val));
      }
    }
  }

  // camelCase → kebab-case solo para propiedades CSS con mayúsculas
  function cssName(k) {
    if (k.indexOf("-") >= 0 || k.indexOf("--") === 0) return k;
    return k.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); });
  }

  function appendChild(el, child) {
    if (child == null || child === false || child === true) return;
    if (Array.isArray(child)) { child.forEach(function (c) { appendChild(el, c); }); return; }
    if (child instanceof Node) { el.appendChild(child); return; }
    el.appendChild(document.createTextNode(String(child)));
  }

  /* --- Igual que h() pero en el espacio de nombres SVG --- */
  var SVGNS = "http://www.w3.org/2000/svg";
  function s(spec) {
    var parts = String(spec).split(/(?=[.#])/);
    var el = document.createElementNS(SVGNS, parts[0] || "g");
    for (var i = 1; i < parts.length; i++) {
      if (parts[i][0] === ".") el.classList.add(parts[i].slice(1));
      else if (parts[i][0] === "#") el.setAttribute("id", parts[i].slice(1));
    }
    var args = Array.prototype.slice.call(arguments, 1);
    var start = 0;
    if (args.length && isProps(args[0])) {
      var props = args[0]; start = 1;
      for (var key in props) {
        if (!Object.prototype.hasOwnProperty.call(props, key)) continue;
        var val = props[key];
        if (val == null || val === false) continue;
        if (key === "style" && typeof val === "object") {
          for (var sk in val) if (val[sk] != null) el.style.setProperty(cssName(sk), String(val[sk]));
        } else if (key.slice(0, 2) === "on" && typeof val === "function") {
          el.addEventListener(key.slice(2).toLowerCase(), val);
        } else if (key === "html") {
          el.innerHTML = val;
        } else {
          el.setAttribute(key, String(val));
        }
      }
    }
    for (var k = start; k < args.length; k++) {
      var child = args[k];
      if (child == null || child === false) continue;
      if (Array.isArray(child)) child.forEach(function (c) { if (c) el.appendChild(c); });
      else if (child instanceof Node) el.appendChild(child);
      else el.appendChild(document.createTextNode(String(child)));
    }
    return el;
  }

  /* --- Vaciar un contenedor / montar un solo nodo --- */
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function mount(el, node) { clear(el); appendChild(el, node); return el; }

  /* =========================================================================
     Paleta semántica de estados — CONTRATO FIJO, idéntico en toda la guía.
     Cada estado tiene color (var CSS), hex (para SVG/badges) y glifo redundante
     al color (accesibilidad). No inventar estados nuevos fuera de este mapa.
     ========================================================================= */
  var STATES = {
    neutral: { color: "var(--st-neutral)", hex: "#B9B2A6", label: "neutro",     glyph: "" },
    active:  { color: "var(--st-active)",  hex: "#E0A93B", label: "actual",     glyph: "\u25B8" },
    cand:    { color: "var(--st-cand)",    hex: "#3E7CB1", label: "comparando", glyph: "\u25C6" },
    goal:    { color: "var(--st-goal)",    hex: "#7B5EA7", label: "objetivo",   glyph: "\u25CE" },
    done:    { color: "var(--st-done)",    hex: "#4C9A6A", label: "resuelto",   glyph: "\u2713" },
    out:     { color: "var(--st-out)",     hex: "#B05B4D", label: "descartado", glyph: "\u2715" },
    path:    { color: "var(--st-path)",    hex: "#2E8B8B", label: "visitado",   glyph: "\u2022" },
  };

  /* --- Estilo inline de una celda del arreglo según su estado --- */
  function cellStyle(state) {
    var st = STATES[state] || STATES.neutral;
    switch (state) {
      case "active": return { border: "2px solid " + st.hex, background: "rgba(224,169,59,0.16)", color: "var(--ink)" };
      case "cand":   return { border: "2px solid " + st.hex, background: "rgba(62,124,177,0.10)", color: "var(--ink)" };
      case "goal":   return { border: "2px solid " + st.hex, background: "rgba(123,94,167,0.10)", color: "var(--ink)" };
      case "done":   return { border: "2px solid " + st.hex, background: "rgba(76,154,106,0.18)", color: "var(--ink)" };
      case "out":    return { border: "1.5px dashed " + st.hex, background: "var(--paper-deep)", color: "var(--ink-faint)", textDecoration: "line-through" };
      case "path":   return { border: "2px solid " + st.hex, background: "rgba(46,139,139,0.10)", color: "var(--ink)" };
      default:       return { border: "1.5px solid var(--line-strong)", background: "var(--card)", color: "var(--ink)" };
    }
  }

  /* =========================================================================
     PRNG reproducible con semilla (mulberry32). Misma semilla = mismos datos,
     para que los escenarios de data/ sean deterministas.
     ========================================================================= */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* --- Aplica la clase de movimiento reducido al cargar --- */
  if (REDUCED) document.documentElement.classList.add("no-motion");

  /* --- Publicar todo en el namespace --- */
  G.REDUCED = REDUCED;
  G.fmt = fmt;
  G.h = h;
  G.s = s;
  G.clear = clear;
  G.mount = mount;
  G.STATES = STATES;
  G.cellStyle = cellStyle;
  G.mulberry32 = mulberry32;

})(window.GUIA = window.GUIA || {});
