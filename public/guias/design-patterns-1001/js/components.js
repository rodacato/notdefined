/* ============================================================================
   components.js — piezas compartidas: Diagram, CodeBlock, ActionPlayer, cromo
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

  /* ==========================================================================
     DIAGRAMA de una ficha — participantes + relaciones (coords fijas del SVG).
     activeIds: Set de nodos a resaltar (o null). tokenPos: [x,y] o null.
     ========================================================================== */
  function Diagram(diagram, activeIds, tokenPos) {
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
          id: 'm-arrow',
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
          id: 'm-tri',
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
    );

    var edgeNodes = diagram.edges.map(function (e) {
      var a = byId[e.from],
        b = byId[e.to],
        d,
        lx,
        ly;
      if (e.self) {
        var cx = a.x + a.w,
          cy = a.y + a.h * 0.3;
        d = 'M ' + cx + ' ' + cy + ' c 46 -10 46 -54 6 -58';
        lx = cx + 46;
        ly = cy - 34;
      } else {
        var p1 = anchor(a, e.fromSide),
          p2 = anchor(b, e.toSide);
        d = 'M ' + p1[0] + ' ' + p1[1] + ' L ' + p2[0] + ' ' + p2[1];
        lx = (p1[0] + p2[0]) / 2;
        ly = (p1[1] + p2[1]) / 2;
      }
      var marker = e.type === 'implements' ? 'url(#m-tri)' : 'url(#m-arrow)';
      var g = svg(
        'g',
        null,
        svg('path', { class: 'edge ' + e.type, d: d, 'marker-end': marker }),
      );
      if (e.label) {
        g.appendChild(
          svg('rect', {
            class: 'edge-label-bg',
            x: lx - e.label.length * 3.4 - 4,
            y: ly - 9,
            width: e.label.length * 6.8 + 8,
            height: 16,
            rx: '4',
          }),
        );
        g.appendChild(
          svg(
            'text',
            { class: 'edge-label', x: lx, y: ly + 3, 'text-anchor': 'middle' },
            e.label,
          ),
        );
      }
      return g;
    });

    var nodeNodes = diagram.nodes.map(function (n) {
      var hex = ROLE_HEX[n.role];
      var isActive = activeIds ? activeIds.has(n.id) : false;
      var dimmed = activeIds && !isActive;
      var subLines = n.sub ? n.sub.split('\n') : [];
      var cx = n.x + n.w / 2;
      var g = svg('g', { class: 'node' + (dimmed ? ' dimmed' : '') });
      if (n.tag)
        g.appendChild(
          svg(
            'text',
            { class: 'node-tag', x: cx, y: n.y - 7, 'text-anchor': 'middle' },
            '« ' + n.tag + ' »',
          ),
        );
      g.appendChild(
        svg('rect', {
          class: 'node-rect',
          x: n.x,
          y: n.y,
          width: n.w,
          height: n.h,
          rx: '9',
          fill: isActive ? hex + '26' : hex + '14',
          stroke: hex,
          'stroke-width': isActive ? 3 : 1.6,
        }),
      );
      if (n.warn)
        g.appendChild(
          svg(
            'text',
            {
              x: n.x + n.w - 14,
              y: n.y + 20,
              'font-size': '15',
              fill: '#D98A0B',
            },
            '\u26A0',
          ),
        );
      g.appendChild(
        svg(
          'text',
          {
            class: 'node-label',
            x: cx,
            y: n.y + (subLines.length ? 26 : n.h / 2 + 5),
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
              x: cx,
              y: n.y + 44 + j * 15,
              'text-anchor': 'middle',
            },
            line,
          ),
        );
      });
      return g;
    });

    var kids = [defs].concat(edgeNodes, nodeNodes);

    if (tokenPos) {
      var tokenG = svg('g', null, svg('circle', { class: 'token', r: '9' }));
      tokenG.style.transform =
        'translate(' + tokenPos[0] + 'px,' + tokenPos[1] + 'px)';
      tokenG.style.transition = reduceMotion
        ? 'none'
        : 'transform .68s cubic-bezier(.4,0,.2,1)';
      kids.push(tokenG);
      // devolvemos también un manejador para reubicar el token (animación)
      diagram._moveToken = function (pos) {
        tokenG.style.transform = 'translate(' + pos[0] + 'px,' + pos[1] + 'px)';
      };
    }

    var el = svg(
      'svg',
      {
        class: 'diagram',
        viewBox: '0 0 ' + W + ' ' + H,
        role: 'img',
        style: { maxHeight: '460px' },
      },
      kids,
    );
    return h('div', { class: 'diagram-wrap' }, el);
  }

  function DiagramLegend() {
    var roles = ['cliente', 'interfaz', 'impl', 'estrella'];
    return h(
      'div',
      { class: 'legend-row' },
      h(
        'div',
        { class: 'lg-grp' },
        h('span', { class: 'lg-cap' }, 'Roles'),
        roles.map(function (r) {
          return h(
            'span',
            { class: 'lg-item' },
            h('span', { class: 'lg-dot', style: { background: ROLE_HEX[r] } }),
            ROLE_ES[r],
          );
        }),
      ),
      h(
        'div',
        { class: 'lg-grp' },
        h('span', { class: 'lg-cap' }, 'Relaciones'),
        legendEdge('7 5', true, 'implementa'),
        legendEdge('2 5', false, 'crea'),
        legendEdge(null, false, 'usa / delega'),
      ),
    );
  }
  function legendEdge(dash, tri, label) {
    var line = svg('line', {
      x1: '0',
      y1: '6',
      x2: tri ? '26' : '27',
      y2: '6',
      stroke: '#6A6353',
      'stroke-width': '1.6',
    });
    if (dash) line.setAttribute('stroke-dasharray', dash);
    var head = tri
      ? svg('path', {
          d: 'M26,2 L33,6 L26,10 Z',
          fill: '#FBF6EA',
          stroke: '#6A6353',
          'stroke-width': '1.2',
        })
      : svg('path', { d: 'M27,2.5 L33,6 L27,9.5 Z', fill: '#6A6353' });
    return h(
      'span',
      { class: 'lg-item' },
      svg('svg', { class: 'lg-edge', viewBox: '0 0 34 12' }, line, head),
      label,
    );
  }

  /* ==========================================================================
     CÓDIGO — un bloque con líneas resaltadas (dolor / mejora) y comentarios tenues
     ========================================================================== */
  function renderLine(text, mark) {
    var idx = text.indexOf('//'),
      tok = '//';
    var hashIdx = text.indexOf('#');
    if (idx === -1 && hashIdx !== -1) {
      idx = hashIdx;
      tok = '#';
    }
    var body = text,
      cm = null;
    if (idx !== -1) {
      body = text.slice(0, idx);
      cm = text.slice(idx);
    }
    var xmark = mark === 'pain' ? '\u2717' : mark === 'good' ? '\u2713' : null;
    var span = h('span', { class: 'cl' + (mark ? ' ' + mark : '') });
    if (xmark) span.appendChild(h('span', { class: mark + '-x' }, xmark));
    span.appendChild(document.createTextNode(body));
    if (cm) span.appendChild(h('span', { class: 'cm' }, cm));
    return span;
  }
  function CodeBlock(code, painLines, goodLines) {
    var pain = new Set(painLines || []);
    var good = new Set(goodLines || []);
    var pre = h(
      'pre',
      null,
      code.split('\n').map(function (line, i) {
        return renderLine(
          line,
          pain.has(i) ? 'pain' : good.has(i) ? 'good' : null,
        );
      }),
    );
    return h('div', { class: 'codeblock' }, pre);
  }

  /* ==========================================================================
     EN ACCIÓN — reproductor paso a paso del flujo entre participantes.
     Cada paso cambia UNA cosa (los nodos activos + el token viajando) y trae
     una línea de narración. Gobernable con teclado.
     ========================================================================== */
  function ActionPlayer(pattern) {
    var diagram = pattern.diagram,
      action = pattern.action;
    var byId = {};
    diagram.nodes.forEach(function (n) {
      byId[n.id] = n;
    });

    var idx = 0,
      playing = false,
      timer = null;

    var wrap = h('div', {
      class: 'player',
      tabindex: '0',
      role: 'group',
      'aria-label': 'Reproductor: ' + pattern.name + ' en acción',
    });
    var diagramSlot = h('div');
    var ctrls = h('div', { class: 'action-ctrls' });
    var noteSlot = h('div', {
      class: 'ac-note',
      role: 'status',
      'aria-live': 'polite',
    });
    var help = h(
      'div',
      { class: 'player-help' },
      'teclado: espacio = reproducir/pausar · \u2190 \u2192 = paso a paso',
    );
    wrap.appendChild(diagramSlot);
    wrap.appendChild(ctrls);
    wrap.appendChild(noteSlot);
    wrap.appendChild(help);
    wrap.appendChild(h('p', { class: 'ac-cap' }, action.caption));

    function stopTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
    onLeave(stopTimer);

    function scheduleNext() {
      stopTimer();
      if (!playing) return;
      if (idx >= action.steps.length - 1) {
        playing = false;
        renderCtrls();
        return;
      }
      timer = setTimeout(function () {
        idx += 1;
        renderStep();
        scheduleNext();
      }, 1500);
    }

    function renderStep() {
      var step = action.steps[idx];
      var activeIds = new Set([step.from, step.to]);
      var from = center(byId[step.from]),
        to = center(byId[step.to]);
      // el token arranca en el emisor y viaja al receptor (una sola cosa se mueve)
      var dg = Diagram(diagram, activeIds, from);
      diagramSlot.innerHTML = '';
      diagramSlot.appendChild(dg);
      var move = diagram._moveToken;
      if (move) {
        if (reduceMotion) move(to);
        else
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              move(to);
            });
          });
      }
      noteSlot.innerHTML = '';
      noteSlot.appendChild(
        h(
          'div',
          null,
          h(
            'span',
            { class: 'step-no' },
            'PASO ' + (idx + 1) + ' / ' + action.steps.length,
          ),
          h('span', { class: 'step-msg' }, step.label),
        ),
      );
      noteSlot.appendChild(h('p', { class: 'step-note' }, step.note));
      renderCtrls();
    }

    function goTo(next) {
      stopTimer();
      playing = false;
      idx = Math.max(0, Math.min(action.steps.length - 1, next));
      renderStep();
    }
    function togglePlay() {
      if (idx >= action.steps.length - 1) {
        idx = 0;
        playing = true;
        renderStep();
        scheduleNext();
      } else {
        playing = !playing;
        renderCtrls();
        scheduleNext();
      }
    }

    function renderCtrls() {
      ctrls.innerHTML = '';
      var last = action.steps.length - 1;
      var prev = h(
        'button',
        {
          class: 'ac-btn',
          type: 'button',
          onclick: function () {
            goTo(idx - 1);
          },
        },
        '\u2039 anterior',
      );
      if (idx === 0) prev.disabled = true;
      var play = h(
        'button',
        { class: 'ac-btn play', type: 'button', onclick: togglePlay },
        playing
          ? '\u2225 pausa'
          : idx >= last
            ? '\u21BB repetir'
            : '\u25B6 reproducir',
      );
      var next = h(
        'button',
        {
          class: 'ac-btn',
          type: 'button',
          onclick: function () {
            goTo(idx + 1);
          },
        },
        'siguiente \u203A',
      );
      if (idx === last) next.disabled = true;
      var pips = h(
        'div',
        { class: 'ac-steps', 'aria-hidden': 'true' },
        action.steps.map(function (_, i) {
          return h('span', { class: 'ac-pip' + (i <= idx ? ' on' : '') });
        }),
      );
      ctrls.appendChild(prev);
      ctrls.appendChild(play);
      ctrls.appendChild(next);
      ctrls.appendChild(pips);
    }

    wrap.addEventListener('keydown', function (ev) {
      if (ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        togglePlay();
      } else if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        goTo(idx + 1);
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        goTo(idx - 1);
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        goTo(0);
      }
    });

    renderStep();
    return wrap;
  }
  /* ==========================================================================
     Cromo compartido: logo focal-frame, pie del sitio
     ========================================================================== */
  function focalMark(cls) {
    return svg(
      'svg',
      {
        class: cls,
        viewBox: '0 0 38 38',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'square',
        'aria-hidden': 'true',
      },
      svg('path', { d: 'M3 11V3h8M35 11V3h-8M3 27v8h8M35 27v8h-8' }),
      svg('circle', {
        cx: '19',
        cy: '19',
        r: '3.3',
        fill: 'currentColor',
        stroke: 'none',
      }),
    );
  }

  // pie del sitio: colofón obligatorio + enlaces opcionales a la izquierda
  function siteFooter() {
    var extras = Array.prototype.slice.call(arguments);
    var left = h(
      'div',
      {
        style: {
          display: 'flex',
          gap: '18px',
          'align-items': 'center',
          'flex-wrap': 'wrap',
        },
      },
      extras.length ? extras : null,
    );
    return h(
      'div',
      { class: 'foot' },
      left,
      h(
        'span',
        { class: 'colofon' },
        'Generada con Claude Design \u00b7 julio 2026',
      ),
    );
  }

  G.Diagram = Diagram;
  G.DiagramLegend = DiagramLegend;
  G.CodeBlock = CodeBlock;
  G.ActionPlayer = ActionPlayer;
  G.focalMark = focalMark;
  G.siteFooter = siteFooter;
})((window.GUIA = window.GUIA || {}));
