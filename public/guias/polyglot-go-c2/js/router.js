/* router.js — enrutamiento por hash y arranque. Carga al final. */
(function (G) {
  "use strict";

  function parseHash() {
    var h = location.hash.replace(/^#/, "");
    if (!h || h === "/" ) return { view: "index" };
    var m = h.match(/^\/t\/([a-z0-9\-]+)$/i);
    if (m) return { view: "topic", slug: m[1] };
    return { view: "index" };
  }

  function route() {
    G.runCleanups();
    var root = document.getElementById("app");
    var r = parseHash();
    if (r.view === "topic") {
      var t = G.topicBySlug(r.slug);
      if (t) { G.renderTopic(root, t); return; }
    }
    G.renderIndex(root);
  }

  G.boot = function () {
    G.applyTheme(G.getThemeMode());   // ya aplicado en <head>, reafirma + favicon
    window.addEventListener("hashchange", route);
    route();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", G.boot);
  else G.boot();

})(window.GUIA = window.GUIA || {});
