/* ============================================================================
   1001 — Arquitecturas · js/page-catalogo.js — vista índice (#/catalogo)
   Masthead · filtro por problema · catálogo por familia · dos ejes · convenciones.
   ========================================================================== */
(function (G) {
  "use strict";
  const { h, icon } = G;
  const pages = (G.pages = G.pages || {});

  function catalogo(root) {
    const D = G.data;
    let activeId = null;

    // ----- Masthead --------------------------------------------------------
    const masthead = h("header", { class: "masthead" },
      h("div", { class: "mast-top" },
        h("div", { class: "mark" }, G.glyph(),
          h("div", { class: "mast-eyebrow" }, "Almanaque técnico · 1001")),
        h("div", { class: "edition" },
          h("div", null, D.META.edicion),
          h("div", null, D.META.conteo))),
      h("h1", { class: "mast-title" }, D.META.titulo),
      h("p", { class: "mast-thesis" }, thesis(D.META.tesis)),
      h("div", { class: "rule-double" }),
      h("div", { class: "legend-bar" },
        h("div", { class: "grp" },
          h("span", { class: "lab" }, "Escala"),
          scaleKey("large", "gran escala"), scaleKey("mid", "media"), scaleKey("small", "pequeña")),
        h("div", { class: "grp" },
          h("span", { class: "lab" }, "Vista primaria"),
          h("span", null, "cada ficha abre por su vista más reveladora · Límites · Topología · Flujo · Trade-offs · Evolución"))));

    // ----- Barra de problema ----------------------------------------------
    const chipsWrap = h("div", { class: "chips" });
    const status = h("div", { class: "pb-status", role: "status", "aria-live": "polite" });
    D.PROBLEMS.forEach((pr) => {
      const chip = h("button", { class: "chip", type: "button", "aria-pressed": "false",
        onclick: () => toggle(pr.id) },
        h("span", { class: "cdot", "aria-hidden": "true" }),
        h("span", null, G.ticks(pr.label)));
      chip.dataset.pid = pr.id;
      chipsWrap.appendChild(chip);
    });
    const problembar = h("div", { class: "problembar" },
      h("div", { class: "pb-head" },
        h("span", { class: "pb-q" }, "Tengo este problema…"),
        h("span", { class: "pb-hint" }, "elige un dolor y se iluminan los estilos que lo atacan")),
      chipsWrap, status, h("div", { class: "pb-rule" }));

    // ----- Catálogo por familia -------------------------------------------
    const cardById = {};      // id → elemento .acard
    const countByFam = {};    // famId → elemento .fam-count
    const catalog = h("div", { class: "catalog" });
    D.FAMILIES.forEach((fam) => {
      const items = D.ARCHS.filter((a) => a.family === fam.id);
      const count = h("span", { class: "fam-count" }, items.length + " estilos");
      countByFam[fam.id] = count;
      const cards = h("div", { class: "cards" });
      items.forEach((a) => {
        const el = archCard(a);
        cardById[a.id] = el;
        cards.appendChild(el);
      });
      catalog.appendChild(h("section", { "aria-label": fam.name, "data-screen-label": "Familia " + fam.numero },
        h("div", { class: "fam-head" },
          h("span", { class: "fam-index" }, String(fam.numero).padStart(2, "0") + " /"),
          h("span", { class: "fam-name" }, fam.name),
          h("span", { class: "fam-q" }, fam.q),
          h("span", { class: "fam-right" },
            h("a", { class: "fam-link", href: "#/familia/" + fam.numero },
              "Ver familia ", icon("arrow_forward")),
            count)),
        cards));
    });

    // ----- Interacción del filtro -----------------------------------------
    function toggle(id) { setActive(activeId === id ? null : id); }
    function setActive(id) {
      activeId = id;
      const active = id ? D.PROBLEMS.find((p) => p.id === id) : null;
      const hits = active ? active.hits : null;
      catalog.classList.toggle("filtering", !!active);
      [...chipsWrap.children].forEach((c) =>
        c.setAttribute("aria-pressed", c.dataset.pid === id ? "true" : "false"));
      D.ARCHS.forEach((a) => {
        const on = hits ? hits.includes(a.id) : false;
        cardById[a.id].classList.toggle("match", on);
      });
      D.FAMILIES.forEach((fam) => {
        const items = D.ARCHS.filter((a) => a.family === fam.id);
        const el = countByFam[fam.id];
        G.clear(el);
        if (hits) {
          const m = items.filter((a) => hits.includes(a.id)).length;
          el.appendChild(h("b", null, String(m)));
          el.appendChild(document.createTextNode("/" + items.length));
        } else {
          el.textContent = items.length + " estilos";
        }
      });
      G.clear(status);
      if (active) {
        status.appendChild(h("span", { class: "count-pill" }, active.hits.length + " estilos"));
        status.appendChild(h("span", null, "atacan ",
          h("b", null, "«" + active.label + "»"), ". Los demás se atenúan."));
        status.appendChild(h("button", { class: "reset", type: "button",
          onclick: () => setActive(null) }, "limpiar"));
      } else {
        status.appendChild(h("span", null,
          "Sin filtro: el catálogo completo, " + D.ARCHS.length + " estilos ordenados por familia."));
      }
    }

    // ----- Dos ejes ortogonales -------------------------------------------
    const quad = quadPanel(D.QUADRANTS);

    // ----- Call-out a «¿Cuál usar?» ---------------------------------------
    const disambig = h("a", { class: "disambig", href: "#/cual-usar" },
      h("span", { class: "dz-l" },
        h("span", { class: "dz-eyebrow" }, "¿Dudas entre dos que sirven para lo mismo?"),
        h("span", { class: "dz-title" }, "¿Cuál arquitectura usar?"),
        h("span", { class: "dz-sub" },
          "Monolito vs microservicios · Capas vs Hexagonal vs Clean · CRUD vs CQRS · ACID vs Saga… mismo objetivo, distinta presión. Cada par, lado a lado, con el rasgo que inclina la decisión resaltado.")),
      h("span", { class: "dz-arrow" }, "→"));

    // ----- Convenciones ----------------------------------------------------
    const conventions = h("section", { class: "conventions" },
      h("div", { class: "conv-head" }, "Convenciones de la serie · sistema de color de roles"),
      h("div", { class: "roles" },
        D.ROLES.map((r) => h("div", { class: "role" + (r.key === "fail" ? "" : "") },
          h("span", { class: "swatch", style: "background: var(--role-" + r.key + ")" }),
          h("span", { class: "rname" }, r.name), h("span", { class: "rnote" }, r.note))),
        h("div", { class: "role dashed" },
          h("span", { class: "swatch" }),
          h("span", { class: "rname" }, "Límite de contexto"),
          h("span", { class: "rnote" }, "borde punteado"))));

    // ----- Montaje ---------------------------------------------------------
    G.clear(root);
    root.appendChild(h("div", { class: "shell" },
      masthead, problembar, catalog,
      h("div", { class: "section-lead" },
        h("span", { class: "sl-no" }, "✳"),
        h("span", { class: "sl-name" }, "Antes de elegir — no confundas estos dos ejes")),
      quad, disambig, conventions,
      h("div", { class: "foot-note" }, "1001 — Arquitecturas · empieza por el problema, no por el nombre")));
    setActive(null);
  }

  // ----- helpers de la vista -----
  function thesis(text) {
    // resalta las palabras PRESIÓN y PRECIO en negrita de acento
    const out = [];
    text.split(/(PRESIÓN|PRECIO)/).forEach((part) => {
      if (part === "PRESIÓN") out.push(h("b", null, "presión"));
      else if (part === "PRECIO") out.push(h("b", null, "precio"));
      else out.push(document.createTextNode(part));
    });
    return out;
  }

  function scaleKey(scale, label) {
    return h("span", { class: "scale-key" },
      h("span", { class: "scale-glyph " + scale }, G.data.SCALE[scale].glyph), label);
  }

  function archCard(a) {
    const oh = icon("north_east"); oh.classList.add("open-hint");
    const fam = G.data.FAMILIES.find((f) => f.id === a.family);
    const open = () => { location.hash = "#/familia/" + fam.numero + "/" + a.id; };
    return h("article", { class: "acard", tabindex: "0", role: "link",
      "aria-label": a.name + " · abrir su ficha en la familia " + fam.name,
      onclick: open,
      onkeydown: (e) => { if (e.key === "Enter") open(); } },
      oh,
      h("div", { class: "acard-top" },
        h("span", { class: "acard-n" }, a.n),
        h("span", { class: "acard-name" }, a.name,
          h("span", { class: "match-badge" }, icon("check"), "ataca este dolor")),
        h("span", { class: "acard-scale", title: G.data.SCALE[a.scale].label },
          h("span", { class: "scale-glyph " + a.scale }, G.data.SCALE[a.scale].glyph))),
      h("span", { class: "view-tag" }, h("span", { class: "dotv" }), G.data.VIEWS[a.primary]),
      h("div", { class: "acard-force" }, a.force),
      h("div", { class: "acard-avoid" }, h("span", { class: "k" }, "Evita"), h("span", null, a.avoid)));
  }

  function iconCls(name, extra) { const s = icon(name); s.classList.add(extra); return s; }

  function quadPanel(QUADRANTS) {
    const cls = ["c0", "c1", "c2", "c3"];
    const cells = h("div", { class: "q-cells" });
    QUADRANTS.forEach((q, i) => {
      const start = q.runtime === "mono" && q.repo === "mono";
      cells.appendChild(h("div", { class: "q-cell " + cls[i] + (start ? " start" : "") },
        h("div", { class: "q-coord" },
          (q.repo === "mono" ? "monorepo" : "polyrepo") + " · " + (q.runtime === "mono" ? "monolito" : "microservicios")),
        h("div", { class: "q-title" }, q.title),
        h("div", { class: "q-ex" }, q.example),
        h("div", { class: "q-note" }, q.note)));
    });
    return h("section", { class: "panel quad-panel", "aria-label": "Dos ejes ortogonales" },
      h("div", { class: "panel-kicker" }, "La confusión más común"),
      h("div", { class: "panel-title" }, "Dos ejes que la gente cruza"),
      h("div", { class: "panel-sub" },
        "«Estilo de runtime» (monolito ↔ microservicios) y «organización del código» (monorepo ↔ polyrepo) son ",
        h("b", null, "independientes"), ". No son la misma decisión."),
      h("div", { class: "quad-stage" },
        h("div", { class: "q-ytitle" }, "Estilo de runtime"),
        h("div", { class: "q-ends top" }, iconCls("arrow_upward", "ico"), " Microservicios ",
          h("span", { class: "muted" }, "muchas unidades desplegables")),
        h("div", { class: "q-yends" }, h("span", null, "micro"), h("span", null, "mono")),
        cells,
        h("div", { class: "q-ends bottom" }, iconCls("arrow_downward", "ico"), " Monolito ",
          h("span", { class: "muted" }, "una unidad desplegable")),
        h("div", { class: "q-xtitle" }, "◄ Monorepo · un repositorio — Polyrepo · muchos repos ►")),
      h("div", { class: "quad-foot" }, icon("info"),
        h("div", null, h("b", null, "Monorepo no implica monolito. "),
          "Cualquiera de los cuatro cuadrantes es válido: puedes tener microservicios en un monorepo, o un monolito repartido en varios repos.")));
  }

  pages.catalogo = catalogo;
})(window.GUIA = window.GUIA || {});
