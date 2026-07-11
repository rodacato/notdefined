/* ============================================================================
   1001 — Arquitecturas · js/router.js — enrutamiento por hash + arranque
   ----------------------------------------------------------------------------
   Rutas:
     #/catalogo             → índice del catálogo (por defecto)
     #/cual-usar            → «¿Cuál arquitectura usar?»
     #/familia/<1..5>       → ficha de la familia
     #/familia/<1..5>/<id>  → familia, con scroll a la ficha del estilo <id>
   Carga al final: todo lo demás (data, core, componentes, páginas) ya está listo.
   ========================================================================== */
(function (G) {
  "use strict";
  const BASE = "1001 — Arquitecturas";

  function parse() {
    const raw = (location.hash || "").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    if (parts.length === 0) return { name: "catalogo" };
    if (parts[0] === "cual-usar") return { name: "cual-usar" };
    if (parts[0] === "familia") return { name: "familia", num: parts[1], ficha: parts[2] };
    return { name: "catalogo" };
  }

  function render() {
    const app = document.getElementById("app");
    const r = parse();
    if (r.name === "cual-usar") {
      document.title = "¿Cuál arquitectura usar? · " + BASE;
      G.pages.cualUsar(app);
    } else if (r.name === "familia") {
      const fam = G.data.FAMILIES.find((f) => f.numero === Number(r.num));
      document.title = (fam ? "Familia " + r.num + " · " + fam.name : "Familia") + " · " + BASE;
      G.pages.familia(app, r.num);
    } else {
      document.title = BASE + " · índice del catálogo";
      G.pages.catalogo(app);
    }
    window.scrollTo(0, 0);
    if (r.name === "familia" && r.ficha) {
      const ficha = document.getElementById("ficha-" + r.ficha);
      if (ficha) ficha.scrollIntoView();
    }
  }

  function boot() {
    G.initTheme();
    // Toggle de tema en el cromo del sitio.
    const slot = document.getElementById("theme-slot");
    if (slot) slot.appendChild(G.themeToggle());
    render();
    window.addEventListener("hashchange", render);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window.GUIA = window.GUIA || {});
