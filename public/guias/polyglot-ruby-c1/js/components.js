/* Piezas compartidas: cromo, bloques de código y los dos motores de widget.
   Los datos de cada widget viven en data/widgets-*.js; aquí solo la mecánica. */
(function (G) {
  'use strict';

  var C = (G.comp = G.comp || {});

  /* --- Barra superior (idéntica en todas las vistas) ---------------------- */
  C.barra = function () {
    var volver = G.el('a', {
      clase: 'barra__volver',
      attr: { href: '/guias/' },
      html: '← notdefined.dev/guias'
    });

    var grupo = G.el('div', { clase: 'tema', attr: { role: 'group', 'aria-label': 'Tema de color' } });
    var opciones = [
      { valor: 'light', icono: G.iconos.sol, etiqueta: 'Tema claro' },
      { valor: 'dark', icono: G.iconos.luna, etiqueta: 'Tema oscuro' },
      { valor: 'system', icono: G.iconos.monitor, etiqueta: 'Seguir al sistema' }
    ];

    var botones = opciones.map(function (op) {
      var btn = G.el('button', {
        clase: 'tema__btn',
        html: op.icono,
        attr: { type: 'button', 'aria-label': op.etiqueta, title: op.etiqueta, 'aria-pressed': 'false' },
        al: {
          click: function () {
            G.tema.poner(op.valor);
            marcar(op.valor);
          }
        }
      });
      grupo.appendChild(btn);
      return { valor: op.valor, nodo: btn };
    });

    function marcar(activo) {
      botones.forEach(function (b) { b.nodo.setAttribute('aria-pressed', String(b.valor === activo)); });
    }
    marcar(G.tema.leer());

    return G.el('header', { clase: 'barra' }, [volver, grupo]);
  };

  /* --- Bloque de código: resalta comentarios y outputs `# =>` ------------- */
  C.pre = function (codigo) {
    var lineas = String(codigo).split('\n').map(function (linea) {
      var corte = indiceDeComentario(linea);
      if (corte < 0) return G.escapar(linea);
      var clase = /^#\s*=>/.test(linea.slice(corte)) ? 'out' : 'cmt';
      return G.escapar(linea.slice(0, corte)) +
        '<span class="' + clase + '">' + G.escapar(linea.slice(corte)) + '</span>';
    });
    return G.el('pre', { clase: 'pre' }, [G.el('code', { html: lineas.join('\n') })]);
  };

  // Busca el `#` que abre comentario, ignorando los que van dentro de un string
  // (y por lo tanto también los `#{}` de interpolación).
  function indiceDeComentario(linea) {
    var comilla = null;
    for (var i = 0; i < linea.length; i++) {
      var c = linea[i];
      if (comilla) {
        if (c === '\\') i++;
        else if (c === comilla) comilla = null;
      } else if (c === '"' || c === "'") {
        comilla = c;
      } else if (c === '#') {
        return i;
      }
    }
    return -1;
  }

  /* --- Motor de widget por pasos ----------------------------------------- */
  C.widget = function (def) {
    if (!def) return null;
    if (def.tipo === 'escenarios') return C.widgetEscenarios(def);

    var indice = 0;
    var total = def.pasos.length;

    var contadorPaso = G.el('span', { clase: 'widget__paso' });
    var cabeza = G.el('div', { clase: 'widget__cabeza' }, [
      G.el('h3', { clase: 'widget__titulo', texto: def.titulo }),
      contadorPaso
    ]);

    var filas = def.filas.map(function (fila) {
      var marca = G.el('span', { clase: 'fila__marca', texto: '·' });
      var nodo = G.el('div', { clase: 'fila' }, [marca, G.el('span', { texto: fila.texto })]);
      return { def: fila, nodo: nodo, marca: marca, visible: false };
    });

    var escena = G.el('div', { clase: 'widget__escena' }, [
      def.encabezado ? G.el('div', { clase: 'widget__encabezado', texto: def.encabezado }) : null,
      G.el('div', { clase: 'filas' }, filas.map(function (f) { return f.nodo; }))
    ]);

    var panel = G.el('div', { clase: 'widget__panel' });
    var nota = G.el('p', { clase: 'widget__nota', attr: { 'aria-live': 'polite' } });

    var btnAtras = G.el('button', {
      clase: 'btn', texto: '← Atrás',
      attr: { type: 'button' },
      al: { click: function () { ir(indice - 1); } }
    });
    var btnAvanzar = G.el('button', {
      clase: 'btn btn--principal', texto: 'Avanzar →',
      attr: { type: 'button' },
      al: { click: function () { ir(indice + 1); } }
    });
    var btnReiniciar = G.el('button', {
      clase: 'btn', texto: 'Reiniciar',
      attr: { type: 'button' },
      al: { click: function () { ir(0); } }
    });

    var puntos = def.pasos.map(function () { return G.el('span', { clase: 'progreso__punto' }); });
    var progreso = G.el('div', { clase: 'progreso', attr: { 'aria-hidden': 'true' } }, puntos);

    var controles = G.el('div', { clase: 'widget__controles' }, [btnAtras, btnAvanzar, btnReiniciar, progreso]);

    var marcasVisibles = { activo: '▸', gana: '✓', ok: '✓', pierde: '✗', nuevo: '+', apagado: '·', base: '·' };

    function ir(nuevo) {
      indice = Math.max(0, Math.min(total - 1, nuevo));
      pintar();
    }

    function pintar() {
      var paso = def.pasos[indice];
      var marcas = paso.marca || {};

      filas.forEach(function (f) {
        var aparece = (f.def.desde || 0) <= indice;
        var estado = marcas[f.def.id] || 'base';
        var esNueva = aparece && !f.visible;
        f.visible = aparece;
        f.nodo.className = 'fila' + (aparece ? '' : ' fila--oculta') + ' fila--' + estado;
        if (esNueva && !G.sinAnimacion()) {
          f.nodo.classList.add('aparece');
          // Quitar la clase deja el nodo listo para volver a animarse tras Reiniciar.
          window.setTimeout(function () { f.nodo.classList.remove('aparece'); }, 260);
        }
        f.marca.textContent = marcasVisibles[estado] || '·';
      });

      G.vaciar(panel);
      if (paso.panel) {
        panel.appendChild(G.el('div', { clase: 'panel__titulo', texto: paso.panel.titulo }));
        panel.appendChild(G.el('div', { clase: 'panel__lineas' }, paso.panel.lineas.map(function (l) {
          return G.el('div', {
            clase: 'panel__linea' + (l.estado ? ' panel__linea--' + l.estado : ''),
            texto: l.texto
          });
        })));
      }

      nota.innerHTML = paso.nota;
      contadorPaso.textContent = 'paso ' + (indice + 1) + ' / ' + total;
      btnAtras.disabled = indice === 0;
      btnAvanzar.disabled = indice === total - 1;
      puntos.forEach(function (p, i) {
        p.className = 'progreso__punto' + (i <= indice ? ' progreso__punto--hecho' : '');
      });
    }

    var raiz = G.el('div', { clase: 'widget' }, [
      cabeza,
      G.el('div', { clase: 'widget__cuerpo' }, [escena, panel]),
      nota,
      controles
    ]);

    // Con movimiento reducido se muestra directamente el último paso.
    if (G.sinAnimacion()) indice = total - 1;
    pintar();
    return raiz;
  };

  /* --- Motor de widget por escenarios (el selector de concurrencia) ------- */
  C.widgetEscenarios = function (def) {
    var salida = G.el('div');
    var botones = [];

    function mostrar(op) {
      botones.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.op === op.id)); });
      G.vaciar(salida);
      salida.appendChild(G.el('div', { clase: 'veredicto' }, [
        G.el('div', { clase: 'veredicto__etq', texto: 'veredicto' }),
        G.el('p', { clase: 'veredicto__elige', texto: op.elige }),
        G.el('ul', { clase: 'veredicto__porque' }, op.porque.map(function (p) {
          return G.el('li', { html: p });
        })),
        G.el('p', { clase: 'veredicto__evitar', html: '<b>evita</b>' + op.evitar }),
        op.nota ? G.el('p', { clase: 'veredicto__nota', html: '<b>ojo</b>' + op.nota }) : null
      ]));
    }

    var ops = G.el('div', { clase: 'escenarios__ops', attr: { role: 'group', 'aria-label': 'Escenario' } },
      def.opciones.map(function (op) {
        var btn = G.el('button', {
          clase: 'op', texto: op.label,
          attr: { type: 'button', 'aria-pressed': 'false', 'data-op': op.id },
          al: { click: function () { mostrar(op); } }
        });
        botones.push(btn);
        return btn;
      })
    );

    var raiz = G.el('div', { clase: 'widget' }, [
      G.el('div', { clase: 'widget__cabeza' }, [
        G.el('h3', { clase: 'widget__titulo', texto: def.titulo }),
        G.el('span', { clase: 'widget__paso', texto: def.encabezado })
      ]),
      G.el('div', { clase: 'escenarios' }, [ops, salida])
    ]);

    mostrar(def.opciones[0]);
    return raiz;
  };

  /* --- Consola: el one-liner que el lector pega y corre ------------------- */
  // La Clipboard API no existe en file://, y la guía abre por doble clic.
  function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texto);
    var area = G.el('textarea', { texto: texto, clase: 'copia-oculta' });
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } finally { document.body.removeChild(area); }
    return Promise.resolve();
  }

  C.consola = function (callout) {
    if (!callout) return null;

    var boton = G.el('button', {
      clase: 'consola__copiar', texto: 'copiar',
      attr: { type: 'button' },
      al: {
        click: function () {
          copiar(callout.cmd).then(function () {
            boton.textContent = 'copiado ✓';
            window.setTimeout(function () { boton.textContent = 'copiar'; }, 1600);
          });
        }
      }
    });

    return G.el('div', { clase: 'consola' }, [
      G.el('p', { clase: 'consola__dice', html: callout.dice }),
      G.el('div', { clase: 'consola__linea' }, [
        G.el('code', { clase: 'consola__cmd', texto: callout.cmd }),
        boton
      ]),
      G.el('p', { clase: 'consola__sale', texto: '# => ' + callout.sale })
    ]);
  };

  /* --- Riel: el índice de la guía, presente en todas las vistas ----------- */
  function dificultad(nivel) {
    var n = nivel || 2;
    return G.el('span', {
      clase: 'riel__dif',
      attr: { 'aria-label': 'dificultad ' + n + ' de 3', title: 'dificultad ' + n + ' de 3' }
    }, [
      G.el('span', { clase: 'dif--lleno', texto: '◆◆◆'.slice(0, n) }),
      G.el('span', { clase: 'dif--vacio', texto: '◇◇◇'.slice(0, 3 - n) })
    ]);
  }

  C.riel = function (actual) {
    // En pantalla angosta el riel es la única navegación: solo abre el bloque en curso.
    var compacto = window.matchMedia('(max-width: 940px)').matches;

    var intro = G.el('a', {
      clase: 'riel__link riel__link--intro',
      attr: { href: '#/' }
    }, [
      G.el('span', { clase: 'riel__folio', texto: '00' }),
      G.el('span', { clase: 'riel__t', texto: 'Cómo usar esta guía' })
    ]);
    if (actual === 'inicio') intro.setAttribute('aria-current', 'page');

    var grupos = G.datos.bloques.map(function (bloque) {
      var fichas = G.fichasDeBloque(bloque.id);
      var contiene = false;

      var items = fichas.map(function (ficha) {
        var esta = ficha.slug === actual;
        if (esta) contiene = true;
        var link = G.el('a', {
          clase: 'riel__link',
          attr: { href: '#/tema/' + ficha.slug }
        }, [
          G.el('span', { clase: 'riel__folio', texto: ficha.folio }),
          G.el('span', { clase: 'riel__t', texto: ficha.titulo }),
          dificultad(ficha.dificultad)
        ]);
        if (esta) link.setAttribute('aria-current', 'page');
        return G.el('li', {}, [link]);
      });

      var resumen = G.el('summary', { clase: 'riel__cabeza' }, [
        G.el('span', { clase: 'riel__titulo', texto: bloque.folio + ' · ' + bloque.titulo }),
        bloque.modelo ? G.el('span', { clase: 'riel__modelo', texto: bloque.modelo }) : null
      ]);

      var grupo = G.el('details', { clase: 'riel__grupo' }, [
        resumen,
        G.el('ul', { clase: 'riel__lista' }, items)
      ]);
      if (bloque.color) grupo.style.setProperty('--fam', bloque.color);
      if (!compacto || contiene) grupo.setAttribute('open', '');
      return grupo;
    });

    var leyenda = G.el('p', { clase: 'riel__leyenda' }, [
      G.el('span', { clase: 'dif--lleno', texto: '◆' }),
      G.el('span', { clase: 'dif--vacio', texto: '◇◇' }),
      G.el('span', { texto: ' entrada · ' }),
      G.el('span', { clase: 'dif--lleno', texto: '◆◆◆' }),
      G.el('span', { texto: ' segunda sentada' })
    ]);

    return G.el('nav', { clase: 'riel', attr: { 'aria-label': 'Temas de la guía' } },
      [G.el('span', { clase: 'riel__badge', texto: 'nivel C1' }), intro].concat(grupos, [leyenda]));
  };

  /* --- Sección con título de galera -------------------------------------- */
  C.seccion = function (titulo, hijos) {
    return G.el('section', { clase: 'seccion' },
      [G.el('h2', { clase: 'seccion__titulo', texto: titulo })].concat(hijos));
  };
})(window.GUIA = window.GUIA || {});
