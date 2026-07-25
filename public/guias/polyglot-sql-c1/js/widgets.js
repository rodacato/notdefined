/* widgets.js — widgets deterministas (semilla fija, cero Math.random).
   Patrón: PREDECIR → REVELAR. Cada paso cambia UNA cosa, con narración de un renglón. */
(function (G) {
  "use strict";
  var el = G.el;
  var C = G.comp;

  function montar(mount, nodo) { G.vaciar(mount).appendChild(nodo); }

  /* =========================================================================
     1 · LA JOYA — GROUP BY vs WINDOW
     ====================================================================== */
  var VENTAS = [
    { region: "Norte", fecha: "2026-03-01", monto: 120 },
    { region: "Norte", fecha: "2026-03-01", monto: 80 },
    { region: "Norte", fecha: "2026-03-04", monto: 60 },
    { region: "Sur", fecha: "2026-03-02", monto: 200 },
    { region: "Sur", fecha: "2026-03-05", monto: 50 },
    { region: "Sur", fecha: "2026-03-05", monto: 30 }
  ];

  /* Acumulado por partición: modo "rows" = fila por fila; "range" = suma los empates de golpe. */
  function acumulado(filas, modo) {
    var porRegion = {};
    var totalHastaFecha = {};
    filas.forEach(function (f) {
      porRegion[f.region] = (porRegion[f.region] || 0) + f.monto;
      var llave = f.region + "|" + f.fecha;
      totalHastaFecha[llave] = porRegion[f.region];
    });
    var corriendo = {};
    return filas.map(function (f) {
      corriendo[f.region] = (corriendo[f.region] || 0) + f.monto;
      return modo === "rows" ? corriendo[f.region] : totalHastaFecha[f.region + "|" + f.fecha];
    });
  }

  G.widgets["window"] = function (mount) {
    var salida = el("div");
    var narra = C.narracion();

    function pintar(modo) {
      if (modo === "group") {
        var totales = {};
        VENTAS.forEach(function (v) { totales[v.region] = (totales[v.region] || 0) + v.monto; });
        montar(salida, C.tabla({
          titulo: "GROUP BY region — 2 filas, el detalle se fue",
          cols: ["region", { t: "sum(monto)", num: true }],
          filas: Object.keys(totales).map(function (r) { return [r, totales[r]]; })
        }));
        narra.decir("<b>GROUP BY colapsa:</b> 6 ventas entran, 2 renglones salen. Ya no puedes ver la venta individual.");
      } else {
        var acum = acumulado(VENTAS, "rows");
        montar(salida, C.tabla({
          titulo: "SUM(monto) OVER (PARTITION BY region ORDER BY fecha) — 6 filas",
          cols: ["region", "fecha", { t: "monto", num: true }, { t: "acumulado", num: true }],
          filas: VENTAS.map(function (v, i) {
            return { celdas: [v.region, v.fecha, v.monto, { v: acum[i], tono: "elegida" }], clase: null };
          })
        }));
        narra.decir("<b>La window no colapsa:</b> 6 ventas entran, 6 renglones salen — cada uno con su acumulado al lado.");
      }
    }

    var p = C.prediccion({
      pregunta: "Seis ventas, dos regiones. ¿Cuántas filas devuelve GROUP BY region y cuántas la misma suma con OVER (PARTITION BY region)?",
      opciones: [{ txt: "2 y 2" }, { txt: "6 y 6" }, { txt: "2 y 6", ok: true }, { txt: "6 y 2" }],
      respuesta: "GROUP BY devuelve 2; la window devuelve 6. El agregado colapsa, la window agrega una columna sin perder el detalle.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "GROUP BY", valor: "group" },
            { txt: "OVER (PARTITION BY …)", valor: "window" }
          ], pintar, "group")),
          salida,
          narra
        ]);
        pintar("group");
      }
    });
    montar(mount, C.widget("GROUP BY colapsa · la window no",
      "Las mismas seis ventas, dos maneras de sumarlas.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     1b · EL GOTCHA DEL FRAME — ROWS vs RANGE con fechas empatadas
     ====================================================================== */
  G.widgets["frame"] = function (mount) {
    var salida = el("div");
    var narra = C.narracion();
    var slider;

    function pintar(modo) {
      var acum = acumulado(VENTAS, modo);
      montar(salida, C.tabla({
        titulo: modo === "rows"
          ? "ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW — fila por fila"
          : "RANGE (el default implícito) — los empates suman de golpe",
        cols: ["region", "fecha", { t: "monto", num: true }, { t: "acumulado", num: true }],
        filas: VENTAS.map(function (v, i) {
          var empatada = VENTAS.filter(function (o) { return o.region === v.region && o.fecha === v.fecha; }).length > 1;
          return {
            celdas: [v.region, v.fecha, v.monto, { v: acum[i], tono: empatada && modo === "range" ? "alerta" : "elegida" }],
            clase: empatada ? "fila-elegida" : null
          };
        })
      }));
      narra.decir(modo === "rows"
        ? "<b>ROWS:</b> 120 → 200 → 260. El acumulado avanza un renglón a la vez, como esperas."
        : "<b>RANGE:</b> 200 → 200 → 260. Las dos ventas del 2026-03-01 son <em>el mismo peer group</em>: ambas ven el total del día. Se ve casi bien, y pasa a prod mal.");
    }

    var p = C.prediccion({
      pregunta: "Norte tiene dos ventas el 2026-03-01 (120 y 80). Con ORDER BY fecha y SIN frame explícito, ¿qué acumulado muestra la primera de ellas?",
      opciones: [{ txt: "120" }, { txt: "200", ok: true }, { txt: "260" }],
      respuesta: "200. Sin frame, el default es RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, y RANGE suma TODOS los empates del ORDER BY de un jalón.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "RANGE (default)", valor: "range" },
            { txt: "ROWS (explícito)", valor: "rows" }
          ], pintar, "range")),
          salida,
          narra,
          C.sql("-- El fix es escribir el frame, siempre:\nSUM(monto) OVER (PARTITION BY region ORDER BY fecha\n                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)")
        ]);
        pintar("range");
      }
    });
    montar(mount, C.widget("ROWS vs RANGE sobre fechas empatadas",
      "El frame default no es el que crees.", [p.prediccion, p.revelado]));
    return slider;
  };

  /* =========================================================================
     2 · LATERAL — top-2 por categoría
     ====================================================================== */
  var CATEGORIAS = [
    { nombre: "Bebidas", productos: [{ n: "Café de olla", p: 189 }, { n: "Té negro", p: 145 }, { n: "Agua mineral", p: 32 }, { n: "Jugo de caña", p: 28 }] },
    { nombre: "Lácteos", productos: [{ n: "Queso añejo", p: 240 }, { n: "Crema espesa", p: 96 }, { n: "Leche entera", p: 34 }] },
    { nombre: "Especias", productos: [{ n: "Azafrán", p: 620 }] },
    { nombre: "Vinos", productos: [] }
  ];

  G.widgets["lateral"] = function (mount) {
    var salida = el("div");
    var narra = C.narracion();

    function pintar(tipo) {
      var filas = [];
      CATEGORIAS.forEach(function (c) {
        var top = c.productos.slice().sort(function (a, b) { return b.p - a.p; }).slice(0, 2);
        if (top.length === 0) {
          if (tipo === "left") {
            filas.push({ celdas: [c.nombre, { v: "NULL", tono: "alerta" }, { v: "NULL", tono: "alerta" }], clase: null });
          }
          return;
        }
        top.forEach(function (pr) {
          filas.push({ celdas: [c.nombre, pr.n, { v: pr.p, tono: "elegida" }], clase: null });
        });
      });
      montar(salida, C.tabla({
        titulo: (tipo === "left" ? "LEFT JOIN LATERAL" : "JOIN LATERAL … ON true") + " — " + filas.length + " filas",
        cols: ["categoria", "producto", { t: "precio", num: true }],
        filas: filas
      }));
      narra.decir(tipo === "left"
        ? "<b>LEFT JOIN LATERAL:</b> 6 filas. Vinos sobrevive con NULLs — la categoría vacía sigue en el reporte."
        : "<b>JOIN LATERAL:</b> 5 filas. Vinos desapareció: su subquery devolvió 0 filas y el inner join la descartó, calladamente.");
    }

    var p = C.prediccion({
      pregunta: "Cuatro categorías: Bebidas (4 productos), Lácteos (3), Especias (1), Vinos (0). ¿Cuántas filas devuelve JOIN LATERAL con LIMIT 2 por categoría?",
      opciones: [{ txt: "8" }, { txt: "6" }, { txt: "5", ok: true }, { txt: "4" }],
      respuesta: "5: la subquery corre una vez por categoría y devuelve 2, 2, 1 y 0. Vinos no aparece — el inner join tira las categorías sin filas.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "JOIN LATERAL", valor: "inner" },
            { txt: "LEFT JOIN LATERAL", valor: "left" }
          ], pintar, "inner")),
          salida,
          narra
        ]);
        pintar("inner");
      }
    });
    montar(mount, C.widget("Top-2 por categoría, en una query",
      "La subquery de la derecha corre una vez por fila de la izquierda.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     3 · DISTINCT ON — una fila por grupo (reveal ligero)
     ====================================================================== */
  var EVENTOS = [
    { id: 91, user: 7, creado: "2026-07-01 09:12" },
    { id: 92, user: 7, creado: "2026-07-03 18:40" },
    { id: 93, user: 7, creado: "2026-07-02 11:05" },
    { id: 94, user: 12, creado: "2026-06-28 07:55" },
    { id: 95, user: 12, creado: "2026-07-04 22:10" }
  ];

  G.widgets["distinct-on"] = function (mount) {
    var p = C.prediccion({
      pregunta: "Cinco eventos de dos usuarios. ¿Cuántas filas devuelve SELECT DISTINCT ON (user_id) * … ORDER BY user_id, creado DESC?",
      opciones: [{ txt: "5" }, { txt: "2", ok: true }, { txt: "3" }],
      respuesta: "Dos: una por user_id, y es la primera fila que el ORDER BY entrega dentro del grupo — o sea, la más reciente.",
      alRevelar: function (revelado) {
        var elegidos = [92, 95];
        G.agregar(revelado, [
          C.tabla({
            titulo: "eventos ordenados por (user_id, creado DESC) — en ámbar, la que se queda",
            cols: [{ t: "id", num: true }, { t: "user_id", num: true }, "creado"],
            filas: EVENTOS.slice().sort(function (a, b) {
              return a.user - b.user || (a.creado < b.creado ? 1 : -1);
            }).map(function (e) {
              return { celdas: [e.id, e.user, e.creado], clase: elegidos.indexOf(e.id) !== -1 ? "fila-elegida" : null };
            })
          }),
          C.narracion("<b>Sin subquery de MAX, sin re-join:</b> el ORDER BY decide cuál es «la buena» y DISTINCT ON se queda con la primera de cada grupo.")
        ]);
      }
    });
    montar(mount, C.widget("Una fila por usuario", "La más reciente, sin MAX + re-join.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     4 · KEYSET vs OFFSET
     ====================================================================== */
  G.widgets["keyset"] = function (mount) {
    var barraOffset = el("span", { style: "width:0%" });
    var barraKeyset = el("span", { style: "width:0%" });
    var cifraOffset = el("p", { class: "cifra" });
    var cifraKeyset = el("p", { class: "cifra", text: "20" });
    var narra = C.narracion();
    var TOPE = 100020;

    function pintar(pagina) {
      var tocadas = (pagina - 1) * 20 + 20;
      cifraOffset.textContent = tocadas.toLocaleString("es-MX");
      barraOffset.style.width = Math.min(100, (tocadas / TOPE) * 100) + "%";
      barraKeyset.style.width = Math.max(0.6, (20 / TOPE) * 100) + "%";
      narra.decir(pagina === 1
        ? "<b>Página 1:</b> empatados. Por eso OFFSET se siente bien en desarrollo."
        : "<b>Página " + pagina.toLocaleString("es-MX") + ":</b> OFFSET genera y tira "
          + ((pagina - 1) * 20).toLocaleString("es-MX") + " filas antes de devolver 20. El keyset sigue tocando 20.");
    }

    var p = C.prediccion({
      pregunta: "Pides la página 5001 (OFFSET 100000 LIMIT 20). ¿Cuántas filas toca el motor con OFFSET y cuántas con keyset?",
      opciones: [{ txt: "20 y 20" }, { txt: "100 020 y 20", ok: true }, { txt: "100 000 y 100 000" }, { txt: "20 y 100 000" }],
      respuesta: "OFFSET toca 100 020 y tira 100 000; el keyset entra por el índice sobre (created_at, id) y toca 20. O(página) vs O(offset).",
      alRevelar: function (revelado) {
        var s = C.slider({
          id: "keyset-pagina", etiqueta: "Página", min: 1, max: 5001, step: 100, valor: 1,
          formato: function (v) { return v.toLocaleString("es-MX") + " · OFFSET " + ((v - 1) * 20).toLocaleString("es-MX"); }
        }, pintar);
        G.agregar(revelado, [
          s.campo,
          el("div", { class: "duo" }, [
            C.panel({ cab: "LIMIT 20 OFFSET n · filas tocadas", tono: "pierde", nota: "generadas y tiradas antes de devolver nada", extra: [el("div", { class: "barra alterna" }, barraOffset)] }),
            C.panel({ cab: "keyset · filas tocadas", tono: "gana", nota: "arranca donde quedaste, por el índice", extra: [el("div", { class: "barra elegida" }, barraKeyset)] })
          ]),
          narra,
          C.sql("WHERE (created_at, id) < ('2026-05-02 10:00', 84120)\nORDER BY created_at DESC, id DESC\nLIMIT 20;  -- => 20 filas leídas, cualquiera sea la página")
        ]);
        // Las cifras viven dentro de los paneles, arriba de cada barra.
        revelado.querySelectorAll(".panel")[0].insertBefore(cifraOffset, revelado.querySelectorAll(".panel")[0].children[1]);
        revelado.querySelectorAll(".panel")[1].insertBefore(cifraKeyset, revelado.querySelectorAll(".panel")[1].children[1]);
        pintar(1);
      }
    });
    montar(mount, C.widget("El scan inflándose", "Mueve la página y mira quién paga el viaje.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     5 · NOT IN vs NOT EXISTS con NULL
     ====================================================================== */
  G.widgets["not-in-null"] = function (mount) {
    var salida = el("div");
    var narra = C.narracion();
    var IDS = [1, 2, 3, 4, 5];

    function pintar(modo) {
      var vivas = modo === "notin" ? [] : [3, 4, 5];
      montar(salida, C.tabla({
        titulo: (modo === "notin" ? "WHERE id NOT IN (1, 2, NULL)" : "WHERE NOT EXISTS (…)") + " — " + vivas.length + " filas",
        cols: [{ t: "id", num: true }, "evaluación", "¿sale?"],
        filas: IDS.map(function (id) {
          var dentro = id === 1 || id === 2;
          var eval_ = modo === "notin"
            ? (dentro ? "false" : "NULL (por el NULL de la lista)")
            : (dentro ? "existe match" : "no existe match");
          var sale = vivas.indexOf(id) !== -1;
          return {
            celdas: [id, eval_, { v: sale ? "sí" : "no", tono: sale ? "ok" : "alerta" }],
            clase: sale ? "fila-elegida" : "fila-muerta"
          };
        })
      }));
      narra.decir(modo === "notin"
        ? "<b>Cero filas, sin error, sin warning.</b> <code>3 NOT IN (1, 2, NULL)</code> no es true: es NULL, y el WHERE solo pasa lo que es true. Lógica de tres valores."
        : "<b>NOT EXISTS:</b> 3 filas, las correctas. Pregunta «¿existe al menos uno?» y el NULL no lo envenena.");
    }

    var p = C.prediccion({
      pregunta: "La tabla tiene ids 1…5. ¿Cuántas filas devuelve WHERE id NOT IN (1, 2, NULL)?",
      opciones: [{ txt: "3" }, { txt: "5" }, { txt: "2" }, { txt: "0", ok: true }],
      respuesta: "Cero. Siempre. Un solo NULL en la lista y el predicado nunca puede ser true.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "NOT IN", valor: "notin" },
            { txt: "NOT EXISTS", valor: "notexists" }
          ], pintar, "notin")),
          salida,
          narra
        ]);
        pintar("notin");
      }
    });
    montar(mount, C.widget("La trampa de NULL", "El bug que no truena: solo devuelve nada.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     6 · CTE RECURSIVA — el árbol creciendo (y el ciclo que no termina)
     ====================================================================== */
  var ARBOL = [
    { id: 1, nombre: "Catálogo", padre: null },
    { id: 2, nombre: "Bebidas", padre: 1 },
    { id: 3, nombre: "Lácteos", padre: 1 },
    { id: 4, nombre: "Cafés", padre: 2 },
    { id: 5, nombre: "Tés", padre: 2 },
    { id: 6, nombre: "Quesos", padre: 3 },
    { id: 7, nombre: "Espresso", padre: 4 }
  ];

  G.widgets["recursiva"] = function (mount) {
    var lista = el("div", { class: "arbol" });
    var narra = C.narracion();
    var boton, botonReinicia, modo = "arbol", iteracion = 0;

    function nivelesArbol() {
      var niveles = [], actual = ARBOL.filter(function (n) { return n.padre === null; });
      while (actual.length) {
        niveles.push(actual);
        var ids = actual.map(function (n) { return n.id; });
        actual = ARBOL.filter(function (n) { return ids.indexOf(n.padre) !== -1; });
      }
      return niveles;
    }

    function paso() {
      if (modo === "arbol") {
        var niveles = nivelesArbol();
        if (iteracion >= niveles.length) {
          boton.disabled = true;
          narra.decir("<b>Working table vacía → termina.</b> 4 iteraciones, 7 filas: el árbol completo en una sola query.");
          return;
        }
        var nivel = niveles[iteracion];
        nivel.forEach(function (n) {
          lista.appendChild(el("div", { class: "nodo nivel-nuevo" }, [
            el("span", { class: "lvl", text: "nivel " + (iteracion + 1) }),
            n.nombre
          ]));
        });
        iteracion++;
        var total = lista.children.length;
        narra.decir("<b>Iteración " + iteracion + ":</b> la working table trae " + nivel.length
          + (nivel.length === 1 ? " fila" : " filas") + "; acumulado " + total + ". "
          + (iteracion < niveles.length ? "Sigue habiendo hijos." : "Ya no hay hijos: la siguiente iteración vendrá vacía."));
      } else {
        // Grafo con ciclo: A → B → C → A, sin rastrear visitados.
        var ciclo = ["A", "B", "C"];
        var nombre = ciclo[iteracion % 3];
        iteracion++;
        lista.appendChild(el("div", { class: "nodo" + (iteracion > 3 ? " ciclo" : "") }, [
          el("span", { class: "lvl", text: "iter " + iteracion }),
          nombre + (iteracion > 3 ? "  ← ya la habías visitado" : "")
        ]));
        narra.decir(iteracion > 3
          ? "<b>No termina.</b> La working table nunca se vacía: A → B → C → A → B… Rastrea los visitados, o usa <code>CYCLE ruta SET es_ciclo USING camino</code> (PG14+)."
          : "<b>Iteración " + iteracion + ":</b> avanza por el grafo. Todavía se ve inocente.");
        if (iteracion >= 7) { boton.disabled = true; }
      }
    }

    function reiniciar(nuevoModo) {
      modo = nuevoModo;
      iteracion = 0;
      G.vaciar(lista);
      boton.disabled = false;
      narra.decir(modo === "arbol"
        ? "Arranca con el ancla: la raíz."
        : "Mismo <code>WITH RECURSIVE</code>, pero el grafo tiene vuelta (A → B → C → A) y no rastreas visitados.");
    }

    var p = C.prediccion({
      pregunta: "Árbol de 7 categorías (raíz → 2 hijos → 3 nietos → 1 bisnieto). ¿Cuántas filas junta la recursiva antes de que la working table se vacíe?",
      opciones: [{ txt: "3" }, { txt: "4" }, { txt: "7", ok: true }, { txt: "6" }],
      respuesta: "7 filas en 4 iteraciones: la recursión para cuando una iteración no devuelve filas nuevas, no cuando «se acaban los niveles» que tú contaste.",
      alRevelar: function (revelado) {
        boton = el("button", { class: "boton", type: "button", text: "siguiente iteración →", on: { click: paso } });
        G.agregar(revelado, [
          el("div", { class: "controles" }, [
            C.segmentado([
              { txt: "árbol de categorías", valor: "arbol" },
              { txt: "grafo con ciclo, sin visitados", valor: "ciclo" }
            ], reiniciar, "arbol"),
            boton
          ]),
          lista,
          narra
        ]);
        reiniciar("arbol");
      }
    });
    montar(mount, C.widget("La working table, iteración por iteración",
      "Y qué pasa cuando el grafo tiene vuelta.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     7 · GROUP BY ROLLUP
     ====================================================================== */
  var BASE_ROLLUP = [
    { region: "Norte", mes: "2026-01", monto: 100 },
    { region: "Norte", mes: "2026-02", monto: 150 },
    { region: "Sur", mes: "2026-01", monto: 200 },
    { region: "Sur", mes: "2026-02", monto: 50 }
  ];

  G.widgets["rollup"] = function (mount) {
    var salida = el("div");
    var narra = C.narracion();
    var etapa = 0, boton;

    function filas() {
      var f = BASE_ROLLUP.map(function (r) {
        return { celdas: [r.region, r.mes, r.monto, "0, 0"], clase: null };
      });
      if (etapa >= 1) {
        f.push({ celdas: ["Norte", { v: "NULL", tono: "alterna" }, 250, "0, 1"], clase: "fila-subtotal" });
        f.push({ celdas: ["Sur", { v: "NULL", tono: "alterna" }, 250, "0, 1"], clase: "fila-subtotal" });
      }
      if (etapa >= 2) {
        f.push({ celdas: [{ v: "NULL", tono: "elegida" }, { v: "NULL", tono: "elegida" }, 500, "1, 1"], clase: "fila-elegida" });
      }
      return f;
    }

    function pintar() {
      montar(salida, C.tabla({
        titulo: "GROUP BY ROLLUP (region, mes) — " + filas().length + " filas",
        cols: ["region", "mes", { t: "sum(monto)", num: true }, "GROUPING(region, mes)"],
        filas: filas()
      }));
    }

    function paso() {
      etapa++;
      pintar();
      if (etapa === 1) narra.decir("<b>+2:</b> un subtotal por región. Su <code>mes</code> es NULL porque esa dimensión ya no aplica — y <code>GROUPING(mes) = 1</code> te lo dice.");
      if (etapa === 2) { narra.decir("<b>+1:</b> el gran total. <code>GROUPING(region, mes) = 1, 1</code>. Tres renglones extra, una sola pasada, cero UNION."); boton.disabled = true; }
    }

    var p = C.prediccion({
      pregunta: "Cuatro filas (2 regiones × 2 meses). ¿Cuántos renglones EXTRA agrega ROLLUP (region, mes)?",
      opciones: [{ txt: "2" }, { txt: "3", ok: true }, { txt: "4" }, { txt: "6" }],
      respuesta: "3: un subtotal por región (2) más el gran total (1). ROLLUP recorre los prefijos de la lista, no todas las combinaciones — eso es CUBE.",
      alRevelar: function (revelado) {
        boton = el("button", { class: "boton", type: "button", text: "agregar el siguiente nivel →", on: { click: paso } });
        G.agregar(revelado, [el("div", { class: "controles" }, boton), salida, narra]);
        pintar();
        narra.decir("Base: 4 filas, <code>GROUPING</code> en 0, 0. Todavía no hay subtotales.");
      }
    });
    montar(mount, C.widget("Los subtotales materializándose",
      "Y por qué GROUPING() no es opcional.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     8 · PIVOT con FILTER
     ====================================================================== */
  var MOVS = [
    { fecha: "2026-03-01", cat: "Bebidas", monto: 120 },
    { fecha: "2026-03-01", cat: "Lácteos", monto: 80 },
    { fecha: "2026-03-02", cat: "Bebidas", monto: 60 },
    { fecha: "2026-03-02", cat: "Especias", monto: 40 }
  ];

  G.widgets["pivot"] = function (mount) {
    var salida = el("div");
    var narra = C.narracion();

    function pintar(modo) {
      if (modo === "largo") {
        montar(salida, C.tabla({
          titulo: "formato largo — 4 filas × 3 columnas",
          cols: ["fecha", "categoria", { t: "monto", num: true }],
          filas: MOVS.map(function (m) { return [m.fecha, m.cat, m.monto]; })
        }));
        narra.decir("<b>Como viven los datos:</b> una fila por (fecha, categoría). Legible para el motor, incómodo para el reporte.");
      } else {
        var cats = ["Bebidas", "Lácteos", "Especias"];
        var fechas = ["2026-03-01", "2026-03-02"];
        montar(salida, C.tabla({
          titulo: "pivote con FILTER — 2 filas × 4 columnas",
          cols: ["fecha"].concat(cats.map(function (c) { return { t: c, num: true }; })),
          filas: fechas.map(function (f) {
            return { celdas: [f].concat(cats.map(function (c) {
              var m = MOVS.find(function (x) { return x.fecha === f && x.cat === c; });
              return m ? { v: m.monto, tono: "elegida" } : { v: "0", tono: null };
            })) };
          })
        }));
        narra.decir("<b>El giro:</b> una fila por fecha, una columna por categoría. <code>SUM(monto) FILTER (WHERE categoria = 'Bebidas')</code>, tres veces.");
      }
    }

    var p = C.prediccion({
      pregunta: "4 movimientos, 2 fechas, 3 categorías. ¿Qué forma tiene la salida pivoteada por categoría?",
      opciones: [{ txt: "4 × 3" }, { txt: "2 × 4", ok: true }, { txt: "3 × 2" }, { txt: "2 × 3" }],
      respuesta: "2 filas (una por fecha) × 4 columnas (fecha + una por categoría). El GROUP BY define los renglones; el FILTER define las columnas.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "filas (largo)", valor: "largo" },
            { txt: "pivote (FILTER)", valor: "pivote" }
          ], pintar, "largo")),
          salida,
          narra
        ]);
        pintar("largo");
      }
    });
    montar(mount, C.widget("Filas → columnas", "El pivote es un GROUP BY con FILTER.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     9 · UPSERT bajo concurrencia
     ====================================================================== */
  G.widgets["upsert"] = function (mount) {
    var linea = el("div", { class: "arbol" });
    var narra = C.narracion();
    var etapa = 0, boton;

    var PASOS = [
      { txt: "T1: INSERT INTO paginas (ruta, visitas) VALUES ('/precios', 1) — gana la carrera, inserta", tono: "" },
      { txt: "T2: INSERT … VALUES ('/precios', 1) — choca con el índice único", tono: "ciclo" },
      { txt: "T2: ON CONFLICT (ruta) DO UPDATE SET visitas = paginas.visitas + 1", tono: "nivel-nuevo" },
      { txt: "COMMIT · una fila: ('/precios', 2)", tono: "nivel-nuevo" }
    ];

    function paso() {
      var p = PASOS[etapa];
      linea.appendChild(el("div", { class: "nodo " + p.tono }, [
        el("span", { class: "lvl", text: "t" + (etapa + 1) }), p.txt
      ]));
      etapa++;
      narra.decir(etapa < PASOS.length
        ? "El motor serializa las dos sesiones en la misma llave; nadie hizo un SELECT primero."
        : "<b>Una fila, visitas = 2.</b> Sin duplicado, sin <code>unique_violation</code>, sin <code>if</code> en la app. Atómico.");
      if (etapa >= PASOS.length) boton.disabled = true;
    }

    var p = C.prediccion({
      pregunta: "Dos sesiones insertan la MISMA llave casi al mismo tiempo, con ON CONFLICT (ruta) DO UPDATE SET visitas = paginas.visitas + 1. ¿Estado final?",
      opciones: [{ txt: "dos filas" }, { txt: "una fila + unique_violation" }, { txt: "una fila, visitas = 2", ok: true }, { txt: "una fila, visitas = 1" }],
      respuesta: "Una fila con visitas = 2. La segunda sesión espera a que la primera termine y entonces hace el UPDATE — el motor resuelve la carrera que tu SELECT+if no puede.",
      alRevelar: function (revelado) {
        boton = el("button", { class: "boton", type: "button", text: "avanzar el reloj →", on: { click: paso } });
        G.agregar(revelado, [el("div", { class: "controles" }, boton), linea, narra]);
        narra.decir("Dos sesiones, misma llave, un índice único sobre <code>ruta</code>.");
      }
    });
    montar(mount, C.widget("Dos sesiones, la misma llave", "Sin SELECT previo, sin rezar.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     10 · DATA-MODIFYING CTE — el snapshot
     ====================================================================== */
  G.widgets["dmcte"] = function (mount) {
    var p = C.prediccion({
      pregunta: "pedidos tiene 10 filas. En UNA sentencia: una CTE borra 3 con RETURNING, el INSERT las archiva, y en el mismo statement un count(*) mira pedidos. ¿Qué cuenta?",
      opciones: [{ txt: "7" }, { txt: "10", ok: true }, { txt: "3" }],
      respuesta: "10. Todas las sub-sentencias ven el MISMO snapshot del inicio de la sentencia: el count no ve el DELETE, aunque el archive sí reciba las 3 filas por el RETURNING.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          C.tabla({
            titulo: "lo que ve cada parte de la MISMA sentencia",
            cols: ["parte", "qué ve", "resultado"],
            filas: [
              { celdas: ["CTE borrado (DELETE … RETURNING)", "snapshot inicial: 10 filas", { v: "3 filas devueltas", tono: "elegida" }] },
              { celdas: ["INSERT INTO archivo SELECT … FROM borrado", "el RETURNING de la CTE", { v: "3 filas insertadas", tono: "elegida" }] },
              { celdas: ["count(*) FROM pedidos (en el mismo statement)", "snapshot inicial: 10 filas", { v: "10", tono: "alerta" }] },
              { celdas: ["cualquier query DESPUÉS del COMMIT", "el estado nuevo", { v: "7", tono: "ok" }] }
            ]
          }),
          C.narracion("<b>Atómico sí, secuencial no.</b> El movimiento entre tablas es correcto; lo que no puedes es encadenar escrituras que dependan de verse entre sí. Para eso, sentencias separadas en una transacción."),
          C.sql("WITH borrado AS (\n  DELETE FROM pedidos WHERE creado < '2025-01-01' RETURNING *\n)\nINSERT INTO pedidos_archivo SELECT * FROM borrado;\n-- => INSERT 0 3   (una sentencia, atómica)")
        ]);
      }
    });
    montar(mount, C.widget("¿El INSERT ve lo que el DELETE ya movió?",
      "Un snapshot para toda la sentencia.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     11 · SKIP LOCKED — la cola en la base
     ====================================================================== */
  G.widgets["skip-locked"] = function (mount) {
    var panelWorkers = el("div", { class: "workers" });
    var tablaCola = el("div");
    var narra = C.narracion();

    function pintar(modo) {
      var jobs = [101, 102, 103, 104, 105];
      var asignados = modo === "skip" ? { 1: 101, 2: 102, 3: 103 } : { 1: 101 };
      G.vaciar(panelWorkers);
      [1, 2, 3].forEach(function (w) {
        var job = asignados[w];
        panelWorkers.appendChild(el("div", { class: "worker " + (job ? "tomo" : "espera") }, [
          el("span", { text: "worker " + w }),
          el("span", { class: "estado", text: job ? "tomó job " + job : "esperando el lock de 101" })
        ]));
      });
      var tomados = Object.keys(asignados).map(function (k) { return asignados[k]; });
      montar(tablaCola, C.tabla({
        titulo: "tabla-cola jobs (FOR UPDATE " + (modo === "skip" ? "SKIP LOCKED" : "sin SKIP LOCKED") + " LIMIT 1)",
        cols: [{ t: "id", num: true }, "estado"],
        filas: jobs.map(function (id) {
          var t = tomados.indexOf(id) !== -1;
          return {
            celdas: [id, { v: t ? "locked por un worker" : "libre", tono: t ? "elegida" : "ok" }],
            clase: t ? "fila-elegida" : null
          };
        })
      }));
      narra.decir(modo === "skip"
        ? "<b>Tres workers, tres jobs distintos, cero espera.</b> El que ya está lockeado se salta, no se forma."
        : "<b>Sin SKIP LOCKED se forman en fila:</b> los tres apuntan a la misma primera fila y dos se quedan esperando el lock. Tu cola tiene throughput de un worker.");
    }

    var p = C.prediccion({
      pregunta: "Tres workers corren SELECT … FOR UPDATE SKIP LOCKED LIMIT 1 sobre una cola de 5 jobs, al mismo tiempo. ¿Dos agarran el mismo?",
      opciones: [{ txt: "sí, hay que desduplicar en la app" }, { txt: "no: cada uno una fila distinta", ok: true }, { txt: "dos esperan al primero" }],
      respuesta: "Cada uno se lleva una fila distinta y ninguno espera: SKIP LOCKED salta las filas ya lockeadas en vez de bloquearse en ellas.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "con SKIP LOCKED", valor: "skip" },
            { txt: "sin SKIP LOCKED", valor: "sin" }
          ], pintar, "skip")),
          panelWorkers,
          tablaCola,
          narra
        ]);
        pintar("skip");
      }
    });
    montar(mount, C.widget("Tres workers, una tabla-cola", "Nadie agarra el mismo job.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     12 · EXPLAIN → ÍNDICE (cierra el arco con el C2)
     ====================================================================== */
  G.widgets["explain"] = function (mount) {
    var plan = el("div", { class: "plan" });
    var narra = C.narracion();

    function pintar(cual) {
      G.vaciar(plan);
      var lineas;
      if (cual === "ninguno") {
        lineas = [
          { c: "seq", t: "Seq Scan on pedidos  (rows=2 000 000)" },
          { c: "cost", t: "  Filter: (status = 'pendiente' AND creado > '2026-07-01')" },
          { c: "cost", t: "  Rows Removed by Filter: 1 999 640" },
          { c: "cost", t: "  Execution Time: 812 ms" }
        ];
        narra.decir("<b>Seq Scan:</b> lee 2 millones de filas para devolver 360. El <code>EXPLAIN</code> ya te dijo el problema: <em>Rows Removed by Filter</em>.");
      } else if (cual === "status") {
        lineas = [
          { c: "idx", t: "Bitmap Heap Scan on pedidos  (rows=360)" },
          { c: "cost", t: "  Recheck Cond: (status = 'pendiente')" },
          { c: "idx", t: "  ->  Bitmap Index Scan on idx_status  (rows=140 000)" },
          { c: "cost", t: "  Filter: (creado > '2026-07-01')  ·  Execution Time: 96 ms" }
        ];
        narra.decir("<b>Mejor, no bueno:</b> el índice de baja cardinalidad trae 140 000 candidatos y el filtro de fecha tira casi todos.");
      } else {
        lineas = [
          { c: "idx", t: "Index Scan using idx_status_creado on pedidos  (rows=360)" },
          { c: "cost", t: "  Index Cond: (status = 'pendiente' AND creado > '2026-07-01')" },
          { c: "cost", t: "  Execution Time: 1.4 ms" }
        ];
        narra.decir("<b>Index Scan:</b> 812 ms → 1.4 ms. Las dos condiciones caben en el índice compuesto, en ese orden: igualdad primero, rango después.");
      }
      lineas.forEach(function (l) { plan.appendChild(el("div", { class: l.c, text: l.t })); });
    }

    var p = C.prediccion({
      pregunta: "WHERE status = 'pendiente' AND creado > '2026-07-01' sobre 2 M de filas (140 K pendientes). ¿Qué índice ayuda de verdad?",
      opciones: [{ txt: "(status)" }, { txt: "(creado)" }, { txt: "(status, creado)", ok: true }, { txt: "los tres" }],
      respuesta: "El compuesto (status, creado): igualdad primero, rango después. Los otros dos dejan el trabajo a medias y cada índice extra cuesta escritura y espacio.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "sin índice", valor: "ninguno" },
            { txt: "(status)", valor: "status" },
            { txt: "(status, creado)", valor: "compuesto" }
          ], pintar, "ninguno")),
          plan,
          narra,
          el("p", { class: "crosslink", text: "mira el motor por dentro → «SQL a fondo» (C2 · índices 02, planner 03)" })
        ]);
        pintar("ninguno");
      }
    });
    montar(mount, C.widget("Del Seq Scan al Index Scan",
      "El índice correcto sale de leer el EXPLAIN, no de rociar índices.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     13 · CTE: inline vs materializada (PG12+)
     ====================================================================== */
  G.widgets["cte-inline"] = function (mount) {
    var plan = el("div", { class: "plan" });
    var narra = C.narracion();

    function pintar(caso) {
      G.vaciar(plan);
      var lineas;
      if (caso === "una") {
        lineas = [
          { c: "idx", t: "Index Scan using idx_ventas_region on ventas  (rows=3)" },
          { c: "cost", t: "  Index Cond: (region = 'Norte')" },
          { c: "cost", t: "  -- sin nodo CTE Scan: la CTE se fundió con el query externo" }
        ];
        narra.decir("<b>Inline.</b> Referenciada una vez, el planner la funde y empuja el <code>WHERE region = 'Norte'</code> hasta el índice.");
      } else if (caso === "dos") {
        lineas = [
          { c: "seq", t: "CTE v" },
          { c: "seq", t: "  ->  Seq Scan on ventas  (rows=6)" },
          { c: "cost", t: "Hash Join" },
          { c: "cost", t: "  ->  CTE Scan on v  (rows=6)   ·   ->  CTE Scan on v  (rows=6)" }
        ];
        narra.decir("<b>Materializada.</b> Referenciada dos veces: se calcula UNA vez y se lee dos. El filtro externo ya no entra — corre después.");
      } else {
        lineas = [
          { c: "idx", t: "Hash Join" },
          { c: "idx", t: "  ->  Index Scan using idx_ventas_region on ventas  (rows=3)" },
          { c: "idx", t: "  ->  Index Scan using idx_ventas_region on ventas  (rows=3)" },
          { c: "cost", t: "  -- NOT MATERIALIZED: dos inlines, cada uno con su Index Cond" }
        ];
        narra.decir("<b>NOT MATERIALIZED.</b> Fuerzas el inline aunque la refieras dos veces: pagas dos scans, pero cada uno filtrado por el índice.");
      }
      lineas.forEach(function (l) { plan.appendChild(el("div", { class: l.c, text: l.t })); });
    }

    var p = C.prediccion({
      pregunta: "En PG17, WITH v AS (SELECT * FROM ventas) SELECT * FROM v WHERE region = 'Norte'. ¿Se materializa la CTE?",
      opciones: [{ txt: "sí, siempre" }, { txt: "no: se inlinea", ok: true }, { txt: "solo con índice" }],
      respuesta: "No. Desde PG12, una CTE no recursiva, sin efectos secundarios y referenciada UNA vez se inlinea — y el filtro del exterior se empuja hacia adentro.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "1 referencia", valor: "una" },
            { txt: "2 referencias", valor: "dos" },
            { txt: "2 + NOT MATERIALIZED", valor: "forzado" }
          ], pintar, "una")),
          plan,
          narra
        ]);
        pintar("una");
      }
    });
    montar(mount, C.widget("Quién decide materializar",
      "La misma CTE, tres planes distintos.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     14 · Percentiles vs promedio
     ====================================================================== */
  var LATENCIAS = [40, 60, 80, 100, 2000];

  G.widgets["percentiles"] = function (mount) {
    var salida = el("div");
    var narra = C.narracion();

    function pintar(cual) {
      var filas = LATENCIAS.map(function (ms) {
        var marca = (cual === "p50" && ms === 80) || (cual === "avg" && ms === 2000) || (cual === "p95" && ms === 2000);
        return { celdas: [{ v: ms + " ms", tono: marca ? "elegida" : null }], clase: marca ? "fila-elegida" : null };
      });
      var resumen = { avg: "456 ms", p50: "80 ms", p95: "1 620 ms" };
      montar(salida, el("div", { class: "duo" }, [
        C.tabla({ titulo: "5 requests (ms), ordenados", cols: ["ms"], filas: filas }),
        C.panel({
          cab: cual === "avg" ? "avg(ms)" : (cual === "p50" ? "percentile_cont(0.5)" : "percentile_cont(0.95)"),
          tono: cual === "avg" ? "pierde" : "gana",
          cifra: resumen[cual],
          nota: cual === "avg" ? "un solo outlier se lo lleva" : (cual === "p50" ? "la fila de en medio, interpolada" : "la cola, que es la que reclama el cliente")
        })
      ]));
      narra.decir(cual === "avg"
        ? "<b>456 ms</b> no le pasó a nadie: es el outlier de 2 000 repartido entre cinco."
        : (cual === "p50"
          ? "<b>80 ms</b> es la experiencia típica. <code>percentile_cont(0.5) WITHIN GROUP (ORDER BY ms)</code> — no hay <code>median()</code>."
          : "<b>1 620 ms</b> es el p95 interpolado: la cola que el promedio esconde y el usuario sí siente."));
    }

    var p = C.prediccion({
      pregunta: "Cinco requests: 40, 60, 80, 100 y 2000 ms. ¿Qué reportan avg y la mediana?",
      opciones: [{ txt: "456 y 456" }, { txt: "456 y 80", ok: true }, { txt: "80 y 80" }, { txt: "2000 y 100" }],
      respuesta: "avg = 456 ms (nadie lo vivió), mediana = 80 ms. Un solo outlier mueve el promedio y no mueve la mediana: por eso los dashboards se reportan en percentiles.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "avg", valor: "avg" },
            { txt: "mediana (p50)", valor: "p50" },
            { txt: "p95", valor: "p95" }
          ], pintar, "avg")),
          salida,
          narra,
          C.sql("SELECT avg(ms),\n       percentile_cont(0.5)  WITHIN GROUP (ORDER BY ms) AS p50,\n       percentile_cont(0.95) WITHIN GROUP (ORDER BY ms) AS p95\nFROM requests;\n-- => 456 | 80 | 1620")
        ]);
        pintar("avg");
      }
    });
    montar(mount, C.widget("El promedio miente, el percentil no",
      "Cinco requests y un outlier.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     15 · FDW: qué se empuja al remoto y qué cruza la red
     ====================================================================== */
  G.widgets["fdw-pushdown"] = function (mount) {
    var plan = el("div", { class: "plan" });
    var barra = el("span", { style: "width:0%" });
    var cifra = el("p", { class: "cifra" });
    var narra = C.narracion();

    function pintar(caso) {
      G.vaciar(plan);
      var lineas, viajan, tono;
      if (caso === "filtro") {
        lineas = [
          { c: "idx", t: "Foreign Scan on fact.facturas  (rows=420)" },
          { c: "cost", t: "  Remote SQL: SELECT id, total FROM public.facturas WHERE emitida_en >= '2026-07-01'" }
        ];
        viajan = 420; tono = "elegida";
        narra.decir("<b>El filtro se empuja.</b> El <code>WHERE</code> viaja en el Remote SQL: solo cruzan la red las 420 filas que pediste.");
      } else if (caso === "agregado") {
        lineas = [
          { c: "idx", t: "Foreign Scan  (rows=1)" },
          { c: "cost", t: "  Remote SQL: SELECT sum(total) FROM public.facturas WHERE emitida_en >= '2026-07-01'" }
        ];
        viajan = 1; tono = "elegida";
        narra.decir("<b>El agregado también.</b> La suma se calcula allá: cruza UNA fila. Este es el caso donde FDW se ve mágico.");
      } else {
        lineas = [
          { c: "seq", t: "Hash Join  (rows=1 200)" },
          { c: "cost", t: "  ->  Seq Scan on clientes  (rows=90)  [local]" },
          { c: "seq", t: "  ->  Foreign Scan on fact.facturas  (rows=1 200 000)" },
          { c: "cost", t: "      Remote SQL: SELECT cliente_id, total FROM public.facturas   -- sin WHERE" }
        ];
        viajan = 1200000; tono = "alterna";
        narra.decir("<b>Aquí muere.</b> El join local↔foráneo no se empuja: 1.2 M de filas cruzan la red para juntarse contra 90 locales. Para esto, réplica o ETL.");
      }
      lineas.forEach(function (l) { plan.appendChild(el("div", { class: l.c, text: l.t })); });
      cifra.textContent = viajan.toLocaleString("es-MX") + " filas por la red";
      cifra.style.color = tono === "elegida" ? "var(--dato-elegida)" : "var(--dato-alterna)";
      barra.parentNode.className = "barra " + tono;
      barra.style.width = Math.max(0.6, (viajan / 1200000) * 100) + "%";
    }

    var p = C.prediccion({
      pregunta: "Tabla foránea de 1.2 M facturas. ¿Qué caso NO empuja el trabajo al servidor remoto?",
      opciones: [{ txt: "un WHERE por fecha" }, { txt: "un SUM(total)" }, { txt: "un join contra una tabla local", ok: true }],
      respuesta: "El join local↔foráneo. Filtros y agregados viajan en el Remote SQL; para juntar con una tabla local, las filas tienen que venir hasta acá.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "WHERE remoto", valor: "filtro" },
            { txt: "SUM remoto", valor: "agregado" },
            { txt: "join local↔foráneo", valor: "join" }
          ], pintar, "filtro")),
          plan,
          C.panel({ cab: "tráfico", extra: [cifra, el("div", { class: "barra elegida" }, barra)] }),
          narra
        ]);
        pintar("filtro");
      }
    });
    montar(mount, C.widget("Qué se empuja y qué cruza la red",
      "Lee el Remote SQL del EXPLAIN antes de confiarte.", [p.prediccion, p.revelado]));
  };

  /* =========================================================================
     16 · JSONB: filtrar dentro vs traerse el blob
     ====================================================================== */
  var EVENTOS_JSON = [
    { id: 84121, tipo: "pago", monto: 990 },
    { id: 84122, tipo: "vista", monto: null },
    { id: 84123, tipo: "vista", monto: null },
    { id: 84130, tipo: "pago", monto: 1200 },
    { id: 84131, tipo: "baja", monto: null }
  ];

  G.widgets["jsonb-dentro"] = function (mount) {
    var salida = el("div");
    var narra = C.narracion();

    function pintar(modo) {
      var enApp = modo === "app";
      montar(salida, C.tabla({
        titulo: enApp
          ? "SELECT payload FROM eventos — 5 filas viajan, filtras en Ruby"
          : "WHERE payload ->> 'tipo' = 'pago' — 2 filas viajan",
        cols: [{ t: "id", num: true }, "payload", "¿cruza la red?"],
        filas: EVENTOS_JSON.map(function (e) {
          var pago = e.tipo === "pago";
          var cruza = enApp || pago;
          return {
            celdas: [
              e.id,
              '{"tipo":"' + e.tipo + '"' + (e.monto ? ',"monto":' + e.monto : "") + "}",
              { v: cruza ? "sí" : "no", tono: cruza ? (pago ? "elegida" : "alerta") : "ok" }
            ],
            clase: pago ? "fila-elegida" : (enApp ? null : "fila-muerta")
          };
        })
      }));
      narra.decir(enApp
        ? "<b>5 filas y un JSON.parse por cada una.</b> Tres las vas a tirar en la app: pagaste red, memoria y CPU por nada."
        : "<b>2 filas.</b> El motor bajó al campo anidado y filtró ahí. Con un índice GIN, además, sin leer la tabla completa.");
    }

    var p = C.prediccion({
      pregunta: "5 eventos con payload jsonb, 2 de tipo 'pago'. ¿Cuántas filas cruzan la red si filtras con payload ->> 'tipo' = 'pago'?",
      opciones: [{ txt: "5: jsonb se lee entero" }, { txt: "2", ok: true }, { txt: "depende del índice" }],
      respuesta: "2. Un jsonb no es un blob opaco: ->> extrae el campo dentro del motor y el WHERE filtra ahí, antes de mandarte nada.",
      alRevelar: function (revelado) {
        G.agregar(revelado, [
          el("div", { class: "controles" }, C.segmentado([
            { txt: "filtrar en la app", valor: "app" },
            { txt: "filtrar dentro", valor: "motor" }
          ], pintar, "app")),
          salida,
          narra,
          C.sql("SELECT id, (payload -> 'monto')::numeric AS monto\nFROM eventos\nWHERE payload @> '{\"tipo\":\"pago\"}';   -- @> usa el índice GIN\n-- => 84121|990 · 84130|1200")
        ]);
        pintar("app");
      }
    });
    montar(mount, C.widget("Filtrar dentro del jsonb",
      "Cuántas filas cruzan la red en cada caso.", [p.prediccion, p.revelado]));
  };
})(window.GUIA = window.GUIA || {});
