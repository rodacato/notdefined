/* ============================================================================
   data/buffers.js — Ficha 12 · Buffer manager.
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.buffers = {
    slug: "buffers",

    queEs: [
      "<code>shared_buffers</code> es el caché de páginas de Postgres en RAM: un arreglo de slots de 8KB que todos los backends comparten. Cada lectura y cada escritura pasa por ahí.",
      "Y detrás está el page cache del sistema operativo, cacheando lo mismo otra vez. Ese <em>doble caché</em> es la clave para entender por qué darle toda la RAM a Postgres empeora las cosas."
    ],

    enBreve: [
      "Es un arreglo de slots de 8KB en memoria compartida, con una tabla hash para encontrarlos. Default <b>128MB</b> — ridículamente bajo a propósito, para que arranque en cualquier máquina. Siempre hay que subirlo.",
      "Pedir una página: se busca en la tabla hash. <b>Hit</b> → se usa. <b>Miss</b> → se elige una víctima, se desaloja (si está sucia, hay que escribirla primero) y se lee del SO.",
      "La evicción es <b>clock-sweep</b>, no LRU puro: cada buffer tiene un contador de uso que se decrementa cuando la manecilla pasa; se desaloja el primero que llegue a cero. Sin listas globales que haya que lockear.",
      "Detrás está el <b>OS page cache</b>: la misma página cacheada dos veces. El consenso de la comunidad es <b>~25% de la RAM</b> para <code>shared_buffers</code>, dejándole el resto al SO."
    ],

    fundamento: [
      { p: "Un caché de páginas en proceso parece redundante cuando el SO ya cachea archivos, y de hecho hay motores que se apoyan solo en el del SO. Postgres tiene el suyo porque necesita cosas que el SO no puede darle: saber qué páginas están <em>sucias</em> para coordinarlas con el WAL y los checkpoints (ficha 09), pinear una página mientras alguien la lee, y aplicar su propia política de reemplazo sabiendo qué es un índice y qué es un seq scan." },
      { p: "La política es clock-sweep en vez de LRU por una razón de concurrencia: un LRU exacto exige mover un elemento a la cabeza de una lista en <em>cada</em> acceso, y eso es un punto de contención brutal con cientos de backends. El clock-sweep solo incrementa un contador local por acceso y hace el trabajo de decidir de forma perezosa, cuando alguien necesita un slot. Es aproximado, y sale muchísimo más barato." },
      { p: "El doble caché es la consecuencia incómoda: cada página que Postgres tiene en <code>shared_buffers</code> probablemente también está en el page cache del SO, así que la RAM se cuenta dos veces. Y hay un segundo costo: más buffers significa más páginas sucias acumulándose entre checkpoints, o sea checkpoints más pesados. Por eso la curva de «más shared_buffers» se aplana y después baja." }
    ],

    comoFunciona: [
      { p: "<b>Qué hay adentro ahora mismo.</b> Con <code>pg_buffercache</code> puedes ver cada slot y de quién es:" },
      { code: { tag: "SQL", caption: "pg_buffercache · quién se está comiendo la RAM", text:
"CREATE EXTENSION pg_buffercache;\n" +
"\n" +
"SELECT c.relname,\n" +
"       count(*) AS buffers,\n" +
"       pg_size_pretty(count(*) * 8192::bigint) AS en_ram,\n" +
"       round(100.0 * count(*) FILTER (WHERE b.isdirty) / count(*), 1) AS pct_sucias\n" +
"  FROM pg_buffercache b\n" +
"  JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)\n" +
" GROUP BY c.relname ORDER BY buffers DESC LIMIT 3;\n" +
"\n" +
"      relname       | buffers | en_ram  | pct_sucias\n" +
"--------------------+---------+---------+------------\n" +
" pedidos            |   11284 | 88 MB   |       12.4\n" +
" pedidos_estado_idx |    2841 | 22 MB   |        3.1\n" +
" eventos            |     912 | 7128 kB |        0.0"
      }},
      { p: "<b>El hit ratio, y por qué miente un poco.</b> <code>pg_statio_user_tables</code> te lo da, pero cuidado con qué significa cada columna:" },
      { code: { tag: "SQL", caption: "hit ratio · con su asterisco", text:
"SELECT heap_blks_hit, heap_blks_read,\n" +
"       round(100.0 * heap_blks_hit /\n" +
"             nullif(heap_blks_hit + heap_blks_read, 0), 2) AS hit_pct\n" +
"  FROM pg_statio_user_tables WHERE relname = 'pedidos';\n" +
"\n" +
" heap_blks_hit | heap_blks_read | hit_pct\n" +
"---------------+----------------+---------\n" +
"      48291044 |         412883 |   99.15\n" +
"\n" +
"-- EL ASTERISCO: \"hit\" = estaba en shared_buffers.\n" +
"-- \"read\" = NO estaba en shared_buffers... pero pudo servirla el page cache\n" +
"-- del SO desde RAM igual. Un 99.15% no significa que el 0.85% fue a disco.\n" +
"-- Desde Postgres no puedes distinguirlo: hay que mirar el I/O del SO."
      }},
      { p: "<b>Los seq scans no arrasan el caché.</b> Detalle de diseño que la gente asume mal: si Postgres leyera una tabla de 40 GB por <code>shared_buffers</code> normal, desalojaría todo lo útil. No lo hace — usa un <em>ring buffer</em> pequeño (256KB) para escaneos grandes, así que un reporte pesado no te tira el caché de la carga transaccional. Solo entra al caché principal si la tabla es chica (menos de 1/4 de <code>shared_buffers</code>)." },
      { p: "<b>Páginas sucias y el enlace con la ficha 09.</b> Una página sucia solo puede bajar a disco <em>después</em> de que su WAL esté durable — la regla write-ahead. Hay tres formas de que baje: el checkpointer (por reloj o por <code>max_wal_size</code>), el <em>background writer</em> adelantándose un poco, o un backend que necesita un slot y le toca escribirla él mismo. La tercera es la mala: significa que tu query está pagando I/O de escritura ajeno." },
      { code: { tag: "SQL", caption: "¿quién está escribiendo las páginas sucias?", text:
"SELECT buffers_clean, maxwritten_clean, buffers_alloc\n" +
"  FROM pg_stat_bgwriter;\n" +
"\n" +
" buffers_clean | maxwritten_clean | buffers_alloc\n" +
"---------------+------------------+---------------\n" +
"        184029 |             2841 |      48812004\n" +
"\n" +
"-- maxwritten_clean alto = el background writer se detuvo por su límite\n" +
"-- (bgwriter_lru_maxpages) antes de terminar. Los backends están limpiando\n" +
"-- buffers ellos mismos. Súbelo, o revisa por qué se ensucia tan rápido.\n" +
"\n" +
"-- Para precargar una tabla al caché a propósito (después de un reinicio):\n" +
"CREATE EXTENSION pg_prewarm;\n" +
"SELECT pg_prewarm('pedidos');"
      }}
    ],

    cuandoDuele: {
      sym: "Síntoma: le subiste shared_buffers al 60% de la RAM y todo empeoró",
      paras: [
        "Parece la optimización obvia: la máquina tiene 64 GB, le das 40 GB a Postgres para que «quepa todo». Y la latencia sube, los picos de checkpoint se vuelven peores, y algún query grande empieza a fallar por memoria.",
        "Tres cosas se juntaron. Se le quitó RAM al <b>OS page cache</b>, que estaba haciendo un trabajo perfectamente bueno con la misma información. Se acumulan <b>muchas más páginas sucias</b> entre checkpoints, así que cada checkpoint escribe mucho más de golpe (ficha 09). Y <code>work_mem</code> se asigna <b>por operación por backend</b> (ficha 13), así que la RAM que apartaste ya no está disponible para los sorts y hashes que la necesitan. El punto de partida sensato sigue siendo ~25%, y se mueve midiendo, no adivinando."
      ]
    },

    mito: {
      claim: "más shared_buffers siempre es mejor",
      truth: "Falso: la curva se aplana y luego baja. Compite con el <b>OS page cache</b> por la misma RAM cacheando lo mismo, acumula más páginas sucias y hace los <b>checkpoints más pesados</b>, y le quita memoria a <code>work_mem</code>, que es la que de verdad acelera sorts y hash joins. El consenso —<b>~25% de la RAM</b>— no es pereza: es la meseta de la curva.",
      more: [
        { html: "<b>«Un seq scan grande me tira el caché.»</b> No: los escaneos grandes usan un ring buffer de 256KB precisamente para no desalojar el caché útil." },
        { html: "<b>«99% de hit ratio significa que casi no toco disco.»</b> No necesariamente. Ese «hit» solo mide <code>shared_buffers</code>; los «read» pueden venir del page cache del SO sin tocar disco. Y al revés: un 99% puede seguir siendo lentísimo si el 1% son lecturas aleatorias." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Resource Consumption (19.4)", note: "shared_buffers, work_mem, effective_cache_size y qué significa cada uno para el planner." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 8, «Buffer Manager»: la tabla hash, los descriptores y el clock-sweep dibujado paso a paso." },
      { kind: "Docs oficiales", title: "PostgreSQL 17 — pg_buffercache + pg_prewarm", note: "Para ver el contenido del caché y para precalentarlo después de un reinicio." }
    ]
  };

})(window.GUIA = window.GUIA || {});
