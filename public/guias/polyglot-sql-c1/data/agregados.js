/* data/agregados.js — 3.3 Ordered-set & array aggregates */
(function (G) {
  "use strict";
  G.registrarFicha({
    slug: "agregados",
    titulo: "Agregados ordenados y de arreglo",
    dificultad: 3,
    queEs: "Los agregados que dependen del orden: percentiles y moda con WITHIN GROUP, y los que colapsan "
      + "filas en una estructura — array_agg, string_agg, jsonb_agg — con su propio ORDER BY.",
    enBreve: [
      { k: "Ordered-set", v: "<code>percentile_cont(f) WITHIN GROUP (ORDER BY x)</code> interpola; <code>percentile_disc(f)</code> devuelve un valor existente. Ambos son ANSI." },
      { k: "Mediana", v: "No hay función <code>median()</code> en Postgres: es <code>percentile_cont(0.5) WITHIN GROUP (ORDER BY x)</code>." },
      { k: "Varios a la vez", v: "<code>percentile_cont(ARRAY[0.5, 0.95, 0.99])</code> devuelve un arreglo en una sola pasada — no repitas el agregado tres veces." },
      { k: "Orden interno", v: "<code>array_agg(x ORDER BY y)</code>, <code>string_agg(x, ', ' ORDER BY x)</code>. Sin ese <code>ORDER BY</code> el orden NO está garantizado." }
    ],
    fundamento: "<p>«El promedio miente» es la queja de todo dashboard, y la respuesta es un percentil. Que la mediana "
      + "«no se pueda en SQL» es folklore de gente que solo probó <code>avg()</code>: los agregados de conjunto ordenado "
      + "existen en el estándar y en Postgres desde 9.4.</p>"
      + "<p>La sintaxis se lee raro la primera vez porque el argumento del agregado va en dos lugares: la fracción en "
      + "los paréntesis y la expresión ordenada en <code>WITHIN GROUP</code>. Es literal: «calcula el percentil 0.5 "
      + "<em>dentro del grupo ordenado por</em> duración».</p>"
      + "<p>El otro grupo — <code>array_agg</code>, <code>string_agg</code>, <code>jsonb_agg</code>, "
      + "<code>jsonb_object_agg</code> — es el que borra la mitad de tu código de post-proceso: en vez de traerte 400 "
      + "filas para agruparlas en un hash en Ruby, devuelves una fila por padre con sus hijos ya empaquetados y "
      + "ordenados.</p>",
    comoFunciona: [
      {
        nota: "Mediana, p95 y moda por grupo. Los tres percentiles en una pasada, con arreglo.",
        sql: "SELECT ruta,\n       percentile_cont(0.5)  WITHIN GROUP (ORDER BY ms) AS p50,\n       percentile_cont(ARRAY[0.95, 0.99]) WITHIN GROUP (ORDER BY ms) AS p95_p99,\n       mode() WITHIN GROUP (ORDER BY status) AS status_mas_comun\nFROM requests GROUP BY ruta;\n-- => 1 fila por ruta: p50 = 84, p95_p99 = {412,980}, status = 200"
      },
      {
        nota: "Colapsar hijos en una lista ordenada: adiós al hash de agrupación en la app.",
        sql: "SELECT c.nombre,\n       string_agg(p.sku, ', ' ORDER BY p.sku) AS skus,\n       array_agg(p.precio ORDER BY p.precio DESC) AS precios\nFROM categorias c JOIN productos p ON p.categoria_id = c.id\nGROUP BY c.nombre;\n-- => Bebidas | 'AGU-1, CAF-3, JUG-2, TEE-9' | {189,145,32,28}"
      },
      {
        nota: "Agregar en JSON: una fila por pedido, con sus renglones ya anidados y ordenados.",
        sql: "SELECT p.id,\n       jsonb_agg(jsonb_build_object('sku', r.sku, 'cant', r.cantidad)\n                 ORDER BY r.sku) AS renglones\nFROM pedidos p JOIN renglones r ON r.pedido_id = p.id\nGROUP BY p.id;\n-- => 1 fila por pedido: [{\"sku\":\"A-1\",\"cant\":2},{\"sku\":\"B-7\",\"cant\":1}]"
      },
      {
        nota: "<code>percentile_disc</code> vs <code>_cont</code>: el discreto devuelve un valor que existe en los datos.",
        sql: "SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY x) AS interpolado,\n       percentile_disc(0.5) WITHIN GROUP (ORDER BY x) AS existente\nFROM (VALUES (10), (20), (30), (40)) t(x);\n-- => 25 | 20"
      }
    ],
    widget: "percentiles",
    cuandoNo: "<p><code>percentile_cont</code> sobre millones de filas sin índice recorre y ordena: es un sort de todo "
      + "el conjunto por grupo, y se nota.</p>"
      + "<p>Si necesitas percentiles aproximados a escala, eso ya es tuning — estimadores tipo t-digest o "
      + "<code>hll</code>, muestreo, o materializar el agregado — no SQL de todos los días. Y con "
      + "<code>string_agg</code>/<code>array_agg</code> cuida el tamaño: agregar 50 000 hijos en un arreglo devuelve "
      + "una fila gigante que tu driver va a tener que materializar completa.</p>",
    mito: {
      creencia: "la mediana o los percentiles no se pueden en SQL, o necesitas traerte todo y calcularlos en código",
      veredicto: "falso",
      realidad: "<code>percentile_cont(0.5) WITHIN GROUP (ORDER BY x)</code> da la mediana; <code>mode()</code> el más "
        + "frecuente; <code>array_agg</code>/<code>string_agg</code>/<code>jsonb_agg</code> juntan filas en un arreglo, "
        + "texto o JSON ordenado."
    },
    recursos: [
      { titulo: "PostgreSQL 17 · Aggregate Functions", nota: "La tabla completa: agregados normales, de conjunto ordenado e hipotéticos.", url: "https://www.postgresql.org/docs/17/functions-aggregate.html" },
      { titulo: "modern-sql.com · WITHIN GROUP y ordered-set aggregates", nota: "Winand: qué es estándar aquí y qué inventó cada motor.", url: "https://modern-sql.com/feature/within-group" },
      { titulo: "PGConf · Percentiles y agregados a escala", nota: "Material de charlas sobre estimadores aproximados (t-digest, HLL) cuando el sort ya no cabe.", url: "https://www.postgresql.org/about/events/" }
    ]
  });
})(window.GUIA = window.GUIA || {});
