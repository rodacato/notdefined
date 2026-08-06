/* router.js — enrutamiento por hash y arranque. Carga al final. */
(function (G) {
  "use strict";

  let activeTeardown = null;

  function parse() {
    const h = (location.hash || "").replace(/^#\/?/, "");
    const parts = h.split("/").filter(Boolean);
    if (parts[0] === "tema" && parts[1]) return { view: "tema", slug: decodeURIComponent(parts[1]) };
    if (parts[0] === "bibliografia") return { view: "bibliografia" };
    return { view: "index" };
  }

  function route() {
    // limpiar cualquier player en marcha de la vista anterior
    if (activeTeardown) { try { activeTeardown(); } catch (e) {} activeTeardown = null; }

    const r = parse();
    let node;
    if (r.view === "tema") {
      node = G.pages.tema(r.slug);
      if (node._teardownPlayer) activeTeardown = node._teardownPlayer;
      const t = G.data.topics[r.slug];
      document.title = (t ? t.title + " \u00b7 " : "") + "JavaScript a fondo \u00b7 Polyglot";
    } else if (r.view === "bibliografia") {
      node = G.pages.bibliografia();
      document.title = "Bibliograf\u00eda \u00b7 JavaScript a fondo \u00b7 Polyglot";
    } else {
      node = G.pages.index();
      document.title = "JavaScript a fondo \u00b7 Polyglot";
    }
    G.mount(node);
    window.scrollTo(0, 0);
  }

  function boot() {
    G.watchSystemTheme();
    // Fuera de #app: la barra es cromo, no contenido, y no se repinta por ruta.
    document.body.insertBefore(G.comp.topbar(), document.body.firstChild);
    window.addEventListener("hashchange", route);
    route();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window.GUIA = window.GUIA || {});
