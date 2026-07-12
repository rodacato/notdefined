/* js/page-indice.js — Vista índice: hero, filtro problema-primero,
   catálogo agrupado por familia, y acceso al laboratorio de simulación. */
(function (G) {
  'use strict';
  var el = G.el;
  G.paginas = G.paginas || {};

  G.paginas.indice = function (raiz) {
    var estado = { dolor: null }; // null = todos

    var contenedorCatalogo = el('div', { class: 'catalogo' });

    function coincide(tipo) {
      if (!estado.dolor) return true;
      var ficha = G.fichas[tipo.slug];
      return ficha && ficha.dolores && ficha.dolores.indexOf(estado.dolor) !== -1;
    }

    function pintarCatalogo() {
      G.limpiar(contenedorCatalogo);
      var algo = false;
      G.familias.forEach(function (fam) {
        var tipos = G.catalogo.filter(function (t) { return t.familia === fam.id && coincide(t); });
        if (!tipos.length) return;
        algo = true;
        var seccion = el('section', { class: 'familia', style: { '--fam': fam.color } },
          el('div', { class: 'familia__cab' },
            el('span', { class: 'familia__punto' }),
            el('h2', { class: 'familia__nombre' }, fam.nombre),
            el('span', { class: 'familia__sub' }, fam.sub)
          ),
          el('div', { class: 'grid-cards' },
            tipos.map(function (t) { return G.comp.tarjetaCatalogo(t); })
          )
        );
        contenedorCatalogo.appendChild(seccion);
      });
      if (!algo) {
        contenedorCatalogo.appendChild(el('p', { class: 'vacio' },
          'Ningún tipo del catálogo ataca ese dolor de frente. Prueba otro filtro.'));
      }
    }

    // Chips de dolor (problema-primero)
    var chips = el('div', { class: 'filtro__chips' });
    function pintarChips() {
      G.limpiar(chips);
      chips.appendChild(chipDolor(null, 'Todos'));
      G.dolores.forEach(function (d) { chips.appendChild(chipDolor(d.id, d.label)); });
    }
    function chipDolor(id, label) {
      var activo = estado.dolor === id;
      return el('button', {
        class: 'chip chip--dolor' + (activo ? ' activo' : ''),
        type: 'button',
        'aria-pressed': activo ? 'true' : 'false',
        onClick: function () {
          estado.dolor = id;
          pintarChips();
          pintarCatalogo();
        }
      }, label);
    }

    var filtro = el('section', { class: 'filtro' },
      el('div', { class: 'filtro__cab' },
        el('span', { class: 'eyebrow' }, 'Empieza por el dolor'),
        el('p', { class: 'filtro__ayuda' }, 'Filtra el catálogo por el problema que traes, no por el nombre que ya oíste.')
      ),
      chips
    );

    // Laboratorio destacado: el simulador row-vs-columnar en vivo
    var lab = el('a', { class: 'lab-cta', href: '#/lab' },
      el('div', { class: 'lab-cta__txt' },
        el('span', { class: 'eyebrow' }, 'Laboratorio · 6 simuladores'),
        el('h2', null, 'Mira cómo se acomodan los datos en el disco'),
        el('p', null, 'Row vs columnar, B-tree vs LSM, hash lookup, grafo vs JOINs, índice invertido y búsqueda vectorial. Animados, paso a paso.')
      ),
      el('span', { class: 'lab-cta__ir' }, 'abrir laboratorio ', G.iconos.flecha())
    );

    // Herramientas interactivas (cada una navega a su vista real)
    var herramientas = el('section', { class: 'herramientas' },
      el('span', { class: 'eyebrow' }, 'Herramientas'),
      el('div', { class: 'herr-grid' },
        herrCard('#/comparar', 'Comparador de escenario', 'Elige un caso y dos tipos; ve cómo cada uno lo modela y dónde sufre.'),
        herrCard('#/quiz', 'Cuál uso', 'Escenarios reales con veredicto razonado. Abre con la tesis: empieza en Postgres.'),
        herrCard('#/desambiguar', 'Desambiguación', 'Los nombres gemelos que cuestan malas decisiones. Wide-column vs columnar y más.')
      )
    );
    function herrCard(href, titulo, desc) {
      return el('a', { class: 'herr-card', href: href },
        el('h3', null, titulo),
        el('p', null, desc),
        el('span', { class: 'herr-card__ir' }, 'abrir ', G.iconos.flecha())
      );
    }

    // Roadmap honesto: texto, no botones falsos (affordance = no clickeable)
    var roadmap = el('section', { class: 'roadmap' },
      el('span', { class: 'eyebrow' }, 'En esta edición y lo que sigue'),
      el('ul', { class: 'roadmap__lista' },
        el('li', { class: 'listo' }, 'Catálogo de 12 tipos y fichas completas'),
        el('li', { class: 'listo' }, 'Laboratorio: 6 simuladores de layout físico'),
        el('li', { class: 'listo' }, 'Comparador de escenario'),
        el('li', { class: 'listo' }, 'Quiz «cuál uso» con la tesis honesta'),
        el('li', { class: 'listo' }, 'Desambiguación de confusiones'),
        el('li', null, 'Ratings comparados lado a lado entre tipos')
      )
    );

    pintarChips();
    pintarCatalogo();

    G.montar(raiz, el('div', { class: 'vista vista-indice' },
      G.comp.barraSuperior(),
      G.comp.hero(),
      lab,
      herramientas,
      filtro,
      contenedorCatalogo,
      roadmap
    ));
    window.scrollTo(0, 0);
  };
})(window.GUIA = window.GUIA || {});
