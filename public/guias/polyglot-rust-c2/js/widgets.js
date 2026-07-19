/* widgets.js — mecánica de las simulaciones. Una función por tema en
   G.widgets, invocada por page-tema.js como widgets[slug](host, famVar).
   Deterministas, paso a paso, operables con teclado. */
(function (G) {
  "use strict";
  var el = G.dom.el, clear = G.dom.clear;

  G.widgets = G.widgets || {};

  /* ===========================================================
     01 · OWNERSHIP — move vs Copy, paso a paso
     =========================================================== */
  G.widgets.ownership = function (host, fam) {
    var state = { vt: "string", step: 0, use: false };
    var mount = el("div");
    host.appendChild(G.well([mount]));

    function set(patch) { Object.assign(state, patch); render(); }

    function stepLabel() {
      if (state.step === 0) return "① declarar a";
      if (state.step === 1) return state.vt === "string" ? "② let b = a (move)" : "② let b = a (copy)";
      return "③ fin de ámbito";
    }

    function box(name, tag, tagColor, repr, opacity, border, bg) {
      return el("div", { style: "height:66px;border:1px solid " + border + ";background:" + bg +
        ";border-radius:var(--radius-sm);padding:8px 10px;opacity:" + opacity + ";transition:.3s" }, [
        el("div", { style: "display:flex;justify-content:space-between;align-items:center" }, [
          el("span", { class: "mono", style: "font-size:13px;font-weight:600", text: name }),
          el("span", { class: "mono", style: "font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:" + tagColor, text: tag })
        ]),
        el("div", { class: "mono", style: "font-size:10.5px;color:var(--color-fg-subtle);margin-top:5px", text: repr })
      ]);
    }

    function render() {
      clear(mount);
      var isStr = state.vt === "string";
      var moved = isStr && state.step >= 1;

      /* controles */
      var seg = G.segmented(
        [{ value: "string", label: "String (move)" }, { value: "i32", label: "i32 (Copy)" }],
        state.vt, function (v) { set({ vt: v, step: 0, use: false }); });
      mount.appendChild(el("div", { class: "wrow between" }, [
        el("div", { class: "wrow" }, [el("span", { class: "eyebrow", text: "Tipo del valor" }), seg.node]),
        el("div", { class: "wrow" }, [
          G.wbtn({ icon: "left", variant: "ghost", ariaLabel: "paso anterior", onClick: function () { set({ step: Math.max(0, state.step - 1), use: false }); } }),
          el("span", { class: "wsteplabel", text: stepLabel() }),
          G.wbtn({ icon: "right", variant: "primary", label: "avanzar", onClick: function () { set({ step: Math.min(2, state.step + 1), use: false }); } }),
          G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { set({ step: 0, use: false }); } })
        ])
      ]));

      /* escenario: código | pila+heap */
      var lines = [
        "fn main() {",
        "    let a = " + (isStr ? 'String::from("hola")' : "5") + ";",
        "    let b = a;",
        "    " + (isStr ? "// a movido → inválido" : "// a copiado → válido"),
        "}"
      ];
      var active = state.step === 0 ? 1 : state.step === 1 ? 2 : 4;
      var codePanel = el("div", { class: "codeblock" }, [el("div", { class: "codeblock__title", text: "src/main.rs" })]);
      var pre = el("pre", { style: "padding:8px 0" });
      lines.forEach(function (ln, i) {
        pre.appendChild(el("div", {
          style: "padding:2px 14px;transition:background .3s;border-left:3px solid " +
            (i === active ? fam : "transparent") +
            (i === active ? ";background:color-mix(in srgb," + fam + " 16%, transparent)" : ""),
          text: ln || " "
        }));
      });
      codePanel.appendChild(pre);

      /* pila */
      var aBox = moved
        ? box("a", "movido ✗", "var(--data-neg)", "—", ".42", "var(--data-neg)", "var(--data-neg-bg)")
        : box("a", "dueño", fam, isStr ? "ptr → heap · len 4 · cap 4" : "5", "1", "var(--color-border-strong)", "var(--color-bg-lit)");
      var bVisible = state.step >= 1;
      var bBox = bVisible
        ? box("b", isStr ? "dueño" : "copia", fam, isStr ? "ptr → heap · len 4 · cap 4" : "5", "1", "var(--color-border-strong)", "var(--color-bg-lit)")
        : box("b", "", "var(--color-fg-faint)", "(sin declarar)", ".3", "var(--color-border-default)", "var(--color-bg-muted)");
      var stack = el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:12px;flex:1" }, [
        el("div", { class: "eyebrow", style: "font-size:10px", text: "Pila · main()" }),
        el("div", { style: "display:flex;flex-direction:column;gap:10px;margin-top:12px" }, [aBox, bBox])
      ]);

      /* heap (solo String) */
      var scenarioRight;
      if (isStr) {
        var freed = state.step >= 2;
        var bytes = el("div", { style: "display:flex;gap:4px;justify-content:center" });
        ["h", "o", "l", "a"].forEach(function (ch) {
          bytes.appendChild(el("span", { class: "mono", style: "width:20px;height:24px;display:flex;align-items:center;justify-content:center;border:1px solid var(--color-border-strong);border-radius:3px;background:var(--color-bg-canvas);font-weight:600;color:" + (freed ? "var(--color-fg-faint)" : "var(--color-fg-default)"), text: freed ? "·" : ch }));
        });
        var heap = el("div", { style: "flex:1;opacity:" + (freed ? ".4" : "1") + ";transition:.35s" }, [
          el("div", { class: "eyebrow", style: "font-size:10px;text-align:center", text: "Montículo · heap" }),
          el("div", { style: "margin-top:10px;border:1.5px solid " + (freed ? "var(--color-fg-faint)" : fam) + ";background:" + (freed ? "var(--color-bg-muted)" : "color-mix(in srgb," + fam + " 9%, var(--color-bg-surface))") + ";border-radius:var(--radius-sm);padding:12px 10px;text-align:center;transition:.35s" }, [
            bytes,
            el("div", { class: "mono", style: "font-size:9.5px;color:var(--color-fg-faint);margin-top:9px", html: 'dueño: <span style="color:' + fam + ';font-weight:600">' + (moved ? "b" : "a") + "</span>" }),
            el("div", { class: "mono", style: "font-size:9px;text-transform:uppercase;letter-spacing:.06em;margin-top:4px;color:" + (freed ? "var(--data-neg)" : "var(--data-pos)"), text: freed ? "liberado (drop)" : "vivo" })
          ])
        ]);
        scenarioRight = heap;
      } else {
        scenarioRight = el("div", { style: "flex:1;display:flex;align-items:center;justify-content:center" }, [
          el("div", { class: "whint", style: "text-align:center", text: "i32 vive en la pila — sin heap." })
        ]);
      }

      mount.appendChild(el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px;align-items:start" }, [
        codePanel,
        el("div", { style: "display:flex;gap:12px;min-height:200px" }, [stack, scenarioRight])
      ]));

      /* consola / veredicto */
      mount.appendChild(el("div", { class: "wrow mt" }, [
        G.wbtn({ icon: "bug", variant: "", label: "usar a después", onClick: function () { set({ use: !state.use }); } }),
        el("span", { class: "whint", text:
          isStr ? (moved ? "a fue movido: el compilador lo sabe." : "avanza el programa primero (let b = a).")
                : "i32 es Copy — a nunca se invalida." })
      ]));

      var showError = isStr && state.use && moved;
      var showOk = !isStr && state.use;
      var showDrop = !state.use && isStr && state.step >= 2;

      if (showError) {
        mount.appendChild(G.rustc(
'<span class="e">error[E0382]</span>: borrow of moved value: `a`\n <span class="g">--&gt; src/main.rs:3:20</span>\n  <span class="g">|</span>\n<span class="g">1 |</span>     <span class="b">let</span> a = String::from(<span class="s">"hola"</span>);\n  <span class="g">|</span>         <span class="g">- move occurs because `a` has type `String`,</span>\n  <span class="g">|           which does not implement the `Copy` trait</span>\n<span class="g">2 |</span>     <span class="b">let</span> b = a;\n  <span class="g">|</span>             <span class="r">- value moved here</span>\n<span class="g">3 |</span>     println!(<span class="s">"{}"</span>, a);\n  <span class="g">|</span>                    <span class="r">^ value used here after move</span>'));
      } else if (showOk) {
        mount.appendChild(el("div", { class: "verdict-ok", html: '✓ compila y ejecuta · <span>a sigue siendo válido — imprime <strong>5</strong>. Un i32 es Copy: b recibió una copia independiente.</span>' }));
      } else if (showDrop) {
        mount.appendChild(el("div", { class: "verdict-note", text: "» drop(b) — se ejecuta al cerrar main(); el buffer del heap se libera. Determinista: sabes exactamente en qué línea ocurre." }));
      }
    }
    render();
  };

  /* ===========================================================
     02 · BORROWING — aliasing XOR mutabilidad
     =========================================================== */
  G.widgets.borrowing = function (host, fam) {
    var state = { borrows: [], seq: 0, error: null };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(patch) { Object.assign(state, patch); render(); }

    function addShared() {
      if (state.borrows.some(function (b) { return b.kind === "mut"; }))
        return set({ error: "shared_over_mut" });
      state.seq++; set({ borrows: state.borrows.concat([{ kind: "shared", id: state.seq }]), error: null });
    }
    function addMut() {
      if (state.borrows.length > 0) {
        var hasMut = state.borrows.some(function (b) { return b.kind === "mut"; });
        return set({ error: hasMut ? "mut_over_mut" : "mut_over_shared" });
      }
      state.seq++; set({ borrows: [{ kind: "mut", id: state.seq }], error: null });
    }
    function dropAt(id) { set({ borrows: state.borrows.filter(function (b) { return b.id !== id; }), error: null }); }

    function lamp(active, activeCol, activeBg, title, sub) {
      return el("div", { style: "flex:1;min-width:180px;display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:var(--radius-md);transition:.25s;border:1.5px solid " + (active ? activeCol : "var(--color-border-default)") + ";background:" + (active ? activeBg : "var(--color-bg-surface)") }, [
        el("span", { style: "width:12px;height:12px;border-radius:50%;background:" + (active ? activeCol : "var(--color-border-strong)") }),
        el("div", {}, [
          el("div", { class: "mono", style: "font-size:13px;font-weight:600", html: title }),
          el("div", { class: "whint", style: "font-size:11px", text: sub })
        ])
      ]);
    }

    function render() {
      clear(mount);
      var nShared = state.borrows.filter(function (b) { return b.kind === "shared"; }).length;
      var hasMut = state.borrows.some(function (b) { return b.kind === "mut"; });

      /* semáforo XOR */
      mount.appendChild(el("div", { class: "wrow" }, [
        lamp(nShared > 0 && !hasMut, "var(--data-pos)", "var(--data-pos-bg)", "muchas &T", "lectores compartidos"),
        el("div", { style: "display:flex;align-items:center;font-family:var(--font-mono);font-weight:600;color:var(--color-fg-faint)", text: "XOR" }),
        lamp(hasMut, "var(--color-primary)", "var(--color-primary-muted)", "una &mut T", "escritor exclusivo")
      ]));

      /* valor + tickets */
      var valState, valCol, valBorder, valBg;
      if (hasMut) { valState = "exclusivo · escribible"; valCol = "var(--color-primary)"; valBorder = "var(--color-primary)"; valBg = "var(--color-primary-muted)"; }
      else if (nShared > 0) { valState = "compartido · solo lectura"; valCol = "var(--data-pos)"; valBorder = "var(--data-pos)"; valBg = "var(--data-pos-bg)"; }
      else { valState = "libre"; valCol = "var(--color-fg-faint)"; valBorder = "var(--color-border-strong)"; valBg = "var(--color-bg-surface)"; }

      var valBox = el("div", { style: "border:2px solid " + valBorder + ";background:" + valBg + ";border-radius:var(--radius-md);padding:16px;text-align:center;transition:.25s" }, [
        el("div", { class: "eyebrow", style: "font-size:10px", text: "el valor" }),
        el("div", { class: "mono", style: "font-size:18px;font-weight:700;margin-top:6px", text: "s" }),
        el("div", { class: "mono", style: "font-size:11px;color:var(--color-fg-subtle);margin-top:4px", text: '"hola"' }),
        el("div", { class: "mono", style: "font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;margin-top:8px;color:" + valCol, text: valState })
      ]);

      var ticketWrap = el("div", { style: "display:flex;flex-wrap:wrap;gap:10px;min-height:64px;align-content:flex-start" });
      var sIdx = 0;
      state.borrows.forEach(function (b) {
        var isShared = b.kind === "shared";
        if (isShared) sIdx++;
        var col = isShared ? "var(--data-pos)" : "var(--color-primary)";
        var bg = isShared ? "var(--data-pos-bg)" : "var(--color-primary-muted)";
        ticketWrap.appendChild(el("div", { style: "display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--radius-full);border:1px solid " + col + ";background:" + bg }, [
          el("span", { class: "mono", style: "font-size:12px;font-weight:600;color:" + col, text: isShared ? "&s" : "&mut s" }),
          el("span", { class: "whint", style: "font-size:10px", text: isShared ? "r" + sIdx + " · leer" : "w · escribir" }),
          el("button", { style: "width:16px;height:16px;border-radius:50%;border:0;background:var(--color-bg-muted);color:var(--color-fg-subtle);font-family:var(--font-mono);font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center", "aria-label": "soltar préstamo", on: { click: function () { dropAt(b.id); } } }, "✕")
        ]));
      });
      if (state.borrows.length === 0)
        ticketWrap.appendChild(el("span", { class: "whint", style: "align-self:center", text: "Sin préstamos activos — s es libre." }));

      mount.appendChild(el("div", { style: "display:grid;grid-template-columns:170px 1fr;gap:20px;margin-top:20px;align-items:center" }, [valBox, ticketWrap]));

      /* controles */
      var ruleHint = hasMut ? "Hay un escritor exclusivo: ningún otro préstamo cabe."
        : nShared > 0 ? nShared + " lector(es) — caben más &, pero ningún &mut."
        : "s está libre: puedes pedir & o &mut.";
      mount.appendChild(el("div", { class: "wrow mt" }, [
        G.wbtn({ icon: "add", label: "&s · leer", onClick: addShared }),
        G.wbtn({ icon: "add", label: "&mut s · escribir", onClick: addMut }),
        G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { set({ borrows: [], error: null }); } }),
        el("span", { class: "whint", text: ruleHint })
      ]));

      /* error */
      if (state.error) {
        var e = { code: "", msg: "", n1: "", n2: "" };
        if (state.error === "mut_over_shared") { e.code = "E0502"; e.msg = "cannot borrow `s` as mutable because it is also borrowed as immutable"; e.n1 = "let r = &s;   - immutable borrow occurs here"; e.n2 = "let w = &mut s;   ^^^^^^ mutable borrow occurs here"; }
        else if (state.error === "shared_over_mut") { e.code = "E0502"; e.msg = "cannot borrow `s` as immutable because it is also borrowed as mutable"; e.n1 = "let w = &mut s;   - mutable borrow occurs here"; e.n2 = "let r = &s;   ^^ immutable borrow occurs here"; }
        else { e.code = "E0499"; e.msg = "cannot borrow `s` as mutable more than once at a time"; e.n1 = "let w1 = &mut s;   - first mutable borrow occurs here"; e.n2 = "let w2 = &mut s;   ^^^^^^ second mutable borrow occurs here"; }
        mount.appendChild(G.rustc(
'<span class="e">error[' + e.code + ']</span>: ' + G.dom.escapeHtml(e.msg) +
'\n <span class="g">--&gt; src/main.rs</span>\n  <span class="g">|</span>\n  <span class="g">|</span>  ' + G.dom.escapeHtml(e.n1) +
'\n  <span class="g">|</span>  <span class="r">' + G.dom.escapeHtml(e.n2) + '</span>'));
      }
    }
    render();
  };

  /* ===========================================================
     03 · LIFETIMES — barras de vida (deslizador del último uso)
     =========================================================== */
  G.widgets.lifetimes = function (host, fam) {
    // líneas del programa (1..7). x nace en 2, muere en 5 (drop).
    var state = { useLine: 4, model: "nll" };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    var ROW = 30, TOP = 8;
    var BORN_R = 3, DEATH = 5, BLOCK_END = 7;
    function y(line) { return TOP + (line - 1) * ROW; }
    function set(patch) { Object.assign(state, patch); render(); }

    function render() {
      clear(mount);
      var lexical = state.model === "lexical";
      var deathY = y(DEATH), bornRY = y(BORN_R), useY = y(state.useLine);
      var effEndY = lexical ? y(BLOCK_END) : useY;
      var valid = effEndY <= deathY + 0.5;

      /* modelo */
      var seg = G.segmented(
        [{ value: "nll", label: "NLL (actual)" }, { value: "lexical", label: "léxico (pre-2018)" }],
        state.model, function (m) { set({ model: m }); });
      mount.appendChild(el("div", { class: "wrow" }, [el("span", { class: "eyebrow", text: "Modelo del checker" }), seg.node]));

      /* deslizador del último uso de r */
      var slider = el("input", { type: "range", min: "3", max: "7", step: "1", value: String(state.useLine),
        style: "width:220px", "aria-label": "línea del último uso de r" });
      slider.addEventListener("input", function () { set({ useLine: parseInt(slider.value, 10) }); });
      mount.appendChild(el("div", { class: "wrow mt" }, [
        el("span", { class: "eyebrow", text: "último uso de r · línea" }),
        slider,
        el("span", { class: "wsteplabel", text: "línea " + state.useLine })
      ]));

      /* código + carriles de vida */
      var codeLines = [
        "fn main() {", '    let x = String::from("dato");', "    let r = &x;", "",
        "    drop(x);   // x muere", "", "    println!(\"{}\", r);", "}"
      ];
      var code = el("div", { class: "codeblock" }, [el("div", { class: "codeblock__title", text: "src/main.rs" })]);
      var pre = el("pre", { style: "padding:8px 0;line-height:" + ROW + "px" });
      codeLines.forEach(function (ln, i) {
        var isUse = (i + 1) === state.useLine && state.useLine === 7;
        pre.appendChild(el("div", { style: "padding:0 14px;color:" + (i === 4 ? "var(--data-neg)" : "var(--code-fg)"), text: ln || " " }));
      });
      code.appendChild(pre);

      var H = ROW * codeLines.length;
      function lane(label, col) {
        return el("div", { style: "position:relative;height:" + H + "px;width:46px" }, [
          el("div", { style: "position:absolute;top:-16px;left:0;right:0;text-align:center;font-family:var(--font-mono);font-size:11px;font-weight:600;color:" + col, text: label })
        ]);
      }
      var laneX = lane("x", "var(--data-pos)");
      laneX.appendChild(el("div", { style: "position:absolute;left:50%;transform:translateX(-50%);width:14px;border-radius:7px;background:var(--data-pos);opacity:.8;top:" + y(2) + "px;height:" + (deathY - y(2)) + "px" }));
      laneX.appendChild(el("div", { style: "position:absolute;left:0;right:0;height:2px;background:var(--data-neg);top:" + deathY + "px" }));

      var laneR = lane("r", fam);
      var greenBottom = Math.min(useY, deathY);
      laneR.appendChild(el("div", { style: "position:absolute;left:50%;transform:translateX(-50%);width:14px;border-radius:7px;background:" + fam + ";top:" + bornRY + "px;height:" + Math.max(0, greenBottom - bornRY) + "px;transition:height .25s" }));
      var redH = Math.max(0, useY - deathY);
      if (redH > 0) laneR.appendChild(el("div", { style: "position:absolute;left:50%;transform:translateX(-50%);width:14px;border-radius:7px;background:var(--data-neg);top:" + deathY + "px;height:" + redH + "px" }));
      if (lexical) {
        var ghostTop = Math.max(useY, bornRY), ghostH = Math.max(0, y(BLOCK_END) - ghostTop);
        laneR.appendChild(el("div", { style: "position:absolute;left:50%;transform:translateX(-50%);width:14px;border-radius:7px;top:" + ghostTop + "px;height:" + ghostH + "px;opacity:.85;background:repeating-linear-gradient(45deg,var(--color-fg-faint),var(--color-fg-faint) 3px,transparent 3px,transparent 6px)" }));
      }
      // marcador del último uso
      laneR.appendChild(el("div", { style: "position:absolute;left:50%;transform:translate(-50%,-50%);top:" + useY + "px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;background:var(--color-bg-lit);border:2px solid " + fam + ";border-radius:50%;color:" + fam + ";font-size:12px;box-shadow:var(--shadow-md)", text: "◆" }));

      mount.appendChild(el("div", { style: "display:grid;grid-template-columns:1fr auto auto;gap:14px;margin-top:20px;align-items:start" }, [code, laneX, laneR]));

      /* veredicto */
      if (valid) {
        mount.appendChild(el("div", { class: "verdict-ok", html: '✓ compila · <span>' +
          (lexical ? "el préstamo léxico cabe dentro de la vida de x." : "r deja de usarse antes de que x muera — NLL lo acepta.") + "</span>" }));
      } else {
        mount.appendChild(G.rustc(
'<span class="e">error[E0597]</span>: `x` does not live long enough\n <span class="g">--&gt; src/main.rs</span>\n  <span class="g">|</span>\n  <span class="g">|</span>     r = &x;   <span class="r">^^ borrowed value does not live long enough</span>\n  <span class="g">|</span>  }            <span class="g">- `x` dropped here while still borrowed</span>\n  <span class="g">|</span>  ...r usado en línea ' + state.useLine + '  <span class="g">- borrow later used here</span>',
          lexical
            ? "Modo léxico (pre-2018): el préstamo se extendía hasta el fin del bloque, aunque no volvieras a usar r. NLL lo recorta al último uso real."
            : "El último uso de r (línea " + state.useLine + ") ocurre después de que x se libera (línea 5). La referencia quedaría colgando."));
      }
    }
    render();
  };

  /* ===========================================================
     04 · PIPELINE — descenso por las etapas de compilación
     =========================================================== */
  G.widgets.pipeline = function (host, fam) {
    var STAGES = [
      { n: "①", name: "Fuente", sub: "tu .rs", job: "parseo", kind: "neutral",
        desc: "El texto que escribes. Aún no hay tipos ni comprobaciones: solo caracteres.",
        repr: 'fn main() {\n    let v = vec![1, 2, 3];\n    let s: i32 = v.iter()\n        .map(|x| x * 2)\n        .sum();\n}' },
      { n: "②", name: "AST", sub: "árbol sintáctico", job: "estructura", kind: "neutral",
        desc: "Árbol de sintaxis abstracta: la gramática, sin resolver nombres ni tipos todavía.",
        repr: 'Fn "main"\n └ Block\n    ├ Let v = MacroCall(vec!)\n    └ Let s: i32 = MethodCall(sum,\n         MethodCall(map,\n           MethodCall(iter, v)))' },
      { n: "③", name: "HIR", sub: "tipos + traits", job: "resolución de tipos y traits", kind: "info",
        desc: "High-level IR: se resuelven nombres, se infieren tipos y se seleccionan las implementaciones de traits (¿qué Iterator? ¿qué Sum?).",
        repr: 'let v: Vec<i32> = Vec::<i32>::from([1,2,3]);\nlet s: i32 =\n  <Sum<i32>>::sum::<Map<Iter<i32>, _>>(\n     Iterator::map(v.iter(), closure)\n  );' },
      { n: "④", name: "MIR", sub: "borrow check", job: "borrow check + optimización", kind: "primary",
        desc: "Mid-level IR: un grafo de flujo de control con bloques básicos. AQUÍ corre el borrow checker (sobre el flujo real, no las llaves) y muchas optimizaciones tempranas.",
        repr: 'bb0: _1 = Vec::from(const [1,2,3]);\n      _2 = Vec::iter(&_1);      // &_1 vivo\nbb1: _3 = Iterator::next(&mut _2);\n      switchInt(_3) -> [Some: bb2, None: bb3]\nbb2: _4 = _4 + (x * 2);  goto bb1\nbb3: _s = _4;  drop(_1)   // fin préstamo' },
      { n: "⑤", name: "LLVM IR", sub: "optimización", job: "inline + optimización agresiva", kind: "warn",
        desc: "Se traduce a LLVM IR (SSA). LLVM hace inlining, desenrolla y funde: la cadena iter/map/sum se convierte en un único bucle sin llamadas.",
        repr: 'define i32 @main() {\n  ; el map/sum se fundió en un loop\n  %sum = phi i32 [0, %entry], [%next, %loop]\n  %next = add i32 %sum, %doubled\n  ...\n}' },
      { n: "⑥", name: "asm", sub: "nativo · sin runtime", job: "código máquina", kind: "pos",
        desc: "Código máquina para tu CPU. Sin GC, sin VM, sin scheduler incrustado: el binario es autónomo. La abstracción de iteradores desapareció por completo.",
        repr: '; x86-64\nxor eax, eax        ; sum = 0\n.loop:\n  lea eax, [eax + rdx*2]\n  add rcx, 4\n  cmp rcx, rend\n  jne .loop\nret' }
    ];
    var JOB = {
      neutral: ["var(--color-fg-subtle)", "var(--color-bg-muted)"],
      info: ["var(--data-info)", "var(--data-info-bg)"],
      primary: ["var(--color-primary)", "var(--color-primary-muted)"],
      warn: ["var(--data-warn)", "var(--data-warn-bg)"],
      pos: ["var(--data-pos)", "var(--data-pos-bg)"]
    };
    var active = 0, timer = null;
    var mount = el("div");
    host.appendChild(G.well([mount]));

    function select(i) { if (timer) { clearInterval(timer); timer = null; } active = i; render(); }
    function compile() {
      if (timer) clearInterval(timer);
      active = 0; render();
      if (G.reduceMotion) { active = STAGES.length - 1; render(); return; }
      timer = setInterval(function () {
        if (active >= STAGES.length - 1) { clearInterval(timer); timer = null; return; }
        active++; render();
      }, 850);
    }

    function render() {
      clear(mount);
      mount.appendChild(el("div", { class: "wrow", style: "justify-content:flex-end" }, [
        G.wbtn({ icon: "right", variant: "primary", label: "compilar", onClick: compile }),
        G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { select(0); } })
      ]));

      var row = el("div", { style: "display:flex;gap:8px;margin-top:16px;flex-wrap:wrap" });
      STAGES.forEach(function (s, i) {
        var on = i === active, done = i < active;
        row.appendChild(el("button", {
          style: "flex:1;min-width:104px;text-align:left;border:1.5px solid " +
            (on ? fam : done ? "var(--color-border-strong)" : "var(--color-border-default)") +
            ";background:" + (on ? "color-mix(in srgb," + fam + " 12%, var(--color-bg-surface))" : "var(--color-bg-surface)") +
            ";border-radius:var(--radius-md);padding:11px 12px;transition:.2s;cursor:pointer",
          on: { click: function () { select(i); } }
        }, [
          el("div", { class: "mono", style: "font-size:9.5px;color:var(--color-fg-faint)", text: s.n }),
          el("div", { class: "mono", style: "font-size:13px;font-weight:700;margin-top:2px;color:" + (on ? fam : "var(--color-fg-default)"), text: s.name }),
          el("div", { class: "whint", style: "font-size:10px;margin-top:3px", text: s.sub })
        ]));
      });
      mount.appendChild(row);

      var a = STAGES[active], jc = JOB[a.kind];
      mount.appendChild(el("div", { style: "display:grid;grid-template-columns:1.4fr 1fr;gap:16px;margin-top:16px;align-items:start" }, [
        el("div", { class: "rustc", style: "min-height:190px;margin-top:0" }, [
          el("div", { class: "eyebrow", style: "font-size:10px;color:var(--code-cm)", text: a.name + " · representación" }),
          el("pre", { style: "margin-top:8px", text: a.repr })
        ]),
        el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:14px 16px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: "El trabajo del compilador aquí" }),
          el("div", { class: "mono", style: "display:inline-block;margin-top:10px;font-size:11px;padding:5px 11px;border-radius:var(--radius-full);border:1px solid " + jc[0] + ";color:" + jc[0] + ";background:" + jc[1], text: a.job }),
          el("p", { class: "prose", style: "margin-top:12px;font-size:13px", text: a.desc })
        ])
      ]));
      mount.appendChild(el("p", { class: "whint", style: "margin-top:14px", html: 'Como Go, Rust es AOT nativo — pero <em>sin runtime incrustado</em>. Frente a los intérpretes de Ruby/JS/Python, aquí no queda VM en el binario.' }));
    }
    render();
  };

  /* ===========================================================
     05 · DISPATCH — estático (monomorfización) vs dinámico (vtable)
     =========================================================== */
  G.widgets.dispatch = function (host, fam) {
    var TYPES = ["i32", "String", "Circle", "Square"];
    var state = { mode: "static", used: [], calling: null };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }
    function callType(t) {
      if (state.used.indexOf(t) < 0) state.used = state.used.concat([t]);
      set({ calling: t });
    }

    function render() {
      clear(mount);
      var isStatic = state.mode === "static";
      var seg = G.segmented(
        [{ value: "static", label: "estático (genérico)" }, { value: "dynamic", label: "dinámico (dyn Trait)" }],
        state.mode, function (m) { set({ mode: m }); });
      mount.appendChild(el("div", { class: "wrow between" }, [
        el("div", { class: "wrow" }, [el("span", { class: "eyebrow", text: "Dispatch" }), seg.node]),
        G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { set({ used: [], calling: null }); } })
      ]));

      var typeRow = el("div", { class: "wrow", style: "margin-top:16px" }, [el("span", { class: "whint", text: "llamar dibuja() con:" })]);
      TYPES.forEach(function (t) {
        var on = state.calling === t;
        typeRow.appendChild(el("button", {
          class: "mono", style: "font-size:12px;padding:7px 12px;border-radius:var(--radius-full);cursor:pointer;transition:.15s;border:1px solid " +
            (on ? fam : "var(--color-border-strong)") + ";background:" + (on ? "color-mix(in srgb," + fam + " 12%, var(--color-bg-surface))" : "var(--color-bg-surface)") + ";color:" + (on ? fam : "var(--color-fg-default)"),
          text: t, on: { click: function () { callType(t); } }
        }));
      });
      mount.appendChild(typeRow);

      var label = state.calling || "T";
      var path = el("div", { style: "margin-top:20px" }, [el("div", { class: "eyebrow", style: "font-size:10px", html: 'Ruta de la llamada · x.draw() con <span style="color:' + fam + '">' + label + "</span>" })]);
      function pill(txt, col, bg, strong) {
        return el("div", { class: "mono", style: "font-size:12px;padding:10px 14px;border-radius:var(--radius-md);border:1px solid " + col + ";background:" + bg + (strong ? ";font-weight:600" : ""), html: txt });
      }
      var arrow = function (col) { return el("span", { class: "mono", style: "color:" + col + ";font-size:16px", text: isStatic ? "──▶" : "┈▶" }); };
      if (isStatic) {
        path.appendChild(el("div", { class: "wrow", style: "margin-top:12px" }, [
          pill("sitio de llamada", "var(--color-border-strong)", "var(--color-bg-surface)"),
          arrow("var(--data-pos)"),
          pill("dibuja::&lt;" + label + "&gt;() · <span style='color:var(--data-pos)'>directo</span>", "var(--data-pos)", "var(--data-pos-bg)", true)
        ]));
        path.appendChild(el("p", { class: "whint", style: "margin-top:10px", text: "1 salto, inline-able. El compilador conoce el tipo exacto: la llamada desaparece o se integra." }));
      } else {
        path.appendChild(el("div", { class: "wrow", style: "margin-top:12px" }, [
          pill("&dyn Draw · (datos, vtable)", "var(--color-border-strong)", "var(--color-bg-surface)"),
          arrow("var(--data-warn)"),
          pill("vtable de " + label, fam, "color-mix(in srgb," + fam + " 8%, var(--color-bg-surface))"),
          arrow("var(--data-warn)"),
          pill(label + "::draw()", "var(--data-warn)", "var(--data-warn-bg)", true)
        ]));
        path.appendChild(el("p", { class: "whint", style: "margin-top:10px", text: "2 saltos indirectos: el destino se lee de la vtable en runtime. No inline-able, pero una sola copia de código." }));
      }
      mount.appendChild(path);

      /* binario + métricas */
      var binList = el("div", { style: "display:flex;flex-direction:column;gap:6px;margin-top:10px" });
      if (isStatic) {
        state.used.forEach(function (t) { binList.appendChild(el("div", { class: "mono", style: "font-size:12px;padding:7px 10px;border:1px solid var(--color-border-default);border-radius:var(--radius-sm);background:var(--color-bg-canvas)", text: "fn dibuja::<" + t + ">() · copia especializada" })); });
      } else if (state.used.length) {
        binList.appendChild(el("div", { class: "mono", style: "font-size:12px;padding:7px 10px;border:1px solid var(--color-border-default);border-radius:var(--radius-sm);background:var(--color-bg-canvas)", text: "fn dibuja(x: &dyn Draw) · una sola copia" }));
        state.used.forEach(function (t) { binList.appendChild(el("div", { class: "mono", style: "font-size:11px;padding:6px 10px;border:1px dashed " + fam + ";border-radius:var(--radius-sm);color:" + fam, text: "vtable[" + t + "] → " + t + "::draw" })); });
      }
      if (state.used.length === 0) binList.appendChild(el("span", { class: "whint", text: "Llama con algún tipo para poblar el binario." }));

      var copies = isStatic ? state.used.length : (state.used.length ? 1 : 0);
      var sizePct = isStatic ? Math.min(100, state.used.length * 25) : (state.used.length ? 22 : 0);
      var metrics = el("div", { style: "display:flex;flex-direction:column;gap:10px" }, [
        el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:12px 14px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: "Copias de código" }),
          el("div", { class: "mono", style: "font-size:24px;font-weight:700;margin-top:2px", text: String(copies) })
        ]),
        el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:12px 14px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: "Tamaño relativo" }),
          el("div", { style: "height:10px;border-radius:5px;background:var(--color-bg-muted);margin-top:8px;overflow:hidden" }, [
            el("div", { style: "height:100%;width:" + sizePct + "%;background:" + (isStatic ? "var(--data-warn)" : "var(--data-pos)") + ";transition:width .3s" })
          ])
        ]),
        el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:12px 14px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: "Salto por llamada" }),
          el("div", { class: "mono", style: "font-size:13px;font-weight:600;margin-top:4px;color:" + (isStatic ? "var(--data-pos)" : "var(--data-warn)"), text: isStatic ? "directo · inline-able" : "indirecto · vía vtable" })
        ])
      ]);
      mount.appendChild(el("div", { style: "display:grid;grid-template-columns:1.3fr 1fr;gap:16px;margin-top:20px" }, [
        el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:14px;min-height:150px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: "En el binario" }), binList
        ]),
        metrics
      ]));
    }
    render();
  };

  /* ===========================================================
     06 · ZERO-COST — asm idéntico + niche optimization
     =========================================================== */
  G.widgets["zero-cost"] = function (host, fam) {
    var SIZES = [
      { type: "&T", bytes: 8, niche: false, note: "Un puntero. 8 bytes en 64 bits." },
      { type: "Option<&T>", bytes: 8, niche: true, note: "¡Mismo tamaño que &T! El puntero nulo (imposible para &T) representa None — la niche optimization en acción." },
      { type: "Box<T>", bytes: 8, niche: false, note: "Un puntero al heap. 8 bytes." },
      { type: "Option<Box<T>>", bytes: 8, niche: true, note: "También 8: Box nunca es nulo, así que el nulo hace de None. 0 bytes de sobrecosto." },
      { type: "i32", bytes: 4, niche: false, note: "Cuatro bytes." },
      { type: "Option<i32>", bytes: 8, niche: false, note: "Aquí SÍ crece: i32 usa todos sus valores, no hay nicho libre → 1 byte de discriminante + padding = 8." }
    ];
    var state = { tab: "asm", revealed: false, sel: 1 };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }

    function render() {
      clear(mount);
      var seg = G.segmented(
        [{ value: "asm", label: "abstracción → asm" }, { value: "niche", label: "niche / tamaños" }],
        state.tab, function (t) { set({ tab: t }); });
      mount.appendChild(el("div", { class: "wrow" }, [seg.node]));

      if (state.tab === "asm") {
        var codeA = el("div", { class: "rustc", style: "margin-top:18px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px;color:var(--code-cm)", text: "estilo iteradores" }),
          el("pre", { style: "margin-top:8px", html: '<span class="kw" style="color:var(--code-kw)">let</span> s: i32 = v.iter()\n    .map(|x| x * <span style="color:var(--code-num)">2</span>)\n    .filter(|x| x % <span style="color:var(--code-num)">3</span> != <span style="color:var(--code-num)">0</span>)\n    .sum();' })
        ]);
        var codeB = el("div", { class: "rustc", style: "margin-top:18px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px;color:var(--code-cm)", text: "for a mano" }),
          el("pre", { style: "margin-top:8px", html: '<span style="color:var(--code-kw)">let mut</span> s = <span style="color:var(--code-num)">0</span>;\n<span style="color:var(--code-kw)">for</span> x in &v {\n    <span style="color:var(--code-kw)">let</span> d = x * <span style="color:var(--code-num)">2</span>;\n    <span style="color:var(--code-kw)">if</span> d % <span style="color:var(--code-num)">3</span> != <span style="color:var(--code-num)">0</span> { s += d; }\n}' })
        ]);
        mount.appendChild(el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:14px" }, [codeA, codeB]));
        mount.appendChild(el("div", { class: "wrow", style: "justify-content:center;margin-top:16px" }, [
          G.wbtn({ icon: "right", variant: "primary", label: state.revealed ? "ocultar asm" : "compilar → ver asm", onClick: function () { set({ revealed: !state.revealed }); } })
        ]));
        if (state.revealed) {
          mount.appendChild(el("div", { class: "wrow", style: "justify-content:center;margin-top:16px" }, [
            el("span", { class: "whint", text: "ambos compilan a" }),
            el("span", { class: "mono", style: "font-size:11px;padding:4px 12px;border-radius:var(--radius-full);background:var(--data-pos-bg);color:var(--data-pos);border:1px solid var(--data-pos)", text: "✓ asm idéntico · 0 diferencias" })
          ]));
          mount.appendChild(el("div", { class: "rustc", style: "margin-top:12px" }, [
            el("pre", { html: '.loop:                     <span style="color:var(--code-cm)">; un solo bucle, sin closures ni iteradores</span>\n  lea   edx, [rax + rax]   <span style="color:var(--code-cm)">; x * 2</span>\n  ...                      <span style="color:var(--code-cm)">; test % 3, suma condicional</span>\n  add   rcx, 4\n  cmp   rcx, rend\n  jne   .loop' })
          ]));
        }
      } else {
        mount.appendChild(el("p", { class: "whint", style: "margin-top:18px;max-width:74ch", html: 'Haz clic en un tipo. La <em>niche optimization</em> usa un valor imposible (el puntero nulo) como <code>None</code>, así que envolver en <code>Option</code> cuesta <strong>0 bytes</strong>.' }));
        var list = el("div", { style: "display:flex;flex-direction:column;gap:10px;margin-top:14px" });
        SIZES.forEach(function (s, i) {
          var on = i === state.sel;
          var box = el("button", {
            style: "text-align:left;cursor:pointer;border-radius:var(--radius-md);padding:11px 14px;transition:.15s;border:1px solid " + (on ? fam : "var(--color-border-default)") + ";background:" + (on ? "var(--color-bg-lit)" : "var(--color-bg-surface)"),
            on: { click: function () { set({ sel: i }); } }
          }, [
            el("div", { style: "display:flex;justify-content:space-between;align-items:center" }, [
              el("span", { class: "mono", style: "font-size:13px;font-weight:600", text: s.type }),
              el("span", { class: "mono", style: "font-size:13px;font-weight:700;color:" + (s.niche ? "var(--data-pos)" : "var(--color-fg-default)"), text: s.bytes + " bytes" })
            ]),
            el("div", { style: "height:9px;border-radius:5px;background:var(--color-bg-muted);margin-top:8px;overflow:hidden" }, [
              el("div", { style: "height:100%;width:" + (s.bytes / 8 * 100) + "%;background:" + (s.niche ? "var(--data-pos)" : fam) + ";transition:width .3s" })
            ])
          ]);
          if (on) box.appendChild(el("div", { class: "whint", style: "font-size:11.5px;margin-top:7px", text: s.note }));
          list.appendChild(box);
        });
        mount.appendChild(list);
      }
    }
    render();
  };

  /* ===========================================================
     07 · MACROS — expansión declarativa vs procedural
     =========================================================== */
  G.widgets.macros = function (host, fam) {
    var DECL = [
      { label: "① invocación", code: 'mi_vec![10, 20, 30]' },
      { label: "② empareja $($x:expr),*", code: 'mi_vec![ 10, 20, 30 ]\n         └──┬──┘\n   $x = 10, 20, 30   // tres repeticiones' },
      { label: "③ expande la plantilla", code: '{\n    let mut v = Vec::new();\n    v.push(10);\n    v.push(20);\n    v.push(30);\n    v\n}' }
    ];
    var PROC = [
      { label: "① invocación", code: '#[derive(Saluda)]\nstruct Persona { nombre: String }' },
      { label: "② el crate proc-macro corre", code: 'saluda(TokenStream) {\n    // parsea el AST de `Persona`\n    // genera código Rust nuevo\n}' },
      { label: "③ emite un impl", code: 'impl Saluda for Persona {\n    fn saluda(&self) -> String {\n        format!("Hola, soy {}", self.nombre)\n    }\n}' }
    ];
    var state = { mode: "decl", step: 0 };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }

    function render() {
      clear(mount);
      var steps = state.mode === "decl" ? DECL : PROC;
      var seg = G.segmented(
        [{ value: "decl", label: "macro_rules! (declarativa)" }, { value: "proc", label: "proc-macro" }],
        state.mode, function (m) { set({ mode: m, step: 0 }); });
      mount.appendChild(el("div", { class: "wrow between" }, [
        el("div", { class: "wrow" }, [el("span", { class: "eyebrow", text: "Familia" }), seg.node]),
        el("div", { class: "wrow" }, [
          G.wbtn({ icon: "left", variant: "ghost", ariaLabel: "paso anterior", onClick: function () { set({ step: Math.max(0, state.step - 1) }); } }),
          el("span", { class: "wsteplabel", text: steps[state.step].label }),
          G.wbtn({ icon: "right", variant: "primary", label: "expandir", onClick: function () { set({ step: Math.min(steps.length - 1, state.step + 1) }); } }),
          G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { set({ step: 0 }); } })
        ])
      ]));

      mount.appendChild(el("div", { class: "rustc", style: "margin-top:18px;min-height:150px" }, [
        el("div", { class: "eyebrow", style: "font-size:10px;color:var(--code-cm)", text: steps[state.step].label }),
        el("pre", { style: "margin-top:8px", text: steps[state.step].code })
      ]));

      /* grafo de build */
      var isProc = state.mode === "proc";
      var graph = el("div", { style: "display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:16px" });
      if (isProc) {
        graph.appendChild(el("div", { class: "mono", style: "font-size:11px;padding:8px 12px;border-radius:var(--radius-md);border:1px dashed " + fam + ";color:" + fam, text: "crate proc-macro" }));
        graph.appendChild(el("span", { class: "mono", style: "color:var(--color-fg-faint)", text: "──▶" }));
      }
      graph.appendChild(el("div", { class: "mono", style: "font-size:11px;padding:8px 12px;border-radius:var(--radius-md);border:1px solid var(--color-border-strong);background:var(--color-bg-surface)", text: "tu crate" }));
      mount.appendChild(el("div", {}, [
        el("div", { class: "eyebrow", style: "font-size:10px;margin-top:4px", text: "Grafo de compilación" }),
        graph,
        el("p", { class: "whint", style: "margin-top:10px", text: isProc
          ? "La proc-macro es un programa Rust en su propio crate: compila PRIMERO, y solo entonces puede correr sobre tu código. Ese crate extra infla el build."
          : "macro_rules! vive en tu mismo crate y se expande durante el parseo — sin coste de compilación adicional." })
      ]));
    }
    render();
  };

  /* ===========================================================
     08 · STACK / HEAP / DROP — pila, heap y drops en orden inverso
     =========================================================== */
  G.widgets["stack-heap-drop"] = function (host, fam) {
    var VARS = [
      { name: "a", type: "i32", repr: "1", heap: null },
      { name: "b", type: "Box<i32>", repr: "ptr → 0x7f..a0", heap: { addr: "0x7f..a0", content: "2", owner: "b" } },
      { name: "c", type: "String", repr: "ptr → 0x7f..c8 · len 1 · cap 1", heap: { addr: "0x7f..c8", content: '"x"', owner: "c" } }
    ];
    var DROPS = [
      '» drop(c): se libera el buffer "x" del heap',
      '» drop(b): se libera el Box(2) del heap',
      '» drop(a): i32 en la pila, nada que liberar'
    ];
    var LABELS = ["① let a = 1", "② let b = Box::new(2)", "③ let c = String::from", "④ } → drop(c)", "⑤ drop(b)", "⑥ drop(a)"];
    var step = 0, mount = el("div");
    host.appendChild(G.well([mount]));

    function render() {
      clear(mount);
      var liveCount = step <= 2 ? step + 1 : 3 - (step - 2);
      var live = VARS.slice(0, liveCount);

      mount.appendChild(el("div", { class: "wrow", style: "justify-content:flex-end" }, [
        G.wbtn({ icon: "left", variant: "ghost", ariaLabel: "paso anterior", onClick: function () { step = Math.max(0, step - 1); render(); } }),
        el("span", { class: "wsteplabel", text: LABELS[step] }),
        G.wbtn({ icon: "right", variant: "primary", label: "avanzar", onClick: function () { step = Math.min(5, step + 1); render(); } }),
        G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { step = 0; render(); } })
      ]));

      var stackCol = el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:14px;min-height:260px" }, [
        el("div", { class: "eyebrow", style: "font-size:10px", text: "Pila · main() — crece ↓, drop ↑" })
      ]);
      var stackList = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:12px" });
      live.forEach(function (v, i) {
        var top = i === liveCount - 1 && step <= 2;
        stackList.appendChild(el("div", { style: "border:1px solid " + (top ? fam : "var(--color-border-strong)") + ";background:" + (top ? "color-mix(in srgb," + fam + " 7%, var(--color-bg-lit))" : "var(--color-bg-lit)") + ";border-radius:var(--radius-sm);padding:9px 11px;transition:.3s" }, [
          el("div", { style: "display:flex;justify-content:space-between;align-items:baseline" }, [
            el("span", { class: "mono", style: "font-size:13px;font-weight:600", text: v.name }),
            el("span", { class: "mono", style: "font-size:10px;color:var(--color-fg-faint)", text: v.type })
          ]),
          el("div", { class: "mono", style: "font-size:10.5px;color:var(--color-fg-subtle);margin-top:4px", text: v.repr })
        ]));
      });
      if (live.length === 0) stackList.appendChild(el("span", { class: "whint", text: "Pila vacía — main() terminó." }));
      stackCol.appendChild(stackList);

      var heapItems = live.filter(function (v) { return v.heap; });
      var heapCol = el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:14px;min-height:260px" }, [
        el("div", { class: "eyebrow", style: "font-size:10px", text: "Montículo · heap" })
      ]);
      var heapList = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:12px" });
      heapItems.forEach(function (v) {
        heapList.appendChild(el("div", { style: "border:1.5px solid " + fam + ";background:color-mix(in srgb," + fam + " 8%, var(--color-bg-surface));border-radius:var(--radius-sm);padding:9px 11px" }, [
          el("div", { style: "display:flex;justify-content:space-between;align-items:baseline" }, [
            el("span", { class: "mono", style: "font-size:10px;color:var(--color-fg-faint)", text: v.heap.addr }),
            el("span", { class: "mono", style: "font-size:10px;color:" + fam, text: "← " + v.heap.owner })
          ]),
          el("div", { class: "mono", style: "font-size:13px;font-weight:600;margin-top:4px", text: v.heap.content })
        ]));
      });
      if (heapItems.length === 0) heapList.appendChild(el("span", { class: "whint", text: "Heap sin reservas vivas." }));
      heapCol.appendChild(heapList);

      mount.appendChild(el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px" }, [stackCol, heapCol]));

      var nDrops = step <= 2 ? 0 : step - 2;
      var console = el("div", { class: "rustc", style: "margin-top:14px;min-height:70px" }, [
        el("div", { class: "eyebrow", style: "font-size:9.5px;color:var(--code-cm)", text: "consola · impl Drop { fn drop() }" })
      ]);
      var logBox = el("div", { style: "display:flex;flex-direction:column;gap:2px;margin-top:6px" });
      if (nDrops === 0) logBox.appendChild(el("span", { class: "mono", style: "font-size:12px;color:var(--code-cm)", text: "(aún no hay drops — avanza hasta el fin del ámbito)" }));
      else DROPS.slice(0, nDrops).forEach(function (t) { logBox.appendChild(el("span", { class: "mono", style: "font-size:12px;color:var(--code-str)", text: t })); });
      console.appendChild(logBox);
      mount.appendChild(console);
    }
    render();
  };

  /* ===========================================================
     09 · PANIC — unwind (corre Drop) vs abort (corta en seco)
     =========================================================== */
  G.widgets.panic = function (host, fam) {
    // marcos de pila, del más externo al punto de panic
    var FRAMES = [
      { fn: "main()", guard: null },
      { fn: "abre_archivo()", guard: "_f: File" },
      { fn: "toma_lock()", guard: "_g: MutexGuard" },
      { fn: "valida()  ← panic!", guard: null }
    ];
    var state = { mode: "unwind", caught: false, popped: 0, fired: false };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }

    function fire() {
      if (state.mode === "abort") { set({ fired: true, popped: 0 }); return; }
      // unwind: si reduce-motion, saltar al final
      set({ fired: true, popped: 0 });
      if (G.reduceMotion) { state.popped = FRAMES.length; render(); return; }
      var t = setInterval(function () {
        if (state.popped >= FRAMES.length) { clearInterval(t); return; }
        state.popped++; render();
      }, 550);
    }

    function render() {
      clear(mount);
      var isUnwind = state.mode === "unwind";
      var seg = G.segmented(
        [{ value: "unwind", label: 'panic = "unwind"' }, { value: "abort", label: 'panic = "abort"' }],
        state.mode, function (m) { set({ mode: m, fired: false, popped: 0 }); });
      mount.appendChild(el("div", { class: "wrow between" }, [
        el("div", { class: "wrow" }, [el("span", { class: "eyebrow", text: "Modo" }), seg.node]),
        G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { set({ fired: false, popped: 0 }); } })
      ]));

      // toggle catch_unwind (solo unwind)
      var catchBtn = el("button", {
        class: "mono", style: "font-size:12px;padding:7px 12px;border-radius:var(--radius-full);cursor:" + (isUnwind ? "pointer" : "not-allowed") + ";border:1px solid " + (state.caught && isUnwind ? "var(--data-pos)" : "var(--color-border-strong)") + ";background:" + (state.caught && isUnwind ? "var(--data-pos-bg)" : "var(--color-bg-surface)") + ";color:" + (state.caught && isUnwind ? "var(--data-pos)" : "var(--color-fg-subtle)") + ";opacity:" + (isUnwind ? "1" : ".4"),
        text: (state.caught ? "✓ " : "") + "catch_unwind en main()",
        on: { click: function () { if (isUnwind) set({ caught: !state.caught, fired: false, popped: 0 }); } }
      });
      mount.appendChild(el("div", { class: "wrow", style: "margin-top:14px" }, [
        catchBtn,
        G.wbtn({ icon: "bug", variant: "primary", label: "panic!", onClick: fire }),
        el("span", { class: "whint", text: isUnwind ? "Desenrolla marco a marco corriendo cada Drop." : "abort() inmediato: no corre ningún Drop." })
      ]));

      // pila de marcos
      var stack = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:18px" });
      FRAMES.forEach(function (fr, i) {
        // en unwind, los últimos popped marcos ya se desenrollaron (de arriba abajo = del final al inicio)
        var idxFromTop = FRAMES.length - 1 - i;
        var unwound = state.fired && isUnwind && idxFromTop < state.popped;
        var caughtHere = state.caught && fr.fn === "main()" && state.fired && isUnwind && state.popped >= FRAMES.length - 1;
        var isPanicFrame = i === FRAMES.length - 1;
        var col = unwound ? "var(--color-fg-faint)" : isPanicFrame && state.fired ? "var(--data-neg)" : "var(--color-border-strong)";
        var bg = unwound ? "var(--color-bg-muted)" : isPanicFrame && state.fired ? "var(--data-neg-bg)" : "var(--color-bg-surface)";
        stack.appendChild(el("div", { style: "border:1px solid " + col + ";background:" + bg + ";border-radius:var(--radius-sm);padding:10px 12px;opacity:" + (unwound ? ".45" : "1") + ";transition:.3s;display:flex;justify-content:space-between;align-items:center" }, [
          el("div", {}, [
            el("span", { class: "mono", style: "font-size:13px;font-weight:600", text: fr.fn }),
            fr.guard ? el("span", { class: "mono", style: "font-size:11px;color:var(--color-fg-subtle);margin-left:10px", text: "guarda " + fr.guard }) : null
          ]),
          el("span", { class: "mono", style: "font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:" + (unwound ? "var(--data-pos)" : "var(--color-fg-faint)"),
            text: unwound ? (fr.guard ? "drop ✓" : "desenrollado") : caughtHere ? "atrapa" : "" })
        ]));
      });
      mount.appendChild(stack);

      // veredicto
      if (state.fired) {
        if (!isUnwind) {
          mount.appendChild(G.rustc('<span class="e">thread \'main\' panicked</span> at src/main.rs\n<span class="r">... y el proceso llama a abort() — SIGABRT</span>', "abort: ningún Drop corre. Los archivos y locks NO se cierran ordenadamente; el SO recupera los recursos al morir el proceso. A cambio: binario más pequeño, sin tablas de unwinding."));
        } else if (state.caught && state.popped >= FRAMES.length) {
          mount.appendChild(el("div", { class: "verdict-ok", html: '✓ atrapado · <span>catch_unwind devolvió <code>Err(Box&lt;dyn Any&gt;)</code>. Los Drop de _g y _f corrieron durante el desenrollado; main() sigue vivo.</span>' }));
        } else if (state.popped >= FRAMES.length) {
          mount.appendChild(el("div", { class: "verdict-note", text: "» el hilo terminó tras desenrollar toda la pila. Cada guarda (_g, _f) corrió su Drop en orden inverso — recursos liberados limpiamente." }));
        }
      }
    }
    render();
  };

  /* ===========================================================
     10 · RC / REFCELL — refcount, interior mutability, ciclos
     =========================================================== */
  G.widgets["rc-refcell"] = function (host, fam) {
    var state = { tab: "rc", rcCount: 1, cellShared: 0, cellMut: false, cellPanic: false, useWeak: false };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }

    function render() {
      clear(mount);
      var seg = G.segmented(
        [{ value: "rc", label: "Rc (refcount)" }, { value: "cell", label: "RefCell (runtime)" }, { value: "cycle", label: "ciclo → Weak" }],
        state.tab, function (t) { set({ tab: t }); });
      mount.appendChild(el("div", { class: "wrow" }, [seg.node]));

      if (state.tab === "rc") {
        var freed = state.rcCount === 0;
        var box = el("div", { style: "border:2px solid " + (freed ? "var(--color-fg-faint)" : fam) + ";background:" + (freed ? "var(--color-bg-muted)" : "color-mix(in srgb," + fam + " 7%, var(--color-bg-surface))") + ";border-radius:var(--radius-md);padding:16px 22px;text-align:center;transition:.25s" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: "heap · Rc<Gato>" }),
          el("div", { class: "serif-italic", style: "font-size:20px;font-weight:700;margin-top:4px", text: 'Gato «Michi»' }),
          el("div", { class: "mono", style: "font-size:11px;margin-top:8px;color:" + fam, html: 'strong_count = <span style="font-size:20px;font-weight:700">' + state.rcCount + "</span>" }),
          el("div", { class: "mono", style: "font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;margin-top:4px;color:" + (freed ? "var(--data-neg)" : "var(--data-pos)"), text: freed ? "liberado" : "vivo" })
        ]);
        var handles = el("div", { style: "display:flex;flex-wrap:wrap;gap:8px;max-width:320px" });
        for (var i = 0; i < state.rcCount; i++) handles.appendChild(el("div", { class: "mono", style: "font-size:11px;padding:6px 11px;border-radius:var(--radius-full);border:1px solid " + fam + ";background:color-mix(in srgb," + fam + " 8%, var(--color-bg-surface));color:" + fam, text: (i === 0 ? "gato" : "clon" + i) + " →" }));
        mount.appendChild(el("div", { class: "wrow", style: "gap:24px;margin-top:18px" }, [box, handles]));
        var hint = freed ? "count = 0 → el valor se libera. drop final." : state.rcCount === 1 ? "un solo dueño. Clónalo para compartir." : state.rcCount + " dueños comparten el mismo gato.";
        mount.appendChild(el("div", { class: "wrow mt" }, [
          G.wbtn({ icon: "add", label: "Rc::clone (+1)", onClick: function () { if (state.rcCount > 0) set({ rcCount: state.rcCount + 1 }); } }),
          G.wbtn({ label: "drop (−1)", onClick: function () { set({ rcCount: Math.max(0, state.rcCount - 1) }); } }),
          el("span", { class: "whint", text: hint })
        ]));
        mount.appendChild(el("p", { class: "whint", style: "margin-top:14px;max-width:74ch", html: 'Puente cruzado: es <em>exactamente</em> el refcount de Python — solo que aquí es explícito y el compilador exige que elijas <code>Rc</code> a conciencia.' }));
      } else if (state.tab === "cell") {
        var status = state.cellMut ? "1 mutable (exclusivo)" : state.cellShared > 0 ? state.cellShared + " compartido(s)" : "ninguno";
        var bcol = state.cellPanic ? "var(--data-neg)" : state.cellMut ? "var(--color-primary)" : state.cellShared > 0 ? "var(--data-pos)" : "var(--color-border-strong)";
        var bbg = state.cellPanic ? "var(--data-neg-bg)" : state.cellMut ? "var(--color-primary-muted)" : state.cellShared > 0 ? "var(--data-pos-bg)" : "var(--color-bg-surface)";
        mount.appendChild(el("div", { style: "margin-top:18px;display:inline-block;border:2px solid " + bcol + ";background:" + bbg + ";border-radius:var(--radius-md);padding:14px 20px;transition:.25s" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: "RefCell<i32>" }),
          el("div", { class: "mono", style: "font-size:12px;margin-top:6px", html: "préstamos activos: <strong>" + status + "</strong>" })
        ]));
        mount.appendChild(el("div", { class: "wrow mt" }, [
          G.wbtn({ label: "borrow()", onClick: function () { if (state.cellMut) set({ cellPanic: true }); else set({ cellShared: state.cellShared + 1, cellPanic: false }); } }),
          G.wbtn({ label: "borrow_mut()", onClick: function () { if (state.cellMut || state.cellShared > 0) set({ cellPanic: true }); else set({ cellMut: true, cellPanic: false }); } }),
          G.wbtn({ icon: "replay", variant: "ghost", label: "soltar todo", onClick: function () { set({ cellShared: 0, cellMut: false, cellPanic: false }); } })
        ]));
        if (state.cellPanic) mount.appendChild(G.rustc("<span class=\"e\">thread 'main' panicked</span> at src/main.rs:\nalready borrowed: BorrowMutError", "La misma regla «aliasing XOR mutabilidad» — pero verificada en runtime: si la violas, panic, no error de compilación."));
      } else {
        var weak = state.useWeak;
        var aStrong = weak ? 1 : 2, bStrong = weak ? 1 : 2;
        mount.appendChild(el("div", { class: "wrow", style: "margin-top:18px" }, [
          el("span", { class: "eyebrow", style: "font-size:10px", text: "arista b → a" }),
          el("button", { class: "mono", style: "font-size:12px;padding:7px 14px;border-radius:var(--radius-full);cursor:pointer;border:1px solid " + (weak ? "var(--data-pos)" : "var(--color-border-strong)") + ";background:" + (weak ? "var(--data-pos-bg)" : "var(--color-bg-surface)") + ";color:" + (weak ? "var(--data-pos)" : "var(--color-fg-subtle)"), text: (weak ? "✓ " : "") + "usar Weak", on: { click: function () { set({ useWeak: !weak }); } } })
        ]));
        function node(name, strong) {
          return el("div", { style: "border:2px solid " + fam + ";background:color-mix(in srgb," + fam + " 8%, var(--color-bg-surface));border-radius:var(--radius-md);padding:14px 20px;text-align:center" }, [
            el("div", { class: "mono", style: "font-size:14px;font-weight:700", text: name }),
            el("div", { class: "mono", style: "font-size:11px;margin-top:6px;color:var(--color-fg-subtle)", html: 'strong = <strong style="color:' + fam + '">' + strong + "</strong>" })
          ]);
        }
        mount.appendChild(el("div", { class: "wrow", style: "justify-content:center;gap:40px;margin-top:14px" }, [
          node("nodo a", aStrong),
          el("div", { class: "mono", style: "font-size:11px;color:var(--color-fg-subtle);text-align:center", html: 'a → b <span style="color:' + fam + '">(Rc)</span><br>b → a <span style="color:' + (weak ? "var(--data-pos)" : fam) + '">(' + (weak ? "Weak" : "Rc") + ")</span>" }),
          node("nodo b", bStrong)
        ]));
        var leak = !weak;
        mount.appendChild(el("div", { style: "margin-top:16px;border-radius:var(--radius-md);padding:12px 16px;background:" + (leak ? "var(--data-neg-bg)" : "var(--data-pos-bg)") + ";border:1px solid " + (leak ? "var(--data-neg)" : "var(--data-pos)") }, [
          el("span", { class: "mono", style: "font-size:12.5px;color:" + (leak ? "var(--data-neg)" : "var(--data-pos)"), text: leak ? "✗ fuga de memoria" : "✓ se libera al salir de ámbito" }),
          el("div", { class: "whint", style: "margin-top:6px;color:var(--color-fg-default)", text: leak
            ? "Al terminar main(), los Rc externos se sueltan pero a y b siguen apuntándose: sus strong_count no bajan de 1. Nunca se llama a drop → memoria filtrada."
            : "Weak no cuenta como dueño (no sube strong_count). Al soltar los Rc externos, ambos strong llegan a 0 y se liberan. El ciclo se rompe." })
        ]));
      }
    }
    render();
  };

  /* ===========================================================
     11 · LAYOUT — struct/padding, enum, niche
     =========================================================== */
  G.widgets.layout = function (host, fam) {
    var CELL = {
      a: ["color-mix(in srgb,var(--fam-1) 22%,var(--color-bg-surface))", "var(--fam-1)", "var(--fam-1)", "a"],
      b: ["color-mix(in srgb,var(--fam-2) 22%,var(--color-bg-surface))", "var(--fam-2)", "var(--fam-2)", "b"],
      c: ["color-mix(in srgb,var(--fam-4) 22%,var(--color-bg-surface))", "var(--fam-4)", "var(--fam-4)", "c"],
      tag: ["color-mix(in srgb,var(--data-warn) 25%,var(--color-bg-surface))", "var(--data-warn)", "var(--data-warn)", "T"],
      pay: ["color-mix(in srgb,var(--fam-3) 22%,var(--color-bg-surface))", "var(--fam-3)", "var(--fam-3)", "•"],
      unused: ["var(--color-bg-muted)", "var(--color-fg-faint)", "var(--color-border-default)", "·"],
      pad: ["repeating-linear-gradient(45deg,var(--color-bg-muted),var(--color-bg-muted) 3px,transparent 3px,transparent 6px)", "var(--color-fg-faint)", "var(--color-border-default)", ""],
      ptr: ["color-mix(in srgb,var(--color-primary) 20%,var(--color-bg-surface))", "var(--color-primary)", "var(--color-primary)", "p"],
      zero: ["var(--color-bg-muted)", "var(--color-fg-faint)", "var(--color-border-default)", "00"]
    };
    var state = { tab: "struct", repr: "default", variant: "mover", niche: "some" };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }
    function cells(seq, w) {
      var wrap = el("div", { style: "display:flex;flex-wrap:wrap;gap:3px;margin-top:18px;max-width:520px" });
      seq.forEach(function (k) {
        var c = CELL[k];
        wrap.appendChild(el("div", { class: "mono", style: "width:" + (w || 28) + "px;height:34px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;background:" + c[0] + ";color:" + c[1] + ";border:1px solid " + c[2], text: c[3] }));
      });
      return wrap;
    }

    function render() {
      clear(mount);
      var seg = G.segmented(
        [{ value: "struct", label: "struct + padding" }, { value: "enum", label: "enum" }, { value: "niche", label: "niche" }],
        state.tab, function (t) { set({ tab: t }); });
      mount.appendChild(el("div", { class: "wrow" }, [seg.node]));

      if (state.tab === "struct") {
        var codeS = el("div", { class: "rustc", style: "margin-top:18px" }, [el("pre", { html: '<span style="color:var(--code-kw)">struct</span> Foo {\n  a: u8,     <span style="color:var(--fam-1)">■ 1</span>\n  b: u64,    <span style="color:var(--fam-2)">■ 8</span>\n  c: u16,    <span style="color:var(--fam-4)">■ 2</span>\n}' })]);
        var reprSeg = G.segmented(
          [{ value: "default", label: "Rust (reordena)" }, { value: "c", label: "#[repr(C)]" }],
          state.repr, function (r) { set({ repr: r }); });
        var size = state.repr === "c" ? "24" : "16", pad = state.repr === "c" ? "13" : "5";
        mount.appendChild(el("div", { class: "wrow", style: "gap:20px;align-items:flex-start;margin-top:0" }, [
          codeS,
          el("div", { style: "display:flex;flex-direction:column;gap:12px" }, [
            el("div", { class: "wrow" }, [el("span", { class: "eyebrow", style: "font-size:10px", text: "representación" }), reprSeg.node]),
            el("div", { class: "wrow", style: "gap:20px" }, [
              el("div", {}, [el("div", { class: "eyebrow", style: "font-size:10px", text: "size_of" }), el("div", { class: "mono", style: "font-size:24px;font-weight:700", text: size })]),
              el("div", {}, [el("div", { class: "eyebrow", style: "font-size:10px", text: "padding" }), el("div", { class: "mono", style: "font-size:24px;font-weight:700;color:var(--data-neg)", text: pad })])
            ])
          ])
        ]));
        var seq = state.repr === "c"
          ? ["a", "pad", "pad", "pad", "pad", "pad", "pad", "pad", "b", "b", "b", "b", "b", "b", "b", "b", "c", "c", "pad", "pad", "pad", "pad", "pad", "pad"]
          : ["b", "b", "b", "b", "b", "b", "b", "b", "c", "c", "a", "pad", "pad", "pad", "pad", "pad"];
        mount.appendChild(cells(seq));
        mount.appendChild(el("p", { class: "whint", style: "margin-top:12px;max-width:74ch", text: state.repr === "c"
          ? "#[repr(C)]: orden de declaración a, b, c. Alinear u64 fuerza 7 bytes de padding tras a, y el struct crece a 24. Necesario para FFI."
          : "Rust reordena a b, c, a (por alineación descendente): solo 5 bytes de padding al final. 8 bytes ahorrados frente a repr(C)." }));
      } else if (state.tab === "enum") {
        var codeE = el("div", { class: "rustc", style: "margin-top:18px" }, [el("pre", { html: '<span style="color:var(--code-kw)">enum</span> Mensaje {\n  Ping,             <span style="color:var(--code-cm)">// 0 datos</span>\n  Mover(u64, u64),  <span style="color:var(--code-cm)">// 16 bytes</span>\n}' })]);
        var varSeg = G.segmented(
          [{ value: "ping", label: "Ping" }, { value: "mover", label: "Mover" }],
          state.variant, function (v) { set({ variant: v }); });
        mount.appendChild(el("div", { class: "wrow", style: "gap:20px;align-items:flex-start" }, [
          codeE,
          el("div", { style: "display:flex;flex-direction:column;gap:12px" }, [
            el("div", { class: "wrow" }, [el("span", { class: "eyebrow", style: "font-size:10px", text: "variante activa" }), varSeg.node]),
            el("div", {}, [el("div", { class: "eyebrow", style: "font-size:10px", text: "size_of (el mayor)" }), el("div", { class: "mono", style: "font-size:24px;font-weight:700", text: "24 bytes" })])
          ])
        ]));
        var eseq = ["tag", "pad", "pad", "pad", "pad", "pad", "pad", "pad"];
        var payK = state.variant === "mover" ? "pay" : "unused";
        for (var i = 0; i < 16; i++) eseq.push(payK);
        mount.appendChild(cells(eseq));
        mount.appendChild(el("p", { class: "whint", style: "margin-top:12px;max-width:74ch", text: state.variant === "mover"
          ? "Mover(u64,u64) usa los 16 bytes de payload. El tag (ámbar) distingue el variante; el tamaño total = el del variante mayor + discriminante + padding."
          : "Ping no lleva datos: los 16 bytes de payload quedan sin usar. Aun así el enum ocupa 24 — reserva espacio para el variante mayor." }));
      } else {
        var nSeg = G.segmented(
          [{ value: "some", label: "Some(&x)" }, { value: "none", label: "None" }],
          state.niche, function (n) { set({ niche: n }); });
        mount.appendChild(el("div", { class: "wrow", style: "margin-top:18px" }, [el("span", { class: "eyebrow", style: "font-size:10px", text: "Option<&T> vale" }), nSeg.node]));
        var nseq = [];
        for (var j = 0; j < 8; j++) nseq.push(state.niche === "some" ? "ptr" : "zero");
        mount.appendChild(cells(nseq, 34));
        mount.appendChild(el("div", { class: "wrow", style: "gap:20px;margin-top:16px" }, [
          el("div", {}, [el("div", { class: "eyebrow", style: "font-size:10px", text: "size_of::<Option<&T>>" }), el("div", { class: "mono", style: "font-size:24px;font-weight:700;color:var(--data-pos)", text: "8 bytes" })]),
          el("div", {}, [el("div", { class: "eyebrow", style: "font-size:10px", text: "size_of::<&T>" }), el("div", { class: "mono", style: "font-size:24px;font-weight:700", text: "8 bytes" })])
        ]));
        mount.appendChild(el("p", { class: "whint", style: "margin-top:12px;max-width:74ch", text: state.niche === "some"
          ? "Some(&x): los 8 bytes son el puntero (nunca nulo para &T)."
          : "None: los 8 bytes a cero — el patrón de puntero nulo, imposible para un &T real, hace de None. Cero bytes de discriminante extra." }));
      }
    }
    render();
  };

  /* ===========================================================
     12 · SEND / SYNC — ¿compila compartir entre hilos?
     =========================================================== */
  G.widgets["send-sync"] = function (host, fam) {
    var META = { rc: { send: false, sync: false }, arc: { send: true, sync: true }, mutex: { send: true, sync: true } };
    var state = { wrap: "rc", phase: "idle", counter: 0, holder: null };
    var timer = null, TARGET = 6;
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function compile() {
      stop();
      if (state.wrap === "mutex") set({ phase: "ok", counter: 0, holder: null });
      else set({ phase: "err", counter: 0, holder: null });
    }
    function run() {
      if (state.wrap !== "mutex") return;
      stop(); set({ phase: "run", counter: 0, holder: "t1" });
      if (G.reduceMotion) { set({ counter: TARGET, holder: null, phase: "done" }); return; }
      var n = 0;
      timer = setInterval(function () {
        n++; set({ counter: n, holder: n % 2 === 1 ? "t2" : "t1" });
        if (n >= TARGET) { stop(); set({ holder: null, phase: "done" }); }
      }, 500);
    }

    function badge(name, ok, sub) {
      return el("div", { style: "display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:var(--radius-full);border:1px solid " + (ok ? "var(--data-pos)" : "var(--data-neg)") + ";background:" + (ok ? "var(--data-pos-bg)" : "var(--data-neg-bg)") }, [
        el("span", { class: "mono", style: "font-size:12px;font-weight:600", text: name }),
        el("span", { class: "mono", style: "font-size:13px;font-weight:700;color:" + (ok ? "var(--data-pos)" : "var(--data-neg)"), text: ok ? "✓" : "✗" }),
        el("span", { class: "whint", style: "font-size:11px", text: sub })
      ]);
    }
    function threadCard(title, active, stateTxt) {
      return el("div", { style: "border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:14px;background:var(--color-bg-surface)" }, [
        el("div", { class: "eyebrow", style: "font-size:10px", text: title }),
        el("div", { class: "wrow", style: "margin-top:12px;gap:10px" }, [
          el("span", { style: "width:14px;height:14px;border-radius:50%;transition:.2s;background:" + (active ? "var(--color-primary)" : "var(--color-border-strong)") }),
          el("span", { class: "mono", style: "font-size:12px;color:var(--color-fg-subtle)", text: stateTxt })
        ])
      ]);
    }

    function render() {
      clear(mount);
      var meta = META[state.wrap];
      var running = state.phase === "run";
      var seg = G.segmented(
        [{ value: "rc", label: "Rc<i32>" }, { value: "arc", label: "Arc<i32>" }, { value: "mutex", label: "Arc<Mutex<i32>>" }],
        state.wrap, function (w) { stop(); set({ wrap: w, phase: "idle", counter: 0, holder: null }); });
      mount.appendChild(el("div", { class: "wrow" }, [el("span", { class: "eyebrow", text: "Envoltura" }), seg.node]));

      mount.appendChild(el("div", { class: "wrow", style: "margin-top:16px" }, [
        badge("Send", meta.send, "mover a otro hilo"),
        badge("Sync", meta.sync, "compartir &T entre hilos")
      ]));

      var t1Active = running && state.holder === "t1", t2Active = running && state.holder === "t2";
      mount.appendChild(el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px" }, [
        threadCard("Hilo principal", t1Active, t1Active ? "tiene el candado · *n += 1" : running ? "esperando…" : "listo"),
        threadCard("Hilo 2 (spawn)", t2Active, t2Active ? "tiene el candado · *n += 1" : running ? "esperando…" : (state.phase === "ok" || state.phase === "done" ? "listo" : "—"))
      ]));

      var boxLabel = state.wrap === "rc" ? "Rc<i32>" : state.wrap === "arc" ? "Arc<i32>" : "Arc<Mutex<i32>>";
      var lockLabel, lockColor;
      if (state.wrap === "mutex" && running && state.holder) { lockLabel = "candado → " + (state.holder === "t1" ? "hilo principal" : "hilo 2"); lockColor = "var(--color-primary)"; }
      else if (state.phase === "done") { lockLabel = "candado libre · final = " + state.counter; lockColor = "var(--data-pos)"; }
      else { lockLabel = "sin candado activo"; lockColor = "var(--color-fg-faint)"; }
      var boxBorder = state.phase === "err" ? "var(--data-neg)" : running ? "var(--color-primary)" : fam;
      mount.appendChild(el("div", { class: "wrow", style: "justify-content:center;margin-top:16px" }, [
        el("div", { style: "border:2px solid " + boxBorder + ";background:" + (state.phase === "err" ? "var(--data-neg-bg)" : "color-mix(in srgb," + fam + " 7%, var(--color-bg-surface))") + ";border-radius:var(--radius-md);padding:14px 26px;text-align:center;transition:.25s" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: boxLabel }),
          el("div", { class: "mono", style: "font-size:34px;font-weight:700;margin-top:4px", text: String(state.counter) }),
          el("div", { class: "mono", style: "font-size:11px;margin-top:4px;color:" + lockColor, text: lockLabel })
        ])
      ]));

      var canRun = state.wrap === "mutex" && (state.phase === "ok" || state.phase === "run" || state.phase === "done");
      var ctrls = [G.wbtn({ icon: "right", label: "compartir con hilo 2", onClick: compile })];
      if (canRun) ctrls.push(G.wbtn({ icon: "right", variant: "primary", label: "ejecutar", onClick: run }));
      ctrls.push(G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { stop(); set({ phase: "idle", counter: 0, holder: null }); } }));
      mount.appendChild(el("div", { class: "wrow mt" }, ctrls));

      if (state.phase === "ok" || state.phase === "done") {
        mount.appendChild(el("div", { class: "verdict-ok", html: '✓ compila · <span>' + (state.phase === "done"
          ? "dos hilos incrementaron tras el candado — final determinista = " + state.counter + ", sin carrera."
          : "Arc lo hace Send+Sync; Mutex serializa el acceso. Pulsa «ejecutar».") + "</span>" }));
      } else if (state.phase === "err") {
        var e = state.wrap === "rc"
          ? { c: "E0277", m: "`Rc<i32>` cannot be sent between threads safely", n1: "thread::spawn(move || { ... c2 ... });", n2: "^^^^^^^^^^^^^ `Rc<i32>` is not `Send`", h: "Rc usa un contador NO atómico: dos hilos lo corromperían. Cambia a Arc." }
          : { c: "E0596", m: "cannot borrow data in an `Arc` as mutable", n1: "let mut n = c2;", n2: "*n += 1;   ^^ `Arc` no da mutabilidad interior", h: "Arc<i32> es Send+Sync, pero solo permite LEER. Para mutar necesitas Arc<Mutex<i32>>." };
        mount.appendChild(G.rustc(
'<span class="e">error[' + e.c + ']</span>: ' + G.dom.escapeHtml(e.m) + '\n <span class="g">--&gt; src/main.rs</span>\n  <span class="g">|</span>\n  <span class="g">|</span>  ' + G.dom.escapeHtml(e.n1) + '\n  <span class="g">|</span>  <span class="r">' + G.dom.escapeHtml(e.n2) + '</span>', e.h));
      }
    }
    render();
  };

  /* ===========================================================
     13 · ASYNC / FUTURES — conduce la máquina de estado con poll
     =========================================================== */
  G.widgets["async-futures"] = function (host, fam) {
    var state = { pc: 0, aReady: false, bReady: false, log: [], result: "idle" };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }

    function poll() {
      var log = state.log.slice();
      function push(t, c) { log.push({ text: t, color: c }); }
      if (state.pc === 0) {
        if (state.aReady) { push("poll → leer_a() Ready; avanza a EsperaB", "var(--code-str)"); set({ pc: 1, log: log, result: "pending" }); }
        else { push("poll → leer_a() Pending; la tarea se aparca", "var(--data-warn)"); set({ log: log, result: "pending" }); }
      } else if (state.pc === 1) {
        if (state.bReady) { push("poll → leer_b() Ready; Poll::Ready(a + b) = 42", "var(--code-str)"); set({ pc: 2, log: log, result: "ready" }); }
        else { push("poll → leer_b() Pending; la tarea se aparca", "var(--data-warn)"); set({ log: log, result: "pending" }); }
      } else {
        push("ya completado — no vuelvas a poll un Future terminado", "var(--code-cm)"); set({ log: log, result: "ready" });
      }
    }
    function togglePill(label, on, cb) {
      return el("button", { class: "mono", style: "font-size:12px;padding:6px 13px;border-radius:var(--radius-full);cursor:pointer;border:1px solid " + (on ? "var(--data-pos)" : "var(--color-border-strong)") + ";background:" + (on ? "var(--data-pos-bg)" : "var(--color-bg-surface)") + ";color:" + (on ? "var(--data-pos)" : "var(--color-fg-subtle)"), text: label, on: { click: cb } });
    }

    function render() {
      clear(mount);
      var defs = [{ name: "EsperaA", sub: "tras 1er await" }, { name: "EsperaB", sub: "tras 2º await" }, { name: "Done", sub: "Ready(42)" }];
      var chain = el("div", { class: "wrow" });
      defs.forEach(function (d, i) {
        var on = i === state.pc, done = i < state.pc;
        chain.appendChild(el("div", { style: "border:1.5px solid " + (on ? fam : done ? "var(--data-pos)" : "var(--color-border-default)") + ";background:" + (on ? "color-mix(in srgb," + fam + " 12%, var(--color-bg-surface))" : done ? "var(--data-pos-bg)" : "var(--color-bg-surface)") + ";border-radius:var(--radius-md);padding:9px 13px;transition:.25s" }, [
          el("div", { class: "mono", style: "font-size:12px;font-weight:700;color:" + (on ? fam : "var(--color-fg-default)"), text: d.name }),
          el("div", { class: "whint", style: "font-size:10px", text: d.sub })
        ]));
        if (i < defs.length - 1) chain.appendChild(el("span", { class: "mono", style: "color:var(--color-fg-faint)", text: "→" }));
      });
      mount.appendChild(chain);

      mount.appendChild(el("div", { class: "wrow", style: "gap:20px;margin-top:20px" }, [
        el("div", { class: "wrow", style: "gap:10px" }, [el("span", { class: "mono", style: "font-size:12px;color:var(--color-fg-subtle)", text: "leer_a():" }), togglePill(state.aReady ? "listo" : "pendiente", state.aReady, function () { set({ aReady: !state.aReady }); })]),
        el("div", { class: "wrow", style: "gap:10px" }, [el("span", { class: "mono", style: "font-size:12px;color:var(--color-fg-subtle)", text: "leer_b():" }), togglePill(state.bReady ? "listo" : "pendiente", state.bReady, function () { set({ bReady: !state.bReady }); })])
      ]));

      var res = state.result;
      var rTxt = res === "ready" ? "Poll::Ready(42)" : res === "pending" ? "Poll::Pending" : "sin conducir";
      var rCol = res === "ready" ? "var(--data-pos)" : res === "pending" ? "var(--data-warn)" : "var(--color-fg-faint)";
      var rBg = res === "ready" ? "var(--data-pos-bg)" : res === "pending" ? "var(--data-warn-bg)" : "var(--color-bg-muted)";
      mount.appendChild(el("div", { class: "wrow mt" }, [
        G.wbtn({ icon: "right", variant: "primary", label: "poll()", onClick: poll }),
        G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { set({ pc: 0, log: [], result: "idle" }); } }),
        el("span", { class: "mono", style: "font-size:12px;padding:6px 12px;border-radius:var(--radius-full);border:1px solid " + rCol + ";color:" + rCol + ";background:" + rBg, text: rTxt })
      ]));

      var console = el("div", { class: "rustc", style: "margin-top:16px;min-height:70px" }, [
        el("div", { class: "eyebrow", style: "font-size:9.5px;color:var(--code-cm)", text: "consola · el executor conduce" })
      ]);
      var logBox = el("div", { style: "display:flex;flex-direction:column;gap:2px;margin-top:6px" });
      if (state.log.length === 0) logBox.appendChild(el("span", { class: "mono", style: "font-size:12px;color:var(--code-cm)", text: "(pulsa poll para conducir la máquina)" }));
      else state.log.forEach(function (l) { logBox.appendChild(el("span", { class: "mono", style: "font-size:12px;color:" + l.color, text: l.text })); });
      console.appendChild(logBox);
      mount.appendChild(console);

      mount.appendChild(el("div", { style: "margin-top:18px;display:flex;align-items:center;gap:16px;background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:14px 16px;flex-wrap:wrap" }, [
        el("div", { style: "border:1.5px dashed " + fam + ";border-radius:var(--radius-md);padding:12px 16px;font-family:var(--font-mono);font-size:12px" }, [
          el("div", { text: "máquina de estado" }),
          el("div", { style: "font-size:10px;color:var(--color-fg-subtle);margin-top:4px", text: "buffer ◄┐" }),
          el("div", { style: "font-size:10px;color:" + fam + ";margin-top:2px", text: "ptr ───┘ (a sí misma)" })
        ]),
        el("p", { class: "whint", style: "margin:0;flex:1;min-width:240px", html: '<strong>Pin.</strong> Como la máquina puede guardar punteros <em>a sí misma</em> (self-referencial) entre awaits, moverla en memoria dejaría esos punteros colgando. <code>Pin</code> promete que no se moverá — por eso <code>poll</code> recibe <code>Pin&lt;&mut Self&gt;</code>.' })
      ]));
    }
    render();
  };

  /* ===========================================================
     14 · EXECUTORS — cola → poll → reactor → waker
     =========================================================== */
  G.widgets.executors = function (host, fam) {
    var state = { tasks: [], seq: 0, log: [], auto: false };
    var timer = null;
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function spawn() {
      state.seq++;
      state.log = state.log.concat([{ text: "spawn T" + state.seq + " → cola de listas", color: "var(--code-cm)" }]);
      set({ tasks: state.tasks.concat([{ id: state.seq, state: "ready", ioReady: false, ioTimer: 0 }]) });
    }
    function tick() {
      var tasks = state.tasks.map(function (t) { return Object.assign({}, t); });
      var log = state.log.slice();
      function push(t, c) { log.push({ text: t, color: c }); }
      tasks.forEach(function (t) {
        if (t.state === "parked") { t.ioTimer--; if (t.ioTimer <= 0) { t.state = "ready"; t.ioReady = true; push("waker: I/O de T" + t.id + " listo → re-encola", "var(--code-fn)"); } }
      });
      var ready = tasks.filter(function (t) { return t.state === "ready"; }).slice(0, 2);
      ready.forEach(function (t, i) {
        var worker = i === 0 ? "hilo-0" : "hilo-1 (robó)";
        if (t.ioReady) { t.state = "done"; push(worker + " poll(T" + t.id + ") → Ready ✓", "var(--code-str)"); }
        else { t.state = "parked"; t.ioTimer = 2; push(worker + " poll(T" + t.id + ") → Pending; aparca en reactor", "var(--data-warn)"); }
      });
      state.log = log;
      set({ tasks: tasks });
      if (state.auto && tasks.length > 0 && tasks.every(function (t) { return t.state === "done"; })) stop();
    }
    function toggleAuto() {
      state.auto = !state.auto; stop();
      if (state.auto && !G.reduceMotion) timer = setInterval(tick, 900);
      set({});
    }

    function render() {
      clear(mount);
      mount.appendChild(el("div", { class: "wrow between" }, [
        el("div", { class: "wrow" }, [
          G.wbtn({ icon: "add", label: "spawn tarea", onClick: spawn }),
          G.wbtn({ icon: "right", variant: "primary", label: "tick", onClick: tick }),
          (function () {
            var on = state.auto;
            return el("button", { class: "mono", style: "font-size:12px;padding:9px 14px;border-radius:var(--radius-full);cursor:pointer;border:1px solid " + (on ? "var(--color-primary)" : "var(--color-border-strong)") + ";background:" + (on ? "var(--color-primary-muted)" : "var(--color-bg-surface)") + ";color:" + (on ? "var(--color-primary)" : "var(--color-fg-subtle)"), text: (on ? "✓ " : "") + "auto", on: { click: toggleAuto } });
          })()
        ]),
        G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { stop(); set({ tasks: [], seq: 0, log: [], auto: false }); } })
      ]));

      var ZONES = [
        { key: "ready", label: "Cola de listas", sub: "esperan poll", border: fam, lc: fam },
        { key: "running", label: "Ejecutor · 2 hilos", sub: "poll() en curso", border: "var(--color-border-strong)", lc: "var(--color-fg-subtle)" },
        { key: "parked", label: "Reactor · epoll", sub: "aparcadas en I/O", border: "var(--data-warn)", lc: "var(--data-warn)" },
        { key: "done", label: "Terminadas", sub: "Ready ✓", border: "var(--data-pos)", lc: "var(--data-pos)" }
      ];
      function chip(t) {
        var col = t.state === "done" ? ["var(--data-pos-bg)", "var(--data-pos)"] : t.state === "parked" ? ["var(--data-warn-bg)", "var(--data-warn)"] : ["color-mix(in srgb," + fam + " 14%, var(--color-bg-surface))", fam];
        return el("div", { class: "mono", style: "width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:" + col[0] + ";color:" + col[1] + ";border:2px solid " + col[1] + ";transition:.2s", text: "T" + t.id });
      }
      var grid = el("div", { style: "display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px" });
      ZONES.forEach(function (z) {
        var box = el("div", { style: "background:var(--color-bg-surface);border:1px solid " + z.border + ";border-radius:var(--radius-md);padding:11px;min-height:150px" }, [
          el("div", { class: "mono", style: "font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:" + z.lc, text: z.label }),
          el("div", { class: "whint", style: "font-size:9.5px;margin-top:2px", text: z.sub })
        ]);
        var chips = el("div", { style: "display:flex;flex-wrap:wrap;gap:5px;margin-top:10px" });
        state.tasks.filter(function (t) { return t.state === z.key; }).forEach(function (t) { chips.appendChild(chip(t)); });
        box.appendChild(chips);
        grid.appendChild(box);
      });
      mount.appendChild(grid);
      mount.appendChild(el("div", { class: "wrow", style: "justify-content:space-around;margin-top:8px;font-family:var(--font-mono);font-size:10px;color:var(--color-fg-faint)" }, [
        el("span", { text: "poll ▶" }), el("span", { text: "Pending ▶ aparca" }), el("span", { text: "◀ waker re-encola" })
      ]));

      var console = el("div", { class: "rustc", style: "margin-top:14px;min-height:70px;max-height:130px;overflow-y:auto" }, [
        el("div", { class: "eyebrow", style: "font-size:9.5px;color:var(--code-cm)", text: "consola · scheduler (2 hilos · work-stealing)" })
      ]);
      var logBox = el("div", { style: "display:flex;flex-direction:column;gap:2px;margin-top:6px" });
      if (state.log.length === 0) logBox.appendChild(el("span", { class: "mono", style: "font-size:11.5px;color:var(--code-cm)", text: "(lanza tareas y da tick)" }));
      else state.log.slice(-8).forEach(function (l) { logBox.appendChild(el("span", { class: "mono", style: "font-size:11.5px;color:" + l.color, text: l.text })); });
      console.appendChild(logBox);
      mount.appendChild(console);
    }
    render();
  };

  /* ===========================================================
     15 · UNSAFE — dentro y fuera de la burbuja
     =========================================================== */
  G.widgets.unsafe = function (host, fam) {
    var OPS = [
      { code: "*ptr_crudo", tag: "deref *mut T", inv: "ptr apunta a memoria válida, alineada y viva; respetas aliasing XOR mutabilidad tú mismo." },
      { code: "ffi::c_func()", tag: "llamada FFI", inv: "la firma C es correcta y la función cumple lo que promete su cabecera." },
      { code: "CONTADOR += 1", tag: "static mut", inv: "ningún otro hilo accede a la vez (sin esto habría carrera de datos)." },
      { code: "unsafe impl Send", tag: "trait unsafe", inv: "el tipo es realmente seguro de mover entre hilos; el compilador te cree." },
      { code: "u.campo_float", tag: "union", inv: "el último valor escrito fue de ese mismo campo; leer otro es UB." }
    ];
    var state = { zone: "safe", picked: null };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }

    function render() {
      clear(mount);
      var inUnsafe = state.zone === "unsafe";
      var seg = G.segmented(
        [{ value: "safe", label: "en código seguro" }, { value: "unsafe", label: "dentro de unsafe {}" }],
        state.zone, function (z) { set({ zone: z, picked: null }); });
      mount.appendChild(el("div", { class: "wrow" }, [el("span", { class: "eyebrow", text: "Estás" }), seg.node]));

      var bubble = el("div", { style: "margin-top:18px;border:2px " + (inUnsafe ? "solid " + fam : "dashed var(--color-border-default)") + ";border-radius:var(--radius-lg);padding:16px;background:" + (inUnsafe ? "color-mix(in srgb," + fam + " 6%, var(--color-bg-surface))" : "var(--color-bg-surface)") + ";transition:.25s" }, [
        el("div", { class: "mono", style: "font-size:12px;font-weight:600;color:" + (inUnsafe ? fam : "var(--color-fg-subtle)"), text: inUnsafe ? "unsafe { … }   — superpoderes habilitados" : "código seguro   — solo lo que el checker puede probar" })
      ]);
      var opWrap = el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:12px" });
      OPS.forEach(function (o, i) {
        var on = state.picked === i;
        opWrap.appendChild(el("button", { style: "text-align:left;cursor:pointer;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--radius-md);transition:.15s;border:1px solid " + (on ? fam : "var(--color-border-default)") + ";background:" + (on ? "var(--color-bg-lit)" : "var(--color-bg-surface)"), on: { click: function () { set({ picked: i }); } } }, [
          el("span", { class: "mono", style: "font-size:12px;font-weight:700;width:16px;color:" + (inUnsafe ? "var(--data-warn)" : "var(--data-neg)"), text: inUnsafe ? "✓" : "✗" }),
          el("span", { class: "mono", style: "font-size:12px;flex:1", text: o.code }),
          el("span", { class: "whint", style: "font-size:10px", text: o.tag })
        ]));
      });
      bubble.appendChild(opWrap);
      mount.appendChild(bubble);

      if (state.picked !== null) {
        var o = OPS[state.picked];
        if (!inUnsafe) mount.appendChild(G.rustc('<span class="e">error[E0133]</span>: `' + G.dom.escapeHtml(o.code) + '` requiere un bloque unsafe\n  <span class="g">= note: consult the Nomicon; wrap in an `unsafe` block</span>'));
        else mount.appendChild(el("div", { style: "margin-top:16px;background:var(--data-warn-bg);border:1px solid var(--data-warn);border-radius:var(--radius-md);padding:12px 16px" }, [
          el("span", { class: "mono", style: "font-size:12.5px;color:var(--data-warn)", text: "⚠ permitido dentro de unsafe" }),
          el("div", { class: "prose", style: "margin-top:6px;font-size:13px", html: "<strong>Tu invariante:</strong> " + o.inv })
        ]));
      }
    }
    render();
  };

  /* ===========================================================
     16 · ATOMICS — memory ordering y el patrón publicar-un-dato
     =========================================================== */
  G.widgets.atomics = function (host, fam) {
    var state = { ord: "relaxed", ran: false };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }

    function render() {
      clear(mount);
      var relaxed = state.ord === "relaxed";
      var torn = state.ran && relaxed;   // determinista: Relaxed muestra el reordenamiento posible
      var ordShort = relaxed ? "Relaxed" : state.ord === "relacq" ? "Release / Acquire" : "SeqCst";
      var seg = G.segmented(
        [{ value: "relaxed", label: "Relaxed" }, { value: "relacq", label: "Release/Acquire" }, { value: "seqcst", label: "SeqCst" }],
        state.ord, function (o) { set({ ord: o, ran: false }); });
      mount.appendChild(el("div", { class: "wrow between" }, [
        el("div", { class: "wrow" }, [el("span", { class: "eyebrow", text: "Ordering" }), seg.node]),
        el("div", { class: "wrow" }, [
          G.wbtn({ icon: "right", variant: "primary", label: "ejecutar", onClick: function () { set({ ran: true }); } }),
          G.wbtn({ icon: "replay", variant: "ghost", ariaLabel: "reiniciar", onClick: function () { set({ ran: false }); } })
        ])
      ]));

      function line(txt, famc) { return el("div", { class: "mono", style: "font-size:12px;padding:8px 10px;border-radius:var(--radius-sm);background:color-mix(in srgb," + famc + " 10%, var(--color-bg-canvas));border:1px solid " + famc, html: txt }); }
      mount.appendChild(el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px" }, [
        el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:14px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px;color:var(--fam-1)", text: "Hilo A · productor" }),
          el("div", { style: "display:flex;flex-direction:column;gap:6px;margin-top:10px" }, [line("datos = 42;", "var(--fam-1)"), line("listo.store(true, " + (relaxed ? "Relaxed" : state.ord === "relacq" ? "Release" : "SeqCst") + ")", "var(--fam-1)")])
        ]),
        el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:14px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px;color:var(--fam-4)", text: "Hilo B · consumidor" }),
          el("div", { style: "display:flex;flex-direction:column;gap:6px;margin-top:10px" }, [line("while !listo.load(" + (relaxed ? "Relaxed" : state.ord === "relacq" ? "Acquire" : "SeqCst") + ") {}", "var(--fam-4)"), line("leer datos → <strong>" + (!state.ran ? "?" : torn ? "0 (basura)" : "42") + "</strong>", "var(--fam-4)")])
        ])
      ]));

      var bar = relaxed
        ? { l: "sin barrera", c: "var(--data-neg)", bg: "var(--data-neg-bg)", d: "CPU y compilador pueden reordenar la escritura del dato y la de la bandera. B puede ver listo=true con datos aún a 0." }
        : state.ord === "relacq"
        ? { l: "Release ↓ / Acquire ↑", c: "var(--data-pos)", bg: "var(--data-pos-bg)", d: "El store(Release) impide que la escritura del dato «baje» tras la bandera; el load(Acquire) impide que la lectura del dato «suba». Se sincronizan." }
        : { l: "orden total (SeqCst)", c: "var(--data-pos)", bg: "var(--data-pos-bg)", d: "Además de Release/Acquire, todos los hilos ven un único orden global de las operaciones SeqCst. Lo más fuerte (y a veces más caro)." };
      mount.appendChild(el("div", { style: "margin-top:16px;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:var(--radius-md);background:" + bar.bg + ";border:1px solid " + bar.c }, [
        el("span", { class: "mono", style: "font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:" + bar.c, text: bar.l }),
        el("span", { class: "whint", style: "color:var(--color-fg-default)", text: bar.d })
      ]));

      if (state.ran) {
        var v = torn
          ? { m: "✗ carrera de visibilidad", c: "var(--data-neg)", bg: "var(--data-neg-bg)", t: "B leyó la bandera reordenada antes que el dato: obtuvo 0. Con Relaxed no hay relación happens-before entre ambas escrituras. En otra CPU o ejecución el resultado varía." }
          : { m: "✓ siempre correcto", c: "var(--data-pos)", bg: "var(--data-pos-bg)", t: "B leyó 42. La pareja Release/Acquire crea happens-before: lo escrito antes del store es visible tras el load que lo observa." };
        mount.appendChild(el("div", { style: "margin-top:16px;border-radius:var(--radius-md);padding:12px 16px;background:" + v.bg + ";border:1px solid " + v.c }, [
          el("span", { class: "mono", style: "font-size:12.5px;color:" + v.c, text: v.m }),
          el("span", { class: "prose", style: "margin:0 0 0 6px;display:inline;font-size:13px", text: v.t })
        ]));
      }
    }
    render();
  };

  /* ===========================================================
     17 · CLOSURES — deduce el trait (Fn / FnMut / FnOnce)
     =========================================================== */
  G.widgets.closures = function (host, fam) {
    var M = {
      read: { xInit: 'String::from("hola")', body: 'println!("{}", x);', cap: "&x   (por referencia)", field: "&String", trait: "Fn", once: false, call: "Se puede llamar muchas veces: solo lee x." },
      mutate: { xInit: "0", body: "x += 1;", cap: "&mut x   (referencia mutable)", field: "&mut i32", trait: "FnMut", once: false, call: "Se puede llamar muchas veces, pero necesita acceso exclusivo (let mut c)." },
      consume: { xInit: 'String::from("hola")', body: "drop(x);  // consume x", cap: "x   (por valor, movido)", field: "String", trait: "FnOnce", once: true, call: "Se puede llamar UNA sola vez: la segunda es error (x ya fue consumido)." }
    };
    var COL = { Fn: "var(--fam-2)", FnMut: "var(--fam-1)", FnOnce: "var(--fam-3)" };
    var state = { use: "read" };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }

    function render() {
      clear(mount);
      var m = M[state.use], tc = COL[m.trait];
      var seg = G.segmented(
        [{ value: "read", label: "leerla" }, { value: "mutate", label: "mutarla" }, { value: "consume", label: "consumirla (move)" }],
        state.use, function (u) { set({ use: u }); });
      mount.appendChild(el("div", { class: "wrow" }, [el("span", { class: "eyebrow", text: "El cuerpo usa x para" }), seg.node]));

      mount.appendChild(el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px;align-items:start" }, [
        el("div", { class: "rustc" }, [el("pre", { text: "let x = " + m.xInit + ";\nlet c = move || {\n    " + m.body + "\n};" })]),
        el("div", { style: "background:var(--color-bg-surface);border:1.5px solid " + tc + ";border-radius:var(--radius-md);padding:14px 16px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: "compila a (aprox.)" }),
          el("pre", { class: "mono", style: "margin:8px 0 0;font-size:11.5px;line-height:1.55;color:var(--color-fg-default)", text: "struct Anon {\n    x: " + m.field + ",\n}\nimpl " + m.trait + " for Anon" })
        ])
      ]));

      mount.appendChild(el("div", { class: "wrow", style: "margin-top:18px" }, [
        el("div", { style: "flex:1;min-width:180px;background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:12px 14px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: "Modo de captura" }),
          el("div", { class: "mono", style: "font-size:15px;font-weight:700;margin-top:4px;color:" + tc, text: m.cap })
        ]),
        el("div", { style: "flex:1;min-width:180px;background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:12px 14px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: "Trait (el más restrictivo que cumple)" }),
          el("div", { class: "mono", style: "font-size:15px;font-weight:700;margin-top:4px;color:" + tc, text: m.trait })
        ])
      ]));

      var order = ["FnOnce", "FnMut", "Fn"];
      var impl = m.trait === "Fn" ? ["Fn", "FnMut", "FnOnce"] : m.trait === "FnMut" ? ["FnMut", "FnOnce"] : ["FnOnce"];
      var subs = { FnOnce: "1 llamada · consume", FnMut: "N · &mut self", Fn: "N · &self" };
      var hier = el("div", { class: "wrow", style: "gap:8px" });
      order.forEach(function (name) {
        var on = impl.indexOf(name) >= 0, primary = name === m.trait;
        hier.appendChild(el("div", { style: "flex:1;text-align:center;font-family:var(--font-mono);font-size:12px;font-weight:600;padding:10px;border-radius:var(--radius-md);transition:.2s;background:" + (primary ? "color-mix(in srgb," + tc + " 14%, var(--color-bg-surface))" : on ? "var(--color-bg-surface)" : "var(--color-bg-muted)") + ";border:1px solid " + (primary ? tc : on ? "var(--color-border-strong)" : "var(--color-border-default)") + ";color:" + (on ? "var(--color-fg-default)" : "var(--color-fg-faint)") }, [
          el("div", { text: name }),
          el("div", { style: "font-family:var(--font-sans);font-size:10px;font-weight:400;margin-top:2px;color:var(--color-fg-subtle)", text: subs[name] })
        ]));
      });
      mount.appendChild(el("div", { style: "margin-top:16px" }, [
        el("div", { class: "eyebrow", style: "font-size:10px;margin-bottom:8px", text: "jerarquía · FnOnce ⊇ FnMut ⊇ Fn" }), hier
      ]));

      mount.appendChild(el("div", { style: "margin-top:16px;border-radius:var(--radius-md);padding:12px 16px;background:" + (m.once ? "var(--data-warn-bg)" : "var(--data-pos-bg)") + ";border:1px solid " + (m.once ? "var(--data-warn)" : "var(--data-pos)") }, [
        el("span", { class: "mono", style: "font-size:12.5px;color:" + (m.once ? "var(--data-warn)" : "var(--data-pos)"), text: m.once ? "① solo una vez" : "∞ muchas veces" }),
        el("span", { class: "prose", style: "margin:0 0 0 6px;display:inline;font-size:13px", text: m.call })
      ]));
    }
    render();
  };

  /* ===========================================================
     18 · ORPHAN RULE — ¿local o huérfano?
     =========================================================== */
  G.widgets["orphan-rule"] = function (host, fam) {
    var state = { traitOwner: "local", typeOwner: "foreign" };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }

    function render() {
      clear(mount);
      var traitLocal = state.traitOwner === "local", typeLocal = state.typeOwner === "local";
      var allowed = traitLocal || typeLocal, orphan = !allowed;
      var traitName = traitLocal ? "MiTrait" : "Display", typeName = typeLocal ? "MiTipo" : "Vec<String>";
      var tc = traitLocal ? "var(--fam-2)" : "var(--color-fg-faint)", yc = typeLocal ? "var(--fam-1)" : "var(--color-fg-faint)";

      function ownerSel(label, val, cb) {
        return el("div", { class: "wrow", style: "gap:12px" }, [
          el("span", { class: "eyebrow", text: label }),
          G.segmented([{ value: "local", label: "tu crate" }, { value: "foreign", label: "otra crate" }], val, cb).node
        ]);
      }
      mount.appendChild(el("div", { class: "wrow", style: "gap:28px" }, [
        ownerSel("El trait", state.traitOwner, function (o) { set({ traitOwner: o }); }),
        ownerSel("El tipo", state.typeOwner, function (o) { set({ typeOwner: o }); })
      ]));

      mount.appendChild(el("div", { style: "margin-top:20px;background:var(--color-bg-code);border:1.5px solid " + (allowed ? "var(--data-pos)" : "var(--data-neg)") + ";border-radius:var(--radius-md);padding:16px 18px;transition:.25s" }, [
        el("pre", { class: "mono", style: "margin:0;font-size:14px;line-height:1.6;color:var(--color-fg-default)", html: '<span style="color:' + fam + '">impl</span> <span style="color:' + tc + '">' + traitName + '</span> <span style="color:' + fam + '">for</span> <span style="color:' + yc + '">' + G.dom.escapeHtml(typeName) + "</span> { … }" }),
        el("div", { class: "wrow", style: "gap:12px;margin-top:12px" }, [
          el("span", { class: "mono", style: "font-size:10px;padding:3px 9px;border-radius:var(--radius-full);border:1px solid " + tc + ";color:" + tc, text: "trait · " + (traitLocal ? "local" : "ajeno") }),
          el("span", { class: "mono", style: "font-size:10px;padding:3px 9px;border-radius:var(--radius-full);border:1px solid " + yc + ";color:" + yc, text: "tipo · " + (typeLocal ? "local" : "ajeno") })
        ])
      ]));

      var vt;
      if (allowed) vt = traitLocal && typeLocal ? "Posees ambos: trivialmente coherente." : traitLocal ? "El trait es tuyo: puedes implementarlo para cualquier tipo, incluso ajeno." : "El tipo es tuyo: puedes implementarle cualquier trait, incluso ajeno.";
      else vt = "Trait y tipo son ambos de otras crates. Prohibido: otra crate podría hacer el mismo impl y romper la coherencia. Usa el patrón newtype.";
      mount.appendChild(el("div", { style: "margin-top:16px;border-radius:var(--radius-md);padding:14px 16px;background:" + (allowed ? "var(--data-pos-bg)" : "var(--data-neg-bg)") + ";border:1px solid " + (allowed ? "var(--data-pos)" : "var(--data-neg)") }, [
        el("span", { class: "mono", style: "font-size:13px;font-weight:600;color:" + (allowed ? "var(--data-pos)" : "var(--data-neg)"), text: allowed ? "✓ impl permitido" : "✗ error E0117 · orphan rule" }),
        el("div", { class: "prose", style: "margin-top:6px;font-size:13px", text: vt })
      ]));

      if (orphan) mount.appendChild(el("div", { style: "margin-top:14px;background:var(--color-bg-surface);border:1px dashed " + fam + ";border-radius:var(--radius-md);padding:14px 16px" }, [
        el("div", { class: "eyebrow", style: "font-size:10px;color:" + fam, text: "salida · patrón newtype" }),
        el("pre", { class: "mono", style: "margin:8px 0 0;font-size:12.5px;line-height:1.6;color:var(--color-fg-default)", html: 'struct MiVec(Vec&lt;String&gt;);      <span style="color:var(--code-cm)">// tipo local que envuelve al ajeno</span>\nimpl Display for MiVec { … }   <span style="color:var(--code-cm)">// ✓ ahora el tipo es tuyo</span>' })
      ]));
    }
    render();
  };

  /* ===========================================================
     19 · IMPL TRAIT — cuatro formas de dispatch estático
     =========================================================== */
  G.widgets["impl-trait"] = function (host, fam) {
    var D = {
      generic: { code: "fn imprime<T: Display>(x: T) {\n    println!(\"{}\", x);\n}\n// monomorfizado por cada T concreto", who: "quien llama", many: "muchos (uno por T)", dispatch: "estático (monomorfización)", when: "El caso por defecto: máxima flexibilidad y velocidad. Quien llama fija T; el compilador genera una copia especializada." },
      assoc: { code: "trait Iterator {\n    type Item;            // tipo asociado\n    fn next(&mut self) -> Option<Self::Item>;\n}\n// un solo Item por implementador", who: "el implementador", many: "uno (fijado en el impl)", dispatch: "estático", when: "Cuando cada tipo tiene UN tipo relacionado natural (el Item que un iterador produce). Evita anotar el parámetro en cada uso." },
      arg: { code: "fn imprime(x: impl Display) {\n    println!(\"{}\", x);\n}\n// azúcar de fn imprime<T: Display>(x: T)", who: "quien llama", many: "muchos", dispatch: "estático", when: "Azúcar sintáctico para un genérico simple en posición de argumento. Más legible cuando no necesitas nombrar T." },
      ret: { code: "fn contador() -> impl Iterator<Item=u32> {\n    (0..).map(|x| x * 2)\n}\n// tipo concreto oculto, fijado por la fn", who: "la función (tipo oculto)", many: "uno concreto", dispatch: "estático (sin vtable)", when: "Para devolver un tipo complejo/anónimo (closures, cadenas de iteradores) sin escribir su nombre. Un solo tipo por rama — no vale para devolver dos distintos." }
    };
    var state = { form: "generic" };
    var mount = el("div");
    host.appendChild(G.well([mount]));
    function set(p) { Object.assign(state, p); render(); }

    function render() {
      clear(mount);
      var d = D[state.form];
      var seg = G.segmented(
        [{ value: "generic", label: "fn<T: Trait>" }, { value: "assoc", label: "type asociado" }, { value: "arg", label: "impl Trait (arg)" }, { value: "ret", label: "-> impl Trait" }],
        state.form, function (f) { set({ form: f }); });
      mount.appendChild(el("div", { class: "wrow" }, [seg.node]));

      mount.appendChild(el("div", { class: "rustc", style: "margin-top:18px" }, [el("pre", { text: d.code })]));

      function card(label, val) {
        return el("div", { style: "background:var(--color-bg-surface);border:1px solid var(--color-border-default);border-radius:var(--radius-md);padding:12px 14px" }, [
          el("div", { class: "eyebrow", style: "font-size:10px", text: label }),
          el("div", { style: "font-family:var(--font-sans);font-size:13px;font-weight:600;margin-top:4px;color:" + fam, text: val })
        ]);
      }
      mount.appendChild(el("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:16px" }, [
        card("¿Quién elige el tipo?", d.who), card("¿Cuántos impls por tipo?", d.many), card("Dispatch", d.dispatch)
      ]));
      mount.appendChild(el("div", { style: "margin-top:16px;background:var(--color-bg-muted);border-radius:var(--radius-md);padding:14px 16px" }, [
        el("div", { class: "eyebrow", style: "font-size:10px", text: "Cuándo usarlo" }),
        el("p", { class: "prose", style: "margin-top:8px;font-size:13.5px", text: d.when })
      ]));
    }
    render();
  };

  /* <<< MÁS_WIDGETS >>> */

})(window.GUIA = window.GUIA || {});
