/* js/router.js — Enrutamiento por hash y arranque. Carga al final.
   Rutas:  #/                     → índice / catálogo
           #/tipo/<slug>          → ficha de un tipo
           #/lab/<simId>          → simulador de layout                    */
(function (G) {
  'use strict';

  var raiz;

  function parsear() {
    var h = (location.hash || '').replace(/^#\/?/, '');   // quita "#/" inicial
    var partes = h.split('/').filter(Boolean);
    if (!partes.length) return { vista: 'indice' };
    if (partes[0] === 'tipo')       return { vista: 'ficha', slug: partes[1] };
    if (partes[0] === 'lab')        return { vista: 'lab', sim: partes[1] };
    if (partes[0] === 'comparar')   return { vista: 'comparador' };
    if (partes[0] === 'quiz')       return { vista: 'quiz' };
    if (partes[0] === 'desambiguar') return { vista: 'desambiguacion' };
    return { vista: '404', slug: partes.join('/') };
  }

  function titulo(r) {
    var base = G.CONFIG.tituloBase;
    if (r.vista === 'ficha') {
      var t = G.porSlug[r.slug];
      return (t ? t.nombre : 'No encontrado') + ' · ' + base;
    }
    if (r.vista === 'lab') {
      if (!r.sim) return 'Laboratorio · ' + base;
      var sim = G.sims[r.sim];
      return (sim ? sim.titulo : 'No encontrado') + ' · ' + base;
    }
    if (r.vista === 'comparador') return 'Comparador de escenario · ' + base;
    if (r.vista === 'quiz') return 'Cuál uso · ' + base;
    if (r.vista === 'desambiguacion') return 'Desambiguación · ' + base;
    if (r.vista === '404') return 'No encontrado · ' + base;
    return base;
  }

  function despachar() {
    // Detén cualquier animación/timer de la vista anterior antes de reemplazarla.
    if (typeof G.limpiarVista === 'function') { try { G.limpiarVista(); } catch (e) {} }
    G.limpiarVista = null;

    var r = parsear();
    document.title = titulo(r);
    document.documentElement.dataset.vista = r.vista;
    if (r.vista === 'indice') G.paginas.indice(raiz);
    else if (r.vista === 'ficha') G.paginas.ficha(raiz, r.slug);
    else if (r.vista === 'lab') {
      if (!r.sim) G.paginas.labHub(raiz);
      else if (r.sim === 'row-vs-columnar') G.paginas.lab(raiz, r.sim);
      else G.paginas.simGenerico(raiz, r.sim);
    }
    else if (r.vista === 'comparador') G.paginas.comparador(raiz);
    else if (r.vista === 'quiz') G.paginas.quiz(raiz);
    else if (r.vista === 'desambiguacion') G.paginas.desambiguacion(raiz);
    else G.paginas.noEncontrado(raiz, r.slug);
  }

  function arrancar() {
    raiz = G.qs('#app');
    // La preferencia de tema ya se aplicó en el boot inline del <head>;
    // aquí solo re-sincronizamos por si acaso.
    G.tema.aplicar(G.tema.leer());
    window.addEventListener('hashchange', despachar);
    despachar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})(window.GUIA = window.GUIA || {});
