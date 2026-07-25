/* page-ficha.js — vista de detalle: riel del catálogo + cuerpo de la ficha. */
(function (G) {
  "use strict";
  var el = G.el;

  function riel(slugActual) {
    var nodo = el("nav", { class: "riel", "aria-label": "Catálogo" }, [
      el("a", { class: "riel-volver", href: "#/", text: "← índice · " + G.meta.titulo })
    ]);
    G.catalogo.forEach(function (b) {
      var esActual = b.fichas.indexOf(slugActual) !== -1;
      var grupo = el("div", { class: "riel-bloque" + (esActual ? " actual" : "") }, [
        el("p", { class: "eyebrow", text: "Bloque " + b.n + " · " + b.titulo })
      ]);
      b.fichas.forEach(function (slug) {
        var f = G.fichas[slug];
        if (!f) return;
        grupo.appendChild(el("a", {
          class: "riel-item", href: "#/" + slug,
          "aria-current": slug === slugActual ? "page" : null
        }, [
          el("span", { class: "n", text: G.folio[slug].numero }),
          el("span", { text: f.titulo })
        ]));
      });
      nodo.appendChild(grupo);
    });
    return nodo;
  }

  function seccion(titulo, hijos) {
    return el("section", { class: "seccion" }, [el("h2", { text: titulo })].concat(hijos));
  }

  function enBreve(datos) {
    return el("div", { class: "en-breve" }, datos.map(function (d) {
      return el("div", { class: "dato" }, [
        el("p", { class: "k", text: d.k }),
        el("p", { class: "v", html: d.v })
      ]);
    }));
  }

  function snippets(lista) {
    return lista.map(function (s) {
      return el("div", { class: "snippet" }, [
        el("p", { class: "nota", html: s.nota }),
        G.comp.sql(s.sql)
      ]);
    });
  }

  function recursos(lista) {
    return el("div", { class: "recursos" }, lista.map(function (r) {
      return el("a", { class: "recurso", href: r.url, target: "_blank", rel: "noreferrer noopener" }, [
        el("span", { class: "t", text: r.titulo }),
        el("span", { class: "n", text: r.nota }),
        el("span", { class: "u", text: r.url.replace(/^https?:\/\//, "") })
      ]);
    }));
  }

  function navFichas(slug) {
    var i = G.orden.indexOf(slug);
    var prev = i > 0 ? G.orden[i - 1] : null;
    var next = i < G.orden.length - 1 ? G.orden[i + 1] : null;
    return el("nav", { class: "nav-fichas" }, [
      prev ? el("a", { class: "prev", href: "#/" + prev }, [
        el("span", { class: "dir", text: "← " + G.folio[prev].numero }),
        el("span", { class: "t", text: G.fichas[prev].titulo })
      ]) : el("span"),
      next ? el("a", { class: "next", href: "#/" + next }, [
        el("span", { class: "dir", text: G.folio[next].numero + " →" }),
        el("span", { class: "t", text: G.fichas[next].titulo })
      ]) : el("span")
    ]);
  }

  G.paginas.ficha = function (mount, slug) {
    var f = G.fichas[slug];
    var folio = G.folio[slug];
    var cuerpo = el("article", { class: "ficha-cuerpo" }, [
      el("header", { class: "ficha-head" }, [
        el("div", { class: "fila-meta" }, [
          el("span", { class: "mono-faint", text: folio.numero + " · " + slug }),
          el("span", { class: "badge-nivel", text: "C1" }),
          el("span", { class: "diamantes" + (f.esJoya ? " joya" : ""), text: G.diamantes(f.dificultad) + (f.esJoya ? "  ★ la joya" : "") }),
          f.postgresEspecifico ? el("span", { class: "tag-pg", text: "PG-específico" }) : null
        ]),
        el("h1", { text: f.titulo }),
        el("p", { class: "quees", text: f.queEs })
      ]),
      seccion("En breve", enBreve(f.enBreve)),
      seccion("Fundamento", el("div", { class: "prosa", html: f.fundamento })),
      seccion("Cómo funciona", snippets(f.comoFunciona))
    ]);

    if (f.widget && G.widgets[f.widget]) {
      var caja = el("div");
      cuerpo.appendChild(seccion("Hazlo visible", caja));
      G.widgets[f.widget](caja);
    }
    if (f.widgetExtra && G.widgets[f.widgetExtra]) {
      var caja2 = el("div");
      cuerpo.appendChild(seccion("Y el segundo filo", caja2));
      G.widgets[f.widgetExtra](caja2);
    }

    cuerpo.appendChild(seccion("Cuándo NO usarlo", el("div", { class: "cuando-no prosa", html: f.cuandoNo })));
    cuerpo.appendChild(seccion("Mito a desmontar", el("div", { class: "mito" }, [
      el("p", { class: "creencia", html: "«" + f.mito.creencia + "»" }),
      el("p", { class: "veredicto", text: f.mito.veredicto || "falso" }),
      el("p", { class: "realidad prosa", html: f.mito.realidad })
    ])));
    cuerpo.appendChild(seccion("Recursos de primera", recursos(f.recursos)));
    cuerpo.appendChild(navFichas(slug));

    var wrap = el("div", { class: "wrap" }, el("div", { class: "ficha-layout" }, [riel(slug), cuerpo]));
    G.vaciar(mount).appendChild(wrap);
    document.title = f.titulo + " · " + G.meta.titulo;
  };
})(window.GUIA = window.GUIA || {});
