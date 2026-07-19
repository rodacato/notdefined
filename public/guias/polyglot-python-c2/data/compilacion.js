/* data/compilacion.js — Bloque 1 · Compilación y ejecución.
   Cómo pasa tu .py a correr. Solo DATOS: temas, textos, ejemplos y el guión
   de cada visualización. Para corregir contenido, se edita únicamente esto. */
(function (G) {
  "use strict";
  var T = G.data.temas;

  // 01 · Pipeline -----------------------------------------------------------
  T.push({
    slug: "pipeline", folio: "01", bloque: 1, fam: 1, dificultad: 2, estrella: false,
    cardTitulo: "El pipeline de ejecución",
    titulo: "El pipeline de ejecución de Python",
    tagline: "Fuente → tokenizer → AST → compilador → bytecode → eval loop. Y por qué existen los .pyc.",
    evita: "No es interpretar el texto línea por línea.",
    lede: "Tu <span class='mono'>.py</span> no se ejecuta como texto línea por línea: primero se <em>compila a bytecode</em>, y luego una máquina virtual lo interpreta.",
    enBreve: [
      "El fuente pasa por <b>tokenizer → AST → compilador → bytecode</b> antes de ejecutar nada.",
      "El bytecode se empaqueta en objetos <b>code</b> y lo corre el <b>eval loop</b> (ceval).",
      "Los <b>.pyc</b> de <code>__pycache__/</code> son ese bytecode cacheado para no recompilar.",
      "Un <code>SyntaxError</code> salta en la <b>compilación</b>, antes de ejecutar una sola línea."
    ],
    fundamento: "Entender esta cadena ubica todo lo demás. Cuando corres un archivo, CPython lo lleva por varias transformaciones antes de que nada «pase»: lo trocea, lo entiende como estructura, lo compila a instrucciones y solo entonces las ejecuta. También explica esos <code>.pyc</code> que aparecen en <code>__pycache__/</code>: son el bytecode ya compilado, cacheado para no repetir el trabajo.",
    fuerza: "Separar «compilar» de «ejecutar» es lo que permite cachear el bytecode y, después, optimizarlo en caliente sin tocar tu código fuente.",
    comoFunciona: "El fuente pasa por el <strong>tokenizer</strong> (lo trocea en tokens), luego se arma el <strong>AST</strong> (árbol sintáctico), el <strong>compilador</strong> emite <strong>bytecode</strong> empaquetado en objetos <em>code</em> — que se cachean en <code>__pycache__/*.pyc</code> — y por último el <strong>eval loop</strong> (<code>ceval</code>), una máquina de pila, ejecuta ese bytecode. Puedes verlo con <code>ast.dump()</code>, <code>compile()</code> y <code>dis.dis()</code>.",
    mito: {
      mito: "«Python es interpretado, así que lee y ejecuta el texto línea por línea».",
      realidad: "Hay una fase de <em>compilación</em> real a bytecode; lo interpretado es ese bytecode, no tu texto. Por eso existe el <code>.pyc</code> y por eso un <code>SyntaxError</code> salta antes de ejecutar nada."
    },
    recursos: [
      { texto: "CPython Internals — Anthony Shaw", url: "https://realpython.com/products/cpython-internals-book/", nota: "leer el source de CPython" },
      { texto: "Python Developer's Guide — compiler", url: "https://devguide.python.org/internals/compiler/" },
      { texto: "Módulos de la stdlib: ast, dis, compile()" }
    ],
    widgetLabel: "Visualízalo — el mismo snippet, etapa a etapa",
    widget: {
      tipo: "etapas",
      intro: "El mismo x = a + b recorriendo las cinco etapas. A partir del bytecode, el resultado se cachea en __pycache__.",
      cacheLabel: "caché __pycache__ · modulo.pyc escrito", cacheDesde: 3,
      etapas: [
        { k: "Fuente", rep: "x = a + b", nota: "Tu texto, tal cual lo escribes." },
        { k: "Tokens", rep: "NAME(x) OP(=)\nNAME(a) OP(+) NAME(b)", nota: "El tokenizer trocea el texto en tokens." },
        { k: "AST", rep: "Assign(\n  target=x,\n  value=BinOp(a, Add, b))", nota: "El parser arma el árbol sintáctico: estructura, no texto." },
        { k: "Bytecode", rep: "LOAD_FAST  a\nLOAD_FAST  b\nBINARY_OP  +\nSTORE_FAST x", nota: "El compilador emite instrucciones → objeto code (y se cachea el .pyc)." },
        { k: "Ejecución", rep: "eval loop (ceval)\n→ x = 3", nota: "La máquina de pila ejecuta el bytecode: recién aquí «corre» tu programa." }
      ]
    }
  });

  // 02 · Eval loop ----------------------------------------------------------
  var el2 = [
    { pc: 0, stack: [], loc: "a=1  b=2  x=—", nota: "Pila vacía. El contador de programa apunta a la primera instrucción." },
    { pc: 0, stack: [1], loc: "a=1  b=2  x=—", nota: "LOAD_FAST a: empuja el valor de la local a (=1) a la pila." },
    { pc: 1, stack: [1, 2], loc: "a=1  b=2  x=—", nota: "LOAD_FAST b: empuja el valor de la local b (=2) a la pila." },
    { pc: 2, stack: [3], loc: "a=1  b=2  x=—", nota: "BINARY_OP +: saca b y a (pop-pop), suma, y empuja el resultado (push)." },
    { pc: 3, stack: [], loc: "a=1  b=2  x=3", nota: "STORE_FAST x: saca la cima y la guarda en la local x. Pila vacía otra vez.", tone: "ok" }
  ];
  var INS2 = ["LOAD_FAST  a", "LOAD_FAST  b", "BINARY_OP  +", "STORE_FAST x"];
  T.push({
    slug: "eval-loop", folio: "02", bloque: 1, fam: 1, dificultad: 2, estrella: false,
    cardTitulo: "El eval loop (ceval) y el bytecode",
    titulo: "El eval loop (ceval) y el bytecode",
    tagline: "Un bucle gigante que ejecuta bytecode sobre una pila de valores. Ahí «corre» tu programa.",
    evita: "Confundir la máquina de pila con registros.",
    lede: "El corazón de CPython es un bucle gigante que lee bytecode una instrucción a la vez y lo ejecuta sobre una <em>pila de valores</em>. Ahí «corre» tu programa.",
    enBreve: [
      "Cada función tiene un objeto <b>code</b> con su bytecode.",
      "El <code>ceval</code> es una <b>máquina de pila</b>: opera con push y pop, sin registros con nombre.",
      "Instrucciones como <code>LOAD_FAST</code>, <code>BINARY_OP</code> y <code>STORE_FAST</code> mueven la pila.",
      "Ves el desensamblado real con <code>dis.dis()</code>."
    ],
    fundamento: "Cada función tiene un objeto <em>code</em> con su bytecode. El <code>ceval</code> es una <strong>máquina de pila</strong>: no tiene registros con nombre, opera empujando (<code>push</code>) y sacando (<code>pop</code>) valores de una pila. Ese bucle es, literalmente, «dónde corre» tu programa.",
    fuerza: "Una máquina de pila es diminuta de implementar y fácil de portar: por eso CPython la eligió — el precio es más instrucciones por operación que una máquina de registros.",
    comoFunciona: "Instrucciones como <code>LOAD_FAST</code>, <code>LOAD_CONST</code>, <code>BINARY_OP</code> y <code>STORE_FAST</code> empujan y sacan valores. La expresión <code>x = a + b</code> se convierte, más o menos, en: cargar <code>a</code>, cargar <code>b</code>, sumar (<em>pop-pop-push</em>), y guardar en <code>x</code>. El desensamblado real lo da <code>dis.dis()</code>.",
    mito: {
      mito: "«El bytecode es como el ensamblador de un CPU».",
      realidad: "Un CPU real es una máquina de <em>registros</em>; el <code>ceval</code> es una máquina de <em>pila</em>. Buen contraste con la máquina de pila YARV de Ruby y la de registros Ignition de JavaScript: mismo objetivo, ergonomías internas distintas."
    },
    recursos: [
      { texto: "CPython Internals — Anthony Shaw", url: "https://realpython.com/products/cpython-internals-book/" },
      { texto: "Your Guide to the CPython Source Code", url: "https://realpython.com/cpython-source-code-guide/" },
      { texto: "Módulo dis · fuente Python/ceval.c" }
    ],
    widgetLabel: "Visualízalo — un «debugger» de la pila",
    widget: {
      intro: "Ejecuta x = a + b instrucción a instrucción y mira cómo cambia la pila de valores.",
      pasos: el2.map(function (s) {
        var code = INS2.map(function (ins, i) {
          var tag = i === s.pc ? "hl" : (i < s.pc ? "dim" : "");
          return "<span class='" + tag + "'>" + String(i * 2).padStart(2, " ") + "  " + ins + "</span>";
        }).join("\n");
        var cells = s.stack.length
          ? s.stack.map(function (v) { return "<div class='w-cell on'>" + v + "</div>"; }).join("")
          : "<div class='w-cell'>·</div>";
        var vis = "<div class='w-row'>" +
          "<div class='w-grow'><div class='w-tag'>bytecode · dis.dis</div><pre class='w-code'>" + code + "</pre></div>" +
          "<div class='w-col' style='flex:0 0 150px'>" +
          "<div class='w-tag'>pila de valores (↑ cima)</div><div class='w-cells'>" + cells + "</div>" +
          "<div class='w-tag'>locales</div><div class='w-mono'>" + s.loc + "</div></div></div>";
        return { vis: vis, nota: s.nota, tone: s.tone };
      })
    }
  });

  // 03 · Generadores y frames (NUEVO) --------------------------------------
  var GEN_CODE = ["def cuenta():", "    n = 0", "    while True:", "        yield n", "        n += 1"];
  var gen = [
    { pc: -1, n: "—", out: "—", nota: "Llamar cuenta() NO ejecuta el cuerpo: crea un generador con su frame suspendido antes de la primera línea." },
    { pc: 3, n: "0", out: "0", nota: "next(): corre hasta el primer yield. n=0, devuelve 0 y CONGELA el frame justo ahí (guarda n y el contador de programa)." },
    { pc: 3, n: "1", out: "1", nota: "next() otra vez: reanuda DESPUÉS del yield → n+=1 → n=1, vuelve al yield y devuelve 1." },
    { pc: 3, n: "2", out: "2", nota: "next(): n=2, devuelve 2. El frame sobrevive entre llamadas — una lista ya estaría toda materializada en memoria." },
    { pc: 3, n: "2", out: "await", nota: "async/await se monta ENCIMA de esto: una corrutina es un generador reanudable, y cada await cede el control al event loop igual que este yield lo cede al que llama.", tone: "ok" }
  ];
  T.push({
    slug: "generadores", folio: "03", bloque: 1, fam: 1, dificultad: 2, estrella: false,
    cardTitulo: "Generadores y frames por dentro",
    titulo: "Generadores y frames por dentro",
    tagline: "El frame suspendido: yield como pausa del eval loop, send/throw, y cómo async/await se monta encima.",
    evita: "Pensar que un generador es una lista floja.",
    lede: "Un generador es un <em>frame que se pausa</em>: <span class='mono'>yield</span> detiene el eval loop guardando su estado, y cada <span class='mono'>next()</span> lo reanuda donde quedó.",
    enBreve: [
      "Llamar a la función generadora <b>no ejecuta el cuerpo</b>: crea un objeto generador con su frame.",
      "<code>yield</code> <b>suspende</b> el frame (locales + contador de programa) y devuelve el control a quien llamó.",
      "<code>send()</code> reanuda pasando un valor al yield; <code>throw()</code> inyecta una excepción en el frame.",
      "Una <b>corrutina</b> (async def) es este mismo mecanismo: <code>await</code> es el yield hacia el event loop."
    ],
    fundamento: "Un generador es la prueba de que el <em>frame</em> de ejecución es un objeto de primera clase. Normalmente un frame nace al llamar una función y muere al volver; un generador lo mantiene vivo y <strong>suspendido</strong> entre llamadas. Esa maquinaria de pausar y reanudar un frame es exactamente sobre la que se construye <code>async/await</code>.",
    fuerza: "Poder congelar y reanudar un frame convierte el streaming perezoso (procesar sin materializar todo) y la concurrencia cooperativa en el MISMO mecanismo, no en dos features separadas.",
    comoFunciona: [
      "Al llamar a una función con <code>yield</code>, Python no corre nada: devuelve un <strong>generador</strong> con un frame propio parado al inicio. Cada <code>next()</code> ejecuta hasta el siguiente <code>yield</code>, que <strong>guarda</strong> las locales y el contador de programa y devuelve el valor; el siguiente <code>next()</code> <strong>reanuda</strong> justo después.",
      "<code>send(x)</code> reanuda haciendo que el <code>yield</code> evalúe a <code>x</code>; <code>throw()</code> lanza una excepción dentro del frame; <code>close()</code> lo termina. Las <strong>corrutinas</strong> de <code>asyncio</code> son generadores reanudables: <code>await</code> cede el control al event loop igual que <code>yield</code> lo cede a quien llama."
    ],
    mito: {
      mito: "«Un generador es una lista perezosa: al final tiene los mismos elementos guardados».",
      realidad: "No guarda elementos: guarda un <em>frame en pausa</em> que produce el siguiente valor cuando se lo pides. Puede ser infinito (<code>while True</code>) y ocupa memoria constante, cosa imposible para una lista."
    },
    recursos: [
      { texto: "Generators — Python docs (howto/functional)", url: "https://docs.python.org/3/howto/functional.html#generators" },
      { texto: "PEP 342 — Coroutines via Enhanced Generators", url: "https://peps.python.org/pep-0342/" },
      { texto: "Generators & coroutines — David Beazley", url: "https://www.dabeaz.com/coroutines/" }
    ],
    widgetLabel: "Visualízalo — el frame que se pausa",
    widget: {
      intro: "Un generador que cuenta sin fin. Fíjate en que el frame (n y el contador de programa) sobrevive entre cada next().",
      pasos: gen.map(function (s) {
        var code = GEN_CODE.map(function (ln, i) {
          return "<span class='" + (i === s.pc ? "hl" : "") + "'>" + ln + "</span>";
        }).join("\n");
        var frame = s.pc === -1
          ? "<div class='w-node dim'><span class='t'>frame</span><span class='v'>suspendido al inicio</span></div>"
          : "<div class='w-node'><span class='t'>frame · local n</span><span class='c'>" + s.n + "</span></div>";
        var out = "<div class='w-node' style='flex:0 0 130px'><span class='t'>devuelto</span><span class='v'>" + s.out + "</span></div>";
        var vis = "<div class='w-row'><pre class='w-code w-grow'>" + code + "</pre>" +
          "<div class='w-col' style='flex:0 0 210px'>" + frame + out + "</div></div>";
        return { vis: vis, nota: s.nota, tone: s.tone };
      })
    }
  });

  // 04 · Import system (NUEVO) ---------------------------------------------
  function cacheBox(items, hi) {
    var rows = items.length
      ? items.map(function (m) { return "<div class='w-kv" + (m === hi ? " hit" : "") + "'><span class='k'>'" + m + "'</span><span class='v'>&lt;module&gt;</span></div>"; }).join("")
      : "<div class='w-mono' style='color:var(--color-fg-faint)'>(vacío)</div>";
    return "<div class='w-box w-grow'><div class='w-tag'>sys.modules · caché</div><div class='w-col' style='gap:5px;margin-top:7px'>" + rows + "</div></div>";
  }
  var imp = [
    { vis: "<div class='w-row'>" + cacheBox([], null) + "<div class='w-box' style='flex:0 0 210px'><div class='w-tag'>import foo</div><div class='w-mono' style='margin-top:8px'>1 · ¿está en sys.modules?</div><div class='w-pill bad' style='margin-top:8px'>no está</div></div></div>",
      nota: "import foo mira primero sys.modules (la caché de módulos ya cargados). Está vacía: hay que cargarlo." },
    { vis: "<div class='w-chips'><span class='w-chip active'>sys.meta_path</span><span class='w-arrow on'>→</span><span class='w-chip done'>finder</span><span class='w-arrow on'>→</span><span class='w-chip done'>ModuleSpec</span></div>",
      nota: "2 · Recorre los finders de sys.meta_path. Uno encuentra foo y devuelve un spec: dónde está y qué loader lo carga." },
    { vis: "<div class='w-row'>" + cacheBox(["foo"], "foo") + "<div class='w-box' style='flex:0 0 210px'><div class='w-tag'>loader</div><div class='w-mono' style='margin-top:8px'>3 · crea el módulo<br>lo mete en sys.modules<br><b>y LUEGO</b> ejecuta su código</div></div></div>",
      nota: "3 · El loader crea el módulo y lo registra en sys.modules ANTES de ejecutarlo — ese orden es lo que hace que los imports circulares no entren en bucle infinito.", tone: "ok" },
    { vis: "<div class='w-row'>" + cacheBox(["foo"], "foo") + "<div class='w-box' style='flex:0 0 210px'><div class='w-tag'>import foo (otra vez)</div><div class='w-pill ok' style='margin-top:8px'>hit de caché</div><div class='w-mono' style='margin-top:8px'>se devuelve tal cual<br>sin re-ejecutar</div></div></div>",
      nota: "4 · Un segundo import foo encuentra el módulo en sys.modules y lo devuelve tal cual: el código del módulo NO se vuelve a ejecutar." },
    { vis: "<div class='w-chips'><span class='w-chip done'>A importa B</span><span class='w-arrow on'>→</span><span class='w-chip active'>B importa A</span><span class='w-arrow on'>→</span><span class='w-chip'>A a medio ejecutar</span></div>",
      nota: "5 · Circular: si A importa B y B importa A, B encuentra A en sys.modules pero solo con lo definido hasta esa línea. De ahí los ImportError raros: el nombre existe, pero aún no.", tone: "warn" }
  ];
  T.push({
    slug: "import-system", folio: "04", bloque: 1, fam: 1, dificultad: 2, estrella: false,
    cardTitulo: "El import system por dentro",
    titulo: "El import system por dentro",
    tagline: "Finders y loaders, sys.modules como caché, el orden real de resolución y por qué truena el import circular.",
    evita: "Creer que importar dos veces re-ejecuta el módulo.",
    lede: "<span class='mono'>import</span> no es magia: es una búsqueda por <em>finders</em>, una caché en <span class='mono'>sys.modules</span> y un <em>loader</em> que ejecuta el módulo una sola vez.",
    enBreve: [
      "<code>sys.modules</code> es la <b>caché</b>: un módulo ya importado no se vuelve a ejecutar.",
      "Los <b>finders</b> de <code>sys.meta_path</code> localizan el módulo y devuelven un <code>ModuleSpec</code>.",
      "El <b>loader</b> registra el módulo en <code>sys.modules</code> <b>antes</b> de ejecutar su código.",
      "El <b>import circular</b> truena porque ve el módulo a medio ejecutar, con solo lo definido hasta esa línea."
    ],
    fundamento: "Cada <code>import</code> es una búsqueda con caché. Saber el orden — caché primero, luego finders, luego el loader que ejecuta el módulo <strong>una vez</strong> — explica por qué re-importar es gratis, por qué el estado a nivel de módulo persiste, y exactamente dónde y por qué revienta un import circular.",
    fuerza: "Registrar el módulo en <code>sys.modules</code> antes de ejecutarlo evita recargas infinitas y permite (con cuidado) los ciclos — a cambio de que un import circular vea una versión a medio construir.",
    comoFunciona: [
      "<code>import foo</code> mira primero <code>sys.modules</code>; si está, lo devuelve y termina. Si no, recorre los <strong>finders</strong> de <code>sys.meta_path</code> hasta que uno devuelve un <code>ModuleSpec</code> (dónde está y qué <strong>loader</strong> usar).",
      "El loader crea el objeto módulo, lo <strong>inserta en <code>sys.modules</code></strong> y solo entonces ejecuta su código de arriba a abajo. Por eso un segundo import es un simple hit de caché, y por eso en un ciclo A↔B el segundo módulo encuentra al primero <em>a medio ejecutar</em>."
    ],
    mito: {
      mito: "«Importar el mismo módulo dos veces lo ejecuta dos veces».",
      realidad: "Solo la primera vez ejecuta el código; las siguientes son un hit de <code>sys.modules</code>. Para forzar la re-ejecución hay que usar <code>importlib.reload()</code> explícitamente."
    },
    recursos: [
      { texto: "The import system — Python docs", url: "https://docs.python.org/3/reference/import.html" },
      { texto: "importlib — docs oficiales", url: "https://docs.python.org/3/library/importlib.html" },
      { texto: "PEP 328 / PEP 451 (imports y ModuleSpec)", url: "https://peps.python.org/pep-0451/" }
    ],
    widgetLabel: "Visualízalo — la resolución de un import",
    widget: { intro: "Sigue import foo desde la caché vacía hasta el hit de caché — y qué pasa con un ciclo.", pasos: imp }
  });

  // 05 · Intérprete adaptativo + JIT ---------------------------------------
  T.push({
    slug: "adaptativo", folio: "05", bloque: 1, fam: 1, dificultad: 3, estrella: false,
    cardTitulo: "Intérprete adaptativo + JIT",
    titulo: "El intérprete adaptativo especializado + el JIT",
    tagline: "Especializa bytecode por tipo en caliente (PEP 659) y cose traces con copy-and-patch (PEP 744).",
    evita: "Esperar el JIT de V8: llega por fases.",
    lede: "Python acelera por dentro sin cambiar el lenguaje: <em>observa qué tipos aparecen y especializa el bytecode</em> para esos casos comunes.",
    enBreve: [
      "Desde <b>3.11</b>: el intérprete <b>adaptativo especializado</b> (PEP 659).",
      "Instrucciones genéricas se reescriben en caliente a versiones por tipo (<code>BINARY_OP_ADD_INT</code>).",
      "Si la suposición falla, se <b>des-especializa</b> — barato, la región es diminuta.",
      "Desde <b>3.13</b>: un <b>JIT experimental</b> (PEP 744) con copy-and-patch."
    ],
    fundamento: "Python tiene fama de lento, y desde <strong>3.11</strong> el equipo core lo acelera sin tocar la sintaxis. La idea es la de los JIT de Ruby o JavaScript, pero llegando <em>por fases</em>: primero especialización barata dentro del propio intérprete, después un JIT experimental.",
    fuerza: "El 99% del código de un bucle caliente ve siempre los mismos tipos. Especializar para ese caso y revertir barato cuando falla es casi todo el rendimiento «gratis».",
    comoFunciona: [
      "<strong>Adaptativo (PEP 659, 3.11+):</strong> instrucciones genéricas como <code>BINARY_OP</code> se <em>reescriben en caliente</em> a versiones especializadas (<code>BINARY_OP_ADD_INT</code>) cuando se observa un tipo consistente. Si la suposición falla, se <em>des-especializa</em> — barato de revertir porque la región es diminuta.",
      "<strong>JIT (PEP 744, 3.13+):</strong> identifica <em>traces</em> calientes y usa <strong>copy-and-patch</strong> — en build, LLVM genera una plantilla por micro-op; en runtime esas plantillas se <em>cosen</em> en memoria ejecutable, parcheando constantes y direcciones."
    ],
    mito: {
      mito: "«Python 3.13 ya tiene un JIT que lo hace tan rápido como Java».",
      realidad: "El JIT es <em>experimental</em> y la mayor parte de la ganancia hoy viene de la especialización adaptativa. El copy-and-patch prioriza compilar rápido y simple, no generar el mejor código posible."
    },
    recursos: [
      { texto: "PEP 659 — Specializing Adaptive Interpreter", url: "https://peps.python.org/pep-0659/" },
      { texto: "PEP 744 — JIT Compilation", url: "https://peps.python.org/pep-0744/" },
      { texto: "What is CPython's JIT Compiler? — pydevtools", url: "https://pydevtools.com/handbook/explanation/what-is-cpythons-jit-compiler/" }
    ],
    widgetLabel: "Visualízalo — especialización y ensamblado",
    widget: {
      intro: "Dos mecanismos, dos vistas: la especialización por tipo (PEP 659) y el JIT copy-and-patch (PEP 744).",
      vistas: [
        {
          id: "spec", label: "Especialización · PEP 659",
          pasos: [
            { vis: "<div class='w-nodes'><div class='w-node'><span class='t'>genérica</span><span class='v'>BINARY_OP</span></div></div>", nota: "BINARY_OP genérica: mira el tipo de los operandos en cada ejecución." },
            { vis: "<div class='w-chips'><span class='w-chip done'>int</span><span class='w-chip done'>int</span><span class='w-chip active'>int</span><span class='w-chip'>…</span></div>", nota: "Observa int, int, int… El intérprete lleva la cuenta de una suposición estable." },
            { vis: "<div class='w-nodes'><div class='w-node'><span class='t'>especializada</span><span class='v'>BINARY_OP_ADD_INT</span></div></div>", nota: "Umbral alcanzado: se reescribe a BINARY_OP_ADD_INT. Asume int y suma directo, sin re-mirar el tipo.", tone: "ok" },
            { vis: "<div class='w-chips'><span class='w-chip done'>int</span><span class='w-chip done'>int</span><span class='w-chip miss'>str!</span><span class='w-arrow on'>↩</span><span class='w-chip'>BINARY_OP</span></div>", nota: "Llega un str: la suposición falla → se des-especializa de vuelta a la genérica. Revertir es barato porque la región es diminuta.", tone: "warn" }
          ]
        },
        {
          id: "jit", label: "JIT copy-and-patch · PEP 744",
          pasos: [
            { vis: "<div class='w-lane'><span class='lbl'>bucle</span><span class='track'><i style='width:20%'></i></span><span class='st'>iter 200k</span></div>", nota: "Un bucle que se ejecuta muchísimas veces va calentándose. El JIT solo compila lo caliente." },
            { vis: "<div class='w-lane'><span class='lbl'>bucle</span><span class='track'><i class='warn' style='width:100%'></i></span><span class='st'>🔥 caliente</span></div>", nota: "Cruza el umbral: se marca «caliente» y el JIT elige el trace a compilar." },
            { vis: "<div class='w-chips'><span class='w-chip done'>_LOAD_FAST</span><span class='w-chip done'>_BINARY_OP_ADD_INT</span><span class='w-chip active'>_STORE_FAST</span></div>", nota: "copy-and-patch: plantillas LLVM generadas en build se cosen en memoria ejecutable, parcheando constantes y direcciones." },
            { vis: "<div class='w-pill ok'>✓ código máquina listo — el trace corre sin pasar por el intérprete</div>", nota: "El trace ya es código máquina: se ejecuta directo, sin el overhead del eval loop.", tone: "ok" }
          ]
        }
      ]
    }
  });

})(window.GUIA = window.GUIA || {});
