/* data/catalog.js — LA fuente de verdad del folio: orden, bloques y numeración. */
(function (G) {
  "use strict";

  G.meta = {
    titulo: "SQL dominado",
    coleccion: "Polyglot · notdefined",
    nivel: "SQL · NIVEL C1",
    volumen: "16 temas · 5 bloques",
    dialecto: "PostgreSQL 17",
    ancla: "evaluado con PostgreSQL 17 · jul 2026",
    lede: "El SQL que un junior no escribe: resolver en el motor, en una query declarativa, "
      + "lo que otros resuelven trayéndose las filas y procesándolas en la app. El salto no es "
      + "conocer LATERAL; es dejar de hacer en Ruby lo que el motor hace mejor. "
      + "Dialecto de referencia: PostgreSQL 17 (evaluado julio 2026).",
    camino: "¿Llegas en frío? Calienta con los tres de una línea — la última fila por grupo "
      + "(DISTINCT ON), armar por piezas (CTEs), insertar-o-actualizar (upsert). Son la tesis en "
      + "pequeño: lo que un junior resuelve en la app, tú en una query. Ya con eso, entra a la joya "
      + "(window functions) y deja recursivas y el criterio del motor para la segunda sentada.",
    caminoPasos: [
      { slug: "distinct-on", txt: "la última fila por grupo" },
      { slug: "ctes", txt: "armar por piezas" },
      { slug: "upsert", txt: "insertar-o-actualizar" },
      { slug: "window-functions", txt: "y luego, la joya" }
    ]
  };

  G.catalogo = [
    {
      n: 1,
      titulo: "Consultas que un junior no escribe",
      modelo: {
        titulo: "Modelo mental · deja que el motor haga el trabajo",
        texto: "No te traigas mil filas para numerarlas, rankearlas, compararlas entre sí o paginarlas "
          + "en Ruby — el motor ordena las filas y las relaciona unas con otras mejor que tu loop."
      },
      fichas: ["window-functions", "lateral", "distinct-on", "keyset"]
    },
    {
      n: 2,
      titulo: "Componer y reusar",
      modelo: {
        titulo: "Modelo mental · arma la query por piezas nombradas",
        texto: "Un WITH es como sacar una función: nombras un paso, lo reusas, y la consulta se lee "
          + "de arriba abajo en vez de anidada hacia adentro."
      },
      fichas: ["ctes", "recursivas", "subqueries"]
    },
    {
      n: 3,
      titulo: "Agregar y pivotar",
      modelo: {
        titulo: "Modelo mental · colapsa y reacomoda",
        texto: "Conviertes muchas filas en un resumen (agregar) y filas en columnas (pivotar) — sin "
          + "salir de la query, sin post-proceso."
      },
      fichas: ["group-by", "pivot", "agregados"]
    },
    {
      n: 4,
      titulo: "Escribir datos con criterio",
      modelo: {
        titulo: "Modelo mental · escribir también es declarativo",
        texto: "Le dices al motor el RESULTADO que quieres (inserta-o-actualiza, mueve estas filas, "
          + "dame una de la cola) y él resuelve el cómo — atómico, sin la race condition que sí "
          + "tendrías en la app."
      },
      fichas: ["upsert", "returning", "skip-locked"]
    },
    {
      n: 5,
      titulo: "Las orillas del motor",
      modelo: {
        titulo: "Modelo mental · SQL no termina en tus tablas",
        texto: "Sus tres orillas: otra base (FDW), otro formato dentro de la fila (JSON), y las "
          + "decisiones que el motor te delega (índice, partición, isolation)."
      },
      fichas: ["fdw", "jsonb", "criterio"]
    }
  ];

  /* Orden plano y folio derivado del catálogo — nadie más numera. */
  G.orden = [];
  G.folio = {};
  G.catalogo.forEach(function (bloque) {
    bloque.fichas.forEach(function (slug, i) {
      G.orden.push(slug);
      G.folio[slug] = { numero: bloque.n + "." + (i + 1), bloque: bloque };
    });
  });
})(window.GUIA = window.GUIA || {});
