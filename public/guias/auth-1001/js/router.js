/* ============================================================================
   js/router.js — enrutamiento por hash y arranque. Carga AL FINAL.
   ----------------------------------------------------------------------------
   Rutas:
     #/                       → índice / catálogo
     #/ficha/<id>             → ficha de un método
     #/cual-uso               → quiz "¿cuál uso?"
     #/desambiguacion         → conceptos que se confunden
   ========================================================================== */
(function (G) {
  "use strict";
  var BASE = "Auth 1001 · almanaque técnico";

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, ""); // quita "#/" o "#"
    var partes = h.split("/").filter(Boolean);
    if (!partes.length) return { page: "inicio", params: {} };
    if (partes[0] === "ficha") return { page: "ficha", params: { id: partes[1] } };
    if (partes[0] === "cual-uso") return { page: "cual-uso", params: {} };
    if (partes[0] === "desambiguacion") return { page: "desambiguacion", params: {} };
    return { page: "inicio", params: {} };
  }

  function titulo(ruta) {
    if (ruta.page === "ficha") {
      var m = G.porId[ruta.params.id];
      if (m) return m.folio + " · " + m.titulo + " · " + BASE;
    }
    if (ruta.page === "cual-uso") return "¿Cuál uso? · " + BASE;
    if (ruta.page === "desambiguacion") return "Desambiguación · " + BASE;
    return BASE;
  }

  function render() {
    var ruta = parseHash();
    document.title = titulo(ruta);
    var root = document.getElementById("app");
    G.clear(root);
    var page = G.pages[ruta.page] || G.pages.inicio;
    page(root, ruta.params);
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);
  // Si el DOM ya está listo (script al final del body), renderiza ya.
  if (document.readyState !== "loading") render();

})(window.GUIA = window.GUIA || {});
