/* js/sim-layout.js — Motor de los simuladores de layout físico.
   v1: row store vs columnar. Determinista (sin azar): el orden de lectura
   se deriva de la definición de la query. El guión (datos, narración) vive
   en data/simulaciones.js; aquí está solo la mecánica.

   Un «paso» es una fase conceptual; dentro de una fase las celdas se
   iluminan en cascada (cosmético). Respeta prefers-reduced-motion. */
(function (G) {
  'use strict';
  var el = G.el;
  G.paginas = G.paginas || {};

  var FASES = ['intro', 'row', 'row-done', 'col', 'col-done', 'veredicto'];
  var NARR = { intro: 'intro', row: 'rowScan', 'row-done': 'rowDone', col: 'colScan', 'col-done': 'colDone', veredicto: 'veredicto' };

  // Estado de una celda según fase / panel / escenario. Sin efectos: función pura.
  function estadoCelda(sim, esc, fase, panel, r, cNombre) {
    var iFase = FASES.indexOf(fase);
    if (esc.tipo === 'aggregation') {
      var usada = esc.columnasUsadas.indexOf(cNombre) !== -1;
      if (panel === 'row') {
        if (fase === 'intro') return 'idle';
        if (fase === 'row') return 'reading';
        return usada ? 'read-used' : 'read-wasted';
      } else {
        if (iFase < FASES.indexOf('col')) return 'idle';
        if (fase === 'col') return usada ? 'reading' : 'skipped';
        return usada ? 'read-used' : 'skipped';
      }
    } else { // lookup
      var match = sim.filas[r][esc.predicado.columna] === esc.predicado.valor;
      if (panel === 'row') {
        if (fase === 'intro') return 'idle';
        if (fase === 'row') return match ? 'reading' : 'skipped';
        return match ? 'read-used' : 'skipped';
      } else {
        if (iFase < FASES.indexOf('col')) return 'idle';
        if (fase === 'col') return match ? 'reading' : 'skipped';
        return match ? 'read-used' : 'skipped';
      }
    }
  }

  function fillsNarracion(sim, esc, fase) {
    var nR = sim.filas.length, nC = sim.columnas.length, total = nR * nC;
    if (esc.tipo === 'aggregation') {
      var u = esc.columnasUsadas.length * nR, w = total - u;
      if (fase === 'row-done') return { n: total, u: u, w: w };
      if (fase === 'col-done') return { n: u };
      if (fase === 'veredicto') return { a: u, b: total };
    } else {
      if (fase === 'row-done') return { n: nC };
      if (fase === 'col-done') return { n: nC };
    }
    return {};
  }

  function aplicarFills(txt, fills) {
    return txt.replace(/\{(\w+)\}/g, function (m, k) { return (k in fills) ? fills[k] : m; });
  }

  G.paginas.lab = function (raiz, simId) {
    var sim = G.sims[simId];
    if (!sim) { G.paginas.noEncontrado(raiz, simId); return; }

    var estado = { escIdx: 0, faseIdx: 0, reproduciendo: false, timer: null };
    var celdas = { row: {}, col: {} }; // key r:c → nodo

    var narracion = el('p', { class: 'sim__narr' });
    var contRow = el('div', { class: 'panel__disco' });
    var contCol = el('div', { class: 'panel__disco panel__disco--col' });
    var contadorRow = el('span', { class: 'panel__contador' });
    var contadorCol = el('span', { class: 'panel__contador' });
    var pasoLabel = el('span', { class: 'sim__paso' });
    var queryTxt = el('code', { class: 'sim__query' });
    var btnPlay, btnPaso, chipsEsc = el('div', { class: 'sim__escenarios' });

    function esc() { return sim.escenarios[estado.escIdx]; }
    function fase() { return FASES[estado.faseIdx]; }

    // ---- Construcción de las cintas de disco ---------------------------
    function celdaChip(r, cNombre) {
      var val = sim.filas[r][cNombre];
      var tipoCol = sim.tipos[cNombre];
      var chip = el('span', { class: 'dcell dcell--' + tipoCol, dataset: { col: cNombre } },
        el('span', { class: 'dcell__col' }, cNombre),
        el('span', { class: 'dcell__val' }, String(val))
      );
      return chip;
    }

    function construirCintas() {
      G.limpiar(contRow); G.limpiar(contCol);
      celdas.row = {}; celdas.col = {};

      // Row store: agrupado por FILA (la fila vive contigua en disco).
      sim.filas.forEach(function (fila, r) {
        var grupo = el('div', { class: 'dgrupo dgrupo--fila' },
          el('span', { class: 'dgrupo__lbl' }, 'fila ' + fila.id));
        sim.columnas.forEach(function (c) {
          var chip = celdaChip(r, c);
          celdas.row[r + ':' + c] = chip;
          grupo.appendChild(chip);
        });
        contRow.appendChild(grupo);
      });

      // Columnar: agrupado por COLUMNA (la columna vive contigua en disco).
      sim.columnas.forEach(function (c) {
        var grupo = el('div', { class: 'dgrupo dgrupo--col' },
          el('span', { class: 'dgrupo__lbl' }, c));
        sim.filas.forEach(function (fila, r) {
          var chip = celdaChip(r, c);
          celdas.col[r + ':' + c] = chip;
          grupo.appendChild(chip);
        });
        contCol.appendChild(grupo);
      });
    }

    // ---- Pintar el estado de la fase actual ----------------------------
    var CLASES = ['idle', 'reading', 'read-used', 'read-wasted', 'skipped'];
    function pintar() {
      var e = esc(), f = fase();
      var reduce = G.reduceMotion();
      ['row', 'col'].forEach(function (panel) {
        var orden = 0;
        // Orden de cascada = orden físico en disco (como se recorrería).
        var claves = (panel === 'row')
          ? ordenRow()
          : ordenCol();
        claves.forEach(function (clave) {
          var partes = clave.split(':');
          var st = estadoCelda(sim, e, f, panel, +partes[0], partes[1]);
          var nodo = celdas[panel][clave];
          CLASES.forEach(function (c) { nodo.classList.remove('is-' + c); });
          nodo.classList.add('is-' + st);
          nodo.style.transitionDelay = '';
          if (st === 'reading' && !reduce) {
            nodo.style.transitionDelay = (orden * 45) + 'ms';
            orden++;
          }
        });
      });

      // Contadores (celdas efectivamente leídas)
      contadorRow.textContent = 'celdas leídas: ' + contar('row');
      contadorCol.textContent = 'celdas leídas: ' + contar('col');

      // Narración
      var key = NARR[f];
      narracion.textContent = aplicarFills(e.narracion[key] || '', fillsNarracion(sim, e, f));

      // Paso y query
      pasoLabel.textContent = 'paso ' + (estado.faseIdx + 1) + ' / ' + FASES.length;
      queryTxt.textContent = e.query;

      // Veredicto: marcar panel ganador
      var ganoRow = e.ganador === 'row', ganoCol = e.ganador === 'columnar';
      var esVeredicto = f === 'veredicto';
      G.qs('.panel--row').classList.toggle('panel--gana', esVeredicto && ganoRow);
      G.qs('.panel--col').classList.toggle('panel--gana', esVeredicto && ganoCol);

      // Botones
      btnPaso.disabled = estado.faseIdx >= FASES.length - 1;
      btnPlay.setAttribute('aria-pressed', estado.reproduciendo ? 'true' : 'false');
      G.qs('.sim__play-lbl', btnPlay).textContent = estado.reproduciendo ? 'Pausa' : 'Reproducir';
    }

    function ordenRow() {
      var out = [];
      sim.filas.forEach(function (fila, r) {
        sim.columnas.forEach(function (c) { out.push(r + ':' + c); });
      });
      return out;
    }
    function ordenCol() {
      var out = [];
      sim.columnas.forEach(function (c) {
        sim.filas.forEach(function (fila, r) { out.push(r + ':' + c); });
      });
      return out;
    }
    function contar(panel) {
      var e = esc(), f = fase(), n = 0;
      Object.keys(celdas[panel]).forEach(function (clave) {
        var p = clave.split(':');
        var st = estadoCelda(sim, e, f, panel, +p[0], p[1]);
        if (st === 'reading' || st === 'read-used' || st === 'read-wasted') n++;
      });
      return n;
    }

    // ---- Controles ------------------------------------------------------
    function irA(i) {
      estado.faseIdx = Math.max(0, Math.min(FASES.length - 1, i));
      pintar();
      if (estado.faseIdx >= FASES.length - 1) parar();
    }
    function paso() { if (estado.faseIdx < FASES.length - 1) irA(estado.faseIdx + 1); }
    function reiniciar() { parar(); estado.faseIdx = 0; pintar(); }
    function reproducir() {
      if (estado.faseIdx >= FASES.length - 1) estado.faseIdx = 0;
      estado.reproduciendo = true;
      pintar();
      estado.timer = setInterval(function () {
        if (estado.faseIdx >= FASES.length - 1) { parar(); return; }
        estado.faseIdx++;
        pintar();
      }, G.reduceMotion() ? 900 : 1700);
    }
    function parar() {
      estado.reproduciendo = false;
      if (estado.timer) { clearInterval(estado.timer); estado.timer = null; }
      if (btnPlay) { btnPlay.setAttribute('aria-pressed', 'false'); G.qs('.sim__play-lbl', btnPlay).textContent = 'Reproducir'; }
    }
    function alternarPlay() { estado.reproduciendo ? parar() : reproducir(); if (!estado.reproduciendo) pintar(); }
    function cambiarEsc(i) { parar(); estado.escIdx = i; estado.faseIdx = 0; pintarChipsEsc(); pintar(); }

    function pintarChipsEsc() {
      G.limpiar(chipsEsc);
      sim.escenarios.forEach(function (e, i) {
        chipsEsc.appendChild(el('button', {
          class: 'segbtn' + (i === estado.escIdx ? ' activo' : ''),
          type: 'button',
          'aria-pressed': i === estado.escIdx ? 'true' : 'false',
          onClick: function () { cambiarEsc(i); }
        }, e.etiqueta));
      });
    }

    btnPlay = el('button', { class: 'btn btn--primario sim__play', type: 'button', 'aria-pressed': 'false', onClick: alternarPlay },
      el('span', { class: 'sim__play-ic' }, '▶'), el('span', { class: 'sim__play-lbl' }, 'Reproducir'));
    btnPaso = el('button', { class: 'btn', type: 'button', onClick: paso }, 'Paso →');
    var btnReset = el('button', { class: 'btn btn--fantasma', type: 'button', onClick: reiniciar }, 'Reiniciar');

    // ---- Estructura de la vista ----------------------------------------
    function panel(clase, titulo, sub, disco, contador) {
      return el('div', { class: 'panel ' + clase },
        el('div', { class: 'panel__cab' },
          el('div', null,
            el('h3', { class: 'panel__titulo' }, titulo),
            el('span', { class: 'panel__sub' }, sub)),
          contador
        ),
        disco
      );
    }

    var lab = el('div', { class: 'vista vista-lab', tabindex: '0' },
      G.comp.barraSuperior(),
      el('div', { class: 'sim' },
        el('a', { class: 'sim__volver', href: '#/' }, '← catálogo'),
        el('div', { class: 'sim__cab' },
          el('span', { class: 'eyebrow' }, 'Laboratorio · simulador de layout'),
          el('h1', { class: 'sim__titulo' }, sim.titulo),
          el('p', { class: 'sim__subtitulo' }, sim.subtitulo)
        ),
        el('div', { class: 'sim__barra' },
          el('div', { class: 'sim__escgrupo' },
            el('span', { class: 'sim__barra-lbl' }, 'Escenario'), chipsEsc),
          el('div', { class: 'sim__querybox' }, queryTxt)
        ),
        el('div', { class: 'sim__paneles' },
          panel('panel--row', 'Row store', 'guarda la fila completa y contigua', contRow, contadorRow),
          panel('panel--col', 'Columnar', 'guarda cada columna por separado', contCol, contadorCol)
        ),
        el('div', { class: 'sim__narrbox' },
          el('span', { class: 'sim__narr-glifo' }, G.iconos.marca(18)),
          narracion
        ),
        el('div', { class: 'sim__controles' },
          el('div', { class: 'sim__botones' }, btnPlay, btnPaso, btnReset),
          pasoLabel
        ),
        leyenda(),
        G.comp.notaEval()
      )
    );

    // Teclado: espacio = play/pausa, → = paso, ← = atrás, R = reiniciar.
    lab.addEventListener('keydown', function (ev) {
      if (ev.key === ' ') { ev.preventDefault(); alternarPlay(); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); paso(); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); irA(estado.faseIdx - 1); }
      else if (ev.key === 'r' || ev.key === 'R') { ev.preventDefault(); reiniciar(); }
    });

    G.montar(raiz, lab);
    G.limpiarVista = parar; // el router llama esto al salir de la vista
    construirCintas();
    pintarChipsEsc();
    pintar();
    window.scrollTo(0, 0);
    lab.focus({ preventScroll: true });
  };

  function leyenda() {
    var items = [
      ['is-read-used', 'leída y usada'],
      ['is-read-wasted', 'leída pero desperdiciada'],
      ['is-skipped', 'saltada (no se lee)'],
      ['is-reading', 'leyendo ahora']
    ];
    return G.el('div', { class: 'sim__leyenda' }, items.map(function (it) {
      return G.el('span', { class: 'leyitem' },
        G.el('span', { class: 'leyitem__sw ' + it[0] }), it[1]);
    }));
  }
})(window.GUIA = window.GUIA || {});
