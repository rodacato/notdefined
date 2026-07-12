/* ============================================================
   js/page-ficha.js — ficha de un sistema. Identidad y folio
   vienen del catálogo (fuente de verdad); la prosa de G.fichas.
   ============================================================ */
(function (G) {
  "use strict";
  var h = G.h;
  G.pages = G.pages || {};

  G.pages.ficha = function (params) {
    var s = G.getSistema(params.id);
    if (!s) return G.pages.catalogo();
    var f = G.fichas[s.id] || {};
    var color = G.colorFamilia(s.familia);
    var fam = G.getFamilia(s.familia);

    // ---- Columna principal ----
    var main = h("div", { class: "ficha__main", style: { "--fam": color } });

    main.appendChild(h("div", { class: "ficha__head" },
      h("div", { class: "ficha__folio" }, s.folio + " · " + (fam ? fam.nombre : "")),
      h("h2", { class: "ficha__name" }, s.nombre + (s.estrella ? "  ★" : "")),
      h("div", { class: "ficha__model" }, s.modelo),
      h("p", { class: "ficha__que" }, f.que || s.una)
    ));

    function bloque(titulo, texto) {
      return h("div", { class: "ficha__block" },
        h("h3", {}, titulo),
        h("p", { html: texto })
      );
    }
    if (f.semantica) main.appendChild(bloque("Semántica de entrega", f.semantica));
    if (f.orden) main.appendChild(bloque("Garantías de orden — la letra chica", f.orden));

    // Gana / paga
    if (f.gana || f.paga) {
      var pm = h("div", { class: "plusminus" });
      if (f.gana) pm.appendChild(h("div", { class: "pm gain" },
        h("h4", {}, "Qué gana"),
        h("ul", {}, f.gana.map(function (x) { return h("li", {}, x); }))));
      if (f.paga) pm.appendChild(h("div", { class: "pm pay" },
        h("h4", {}, "Qué paga"),
        h("ul", {}, f.paga.map(function (x) { return h("li", {}, x); }))));
      main.appendChild(pm);
    }

    // Cuándo NO + cicatriz
    if (f.cuandoNo) {
      main.appendChild(h("div", { class: "whennot" },
        h("h4", {}, "Cuándo NO usarlo"),
        h("p", { html: f.cuandoNo })));
    }
    if (f.scar) {
      main.appendChild(h("div", { class: "scar" },
        h("span", { class: "tag" }, f.scar.tag),
        h("p", { html: f.scar.text })));
    }

    // Parientes y confusiones
    if (f.parientes) {
      main.appendChild(h("div", { class: "ficha__block" },
        h("h3", {}, "Parientes y confusiones"),
        h("div", { class: "relatives" },
          f.parientes.map(function (p) {
            return h("span", { class: "chip", title: p.note }, p.label);
          }))
      ));
      // Notas de parientes en texto legible
      main.appendChild(h("div", { style: { marginTop: "10px" } },
        f.parientes.map(function (p) {
          return h("p", { style: { fontSize: "13.5px", color: "var(--color-fg-subtle)", margin: "4px 0" } },
            h("strong", { style: { color: "var(--color-fg-default)", fontFamily: "var(--font-mono)", fontSize: "12px" } }, p.label + " — "), p.note);
        })));
    }

    // Simulación embebida (si la ficha la referencia)
    if (f.sim && G.simulaciones[f.sim]) {
      main.appendChild(h("div", { class: "ficha__block" },
        h("h3", {}, "Míralo en vivo"),
        G.comp.sim(f.sim)
      ));
    }

    // ---- Aside de ratings ----
    var aside = G.comp.ratings(s);

    var ficha = h("div", { class: "ficha" }, main, aside);

    // ---- Navegación prev/next por folio ----
    var i = G.catalogo.indexOf(s);
    var prev = G.catalogo[i - 1], next = G.catalogo[i + 1];
    var navrow = h("div", { class: "fichanav", style: { display: "flex", justifyContent: "space-between", marginTop: "34px", paddingTop: "18px", borderTop: "1px solid var(--color-border-soft)", fontFamily: "var(--font-mono)", fontSize: "13px" } },
      prev ? h("a", { href: "#/ficha/" + prev.id }, "← " + prev.folio + " " + prev.nombre) : h("span", {}),
      next ? h("a", { href: "#/ficha/" + next.id }, next.folio + " " + next.nombre + " →") : h("span", {})
    );

    var view = h("div", { class: "view" },
      h("div", { class: "wrap" },
        h("a", { href: "#/catalogo", style: { fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-fg-subtle)" } }, "← Catálogo"),
        h("div", { style: { height: "16px" } }),
        ficha,
        navrow
      )
    );

    return [G.comp.sectionNav("catalogo"), view];
  };

})(window.GUIA = window.GUIA || {});
