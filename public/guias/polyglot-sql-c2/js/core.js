/* ============================================================================
   js/core.js — namespace, helpers DOM y control de tema. Carga primero.
   ============================================================================ */
(function (G) {
  "use strict";

  // -------- Helpers DOM ------------------------------------------------------
  // el("div.clase#id", {attr:...}, [hijos|texto]) → HTMLElement
  G.el = function (spec, attrs, children) {
    var m = spec.match(/^([a-z0-9]+)/i);
    var tag = m ? m[1] : "div";
    var node = document.createElement(tag);

    var idM = spec.match(/#([\w-]+)/);
    if (idM) node.id = idM[1];
    var classes = (spec.match(/\.[\w-]+/g) || []).map(function (c) { return c.slice(1); });
    if (classes.length) node.className = classes.join(" ");

    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null) return;
        if (k === "class") { node.className = (node.className ? node.className + " " : "") + v; }
        else if (k === "html") { node.innerHTML = v; }
        else if (k === "text") { node.textContent = v; }
        else if (k === "on" && typeof v === "object") {
          Object.keys(v).forEach(function (ev) { node.addEventListener(ev, v[ev]); });
        } else if (k in node && k !== "list") {
          try { node[k] = v; } catch (e) { node.setAttribute(k, v); }
        } else {
          node.setAttribute(k, v);
        }
      });
    }
    G.append(node, children);
    return node;
  };

  G.append = function (node, children) {
    if (children == null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  };

  G.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };

  G.frag = function (children) { var f = document.createDocumentFragment(); G.append(f, children); return f; };

  // Dificultad → glifos ◆ llenos + ◇ vacíos, con la parte vacía atenuada.
  G.diffGlyph = function (n) {
    var full = "◆".repeat(n);
    var off = "◇".repeat(3 - n);
    return { full: full, off: off };
  };

  // Formateo de números con separador de miles (tabular).
  G.fmt = function (n) {
    return Math.round(n).toLocaleString("es-MX");
  };

  G.reducedMotion = function () {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  // -------- Tema (light / dark / system) -------------------------------------
  var TEMA_KEY = "guia-tema";
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  G.tema = {
    get: function () {
      try { return localStorage.getItem(TEMA_KEY) || "dark"; } catch (e) { return "dark"; }
    },
    set: function (pref) {
      try { localStorage.setItem(TEMA_KEY, pref); } catch (e) {}
      G.tema.apply();
      document.dispatchEvent(new CustomEvent("guia:theme", { detail: { pref: pref } }));
    },
    apply: function () {
      var pref = G.tema.get();
      var dark = pref === "dark" || (pref === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    }
  };

  // Si el tema es "system", seguir los cambios del SO en vivo.
  mq.addEventListener("change", function () {
    if (G.tema.get() === "system") { G.tema.apply(); document.dispatchEvent(new CustomEvent("guia:theme")); }
  });

  if (G.reducedMotion()) document.documentElement.classList.add("reduce-motion");

})(window.GUIA = window.GUIA || {});
