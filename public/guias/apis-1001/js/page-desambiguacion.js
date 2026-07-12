/* ==========================================================================
   js/page-desambiguacion.js — Los que se confunden
   Dos columnas + veredicto por par. El primero trae la escalera de Richardson.
   ========================================================================== */
(function (G) {
  "use strict";
  G.pages = G.pages || {};

  G.pages.desambiguacion = function () {
    var head = G.el("div", {}, [
      G.el("span", { class: "eyebrow", text: "Desambiguación" }),
      G.el("h1", { style: { marginTop: "var(--space-2)" }, text: "Los que se confunden" }),
      G.el("p", { class: "lead", style: { maxWidth: "64ch", marginTop: "var(--space-3)" }, text: "Pares que la gente mezcla, separados en tres líneas. Sin academicismo: la diferencia que de verdad decide." })
    ]);

    var list = G.el("div", { class: "disamb-list" }, G.desambiguacion.map(function (d) {
      var cols = G.el("div", { class: "disamb-cols" }, d.cols.map(function (c) {
        return G.el("div", { class: "disamb-col" }, [
          G.el("div", { class: "dc-name", text: c.name }),
          G.el("p", { text: c.text })
        ]);
      }));

      var children = [
        G.el("div", { class: "dvs" }, [
          G.el("span", { class: "a", text: d.a }),
          G.el("span", { class: "vs", text: "vs" }),
          G.el("span", { class: "b", text: d.b })
        ]),
        cols
      ];

      if (d.richardson) {
        children.push(G.el("div", { style: { marginTop: "var(--space-5)" } }, [
          G.el("div", { class: "eyebrow", style: { marginBottom: "var(--space-3)" }, text: "Madurez de Richardson" }),
          G.el("div", { class: "richardson" }, d.richardson.map(function (r) {
            return G.el("div", { class: "rich-level" }, [
              G.el("span", { class: "rl", text: r.l }),
              G.el("span", { class: "rt", text: r.t })
            ]);
          }))
        ]));
      }

      children.push(G.el("p", { class: "disamb-verdict", html: "<strong>Veredicto — </strong>" + escapeHtml(d.verdict) }));

      return G.el("section", { class: "disamb-card surface" }, children);
    }));

    return G.el("div", {}, [G.shell([
      head,
      G.el("hr", { class: "rule-double", style: { margin: "var(--space-6) 0" } }),
      list
    ])]);

    function escapeHtml(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  };

})(window.GUIA = window.GUIA || {});
