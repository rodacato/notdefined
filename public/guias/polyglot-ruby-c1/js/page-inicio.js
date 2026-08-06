/* Vista de inicio: la ficha 00 — identidad, camino de lectura y los modelos
   mentales. El listado de temas no vive aquí: lo carga el riel. */
(function (G) {
  'use strict';

  G.paginas = G.paginas || {};

  G.paginas.inicio = function () {
    var g = G.datos.guia;

    var cabeza = G.el('header', { clase: 'ficha__cabeza' }, [
      G.el('div', { clase: 'hero__marca' }, [
        G.el('div', { clase: 'hero__firma' }, [
          G.el('span', { clase: 'hero__glifo', html: G.iconos.marca }),
          G.el('span', { clase: 'hero__eyebrow', texto: g.coleccion })
        ]),
        G.el('div', { clase: 'hero__coordenadas', html: '<strong>' + g.lenguaje + '</strong><br>' + g.conteo })
      ]),
      G.el('h1', { clase: 'ficha__titulo', texto: g.titulo }),
      G.el('p', { clase: 'ficha__quees', texto: g.lede }),
      G.el('p', { clase: 'hero__ancla', texto: g.ancla })
    ]);

    var tesis = G.comp.seccion('de qué va', [
      G.el('p', { clase: 'tesis', html: g.tesis })
    ]);

    var camino = G.comp.seccion('por dónde entrar', [
      G.el('div', { clase: 'aviso aviso--camino' }, [
        G.el('p', { html: g.camino })
      ])
    ]);

    var modelos = G.datos.bloques.map(function (bloque) {
      var fichas = G.fichasDeBloque(bloque.id);
      var primera = fichas[0];

      return G.el('a', { clase: 'modelo', attr: { href: '#/tema/' + primera.slug } }, [
        G.el('p', { clase: 'modelo__folio', texto: bloque.folio + ' · ' + bloque.titulo }),
        G.el('h3', { clase: 'modelo__nombre', texto: bloque.modelo }),
        G.el('p', { clase: 'modelo__cuerpo', html: bloque.modeloLargo || bloque.bajada }),
        G.el('p', { clase: 'modelo__pie' }, [
          G.el('span', { clase: 'modelo__conteo', texto: fichas.length + ' temas' }),
          G.el('span', { clase: 'modelo__ir', texto: 'empezar por ' + primera.titulo + ' →' })
        ])
      ]);
    });

    var mapa = G.comp.seccion('los cuatro modelos mentales', modelos);

    var columna = G.el('article', {}, [cabeza, tesis, camino, mapa]);
    return G.el('div', { clase: 'envoltura' }, [
      G.el('div', { clase: 'tema-layout' }, [G.comp.riel('inicio'), columna])
    ]);
  };

  // Bibliografía por capítulo: la ruta corta de vuelta a lo que ya leíste.
  G.paginas.bibliografia = function () {
    var cabeza = G.el('header', { clase: 'ficha__cabeza' }, [
      G.el('p', { clase: 'ficha__ruta', html: '<a href="#/">Ruby dominado</a> · para seguir' }),
      G.el('h1', { clase: 'ficha__titulo', texto: 'Bibliografía' }),
      G.el('p', {
        clase: 'ficha__quees',
        texto: 'Las fuentes de cada ficha, en el orden de la guía. Vuelve aquí cuando quieras profundizar en un tema que ya leíste.'
      })
    ]);

    var grupos = G.fichasEnOrden().map(function (ficha) {
      if (!ficha.recursos || !ficha.recursos.length) return null;
      var bloque = G.bloquePorId(ficha.bloque);

      var titulo = G.el('a', { clase: 'biblio__ficha', attr: { href: '#/tema/' + ficha.slug } }, [
        G.el('span', { clase: 'biblio__n', texto: ficha.folio }),
        G.el('span', { texto: ficha.titulo })
      ]);
      if (bloque && bloque.color) titulo.style.setProperty('--fam', bloque.color);

      var items = ficha.recursos.map(function (r) {
        var nombre = r.url
          ? G.el('a', {
              clase: 'recurso__titulo',
              texto: r.titulo,
              attr: { href: r.url, target: '_blank', rel: 'noopener' }
            })
          : G.el('span', { clase: 'recurso__titulo', texto: r.titulo });
        return G.el('li', {}, [
          G.el('p', { clase: 'recurso__linea' }, [
            nombre,
            G.el('span', { clase: 'recurso__fuente', texto: r.fuente })
          ]),
          G.el('p', { clase: 'recurso__nota', html: r.nota })
        ]);
      });

      return G.el('div', { clase: 'biblio__grupo' }, [
        titulo,
        G.el('ul', { clase: 'recursos' }, items)
      ]);
    });

    var columna = G.el('article', {}, [cabeza].concat(grupos));

    return G.el('div', { clase: 'envoltura' }, [
      G.el('div', { clase: 'tema-layout' }, [G.comp.riel('bibliografia'), columna])
    ]);
  };
})(window.GUIA = window.GUIA || {});
