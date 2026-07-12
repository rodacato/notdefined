/* js/core.js — Núcleo del almanaque. Carga primero.
   Constantes, helpers de DOM, sistema de tema y utilidades de montaje.
   Todo cuelga del namespace window.GUIA. Sin frameworks, sin ES modules. */
(function (G) {
  'use strict';

  G.CONFIG = {
    temaKey: 'guia-tema',        // localStorage: "light" | "dark" | "system"
    temaEvento: 'guia:theme',    // se emite en window al cambiar
    tomo: 'Tomo VI',
    edicion: 'Edición 2026',
    tituloBase: 'Bases de datos 1001 · almanaque técnico',
    fechaEval: 'julio 2026'
  };

  /* ---- Helpers de DOM ---------------------------------------------------
     el('div', {class:'x', onClick:fn, dataset:{k:'v'}}, hijo, 'texto', ...)
     Acepta strings (texto), nodos, o arreglos de ellos como hijos.        */
  function agregarHijo(nodo, hijo) {
    if (hijo === null || hijo === undefined || hijo === false) return;
    if (Array.isArray(hijo)) { hijo.forEach(function (h) { agregarHijo(nodo, h); }); return; }
    if (hijo instanceof Node) { nodo.appendChild(hijo); return; }
    nodo.appendChild(document.createTextNode(String(hijo)));
  }

  G.el = function (tag, props) {
    var nodo = document.createElement(tag);
    var hijos = Array.prototype.slice.call(arguments, 2);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined) return;
        if (k === 'class' || k === 'className') { nodo.className = v; }
        else if (k === 'text') { nodo.textContent = v; }
        else if (k === 'html') { nodo.innerHTML = v; }
        else if (k === 'style' && typeof v === 'object') {
          Object.keys(v).forEach(function (p) { nodo.style[p] = v[p]; });
        }
        else if (k === 'dataset') {
          Object.keys(v).forEach(function (d) { nodo.dataset[d] = v[d]; });
        }
        else if (k.indexOf('on') === 0 && typeof v === 'function') {
          nodo.addEventListener(k.slice(2).toLowerCase(), v);
        }
        else if (k === 'aria' && typeof v === 'object') {
          Object.keys(v).forEach(function (a) { nodo.setAttribute('aria-' + a, v[a]); });
        }
        else { nodo.setAttribute(k, v); }
      });
    }
    hijos.forEach(function (h) { agregarHijo(nodo, h); });
    return nodo;
  };

  G.qs  = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  G.limpiar = function (nodo) { while (nodo && nodo.firstChild) nodo.removeChild(nodo.firstChild); return nodo; };
  G.montar = function (nodo, contenido) { G.limpiar(nodo); agregarHijo(nodo, contenido); return nodo; };

  /* ¿El usuario pidió menos movimiento? */
  G.reduceMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /* ---- Sistema de tema --------------------------------------------------
     El boot inline del <head> ya puso la clase antes del primer paint.
     Aquí solo leemos/escribimos la preferencia y cableamos el toggle.     */
  G.tema = {
    leer: function () {
      var v = null;
      try { v = localStorage.getItem(G.CONFIG.temaKey); } catch (e) {}
      return (v === 'light' || v === 'dark' || v === 'system') ? v : 'dark';
    },
    resolver: function (pref) {
      if (pref === 'system') {
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
      }
      return pref;
    },
    aplicar: function (pref) {
      var efectivo = G.tema.resolver(pref);
      document.documentElement.classList.toggle('dark', efectivo === 'dark');
    },
    fijar: function (pref) {
      try { localStorage.setItem(G.CONFIG.temaKey, pref); } catch (e) {}
      G.tema.aplicar(pref);
      window.dispatchEvent(new CustomEvent(G.CONFIG.temaEvento, { detail: { pref: pref } }));
    }
  };

  // Si la preferencia es "system", reacciona a que el SO cambie de modo.
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
      if (G.tema.leer() === 'system') G.tema.aplicar('system');
    });
  }
})(window.GUIA = window.GUIA || {});
