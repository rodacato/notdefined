/* ==========================================================================
   js/page-ficha.js — Ficha de un estilo
   Rail de navegación entre estilos + contenido: la conversación (simulador),
   el contrato, qué gana / qué paga, cuándo NO, 7 ejes, veredicto y parientes.
   El folio y los metadatos vienen del catálogo (fuente de verdad).
   ========================================================================== */
(function (G) {
  "use strict";
  G.pages = G.pages || {};

  G.pages.ficha = function (id) {
    var estilo = G.catalogoPorId[id];
    var ficha = G.fichas[id];
    if (!estilo || !ficha) return G.pages.notFound();

    var fam = G.familiaDe(estilo.familia);
    var famVar = "var(" + fam.famVar + ")";
    var freq = G.FRECUENCIA[estilo.escala.frecuencia];

    /* ---- Rail: saltar entre estilos ---- */
    var rail = G.el("aside", { class: "ficha-rail" }, G.catalogo.map(function (e) {
      var ev = "var(" + G.familiaDe(e.familia).famVar + ")";
      return G.el("a", {
        class: "rail-item" + (e.id === id ? " active" : ""),
        href: "#/ficha/" + e.id, style: { "--fam": ev }
      }, [
        G.el("span", { class: "rf", text: e.folio }),
        G.el("span", { text: e.nombre })
      ]);
    }));

    /* ---- Cabecera ---- */
    var header = G.el("header", { class: "ficha-header", style: { "--fam": famVar } }, [
      G.el("div", { class: "top" }, [
        G.el("span", { class: "folio", text: estilo.folio }),
        G.el("span", { class: "chip strong", text: fam.nombre }),
        G.el("span", { class: "chip", text: estilo.tipo }),
        estilo.estrella ? G.el("span", { class: "pill-star", text: "★ estrella" }) : null,
        G.el("span", { class: "tag", text: freq.g + " " + freq.l }),
        G.el("span", { class: "tag", text: "complejidad " + G.complejidadGlyph(estilo.escala.complejidad) })
      ]),
      G.el("h1", { text: estilo.nombre }),
      G.el("p", { class: "queEs", text: estilo.oneliner })
    ]);

    /* ---- Simulador (el corazón) ---- */
    var simSection = section("La conversación", [
      G.buildSim(ficha.sim, famVar),
      G.el("p", { class: "caption mt-4", text: "Usa Reproducir, o avanza paso a paso con los botones o las flechas ← →. Cada paso cambia una sola cosa." })
    ]);

    /* ---- Contrato + transporte ---- */
    var specSection = section("El contrato", [
      G.el("div", { class: "spec-grid" }, [
        G.el("div", { class: "spec-cell surface" }, [
          G.el("div", { class: "k", text: "Quién lo define · qué tan estricto" }),
          G.el("div", { class: "v" }, [
            G.el("strong", { text: ficha.contratoTag }),
            G.el("p", { style: { marginTop: "6px" }, text: ficha.contrato })
          ])
        ]),
        G.el("div", { class: "spec-cell surface" }, [
          G.el("div", { class: "k", text: "Transporte · formato" }),
          G.el("div", { class: "v" }, [G.el("strong", { text: ficha.transporte })])
        ])
      ])
    ]);

    /* ---- Gana / paga ---- */
    var gpSection = section("Qué gana · qué paga", [
      G.el("div", { class: "gp-grid" }, [
        callout("win", "Qué gana", "check", ficha.gana),
        callout("pay", "Qué paga", "cross", ficha.paga)
      ])
    ]);

    /* ---- Cuándo NO ---- */
    var noSection = section("Cuándo NO usarlo", [
      G.el("div", { class: "cuando-no", style: { "--fam": famVar } }, [
        G.el("div", { class: "ctitle" }, [G.el("span", { text: "El cuándo-no de verdad" })]),
        G.el("ul", {}, ficha.cuandoNo.map(function (t) { return G.el("li", { text: t }); }))
      ])
    ]);

    /* ---- Ratings ---- */
    var ratingsSection = section("Siete ejes", [
      G.buildRatings(ficha.ratings, famVar),
      G.el("p", { class: "caption mt-6", text: "Escala 0–7. En «overhead de payload», menos es mejor (barra ámbar)." })
    ]);

    /* ---- Veredicto ---- */
    var verdictSection = G.el("section", { class: "ficha-section" }, [
      G.el("span", { class: "eyebrow", text: "Veredicto" }),
      G.el("div", { class: "verdict", style: { "--fam": famVar, marginTop: "var(--space-3)" } }, [
        G.el("p", { text: ficha.verdict })
      ])
    ]);

    /* ---- Parientes ---- */
    var parSection = section("Parientes y confusiones", [
      G.el("div", { class: "parientes" }, ficha.parientes.map(function (p) {
        return G.el("div", { class: "pariente-row" }, [
          G.el("span", { class: "pn", text: p.nombre }),
          G.el("span", { class: "pd", text: p.desc }),
          p.link ? G.el("a", { href: p.link, html: "ver " + G.iconStr("arrowRight") }) : null
        ]);
      }))
    ]);

    /* ---- Pie: prev/next + comparador ---- */
    var i = G.catalogo.indexOf(estilo);
    var prev = G.catalogo[(i - 1 + G.catalogo.length) % G.catalogo.length];
    var next = G.catalogo[(i + 1) % G.catalogo.length];
    var footer = G.el("div", { class: "row wrap", style: { justifyContent: "space-between", marginTop: "var(--space-12)", paddingTop: "var(--space-6)", borderTop: "1px solid var(--color-border-default)", gap: "var(--space-3)" } }, [
      G.el("a", { class: "sim-btn", href: "#/ficha/" + prev.id, html: G.iconStr("back") + " " + prev.folio + " · " + prev.nombre }),
      G.el("a", { class: "sim-btn primary", href: "#/comparador", text: "Comparar en un escenario →" }),
      G.el("a", { class: "sim-btn", href: "#/ficha/" + next.id, html: next.folio + " · " + next.nombre + " " + G.iconStr("arrowRight") })
    ]);

    var main = G.el("div", { class: "ficha-main" }, [
      header, simSection, specSection, gpSection, noSection, ratingsSection, verdictSection, parSection, footer
    ]);

    return G.el("div", {}, [G.shell([G.el("div", { class: "ficha-wrap" }, [rail, main])])]);

    /* helpers locales */
    function section(eyebrow, children) {
      return G.el("section", { class: "ficha-section" }, [
        G.el("span", { class: "eyebrow", text: eyebrow })
      ].concat(children));
    }
    function callout(kind, title, ico, items) {
      return G.el("div", { class: "callout " + kind }, [
        G.el("div", { class: "ctitle" }, [G.el("span", { text: title })]),
        G.el("ul", {}, items.map(function (t) {
          return G.el("li", {}, [
            G.el("span", { class: "mk " + (kind === "win" ? "mk-check" : "mk-cross"), text: kind === "win" ? "✓" : "✗" }),
            G.el("span", { text: t })
          ]);
        }))
      ]);
    }
  };

  G.pages.notFound = function () {
    return G.shell([G.el("div", { style: { padding: "80px 0", textAlign: "center" } }, [
      G.el("h1", { text: "No encontrado" }),
      G.el("p", { class: "lead mt-4", text: "Ese estilo no está en el catálogo." }),
      G.el("a", { class: "sim-btn mt-6", href: "#/", text: "← Volver al catálogo", style: { display: "inline-flex", marginTop: "24px" } })
    ])]);
  };

})(window.GUIA = window.GUIA || {});
