/* Enrutado por hash y arranque. Carga al final. */
(function (G) {
  'use strict';

  var TITULO = 'Ruby dominado · Polyglot';

  function ruta() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var partes = h.split('/').filter(Boolean);
    if (partes[0] === 'tema' && partes[1]) return { vista: 'tema', slug: partes[1] };
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
    var contenido = r.vista === 'tema' ? G.paginas.tema(r.slug) : G.paginas.inicio();

    G.vaciar(main);
    main.appendChild(contenido || noEncontrado());

    var ficha = r.vista === 'tema' ? G.fichaPorSlug(r.slug) : null;
    document.title = ficha ? ficha.titulo + ' · ' + TITULO : TITULO;

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
