/* ============================================================================
   js/widget-wal.js — "WAL + crash": el cambio se salva en la bitácora, no en
   el archivo de tabla. Determinista: los pasos vienen de data/wal.js.
   ============================================================================ */
(function (G) {
  "use strict";
  var el = G.el;

  var RAM_CHIP = {
    limpia:  { txt: "limpia",  chip: "chip--clear" },
    sucia:   { txt: "sucia",   chip: "chip--active" },
    perdida: { txt: "perdida", chip: "chip--block" }
  };
  var WAL_CHIP = {
    buffer:      { txt: "en buffer",   chip: "chip--alt" },
    durable:     { txt: "durable",     chip: "chip--clear" },
    reproducido: { txt: "reproducido", chip: "chip--active" }
  };
  var MOTOR = {
    corriendo: { txt: "motor corriendo", cls: "is-ok" },
    caido:     { txt: "motor caído",     cls: "is-down" },
    recovery:  { txt: "recovery",        cls: "is-recovery" }
  };

  G.widgets = G.widgets || {};
  G.widgets.wal = function (cfg) {
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

    // Estado del motor
    var motorBox = el("div.wal__motor");
    body.appendChild(motorBox);

    // Tres paneles: RAM · WAL · disco
    var ramValor = el("div.wal__valor");
    var ramChip = el("span.chip");
    var ramPanel = el("div.wal__panel", null, [
      el("div.wal__head", null, [el("b", { text: "shared_buffers" }), el("span", { text: "RAM · página 12058" })]),
      ramValor, ramChip
    ]);

    var walLista = el("div.wal__records");
    var walPanel = el("div.wal__panel", null, [
      el("div.wal__head", null, [el("b", { text: "WAL" }), el("span", { text: "disco · la bitácora" })]),
      walLista
    ]);

    var discoValor = el("div.wal__valor");
    var discoPanel = el("div.wal__panel", null, [
      el("div.wal__head", null, [el("b", { text: "tabla pedidos" }), el("span", { text: "disco · el libro mayor" })]),
      discoValor,
      el("span.wal__nota", { text: "lo que hay en el archivo" })
    ]);

    body.appendChild(el("div.wal__panels", null, [ramPanel, walPanel, discoPanel]));

    var narr = el("div.widget__narr");
    body.appendChild(narr);

    function render() {
      var p = cfg.pasos[paso];
      var m = MOTOR[p.motor === "caído" ? "caido" : p.motor];

      motorBox.className = "wal__motor " + m.cls;
      motorBox.textContent = m.txt;

      ramValor.textContent = p.ram.valor;
      var rc = RAM_CHIP[p.ram.estado];
      ramChip.className = "chip " + rc.chip;
      ramChip.textContent = rc.txt;
      ramPanel.classList.toggle("is-foco", p.foco === "ram");
      ramPanel.classList.toggle("is-gone", p.ram.estado === "perdida");

      G.clear(walLista);
      if (!p.wal.length) {
        walLista.appendChild(el("div.wal__vacio", { text: "sin registros desde el último checkpoint" }));
      } else {
        p.wal.forEach(function (r) {
          var wc = WAL_CHIP[r.estado];
          walLista.appendChild(el("div.wal__rec", null, [
            el("span.wal__lsn", { text: r.lsn }),
            el("span.wal__tipo", { text: r.tipo }),
            el("span.chip", { class: wc.chip, text: wc.txt })
          ]));
        });
      }
      walPanel.classList.toggle("is-foco", p.foco === "wal");

      discoValor.textContent = p.disco.valor;
      discoPanel.classList.toggle("is-foco", p.foco === "disco");
      // Marca la discrepancia: el disco miente respecto a lo commiteado
      discoPanel.classList.toggle("is-stale", p.disco.valor !== "310.00" && paso >= 3);

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
