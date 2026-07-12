/* data/simulaciones.js — El GUIÓN de las simulaciones (no el motor).
   Aquí viven los datasets, las queries y la narración. La mecánica que
   genera los pasos y anima vive en js/sim-layout.js. Agregar un escenario
   = agregar un objeto aquí, sin tocar el motor.

   Determinismo: no hay azar. El orden de lectura de celdas lo deriva el
   motor de la definición de la query, siempre igual. */
(function (G) {
  'use strict';
  G.sims = G.sims || {};

  G.sims['row-vs-columnar'] = {
    titulo: 'Row store vs columnar',
    subtitulo: 'La misma tabla, la misma pregunta, dos formas de guardar en disco. Mira cuántas celdas tiene que leer cada uno.',
    ilustra: ['relacional', 'columnar'],

    // Tabla pequeña a propósito: se puede seguir con el ojo.
    columnas: ['id', 'region', 'producto', 'monto', 'dia'],
    // El tipo alimenta el color/formato; monto es el que se agrega.
    tipos:    { id: 'num', region: 'txt', producto: 'txt', monto: 'num', dia: 'num' },
    filas: [
      { id: 1, region: 'Norte',  producto: 'Café',   monto: 120, dia: 1 },
      { id: 2, region: 'Sur',    producto: 'Té',     monto: 80,  dia: 1 },
      { id: 3, region: 'Norte',  producto: 'Café',   monto: 200, dia: 2 },
      { id: 4, region: 'Centro', producto: 'Cacao',  monto: 150, dia: 2 },
      { id: 5, region: 'Sur',    producto: 'Café',   monto: 90,  dia: 3 },
      { id: 6, region: 'Norte',  producto: 'Té',     monto: 110, dia: 3 },
      { id: 7, region: 'Centro', producto: 'Cacao',  monto: 175, dia: 4 },
      { id: 8, region: 'Sur',    producto: 'Té',     monto: 60,  dia: 4 }
    ],

    escenarios: [
      {
        id: 'agg',
        etiqueta: 'Agregación',
        query: 'SELECT region, SUM(monto) FROM ventas GROUP BY region',
        tipo: 'aggregation',
        columnasUsadas: ['region', 'monto'],
        // Quién gana este round (para el veredicto del pie).
        ganador: 'columnar',
        narracion: {
          intro: 'La pregunta solo necesita dos columnas: region y monto. Veamos qué lee cada motor.',
          rowScan: 'Row store: las filas están contiguas. Para leer region y monto tiene que arrastrar TODA la fila del disco — id, producto y dia incluidos.',
          rowDone: 'Row store leyó las {n} celdas de la tabla para usar solo {u}. Arrastró {w} que no pidió.',
          colScan: 'Columnar: cada columna está contigua y aparte. Lee solo la columna region y la columna monto.',
          colDone: 'Columnar leyó {n} celdas: exactamente las que necesitaba. Saltó el resto del disco.',
          veredicto: 'Columnar leyó {a} celdas contra {b} del row store. Por eso las agregaciones sobre tablas anchas vuelan en columnar: 10–1,000× según el caso.'
        }
      },
      {
        id: 'point',
        etiqueta: 'Point lookup',
        query: 'SELECT * FROM ventas WHERE id = 5',
        tipo: 'lookup',
        predicado: { columna: 'id', valor: 5 },
        ganador: 'row',
        narracion: {
          intro: 'Ahora la inversa: traer UNA fila entera por su id. El caso donde el columnar sufre.',
          rowScan: 'Row store: el índice lo lleva directo a la fila del id 5, que está completa y contigua. Una sola lectura y ya tiene los 5 campos.',
          rowDone: 'Row store leyó {n} celdas, todas juntas, de un jalón. Esto es lo suyo.',
          colScan: 'Columnar: la fila 5 está desperdigada. Tiene que ir a la posición 5 de CADA columna por separado — cinco saltos a cinco archivos distintos.',
          colDone: 'Columnar también leyó {n} celdas, pero saltando entre 5 lugares del disco en vez de leer un bloque contiguo.',
          veredicto: 'Empatados en celdas, pero el row store las leyó contiguas y el columnar brincando. Para point lookups y OLTP, gana filas por goleada.'
        }
      }
    ]
  };
})(window.GUIA = window.GUIA || {});
