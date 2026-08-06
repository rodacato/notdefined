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

  /* ---- tarjeta de catálogo ---------------------------------------------- */
  function catalogCard(t) {
    const diff = el("span", { class: "card__diff" });
    if (t.star) diff.appendChild(el("span", { class: "card__star", title: "Tema estrella" }, "\u2605 "));
    diff.appendChild(document.createTextNode(t.difficulty));

    return el("a", {
      class: "card card--" + t.tag,
      href: "#/tema/" + t.slug,
      "aria-label": t.title + " \u2014 " + TAG_LABEL[t.tag],
    },
      el("div", { class: "card__top" },
        el("span", { class: "card__folio" }, t.folio),
        el("span", { class: "card__title" }, t.title),
        diff
      ),
      el("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap" }, tag(t.tag)),
      el("p", { class: "card__tagline" }, t.tagline),
      el("div", { class: "card__avoid" },
        el("span", { class: "card__avoid-label" }, "Evita"),
        el("span", { class: "card__avoid-text" }, t.avoid)
      ),
      el("span", { class: "card__cta" }, "entrar \u2192")
    );
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
          el("span", { class: "rail__model" }, b.model)
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

  function briefGrid(items) {
    return el("div", { class: "brief" },
      items.map(function (it) {
        return el("div", { class: "brief__item" },
          el("div", { class: "brief__k" }, it.k),
          el("div", { class: "brief__v", html: it.v })
        );
      })
    );
  }

  function panel(label, html, accentKind) {
    return el("div", { class: "panel", style: accentKind ? "--card-accent:var(--tag-" + accentKind + ")" : "" },
      el("div", { class: "panel__label" }, label),
      el("div", { class: "prose", html: html })
    );
  }

  function prose(paragraphs) {
    return el("div", { class: "prose" }, paragraphs.map(function (p) { return el("p", { html: p }); }));
  }

  const STEP_COLORS = ["var(--tag-motor)", "var(--sim-micro)", "var(--sim-macro)", "var(--sim-web)"];
  function stepsGrid(items) {
    return el("div", { class: "steps" },
      items.map(function (s, i) {
        return el("div", { class: "step" },
          el("div", { class: "step__n", style: "color:" + STEP_COLORS[i % STEP_COLORS.length] }, String(i + 1)),
          el("p", { class: "body", style: "font-size:13px", html: s })
        );
      })
    );
  }

  function mito(html) {
    return el("section", { class: "mito" },
      el("div", { class: "mito__label" }, "Del mito a la realidad"),
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
    catalogCard: catalogCard,
    difficulty: difficulty,
    rail: rail,
    layout: layout,
    section: section,
    briefGrid: briefGrid,
    panel: panel,
    prose: prose,
    stepsGrid: stepsGrid,
    mito: mito,
    recursos: recursos,
    codeBlock: codeBlock,
  };
})(window.GUIA = window.GUIA || {});
