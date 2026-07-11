/* ============================================================================
   page-ficha.js — la ficha de un patrón (#/patron/<id>): vistas y render
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
  /* Barra de memoria del beforeAfter.meter (hoy solo Flyweight lo trae) */
  function meterRow(tag, m, roleClass) {
    return h(
      'div',
      { class: 'meter-row' },
      h('span', { class: 'meter-tag' }, tag),
      h(
        'div',
        { class: 'meter-track' },
        h('div', {
          class: 'meter-fill ' + roleClass,
          style: { width: m.pct + '%' },
        }),
      ),
      h('span', { class: 'meter-total ' + roleClass }, m.total),
      h('span', { class: 'meter-note' }, m.label),
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
      ba.meter
        ? h(
            'div',
            { class: 'ba-meter' },
            h('span', { class: 'lbl' }, 'La memoria, medida'),
            meterRow('Antes', ba.meter.before, 'is-dolor'),
            meterRow('Después', ba.meter.after, 'is-mejora'),
          )
        : null,
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
      G.renderHome(); // en call-time: page-catalogo.js carga después que este
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
      ' \u00b7 Patrones de dise\u00f1o 1001';

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
        h('div', { class: 'topmeta' }, 'Almanaque t\u00e9cnico \u00b7 1001'),
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

  G.renderPattern = renderPattern;
})((window.GUIA = window.GUIA || {}));
