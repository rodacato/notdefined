/* player.js — player determinista paso a paso (widget estrella y sus primos).
   Recibe datos (variantes + frames) desde data/ y sólo maneja mecánica:
   estado, render, transporte, teclado y persistencia. Depende de core.js.

   Forma de los datos:
   widget = {
     storeKey, exec?, console?, autoplay?,
     runtime?: { note:{browser,node} },
     zones?: [{ id, label, cls, hint, foot, span2 }],
     variants: [{ id, label, code:[..], codeCap?, frames:[..] }]
   }
   frame = { line?, code?, codeCap?, phase?, cap, out?:[..], <zoneId>?:[..] } */
(function (G) {
  "use strict";
  const el = G.el, svg = G.svg;

  const SPEED_MS = [1400, 1000, 700, 450, 260];

  function pick(label, rt) { return (label && typeof label === "object") ? (label[rt] || label.browser) : label; }

  function player(widget) {
    const hasRuntime = !!widget.runtime;
    const zones = widget.zones || [];
    const hasZones = zones.length > 0;
    const showConsole = !!widget.console;
    const state = { variant: 0, frame: 0, playing: false, speed: 2, runtime: "browser" };
    let timer = null;

    if (widget.storeKey) {
      try {
        const v = localStorage.getItem("guia-" + widget.storeKey + "-variant");
        const f = localStorage.getItem("guia-" + widget.storeKey + "-frame");
        if (v != null && widget.variants[+v]) state.variant = +v;
        if (f != null) state.frame = Math.min(+f, widget.variants[state.variant].frames.length - 1);
      } catch (e) {}
    }
    function persist() {
      if (!widget.storeKey) return;
      try {
        localStorage.setItem("guia-" + widget.storeKey + "-variant", String(state.variant));
        localStorage.setItem("guia-" + widget.storeKey + "-frame", String(state.frame));
      } catch (e) {}
    }

    const cur = function () { return widget.variants[state.variant]; };
    const last = function () { return cur().frames.length - 1; };

    const root = el("div", { class: "widget" });

    /* ---- barra superior: variantes + runtime --------------------------- */
    const tabs = el("div", { class: "tabs", role: "tablist", "aria-label": "Ejemplos" });
    if (widget.variants.length > 1) {
      widget.variants.forEach(function (v, i) {
        tabs.appendChild(el("button", {
          class: "tab", type: "button", role: "tab", "aria-label": v.label,
          onClick: function () { pickVariant(i); },
        }, v.label));
      });
    }
    const topRow = el("div", { class: "widget__head" }, tabs);
    if (hasRuntime) {
      const seg = el("div", { class: "segmented", role: "group", "aria-label": "Runtime" });
      [["browser", "Navegador"], ["node", "Node"]].forEach(function (r) {
        seg.appendChild(el("button", { type: "button", dataset: { rt: r[0] }, "aria-label": r[1], onClick: function () { setRuntime(r[0]); } }, r[1]));
      });
      topRow.appendChild(el("div", { style: "display:flex;align-items:center;gap:8px" },
        el("span", { class: "eyebrow", style: "font-size:10px" }, "Runtime"), seg));
    }
    root.appendChild(topRow);

    let noteEl = null;
    if (hasRuntime) {
      noteEl = el("div", { class: "note" }, svg("info", 16), el("span"));
      root.appendChild(noteEl);
    }

    /* ---- código + narración -------------------------------------------- */
    const codeBox = el("div", { class: "code" }, el("div", { class: "code__cap" }));
    const codeLinesWrap = el("div");
    codeBox.appendChild(codeLinesWrap);
    const narration = el("div", { class: "narration" },
      el("div", { class: "narration__phase" }),
      el("div", { class: "narration__text" }));

    let body;
    const zonesWrap = el("div", { class: "zones" });
    const zoneEls = {};
    if (hasZones) {
      zones.forEach(function (z) {
        const items = el("div", { class: "zone__items" });
        if (z.wrap) { items.style.flexDirection = "row"; items.style.flexWrap = "wrap"; }
        const countEl = el("span", { class: "zone__count" }, "0");
        const labelEl = el("span", { class: "zone__label", style: "color:var(--sim-" + z.cls + ")" });
        const zn = el("div", { class: "zone" + (z.span2 ? " zone--stack" : "") },
          el("div", { class: "zone__head" }, labelEl, countEl),
          z.hint ? el("div", { class: "zone__hint" }, z.hint) : null,
          items,
          z.foot ? el("div", { class: "zone__foot" }, z.foot) : null);
        zoneEls[z.id] = { items: items, count: countEl, label: labelEl, def: z };
        zonesWrap.appendChild(zn);
      });
      const leftCol = el("div", { style: "display:flex;flex-direction:column;gap:12px" }, codeBox, narration);
      body = el("div", { class: "code-layout", style: "display:grid;grid-template-columns:340px 1fr;gap:16px;margin-top:14px;align-items:start" }, leftCol, zonesWrap);
    } else {
      body = el("div", { style: "display:flex;flex-direction:column;gap:12px;margin-top:14px" }, codeBox, narration);
    }
    root.appendChild(body);

    /* ---- consola ------------------------------------------------------- */
    const consoleRow = el("div", { class: "console__row" });
    if (showConsole) {
      root.appendChild(el("div", { class: "console" },
        el("div", { class: "console__cap" }, "Consola \u2014 orden real de salida"), consoleRow));
    }

    /* ---- transporte ---------------------------------------------------- */
    const stepLabel = el("span", { class: "transport__step" });
    const playBtn = el("button", { class: "ctrl ctrl--play", type: "button", "aria-label": "Reproducir" }, svg("play", 22));
    playBtn.addEventListener("click", playPause);
    const btn = function (icon, label, fn) {
      return el("button", { class: "ctrl", type: "button", "aria-label": label, onClick: fn }, svg(icon, 20));
    };
    const speedInput = el("input", {
      type: "range", min: "1", max: "5", step: "1", value: String(state.speed),
      "aria-label": "Velocidad de reproducci\u00f3n", onInput: function (e) { setSpeed(+e.target.value); },
    });
    root.appendChild(el("div", { class: "transport" },
      el("div", { class: "transport__group" },
        btn("reset", "Reiniciar", reset), btn("prev", "Paso anterior", prev),
        playBtn, btn("next", "Paso siguiente", next), stepLabel),
      el("div", { class: "speed" }, el("span", { class: "eyebrow", style: "font-size:10px" }, "Velocidad"), speedInput)
    ));

    root.setAttribute("tabindex", "0");
    root.setAttribute("aria-label", "Reproductor paso a paso. Flechas para avanzar, espacio para reproducir.");
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); playPause(); }
    });

    /* ---- render -------------------------------------------------------- */
    function render() {
      const v = cur();
      const fr = v.frames[state.frame];
      const rt = state.runtime;
      const codeLines = fr.code || v.code || [];

      codeBox.querySelector(".code__cap").textContent = fr.codeCap || v.codeCap || "snippet.js";
      G.clear(codeLinesWrap);
      const activeLine = fr.line;
      const isActive = function (i) { return Array.isArray(activeLine) ? activeLine.indexOf(i) >= 0 : activeLine === i; };
      const firstLine = Array.isArray(activeLine) ? (activeLine.length ? Math.min.apply(null, activeLine) : null) : activeLine;
      codeLines.forEach(function (text, i) {
        const active = isActive(i);
        const row = el("div", { class: "code__line" + (active ? " code__line--active" : "") });
        if (widget.exec) {
          const mark = active ? "\u25B6" : (firstLine != null && i < firstLine ? "\u2713" : "");
          row.appendChild(el("span", { class: "code__num", style: "color:var(--syn-com)" }, mark));
        } else {
          row.appendChild(el("span", { class: "code__num" }, String(i + 1)));
        }
        row.appendChild(el("span", { html: G.highlight(text) }));
        codeLinesWrap.appendChild(row);
      });

      narration.querySelector(".narration__phase").textContent = fr.phase || "";
      narration.querySelector(".narration__text").innerHTML = fr.cap || "";

      Array.prototype.forEach.call(tabs.children, function (b, i) {
        b.setAttribute("aria-pressed", i === state.variant ? "true" : "false");
      });

      if (hasRuntime) {
        topRow.querySelectorAll(".segmented button").forEach(function (b) {
          b.setAttribute("aria-pressed", b.dataset.rt === rt ? "true" : "false");
        });
        noteEl.querySelector("span").textContent = pick(widget.runtime.note, rt);
      }

      if (hasZones) {
        zones.forEach(function (z) {
          const ze = zoneEls[z.id];
          ze.label.textContent = pick(z.label, rt);
          const listRaw = fr[z.id] || [];
          const listVal = typeof listRaw === "function" ? listRaw(rt) : listRaw;
          G.clear(ze.items);
          listVal.forEach(function (item) { ze.items.appendChild(el("div", { class: "chip chip--" + z.cls }, item)); });
          ze.count.textContent = String(listVal.length);
        });
      }

      if (showConsole) {
        G.clear(consoleRow);
        const out = fr.out || [];
        out.forEach(function (o, i) {
          consoleRow.appendChild(el("div", { class: "out" + (i === out.length - 1 ? " out--fresh" : "") }, o));
        });
      }

      stepLabel.textContent = "paso " + (state.frame + 1) + " / " + v.frames.length;
      playBtn.setAttribute("aria-label", state.playing ? "Pausar" : "Reproducir");
      G.clear(playBtn);
      playBtn.appendChild(svg(state.playing ? "pause" : "play", 22));
    }

    /* ---- control ------------------------------------------------------- */
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function goto(f) { state.frame = Math.max(0, Math.min(f, last())); persist(); render(); }
    function play() {
      stop();
      if (state.frame >= last()) goto(0);
      state.playing = true; render();
      timer = setInterval(function () {
        if (state.frame >= last()) { stop(); state.playing = false; render(); return; }
        goto(state.frame + 1);
      }, SPEED_MS[state.speed - 1]);
    }
    function playPause() { if (state.playing) { stop(); state.playing = false; render(); } else { play(); } }
    function next() { stop(); state.playing = false; goto(state.frame + 1); }
    function prev() { stop(); state.playing = false; goto(state.frame - 1); }
    function reset() { stop(); state.playing = false; goto(0); }
    function pickVariant(i) { stop(); state.playing = false; state.variant = i; state.frame = 0; persist(); render(); }
    function setSpeed(v) { state.speed = v; if (state.playing) play(); }
    function setRuntime(rt) { state.runtime = rt; render(); }

    render();
    root._teardown = stop;
    return root;
  }

  G.player = player;
})(window.GUIA = window.GUIA || {});
