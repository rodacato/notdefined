/* ============================================================================
   core.js — base del almanaque: datos, tokens de rol, helpers DOM y montaje
   ----------------------------------------------------------------------------
   Carga PRIMERO (después de data.js). Publica todo en window.GUIA para el
   resto de los scripts clásicos. Sin ES modules a propósito: el almanaque
   debe abrir con doble clic (file:// no carga módulos).

   Orden de carga (index.html): data → core → components → page-* → router.
   ========================================================================== */
(function (G) {
  'use strict';

  var DATA = window.PATRONES;

  /* ---- contrato de color de roles — idéntico en todo el almanaque ---- */
  var ROLE_HEX = {
    cliente: '#64748B',
    interfaz: '#5B6CFF',
    impl: '#10B981',
    estrella: '#D98A0B',
  };
  var ROLE_ES = {
    cliente: 'Cliente',
    interfaz: 'Interfaz',
    impl: 'Implementación',
    estrella: 'El patrón',
  };
  var CAT_HEX = {
    creacional: '#A4552E',
    estructural: '#2F6A6B',
    comportamiento: '#79415F',
  };
  var FREQ_GLYPH = DATA.catalogo.freq.glyph; // { star:"★", half:"◐", open:"○" }
  var FREQ_LABEL = DATA.catalogo.freq.label;

  var reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  /* tareas de limpieza (timers, listeners) que se cancelan al cambiar de vista */
  var cleanups = [];
  function onLeave(fn) {
    cleanups.push(fn);
  }
  function runCleanups() {
    cleanups.forEach(function (f) {
      try {
        f();
      } catch (e) {}
    });
    cleanups = [];
  }

  /* --------------------------------------------------------------------------
     h() / svg() — mini ayudantes para construir DOM sin framework.
     attrs: strings normales via setAttribute; "class"; objeto en "style";
     claves on* como listeners; "html" para innerHTML.
     kids: strings (texto), nodos, o arrays (se aplanan); null/false se ignoran.
     -------------------------------------------------------------------------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function make(ns, tag, attrs, kids) {
    var node = ns
      ? document.createElementNS(SVG_NS, tag)
      : document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') node.setAttribute('class', v);
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') {
        for (var s in v) node.style[s] = v[s];
      } else if (k.slice(0, 2) === 'on' && typeof v === 'function')
        node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    append(node, kids);
    return node;
  }
  function append(node, kids) {
    if (kids == null || kids === false) return;
    if (Array.isArray(kids)) {
      kids.forEach(function (c) {
        append(node, c);
      });
      return;
    }
    if (typeof kids === 'string' || typeof kids === 'number') {
      node.appendChild(document.createTextNode(String(kids)));
      return;
    }
    node.appendChild(kids);
  }
  function h(tag, attrs) {
    return make(false, tag, attrs, Array.prototype.slice.call(arguments, 2));
  }
  function svg(tag, attrs) {
    return make(true, tag, attrs, Array.prototype.slice.call(arguments, 2));
  }

  /* Texto con `código` intercalado (los backticks marcan <code>) → array de nodos */
  function withCode(text) {
    return text.split('`').map(function (part, i) {
      return i % 2 ? h('code', null, part) : document.createTextNode(part);
    });
  }

  function center(n) {
    return [n.x + n.w / 2, n.y + n.h / 2];
  }
  function anchor(n, side) {
    if (side === 'top') return [n.x + n.w / 2, n.y];
    if (side === 'bottom') return [n.x + n.w / 2, n.y + n.h];
    if (side === 'left') return [n.x, n.y + n.h / 2];
    if (side === 'right') return [n.x + n.w, n.y + n.h / 2];
    return center(n);
  }

  function mount(node) {
    var app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(node);
    if (!skipScroll) window.scrollTo(0, 0);
  }
  var skipScroll = false;

  /* ---- tema: system (default) / light / dark, persistido -------------------
     Mismo contrato que el resto de las guías 1001: clave "guia-tema",
     clase html.dark y evento "guia:theme". */
  var THEME_KEY = 'guia-tema';
  var themeMq = null;

  function getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function applyTheme(theme) {
    var dark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  }

  function setTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
    applyTheme(theme);
    if (themeMq) {
      themeMq.onchange = null;
      themeMq = null;
    }
    if (theme === 'system') {
      themeMq = window.matchMedia('(prefers-color-scheme: dark)');
      themeMq.onchange = function () {
        applyTheme('system');
      };
    }
    document.dispatchEvent(new CustomEvent('guia:theme', { detail: theme }));
  }

  function initTheme() {
    setTheme(getTheme());
  }

  G.DATA = DATA;
  G.ROLE_HEX = ROLE_HEX;
  G.ROLE_ES = ROLE_ES;
  G.CAT_HEX = CAT_HEX;
  G.FREQ_GLYPH = FREQ_GLYPH;
  G.FREQ_LABEL = FREQ_LABEL;
  G.reduceMotion = reduceMotion;
  G.onLeave = onLeave;
  G.runCleanups = runCleanups;
  G.getTheme = getTheme;
  G.setTheme = setTheme;
  G.initTheme = initTheme;
  G.h = h;
  G.svg = svg;
  G.withCode = withCode;
  G.center = center;
  G.anchor = anchor;
  G.mount = mount;
})((window.GUIA = window.GUIA || {}));
