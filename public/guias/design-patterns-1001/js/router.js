/* ============================================================================
   router.js — enrutamiento por hash y arranque. Carga AL FINAL.
   ========================================================================== */
(function (G) {
  'use strict';

  var runCleanups = G.runCleanups,
    renderPattern = G.renderPattern,
    renderHome = G.renderHome,
    renderDisambig = G.renderDisambig;

  function currentNav() {
    var links = document.querySelectorAll('.site-nav .links a');
    var hash = location.hash || '#/';
    links.forEach(function (a) {
      var match =
        (a.getAttribute('href') === '#/' &&
          (hash === '#/' || hash === '' || hash.indexOf('#/patron/') === 0)) ||
        a.getAttribute('href') === hash;
      if (match) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function route() {
    runCleanups();
    var hash = (location.hash || '#/').replace(/^#/, '');
    var patternMatch = hash.match(/^\/patron\/(.+)$/);
    if (hash === '/desambiguacion') renderDisambig();
    else if (patternMatch) renderPattern(decodeURIComponent(patternMatch[1]));
    else renderHome();
    currentNav();
  }

  function boot() {
    G.initTheme();
    var slot = document.getElementById('theme-slot');
    if (slot) slot.appendChild(G.themeToggle());
    route();
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', boot);
  // por si el script carga después de DOMContentLoaded
  if (document.readyState !== 'loading') boot();
})((window.GUIA = window.GUIA || {}));
