/* components.js — piezas de UI compartidas: código, predicción, tablas, controles. */
(function (G) {
  "use strict";

  var el = G.el;
  G.comp = {};

  /* --- Bloque de SQL con resaltado mínimo ---------------------------------- */
  var PALABRAS = ("select|from|where|group|by|order|having|limit|offset|with|recursive|union|all|"
    + "join|lateral|left|right|inner|outer|on|true|false|null|and|or|not|in|exists|distinct|as|"
    + "over|partition|rows|range|between|unbounded|preceding|following|current|row|filter|within|"
    + "insert|into|values|conflict|do|update|set|delete|returning|merge|when|matched|source|then|"
    + "case|end|else|create|index|table|extension|server|schema|foreign|import|using|"
    + "for|share|skip|locked|nowait|nulls|first|last|asc|desc|explain|analyze|buffers|cycle|"
    + "rollup|cube|grouping|sets|is|coalesce|interval|cast|only|both|primary|key|unique|constraint"
    ).split("|");

  var RE_PALABRAS = new RegExp("\\b(" + PALABRAS.join("|") + ")\\b", "gi");

  function resaltarCodigo(fragmento) {
    var texto = G.escapar(fragmento);
    // Cadenas primero, con marcador, para que las palabras clave no las toquen.
    var cadenas = [];
    texto = texto.replace(/'[^']*'/g, function (m) {
      cadenas.push(m);
      return "\u0000" + (cadenas.length - 1) + "\u0000";
    });
    texto = texto.replace(RE_PALABRAS, function (m) { return '<span class="kw">' + m + "</span>"; });
    return texto.replace(/\u0000(\d+)\u0000/g, function (_, i) {
      return '<span class="str">' + cadenas[Number(i)] + "</span>";
    });
  }

  G.comp.sql = function (fuente) {
    var lineas = String(fuente).replace(/^\n+|\s+$/g, "").split("\n");
    var html = lineas.map(function (linea) {
      var corte = linea.indexOf("--");
      if (corte === -1) return resaltarCodigo(linea);
      var codigo = linea.slice(0, corte);
      var comentario = linea.slice(corte);
      var clase = /^--\s*=>/.test(comentario.trim()) ? "out" : "cm";
      return resaltarCodigo(codigo) + '<span class="' + clase + '">' + G.escapar(comentario) + "</span>";
    }).join("\n");
    return el("pre", { class: "code", html: html, tabindex: "0" });
  };

  /* --- Predecir → revelar -------------------------------------------------- */
  /* opciones: [{txt, ok}] · onRevelar(revelado) se llama una vez, al responder. */
  G.comp.prediccion = function (config) {
    var revelado = el("div", { class: "revelado", hidden: true });
    var veredicto = el("p", { class: "veredicto" });
    var opciones = el("div", { class: "opciones" });

    function responder(boton, opcion) {
      Array.prototype.forEach.call(opciones.children, function (b) { b.disabled = true; });
      boton.classList.add(opcion.ok ? "es-ok" : "es-mal");
      if (!opcion.ok) {
        var correcta = config.opciones.find(function (o) { return o.ok; });
        Array.prototype.forEach.call(opciones.children, function (b) {
          if (b.textContent === correcta.txt) b.classList.add("es-ok");
        });
      }
      veredicto.innerHTML = (opcion.ok ? "<strong>Le atinaste.</strong> " : "<strong>No.</strong> ")
        + G.escapar(config.respuesta);
      revelado.hidden = false;
      if (config.alRevelar) config.alRevelar(revelado);
    }

    config.opciones.forEach(function (o) {
      var boton = el("button", { class: "opcion", type: "button", text: o.txt });
      boton.addEventListener("click", function () { responder(boton, o); });
      opciones.appendChild(boton);
    });

    var caja = el("div", { class: "prediccion" }, [
      el("p", { class: "pregunta", text: config.pregunta }),
      opciones,
      veredicto
    ]);

    return { prediccion: caja, revelado: revelado };
  };

  /* --- Envoltura estándar de widget --------------------------------------- */
  G.comp.widget = function (titulo, sub, hijos) {
    return el("div", { class: "widget" }, [
      el("div", { class: "widget-head" }, [
        el("p", { class: "eyebrow", text: "predecir → revelar" }),
        el("p", { class: "titulo", text: titulo }),
        sub ? el("p", { class: "sub", text: sub }) : null
      ])
    ].concat(hijos || []));
  };

  /* --- Tabla de datos ------------------------------------------------------ */
  /* cols: ["region", {t:"monto", num:true}] · filas: [[v, ...]] o {celdas:[], clase:""} */
  G.comp.tabla = function (config) {
    var cols = config.cols.map(function (c) { return typeof c === "string" ? { t: c } : c; });
    var thead = el("tr", null, cols.map(function (c) {
      return el("th", { class: c.num ? "num" : null, text: c.t, scope: "col" });
    }));
    var cuerpo = el("tbody");
    (config.filas || []).forEach(function (f) {
      var celdas = Array.isArray(f) ? f : f.celdas;
      var tr = el("tr", { class: Array.isArray(f) ? null : f.clase });
      celdas.forEach(function (v, i) {
        var valor = (v && typeof v === "object") ? v : { v: v };
        var clases = [];
        if (cols[i] && cols[i].num) clases.push("num");
        if (valor.tono) clases.push("t-" + valor.tono);
        tr.appendChild(el("td", { class: clases.join(" ") || null, text: String(valor.v) }));
      });
      cuerpo.appendChild(tr);
    });
    var tabla = el("table", { class: "datos" }, [
      config.titulo ? el("caption", { text: config.titulo }) : null,
      el("thead", null, thead),
      cuerpo
    ]);
    return el("div", { class: "tabla-wrap" }, tabla);
  };

  /* --- Segmentado (toggle de N opciones) ---------------------------------- */
  G.comp.segmentado = function (opciones, alCambiar, inicial) {
    var cont = el("div", { class: "segmentado", role: "group" });
    var activo = inicial || opciones[0].valor;
    function pintar() {
      Array.prototype.forEach.call(cont.children, function (b) {
        b.setAttribute("aria-pressed", b.dataset.valor === activo ? "true" : "false");
      });
    }
    opciones.forEach(function (o) {
      var b = el("button", { type: "button", text: o.txt, dataset: { valor: o.valor } });
      b.addEventListener("click", function () {
        activo = o.valor;
        pintar();
        alCambiar(activo);
      });
      cont.appendChild(b);
    });
    pintar();
    return cont;
  };

  /* --- Slider accesible (flechas + valor anunciado) ----------------------- */
  G.comp.slider = function (config, alCambiar) {
    var salida = el("span", { class: "mono-faint" });
    var etiqueta = el("label", { for: config.id }, [config.etiqueta + " ", salida]);
    var input = el("input", {
      type: "range", id: config.id, min: config.min, max: config.max,
      step: config.step || 1, value: config.valor,
      "aria-valuetext": config.formato(config.valor)
    });
    function actualizar() {
      var v = Number(input.value);
      salida.textContent = config.formato(v);
      input.setAttribute("aria-valuetext", config.formato(v));
      alCambiar(v);
    }
    input.addEventListener("input", actualizar);
    salida.textContent = config.formato(Number(config.valor));
    return { campo: el("div", { class: "slider-campo" }, [etiqueta, input]), input: input, actualizar: actualizar };
  };

  /* --- Narración de un renglón -------------------------------------------- */
  G.comp.narracion = function (texto) {
    var nodo = el("p", { class: "narracion", "aria-live": "polite", html: texto || "" });
    nodo.decir = function (html) { nodo.innerHTML = html; };
    return nodo;
  };

  /* --- Panel comparativo --------------------------------------------------- */
  G.comp.panel = function (config) {
    return el("div", { class: "panel " + (config.tono || "") }, [
      el("div", { class: "cab" }, [el("span", { text: config.cab }), config.chip || null]),
      config.cifra !== undefined ? el("p", { class: "cifra", text: config.cifra }) : null,
      config.nota ? el("p", { class: "pie-nota", text: config.nota }) : null
    ].concat(config.extra || []));
  };
})(window.GUIA = window.GUIA || {});
