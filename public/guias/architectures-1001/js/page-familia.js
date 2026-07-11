/* ============================================================================
   1001 — Arquitecturas · js/page-familia.js — ficha de familia (#/familia/N)
   Cabecera de la familia + fichas de sus estilos (rica para las de ficha
   profunda, ligera para el resto).
   ========================================================================== */
(function (G) {
  "use strict";
  const { h, icon } = G;
  const pages = (G.pages = G.pages || {});

  function familia(root, numero) {
    const D = G.data;
    const fam = D.FAMILIES.find((f) => f.numero === Number(numero));
    G.clear(root);
    if (!fam) { root.appendChild(notFound()); return; }

    const num = String(fam.numero).padStart(2, "0");
    const items = D.ARCHS.filter((a) => a.family === fam.id);

    const body = h("div", { class: "post-body" });
    items.forEach((a) => body.appendChild(G.archFicha(a)));

    const backIcon = icon("arrow_back");
    root.appendChild(h("div", { class: "fshell", "data-screen-label": "Familia " + num },
      h("div", { class: "crumb" },
        h("a", { href: "#/catalogo" }, backIcon, " Catálogo"),
        h("span", { class: "sep" }, "/"),
        h("span", { class: "here" }, "Familia " + num + " · " + fam.name)),
      h("header", { class: "fhead" },
        h("div", { class: "fhead-main" },
          h("div", { class: "fhead-num" }, num),
          h("div", { class: "fhead-txt" },
            h("div", { class: "fhead-kicker" }, fam.q),
            h("h1", { class: "fhead-title" }, fam.name),
            h("p", { class: "fhead-lead" }, fam.sub))),
        h("div", { class: "rule-double" }),
        scaleLegend()),
      body,
      familyNav(fam.numero)));
  }

  function scaleLegend() {
    const P = G.data.PROM;
    const k = (key) => h("span", { class: "k" },
      h("span", { class: "sglyph " + key }, P[key].glyph), P[key].label);
    return h("div", { class: "scale-legend" },
      h("span", { class: "lab" }, "Prominencia"),
      k("esencial"), k("situacional"), k("nicho"));
  }

  // Navegación previa/siguiente entre familias, al pie.
  function familyNav(numero) {
    const D = G.data;
    const prev = D.FAMILIES.find((f) => f.numero === numero - 1);
    const next = D.FAMILIES.find((f) => f.numero === numero + 1);
    return h("nav", { class: "fam-nav" },
      prev ? h("a", { class: "fam-nav-link prev", href: "#/familia/" + prev.numero },
        icon("arrow_back"), h("span", null, h("span", { class: "fnl-k" }, "Familia anterior"),
          h("span", { class: "fnl-n" }, prev.name))) : h("span", null),
      next ? h("a", { class: "fam-nav-link next", href: "#/familia/" + next.numero },
        h("span", null, h("span", { class: "fnl-k" }, "Familia siguiente"),
          h("span", { class: "fnl-n" }, next.name)), icon("arrow_forward")) : h("span", null));
  }

  function notFound() {
    return h("div", { class: "fshell" },
      h("div", { class: "crumb" },
        h("a", { href: "#/catalogo" }, icon("arrow_back"), " Catálogo")),
      h("p", { class: "topo-caption", style: "margin-top:28px" },
        h("b", null, "Familia no encontrada. "), "Elige una del catálogo."));
  }

  pages.familia = familia;
})(window.GUIA = window.GUIA || {});
