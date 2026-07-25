/* data/criterio.js — 5.3 El criterio que el motor te delega (digest) */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "criterio",
    titulo: "El criterio que el motor te delega",
    dificultad: 3,
    queEs: "Digest de tres decisiones senior que el motor NO toma por ti: qué índice, si particionar, y qué "
      + "nivel de aislamiento. Cada una con su regla de corte, no con su mecanismo.",
    enBreve: [
      { k: "Índice", v: "Sale de LEER el <code>EXPLAIN (ANALYZE, BUFFERS)</code> de TU query: <em>Rows Removed by Filter</em> y la diferencia entre <code>rows</code> estimadas y reales son el diagnóstico." },
      { k: "Orden en el compuesto", v: "Columnas de igualdad primero, la de rango al final. <code>(status, creado)</code> sirve para <code>status = … AND creado &gt; …</code>; <code>(creado, status)</code> no." },
      { k: "Partición", v: "Solo con un patrón de acceso que la aproveche (podar por fecha, archivar en bloque). Abajo de decenas de millones de filas, «por si crece» es complejidad sin pago." },
      { k: "Isolation", v: "Read Committed (el default) cubre casi todo. Serializable solo si hay write-skew real Y vas a manejar los <code>serialization_failure</code> con retry." }
    ],
    fundamento: "<p>Estas tres son las decisiones donde el motor te dice «tú dime». No hay una respuesta correcta "
      + "universal, y por eso circula tanto folklore: se copia la receta del blog en vez de leer la salida que ya "
      + "tienes enfrente.</p>"
      + "<p><strong>Índice.</strong> La pregunta no es «¿qué índices debería tener esta tabla?» sino «¿qué necesita "
      + "ESTA query?». El <code>EXPLAIN (ANALYZE, BUFFERS)</code> te lo dice casi literal: si ves un Seq Scan con "
      + "millones de <em>Rows Removed by Filter</em>, ahí falta un índice; si ves un Index Scan seguido de un filtro "
      + "que tira el 99%, el índice existe pero le falta una columna. Cada índice extra cuesta escritura, espacio y "
      + "vacuum — el correcto, no muchos.</p>"
      + "<p><strong>Partición.</strong> Particionar no acelera nada por sí solo: acelera si tus queries permiten "
      + "<em>podar</em> particiones (filtran por la llave de partición) o si te resuelve el ciclo de vida (soltar un "
      + "mes entero con <code>DETACH</code> en vez de un <code>DELETE</code> de 40 millones de filas). Sin uno de esos "
      + "dos, solo compraste una capa de planeación más lenta y un montón de índices locales.</p>"
      + "<p><strong>Isolation.</strong> Read Committed te protege de leer basura a medio commit, y con "
      + "<code>SELECT … FOR UPDATE</code> o <code>ON CONFLICT</code> resuelves la mayoría de las carreras puntuales. "
      + "Serializable es la respuesta cuando la invariante cruza filas — dos transacciones que leen y luego escriben "
      + "cosas distintas y juntas rompen una regla — y su precio es que tu app tiene que reintentar.</p>",
    comoFunciona: [
      {
        nota: "El diagnóstico: la línea que te dice que falta un índice es <em>Rows Removed by Filter</em>.",
        sql: "EXPLAIN (ANALYZE, BUFFERS)\nSELECT id FROM pedidos WHERE status = 'pendiente' AND creado > '2026-07-01';\n-- => Seq Scan on pedidos … rows=360 loops=1\n--    Rows Removed by Filter: 1999640\n--    Execution Time: 812.4 ms"
      },
      {
        nota: "El índice correcto: igualdad primero, rango después. Y verificar que el plan cambió.",
        sql: "CREATE INDEX idx_pedidos_status_creado ON pedidos (status, creado);\n-- => Index Scan using idx_pedidos_status_creado … Execution Time: 1.4 ms"
      },
      {
        nota: "Partición que sí paga: poda por fecha y archivado por <code>DETACH</code>, no <code>DELETE</code>.",
        sql: "CREATE TABLE eventos (id bigint, creado date) PARTITION BY RANGE (creado);\nCREATE TABLE eventos_2026_07 PARTITION OF eventos\n  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');\n\nEXPLAIN SELECT count(*) FROM eventos WHERE creado >= '2026-07-01';\n-- => Append (1 partición escaneada de 24)  ← la poda es el beneficio\n\nALTER TABLE eventos DETACH PARTITION eventos_2025_07;  -- archivar en O(1)"
      },
      {
        nota: "Serializable: la invariante cruza filas, y el precio es el retry.",
        sql: "BEGIN ISOLATION LEVEL SERIALIZABLE;\n  SELECT count(*) FROM guardias WHERE dia = '2026-08-01' AND activo;\n  UPDATE guardias SET activo = false WHERE id = 9;   -- «siempre 1 de guardia»\nCOMMIT;\n-- => ERROR: could not serialize access due to read/write dependencies\n--    (tu app reintenta la transacción completa)"
      }
    ],
    widget: "explain",
    cuandoNo: "<p>No agregues un índice «porque la columna sale en el <code>WHERE</code>»: agrégalo cuando el "
      + "<code>EXPLAIN</code> de una query que te importa lo pida, y bórralo cuando <code>pg_stat_user_indexes</code> "
      + "diga que nadie lo usa.</p>"
      + "<p>No particiones abajo de decenas de millones de filas sin un patrón de poda o de archivado. Y no subas a "
      + "Serializable como «modo seguro» global: si tu código no reintenta los aborts, cambiaste un bug de datos raro "
      + "por errores 500 frecuentes.</p>",
    mito: {
      creencia: "agrego índices hasta que deje de doler",
      veredicto: "falso",
      realidad: "Cada índice cuesta escritura, espacio y mantenimiento; el índice CORRECTO para tu query sale del "
        + "<code>EXPLAIN</code>, no de rociar. El POR QUÉ el planner elige un scan u otro es C2 — aquí la decisión es "
        + "«¿lo agrego o no?»."
    },
    recursos: [
      { titulo: "Use The Index, Luke!", nota: "El libro de Winand sobre índices, orden de columnas y por qué tu WHERE no los usa.", url: "https://use-the-index-luke.com/" },
      { titulo: "PostgreSQL 17 · Using EXPLAIN", nota: "Cómo leer el plan: costos, filas estimadas vs reales, BUFFERS.", url: "https://www.postgresql.org/docs/17/using-explain.html" },
      { titulo: "PostgreSQL 17 · Transaction Isolation", nota: "Los tres niveles reales de PG, con los fenómenos que cada uno previene y los aborts que trae.", url: "https://www.postgresql.org/docs/17/transaction-iso.html" }
    ]
  });
})(window.GUIA = window.GUIA || {});
