/* concurrencia.js — Bloque 2: event loop, async/await, workers.
   Sólo datos. El event loop es el widget estrella de la guía. */
(function (G) {
  "use strict";
  const D = G.data = G.data || { topics: {} };

  D.topics["event-loop"] = {
    slug: "event-loop", folio: "05", tag: "runtime", star: true, difficulty: "\u25C6\u25C6\u25C7",
    title: "El Event Loop",
    tagline: "Un hilo, dos colas y por qu\u00e9 las promesas le ganan a los timers. El tema estrella.",
    avoid: "creer que setTimeout(fn, 0) ejecuta \u00abya\u00bb o \u00aben 0 ms\u00bb.",
    lede: "JavaScript ejecuta en <em class=\"serif-italic\">un solo hilo</em>: s\u00f3lo una cosa a la vez. Entonces, \u00bfc\u00f3mo hace peticiones, timers y clicks sin congelarse? Con un bucle que coordina la pila con dos colas de trabajo pendiente.",
    breve: [
      { k: "Capa", v: "Runtime" },
      { k: "Hilos", v: "Uno" },
      { k: "Colas", v: "Micro + macro" },
      { k: "Regla", v: "Micro antes que macro" },
    ],
    quees: "<p>Las APIs as\u00edncronas (<span class=\"inline-code\">setTimeout</span>, <span class=\"inline-code\">fetch</span>, eventos) <strong>no las corre JavaScript</strong>: las corre el runtime \u2014 el navegador o libuv en Node. Cuando terminan, el runtime <em class=\"serif-italic\">encola</em> tu callback. El event loop decide cu\u00e1ndo sacarlo de la cola y ponerlo en la pila.</p>",
    fundamento: "<p>Cuando la pila se vac\u00eda, el loop <strong>drena TODA la cola de microtareas</strong> (promesas, <span class=\"inline-code\">await</span>, <span class=\"inline-code\">queueMicrotask</span>) antes de tomar <strong>una sola</strong> macrotarea (timers, I/O, eventos). Luego, en el navegador, renderiza. Y repite. Por eso las microtareas <em class=\"serif-italic\">siempre le ganan</em> a los timers.</p>",
    como: [
      "Ejecuta todo lo que hay en la <strong>pila</strong> hasta vaciarla.",
      "Drena <strong>toda</strong> la cola de <strong>microtareas</strong> (incluidas las que se agenden en el proceso).",
      "Toma <strong>una</strong> macrotarea de la cola de tareas.",
      "(Navegador) <strong>renderiza</strong> si toca, y vuelve al paso 1.",
    ],
    mito: "<p><span class=\"inline-code\">setTimeout(fn, 0)</span> <strong>no</strong> ejecuta <span class=\"inline-code\">fn</span> de inmediato ni \u00aben 0 ms\u00bb. El callback espera a que la pila se vac\u00ede <em class=\"serif-italic\">y</em> a que se drenen todas las microtareas; adem\u00e1s, el navegador impone un m\u00ednimo (~4 ms con anidamiento). La lecci\u00f3n es el <strong>orden</strong>, no el tiempo exacto.</p>",
    recursos: [
      { kind: "Charla", star: true, title: "What the heck is the event loop anyway?", sub: "Philip Roberts \u00b7 JSConf EU \u2014 con Loupe", href: "https://www.youtube.com/watch?v=8aGhZQkoFbQ" },
      { kind: "Charla", star: true, title: "In The Loop", sub: "Jake Archibald \u00b7 JSConf.Asia", href: "https://www.youtube.com/watch?v=cCOL7MC4Pl0" },
      { kind: "Art\u00edculo", title: "JavaScript Visualized \u2014 Event Loop", sub: "Lydia Hallie \u2014 el norte visual de este prototipo", href: "https://www.lydiahallie.com/blog/event-loop" },
    ],
    widget: {
      storeKey: "loop", console: true,
      runtime: {
        note: {
          browser: "Modelo del navegador: pila \u2192 drenar microtareas \u2192 una macrotarea \u2192 render. Cambia a Node para ver en qu\u00e9 difiere.",
          node: "En Node el bucle tiene fases (timers, poll, check\u2026) y process.nextTick corre ANTES que las microtareas de promesas. Para estos snippets el orden de salida coincide con el navegador.",
        },
      },
      zones: [
        { id: "stack", label: "Call Stack", cls: "stack", span2: true, foot: "un hilo \u00b7 una cosa a la vez" },
        { id: "web", label: { browser: "Web APIs", node: "libuv / C++ APIs" }, cls: "web" },
        { id: "micro", label: "Microtareas", cls: "micro", hint: "se drena entera primero" },
        { id: "macro", label: { browser: "Cola de tareas", node: "Fase de tareas" }, cls: "macro", hint: "una por vuelta del loop" },
      ],
      variants: [
        {
          id: "basic", label: "Orden b\u00e1sico",
          code: ["console.log('1');", "setTimeout(() => console.log('2'), 0);", "Promise.resolve().then(() => console.log('3'));", "console.log('4');"],
          frames: [
            { line: -1, phase: "Arranque", cap: "El script completo entra a la pila como la primera macrotarea.", stack: ["(script)"], web: [], macro: [], micro: [], out: [] },
            { line: 0, phase: "S\u00edncrono", cap: "console.log('1') se ejecuta ahora mismo: es c\u00f3digo s\u00edncrono, va directo a la pila.", stack: ["(script)", "console.log('1')"], web: [], macro: [], micro: [], out: [] },
            { line: 0, phase: "S\u00edncrono", cap: "Imprime 1 y se desapila.", stack: ["(script)"], web: [], macro: [], micro: [], out: ["1"] },
            { line: 1, phase: "Delegaci\u00f3n", cap: "setTimeout NO ejecuta el callback: se lo entrega al runtime (Web APIs) con un temporizador.", stack: ["(script)", "setTimeout(cb, 0)"], web: [], macro: [], micro: [], out: ["1"] },
            { line: 1, phase: "Delegaci\u00f3n", cap: "El temporizador corre FUERA de JavaScript. Al vencer, encolar\u00e1 el callback en la cola de tareas.", stack: ["(script)"], web: ["timer \u2192 cb '2'"], macro: [], micro: [], out: ["1"] },
            { line: 1, phase: "Runtime", cap: "El temporizador de 0 ms vence enseguida y su callback pasa a la cola de tareas (macrotareas).", stack: ["(script)"], web: [], macro: ["cb \u2192 log('2')"], micro: [], out: ["1"] },
            { line: 2, phase: "Promesas", cap: "Promise.resolve() ya est\u00e1 cumplida; .then registra su callback como MICROtarea.", stack: ["(script)", "Promise.then(cb)"], web: [], macro: ["cb \u2192 log('2')"], micro: [], out: ["1"] },
            { line: 2, phase: "Promesas", cap: "El callback de .then espera en la cola de microtareas.", stack: ["(script)"], web: [], macro: ["cb \u2192 log('2')"], micro: ["cb \u2192 log('3')"], out: ["1"] },
            { line: 3, phase: "S\u00edncrono", cap: "console.log('4') es s\u00edncrono: se ejecuta antes que CUALQUIER cosa en las colas.", stack: ["(script)", "console.log('4')"], web: [], macro: ["cb \u2192 log('2')"], micro: ["cb \u2192 log('3')"], out: ["1"] },
            { line: 3, phase: "S\u00edncrono", cap: "Imprime 4. El script termina.", stack: ["(script)"], web: [], macro: ["cb \u2192 log('2')"], micro: ["cb \u2192 log('3')"], out: ["1", "4"] },
            { line: -1, phase: "Pila vac\u00eda", cap: "La pila se vaci\u00f3. AHORA el loop drena TODA la cola de microtareas antes de tocar las tareas.", stack: [], web: [], macro: ["cb \u2192 log('2')"], micro: ["cb \u2192 log('3')"], out: ["1", "4"] },
            { line: -1, phase: "Microtareas", cap: "La microtarea de la promesa corre primero.", stack: ["cb \u2192 log('3')"], web: [], macro: ["cb \u2192 log('2')"], micro: [], out: ["1", "4"] },
            { line: -1, phase: "Microtareas", cap: "Imprime 3. La cola de microtareas queda vac\u00eda.", stack: [], web: [], macro: ["cb \u2192 log('2')"], micro: [], out: ["1", "4", "3"] },
            { line: -1, phase: "Macrotarea", cap: "Sin microtareas pendientes, el loop toma UNA macrotarea: el callback del timer.", stack: ["cb \u2192 log('2')"], web: [], macro: [], micro: [], out: ["1", "4", "3"] },
            { line: -1, phase: "Fin", cap: "Imprime 2. Orden final: 1, 4, 3, 2 \u2014 las microtareas le ganaron al timer.", stack: [], web: [], macro: [], micro: [], out: ["1", "4", "3", "2"] },
          ],
        },
        {
          id: "async", label: "async / await",
          code: ["console.log('A');", "setTimeout(() => console.log('D'), 0);", "(async () => {", "  console.log('B');", "  await 0;", "  console.log('C');", "})();", "console.log('E');"],
          frames: [
            { line: -1, phase: "Arranque", cap: "El script entra a la pila como macrotarea inicial.", stack: ["(script)"], web: [], macro: [], micro: [], out: [] },
            { line: 0, phase: "S\u00edncrono", cap: "log('A') es s\u00edncrono.", stack: ["(script)", "log('A')"], web: [], macro: [], micro: [], out: ["A"] },
            { line: 1, phase: "Delegaci\u00f3n", cap: "setTimeout entrega su callback al runtime; el timer de 0 ms vence y lo encola como macrotarea.", stack: ["(script)"], web: [], macro: ["cb \u2192 log('D')"], micro: [], out: ["A"] },
            { line: 2, phase: "async", cap: "Se invoca la funci\u00f3n async. Corre S\u00cdNCRONA hasta el primer await.", stack: ["(script)", "async fn"], web: [], macro: ["cb \u2192 log('D')"], micro: [], out: ["A"] },
            { line: 3, phase: "async", cap: "log('B') dentro de la async se ejecuta s\u00edncrono, aqu\u00ed y ahora.", stack: ["(script)", "async fn"], web: [], macro: ["cb \u2192 log('D')"], micro: [], out: ["A", "B"] },
            { line: 4, phase: "await", cap: "await parte la funci\u00f3n: lo de despu\u00e9s ser\u00e1 una microtarea cuando la promesa (ya resuelta) se agende.", stack: ["(script)", "async fn"], web: [], macro: ["cb \u2192 log('D')"], micro: [], out: ["A", "B"] },
            { line: 4, phase: "await", cap: "La funci\u00f3n async devuelve el control y su continuaci\u00f3n queda en la cola de microtareas.", stack: ["(script)"], web: [], macro: ["cb \u2192 log('D')"], micro: ["reanudar \u2192 log('C')"], out: ["A", "B"] },
            { line: 7, phase: "S\u00edncrono", cap: "log('E') es s\u00edncrono: corre antes que la continuaci\u00f3n pendiente.", stack: ["(script)", "log('E')"], web: [], macro: ["cb \u2192 log('D')"], micro: ["reanudar \u2192 log('C')"], out: ["A", "B", "E"] },
            { line: -1, phase: "Pila vac\u00eda", cap: "Script terminado. El loop drena las microtareas antes de la macrotarea.", stack: [], web: [], macro: ["cb \u2192 log('D')"], micro: ["reanudar \u2192 log('C')"], out: ["A", "B", "E"] },
            { line: 5, phase: "Microtareas", cap: "La funci\u00f3n async se reanuda: log('C').", stack: ["reanudar \u2192 log('C')"], web: [], macro: ["cb \u2192 log('D')"], micro: [], out: ["A", "B", "E", "C"] },
            { line: -1, phase: "Macrotarea", cap: "Ahora s\u00ed, la macrotarea del timer.", stack: ["cb \u2192 log('D')"], web: [], macro: [], micro: [], out: ["A", "B", "E", "C"] },
            { line: -1, phase: "Fin", cap: "Orden final: A, B, E, C, D. await no crea hilos: s\u00f3lo agenda una microtarea.", stack: [], web: [], macro: [], micro: [], out: ["A", "B", "E", "C", "D"] },
          ],
        },
      ],
    },
  };

  D.topics["async-await"] = {
    slug: "async-await", folio: "06", tag: "lenguaje", difficulty: "\u25C6\u25C6\u25C7",
    title: "async / await y microtareas",
    tagline: "Az\u00facar sobre promesas: cada await parte la funci\u00f3n y agenda su continuaci\u00f3n como microtarea.",
    avoid: "pensar que await pausa el hilo o crea paralelismo.",
    lede: "<span class=\"mono\" style=\"font-size:15px\">async/await</span> no crea hilos ni magia paralela: es az\u00facar sobre <em class=\"serif-italic\">promesas</em>, que se resuelven v\u00eda la cola de microtareas.",
    breve: [
      { k: "Capa", v: "Lenguaje + runtime" },
      { k: "Es", v: "Az\u00facar sobre promesas" },
      { k: "await", v: "Parte la funci\u00f3n" },
      { k: "Continuaci\u00f3n", v: "Microtarea" },
    ],
    quees: "<p>Un <span class=\"inline-code\">await</span> \u00abpausa\u00bb la funci\u00f3n y agenda su <em class=\"serif-italic\">continuaci\u00f3n</em> (todo lo que viene despu\u00e9s) como una <strong>microtarea</strong>, para cuando la promesa se resuelva. Lo de antes del await corre s\u00edncrono; lo de despu\u00e9s vuelve m\u00e1s tarde.</p>",
    fundamento: "<p>Las microtareas se drenan <strong>enteras</strong> antes de la siguiente macrotarea. Por eso un <span class=\"inline-code\">.then</span> corre antes que un <span class=\"inline-code\">setTimeout(\u2026, 0)</span> encolado justo antes. La continuaci\u00f3n de un <span class=\"inline-code\">await</span> es exactamente esa clase de microtarea.</p>",
    como: [
      "Lo <strong>anterior</strong> al primer await corre s\u00edncrono, en la llamada.",
      "El <strong>await</strong> parte la funci\u00f3n y agenda la continuaci\u00f3n como microtarea.",
      "El resto del c\u00f3digo s\u00edncrono termina; la pila se vac\u00eda.",
      "El loop <strong>drena las microtareas</strong> (las continuaciones) antes de cualquier timer.",
    ],
    mito: "<p>\u00ab<span class=\"inline-code\">await</span> bloquea o pausa el hilo.\u00bb No: no hay hilos nuevos ni bloqueo. <span class=\"inline-code\">await</span> s\u00f3lo <strong>parte</strong> la funci\u00f3n y devuelve el control; la continuaci\u00f3n vuelve como microtarea cuando la promesa se resuelve. El hilo sigue libre mientras tanto.</p>",
    recursos: [
      { kind: "Referencia", star: true, title: "Tasks, microtasks, queues and schedules", sub: "Jake Archibald \u2014 el orden exacto", href: "https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/" },
      { kind: "Art\u00edculo", title: "JavaScript Visualized: Promises & async/await", sub: "Lydia Hallie", href: "https://dev.to/lydiahallie/javascript-visualized-promises-async-await-5gje" },
      { kind: "En este cat\u00e1logo", title: "\u2192 El Event Loop (#05)", sub: "el \u00e1rbitro que coordina estas dos colas", href: "#/tema/event-loop" },
    ],
    widget: {
      storeKey: "asyncawait", console: true,
      zones: [
        { id: "micro", label: "Cola de microtareas", cls: "micro", hint: "se drena entera primero" },
        { id: "macro", label: "Cola de tareas", cls: "macro", hint: "una por vuelta" },
      ],
      variants: [{
        id: "run", label: "run() con dos await", codeCap: "async.js",
        code: ["console.log('inicio');", "setTimeout(fin, 0);", "async function run() {", "  console.log('sync 1');", "  await tarea();      // corta aqui", "  console.log('cont 1');", "  await otra();       // corta aqui", "  console.log('cont 2');", "}", "run();", "console.log('final sync');"],
        frames: [
          { line: [0], phase: "S\u00edncrono", cap: "console.log('inicio') es s\u00edncrono: se ejecuta al instante.", micro: [], macro: [], out: ["inicio"] },
          { line: [1], phase: "Delegaci\u00f3n", cap: "setTimeout entrega 'fin' al runtime; su callback pasa a la cola de tareas.", micro: [], macro: ["fin()"], out: ["inicio"] },
          { line: [2, 3], phase: "async", cap: "run() se invoca y corre S\u00cdNCRONA hasta el primer await. log('sync 1') sale ya.", micro: [], macro: ["fin()"], out: ["inicio", "sync 1"] },
          { line: [4], phase: "await", cap: "El primer await parte la funci\u00f3n: la continuaci\u00f3n (cont 1 \u2026) se agenda como microtarea. run() devuelve el control.", micro: ["cont 1 \u2192"], macro: ["fin()"], out: ["inicio", "sync 1"] },
          { line: [10], phase: "S\u00edncrono", cap: "De vuelta en el script: log('final sync') es s\u00edncrono, corre antes que cualquier cola.", micro: ["cont 1 \u2192"], macro: ["fin()"], out: ["inicio", "sync 1", "final sync"] },
          { line: [], phase: "Pila vac\u00eda", cap: "El loop drena microtareas: se reanuda run() en la primera continuaci\u00f3n.", micro: [], macro: ["fin()"], out: ["inicio", "sync 1", "final sync"] },
          { line: [5, 6], phase: "Microtareas", cap: "log('cont 1') sale. El segundo await vuelve a partir la funci\u00f3n: otra continuaci\u00f3n entra a microtareas.", micro: ["cont 2 \u2192"], macro: ["fin()"], out: ["inicio", "sync 1", "final sync", "cont 1"] },
          { line: [7], phase: "Microtareas", cap: "El loop sigue drenando microtareas (a\u00fan antes que el timer): se reanuda run() y sale log('cont 2').", micro: [], macro: ["fin()"], out: ["inicio", "sync 1", "final sync", "cont 1", "cont 2"] },
          { line: [], phase: "Macrotarea", cap: "Microtareas agotadas. AHORA s\u00ed, la macrotarea del timer: fin(). Las promesas ganaron a pesar del setTimeout(0).", micro: [], macro: [], out: ["inicio", "sync 1", "final sync", "cont 1", "cont 2", "fin"] },
        ],
      }],
    },
  };

  D.topics["workers"] = {
    slug: "workers", folio: "07", tag: "runtime", difficulty: "\u25C6\u25C6\u25C7",
    title: "Paralelismo real: Workers",
    tagline: "Hilos con memoria propia que hablan por mensajes. Copiado vs transferido vs compartido.",
    avoid: "creer que los workers comparten variables con el hilo principal por defecto.",
    lede: "Si JavaScript es de un solo hilo, \u00bfc\u00f3mo usas varios n\u00facleos? Con <em class=\"serif-italic\">Workers</em>: hilos separados, con su propia memoria, que se comunican por mensajes.",
    breve: [
      { k: "Capa", v: "Runtime" },
      { k: "Memoria", v: "Aislada por hilo" },
      { k: "Canal", v: "postMessage" },
      { k: "Compartir", v: "SharedArrayBuffer" },
    ],
    quees: "<p>Cada Worker corre en otro hilo del SO, con su <strong>propio</strong> event loop y su propia memoria. No comparten variables: se hablan con <span class=\"inline-code\">postMessage</span>. Es el an\u00e1logo directo de los modelos de actores con memoria no compartida.</p>",
    fundamento: "<p>Una tarea pesada de CPU en el hilo principal <strong>congela la UI</strong>: la pila no se vac\u00eda, el event loop no avanza, nada se renderiza. Deleg\u00e1ndola a un Worker, el hilo principal queda libre para seguir respondiendo.</p>",
    como: [
      "Un c\u00e1lculo pesado en el hilo principal <strong>congela</strong> todo: la UI no responde.",
      "Delegado a un <strong>Worker</strong>, corre en otro hilo; el principal sigue vivo.",
      "Por defecto los datos se <strong>copian</strong> (structured clone): dos copias independientes.",
      "Un <strong>transferable</strong> mueve el buffer sin copiar (el original queda inutilizable); un <strong>SharedArrayBuffer</strong> comparte memoria \u2014 con Atomics.",
    ],
    mito: "<p>\u00abLos Workers comparten variables con el hilo principal.\u00bb No: cada uno tiene su memoria. Por defecto los datos se <strong>copian</strong> (structured clone). La \u00fanica memoria realmente compartida es <span class=\"inline-code\">SharedArrayBuffer</span>, y ah\u00ed <em class=\"serif-italic\">t\u00fa</em> debes sincronizar con <span class=\"inline-code\">Atomics</span> para evitar condiciones de carrera.</p>",
    recursos: [
      { kind: "Referencia", title: "Using Web Workers", sub: "MDN \u2014 Workers en el navegador", href: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers" },
      { kind: "Node", title: "Worker Threads", sub: "Node.js docs \u2014 hilos en Node", href: "https://nodejs.org/api/worker_threads.html" },
      { kind: "Motor", title: "SharedArrayBuffer", sub: "MDN \u2014 memoria compartida + Atomics", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer" },
    ],
    widget: {
      storeKey: "workers",
      zones: [
        { id: "principal", label: "Hilo principal", cls: "stack" },
        { id: "worker", label: "Worker", cls: "web" },
      ],
      variants: [{
        id: "modelos", label: "c\u00f3mo viajan los datos", codeCap: "worker.js",
        code: ["const w = new Worker('calc.js');", "w.postMessage(data);", "w.onmessage = (e) => {", "  console.log(e.data);", "};"],
        frames: [
          { line: [1], phase: "Hilo principal ocupado", principal: ["c\u00e1lculo pesado", "UI congelada"], worker: [],
            cap: "Un c\u00e1lculo pesado en el hilo principal: la pila no se vac\u00eda, el event loop no avanza, la <strong>UI se congela</strong>." },
          { line: [0], phase: "Delegaci\u00f3n", principal: ["UI responde"], worker: ["c\u00e1lculo pesado"],
            cap: "Delegas el c\u00e1lculo a un <strong>Worker</strong>: corre en otro hilo con su propio event loop. El principal queda libre." },
          { line: [1], phase: "Copiado (clone)", principal: ["data (copia)"], worker: ["data (copia)"],
            cap: "<strong>Structured clone</strong>: el objeto se serializa y se reconstruye del otro lado. El original SIGUE disponible \u2014 hay dos copias independientes." },
          { line: [1], phase: "Transferido", principal: ["\u2014 inutilizable"], worker: ["buffer"],
            cap: "<strong>Transferable</strong> (p. ej. ArrayBuffer): el buffer se mueve sin copiar, rapid\u00edsimo. Pero el original queda INUTILIZABLE \u2014 s\u00f3lo un due\u00f1o." },
          { line: [1], phase: "Compartido (SAB)", principal: ["SAB \u00b7 misma memoria"], worker: ["SAB \u00b7 misma memoria"],
            cap: "<strong>SharedArrayBuffer</strong>: los dos hilos leen y escriben la MISMA memoria. M\u00e1ximo rendimiento, pero necesitas <span class=\"inline-code\">Atomics</span> para sincronizar." },
        ],
      }],
    },
  };
})(window.GUIA = window.GUIA || {});
