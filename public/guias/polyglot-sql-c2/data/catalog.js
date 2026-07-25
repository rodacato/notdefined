/* ============================================================================
   data/catalog.js — FUENTE DE VERDAD del catálogo.
   14 temas · 4 bloques. El orden es por dependencia (pedagógico): respétalo.
   Cada ficha lee su folio/dificultad/título de aquí — no lo dupliques.
   Rutas slug-pelón: #/<slug>  (NO por folio).
   ============================================================================ */
(function (G) {
  "use strict";

  // dificultad: 1..3  ·  se pinta como ◆ llenos + ◇ vacíos (◆◇◇ / ◆◆◇ / ◆◆◆)
  // jewel: true SOLO en la ficha 03 (la única joya ★).
  G.catalog = {
    coleccion: "Polyglot",
    autor: "notdefined",
    lengua: "SQL",
    nivel: "C2",
    motor: "PostgreSQL 17 (evaluado julio 2026)",

    bloques: [
      {
        n: 1,
        titulo: "El viaje de un query",
        modelo: {
          nombre: "La mesa de rutas",
          desc: "El planner es un despachador ferroviario que elige la mejor vía entre tablas, igual que un despachador elige riel."
        },
        temas: [
          {
            slug: "pipeline", folio: "01", diff: 1, jewel: false,
            titulo: "El pipeline de ejecución",
            queEs: "Un query cruza 5 etapas: parse → analyze → rewrite → plan → execute."
          },
          {
            slug: "indices", folio: "02", diff: 2, jewel: false,
            titulo: "Índices por dentro",
            queEs: "B-tree, GIN, GiST, BRIN, Hash: estructura y qué puede elegir el planner de cada uno."
          },
          {
            slug: "planner", folio: "03", diff: 3, jewel: true,
            titulo: "El query planner",
            queEs: "Cost-based: estima el costo de cada plan y ejecuta el más barato, no el más obvio."
          },
          {
            slug: "estadisticas", folio: "04", diff: 2, jewel: false,
            titulo: "Estadísticas (pg_stats)",
            queEs: "El planner no adivina: usa histogramas, n_distinct y MCV que ANALYZE recolecta."
          }
        ]
      },
      {
        n: 2,
        titulo: "Concurrencia y versiones",
        modelo: {
          nombre: "El archivo de versiones con lápidas",
          desc: "Cada fila es un documento con copias fechadas de nacimiento y muerte; el conserje pasa después a barrer."
        },
        temas: [
          {
            slug: "mvcc", folio: "05", diff: 3, jewel: false,
            titulo: "MVCC",
            queEs: "Cada UPDATE/DELETE no pisa: crea una versión nueva con xmin y xmax. Los lectores no bloquean escritores."
          },
          {
            slug: "vacuum", folio: "06", diff: 2, jewel: false,
            titulo: "VACUUM y autovacuum",
            queEs: "El conserje que MVCC necesita: recupera espacio, actualiza el visibility map y congela contra el wraparound."
          },
          {
            slug: "aislamiento", folio: "07", diff: 3, jewel: false,
            titulo: "Niveles de aislamiento",
            queEs: "Cómo MVCC implementa Read Committed, Repeatable Read y Serializable (SSI)."
          },
          {
            slug: "locks", folio: "08", diff: 2, jewel: false,
            titulo: "Locks y deadlocks",
            queEs: "Row locks, table locks, advisory locks. Cómo se detecta un deadlock: grafo de espera + timeout."
          }
        ]
      },
      {
        n: 3,
        titulo: "Durabilidad y almacenamiento",
        modelo: {
          nombre: "La bitácora antes del libro mayor",
          desc: "Primero anotas el cambio en la bitácora (WAL); el libro mayor (los archivos de datos) se pone al día después, sin prisa."
        },
        temas: [
          {
            slug: "wal", folio: "09", diff: 3, jewel: false,
            titulo: "WAL (Write-Ahead Log)",
            queEs: "Antes de tocar la página de datos, el cambio se escribe en el WAL: el recovery lo reproduce tras un crash."
          },
          {
            slug: "paginas", folio: "10", diff: 2, jewel: false,
            titulo: "Page layout (páginas de 8KB)",
            queEs: "La unidad física: páginas de 8KB. El header de cada tuple guarda xmin/xmax — el aterrizaje del MVCC."
          },
          {
            slug: "toast", folio: "11", diff: 2, jewel: false,
            titulo: "TOAST",
            queEs: "Cuando una fila no cabe en la página, Postgres comprime y/o mueve los valores grandes a una tabla aparte."
          },
          {
            slug: "buffers", folio: "12", diff: 2, jewel: false,
            titulo: "Buffer manager",
            queEs: "shared_buffers: el caché de páginas en RAM. Evicción por clock-sweep, y el OS page cache detrás."
          }
        ]
      },
      {
        n: 4,
        titulo: "El servidor vivo",
        modelo: {
          nombre: "Un empleado nuevo por cada cliente",
          desc: "El postmaster contrata (forkea) un proceso dedicado por conexión: potente pero caro de contratar."
        },
        temas: [
          {
            slug: "conexiones", folio: "13", diff: 2, jewel: false,
            titulo: "Proceso por conexión",
            queEs: "El postmaster forkea un backend por cada cliente. Por qué a escala el connection pooling no es opcional."
          },
          {
            slug: "extensibilidad", folio: "14", diff: 3, jewel: false,
            titulo: "Extensibilidad",
            queEs: "El motor es extensible por diseño: access methods, tipos, FDWs y extensiones sobre los mismos puntos de extensión."
          }
        ]
      }
    ]
  };

  // Índice plano por slug + orden lineal (para prev/next y lookups).
  G.temasPlano = [];
  G.catalog.bloques.forEach(function (b) {
    b.temas.forEach(function (t) {
      G.temasPlano.push(Object.assign({ bloque: b.n, modelo: b.modelo }, t));
    });
  });
  G.temaPorSlug = function (slug) {
    return G.temasPlano.filter(function (t) { return t.slug === slug; })[0] || null;
  };

})(window.GUIA = window.GUIA || {});
