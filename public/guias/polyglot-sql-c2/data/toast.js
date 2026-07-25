/* ============================================================================
   data/toast.js — Ficha 11 · TOAST.
   ============================================================================ */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas.toast = {
    slug: "toast",

    queEs: [
      "The Oversized-Attribute Storage Technique. Como una tuple no puede cruzar de página (ficha 10), cuando la fila no cabe Postgres comprime los valores grandes y, si aún no alcanza, los <b>manda a vivir a otra tabla</b>.",
      "En la fila queda un puntero de 18 bytes. Es automático, es transparente, y explica por qué un <code>jsonb</code> de 9 MB no vuelve lenta tu tabla."
    ],

    enBreve: [
      "El umbral es <code>TOAST_TUPLE_THRESHOLD</code> ≈ <b>2KB</b> (un cuarto de página). Si la fila lo pasa, el motor comprime y/o mueve valores hasta bajarla de ahí.",
      "Cada tabla con columnas toastables tiene su propia tabla TOAST en el esquema <code>pg_toast</code>, con el valor partido en <b>chunks</b> de ~2KB, cada uno con su índice.",
      "Cuatro estrategias por columna: <code>EXTENDED</code> (default: comprime y mueve), <code>EXTERNAL</code> (mueve sin comprimir — deja rápidos los <code>substring</code>), <code>MAIN</code> (comprime y evita mover), <code>PLAIN</code> (ni una cosa ni la otra).",
      "Compresión: <b>pglz</b> por default, <b>lz4</b> si el binario se compiló con soporte (<code>default_toast_compression</code>). lz4 es mucho más rápido y comprime un poco menos."
    ],

    fundamento: [
      { p: "El límite es duro y viene de la ficha 10: 8KB por página, y una tuple no se parte entre páginas. Un <code>text</code> puede medir un gigabyte. Algo tiene que ceder, y la decisión de diseño fue no complicar el formato de página, sino sacar el problema de ahí: dejar en la fila un puntero y guardar el contenido en una tabla auxiliar, partido en pedazos que sí caben." },
      { p: "El efecto secundario es la mejor parte, y es lo que hay que entender de esta ficha: como el valor grande <b>no está en la página del heap</b>, un <code>SELECT</code> que no menciona esa columna nunca lo lee. La fila queda flaca — 18 bytes por valor toasteado — así que caben muchas más filas por página, y un seq scan sobre las columnas chicas es rápido <em>aunque</em> la tabla tenga terabytes de jsonb colgando." },
      { p: "Lo pagas solo cuando pides el valor: ahí hay que ir a la tabla TOAST, juntar los chunks por su índice y descomprimir. Eso es lo que la gente confunde con «la tabla es lenta»." }
    ],

    comoFunciona: [
      { p: "<b>Dónde vive realmente tu tabla.</b> Esta query es la que abre los ojos:" },
      { code: { tag: "SQL", caption: "el heap es flaco; el TOAST es el gordo", text:
"SELECT c.relname AS tabla,\n" +
"       pg_size_pretty(pg_relation_size(c.oid))       AS heap,\n" +
"       pg_size_pretty(pg_total_relation_size(t.oid)) AS toast,\n" +
"       t.relname AS tabla_toast\n" +
"  FROM pg_class c JOIN pg_class t ON c.reltoastrelid = t.oid\n" +
" WHERE c.relname = 'eventos';\n" +
"\n" +
"  tabla  |  heap  | toast |    tabla_toast\n" +
"---------+--------+-------+--------------------\n" +
" eventos | 210 MB | 38 GB | pg_toast_24601\n" +
"\n" +
"-- SELECT id, creado_en FROM eventos  →  toca 210 MB\n" +
"-- SELECT payload      FROM eventos  →  toca 38 GB\n" +
"-- Misma tabla. Dos órdenes de magnitud de diferencia."
      }},
      { p: "<b>Qué tan grande es un valor, de verdad.</b> <code>pg_column_size</code> te da el tamaño <em>en disco</em>, ya comprimido y con el overhead:" },
      { code: { tag: "SQL", caption: "el valor original vs lo que ocupa", text:
"SELECT pg_size_pretty(octet_length(payload)::bigint)  AS sin_comprimir,\n" +
"       pg_size_pretty(pg_column_size(payload)::bigint) AS en_disco\n" +
"  FROM eventos WHERE id = 1;\n" +
"\n" +
" sin_comprimir | en_disco\n" +
"---------------+----------\n" +
" 9142 kB       | 1842 kB\n" +
"\n" +
"-- Y para ver los chunks en carne viva:\n" +
"SELECT chunk_id, chunk_seq, length(chunk_data)\n" +
"  FROM pg_toast.pg_toast_24601 ORDER BY chunk_id, chunk_seq LIMIT 3;\n" +
"\n" +
" chunk_id | chunk_seq | length\n" +
"----------+-----------+--------\n" +
"    24788 |         0 |   1996\n" +
"    24788 |         1 |   1996\n" +
"    24788 |         2 |   1996"
      }},
      { p: "<b>Elegir la estrategia.</b> El caso de <code>EXTERNAL</code> vale conocerlo: sin comprimir, el motor puede leer solo el pedazo que le pides en vez de traer y descomprimir todo el valor:" },
      { code: { tag: "SQL", caption: "EXTERNAL cuando haces substring de valores grandes", text:
"ALTER TABLE documentos ALTER COLUMN cuerpo SET STORAGE EXTERNAL;\n" +
"\n" +
"-- Con EXTENDED (comprimido): para sacar 100 caracteres hay que traer\n" +
"-- y descomprimir el valor completo.\n" +
"-- Con EXTERNAL: lee solo los chunks que cubren ese rango.\n" +
"SELECT substring(cuerpo, 1, 100) FROM documentos WHERE id = 7;\n" +
"\n" +
"-- Cambiar el compresor (PG14+):\n" +
"ALTER TABLE eventos ALTER COLUMN payload SET COMPRESSION lz4;\n" +
"SHOW default_toast_compression;   --  pglz\n" +
"\n" +
"-- OJO: SET STORAGE y SET COMPRESSION solo aplican a valores NUEVOS.\n" +
"-- Los que ya están guardados no se reescriben."
      }},
      { p: "<b>La trampa del índice.</b> Un valor toasteado no se puede indexar con B-tree si pasa de ~2,700 bytes: te lo dice de frente. Para eso está indexar un hash del valor, o un GIN sobre el contenido (ficha 02):" },
      { code: { tag: "SQL", caption: "el error que se topa todo el que indexa texto largo", text:
"CREATE INDEX ON documentos (cuerpo);\n" +
"ERROR:  index row requires 8280 bytes, maximum size is 8191\n" +
"\n" +
"-- Las salidas:\n" +
"CREATE INDEX ON documentos (md5(cuerpo));                    -- igualdad exacta\n" +
"CREATE INDEX ON documentos USING gin (to_tsvector('spanish', cuerpo));  -- búsqueda"
      }}
    ],

    cuandoDuele: {
      sym: "Síntoma: SELECT * es 200 veces más lento que nombrar las columnas",
      paras: [
        "El endpoint de listado tarda ocho segundos para devolver cincuenta filas. El plan dice <code>Index Scan</code> y trae cincuenta filas. Nada en el <code>EXPLAIN</code> se ve mal, porque el costo del desTOASTeo <b>no aparece en el plan</b>.",
        "El <code>SELECT *</code> está trayendo, juntando chunks y descomprimiendo cincuenta blobs de 9 MB que a nadie le interesaban. La cura es de una línea: <b>nombra las columnas</b>. Es la razón más concreta y menos discutible para no usar <code>SELECT *</code> en producción — y la que nadie menciona cuando debate el tema."
      ]
    },

    mito: {
      claim: "un text/jsonb gigante hace lenta toda la tabla",
      truth: "Falso. El valor grande <b>no está en la tabla</b>: vive en su propia tabla TOAST, y en la fila solo hay un puntero de 18 bytes. Tu heap queda flaco, caben más filas por página y los scans sobre las columnas chicas vuelan. <b>Solo lo pagas cuando lo lees</b> — y ahí sí, lo pagas caro.",
      more: [
        { html: "<b>«Guardar jsonb grande es siempre mala idea.»</b> Depende de si lo consultas. Como carga útil que se lee por id, TOAST lo maneja perfecto. Como algo que filtras y agregas en cada query, sí es mala idea." },
        { html: "<b>«Si comprimo yo antes de guardar, ahorro.»</b> Casi nunca: guardar un <code>bytea</code> ya comprimido impide que TOAST comprima (pierde el tiempo intentándolo) y te quita la posibilidad de indexar el contenido." }
      ]
    },

    recursos: [
      { kind: "Docs oficiales", title: "PostgreSQL 17 — TOAST (73.2)", note: "El umbral, las cuatro estrategias, los compresores y el formato del puntero. Corto y completo." },
      { kind: "Docs oficiales", title: "PostgreSQL 17 — ALTER TABLE ... SET STORAGE / COMPRESSION", note: "Cómo se cambia por columna, y la advertencia de que solo aplica a valores nuevos." },
      { kind: "Libro", title: "The Internals of PostgreSQL — Hironobu Suzuki", note: "Cap. 1.4: cómo se parte un valor en chunks y cómo se reconstruye al leerlo." }
    ]
  };

})(window.GUIA = window.GUIA || {});
