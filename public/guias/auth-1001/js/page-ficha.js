/* ============================================================================
   js/page-ficha.js — detalle de un método: rail de navegación, paneles de la
   ficha (con el campo "cómo se revoca" destacado) y los simuladores embebidos.
   ========================================================================== */
(function (G) {
  "use strict";
  var el = G.el, icon = G.icon;
  G.pages = G.pages || {};

  G.pages.ficha = function (root, params) {
    var m = G.porId[params.id];
    if (!m) { G.pages.inicio(root); return; }
    var f = G.fichas[m.id] || {};
    var fam = G.familiaPorId[m.familia];

    root.appendChild(G.topbar([{ label: "Índice", href: "#/" }, { label: m.folio + " · " + m.titulo }], null));

    var shell = el("div", { class: "shell app-root" });
    root.appendChild(shell);

    var layout = el("div", { class: "ficha-layout" });
    shell.appendChild(layout);

    // --- Rail ---
    layout.appendChild(construirRail(m.id));

    // --- Main ---
    var main = el("div", { class: "ficha-main", style: { "--fam": fam.color } });
    layout.appendChild(main);

    // Header
    var tags = [
      el("span", { class: "tag fam", style: { background: fam.color }, text: fam.nombre }),
      el("span", { class: "tag" }, [G.frecuenciaGlyph(m.frecuencia) + " " + G.frecuenciaLabel(m.frecuencia)]),
      el("span", { class: "tag", text: m.tipo })
    ];
    main.appendChild(el("div", { class: "ficha-header" }, [
      el("div", { class: "fh-folio mono", text: "FICHA " + m.folio }),
      el("h1", { text: m.titulo }),
      el("div", { class: "fh-tags" }, tags)
    ]));
    main.appendChild(el("p", { class: "ficha-lead", text: f.que || m.desc }));

    // Paneles
    var grid = el("div", { class: "ficha-grid" });
    main.appendChild(grid);

    grid.appendChild(panel("Quién guarda el secreto — y dónde", f.secreto, "span2", fam.color));
    grid.appendChild(panel("Qué gana", f.gana, "accent-pos"));
    grid.appendChild(panel("Qué paga", f.paga, "accent-neg"));
    grid.appendChild(panel("Cuándo NO usarlo", f.cuandoNo, "accent-warn span2"));
    grid.appendChild(panel("Cómo se revoca", f.revoca, "accent-revoke span2", null, "El criterio olvidado"));

    // Nota de campo (caso anclado), si existe
    if (f.notaCampo) {
      main.appendChild(el("div", { class: "field-note" }, [
        el("div", { class: "fn-label", text: "Nota " + f.notaCampo.label }),
        el("p", { html: f.notaCampo.texto })
      ]));
    }

    // Ratings
    main.appendChild(el("div", { class: "ficha-grid", style: { marginTop: "16px" } }, [G.ratingsPanel(m)]));

    // Variantes (OAuth)
    if (f.variantes) {
      var vgrid = el("div", { class: "ficha-grid", style: { marginTop: "16px" } });
      var vpanel = el("div", { class: "panel span2", style: { "--fam": fam.color } }, [
        el("div", { class: "p-label" }, [el("span", { class: "dot", style: { background: fam.color } }), "Variantes — dentro de esta ficha"])
      ]);
      var kv = el("div", { class: "kv", style: { marginTop: "8px" } });
      f.variantes.forEach(function (v) {
        kv.appendChild(el("div", { class: "kv-row" }, [
          el("span", { class: "k", text: v.estrella ? "★ " + v.nombre : v.nombre }),
          el("span", { class: "v", html: v.nota })
        ]));
      });
      vpanel.appendChild(kv);
      vgrid.appendChild(vpanel);
      main.appendChild(vgrid);
    }

    // Parientes y confusiones
    main.appendChild(el("div", { class: "ficha-grid", style: { marginTop: "16px" } }, [
      panel("Parientes y confusiones", f.parientes, "span2", fam.color)
    ]));

    // Simuladores
    if (f.sims && f.sims.length) {
      main.appendChild(el("div", { class: "section-head", style: { marginTop: "40px", marginBottom: "16px" } }, [
        el("h2", { text: f.sims.length > 1 || (G.simulaciones[f.sims[0]] || {}).tipo === "logout" ? "Los bailes" : "El baile" }),
        el("span", { class: "count mono", text: "usa ← → · espacio" })
      ]));
      f.sims.forEach(function (simId) {
        main.appendChild(el("div", { style: { marginBottom: "24px" } }, [G.montarSim(simId)]));
      });
    }

    // Navegación prev/next
    main.appendChild(construirPaso(m));

    G.scrollTop();

    /* --- helpers locales --- */
    function panel(label, texto, extra, dotColor, badge) {
      var head = [el("span", { class: "p-label" }, [
        dotColor ? el("span", { class: "dot", style: { background: dotColor } }) : null,
        label,
        badge ? el("span", { style: { marginLeft: "auto", fontWeight: "700", color: "var(--primary)" }, text: badge }) : null
      ])];
      return el("div", { class: "panel " + (extra || "") }, head.concat([
        el("p", { class: "p-body", text: texto || "—" })
      ]));
    }
  };

  function construirRail(activoId) {
    var rail = el("nav", { class: "rail", "aria-label": "Fichas del almanaque" });
    G.familias.forEach(function (fam) {
      rail.appendChild(el("div", { class: "rail-fam-label", text: fam.nombre }));
      G.catalogo.filter(function (m) { return m.familia === fam.id; }).forEach(function (m) {
        var it = el("a", {
          class: "rail-item" + (m.id === activoId ? " active" : ""),
          href: "#/ficha/" + m.id,
          style: { "--fam": fam.color }
        }, [
          el("span", { class: "ri-folio", text: m.folio }),
          el("span", { text: m.titulo })
        ]);
        rail.appendChild(it);
      });
    });
    return rail;
  }

  function construirPaso(m) {
    var idx = G.catalogo.indexOf(m);
    var prev = G.catalogo[idx - 1], next = G.catalogo[idx + 1];
    var row = el("div", { style: { display: "flex", justifyContent: "space-between", gap: "16px", marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--rule)" } });
    row.appendChild(prev
      ? el("a", { class: "chip", href: "#/ficha/" + prev.id }, [icon("arrow-left"), prev.folio + " · " + prev.titulo])
      : el("span", {}));
    row.appendChild(next
      ? el("a", { class: "chip", href: "#/ficha/" + next.id }, [next.folio + " · " + next.titulo, icon("arrow-right")])
      : el("span", {}));
    return row;
  }

})(window.GUIA = window.GUIA || {});
