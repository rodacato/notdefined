/* ============================================================
   js/components.js — piezas compartidas.
   Hero, nav de secciones, tarjeta de catálogo, barras de ratings
   y el MOTOR de simulación paso a paso (con animación FLIP).
   ============================================================ */
(function (G) {
  "use strict";
  var h = G.h;
  G.comp = {};

  /* ---------- Hero normalizado (idéntico en toda la serie) ---------- */
  G.comp.hero = function () {
    var total = G.catalogo.length;
    var fams = G.familias.length;
    return h("section", { class: "hero" },
      h("div", { class: "wrap" },
        h("div", { class: "hero__brandrow" },
          h("div", { class: "hero__brand" },
            h("span", { class: "hero__mark", html: G.markSVG }),
            h("span", { class: "eyebrow" }, "Almanaque técnico · 1001")
          ),
          h("div", { class: "hero__meta" },
            h("div", {}, "Tomo VII · Edición 2026"),
            h("div", {}, total + " sistemas · " + fams + " familias")
          )
        ),
        h("h1", { class: "hero__title", html: "Mensajería, recuperada por el <em>problema que resuelves</em>" }),
        h("p", { class: "hero__lede", html: "Colas, logs y pub/sub — comparados sin cuento: qué te dan, qué te cuestan y cuándo <em>no</em> usarlos. Menos nombres de moda, más criterios y trade-offs." })
      )
    );
  };

  /* ---------- Nav de secciones (tabs por hash) ---------- */
  var SECCIONES = [
    { ruta: "catalogo", label: "Catálogo" },
    { ruta: "simulaciones", label: "Simulaciones" },
    { ruta: "cual-uso", label: "¿Cuál uso?" },
    { ruta: "desambiguacion", label: "Desambiguación" }
  ];
  G.comp.sectionNav = function (activa) {
    var nav = h("nav", { class: "sectionnav", "aria-label": "Secciones" });
    SECCIONES.forEach(function (s) {
      nav.appendChild(h("a", {
        href: "#/" + s.ruta,
        class: activa === s.ruta ? "active" : "",
        "aria-current": activa === s.ruta ? "page" : null
      }, s.label));
    });
    return h("div", { class: "wrap" }, nav);
  };

  /* ---------- Nota de caducidad de los datos de referencia ---------- */
  G.comp.notaEval = function () {
    return h("p", { class: "nota-eval" },
      "Datos de referencia evaluados en julio 2026: at-least-once como default de Kafka, RabbitMQ, SQS estándar y NATS JetStream; SQS FIFO con exactly-once processing a cambio de throughput limitado. Son defaults y órdenes de magnitud, no benchmarks — y caducan.");
  };

  /* ---------- Chip / tag ---------- */
  G.comp.chip = function (txt) { return h("span", { class: "chip" }, txt); };
  G.comp.tag = function (txt) { return h("span", { class: "tag" }, txt); };

  /* ---------- Tarjeta de catálogo (afordancia = navega) ---------- */
  G.comp.catCard = function (s) {
    var color = G.colorFamilia(s.familia);
    return h("a", {
      class: "catcard", href: "#/ficha/" + s.id,
      style: { "--fam": color }
    },
      h("div", { class: "catcard__top" },
        h("span", { class: "catcard__folio" }, s.folio),
        s.estrella ? h("span", { class: "catcard__star", title: "La estrella de su familia" }, "★") : null
      ),
      h("div", { class: "catcard__name" }, s.nombre),
      h("div", { class: "catcard__model" }, s.modelo),
      h("p", { class: "catcard__one" }, s.una),
      h("span", { class: "catcard__go", html: "entrar " + G.icon("flecha", 14) })
    );
  };

  /* ---------- Barras de ratings (7 ejes) ---------- */
  G.comp.ratings = function (s) {
    var color = G.colorFamilia(s.familia);
    var panel = h("aside", { class: "ratings", style: { "--fam": color } },
      h("h3", {}, "Ratings · sobre 7")
    );
    G.ejes.forEach(function (eje) {
      var val = s.ratings[eje.id];
      var track = h("div", { class: "rate__track" });
      var fill = h("div", { class: "rate__fill" });
      track.appendChild(fill);
      panel.appendChild(h("div", { class: "rate" + (eje.heavy ? " heavy" : "") },
        h("div", { class: "rate__row" },
          h("span", { class: "rate__label" }, eje.label),
          h("span", { class: "rate__val" }, val + "/7")
        ),
        track
      ));
      // Animar el llenado tras el montaje (o directo si reduce-motion)
      var pct = (val / 7 * 100) + "%";
      if (G.reduceMotion()) { fill.style.width = pct; }
      else { requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = pct; }); }); }
    });
    panel.appendChild(h("p", { class: "rate__note" },
      "«Complejidad operativa» en rojo: más barra = más carga, no mejor."));
    return panel;
  };

  /* ============================================================
     MOTOR DE SIMULACIÓN — paso a paso, determinista, con FLIP.
     Uso: G.comp.sim("el-duplicado") → devuelve el elemento.
     ============================================================ */
  G.comp.sim = function (simId) {
    var sim = G.simulaciones[simId];
    if (!sim) return h("div", {}, "Simulación no encontrada: " + simId);

    var laneSlots = {};   // laneId -> nodo .lane__slots
    var tokenEls = {};    // tokenId -> nodo .msg (persiste entre pasos)
    var idx = 0;
    var timer = null;

    function buildLane(l) {
      var slots = h("div", { class: "lane__slots" });
      laneSlots[l.id] = slots;
      return h("div", { class: "lane", dataset: { role: l.role } },
        h("span", { class: "lane__label" }, l.label),
        slots
      );
    }

    var lanesWrap = h("div", { class: "lanes" });
    if (sim.layout === "split") {
      sim.columns.forEach(function (c, ci) {
        var colEl = h("div", { class: "lane-col" },
          h("div", { class: "colhead", html: c.title + ' <span class="mono">' + c.sub + "</span>" }));
        sim.lanes.filter(function (l) { return l.col === ci; }).forEach(function (l) { colEl.appendChild(buildLane(l)); });
        lanesWrap.appendChild(colEl);
      });
    } else {
      sim.lanes.forEach(function (l) { lanesWrap.appendChild(buildLane(l)); });
    }

    var narrText = h("p", { class: "sim__narrtext" });
    var stepLabel = h("span", { class: "sim__step" });
    var progressFill = h("div", { class: "sim__progressfill" });
    var dotsWrap = h("div", { class: "sim__dots" });
    var dots = sim.steps.map(function () { var d = h("span", { class: "sim__dot" }); dotsWrap.appendChild(d); return d; });

    var btnReset = ctrlBtn("reset", "Reiniciar", function () { reset(); });
    var btnPrev = ctrlBtn("paso", "Paso atrás", function () { pausar(); ir(idx - 1); }, true);
    var btnNext = ctrlBtn("paso", "Paso adelante", function () { pausar(); ir(idx + 1); });
    var btnPlay = ctrlBtn("play", "Reproducir", function () { toggle(); }, false, true);

    function ctrlBtn(icon, titulo, fn, flip, primary) {
      var b = h("button", {
        class: "simbtn" + (primary ? " primary" : ""),
        html: G.icon(icon, 15) + "<span>" + titulo + "</span>",
        "aria-label": titulo, title: titulo, onClick: fn
      });
      if (flip) b.querySelector("svg").style.transform = "scaleX(-1)";
      return b;
    }

    var root = h("section", { class: "sim" + (sim.layout === "split" ? " split" : ""), tabindex: "0", "aria-label": "Simulación: " + sim.title },
      h("div", { class: "sim__head" },
        h("h3", { class: "sim__title" }, sim.title),
        h("p", { class: "sim__blurb" }, sim.blurb)
      ),
      h("div", { class: "stage" }, lanesWrap),
      h("div", { class: "sim__narr" }, stepLabel, narrText),
      h("div", { class: "sim__controls" },
        btnReset, btnPrev, btnNext, btnPlay,
        h("div", { class: "sim__progress" }, progressFill),
        dotsWrap
      )
    );

    // Teclado: ← paso atrás, → paso adelante, espacio play/pausa
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); pausar(); ir(idx + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); pausar(); ir(idx - 1); }
      else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); toggle(); }
    });

    // ---- Render de un paso con FLIP (síncrono-seguro: usa reflow, no rAF) ----
    function render() {
      var step = sim.steps[idx];
      var animar = !G.reduceMotion();

      // FLIP · First: neutralizamos cualquier transform pendiente y medimos
      // la posición REAL de reposo. Así, aunque se avance muy rápido, un
      // transform viejo nunca corrompe la medición ni deja tokens desplazados.
      var firsts = {};
      if (animar) {
        Object.keys(tokenEls).forEach(function (id) {
          var el = tokenEls[id];
          el.style.transition = "none";
          el.style.transform = "none";
        });
        Object.keys(tokenEls).forEach(function (id) { firsts[id] = tokenEls[id].getBoundingClientRect(); });
      }

      var present = {};
      step.tokens.forEach(function (t) {
        present[t.id] = true;
        var el = tokenEls[t.id];
        if (!el) {
          el = h("div", { class: "msg msg--enter", dataset: { st: t.st, tid: t.id } });
          el.addEventListener("animationend", function () { el.classList.remove("msg--enter"); }, { once: true });
          tokenEls[t.id] = el;
        } else {
          el.classList.remove("msg--enter"); // ya entró antes; nada que animar de entrada
        }
        el.dataset.st = t.st;
        el.innerHTML = t.label + (t.sub ? '<span class="msg__sub">' + t.sub + "</span>" : "");
        laneSlots[t.lane].appendChild(el); // reubica y reordena
      });

      // Quitar tokens ausentes
      Object.keys(tokenEls).forEach(function (id) {
        if (!present[id]) { tokenEls[id].remove(); delete tokenEls[id]; }
      });

      // FLIP · Invert + Play (vía reflow forzado)
      if (animar) {
        Object.keys(firsts).forEach(function (id) {
          var el = tokenEls[id];
          if (!el) return;
          var last = el.getBoundingClientRect();
          var dx = firsts[id].left - last.left;
          var dy = firsts[id].top - last.top;
          if (dx || dy) el.style.transform = "translate(" + dx + "px," + dy + "px)";
        });
        void lanesWrap.offsetWidth; // reflow: fija las posiciones invertidas
        Object.keys(tokenEls).forEach(function (id) {
          var el = tokenEls[id];
          el.style.transition = "";   // restaura la transición base (all .32s)
          el.style.transform = "none"; // y anima a su lugar
        });
      }

      // Cromo: narración, folio, progreso, dots
      stepLabel.textContent = "PASO " + (idx + 1) + "/" + sim.steps.length;
      narrText.innerHTML = step.narr;
      progressFill.style.width = ((idx) / (sim.steps.length - 1) * 100) + "%";
      dots.forEach(function (d, i) {
        d.className = "sim__dot" + (i < idx ? " done" : i === idx ? " current" : "");
      });
      btnPrev.disabled = idx === 0;
      btnNext.disabled = idx === sim.steps.length - 1;
    }

    function ir(n) {
      n = Math.max(0, Math.min(sim.steps.length - 1, n));
      if (n === idx) { render(); return; }
      idx = n;
      render();
    }

    function reset() {
      pausar();
      // limpiar todos los tokens y volver al paso 0
      Object.keys(tokenEls).forEach(function (id) { tokenEls[id].remove(); });
      tokenEls = {};
      idx = 0;
      render();
    }

    function avanzarAuto() {
      if (idx >= sim.steps.length - 1) { pausar(); return; }
      ir(idx + 1);
    }

    function reproducir() {
      if (idx >= sim.steps.length - 1) { // reinicia si estaba al final
        Object.keys(tokenEls).forEach(function (id) { tokenEls[id].remove(); });
        tokenEls = {}; idx = 0; render();
      }
      btnPlay.innerHTML = G.icon("pausa", 15) + "<span>Pausa</span>";
      btnPlay.title = "Pausa";
      var intervalo = G.reduceMotion() ? 900 : 1700;
      timer = setInterval(avanzarAuto, intervalo);
    }
    function pausar() {
      if (timer) { clearInterval(timer); timer = null; }
      btnPlay.innerHTML = G.icon("play", 15) + "<span>Reproducir</span>";
      btnPlay.title = "Reproducir";
    }
    function toggle() { timer ? pausar() : reproducir(); }

    render(); // paso inicial
    return root;
  };

})(window.GUIA = window.GUIA || {});
