/* modulos.js — tema AGREGADO: Módulos por dentro (ESM vs CJS).
   Se integra al Bloque 1 (cómo el código llega a ejecutarse). */
(function (G) {
  "use strict";
  const D = G.data = G.data || { topics: {} };

  D.topics["modulos-esm-cjs"] = {
    slug: "modulos-esm-cjs", folio: "04", tag: "lenguaje", difficulty: "\u25C6\u25C6\u25C7",
    title: "Módulos por dentro: ESM vs CJS",
    tagline: "Resolución, live bindings vs copia de valores, top-level await, y por qué el interop ESM\u2194CJS duele.",
    avoid: "creer que import es un require con azúcar sintáctica.",
    lede: "Los dos sistemas de m\u00f3dulos de JavaScript no son intercambiables. <span class=\"mono\">require</span> es s\u00edncrono y te entrega el objeto exports tal como qued\u00f3; <span class=\"mono\">import</span> resuelve un grafo en fases y entrega <em class=\"serif-italic\">enlaces vivos</em>. Ah\u00ed nace casi todo el dolor del interop.",
    breve: [
      { k: "Capa", v: "Lenguaje + runtime" },
      { k: "CJS", v: "require \u00b7 síncrono" },
      { k: "ESM", v: "import \u00b7 en fases" },
      { k: "ESM da", v: "Live bindings" },
    ],
    quees: "<p><strong>CommonJS</strong> (<span class=\"inline-code\">require</span> / <span class=\"inline-code\">module.exports</span>) carga de forma <em class=\"serif-italic\">s\u00edncrona</em>: ejecuta el m\u00f3dulo completo en el momento del require y te devuelve una <strong>referencia</strong> al objeto <span class=\"inline-code\">module.exports</span>. Lo que se copia es el <strong>valor de la variable</strong> al momento de asignarla a ese objeto: si el exportador luego le reasigna otro valor a la variable, no te enteras; si muta una propiedad (<span class=\"inline-code\">exports.n++</span>), lo ves al instante. <strong>ESM</strong> (<span class=\"inline-code\">import</span> / <span class=\"inline-code\">export</span>) resuelve el grafo de m\u00f3dulos <em class=\"serif-italic\">est\u00e1ticamente</em> y entrega <strong>live bindings</strong>: referencias vivas a las variables del m\u00f3dulo, as\u00ed que hasta el rebinding se ve.</p>",
    fundamento: "<p>ESM se procesa en <strong>tres fases</strong>: construcci\u00f3n (resolver especificadores y traer/parsear cada m\u00f3dulo), instanciaci\u00f3n (crear los bindings y enlazarlos, a\u00fan sin valores) y evaluaci\u00f3n (ejecutar el top-level, con <span class=\"inline-code\">top-level await</span> si hace falta). Como el grafo se conoce antes de ejecutar, los <span class=\"inline-code\">import</span> son analizables est\u00e1ticamente \u2014 tree-shaking, imports circulares que funcionan. CJS no: <span class=\"inline-code\">require</span> se resuelve <em class=\"serif-italic\">mientras</em> el c\u00f3digo corre.</p>",
    como: [
      "<strong>Resoluci\u00f3n</strong>: el especificador (<span class=\"inline-code\">'./x.js'</span>) se resuelve a un archivo o URL concreto.",
      "<strong>Fetch + parse</strong>: se trae el m\u00f3dulo y se analiza para descubrir sus <span class=\"inline-code\">import</span>/<span class=\"inline-code\">export</span>.",
      "<strong>Instanciaci\u00f3n</strong>: se crean los <em>live bindings</em> y se enlazan importador \u2194 exportador (sin valores todav\u00eda).",
      "<strong>Evaluaci\u00f3n</strong>: se ejecuta el top-level de cada m\u00f3dulo (con top-level await) y los bindings toman valor.",
    ],
    mito: "<p>\u00ab<span class=\"inline-code\">import</span> es <span class=\"inline-code\">require</span> con az\u00facar sint\u00e1ctica.\u00bb No: <span class=\"inline-code\">require</span> es s\u00edncrono y lo que te llega es el objeto exports \u2014si el m\u00f3dulo <em class=\"serif-italic\">reasigna</em> la variable despu\u00e9s, no te enteras\u2014; <span class=\"inline-code\">import</span> es as\u00edncrono, en fases, est\u00e1tico y te da <strong>enlaces vivos</strong> que s\u00ed reflejan el rebinding. Por eso el interop duele donde duele: el <span class=\"inline-code\">default</span> de un CJS se envuelve, los named exports se detectan por heur\u00edstica, y no hay <span class=\"inline-code\">top-level await</span> dentro de CJS.</p>",
    recursos: [
      { kind: "Art\u00edculo", star: true, title: "ES modules: A cartoon deep-dive", sub: "Lin Clark \u00b7 Mozilla Hacks \u2014 las tres fases, ilustradas", href: "https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/" },
      { kind: "Referencia", title: "JavaScript modules", sub: "MDN \u2014 import/export y su sem\u00e1ntica", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules" },
      { kind: "Node", title: "Modules: ECMAScript modules", sub: "Node.js docs \u2014 interop ESM\u2194CJS en detalle", href: "https://nodejs.org/api/esm.html" },
    ],
    widget: {
      storeKey: "modulos",
      zones: [{ id: "binding", label: "Lo que recibe el importador", cls: "micro" }],
      variants: [
        {
          id: "cjs", label: "CommonJS (require)",
          frames: [
            { codeCap: "app.js (CommonJS)", code: ["const c = require('./counter');"], phase: "Carga s\u00edncrona", binding: [],
              cap: "<span class=\"inline-code\">require()</span> ejecuta counter.js ENTERO ahora, de forma s\u00edncrona, y devuelve su <span class=\"inline-code\">module.exports</span>." },
            { codeCap: "counter.js", code: ["let n = 0;", "module.exports = { n };"], phase: "Copia del valor", binding: ["n = 0  (copia)"],
              cap: "Se copia el VALOR de <span class=\"inline-code\">n</span> (0) al objeto exports. Si counter luego hace <span class=\"inline-code\">n++</span>, el importador sigue viendo 0: es una foto, no un enlace." },
          ],
        },
        {
          id: "esm", label: "ESM (import)",
          frames: [
            { codeCap: "app.js (ESM)", code: ["import { n } from './counter.js';"], phase: "1 \u00b7 Resoluci\u00f3n", binding: [],
              cap: "El especificador <span class=\"inline-code\">'./counter.js'</span> se resuelve a una URL/archivo. El grafo se construye ANTES de ejecutar nada." },
            { codeCap: "instanciaci\u00f3n", code: ["import { n } from './counter.js';"], phase: "2 \u00b7 Instanciaci\u00f3n", binding: ["n \u2192 (enlace vivo)"],
              cap: "Se crean los bindings: <span class=\"inline-code\">n</span> NO es una copia, es una referencia viva a la variable del m\u00f3dulo. A\u00fan sin valor." },
            { codeCap: "evaluaci\u00f3n", code: ["// counter.js", "export let n = 0;", "setInterval(() => n++, 1000);"], phase: "3 \u00b7 Evaluaci\u00f3n", binding: ["n \u2192 0 \u2192 1 \u2192 2  (vivo)"],
              cap: "Se ejecuta el top-level (con top-level await si hace falta). Si counter incrementa <span class=\"inline-code\">n</span>, el importador ve el nuevo valor: <strong>live binding</strong>." },
          ],
        },
      ],
    },
  };
})(window.GUIA = window.GUIA || {});
