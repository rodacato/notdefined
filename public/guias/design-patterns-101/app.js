/* ============================================================================
   app.js — LA MECÁNICA del almanaque (y solo la mecánica)
   ----------------------------------------------------------------------------
   Estado, render, router y animaciones. El contenido vive en data.js.
   Para corregir o agregar patrones NO hace falta tocar este archivo.

   Es un SPA con enrutamiento por hash (funciona con doble clic, sin servidor):
     #/                     portada — catálogo problema-primero
     #/patron/<id>          ficha de un patrón
     #/desambiguacion       los que se parecen

   Se apoya en el objeto global window.PATRONES (definido en data.js).
   ============================================================================ */
(function () {
  'use strict';

  var DATA = window.PATRONES;

  /* ---- contrato de color de roles — idéntico en todo el almanaque ---- */
  var ROLE_HEX = {
    cliente: '#64748B',
    interfaz: '#5B6CFF',
    impl: '#10B981',
    estrella: '#D98A0B',
  };
  var ROLE_ES = {
    cliente: 'Cliente',
    interfaz: 'Interfaz',
    impl: 'Implementación',
    estrella: 'El patrón',
  };
  var CAT_HEX = {
    creacional: '#A4552E',
    estructural: '#2F6A6B',
    comportamiento: '#79415F',
  };
  var FREQ_GLYPH = DATA.catalogo.freq.glyph; // { star:"★", half:"◐", open:"○" }
  var FREQ_LABEL = DATA.catalogo.freq.label;

  var reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  /* tareas de limpieza (timers, listeners) que se cancelan al cambiar de vista */
  var cleanups = [];
  function onLeave(fn) {
    cleanups.push(fn);
  }
  function runCleanups() {
    cleanups.forEach(function (f) {
      try {
        f();
      } catch (e) {}
    });
    cleanups = [];
  }

  /* --------------------------------------------------------------------------
     h() / svg() — mini ayudantes para construir DOM sin framework.
     attrs: strings normales via setAttribute; "class"; objeto en "style";
     claves on* como listeners; "html" para innerHTML.
     kids: strings (texto), nodos, o arrays (se aplanan); null/false se ignoran.
     -------------------------------------------------------------------------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function make(ns, tag, attrs, kids) {
    var node = ns
      ? document.createElementNS(SVG_NS, tag)
      : document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') node.setAttribute('class', v);
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') {
        for (var s in v) node.style[s] = v[s];
      } else if (k.slice(0, 2) === 'on' && typeof v === 'function')
        node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    append(node, kids);
    return node;
  }
  function append(node, kids) {
    if (kids == null || kids === false) return;
    if (Array.isArray(kids)) {
      kids.forEach(function (c) {
        append(node, c);
      });
      return;
    }
    if (typeof kids === 'string' || typeof kids === 'number') {
      node.appendChild(document.createTextNode(String(kids)));
      return;
    }
    node.appendChild(kids);
  }
  function h(tag, attrs) {
    return make(false, tag, attrs, Array.prototype.slice.call(arguments, 2));
  }
  function svg(tag, attrs) {
    return make(true, tag, attrs, Array.prototype.slice.call(arguments, 2));
  }

  /* Texto con `código` intercalado (los backticks marcan <code>) → array de nodos */
  function withCode(text) {
    return text.split('`').map(function (part, i) {
      return i % 2 ? h('code', null, part) : document.createTextNode(part);
    });
  }

  function center(n) {
    return [n.x + n.w / 2, n.y + n.h / 2];
  }
  function anchor(n, side) {
    if (side === 'top') return [n.x + n.w / 2, n.y];
    if (side === 'bottom') return [n.x + n.w / 2, n.y + n.h];
    if (side === 'left') return [n.x, n.y + n.h / 2];
    if (side === 'right') return [n.x + n.w, n.y + n.h / 2];
    return center(n);
  }

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
     VISTAS de una ficha: estructura · antes→después · en acción
     ========================================================================== */
  function EstructuraView(pattern) {
    return h(
      'div',
      null,
      Diagram(pattern.diagram, null, null),
      DiagramLegend(),
    );
  }
  function AntesDespuesView(pattern) {
    var ba = pattern.beforeAfter;
    return h(
      'div',
      null,
      h(
        'div',
        { class: 'ba' },
        h(
          'div',
          { class: 'ba-col ba-before' },
          h(
            'div',
            { class: 'ba-head' },
            h('span', { class: 'ba-tag' }, 'Antes \u00b7 el dolor'),
            h('span', { class: 'ba-label' }, ba.before.label),
          ),
          CodeBlock(ba.before.code, ba.before.pain, null),
        ),
        h(
          'div',
          { class: 'ba-col ba-after' },
          h(
            'div',
            { class: 'ba-head' },
            h(
              'span',
              { class: 'ba-tag' },
              'Despu\u00e9s \u00b7 con el patr\u00f3n',
            ),
            h('span', { class: 'ba-label' }, ba.after.label),
          ),
          CodeBlock(ba.after.code, null, ba.after.good),
        ),
      ),
      h(
        'div',
        { class: 'why' },
        h(
          'span',
          { class: 'lbl' },
          'Qu\u00e9 cambi\u00f3 y por qu\u00e9 mejora',
        ),
        h(
          'ul',
          null,
          ba.why.map(function (w) {
            return h(
              'li',
              null,
              h('span', { class: 'ck' }, '\u2713'),
              h('span', null, w),
            );
          }),
        ),
      ),
    );
  }

  var VIEWS = [
    {
      id: 'estructura',
      label: 'Estructura',
      hint: 'Diagrama de participantes \u2014 UML amigable. Coordenadas fijas.',
    },
    {
      id: 'antes-despues',
      label: 'Antes \u2192 Despu\u00e9s',
      hint: 'La transformaci\u00f3n: el dolor a la izquierda, el patr\u00f3n a la derecha.',
    },
    {
      id: 'en-accion',
      label: 'En acci\u00f3n',
      hint: 'Dispara la acci\u00f3n y observa viajar el mensaje entre participantes.',
    },
  ];

  /* ---- ver código (colapsable, 4 lenguajes) ---- */
  var LANGS = [
    { id: 'ts', label: 'TypeScript', dyn: false },
    { id: 'py', label: 'Python', dyn: true },
    { id: 'rb', label: 'Ruby', dyn: true },
    { id: 'go', label: 'Go', dyn: false },
  ];
  var currentLang = 'ts'; // persiste entre patrones dentro de la sesión

  function CodePanel(pattern) {
    var open = false;
    var panel = h('div', { class: 'codepanel' });
    var body = h('div', { class: 'cp-body' });
    var chev = h('span', { class: 'cp-chev' }, 'mostrar +');
    var bar = h(
      'div',
      {
        class: 'cp-bar',
        role: 'button',
        tabindex: '0',
        'aria-expanded': 'false',
      },
      h(
        'div',
        { class: 'cp-title' },
        h('span', { class: 'ic' }, '</>'),
        'Ver c\u00f3digo',
      ),
      chev,
    );

    function renderBody() {
      body.innerHTML = '';
      var tabs = h(
        'div',
        { class: 'langtabs' },
        LANGS.map(function (l) {
          var btn = h(
            'button',
            {
              class: 'lt' + (currentLang === l.id ? ' is-on' : ''),
              type: 'button',
              'aria-pressed': String(currentLang === l.id),
              onclick: function () {
                currentLang = l.id;
                renderBody();
              },
            },
            l.label,
            l.dyn ? h('span', { class: 'dyn' }, 'din\u00e1mico') : null,
          );
          return btn;
        }),
      );
      body.appendChild(tabs);
      body.appendChild(CodeBlock(pattern.code[currentLang], null, null));
      var langObj = LANGS.find(function (l) {
        return l.id === currentLang;
      });
      if (langObj.dyn)
        body.appendChild(
          h(
            'p',
            { class: 'dyn-note' },
            h('span', { class: 'b' }, 'idiom\u00e1tico:'),
            ' ' + pattern.paradigm,
          ),
        );
    }
    function toggle() {
      open = !open;
      chev.textContent = open ? 'ocultar \u2014' : 'mostrar +';
      bar.setAttribute('aria-expanded', String(open));
      if (open) {
        renderBody();
        panel.appendChild(body);
      } else if (body.parentNode) panel.removeChild(body);
    }
    bar.addEventListener('click', toggle);
    bar.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        toggle();
      }
    });
    panel.appendChild(bar);
    return panel;
  }

  /* ==========================================================================
     VISTA: ficha de patrón   (#/patron/<id>)
     ========================================================================== */
  function renderPattern(id) {
    var pattern = DATA.patrones.find(function (p) {
      return p.id === id;
    });
    if (!pattern) {
      renderHome();
      return;
    }

    var catKey = pattern.category;
    var cat = DATA.categorias[catKey];
    var siblings = DATA.patrones.filter(function (p) {
      return p.category === catKey;
    });
    var count = String(siblings.length).padStart(2, '0');
    var catColor = pattern.categoryColor || CAT_HEX[catKey];

    document.title =
      pattern.name +
      ' \u00b7 ' +
      cat.name +
      ' \u00b7 Patrones de dise\u00f1o 101';

    var root = h('div', { class: 'wrap', style: { '--cat': catColor } });

    // topbar / migas
    root.appendChild(
      h(
        'div',
        { class: 'topbar' },
        h(
          'div',
          { class: 'crumbs' },
          h('a', { href: '#/' }, 'Cat\u00e1logo'),
          h('span', { class: 'sep' }, '/'),
          h('span', null, cat.name),
          h('span', { class: 'sep' }, '/'),
          h(
            'span',
            { class: 'here', style: { color: catColor } },
            pattern.name,
          ),
        ),
        h('div', { class: 'topmeta' }, 'Almanaque t\u00e9cnico \u00b7 101'),
      ),
    );

    // switcher de hermanos
    root.appendChild(
      h(
        'div',
        { class: 'switcher' },
        siblings.map(function (p) {
          var on = p.id === pattern.id;
          return h(
            'a',
            {
              class: 'sw' + (on ? ' is-on' : ''),
              href: '#/patron/' + p.id,
              'aria-current': on ? 'true' : null,
              style: on
                ? { background: catColor, 'border-color': catColor }
                : null,
            },
            h('span', { class: 'no' }, p.no),
            p.name,
            h('span', { class: 'fq' }, FREQ_GLYPH[p.freq]),
          );
        }),
      ),
    );

    // cabecera
    root.appendChild(
      h(
        'div',
        { class: 'pat-head' },
        h(
          'span',
          { class: 'eyebrow' },
          cat.name + ' \u00b7 ' + pattern.no + ' / ' + count,
        ),
      ),
    );
    var head2 = h(
      'div',
      { class: 'pat-head', style: { 'margin-top': '6px' } },
      h('h1', { class: 'pat-name' }, pattern.name),
      h(
        'span',
        { class: 'pat-freq freq-' + pattern.freq, title: 'frecuencia de uso' },
        FREQ_GLYPH[pattern.freq],
      ),
    );
    if (pattern.warn)
      head2.appendChild(
        h('span', { class: 'warnflag' }, '\u26A0 patr\u00f3n con advertencia'),
      );
    root.appendChild(head2);

    // problema-primero + predice
    var predict = h('div', { class: 'predict' });
    function renderPredictClosed() {
      predict.className = 'predict';
      predict.innerHTML = '';
      predict.appendChild(
        h('span', { class: 'lbl' }, 'Predice antes de revelar'),
      );
      predict.appendChild(
        h(
          'p',
          { class: 'q' },
          'Dado este smell, \u00bfqu\u00e9 hace el patr\u00f3n para quitarlo \u2014 y d\u00f3nde mete la costura?',
        ),
      );
      predict.appendChild(
        h(
          'button',
          { class: 'reveal-btn', type: 'button', onclick: renderPredictOpen },
          'Revelar intenci\u00f3n \u2192',
        ),
      );
    }
    function renderPredictOpen() {
      predict.className = 'predict intent-reveal';
      predict.innerHTML = '';
      predict.appendChild(h('span', { class: 'lbl' }, 'Intenci\u00f3n'));
      predict.appendChild(h('p', { class: 'intent' }, pattern.intent));
      predict.appendChild(
        h(
          'div',
          { class: 'star' },
          h('span', { class: 'dot' }),
          h('span', null, pattern.star),
        ),
      );
    }
    renderPredictClosed();
    root.appendChild(
      h(
        'div',
        { class: 'pain-block' },
        h(
          'div',
          { class: 'pain' },
          h('span', { class: 'lbl' }, 'El dolor \u2014 empieza aqu\u00ed'),
          h('p', null, pattern.smell),
        ),
        predict,
      ),
    );

    // stage con 3 vistas
    var view = pattern.primary;
    var stageBody = h('div', { class: 'stage-body' });
    var seg = h('div', { class: 'seg', role: 'tablist' });
    var hint = h('div', { class: 'view-hint' });

    function renderStage() {
      seg.innerHTML = '';
      VIEWS.forEach(function (v) {
        var on = view === v.id;
        var btn = h(
          'button',
          {
            type: 'button',
            class: on ? 'is-on' : '',
            role: 'tab',
            'aria-pressed': String(on),
            onclick: function () {
              view = v.id;
              renderStage();
            },
          },
          v.label,
        );
        if (pattern.primary === v.id)
          btn.appendChild(h('span', { class: 'prim' }, 'primaria'));
        seg.appendChild(btn);
      });
      var current = VIEWS.find(function (v) {
        return v.id === view;
      });
      hint.textContent = current.hint;
      stageBody.innerHTML = '';
      if (view === 'estructura') stageBody.appendChild(EstructuraView(pattern));
      else if (view === 'antes-despues')
        stageBody.appendChild(AntesDespuesView(pattern));
      else stageBody.appendChild(ActionPlayer(pattern));
    }
    renderStage();
    root.appendChild(
      h(
        'div',
        { class: 'stage' },
        h('div', { class: 'stage-bar' }, seg, hint),
        stageBody,
      ),
    );

    // ver código
    root.appendChild(CodePanel(pattern));

    // paneles de cierre
    root.appendChild(
      h(
        'div',
        { class: 'panels' },
        panel(
          'p-whennot',
          '\u2717',
          'Cu\u00e1ndo NO usarlo',
          pattern.whenNot,
          false,
        ),
        panel(
          'p-relatives',
          '\u21C4',
          'Parientes / alternativas',
          pattern.relatives,
          false,
        ),
        panel('p-real', '\u25C9', 'En el mundo real', pattern.realWorld, false),
        panel(
          'p-para',
          '{ }',
          'Seg\u00fan el paradigma',
          pattern.paradigm,
          pattern.warn,
        ),
      ),
    );

    // pie: contrato de roles
    root.appendChild(rolesMini());
    root.appendChild(
      siteFooter(h('a', { href: '#/' }, '\u2039 Volver al \u00edndice')),
    );

    mount(root);
  }

  function panel(cls, icon, title, text, warn) {
    return h(
      'div',
      { class: 'panel ' + cls + (warn ? ' warn-strong' : '') },
      h(
        'div',
        { class: 'ph' },
        h('span', { class: 'icon' }, icon),
        h('span', { class: 'pt-t' }, title),
      ),
      h('p', null, text),
    );
  }

  function rolesMini() {
    var items = [
      ['cliente', 'Cliente', false],
      ['interfaz', 'Interfaz', false],
      ['impl', 'Implementaci\u00f3n', false],
      ['estrella', 'El patr\u00f3n', false],
      ['dolor', 'Dolor (antes)', true],
      ['mejora', 'Mejora (despu\u00e9s)', false],
    ];
    return h(
      'div',
      { class: 'roles-mini' },
      items.map(function (it) {
        var swatch = h('span', { class: 'sw-c' + (it[2] ? ' dolor' : '') });
        if (!it[2]) swatch.style.background = 'var(--role-' + it[0] + ')';
        return h('span', { class: 'rm' }, swatch, it[1]);
      }),
    );
  }

  /* ==========================================================================
     VISTA: portada / catálogo problema-primero   (#/)
     ========================================================================== */
  function renderHome() {
    document.title =
      'Patrones de dise\u00f1o 101 \u00b7 \u00edndice del cat\u00e1logo';
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
            h('div', { class: 'folio-no' }, '101'),
            h('div', { class: 'folio-sub' }, 'Almanaque t\u00e9cnico'),
          ),
        ),
        h(
          'div',
          { class: 'edition' },
          h('div', { class: 'eyebrow' }, 'Cat\u00e1logo \u00b7 \u00edndice'),
          h(
            'div',
            {
              class: 'eyebrow',
              style: { 'margin-top': '4px', color: 'var(--ink-soft)' },
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

    // contrato de roles (pie)
    root.appendChild(
      h(
        'footer',
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
      ),
    );

    root.appendChild(siteFooter());

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
            { style: { color: 'var(--ink-faint)' } },
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
      'Desambiguaci\u00f3n de parecidos \u00b7 Patrones de dise\u00f1o 101';
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
        h('div', { class: 'topmeta' }, 'Almanaque t\u00e9cnico \u00b7 101'),
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

  /* ==========================================================================
     Montaje + router por hash
     ========================================================================== */
  function mount(node) {
    var app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(node);
    if (!skipScroll) window.scrollTo(0, 0);
  }
  var skipScroll = false;

  function currentNav() {
    var links = document.querySelectorAll('.site-nav .links a');
    var hash = location.hash || '#/';
    links.forEach(function (a) {
      var match =
        (a.getAttribute('href') === '#/' &&
          (hash === '#/' || hash === '' || hash.indexOf('#/patron/') === 0)) ||
        a.getAttribute('href') === hash;
      if (match) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function route() {
    runCleanups();
    var hash = (location.hash || '#/').replace(/^#/, '');
    var patternMatch = hash.match(/^\/patron\/(.+)$/);
    if (hash === '/desambiguacion') renderDisambig();
    else if (patternMatch) renderPattern(decodeURIComponent(patternMatch[1]));
    else renderHome();
    currentNav();
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);
  // por si el script carga después de DOMContentLoaded
  if (document.readyState !== 'loading') route();
})();
