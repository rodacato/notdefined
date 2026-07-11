/* ============================================================================
   1001 — Arquitecturas · js/components.js — piezas compartidas entre vistas
   ----------------------------------------------------------------------------
   Cromo (toggle de tema), diagramas de topología (specs → SVG), leyenda de
   roles, barras de trade-offs y la ficha de arquitectura (rica o ligera).
   ========================================================================== */
(function (G) {
  "use strict";
  const { h, icon } = G;
  const SVGNS = "http://www.w3.org/2000/svg";
  let arrowSeq = 0; // id único de marcador de flecha por diagrama

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* ---- Toggle de tema: system / light / dark ----------------------------- */
  function themeToggle() {
    const opts = [["light", "light_mode"], ["dark", "dark_mode"], ["system", "computer"]];
    const box = h("div", { class: "theme-toggle", role: "group", "aria-label": "Tema" });
    function paint() {
      const cur = G.getTheme();
      [...box.children].forEach((b) => {
        const on = b.dataset.theme === cur;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    opts.forEach(([v, ic]) => {
      const b = h("button", { type: "button", title: v, "data-theme": v,
        onclick: () => { G.setTheme(v); paint(); } }, icon(ic));
      box.appendChild(b);
    });
    document.addEventListener("guia:theme", paint);
    paint();
    return box;
  }

  /* ---- Topología: lista de primitivas → SVG ------------------------------ */
  function topology(specs) {
    const svg = svgEl("svg", { viewBox: "0 0 460 280", class: "tp-svg",
      role: "img", "aria-label": "Diagrama de topología" });
    const arrowId = "tp-arrow-" + (++arrowSeq);
    const defs = svgEl("defs", {});
    const marker = svgEl("marker", { id: arrowId, viewBox: "0 0 10 10", refX: "8.5",
      refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
    marker.appendChild(svgEl("path", { d: "M0,0 L10,5 L0,10 z", class: "tarrow" }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    (specs || []).forEach((s) => svg.appendChild(prim(s, arrowId)));
    return svg;
  }

  function prim(s, arrowId) {
    if (s.t === "node") {
      const g = svgEl("g", {});
      let cls = "tnode r-" + s.role;
      if (s.dashed) cls += " dashed";
      if (s.star) cls += " star";
      if (s.ghost) cls += " ghost";
      g.appendChild(svgEl("rect", { x: s.x, y: s.y, width: s.w, height: s.h, rx: 8, class: cls }));
      if (s.label) {
        const cx = s.x + s.w / 2;
        g.appendChild(text(cx, s.sub ? s.y + s.h / 2 - 6 : s.y + s.h / 2, s.label, "tlabel"));
        if (s.sub) g.appendChild(text(cx, s.y + s.h / 2 + 9, s.sub, "tsub"));
      }
      return g;
    }
    if (s.t === "edge") {
      const a = { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, class: "tedge" + (s.msg ? " msg" : "") };
      if (s.arrow) a["marker-end"] = "url(#" + arrowId + ")";
      return svgEl("line", a);
    }
    if (s.t === "path") {
      const a = { d: s.d, class: "tedge" + (s.msg ? " msg" : ""), fill: "none",
        "marker-end": "url(#" + arrowId + ")" };
      return svgEl("path", a);
    }
    if (s.t === "frame") {
      const g = svgEl("g", {});
      g.appendChild(svgEl("rect", { x: s.x, y: s.y, width: s.w, height: s.h, rx: 12,
        class: "tframe" + (s.variant ? " " + s.variant : "") }));
      if (s.label)
        g.appendChild(text(s.x + 13, s.y + 17, s.label,
          "tframe-label" + (s.variant ? " " + s.variant : ""), "start"));
      return g;
    }
    if (s.t === "label")
      return text(s.x, s.y, s.text, s.cls || "tedge-label");
    return svgEl("g", {});
  }

  function text(x, y, str, cls, anchor) {
    const t = svgEl("text", { x: x, y: y, class: cls,
      "text-anchor": anchor || "middle", "dominant-baseline": "central" });
    t.textContent = str;
    return t;
  }

  /* ---- Leyenda de roles del diagrama ------------------------------------- */
  function topoLegend() {
    const roles = [["actor", "Actor / cliente"], ["gateway", "Borde / gateway"],
      ["service", "Servicio"], ["store", "Almacén"], ["msg", "Mensajería"]];
    return h("div", { class: "tp-legend" },
      roles.map(([r, name]) =>
        h("span", { class: "tp-leg-item" }, h("span", { class: "tp-sw r-" + r }), name)),
      h("span", { class: "tp-leg-item" }, h("span", { class: "tp-sw dashed" }), "Límite de contexto"));
  }

  /* ---- Barras de trade-offs sobre los 7 ejes fijos ----------------------- */
  function ratingBars(ratings) {
    const MAX = 4;
    return h("div", { class: "axis" },
      G.data.AXES.map((eje) => {
        const v = ratings[eje.key] || 0;
        const cells = [];
        for (let i = 0; i < MAX; i++)
          cells.push(h("span", { class: "seg-cell" + (i < v ? " on" : "") }));
        return h("div", { class: "axis-row" + (eje.cost ? " cost" : "") },
          h("span", { class: "axis-label" }, eje.label,
            eje.cost ? h("span", { class: "cost" }, "costo") : null),
          h("span", { class: "axis-bar" }, cells));
      }));
  }

  /* ---- Ficha de arquitectura: rica (con ficha profunda) o ligera --------- */
  function archFicha(arch) {
    const V = G.data.VIEWS, PROM = G.data.PROM;
    const deep = G.fichas[arch.id];

    if (deep) {
      const prom = deep.prominencia;
      const grid = h("div", { class: "det-grid" });
      if (deep.diagrama)
        grid.appendChild(h("div", { class: "card" },
          h("div", { class: "card-head" }, icon("account_tree"),
            h("span", { class: "eyebrow" }, "Topología")),
          h("div", { class: "card-body" },
            h("div", { class: "topo-stage" }, topology(deep.diagrama)),
            topoLegend())));
      grid.appendChild(h("div", { class: "card" },
        h("div", { class: "card-head" }, icon("tune"),
          h("span", { class: "eyebrow" }, "Trade-offs")),
        h("div", { class: "card-body" },
          ratingBars(deep.ratings),
          h("div", { class: "ganapaga" },
            h("div", { class: "gp gana" }, h("span", { class: "k" }, "Gana"),
              h("span", { class: "txt" }, deep.gana)),
            h("div", { class: "gp paga" }, h("span", { class: "k" }, "Paga"),
              h("span", { class: "txt" }, deep.paga))))));

      return h("article", { class: "fdetail", id: "ficha-" + arch.id, "data-screen-label": "Ficha " + deep.nombre },
        h("div", { class: "det-head" },
          h("div", { class: "det-htext" },
            h("div", { class: "det-name" },
              h("span", { class: "det-n" }, deep.n + " · "), deep.nombre),
            h("p", { class: "det-ques" }, deep.queEs),
            h("span", { class: "det-pview" }, h("span", { class: "dotv" }),
              "vista primaria · " + (V[deep.vistaPrimaria] || deep.vistaPrimaria))),
          prom ? h("span", { class: "det-scale" },
            h("span", { class: "sglyph " + prom }, PROM[prom].glyph), PROM[prom].label) : null),
        h("div", { class: "fuerza" },
          h("div", { class: "fi" }, icon("bolt")),
          h("div", null, h("div", { class: "eyebrow" }, "La fuerza que la origina"),
            h("div", { class: "ftext" }, deep.fuerza))),
        grid,
        h("div", { class: "det-foot" },
          h("div", { class: "cuando-no" },
            h("div", { class: "eyebrow" }, icon("block"), "Cuándo NO"),
            h("p", { class: "cn-text" }, deep.cuandoNo)),
          h("div", { class: "parientes" },
            h("div", { class: "eyebrow" }, icon("hub"), "Parientes"),
            h("p", { class: "pa-text" }, deep.parientes))));
    }

    // Ficha ligera: semilla de catálogo.
    const fit = arch.fit;
    const team = Array.isArray(fit.team) ? fit.team.join(" / ") : fit.team;
    return h("article", { class: "fdetail", id: "ficha-" + arch.id, "data-screen-label": "Ficha " + arch.name },
      h("div", { class: "det-head" },
        h("div", { class: "det-htext" },
          h("div", { class: "det-name" },
            h("span", { class: "det-n" }, arch.n + " · "), arch.name),
          h("span", { class: "det-pview" }, h("span", { class: "dotv" }),
            "vista primaria · " + (V[arch.primary] || arch.primary)))),
      h("div", { class: "fuerza" },
        h("div", { class: "fi" }, icon("bolt")),
        h("div", null, h("div", { class: "eyebrow" }, "La fuerza que la origina"),
          h("div", { class: "ftext" }, arch.force))),
      h("div", { class: "det-foot" },
        h("div", { class: "cuando-no" },
          h("div", { class: "eyebrow" }, icon("block"), "Evita cuando"),
          h("p", { class: "cn-text" }, arch.avoid)),
        h("div", { class: "parientes" },
          h("div", { class: "eyebrow" }, icon("checklist"), "Encaja si"),
          h("p", { class: "pa-text" },
            "Equipo " + team + " · escalar partes: " + (fit.scaleParts ? "sí" : "no") +
            " · dominio " + fit.domain + " · consistencia " + fit.consistency + "."))),
      h("p", { class: "topo-caption", style: "margin-top:14px;" },
        h("b", null, "Sin ficha profunda todavía. "),
        "Esta arquitectura trae solo la semilla de catálogo — su fuerza, cuándo evitarla y su encaje."));
  }

  G.themeToggle = themeToggle;
  G.topology = topology;
  G.topoLegend = topoLegend;
  G.ratingBars = ratingBars;
  G.archFicha = archFicha;
})(window.GUIA = window.GUIA || {});
