/* data/fichas-oltp.js — Familia «Fila por fila» (OLTP).
   Cada ficha alimenta la vista de detalle y, cuando aplica, el simulador. */
(function (G) {
  'use strict';
  G.fichas = G.fichas || {};

  G.fichas['relacional'] = {
    queEs: 'El estándar de la industria desde hace 40 años y sigue ganando. Datos en tablas de filas y columnas con esquema fijo, relaciones por llaves foráneas y garantías ACID.',
    comoGuarda: 'Cada fila se guarda completa y contigua en una página de disco (row store): todos los campos de un registro viven juntos. Un B-tree por índice ordena las llaves y apunta a la página donde vive la fila. Traer un registro por su llave primaria es un puñado de saltos de árbol y una lectura contigua.',
    modeloConsulta: 'SQL. Declaras qué quieres, el planificador decide cómo. Joins, transacciones multi-tabla, constraints y vistas. El motor te cuida la integridad.',
    gana: ['Point lookups y updates por llave: rapidísimos', 'ACID de verdad: transacciones que no te mienten', 'Joins y constraints: el modelo te obliga a ser consistente', 'Ecosistema y talento infinitos'],
    paga: ['Escalar escrituras más allá de una máquina es doloroso', 'El esquema rígido pelea con datos que cambian de forma', 'Agregaciones sobre tablas anchas arrastran columnas que no pediste'],
    cuandoNo: ['Analítica sobre miles de millones de filas (ahí manda columnar)', 'Escritura masiva multi-región sin un solo líder', 'Cuando el dato es genuinamente sin forma y cambia cada request'],
    parientes: 'Es pariente de casi todo: NewSQL es «relacional que además escala en horizontal», columnar es «relacional que guarda por columna». La confusión típica es creer que Postgres «no aguanta»: con jsonb, pgvector y particiones aguanta más de lo que crees.',
    arquetipo: 'PostgreSQL es la respuesta por defecto (jsonb, extensiones, pgvector, particiones nativas). MySQL/MariaDB para el mundo LAMP. SQL Server y Oracle si ya vives ahí. Empieza en Postgres; sal cuando un número concreto te duela.',
    ratings: { point: 6, write: 4, analytics: 4, horiz: 3, schema: 3, tx: 7, ops: 5 },
    dolores: ['clave-ms', 'relaciones', 'sin-operar'],
    veredicto: 'Si dudas, es esta. La carga de la prueba la tiene quien quiere usar otra cosa.'
  };

  G.fichas['embebida'] = {
    queEs: 'La base de datos que no es un servidor: es una librería y un archivo. Corre dentro de tu proceso, sin red, sin puerto, sin nada que administrar.',
    comoGuarda: 'Un solo archivo en disco con páginas de filas y sus B-trees, igual que un relacional clásico — pero abierto directo por tu proceso vía mmap/lecturas de archivo, sin proceso servidor de por medio. La transacción se sincroniza al disco local.',
    modeloConsulta: 'SQL completo (SQLite habla casi todo el estándar). Las lee tu propio proceso; no hay latencia de red porque no hay red.',
    gana: ['Cero operación: no hay servidor que caiga', 'Rapidísima para lecturas locales (sin round-trip de red)', 'Portátil: el archivo se copia, se versiona, se manda por correo', 'Perfecta para tests, apps de escritorio/móvil, y edge'],
    paga: ['Una sola escritora concurrente: no es para carga multi-usuario alta', 'No escala horizontal — vive en una máquina', 'La concurrencia de escritura es su techo natural'],
    cuandoNo: ['Backend con muchas escrituras concurrentes de muchos clientes', 'Cuando necesitas que varios servidores vean el mismo dato en vivo'],
    parientes: 'Pariente directa del relacional (comparte el modelo y SQL). No la confundas con «base de datos de juguete»: SQLite corre en miles de millones de dispositivos. DuckDB es su prima analítica embebida (columnar, para OLAP local).',
    arquetipo: 'SQLite para OLTP embebido y aplicaciones. DuckDB cuando lo embebido es analítico (leer parquet, agregaciones locales). LiteFS/Turso si quieres SQLite replicado al edge.',
    ratings: { point: 6, write: 3, analytics: 4, horiz: 0, schema: 3, tx: 6, ops: 7 },
    dolores: ['clave-ms', 'sin-operar'],
    veredicto: 'La base de datos más subestimada del mundo. Para muchas apps, «servidor de base de datos» es sobre-ingeniería.'
  };

  G.fichas['newsql'] = {
    queEs: 'SQL y ACID que además escalan en horizontal y sobreviven a que se caiga una región entera. Te dan la interfaz relacional sin el techo de una sola máquina.',
    comoGuarda: 'Las filas se parten en rangos de llaves (shards) repartidos por muchos nodos; cada rango se replica con consenso (Raft/Paxos) entre 3+ réplicas. La escritura viaja al líder del rango, se acuerda por quórum y se aplica de forma consistente en todas las copias.',
    modeloConsulta: 'SQL, casi siempre compatible con Postgres. Transacciones distribuidas serializables — el motor coordina el consenso por ti; tú escribes SQL normal.',
    gana: ['Escala escrituras y lecturas sumando nodos', 'Sobrevive a la caída de un nodo o una región sin perder datos', 'Consistencia fuerte a escala (lo raro de conseguir)', 'Sigue siendo SQL: no reaprendes el modelo'],
    paga: ['Latencia extra por el consenso entre nodos (habla el quórum)', 'Operación compleja: es un sistema distribuido de verdad', 'Cuesta más que un Postgres solo para el mismo volumen chico'],
    cuandoNo: ['Cuando un Postgres con réplicas de lectura ya te alcanza (casi siempre)', 'Cargas chicas donde el consenso solo agrega latencia'],
    parientes: 'Se confunde con «réplicas de lectura de Postgres»: aquellas escalan LECTURAS con un solo primario que escribe; NewSQL escala ESCRITURAS con múltiples líderes por rango. Distinta bestia. Pariente del relacional en interfaz, del wide-column en distribución.',
    arquetipo: 'CockroachDB (Postgres-wire, autohospedable). Spanner (Google, la referencia, con reloj atómico). YugabyteDB y TiDB como alternativas. No empieces aquí: llega aquí cuando un solo primario ya no da.',
    ratings: { point: 5, write: 5, analytics: 3, horiz: 7, schema: 3, tx: 6, ops: 3 },
    dolores: ['consistencia', 'relaciones'],
    veredicto: 'La respuesta correcta a un problema que casi nadie tiene todavía. Confirma que de verdad lo tienes antes de pagar la complejidad.'
  };
})(window.GUIA = window.GUIA || {});
