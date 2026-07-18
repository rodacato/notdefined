/* ============================================================================
   router.js — Enrutamiento por hash y arranque. Carga AL FINAL.
   Rutas:
     #/                 índice del catálogo
     #/guia             ¿cuál algoritmo usar? (guía de decisión)
     #/modulo-00        Big O
     #/modulo-01        Búsquedas   (sub-pestaña: #/modulo-01/binaria)
     #/modulo-02..06    resto de módulos
   Cada página se registra en GUIA.pages[clave] = function (root, sub) { ...;
   return cleanup? }. El router destruye la página anterior antes de montar la
   siguiente (un solo set de listeners de teclado vivo a la vez).
   ========================================================================== */
(function (G) {
  "use strict";

  var root = document.getElementById("app");
  var currentCleanup = null;

  function parseHash() {
    var raw = (location.hash || "").replace(/^#\/?/, "");   // "modulo-01/binaria"
    var segs = raw.split("/").filter(Boolean);
    return { key: segs[0] || "", sub: segs[1] || null };
  }

  function resolve(key) {
    var pages = G.pages || {};
    if (pages[key]) return key;
    // aceptar "modulo-1" además de "modulo-01"
    var m = key.match(/^modulo-(\d+)$/);
    if (m) {
      var padded = "modulo-" + ("0" + m[1]).slice(-2);
      if (pages[padded]) return padded;
    }
    return "";
  }

  function navigate() {
    var pages = G.pages || {};
    var parsed = parseHash();
    var key = resolve(parsed.key);
    // Ruta desconocida: normaliza el hash para que URL y pantalla coincidan.
    if (parsed.key && key === "") { location.replace("#/"); return; }
    var page = pages[key] || pages[""];

    if (typeof currentCleanup === "function") { try { currentCleanup(); } catch (e) {} }
    currentCleanup = null;

    G.clear(root);
    window.scrollTo(0, 0);

    if (page) {
      var res = page(root, parsed.sub);
      if (typeof res === "function") currentCleanup = res;
    }
  }

  function boot() {
    G.initTheme();
    navigate();
  }

  window.addEventListener("hashchange", navigate);
  // arranque
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  G.navigate = navigate;

})(window.GUIA = window.GUIA || {});
