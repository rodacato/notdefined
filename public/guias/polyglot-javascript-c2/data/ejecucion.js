/* ejecucion.js — Bloque 1: pipeline, Ignition, niveles del JIT.
   Sólo datos (guión + pasos de los widgets). La mecánica vive en js/. */
(function (G) {
  "use strict";
  const D = G.data = G.data || { topics: {} };

  D.topics["pipeline-ejecucion"] = {
    slug: "pipeline-ejecucion", folio: "01", tag: "motor", difficulty: "\u25C6\u25C6\u25C7",
    title: "El pipeline de ejecuci\u00f3n",
    tagline: "De texto a c\u00f3digo m\u00e1quina: parser \u2192 AST \u2192 bytecode \u2192 JIT. El mapa que ubica todo lo dem\u00e1s.",
    avoid: "creer que JavaScript es \u00abinterpretado\u00bb a secas: empieza as\u00ed, pero lo caliente se compila.",
    lede: "El motor no ejecuta tu c\u00f3digo como texto. Lo parsea, lo convierte en bytecode y lo va optimizando por niveles seg\u00fan qu\u00e9 tan <em class=\"serif-italic\">caliente</em> est\u00e9. Este es el mapa que ubica todos los dem\u00e1s temas.",
    breve: [
      { k: "Capa", v: "Motor \u00b7 V8" },
      { k: "Entrada", v: "Texto fuente" },
      { k: "Salida", v: "C\u00f3digo m\u00e1quina" },
      { k: "Truco", v: "Lazy parsing" },
    ],
    quees: "<p>Tu programa recorre una <strong>cadena</strong>: fuente \u2192 <strong>parser</strong> \u2192 <strong>AST</strong> \u2192 <strong>Ignition</strong> genera <strong>bytecode</strong> \u2192 se ejecuta y recoge <em class=\"serif-italic\">feedback</em> de tipos \u2192 el c\u00f3digo caliente sube a Sparkplug/Maglev/TurboFan y se compila a c\u00f3digo m\u00e1quina.</p>",
    fundamento: "<p>Compilar todo de golpe ser\u00eda lento y desperdiciar\u00eda memoria. El parser hace un <em class=\"serif-italic\">pre-parse</em> r\u00e1pido: reconoce las funciones pero <strong>no las compila</strong> hasta que se llaman. Lo que nunca se usa, nunca se compila del todo \u2014 eso es <strong>lazy parsing</strong>.</p>",
    como: [
      "El <strong>lexer</strong> parte el texto en tokens: palabras clave, identificadores, operadores, literales.",
      "El <strong>parser</strong> arma un AST que captura la estructura gramatical del c\u00f3digo.",
      "<strong>Ignition</strong> recorre el AST y emite bytecode compacto, con ranuras para el feedback de tipos.",
      "Si el c\u00f3digo se calienta, los <strong>JIT</strong> lo recompilan a c\u00f3digo m\u00e1quina especializado.",
    ],
    mito: "<p>\u00abJavaScript es un lenguaje interpretado.\u00bb A medias: <em class=\"serif-italic\">empieza</em> interpretado (Ignition), pero el c\u00f3digo que importa termina <strong>compilado a c\u00f3digo m\u00e1quina nativo</strong> por los JIT. No es \u00abinterpretado vs compilado\u00bb: es un continuo que se decide en tiempo de ejecuci\u00f3n.</p>",
    recursos: [
      { kind: "Art\u00edculo", star: true, title: "JavaScript Visualized: the JavaScript Engine", sub: "Lydia Hallie \u2014 el pipeline, ilustrado", href: "https://dev.to/lydiahallie/javascript-visualized-the-javascript-engine-4cdf" },
      { kind: "Fuente", title: "V8 blog", sub: "v8.dev \u2014 parser, Ignition y los compiladores", href: "https://v8.dev/blog" },
    ],
    widget: {
      storeKey: "pipeline",
      variants: [{
        id: "greet", label: "pipeline",
        frames: [
          { phase: "C\u00f3digo fuente", codeCap: "snippet.js \u00b7 texto",
            code: ["function greet(name) {", "  return 'Hola, ' + name;", "}", "", "greet('mundo');"],
            cap: "El motor recibe tu c\u00f3digo como <strong>texto plano</strong>. Todav\u00eda no significa nada: es una cadena de caracteres que hay que entender.<br><span class=\"mono\" style=\"font-size:12px;color:var(--color-fg-faint)\">Lazy: el pre-parser nota que greet existe, pero no la compila hasta la llamada.</span>" },
          { phase: "Tokens", codeCap: "flujo de tokens \u00b7 l\u00e9xico",
            code: ["FUNCTION  IDENT(greet)  (", "IDENT(name)  )  {", "RETURN  STRING('Hola, ')", "PLUS  IDENT(name)  }", "IDENT(greet) ( STRING('mundo') )"],
            cap: "El <strong>lexer</strong> parte el texto en tokens: palabras clave, identificadores, operadores, literales. Es el vocabulario del programa, sin gram\u00e1tica todav\u00eda." },
          { phase: "AST", codeCap: "\u00e1rbol sint\u00e1ctico \u00b7 estructura",
            code: ["FunctionDeclaration greet", "\u251C\u2500 params: [name]", "\u2514\u2500 body:", "   \u2514\u2500 Return", "      \u2514\u2500 BinaryExpr (+)", "         \u251C\u2500 'Hola, '", "         \u2514\u2500 name"],
            cap: "El <strong>parser</strong> organiza los tokens en un Abstract Syntax Tree: un \u00e1rbol que captura la estructura y el significado gramatical." },
          { phase: "Bytecode", codeCap: "Ignition bytecode \u00b7 int\u00e9rprete",
            code: ["LdaConstant [0]   // 'Hola, '", "Add a0            // + name", "Return", "", "// feedback vector:", "// slot 0 -> (sin datos aun)"],
            cap: "<strong>Ignition</strong> emite bytecode compacto para su m\u00e1quina de registros. Esto es lo que se ejecuta primero, e incluye ranuras para recoger feedback de tipos.<br><span class=\"mono\" style=\"font-size:12px;color:var(--color-fg-faint)\">Aqu\u00ed greet se compila de verdad \u2014 s\u00f3lo porque la llamamos.</span>" },
          { phase: "C\u00f3digo m\u00e1quina", codeCap: "TurboFan asm (x64) \u00b7 compilado",
            code: ["// greet, caliente y", "// especializada para string+string", "lea    rax, [rbp-0x18]", "call   StringAdd", "mov    [rbp-0x20], rax", "ret"],
            cap: "Si greet se ejecuta mucho, los JIT la recompilan a <strong>c\u00f3digo m\u00e1quina nativo</strong>, especializado con el feedback. Rapid\u00edsima\u2026 mientras las suposiciones de tipo se mantengan." },
        ],
      }],
    },
  };

  D.topics["ignition-bytecode"] = {
    slug: "ignition-bytecode", folio: "02", tag: "motor", difficulty: "\u25C6\u25C6\u25C7",
    title: "Ignition: la m\u00e1quina de bytecode",
    tagline: "El int\u00e9rprete de registros que ejecuta y perfila tipos antes de que nada se optimice.",
    avoid: "pensar que el bytecode es un detalle interno sin efecto pr\u00e1ctico.",
    lede: "Antes de optimizar nada, V8 ejecuta tu c\u00f3digo en un int\u00e9rprete llamado <em class=\"serif-italic\">Ignition</em>, sobre bytecode compacto. Es el modelo mental que hace que todo lo dem\u00e1s tenga sentido.",
    breve: [
      { k: "Capa", v: "Motor \u00b7 V8" },
      { k: "Tipo", v: "M\u00e1quina de registros" },
      { k: "Especial", v: "Acumulador" },
      { k: "Recoge", v: "Feedback de tipos" },
    ],
    quees: "<p>Ignition es una m\u00e1quina de <strong>registros</strong> (r0, r1\u2026) con un <strong>acumulador</strong> especial. Los operandos viven en registros y el resultado suele quedar en el acumulador. Contrasta con las m\u00e1quinas de <em class=\"serif-italic\">pila</em>, donde todo pasa por empujar y sacar de una pila.</p>",
    fundamento: "<p>Mientras ejecuta, Ignition guarda en un <em class=\"serif-italic\">feedback vector</em> qu\u00e9 tipos aparecen en cada operaci\u00f3n. Ese perfil es lo que despu\u00e9s usan Maglev y TurboFan para especializar el c\u00f3digo caliente. Sin este paso, no habr\u00eda nada que optimizar.</p>",
    como: [
      "Los argumentos llegan a registros (<span class=\"inline-code\">a0</span>, <span class=\"inline-code\">a1</span>\u2026).",
      "Cada instrucci\u00f3n opera sobre el <strong>acumulador</strong>: cargar, multiplicar, sumar.",
      "En paralelo, anota en el <strong>feedback vector</strong> los tipos observados.",
      "<span class=\"inline-code\">Return</span> devuelve el valor del acumulador a quien llam\u00f3.",
    ],
    mito: "<p>\u00abEl bytecode es un detalle interno sin relevancia pr\u00e1ctica.\u00bb Al contrario: el bytecode de Ignition es <strong>el que m\u00e1s se ejecuta</strong> en la mayor\u00eda de programas \u2014 s\u00f3lo lo verdaderamente caliente llega al c\u00f3digo m\u00e1quina. Y el feedback que recoge aqu\u00ed es la <em class=\"serif-italic\">materia prima</em> de toda optimizaci\u00f3n.</p>",
    recursos: [
      { kind: "Art\u00edculo", star: true, title: "Understanding V8's Bytecode", sub: "Franziska Hinkelmann \u2014 c\u00f3mo leer el bytecode", href: "https://medium.com/dailyjs/understanding-v8s-bytecode-317d46c94775" },
      { kind: "Fuente", title: "V8 blog", sub: "v8.dev \u2014 documentaci\u00f3n del int\u00e9rprete", href: "https://v8.dev/blog" },
    ],
    widget: {
      storeKey: "ignition", exec: true,
      zones: [
        { id: "regs", label: "Registros", cls: "stack" },
        { id: "acc", label: "Acumulador", cls: "macro" },
        { id: "fb", label: "Feedback vector", cls: "web" },
      ],
      variants: [{
        id: "calc", label: "bytecode", codeCap: "Ignition bytecode \u00b7 calc(3, 4)",
        code: ["Ldar a1", "Mul a0, [0]", "AddSmi [1], [1]", "Return"],
        frames: [
          { line: -1, phase: "Preparaci\u00f3n", regs: ["a0 \u00b7 3", "a1 \u00b7 4"], acc: ["\u2014"], fb: ["(vac\u00edo)"],
            cap: "Llamamos <span class=\"inline-code\">calc(3, 4)</span>. Los argumentos ya est\u00e1n en los registros <span class=\"inline-code\">a0=3</span> y <span class=\"inline-code\">a1=4</span>. Avanza para ejecutar la primera instrucci\u00f3n." },
          { line: 0, phase: "Ldar", regs: ["a0 \u00b7 3", "a1 \u00b7 4"], acc: ["4"], fb: ["(vac\u00edo)"],
            cap: "<strong>Ldar</strong> (Load Accumulator from Register): carga el argumento <span class=\"inline-code\">b (=4)</span> en el acumulador." },
          { line: 1, phase: "Mul", regs: ["a0 \u00b7 3", "a1 \u00b7 4"], acc: ["12"], fb: ["[0] Number \u2713"],
            cap: "<strong>Mul</strong>: multiplica el acumulador por <span class=\"inline-code\">a0 (=3)</span>. Anota en el slot [0] que ambos operandos fueron n\u00fameros (Smi)." },
          { line: 2, phase: "AddSmi", regs: ["a0 \u00b7 3", "a1 \u00b7 4"], acc: ["13"], fb: ["[0] Number \u2713", "[1] Number \u2713"],
            cap: "<strong>AddSmi</strong>: suma la constante peque\u00f1a 1 al acumulador. Registra en el slot [1] otra operaci\u00f3n num\u00e9rica." },
          { line: 3, phase: "Return", regs: ["a0 \u00b7 3", "a1 \u00b7 4"], acc: ["13 \u2192 return"], fb: ["[0] Number \u2713", "[1] Number \u2713"],
            cap: "<strong>Return</strong>: devuelve el valor del acumulador (<span class=\"inline-code\">13</span>) a quien llam\u00f3. Fin de la funci\u00f3n." },
        ],
      }],
    },
  };

  D.topics["niveles-jit"] = {
    slug: "niveles-jit", folio: "03", tag: "motor", difficulty: "\u25C6\u25C6\u25C6",
    title: "Los niveles del JIT",
    tagline: "Ignition \u2192 Sparkplug \u2192 Maglev \u2192 TurboFan, y la desoptimizaci\u00f3n cuando la suposici\u00f3n se rompe.",
    avoid: "creer que el JIT siempre acelera; los tipos inconsistentes lo hacen desoptimizar.",
    lede: "V8 no tiene <em class=\"serif-italic\">un</em> compilador JIT: tiene cuatro niveles que equilibran \u00abcompilar r\u00e1pido\u00bb contra \u00abcompilar bien\u00bb. El c\u00f3digo caliente sube; si una suposici\u00f3n se rompe, <em class=\"serif-italic\">desoptimiza</em> y cae de vuelta al int\u00e9rprete.",
    breve: [
      { k: "Capa", v: "Motor \u00b7 V8" },
      { k: "Niveles", v: "4 (Ignition\u2192TurboFan)" },
      { k: "Motor", v: "Feedback de tipos" },
      { k: "Riesgo", v: "Desoptimizaci\u00f3n" },
    ],
    quees: "<p>Un <strong>JIT</strong> (just-in-time) compila a c\u00f3digo m\u00e1quina <em class=\"serif-italic\">mientras el programa corre</em>, concentr\u00e1ndose en lo que se ejecuta muchas veces. Compilar cuesta tiempo; s\u00f3lo vale la pena para c\u00f3digo \u00abcaliente\u00bb. Por eso hay niveles.</p>",
    fundamento: "<p>Los niveles altos <strong>especulan</strong> con los tipos que observaron (p. ej. \u00ab<span class=\"inline-code\">a</span> y <span class=\"inline-code\">b</span> siempre son n\u00fameros\u00bb). Si de pronto llega un tipo distinto, la suposici\u00f3n se rompe: V8 reconstruye el estado y vuelve a Ignition.</p>",
    como: [
      "<strong>Ignition</strong> \u2014 int\u00e9rprete de bytecode. Arranca ya y perfila tipos.",
      "<strong>Sparkplug</strong> \u2014 baseline: c\u00f3digo m\u00e1quina casi sin optimizar, compilado rapid\u00edsimo.",
      "<strong>Maglev</strong> \u2014 nivel medio: usa el feedback para optimizar lo caliente.",
      "<strong>TurboFan</strong> \u2014 nivel m\u00e1ximo: c\u00f3digo altamente especializado.",
    ],
    mito: "<p>\u00abUn JIT siempre hace tu c\u00f3digo m\u00e1s r\u00e1pido.\u00bb No gratis: compilar <em class=\"serif-italic\">cuesta</em>, y la desoptimizaci\u00f3n tiene precio. Una funci\u00f3n que ve muchos tipos distintos (megam\u00f3rfica) puede quedarse atascada bajando y subiendo de nivel. Escribir con tipos <strong>consistentes</strong> es lo que deja al JIT trabajar.</p>",
    recursos: [
      { kind: "V8 blog", title: "Maglev \u2014 V8's Fastest Optimizing JIT", sub: "v8.dev \u2014 el nivel medio, en detalle", href: "https://v8.dev/blog/maglev" },
      { kind: "V8 blog", title: "Sparkplug \u2014 a non-optimizing JIT", sub: "v8.dev \u2014 el baseline compiler", href: "https://v8.dev/blog/sparkplug" },
      { kind: "Notas", title: "v8-perf: compiler pipeline", sub: "Thorsten Lorenz \u2014 el pipeline condensado", href: "https://github.com/thlorenz/v8-perf/blob/master/compiler.md" },
    ],
    widget: {
      storeKey: "jit",
      zones: [
        { id: "nivel", label: "Nivel activo", cls: "stack" },
        { id: "fb", label: "Feedback de tipos", cls: "web" },
      ],
      variants: [{
        id: "add", label: "calentar add(a, b)", codeCap: "hot.js",
        code: ["function add(a, b) {", "  return a + b;", "}"],
        frames: [
          { phase: "0 invocaciones", nivel: ["Ignition \u00b7 1\u00d7"], fb: ["(sin datos)"],
            cap: "A\u00fan sin ejecutar. La primera llamada correr\u00e1 en <strong>Ignition</strong>, el int\u00e9rprete de bytecode. <span class=\"mono\" style=\"font-size:12px;color:var(--color-fg-faint)\">Conteos y multiplicadores ilustrativos: V8 asciende por presupuesto de feedback, no por un n\u00famero fijo de llamadas.</span>" },
          { phase: "~5 invocaciones", nivel: ["Sparkplug \u00b7 ~2\u00d7"], fb: ["a: number \u00b7 b: number \u2713"],
            cap: "Se ejecut\u00f3 unas cuantas veces. <strong>Sparkplug</strong> la compila a c\u00f3digo m\u00e1quina baseline, sin optimizar, pero ya sin interpretar." },
          { phase: "~15 invocaciones", nivel: ["Maglev \u00b7 ~5\u00d7"], fb: ["a: number \u00b7 b: number \u2713"],
            cap: "C\u00f3digo caliente. <strong>Maglev</strong> usa el feedback (\u00absiempre n\u00fameros\u00bb) para optimizar de forma media." },
          { phase: "~40 invocaciones", nivel: ["TurboFan \u00b7 ~10\u00d7+"], fb: ["a: number \u00b7 b: number \u2713"],
            cap: "Muy caliente: <strong>TurboFan</strong> la compila al m\u00e1ximo, especulando que <span class=\"inline-code\">a</span> y <span class=\"inline-code\">b</span> son enteros. Rapid\u00edsima\u2026 mientras se mantenga." },
          { phase: "\u26A1 lleg\u00f3 un string", nivel: ["Ignition \u00b7 1\u00d7"], fb: ["number \u2717 string \u2192 polim\u00f3rfico"],
            cap: "Llamas <span class=\"inline-code\">add('x', 'y')</span>: lleg\u00f3 un string donde se esperaba number. La suposici\u00f3n se rompi\u00f3: V8 <strong>desoptimiza</strong>, reconstruye el estado del int\u00e9rprete y cae de vuelta a Ignition. Toca re-calentar, aunque no desde cero: el feedback vector sobrevive, as\u00ed que el ascenso suele ser m\u00e1s r\u00e1pido que la primera vez." },
        ],
      }],
    },
  };
})(window.GUIA = window.GUIA || {});
