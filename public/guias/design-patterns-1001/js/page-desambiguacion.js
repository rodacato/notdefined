/* ============================================================================
   page-desambiguacion.js — los que se parecen (#/desambiguacion)
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
     VISTA: desambiguación — los que se parecen   (#/desambiguacion)
     ========================================================================== */
  function Schematic(diagram) {
    var W = diagram.vb[0],
      H = diagram.vb[1];
    var byId = {};
    diagram.nodes.forEach(function (n) {
      byId[n.id] = n;
    });
    var defs = svg(
      'defs',
      null,
      svg(
        'marker',
        {
          id: 'd-arrow',
          markerWidth: '11',
          markerHeight: '11',
          refX: '8.5',
          refY: '5',
          orient: 'auto',
          markerUnits: 'userSpaceOnUse',
        },
        svg('path', { d: 'M1,1 L9,5 L1,9 Z', fill: '#6A6353' }),
      ),
      svg(
        'marker',
        {
          id: 'd-arrow-hot',
          markerWidth: '12',
          markerHeight: '12',
          refX: '8.5',
          refY: '5',
          orient: 'auto',
          markerUnits: 'userSpaceOnUse',
        },
        svg('path', { d: 'M1,1 L9,5 L1,9 Z', fill: '#D98A0B' }),
      ),
      svg(
        'marker',
        {
          id: 'd-tri',
          markerWidth: '15',
          markerHeight: '14',
          refX: '12.5',
          refY: '7',
          orient: 'auto',
          markerUnits: 'userSpaceOnUse',
        },
        svg('path', {
          d: 'M1,1 L13,7 L1,13 Z',
          fill: '#FBF6EA',
          stroke: '#6A6353',
          'stroke-width': '1.3',
        }),
      ),
      svg(
        'marker',
        {
          id: 'd-diamond',
          markerWidth: '20',
          markerHeight: '12',
          refX: '2',
          refY: '6',
          orient: 'auto',
          markerUnits: 'userSpaceOnUse',
        },
        svg('path', { d: 'M2,6 L9,2 L16,6 L9,10 Z', fill: '#D98A0B' }),
      ),
    );

    var edges = diagram.edges.map(function (e) {
      var a = byId[e.from],
        b = byId[e.to],
        d,
        lx,
        ly;
      var p1 = anchor(a, e.fromSide),
        p2 = anchor(b, e.toSide);
      if (e.curve) {
        var mx = (p1[0] + p2[0]) / 2,
          my = Math.min(p1[1], p2[1]) - 34;
        d =
          'M ' +
          p1[0] +
          ' ' +
          p1[1] +
          ' Q ' +
          mx +
          ' ' +
          my +
          ' ' +
          p2[0] +
          ' ' +
          p2[1];
        lx = mx;
        ly = my + 8;
      } else {
        d = 'M ' + p1[0] + ' ' + p1[1] + ' L ' + p2[0] + ' ' + p2[1];
        lx = (p1[0] + p2[0]) / 2;
        ly = (p1[1] + p2[1]) / 2;
      }
      var cls = 'edge ' + (e.type || '') + (e.hot ? ' hot' : '');
      var markerEnd = e.hot ? 'url(#d-arrow-hot)' : 'url(#d-arrow)';
      if (e.type === 'implements') markerEnd = 'url(#d-tri)';
      if (e.type === 'composition') markerEnd = null;
      var markerStart = e.type === 'composition' ? 'url(#d-diamond)' : null;
      var path = svg('path', { class: cls, d: d });
      if (markerEnd) path.setAttribute('marker-end', markerEnd);
      if (markerStart) path.setAttribute('marker-start', markerStart);
      var g = svg('g', null, path);
      if (e.label) {
        g.appendChild(
          svg('rect', {
            class: 'edge-label-bg',
            x: lx - e.label.length * 3.1 - 4,
            y: ly - 8,
            width: e.label.length * 6.2 + 8,
            height: 15,
            rx: '4',
          }),
        );
        g.appendChild(
          svg(
            'text',
            {
              class: 'edge-label' + (e.hot ? ' hot' : ''),
              x: lx,
              y: ly + 3.5,
              'text-anchor': 'middle',
            },
            e.label,
          ),
        );
      }
      return g;
    });

    var nodes = diagram.nodes.map(function (n) {
      var hex = ROLE_HEX[n.role] || '#6A6353';
      var subLines = n.sub ? n.sub.split('\n') : [];
      var g = svg('g', null);
      g.appendChild(
        svg('rect', {
          x: n.x,
          y: n.y,
          width: n.w,
          height: n.h,
          rx: '8',
          fill: n.hot ? '#D98A0B22' : hex + '14',
          stroke: n.hot ? '#D98A0B' : hex,
          'stroke-width': n.hot ? 2.6 : 1.5,
        }),
      );
      g.appendChild(
        svg(
          'text',
          {
            class: 'node-label',
            x: n.x + n.w / 2,
            y: n.y + (subLines.length ? 22 : n.h / 2 + 4.5),
            'text-anchor': 'middle',
          },
          n.label,
        ),
      );
      subLines.forEach(function (line, j) {
        g.appendChild(
          svg(
            'text',
            {
              class: 'node-sub',
              x: n.x + n.w / 2,
              y: n.y + 38 + j * 13,
              'text-anchor': 'middle',
            },
            line,
          ),
        );
      });
      return g;
    });

    return svg(
      'svg',
      {
        class: 'diagram',
        viewBox: '0 0 ' + W + ' ' + H,
        role: 'img',
        style: { maxHeight: '260px' },
      },
      [defs].concat(edges, nodes),
    );
  }

  function Scenario(scn, patterns) {
    var picked = null;
    var wrap = h('div', { class: 'scenario' });
    var opts = h('div', { class: 'opts' });
    var answerSlot = h('div');
    var correctName = patterns.find(function (p) {
      return p.id === scn.answer;
    }).name;

    function render() {
      opts.innerHTML = '';
      patterns.forEach(function (p) {
        var cls = 'opt';
        if (picked !== null) {
          if (p.id === scn.answer) cls += ' correct';
          else if (p.id === picked) cls += ' wrong';
          else cls += ' muted';
        }
        var btn = h(
          'button',
          {
            class: cls,
            type: 'button',
            onclick: function () {
              if (picked === null) {
                picked = p.id;
                render();
              }
            },
          },
          p.name,
        );
        if (picked !== null) btn.disabled = true;
        opts.appendChild(btn);
      });
      answerSlot.innerHTML = '';
      if (picked !== null) {
        answerSlot.appendChild(
          h(
            'div',
            { class: 'answer' },
            h(
              'span',
              { class: 'ck' },
              picked === scn.answer ? '\u2713' : '\u2192',
            ),
            h('span', null, h('b', null, correctName + '.'), ' ' + scn.why),
          ),
        );
      }
    }
    wrap.appendChild(
      h(
        'div',
        { class: 'prompt' },
        h('span', { class: 'q' }, 'Necesito\u2026'),
        scn.prompt,
      ),
    );
    wrap.appendChild(opts);
    wrap.appendChild(answerSlot);
    render();
    return wrap;
  }

  function Comparison(comp) {
    var active = comp.patterns[0].id;
    var section = h('section', { class: 'comp' });

    var title = h('div', { class: 'comp-title' });
    comp.title.forEach(function (t, i) {
      if (i > 0) title.appendChild(h('span', { class: 'comp-vs' }, 'vs'));
      title.appendChild(h('span', null, t));
    });
    title.appendChild(
      h('span', { class: 'same-chip' }, 'mismo esqueleto \u00b7 ' + comp.same),
    );
    section.appendChild(
      h(
        'div',
        { class: 'comp-head' },
        title,
        h('p', { class: 'comp-tag' }, comp.tagline),
      ),
    );

    var tabs = h('div', { class: 'ptabs' });
    var diagramSlot = h('div');
    var rightSlot = h('div', { class: 'comp-right' });

    function renderActive() {
      var pat = comp.patterns.find(function (p) {
        return p.id === active;
      });
      // tabs
      tabs.innerHTML = '';
      comp.patterns.forEach(function (p) {
        var btn = h(
          'button',
          {
            class: 'pt' + (p.id === active ? ' is-on' : ''),
            type: 'button',
            onclick: function () {
              active = p.id;
              renderActive();
            },
          },
          h('span', { class: 'pdot', style: { background: CAT_HEX[p.cat] } }),
          p.name,
        );
        tabs.appendChild(btn);
      });
      // diagrama
      diagramSlot.innerHTML = '';
      diagramSlot.appendChild(Schematic(pat.diagram));
      // intención
      rightSlot.innerHTML = '';
      rightSlot.appendChild(
        h(
          'div',
          { class: 'intent-card' },
          h(
            'span',
            { class: 'il' },
            h('span', { class: 'd' }),
            'la intenci\u00f3n que lo distingue',
          ),
          h(
            'div',
            { class: 'iname' },
            h('span', {
              class: 'cdot',
              style: { background: CAT_HEX[pat.cat] },
            }),
            pat.name,
          ),
          h('p', { class: 'itext' }, pat.intent),
          h(
            'p',
            { class: 'ipick' },
            h('b', null, 'El\u00edgelo'),
            ' ' + pat.pick,
          ),
        ),
      );
      rightSlot.appendChild(
        h(
          'a',
          { class: 'open-link', href: '#/patron/' + pat.id },
          'Ver la ficha completa de ' + pat.name + ' \u2192',
        ),
      );
    }
    renderActive();

    section.appendChild(
      h(
        'div',
        { class: 'comp-body' },
        h(
          'div',
          { class: 'comp-diagram' },
          tabs,
          diagramSlot,
          h(
            'div',
            { class: 'diagram-cap' },
            'en \u00e1mbar: lo \u00fanico que cambia entre estos patrones',
          ),
        ),
        rightSlot,
      ),
    );
    section.appendChild(
      h(
        'div',
        { class: 'quiz' },
        h(
          'div',
          { class: 'quiz-h' },
          h('span', { class: 'qic' }, '?'),
          h('span', { class: 'qt' }, '\u00bfCu\u00e1l aplica?'),
        ),
        comp.scenarios.map(function (s) {
          return Scenario(s, comp.patterns);
        }),
      ),
    );
    return section;
  }

  function renderDisambig() {
    document.title =
      'Desambiguaci\u00f3n de parecidos \u00b7 Patrones de dise\u00f1o 1001';
    var comparisons = DATA.desambiguacion;
    var focus = 'all';
    var root = h('div', { class: 'wrap' });

    root.appendChild(
      h(
        'div',
        { class: 'topbar' },
        h(
          'div',
          { class: 'crumbs' },
          h('a', { href: '#/' }, 'Cat\u00e1logo'),
          h('span', { class: 'sep' }, '/'),
          h('span', { class: 'here' }, 'Desambiguaci\u00f3n'),
        ),
        h('div', { class: 'topmeta' }, 'Almanaque t\u00e9cnico \u00b7 1001'),
      ),
    );

    root.appendChild(h('h1', { class: 'title' }, 'Los que se parecen'));
    root.appendChild(
      h(
        'p',
        { class: 'lede' },
        'El error m\u00e1s com\u00fan no es olvidar un patr\u00f3n: es ',
        h('em', null, 'confundir dos que comparten estructura'),
        '. Aqu\u00ed cada par muestra el mismo esqueleto y resalta en \u00e1mbar lo \u00fanico que los separa \u2014 su intenci\u00f3n. Despu\u00e9s, un escenario para probar el ojo.',
      ),
    );
    root.appendChild(h('hr', { class: 'double-rule' }));

    var nav = h('div', { class: 'compnav' });
    var list = h('div');

    function renderList() {
      nav.innerHTML = '';
      var allBtn = h(
        'button',
        {
          class: 'cn' + (focus === 'all' ? ' is-on' : ''),
          type: 'button',
          onclick: function () {
            focus = 'all';
            renderList();
          },
        },
        'Todas',
      );
      nav.appendChild(allBtn);
      comparisons.forEach(function (c) {
        nav.appendChild(
          h(
            'button',
            {
              class: 'cn' + (focus === c.id ? ' is-on' : ''),
              type: 'button',
              onclick: function () {
                focus = c.id;
                renderList();
              },
            },
            c.title.join(' \u00b7 '),
          ),
        );
      });
      list.innerHTML = '';
      comparisons
        .filter(function (c) {
          return focus === 'all' || c.id === focus;
        })
        .forEach(function (c) {
          list.appendChild(Comparison(c));
        });
    }
    renderList();

    root.appendChild(nav);
    root.appendChild(list);
    root.appendChild(
      siteFooter(
        h(
          'span',
          { class: 'legend-hot' },
          h('span', { class: 'hb' }),
          ' \u00e1mbar = la intenci\u00f3n que distingue \u00b7 todo lo dem\u00e1s es estructura compartida',
        ),
        h('a', { href: '#/' }, '\u2039 Volver al \u00edndice'),
      ),
    );
    mount(root);
  }

  G.renderDisambig = renderDisambig;
})((window.GUIA = window.GUIA || {}));
