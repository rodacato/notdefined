/* Vista de tema: riel de navegación + la ficha completa + paginación. */
(function (G) {
  'use strict';

  G.paginas = G.paginas || {};

  function paginacion(ficha) {
    var orden = G.fichasEnOrden();
    var i = orden.map(function (f) { return f.slug; }).indexOf(ficha.slug);
    var previa = orden[i - 1];
    var siguiente = orden[i + 1];

    function link(f, dir) {
      return G.el('a', { attr: { href: '#/tema/' + f.slug } }, [
        G.el('span', { clase: 'paginacion__dir', texto: dir }),
        G.el('span', { clase: 'paginacion__t', texto: f.titulo })
      ]);
    }

    var hijos = [];
    if (previa) hijos.push(link(previa, '← anterior'));
    if (siguiente) hijos.push(link(siguiente, 'siguiente →'));
    return hijos.length ? G.el('div', { clase: 'paginacion' }, hijos) : null;
  }

  G.paginas.tema = function (slug) {
    var ficha = G.fichaPorSlug(slug);
    if (!ficha) return null;

    var bloque = G.bloquePorId(ficha.bloque);

    var cabeza = G.el('header', { clase: 'ficha__cabeza' }, [
      G.el('p', {
        clase: 'ficha__ruta',
        html: '<a href="#/">Ruby dominado</a> · ' + bloque.folio + ' ' + bloque.titulo + ' · ficha ' + ficha.folio
      }),
      G.el('h1', { clase: 'ficha__titulo', texto: ficha.titulo }),
      G.el('p', { clase: 'ficha__sub', texto: ficha.subtitulo }),
      G.el('p', { clase: 'ficha__quees', html: ficha.quees })
    ]);

    var breve = G.comp.seccion('en breve', [
      G.el('ul', { clase: 'breve' }, ficha.enBreve.map(function (dato, i) {
        return G.el('li', { html: dato, attr: { 'data-n': '0' + (i + 1) } });
      }))
    ]);

    var fundamento = G.comp.seccion('fundamento · por qué existe', [
      G.el('p', { html: ficha.fundamento })
    ]);

    // Con escena, el snippet ES el escenario y no se pinta también aquí.
    var escena = G.comp.escena(ficha);
    var mecanica = G.comp.seccion('cómo funciona',
      [G.el('p', { html: ficha.comoFunciona })].concat(escena ? [] : [G.comp.pre(ficha.snippet)]));

    var interactivo = escena ? G.comp.seccion('recórrelo', [escena]) : null;

    var consola = G.comp.consola(ficha.callout);
    var pruebalo = consola ? G.comp.seccion('pruébalo en tu consola', [consola]) : null;

    var cuandoNo = G.comp.seccion('cuándo NO usarlo', [
      G.el('div', { clase: 'aviso aviso--no' }, [
        G.el('p', { html: ficha.cuandoNo })
      ])
    ]);

    var mito = G.comp.seccion('mito a desmontar', [
      G.el('div', { clase: 'aviso aviso--mito' }, [
        G.el('div', { clase: 'aviso__etq', texto: 'lo que se repite' }),
        G.el('p', { clase: 'aviso__creencia', html: ficha.mito.creencia }),
        G.el('div', { clase: 'aviso__etq', texto: 'lo que pasa' }),
        G.el('p', { clase: 'aviso__realidad', html: ficha.mito.realidad })
      ])
    ]);

    var recursos = G.comp.seccion('recursos', [
      G.el('ul', { clase: 'recursos' }, ficha.recursos.map(function (r) {
        var titulo = r.url
          ? G.el('a', {
              clase: 'recurso__titulo',
              texto: r.titulo,
              attr: { href: r.url, target: '_blank', rel: 'noopener' }
            })
          : G.el('span', { clase: 'recurso__titulo', texto: r.titulo });

        return G.el('li', {}, [
          G.el('p', { clase: 'recurso__linea' }, [
            titulo,
            G.el('span', { clase: 'recurso__fuente', texto: r.fuente })
          ]),
          G.el('p', { clase: 'recurso__nota', html: r.nota })
        ]);
      }))
    ]);

    var columna = G.el('article', {}, [
      cabeza, breve, fundamento, mecanica, interactivo, pruebalo, cuandoNo, mito, recursos, paginacion(ficha)
    ]);

    return G.el('div', { clase: 'envoltura' }, [
      G.el('div', { clase: 'tema-layout' }, [G.comp.riel(slug), columna])
    ]);
  };
})(window.GUIA = window.GUIA || {});
