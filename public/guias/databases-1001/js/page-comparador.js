/* js/page-comparador.js — Comparador de escenario. Eliges un caso y dos
   tipos candidatos; ves cómo cada uno lo modela, qué le sale natural y
   dónde sufre, más la recomendación honesta. */
(function (G) {
  'use strict';
  var el = G.el;
  G.paginas = G.paginas || {};

  G.paginas.comparador = function (raiz) {
    var estado = { escIdx: 0, sel: [] };

    var chipsEsc = el('div', { class: 'cmp__escenarios' });
    var descEl = el('p', { class: 'cmp__desc' });
    var chipsCand = el('div', { class: 'cmp__cands' });
    var columnas = el('div', { class: 'cmp__cols' });
    var reco = el('div', { class: 'cmp__reco' });

    function esc() { return G.escenarios[estado.escIdx]; }

    function elegirEsc(i) {
      estado.escIdx = i;
      var c = esc().candidatos;
      estado.sel = [c[0].slug, c[1].slug]; // por defecto los dos primeros
      pintar();
    }

    function toggleCand(slug) {
      var i = estado.sel.indexOf(slug);
      if (i !== -1) {
        if (estado.sel.length > 1) estado.sel.splice(i, 1); // no dejar menos de 1
      } else {
        estado.sel.push(slug);
        if (estado.sel.length > 2) estado.sel.shift(); // máximo 2: suelta el más viejo
      }
      pintar();
    }

    function pintarEscenarios() {
      G.limpiar(chipsEsc);
      G.escenarios.forEach(function (e, i) {
        chipsEsc.appendChild(el('button', {
          class: 'segbtn' + (i === estado.escIdx ? ' activo' : ''),
          type: 'button',
          'aria-pressed': i === estado.escIdx ? 'true' : 'false',
          onClick: function () { elegirEsc(i); }
        }, e.titulo));
      });
    }

    function pintarCands() {
      G.limpiar(chipsCand);
      esc().candidatos.forEach(function (cand) {
        var t = G.porSlug[cand.slug];
        var fam = G.familiaDe(t.familia);
        var activo = estado.sel.indexOf(cand.slug) !== -1;
        chipsCand.appendChild(el('button', {
          class: 'cmp__cand' + (activo ? ' activo' : ''),
          type: 'button',
          style: { '--fam': fam.color },
          'aria-pressed': activo ? 'true' : 'false',
          onClick: function () { toggleCand(cand.slug); }
        },
          el('span', { class: 'cmp__cand-folio' }, t.folio),
          el('span', { class: 'cmp__cand-nom' }, t.nombre)
        ));
      });
    }

    function columnaTipo(cand) {
      var t = G.porSlug[cand.slug];
      var fam = G.familiaDe(t.familia);
      return el('div', { class: 'cmp__col', style: { '--fam': fam.color } },
        el('a', { class: 'cmp__col-cab', href: '#/tipo/' + t.slug },
          el('span', { class: 'cmp__col-folio' }, t.folio),
          el('div', null,
            el('h3', { class: 'cmp__col-nom' }, t.nombre),
            el('span', { class: 'cmp__col-arq' }, t.arquetipo)),
          G.iconos.flecha()
        ),
        campo('Cómo lo modela', cand.modela, 'modela'),
        campo('Qué le sale natural', cand.natural, 'natural'),
        campo('Dónde sufre', cand.sufre, 'sufre')
      );
    }
    function campo(titulo, txt, clase) {
      return el('div', { class: 'cmp__campo cmp__campo--' + clase },
        el('span', { class: 'cmp__campo-lbl' }, titulo),
        el('p', null, txt)
      );
    }

    function pintar() {
      var e = esc();
      descEl.textContent = e.descripcion;
      pintarEscenarios();
      pintarCands();
      G.limpiar(columnas);
      estado.sel.forEach(function (slug) {
        var cand = e.candidatos.find(function (c) { return c.slug === slug; });
        if (cand) columnas.appendChild(columnaTipo(cand));
      });
      G.montar(reco,
        el('div', { class: 'cmp__reco-cont' },
          el('span', { class: 'eyebrow' }, 'La recomendación honesta'),
          el('p', null, e.recomendacion))
      );
    }

    elegirEsc(0);

    G.montar(raiz, el('div', { class: 'vista vista-cmp' },
      G.comp.barraSuperior(),
      el('div', { class: 'cmp' },
        el('a', { class: 'sim__volver', href: '#/' }, '← catálogo'),
        el('div', { class: 'cmp__cab' },
          el('span', { class: 'eyebrow' }, 'Comparador de escenario'),
          el('h1', { class: 'cmp__titulo' }, '¿Cómo modela cada tipo el mismo caso?'),
          el('p', { class: 'cmp__intro' }, 'Elige un caso y dos candidatos. No todos los tipos entran a cada caso: comparar Cassandra con Neo4j para un carrito no dice nada.')
        ),
        el('div', { class: 'cmp__paso' }, el('span', { class: 'cmp__paso-num' }, '1'), el('span', null, 'El caso')),
        chipsEsc,
        descEl,
        el('div', { class: 'cmp__paso' }, el('span', { class: 'cmp__paso-num' }, '2'), el('span', null, 'Dos candidatos')),
        chipsCand,
        columnas,
        reco,
        G.comp.notaEval()
      )
    ));
    window.scrollTo(0, 0);
  };
})(window.GUIA = window.GUIA || {});
