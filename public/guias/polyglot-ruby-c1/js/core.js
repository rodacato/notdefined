/* Núcleo: helpers de DOM, íconos, tema y acceso a los datos.
   Carga primero: todo lo demás cuelga de window.GUIA. */
(function (G) {
  'use strict';

  /* --- DOM ---------------------------------------------------------------- */
  G.el = function (tag, opciones, hijos) {
    var nodo = document.createElement(tag);
    var o = opciones || {};
    if (o.clase) nodo.className = o.clase;
    if (o.texto != null) nodo.textContent = o.texto;
    if (o.html != null) nodo.innerHTML = o.html;
    Object.keys(o.attr || {}).forEach(function (k) { nodo.setAttribute(k, o.attr[k]); });
    if (o.al) Object.keys(o.al).forEach(function (evt) { nodo.addEventListener(evt, o.al[evt]); });
    (hijos || []).forEach(function (h) { if (h) nodo.appendChild(h); });
    return nodo;
  };

  G.vaciar = function (nodo) { while (nodo.firstChild) nodo.removeChild(nodo.firstChild); };

  G.qsaBotones = function (raiz) {
    return Array.prototype.slice.call(raiz.getElementsByTagName('button'));
  };

  G.escapar = function (texto) {
    return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  /* --- Íconos (SVG inline, sin dependencias) ------------------------------ */
  G.iconos = {
    // Glifo focal-frame de la casa: cuatro corchetes de esquina + punto central.
    marca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true">' +
      '<path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>',
    sol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>',
    luna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">' +
      '<rect x="2.5" y="4" width="19" height="12.5" rx="1.5"/><path d="M8.5 20h7M12 16.5V20"/></svg>',
    flecha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M4 12h15M13 6l6 6-6 6"/></svg>'
  };

  /* --- Tema: light / dark / system, persistido en "guia-tema" ------------- */
  var CLAVE = 'guia-tema';

  G.tema = {
    leer: function () {
      try { return localStorage.getItem(CLAVE) || 'dark'; } catch (e) { return 'dark'; }
    },
    aplicar: function (valor) {
      var oscuro = valor === 'dark' ||
        (valor === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', oscuro);
    },
    poner: function (valor) {
      try { localStorage.setItem(CLAVE, valor); } catch (e) { /* modo privado: solo sesión */ }
      G.tema.aplicar(valor);
      document.dispatchEvent(new CustomEvent('guia:theme', { detail: { tema: valor } }));
    }
  };

  // Si el usuario eligió "system", seguimos los cambios del sistema en vivo.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (G.tema.leer() === 'system') G.tema.aplicar('system');
  });

  /* --- Acceso a los datos ------------------------------------------------- */
  G.fichas = function () { return (G.datos && G.datos.fichas) || []; };

  G.fichaPorSlug = function (slug) {
    return G.fichas().filter(function (f) { return f.slug === slug; })[0] || null;
  };

  G.bloquePorId = function (id) {
    return ((G.datos && G.datos.bloques) || []).filter(function (b) { return b.id === id; })[0] || null;
  };

  G.fichasDeBloque = function (id) {
    return G.fichas().filter(function (f) { return f.bloque === id; });
  };

  // Orden de lectura: el del catálogo, agrupado por bloque.
  G.fichasEnOrden = function () {
    var lista = [];
    ((G.datos && G.datos.bloques) || []).forEach(function (b) {
      G.fichasDeBloque(b.id).forEach(function (f) { lista.push(f); });
    });
    return lista;
  };

  G.widgetDe = function (ficha) {
    return (G.datos && G.datos.widgets && G.datos.widgets[ficha.widget]) || null;
  };

  G.sinAnimacion = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
})(window.GUIA = window.GUIA || {});
