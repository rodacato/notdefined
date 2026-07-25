/* ============================================================================
   js/page-ficha.js — vista de una ficha. Si existe contenido completo en
   G.fichas[slug] lo renderiza; si no, muestra un stub navegable.
   ============================================================================ */
(function (G) {
  "use strict";
  var el = G.el;

  G.pageFicha = function (slug) {
    var meta = G.temaPorSlug(slug);
    if (!meta) return null; // el router mandará al índice
    var ficha = G.fichas && G.fichas[slug];

    var root = el("div.wrap");
    var art = el("article.ficha");
    root.appendChild(art);

    art.appendChild(crumbs(meta));
    art.appendChild(head(meta));

    if (ficha) {
      renderFull(art, meta, ficha);
    } else {
      art.appendChild(stub(meta));
    }

    art.appendChild(prevNext(meta));
    return root;
  };

  function crumbs(meta) {
    return el("nav.ficha__crumbs", { "aria-label": "Migas" }, [
      el("a", { href: "#/", text: "Índice" }),
      el("span", { text: "·" }),
      el("span", { text: "Bloque " + meta.bloque + " · " + meta.modelo.nombre }),
      el("span", { text: "·" }),
      el("span", { text: "Ficha " + meta.folio })
    ]);
  }

  function head(meta) {
    var g = G.diffGlyph(meta.diff);
    var kicker = "Bloque " + meta.bloque + " · " + meta.modelo.nombre + (meta.jewel ? " · ★ la joya" : "");
    var main = el("div.ficha__headmain", null, [
      el("div.ficha__kicker", { text: kicker }),
      el("h1", { text: meta.titulo }),
      el("div.ficha__diff", { html: g.full + '<span class="off">' + g.off + "</span>" }),
      el("p.ficha__lede", { text: meta.queEs })
    ]);
    return el("div.ficha__head", null, [
      el("div.ficha__folio", { text: meta.folio }),
      main
    ]);
  }

  function renderFull(art, meta, f) {
    // Qué es
    art.appendChild(G.section("Qué es", null,
      f.queEs.map(function (p) { return el("p", { html: p, style: "max-width:70ch; font-size:16.5px; line-height:1.6; margin-top:12px;" }); })
    ));

    // En breve · 4 datos
    var facts = el("ul.facts");
    f.enBreve.forEach(function (txt, i) {
      facts.appendChild(el("li.fact", null, [
        el("span.fact__n", { text: String(i + 1).padStart(2, "0") }),
        el("span.fact__body", { html: txt })
      ]));
    });
    art.appendChild(G.section("En breve · verificable contra PG17", null, facts));

    // Widget — se despacha por G.widgets[kind]; la config vive en data/
    if (f.widget && G.widgets && G.widgets[f.widget.kind]) {
      art.appendChild(G.section(f.widget.seccion, null, G.widgets[f.widget.kind](f.widget)));
    }

    // Fundamento
    art.appendChild(G.section("Fundamento", "Por qué el motor lo hace así",
      el("div.prose", null, f.fundamento.map(blockNode))));

    // Cómo funciona
    art.appendChild(G.section("Cómo funciona", "La mecánica",
      el("div.mecanica", null, f.comoFunciona.map(function (b) {
        return b.code ? G.codeblock(b.code.caption, b.code.text, b.code.tag)
                      : el("div.prose", null, [blockNode(b)]);
      }))));

    // Cuándo duele
    var d = el("div.duele");
    d.appendChild(el("p.sym", { text: f.cuandoDuele.sym }));
    f.cuandoDuele.paras.forEach(function (p) { d.appendChild(el("p", { html: p })); });
    art.appendChild(G.section("Cuándo duele", "El síntoma real en producción", d));

    // Mito a desmontar
    var mito = el("div.mito", null, [
      el("div.mito__tag", { text: "Mito a desmontar" }),
      el("p.mito__claim", { text: f.mito.claim }),
      el("p.mito__truth", { html: f.mito.truth })
    ]);
    if (f.mito.more && f.mito.more.length) {
      var more = el("ul.mito__more");
      f.mito.more.forEach(function (m) { more.appendChild(el("li", { html: m.html })); });
      mito.appendChild(more);
    }
    art.appendChild(G.section("Mito", null, mito));

    // Recursos
    var recursos = el("ul.recursos");
    f.recursos.forEach(function (r) {
      recursos.appendChild(el("li.recurso", null, [
        el("span.recurso__kind", { text: r.kind }),
        el("span.recurso__body", null, [
          el("strong", { text: r.title }),
          el("span", { text: r.note })
        ])
      ]));
    });
    art.appendChild(G.section("Recursos · de primera", null, recursos));
  }

  // Nodo de bloque de prosa {p:"html"}
  function blockNode(b) {
    return el("p", { html: b.p });
  }

  function stub(meta) {
    return el("div.stub", null, [
      el("div.stub__tag", { text: "Ficha " + meta.folio + " · en preparación" }),
      el("h2", { text: meta.titulo }),
      el("p", { text: meta.queEs }),
      el("p", { style: "font-size:14px;", html:
        "Esta ficha a\u00fan no est\u00e1 escrita. Llega en la siguiente pasada \u2014 el orden es por dependencia, as\u00ed que se escriben bloque por bloque." })
    ]);
  }

  function prevNext(meta) {
    var list = G.temasPlano;
    var i = list.findIndex(function (t) { return t.slug === meta.slug; });
    var prev = list[i - 1], next = list[i + 1];
    var nav = el("nav.ficha-nav", { "aria-label": "Fichas contiguas" });

    nav.appendChild(prev
      ? el("a", { href: "#/" + prev.slug }, [
          el("span.dir", { text: "← Ficha " + prev.folio }),
          el("span.name", { text: prev.titulo })
        ])
      : el("a.empty", { "aria-hidden": "true", tabindex: "-1" }));

    nav.appendChild(next
      ? el("a.next", { href: "#/" + next.slug }, [
          el("span.dir", { text: "Ficha " + next.folio + " →" }),
          el("span.name", { text: next.titulo })
        ])
      : el("a.next.empty", { "aria-hidden": "true", tabindex: "-1" }));

    return nav;
  }

})(window.GUIA = window.GUIA || {});
