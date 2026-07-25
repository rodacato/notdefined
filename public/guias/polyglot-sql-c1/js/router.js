/* router.js — ruta por slug pelón: "#/" (índice) y "#/<slug>" (ficha). Se carga al final. */
(function (G) {
  "use strict";

  var mount = document.getElementById("app");

  function slugActual() {
    var hash = window.location.hash.replace(/^#\/?/, "").replace(/\/$/, "");
    return hash;
  }

  function pintar() {
    var slug = slugActual();
    if (slug && G.fichas[slug]) {
      G.paginas.ficha(mount, slug);
    } else {
      if (slug) window.history.replaceState(null, "", "#/");
      G.paginas.indice(mount);
    }
    window.scrollTo(0, 0);
  }

  G.iniciarTema();
  window.addEventListener("hashchange", pintar);
  pintar();
})(window.GUIA = window.GUIA || {});
