/* page-indice.js — vista del catálogo: hero, los cuatro hechos del runtime,
   y las cards agrupadas por bloque. */
(function (G) {
  "use strict";
  var el = G.el, icon = G.icon;

  G.vistaIndice = function (app) {
    var C = G.data.coleccion;
    document.title = "Python a fondo · Polyglot";
    G.clear(app);

    // --- Hero ---
    var hero = el("section.hero");
    var brand = el("div.hero-brand");
    brand.appendChild(el("div.hero-mark", null, [
      el("span", { html: icon("marca", 26) }),
      el("span.eyebrow", { text: C.eyebrow })
    ]));
    var conteo = G.data.temas.length + " temas · " + C.bloques.length + " bloques";
    brand.appendChild(el("div.hero-meta", { html: "<b>" + C.nivel + "</b><br>" + conteo }));
    hero.appendChild(brand);
    hero.appendChild(el("h1", { text: C.titulo }));
    hero.appendChild(el("p.lede", { text: C.lede }));
    app.appendChild(hero);
    app.appendChild(el("hr.rule-double"));

    // --- Contexto (cuatro hechos) ---
    var facts = el("section.facts");
    facts.appendChild(el("h2", { text: C.contexto.titulo }));
    var fg = el("div.facts-grid");
    C.contexto.hechos.forEach(function (h, i) {
      var f = el("div.fact");
      f.appendChild(el("span.n", { text: String(i + 1).padStart(2, "0"), style: "color:" + G.famVar(h.fam) }));
      f.appendChild(el("p", { html: h.html }));
      fg.appendChild(f);
    });
    facts.appendChild(fg);
    app.appendChild(facts);

    // --- Bloques + catálogo ---
    C.bloques.forEach(function (b) {
      var head = el("div.block-head");
      head.appendChild(el("span.eyebrow", { text: "Bloque " + b.n, style: "color:" + G.famVar(b.fam) }));
      head.appendChild(el("h2", { text: b.titulo }));
      head.appendChild(el("span.desc", { text: b.desc }));
      app.appendChild(head);

      var grid = el("div.catalog");
      G.data.temas.filter(function (t) { return t.bloque === b.n; }).forEach(function (t) {
        grid.appendChild(G.tarjeta(t));
      });
      app.appendChild(grid);
    });

    app.appendChild(el("p.colofon", { html: C.colofon }));
    window.scrollTo(0, 0);
  };

})(window.GUIA = window.GUIA || {});
