/* data/concurrencia.js — Bloque 2 · Concurrencia: el GIL y su fin. */
(function (G) {
  "use strict";
  var T = G.data.temas;

  // 06 · GIL ---------------------------------------------------------------
  T.push({
    slug: "gil", folio: "06", bloque: 2, fam: 2, dificultad: 3, estrella: true, estrellaNota: "el tema estrella",
    cardTitulo: "El GIL (Global Interpreter Lock)",
    titulo: "El GIL (Global Interpreter Lock)",
    tagline: "Un único candado: solo un thread ejecuta bytecode a la vez. El internal más famoso y malentendido.",
    evita: "Creer que ayuda en trabajo CPU-bound.",
    lede: "Un candado único: aunque crees muchos threads, <em>solo uno ejecuta bytecode Python a la vez</em>.",
    enBreve: [
      "Un thread necesita <b>poseer el GIL</b> para ejecutar bytecode.",
      "Lo <b>suelta</b> en I/O y cada <em>switch interval</em> (~5 ms) para que otro avance.",
      "Los threads <b>sí</b> ayudan en cargas <b>I/O-bound</b>; <b>no</b> en <b>CPU-bound</b>.",
      "Existe para hacer thread-safe el intérprete (incluido el refcount) con un solo lock."
    ],
    fundamento: "Por eso los threads de Python <strong>no aceleran tareas de CPU en paralelo</strong>. Es el internal más famoso (y más malentendido) de Python — el análogo conceptual al GVL de Ruby. Existe para proteger el estado del intérprete, incluido el reference counting, de condiciones de carrera.",
    fuerza: "Un solo candado hace que todo el intérprete sea trivialmente thread-safe y que las extensiones C sean simples de escribir. El precio: cero paralelismo de bytecode.",
    comoFunciona: "Un thread debe <strong>poseer el GIL</strong> para ejecutar bytecode. Lo <strong>libera</strong> en operaciones de <strong>I/O</strong> (disco, red…) o cada cierto <em>switch interval</em> (~5&nbsp;ms, el de <code>sys.setswitchinterval()</code>) para que otro avance. Por eso los threads <strong>sí</strong> ayudan en cargas <strong>I/O-bound</strong> — pasan casi todo el tiempo esperando — pero <strong>no</strong> en <strong>CPU-bound</strong>.",
    mito: {
      mito: "«El GIL hace que Python no sirva para concurrencia».",
      realidad: "Solo limita el <em>paralelismo de CPU</em>. Para I/O concurrente (servidores, scraping, ficheros) los threads y <code>asyncio</code> escalan de sobra; para CPU real están <code>multiprocessing</code> y, desde 3.14, el free-threading."
    },
    recursos: [
      { texto: "Understanding the Python GIL — David Beazley (PyCon 2010)", url: "https://www.youtube.com/watch?v=Obt-vMVdM8s", star: true },
      { texto: "Python GIL — Real Python", url: "https://realpython.com/python-gil/" },
      { texto: "What Is the Python GIL? — docs oficiales", url: "https://docs.python.org/3/glossary.html#term-global-interpreter-lock" }
    ],
    widgetLabel: "Visualízalo — un token, cuatro carriles",
    widget: {
      intro: "Cuatro threads, un solo token GIL. Compara trabajo CPU-bound (serial) contra I/O-bound (se solapa).",
      vistas: [
        {
          id: "cpu", label: "CPU-bound (cálculo puro)", tipo: "carriles", conToken: true, lanes: ["T1", "T2", "T3", "T4"],
          pasos: [
            { fills: [12, 0, 0, 0], token: 0, states: ["ejecuta", "en cola", "en cola", "en cola"], nota: "Solo el carril con el GIL avanza; los demás esperan aunque haya núcleos libres." },
            { fills: [12, 12, 0, 0], token: 1, states: ["en cola", "ejecuta", "en cola", "en cola"], nota: "El token rota por el switch interval (~5 ms): ahora ejecuta T2." },
            { fills: [12, 12, 12, 12], token: 3, states: ["en cola", "en cola", "en cola", "ejecuta"], nota: "Va pasando por cada carril, pero de a uno: nunca dos a la vez." },
            { fills: [50, 50, 50, 50], token: 0, states: ["ejecuta", "en cola", "en cola", "en cola"], nota: "El trabajo total es serial: cuatro threads no reparten el cálculo, se turnan." },
            { fills: [100, 100, 100, 100], token: -1, states: ["✓ listo", "✓ listo", "✓ listo", "✓ listo"], nota: "Cuatro threads CPU-bound NO terminan antes que uno. Sin ganancia.", tone: "bad" }
          ]
        },
        {
          id: "io", label: "I/O-bound (espera red/disco)", tipo: "carriles", conToken: true, lanes: ["T1", "T2", "T3", "T4"],
          pasos: [
            { fills: [15, 0, 0, 0], token: 0, states: ["ejecuta", "en cola", "en cola", "en cola"], nota: "T1 hace una ráfaga corta de CPU con el GIL." },
            { fills: [20, 18, 0, 0], token: 1, cls: ["warn", "", "", ""], states: ["espera I/O", "ejecuta", "en cola", "en cola"], nota: "Al esperar I/O, T1 SUELTA el GIL: mientras espera (ámbar) no lo necesita." },
            { fills: [45, 45, 45, 45], token: -1, cls: ["warn", "warn", "warn", "warn"], states: ["espera I/O", "espera I/O", "espera I/O", "espera I/O"], nota: "Los cuatro esperan I/O a la vez, solapados — nadie pelea por el token." },
            { fills: [100, 100, 100, 100], token: -1, cls: ["ok", "ok", "ok", "ok"], states: ["✓ listo", "✓ listo", "✓ listo", "✓ listo"], nota: "Terminan mucho antes: para I/O, los threads SÍ escalan.", tone: "ok" }
          ]
        }
      ]
    }
  });

  // 07 · Free-threading ----------------------------------------------------
  function rcNode(who, active, reg, lock) {
    return "<div class='w-node" + (active ? "" : " dim") + "' style='min-width:110px'>" +
      "<span class='t'>Thread " + who + (lock ? " 🔒" : "") + "</span>" +
      "<span class='v'>" + (active ? active : "—") + "</span>" +
      (reg != null ? "<span class='t'>lee: " + reg + "</span>" : "") + "</div>";
  }
  function rcCounter(n, tone) {
    return "<div class='w-node" + (tone === "bad" ? " bad" : "") + "' style='flex:0 0 120px'>" +
      "<span class='t'>ob_refcnt</span><span class='c'>" + n + "</span><span class='t'>esperado: 3</span></div>";
  }
  var ft = [
    { vis: "<div class='w-nodes'>" + rcNode("A", null) + rcCounter(1) + rcNode("B", null) + "</div>", nota: "Dos threads quieren incrementar el refcount del MISMO objeto. Esperado: 1 → 3." },
    { vis: "<div class='w-nodes'>" + rcNode("A", "lee count", 1) + rcCounter(1) + rcNode("B", null) + "</div>", nota: "A lee count = 1." },
    { vis: "<div class='w-nodes'>" + rcNode("A", "tiene 1", 1) + rcCounter(1) + rcNode("B", "lee count", 1) + "</div>", nota: "B lee ANTES de que A escriba: los dos ven 1.", tone: "warn" },
    { vis: "<div class='w-nodes'>" + rcNode("A", "escribe 2", 2) + rcCounter(2, "bad") + rcNode("B", "escribe 2", 2) + "</div>", nota: "Ambos escriben 2. Actualización perdida: count = 2, pero hay 3 referencias → el objeto se liberará demasiado pronto (use-after-free).", tone: "bad" },
    { vis: "<div class='w-nodes'>" + rcNode("A", "incremento atómico", null, true) + rcCounter(3) + rcNode("B", "incremento atómico", null, true) + "</div>", nota: "Con conteo thread-safe (biased refcount / lock por-objeto) cada incremento es atómico: count = 3, correcto. Sin un candado global.", tone: "ok" }
  ];
  T.push({
    slug: "free-threading", folio: "07", bloque: 2, fam: 2, dificultad: 3, estrella: true, estrellaNota: "la gran transición",
    cardTitulo: "Free-threading (sin GIL)",
    titulo: "Free-threaded Python (sin GIL)",
    tagline: "Desde 3.14, build soportado sin GIL: paralelismo real de threads en varios núcleos (PEP 703/779).",
    evita: "Asumir que ya es el build por defecto.",
    lede: "Desde Python <strong>3.14</strong> existe un build <em>oficialmente soportado</em> sin GIL: por primera vez, los threads corren bytecode en paralelo de verdad.",
    enBreve: [
      "Es la noticia más grande del runtime en décadas (<b>PEP 703/779</b>).",
      "El reto técnico: hacer <b>thread-safe el refcount</b> sin un candado global.",
      "La solución: <b>biased refcount</b>, contadores inmortales y locks por-objeto.",
      "Cuesta <b>~5–10%</b> en single-thread; soportado pero <b>opcional</b> en 3.14."
    ],
    fundamento: "Es el «antes y después» que da sentido a todo el bloque de concurrencia: el candado global que definía el GIL deja de ser obligatorio. Los threads pueden, por fin, ejecutar bytecode en paralelo sobre varios núcleos.",
    fuerza: "Quitar el GIL desbloquea el paralelismo de CPU real con threads — pero exige hacer thread-safe el reference counting sin un candado global, el problema técnico central.",
    comoFunciona: "La solución combina <strong>biased reference counting</strong>, contadores <em>inmortales</em> para objetos permanentes, y locks más finos por-objeto en lugar de uno global. Cuesta ~<strong>5–10%</strong> en single-thread (mejorando por versión). Roadmap: soportado pero opcional en 3.14; más adelante, GIL controlable por flag; y quizá (2028–2030) un default sin GIL.",
    mito: {
      mito: "«Python 3.14 ya no tiene GIL».",
      realidad: "El free-threading está <em>soportado</em> pero <strong>no es el build por defecto</strong> todavía; convives con dos builds. Y ganar paralelismo no es gratis: exige código y extensiones C realmente thread-safe."
    },
    recursos: [
      { texto: "PEP 703 — Making the GIL Optional", url: "https://peps.python.org/pep-0703/", star: true },
      { texto: "Python support for free threading — docs", url: "https://docs.python.org/3/howto/free-threading-python.html" },
      { texto: "Removing the GIL: The Gilectomy — Larry Hastings", url: "https://www.youtube.com/watch?v=P3AyI_u66Bw" }
    ],
    widgetLabel: "Visualízalo — paralelismo real y el refcount seguro",
    widget: {
      intro: "Sin GIL los carriles avanzan a la vez — pero hay que hacer atómico el refcount, o dos threads lo corrompen.",
      vistas: [
        {
          id: "par", label: "Sin GIL: paralelismo real", tipo: "carriles", conToken: false, lanes: ["T1", "T2", "T3", "T4"],
          pasos: [
            { fills: [20, 20, 20, 20], states: ["ejecuta", "ejecuta", "ejecuta", "ejecuta"], nota: "Sin candado global, los cuatro threads ejecutan bytecode a la vez, uno por núcleo." },
            { fills: [55, 55, 55, 55], states: ["ejecuta", "ejecuta", "ejecuta", "ejecuta"], nota: "Trabajo CPU-bound repartido de verdad: nadie espera un token." },
            { fills: [100, 100, 100, 100], cls: ["ok", "ok", "ok", "ok"], states: ["✓ listo", "✓ listo", "✓ listo", "✓ listo"], nota: "Terminan ~4× antes que con GIL — y escala con los núcleos disponibles.", tone: "ok" }
          ]
        },
        { id: "rc", label: "El refcount seguro", pasos: ft }
      ]
    }
  });

  // 08 · asyncio -----------------------------------------------------------
  function coros(states, fills) {
    return ["coro 1", "coro 2", "coro 3"].map(function (lbl, i) {
      var cls = states[i] === "await" ? "warn" : (states[i] === "✓ completa" ? "ok" : "");
      var st = { "ejecuta": "ejecuta", "await": "await", "lista": "lista", "✓ completa": "✓ completa" }[states[i]];
      return "<div class='w-lane'><span class='lbl' style='width:56px'>" + lbl + "</span>" +
        "<span class='track'><i class='" + cls + "' style='width:" + fills[i] + "%'></i></span>" +
        "<span class='st'>" + st + "</span></div>";
    }).join("");
  }
  function loopBar(txt) {
    return "<div class='w-box' style='margin-bottom:10px;display:flex;align-items:center;gap:10px'>" +
      "<span class='w-tag' style='margin:0'>event loop · un hilo</span>" +
      "<span class='w-mono' style='margin-left:auto;color:var(--fam-2)'>" + txt + "</span></div>";
  }
  var asy = [
    { vis: loopBar("→ ejecuta coro 1") + "<div class='w-col'>" + coros(["ejecuta", "lista", "lista"], [10, 0, 0]) + "</div>", nota: "El loop toma la primera corrutina lista y la ejecuta hasta que haga await." },
    { vis: loopBar("← coro 1 hizo await") + "<div class='w-col'>" + coros(["await", "ejecuta", "lista"], [33, 10, 0]) + "</div>", nota: "coro 1 hace await: se suspende (ámbar) guardando su estado, y el loop salta a coro 2." },
    { vis: loopBar("→ ejecuta coro 3") + "<div class='w-col'>" + coros(["await", "await", "ejecuta"], [33, 33, 10]) + "</div>", nota: "Mientras 1 y 2 esperan su I/O, el loop mantiene ocupado el único hilo con coro 3." },
    { vis: loopBar("→ reanuda coro 1") + "<div class='w-col'>" + coros(["ejecuta", "await", "await"], [66, 33, 33]) + "</div>", nota: "El I/O de coro 1 completó: el loop la reanuda justo donde quedó, tras su await." },
    { vis: loopBar("— sin tareas pendientes") + "<div class='w-col'>" + coros(["✓ completa", "✓ completa", "✓ completa"], [100, 100, 100]) + "</div>", nota: "Todas completas. En cada instante ejecutó UNA sola corrutina; el resto esperaba I/O. Nunca hubo paralelismo, solo solapamiento.", tone: "ok" }
  ];
  T.push({
    slug: "asyncio", folio: "08", bloque: 2, fam: 2, dificultad: 2, estrella: false,
    cardTitulo: "asyncio: event loop y corrutinas",
    titulo: "asyncio: event loop y corrutinas",
    tagline: "Concurrencia cooperativa en un solo hilo: cada await cede el control al loop. Como el event loop de JS.",
    evita: "Usarlo para trabajo CPU-bound.",
    lede: "Un <em>event loop</em> de un solo hilo que multiplexa muchas corrutinas: concurrencia cooperativa, donde cada <span class='mono'>await</span> cede el control.",
    enBreve: [
      "Concurrencia <b>cooperativa</b>: nadie interrumpe a nadie, cada corrutina cede en el <code>await</code>.",
      "El loop guarda tareas listas y esperas de I/O, y reanuda cuando el I/O completa.",
      "Todo en <b>un hilo</b>: no ayuda con CPU-bound (bloquea el loop entero).",
      "Por debajo, las corrutinas son <b>generadores reanudables</b> (ver tema 03)."
    ],
    fundamento: "Para I/O concurrente sin threads, Python usa <strong>asyncio</strong>. Es concurrencia <em>cooperativa</em>: nadie interrumpe a nadie, cada corrutina (<code>async def</code>) suelta el control voluntariamente en cada <code>await</code>. Conceptualmente es el mismo modelo mental que el event loop de JavaScript.",
    fuerza: "Miles de conexiones «a la vez» con un solo hilo y sin el coste de miles de threads del SO — porque casi todo el tiempo se pasa esperando I/O, no calculando.",
    comoFunciona: "El loop mantiene tareas listas y esperas de I/O. Un <code>await</code> <strong>suspende</strong> la corrutina — guardando su estado — y devuelve el control al loop, que corre otra tarea lista; cuando el I/O completa, la corrutina se <strong>reanuda</strong> donde estaba. Todo en <strong>un hilo</strong>. Por debajo, las corrutinas son <em>generadores reanudables</em>.",
    mito: {
      mito: "«async hace tu código paralelo / más rápido».",
      realidad: "Es <em>un solo hilo</em>. No hay paralelismo; solo solapa esperas. Un cálculo pesado dentro de una corrutina <strong>bloquea el loop entero</strong> — igual que en el event loop de JavaScript."
    },
    recursos: [
      { texto: "Async IO in Python — Real Python", url: "https://realpython.com/async-io-python/" },
      { texto: "asyncio — docs oficiales", url: "https://docs.python.org/3/library/asyncio.html" },
      { texto: "Get to grips with asyncio — David Beazley", url: "https://www.youtube.com/watch?v=E-1Y4kSsAFc" }
    ],
    widgetLabel: "Visualízalo — el loop cediendo el control",
    widget: { intro: "Tres corrutinas sobre un event loop de un solo hilo. Solo una ejecuta a la vez; el await cede el turno.", pasos: asy }
  });

})(window.GUIA = window.GUIA || {});
