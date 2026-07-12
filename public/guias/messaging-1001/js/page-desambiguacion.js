/* ============================================================
   js/page-desambiguacion.js — las confusiones clásicas, cara a cara.
   ============================================================ */
(function (G) {
  "use strict";
  var h = G.h;
  G.pages = G.pages || {};

  G.pages.desambiguacion = function () {
    var wrap = h("div", { class: "wrap" });
    wrap.appendChild(h("div", { class: "view__head" },
      h("span", { class: "eyebrow" }, "Desambiguación" ),
      h("h2", { class: "view__title" }, "Cosas que todo mundo confunde — cara a cara"),
      h("p", { class: "view__sub", html: "Los pares (y tríos) que se mezclan en cualquier discusión de arquitectura. La regla de bolsillo al final de cada uno." })
    ));

    var lista = h("div", { class: "disambig" });
    G.desambiguaciones.forEach(function (d) {
      var body = h("div", { class: "dcard__body" + (d.tri ? " tri" : "") });
      d.sides.forEach(function (s) {
        body.appendChild(h("div", { class: "dside" },
          h("h4", {}, s.h),
          h("p", { html: s.body })
        ));
      });
      lista.appendChild(h("div", { class: "dcard" },
        h("div", { class: "dcard__head" },
          d.tag ? h("span", { class: "eyebrow", style: { display: "block", marginBottom: "4px" } }, d.tag) : null,
          h("h3", { class: "dcard__title", html: d.title + '<span class="vs">vs</span>' + d.vs })
        ),
        body,
        h("div", { class: "dcard__punch", html: d.punch })
      ));
    });
    wrap.appendChild(lista);

    return [G.comp.sectionNav("desambiguacion"), h("div", { class: "view" }, wrap)];
  };

})(window.GUIA = window.GUIA || {});
