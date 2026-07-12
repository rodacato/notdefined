/* ============================================================================
   js/page-desambiguacion.js — los conceptos que todo el mundo confunde.
   Soporta columnas de 2 o 3 (RBAC vs ABAC vs ReBAC).
   ========================================================================== */
(function (G) {
  "use strict";
  var el = G.el;
  G.pages = G.pages || {};

  G.pages.desambiguacion = function (root) {
    root.appendChild(G.topbar([{ label: "Índice", href: "#/" }, { label: "Desambiguación" }], "desambiguacion"));

    var shell = el("div", { class: "shell app-root" });
    root.appendChild(shell);

    shell.appendChild(el("div", { class: "section-head", style: { marginTop: "24px" } }, [
      el("div", {}, [
        el("div", { class: "eyebrow", text: "Los que se confunden" }),
        el("h2", { style: { marginTop: "8px" }, text: "Desambiguación" })
      ])
    ]));

    var lista = el("div", { class: "disambig-list" });
    shell.appendChild(lista);

    G.desambiguaciones.forEach(function (d) {
      var cols = el("div", { class: "dz-cols" });
      if (d.cols.length === 3) cols.style.gridTemplateColumns = "repeat(3, 1fr)";
      d.cols.forEach(function (c) {
        cols.appendChild(el("div", { class: "dz-col" }, [
          el("div", { class: "dc-name mono", text: c.nombre }),
          el("p", { class: "dc-def", text: c.def })
        ]));
      });

      lista.appendChild(el("article", { class: "disambig" }, [
        el("div", { class: "dz-head" }, [
          el("div", { class: "dz-title", html: tituloConVs(d.titulo) }),
          el("p", { class: "dz-sub", text: d.sub })
        ]),
        cols,
        el("div", { class: "dz-verdict" }, [
          el("div", { class: "dv-label", text: "El corte" }),
          el("p", { text: d.veredicto })
        ])
      ]));
    });

    shell.appendChild(G.colofon());
    G.scrollTop();
  };

  // Convierte "A · vs · B" en HTML con el separador estilizado.
  function tituloConVs(t) {
    return t.split(" · vs · ").map(function (parte, i) {
      return (i > 0 ? '<span class="vs">vs</span>' : "") + escapar(parte);
    }).join("");
  }
  function escapar(s) {
    return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
  }

})(window.GUIA = window.GUIA || {});
