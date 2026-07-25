/* ============================================================================
   data/paginas.js — Ficha 10 · Page layout (páginas de 8KB).
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.paginas = {
    slug: "paginas",

    queEs: [
      "La unidad física de Postgres es la <b>página de 8KB</b>. No existe leer «una fila»: se lee la página que la contiene, completa, siempre.",
      "Adentro, una fila es un <em>item</em> localizado por un puntero, y su header guarda los <code>xmin</code>/<code>xmax</code> del bloque 2. Aquí aterriza físicamente todo el MVCC."
    ],

    enBreve: [
      "8KB es <code>BLCKSZ</code>, fijado <b>en tiempo de compilación</b>. No es un parámetro que puedas cambiar en <code>postgresql.conf</code>. Aplica igual a heap y a índices.",
      "Estructura de la página: <code>PageHeaderData</code> (24 bytes) al inicio, un arreglo de punteros <code>ItemIdData</code> (4 bytes cada uno) creciendo <b>hacia abajo</b>, y las tuples creciendo <b>desde el final hacia arriba</b>. El espacio libre es el hueco de en medio.",
      "Cada tuple carga ~<b>23 bytes</b> de header (<code>HeapTupleHeaderData</code>) más padding: ahí viven <code>xmin</code>, <code>xmax</code>, <code>t_ctid</code> y los bits de info.",
      "<code>fillfactor</code> (100 en heap, 90 en B-tree) reserva hueco en la página para que los updates puedan ser <b>HOT</b> y no tocar ningún índice."
    ],

    fundamento: [
      { p: "El tamaño fijo de página es lo que hace posible todo lo demás: el buffer manager puede tratar cada slot como intercambiable (ficha 12), el WAL puede referirse a «el bloque 12058 de la relación tal» sin ambigüedad (ficha 09), y un <code>ctid</code> puede ser una dirección de dos números. Todo el motor habla en páginas." },
      { p: "El truco de la estructura interna es el crecimiento en dos direcciones. Los punteros crecen desde el header hacia el fondo; las tuples crecen desde el fondo hacia el header. Así no hay que decidir de antemano cuántas filas caben, y sobre todo: <b>una tuple puede moverse dentro de la página sin que nada de fuera se enteré</b>, porque los índices apuntan al número de puntero, no al offset físico. Esa indirección es lo que permite compactar una página durante el vacuum sin reescribir los índices." },
      { p: "Y de aquí sale la restricción que explica la ficha 11: una tuple <b>no puede cruzar de página</b>. Si un valor no cabe, no hay «continúa en el siguiente bloque». Hay que comprimirlo o mandarlo a vivir a otro lado." }
    ],

    comoFunciona: [
      { p: "<b>El header de la página.</b> Con <code>pageinspect</code> se ve el mapa. Los dos números que importan son <code>lower</code> y <code>upper</code>: el fin del arreglo de punteros y el inicio de las tuples. Lo que hay entre ellos es tu espacio libre:" },
      { code: { tag: "SQL", caption: "pageinspect · el mapa de una página", text:
"CREATE EXTENSION pageinspect;\n" +
"\n" +
"SELECT lsn, lower, upper, special, pagesize\n" +
"  FROM page_header(get_raw_page('pedidos', 12058));\n" +
"\n" +
"    lsn    | lower | upper | special | pagesize\n" +
"-----------+-------+-------+---------+----------\n" +
" 0/1A2B3C8 |    92 |  6512 |    8192 |     8192\n" +
"\n" +
"-- lower  92   → 24 de header + 17 punteros × 4 bytes\n" +
"-- upper  6512 → aquí empieza la tuple más reciente\n" +
"-- libre  6512 - 92 = 6420 bytes\n" +
"-- lsn    el último cambio que tocó esta página (ficha 09)"
      }},
      { p: "<b>Las tuples y sus lápidas.</b> Aquí está el <code>UPDATE</code> del widget de la ficha 05, visto por dentro. Fíjate en el <code>t_ctid</code> del tuple muerto:" },
      { code: { tag: "SQL", caption: "heap_page_items · la cadena HOT dentro de la página", text:
"SELECT lp, lp_off, lp_len, t_xmin, t_xmax, t_ctid\n" +
"  FROM heap_page_items(get_raw_page('pedidos', 12058)) WHERE lp <= 2;\n" +
"\n" +
" lp | lp_off | lp_len | t_xmin | t_xmax |  t_ctid\n" +
"----+--------+--------+--------+--------+------------\n" +
"  1 |   8072 |    120 |    100 |    101 | (12058,2)\n" +
"  2 |   7952 |    120 |    101 |      0 | (12058,2)\n" +
"\n" +
"-- lp 1: la versión vieja. xmax = 101 (muerta) y su t_ctid apunta\n" +
"--       a (12058,2): \"mi sucesora está en el item 2 de esta misma página\".\n" +
"--       Esa es la CADENA HOT.\n" +
"-- lp 2: la versión nueva. t_ctid apunta a sí misma = fin de la cadena.\n" +
"-- Los índices siguen apuntando al item 1 y llegan igual: siguen la cadena."
      }},
      { p: "Eso es un <b>HOT update</b> (heap-only tuple): la versión nueva cupo en la misma página y ninguna columna indexada cambió, así que los índices <em>no se tocaron</em>. Es la optimización más rentable de Postgres, y depende de que haya hueco en la página." },
      { p: "<b>fillfactor: comprar hueco a propósito.</b> El default del heap es 100 — llena la página al tope. Perfecto para tablas que solo crecen, pésimo para tablas que se actualizan, porque sin hueco no hay HOT:" },
      { code: { tag: "SQL", caption: "dejar espacio para que los updates sean HOT", text:
"ALTER TABLE pedidos SET (fillfactor = 85);\n" +
"-- Solo aplica a páginas NUEVAS. Para reorganizar las que ya existen:\n" +
"VACUUM FULL pedidos;   -- o pg_repack, sin el lock exclusivo\n" +
"\n" +
"-- Verificar si tus updates están siendo HOT:\n" +
"SELECT n_tup_upd, n_tup_hot_upd,\n" +
"       round(100.0 * n_tup_hot_upd / n_tup_upd, 1) AS pct_hot\n" +
"  FROM pg_stat_user_tables WHERE relname = 'pedidos';\n" +
"\n" +
" n_tup_upd | n_tup_hot_upd | pct_hot\n" +
"-----------+---------------+---------\n" +
"    892014 |        741208 |    83.1\n" +
"\n" +
"-- 83% HOT es sano. Si ves 5%, tus updates tocan columnas indexadas\n" +
"-- o no hay hueco en las páginas."
      }},
      { p: "<b>Del archivo hacia arriba.</b> Una tabla no es un archivo: es un conjunto de <em>forks</em>, y cada uno se parte en segmentos de 1 GB. El fork principal son los datos; el <code>_fsm</code> es el free space map (qué página tiene hueco para insertar); el <code>_vm</code> es el visibility map de la ficha 06. Cuando ves <code>24576</code>, <code>24576.1</code>, <code>24576_fsm</code> en el directorio, es todo la misma tabla." }
    ],

    cuandoDuele: {
      sym: "Síntoma: la tabla ocupa cuatro veces lo que deberían pesar sus datos, y no es bloat",
      paras: [
        "Corres <code>VACUUM</code>, verificas <code>n_dead_tup</code> en cero, y la tabla sigue enorme para las filas que tiene. No hay basura que limpiar: el desperdicio es <b>estructural</b>.",
        "Pasa cuando la fila es ancha y cabe un número feo de veces en 8KB. Si tus filas miden 2,100 bytes, caben <b>tres</b> por página y quedan 1,700 bytes muertos en cada una — 20% de la tabla es aire. Se arregla con el orden de las columnas (agrupar por alineación reduce el padding), bajando la fila del umbral con <code>SET STORAGE EXTERNAL</code> en la columna gorda (ficha 11), o partiendo la tabla. Y el otro caso: <code>fillfactor</code> alto en una tabla de mucho update, donde cada versión nueva se va a otra página y se pierde el HOT."
      ]
    },

    mito: {
      claim: "una fila es una fila",
      truth: "Falso, y esa simplificación es la raíz de casi todas las sorpresas de almacenamiento. Una fila es un <b>item dentro de una página</b>, localizado por un puntero, con ~23 bytes de header propio, que <b>puede existir en varias versiones vivas a la vez</b> en esa misma página, encadenadas entre sí. Su dirección (<code>ctid</code>) cambia cuando la actualizas, y sus valores grandes probablemente ni estén ahí (ficha 11).",
      more: [
        { html: "<b>«Puedo poner páginas de 32KB para tablas grandes.»</b> No sin recompilar: <code>BLCKSZ</code> se fija al compilar, y cambiarlo te saca del camino de los binarios oficiales." },
        { html: "<b>«El orden de las columnas es cosmético.»</b> No: la alineación mete padding. Poner los tipos de ancho fijo grandes primero y los cortos después puede ahorrarte bytes por fila — que multiplicados por millones son gigabytes." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — Database Physical Storage (Chapter 73)", note: "«73.6 Database Page Layout»: los structs exactos del header de página y del header de tuple." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 1, «Database Cluster, Databases, and Tables»: páginas, forks y cadenas HOT dibujadas." },
      { kind: "Docs oficiales", title: "PostgreSQL 17 — pageinspect", note: "La extensión para abrir páginas crudas: page_header, heap_page_items, bt_page_items." }
    ]
  };

})(window.GUIA = window.GUIA || {});
