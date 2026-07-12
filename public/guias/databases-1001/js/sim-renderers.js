/* js/sim-renderers.js — Dibujo (mecánica) de los 5 simuladores adicionales.
   Cada renderer(stage, sim) construye su escenario y devuelve paint(i), que
   pinta el estado del paso i. Determinista: los estados son fijos, sin azar.
   La narración vive en data/sims-extra.js. */
(function (G) {
  'use strict';
  var el = G.el;
  G.simRenderers = G.simRenderers || {};

  var SVGNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, hijos) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (hijos) hijos.forEach(function (h) { n.appendChild(h); });
    return n;
  }
  function panel(clase, titulo, sub, cuerpo) {
    return el('div', { class: 'panel ' + clase },
      el('div', { class: 'panel__cab' }, el('div', null,
        el('h3', { class: 'panel__titulo' }, titulo),
        el('span', { class: 'panel__sub' }, sub))),
      cuerpo);
  }

  /* ===================================================================
     1 · B-tree vs LSM (camino de escritura)
     =================================================================== */
  G.simRenderers['btree-vs-lsm'] = function (stage) {
    var pasos = [
      { bt: { root: [], leaves: [[]], hi: [], split: false }, lsm: { mem: [], sst: [], hiMem: false, hiSST: -1 } },
      { bt: { root: [], leaves: [[50]], hi: [0], split: false }, lsm: { mem: [50], sst: [], hiMem: true, hiSST: -1 } },
      { bt: { root: [], leaves: [[20, 50, 70]], hi: [0], split: false }, lsm: { mem: [20, 50, 70], sst: [], hiMem: true, hiSST: -1 } },
      { bt: { root: [50], leaves: [[20, 40], [50, 70]], hi: [0, 1], split: true }, lsm: { mem: [20, 40, 50, 70], sst: [], hiMem: true, hiSST: -1 } },
      { bt: { root: [50], leaves: [[20, 40], [50, 70]], hi: [], split: false }, lsm: { mem: [], sst: [[20, 40, 50, 70]], hiMem: false, hiSST: 0 } },
      { bt: { root: [50], leaves: [[10, 20, 40], [50, 70, 90]], hi: [0, 1], split: false }, lsm: { mem: [], sst: [[20, 40, 50, 70], [10, 90]], hiMem: false, hiSST: 1 } },
      { bt: { root: [50], leaves: [[10, 20, 40], [50, 70, 90]], hi: [], split: false }, lsm: { mem: [], sst: [[10, 20, 40, 50, 70, 90]], hiMem: false, hiSST: 0 } },
      { bt: { root: [50], leaves: [[10, 20, 40], [50, 70, 90]], hi: [], split: false }, lsm: { mem: [], sst: [[10, 20, 40, 50, 70, 90]], hiMem: false, hiSST: -1 } }
    ];

    var cuerpoBT = el('div', { class: 'bt' });
    var cuerpoLSM = el('div', { class: 'lsm' });
    G.montar(stage, el('div', { class: 'sim__paneles' },
      panel('panel--row', 'B-tree', 'actualiza en su lugar (in-place)', cuerpoBT),
      panel('panel--col', 'LSM-tree', 'apila y compacta después', cuerpoLSM)));

    function chip(k, extra) { return el('span', { class: 'kv-key' + (extra || '') }, String(k)); }

    function paint(i) {
      var st = pasos[i];
      // --- B-tree ---
      G.limpiar(cuerpoBT);
      if (st.bt.root.length) {
        cuerpoBT.appendChild(el('div', { class: 'bt-rootrow' },
          el('div', { class: 'bt-node bt-root' },
            el('span', { class: 'bt-lbl' }, 'raíz'),
            el('div', { class: 'bt-keys' }, st.bt.root.map(function (k) { return chip('≤' + k + '  ·  >' + k, ' kv-sep'); })))));
      }
      var leavesRow = el('div', { class: 'bt-leaves' });
      st.bt.leaves.forEach(function (leaf, idx) {
        var hi = st.bt.hi.indexOf(idx) !== -1;
        leavesRow.appendChild(el('div', { class: 'bt-node bt-leaf' + (hi ? ' is-hi' : '') + (st.bt.split && hi ? ' is-split' : '') },
          el('span', { class: 'bt-lbl' }, 'hoja'),
          el('div', { class: 'bt-keys' }, leaf.length ? leaf.map(function (k) { return chip(k); }) : el('span', { class: 'bt-vacio' }, '—'))));
      });
      cuerpoBT.appendChild(leavesRow);
      cuerpoBT.appendChild(el('div', { class: 'bt-nota' }, st.bt.split ? 'división de hoja → reescribe páginas en disco' : 'escritura en su lugar (acceso aleatorio)'));

      // --- LSM ---
      G.limpiar(cuerpoLSM);
      cuerpoLSM.appendChild(el('div', { class: 'lsm-mem' + (st.lsm.hiMem ? ' is-hi' : '') },
        el('span', { class: 'bt-lbl' }, 'memtable · RAM'),
        el('div', { class: 'bt-keys' }, st.lsm.mem.length ? st.lsm.mem.map(function (k) { return chip(k); }) : el('span', { class: 'bt-vacio' }, 'vacía'))));
      var disco = el('div', { class: 'lsm-disk' }, el('span', { class: 'bt-lbl' }, 'disco · SSTables inmutables'));
      if (!st.lsm.sst.length) { disco.appendChild(el('span', { class: 'bt-vacio' }, 'aún nada en disco')); }
      st.lsm.sst.forEach(function (sst, idx) {
        disco.appendChild(el('div', { class: 'lsm-sst' + (st.lsm.hiSST === idx ? ' is-hi' : '') },
          el('div', { class: 'bt-keys' }, sst.map(function (k) { return chip(k); }))));
      });
      cuerpoLSM.appendChild(disco);
      cuerpoLSM.appendChild(el('div', { class: 'bt-nota' },
        st.lsm.hiSST >= 0 && st.lsm.sst.length === 1 && i >= 6 ? 'compactación: SSTables fusionados en uno ordenado'
          : st.lsm.hiSST >= 0 ? 'volcado secuencial: nunca reescribe lo ya escrito'
          : 'la escritura solo toca RAM'));
    }
    return paint;
  };

  /* ===================================================================
     2 · Hash lookup (clave-valor)
     =================================================================== */
  G.simRenderers['hash-lookup'] = function (stage) {
    // Buckets deterministas. "user:42" vive en el bucket 3.
    var buckets = [
      [], [{ k: 'user:41', v: 'Lía' }], [{ k: 'user:44', v: 'Nadia' }],
      [{ k: 'user:42', v: 'Ana' }], [], [{ k: 'user:50', v: 'Rui' }],
      [{ k: 'user:40', v: 'Beto' }], [{ k: 'user:43', v: 'Cora' }]
    ];
    var destino = 3;
    var rango = ['user:40', 'user:41', 'user:43', 'user:44', 'user:50']; // dispersas

    var keyCol = el('div', { class: 'hash-col hash-col--key' });
    var fnBox = el('div', { class: 'hash-fn' });
    var bucketsCol = el('div', { class: 'hash-buckets' });
    G.montar(stage, el('div', { class: 'hash-flow' },
      el('div', null, el('span', { class: 'hash-caption' }, 'la consulta'), keyCol),
      el('div', null, el('span', { class: 'hash-caption' }, 'función hash'), fnBox),
      el('div', null, el('span', { class: 'hash-caption' }, 'buckets'), bucketsCol)));

    function paint(i) {
      G.limpiar(keyCol); G.limpiar(fnBox); G.limpiar(bucketsCol);
      var esRango = i >= 4;
      // Llave(s)
      if (!esRango) {
        keyCol.appendChild(el('div', { class: 'hash-key' + (i >= 1 ? ' is-hi' : '') }, 'GET  user:42'));
      } else {
        keyCol.appendChild(el('div', { class: 'hash-key hash-key--rango' }, 'user:40 … user:50'));
        keyCol.appendChild(el('div', { class: 'hash-rangoNota' }, 'un rango contiguo'));
      }
      // Hash
      if (esRango) {
        fnBox.appendChild(el('div', { class: 'hash-fnbox is-warn' }, 'hash( )'));
        fnBox.appendChild(el('div', { class: 'hash-fnout' }, 'dispersa →'));
      } else {
        fnBox.appendChild(el('div', { class: 'hash-fnbox' + (i >= 1 ? ' is-hi' : '') }, 'hash( )'));
        fnBox.appendChild(el('div', { class: 'hash-fnout' + (i >= 2 ? ' is-hi' : '') }, i >= 2 ? '→ #3' : '→ ?'));
      }
      // Buckets
      buckets.forEach(function (b, idx) {
        var activo = !esRango && i >= 2 && idx === destino;
        var fila = el('div', { class: 'hash-bucket' + (activo ? ' is-hi' : '') },
          el('span', { class: 'hash-bidx' }, '#' + idx));
        var contenido = el('div', { class: 'hash-bcont' });
        b.forEach(function (e) {
          var enRango = esRango && rango.indexOf(e.k) !== -1;
          var revela = activo && i >= 3;
          contenido.appendChild(el('span', { class: 'hash-entry' + (enRango ? ' is-rango' : '') + (revela ? ' is-val' : '') },
            e.k + (revela ? '  = ' + e.v : '')));
        });
        fila.appendChild(contenido);
        bucketsCol.appendChild(fila);
      });
    }
    return paint;
  };

  /* ===================================================================
     3 · Grafo vs JOINs
     =================================================================== */
  G.simRenderers['grafo-vs-joins'] = function (stage) {
    var nodos = {
      Ana: [58, 150], Beto: [150, 68], Cora: [150, 150], Dío: [150, 232],
      Eli: [268, 44], Fer: [268, 112], Gil: [268, 190], Hana: [268, 256]
    };
    var aristas = [['Ana', 'Beto'], ['Ana', 'Cora'], ['Ana', 'Dío'], ['Beto', 'Eli'], ['Beto', 'Fer'], ['Cora', 'Gil'], ['Dío', 'Hana']];
    var hop1n = ['Beto', 'Cora', 'Dío'], hop2n = ['Eli', 'Fer', 'Gil', 'Hana'];
    var hop1e = [['Ana', 'Beto'], ['Ana', 'Cora'], ['Ana', 'Dío']];
    var hop2e = [['Beto', 'Eli'], ['Beto', 'Fer'], ['Cora', 'Gil'], ['Dío', 'Hana']];

    var svg = s('svg', { viewBox: '0 0 320 300', class: 'gr-svg' });
    var elsEdge = {}, elsNode = {};
    aristas.forEach(function (e) {
      var a = nodos[e[0]], b = nodos[e[1]];
      var ln = s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'gr-edge' });
      elsEdge[e.join('-')] = ln; svg.appendChild(ln);
    });
    Object.keys(nodos).forEach(function (n) {
      var p = nodos[n];
      var g = s('g', { class: 'gr-node' });
      var c = s('circle', { cx: p[0], cy: p[1], r: 20, class: 'gr-c' });
      var t = s('text', { x: p[0], y: p[1] + 4, class: 'gr-t', 'text-anchor': 'middle' });
      t.textContent = n;
      g.appendChild(c); g.appendChild(t); svg.appendChild(g);
      elsNode[n] = g;
    });
    var grafoWrap = el('div', { class: 'gr-wrap' }, svg, el('div', { class: 'gr-cuenta' }));

    var joinsWrap = el('div', { class: 'jn' });

    G.montar(stage, el('div', { class: 'sim__paneles' },
      panel('panel--row', 'Grafo', 'sigue punteros, un salto a la vez', grafoWrap),
      panel('panel--col', 'SQL · JOINs', 'encadena la tabla friendships', joinsWrap)));

    function claseEdge(e, on) { elsEdge[e.join('-')].setAttribute('class', 'gr-edge' + (on ? ' is-hi' : '')); }
    function claseNode(n, cls) { elsNode[n].setAttribute('class', 'gr-node ' + cls); }

    function paint(i) {
      // Grafo
      var grafoActivo = i <= 3;
      grafoWrap.style.opacity = grafoActivo ? '1' : '.4';
      joinsWrap.parentNode.parentNode.style.opacity = grafoActivo ? '.55' : '1';

      Object.keys(nodos).forEach(function (n) { claseNode(n, n === 'Ana' ? 'gr-ana' : ''); });
      aristas.forEach(function (e) { claseEdge(e, false); });

      if (i >= 1) { hop1e.forEach(function (e) { claseEdge(e, true); }); hop1n.forEach(function (n) { claseNode(n, 'is-hop1'); }); }
      if (i >= 2) { hop2e.forEach(function (e) { claseEdge(e, true); }); hop2n.forEach(function (n) { claseNode(n, 'is-hop2'); }); }
      var cuenta = grafoWrap.querySelector('.gr-cuenta');
      cuenta.textContent = i >= 3 ? '4 amigos de amigos · ' + (i) + ' saltos de puntero' : (i >= 1 ? 'caminando aristas…' : '');

      // JOINs
      G.limpiar(joinsWrap);
      joinsWrap.appendChild(el('code', { class: 'jn-q' }, 'friendships f1 JOIN friendships f2 ON f1.b = f2.a'));
      var etapas = [
        { lbl: 'JOIN 1 · amigos de Ana', chips: ['Beto', 'Cora', 'Dío'], n: 3 },
        { lbl: 'JOIN 2 · amigos de esos amigos', chips: ['Eli', 'Fer', 'Gil', 'Hana', '…', '…', '…'], n: 7 }
      ];
      var mostrar = i >= 5 ? 2 : (i >= 4 ? 1 : 0);
      for (var e = 0; e < mostrar; e++) {
        var et = etapas[e];
        joinsWrap.appendChild(el('div', { class: 'jn-etapa' + (e === 1 ? ' jn-etapa--boom' : '') },
          el('span', { class: 'jn-lbl' }, et.lbl + '  ·  ' + et.n + ' filas'),
          el('div', { class: 'jn-filas' }, et.chips.map(function (c) { return el('span', { class: 'kv-key' }, c); }))));
      }
      if (i >= 5) joinsWrap.appendChild(el('div', { class: 'jn-boom' }, 'cada salto = otro JOIN → el intermedio se multiplica'));
      if (i < 4) joinsWrap.appendChild(el('div', { class: 'bt-vacio' }, 'espera al recorrido en SQL…'));
    }
    return paint;
  };

  /* ===================================================================
     4 · Índice invertido
     =================================================================== */
  G.simRenderers['indice-invertido'] = function (stage) {
    var docs = [
      { id: 'd1', txt: 'zapato rojo de cuero', terms: ['zapato', 'rojo', 'de', 'cuero'] },
      { id: 'd2', txt: 'bolsa roja', terms: ['bolsa', 'roja'] },
      { id: 'd3', txt: 'zapato azul', terms: ['zapato', 'azul'] }
    ];
    var indice = [
      { t: 'zapato', docs: ['d1', 'd3'] },
      { t: 'rojo', docs: ['d1'] },
      { t: 'cuero', docs: ['d1'] },
      { t: 'bolsa', docs: ['d2'] },
      { t: 'roja', docs: ['d2'] },
      { t: 'azul', docs: ['d3'] }
    ];
    var busqueda = ['zapato', 'rojo'];

    var colDocs = el('div', { class: 'inv-docs' });
    var colIdx = el('div', { class: 'inv-idx' });
    var resultado = el('div', { class: 'inv-res' });
    G.montar(stage, el('div', { class: 'inv' },
      el('div', null, el('span', { class: 'hash-caption' }, 'documentos'), colDocs),
      el('div', null, el('span', { class: 'hash-caption' }, 'índice invertido'), colIdx, resultado)));

    function paint(i) {
      G.limpiar(colDocs); G.limpiar(colIdx); G.limpiar(resultado);
      docs.forEach(function (d) {
        var card = el('div', { class: 'inv-doc' }, el('span', { class: 'inv-docid' }, d.id));
        if (i >= 1) card.appendChild(el('div', { class: 'inv-tokens' }, d.terms.map(function (t) {
          return el('span', { class: 'inv-tok' + (i >= 3 && busqueda.indexOf(t) !== -1 ? ' is-hi' : '') }, t);
        })));
        else card.appendChild(el('div', { class: 'inv-txt' }, d.txt));
        colDocs.appendChild(card);
      });
      if (i >= 2) {
        indice.forEach(function (row) {
          var enBusqueda = i >= 3 && busqueda.indexOf(row.t) !== -1;
          colIdx.appendChild(el('div', { class: 'inv-row' + (enBusqueda ? ' is-hi' : '') },
            el('span', { class: 'inv-term' }, row.t),
            el('span', { class: 'inv-arrow' }, '→'),
            el('div', { class: 'inv-posting' }, row.docs.map(function (d) { return el('span', { class: 'kv-key' }, d); }))));
        });
      } else {
        colIdx.appendChild(el('div', { class: 'bt-vacio' }, 'se construye al tokenizar…'));
      }
      if (i >= 4) {
        resultado.appendChild(el('div', { class: 'inv-inter' },
          el('span', { class: 'inv-inter-lbl' }, '«zapato» ∩ «rojo»'),
          el('span', { class: 'kv-key is-res' }, 'd1')));
        resultado.appendChild(el('div', { class: 'bt-nota' }, 'intersección de posting lists · cero documentos escaneados'));
      }
    }
    return paint;
  };

  /* ===================================================================
     5 · Similarity search vectorial
     =================================================================== */
  G.simRenderers['vectorial'] = function (stage) {
    // Colores de familia desde el catálogo (contrato de datos, una sola fuente).
    var famColor = {
      A: G.familiaDe('oltp').color,
      B: G.familiaDe('escala').color,
      C: G.familiaDe('analitica').color,
      X: G.familiaDe('forma').color
    };
    var pts = [
      [60, 60, 'A'], [82, 48, 'A'], [70, 82, 'A'],
      [170, 120, 'B'], [150, 110, 'B'], [186, 132, 'B'], [160, 142, 'B'],
      [250, 78, 'C'], [272, 100, 'C'], [256, 60, 'C'],
      [110, 182, 'X'], [232, 184, 'X']
    ];
    var q = [168, 124];
    var exact = [3, 5, 6];      // vecinos exactos
    var ann = [3, 5, 4];        // lo que devuelve ANN
    var missed = 6;            // el que ANN omite

    var svg = s('svg', { viewBox: '0 0 320 240', class: 'vec-svg' });
    G.montar(stage, el('div', { class: 'vec' }, svg,
      el('div', { class: 'vec-ley' },
        el('span', { class: 'leyitem' }, el('span', { class: 'vec-dot vec-dot--q' }), 'consulta'),
        el('span', { class: 'leyitem' }, el('span', { class: 'vec-dot vec-dot--sel' }), 'vecino devuelto'),
        el('span', { class: 'leyitem' }, el('span', { class: 'vec-dot vec-dot--miss' }), 'omitido por ANN'))));

    function paint(i) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      // rejilla del índice (hint ANN)
      if (i >= 4) {
        [80, 160, 240].forEach(function (x) { svg.appendChild(s('line', { x1: x, y1: 0, x2: x, y2: 240, class: 'vec-grid' })); });
        [80, 160].forEach(function (y) { svg.appendChild(s('line', { x1: 0, y1: y, x2: 320, y2: y, class: 'vec-grid' })); });
      }
      var sel = i >= 4 ? ann : (i >= 3 ? exact : []);
      // líneas al query
      sel.forEach(function (idx) {
        var p = pts[idx];
        svg.appendChild(s('line', { x1: q[0], y1: q[1], x2: p[0], y2: p[1], class: 'vec-link' }));
      });
      // puntos
      pts.forEach(function (p, idx) {
        var col = i >= 1 ? famColor[p[2]] : 'var(--color-fg-faint)';
        var cls = 'vec-pt';
        if (sel.indexOf(idx) !== -1) cls += ' is-sel';
        if (i >= 4 && idx === missed) cls += ' is-miss';
        var c = s('circle', { cx: p[0], cy: p[1], r: 7, class: cls });
        c.setAttribute('style', 'fill:' + col);
        svg.appendChild(c);
      });
      // query
      if (i >= 2) {
        var d = s('path', { class: 'vec-q', d: 'M' + q[0] + ' ' + (q[1] - 9) + ' L' + (q[0] + 9) + ' ' + q[1] + ' L' + q[0] + ' ' + (q[1] + 9) + ' L' + (q[0] - 9) + ' ' + q[1] + ' Z' });
        svg.appendChild(d);
      }
    }
    return paint;
  };
})(window.GUIA = window.GUIA || {});
