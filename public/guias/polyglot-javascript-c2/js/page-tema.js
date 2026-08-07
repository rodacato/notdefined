/* page-tema.js — ficha interior: qué es · en breve · fundamento · cómo
   funciona · snippet · widget (si lo pide el tema) · mito.
   Las fuentes no cierran la ficha: lo que sigue es el tema siguiente. */
(function (G) {
  "use strict";
  const el = G.el, C = G.comp;

  function head(t) {
    const eb = el("div", { class: "tema__eyebrow" });
    if (t.star) eb.appendChild(el("span", { class: "eyebrow tema__star" }, "El tema estrella"));
    eb.appendChild(C.tag(t.tag));
    eb.appendChild(C.difficulty(t.difficulty));
    return el("div", { class: "tema__head" },
      el("span", { class: "tema__folio" }, t.folio),
      el("div", {},
        eb,
        el("h1", { class: "tema__title" }, t.title),
        el("p", { class: "tema__lede" , html: t.lede })
      )
    );
  }

  function orden() {
    return G.data.blocks.flatMap(function (b) { return b.slugs; });
  }

  function paginacion(slug) {
    const todos = orden();
    const i = todos.indexOf(slug);
    const prev = i > 0 ? G.data.topics[todos[i - 1]] : null;
    const next = i < todos.length - 1 ? G.data.topics[todos[i + 1]] : null;
    return el("nav", { class: "endnav", "aria-label": "Temas contiguos" },
      prev
        ? el("a", { class: "endnav__link", href: "#/tema/" + prev.slug },
            el("span", { class: "caption" }, "← anterior"), el("span", {}, prev.title))
        : el("span", {}),
      next
        ? el("a", { class: "endnav__link endnav__link--next", href: "#/tema/" + next.slug },
            el("span", { class: "caption" }, "siguiente →"), el("span", {}, next.title))
        : el("a", { class: "endnav__link endnav__link--next", href: "#/bibliografia" },
            el("span", { class: "caption" }, "para seguir →"), el("span", {}, "Bibliografía"))
    );
  }

  function render(slug) {
    const t = G.data.topics[slug];
    if (!t) return C.layout(null, el("p", { style: "margin-top:40px" }, "Tema no encontrado."));

    const cuerpo = [];
    cuerpo.push(head(t));
    cuerpo.push(el("hr", { class: "rule-double", style: "margin-top:24px" }));
    cuerpo.push(C.briefLine(t.breve));
    cuerpo.push(C.section("Qué es y por qué existe",
      el("div", { class: "prose", html: t.quees + t.fundamento })));
    cuerpo.push(C.section("Cómo funciona", C.mecanismo(t.como)));

    if (t.snippet)
      cuerpo.push(C.section("El código — corre y se verifica",
        C.codeBlock(null, t.snippet.split("\n"))));

    if (t.callout)
      cuerpo.push(C.section("Compruébalo tú", C.consola(t.callout)));

    let teardown = null;
    if (t.widget) {
      const caja = G.player(t.widget);
      teardown = caja._teardown;
      const partes = [];
      if (t.predice) {
        caja.classList.add("widget--velado");
        partes.push(C.prediccion(t.predice, function () {
          caja.classList.remove("widget--velado");
        }));
      }
      partes.push(caja);
      cuerpo.push(C.section("Qué ves — vídeo que se toca", ...partes));
    }

    cuerpo.push(C.mito(t.mito));
    if (t.cuandoNo) cuerpo.push(C.cuandoNo(t.cuandoNo));
    cuerpo.push(paginacion(slug));

    const node = C.layout(slug, ...cuerpo);
    node._teardownPlayer = teardown;
    return node;
  }

  G.pages = G.pages || {};
  G.pages.tema = render;
})(window.GUIA = window.GUIA || {});
