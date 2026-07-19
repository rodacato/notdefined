/* page-index.js — portada: hero normalizado + leyenda de capas + catálogo. */
(function (G) {
  "use strict";
  const el = G.el, svg = G.svg, C = G.comp;

  function hero() {
    const d = G.data.meta;
    const mark = el("div", { class: "hero__mark" },
      svg("mark", 26, "0 0 38 38"),
      el("span", { class: "eyebrow" }, "Polyglot \u00b7 notdefined"));
    const meta = el("div", { class: "hero__meta", html:
      "JavaScript \u00b7 <strong>Nivel C2</strong><br>" + d.count });
    return el("header", { class: "hero" },
      el("div", { class: "hero__brandrow" }, mark, meta),
      el("h1", { class: "hero__title" }, "JavaScript a fondo"),
      el("p", { class: "hero__lede lede" }, d.lede),
      el("hr", { class: "rule-double", style: "margin-top:22px" })
    );
  }

  function legend() {
    const items = [
      ["lenguaje", "spec ECMAScript"],
      ["motor", "V8"],
      ["runtime", "navegador / Node"],
    ];
    return el("section", { style: "margin-top:24px" },
      el("div", { class: "eyebrow" }, "Tres capas \u2014 cada ficha dice en cuál vive"),
      el("div", { class: "legend" },
        items.map(function (it) {
          return el("div", { class: "legend__item" }, C.tag(it[0]), el("span", { class: "tag__note" }, it[1]));
        })
      )
    );
  }

  function catalog() {
    return G.data.blocks.map(function (b, i) {
      const cards = b.slugs.map(function (slug) {
        return C.catalogCard(G.data.topics[slug]);
      });
      return el("div", { class: "block" },
        el("div", { class: "block__head" },
          el("span", { class: "block__num" }, "Bloque " + (i + 1)),
          el("span", { class: "block__title" }, b.title)),
        el("div", { class: "catalog" }, cards)
      );
    });
  }

  function colophon() {
    return el("section", { class: "colophon" },
      el("hr", { class: "rule-double" }),
      el("p", { html: G.data.meta.colophon })
    );
  }

  function render() {
    return el("div", { class: "shell" },
      C.topbar(),
      hero(),
      legend(),
      catalog(),
      colophon()
    );
  }

  G.pages = G.pages || {};
  G.pages.index = render;
})(window.GUIA = window.GUIA || {});
