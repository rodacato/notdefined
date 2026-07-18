/* ==========================================================================
   js/page-catalogo.js — Portada / índice del almanaque
   Masthead + filtro problema-primero + catálogo por familias.
   ========================================================================== */
(function (G) {
  "use strict";
  G.pages = G.pages || {};

  G.pages.catalogo = function () {
    var estado = { dolor: null };

    /* --- Masthead --- */
    var meta = G.el("div", { class: "masthead-meta" }, [
      stat(G.catalogo.length, "estilos"),
      stat(G.familias.length, "familias"),
      stat(G.ejes.length, "ejes de comparación"),
      stat(G.escenarios.length, "escenarios comparables")
    ]);

    var masthead = G.el("div", { class: "masthead" }, [
      G.el("div", { class: "hero-top" }, [
        G.el("div", { class: "hero-brand" }, [
          G.icon("mark", "hero-mark"),
          G.el("span", { class: "eyebrow", text: "Almanaque técnico · 1001" })
        ]),
        G.el("div", { class: "hero-ed" }, [
          G.el("span", { text: "Tomo IV · Edición 2026" }),
          G.el("span", { text: G.catalogo.length + " protocolos · " + G.familias.length + " familias" })
        ])
      ]),
      G.el("h1", { class: "display title", text: "Estilos de API, catalogados" }),
      G.el("p", { class: "hero-lede", html: "Un catálogo para recuperar el estilo por el <em>problema que resuelves</em>, no por su nombre. Sin tutoriales: criterios, diferencias y trade-offs — con la conversación de cada protocolo animada." }),
      meta,
      G.el("hr", { class: "rule-paravion", style: { marginTop: "var(--space-8)" } })
    ]);

    /* --- Filtro problema-primero --- */
    var chipTodos = G.el("button", { class: "filter-chip active", text: "Todos", onclick: function () { setDolor(null); } });
    var chips = [chipTodos].concat(G.dolores.map(function (d) {
      return G.el("button", { class: "filter-chip", "data-dolor": d.id, text: d.label, onclick: function () { setDolor(d.id); } });
    }));
    var filterBar = G.el("div", { class: "filter-bar" }, chips);
    var filterStatus = G.el("div", { class: "filter-status", role: "status", "aria-live": "polite" });

    var filterWrap = G.el("div", { class: "mt-8" }, [
      G.el("div", { class: "section-title" }, [
        G.el("span", { class: "eyebrow", text: "Empieza por el dolor" })
      ]),
      filterBar,
      filterStatus
    ]);

    /* --- Catálogo por familias --- */
    var familyBlocks = G.familias.map(function (fam) {
      var estilos = G.estilosDeFamilia(fam.id);
      var grid = G.el("div", { class: "catalog-grid" }, estilos.map(function (e) { return G.buildCatCard(e); }));
      return G.el("section", { class: "family-block", "data-familia": fam.id }, [
        G.buildFamilyHead(fam, estilos.length),
        G.el("p", { class: "caption", style: { marginBottom: "var(--space-4)", maxWidth: "70ch" }, text: fam.nota }),
        grid
      ]);
    });

    var notHere = G.el("div", { class: "not-here" }, [
      G.el("span", { class: "nh-title", text: "Qué NO está en este tomo" }),
      G.el("p", { text: "Estos " + G.catalogo.length + " estilos no son todos los que existen. WebRTC (P2P y media en vivo — otra bestia, con su propia señalización), CoAP (el primo de MQTT para dispositivos aún más chicos), AMQP como protocolo (aquí el broker vive detrás de las APIs de eventos) y las GraphQL subscriptions (que por debajo son WebSockets o SSE) quedaron fuera a propósito: si tu problema es de esos, ya sabes por dónde empezar." })
    ]);

    var root = G.el("div", {}, [
      G.shell([
        masthead,
        filterWrap
      ].concat(familyBlocks).concat([notHere]))
    ]);

    function setDolor(id) {
      estado.dolor = (estado.dolor === id) ? null : id;
      // Chips
      chipTodos.classList.toggle("active", !estado.dolor);
      G.$$(".filter-chip[data-dolor]", filterBar).forEach(function (c) {
        c.classList.toggle("active", c.getAttribute("data-dolor") === estado.dolor);
      });
      // Cards
      G.$$(".cat-card", root).forEach(function (card) {
        var e = G.catalogoPorId[card.getAttribute("data-estilo")];
        var match = !estado.dolor || (e.dolores.indexOf(estado.dolor) !== -1);
        card.classList.toggle("dim", !match);
      });
      // Contador de matches + lleva el primero a la vista (puede vivir fuera del viewport).
      G.clear(filterStatus);
      if (estado.dolor) {
        var n = G.catalogo.filter(function (e) { return e.dolores.indexOf(estado.dolor) !== -1; }).length;
        filterStatus.appendChild(G.el("span", {
          text: n + (n === 1 ? " estilo responde" : " estilos responden") + " a este dolor — los demás se atenúan."
        }));
        var first = root.querySelector(".cat-card:not(.dim)");
        if (first) first.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "nearest"
        });
      }
    }

    function stat(n, label) {
      return G.el("div", { class: "stat" }, [
        G.el("span", { class: "n", text: String(n).padStart(2, "0") }),
        G.el("span", { class: "l", text: label })
      ]);
    }

    return root;
  };

})(window.GUIA = window.GUIA || {});
