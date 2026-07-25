/* core.js — helpers de DOM, registro de fichas y tema. Se carga primero. */
(function (G) {
  "use strict";

  G.fichas = {};
  G.widgets = {};
  G.paginas = {};

  G.registrarFicha = function (ficha) {
    G.fichas[ficha.slug] = ficha;
  };

  /* el("div", {class:"x", text:"hola", html:"<b>", on:{click:fn}, aria-label:"y"}, hijos) */
  G.el = function (tag, props, hijos) {
    var nodo = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") nodo.className = v;
        else if (k === "text") nodo.textContent = v;
        else if (k === "html") nodo.innerHTML = v;
        else if (k === "on") Object.keys(v).forEach(function (ev) { nodo.addEventListener(ev, v[ev]); });
        else if (k === "dataset") Object.keys(v).forEach(function (d) { nodo.dataset[d] = v[d]; });
        else nodo.setAttribute(k, v === true ? "" : v);
      });
    }
    G.agregar(nodo, hijos);
    return nodo;
  };

  G.agregar = function (padre, hijos) {
    if (hijos === null || hijos === undefined) return padre;
    if (!Array.isArray(hijos)) hijos = [hijos];
    hijos.forEach(function (h) {
      if (h === null || h === undefined || h === false) return;
      padre.appendChild(typeof h === "string" ? document.createTextNode(h) : h);
    });
    return padre;
  };

  G.vaciar = function (nodo) {
    while (nodo.firstChild) nodo.removeChild(nodo.firstChild);
    return nodo;
  };

  G.escapar = function (texto) {
    return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  G.diamantes = function (n) {
    return "◆◇◇◆◆◇◆◆◆".slice((n - 1) * 3, n * 3);
  };

  G.reducirMovimiento = function () {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  /* --- Tema ---------------------------------------------------------------- */
  var CLAVE_TEMA = "guia-tema";

  function leerModo() {
    try { return localStorage.getItem(CLAVE_TEMA) || "dark"; } catch (e) { return "dark"; }
  }

  function aplicarModo(modo) {
    var oscuro = modo === "dark" ||
      (modo === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", oscuro);
    var botones = document.querySelectorAll("#tema-toggle button");
    Array.prototype.forEach.call(botones, function (b) {
      b.setAttribute("aria-pressed", b.dataset.tema === modo ? "true" : "false");
    });
    document.dispatchEvent(new CustomEvent("guia:theme", { detail: { modo: modo, oscuro: oscuro } }));
  }

  G.iniciarTema = function () {
    aplicarModo(leerModo());
    var toggle = document.getElementById("tema-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function (e) {
      var boton = e.target.closest("button[data-tema]");
      if (!boton) return;
      var modo = boton.dataset.tema;
      try { localStorage.setItem(CLAVE_TEMA, modo); } catch (err) {}
      aplicarModo(modo);
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (leerModo() === "system") aplicarModo("system");
    });
  };
})(window.GUIA = window.GUIA || {});
