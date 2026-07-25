/* ============================================================================
   data/wal.js — Ficha 09 · WAL (Write-Ahead Log).
   Incluye la config del widget "WAL + crash" (motor: js/widget-wal.js).
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.wal = {
    slug: "wal",

    queEs: [
      "La regla es una sola: <em>antes</em> de modificar una página de datos, el cambio se anota en un log secuencial. Si el motor se cae, el recovery reproduce ese log y deja todo consistente.",
      "El <code>COMMIT</code> no escribe tus tablas: hace <code>fsync</code> del WAL. Los archivos de datos se ponen al día después, sin prisa."
    ],

    enBreve: [
      "Un <code>COMMIT</code> hace <code>fsync</code> <b>del WAL</b>, no de tus tablas. Es una escritura secuencial de unos cuantos bytes en vez de escrituras aleatorias por toda la base — de ahí sale toda la ganancia.",
      "Cada registro tiene un <b>LSN</b> (Log Sequence Number): su posición en el flujo. Cada página guarda el LSN del último cambio que la tocó, y así el recovery sabe qué ya está aplicado y qué no.",
      "Un <b>checkpoint</b> baja todas las páginas sucias a disco y marca un <em>redo point</em>: el recovery solo reproduce WAL desde ahí. Defaults: <code>checkpoint_timeout</code> 5 min, <code>max_wal_size</code> 1 GB.",
      "<code>full_page_writes</code> (on por default): la primera modificación de una página tras un checkpoint guarda la <b>página completa</b> en el WAL, para sobrevivir a un <em>torn page</em> — un bloque escrito a medias."
    ],

    fundamento: [
      { p: "El problema a resolver es que una transacción puede tocar veinte páginas repartidas por el disco, y garantizar durabilidad significaría hacer <code>fsync</code> de las veinte antes de contestar «listo». Eso son veinte escrituras aleatorias por commit. Inviable." },
      { p: "El WAL cambia el trato: en vez de escribir <em>dónde</em> quedaron los datos, escribe <em>qué cambió</em>, en orden, en un solo archivo. Una escritura secuencial, un <code>fsync</code>, y ya eres durable — porque con ese log se puede reconstruir cualquier página. Los archivos de datos pasan a ser un caché persistente del estado, no la fuente de verdad. <b>La fuente de verdad es el log.</b>" },
      { p: "Los checkpoints existen para que el log no crezca infinito ni el recovery tarde eternidades. Un checkpoint dice «hasta aquí ya está todo en los archivos de datos», y a partir de ese punto el WAL anterior es desechable. De ahí la tensión permanente de tuning: checkpoints frecuentes hacen recovery rápido pero escriben mucho; checkpoints raros escriben poco pero un crash te cuesta minutos de replay." },
      { p: "Y como el log describe todos los cambios físicos en orden, sirve para algo más: mandárselo a otra máquina y tener una copia idéntica. Esa es la replicación física — <em>fuera del alcance de esta guía</em>, pero vale saber que sale del mismo mecanismo, no de un subsistema aparte." }
    ],

    comoFunciona: [
      { p: "<b>Dónde vas en el flujo.</b> El LSN es una dirección en el WAL, no un contador de transacciones:" },
      { code: { tag: "SQL", caption: "el LSN actual y su archivo", text:
"SELECT pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn());\n" +
"\n" +
" pg_current_wal_lsn |     pg_walfile_name\n" +
"--------------------+--------------------------\n" +
" 0/1A2B400          | 000000010000000000000001\n" +
"\n" +
"-- Los segmentos son de 16 MB. La distancia entre dos LSN son bytes:\n" +
"SELECT pg_size_pretty(pg_wal_lsn_diff('0/1A2B400','0/1A2B3C8'));  --  56 bytes"
      }},
      { p: "<b>Qué hay adentro.</b> <code>pg_waldump</code> te lo lee en claro. Aquí está el <code>UPDATE</code> de la ficha 05, tal como quedó anotado:" },
      { code: { tag: "SQL", caption: "pg_waldump · un UPDATE y su COMMIT", text:
"$ pg_waldump -p $PGDATA/pg_wal 000000010000000000000001\n" +
"\n" +
"rmgr: Heap  len (rec/tot): 54/54, tx: 101, lsn: 0/1A2B3C8, prev 0/1A2B390,\n" +
"  desc: HOT_UPDATE old_xmax: 101, old_off: 1, new_off: 2, flags: 0x10,\n" +
"  blkref #0: rel 1663/16384/24576 blk 12058\n" +
"\n" +
"rmgr: Transaction len (rec/tot): 34/34, tx: 101, lsn: 0/1A2B400, prev 0/1A2B3C8,\n" +
"  desc: COMMIT 2026-07-24 11:02:41.882374-06\n" +
"\n" +
"-- 54 bytes para describir el cambio, 34 para el commit. Eso es todo lo que\n" +
"-- hubo que hacer durable. La página 12058 se escribirá cuando toque."
      }},
      { p: "<b>Torn pages y full_page_writes.</b> Una página son 8KB, pero el disco escribe en sectores de 512 bytes o 4KB. Si se corta la luz a medio camino, en disco queda una página mitad vieja y mitad nueva — irreparable con un registro de cambio incremental, porque no sabes sobre qué estás aplicando. La defensa es guardar la página <em>entera</em> en el WAL la primera vez que se toca tras cada checkpoint. Cuesta volumen de WAL y por eso es lo primero que la gente quiere apagar; no lo apagues salvo que tu almacenamiento garantice escrituras atómicas de 8KB." },
      { p: "<b>Checkpoints: el diagnóstico.</b> En PG17 las estadísticas viven en <code>pg_stat_checkpointer</code>. La proporción entre los dos primeros números es lo único que necesitas ver:" },
      { code: { tag: "SQL", caption: "pg_stat_checkpointer · ¿los checkpoints van por reloj o forzados?", text:
"SELECT num_timed, num_requested, write_time, sync_time\n" +
"  FROM pg_stat_checkpointer;\n" +
"\n" +
" num_timed | num_requested | write_time | sync_time\n" +
"-----------+---------------+------------+-----------\n" +
"      1284 |           972 |    4821334 |     18422\n" +
"\n" +
"-- num_timed:     por checkpoint_timeout (lo sano)\n" +
"-- num_requested: forzados por llenar max_wal_size (la alarma)\n" +
"-- 972 de 2256 forzados = max_wal_size está chico para tu ritmo de escritura."
      }},
      { p: "<b>El trato que puedes deshacer.</b> Aquí es donde la durabilidad se vuelve una perilla:" },
      { code: { tag: "SQL", caption: "synchronous_commit · durabilidad por throughput", text:
"SET synchronous_commit = off;\n" +
"\n" +
"-- El COMMIT regresa OK SIN esperar el fsync del WAL.\n" +
"-- Ventana de pérdida en un crash: hasta 3 × wal_writer_delay (~600 ms).\n" +
"-- OJO con lo que NO pasa: no hay corrupción ni transacciones a medias.\n" +
"--   Lo que pierdes son commits completos, los más recientes. Nada más.\n" +
"-- Es una decisión de negocio, no de tuning: ¿puedes perder 600 ms de\n" +
"-- commits en un crash? Para telemetría, sí. Para pagos, no."
      }}
    ],

    widget: {
      kind: "wal",
      seccion: "Widget · WAL + crash: qué te salva no es el archivo de tabla",
      titulo: "UPDATE + COMMIT + crash antes del checkpoint",
      pasos: [
        {
          narr: "Estado inicial, todo consistente: la página 12058 está en <code>shared_buffers</code> limpia, el archivo de tabla en disco dice 250, y no hay WAL pendiente desde el último checkpoint.",
          motor: "corriendo",
          ram: { valor: "250.00", estado: "limpia" },
          wal: [],
          disco: { valor: "250.00" },
          foco: "ninguno"
        },
        {
          narr: "<code>UPDATE ... SET total = 310</code>. El cambio se aplica <b>en RAM</b>: la página queda <b>sucia</b> (dirty). El archivo en disco no se ha tocado: sigue en 250.",
          motor: "corriendo",
          ram: { valor: "310.00", estado: "sucia" },
          wal: [],
          disco: { valor: "250.00" },
          foco: "ram"
        },
        {
          narr: "Se genera el registro WAL que <b>describe</b> el cambio — <code>HOT_UPDATE</code> en el bloque 12058, LSN <code>0/1A2B3C8</code>. Todavía está en el buffer del WAL, no en disco.",
          motor: "corriendo",
          ram: { valor: "310.00", estado: "sucia" },
          wal: [{ lsn: "0/1A2B3C8", tipo: "Heap/HOT_UPDATE", estado: "buffer" }],
          disco: { valor: "250.00" },
          foco: "wal"
        },
        {
          narr: "<b>COMMIT.</b> Se escribe el registro de commit y se hace <code>fsync</code> del WAL. Los dos registros ya están <b>durables en disco</b>. Fíjate bien: la página sigue sucia en RAM y el archivo de tabla <b>sigue diciendo 250</b>.",
          motor: "corriendo",
          ram: { valor: "310.00", estado: "sucia" },
          wal: [
            { lsn: "0/1A2B3C8", tipo: "Heap/HOT_UPDATE", estado: "durable" },
            { lsn: "0/1A2B400", tipo: "Transaction/COMMIT", estado: "durable" }
          ],
          disco: { valor: "250.00" },
          foco: "wal"
        },
        {
          narr: "<b>CRASH.</b> Se muere el proceso antes del checkpoint. <code>shared_buffers</code> se va con él: la página sucia con el 310 <b>se perdió</b>. En el disco, tu tabla dice 250. Tu cambio commiteado no está en la tabla.",
          motor: "caído",
          ram: { valor: "—", estado: "perdida" },
          wal: [
            { lsn: "0/1A2B3C8", tipo: "Heap/HOT_UPDATE", estado: "durable" },
            { lsn: "0/1A2B400", tipo: "Transaction/COMMIT", estado: "durable" }
          ],
          disco: { valor: "250.00" },
          foco: "ram"
        },
        {
          narr: "Arranca el motor y detecta que no hubo shutdown limpio: entra en <b>recovery</b>. Lee el último checkpoint para saber desde qué LSN reproducir — el <em>redo point</em>.",
          motor: "recovery",
          ram: { valor: "250.00", estado: "limpia" },
          wal: [
            { lsn: "0/1A2B3C8", tipo: "Heap/HOT_UPDATE", estado: "durable" },
            { lsn: "0/1A2B400", tipo: "Transaction/COMMIT", estado: "durable" }
          ],
          disco: { valor: "250.00" },
          foco: "motor"
        },
        {
          narr: "<b>Redo.</b> Lee el registro <code>0/1A2B3C8</code>, ve que la página en disco tiene un LSN anterior, y <b>reaplica el cambio</b>. La página vuelve a 310 en RAM, sucia otra vez. El commit se honró.",
          motor: "recovery",
          ram: { valor: "310.00", estado: "sucia" },
          wal: [
            { lsn: "0/1A2B3C8", tipo: "Heap/HOT_UPDATE", estado: "reproducido" },
            { lsn: "0/1A2B400", tipo: "Transaction/COMMIT", estado: "reproducido" }
          ],
          disco: { valor: "250.00" },
          foco: "wal"
        },
        {
          narr: "Termina el recovery y corre un checkpoint: <b>ahora sí</b> la página baja al archivo de tabla. Disco = 310. Lo que salvó tu cambio fue <b>la bitácora, nunca el archivo de tabla</b>.",
          motor: "corriendo",
          ram: { valor: "310.00", estado: "limpia" },
          wal: [
            { lsn: "0/1A2B3C8", tipo: "Heap/HOT_UPDATE", estado: "reproducido" },
            { lsn: "0/1A2B400", tipo: "Transaction/COMMIT", estado: "reproducido" }
          ],
          disco: { valor: "310.00" },
          foco: "disco"
        }
      ]
    },

    cuandoDuele: {
      sym: "Síntoma: picos de latencia cada pocos minutos, siempre parejos",
      paras: [
        "La latencia p99 se dispara en oleadas regulares y nadie encuentra el query culpable, porque no hay uno: todos se degradan a la vez durante unos segundos y luego todo vuelve a la normalidad.",
        "Son los <b>checkpoints</b>. Cada uno tiene que bajar a disco todas las páginas sucias acumuladas, y si son muchas, satura el I/O y todo lo demás espera. Las perillas son tres: subir <code>max_wal_size</code> para que dejen de ser <code>num_requested</code>, subir <code>checkpoint_completion_target</code> para repartir la escritura en el tiempo, y revisar si <code>shared_buffers</code> es tan grande que acumula demasiada suciedad entre checkpoints (ficha 12). Se confirma en un minuto con <code>pg_stat_checkpointer</code>."
      ]
    },

    mito: {
      claim: "un COMMIT escribe tus datos a los archivos de tabla",
      truth: "Falso. Un <code>COMMIT</code> escribe al <b>WAL</b> y hace <code>fsync</code> de eso. Tu tabla se actualiza después, cuando el checkpointer o la presión de buffers lo decidan. Es exactamente por eso que un crash justo después de un commit no pierde nada: el archivo de tabla está viejo, pero el log tiene lo necesario para ponerlo al día.",
      more: [
        { html: "<b>«Un COMMIT que regresó OK ya es durable, siempre.»</b> No con <code>synchronous_commit = off</code>, ni con réplicas asíncronas: hay una ventana de flush en la que un crash se lleva commits ya confirmados. Cambiaste durabilidad por throughput — a veces es el trato correcto, pero es un trato." },
        { html: "<b>«full_page_writes es overhead que puedo apagar.»</b> Solo si tu almacenamiento garantiza escrituras atómicas de 8KB. Si no, un corte de luz a media escritura te deja una página partida que ningún WAL incremental puede reparar." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Reliability and the WAL (Chapter 30)", note: "«30.4 WAL Configuration» y «30.5 WAL Internals»: checkpoints, full_page_writes y el formato." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 9, «Write Ahead Logging»: LSN, redo point y el recovery paso a paso, dibujado." },
      { kind: "Docs oficiales", title: "PostgreSQL 17 — pg_waldump + pg_stat_checkpointer", note: "Para leer el log en claro y para el diagnóstico de checkpoints (la vista es nueva en PG17)." }
    ]
  };

})(window.GUIA = window.GUIA || {});
