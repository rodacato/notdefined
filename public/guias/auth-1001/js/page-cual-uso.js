/* ============================================================================
   js/page-cual-uso.js — quiz de escenarios con veredicto razonado.
   La lección clave: el stack 2026 es políglota, cada capa en su superficie.
   ========================================================================== */
(function (G) {
  "use strict";
  var el = G.el, icon = G.icon;
  G.pages = G.pages || {};

  G.pages["cual-uso"] = function (root) {
    root.appendChild(G.topbar([{ label: "Índice", href: "#/" }, { label: "¿Cuál uso?" }], "cual-uso"));

    var shell = el("div", { class: "shell app-root" });
    root.appendChild(shell);
    var wrap = el("div", { class: "quiz" });
    shell.appendChild(wrap);

    wrap.appendChild(el("div", { class: "quiz-intro" }, [
      el("div", { class: "eyebrow", text: "Decide por el problema" }),
      el("h1", { text: "¿Cuál uso?" }),
      el("p", { text: "Responde según tu escenario y te doy un veredicto razonado — no un método, el stack." })
    ]));

    var card = el("div", { class: "quiz-card" });
    wrap.appendChild(card);

    var historial = []; // pila de nodos para "atrás"
    var nodoActual = "inicio";

    render();

    function render() {
      G.clear(card);
      var nodo = G.quizNodos[nodoActual];
      var paso = historial.length + 1;
      card.appendChild(el("div", { class: "quiz-step-label" }, [
        el("span", { text: "Pregunta " + paso }),
        historial.length ? el("button", { class: "mono", style: { color: "var(--ink-faint)" }, text: "← atrás", onClick: atras }) : el("span", { text: "" })
      ]));
      card.appendChild(el("div", { class: "quiz-q", text: nodo.pregunta }));
      var opts = el("div", { class: "quiz-options" });
      nodo.opciones.forEach(function (op, i) {
        opts.appendChild(el("button", {
          class: "quiz-opt", onClick: function () { elegir(op); }
        }, [
          el("span", { class: "qo-key", text: String.fromCharCode(65 + i) }),
          el("span", { text: op.label })
        ]));
      });
      card.appendChild(opts);
      card.classList.remove("fade-in"); void card.offsetWidth; card.classList.add("fade-in");
    }

    function elegir(op) {
      if (op.veredicto) { mostrarVeredicto(op.veredicto); return; }
      historial.push(nodoActual);
      nodoActual = op.nodo;
      render();
    }
    function atras() {
      if (!historial.length) return;
      nodoActual = historial.pop();
      render();
    }

    function mostrarVeredicto(vid) {
      var v = G.quizVeredictos[vid];
      G.clear(card);
      var res = el("div", { class: "quiz-result" });
      res.appendChild(el("div", { class: "eyebrow qr-eyebrow", text: "Veredicto" }));
      res.appendChild(el("div", { class: "qr-verdict" }, [
        el("div", { class: "qr-title", text: v.titulo }),
        el("div", { class: "qr-sub", text: v.sub })
      ]));

      var stack = el("div", { class: "qr-stack" });
      v.capas.forEach(function (c) {
        var fam = G.familiaPorId[c.fam];
        stack.appendChild(el("a", {
          class: "qr-layer", href: c.ficha ? "#/ficha/" + c.ficha : null, style: { "--fam": fam.color }
        }, [
          el("span", { class: "ql-where", text: c.where }),
          el("div", {}, [
            el("div", { class: "ql-pick", text: c.pick }),
            el("div", { class: "ql-why", text: c.why })
          ])
        ]));
      });
      res.appendChild(stack);

      res.appendChild(el("div", { class: "qr-actions" }, [
        el("button", { class: "sim-btn primary", onClick: reiniciar }, [icon("reset"), "Otra vez"]),
        el("a", { class: "sim-btn", href: "#/" }, ["Volver al índice", icon("arrow-right")])
      ]));

      card.appendChild(res);
      card.classList.remove("fade-in"); void card.offsetWidth; card.classList.add("fade-in");
    }

    function reiniciar() { historial = []; nodoActual = "inicio"; render(); }

    G.scrollTop();
  };

})(window.GUIA = window.GUIA || {});
