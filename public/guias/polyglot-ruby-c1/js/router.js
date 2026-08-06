/* Enrutado por hash y arranque. Carga al final. */
(function (G) {
  'use strict';

  var TITULO = 'Ruby dominado · Polyglot';

  function ruta() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var partes = h.split('/').filter(Boolean);
    if (partes[0] === 'tema' && partes[1]) return { vista: 'tema', slug: partes[1] };
    if (partes[0] === 'bibliografia') return { vista: 'bibliografia' };
    return { vista: 'inicio' };
  }

  function noEncontrado() {
    return G.el('div', { clase: 'envoltura' }, [
      G.el('header', { clase: 'hero' }, [
        G.el('h1', { clase: 'hero__titulo', texto: 'Esa ficha no existe' }),
        G.el('p', { clase: 'hero__lede', html: 'Vuelve al <a href="#/">catálogo</a> y elige un tema.' })
      ])
    ]);
  }

  function pintar() {
    var r = ruta();
    var main = document.getElementById('vista');
    var contenido = G.paginas[r.vista] ? G.paginas[r.vista](r.slug) : null;

    G.vaciar(main);
    main.appendChild(contenido || noEncontrado());

    var ficha = r.vista === 'tema' ? G.fichaPorSlug(r.slug) : null;
    if (ficha) document.title = ficha.titulo + ' · ' + TITULO;
    else document.title = (r.vista === 'bibliografia' ? 'Bibliografía · ' : '') + TITULO;

    // Cada ficha se lee desde arriba; el hash no apunta a un ancla interno.
    window.scrollTo(0, 0);
  }

  function arrancar() {
    document.body.insertBefore(G.comp.barra(), document.body.firstChild);
    pintar();
    window.addEventListener('hashchange', pintar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})(window.GUIA = window.GUIA || {});
