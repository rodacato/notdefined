/* js/components.js — Piezas de UI compartidas: íconos SVG inline, barra
   superior, hero, toggle de tema, barras de rating, tarjeta de catálogo. */
(function (G) {
  'use strict';
  var el = G.el;

  /* ---- Íconos (SVG inline, currentColor, sin dependencias) ------------- */
  function svg(viewBox, cuerpo, tam) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('width', tam || 16);
    s.setAttribute('height', tam || 16);
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.6');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = cuerpo;
    return s;
  }

  G.iconos = {
    // Marca focal-frame: cuatro corchetes de esquina + punto central.
    marca: function (tam) {
      var s = svg('0 0 24 24',
        '<path d="M4 8V4h4"/><path d="M20 8V4h-4"/><path d="M4 16v4h4"/><path d="M20 16v4h-4"/>' +
        '<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>', tam || 26);
      return s;
    },
    sol: function () { return svg('0 0 24 24', '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'); },
    luna: function () { return svg('0 0 24 24', '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.2 6.2 0 0 0 10.5 10.5z"/>'); },
    monitor: function () { return svg('0 0 24 24', '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>'); },
    flecha: function () { return svg('0 0 24 24', '<path d="M5 12h14M13 6l6 6-6 6"/>', 15); }
  };

  /* ---- Toggle de tema (3 botones, persiste, emite evento) -------------- */
  G.comp = G.comp || {};

  G.comp.toggleTema = function () {
    var opciones = [
      { pref: 'light',  icono: G.iconos.sol,     etiqueta: 'Claro' },
      { pref: 'dark',   icono: G.iconos.luna,    etiqueta: 'Oscuro' },
      { pref: 'system', icono: G.iconos.monitor, etiqueta: 'Sistema' }
    ];
    var actual = G.tema.leer();
    var botones = {};
    var cont = el('div', { class: 'toggle-tema', role: 'group', 'aria-label': 'Tema' });

    function sincronizar() {
      var pref = G.tema.leer();
      opciones.forEach(function (o) {
        var b = botones[o.pref];
        var activo = o.pref === pref;
        b.classList.toggle('activo', activo);
        b.setAttribute('aria-pressed', activo ? 'true' : 'false');
      });
    }

    opciones.forEach(function (o) {
      var b = el('button', {
        class: 'toggle-tema__btn' + (o.pref === actual ? ' activo' : ''),
        type: 'button',
        title: o.etiqueta,
        'aria-label': o.etiqueta,
        'aria-pressed': o.pref === actual ? 'true' : 'false',
        onClick: function () { G.tema.fijar(o.pref); }
      }, o.icono());
      botones[o.pref] = b;
      cont.appendChild(b);
    });

    window.addEventListener(G.CONFIG.temaEvento, sincronizar);
    return cont;
  };

  /* ---- Barra superior --------------------------------------------------- */
  G.comp.barraSuperior = function () {
    return el('header', { class: 'topbar' },
      el('a', { class: 'topbar__volver', href: '/guias/' },
        el('span', { class: 'topbar__flecha' }, '←'),
        el('span', null, 'notdefined.dev/guias')
      ),
      G.comp.toggleTema()
    );
  };

  /* ---- Hero normalizado de la serie ------------------------------------ */
  G.comp.hero = function () {
    var conteo = G.catalogo.length + ' tipos · ' + G.familias.length + ' familias';
    return el('section', { class: 'hero' },
      el('div', { class: 'hero__marca' },
        el('span', { class: 'hero__glifo' }, G.iconos.marca(26)),
        el('span', { class: 'eyebrow' }, 'Almanaque técnico · 1001'),
        el('div', { class: 'hero__meta' },
          el('span', null, G.CONFIG.tomo + ' · ' + G.CONFIG.edicion),
          el('span', null, conteo)
        )
      ),
      el('div', { class: 'rule-double' }),
      el('h1', { class: 'hero__titulo' },
        'Bases de datos ',
        el('span', { class: 'hero__numeral' }, '1001')
      ),
      el('p', { class: 'hero__lede' },
        'Un catálogo de ', el('em', null, 'tipos'), ' de base de datos —no de productos, que caducan— ',
        'para recuperar por el ', el('em', null, 'problema que resuelves'), ', no por el nombre de moda. ',
        'La tesis honesta: empieza en Postgres y sal cuando un número concreto te duela.'
      )
    );
  };

  /* ---- Nota de caducidad de los números de referencia ------------------ */
  G.comp.notaEval = function () {
    return el('p', { class: 'nota-eval' },
      'Números de referencia evaluados en ' + G.CONFIG.fechaEval +
      '. Son órdenes de magnitud, no benchmarks — y caducan.');
  };

  /* ---- Barras de rating (7 ejes fijos, 0–7) ---------------------------- */
  G.comp.ratings = function (ratings, opts) {
    opts = opts || {};
    var cont = el('div', { class: 'ratings' + (opts.compacto ? ' ratings--compacto' : '') });
    G.ejes.forEach(function (eje) {
      var val = ratings[eje.id] || 0;
      var barra = el('div', { class: 'rating__pista' });
      for (var i = 1; i <= 7; i++) {
        barra.appendChild(el('span', { class: 'rating__seg' + (i <= val ? ' lleno' : '') }));
      }
      cont.appendChild(el('div', { class: 'rating' },
        el('span', { class: 'rating__label' }, eje.label),
        barra,
        el('span', { class: 'rating__num' }, String(val))
      ));
    });
    return cont;
  };

  /* ---- Chip de familia y folio ----------------------------------------- */
  G.comp.familiaChip = function (familiaId) {
    var f = G.familiaDe(familiaId);
    return el('span', {
      class: 'chip chip--familia',
      style: { '--fam': f.color }
    }, el('span', { class: 'chip__punto' }), f.nombre);
  };

  /* ---- Tarjeta de catálogo (clickeable → navega a la ficha) ------------ */
  G.comp.tarjetaCatalogo = function (tipo) {
    var f = G.familiaDe(tipo.familia);
    var ficha = G.fichas[tipo.slug] || {};
    var card = el('a', {
      class: 'catcard',
      href: '#/tipo/' + tipo.slug,
      style: { '--fam': f.color },
      dataset: { familia: tipo.familia }
    },
      el('div', { class: 'catcard__top' },
        el('span', { class: 'catcard__folio' }, tipo.folio),
        tipo.estrella ? el('span', { class: 'catcard__estrella', title: 'La estrella de su familia' }, '★') : null
      ),
      el('h3', { class: 'catcard__nombre' }, tipo.nombre),
      el('div', { class: 'catcard__arquetipo' }, tipo.arquetipo),
      el('p', { class: 'catcard__tagline' }, tipo.tagline),
      el('div', { class: 'catcard__pie' },
        G.comp.familiaChip(tipo.familia),
        el('span', { class: 'catcard__entrar' }, 'entrar ', G.iconos.flecha())
      )
    );
    return card;
  };
})(window.GUIA = window.GUIA || {});
