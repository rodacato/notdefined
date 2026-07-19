/* data/memoria.js — Bloque 3 · Memoria y objetos. */
(function (G) {
  "use strict";
  var T = G.data.temas;

  // 09 · Refcount + GC -----------------------------------------------------
  function objRefcnt(n, alive) {
    return alive
      ? "<div class='w-node'><span class='t'>PyObject · list</span><span class='v'>[1, 2, 3]</span><span class='c'>" + n + "</span><span class='t'>ob_refcnt</span></div>"
      : "<div class='w-node dim'><span class='t'>ob_refcnt = 0</span><span class='v'>liberado al instante</span></div>";
  }
  function refsCol(k) {
    return "<div class='w-col' style='flex:0 0 120px'>" +
      ["a", "b", "c"].map(function (v, i) {
        var on = i < k;
        return "<div class='w-kv' style='opacity:" + (on ? 1 : .35) + "'><span class='k'>" + v + "</span><span class='v'>" + (on ? "→" : "·") + "</span></div>";
      }).join("") + "</div>";
  }
  var rc = [
    { k: 1, alive: true, nota: "Una variable (a) apunta al objeto: ob_refcnt = 1." },
    { k: 2, alive: true, nota: "b = a: otra etiqueta al mismo objeto. Nada se copia; el contador sube a 2." },
    { k: 3, alive: true, nota: "c = a: tres referencias, un solo objeto. ob_refcnt = 3." },
    { k: 1, alive: true, nota: "del c; del b: cada borrado baja el contador. Queda 1: el objeto sigue vivo." },
    { k: 0, alive: false, nota: "del a: el contador llega a 0 y el objeto se libera de inmediato, sin esperar a ningún GC.", tone: "ok" }
  ];
  function gcNodes(rcA, rcB, cycle, dropped, collected) {
    function n(name, rc, other) {
      var cls = collected ? "w-node dim" : (dropped ? "w-node bad" : "w-node");
      return "<div class='" + cls + "'><span class='t'>objeto " + name + "</span>" +
        "<span class='v'>" + name + ".next → " + (cycle ? other : "None") + "</span><span class='c'>" + rc + "</span><span class='t'>refcnt</span></div>";
    }
    return "<div class='w-nodes'>" + n("A", rcA, "B") +
      "<div class='w-col' style='flex:0 0 auto;align-items:center;opacity:" + (cycle ? 1 : .25) + "'><span style='font-size:20px'>⇄</span><span class='w-tag'>ciclo</span></div>" +
      n("B", rcB, "A") + "</div>";
  }
  var gc = [
    { vis: gcNodes(1, 1, false, false, false), nota: "Dos objetos A y B, cada uno con una variable externa (a→A, b→B). refcnt = 1 en ambos." },
    { vis: gcNodes(2, 2, true, false, false), nota: "Creamos un ciclo: A.next = B y B.next = A. Ahora cada uno tiene 2 referencias (la externa + la del otro)." },
    { vis: gcNodes(1, 1, true, true, false), nota: "del a; del b: refcnt baja a 1… pero NO a 0: se apuntan mutuamente. Inalcanzables, pero vivos — el refcount no puede liberarlos.", tone: "warn" },
    { vis: gcNodes(0, 0, true, false, true), nota: "El GC generacional recorre los contenedores, detecta que el ciclo es inalcanzable desde la raíz, y lo recolecta. refcnt → 0.", tone: "ok" }
  ];
  T.push({
    slug: "refcount-gc", folio: "09", bloque: 3, fam: 3, dificultad: 2, estrella: true, estrellaNota: "mecanismo distintivo",
    cardTitulo: "Reference counting + GC cíclico",
    titulo: "Reference counting + GC cíclico generacional",
    tagline: "Contador por objeto que libera al instante; un GC generacional aparte solo recolecta los ciclos.",
    evita: "Pensar que el GC lo hace todo.",
    lede: "Python libera memoria de dos formas: un contador por objeto que libera <em>al instante</em>, y un GC aparte que solo se ocupa de los <em>ciclos</em>.",
    enBreve: [
      "El mecanismo principal es el <b>reference counting</b>: libera en cuanto el contador llega a 0.",
      "El refcount <b>no ve los ciclos</b> (A↔B), así que existe un GC aparte para eso.",
      "El GC de ciclos es <b>generacional</b> (3 generaciones): la basura joven se revisa más seguido.",
      "Desde 3.13 ese recolector es <b>incremental</b>, para pausas más cortas."
    ],
    fundamento: "La principal es el <strong>reference counting</strong>: cada objeto sabe cuántas referencias tiene y se libera en cuanto llegan a cero — memoria predecible, sin pausas. Pero el contador no puede liberar <strong>ciclos</strong> (A apunta a B y B apunta a A), así que un <strong>GC generacional</strong> aparte se ocupa solo de esos.",
    fuerza: "Liberar en el instante exacto en que muere la última referencia da memoria predecible y sin pausas — el precio es un contador que no ve los ciclos, y de ahí el segundo mecanismo.",
    comoFunciona: [
      "<strong>Refcount:</strong> cada <code>PyObject</code> tiene un contador; asignar o borrar referencias lo sube o baja; al llegar a 0 se desasigna de inmediato.",
      "<strong>GC de ciclos:</strong> recorre periódicamente los objetos «contenedor» buscando referencias cíclicas inalcanzables. Es <em>generacional</em> (3 generaciones): lo que sobrevive se promueve y se revisa menos, porque la mayoría de la basura muere joven. <em>Nota de vigencia:</em> desde 3.13 el recolector es <strong>incremental</strong> (efectivamente joven + viejo) para acortar pausas — el modelo de 3 generaciones sigue siendo el mapa mental correcto."
    ],
    mito: {
      mito: "«Python tiene un garbage collector como Java que gestiona toda la memoria».",
      realidad: "El 99% se libera por <em>refcount</em>, sin el GC. El GC solo existe para lo que el refcount no cubre: los ciclos. Puedes incluso desactivarlo con <code>gc.disable()</code> y el refcount sigue funcionando."
    },
    recursos: [
      { texto: "Design of CPython's Garbage Collector — devguide", url: "https://devguide.python.org/garbage_collector/", star: true },
      { texto: "CPython Reference Counting and GC Internals", url: "https://blog.codingconfessions.com/p/cpython-garbage-collection-internals" },
      { texto: "Módulo gc de la stdlib" }
    ],
    widgetLabel: "Visualízalo — el contador y los ciclos",
    widget: {
      intro: "El contador libera al instante; los ciclos se le escapan y quedan para el GC generacional.",
      vistas: [
        { id: "rc", label: "Reference counting", pasos: rc.map(function (s) { return { vis: "<div class='w-row' style='align-items:stretch'>" + refsCol(s.k) + "<div class='w-grow'>" + objRefcnt(s.k, s.alive) + "</div></div>", nota: s.nota, tone: s.tone }; }) },
        { id: "gc", label: "GC de ciclos", pasos: gc }
      ]
    }
  });

  // 10 · pymalloc ----------------------------------------------------------
  function pool(n) {
    var cells = "";
    for (var i = 0; i < 8; i++) cells += "<div class='w-cell" + (i < n ? " on" : "") + "'>" + (i < n ? "•" : "") + "</div>";
    return "<div class='w-surface'><div class='w-tag'>pool · clase 32 B · ~4 KB</div><div class='w-cells' style='margin-top:8px'>" + cells + "</div></div>";
  }
  function soLane(big) {
    return "<div class='w-box' style='flex:0 0 160px'><div class='w-tag'>SO directo</div>" +
      (big ? "<div class='w-pill warn' style='margin-top:8px'>objeto grande · malloc()</div>" : "<div class='w-mono' style='margin-top:8px;color:var(--color-fg-faint)'>objetos &gt; 512 B saltan pymalloc</div>") + "</div>";
  }
  var pm = [
    { vis: "<div class='w-row'><div class='w-grow'><div class='w-tag'>arena · ~1 MiB del SO</div>" + pool(0) + "</div>" + soLane(false) + "</div>", nota: "Arena: un bloque grande (~1 MiB desde 3.9; eran 256 KB hasta 3.8) que pymalloc pide UNA vez al SO." },
    { vis: "<div class='w-row'><div class='w-grow'><div class='w-tag'>arena · ~1 MiB del SO</div>" + pool(1) + "</div>" + soLane(false) + "</div>", nota: "Un objeto de 32 B cae en el próximo block libre de un pool de esa size class. No se llama al SO." },
    { vis: "<div class='w-row'><div class='w-grow'><div class='w-tag'>arena · ~1 MiB del SO</div>" + pool(3) + "</div>" + soLane(false) + "</div>", nota: "Más objetos del mismo tamaño llenan blocks del mismo pool: asignar es casi solo mover un puntero." },
    { vis: "<div class='w-row'><div class='w-grow'><div class='w-tag'>arena · ~1 MiB del SO</div>" + pool(3) + "</div>" + soLane(true) + "</div>", nota: "Un objeto grande (&gt; 512 B) esquiva pymalloc y llama directo al allocator del SO.", tone: "warn" },
    { vis: "<div class='w-row'><div class='w-grow'><div class='w-tag'>arena · ~1 MiB del SO</div>" + pool(2) + "</div>" + soLane(true) + "</div>", nota: "Al liberar un objeto pequeño, su block vuelve al pool para reutilizarse — no al SO. Por eso el proceso «no suelta» RAM.", tone: "ok" }
  ];
  T.push({
    slug: "pymalloc", folio: "10", bloque: 3, fam: 3, dificultad: 3, estrella: false,
    cardTitulo: "El allocator: pymalloc",
    titulo: "El allocator: pymalloc",
    tagline: "Arenas → pools → blocks: por qué crear objetos pequeños es barato sin ir al SO cada vez.",
    evita: "Confundirlo con el GC.",
    lede: "Pedir memoria al sistema en cada objeto pequeño sería lentísimo — y Python crea objetos chicos todo el tiempo. Por eso tiene su propio allocator: <em>arenas → pools → blocks</em>.",
    enBreve: [
      "<b>Arenas</b>: bloques grandes (~1 MiB) pedidos al SO de una vez.",
      "<b>Pools</b>: una página (~4 KB), cada uno dedicado a una <em>size class</em> fija.",
      "<b>Blocks</b>: los slots de los objetos, en clases de 8 en 8 bytes hasta 512.",
      "Objetos <b>&gt; 512 B</b> saltan pymalloc y van directos al allocator del SO."
    ],
    fundamento: "Cada llamada al allocator del SO (<code>malloc</code>) tiene un coste fijo apreciable. Como Python crea y destruye objetos pequeños constantemente, CPython interpone <strong>pymalloc</strong>, optimizado justo para ese patrón: muchísimos objetos chicos y efímeros.",
    fuerza: "Reservar memoria en grandes bloques al SO y repartirla desde ahí convierte cada asignación en poco más que mover un puntero — órdenes de magnitud más barato que ir al SO cada vez.",
    comoFunciona: "Jerarquía de tres niveles: <strong>arenas</strong> (bloques grandes del SO, ~1&nbsp;MiB desde 3.9 — eran 256&nbsp;KB hasta 3.8) → <strong>pools</strong> (una página, ~4&nbsp;KB, cada uno para un tamaño fijo) → <strong>blocks</strong> (los slots, en <em>size classes</em> de 8 en 8 bytes hasta 512). Los objetos grandes (&gt;512&nbsp;B) saltan pymalloc y van directos al SO. Todo bajo el GIL — o con locks finos en free-threading.",
    mito: {
      mito: "«Liberar objetos en Python devuelve la memoria al sistema operativo».",
      realidad: "Muchas veces la memoria vuelve a los pools/arenas de pymalloc para reutilizarse, no al SO. Por eso el proceso puede «no soltar» RAM tras liberar millones de objetos pequeños. Comparable a <code>mcache/mcentral/mheap</code> de Go."
    },
    recursos: [
      { texto: "CPython memory management — devguide", url: "https://devguide.python.org/internals/garbage-collector/" },
      { texto: "Objects/obmalloc.c — comentarios del source", url: "https://github.com/python/cpython/blob/main/Objects/obmalloc.c" },
      { texto: "CPython Internals — Anthony Shaw (cap. memoria)", url: "https://realpython.com/products/cpython-internals-book/" }
    ],
    widgetLabel: "Visualízalo — dónde cae cada objeto",
    widget: { intro: "Objetos pequeños caen en blocks de un pool dentro de la arena; los grandes esquivan todo y van al SO.", pasos: pm }
  });

  // 11 · PyObject ----------------------------------------------------------
  function pyCache(v) {
    var cached = v >= -5 && v <= 256;
    var diag = cached
      ? "<div class='w-nodes'><div class='w-col' style='flex:0 0 90px'><div class='w-kv'><span class='k'>a</span><span class='v'>→</span></div><div class='w-kv'><span class='k'>b</span><span class='v'>→</span></div></div>" +
        "<div class='w-node'><span class='t'>PyObject cacheado · compartido</span><span class='c'>" + v + "</span><span class='t'>ob_type: int</span></div></div>"
      : "<div class='w-nodes'><div class='w-node'><span class='t'>PyObject #1 (a)</span><span class='c'>" + v + "</span></div><div class='w-node'><span class='t'>PyObject #2 (b)</span><span class='c'>" + v + "</span></div></div>";
    var pill = cached
      ? "<span class='w-pill ok'>a is b → True</span> <span class='w-mono' style='color:var(--color-fg-faint)'>mismo objeto (cache)</span>"
      : "<span class='w-pill bad'>a is b → False</span> <span class='w-mono' style='color:var(--color-fg-faint)'>objetos distintos</span>";
    return "<div class='w-col'>" + diag +
      "<div class='w-box'><span class='w-tag'>cache de enteros pequeños: −5 … 256</span><div class='w-mono' style='margin-top:6px'>a = " + v + "; b = " + v + "; a is b</div></div>" +
      "<div>" + pill + "</div></div>";
  }
  var po = [
    { v: 100, nota: "a = 100; b = 100. 100 está en el cache de enteros pequeños: ambas variables apuntan al MISMO objeto pre-creado.", tone: "ok" },
    { v: 256, nota: "256 es el borde superior del cache. Sigue compartido: a is b es True.", tone: "ok" },
    { v: 257, nota: "257 ya no está cacheado: cada asignación crea su propio PyObject. a is b es False.", tone: "bad" },
    { v: 1000, nota: "Con 1000, dos objetos distintos con el mismo valor. == daría True, pero is (identidad) da False.", tone: "bad" }
  ];
  T.push({
    slug: "pyobject", folio: "11", bloque: 3, fam: 3, dificultad: 2, estrella: false,
    cardTitulo: "Todo es un objeto: PyObject",
    titulo: "Todo es un objeto: PyObject, tipos y caching",
    tagline: "Refcount + puntero a tipo en cada objeto. Las variables son etiquetas, no cajas; y el cache de enteros.",
    evita: "Fiarte de «is» para comparar valores.",
    lede: "Un <span class='mono'>3</span>, una función, una clase, un tipo: todos son <span class='mono'>PyObject</span> con un contador y un puntero a su tipo. Por eso <em>las variables son etiquetas, no cajas</em>.",
    enBreve: [
      "Todo objeto es un <code>PyObject</code> con, al menos, <code>ob_refcnt</code> y <code>ob_type</code>.",
      "Asignar una variable <b>no copia</b>: cuelga otra etiqueta del mismo objeto.",
      "El tipo define el comportamiento vía <em>type slots</em> (<code>tp_hash</code>, <code>nb_add</code>…).",
      "Los enteros <b>−5 a 256</b> están pre-creados y compartidos; algunas cadenas se internan."
    ],
    fundamento: "En Python <strong>todo es un objeto</strong>. Cada uno es un <code>PyObject</code> con, al menos, un <strong>contador de referencias</strong> y un <strong>puntero a su tipo</strong>. Entender esto explica por qué asignar una variable no copia nada: solo cuelga otra etiqueta del mismo objeto.",
    fuerza: "Si toda variable es una etiqueta hacia un objeto compartido, el modelo de «cajas que contienen valores» falla — y con él muchos bugs de mutabilidad e identidad (<code>is</code> vs <code>==</code>).",
    comoFunciona: "Un <code>PyObject</code> guarda <code>ob_refcnt</code> y <code>ob_type</code>. El tipo define el comportamiento vía <em>type slots</em> (punteros a C: <code>tp_hash</code>, <code>tp_call</code>, <code>nb_add</code>…). Como crear objetos cuesta, CPython <strong>cachea</strong> los comunes: los <strong>enteros pequeños (−5 a 256)</strong> están pre-creados y compartidos, y algunas cadenas se <em>internan</em>. Por eso <code>a = 100; b = 100; a is b</code> es <code>True</code>, pero con <code>1000</code> puede ser <code>False</code>.",
    mito: {
      mito: "«<code>is</code> compara valores, como <code>==</code>».",
      realidad: "<code>is</code> compara <em>identidad</em> (¿el mismo objeto en memoria?). Funciona «por casualidad» con enteros pequeños por el cache, y falla fuera de él. Para comparar valores, siempre <code>==</code>."
    },
    recursos: [
      { texto: "Facts and myths about Python names and values — Ned Batchelder", url: "https://nedbatchelder.com/text/names.html" },
      { texto: "Your Guide to the CPython Source Code", url: "https://realpython.com/cpython-source-code-guide/" },
      { texto: "CPython Internals — Anthony Shaw", url: "https://realpython.com/products/cpython-internals-book/" }
    ],
    widgetLabel: "Visualízalo — el cache de enteros pequeños",
    widget: { intro: "Cambia el valor y mira cuándo a y b comparten objeto (cache) y cuándo no.", pasos: po.map(function (s) { return { vis: pyCache(s.v), nota: s.nota, tone: s.tone }; }) }
  });

})(window.GUIA = window.GUIA || {});
