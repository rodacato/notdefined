/* ============================================================================
   js/components.js — piezas compartidas: cromo (topbar, colofón), marca,
   toggle de tema, bloques de código con resaltado, secciones de ficha.
   ============================================================================ */
(function (G) {
  "use strict";
  var el = G.el;

  // -------- Marca focal-frame (SVG inline, hereda color; punto ámbar) --------
  G.markSVG = function (size) {
    size = size || 26;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", size); svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 38 38");
    svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2"); svg.setAttribute("stroke-linecap", "square");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("mark");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M3 11V3h8M35 11V3h-8M3 27v8h8M35 27v8h-8");
    var c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", "19"); c.setAttribute("cy", "19"); c.setAttribute("r", "3.3");
    c.setAttribute("stroke", "none"); c.classList.add("dot");
    svg.appendChild(p); svg.appendChild(c);
    return svg;
  };

  // -------- Toggle de tema (3 botones: sol / luna / monitor) -----------------
  var ICONS = {
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>'
  };
  var LABELS = { light: "Tema claro", dark: "Tema oscuro", system: "Según el sistema" };

  G.themeToggle = function () {
    var wrap = el("div.theme-toggle", { role: "group", "aria-label": "Tema" });
    ["light", "dark", "system"].forEach(function (pref) {
      var b = el("button", {
        type: "button", title: LABELS[pref], "aria-label": LABELS[pref],
        html: ICONS[pref],
        on: { click: function () { G.tema.set(pref); } }
      });
      b.dataset.pref = pref;
      wrap.appendChild(b);
    });
    function sync() {
      var cur = G.tema.get();
      Array.prototype.forEach.call(wrap.children, function (b) {
        b.setAttribute("aria-pressed", b.dataset.pref === cur ? "true" : "false");
      });
    }
    sync();
    document.addEventListener("guia:theme", sync);
    return wrap;
  };

  // -------- Cromo: barra superior (todas las vistas) -------------------------
  G.mountTopbar = function () {
    var bar = document.getElementById("topbar");
    G.clear(bar);
    var back = el("a.topbar__back", { href: "/guias/" }, [
      el("span.arrow", { text: "←" }), " notdefined.dev/guias"
    ]);
    bar.appendChild(el("div.topbar__inner", null, [back, G.themeToggle()]));
  };

  // -------- Cromo: colofón (nota de frontera, sin colofón de generación) -----
  G.mountColophon = function () {
    var foot = document.getElementById("colophon");
    G.clear(foot);
    var inner = el("div.colophon__inner", null, [
      el("span.frontera", { text: "Nota de frontera" }),
      el("p", { html:
        "Esta guía es el <b>motor</b> (C2): qué hace la máquina cuando corres un query. " +
        "El <b>criterio de uso</b> — qué índice elegir, qué nivel de aislamiento usar, cómo diseñar tu esquema o cuándo particionar — " +
        "vive en <a href=\"/guias/polyglot-sql-c1/\">«SQL dominado» (el C1)</a>. " +
        "Y «¿qué <em>tipo</em> de base para tu problema?» es <a href=\"/guias/databases-1001/\">«Bases de datos 1001»</a>." })
    ]);
    foot.appendChild(inner);
  };

  // -------- Resaltado de bloques de código / EXPLAIN -------------------------
  // Ligero y determinista: envuelve nodos de plan, costos, comandos y comentarios.
  var SQL_KW = /\b(SELECT|FROM|WHERE|JOIN|ON|AND|OR|COUNT|GROUP BY|ORDER BY|EXPLAIN|ANALYZE|VALUES|INSERT|UPDATE|DELETE|SET|WITH|AS)\b/g;
  var PLAN_NODES = /\b(Seq Scan|Parallel Seq Scan|Index Only Scan|Index Scan|Bitmap Heap Scan|Bitmap Index Scan|Hash Join|Nested Loop|Merge Join|Hash|Gather|Finalize Aggregate|Partial Aggregate|Aggregate|Sort)\b/g;

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  G.highlightPlan = function (text) {
    return esc(text)
      .replace(/(-{6,})/g, '<span class="cmt">$1</span>')
      .replace(/(\(cost=[^)]*\))/g, '<span class="cost">$1</span>')
      .replace(/(\(actual time=[^)]*\))/g, '<span class="cost">$1</span>')
      .replace(PLAN_NODES, '<span class="node">$1</span>')
      .replace(SQL_KW, '<span class="kw">$1</span>')
      .replace(/(Workers Planned: \d+|Rows Removed by Filter: [\d,]+|Planning Time:[^\n]*|Execution Time:[^\n]*)/g, '<span class="cmt">$1</span>');
  };

  G.codeblock = function (caption, text, tag) {
    var block = el("div.codeblock");
    if (caption) {
      block.appendChild(el("div.codeblock__bar", null, [
        el("span.tag", { text: tag || (/^\s*EXPLAIN/.test(text) ? "EXPLAIN" : "SQL") }), caption
      ]));
    }
    var pre = el("pre");
    pre.innerHTML = G.highlightPlan(text);
    block.appendChild(pre);
    return block;
  };

  // -------- Encabezado de sección de ficha -----------------------------------
  G.section = function (label, heading, children) {
    var s = el("section.section");
    s.appendChild(el("div.section__label", { text: label }));
    if (heading) s.appendChild(el("h2", { text: heading }));
    G.append(s, children);
    return s;
  };

})(window.GUIA = window.GUIA || {});
