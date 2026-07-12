/* ============================================================
   js/page-simulaciones.js — galería de simulaciones. Cada una
   es un motor independiente montado desde G.comp.sim.
   ============================================================ */
(function (G) {
  "use strict";
  var h = G.h;
  G.pages = G.pages || {};

  G.pages.simulaciones = function () {
    var wrap = h("div", { class: "wrap" });
    wrap.appendChild(h("div", { class: "view__head" },
      h("span", { class: "eyebrow" }, "El corazón de la guía"),
      h("h2", { class: "view__title" }, "Simulaciones paso a paso"),
      h("p", { class: "view__sub", html: "Cada semántica se ve más de lo que se explica. Dale <em>play</em>, o avanza paso a paso con las flechas del teclado. Deterministas: mismo resultado siempre." })
    ));

    G.simOrden.forEach(function (simId) {
      wrap.appendChild(h("div", { style: { marginTop: "26px" } }, G.comp.sim(simId)));
    });

    return [G.comp.sectionNav("simulaciones"), h("div", { class: "view" }, wrap)];
  };

})(window.GUIA = window.GUIA || {});
