/* page-tema.js — vista de la ficha de un tema: cabecera, en breve, fundamento,
   cómo funciona, la visualización, mito → realidad, recursos y navegación. */
(function (G) {
  "use strict";
  var el = G.el, icon = G.icon;

  G.vistaTema = function (app, slug) {
    var t = G.temaPorSlug(slug);
    if (!t) { G.vistaIndice(app); return; }
    var idx = G.data.temas.indexOf(t);
    var bloque = G.data.coleccion.bloques.filter(function (b) { return b.n === t.bloque; })[0];
    document.title = t.folio + " · " + (t.cardTitulo || t.titulo) + " · Python a fondo";
    G.clear(app);

    var ficha = el("section.ficha");
    ficha.style.setProperty("--fam", G.famVar(t.fam));

    // Breadcrumb
    var bc = el("div.breadcrumb");
    bc.appendChild(el("a", { href: "#/", text: "← Índice" }));
    bc.appendChild(el("span.sep", { text: "/" }));
    bc.appendChild(el("span.here", { text: "Bloque " + t.bloque + " · " + bloque.titulo, style: "color:" + G.famVar(t.fam) }));
    ficha.appendChild(bc);

    // Cabecera
    var head = el("div.ficha-head");
    head.appendChild(el("span.ficha-folio", { text: t.folio }));
    var htxt = el("div");
    if (t.estrella) htxt.appendChild(el("div.star-flag", { html: icon("estrella", 13) + "<span>" + (t.estrellaNota || "tema estrella") + "</span>" }));
    htxt.appendChild(el("h1", { html: t.titulo }));
    htxt.appendChild(el("p.ficha-lede", { html: t.lede }));
    head.appendChild(htxt);
    ficha.appendChild(head);
    ficha.appendChild(el("hr.rule-double"));

    // En breve (4 datos)
    if (t.enBreve && t.enBreve.length) {
      ficha.appendChild(G.seccion("visualiza", "En breve", t.fam));
      var ul = el("ul.enbreve");
      t.enBreve.forEach(function (d, i) {
        ul.appendChild(el("li", null, [
          el("span.n", { text: String(i + 1).padStart(2, "0") }),
          el("p", { html: d })
        ]));
      });
      ficha.appendChild(ul);
    }

    // Fundamento + fuerza
    ficha.appendChild(G.seccion("fundamento", "Fundamento", t.fam));
    ficha.appendChild(el("p.prose", { html: t.fundamento }));
    if (t.fuerza) {
      ficha.appendChild(el("div.fuerza", null, [
        el("span", { html: icon("fuerza", 20) }),
        el("div.body", { html: "<span class='tag'>La fuerza</span>" + t.fuerza })
      ]));
    }

    // Cómo funciona (puede traer varios párrafos)
    ficha.appendChild(G.seccion("como", "Cómo funciona", t.fam));
    (Array.isArray(t.comoFunciona) ? t.comoFunciona : [t.comoFunciona]).forEach(function (p) {
      ficha.appendChild(el("p.prose", { html: p }));
    });

    // Visualízalo (widget)
    if (t.widget) {
      ficha.appendChild(G.seccion("visualiza", t.widgetLabel || "Visualízalo — paso a paso", t.fam));
      var wh = el("div");
      ficha.appendChild(wh);
      G.montarWidget(wh, t.widget, t.fam);
    }

    // Mito → realidad
    ficha.appendChild(G.seccion("mito", "Del mito a la realidad", t.fam));
    ficha.appendChild(el("div.mito", null, [
      el("div.col.m", null, [el("div.lbl", { html: icon("mito", 13) + "<span>Mito</span>" }), el("p", { html: t.mito.mito })]),
      el("div.col.r", null, [el("div.lbl", { html: icon("check", 13) + "<span>Realidad</span>" }), el("p", { html: t.mito.realidad })])
    ]));

    // Recursos
    ficha.appendChild(G.seccion("recursos", "Recursos para profundizar", t.fam));
    var rl = el("ul.recursos");
    t.recursos.forEach(function (r) {
      var inner = "";
      if (r.star) inner += "<span class='star-r'>★</span> ";
      inner += r.url ? "<a href='" + r.url + "'" + (r.url.indexOf("http") === 0 ? " target='_blank' rel='noopener'" : "") + ">" + r.texto + "</a>" : r.texto;
      if (r.nota) inner += " <span class='nota'>· " + r.nota + "</span>";
      rl.appendChild(el("li", { html: inner }));
    });
    ficha.appendChild(rl);

    // Pie: prev / índice / next
    var prev = G.temaPorIndice(idx - 1), next = G.temaPorIndice(idx + 1);
    var foot = el("div.ficha-foot");
    foot.appendChild(prev
      ? el("a", { href: "#/tema/" + prev.slug, text: "← " + prev.folio + " · " + (prev.cardTitulo || prev.titulo) })
      : el("span.disabled", { text: "·" }));
    foot.appendChild(el("a", { href: "#/", text: "Índice" }));
    foot.appendChild(next
      ? el("a.next", { href: "#/tema/" + next.slug, text: next.folio + " · " + (next.cardTitulo || next.titulo) + " →" })
      : el("span.disabled", { text: "fin del catálogo" }));
    ficha.appendChild(foot);

    app.appendChild(ficha);
    window.scrollTo(0, 0);
  };

})(window.GUIA = window.GUIA || {});
