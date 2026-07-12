/* ============================================================
   js/page-cual-uso.js — quiz de escenarios con veredicto razonado
   + la escalera honesta.
   ============================================================ */
(function (G) {
  "use strict";
  var h = G.h;
  G.pages = G.pages || {};

  G.pages["cual-uso"] = function () {
    var wrap = h("div", { class: "wrap" });
    wrap.appendChild(h("div", { class: "view__head" },
      h("span", { class: "eyebrow" }, "¿Cuál uso?"),
      h("h2", { class: "view__title" }, "Escenarios, no catálogos"),
      h("p", { class: "view__sub", html: "Primero la escalera honesta — por dónde empezar sin brincar escalones por moda. Luego los escenarios: elige y checa el veredicto. No hay puntaje: hay <em>criterio</em>." })
    ));

    // ---- La escalera honesta (abre la vista) ----
    var esc = G.escalera;
    var escEl = h("div", { class: "escalera", style: { marginTop: "0", marginBottom: "26px" } }, h("h4", {}, esc.titulo));
    var ol = h("ol", {});
    esc.pasos.forEach(function (p) {
      ol.appendChild(h("li", {}, h("span", { html: p.t + ": " }), h("span", { style: { color: "var(--color-fg-subtle)" } }, p.d)));
    });
    escEl.appendChild(ol);
    escEl.appendChild(h("p", { style: { marginTop: "10px", fontSize: "13.5px", color: "var(--color-fg-subtle)", fontStyle: "italic" }, html: esc.cierre }));
    wrap.appendChild(escEl);

    var escenarios = G.escenarios;
    var estado = { i: 0, respondido: false, elegido: -1 };
    var quizHost = h("div", { class: "quiz" });

    function pintar() {
      var e = escenarios[estado.i];
      G.clear(quizHost);
      var card = h("div", { class: "qcard" });
      card.appendChild(h("div", { class: "qmeta" },
        h("span", {}, "Escenario " + (estado.i + 1) + " / " + escenarios.length),
        h("span", {}, "Tomo VII")
      ));
      card.appendChild(h("div", { class: "qcard__q" }, e.q));

      var opts = h("div", { class: "qopts" });
      e.opts.forEach(function (o, oi) {
        var cls = "qopt";
        if (estado.respondido) {
          if (o.correct) cls += " right";
          else if (oi === estado.elegido) cls += " wrong";
        }
        var b = h("button", {
          class: cls, disabled: estado.respondido,
          onClick: function () { if (!estado.respondido) { estado.respondido = true; estado.elegido = oi; pintar(); } }
        }, o.t);
        opts.appendChild(b);
      });
      card.appendChild(opts);

      if (estado.respondido) {
        card.appendChild(h("div", { class: "qverdict" },
          h("span", { class: "qverdict__label" }, "Veredicto"),
          h("p", { html: e.verdict })
        ));
        var acciones = h("div", { style: { display: "flex", gap: "8px", marginTop: "16px" } });
        if (estado.i < escenarios.length - 1) {
          acciones.appendChild(h("button", { class: "simbtn primary",
            html: "Siguiente escenario " + G.icon("flecha", 15),
            onClick: function () { estado.i++; estado.respondido = false; estado.elegido = -1; pintar(); } }));
        } else {
          acciones.appendChild(h("button", { class: "simbtn",
            html: G.icon("reset", 15) + "<span>Volver a empezar</span>",
            onClick: function () { estado.i = 0; estado.respondido = false; estado.elegido = -1; pintar(); } }));
        }
        card.appendChild(acciones);
      }
      quizHost.appendChild(card);
    }
    pintar();
    wrap.appendChild(quizHost);
    wrap.appendChild(G.comp.notaEval());

    return [G.comp.sectionNav("cual-uso"), h("div", { class: "view" }, wrap)];
  };

})(window.GUIA = window.GUIA || {});
