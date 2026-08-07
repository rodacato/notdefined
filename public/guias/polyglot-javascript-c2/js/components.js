/* components.js — piezas compartidas: cromo, secciones de ficha, code block
   y el player paso a paso (el widget estrella). Depende de core.js. */
(function (G) {
  "use strict";
  const el = G.el, svg = G.svg;

  const TAG_LABEL = { motor: "Motor", runtime: "Runtime", lenguaje: "Lenguaje" };
  const TAG_SUB = { motor: "V8", runtime: "navegador / Node", lenguaje: "spec ECMAScript" };

  /* ---- toggle de tema (3 botones: claro / oscuro / sistema) ------------- */
  function themeToggle() {
    const wrap = el("div", { class: "themetoggle", role: "group", "aria-label": "Tema de color" });
    const defs = [
      { pref: "light", icon: "sun", label: "Tema claro" },
      { pref: "dark", icon: "moon", label: "Tema oscuro" },
      { pref: "system", icon: "monitor", label: "Según el sistema" },
    ];
    function sync() {
      const cur = G.readThemePref();
      for (const b of wrap.children) b.setAttribute("aria-pressed", b.dataset.pref === cur ? "true" : "false");
    }
    for (const d of defs) {
      const b = el("button", {
        type: "button", "aria-label": d.label, title: d.label, dataset: { pref: d.pref },
        onClick: function () { G.setTheme(d.pref); sync(); },
      }, svg(d.icon, 16));
      wrap.appendChild(b);
    }
    sync();
    window.addEventListener("guia:theme", sync);
    return wrap;
  }

  /* ---- barra superior (en todas las vistas) ----------------------------- */
  function topbar() {
    return el("div", { class: "topbar" },
      el("a", { class: "topbar__back", href: "/guias/" }, "\u2190 notdefined.dev/guias"),
      themeToggle()
    );
  }

  /* ---- tag de capa (DATO — color fijo) ---------------------------------- */
  function tag(kind) {
    return el("span", { class: "tag tag--" + kind }, TAG_LABEL[kind]);
  }

  /* ---- rampa de dificultad (los rombos solos no le dicen nada a un lector
         de pantalla; la etiqueta es la que informa) ----------------------- */
  function difficulty(glyph) {
    const n = (String(glyph).match(/◆/g) || []).length || 2;
    const label = "dificultad " + n + " de 3";
    return el("span", { class: "rail__diff", "aria-label": label, title: label },
      el("span", { class: "diff--full" }, "◆◆◆".slice(0, n)),
      el("span", { class: "diff--empty" }, "◇◇◇".slice(0, 3 - n))
    );
  }

  /* ---- riel: el índice de la guía, presente en todas las vistas ---------- */
  function rail(current) {
    // En angosto el riel es la única navegación: sólo abre el bloque en curso.
    const narrow = window.matchMedia("(max-width: 940px)").matches;

    const intro = el("a", { class: "rail__link rail__link--intro", href: "#/" },
      el("span", { class: "rail__folio" }, "00"),
      el("span", { class: "rail__t" }, "Cómo usar esta guía")
    );
    if (current === "index") intro.setAttribute("aria-current", "page");

    const groups = G.data.blocks.map(function (b) {
      let holds = false;
      const items = b.slugs.map(function (slug) {
        const t = G.data.topics[slug];
        const here = slug === current;
        if (here) holds = true;
        const link = el("a", { class: "rail__link", href: "#/tema/" + slug },
          el("span", { class: "rail__folio" }, t.folio),
          el("span", { class: "rail__t" }, t.title),
          difficulty(t.difficulty)
        );
        if (here) link.setAttribute("aria-current", "page");
        return el("li", {}, link);
      });

      const group = el("details", {
        class: "rail__group",
        style: "--rail-accent:var(--tag-" + b.layer + ")",
      },
        el("summary", { class: "rail__head" },
          el("span", { class: "rail__title" }, b.folio + " · " + b.title),
          el("span", { class: "rail__model" }, b.model),
          // Dentro del summary, un click navega Y colapsaría: hay que cortarlo.
          el("a", {
            class: "rail__entrar", href: "#/tema/" + b.slugs[0],
            "aria-label": "Empezar el bloque " + b.folio,
            onClick: function (e) { e.stopPropagation(); },
          }, "empezar →")
        ),
        el("ul", { class: "rail__list" }, items)
      );
      if (!narrow || holds) group.setAttribute("open", "");
      return group;
    });

    const biblio = el("a", { class: "rail__link rail__link--end", href: "#/bibliografia" },
      el("span", { class: "rail__folio" }, "↗"),
      el("span", { class: "rail__t" }, "Bibliografía")
    );
    if (current === "bibliografia") biblio.setAttribute("aria-current", "page");

    const legend = el("p", { class: "rail__legend" },
      el("span", { class: "diff--full" }, "◆"),
      el("span", { class: "diff--empty" }, "◇◇"),
      el("span", {}, " entrada · "),
      el("span", { class: "diff--full" }, "◆◆◆"),
      el("span", {}, " segunda sentada")
    );

    return el("nav", { class: "rail", "aria-label": "Temas de la guía" },
      el("span", { class: "rail__badge" }, "nivel C2"),
      intro, groups, biblio, legend
    );
  }

  /* ---- layout de dos columnas: riel + contenido -------------------------- */
  function layout(current, ...content) {
    return el("div", { class: "shell" },
      el("div", { class: "guide-layout" }, rail(current), el("article", {}, ...content))
    );
  }

  /* ---- secciones de ficha ----------------------------------------------- */
  function section(label, ...content) {
    return el("section", { class: "section" },
      el("div", { class: "section__label" }, label),
      ...content
    );
  }

  // Cuatro datos son una línea de ficha técnica, no cuatro tarjetas compitiendo.
  function briefLine(items) {
    return el("p", { class: "datos" },
      items.map(function (it) {
        return el("span", { class: "dato" },
          el("span", { class: "dato__k" }, it.k),
          el("span", { class: "dato__v", html: it.v })
        );
      })
    );
  }

  function prose(paragraphs) {
    return el("div", { class: "prose" }, paragraphs.map(function (p) { return el("p", { html: p }); }));
  }

  function mecanismo(items) {
    return el("ol", { class: "mecanismo" },
      items.map(function (s) { return el("li", { html: s }); })
    );
  }

  function mito(html) {
    return el("section", { class: "mito" },
      el("div", { class: "mito__label" }, "Del mito a la realidad"),
      el("div", { class: "prose", html: html })
    );
  }

  /* ---- compuerta: el lector apuesta ANTES de ver la simulación ----------- */
  function prediccion(p, alResponder) {
    const ops = el("div", { class: "predice__ops", role: "group", "aria-label": "Opciones" });
    const veredicto = el("p", { class: "predice__v", "aria-live": "polite" });

    p.opciones.forEach(function (texto, i) {
      const btn = el("button", { type: "button", class: "op", html: texto });
      btn.addEventListener("click", function () {
        for (const [j, b] of [...ops.children].entries()) {
          b.disabled = true;
          if (j === p.correcta) b.classList.add("op--correcta");
          if (j === i && j !== p.correcta) b.classList.add("op--tuya");
        }
        const bien = i === p.correcta;
        veredicto.className = "predice__v " + (bien ? "predice__v--bien" : "predice__v--mal");
        veredicto.innerHTML = (bien ? "<b>Le atinaste.</b> " : "<b>No.</b> ") + p.porque;
        alResponder();
      });
      ops.appendChild(btn);
    });

    return el("div", { class: "predice" },
      el("p", { class: "predice__q", html: p.pregunta }), ops, veredicto);
  }

  /* ---- callout: una línea que el lector pega en su consola --------------- */
  function copiar(texto) {
    // file:// no es contexto seguro y ahí navigator.clipboard no existe.
    if (navigator.clipboard && window.isSecureContext)
      return navigator.clipboard.writeText(texto);
    const area = el("textarea", { class: "copia-oculta" });
    area.value = texto;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); } finally { document.body.removeChild(area); }
    return Promise.resolve();
  }

  function consola(callout) {
    if (!callout) return null;
    const boton = el("button", { class: "consola__copiar", type: "button" }, "copiar");
    boton.addEventListener("click", function () {
      copiar(callout.cmd).then(function () {
        boton.textContent = "copiado ✓";
        window.setTimeout(function () { boton.textContent = "copiar"; }, 1600);
      });
    });
    return el("section", { class: "consola" },
      el("p", { class: "consola__dice body", html: callout.dice }),
      el("div", { class: "consola__caja" },
        el("code", { class: "consola__cmd" }, callout.cmd),
        boton
      ),
      el("p", { class: "consola__sale caption" }, "→ " + callout.sale)
    );
  }

  function cuandoNo(html) {
    return el("section", { class: "cuandono" },
      el("div", { class: "cuandono__label" }, "Cuándo NO"),
      el("div", { class: "prose", html: html })
    );
  }

  function recursos(list) {
    return el("div", { class: "recursos" },
      list.map(function (r) {
        return el("a", { class: "recurso", href: r.href, target: "_blank", rel: "noopener" },
          el("span", { class: "recurso__kind", style: r.star ? "color:var(--data-star)" : "" }, (r.star ? "\u2605 " : "") + r.kind),
          el("span", { class: "recurso__title" }, r.title),
          el("span", { class: "caption" }, r.sub)
        );
      })
    );
  }

  /* ---- bloque de código estático (con resaltado + línea activa opcional) - */
  function codeBlock(cap, lines, activeLine) {
    const box = el("div", { class: "code" }, cap ? el("div", { class: "code__cap" }, cap) : null);
    lines.forEach(function (text, i) {
      const row = el("div", { class: "code__line" + (i === activeLine ? " code__line--active" : "") });
      row.appendChild(el("span", { class: "code__num" }, String(i + 1)));
      row.appendChild(el("span", { html: G.highlight(text) }));
      box.appendChild(row);
    });
    return box;
  }

  G.comp = {
    themeToggle: themeToggle,
    topbar: topbar,
    tag: tag,
    TAG_LABEL: TAG_LABEL,
    TAG_SUB: TAG_SUB,
    difficulty: difficulty,
    rail: rail,
    layout: layout,
    section: section,
    briefLine: briefLine,
    prose: prose,
    mecanismo: mecanismo,
    mito: mito,
    cuandoNo: cuandoNo,
    consola: consola,
    prediccion: prediccion,
    recursos: recursos,
    codeBlock: codeBlock,
  };
})(window.GUIA = window.GUIA || {});
