/* ============================================================
   js/router.js — enrutamiento por hash + arranque. Carga AL FINAL.
   Rutas: #/catalogo · #/ficha/<id> · #/simulaciones ·
          #/cual-uso · #/desambiguacion
   ============================================================ */
(function (G) {
  "use strict";

  var app = G.$("#app");

  function parseHash() {
    var raw = (location.hash || "").replace(/^#\/?/, "");
    var partes = raw.split("/").filter(Boolean);
    return { ruta: partes[0] || "catalogo", param: partes[1] || null };
  }

  function resolver(r) {
    switch (r.ruta) {
      case "ficha": return G.pages.ficha({ id: r.param });
      case "simulaciones": return G.pages.simulaciones();
      case "cual-uso": return G.pages["cual-uso"]();
      case "desambiguacion": return G.pages.desambiguacion();
      case "catalogo":
      default: return G.pages.catalogo();
    }
  }

  function render() {
    var r = parseHash();
    var nodos = resolver(r);
    G.clear(app);
    G.append(app, Array.isArray(nodos) ? nodos : [nodos]);
    // Título de pestaña por ruta
    var BASE = "Mensajería 1001 · almanaque técnico";
    var t = BASE;
    if (r.ruta === "ficha" && G.getSistema(r.param)) t = G.getSistema(r.param).nombre + " · " + BASE;
    else if (r.ruta === "simulaciones") t = "Simulaciones · " + BASE;
    else if (r.ruta === "cual-uso") t = "¿Cuál uso? · " + BASE;
    else if (r.ruta === "desambiguacion") t = "Desambiguación · " + BASE;
    document.title = t;
    G.scrollTop();
  }

  window.addEventListener("hashchange", render);

  // ---- Arranque ----
  function boot() {
    G.theme.aplicar();                       // reafirma la clase (ya la puso el anti-FOUC)
    G.montarTemaToggle(G.$("#theme-mount"));
    if (!location.hash) location.replace("#/catalogo");
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

})(window.GUIA = window.GUIA || {});
