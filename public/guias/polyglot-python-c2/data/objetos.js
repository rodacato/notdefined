/* data/objetos.js — Bloque 4 · Modelo de objetos y estructuras. */
(function (G) {
  "use strict";
  var T = G.data.temas;

  // 12 · MRO ---------------------------------------------------------------
  function mroChain(states) {
    var cls = ["D", "B", "C", "A", "object"];
    return "<div class='w-chips'>" + cls.map(function (c, i) {
      var s = states[i] || "";
      var arrow = i > 0 ? "<span class='w-arrow" + (states[i - 1] ? " on" : "") + "'>›</span>" : "";
      return arrow + "<span class='w-chip " + s + "'>" + c + "</span>";
    }).join("") + "</div>";
  }
  var mro = [
    { vis: mroChain(["", "", "", "", ""]), nota: "Diamante: D hereda de B y C; ambas de A; A de object. La linealización C3 da el MRO D → B → C → A → object. Resolvemos d.ping(), con ping() definido en C." },
    { vis: mroChain(["active", "", "", "", ""]), nota: "Empieza por D (la instancia): D no define ping()." },
    { vis: mroChain(["miss", "active", "", "", ""]), nota: "Sigue por B, la siguiente del MRO: tampoco lo define." },
    { vis: mroChain(["miss", "miss", "done", "", ""]), nota: "Lo encuentra en C: recorriendo el MRO de izquierda a derecha, gana la primera clase que lo define.", tone: "ok" }
  ];
  function descFlow(active) {
    var f = ["c.area", "property en Rect", "area.__get__(c)", "return w*h → 24"];
    return "<div class='w-chips'>" + f.map(function (t, i) {
      var s = i < active ? "done" : (i === active ? "active" : "");
      var arrow = i > 0 ? "<span class='w-arrow" + (i <= active ? " on" : "") + "'>→</span>" : "";
      return arrow + "<span class='w-chip " + s + "'>" + t + "</span>";
    }).join("") + "</div>";
  }
  var desc = [
    { vis: descFlow(0), nota: "Escribes c.area — Python empieza el lookup del atributo 'area'." },
    { vis: descFlow(1), nota: "Lo encuentra en el tipo: es un descriptor de datos (una property con __get__)." },
    { vis: descFlow(2), nota: "En vez de devolver un valor guardado, llama a area.__get__(c, Rect)." },
    { vis: descFlow(3), nota: "El getter calcula w * h al vuelo. area NO es un dato almacenado: es código.", tone: "ok" }
  ];
  function slotsView(withDict) {
    var layout = withDict
      ? "<div class='w-col'><div class='w-surface w-mono'>PyObject header (refcnt, type)</div><div class='w-surface w-mono' style='background:var(--warn-bg);border-color:var(--warn)'>__dict__ → hash table {x, y} (crece, flexible)</div></div>"
      : "<div class='w-col'><div class='w-surface w-mono'>PyObject header (refcnt, type)</div><div class='w-row'><div class='w-surface w-mono w-grow' style='background:color-mix(in srgb,var(--fam-4) 14%,var(--color-bg-surface));border-color:var(--fam-4)'>slot x</div><div class='w-surface w-mono w-grow' style='background:color-mix(in srgb,var(--fam-4) 14%,var(--color-bg-surface));border-color:var(--fam-4)'>slot y</div></div></div>";
    var bytes = withDict ? 152 : 56;
    var bar = "<div style='margin-top:12px'><div class='w-tag'>memoria por instancia (aprox.) — " + bytes + " B</div>" +
      "<div class='w-lane' style='margin-top:6px'><span class='track'><i class='" + (withDict ? "warn" : "ok") + "' style='width:" + (bytes / 152 * 100) + "%'></i></span></div></div>";
    return layout + bar;
  }
  T.push({
    slug: "mro", folio: "12", bloque: 4, fam: 4, dificultad: 3, estrella: false,
    cardTitulo: "MRO (C3), descriptores y __slots__",
    titulo: "Attribute lookup: MRO (C3), descriptores y <span class='mono'>__slots__</span>",
    tagline: "Qué ocurre en obj.atributo: la cadena C3 del MRO y el protocolo de descriptores detrás de property.",
    evita: "Ignorar el orden con herencia múltiple.",
    lede: "Escribir <span class='mono'>obj.atributo</span> desata más de lo que parece: una cadena ordenada de clases (el <em>MRO</em>) y el protocolo de descriptores.",
    enBreve: [
      "El <b>MRO</b> se calcula con <b>linealización C3</b>: un orden único y determinista.",
      "Lookup de <code>obj.x</code>: descriptores de datos → <code>obj.__dict__</code> → atributos de clase.",
      "Los <b>descriptores</b> (<code>__get__/__set__</code>) están detrás de <code>property</code>, métodos y <code>classmethod</code>.",
      "<code>__slots__</code> quita el <code>__dict__</code> por instancia: menos memoria, acceso más rápido."
    ],
    fundamento: "Entender el <em>lookup</em> de atributos explica de golpe la herencia múltiple, <code>property</code>, los métodos y <code>__slots__</code>. Es el análogo de la cadena de ancestros de Ruby y de la prototype chain de JavaScript — pero con un orden calculado de forma determinista.",
    fuerza: "Con herencia múltiple, «¿qué método gana?» no puede ser ambiguo. La linealización C3 da una única respuesta determinista, consistente con el orden de las bases.",
    comoFunciona: "El <strong>MRO</strong> se calcula con <strong>linealización C3</strong>. La búsqueda de <code>obj.x</code> mira: descriptores de datos en el tipo (por el MRO) → <code>obj.__dict__</code> → descriptores de no-datos y atributos de clase. Los <strong>descriptores</strong> (<code>__get__/__set__</code>) son el mecanismo detrás de <code>property</code>, métodos y <code>classmethod</code>. <strong><code>__slots__</code></strong> elimina el <code>__dict__</code> por instancia para ahorrar memoria y acelerar el acceso.",
    mito: {
      mito: "«Con herencia múltiple, Python busca en profundidad y a la izquierda».",
      realidad: "Usa C3, que NO es un simple recorrido en profundidad: garantiza que una subclase preceda a sus bases y respeta el orden local. Por eso a veces el orden «sorprende» — pero siempre es consistente."
    },
    recursos: [
      { texto: "The Python 2.3 Method Resolution Order — docs (C3)", url: "https://docs.python.org/3/howto/mro.html" },
      { texto: "Descriptor HowTo Guide — docs (Raymond Hettinger)", url: "https://docs.python.org/3/howto/descriptor.html" },
      { texto: "Módulos: type.__mro__, inspect" }
    ],
    widgetLabel: "Visualízalo — el MRO, los descriptores y los slots",
    widget: {
      intro: "Tres piezas del lookup de atributos: el orden C3, un descriptor en acción y qué ahorra __slots__.",
      vistas: [
        { id: "mro", label: "MRO (C3)", pasos: mro },
        { id: "desc", label: "Descriptores", pasos: desc },
        { id: "slots", label: "__slots__", pasos: [
          { vis: slotsView(true), nota: "Sin __slots__, cada instancia lleva un __dict__ (hash table) para admitir atributos arbitrarios: flexible, pero pesado con millones de instancias." },
          { vis: slotsView(false), nota: "__slots__ reemplaza el __dict__ por atributos de tamaño fijo: menos memoria y acceso más rápido, a cambio de no poder añadir atributos nuevos en runtime.", tone: "ok" }
        ] }
      ]
    }
  });

  // 13 · dict --------------------------------------------------------------
  var DENT = [
    { key: "'name'", val: "'Ada'", slot: 3 },
    { key: "'age'", val: "36", slot: 6 },
    { key: "'city'", val: "'London'", slot: 4, col: 3 },
    { key: "'role'", val: "'eng'", slot: 1 }
  ];
  function dictView(n) {
    var dense = DENT.slice(0, n).map(function (e, i) {
      return "<div class='w-kv'><span class='k'>[" + i + "] " + e.key + "</span><span class='v'>" + e.val + " · slot " + e.slot + "</span></div>";
    }).join("");
    return "<div class='w-box'><div class='w-tag'>array denso de entradas · orden de inserción</div><div class='w-col' style='gap:5px;margin-top:8px'>" + dense + "</div></div>";
  }
  var dct = DENT.map(function (e, i) {
    var nota = i === 2
      ? "Colisión: 'city' quería el slot 3 (ya ocupado por 'name'). Open addressing prueba el siguiente libre — el slot 4."
      : (i === 3 ? "El array denso mantiene el orden name → age → city → role. De ahí que los dicts sean ordenados." : "El hash de la clave elige un slot en la tabla de índices, que apunta a una fila del array denso.");
    return { vis: dictView(i + 1), nota: nota, tone: i === 2 ? "warn" : (i === 3 ? "ok" : undefined) };
  });
  function shareView(share) {
    var bytes = share ? 176 : 312;
    var inst = [["p1", "1, 2"], ["p2", "3, 4"], ["p3", "5, 6"]].map(function (p) {
      return "<div class='w-surface w-grow'><div class='w-mono' style='color:var(--fam-4);font-weight:600'>" + p[0] + " = Point()</div>" +
        (share ? "<div class='w-tag' style='margin-top:5px'>solo valores</div><div class='w-mono'>[" + p[1] + "]</div>"
               : "<div class='w-tag' style='margin-top:5px;color:var(--warn)'>claves + valores</div><div class='w-mono'>{x:" + p[1].split(", ")[0] + ", y:" + p[1].split(", ")[1] + "}</div>") + "</div>";
    }).join("");
    var keys = share ? "<div class='w-box' style='margin-bottom:10px;border-color:var(--fam-4)'><span class='w-tag' style='color:var(--fam-4)'>🔑 tabla de claves compartida { x, y } — guardada UNA vez</span></div>" : "";
    var bar = "<div style='margin-top:12px'><div class='w-tag'>memoria total (3 instancias, aprox.) — " + bytes + " B</div>" +
      "<div class='w-lane' style='margin-top:6px'><span class='track'><i class='" + (share ? "ok" : "warn") + "' style='width:" + (bytes / 312 * 100) + "%'></i></span></div></div>";
    return keys + "<div class='w-row'>" + inst + "</div>" + bar;
  }
  T.push({
    slug: "dict", folio: "13", bloque: 4, fam: 4, dificultad: 2, estrella: false,
    cardTitulo: "dict internals: compact + key-sharing",
    titulo: "dict internals: compact dict y key-sharing",
    tagline: "El motor de Python: array denso ordenado + tabla de índices, y claves compartidas entre instancias.",
    evita: "Olvidar que namespaces y __dict__ son dicts.",
    lede: "El <span class='mono'>dict</span> no es una estructura más: <em>es el motor de Python</em>. Namespaces, atributos, módulos y kwargs son diccionarios.",
    enBreve: [
      "Cada acceso a atributo, global y kwargs pasa por un <code>dict</code>: optimizarlo optimiza todo.",
      "Desde 3.6 es un <b>compact dict</b>: array denso ordenado + tabla de índices pequeña.",
      "El orden de inserción es un <b>efecto del compact dict</b> (garantizado en el lenguaje desde 3.7).",
      "<b>Key-sharing</b>: instancias de una misma clase comparten la tabla de claves."
    ],
    fundamento: "Cómo está hecho por dentro afecta el rendimiento de casi todo el lenguaje: cada acceso a un atributo, cada variable global, cada llamada con kwargs pasa por un <code>dict</code>. Optimizarlo optimiza Python entero.",
    fuerza: "Separar el índice hash (denso, pequeño) del almacén de entradas (ordenado por inserción) hace el dict más compacto, más cacheable y — de regalo — ordenado.",
    comoFunciona: "Desde 3.6 es un <strong>compact dict</strong>: separa un <strong>array denso</strong> de entradas — que preserva el orden de inserción, por eso los dicts son ordenados — de una <strong>tabla de índices</strong> hash más pequeña. Además usa <strong>key-sharing</strong>: instancias de la misma clase <em>comparten</em> la tabla de claves de sus atributos, ahorrando memoria. Resuelve colisiones con <em>open addressing</em> (probing).",
    mito: {
      mito: "«Los dicts empezaron a estar ordenados por una decisión de diseño del lenguaje».",
      realidad: "El orden fue al principio un <em>efecto secundario</em> del compact dict (3.6), y luego se garantizó en el lenguaje (3.7). La estructura vino primero; la promesa, después."
    },
    recursos: [
      { texto: "Modern Python Dictionaries — Raymond Hettinger (PyCon 2017)", url: "https://www.youtube.com/watch?v=npw4s1QTmPg", star: true },
      { texto: "Internals of sets and dicts — devguide", url: "https://devguide.python.org/internals/" },
      { texto: "CPython dictobject.c", url: "https://github.com/python/cpython/blob/main/Objects/dictobject.c" }
    ],
    widgetLabel: "Visualízalo — el orden, las colisiones y las claves compartidas",
    widget: {
      intro: "Inserta claves y mira el array denso ordenado; luego compara la memoria con y sin key-sharing.",
      vistas: [
        { id: "compact", label: "Compact dict", pasos: dct },
        { id: "share", label: "Key-sharing", pasos: [
          { vis: shareView(false), nota: "Sin key-sharing, cada __dict__ repite las claves 'x' e 'y' — desperdicio que se multiplica con miles de instancias." },
          { vis: shareView(true), nota: "Como todas las instancias tienen las MISMAS claves, se guardan una sola vez; cada una almacena solo su array de valores.", tone: "ok" }
        ] }
      ]
    }
  });

  // 14 · list, int, str ----------------------------------------------------
  function listView(len, cap, grew) {
    var cells = "";
    var total = Math.max(cap, 8);
    for (var i = 0; i < total; i++) {
      var on = i < len, res = i >= len && i < cap;
      cells += "<div class='w-cell" + (on ? " on" : "") + "' style='" + (res ? "" : (on ? "" : "opacity:.3")) + "'>" + (on ? "•" : "") + "</div>";
    }
    return "<div class='w-row'><div class='w-node' style='flex:0 0 90px'><span class='t'>len</span><span class='c'>" + len + "</span></div>" +
      "<div class='w-node' style='flex:0 0 90px'><span class='t'>capacidad</span><span class='c' style='color:var(--color-fg-default)'>" + cap + "</span></div>" +
      (grew ? "<div class='w-pill warn'>reasignado → " + cap + "</div>" : "") + "</div>" +
      "<div class='w-box' style='margin-top:10px'><div class='w-cells'>" + cells + "</div><div class='w-tag' style='margin-top:8px'>• usado · ▢ reservado (over-allocation)</div></div>";
  }
  var lst = [
    { vis: listView(0, 0, false), nota: "Lista vacía: len 0, capacidad 0." },
    { vis: listView(1, 4, true), nota: "append(x): len supera la capacidad, así que se reasigna reservando de MÁS (over-allocation) — capacidad 4.", tone: "warn" },
    { vis: listView(4, 4, false), nota: "Tres append más caben en la capacidad reservada: ninguno copia nada. append es O(1) amortizado." },
    { vis: listView(5, 8, true), nota: "El quinto vuelve a superar la capacidad: nueva reasignación con más holgura (8). Guarda punteros, no los valores inline.", tone: "warn" }
  ];
  function intView(e) {
    var bits = e + 1, digits = Math.max(1, Math.ceil(bits / 30));
    var boxes = "";
    for (var i = 0; i < Math.min(digits, 12); i++) boxes += "<div class='w-cell on' style='width:auto;padding:0 9px'>30b</div>";
    if (digits > 12) boxes += "<span class='w-mono'>… +" + (digits - 12) + "</span>";
    return "<div class='w-row'><div class='w-node' style='flex:0 0 110px'><span class='t'>bits necesarios</span><span class='c' style='color:var(--color-fg-default)'>" + bits + "</span></div>" +
      "<div class='w-node' style='flex:0 0 130px'><span class='t'>dígitos de 30 bits</span><span class='c'>" + digits + "</span></div></div>" +
      "<div class='w-box' style='margin-top:10px'><div class='w-tag'>2 ** " + e + " — array de dígitos</div><div class='w-cells' style='margin-top:8px'>" + boxes + "</div></div>";
  }
  var integ = [
    { vis: intView(10), nota: "2 ** 10: cabe en un solo dígito de 30 bits." },
    { vis: intView(100), nota: "2 ** 100: ya no cabe en un entero de máquina. Python usa varios «dígitos» de 30 bits." },
    { vis: intView(300), nota: "2 ** 300 simplemente funciona: el array de dígitos crece según haga falta. No hay tamaño fijo ni desbordamiento.", tone: "ok" }
  ];
  function strView(chars, kind) {
    var name = { 1: "Latin-1 · 1 byte/car", 2: "UCS-2 · 2 bytes/car", 4: "UCS-4 · 4 bytes/car" }[kind];
    var pill = { 1: "ok", 2: "warn", 4: "bad" }[kind];
    var chips = chars.map(function (c) { return "<div class='w-cell' style='width:auto;padding:0 9px;border-style:solid;background:var(--color-bg-surface)'>" + c + "</div>"; }).join("");
    return "<div class='w-box'><div class='w-cells'>" + chips + "</div></div>" +
      "<div class='w-row' style='margin-top:10px;align-items:center'><span class='w-pill " + pill + "'>" + name + "</span>" +
      "<div class='w-node' style='flex:0 0 auto'><span class='t'>memoria del texto</span><span class='v'>" + chars.length + " × " + kind + " = " + (chars.length * kind) + " B</span></div></div>";
  }
  var str = [
    { vis: strView(["H", "o", "l", "a"], 1), nota: "«Hola» es todo ASCII: 1 byte por carácter (Latin-1). El más barato." },
    { vis: strView(["H", "o", "l", "a", "あ"], 2), nota: "Añades un kanji: el mayor code point ya no cabe en 1 byte, así que TODA la cadena sube a 2 bytes/car (UCS-2).", tone: "warn" },
    { vis: strView(["H", "o", "l", "a", "あ", "😀"], 4), nota: "Un emoji fuera del BMP fuerza 4 bytes/car (UCS-4) para toda la cadena: mismo ancho para todos los caracteres.", tone: "bad" }
  ];
  T.push({
    slug: "list-int-str", folio: "14", bloque: 4, fam: 4, dificultad: 2, estrella: false,
    cardTitulo: "list, int y str por dentro",
    titulo: "list, int y str por dentro",
    tagline: "Array dinámico con over-allocation, enteros de precisión arbitraria y strings de 1/2/4 bytes (PEP 393).",
    evita: "Suponer que int se desborda.",
    lede: "Las estructuras de cada día esconden decisiones que explican su rendimiento: por qué <span class='mono'>append</span> es O(1), por qué los <span class='mono'>int</span> no se desbordan, y por qué las cadenas ocupan memoria distinta.",
    enBreve: [
      "<b>list</b>: array dinámico de <b>punteros</b> con over-allocation → append O(1) amortizado.",
      "<b>int</b>: bignum de precisión arbitraria (dígitos de 30 bits) → <code>2**1000</code> funciona.",
      "<b>str</b>: representación flexible (PEP 393) de 1, 2 o 4 bytes por carácter.",
      "Una list guarda <b>referencias</b>, no los valores inline: por eso NumPy es superior para números."
    ],
    fundamento: "Usas <code>list</code>, <code>int</code> y <code>str</code> a todas horas. Sus representaciones internas están diseñadas para el caso común, y conocerlas convierte varios «comportamientos mágicos» en decisiones de ingeniería comprensibles.",
    fuerza: "Reservar de más al crecer (list), usar tantos «dígitos» como hagan falta (int) y tantos bytes por carácter como el texto exija (str): tres formas de pagar solo por lo que usas.",
    comoFunciona: "<strong>list</strong>: un <em>array dinámico de punteros</em> a objetos, con <strong>over-allocation</strong> para que <code>append</code> sea O(1) amortizado — guarda referencias, no valores inline. <strong>int</strong>: <em>precisión arbitraria</em> (bignum), un array de «dígitos» de 30 bits (en builds de 64 bits); por eso <code>2**1000</code> funciona. <strong>str</strong>: representación <em>flexible</em> (PEP 393), 1, 2 o 4 bytes por carácter según el máximo code point (Latin-1 / UCS-2 / UCS-4).",
    mito: {
      mito: "«Una list guarda sus valores, como un array de C».",
      realidad: "Guarda <em>punteros</em> a objetos dispersos por el heap. Por eso una list de un millón de ints ocupa mucho más que un array equivalente — y por qué NumPy, que sí guarda datos contiguos, es tan superior para números."
    },
    recursos: [
      { texto: "CPython listobject.c", url: "https://github.com/python/cpython/blob/main/Objects/listobject.c" },
      { texto: "PEP 393 — Flexible String Representation", url: "https://peps.python.org/pep-0393/" },
      { texto: "CPython Internals — Anthony Shaw", url: "https://realpython.com/products/cpython-internals-book/" }
    ],
    widgetLabel: "Visualízalo — tres estructuras, tres trucos",
    widget: {
      intro: "El over-allocation de list, los dígitos de un int bignum, y cómo str elige su ancho de byte.",
      vistas: [
        { id: "list", label: "list", pasos: lst },
        { id: "int", label: "int", pasos: integ },
        { id: "str", label: "str", pasos: str }
      ]
    }
  });

})(window.GUIA = window.GUIA || {});
