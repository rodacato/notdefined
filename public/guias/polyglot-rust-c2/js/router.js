/* router.js — enrutamiento por hash y arranque. Carga al final. */
(function (G) {
  "use strict";

  function parse() {
    var h = (location.hash || "").replace(/^#\/?/, "");   // "" | "tema/ownership"
    var parts = h.split("/").filter(Boolean);
    if (parts[0] === "tema" && parts[1]) return { view: "tema", slug: parts[1] };
    return { view: "catalog" };
  }

  function render() {
    var app = document.getElementById("app");
    var r = parse();
    if (r.view === "tema") G.pages.tema(app, r.slug);
    else G.pages.catalog(app);
  }

  function boot() {
    var bar = document.getElementById("topbar");
    bar.appendChild(G.topbar());
    render();
    window.addEventListener("hashchange", render);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

})(window.GUIA = window.GUIA || {});
