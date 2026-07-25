/* page-indice.js — portada: hero, camino de lectura y catálogo. */
(function (G) {
  "use strict";
  var el = G.el;

  function marcaSvg() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 32 32");
    svg.setAttribute("width", "26");
    svg.setAttribute("height", "26");
    svg.setAttribute("aria-hidden", "true");
    var g = document.createElementNS(ns, "g");
    g.setAttribute("stroke", "currentColor");
    g.setAttribute("stroke-width", "2");
    g.setAttribute("fill", "none");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M5 11V5h6M21 5h6v6M27 21v6h-6M11 27H5v-6");
    g.appendChild(p);
    var c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", "16"); c.setAttribute("cy", "16"); c.setAttribute("r", "2.6");
    c.setAttribute("fill", "currentColor");
    svg.appendChild(g); svg.appendChild(c);
    return svg;
  }

  function hero() {
    return el("header", { class: "hero" }, [
      el("div", { class: "marca-fila" }, [
        el("div", { class: "marca" }, [
          marcaSvg(),
          el("p", { class: "eyebrow", text: G.meta.coleccion })
        ]),
        el("div", { class: "marca-meta" }, [
          el("span", { text: G.meta.nivel }),
          el("span", { text: G.meta.volumen })
        ])
      ]),
      el("h1", { text: G.meta.titulo }),
      el("p", { class: "lede", text: G.meta.lede }),
      el("p", { class: "mono-faint ancla", text: G.meta.ancla })
    ]);
  }

  function camino() {
    return el("section", { class: "camino", "aria-label": "Camino de lectura" }, [
      el("p", { class: "eyebrow", text: "Camino de lectura" }),
      el("p", { class: "subtle", text: G.meta.camino }),
      el("nav", { class: "camino-pasos" }, G.meta.caminoPasos.map(function (paso, i) {
        var ficha = G.fichas[paso.slug];
        return el("a", { class: "paso-chip", href: "#/" + paso.slug }, [
          el("span", { text: String(i + 1) }),
          (ficha ? ficha.titulo : paso.slug) + " · " + paso.txt
        ]);
      }))
    ]);
  }

  function tarjeta(slug) {
    var f = G.fichas[slug];
    if (!f) return null;
    var folio = G.folio[slug];
    return el("a", { class: "ficha-card" + (f.esJoya ? " es-joya" : ""), href: "#/" + slug }, [
      el("div", { class: "fila-meta" }, [
        el("span", { class: "mono-faint", text: folio.numero + " · " + slug }),
        el("span", { class: "diamantes" + (f.esJoya ? " joya" : ""), text: G.diamantes(f.dificultad) + (f.esJoya ? "  ★" : "") })
      ]),
      el("h3", { text: f.titulo }),
      el("p", { class: "quees", text: f.queEs }),
      el("p", { class: "mito-mini", text: "Mito: " + f.mito.creencia }),
      el("div", { class: "fila-meta" }, [
        el("span", { class: "entrar", text: "entrar →" }),
        f.postgresEspecifico ? el("span", { class: "tag-pg", text: "PG-específico" }) : null
      ])
    ]);
  }

  function bloque(b) {
    return el("section", { class: "bloque", id: "bloque-" + b.n }, [
      el("div", { class: "bloque-head" }, [
        el("p", { class: "eyebrow", text: "Bloque " + b.n }),
        el("h2", { text: b.titulo }),
        el("div", { class: "modelo-mental" }, [
          el("p", { class: "titulo", text: b.modelo.titulo }),
          el("p", { text: b.modelo.texto })
        ])
      ]),
      el("div", { class: "fichas-grid" }, b.fichas.map(tarjeta))
    ]);
  }

  G.paginas.indice = function (mount) {
    var wrap = el("div", { class: "wrap" }, [
      hero(),
      el("div", { class: "rule-doble" }),
      camino()
    ]);
    G.catalogo.forEach(function (b) { wrap.appendChild(bloque(b)); });
    wrap.appendChild(el("footer", { class: "pie" }, [
      el("p", { class: "eyebrow", text: G.meta.coleccion + " · " + G.meta.nivel }),
      el("p", { class: "mono-faint", text: G.meta.ancla }),
      el("p", { class: "subtle", text: "Los idioms marcados PG-específico no son ANSI: DISTINCT ON, FILTER, crosstab, postgres_fdw, ON CONFLICT." })
    ]));
    G.vaciar(mount).appendChild(wrap);
    document.title = G.meta.titulo + " · Polyglot";
  };
})(window.GUIA = window.GUIA || {});
