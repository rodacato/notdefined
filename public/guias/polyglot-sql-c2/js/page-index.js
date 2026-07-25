/* ============================================================================
   js/page-index.js — vista índice (home): hero + catálogo por bloques.
   ============================================================================ */
(function (G) {
  "use strict";
  var el = G.el;

  G.pageIndex = function () {
    var cat = G.catalog;
    var root = el("div.wrap");

    // ---- Hero (normalizado de la casa) ----
    var hero = el("header.hero");
    hero.appendChild(el("div.hero__brandrow", null, [
      el("div.hero__brand", null, [
        G.markSVG(26),
        el("span.hero__eyebrow", { text: "Polyglot · notdefined" })
      ]),
      el("div.hero__meta", { html: "<b>SQL · NIVEL C2</b><br>14 temas · 4 bloques" })
    ]));
    hero.appendChild(el("h1", { text: "SQL a fondo" }));
    hero.appendChild(el("p.hero__lede", { html:
      "La pregunta no es cómo escribir SQL — es <em>qué hace la máquina</em> cuando corres el query. " +
      "El planner eligiendo ruta, MVCC versionando filas, el WAL salvando un crash. " +
      "Motor de referencia: <span class=\"ref\">PostgreSQL 17 (evaluado julio 2026)</span>." }));
    root.appendChild(hero);
    root.appendChild(el("hr.rule-double"));

    // ---- Catálogo por bloques ----
    var catalog = el("div.catalog");
    cat.bloques.forEach(function (b) {
      var bloque = el("section.bloque");
      bloque.appendChild(el("div.bloque__head", null, [
        el("div.bloque__eyebrow", { text: "Bloque " + b.n }),
        el("h2.bloque__title", { text: b.titulo }),
        el("p.bloque__modelo", { html:
          "Modelo mental: <b>" + b.modelo.nombre + "</b> — " + b.modelo.desc })
      ]));

      var list = el("div.temalist");
      b.temas.forEach(function (t) {
        list.appendChild(temaRow(t));
      });
      bloque.appendChild(list);
      catalog.appendChild(bloque);
    });
    root.appendChild(catalog);

    return root;
  };

  // Fila densa de tema: folio · dificultad ◆ · título · qué-es · ir
  function temaRow(t) {
    var hasFicha = !!(G.fichas && G.fichas[t.slug]);
    var g = G.diffGlyph(t.diff);

    var title = el("span.tema__title", null, [t.titulo]);
    if (t.jewel) {
      title.appendChild(el("span.tema__star", { text: "★", title: "La joya", "aria-label": "La joya" }));
    }

    var main = el("div.tema__main", null, [
      title,
      el("div.tema__desc", { text: t.queEs })
    ]);

    var go = hasFicha
      ? el("span.tema__go", { text: "entrar →" })
      : el("span.badge-soon", { text: "en preparación" });

    var attrs = {
      href: "#/" + t.slug,
      "data-slug": t.slug,
      "aria-label": "Ficha " + t.folio + ": " + t.titulo
    };
    var row = el("a.tema", attrs);
    if (!hasFicha) row.classList.add("is-soon");
    if (t.jewel) row.classList.add("is-jewel");

    G.append(row, [
      el("span.tema__folio", { text: t.folio }),
      el("span.tema__diff", { html: g.full + '<span class="off">' + g.off + "</span>" }),
      main,
      go
    ]);
    return row;
  }

})(window.GUIA = window.GUIA || {});
