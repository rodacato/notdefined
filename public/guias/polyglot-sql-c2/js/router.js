/* ============================================================================
   js/router.js — enrutamiento por hash (slug-pelón) y arranque. Carga al final.
   Rutas:  #/            → índice
           #/<slug>      → ficha  (planner, mvcc, wal, ...)
   ============================================================================ */
(function (G) {
  "use strict";

  function parse() {
    var h = (location.hash || "").replace(/^#\/?/, "").trim();
    return h; // "" = índice; "planner" = ficha
  }

  function render() {
    var app = document.getElementById("app");
    var slug = parse();
    var view;

    if (!slug) {
      view = G.pageIndex();
      document.title = "SQL a fondo · Polyglot";
    } else {
      view = G.pageFicha(slug);
      if (!view) { location.hash = "#/"; return; } // slug desconocido → índice
      var meta = G.temaPorSlug(slug);
      document.title = meta.titulo + " · SQL a fondo";
    }

    G.clear(app);
    app.appendChild(view);
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  function boot() {
    G.tema.apply();
    G.mountTopbar();
    G.mountColophon();
    render();
    window.addEventListener("hashchange", render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})(window.GUIA = window.GUIA || {});
