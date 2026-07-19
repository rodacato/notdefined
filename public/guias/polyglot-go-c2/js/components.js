/* components.js — piezas compartidas (cromo, cards, callouts, controles). */
(function (G) {
  "use strict";
  var el = G.el, append = G.append;

  /* ---- toggle de tema (sol / luna / monitor) -------------- */
  G.themeToggle = function () {
    var modes = [["light", "sun", "Tema claro"], ["dark", "moon", "Tema oscuro"], ["system", "monitor", "Según el sistema"]];
    var wrap = el(".theme-toggle", { role: "group", "aria-label": "Tema" });
    var current = G.getThemeMode();
    var btns = {};
    modes.forEach(function (m) {
      var b = el("button", {
        type: "button", title: m[2], "aria-label": m[2], html: G.icon(m[1], 16),
        on: { click: function () { G.setThemeMode(m[0]); paint(m[0]); } }
      });
      btns[m[0]] = b;
      append(wrap, b);
    });
    function paint(mode) { modes.forEach(function (m) { btns[m[0]].setAttribute("aria-pressed", m[0] === mode ? "true" : "false"); }); }
    paint(current);
    document.addEventListener("guia:theme", function (e) { paint(e.detail.mode); });
    return wrap;
  };

  /* ---- topbar (en todas las vistas) ----------------------- */
  G.topbar = function () {
    return el(".wrap", {}, el(".topbar", {}, [
      el("a.back", { href: "/guias/", html: "&larr; notdefined.dev/guias" }),
      G.themeToggle()
    ]));
  };

  /* ---- difficulty glyph ◆◇◇ / ◆◆◇ / ◆◆◆ ------------------- */
  G.difficultyGlyph = function (n) {
    var full = "\u25C6", empty = "\u25C7";
    return full.repeat(n) + empty.repeat(3 - n);
  };

  /* ---- HERO (índice) -------------------------------------- */
  G.hero = function () {
    var nT = G.topics.length, nB = G.blocks.length;
    var brand = el(".brandrow", {}, [
      el(".mark-eyebrow", {}, [
        el("span.glyph", { html: G.markSVG(26) }),
        el("span.eyebrow", { text: "Polyglot \u00B7 notdefined" })
      ]),
      el(".meta", {}, [
        el("div", {}, [el("strong", { text: "GO \u00B7 NIVEL C2" })]),
        el("div", { text: nT + " temas \u00B7 " + nB + " bloques" })
      ])
    ]);
    var hero = el(".hero", {}, [
      el("h1", { text: "Go a fondo" }),
      el("p.lede", { html: "El runtime de Go viaja dentro del binario: sin VM, sin JIT. Aqu\u00ED ves moverse al scheduler, al GC y al allocator que <em>compilaste dentro</em> de tu programa \u2014 y por qu\u00E9 eso cambia c\u00F3mo escribes cada l\u00EDnea." })
    ]);
    return el(".wrap", {}, [brand, hero, el("hr.rule-double")]);
  };

  /* ---- catalog card --------------------------------------- */
  G.catalogCard = function (t) {
    var blk = G.blockById(t.block);
    var glyphs = el("span.glyphs", {}, [
      t.star ? el("span.star", { text: "\u2605", title: "Tema estrella" }) : null,
      el("span", { text: G.difficultyGlyph(t.difficulty) })
    ]);
    return el("a.card", { href: "#/t/" + t.slug, style: "--card-accent:" + blk.accent + ";" }, [
      el(".top", {}, [el("span.folio", { text: t.folio }), glyphs]),
      el("h3", { text: t.title }),
      el("p.tagline", { html: t.tagline }),
      el(".avoid", {}, [el("span.tag", { text: "EVITA" }), el("span", { html: t.avoid })])
    ]);
  };

  /* ---- featured (tema estrella destacado) ----------------- */
  G.featured = function (t) {
    var blk = G.blockById(t.block);
    return el("a.featured", { href: "#/t/" + t.slug }, [
      el(".folio", { text: t.folio }),
      el(".body", {}, [
        el(".kicker", {}, [
          el("span", { html: "\u2605 El tema estrella" }),
          el("span.blk", { text: blk.short })
        ]),
        el("h2", { text: t.title }),
        el("p", { html: t.featuredBlurb || t.tagline })
      ]),
      el(".go", { html: "entrar \u2192" })
    ]);
  };

  /* ---- vista índice --------------------------------------- */
  G.renderIndex = function (root) {
    G.clear(root);
    append(root, G.topbar());
    append(root, G.hero());

    var body = el(".wrap");
    // featured
    var star = G.topics.find(function (t) { return t.featured; });
    if (star) append(body, G.featured(star));

    // bloques en orden
    G.blocks.forEach(function (b) {
      var items = G.topics.filter(function (t) { return t.block === b.id; });
      if (!items.length) return;
      append(body, el(".block-head", {}, [
        el("span.label", { text: b.label, style: "color:" + b.accent + ";" }),
        el("span.line")
      ]));
      var grid = el(".catalog");
      items.forEach(function (t) { append(grid, G.catalogCard(t)); });
      append(body, grid);
    });

    // colofón (sin colofón de generación; huevo de pascua: locale go-VM)
    append(body, el(".colophon", {}, [
      el("span", { text: "Polyglot \u2014 temas avanzados por lenguaje. Junto a Ruby a fondo." }),
      el("span", { text: "locale go-VM \u00B7 es-MX" })
    ]));
    append(root, body);
    document.title = "Go a fondo \u00B7 Polyglot";
  };

  /* ---- callouts / bloques de ficha ------------------------ */
  G.fuerza = function (data) {
    return el(".fuerza", {}, [
      el(".ico", { html: G.icon(data.icon, 20) }),
      el("div", {}, [
        el(".lbl", { text: "La fuerza" }),
        el("p", { html: data.html })
      ])
    ]);
  };

  G.briefStrip = function (items) {
    var wrap = el(".brief");
    items.forEach(function (s, i) {
      append(wrap, el(".item", {}, [
        el("span.n", { text: "0" + (i + 1) }),
        el("p", { html: s })
      ]));
    });
    return wrap;
  };

  G.mito = function (m) {
    var body = el("div", {}, [
      el(".lbl", { text: "Del mito a la realidad" }),
      el("p.claim", { html: "\u00AB" + m.claim + "\u00BB" }),
      el("p.body", { html: m.body })
    ]);
    if (m.code) append(body, el(".code", { html: m.code }));
    return el(".mito", {}, [el(".ico", { html: G.icon("err", 22) }), body]);
  };

  G.recursos = function (list) {
    var wrap = el(".recursos");
    list.forEach(function (r) {
      append(wrap, el("a", { href: r.href, target: "_blank", rel: "noopener" }, [
        el("span", { class: r.star ? "star" : "dot", text: r.star ? "\u2605" : "\u25C6" }),
        el("span.txt", { html: "<strong>" + r.title + "</strong> \u2014 " + r.desc }),
        el("span.kind", { html: r.kind + " \u2192" })
      ]));
    });
    return wrap;
  };

  /* ---- controles reutilizables ---------------------------- */
  // botón con icono
  G.button = function (label, iconName, kind, onClick, opts) {
    opts = opts || {};
    var b = el("button", { type: "button", class: "btn " + (kind || "btn-ctrl"), on: { click: onClick } });
    if (iconName) b.innerHTML = G.icon(iconName, 18);
    if (label) append(b, el("span", { text: label }));
    if (opts.disabled) b.disabled = true;
    return b;
  };

  // segmentado accesible
  G.segmented = function (options, value, onChange) {
    var wrap = el(".seg", { role: "group" });
    var btns = [];
    options.forEach(function (o) {
      var b = el("button", { type: "button", text: o.label, on: { click: function () { set(o.value); onChange(o.value); } } });
      b._val = o.value; btns.push(b); append(wrap, b);
    });
    function set(v) { btns.forEach(function (b) { b.setAttribute("aria-pressed", b._val === v ? "true" : "false"); }); }
    set(value);
    wrap._set = set;
    return wrap;
  };

  G.pill = function (label, active, onToggle) {
    var b = el("button.pill", { type: "button", text: label, on: { click: function () { onToggle(); } } });
    b.setAttribute("aria-pressed", active ? "true" : "false");
    return b;
  };

  G.codeblock = function (title, code) {
    return el(".codeblock", {}, [
      el(".cb-title", { text: title }),
      el("pre", { html: code })
    ]);
  };

  // barra de control + canvas + status (patrón común de widget)
  G.vizCard = function (controls, statusTag) {
    var canvas = el(".viz-canvas");
    var status = el(".viz-status", {}, [
      el("span.tag", { text: statusTag || "runtime" }),
      el("span.msg", { text: "" })
    ]);
    var card = el(".viz-card", {}, [
      el(".viz-bar", {}, controls),
      canvas,
      status
    ]);
    return { card: card, canvas: canvas, status: status.querySelector(".msg"), statusTag: status.querySelector(".tag") };
  };

  /* ---- vista detalle (shell) ------------------------------ */
  G.renderTopic = function (root, t) {
    G.clear(root);
    append(root, G.topbar());
    var blk = G.blockById(t.block);
    var idx = G.topics.indexOf(t);
    var prev = G.topics[idx - 1], next = G.topics[idx + 1];

    var wrap = el(".wrap-narrow.detail", { style: "--topic-accent:" + blk.accent + ";" });

    // nav
    var prevnext = el(".prevnext");
    if (prev) append(prevnext, el("a", { href: "#/t/" + prev.slug, html: "\u2190 " + prev.folio }));
    append(prevnext, el("a", { href: "#/", html: "\u00CDndice" }));
    if (next) append(prevnext, el("a", { href: "#/t/" + next.slug, html: next.folio + " " + G.esc(next.shortTitle || "") + " \u2192" }));
    append(wrap, el(".navrow", {}, [
      el("a", { href: "#/", html: "\u2190 Cat\u00E1logo Go a fondo", style: "color:var(--color-fg-subtle)" }),
      prevnext
    ]));

    // header
    append(wrap, el("header.d-header", {}, [
      el(".row", {}, [
        el("span.folio", { text: t.folio }),
        el("div", {}, [
          el(".eyebrow", { html: blk.label + (t.star ? " &nbsp;\u00B7&nbsp; \u2605 tema estrella" : (t.eyebrowExtra ? " &nbsp;\u00B7&nbsp; " + t.eyebrowExtra : "")) }),
          el("h1", { text: t.title })
        ])
      ]),
      el("p.lede", { html: t.lede }),
      el("hr.rule-double")
    ]));

    // fuerza + brief
    var sec1 = el(".section", {}, [G.fuerza(t.fuerza)]);
    if (t.legend) append(sec1, G.legend(t.legend));
    else if (t.infoCards) append(sec1, t.infoCards.layout === 2 ? G.infoCards2(t.infoCards.items) : G.infoCards3(t.infoCards.items));
    if (t.brief) append(sec1, G.briefStrip(t.brief));
    append(wrap, sec1);

    // visualización (widget) — el motor vive en widgets.js
    var vizSection = el(".section");
    append(wrap, vizSection);
    var mount = G.widgets[t.slug];
    if (mount) mount(vizSection, t);

    // mito
    if (t.mito) append(wrap, el(".section", {}, [G.mito(t.mito)]));

    // recursos
    append(wrap, el(".section", {}, [
      el(".eyebrow-line", { text: "Para profundizar" }),
      G.recursos(t.recursos)
    ]));

    append(root, wrap);
    document.title = t.folio + " \u00B7 " + t.title + " \u2014 Go a fondo";
    window.scrollTo(0, 0);
  };

  /* ---- helpers de visualización (los usan los page-*.js) --
     Cadenas SVG: cada widget se re-renderiza completo por innerHTML. */
  G.vizAcc = function (t) { return G.blockById(t.block).accent; };

  G.vizT = function (x, y, str, font, fill, anchor, extra) {
    return '<text x="' + x + '" y="' + y + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") +
      ' style="font:' + font + ';fill:' + fill + (extra ? ";" + extra : "") + '">' + G.esc(str) + "</text>";
  };

  G.vizR = function (x, y, w, h, fill, stroke, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' +
      ' fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '"' : "") +
      (extra ? " " + extra : "") + "/>";
  };

  G.vizMarker = function (id, color) {
    return '<marker id="' + id + '" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">' +
      '<path d="M0,0 L6,3 L0,6 Z" fill="' + color + '"/></marker>';
  };

  G.vizMsg = function (w, text, color) {
    w.status.textContent = text;
    w.status.style.color = color || "";
  };

  G.vizNotes = function (t) {
    return (t.viz && t.viz.notes ? t.viz.notes : []).map(function (n) {
      return el("p." + (n.faint ? "note" : "viz-note"), { html: n.html || n });
    });
  };

  /* ---- info cards / leyenda (usados por algunas fichas) --- */
  G.legend = function (items) {
    var wrap = el(".legend");
    items.forEach(function (it) {
      append(wrap, el(".item", {}, [
        el("span.swatch", { style: "background:" + it.color + ";" + (it.border ? "border:1.5px solid " + it.border + ";" : "") }),
        el("span", { html: it.html })
      ]));
    });
    return wrap;
  };
  G.infoCards3 = function (items) {
    var wrap = el(".info-3");
    items.forEach(function (c) {
      append(wrap, el(".info-card", {}, [
        el(".glyph", { text: c.glyph, style: "--ic-accent:" + c.accent + ";color:" + c.accent + ";" }),
        el("h4", { text: c.title }),
        el("p", { html: c.body })
      ]));
    });
    return wrap;
  };
  G.infoCards2 = function (items) {
    var wrap = el(".info-2");
    items.forEach(function (c) {
      append(wrap, el(".info-card.lb", { style: "--ic-accent:" + c.accent + ";" }, [
        el(".kv", { text: c.kv }),
        el(".big", { text: c.big }),
        el("p", { html: c.body })
      ]));
    });
    return wrap;
  };

})(window.GUIA = window.GUIA || {});
