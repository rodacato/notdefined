/* core.js — namespace, tema, helpers DOM y sintaxis. Carga primero.
   Todo cuelga de window.GUIA; sin ES modules para abrir con doble click. */
(function (G) {
  "use strict";

  /* ---- helpers DOM ------------------------------------------------------ */
  // el(tag, props, ...children) → construye un nodo sin innerHTML suelto.
  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === "dataset") {
          for (const d in v) node.dataset[d] = v[d];
        } else {
          node.setAttribute(k, v);
        }
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }

  /* ---- iconos SVG inline (16/20px, currentColor) ------------------------ */
  const ICON = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" stroke="none"/>',
    prev: '<path d="M18 6v12L9 12zM7 6v12" />',
    next: '<path d="M6 6v12l9-6zM17 6v12" />',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    mark: '<path d="M3 11V3h8M35 11V3h-8M3 27v8h8M35 27v8h-8"/><circle cx="19" cy="19" r="3.3" fill="currentColor" stroke="none"/>',
  };
  function svg(name, size, viewBox) {
    const s = size || 20;
    const vb = viewBox || "0 0 24 24";
    const n = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    n.setAttribute("viewBox", vb);
    n.setAttribute("width", s); n.setAttribute("height", s);
    n.setAttribute("fill", "none"); n.setAttribute("stroke", "currentColor");
    n.setAttribute("stroke-width", "1.9");
    n.setAttribute("stroke-linecap", "round"); n.setAttribute("stroke-linejoin", "round");
    n.innerHTML = ICON[name] || "";
    return n;
  }

  /* ---- tema: claro / oscuro / sistema (persistido en localStorage) ------ */
  const THEME_KEY = "guia-tema";
  function prefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function readThemePref() {
    try { return localStorage.getItem(THEME_KEY) || "dark"; } catch (e) { return "dark"; }
  }
  // resuelve la preferencia a claro/oscuro efectivo y lo aplica al <html>
  function applyTheme(pref) {
    const dark = pref === "dark" || (pref === "system" && prefersDark());
    document.documentElement.classList.toggle("dark", dark);
  }
  function setTheme(pref) {
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) {}
    applyTheme(pref);
    window.dispatchEvent(new CustomEvent("guia:theme", { detail: { pref: pref } }));
  }
  // el <head> ya aplicó el tema antes del primer paint; aquí sólo reaccionamos
  // a cambios del sistema cuando la preferencia es "system".
  function watchSystemTheme() {
    if (!window.matchMedia) return;
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (readThemePref() === "system") applyTheme("system");
    });
  }

  /* ---- resaltado de sintaxis JS (mínimo, editable a mano) --------------- */
  // Devuelve HTML con spans .tok-*. Suficiente para snippets cortos de la guía.
  // Cada pase inserta SENTINELAS (\u0000 clase \u0001 texto \u0002), no markup.
  // Así los pases siguientes nunca ven atributos como class="tok-str" y no
  // pueden corromperlos. Al final las sentinelas se cambian por <span> reales.
  function highlight(line) {
    const esc = function (t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
    let s = esc(line);
    const wrap = function (cls, text) { return "\u0000" + cls + "\u0001" + text + "\u0002"; };

    // comentario de línea → todo lo demás se salta
    const comIdx = s.indexOf("//");
    let comment = "";
    if (comIdx >= 0) { comment = s.slice(comIdx); s = s.slice(0, comIdx); }

    const KEYWORDS = /\b(const|let|var|function|return|await|async|new|class|extends|for|of|in|if|else|while|typeof|this|null|undefined|true|false|yield|import|export|from|default|delete)\b/g;

    const inTok = function (str, off) {
      const pre = str.slice(0, off);
      return pre.lastIndexOf("\u0000") > pre.lastIndexOf("\u0002");
    };

    s = s
      .replace(/(&#39;|'|"|`)(.*?)\1/g, function (m) { return wrap("str", m); })       // strings
      .replace(/\b\d+(?:\.\d+)?\b/g, function (m, off, str) { return inTok(str, off) ? m : wrap("num", m); }) // números
      .replace(KEYWORDS, function (m, k, off, str) { return inTok(str, off) ? m : wrap("key", m); })
      .replace(/([a-zA-Z_$][\w$]*)(\s*\()/g, function (m, name, paren, off, str) {
        return inTok(str, off) ? m : wrap("fn", name) + paren;
      });

    if (comment) s += wrap("com", comment);

    // sentinelas → markup real, en un solo pase final
    return s.replace(/\u0000([a-z]+)\u0001([\s\S]*?)\u0002/g, '<span class="tok-$1">$2</span>');
  }

  /* ---- montaje ---------------------------------------------------------- */
  function mount(node) {
    const root = $("#app");
    clear(root);
    root.appendChild(node);
    window.scrollTo(0, 0);
  }

  G.el = el;
  G.clear = clear;
  G.$ = $;
  G.svg = svg;
  G.ICON = ICON;
  G.setTheme = setTheme;
  G.readThemePref = readThemePref;
  G.applyTheme = applyTheme;
  G.watchSystemTheme = watchSystemTheme;
  G.highlight = highlight;
  G.mount = mount;
})(window.GUIA = window.GUIA || {});
