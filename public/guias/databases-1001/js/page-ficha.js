/* js/page-ficha.js — Vista de detalle de un tipo. Dos columnas: rail
   sticky (folio, familia, ratings, veredicto, navegación) + cuerpo. */
(function (G) {
  'use strict';
  var el = G.el;
  G.paginas = G.paginas || {};

  // Tipos cuyo campo «cómo guarda» ya tiene simulador en vivo.
  var CON_SIM = {
    relacional: 'row-vs-columnar',
    columnar: 'row-vs-columnar',
    'clave-valor': 'hash-lookup',
    'wide-column': 'btree-vs-lsm',
    grafo: 'grafo-vs-joins',
    busqueda: 'indice-invertido',
    vectorial: 'vectorial'
  };

  function bloque(titulo, cuerpo, clase) {
    return el('section', { class: 'bloque ' + (clase || '') },
      el('h3', { class: 'bloque__titulo' }, titulo),
      cuerpo
    );
  }

  function lista(items, clase) {
    return el('ul', { class: 'listac ' + (clase || '') },
      items.map(function (t) { return el('li', null, t); }));
  }

  G.paginas.ficha = function (raiz, slug) {
    var tipo = G.porSlug[slug];
    var ficha = G.fichas[slug];
    if (!tipo || !ficha) { G.paginas.noEncontrado(raiz, slug); return; }

    var fam = G.familiaDe(tipo.familia);
    var idx = G.catalogo.indexOf(tipo);
    var prev = G.catalogo[idx - 1];
    var next = G.catalogo[idx + 1];

    // ---- Rail izquierdo -------------------------------------------------
    var rail = el('aside', { class: 'ficha__rail' },
      el('a', { class: 'ficha__volver', href: '#/' }, '← catálogo'),
      el('div', { class: 'ficha__folio' }, tipo.folio),
      G.comp.familiaChip(tipo.familia),
      el('h1', { class: 'ficha__nombre' },
        tipo.nombre,
        tipo.estrella ? el('span', { class: 'ficha__estrella', title: 'La estrella de su familia' }, '★') : null
      ),
      el('div', { class: 'ficha__arquetipo' }, tipo.arquetipo),
      el('div', { class: 'ficha__veredicto' },
        el('span', { class: 'eyebrow' }, 'El veredicto'),
        el('p', null, ficha.veredicto)
      ),
      el('div', { class: 'ficha__ratings' },
        el('span', { class: 'eyebrow' }, 'Perfil · 7 ejes'),
        G.comp.ratings(ficha.ratings)
      ),
      navPrevNext(prev, next)
    );

    // ---- Cuerpo ---------------------------------------------------------
    var comoGuardaCuerpo = el('div', null, el('p', null, ficha.comoGuarda));
    if (CON_SIM[slug]) {
      var sim = G.sims[CON_SIM[slug]];
      comoGuardaCuerpo.appendChild(
        el('a', { class: 'sim-link', href: '#/lab/' + CON_SIM[slug] },
          el('span', { class: 'sim-link__ic' }, G.iconos.marca(18)),
          el('span', null,
            el('strong', null, 'Míralo en el simulador: '),
            '«' + sim.titulo + '», paso a paso.'),
          G.iconos.flecha()
        )
      );
    }

    var cuerpo = el('div', { class: 'ficha__cuerpo' },
      bloque('Qué es', el('p', { class: 'lede-ficha' }, ficha.queEs)),
      bloque('Cómo guarda físicamente', comoGuardaCuerpo, 'bloque--layout'),
      bloque('El modelo de consulta', el('p', null, ficha.modeloConsulta)),
      el('div', { class: 'ganapaga' },
        bloque('Qué gana', lista(ficha.gana, 'listac--gana'), 'bloque--gana'),
        bloque('Qué paga', lista(ficha.paga, 'listac--paga'), 'bloque--paga')
      ),
      bloque('Cuándo NO usarlo', lista(ficha.cuandoNo, 'listac--no'), 'bloque--no'),
      bloque('Parientes y confusiones', el('p', null, ficha.parientes)),
      bloque('El arquetipo y sus alternativas', el('p', null, ficha.arquetipo)),
      G.comp.notaEval()
    );

    G.montar(raiz, el('div', { class: 'vista vista-ficha', style: { '--fam': fam.color } },
      G.comp.barraSuperior(),
      el('div', { class: 'ficha__grid' }, rail, cuerpo)
    ));
    window.scrollTo(0, 0);
  };

  function navPrevNext(prev, next) {
    return el('nav', { class: 'ficha__nav' },
      prev ? el('a', { class: 'ficha__nav-btn', href: '#/tipo/' + prev.slug },
        el('span', { class: 'ficha__nav-dir' }, '← ' + prev.folio),
        el('span', { class: 'ficha__nav-nom' }, prev.nombre)) : el('span'),
      next ? el('a', { class: 'ficha__nav-btn ficha__nav-btn--next', href: '#/tipo/' + next.slug },
        el('span', { class: 'ficha__nav-dir' }, next.folio + ' →'),
        el('span', { class: 'ficha__nav-nom' }, next.nombre)) : el('span')
    );
  }

  G.paginas.noEncontrado = function (raiz, slug) {
    G.montar(raiz, el('div', { class: 'vista vista-404' },
      G.comp.barraSuperior(),
      el('div', { class: 'r404' },
        el('div', { class: 'r404__folio' }, '00'),
        el('h1', null, 'Esa ficha no existe en el almanaque'),
        el('p', null, slug ? ('No hay ningún tipo con la ruta «' + slug + '».') : 'Ruta desconocida.'),
        el('a', { class: 'btn', href: '#/' }, '← volver al catálogo')
      )
    ));
    window.scrollTo(0, 0);
  };
})(window.GUIA = window.GUIA || {});
