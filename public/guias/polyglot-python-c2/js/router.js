/* router.js — enrutamiento por hash y arranque. Carga al final.
   #/            → índice / catálogo
   #/tema/<slug> → ficha del tema */
(function (G) {
  "use strict";

  function ruta() {
    var h = (location.hash || "").replace(/^#/, "");
    var m = h.match(/^\/tema\/([^/?#]+)/);
    return m ? { vista: "tema", slug: decodeURIComponent(m[1]) } : { vista: "indice" };
  }

  function render() {
    var app = document.getElementById("app");
    if (!app) return;
    var r = ruta();
    if (r.vista === "tema") G.vistaTema(app, r.slug);
    else G.vistaIndice(app);
  }

  function boot() {
    G.renderToggle();
    render();
    window.addEventListener("hashchange", render);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

})(window.GUIA = window.GUIA || {});
