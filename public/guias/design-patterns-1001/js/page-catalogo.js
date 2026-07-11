/* ============================================================================
   page-catalogo.js — portada / catálogo problema-primero (#/)
   ========================================================================== */
(function (G) {
  'use strict';

  var DATA = G.DATA,
    ROLE_HEX = G.ROLE_HEX,
    ROLE_ES = G.ROLE_ES,
    CAT_HEX = G.CAT_HEX,
    FREQ_GLYPH = G.FREQ_GLYPH,
    FREQ_LABEL = G.FREQ_LABEL,
    reduceMotion = G.reduceMotion,
    onLeave = G.onLeave,
    h = G.h,
    svg = G.svg,
    withCode = G.withCode,
    center = G.center,
    anchor = G.anchor,
    mount = G.mount;
  var Diagram = G.Diagram,
    DiagramLegend = G.DiagramLegend,
    CodeBlock = G.CodeBlock,
    ActionPlayer = G.ActionPlayer,
    focalMark = G.focalMark,
    siteFooter = G.siteFooter;

  /* ==========================================================================
     VISTA: portada / catálogo problema-primero   (#/)
     ========================================================================== */
  function renderHome() {
    document.title =
      'Patrones de dise\u00f1o 1001 \u00b7 \u00edndice del cat\u00e1logo';
    var C = DATA.catalogo;
    var activeProblem = null;

    var root = h('div', { class: 'wrap' });

    // masthead
    var header = h(
      'header',
      null,
      h(
        'div',
        { class: 'masthead' },
        h(
          'div',
          { class: 'folio' },
          focalMark('mark'),
          h(
            'div',
            { class: 'folio-meta' },
            h('div', { class: 'folio-sub' }, 'Almanaque t\u00e9cnico \u00b7 1001'),
          ),
        ),
        h(
          'div',
          { class: 'edition' },
          h('div', { class: 'eyebrow' }, 'Tomo I \u00b7 Edici\u00f3n 2026'),
          h(
            'div',
            {
              class: 'eyebrow',
              style: { 'margin-top': '4px', color: 'var(--color-fg-subtle)' },
            },
            '23 patrones \u00b7 3 categor\u00edas',
          ),
        ),
      ),
      h('h1', { class: 'title serif' }, 'Patrones de dise\u00f1o'),
      h(
        'p',
        { class: 'lede' },
        'El mapa completo de los 23 patrones del Gang of Four. Pensado para recuperarlos ',
        h('em', null, 'por el problema que resuelven'),
        ', no por su nombre \u2014 porque casi nunca recuerdas c\u00f3mo se llama el patr\u00f3n que necesitas, pero s\u00ed el dolor que tienes enfrente.',
      ),
      h(
        'div',
        { class: 'running-head' },
        h(
          'span',
          { class: 'eyebrow' },
          'Lidera con el problema \u00b7 revela la intenci\u00f3n despu\u00e9s',
        ),
        h('span', { class: 'eyebrow' }, 'Frecuencia \u2605 \u25D0 \u25CB'),
      ),
      h('hr', { class: 'double-rule' }),
    );
    root.appendChild(header);

    // filtro de problemas
    var chipsWrap = h('div', { class: 'chips' });
    var status = h('div', {
      class: 'status',
      role: 'status',
      'aria-live': 'polite',
    });
    var grid = h('div', { class: 'grid' });

    C.problems.forEach(function (pr) {
      var chip = h(
        'button',
        { class: 'chip', type: 'button', 'aria-pressed': 'false' },
        h('span', { class: 'dot', 'aria-hidden': 'true' }),
        h('span', null, withCode(pr.label)),
      );
      chip.addEventListener('click', function () {
        activeProblem = activeProblem && activeProblem.id === pr.id ? null : pr;
        renderFilter();
      });
      chip._data = pr;
      chipsWrap.appendChild(chip);
    });

    var filter = h(
      'div',
      { class: 'filter' },
      h(
        'div',
        { class: 'filter-head' },
        h('span', { class: 'filter-q' }, 'Tengo este problema\u2026'),
        h(
          'span',
          { class: 'filter-hint' },
          'elige un dolor y se iluminan los patrones que lo atacan',
        ),
      ),
      chipsWrap,
      status,
    );
    root.appendChild(filter);

    // leyenda
    root.appendChild(
      h(
        'div',
        { class: 'legend' },
        h(
          'div',
          { class: 'legend-group' },
          h('span', { class: 'legend-label' }, 'Frecuencia'),
          h(
            'span',
            { class: 'freq-item' },
            h('span', { class: 'freq-glyph freq-star' }, '\u2605'),
            ' n\u00facleo cotidiano',
          ),
          h(
            'span',
            { class: 'freq-item' },
            h('span', { class: 'freq-glyph freq-half' }, '\u25D0'),
            ' uso medio',
          ),
          h(
            'span',
            { class: 'freq-item' },
            h('span', { class: 'freq-glyph freq-open' }, '\u25CB'),
            ' cola rara',
          ),
        ),
        h(
          'div',
          { class: 'legend-group' },
          h('span', { class: 'legend-label' }, 'Categor\u00eda'),
          catSwatch('--cat-crea', 'Creacional'),
          catSwatch('--cat-estr', 'Estructural'),
          catSwatch('--cat-comp', 'De comportamiento'),
        ),
      ),
    );

    // grilla del catálogo
    root.appendChild(grid);

    // llamada a desambiguación
    root.appendChild(
      h(
        'a',
        { class: 'disambig', href: '#/desambiguacion' },
        h(
          'span',
          { class: 'dz-l' },
          h(
            'span',
            { class: 'dz-eyebrow' },
            '\u00bfSe te parecen entre s\u00ed?',
          ),
          h('span', { class: 'dz-title' }, 'Desambiguaci\u00f3n de parecidos'),
          h(
            'span',
            { class: 'dz-sub' },
            'Strategy vs State \u00b7 los cuatro envoltorios \u00b7 Factory vs Abstract Factory\u2026 mismo esqueleto, distinta intenci\u00f3n.',
          ),
        ),
        h('span', { class: 'dz-arrow' }, '\u2192'),
      ),
    );

    // contrato de roles \u2014 bajo demanda: bot\u00f3n de ayuda que abre un modal
    function contractBlock() {
      return h(
        'div',
        { class: 'contract' },
        h(
          'div',
          { class: 'contract-head' },
          h('span', { class: 'contract-title' }, 'Contrato de color de roles'),
          h(
            'span',
            { class: 'contract-sub' },
            'id\u00e9ntico en cada patr\u00f3n \u2014 el color nunca va solo, lo acompa\u00f1a una etiqueta o forma',
          ),
        ),
        h(
          'div',
          { class: 'roles' },
          C.roles.map(function (r) {
            var chip = h(
              'span',
              { class: 'role-chip' + (r.dolor ? ' role-dolor' : '') },
              r.txt || null,
            );
            if (!r.dolor) chip.style.background = 'var(' + r.varc + ')';
            return h(
              'span',
              { class: 'role' },
              chip,
              h('span', null, h('b', null, r.label), ' \u00b7 ' + r.sub),
            );
          }),
        ),
        h(
          'p',
          { class: 'colophon' },
          'Cada pantalla de patr\u00f3n ancla la soluci\u00f3n a su dolor: estructura de participantes, la transformaci\u00f3n \u00abantes \u2192 despu\u00e9s\u00bb y el flujo de mensajes en acci\u00f3n. Esta portada es solo el mapa. Panel \u00abcu\u00e1ndo no usarlo\u00bb y \u00abparientes / alternativas\u00bb viven dentro de cada ficha.',
        ),
      );
    }

    var helpBtn = h(
      'button',
      { class: 'help-btn', type: 'button', 'aria-haspopup': 'dialog' },
      h('span', { class: 'help-q', 'aria-hidden': 'true' }, '?'),
      'Colores y roles',
    );

    function openHelp() {
      var overlay;
      function close() {
        document.removeEventListener('keydown', onKey);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        helpBtn.focus();
      }
      function onKey(e) {
        if (e.key === 'Escape') close();
      }
      overlay = h(
        'div',
        { class: 'help-overlay' },
        h(
          'div',
          {
            class: 'help-modal',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': 'Contrato de color de roles',
            tabindex: '-1',
          },
          h(
            'button',
            {
              class: 'help-close',
              type: 'button',
              'aria-label': 'Cerrar',
              onclick: close,
            },
            '\u00d7',
          ),
          contractBlock(),
        ),
      );
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
      });
      document.addEventListener('keydown', onKey);
      onLeave(close);
      document.body.appendChild(overlay);
      overlay.firstChild.focus();
    }
    helpBtn.addEventListener('click', openHelp);

    root.appendChild(siteFooter(helpBtn));

    // ---- render dependiente del filtro ----
    function byCat(k) {
      return DATA.patrones.filter(function (p) {
        return p.category === k;
      });
    }
    function renderFilter() {
      // chips
      Array.prototype.forEach.call(chipsWrap.children, function (chip) {
        chip.setAttribute(
          'aria-pressed',
          String(activeProblem && activeProblem.id === chip._data.id),
        );
      });
      // status
      status.innerHTML = '';
      if (activeProblem) {
        status.appendChild(
          h(
            'span',
            { class: 'count-pill' },
            activeProblem.hits.length + ' patrones',
          ),
        );
        var frag = h(
          'span',
          null,
          'atacan ',
          h('b', null, '\u00ab', withCode(activeProblem.label), '\u00bb'),
          '. Los dem\u00e1s se aten\u00faan.',
        );
        status.appendChild(frag);
        var reset = h(
          'button',
          {
            class: 'reset',
            type: 'button',
            onclick: function () {
              activeProblem = null;
              renderFilter();
            },
          },
          'limpiar filtro',
        );
        status.appendChild(reset);
      } else {
        status.appendChild(
          h(
            'span',
            { style: { color: 'var(--color-fg-faint)' } },
            'Sin filtro: el cat\u00e1logo completo, ordenado por categor\u00eda.',
          ),
        );
      }
      // grilla
      grid.className = 'grid' + (activeProblem ? ' filtering' : '');
      grid.innerHTML = '';
      ['creacional', 'estructural', 'comportamiento'].forEach(function (k) {
        grid.appendChild(column(k, byCat(k), activeProblem));
      });
    }
    renderFilter();

    mount(root);
  }

  function column(catKey, patterns, active) {
    var cat = DATA.catalogo.categories[catKey];
    var hitCount = active
      ? patterns.filter(function (p) {
          return active.hits.indexOf(p.id) !== -1;
        }).length
      : 0;
    var head = h(
      'div',
      { class: 'col-head' },
      h('h2', { class: 'col-name' }, cat.name),
      h(
        'span',
        { class: 'col-count' },
        active && hitCount > 0
          ? [h('b', null, String(hitCount)), ' / ' + patterns.length]
          : [h('b', null, String(patterns.length)), ' patrones'],
      ),
    );
    var cards = h(
      'div',
      { class: 'cards' },
      patterns.map(function (p) {
        var st = active
          ? active.hits.indexOf(p.id) !== -1
            ? ' lit'
            : ' dim'
          : '';
        return h(
          'a',
          {
            class: 'card is-' + p.freq + st,
            href: '#/patron/' + p.id,
            title: 'Abrir ficha \u00b7 ' + p.name,
          },
          h(
            'span',
            { class: 'card-top' },
            h('span', { class: 'card-no' }, p.no),
            h('span', { class: 'card-name' }, p.name),
            h(
              'span',
              { class: 'card-freq freq-' + p.freq, title: FREQ_LABEL[p.freq] },
              FREQ_GLYPH[p.freq],
            ),
          ),
          h('span', { class: 'card-intent' }, p.intent),
          h(
            'span',
            { class: 'card-hit' },
            h('span', { class: 'check' }, '\u2713'),
            ' ataca este dolor',
          ),
        );
      }),
    );
    return h(
      'section',
      { class: 'col', style: { '--cat': 'var(' + cat.varc + ')' } },
      head,
      h('p', { class: 'col-desc' }, cat.desc),
      cards,
    );
  }

  function catSwatch(varc, label) {
    return h(
      'span',
      { class: 'cat-item' },
      h('span', {
        class: 'cat-swatch',
        style: { background: 'var(' + varc + ')' },
      }),
      label,
    );
  }

  G.renderHome = renderHome;
})((window.GUIA = window.GUIA || {}));
