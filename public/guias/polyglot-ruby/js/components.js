/* ============================================================
   components.js — piezas compartidas del cromo y de las vistas.
   Construye la barra superior, la portada y la ficha de tema a
   partir de los datos de GUIA.data. Nada de contenido vive aquí.
   ============================================================ */
(function (G) {
  "use strict";
  var esc = G.esc, h = G.h;

  // ---- Toggle de tema (3 botones: claro / oscuro / sistema) -------------
  G.themeToggle = function () {
    var opts = [
      { pref: "light",  icon: G.icons.sun,     label: "Tema claro" },
      { pref: "dark",   icon: G.icons.moon,    label: "Tema oscuro" },
      { pref: "system", icon: G.icons.monitor, label: "Según el sistema" }
    ];
    var wrap = h("div", { class: "theme-toggle", role: "group", "aria-label": "Tema de la guía" });
    opts.forEach(function (o) {
      var b = h("button", { type: "button", title: o.label, "aria-label": o.label }, o.icon);
      b.dataset.pref = o.pref;
      b.addEventListener("click", function () { G.setTheme(o.pref); });
      wrap.appendChild(b);
    });
    function sync() {
      var pref = G.getThemePref();
      G.qsa("button", wrap).forEach(function (b) {
        b.setAttribute("aria-pressed", b.dataset.pref === pref ? "true" : "false");
      });
    }
    document.addEventListener("guia:theme", sync);
    sync();
    return wrap;
  };

  // ---- Barra superior (en todas las vistas) -----------------------------
  G.topbar = function (crumbHtml) {
    var bar = h("div", { class: "topbar" });
    // El enlace a la colección apunta al sitio real del dueño.
    var left = h("a", { class: "topbar__home", href: "/guias/" }, "← notdefined.dev/guias");
    var crumb = h("div", { class: "topbar__crumb" }, crumbHtml || "");
    var leftGroup = h("div", { style: "display:flex; align-items:center; gap:18px; min-width:0;" });
    leftGroup.appendChild(left);
    if (crumbHtml) leftGroup.appendChild(crumb);
    var right = h("div", { class: "topbar__right" });
    right.appendChild(G.themeToggle());
    bar.appendChild(leftGroup);
    bar.appendChild(right);
    return bar;
  };

  // ---- Portada / índice --------------------------------------------------
  G.renderIndex = function () {
    var c = G.data.catalog;
    var root = h("div");
    root.appendChild(G.topbar(""));

    var main = h("main", { class: "wrap" });

    // Hero de la casa
    var hero = h("div", { class: "page hero" });
    hero.innerHTML =
      '<div class="hero__brand">' +
        '<div class="hero__mark">' + G.markSVG(26) +
          '<span class="eyebrow">Polyglot · notdefined</span>' +
        '</div>' +
        '<div class="hero__meta"><b>Ruby · Edición 2026</b><br>' + esc(c.meta.count) + '</div>' +
      '</div>' +
      '<h1 class="hero__title">Ruby a fondo</h1>' +
      '<p class="hero__lede">' + c.meta.lede + '</p>';

    // Contexto rápido
    var fg = '<div class="factgrid">';
    c.meta.facts.forEach(function (f) {
      fg += '<div class="factgrid__cell"><div class="factgrid__k">' + esc(f.k) + '</div>' +
        '<div class="factgrid__v">' + f.v + '</div>' +
        (f.sub ? '<div class="factgrid__sub">' + esc(f.sub) + '</div>' : '') + '</div>';
    });
    fg += '</div>';
    hero.insertAdjacentHTML("beforeend", fg);
    hero.insertAdjacentHTML("beforeend", '<hr class="rule-double" style="margin-top:26px;">');
    main.appendChild(hero);

    // Bloques del catálogo
    c.blocks.forEach(function (b) {
      var fam = G.FAMILIES[b.family];
      var block = h("section", { class: "block" });
      var cardsHtml = "";
      b.topics.forEach(function (slug) {
        var t = G.data.topics[slug];
        if (!t) return;
        var chips = (t.chips || []).map(function (g) { return '<span class="chip">' + esc(g) + '</span>'; }).join("");
        cardsHtml +=
          '<a class="card" href="#/' + esc(slug) + '" style="--fam:' + fam.color + ';">' +
            '<div class="card__top"><span>' + esc(t.n) + ' · ' + esc(t.kind) + '</span>' +
              '<span class="card__glyph">' + esc(t.glyph) + '</span></div>' +
            '<h3 class="card__title">' + esc(t.title) + '</h3>' +
            '<p class="card__tag">' + esc(t.tagline) + '</p>' +
            '<div class="card__chips">' + chips + '</div>' +
            '<span class="card__go">entrar →</span>' +
          '</a>';
      });
      block.innerHTML =
        '<div class="block__head"><span class="eyebrow" style="color:' + fam.color + ';">' + esc(b.eyebrow) + '</span>' +
          '<span class="block__hint">' + esc(b.hint) + '</span></div>' +
        '<hr class="rule" style="margin-bottom:16px;">' +
        '<div class="cards">' + cardsHtml + '</div>';
      main.appendChild(block);
    });

    // Panel oscuro (mito rector)
    var quote = h("div", { class: "dark-panel" });
    quote.innerHTML = '<span class="eyebrow">' + esc(c.quote.eyebrow) + '</span><p>' + c.quote.html + '</p>';
    main.appendChild(quote);

    // Bibliografía
    var bib = h("section", { class: "biblio" });
    var bibHtml = '<div class="block__head"><span class="eyebrow" style="color:var(--color-fg-faint);">Bibliografía curada</span>' +
      '<span class="block__hint">★ = imprescindible</span></div><hr class="rule">';
    c.biblio.forEach(function (grp) {
      var items = grp.items.map(function (r) {
        return '<a class="reslink" href="' + esc(r.url) + '" target="_blank" rel="noopener">' +
          '<span><b>' + (r.star ? '<span class="star">★ </span>' : '') + esc(r.title) + '</b> <small>· ' + esc(r.note) + '</small></span>' +
          '<span class="arrow">↗</span></a>';
      }).join("");
      bibHtml += '<div class="biblio__group"><div class="biblio__title">' + esc(grp.title) + '</div>' +
        '<div class="biblio__grid">' + items + '</div></div>';
    });
    bib.innerHTML = bibHtml;
    main.appendChild(bib);

    main.insertAdjacentHTML("beforeend", '<p class="colofon">' + c.colofon + '</p>');
    root.appendChild(main);
    return root;
  };

  // ---- Ficha de tema -----------------------------------------------------
  G.renderTopic = function (slug) {
    var t = G.data.topics[slug];
    var fam = G.FAMILIES[t.family];
    var order = G.data.catalog.order;
    var idx = order.indexOf(slug);
    var prev = idx > 0 ? order[idx - 1] : null;
    var next = idx < order.length - 1 ? order[idx + 1] : null;

    var root = h("div", { style: "--fam:" + fam.color + ";" });
    root.appendChild(G.topbar('Ruby a fondo &nbsp;<b>/ ' + esc(t.navShort || t.title) + '</b>'));

    var main = h("main", { class: "wrap wrap--narrow page ficha" });

    // Encabezado
    var breveHtml = "";
    t.enBreve.forEach(function (f) {
      breveHtml += '<div class="factgrid__cell"><div class="factgrid__k">' + esc(f.k) + '</div>' +
        '<div class="factgrid__v">' + f.v + '</div>' +
        (f.sub ? '<div class="factgrid__sub">' + esc(f.sub) + '</div>' : '') + '</div>';
    });
    main.insertAdjacentHTML("beforeend",
      '<span class="eyebrow ficha__eyebrow">Ficha ' + esc(t.n) + ' · ' + esc(t.eyebrowSub) + '</span>' +
      '<h1 class="ficha__title">' + esc(t.title) + '</h1>' +
      '<p class="ficha__lede">' + t.lede + '</p>' +
      '<div class="factgrid" style="margin-top:28px;">' + breveHtml + '</div>' +
      '<hr class="rule-double" style="margin-top:34px;">');

    // 01 Fundamento · 02 Cómo funciona
    main.insertAdjacentHTML("beforeend",
      section("01", "Fundamento", '<p class="prose">' + t.fundamento + '</p>') +
      section("02", "Cómo funciona", '<p class="prose">' + t.comoFunciona + '</p>'));

    // 03 Widget interactivo
    var w = t.widget;
    var sec3 = h("section", { class: "section" });
    sec3.innerHTML =
      '<div class="section__head"><span class="section__n">03</span>' +
        '<h2 class="section__h">' + esc(w.title) + '</h2></div>' +
      '<p class="prose" style="max-width:70ch;">' + w.intro + '</p>' +
      '<div class="widget" data-widget="' + esc(w.kind) + '"></div>' +
      (t.callout ? '<div class="callout"><span class="callout__tag">' + esc(t.callout.tag) + '</span>' +
        '<p>' + t.callout.text + '</p></div>' : '');
    main.appendChild(sec3);

    // 04 Para seguir
    var res = t.recursos.map(function (r) {
      return '<a class="reslink" href="' + esc(r.url) + '" target="_blank" rel="noopener">' +
        '<span><b>' + esc(r.title) + '</b> <small>· ' + esc(r.note) + '</small></span>' +
        '<span class="arrow">↗</span></a>';
    }).join("");
    main.insertAdjacentHTML("beforeend",
      section("04", "Para seguir", '<div class="reslist">' + res + '</div>'));

    // Navegación entre fichas
    var nav = '<div class="fichanav">';
    nav += prev
      ? navLink(prev, "← Anterior", false)
      : '<a href="#/" class="prev"><span class="fichanav__k">← Índice</span><span class="fichanav__v">Todas las fichas</span></a>';
    nav += next
      ? navLink(next, "Siguiente →", true)
      : '<a href="#/" class="next"><span class="fichanav__k">Índice →</span><span class="fichanav__v">Todas las fichas</span></a>';
    nav += '</div>';
    main.insertAdjacentHTML("beforeend", nav);

    root.appendChild(main);

    // Deja que el iniciador del widget pinte dentro del mount, tras montar.
    root._mountWidget = function () {
      var mount = G.qs('[data-widget]', root);
      var fn = G.widgets[w.kind];
      if (mount && fn) fn(mount, t);
    };
    return root;
  };

  function section(n, title, bodyHtml) {
    return '<section class="section"><div class="section__head">' +
      '<span class="section__n">' + n + '</span>' +
      '<h2 class="section__h">' + esc(title) + '</h2></div>' + bodyHtml + '</section>';
  }

  function navLink(slug, kicker, isNext) {
    var t = G.data.topics[slug];
    return '<a href="#/' + esc(slug) + '"' + (isNext ? ' class="next"' : ' class="prev"') + '>' +
      '<span class="fichanav__k">' + esc(kicker) + '</span>' +
      '<span class="fichanav__v">' + esc(t.n) + ' · ' + esc(t.navShort || t.title) + '</span></a>';
  }

})(window.GUIA = window.GUIA || {});
