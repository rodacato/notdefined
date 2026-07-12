/* js/page-quiz.js — Quiz «cuál uso». Abre con la tesis Postgres y luego
   escenarios reales: eliges, y el almanaque da el veredicto razonado con
   sus bordes. Sin puntaje competitivo; es para pensar, no para ganar. */
(function (G) {
  'use strict';
  var el = G.el;
  G.paginas = G.paginas || {};

  G.paginas.quiz = function (raiz) {
    var q = G.quiz;
    var estado = { idx: 0, elegido: {} }; // idx pregunta, elegido[idx] = slug

    var cont = el('div', { class: 'quiz__preg' });
    var puntos = el('div', { class: 'quiz__puntos' });

    function preg() { return q.preguntas[estado.idx]; }

    function pintarPuntos() {
      G.limpiar(puntos);
      q.preguntas.forEach(function (p, i) {
        var estadoP = (i === estado.idx) ? 'actual' : (estado.elegido[i] != null ? 'hecha' : '');
        puntos.appendChild(el('button', {
          class: 'quiz__punto ' + estadoP,
          type: 'button',
          'aria-label': 'Pregunta ' + (i + 1),
          onClick: function () { estado.idx = i; pintar(); }
        }));
      });
    }

    function opcionBtn(slug, p) {
      var t = G.porSlug[slug];
      var respondido = estado.elegido[estado.idx] != null;
      var elegido = estado.elegido[estado.idx] === slug;
      var esCorrecta = p.respuesta === slug;
      var clase = 'quiz__op';
      if (respondido) {
        if (esCorrecta) clase += ' correcta';
        else if (elegido) clase += ' incorrecta';
        else clase += ' atenuada';
      }
      return el('button', {
        class: clase,
        type: 'button',
        disabled: respondido ? 'disabled' : null,
        onClick: function () { if (!respondido) { estado.elegido[estado.idx] = slug; pintar(); } }
      },
        el('span', { class: 'quiz__op-folio' }, t.folio),
        el('span', { class: 'quiz__op-nom' }, t.nombre),
        respondido && esCorrecta ? el('span', { class: 'quiz__op-mark' }, '✓') : null,
        respondido && elegido && !esCorrecta ? el('span', { class: 'quiz__op-mark quiz__op-mark--x' }, '✗') : null
      );
    }

    function pintar() {
      var p = preg();
      var respondido = estado.elegido[estado.idx] != null;
      var acerto = estado.elegido[estado.idx] === p.respuesta;
      var tCorrecto = G.porSlug[p.respuesta];

      pintarPuntos();
      G.limpiar(cont);

      cont.appendChild(el('div', { class: 'quiz__meta' },
        el('span', { class: 'eyebrow' }, 'Escenario ' + (estado.idx + 1) + ' / ' + q.preguntas.length)));
      cont.appendChild(el('p', { class: 'quiz__escenario' }, p.escenario));

      var ops = el('div', { class: 'quiz__ops' });
      p.opciones.forEach(function (slug) { ops.appendChild(opcionBtn(slug, p)); });
      cont.appendChild(ops);

      if (respondido) {
        cont.appendChild(el('div', { class: 'quiz__veredicto' + (acerto ? ' acerto' : '') },
          el('div', { class: 'quiz__veredicto-cab' },
            el('span', { class: 'quiz__veredicto-tag' }, acerto ? 'Bien.' : 'La respuesta es'),
            el('a', { class: 'quiz__veredicto-tipo', href: '#/tipo/' + tCorrecto.slug },
              tCorrecto.folio + ' · ' + tCorrecto.nombre, G.iconos.flecha())),
          el('p', { class: 'quiz__porque' }, p.porque),
          el('div', { class: 'quiz__borde' },
            el('span', { class: 'quiz__borde-lbl' }, 'El borde'),
            el('p', null, p.borde))
        ));

        var esUltima = estado.idx >= q.preguntas.length - 1;
        cont.appendChild(el('div', { class: 'quiz__nav' },
          estado.idx > 0 ? el('button', { class: 'btn btn--fantasma', type: 'button', onClick: function () { estado.idx--; pintar(); } }, '← anterior') : el('span'),
          esUltima
            ? el('a', { class: 'btn btn--primario', href: '#/' }, 'volver al catálogo')
            : el('button', { class: 'btn btn--primario', type: 'button', onClick: function () { estado.idx++; pintar(); } }, 'siguiente escenario →')
        ));
      }
      window.scrollTo(0, 0);
    }

    var tesis = el('div', { class: 'quiz__tesis' },
      el('span', { class: 'quiz__tesis-glifo' }, G.iconos.marca(20)),
      el('div', null,
        el('span', { class: 'eyebrow' }, 'La tesis'),
        el('h2', { class: 'quiz__tesis-titulo' }, q.tesis.titulo),
        el('p', null, q.tesis.cuerpo))
    );

    pintar();

    G.montar(raiz, el('div', { class: 'vista vista-quiz' },
      G.comp.barraSuperior(),
      el('div', { class: 'quiz' },
        el('a', { class: 'sim__volver', href: '#/' }, '← catálogo'),
        el('div', { class: 'quiz__cab' },
          el('span', { class: 'eyebrow' }, 'Cuál uso'),
          el('h1', { class: 'quiz__titulo' }, 'Escenarios reales, veredictos con filo')),
        tesis,
        puntos,
        cont
      )
    ));
    window.scrollTo(0, 0);
  };
})(window.GUIA = window.GUIA || {});
