/* ============================================================================
   data/mvcc.js — Ficha 05 · MVCC.
   Incluye la config del widget "MVCC en vivo" (motor: js/widget-mvcc.js).
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.mvcc = {
    slug: "mvcc",

    queEs: [
      "Multi-Version Concurrency Control: en vez de bloquear una fila para modificarla, el motor guarda <em>varias versiones</em> de ella y le enseña a cada transacción la que le toca según cuándo empezó.",
      "El resultado es la propiedad que hace que Postgres aguante carga mixta: <b>los lectores no bloquean escritores y los escritores no bloquean lectores</b>. El precio se paga en basura acumulada."
    ],

    enBreve: [
      "Cada fila física es un <em>tuple</em> con dos campos de sistema: <code>xmin</code> (el xid que la creó) y <code>xmax</code> (el que la mató). Un <code>UPDATE</code> no pisa: escribe un tuple nuevo y le pone <code>xmax</code> al viejo.",
      "Un <b>snapshot</b> es la lista de qué transacciones ya commitearon en el instante en que se tomó. Es lo único que decide qué versión ve cada quien.",
      "Los campos son consultables directo: <code>SELECT xmin, xmax, ctid, * FROM pedidos</code>. Con la extensión <code>pageinspect</code> ves el header completo del tuple.",
      "El costo es el <b>bloat</b>: las versiones muertas siguen ocupando lugar en la tabla y en todos sus índices hasta que <code>VACUUM</code> pase a barrer (ficha 06)."
    ],

    fundamento: [
      { p: "La alternativa clásica es el lock de lectura: si alguien va a escribir una fila, los lectores esperan. Funciona y es simple, pero en una carga mixta se convierte en una fila india — un reporte de tres minutos congela las escrituras, o al revés. MVCC compra la salida a ese problema pagando con espacio: si nunca sobrescribes nada, un lector siempre tiene una versión consistente que leer sin pedirle permiso a nadie." },
      { p: "La consistencia sale del snapshot, no del lock. Cuando una transacción necesita decidir si ve un tuple, hace una pregunta puramente aritmética: «¿el <code>xmin</code> de este tuple ya estaba committed cuando tomé mi snapshot, y su <code>xmax</code> no?». Si sí, lo ve. Es una regla local, sin coordinación con nadie — de ahí que escale." },
      { p: "Y de ahí sale también la consecuencia incómoda: una versión no se puede borrar en el momento en que muere, porque alguien con un snapshot viejo todavía puede necesitarla. Alguien tiene que venir después a decidir qué ya no le sirve a nadie. Ese alguien es <code>VACUUM</code>, y no es un detalle de implementación: es la otra mitad del diseño." }
    ],

    comoFunciona: [
      { p: "<b>Los campos de sistema.</b> Míralos directo. Fíjate sobre todo en el <code>ctid</code> — es la dirección física (página, item), y cambia:" },
      { code: { tag: "SQL", caption: "un UPDATE mueve la fila de lugar", text:
"SELECT ctid, xmin, xmax, total FROM pedidos WHERE id = 42;\n" +
" ctid  | xmin | xmax | total\n" +
"-------+------+------+--------\n" +
" (0,1) |  100 |    0 | 250.00\n" +
"\n" +
"BEGIN;\n" +
"UPDATE pedidos SET total = 310 WHERE id = 42;\n" +
"\n" +
"SELECT ctid, xmin, xmax, total FROM pedidos WHERE id = 42;\n" +
" ctid  | xmin | xmax | total\n" +
"-------+------+------+--------\n" +
" (0,2) |  101 |    0 | 310.00\n" +
"\n" +
"-- Otro ctid: es OTRO tuple, en otro item de la página.\n" +
"-- El (0,1) sigue ahí, ahora con xmax = 101."
      }},
      { p: "No hubo modificación en su lugar. Hubo un tuple nuevo en <code>(0,2)</code> y una lápida puesta sobre <code>(0,1)</code>. Eso es literalmente todo lo que hace un <code>UPDATE</code> en Postgres." },
      { p: "<b>La regla de visibilidad.</b> Para cada tuple candidato, el motor pregunta: ¿el <code>xmin</code> está committed y es visible en mi snapshot? ¿El <code>xmax</code> está vacío, o pertenece a una transacción que aún no commiteó? Si ambas, el tuple es visible. Es la misma regla para todos los niveles de aislamiento — lo único que cambia es <em>cuándo se toma el snapshot</em>, y eso es la ficha 07." },
      { p: "<b>Quién soy y qué veo.</b> Postgres te deja asomarte al estado de la transacción:" },
      { code: { tag: "SQL", caption: "el xid propio y el snapshot actual", text:
"BEGIN;\n" +
"SELECT pg_current_xact_id();      -- mi xid: 101\n" +
"SELECT pg_current_snapshot();     -- 100:104:102,103\n" +
"\n" +
"-- Se lee xmin:xmax:xip_list —\n" +
"--   100  todo lo anterior ya está resuelto\n" +
"--   104  nada de 104 en adelante existe todavía\n" +
"--   102,103  estas SÍ están en vuelo: no las veo"
      }},
      { p: "<b>Los índices también versionan.</b> Cada versión nueva necesita su entrada en cada índice de la tabla — por eso un <code>UPDATE</code> sobre una columna indexada es caro. La excepción son los updates <b>HOT</b> (heap-only tuples): si ninguna columna indexada cambió y hay espacio en la misma página, la versión nueva se encadena dentro de la página y los índices no se tocan. El aterrizaje físico de todo esto es la ficha 10." },
      { p: "<b>DELETE es lo mismo, sin la mitad nueva.</b> Un <code>DELETE</code> solo pone <code>xmax</code>. La fila sigue en la página, invisible, esperando al conserje. Por eso borrar no libera disco de inmediato — y por eso puedes «recuperar» datos borrados hasta que <code>VACUUM</code> pase." }
    ],

    widget: {
      kind: "mvcc",
      seccion: "Widget · MVCC en vivo: dos transacciones, dos verdades",
      titulo: "UPDATE pedidos SET total = 310 WHERE id = 42",
      txns: [
        { id: "A", xid: 101, rol: "la que escribe" },
        { id: "B", xid: 102, rol: "la que lee" }
      ],
      pasos: [
        {
          narr: "Estado inicial: <b>una sola versión</b> de la fila 42, creada por el xid 100. <code>xmax = 0</code> quiere decir «nadie la ha matado». Nadie ha abierto transacción todavía.",
          versiones: [{ ctid: "(0,1)", xmin: 100, xmax: 0, total: "250.00", estado: "viva" }],
          txn: { A: { estado: "—", snapshot: "—" }, B: { estado: "—", snapshot: "—" } },
          ve: { A: null, B: null }, foco: "heap"
        },
        {
          narr: "<b>Txn A</b> hace <code>BEGIN</code> y toma su snapshot. Ve la única versión que hay.",
          versiones: [{ ctid: "(0,1)", xmin: 100, xmax: 0, total: "250.00", estado: "viva" }],
          txn: { A: { estado: "activa", snapshot: "100:101:" }, B: { estado: "—", snapshot: "—" } },
          ve: { A: 0, B: null }, foco: "A"
        },
        {
          narr: "<b>Txn B</b> hace <code>BEGIN</code> y toma el suyo. Las dos ven exactamente lo mismo: todavía no pasa nada interesante.",
          versiones: [{ ctid: "(0,1)", xmin: 100, xmax: 0, total: "250.00", estado: "viva" }],
          txn: { A: { estado: "activa", snapshot: "100:101:" }, B: { estado: "activa", snapshot: "100:102:" } },
          ve: { A: 0, B: 0 }, foco: "B"
        },
        {
          narr: "<b>Txn A hace el UPDATE.</b> No pisa nada: <b>nace</b> un tuple nuevo en <code>(0,2)</code> con <code>xmin = 101</code>, y el viejo <b>recibe su lápida</b>: <code>xmax = 101</code>.",
          versiones: [
            { ctid: "(0,1)", xmin: 100, xmax: 101, total: "250.00", estado: "muriendo" },
            { ctid: "(0,2)", xmin: 101, xmax: 0, total: "310.00", estado: "nueva" }
          ],
          txn: { A: { estado: "activa · escribió", snapshot: "100:101:" }, B: { estado: "activa", snapshot: "100:102:" } },
          ve: { A: 1, B: 0 }, foco: "heap"
        },
        {
          narr: "<b>Aquí está el corazón.</b> A ve su propio cambio (310). B sigue viendo 250 — porque su snapshot no incluye al xid 101 como committed, así que para B ese tuple nuevo <em>no existe todavía</em>. Dos verdades simultáneas, cero locks.",
          versiones: [
            { ctid: "(0,1)", xmin: 100, xmax: 101, total: "250.00", estado: "muriendo" },
            { ctid: "(0,2)", xmin: 101, xmax: 0, total: "310.00", estado: "nueva" }
          ],
          txn: { A: { estado: "activa · ve 310", snapshot: "100:101:" }, B: { estado: "activa · ve 250", snapshot: "100:102:" } },
          ve: { A: 1, B: 0 }, foco: "ambos"
        },
        {
          narr: "<b>Txn A hace COMMIT.</b> El xid 101 pasa a committed en el commit log. Nada se mueve físicamente: solo cambió el veredicto sobre 101.",
          versiones: [
            { ctid: "(0,1)", xmin: 100, xmax: 101, total: "250.00", estado: "muerta" },
            { ctid: "(0,2)", xmin: 101, xmax: 0, total: "310.00", estado: "viva" }
          ],
          txn: { A: { estado: "committed", snapshot: "—" }, B: { estado: "activa · ve 250", snapshot: "100:102:" } },
          ve: { A: null, B: 0 }, foco: "A"
        },
        {
          narr: "<b>B corre otro SELECT.</b> Como está en <code>READ COMMITTED</code> (el default), toma un snapshot <b>nuevo</b> por statement — y ahora sí ve 310. En <code>REPEATABLE READ</code> seguiría viendo 250 hasta terminar: ficha 07.",
          versiones: [
            { ctid: "(0,1)", xmin: 100, xmax: 101, total: "250.00", estado: "muerta" },
            { ctid: "(0,2)", xmin: 101, xmax: 0, total: "310.00", estado: "viva" }
          ],
          txn: { A: { estado: "committed", snapshot: "—" }, B: { estado: "activa · ve 310", snapshot: "102:103:" } },
          ve: { A: null, B: 1 }, foco: "B"
        },
        {
          narr: "El tuple <code>(0,1)</code> ya no le sirve a nadie, pero <b>sigue ocupando su lugar</b> en la página y en cada índice de la tabla. Eso es bloat, y ahí se queda hasta que pase <code>VACUUM</code> — ficha 06.",
          versiones: [
            { ctid: "(0,1)", xmin: 100, xmax: 101, total: "250.00", estado: "bloat" },
            { ctid: "(0,2)", xmin: 101, xmax: 0, total: "310.00", estado: "viva" }
          ],
          txn: { A: { estado: "committed", snapshot: "—" }, B: { estado: "committed", snapshot: "—" } },
          ve: { A: null, B: null }, foco: "heap"
        }
      ]
    },

    cuandoDuele: {
      sym: "Síntoma: la tabla pesa 40 GB y sus datos son 6 GB",
      paras: [
        "Una tabla de trabajo que se actualiza sin parar. Los <code>SELECT</code> se degradan poco a poco: el planner sigue eligiendo bien, pero cada seq scan tiene que leer ocho veces más páginas de las que contienen datos vivos.",
        "Casi siempre el culpable no es MVCC sino una <b>transacción larga abierta</b> — un reporte, una sesión de psql olvidada, una réplica con <code>hot_standby_feedback</code>. Mientras ese snapshot viva, <code>VACUUM</code> <em>no puede</em> limpiar nada más nuevo que él: las versiones muertas se acumulan porque legalmente alguien podría necesitarlas. Se caza con <code>pg_stat_activity</code> buscando <code>xact_start</code> antiguos e <code>idle in transaction</code>."
      ]
    },

    mito: {
      claim: "un UPDATE modifica la fila en su lugar",
      truth: "Falso, y de aquí salen la mitad de las sorpresas operativas de Postgres. Un <code>UPDATE</code> <b>crea una versión nueva</b> y marca la vieja como muerta. Consecuencias que ya no te van a sorprender: el <code>ctid</code> cambia, actualizar una columna indexada escribe en todos los índices, un <code>UPDATE</code> de una fila puede hacer crecer la tabla, y <code>DELETE</code> no libera disco de inmediato.",
      more: [
        { html: "<b>«MVCC significa que nunca hay locks.»</b> No: MVCC elimina los locks de <em>lectura</em>. Dos transacciones que actualizan la <em>misma</em> fila sí se serializan una detrás de otra — ficha 08." },
        { html: "<b>«El bloat es un bug.»</b> No: es la contraparte contable del diseño. Sin versiones muertas no hay lectura sin locks. Lo que sí es un bug operativo es no dejar que <code>VACUUM</code> haga su trabajo." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Concurrency Control (Chapter 13)", note: "«13.2 Transaction Isolation» y «13.4»: la definición formal de snapshot y visibilidad." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 5, «Concurrency Control»: la mejor explicación con dibujos de xmin/xmax, clog y snapshots." },
      { kind: "Docs oficiales", title: "PostgreSQL 17 — System Columns + pageinspect", note: "«5.5 System Columns» para xmin/xmax/ctid; la extensión pageinspect para ver el header crudo." }
    ]
  };

})(window.GUIA = window.GUIA || {});
