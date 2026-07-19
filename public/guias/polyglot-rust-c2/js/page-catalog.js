/* page-catalog.js — vista índice: hero + catálogo + fila cross-serie. */
(function (G) {
  "use strict";
  var el = G.dom.el, icon = G.icon;

  G.pages = G.pages || {};

  G.pages.catalog = function (app) {
    var c = G.coleccion;
    G.dom.clear(app);
    document.title = "Rust a fondo · Polyglot";

    /* ---- hero normalizado de la casa ---- */
    var brand = el("div", { class: "hero__brand" }, [
      el("span", { html: icon("brand") }),
      el("span", { class: "hero__eyebrow", text: c.marca })
    ]);
    var meta = el("div", { class: "hero__meta", html:
      "<strong>" + G.dom.escapeHtml(c.metaTop) + "</strong><br>" +
      G.ordenPlano().length + " temas · " + c.bloques.length + " bloques" });
    var hero = el("header", { class: "hero" }, [
      el("div", { class: "hero__brandrow" }, [brand, meta]),
      el("h1", { class: "hero__title", text: c.titulo }),
      el("p", { class: "hero__lede", text: c.lede })
    ]);

    /* ---- por qué Rust ---- */
    var why = el("div", { class: "why" });
    c.why.forEach(function (w) {
      why.appendChild(el("div", { class: "why__card" }, [
        el("span", { class: "eyebrow", text: w.eyebrow }),
        el("p", { html: w.html })
      ]));
    });
    hero.appendChild(why);
    hero.appendChild(el("hr", { class: "rule-double", style: "margin-top:28px" }));
    app.appendChild(hero);

    /* ---- bloques + catálogo ---- */
    c.bloques.forEach(function (b) {
      app.appendChild(el("div", { class: "block-head" }, [
        el("span", { class: "block-head__n", style: "color:" + b.fam, text: "Bloque " + b.n }),
        el("span", { class: "block-head__label", text: b.label })
      ]));
      var grid = el("section", { class: "catalog" });
      G.temasDeBloque(b).forEach(function (t) { grid.appendChild(G.card(t, b.fam)); });
      app.appendChild(grid);
    });

    /* ---- fila cross-serie ---- */
    var cross = el("div", { class: "crossrow" }, [
      el("span", { class: "eyebrow", text: c.cross.eyebrow })
    ]);
    var cg = el("div", { class: "crossrow__grid" });
    c.cross.cells.forEach(function (cell) {
      cg.appendChild(el("div", { class: "crossrow__cell" + (cell.rust ? " is-rust" : "") }, [
        el("div", { class: "k", text: cell.k }),
        el("div", { class: "v", text: cell.v })
      ]));
    });
    cross.appendChild(cg);
    cross.appendChild(el("p", { class: "prose subtle", style: "margin-top:14px; max-width:78ch", html: c.cross.nota }));
    app.appendChild(cross);

    /* ---- nivel CEFR + colofón (sin colofón de generación) ---- */
    app.appendChild(el("p", { class: "prose subtle", style: "margin-top:24px; font-size:13px",
      html: '<strong style="color:var(--color-primary)">Nivel ' + c.nivel.code + ' de Polyglot.</strong> ' + c.nivel.escala }));
    app.appendChild(el("div", { class: "colophon" }, [
      el("span", { html: c.colofon.serie.replace("Rust", '<strong>Rust</strong>') }),
      el("span", { text: c.colofon.evaluado }),
      el("span", { text: "locale " + c.colofon.locale })
    ]));

    window.scrollTo(0, 0);
  };

})(window.GUIA = window.GUIA || {});
