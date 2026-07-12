/* js/page-desambiguacion.js — La sección estrella: los nombres que se
   confunden y cuestan malas decisiones. Dos lados enfrentados; lees, y
   revelas LA clave que los separa. La primera es la madre. */
(function (G) {
  'use strict';
  var el = G.el;
  G.paginas = G.paginas || {};

  function lado(d, cual) {
    var l = d[cual];
    return el('div', { class: 'des__lado des__lado--' + cual },
      el('div', { class: 'des__lado-cab' },
        el('h4', { class: 'des__lado-nom' }, l.nombre),
        el('span', { class: 'des__lado-ej' }, l.ej)),
      el('p', { class: 'des__lado-que' }, l.que),
      el('div', { class: 'des__lado-wl' },
        el('span', { class: 'des__lado-wl-lbl' }, 'Workload'),
        el('span', null, l.workload))
    );
  }

  function tarjeta(d) {
    var revelado = false;
    var reveal = el('div', { class: 'des__reveal' });
    var btn = el('button', { class: 'btn des__btn', type: 'button' });

    function pintarReveal() {
      G.limpiar(reveal);
      if (revelado) {
        reveal.appendChild(el('div', { class: 'des__clave' },
          el('span', { class: 'des__clave-lbl' }, 'La clave'),
          el('p', null, d.clave)));
        reveal.appendChild(el('div', { class: 'des__veredicto' },
          el('span', { class: 'des__veredicto-glifo' }, '★'),
          el('p', null, d.veredicto)));
      }
      btn.textContent = revelado ? 'Ocultar la diferencia' : 'Ver la diferencia →';
    }
    btn.addEventListener('click', function () { revelado = !revelado; pintarReveal(); });
    pintarReveal();

    return el('article', { class: 'des__card' + (d.madre ? ' des__card--madre' : '') },
      el('div', { class: 'des__card-cab' },
        d.madre ? el('span', { class: 'des__madre' }, 'LA madre') : null,
        el('h3', { class: 'des__titulo' }, d.titulo),
        el('p', { class: 'des__gancho' }, d.gancho)),
      el('div', { class: 'des__duelo' },
        lado(d, 'ladoA'),
        el('span', { class: 'des__vs' }, 'vs'),
        lado(d, 'ladoB')),
      btn,
      reveal
    );
  }

  G.paginas.desambiguacion = function (raiz) {
    var lista = el('div', { class: 'des__lista' });
    G.desambiguaciones.forEach(function (d) { lista.appendChild(tarjeta(d)); });

    G.montar(raiz, el('div', { class: 'vista vista-des' },
      G.comp.barraSuperior(),
      el('div', { class: 'des' },
        el('a', { class: 'sim__volver', href: '#/' }, '← catálogo'),
        el('div', { class: 'des__cab' },
          el('span', { class: 'eyebrow' }, 'Desambiguación'),
          el('h1', { class: 'des__titulo-main' }, 'Nombres gemelos, workloads opuestos'),
          el('p', { class: 'des__intro' }, 'Las confusiones que cuestan malas decisiones de arquitectura. Lee los dos lados, adivina qué los separa, y revela la clave.')),
        lista
      )
    ));
    window.scrollTo(0, 0);
  };
})(window.GUIA = window.GUIA || {});
