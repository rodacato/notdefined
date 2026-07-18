/* ============================================================
   router.js — enrutado por hash y arranque. Se carga al final.
   Rutas: #/  -> portada · #/<slug> -> ficha del tema.
   ============================================================ */
(function (G) {
  "use strict";

  var app = document.getElementById("app");

  function currentSlug() {
    var hash = location.hash.replace(/^#\/?/, "").trim();
    return hash;
  }

  function render() {
    var slug = currentSlug();
    var view;
    if (!slug) {
      view = G.renderIndex();
      document.title = "Ruby a fondo · Polyglot";
    } else if (G.data.topics[slug]) {
      view = G.renderTopic(slug);
      var t = G.data.topics[slug];
      document.title = (t.navShort || t.title) + " · Ruby a fondo";
    } else {
      // Ruta desconocida: vuelve a la portada.
      location.hash = "#/";
      return;
    }
    app.innerHTML = "";
    app.appendChild(view);
    // Monta el widget interactivo si la vista lo trae.
    if (view._mountWidget) view._mountWidget();
    // Arranca arriba en cada cambio de vista (sin usar scrollIntoView).
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", render);
  render();

})(window.GUIA = window.GUIA || {});
