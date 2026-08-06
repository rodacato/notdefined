/* page-bibliografia.js — las fuentes, agrupadas por capítulo en el orden de la
   guía. Se llega buscando «más de la ficha 09», no «un libro». */
(function (G) {
  "use strict";
  const el = G.el, C = G.comp;

  function spread() {
    const seen = new Map();
    for (const b of G.data.blocks)
      for (const slug of b.slugs)
        for (const r of G.data.topics[slug].recursos || []) {
          if (!seen.has(r.href)) seen.set(r.href, { recurso: r, folios: [] });
          seen.get(r.href).folios.push(G.data.topics[slug].folio);
        }
    return seen;
  }

  function item(r, note) {
    return el("a", { class: "recurso", href: r.href, target: "_blank", rel: "noopener" },
      el("span", { class: "recurso__kind", style: r.star ? "color:var(--data-star)" : "" },
        (r.star ? "★ " : "") + r.kind),
      el("span", { class: "recurso__title" }, r.title),
      el("span", { class: "caption" }, note || r.sub)
    );
  }

  function render() {
    const cruzadas = spread();
    const grupos = [];

    for (const b of G.data.blocks)
      for (const slug of b.slugs) {
        const t = G.data.topics[slug];
        const propias = (t.recursos || []).filter(function (r) {
          return cruzadas.get(r.href).folios.length === 1;
        });
        if (!propias.length) continue;
        grupos.push(el("section", {
          class: "biblio__grupo",
          style: "--rail-accent:var(--tag-" + b.layer + ")",
        },
          el("h2", { class: "biblio__cabeza" },
            el("a", { href: "#/tema/" + slug },
              el("span", { class: "biblio__folio" }, t.folio),
              el("span", {}, t.title))),
          el("div", { class: "recursos" }, propias.map(function (r) { return item(r); }))
        ));
      }

    const transversales = [...cruzadas.values()]
      .filter(function (x) { return x.folios.length > 1; })
      .map(function (x) {
        return item(x.recurso, x.recurso.sub + " · fichas " + x.folios.join(", "));
      });

    return C.layout("bibliografia",
      el("header", { class: "hero" },
        el("div", { class: "eyebrow" }, "Polyglot · notdefined"),
        el("h1", { class: "hero__title" }, "Bibliografía"),
        el("p", { class: "hero__lede lede" },
          "Las fuentes de cada ficha, en el orden de la guía. Si vienes de un tema, su grupo lleva su folio y su color."),
        el("hr", { class: "rule-double", style: "margin-top:22px" })
      ),
      grupos,
      transversales.length
        ? C.section("Transversales — sirven a varias fichas",
            el("div", { class: "recursos" }, transversales))
        : null
    );
  }

  G.pages = G.pages || {};
  G.pages.bibliografia = render;
})(window.GUIA = window.GUIA || {});
