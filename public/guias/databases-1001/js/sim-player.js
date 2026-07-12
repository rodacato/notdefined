/* js/sim-player.js — Motor GENÉRICO de simuladores paso a paso y hub del
   laboratorio. Cada simulador aporta su narración en data/ y su dibujo en
   js/sim-renderers.js (G.simRenderers[id]). Este archivo solo maneja la
   cáscara: escenario, controles, narración, teclado. Determinista. */
(function (G) {
  'use strict';
  var el = G.el;
  G.paginas = G.paginas || {};

  // Orden de los simuladores en el hub.
  G.simsOrden = ['row-vs-columnar', 'btree-vs-lsm', 'hash-lookup', 'grafo-vs-joins', 'indice-invertido', 'vectorial'];

  // ---- Hub del laboratorio (#/lab) --------------------------------------
  G.paginas.labHub = function (raiz) {
    var cards = el('div', { class: 'labhub__grid' });
    G.simsOrden.forEach(function (id) {
      var sim = G.sims[id];
      if (!sim) return;
      var ilustra = (sim.ilustra || []).map(function (slug) {
        var t = G.porSlug[slug];
        return t ? t.nombre : slug;
      });
      cards.appendChild(el('a', { class: 'labhub__card', href: '#/lab/' + id },
        el('span', { class: 'labhub__glifo' }, G.iconos.marca(20)),
        el('h3', { class: 'labhub__titulo' }, sim.titulo),
        el('p', { class: 'labhub__sub' }, sim.subtitulo),
        ilustra.length ? el('div', { class: 'labhub__tags' },
          el('span', { class: 'labhub__tags-lbl' }, 'ilustra'),
          ilustra.map(function (n) { return el('span', { class: 'labhub__tag' }, n); })
        ) : null,
        el('span', { class: 'labhub__ir' }, 'abrir ', G.iconos.flecha())
      ));
    });

    G.montar(raiz, el('div', { class: 'vista vista-labhub' },
      G.comp.barraSuperior(),
      el('div', { class: 'labhub' },
        el('a', { class: 'sim__volver', href: '#/' }, '← catálogo'),
        el('div', { class: 'labhub__cab' },
          el('span', { class: 'eyebrow' }, 'Laboratorio'),
          el('h1', { class: 'labhub__h1' }, 'Ve cómo cada modelo guarda y lee los datos'),
          el('p', { class: 'labhub__intro' }, 'Simuladores de layout físico, paso a paso. Nada de código: el punto es ver qué hace el motor por dentro antes de discutir cuál usar.')),
        cards
      )
    ));
    window.scrollTo(0, 0);
  };

  // ---- Reproductor genérico (#/lab/<id> salvo row-vs-columnar) ----------
  G.paginas.simGenerico = function (raiz, simId) {
    var sim = G.sims[simId];
    var renderer = G.simRenderers && G.simRenderers[simId];
    if (!sim || !renderer) { G.paginas.noEncontrado(raiz, simId); return; }

    var total = sim.pasos.length;
    var estado = { i: 0, reproduciendo: false, timer: null };

    var stage = el('div', { class: 'simg__stage' });
    var narracion = el('p', { class: 'sim__narr' });
    var pasoLabel = el('span', { class: 'sim__paso' });
    var btnPlay, btnPaso;

    var pintarRenderer = renderer(stage, sim); // devuelve función paint(i)

    function pintar() {
      if (typeof pintarRenderer === 'function') pintarRenderer(estado.i);
      narracion.textContent = sim.pasos[estado.i].narr;
      pasoLabel.textContent = 'paso ' + (estado.i + 1) + ' / ' + total;
      btnPaso.disabled = estado.i >= total - 1;
      G.qs('.sim__play-lbl', btnPlay).textContent = estado.reproduciendo ? 'Pausa' : 'Reproducir';
      btnPlay.setAttribute('aria-pressed', estado.reproduciendo ? 'true' : 'false');
    }
    function irA(i) { estado.i = Math.max(0, Math.min(total - 1, i)); pintar(); if (estado.i >= total - 1) parar(); }
    function paso() { if (estado.i < total - 1) irA(estado.i + 1); }
    function reiniciar() { parar(); estado.i = 0; pintar(); }
    function reproducir() {
      if (estado.i >= total - 1) estado.i = 0;
      estado.reproduciendo = true; pintar();
      estado.timer = setInterval(function () {
        if (estado.i >= total - 1) { parar(); return; }
        estado.i++; pintar();
      }, G.reduceMotion() ? 1000 : 2000);
    }
    function parar() {
      estado.reproduciendo = false;
      if (estado.timer) { clearInterval(estado.timer); estado.timer = null; }
      if (btnPlay) { btnPlay.setAttribute('aria-pressed', 'false'); G.qs('.sim__play-lbl', btnPlay).textContent = 'Reproducir'; }
    }
    function alternarPlay() { if (estado.reproduciendo) { parar(); pintar(); } else { reproducir(); } }

    btnPlay = el('button', { class: 'btn btn--primario sim__play', type: 'button', 'aria-pressed': 'false', onClick: alternarPlay },
      el('span', { class: 'sim__play-ic' }, '▶'), el('span', { class: 'sim__play-lbl' }, 'Reproducir'));
    btnPaso = el('button', { class: 'btn', type: 'button', onClick: paso }, 'Paso →');
    var btnReset = el('button', { class: 'btn btn--fantasma', type: 'button', onClick: reiniciar }, 'Reiniciar');

    var vista = el('div', { class: 'vista vista-lab', tabindex: '0' },
      G.comp.barraSuperior(),
      el('div', { class: 'sim' },
        el('a', { class: 'sim__volver', href: '#/lab' }, '← laboratorio'),
        el('div', { class: 'sim__cab' },
          el('span', { class: 'eyebrow' }, 'Laboratorio · simulador de layout'),
          el('h1', { class: 'sim__titulo' }, sim.titulo),
          el('p', { class: 'sim__subtitulo' }, sim.subtitulo)),
        stage,
        el('div', { class: 'sim__narrbox' },
          el('span', { class: 'sim__narr-glifo' }, G.iconos.marca(18)),
          narracion),
        el('div', { class: 'sim__controles' },
          el('div', { class: 'sim__botones' }, btnPlay, btnPaso, btnReset),
          pasoLabel),
        G.comp.notaEval()
      )
    );

    vista.addEventListener('keydown', function (ev) {
      if (ev.key === ' ') { ev.preventDefault(); alternarPlay(); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); paso(); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); irA(estado.i - 1); }
      else if (ev.key === 'r' || ev.key === 'R') { ev.preventDefault(); reiniciar(); }
    });

    G.montar(raiz, vista);
    G.limpiarVista = parar;
    pintar();
    window.scrollTo(0, 0);
    vista.focus({ preventScroll: true });
  };
})(window.GUIA = window.GUIA || {});
