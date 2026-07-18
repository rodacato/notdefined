/* ============================================================================
   js/components.js — piezas compartidas
   ----------------------------------------------------------------------------
   Cromo (topbar, colofón), tarjetas de catálogo, barras de rating y los DOS
   motores de simulación: secuencia (diagrama de actores) y logout (comparación
   de 3 estrategias). Todo determinista; sin Math.random.
   ========================================================================== */
(function (G) {
  "use strict";
  var el = G.el, icon = G.icon;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Cromo: barra superior y colofón                                    */
  /* ------------------------------------------------------------------ */
  G.topbar = function (crumbs, rutaActiva) {
    var nav = el("nav", {}, [
      link("#/", "Índice", rutaActiva === "inicio"),
      link("#/cual-uso", "¿Cuál uso?", rutaActiva === "cual-uso"),
      link("#/desambiguacion", "Desambiguación", rutaActiva === "desambiguacion")
    ]);
    function link(href, txt, activo) {
      var a = el("a", { href: href, text: txt });
      if (activo) a.className = "active";
      return a;
    }
    var crumbNodes = [];
    (crumbs || []).forEach(function (c, i) {
      if (i > 0) crumbNodes.push(el("span", { text: "·" }));
      crumbNodes.push(c.href ? el("a", { href: c.href, text: c.label }) : el("span", { text: c.label }));
    });

    return el("div", { class: "topbar" }, [
      el("a", { class: "back", href: "/guias/" }, [icon("arrow-left"), "notdefined.dev/guias"]),
      el("span", { class: "crumbs" }, crumbNodes),
      el("span", { class: "spacer" }),
      nav,
      G.themeToggle()
    ]);
  };

  /* Toggle de tema · 3 botones (claro / oscuro / sistema). Persiste y se
     sincroniza vía el evento "guia:theme". */
  G.themeToggle = function () {
    var wrap = el("div", { class: "theme-toggle-group", role: "group", "aria-label": "Tema" });
    var opciones = [["light", "sun", "Claro"], ["dark", "moon", "Oscuro"], ["system", "monitor", "Sistema"]];
    var btns = {};
    opciones.forEach(function (o) {
      var b = el("button", {
        class: "tt-btn", "aria-label": o[2], title: o[2],
        onClick: function () { G.aplicarTema(o[0]); }
      }, [icon(o[1])]);
      btns[o[0]] = b;
      wrap.appendChild(b);
    });
    function sync() {
      var p = G.leerTema();
      Object.keys(btns).forEach(function (k) {
        btns[k].classList.toggle("active", k === p);
        btns[k].setAttribute("aria-pressed", k === p ? "true" : "false");
      });
    }
    sync();
    window.addEventListener("guia:theme", sync);
    return wrap;
  };

  G.colofon = function () {
    return el("footer", { class: "colofon shell" }, [
      el("div", { class: "cf-left" }, [
        el("span", { class: "mark", html: G.markSVG() }),
        el("span", { text: "1001 · almanaque técnico" })
      ]),
      el("nav", {}, [
        el("a", { href: "#/", text: "Índice" }),
        el("a", { href: "#/cual-uso", text: "¿Cuál uso?" }),
        el("a", { href: "#/desambiguacion", text: "Desambiguación" })
      ])
    ]);
  };

  /* ------------------------------------------------------------------ */
  /* Tarjeta de catálogo                                                */
  /* ------------------------------------------------------------------ */
  G.catalogCard = function (m, dimmed) {
    var fam = G.familiaPorId[m.familia];
    var comp = G.complejidadGlyph(m.ejes.complejidad);
    var tags = [];
    if (m.frecuencia === "nucleo") tags.push(el("span", { class: "tag star" }, ["★ núcleo"]));
    tags.push(el("span", { class: "tag" }, [
      el("span", { class: "glyphs" }, [
        el("span", { class: "on", text: "◆".repeat(comp.llenos) }),
        el("span", { class: "off", text: "◆".repeat(comp.vacios) })
      ]),
      " complejidad"
    ]));

    var card = el("button", {
      class: "cat-card" + (dimmed ? " dimmed" : ""),
      style: { "--fam": fam.color },
      onClick: function () { location.hash = "#/ficha/" + m.id; }
    }, [
      el("div", { class: "cc-top" }, [
        el("div", {}, [
          el("div", { class: "cc-folio", text: m.folio }),
          el("h3", { class: "cc-title", text: m.titulo })
        ]),
        el("span", { class: "cc-kind", text: m.tipo })
      ]),
      el("p", { class: "cc-desc", text: m.desc }),
      el("div", { class: "cc-foot" }, [
        el("div", { class: "cc-tags" }, tags),
        el("span", { class: "cc-go" }, ["entrar", icon("arrow-right")])
      ])
    ]);
    return card;
  };

  /* ------------------------------------------------------------------ */
  /* Barras de rating (7 ejes)                                          */
  /* ------------------------------------------------------------------ */
  G.ratingsPanel = function (m) {
    var fam = G.familiaPorId[m.familia];
    var filas = G.ejes.map(function (eje) {
      var val = m.ejes[eje.key];
      if (val == null) {
        return el("div", { class: "rating na" }, [
          el("span", { class: "r-label", text: eje.label }),
          el("div", { class: "r-track" }),
          el("span", { class: "r-num mono", text: "n/a" })
        ]);
      }
      var pct = Math.round((val / 7) * 100);
      var fill = el("div", { class: "r-fill" + (eje.inverso ? " inverse" : ""), style: { width: "0%" } });
      // Anima el ancho de 0 → pct. Doble rAF para el arranque suave y un
      // timeout de respaldo que garantiza el valor final aunque el rAF falle.
      if (reduce) {
        fill.style.width = pct + "%";
      } else {
        requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = pct + "%"; }); });
        setTimeout(function () { fill.style.width = pct + "%"; }, 90);
      }
      return el("div", { class: "rating" }, [
        el("span", { class: "r-label", text: eje.label + (eje.inverso ? " ↓" : "") }),
        el("div", { class: "r-track" }, [fill]),
        el("span", { class: "r-num mono", text: val + "/7" })
      ]);
    });

    var fichaData = G.fichas[m.id] || {};
    var notas = [el("span", { text: "Ejes con ↓: más es peor (complejidad, dependencia)." })];
    if (fichaData.ejesNota) notas.push(el("span", { text: " · En autorización, «resistencia a phishing» no aplica directo: la authz asume identidad ya probada." }));

    return el("div", { class: "panel span2", style: { "--fam": fam.color } }, [
      el("div", { class: "p-label" }, [el("span", { class: "dot", style: { background: fam.color } }), "Ratings · 7 ejes fijos"]),
      el("div", { class: "ratings" }, filas),
      el("p", { class: "ratings-note", html: notas.map(function (n) { return n.outerHTML; }).join("") })
    ]);
  };

  /* ================================================================== */
  /* MOTOR DE PASOS reutilizable (playback + teclado + pips)            */
  /* ================================================================== */
  // simEl: contenedor .sim (recibe foco y teclado). total: nº de pasos.
  // pintar(i, dir): callback que actualiza el escenario y la narración.
  // Devuelve { controles, destruir } — inserta `controles` en el DOM.
  function motorPasos(simEl, total, pintar) {
    var i = 0, playing = false, timer = null;

    var btnReset = ctrlBtn("reset", "Reiniciar");
    var btnPrev  = ctrlBtn("step-back", "Paso anterior");
    var btnPlay  = ctrlBtn("play", "Reproducir", true);
    var btnNext  = ctrlBtn("step-fwd", "Siguiente paso");
    var pips = el("div", { class: "sim-progress" },
      Array.apply(null, { length: total }).map(function () { return el("span", { class: "pip" }); }));
    var count = el("span", { class: "sim-count" });

    var controles = el("div", { class: "sim-controls" }, [
      btnReset, btnPrev, btnPlay, btnNext, pips, count
    ]);

    function ctrlBtn(ic, label, primary) {
      var b = el("button", { class: "sim-btn" + (primary ? " primary" : ""), "aria-label": label, title: label }, [icon(ic)]);
      return b;
    }

    function refrescar(dir) {
      pintar(i, dir);
      var pipEls = pips.children;
      for (var k = 0; k < pipEls.length; k++) {
        pipEls[k].className = "pip" + (k < i ? " done" : k === i ? " now" : "");
      }
      count.textContent = (i + 1) + " / " + total;
      btnPrev.disabled = i === 0;
      btnNext.disabled = i === total - 1 && !playing;
      G.clear(btnPlay).appendChild(icon(playing ? "pause" : (i === total - 1 ? "reset" : "play")));
    }

    function ir(n, dir) {
      i = Math.max(0, Math.min(total - 1, n));
      refrescar(dir);
    }
    function sig() { if (i < total - 1) ir(i + 1, 1); }
    function prev() { if (i > 0) ir(i - 1, -1); }
    function reiniciar() { detener(); ir(0, -1); }

    function reproducir() {
      if (i >= total - 1) { ir(0, 1); } // reinicia si estaba al final
      playing = true;
      refrescar(1);
      timer = setInterval(function () {
        if (i >= total - 1) { detener(); refrescar(1); return; }
        ir(i + 1, 1);
      }, reduce ? 900 : 1700);
    }
    function detener() {
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      refrescar();
    }
    function toggle() { playing ? detener() : reproducir(); }

    btnReset.addEventListener("click", reiniciar);
    btnPrev.addEventListener("click", function () { detener(); prev(); });
    btnNext.addEventListener("click", function () { detener(); sig(); });
    btnPlay.addEventListener("click", toggle);

    simEl.tabIndex = 0;
    function onKey(e) {
      if (e.key === "ArrowRight") { e.preventDefault(); detener(); sig(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); detener(); prev(); }
      else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); toggle(); }
    }
    simEl.addEventListener("keydown", onKey);

    ir(0, 1);
    return { controles: controles, destruir: function () { detener(); simEl.removeEventListener("keydown", onKey); } };
  }

  /* ================================================================== */
  /* Simulación tipo SECUENCIA (diagrama de actores)                    */
  /* ================================================================== */
  function simSecuencia(sim) {
    var actores = sim.actores;
    var indicePorActor = {};
    actores.forEach(function (a, idx) { indicePorActor[a.id] = idx; });
    var N = actores.length;

    var simEl = el("div", { class: "sim" });
    var tabsWrap = el("div", { class: "sh-tabs" });
    simEl.appendChild(el("div", { class: "sim-head" }, [
      el("div", { class: "sh-title", text: sim.titulo }),
      tabsWrap
    ]));

    var cuerpo = el("div", {});
    simEl.appendChild(cuerpo);

    var motorActual = null;
    var tabBtns = [];

    function cargarTab(tabIdx) {
      if (motorActual) motorActual.destruir();
      G.clear(cuerpo);
      tabBtns.forEach(function (b, k) { b.className = "chip" + (k === tabIdx ? " active" : ""); });

      var pasos = sim.tabs[tabIdx].pasos;

      // Escenario: actores + wire
      var actorEls = actores.map(function (a) {
        return el("div", { class: "seq-actor", "data-actor": a.id, style: { "--ac": a.color } }, [
          el("div", { class: "sa-badge" }, [icon(a.icon || actorIcon(a.id))]),
          el("div", { class: "sa-label", text: a.label })
        ]);
      });
      var seqActors = el("div", { class: "seq-actors", style: { gridTemplateColumns: "repeat(" + N + ", 1fr)" } }, actorEls);

      var wire = el("div", { class: "seq-wire" });
      // Lifelines estáticas, una por actor.
      actores.forEach(function (a, idx) {
        var center = ((idx + 0.5) / N) * 100;
        wire.appendChild(el("div", { class: "seq-lifeline", style: { left: center + "%" } }));
      });
      var capaMsg = el("div", { style: { position: "absolute", inset: "0" } });
      wire.appendChild(capaMsg);

      var stage = el("div", { class: "sim-stage seq" }, [el("div", { class: "seq" }, [seqActors, wire])]);

      var snStep = el("span", { class: "sn-step" });
      var snText = el("div", { class: "sn-text" });
      var narr = el("div", { class: "sim-narration" }, [snStep, snText]);

      cuerpo.appendChild(stage);
      cuerpo.appendChild(narr);

      function pintar(i) {
        var paso = pasos[i];
        // Actores activos
        actorEls.forEach(function (aeEl, idx) {
          aeEl.classList.toggle("on", (paso.activos || []).indexOf(actores[idx].id) >= 0);
        });
        // Mensaje / acción local
        G.clear(capaMsg);
        if (paso.mensaje) capaMsg.appendChild(dibujarMensaje(paso.mensaje));
        else if (paso.local) capaMsg.appendChild(dibujarLocal(paso.local));
        // Narración
        snStep.textContent = "PASO " + (i + 1);
        var html = escapar(paso.narracion);
        if (paso.why) html += '<span class="why">' + escapar(paso.why) + "</span>";
        snText.innerHTML = html;
        snText.classList.remove("fade-in"); void snText.offsetWidth; if (!reduce) snText.classList.add("fade-in");
      }

      function dibujarMensaje(msg) {
        var a = indicePorActor[msg.de], b = indicePorActor[msg.a];
        var ca = ((a + 0.5) / N) * 100, cb = ((b + 0.5) / N) * 100;
        var left = Math.min(ca, cb), width = Math.abs(cb - ca);
        var haciaDerecha = cb > ca;
        var arrow = el("div", { class: "seq-arrow " + (haciaDerecha ? "to-right" : "to-left") + (msg.dashed ? " dashed" : ""), style: { width: "100%", "--mc": colorMsg(msg) } });
        var tag = el("div", { class: "seq-tag" + (msg.tipo === "ok" ? " ok" : msg.tipo === "fail" ? " fail" : ""), text: msg.etiqueta });
        var m = el("div", { class: "seq-msg" + (reduce ? "" : " fade-in"), style: { left: left + "%", width: width + "%" } }, [arrow, tag]);
        return m;
      }
      function dibujarLocal(loc) {
        var idx = indicePorActor[loc.actor];
        var center = ((idx + 0.5) / N) * 100;
        var tag = el("div", {
          class: "seq-tag" + (loc.tipo === "ok" ? " ok" : loc.tipo === "fail" ? " fail" : "") + (reduce ? "" : " fade-in"),
          style: { position: "absolute", left: center + "%", top: "50%", transform: "translate(-50%,-50%)" },
          text: "▸ " + loc.etiqueta
        });
        return tag;
      }
      function colorMsg(msg) {
        if (msg.tipo === "ok") return "var(--role-ok)";
        if (msg.tipo === "fail") return "var(--role-fail)";
        return "var(--primary)";
      }

      var motor = motorPasos(simEl, pasos.length, pintar);
      cuerpo.appendChild(motor.controles);
      motorActual = motor;
    }

    // Tabs (solo si hay más de uno)
    if (sim.tabs.length > 1) {
      sim.tabs.forEach(function (t, idx) {
        var b = el("button", { class: "chip", text: t.label, onClick: function () { cargarTab(idx); } });
        tabBtns.push(b);
        tabsWrap.appendChild(b);
      });
    }

    cargarTab(0);
    return simEl;
  }

  // Icono por defecto según el id; un actor puede traer `icon` propio en data.
  function actorIcon(id) {
    var map = {
      browser: "browser", app: "app", auth: "key", api: "api", idp: "idp",
      server: "server", partner: "app", atacante: "alert", sp: "app"
    };
    return map[id] || "target";
  }

  /* ================================================================== */
  /* Simulación tipo LOGOUT (comparación de 3 estrategias)              */
  /* ================================================================== */
  function simLogout(sim) {
    var simEl = el("div", { class: "sim logout-sim" });
    simEl.appendChild(el("div", { class: "sim-head" }, [el("div", { class: "sh-title", text: sim.titulo })]));

    var tokenEls = {}, verdictEls = {}, timerFills = {};
    var trackCols = sim.tracks.map(function (t) {
      var token = el("div", { class: "lo-token" });
      var timerFill = el("div", { class: "tk-fill", style: { width: "0%" } });
      token.appendChild(el("div", { class: "tk-timer" }, [timerFill]));
      var verdict = el("div", { class: "lo-verdict", style: { display: "none" } });
      tokenEls[t.id] = token; verdictEls[t.id] = verdict; timerFills[t.id] = timerFill;
      return el("div", { class: "lo-track" }, [
        el("div", {}, [
          el("div", { class: "lt-name", text: t.nombre }),
          el("div", { class: "lt-sub", text: t.sub })
        ]),
        token,
        verdict
      ]);
    });
    var tracksWrap = el("div", { class: "lo-tracks" }, trackCols);
    simEl.appendChild(tracksWrap);

    var snStep = el("span", { class: "sn-step" });
    var snText = el("div", { class: "sn-text" });
    simEl.appendChild(el("div", { class: "sim-narration" }, [snStep, snText]));

    function pintar(i) {
      var paso = sim.pasos[i];
      snStep.textContent = "T" + i;
      snText.innerHTML = escapar(paso.narracion);
      snText.classList.remove("fade-in"); void snText.offsetWidth; if (!reduce) snText.classList.add("fade-in");

      sim.tracks.forEach(function (t) {
        var s = paso.estados[t.id];
        var tk = tokenEls[t.id];
        // La barra de timer es el primer hijo estático; el estado va en su propio nodo.
        tk.className = "lo-token " + s.estado;
        // reconstruye contenido salvo la barra de timer
        G.clear(tk);
        tk.appendChild(el("div", { class: "tk-state" }, [glifoEstado(s.estado), etiquetaEstado(s.estado)]));
        tk.appendChild(el("div", { class: "tk-detail", text: s.detalle }));
        if (s.timer != null) {
          var fill = el("div", { class: "tk-fill", style: { width: s.timer + "%" } });
          tk.appendChild(el("div", { class: "tk-timer" }, [fill]));
        }
        var v = verdictEls[t.id];
        if (s.verdict && s.verdict.texto) {
          v.style.display = "";
          v.className = "lo-verdict " + (s.verdict.tono === "win" ? "win" : s.verdict.tono === "lose" ? "lose" : "");
          v.textContent = s.verdict.texto;
        } else {
          v.style.display = "none";
        }
      });
    }

    function glifoEstado(estado) {
      return el("span", { text: estado === "alive" ? "●" : estado === "dead" ? "✕" : "◐" });
    }
    function etiquetaEstado(estado) {
      return document.createTextNode(estado === "alive" ? "Vivo" : estado === "dead" ? "Muerto" : "Zombi — sigue válido");
    }

    var motor = motorPasos(simEl, sim.pasos.length, pintar);
    simEl.appendChild(motor.controles);
    return simEl;
  }

  /* ------------------------------------------------------------------ */
  G.montarSim = function (simId) {
    var sim = G.simulaciones[simId];
    if (!sim) return el("div", { text: "" });
    return sim.tipo === "logout" ? simLogout(sim) : simSecuencia(sim);
  };

  function escapar(s) {
    return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
  }

})(window.GUIA = window.GUIA || {});
