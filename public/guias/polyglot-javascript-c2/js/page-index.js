/* page-index.js — ficha 00: identidad, camino de entrada y los modelos
   mentales. El listado de temas no vive aquí: lo carga el riel. */
(function (G) {
  "use strict";
  const el = G.el, svg = G.svg, C = G.comp;

  function head() {
    const d = G.data.meta;
    const mark = el("div", { class: "hero__mark" },
      svg("mark", 26, "0 0 38 38"),
      el("span", { class: "eyebrow" }, "Polyglot · notdefined"));
    const meta = el("div", { class: "hero__meta", html:
      "JavaScript · <strong>Nivel C2</strong><br>" + d.count });
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
    return C.section("Tres capas — cada ficha dice en cuál vive",
      el("div", { class: "legend" },
        items.map(function (it) {
          return el("div", { class: "legend__item" }, C.tag(it[0]), el("span", { class: "tag__note" }, it[1]));
        })
      )
    );
  }

  function map() {
    return C.section("Los cuatro bloques, y qué modelo mental deja cada uno",
      el("div", { class: "models" },
        G.data.blocks.map(function (b) {
          return el("div", {
            class: "model",
            style: "--rail-accent:var(--tag-" + b.layer + ")",
          },
            el("div", { class: "model__folio" }, b.folio),
            el("h3", { class: "model__title" }, b.title),
            el("p", { class: "model__name" }, b.model),
            el("p", { class: "body", html: b.modelLong })
          );
        })
      )
    );
  }

  function colophon() {
    return el("section", { class: "colophon" },
      el("hr", { class: "rule-double" }),
      el("p", { html: G.data.meta.colophon })
    );
  }

  function render() {
    return C.layout("index",
      head(),
      C.section("De qué va", el("p", { class: "body" }, G.data.meta.tesis)),
      C.section("Por dónde entrar", el("p", { class: "body", html: G.data.meta.camino })),
      legend(),
      map(),
      colophon()
    );
  }

  G.pages = G.pages || {};
  G.pages.index = render;
})(window.GUIA = window.GUIA || {});
