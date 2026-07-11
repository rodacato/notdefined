/* ============================================================================
   1001 — Arquitecturas · js/page-cual-usar.js — vista «¿Cuál usar?» (#/cual-usar)
   Comparaciones lado a lado, rasgo que inclina la decisión en ámbar, y un quiz.
   ========================================================================== */
(function (G) {
  "use strict";
  const { h } = G;
  const pages = (G.pages = G.pages || {});
  const famVar = (n) => "var(--fam-" + n + ")";

  function cualUsar(root) {
    const D = G.data;
    let focus = "all";

    const list = h("div", { class: "comp-list" });
    const nav = h("div", { class: "compnav" });

    function paintNav() {
      [...nav.children].forEach((b) =>
        b.classList.toggle("is-on", b.dataset.focus === focus));
    }
    function setFocus(f) {
      focus = f; paintNav();
      G.clear(list);
      D.COMPARISONS.filter((c) => focus === "all" || c.id === focus)
        .forEach((c) => list.appendChild(comparison(c)));
      window.scrollTo(0, 0);
    }

    nav.appendChild(h("button", { class: "cn", type: "button", "data-focus": "all",
      onclick: () => setFocus("all") }, "Todas"));
    D.COMPARISONS.forEach((c) =>
      nav.appendChild(h("button", { class: "cn", type: "button", "data-focus": c.id,
        onclick: () => setFocus(c.id) }, c.nav)));

    G.clear(root);
    root.appendChild(h("div", { class: "wrap" },
      h("div", { class: "topbar" },
        h("div", { class: "crumbs" },
          h("a", { href: "#/catalogo" }, "Catálogo"),
          h("span", { class: "sep" }, "/"),
          h("span", { class: "here" }, "¿Cuál arquitectura usar?")),
        h("div", { class: "topmeta" }, "Almanaque técnico · 1001")),
      h("h1", { class: "title serif", "data-screen-label": "¿Cuál usar?" }, "¿Cuál arquitectura usar?"),
      h("p", { class: "lede" },
        "Rara vez el problema es no conocer el estilo: es ",
        h("em", null, "dudar entre dos que sirven para lo mismo"),
        ". Cada comparación pone los candidatos lado a lado, resalta en ámbar el rasgo que inclina la decisión, y te deja probar el ojo con un escenario."),
      h("hr", { class: "double-rule" }),
      nav, list,
      h("div", { class: "foot" },
        h("span", { class: "legend-hot" }, h("span", { class: "hb" }),
          " ámbar = el rasgo que inclina la decisión · lo demás es terreno compartido"),
        h("a", { href: "#/catalogo" }, "‹ Volver al índice"))));
    setFocus("all");
  }

  function comparison(comp) {
    let active = comp.algos[0].id;
    const left = h("div", { class: "comp-left" });
    const right = h("div", { class: "comp-right" });

    function paint() {
      const a = comp.algos.find((x) => x.id === active);
      // izquierda: pestañas + rasgos
      G.clear(left);
      const tabs = h("div", { class: "ptabs" });
      comp.algos.forEach((x) => {
        tabs.appendChild(h("button", { class: "pt" + (x.id === active ? " is-on" : ""),
          type: "button", onclick: () => { active = x.id; paint(); } },
          h("span", { class: "pdot", style: "background:" + famVar(x.fam) }), x.name));
      });
      const traits = h("div", { class: "traits" },
        a.traits.map((t) => h("div", { class: "trait" + (t.hot ? " hot" : "") },
          h("span", { class: "trait-k" }, t.k),
          h("span", { class: "trait-v" }, G.ticks(t.v, "cx")))));
      left.appendChild(tabs);
      left.appendChild(traits);
      left.appendChild(h("div", { class: "traits-cap" }, "en ámbar: el rasgo que inclina la decisión"));
      // derecha: intención que la distingue
      G.clear(right);
      right.appendChild(h("div", { class: "intent-card" },
        h("span", { class: "il" }, h("span", { class: "d" }), "la intención que la distingue"),
        h("div", { class: "iname" },
          h("span", { class: "cdot", style: "background:" + famVar(a.fam) }), a.name),
        h("p", { class: "itext" }, a.intent),
        h("p", { class: "ipick" }, h("b", null, "Elígela"), " ", a.pick)));
      right.appendChild(h("a", { class: "open-link", href: "#/catalogo" }, "Ver el catálogo completo →"));
    }
    paint();

    const quiz = h("div", { class: "quiz" },
      h("div", { class: "quiz-h" },
        h("span", { class: "qic" }, "?"), h("span", { class: "qt" }, "¿Cuál aplica?")),
      comp.scenarios.map((s) => scenario(s, comp.algos)));

    const titleRow = h("div", { class: "comp-title" });
    comp.title.forEach((t, i) => {
      if (i > 0) titleRow.appendChild(h("span", { class: "comp-vs" }, "vs"));
      titleRow.appendChild(h("span", null, t));
    });
    titleRow.appendChild(h("span", { class: "same-chip" }, "mismo objetivo · " + comp.same));

    return h("section", { class: "comp", "data-screen-label": "Comparación " + comp.nav },
      h("div", { class: "comp-head" }, titleRow, h("p", { class: "comp-tag" }, comp.tagline)),
      h("div", { class: "comp-body" }, left, right),
      quiz);
  }

  function scenario(scn, algos) {
    const correct = algos.find((a) => a.id === scn.answer);
    const opts = h("div", { class: "opts" });
    const answer = h("div", { class: "answer", style: "display:none" });
    let done = false;

    algos.forEach((a) => {
      const btn = h("button", { class: "opt", type: "button",
        onclick: () => pick(a.id) }, a.name);
      btn.dataset.aid = a.id;
      opts.appendChild(btn);
    });

    function pick(id) {
      if (done) return;
      done = true;
      [...opts.children].forEach((b) => {
        b.disabled = true;
        if (b.dataset.aid === scn.answer) b.classList.add("correct");
        else if (b.dataset.aid === id) b.classList.add("wrong");
        else b.classList.add("muted");
      });
      G.clear(answer);
      answer.appendChild(h("span", { class: "ck" }, id === scn.answer ? "✓" : "→"));
      answer.appendChild(h("span", null, h("b", null, correct.name + "."), " " + scn.why));
      answer.style.display = "";
    }

    return h("div", { class: "scenario" },
      h("div", { class: "prompt" }, h("span", { class: "q" }, "Necesito…"), scn.prompt),
      opts, answer);
  }

  pages.cualUsar = cualUsar;
})(window.GUIA = window.GUIA || {});
