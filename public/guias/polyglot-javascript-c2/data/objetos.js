/* objetos.js — Bloque 4: cadena de prototipos, closures, this/hoisting. */
(function (G) {
  "use strict";
  const D = G.data = G.data || { topics: {} };

  D.topics["prototype-chain"] = {
    slug: "prototype-chain", folio: "11", tag: "lenguaje", star: true, difficulty: "\u25C6\u25C6\u25C7",
    title: "La cadena de prototipos",
    tagline: "JS no tiene clases bajo el capó: hereda subiendo por [[Prototype]] hasta encontrar la propiedad.",
    avoid: "creer que class introduce herencia clásica; es azúcar sobre prototipos.",
    lede: "JavaScript no tiene clases \u00abde verdad\u00bb bajo el cap\u00f3: hereda por <em class=\"serif-italic\">prototipos</em>. Cuando pides una propiedad y el objeto no la tiene, el motor sube por una cadena hasta encontrarla \u2014 o hasta <span class=\"mono\">null</span>.",
    breve: [
      { k: "Capa", v: "Lenguaje" },
      { k: "Enlace", v: "[[Prototype]]" },
      { k: "Gana", v: "El primer dueño" },
      { k: "Fin", v: "null \u2192 undefined" },
    ],
    quees: "<p>Cada objeto tiene un enlace interno <span class=\"inline-code\">[[Prototype]]</span> (lo lees con <span class=\"inline-code\">Object.getPrototypeOf</span>). La b\u00fasqueda de <span class=\"inline-code\">obj.x</span> recorre <span class=\"inline-code\">obj \u2192 su prototipo \u2192 \u2026 \u2192 Object.prototype \u2192 null</span>. Es el an\u00e1logo directo del <em class=\"serif-italic\">method lookup</em> de otros lenguajes.</p>",
    fundamento: "<p>Gana el <strong>primer</strong> eslab\u00f3n que <em class=\"serif-italic\">posee</em> la propiedad (no que la herede). Por eso una propiedad m\u00e1s abajo en la cadena <strong>ensombrece</strong> (shadowing) a la de arriba. Si nadie la tiene, la lectura devuelve <span class=\"inline-code\">undefined</span>.</p>",
    como: [
      "\u00bfEl objeto <strong>posee</strong> la propiedad? Si s\u00ed, se usa esa y se detiene.",
      "Si no, salta a su <span class=\"inline-code\">[[Prototype]]</span> y repite.",
      "Al llegar a <span class=\"inline-code\">null</span> sin encontrarla, la lectura es <span class=\"inline-code\">undefined</span>.",
      "El <strong>shadowing</strong> es s\u00f3lo esto: un eslab\u00f3n de abajo la tiene primero.",
    ],
    mito: "<p>\u00ab<span class=\"inline-code\">class</span> trae herencia cl\u00e1sica a JavaScript.\u00bb No: <span class=\"inline-code\">class</span> es <strong>az\u00facar sint\u00e1ctico</strong> sobre esta misma cadena de prototipos. Los m\u00e9todos viven en el <span class=\"inline-code\">prototype</span>, y <span class=\"inline-code\">extends</span> s\u00f3lo enlaza un prototipo con otro. Debajo, todo es la b\u00fasqueda que acabas de recorrer.</p>",
    recursos: [
      { kind: "Referencia", title: "Inheritance and the prototype chain", sub: "MDN Web Docs \u2014 la referencia can\u00f3nica", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain" },
      { kind: "Libro", star: true, title: "You Don't Know JS: this & Object Prototypes", sub: "Kyle Simpson \u2014 gratis en GitHub", href: "https://github.com/getify/You-Dont-Know-JS" },
      { kind: "Motor", title: "Engine fundamentals: optimizing prototypes", sub: "Mathias Bynens & Benedikt Meurer", href: "https://mathiasbynens.be/notes/prototypes" },
    ],
    widget: {
      storeKey: "proto", console: true,
      zones: [{ id: "cadena", label: "Cadena de prototipos", cls: "micro" }],
      variants: [
        {
          id: "walk", label: "buscar longEar.walk", codeCap: "lookup",
          code: ["longEar.walk"],
          frames: [
            { phase: "longEar", cadena: ["\u25B6 longEar { earLength, listen() }", "rabbit { jumps, hide() }", "animal { eats, walk() }", "Object.prototype", "null"], out: [],
              cap: "\u00bflongEar posee <span class=\"inline-code\">walk</span>? No. Saltamos a su [[Prototype]]." },
            { phase: "rabbit", cadena: ["longEar { earLength, listen() }", "\u25B6 rabbit { jumps, hide() }", "animal { eats, walk() }", "Object.prototype", "null"], out: [],
              cap: "\u00bfrabbit posee <span class=\"inline-code\">walk</span>? Tampoco. Seguimos subiendo." },
            { phase: "animal \u2713", cadena: ["longEar { earLength, listen() }", "rabbit { jumps, hide() }", "\u25B6 animal { eats, walk() }", "Object.prototype", "null"], out: ["\u21B3 animal.walk"],
              cap: "animal POSEE <span class=\"inline-code\">walk()</span>: se detiene aqu\u00ed y usa esa. La herencia es exactamente esta subida." },
          ],
        },
        {
          id: "fly", label: "buscar longEar.fly", codeCap: "lookup",
          code: ["longEar.fly"],
          frames: [
            { phase: "longEar", cadena: ["\u25B6 longEar { earLength, listen() }", "rabbit { jumps, hide() }", "animal { eats, walk() }", "Object.prototype", "null"], out: [],
              cap: "Buscamos <span class=\"inline-code\">fly</span>: longEar no la tiene." },
            { phase: "rabbit", cadena: ["longEar", "\u25B6 rabbit { jumps, hide() }", "animal { eats, walk() }", "Object.prototype", "null"], out: [], cap: "rabbit tampoco." },
            { phase: "animal", cadena: ["longEar", "rabbit", "\u25B6 animal { eats, walk() }", "Object.prototype", "null"], out: [], cap: "animal tampoco." },
            { phase: "Object.prototype", cadena: ["longEar", "rabbit", "animal", "\u25B6 Object.prototype", "null"], out: [], cap: "Object.prototype tampoco tiene <span class=\"inline-code\">fly</span>." },
            { phase: "null", cadena: ["longEar", "rabbit", "animal", "Object.prototype", "\u25B6 null"], out: ["undefined"],
              cap: "Llegamos a <span class=\"inline-code\">null</span>: nadie la tiene. La lectura es <span class=\"inline-code\">undefined</span> \u2014 no lanza error." },
          ],
        },
      ],
    },
  };

  D.topics["closures"] = {
    slug: "closures", folio: "12", tag: "lenguaje", difficulty: "\u25C6\u25C7\u25C7",
    title: "Call stack y closures",
    tagline: "Cómo una función recuerda dónde nació aunque su función externa ya haya salido de la pila.",
    avoid: "pensar que un closure copia variables; captura el entorno vivo.",
    lede: "\u00bfC\u00f3mo \u00abrecuerda\u00bb una funci\u00f3n las variables de donde naci\u00f3, aun despu\u00e9s de que la funci\u00f3n externa termin\u00f3? Con <em class=\"serif-italic\">closures</em> y la cadena de \u00e1mbitos.",
    breve: [
      { k: "Capa", v: "Lenguaje" },
      { k: "Estructura", v: "Call stack" },
      { k: "Ámbito", v: "Léxico (dónde se escribe)" },
      { k: "Retiene", v: "El entorno, vivo" },
    ],
    quees: "<p>Cada llamada crea un <strong>execution context</strong> que se apila en la <em class=\"serif-italic\">call stack</em>. Cada contexto tiene un <strong>entorno l\u00e9xico</strong> que apunta al de su \u00e1mbito padre \u2014 definido por <em class=\"serif-italic\">d\u00f3nde se escribi\u00f3</em> la funci\u00f3n, no d\u00f3nde se llama.</p>",
    fundamento: "<p>Una <strong>closure</strong> es una funci\u00f3n que mantiene vivo el entorno l\u00e9xico donde naci\u00f3. Aunque la funci\u00f3n externa ya sali\u00f3 de la pila, su entorno <em class=\"serif-italic\">no se recolecta</em> mientras la closure siga refiri\u00e9ndose a \u00e9l.</p>",
    como: [
      "Cada llamada apila un <strong>execution context</strong> con su entorno l\u00e9xico.",
      "Una funci\u00f3n interna enlaza el entorno del \u00e1mbito <strong>donde se escribi\u00f3</strong>.",
      "Aunque la externa retorne y salga de la pila, ese entorno <strong>sigue vivo</strong> si la interna lo referencia.",
      "Cada llamada a la closure lee y escribe <strong>el mismo</strong> entorno retenido.",
    ],
    mito: "<p>\u00abUna closure copia las variables de la funci\u00f3n externa.\u00bb No las copia: <strong>mantiene una referencia viva</strong> al entorno. Por eso dos closures creadas en la misma llamada comparten el mismo <span class=\"inline-code\">count</span>, y por eso capturar una variable de bucle con <span class=\"inline-code\">var</span> da resultados sorprendentes (todas ven el \u00faltimo valor).</p>",
    recursos: [
      { kind: "Referencia", title: "Closures", sub: "MDN \u2014 la referencia can\u00f3nica", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures" },
      { kind: "Libro", star: true, title: "You Don't Know JS: Scope & Closures", sub: "Kyle Simpson \u2014 gratis en GitHub", href: "https://github.com/getify/You-Dont-Know-JS" },
      { kind: "Art\u00edculo", title: "JavaScript Visualized: Scope (chain)", sub: "Lydia Hallie", href: "https://dev.to/lydiahallie/javascript-visualized-scope-chain-13pd" },
    ],
    widget: {
      storeKey: "closures",
      zones: [
        { id: "stack", label: "Call Stack", cls: "stack", span2: true, foot: "una cosa a la vez" },
        { id: "envs", label: "Entornos l\u00e9xicos", cls: "micro" },
      ],
      variants: [{
        id: "counter", label: "contador con closure", codeCap: "counter.js",
        code: ["function makeCounter() {", "  let count = 0;", "  return function inc() {", "    count++;", "    return count;", "  };", "}", "const c = makeCounter();", "c(); // 1", "c(); // 2"],
        frames: [
          { line: 7, stack: ["(global)"], envs: ["Global \u00b7 makeCounter, c=? \u25C4"], cap: "Arranca el programa. Se llama makeCounter() y se apila su contexto." },
          { line: 0, stack: ["(global)", "makeCounter()"], envs: ["Global \u00b7 makeCounter, c=?", "makeCounter \u00b7 count = 0 \u25C4"], cap: "Dentro de makeCounter se crea <span class=\"inline-code\">count = 0</span> en su entorno l\u00e9xico." },
          { line: 2, stack: ["(global)", "makeCounter()"], envs: ["Global \u00b7 makeCounter, c=?", "makeCounter \u00b7 count = 0 \u25C4"], cap: "Se crea la funci\u00f3n <span class=\"inline-code\">inc</span>. Su entorno l\u00e9xico apunta al de makeCounter \u2014 ah\u00ed vive count." },
          { line: 7, stack: ["(global)"], envs: ["Global \u00b7 makeCounter, c=inc", "makeCounter \u00b7 count = 0 \u00b7 retenido"], cap: "makeCounter retorna inc y sale de la pila. PERO su entorno NO se recolecta: inc (ahora c) lo retiene. Eso es la closure." },
          { line: 8, stack: ["(global)", "inc()"], envs: ["Global \u00b7 makeCounter, c=inc", "makeCounter \u00b7 count = 1 \u00b7 retenido \u25C4"], cap: "c() llama a inc. Sube por su cadena de \u00e1mbitos hasta el entorno retenido y hace <span class=\"inline-code\">count++</span> \u2192 1." },
          { line: 8, stack: ["(global)"], envs: ["Global \u00b7 makeCounter, c=inc", "makeCounter \u00b7 count = 1 \u00b7 retenido"], cap: "inc retorna 1 y sale de la pila. El entorno con count sigue vivo, esperando la pr\u00f3xima llamada." },
          { line: 9, stack: ["(global)", "inc()"], envs: ["Global \u00b7 makeCounter, c=inc", "makeCounter \u00b7 count = 2 \u00b7 retenido \u25C4"], cap: "c() otra vez: la MISMA closure, el MISMO entorno. count pasa de 1 a 2. No se reinici\u00f3: fue recordado." },
        ],
      }],
    },
  };

  D.topics["this-hoisting"] = {
    slug: "this-hoisting", folio: "13", tag: "lenguaje", difficulty: "\u25C6\u25C6\u25C7",
    title: "this, hoisting y el entorno léxico",
    tagline: "Fase de creación vs ejecución, la TDZ, y a qué apunta this según cómo llamas la función.",
    avoid: "creer que this depende de dónde se define la función, no de cómo se llama.",
    lede: "Dos fuentes cl\u00e1sicas de bugs: <span class=\"mono\">this</span> (depende de <em class=\"serif-italic\">c\u00f3mo</em> se llama, no de d\u00f3nde se define) y el <em class=\"serif-italic\">hoisting</em>. Ambos se explican mirando c\u00f3mo el motor prepara el contexto antes de ejecutar.",
    breve: [
      { k: "Capa", v: "Lenguaje" },
      { k: "Fase 1", v: "Creación (hoisting)" },
      { k: "Fase 2", v: "Ejecución" },
      { k: "this", v: "Según la llamada" },
    ],
    quees: "<p>Antes de correr una l\u00ednea, el motor <strong>crea el entorno l\u00e9xico</strong>: registra las declaraciones. Las funciones se izan enteras; <span class=\"inline-code\">var</span> se iza como <span class=\"inline-code\">undefined</span>; <span class=\"inline-code\">let</span>/<span class=\"inline-code\">const</span> existen pero son intocables hasta su l\u00ednea (la <em class=\"serif-italic\">TDZ</em>). S\u00f3lo despu\u00e9s ejecuta y asigna valores.</p>",
    fundamento: "<p>En funciones normales, <span class=\"inline-code\">this</span> se decide <strong>en cada llamada</strong> seg\u00fan c\u00f3mo se invoca: implícito (m\u00e9todo), por defecto (suelta), expl\u00edcito (<span class=\"inline-code\">call/apply/bind</span>) o <span class=\"inline-code\">new</span>. Las <em class=\"serif-italic\">arrow functions</em> no tienen <span class=\"inline-code\">this</span> propio: lo toman l\u00e9xicamente de donde se definieron.</p>",
    como: [
      "<strong>Fase creación</strong>: se registran declaraciones; <span class=\"inline-code\">fn</span> completa, <span class=\"inline-code\">var</span> como undefined, <span class=\"inline-code\">let</span> en TDZ.",
      "<strong>Fase ejecución</strong>: l\u00ednea a l\u00ednea, se asignan los valores.",
      "Leer un <span class=\"inline-code\">let</span> antes de su l\u00ednea lanza <strong>ReferenceError</strong> (TDZ).",
      "El <span class=\"inline-code\">this</span> se resuelve en el momento de la llamada, no de la definici\u00f3n.",
    ],
    mito: "<p>\u00ab<span class=\"inline-code\">this</span> es la funci\u00f3n donde est\u00e1 escrito.\u00bb No: en funciones normales, <span class=\"inline-code\">this</span> se decide <strong>en cada llamada</strong> seg\u00fan c\u00f3mo se invoca. Las <em class=\"serif-italic\">arrow functions</em> son la excepci\u00f3n: no tienen <span class=\"inline-code\">this</span> propio, lo toman l\u00e9xicamente del lugar donde se definieron. Por eso se usan tanto como callbacks.</p>",
    recursos: [
      { kind: "Art\u00edculo", title: "JavaScript Visualized: Hoisting", sub: "Lydia Hallie", href: "https://dev.to/lydiahallie/javascript-visualized-hoisting-478h" },
      { kind: "Referencia", title: "this", sub: "MDN \u2014 todas las reglas de enlace", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this" },
      { kind: "Libro", star: true, title: "You Don't Know JS: this & Object Prototypes", sub: "Kyle Simpson \u2014 gratis en GitHub", href: "https://github.com/getify/You-Dont-Know-JS" },
    ],
    widget: {
      storeKey: "this", console: true,
      zones: [{ id: "apunta", label: "this apunta a", cls: "micro" }],
      variants: [{
        id: "forms", label: "5 formas de llamar la misma función", codeCap: "\u00bfa qu\u00e9 apunta this?",
        code: ["user.greet()"],
        frames: [
          { code: ["user.greet()"], phase: "Implícito", apunta: ["user"], out: ["'Hola, soy Ana'"],
            cap: "<strong>Enlace impl\u00edcito</strong>: la funci\u00f3n se llama COMO m\u00e9todo de user, as\u00ed que <span class=\"inline-code\">this</span> es el objeto a la izquierda del punto." },
          { code: ["const g = user.greet;", "g();"], phase: "Por defecto", apunta: ["undefined"], out: ["TypeError: Cannot read properties of undefined (reading 'name')"],
            cap: "<strong>Enlace por defecto</strong>: se llama sin due\u00f1o. En strict mode <span class=\"inline-code\">this</span> es undefined. El m\u00e9todo \u00abperdi\u00f3\u00bb su this." },
          { code: ["user.greet.call(admin)"], phase: "Explícito", apunta: ["admin"], out: ["'Hola, soy Root'"],
            cap: "<strong>Enlace expl\u00edcito</strong>: <span class=\"inline-code\">call/apply/bind</span> fuerzan el this que t\u00fa indiques, sin importar c\u00f3mo se defina la funci\u00f3n." },
          { code: ["new Greeter('Eva')"], phase: "new", apunta: ["instancia nueva"], out: ["Greeter { name: 'Eva' }"],
            cap: "<strong>Enlace new</strong>: la palabra <span class=\"inline-code\">new</span> crea un objeto fresco y lo asigna a this dentro del constructor." },
          { code: ["user.greetLater = function () {", "  setTimeout(() => {", "    log(this === user);", "  });", "  setTimeout(function () {", "    log(this === user);", "  });", "};", "user.greetLater()"], phase: "Arrow (léxico)", apunta: ["arrow → user", "function → no es user"], out: ["true", "false"],
            cap: "Mismo callback, dos formas. La <strong>arrow</strong> no tiene this propio: lo toma del m\u00e9todo donde se escribi\u00f3, as\u00ed que sigue apuntando a user. La funci\u00f3n normal s\u00ed tiene el suyo, y <span class=\"inline-code\">setTimeout</span> la llama sin due\u00f1o: ah\u00ed el this ya no es user (window en el navegador, el objeto Timeout en Node)." },
        ],
      }],
    },
  };
})(window.GUIA = window.GUIA || {});
