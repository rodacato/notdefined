/* ============================================================================
   js/widget-mvcc.js — "MVCC en vivo": dos transacciones lado a lado.
   Determinista: cada paso viene tal cual de data/mvcc.js.
   ============================================================================ */
(function (G) {
  "use strict";
  var el = G.el;

  var ETIQUETA = {
    viva:     { txt: "viva",           chip: "chip--clear" },
    nueva:    { txt: "versión nueva",  chip: "chip--active" },
    muriendo: { txt: "xmax puesto",    chip: "chip--block" },
    muerta:   { txt: "muerta",         chip: "chip--block" },
    bloat:    { txt: "bloat",          chip: "chip--block" }
  };

  G.widgets = G.widgets || {};
  G.widgets.mvcc = function (cfg) {
    var widget = el("div.widget");
    var paso = 0;
    var ultimo = cfg.pasos.length - 1;

    var btnAvanzar = el("button.btn-step", { type: "button", text: "Avanzar →" });
    var btnReiniciar = el("button.widget__reset", { type: "button", text: "Reiniciar" });
    widget.appendChild(el("div.widget__bar", null, [
      el("div.widget__title", null, [el("span.dot"), cfg.titulo]),
      el("div.widget__btns", null, [btnReiniciar, btnAvanzar])
    ]));

    var body = el("div.widget__body");
    widget.appendChild(body);

    // Paneles de transacción
    var paneles = {};
    var txnsWrap = el("div.mvcc__txns");
    cfg.txns.forEach(function (t) {
      var estado = el("span.mvcc__val");
      var snap = el("span.mvcc__val");
      var panel = el("div.mvcc__txn", null, [
        el("div.mvcc__txnhead", null, [
          el("b", { text: "Txn " + t.id }),
          el("span", { text: "xid " + t.xid }),
          el("span.mvcc__rol", { text: t.rol })
        ]),
        el("div.mvcc__row", null, [el("span.mvcc__k", { text: "estado" }), estado]),
        el("div.mvcc__row", null, [el("span.mvcc__k", { text: "snapshot" }), snap])
      ]);
      paneles[t.id] = { panel: panel, estado: estado, snapshot: snap };
      txnsWrap.appendChild(panel);
    });
    body.appendChild(txnsWrap);

    // El archivo de versiones (el heap)
    body.appendChild(el("div.mvcc__label", { text: "El archivo de versiones · tabla pedidos, fila id = 42" }));
    var versWrap = el("div.mvcc__versions");
    body.appendChild(versWrap);

    // Cabecera de columnas
    var narr = el("div.widget__narr");
    body.appendChild(narr);

    function render() {
      var p = cfg.pasos[paso];

      cfg.txns.forEach(function (t) {
        var pn = paneles[t.id];
        pn.estado.textContent = p.txn[t.id].estado;
        pn.snapshot.textContent = p.txn[t.id].snapshot;
        var activo = p.foco === t.id || p.foco === "ambos";
        pn.panel.classList.toggle("is-foco", activo);
        pn.panel.classList.toggle("is-idle", p.txn[t.id].estado === "—");
      });

      G.clear(versWrap);
      versWrap.appendChild(el("div.mvcc__ver.is-head", null, [
        el("span", { text: "ctid" }), el("span", { text: "xmin" }),
        el("span", { text: "xmax" }), el("span", { text: "total" }),
        el("span", { text: "estado" }), el("span", { text: "quién la ve" })
      ]));

      p.versiones.forEach(function (v, i) {
        var lab = ETIQUETA[v.estado];
        var quien = [];
        Object.keys(p.ve).forEach(function (id) {
          if (p.ve[id] === i) quien.push(el("span.mvcc__eye", { text: "Txn " + id }));
        });
        var row = el("div.mvcc__ver", null, [
          el("span.mvcc__ctid", { text: v.ctid }),
          el("span", { text: String(v.xmin) }),
          el("span", { text: String(v.xmax) }),
          el("span.mvcc__total", { text: v.total }),
          el("span.chip", { class: lab.chip, text: lab.txt }),
          el("span.mvcc__quien", null, quien.length ? quien : [el("span.mvcc__nadie", { text: "nadie" })])
        ]);
        row.classList.add("is-" + v.estado);
        if (quien.length) row.classList.add("is-visible");
        versWrap.appendChild(row);
      });

      narr.innerHTML = "<b>Paso " + (paso + 1) + "/" + (ultimo + 1) + ".</b> " + p.narr;
      btnAvanzar.disabled = paso >= ultimo;
      btnAvanzar.textContent = paso >= ultimo ? "Fin" : "Avanzar →";
    }

    btnAvanzar.addEventListener("click", function () { if (paso < ultimo) { paso++; render(); } });
    btnReiniciar.addEventListener("click", function () { paso = 0; render(); });

    if (G.reducedMotion()) paso = ultimo;
    render();
    return widget;
  };

})(window.GUIA = window.GUIA || {});
