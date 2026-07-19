/* page-tema.js — ficha interior: qué es · en breve · fundamento · cómo
   funciona · widget (si lo pide el tema) · mito · recursos. */
(function (G) {
  "use strict";
  const el = G.el, C = G.comp;

  function head(t) {
    const eb = el("div", { class: "tema__eyebrow" });
    if (t.star) eb.appendChild(el("span", { class: "eyebrow", style: "color:var(--data-star);font-weight:600" }, "\u2605 El tema estrella"));
    eb.appendChild(C.tag(t.tag));
    return el("div", { class: "tema__head" },
      el("span", { class: "tema__folio" }, t.folio),
      el("div", {},
        eb,
        el("h1", { class: "tema__title" }, t.title),
        el("p", { class: "tema__lede" , html: t.lede })
      )
    );
  }

  function render(slug) {
    const t = G.data.topics[slug];
    if (!t) return el("div", { class: "shell" }, C.topbar(), el("p", { style: "margin-top:40px" }, "Tema no encontrado."));

    const node = el("div", { class: "shell" },
      C.topbar(),
      head(t),
      el("hr", { class: "rule-double", style: "margin-top:24px" })
    );

    // qué es (fundamento en dos paneles) + en breve
    node.appendChild(C.section("En breve", C.briefGrid(t.breve)));

    const panels = el("div", { class: "panelgrid", style: "margin-top:0" },
      C.panel("Qué es", t.quees, t.tag),
      C.panel("Fundamento", t.fundamento, t.tag));
    node.appendChild(C.section("Qué es \u00b7 fundamento", panels));

    // widget (opcional)
    if (t.widget) {
      const w = C.section("Qu\u00e9 ves \u2014 v\u00eddeo que se toca", G.player(t.widget));
      node.appendChild(w);
      node._teardownPlayer = w.querySelector(".widget")._teardown;
    }

    // cómo funciona
    node.appendChild(C.section("C\u00f3mo funciona", C.stepsGrid(t.como)));

    // mito
    node.appendChild(C.mito(t.mito));

    // recursos
    node.appendChild(C.section("Recursos profesionales", C.recursos(t.recursos)));

    return node;
  }

  G.pages = G.pages || {};
  G.pages.tema = render;
})(window.GUIA = window.GUIA || {});
