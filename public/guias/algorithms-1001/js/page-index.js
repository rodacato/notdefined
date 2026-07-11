/* ============================================================================
   page-index.js — Portada / índice del catálogo. Se recupera POR EL PROBLEMA:
   el filtro «Tengo este problema…» ilumina los algoritmos que lo atacan.
   Registra GUIA.pages[""].
   ========================================================================== */
(function (G) {
  "use strict";
  var h = G.h, s = G.s;

  var FREQ_GLYPH = { star: "\u2605", half: "\u25D0", open: "\u25CB" };
  var FREQ_LABEL = { star: "n\u00facleo cotidiano", half: "uso medio", open: "cola rara" };

  function mark() {
    return s("svg.mark", { viewBox: "0 0 38 38", fill: "none", stroke: "currentColor",
      "stroke-width": "2", "stroke-linecap": "square", "aria-hidden": "true" },
      s("path", { d: "M3 11V3h8M35 11V3h-8M3 27v8h8M35 27v8h-8" }),
      s("circle", { cx: "19", cy: "19", r: "3.3", fill: "currentColor", stroke: "none" }));
  }

  function algoCard(a, mods, state) {
    var m = mods[a.mod];
    var cls = "card2 is-" + a.freq + (state ? " " + state : "");
    return h("a." + cls.split(" ").join("."), {
      style: { "--cat": m.color }, href: a.route,
      title: "Abrir " + m.name + " \u00b7 " + a.name,
    },
      h("span.card2-top",
        h("span.mono.card2-no", a.no),
        h("span.card2-name", a.name),
        h("span.card2-freq.freq-" + a.freq, { title: FREQ_LABEL[a.freq],
          "aria-label": "Frecuencia: " + FREQ_LABEL[a.freq] }, FREQ_GLYPH[a.freq])),
      h("span.card2-intent", a.intent),
      h("span.card2-hit", h("span.check.mono", "\u2713"), " ataca este problema"));
  }

  function moduleSection(modKey, D, active) {
    var m = D.MODS[modKey];
    var list = D.ALGOS.filter(function (a) { return a.mod === Number(modKey); });
    var hitCount = active ? list.filter(function (a) { return active.hits.indexOf(a.id) >= 0; }).length : 0;

    var count = active && hitCount > 0
      ? [h("b", String(hitCount)), " / " + list.length]
      : [h("b", String(list.length)), " " + (list.length === 1 ? "tema" : "temas")];

    var cards = h("div.cards");
    list.forEach(function (a) {
      var st = active ? (active.hits.indexOf(a.id) >= 0 ? "lit" : "dim") : "";
      cards.appendChild(algoCard(a, D.MODS, st));
    });

    return h("section.mod", { style: { "--cat": m.color } },
      h("div.mod-head",
        h("div.mod-left",
          h("span.mono.mod-no", m.no),
          h("h2.display.mod-name", m.name),
          h("span.mono.mod-count", count)),
        h("a.mod-open", { href: "#/modulo-" + m.no }, "abrir m\u00f3dulo \u2192")),
      h("p.mod-desc", m.desc),
      cards);
  }

  function renderIndex(root) {
    var D = G.DATA;
    document.title = "Algoritmos 1001 \u00b7 \u00edndice del cat\u00e1logo";

    var state = { problemId: null };
    var wrap = h("div.wrap.app-root");

    // barra superior discreta
    wrap.appendChild(G.siteHome());

    // masthead
    wrap.appendChild(
      h("header",
        h("div.masthead",
          h("div.folio", mark(),
            h("div.folio-meta",
              h("div.folio-no", "1001"),
              h("div.folio-sub", "Almanaque t\u00e9cnico"))),
          h("div.edition",
            h("div.ed-eyebrow", "Cat\u00e1logo \u00b7 \u00edndice"),
            h("div.ed-eyebrow", { style: { marginTop: "4px", color: "var(--ink-soft)" } },
              D.ALGOS.length + " temas \u00b7 " + D.MODULES.length + " m\u00f3dulos"))),
        h("h1.title.display", D.index.title),
        h("p.lede", { html: D.index.lede }),
        h("div.running-head",
          h("span.eyebrow", "Lidera con el problema \u00b7 revela el algoritmo despu\u00e9s"),
          h("span.eyebrow", "Frecuencia \u2605 \u25D0 \u25CB")),
        h("hr.double-rule")));

    // filtro
    var statusEl = h("div.status", { role: "status", "aria-live": "polite" });
    var chipsEl = h("div.chips");
    var catalogEl = h("div.catalog");

    function repaint() {
      var active = state.problemId ? D.PROBLEMS.find(function (p) { return p.id === state.problemId; }) : null;
      // chips
      G.clear(chipsEl);
      D.PROBLEMS.forEach(function (pr) {
        chipsEl.appendChild(h("button.fchip", {
          type: "button", "aria-pressed": state.problemId === pr.id ? "true" : "false",
          onClick: function () { state.problemId = state.problemId === pr.id ? null : pr.id; repaint(); },
        }, h("span.dot", { "aria-hidden": "true" }), h("span", pr.label)));
      });
      // status
      G.clear(statusEl);
      if (active) {
        var n = active.hits.length;
        statusEl.appendChild(h("span.count-pill", n + " " + (n === 1 ? "algoritmo" : "algoritmos")));
        statusEl.appendChild(h("span", ["atacan ", h("b", "\u00ab" + active.label + "\u00bb"), ". Los dem\u00e1s se aten\u00faan."]));
        statusEl.appendChild(h("button.reset", { type: "button",
          onClick: function () { state.problemId = null; repaint(); } }, "limpiar filtro"));
      } else {
        statusEl.appendChild(h("span", { style: { color: "var(--ink-faint)" } },
          "Sin filtro: el cat\u00e1logo completo, ordenado por m\u00f3dulo."));
      }
      // catálogo
      catalogEl.className = "catalog" + (active ? " filtering" : "");
      G.clear(catalogEl);
      Object.keys(D.MODS).forEach(function (k) { catalogEl.appendChild(moduleSection(k, D, active)); });
    }

    wrap.appendChild(
      h("div.filter",
        h("div.filter-head",
          h("span.filter-q.display", "Tengo este problema\u2026"),
          h("span.filter-hint", "elige uno y se iluminan los algoritmos que lo atacan")),
        chipsEl, statusEl));

    // leyenda
    var legend = h("div.legend");
    var g1 = h("div.legend-group", h("span.legend-label", "Frecuencia"));
    [["star", "n\u00facleo cotidiano"], ["half", "uso medio"], ["open", "cola rara"]].forEach(function (f) {
      g1.appendChild(h("span.freq-item",
        h("span.freq-glyph.freq-" + f[0], FREQ_GLYPH[f[0]]), " " + f[1]));
    });
    var g2 = h("div.legend-group", h("span.legend-label", "M\u00f3dulos"));
    Object.keys(D.MODS).forEach(function (k) {
      g2.appendChild(h("span.cat-item",
        h("span.cat-swatch", { style: { background: D.MODS[k].color } }), " " + D.MODS[k].name));
    });
    legend.appendChild(g1); legend.appendChild(g2);
    wrap.appendChild(legend);

    wrap.appendChild(catalogEl);

    // guía de decisión
    wrap.appendChild(
      h("a.disambig", { href: "#/guia" },
        h("span.dz-l",
          h("span.dz-eyebrow", "\u00bfSe te confunden entre s\u00ed?"),
          h("span.dz-title.display", "\u00bfCu\u00e1l algoritmo usar?"),
          h("span.dz-sub", "Lineal vs binaria \u00b7 quicksort vs merge \u00b7 BFS vs DFS \u00b7 Dijkstra vs A* \u00b7 hash vs \u00e1rbol \u00b7 greedy vs DP\u2026 mismo objetivo, distinta herramienta.")),
        h("span.dz-arrow.mono", "\u2192")));

    // colofón
    wrap.appendChild(
      h("div.colophon-wrap", h("p.colophon", D.index.colophon)));

    wrap.appendChild(G.siteFooter());

    repaint();
    G.mount(root, wrap);
  }

  G.pages = G.pages || {};
  G.pages[""] = renderIndex;

})(window.GUIA = window.GUIA || {});
