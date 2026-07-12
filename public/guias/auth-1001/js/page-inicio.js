/* ============================================================================
   js/page-inicio.js — portada, datos de referencia, filtro problema-primero
   y catálogo por familias.
   ========================================================================== */
(function (G) {
  "use strict";
  var el = G.el;
  G.pages = G.pages || {};

  var FACTS = [
    { num: "~50%", texto: "del top-100 de sitios ya ofrece passkeys. Resistentes a phishing por diseño: la llave está ligada al origen." },
    { num: "PKCE", texto: "obligatorio en OAuth 2.1; el implicit flow, muerto. Es el piso de los protocolos nuevos — hasta el MCP lo exige." },
    { num: "15–30 min", texto: "la vida recomendada del access token, con un refresh token server-side revocable detrás." },
    { num: "millones", texto: "de usuarios activos aguantan las sesiones server-side con caching. El «stateless» casi nunca es el cuello real." }
  ];

  G.pages.inicio = function (root) {
    root.appendChild(G.topbar(null, "inicio"));

    var shell = el("div", { class: "shell app-root" });
    root.appendChild(shell);

    // --- Hero normalizado (idéntico en toda la serie) ---
    shell.appendChild(el("header", { class: "masthead" }, [
      el("div", { class: "mh-brand" }, [
        el("span", { class: "mark", html: G.markSVG() }),
        el("span", { class: "eyebrow", text: "Almanaque técnico · 1001" }),
        el("div", { class: "mh-brand-right" }, [
          el("span", { class: "tome", text: "Tomo V · Edición 2026" }),
          el("span", { text: "14 métodos · 4 familias" })
        ])
      ]),
      el("h1", { class: "mh-title", text: "Autenticación y autorización" }),
      el("p", { class: "mh-lead", html:
        "Control de fronteras para tu backend: un catálogo de métodos para recuperar " +
        "<em>por el problema que resuelves</em>, no por su nombre. Sin tutoriales, sin código — " +
        "credenciales, sellos y los <em>bailes</em> de auth animados paso a paso." })
    ]));

    shell.appendChild(el("hr", { class: "rule-double foil" }));

    // --- Datos de referencia ---
    shell.appendChild(el("div", { class: "section-head" }, [
      el("h2", { text: "El panorama, hoy" }),
      el("span", { class: "facts-date", text: "evaluado · jul 2026" })
    ]));
    shell.appendChild(el("div", { class: "facts" }, FACTS.map(function (f) {
      return el("div", { class: "fact" }, [
        el("div", { class: "fx-num mono", text: f.num }),
        el("div", { class: "fx-text", text: f.texto })
      ]);
    })));

    // --- Barra de problema (filtro) ---
    var dolorActivo = null;
    var chips = [];
    var chipTodos = el("button", { class: "chip active", text: "Todos", onClick: function () { setDolor(null); } });
    chips.push(chipTodos);
    var chipDolor = {};
    G.dolores.forEach(function (d) {
      var c = el("button", { class: "chip", text: d.label, onClick: function () { setDolor(d.id); } });
      chipDolor[d.id] = c; chips.push(c);
    });

    shell.appendChild(el("div", { class: "problem-bar" }, [
      el("div", { class: "eyebrow", text: "Empieza por el dolor" }),
      el("div", { class: "chip-row" }, chips)
    ]));

    // --- Catálogo por familias ---
    var catWrap = el("div", {});
    shell.appendChild(catWrap);

    var cardsPorId = {};
    G.familias.forEach(function (fam) {
      var metodos = G.catalogo.filter(function (m) { return m.familia === fam.id; });
      var grid = el("div", { class: "catalog-grid" });
      metodos.forEach(function (m) {
        var card = G.catalogCard(m, false);
        cardsPorId[m.id] = card;
        grid.appendChild(card);
      });
      catWrap.appendChild(el("section", { class: "family-block" }, [
        el("div", { class: "family-head" }, [
          el("span", { class: "swatch", style: { background: fam.color } }),
          el("span", { class: "fam-name", text: fam.nombre }),
          el("span", { class: "fam-note", text: "— " + fam.nota }),
          el("span", { class: "fam-line" })
        ]),
        grid
      ]));
    });

    function setDolor(id) {
      dolorActivo = id;
      chipTodos.className = "chip" + (id === null ? " active" : "");
      G.dolores.forEach(function (d) {
        chipDolor[d.id].className = "chip" + (id === d.id ? " active" : "");
      });
      G.catalogo.forEach(function (m) {
        var match = id === null || (m.tags || []).indexOf(id) >= 0;
        cardsPorId[m.id].classList.toggle("dimmed", !match);
      });
    }

    shell.appendChild(G.colofon());
    G.scrollTop();
  };

})(window.GUIA = window.GUIA || {});
