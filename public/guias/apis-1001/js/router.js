/* ==========================================================================
   js/router.js — Enrutamiento por hash + cromo (topbar) + arranque.
   Carga AL FINAL: aquí ya existen G.pages.* y los datos.
   Rutas:  #/  ·  #/ficha/:id  ·  #/comparador  ·  #/quiz  ·  #/desambiguacion
   ========================================================================== */
(function (G) {
  "use strict";

  var NAV = [
    { hash: "#/", label: "Catálogo", match: /^#?\/?$|^#\/ficha/ },
    { hash: "#/comparador", label: "Comparador", match: /^#\/comparador/ },
    { hash: "#/quiz", label: "Cuál uso", match: /^#\/quiz/ },
    { hash: "#/desambiguacion", label: "Desambiguación", match: /^#\/desambiguacion/ }
  ];

  function buildTopbar() {
    var navEl = G.el("nav", {}, NAV.map(function (n) {
      return G.el("a", { href: n.hash, text: n.label, "data-hash": n.hash });
    }));

    var THEMES = [
      { mode: "light", icon: "sun", label: "Tema claro" },
      { mode: "dark", icon: "moon", label: "Tema oscuro" },
      { mode: "system", icon: "monitor", label: "Seguir al sistema" }
    ];
    var toggle = G.el("div", { class: "theme-seg", role: "group", "aria-label": "Tema" },
      THEMES.map(function (t) {
        return G.el("button", { "data-theme-mode": t.mode, "aria-label": t.label, title: t.label,
          html: G.iconStr(t.icon), onclick: function () { G.setTheme(t.mode); } });
      }));

    var menuBtn = G.el("button", { class: "menu-btn", "aria-label": "Menú",
      html: G.iconStr("menu"), onclick: function () { navEl.classList.toggle("open"); } });

    var inner = G.el("div", { class: "shell topbar-inner" }, [
      G.el("a", { class: "back", href: "/guias/", text: "← notdefined.dev/guias" }),
      G.el("a", { class: "brand", href: "#/" }, [
        G.icon("mark", "mark"),
        G.el("span", { class: "wordmark", text: "1001" }),
        G.el("span", { class: "sub", text: "APIs · almanaque" })
      ]),
      navEl, toggle, menuBtn
    ]);

    var bar = G.el("header", { class: "topbar" }, [inner]);
    document.getElementById("topbar").appendChild(bar);

    // Cierra el menú móvil al navegar
    navEl.addEventListener("click", function () { navEl.classList.remove("open"); });
  }

  // Pie con el colofón de la guía (una sola vez, fuera del área de vistas).
  function buildFooter() {
    var foot = G.el("footer", { class: "site-foot" }, [
      G.el("div", { class: "shell foot-inner" }, [
        G.el("span", { class: "fmark" }, [
          G.icon("mark"),
          G.el("span", { class: "fword", text: "1001" })
        ]),
        G.el("span", { class: "fmeta", text: "Almanaque técnico · Tomo IV · Edición 2026" }),
        G.el("a", { href: "/guias/", text: "notdefined.dev/guias →" }),
        G.el("p", { class: "ftesis", text: "Un catálogo para recuperar el estilo por el problema que resuelves, no por su nombre." })
      ])
    ]);
    document.getElementById("footer").appendChild(foot);
  }

  function setActiveNav(hash) {
    G.$$("#topbar nav a").forEach(function (a) {
      var n = NAV.filter(function (x) { return x.hash === a.getAttribute("data-hash"); })[0];
      a.classList.toggle("active", n && n.match.test(hash));
    });
  }

  function stopActiveTimers() {
    if (G._activeTimers) { G._activeTimers.forEach(function (fn) { try { fn(); } catch (e) {} }); }
    G._activeTimers = [];
  }

  var TITLE_BASE = "APIs 1001 · almanaque técnico";

  function route() {
    var hash = location.hash || "#/";
    stopActiveTimers();

    var node, title;
    var mFicha = hash.match(/^#\/ficha\/(.+)$/);
    if (mFicha) {
      var id = decodeURIComponent(mFicha[1]);
      node = G.pages.ficha(id);
      var estilo = G.catalogoPorId[id];
      title = (estilo ? estilo.nombre : "No encontrado") + " · " + TITLE_BASE;
    }
    else if (/^#\/comparador/.test(hash)) { node = G.pages.comparador(); title = "Comparador de escenario · " + TITLE_BASE; }
    else if (/^#\/quiz/.test(hash)) { node = G.pages.quiz(); title = "¿Cuál uso? · " + TITLE_BASE; }
    else if (/^#\/desambiguacion/.test(hash)) { node = G.pages.desambiguacion(); title = "Los que se confunden · " + TITLE_BASE; }
    else if (hash === "#/" || hash === "#") { node = G.pages.catalogo(); title = TITLE_BASE + " — estilos de API catalogados"; }
    // Ruta desconocida: normaliza el hash para que URL y pantalla coincidan.
    else { location.replace("#/"); return; }

    document.title = title;
    G.mount(node);
    setActiveNav(hash);
  }

  G.start = function () {
    buildTopbar();
    buildFooter();
    G.applyTheme();
    window.addEventListener("hashchange", route);
    route();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", G.start);
  else G.start();

})(window.GUIA = window.GUIA || {});
