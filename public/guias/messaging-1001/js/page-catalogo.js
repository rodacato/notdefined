/* ============================================================
   js/page-catalogo.js — índice del almanaque: hero + filtro
   problema-primero + rejilla de fichas por familia.
   ============================================================ */
(function (G) {
  "use strict";
  var h = G.h;
  G.pages = G.pages || {};

  G.pages.catalogo = function () {
    var view = h("div", { class: "view" });
    var wrap = h("div", { class: "wrap" });

    wrap.appendChild(h("div", { class: "view__head" },
      h("span", { class: "eyebrow" }, "El catálogo"),
      h("h2", { class: "view__title" }, G.catalogo.length + " sistemas, " + G.familias.length + " familias"),
      h("p", { class: "view__sub", html: "Filtra por el <em>dolor</em> que traes, no por el nombre que ya oíste. Cada ficha te dice qué gana, qué paga y cuándo <em>no</em> usarla." })
    ));

    // ---- Filtro problema-primero ----
    var estado = { dolor: null };
    var filtro = h("div", { class: "painfilter", role: "group", "aria-label": "Filtrar por problema" });
    var chips = [];
    function pintarChips() {
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", c.dataset.dolor === (estado.dolor || "") ? "true" : "false");
      });
    }
    var chipTodos = h("button", { class: "painchip", dataset: { dolor: "" },
      onClick: function () { estado.dolor = null; pintarChips(); pintarGrid(); } }, "Todos");
    filtro.appendChild(chipTodos); chips.push(chipTodos);
    G.dolores.forEach(function (d) {
      var c = h("button", { class: "painchip", dataset: { dolor: d.id },
        onClick: function () {
          estado.dolor = (estado.dolor === d.id) ? null : d.id;
          pintarChips(); pintarGrid();
        } }, d.texto);
      filtro.appendChild(c); chips.push(c);
    });
    wrap.appendChild(filtro);

    // ---- Rejilla ----
    var grid = h("div", { class: "catgrid" });
    function pintarGrid() {
      G.clear(grid);
      G.familias.forEach(function (f) {
        var sis = G.sistemasDeFamilia(f.id).filter(function (s) {
          return !estado.dolor || s.dolores.indexOf(estado.dolor) !== -1;
        });
        if (!sis.length) return;
        grid.appendChild(h("div", { class: "famhead" },
          h("span", { class: "famhead__dot", style: { background: f.color } }),
          h("h3", { class: "famhead__title" }, f.nombre),
          h("span", { class: "famhead__count" }, "· " + f.lema)
        ));
        sis.forEach(function (s) { grid.appendChild(G.comp.catCard(s)); });
      });
      if (!grid.children.length) {
        grid.appendChild(h("p", { class: "view__sub" }, "Ningún sistema para ese dolor todavía."));
      }
    }
    pintarChips();
    pintarGrid();
    wrap.appendChild(grid);
    wrap.appendChild(G.comp.notaEval());

    view.appendChild(wrap);
    return [G.comp.hero(), G.comp.sectionNav("catalogo"), view];
  };

})(window.GUIA = window.GUIA || {});
