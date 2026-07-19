/* components.js — piezas compartidas por las vistas (cromo del catálogo y de
   la ficha). Sin estado propio: recibe un tema y devuelve nodos. */
(function (G) {
  "use strict";
  var el = G.el, icon = G.icon;

  // Color de la familia (bloque) a la que pertenece un tema.
  G.famVar = function (n) { return "var(--fam-" + n + ")"; };

  G.glifoDificultad = function (d) {
    var full = "", off = "";
    for (var i = 0; i < 3; i++) (i < d ? (full += "◆") : (off += "◇"));
    return "<span>" + full + "</span><span class='off'>" + off + "</span>";
  };

  // Card del catálogo: folio · dificultad · ★ · tagline · línea EVITA.
  G.tarjeta = function (t) {
    var card = el("a.card", { href: "#/tema/" + t.slug, style: "--fam:" + G.famVar(t.fam) });
    var top = el("div.card-top");
    top.appendChild(el("span.card-folio", { text: t.folio }));
    var badges = el("div.card-badges");
    if (t.estrella) badges.appendChild(el("span.star", { html: icon("estrella", 12) + "<span>estrella</span>" }));
    badges.appendChild(el("span.difficulty", { html: G.glifoDificultad(t.dificultad), title: "dificultad " + t.dificultad + "/3" }));
    top.appendChild(badges);
    card.appendChild(top);
    card.appendChild(el("h3.card-title", { text: t.cardTitulo || t.titulo }));
    card.appendChild(el("p.card-tagline", { text: t.tagline }));
    var avoid = el("div.card-avoid");
    avoid.appendChild(el("span.lbl", { text: "Evita" }));
    avoid.appendChild(el("span.txt", { text: t.evita }));
    card.appendChild(avoid);
    return card;
  };

  // Encabezado de sección dentro de una ficha (icono + etiqueta).
  G.seccion = function (iconName, label, fam) {
    var s = el("div.section-label");
    s.appendChild(el("span", { html: icon(iconName, 18), style: "color:" + G.famVar(fam) + ";display:inline-flex" }));
    s.appendChild(el("span", { text: label }));
    return s;
  };

})(window.GUIA = window.GUIA || {});
