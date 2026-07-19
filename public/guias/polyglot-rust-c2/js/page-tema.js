/* page-tema.js — vista de ficha interior.
   Estructura fija: crumbs · cabecera · qué es (lede) · en breve ·
   fundamento · cómo funciona · simulación · mito · recursos · nav. */
(function (G) {
  "use strict";
  var el = G.dom.el, icon = G.icon;
  G.pages = G.pages || {};

  function bloqueDe(slug) {
    var found = null;
    G.coleccion.bloques.forEach(function (b) {
      if (b.temas.indexOf(slug) >= 0) found = b;
    });
    return found;
  }

  G.pages.tema = function (app, slug) {
    var t = G.temas[slug];
    if (!t) { G.pages.catalog(app); return; }
    var b = bloqueDe(slug);
    var fam = b ? b.fam : "var(--color-primary)";
    G.dom.clear(app);
    document.title = t.title + " · Rust a fondo";

    var orden = G.ordenPlano();
    var idx = orden.indexOf(slug);
    var prevSlug = idx > 0 ? orden[idx - 1] : null;
    var nextSlug = idx < orden.length - 1 ? orden[idx + 1] : null;

    /* crumbs */
    app.appendChild(el("div", { class: "tema__crumbs" }, [
      el("a", { href: "#/", class: "topbar__back", html: icon("left") + "índice" }),
      el("span", { html: "Bloque " + b.n + " · <span style='color:" + fam + "'>" + G.dom.escapeHtml(b.label.split("—")[0].trim()) + "</span>" })
    ]));

    /* cabecera */
    var head = el("header", { class: "tema__head" }, [
      el("div", { class: "tema__headrow" }, [
        el("span", { class: "tema__folio", text: G.folioDe(slug) }),
        el("div", {}, [
          el("div", { class: "tema__kicker", style: "color:" + fam,
            html: (t.star ? "★ " : "") + G.dom.escapeHtml(t.kicker) }),
          el("h1", { class: "tema__title", text: t.title })
        ])
      ]),
      el("p", { class: "tema__lede", html: t.lede }),
      el("hr", { class: "rule-double", style: "margin-top:22px" })
    ]);
    app.appendChild(head);

    /* en breve — 4 datos */
    app.appendChild(G.section("En breve · 4 datos", [G.enBreve(t.enBreve)]));

    /* fundamento */
    var fund = [G.fuerza(t.fundamento.fuerza)];
    if (t.fundamento.prose) fund.push(G.prose(t.fundamento.prose));
    app.appendChild(G.section("Fundamento — desde cero", fund));

    /* cómo funciona */
    if (t.como) {
      var como = [G.codeGrid(t.como.blocks)];
      if (t.como.prose) como.push(G.prose(t.como.prose, true));
      app.appendChild(G.section("Cómo funciona — el mecanismo", como));
    }

    /* simulación */
    if (t.widget && G.widgets && G.widgets[t.widget]) {
      var sim = G.section("La simulación — pruébalo", [], t.sim ? t.sim.title : "Pruébalo");
      if (t.sim && t.sim.intro) sim.appendChild(G.prose(t.sim.intro, true));
      var host = el("div", {});
      sim.appendChild(host);
      app.appendChild(sim);
      try { G.widgets[t.widget](host, fam); }
      catch (e) { console.error("Widget", t.widget, e); host.appendChild(el("div", { class: "whint", text: "· simulación no disponible" })); }
    }

    /* mito */
    app.appendChild(G.section("Del mito a la realidad", [G.mito(t.mito)]));

    /* recursos */
    app.appendChild(G.section("Puente a lo profesional", [G.recursos(t.recursos)]));

    /* nav */
    var nav = el("div", { class: "tema__nav" });
    nav.appendChild(prevSlug
      ? el("a", { href: "#/tema/" + prevSlug, html: icon("left") + G.folioDe(prevSlug) + " · " + G.dom.escapeHtml(G.temas[prevSlug].title) })
      : el("a", { href: "#/", html: icon("left") + "índice" }));
    if (nextSlug)
      nav.appendChild(el("a", { href: "#/tema/" + nextSlug, html: G.folioDe(nextSlug) + " · " + G.dom.escapeHtml(G.temas[nextSlug].title) + icon("right") }));
    app.appendChild(nav);

    window.scrollTo(0, 0);
  };

})(window.GUIA = window.GUIA || {});
