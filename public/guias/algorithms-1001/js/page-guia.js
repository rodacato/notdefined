/* ============================================================================
   page-guia.js — Guía de decisión «¿Cuál algoritmo usar?». Pone candidatos
   lado a lado, resalta en ámbar el rasgo que decide, y prueba el ojo con un
   escenario. Contenido en data.js (DATA.guia). Registra GUIA.pages["guia"].
   ========================================================================== */
(function (G) {
  "use strict";
  var h = G.h;

  function modColor(mod) { return (G.DATA.MODS[mod] || {}).color || "var(--color-fg-default)"; }
  function modRoute(mod) { return "#/modulo-" + ("0" + mod).slice(-2); }

  // `texto` entre backticks → mono (.cx)
  function tval(text) {
    var parts = String(text).split("`");
    return parts.map(function (p, i) { return i % 2 ? h("span.cx", p) : document.createTextNode(p); });
  }

  function scenario(scn, algos) {
    var picked = null;
    var promptEl = h("div.prompt", h("span.q", "Necesito\u2026"), scn.prompt);
    var optsEl = h("div.opts");
    var ansEl = h("div.answer", { style: { display: "none" } });
    var correct = algos.find(function (a) { return a.id === scn.answer; });

    function paint() {
      G.clear(optsEl);
      algos.forEach(function (a) {
        var cls = "opt";
        if (picked !== null) {
          if (a.id === scn.answer) cls += " correct";
          else if (a.id === picked) cls += " wrong";
          else cls += " muted";
        }
        optsEl.appendChild(h("button." + cls.split(" ").join("."), {
          type: "button", disabled: picked !== null ? "" : null,
          onClick: function () { if (picked === null) { picked = a.id; paint(); } },
        }, a.name));
      });
      if (picked !== null) {
        ansEl.style.display = "";
        G.clear(ansEl);
        ansEl.appendChild(h("span.ck", picked === scn.answer ? "\u2713" : "\u2192"));
        ansEl.appendChild(h("span", h("b", correct.name + "."), " " + scn.why));
      }
    }
    paint();
    return h("div.scenario", promptEl, optsEl, ansEl);
  }

  function comparison(comp) {
    var active = comp.algos[0].id;
    var leftHost = h("div.comp-left");
    var rightHost = h("div.comp-right");

    function renderPanels() {
      var a = comp.algos.find(function (x) { return x.id === active; });
      var color = modColor(a.mod);
      // tabs
      var ptabs = h("div.ptabs");
      comp.algos.forEach(function (x) {
        ptabs.appendChild(h("button.pt" + (x.id === active ? ".is-on" : ""), { type: "button",
          onClick: function () { active = x.id; renderPanels(); } },
          h("span.pdot", { style: { background: modColor(x.mod) } }), x.name));
      });
      // traits
      var traits = h("div.traits");
      a.traits.forEach(function (t) {
        traits.appendChild(h("div.trait" + (t.hot ? ".hot" : ""),
          h("span.trait-k", t.k), h("span.trait-v", tval(t.v))));
      });
      G.mount(leftHost, h("div", ptabs, traits,
        h("div.traits-cap", "en \u00e1mbar: el rasgo que inclina la decisi\u00f3n")));
      // intent
      G.mount(rightHost, h("div",
        h("div.intent-card",
          h("span.il", h("span.d"), "la intenci\u00f3n que lo distingue"),
          h("div.iname", h("span.cdot", { style: { background: color } }), a.name),
          h("p.itext", a.intent),
          h("p.ipick", h("b", "El\u00edgelo"), " " + a.pick)),
        h("a.open-link", { href: modRoute(a.mod) }, "Ver " + a.name + " en su m\u00f3dulo \u2192")));
    }
    renderPanels();

    var titleEl = h("div.comp-title");
    comp.title.forEach(function (t, i) {
      if (i > 0) titleEl.appendChild(h("span.comp-vs", "vs"));
      titleEl.appendChild(h("span", t));
    });
    titleEl.appendChild(h("span.same-chip", "mismo objetivo \u00b7 " + comp.same));

    var quiz = h("div.quiz",
      h("div.quiz-h", h("span.qic", "?"), h("span.qt", "\u00bfCu\u00e1l aplica?")));
    comp.scenarios.forEach(function (scn) { quiz.appendChild(scenario(scn, comp.algos)); });

    return h("section.comp",
      h("div.comp-head", titleEl, h("p.comp-tag", comp.tagline)),
      h("div.comp-body", leftHost, rightHost),
      quiz);
  }

  function page(root) {
    var D = G.DATA.guia;
    document.title = "\u00bfCu\u00e1l algoritmo usar? \u00b7 Algoritmos 1001";
    var focus = "all";
    var listHost = h("div.comp-list");

    function renderList() {
      G.clear(listHost);
      var shown = focus === "all" ? D.comparisons : D.comparisons.filter(function (c) { return c.id === focus; });
      shown.forEach(function (c) { listHost.appendChild(comparison(c)); });
    }

    var navEl = h("div.compnav");
    function renderNav() {
      G.clear(navEl);
      navEl.appendChild(h("button.cn" + (focus === "all" ? ".is-on" : ""), { type: "button",
        onClick: function () { focus = "all"; renderNav(); renderList(); } }, "Todas"));
      D.comparisons.forEach(function (c) {
        navEl.appendChild(h("button.cn" + (focus === c.id ? ".is-on" : ""), { type: "button",
          onClick: function () { focus = c.id; renderNav(); renderList(); window.scrollTo(0, 0); } }, c.nav));
      });
    }

    var wrap = h("div.wrap.app-root",
      h("div.topbar",
        h("div.crumbs", h("a", { href: "#/" }, "Cat\u00e1logo"), h("span.sep", "/"), h("span.here", "\u00bfCu\u00e1l algoritmo usar?")),
        h("div.topmeta", "Almanaque t\u00e9cnico \u00b7 1001")),
      h("h1.title.display", "\u00bfCu\u00e1l algoritmo usar?"),
      h("p.lede", { html: D.lede }),
      h("hr.double-rule"),
      navEl,
      listHost,
      h("div.foot",
        h("span.legend-hot", h("span.hb"), " \u00e1mbar = el rasgo que inclina la decisi\u00f3n \u00b7 lo dem\u00e1s es terreno compartido"),
        h("a", { href: "#/" }, "\u2039 Volver al \u00edndice")),
      G.siteFooter());

    renderNav();
    renderList();
    G.mount(root, wrap);
  }

  G.pages = G.pages || {};
  G.pages["guia"] = page;

})(window.GUIA = window.GUIA || {});
