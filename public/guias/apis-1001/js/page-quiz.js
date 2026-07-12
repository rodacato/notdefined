/* ==========================================================================
   js/page-quiz.js — «Cuál uso»: quiz de escenarios con veredicto razonado
   Determinista, sin puntajes aleatorios. La última pregunta enseña que los
   sistemas reales combinan estilos.
   ========================================================================== */
(function (G) {
  "use strict";
  G.pages = G.pages || {};

  G.pages.quiz = function () {
    var estado = { i: 0, elegido: null, aciertos: 0, respondidas: [] };
    var body = G.el("div", { class: "quiz-card surface" });

    var head = G.el("div", {}, [
      G.el("span", { class: "eyebrow", text: "Cuál uso" }),
      G.el("h1", { style: { marginTop: "var(--space-2)" }, text: "Quiz de escenarios" }),
      G.el("p", { class: "lead", style: { maxWidth: "62ch", marginTop: "var(--space-3)" }, text: "Lee el escenario y elige. La respuesta razona el porqué — con filo cuando toca." })
    ]);

    var progress = G.el("div", { class: "quiz-progress" });

    var root = G.el("div", {}, [G.shell([
      head,
      G.el("hr", { class: "rule-double", style: { margin: "var(--space-6) 0" } }),
      G.el("div", { class: "quiz-wrap" }, [progress, body])
    ])]);

    render();
    return root;

    function render() {
      G.clear(progress);
      G.quiz.forEach(function (_, i) {
        var cls = "qp" + (i < estado.i ? " done" : (i === estado.i && !estado.terminado ? " cur" : ""));
        progress.appendChild(G.el("div", { class: cls }));
      });

      G.clear(body);
      if (estado.terminado) return renderResultado();

      var q = G.quiz[estado.i];
      body.appendChild(G.el("span", { class: "eyebrow", text: "Escenario " + (estado.i + 1) + " / " + G.quiz.length }));
      body.appendChild(G.el("p", { class: "quiz-scenario", text: q.escenario }));

      var opts = G.el("div", { class: "quiz-options" });
      q.opciones.forEach(function (o, k) {
        var cls = "quiz-opt";
        if (estado.elegido) {
          if (o.id === q.correcta) cls += " correct";
          else if (o.id === estado.elegido) cls += " wrong";
        }
        var btn = G.el("button", { class: cls, disabled: estado.elegido ? "disabled" : null,
          onclick: function () { elegir(o.id); } }, [
          G.el("span", { class: "qk", text: String.fromCharCode(65 + k) }),
          G.el("span", { text: o.label }),
          (estado.elegido && o.id === q.correcta) ? G.el("span", { class: "mk-check", style: { marginLeft: "auto" }, text: "✓" }) :
            (estado.elegido && o.id === estado.elegido) ? G.el("span", { class: "mk-cross", style: { marginLeft: "auto" }, text: "✗" }) : null
        ]);
        opts.appendChild(btn);
      });
      body.appendChild(opts);

      if (estado.elegido) {
        var acierto = estado.elegido === q.correcta;
        var v = G.el("div", { class: "quiz-verdict" }, [
          G.el("div", { class: "qv-label", text: acierto ? "Correcto" : "Mira bien" })
        ].concat(q.veredicto.map(function (p) { return G.el("p", { text: p }); })));
        body.appendChild(v);

        var nav = G.el("div", { class: "quiz-nav" }, [
          G.el("span", { class: "caption", text: "Aciertos: " + estado.aciertos + " / " + (estado.i + 1) }),
          G.el("button", { class: "sim-btn primary", onclick: siguiente,
            html: (estado.i < G.quiz.length - 1 ? "Siguiente " : "Ver resultado ") + G.iconStr("arrowRight") })
        ]);
        body.appendChild(nav);
      }
    }

    function elegir(id) {
      if (estado.elegido) return;
      estado.elegido = id;
      if (id === G.quiz[estado.i].correcta && estado.respondidas.indexOf(estado.i) === -1) {
        estado.aciertos++;
      }
      estado.respondidas.push(estado.i);
      render();
    }
    function siguiente() {
      if (estado.i < G.quiz.length - 1) { estado.i++; estado.elegido = null; }
      else { estado.terminado = true; }
      render();
    }
    function renderResultado() {
      body.appendChild(G.el("div", { class: "quiz-result" }, [
        G.el("span", { class: "eyebrow", text: "Resultado" }),
        G.el("div", { class: "score", text: estado.aciertos + " / " + G.quiz.length }),
        G.el("p", { class: "lead", style: { maxWidth: "50ch", margin: "var(--space-4) auto 0" },
          html: "La moraleja no es el puntaje: es que <em>ningún estilo gana en todas las fronteras</em>. REST público + gRPC interno + webhooks hacia afuera no es incoherencia — es madurez." }),
        G.el("div", { class: "row", style: { justifyContent: "center", marginTop: "var(--space-8)", gap: "var(--space-3)" } }, [
          G.el("button", { class: "sim-btn", onclick: function () { estado = { i: 0, elegido: null, aciertos: 0, respondidas: [] }; render(); }, html: G.iconStr("replay") + " Reintentar" }),
          G.el("a", { class: "sim-btn primary", href: "#/desambiguacion", text: "Desambiguar los que confunden →" })
        ])
      ]));
    }
  };

})(window.GUIA = window.GUIA || {});
