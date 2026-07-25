/* Vista de inicio: hero de la casa + catálogo por bloques. */
(function (G) {
  'use strict';

  G.paginas = G.paginas || {};

  G.paginas.inicio = function () {
    var g = G.datos.guia;

    var hero = G.el('header', { clase: 'hero' }, [
      G.el('div', { clase: 'hero__marca' }, [
        G.el('div', { clase: 'hero__firma' }, [
          G.el('span', { clase: 'hero__glifo', html: G.iconos.marca }),
          G.el('span', { clase: 'hero__eyebrow', texto: g.coleccion })
        ]),
        G.el('div', { clase: 'hero__coordenadas', html: '<strong>' + g.lenguaje + '</strong><br>' + g.conteo })
      ]),
      G.el('h1', { clase: 'hero__titulo', texto: g.titulo }),
      G.el('p', { clase: 'hero__lede', texto: g.lede }),
      G.el('p', { clase: 'hero__ancla', texto: g.ancla })
    ]);

    var tesis = G.el('p', { clase: 'tesis', html: g.tesis });

    var bloques = G.datos.bloques.map(function (bloque) {
      var fichas = G.fichasDeBloque(bloque.id);

      var tarjetas = fichas.map(function (ficha) {
        return G.el('a', {
          clase: 'tarjeta',
          attr: { href: '#/tema/' + ficha.slug }
        }, [
          G.el('div', { clase: 'tarjeta__alto' }, [
            G.el('span', { clase: 'tarjeta__folio', texto: ficha.folio }),
            G.el('span', { clase: 'tarjeta__widget', texto: 'widget' })
          ]),
          G.el('h3', { clase: 'tarjeta__titulo', texto: ficha.titulo }),
          G.el('p', { clase: 'tarjeta__sub', texto: ficha.subtitulo }),
          G.el('p', { clase: 'tarjeta__mito', html: '<b>mito a desmontar</b>' + ficha.mito.creencia }),
          G.el('span', { clase: 'tarjeta__ir', texto: 'abrir ficha →' })
        ]);
      });

      return G.el('section', { clase: 'bloque' }, [
        G.el('div', { clase: 'bloque__cabeza' }, [
          G.el('span', { clase: 'bloque__folio', texto: bloque.folio }),
          G.el('h2', { clase: 'bloque__titulo', texto: bloque.titulo }),
          G.el('span', { clase: 'bloque__conteo', texto: fichas.length + ' temas' })
        ]),
        G.el('p', { clase: 'bloque__bajada', texto: bloque.bajada }),
        G.el('div', { clase: 'rejilla' }, tarjetas)
      ]);
    });

    return G.el('div', { clase: 'envoltura' }, [hero, tesis].concat(bloques));
  };
})(window.GUIA = window.GUIA || {});
