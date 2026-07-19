/* components.js — piezas compartidas de cromo y de ficha.
   Todo devuelve nodos DOM; nada se inyecta como string salvo contenido
   de contenido ya confiable de los data/*.js. */
(function (G) {
  "use strict";
  var el = G.dom.el, icon = G.icon;

  /* folio calculado por posición en el orden de catálogo (2 dígitos) */
  G.folioDe = function (slug) {
    var i = G.ordenPlano().indexOf(slug);
    return i < 0 ? "··" : String(i + 1).padStart(2, "0");
  };

  var DIFF = { 1: "◆◇◇", 2: "◆◆◇", 3: "◆◆◆" };
  G.diffGlyph = function (d) { return DIFF[d] || "◆◇◇"; };

  /* ---------- barra superior (presente en todas las vistas) ---------- */
  G.topbar = function () {
    var back = el("a", { class: "topbar__back", href: "/guias/",
      html: icon("left") + "notdefined.dev/guias" });
    return el("div", { class: "topbar" }, [back, G.themeToggle()]);
  };

  G.themeToggle = function () {
    var wrap = el("div", { class: "theme-toggle", role: "group", "aria-label": "Tema" });
    var defs = [["light", "sun", "Claro"], ["dark", "moon", "Oscuro"], ["system", "monitor", "Sistema"]];
    function paint() {
      var pref = G.theme.current();
      Array.prototype.forEach.call(wrap.children, function (b) {
        b.setAttribute("aria-pressed", b.dataset.pref === pref ? "true" : "false");
      });
    }
    defs.forEach(function (d) {
      wrap.appendChild(el("button", {
        html: icon(d[1]), title: d[2], "aria-label": d[2], dataset: { pref: d[0] },
        on: { click: function () { G.theme.set(d[0]); paint(); } }
      }));
    });
    document.addEventListener("guia:theme", paint);
    paint();
    return wrap;
  };

  /* ---------- tarjeta de catálogo ---------- */
  G.card = function (theme, famVar) {
    var top = el("div", { class: "card__top" }, [
      el("span", { class: "card__folio", text: G.folioDe(theme.slug) }),
      el("span", { class: "card__diff" }, [
        theme.star ? el("span", { class: "card__star", text: "★ " }) : null,
        el("span", { text: G.diffGlyph(theme.difficulty) })
      ])
    ]);
    var card = el("a", {
      class: "card",
      href: "#/tema/" + theme.slug,
      style: "--card-accent:" + famVar + ";"
    }, [
      top,
      el("h3", { class: "card__title", text: theme.title }),
      el("p", { class: "card__tagline", text: theme.tagline }),
      el("div", { class: "card__avoid" }, [
        el("span", { class: "card__avoid-tag", text: "Evita" }),
        el("span", { class: "card__avoid-text", text: theme.avoid })
      ])
    ]);
    return card;
  };

  /* ---------- piezas de ficha ---------- */
  G.section = function (eyebrow, children, title) {
    var kids = [el("div", { class: "section__eyebrow", text: eyebrow })];
    if (title) kids.push(el("h2", { class: "section__title", text: title }));
    kids = kids.concat(children || []);
    return el("section", { class: "section" }, kids);
  };

  G.enBreve = function (items) {
    var grid = el("div", { class: "enbreve" });
    items.forEach(function (it) {
      grid.appendChild(el("div", { class: "enbreve__item" }, [
        el("div", { class: "enbreve__k", text: it.k }),
        el("div", { class: "enbreve__v", html: it.v })
      ]));
    });
    return grid;
  };

  G.fuerza = function (html) {
    return el("div", { class: "fuerza" }, [
      el("div", { class: "fuerza__body", html: '<span class="eyebrow">La fuerza</span>' + html })
    ]);
  };

  G.prose = function (html, subtle) {
    return el("p", { class: "prose" + (subtle ? " subtle" : ""), html: html });
  };

  G.codeBlock = function (title, codeHtml) {
    return el("div", { class: "codeblock" }, [
      title ? el("div", { class: "codeblock__title", text: title }) : null,
      el("pre", { html: codeHtml })
    ]);
  };

  G.codeGrid = function (blocks) {
    var grid = el("div", { class: "codegrid" + (blocks.length > 1 ? " two" : "") });
    blocks.forEach(function (b) { grid.appendChild(G.codeBlock(b.title, b.code)); });
    return grid;
  };

  G.mito = function (m) {
    return el("div", { class: "mito" }, [
      el("div", { class: "mito__card myth" }, [
        el("span", { class: "mito__tag", text: "El mito" }),
        el("p", { html: m.myth })
      ]),
      el("div", { class: "mito__card real" }, [
        el("span", { class: "mito__tag", text: "La realidad" }),
        el("p", { html: m.real })
      ])
    ]);
  };

  G.recursos = function (list) {
    var box = el("div", { class: "recursos" }, [el("hr", {})]);
    list.forEach(function (r) {
      box.appendChild(el("div", { class: "recurso" }, [
        el("span", { class: "recurso__kind", text: r.kind }),
        el("a", { class: "recurso__link", href: r.href, target: "_blank", rel: "noopener", text: r.label })
      ]));
    });
    return box;
  };

  /* ---------- shell de widget ---------- */
  G.well = function (children) {
    return el("div", { class: "well" }, [el("div", { class: "well__pad" }, children)]);
  };

  // botón de control del widget
  G.wbtn = function (opts) {
    var kids = [];
    if (opts.icon) kids.push(el("span", { html: icon(opts.icon), style: "display:inline-flex" }));
    if (opts.label) kids.push(el("span", { text: opts.label }));
    return el("button", {
      class: "wctl " + (opts.variant || ""),
      "aria-label": opts.ariaLabel || opts.label || "",
      on: { click: opts.onClick }
    }, kids);
  };

  // segmented control; onChange(value). Devuelve {node, set(value)}
  G.segmented = function (options, value, onChange) {
    var node = el("div", { class: "segmented", role: "group" });
    function paint(v) {
      Array.prototype.forEach.call(node.children, function (b) {
        b.setAttribute("aria-pressed", b.dataset.val === v ? "true" : "false");
      });
    }
    options.forEach(function (o) {
      node.appendChild(el("button", {
        text: o.label, dataset: { val: o.value },
        on: { click: function () { paint(o.value); onChange(o.value); } }
      }));
    });
    paint(value);
    return { node: node, set: paint };
  };

  // consola de error rustc a partir de líneas ya formateadas (html permitido)
  G.rustc = function (linesHtml, note) {
    var kids = [el("pre", { html: linesHtml })];
    if (note) kids.push(el("div", { class: "rustc__note", text: note }));
    return el("div", { class: "rustc" }, kids);
  };

})(window.GUIA = window.GUIA || {});
