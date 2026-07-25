/* ============================================================================
   js/widget-btree.js — "B-tree por dentro": descender el árbol nodo por nodo.
   Determinista: los pasos vienen de data/indices.js. Cada paso cambia UNA cosa.
   ============================================================================ */
(function (G) {
  "use strict";
  var el = G.el;

  G.widgets = G.widgets || {};
  G.widgets.btree = function (cfg) {
    var widget = el("div.widget");
    var paso = 0;
    var ultimo = cfg.pasos.length - 1;

    // Barra
    var btnAvanzar = el("button.btn-step", { type: "button", text: "Avanzar →" });
    var btnReiniciar = el("button.widget__reset", { type: "button", text: "Reiniciar" });
    widget.appendChild(el("div.widget__bar", null, [
      el("div.widget__title", null, [el("span.dot"), cfg.titulo]),
      el("div.widget__btns", null, [btnReiniciar, btnAvanzar])
    ]));

    var body = el("div.widget__body");
    widget.appendChild(body);

    // Contador de páginas leídas
    var contador = el("div.btree__counter");
    body.appendChild(contador);

    // Árbol: niveles con sus nodos
    var arbol = el("div.btree");
    var nodosPorNivel = [];
    cfg.niveles.forEach(function (nivel, i) {
      var nodos = [];
      var fila = el("div.btree__nodes");
      nivel.nodos.forEach(function (rango, j) {
        var n = el("div.btree__node", { text: rango });
        nodos.push(n);
        fila.appendChild(n);
      });
      nodosPorNivel.push(nodos);
      var lvl = el("div.btree__level", null, [
        el("div.btree__levellabel", { text: nivel.label }),
        fila
      ]);
      lvl.dataset.nivel = i;
      arbol.appendChild(lvl);
      if (i < cfg.niveles.length - 1) arbol.appendChild(el("div.btree__arrow", { text: "↓" }));
    });

    // Chip de la clave encontrada (dentro de la hoja elegida)
    var claveChip = el("div.btree__key", { html: "clave <b>" + cfg.buscar + "</b> → ctid <b>(12058,7)</b>" });
    arbol.appendChild(el("div.btree__arrow", { text: "↓" }));
    arbol.appendChild(claveChip);

    // Fila del heap
    var heapBox = el("div.btree__heap", { html: "<b>heap</b> · tabla pedidos · página 12,058 · item 7 → la fila" });
    arbol.appendChild(el("div.btree__arrow", { text: "↓" }));
    arbol.appendChild(heapBox);
    body.appendChild(arbol);

    // Narración
    var narr = el("div.widget__narr");
    body.appendChild(narr);

    function render() {
      var p = cfg.pasos[paso];

      // Qué nivel se alcanzó ya (para atenuar los no visitados)
      var nivelesVistos = cfg.pasos.slice(0, paso + 1)
        .filter(function (s) { return typeof s.nivel === "number"; })
        .map(function (s) { return s.nivel; });
      var maxNivel = nivelesVistos.length ? Math.max.apply(null, nivelesVistos) : -1;

      // Nodo elegido por nivel, según los pasos ya dados
      var elegido = {};
      cfg.pasos.slice(0, paso + 1).forEach(function (s) {
        if (typeof s.nivel === "number") elegido[s.nivel] = s.nodo;
      });

      nodosPorNivel.forEach(function (nodos, i) {
        var lvl = arbol.querySelector('.btree__level[data-nivel="' + i + '"]');
        lvl.classList.toggle("is-unreached", i > maxNivel);
        nodos.forEach(function (n, j) {
          var enRuta = elegido[i] === j;
          n.classList.toggle("is-path", enRuta);
          n.classList.toggle("is-dim", i <= maxNivel && !enRuta);
          // El nodo recién alcanzado es el "activo" de este paso
          n.classList.toggle("is-current", p.nivel === i && p.nodo === j);
        });
      });

      claveChip.classList.toggle("is-on", paso >= 3);
      heapBox.classList.toggle("is-on", p.nivel === "heap");

      contador.innerHTML = "Páginas leídas: <b>" + p.paginas + "</b>" +
        (p.nivel === "heap" ? " <span>(3 de índice + 1 de tabla)</span>" : " <span>(solo índice)</span>");

      narr.innerHTML = "<b>Paso " + (paso + 1) + "/" + (ultimo + 1) + ".</b> " + p.narr;

      btnAvanzar.disabled = paso >= ultimo;
      btnAvanzar.textContent = paso >= ultimo ? "Fin del descenso" : "Avanzar →";
    }

    btnAvanzar.addEventListener("click", function () {
      if (paso < ultimo) { paso++; render(); }
    });
    btnReiniciar.addEventListener("click", function () { paso = 0; render(); });

    // prefers-reduced-motion: mostrar el estado final sin animar
    if (G.reducedMotion()) paso = ultimo;
    render();
    return widget;
  };

})(window.GUIA = window.GUIA || {});
