/* ============================================================================
   1001 — Arquitecturas · data/catalogo.js — CONTENIDO (guión, no motor)
   ----------------------------------------------------------------------------
   Este archivo solo trae CONTENIDO: familias, estilos del catálogo, problemas,
   comparaciones y las escalas/ejes compartidos. La mecánica (render, filtros,
   rutas) vive en js/. Criterio de éxito: corregir o agregar texto del catálogo
   debe requerir tocar SOLO este archivo (o data/fichas-<familia>.js para las fichas
   profundas de cada familia).

   Cómo agregar un estilo nuevo al catálogo:
     1. Añade una entrada a ARCHS con: n, id, name, family (id de FAMILIES),
        scale ('large'|'mid'|'small'), primary (clave de VIEWS), force, avoid,
        y fit { team, scaleParts, domain, consistency }. star:true lo destaca.
     2. Si quieres ficha profunda + diagrama, agrégala en data/fichas-<familia>.js
        y marca hasFicha/hasDiagrama aquí.
   ========================================================================== */
(function (G) {
  // --- Metadatos de portada -------------------------------------------------
  const META = {
    titulo: "Arquitecturas de software",
    edicion: "Edición 2026 · Tomo I",
    conteo: "21 estilos · 5 familias",
    tesis:
      "Un almanaque de estilos. Cada uno nació de una PRESIÓN y cobra un PRECIO — " +
      "no hay free lunch. Empieza por el problema, no por el nombre.",
  };

  // --- Familias (conciernen preguntas ORTOGONALES, no rivales) --------------
  // color: tinte terroso de la familia (var --fam-N en styles.css).
  const FAMILIES = [
    { numero: 1, id: "despliegue", name: "Despliegue",
      q: "¿En cuántas unidades desplegables vive el sistema?",
      sub: "Estilo de runtime — de un artefacto a muchos procesos." },
    { numero: 2, id: "interna", name: "Organización interna",
      q: "¿Cómo se ordena el código dentro de una unidad?",
      sub: "Capas y fronteras puertas adentro de un servicio." },
    { numero: 3, id: "comunicacion", name: "Comunicación",
      q: "¿Cómo hablan las partes entre sí?",
      sub: "Llamadas, puertas de enlace, eventos y colas." },
    { numero: 4, id: "distribuidos", name: "Distribuidos",
      q: "¿Cómo se reparte el trabajo y el dato en la red?",
      sub: "Patrones a escala de sistema repartido." },
    { numero: 5, id: "codigo", name: "Organización del código",
      q: "¿En cuántos repositorios vive el código?",
      sub: "Estrategia de repos — independiente del runtime." },
  ];

  // --- Vistas primarias de la serie ----------------------------------------
  const VIEWS = {
    limites: "Límites",
    topologia: "Topología",
    flujo: "Flujo",
    tradeoffs: "Trade-offs",
    evolucion: "Evolución",
  };

  // --- Escala de prominencia en el catálogo ---------------------------------
  // large ★ · mid ◐ · small ○  (qué tan central es el estilo)
  const SCALE = {
    large: { glyph: "★", label: "gran escala" },
    mid:   { glyph: "◐", label: "escala media" },
    small: { glyph: "○", label: "escala pequeña" },
  };

  // --- Ejes fijos de trade-offs (para las fichas profundas) -----------------
  // El eje `ops` (complejidad operativa) es COSTO: más alto = se paga más.
  const AXES = [
    { key: "indep",  label: "Indep. de despliegue" },
    { key: "ops",    label: "Complejidad operativa", cost: true },
    { key: "lat",    label: "Latencia / rendimiento" },
    { key: "team",   label: "Autonomía de equipos" },
    { key: "cons",   label: "Consistencia de datos" },
    { key: "scale",  label: "Costo y escalabilidad" },
    { key: "change", label: "Facilidad de cambio" },
  ];

  // --- Prominencia de la ficha profunda (glifo del set del Tomo I) ----------
  const PROM = {
    esencial:    { glyph: "★", label: "esencial · por defecto" },
    situacional: { glyph: "◐", label: "situacional" },
    nicho:       { glyph: "○", label: "nicho · avanzado" },
  };

  // --- Los 21 estilos del catálogo ------------------------------------------
  // fit: para el filtro POR PROBLEMA · hasFicha/hasDiagrama: si data/fichas-<familia>
  // trae la ficha profunda y su diagrama de topología.
  const ARCHS = [
    // ---- 1 · DESPLIEGUE ----------------------------------------------------
    { n: "01", id: "monolito", name: "Monolito", family: "despliegue", scale: "small",
      primary: "limites", hasFicha: true, hasDiagrama: true,
      force: "Empezar sin fricción: un artefacto, un deploy, una base de datos.",
      avoid: "El equipo crece y todos se pisan en el mismo release.",
      fit: { team: ["small", "mid"], scaleParts: false, domain: "any", consistency: "strong" } },

    { n: "02", id: "monolito-modular", name: "Monolito modular", family: "despliegue", scale: "mid",
      primary: "limites", hasFicha: true, hasDiagrama: true,
      force: "El monolito creció; urgen fronteras internas antes de partirlo.",
      avoid: "Partes con cargas tan dispares que exigen escalar por separado.",
      fit: { team: ["small", "mid", "large"], scaleParts: false, domain: "stable", consistency: "strong" } },

    { n: "03", id: "microservicios", name: "Microservicios", family: "despliegue", scale: "large",
      primary: "topologia", star: true, hasFicha: true, hasDiagrama: true,
      force: "Equipos numerosos que se bloquean entre sí en un único deploy.",
      avoid: "Equipo chico, dominio aún difuso o necesidad de consistencia fuerte.",
      fit: { team: ["large"], scaleParts: true, domain: "stable", consistency: "eventual" } },

    { n: "04", id: "serverless", name: "Serverless · FaaS", family: "despliegue", scale: "mid",
      primary: "flujo", hasFicha: true, hasDiagrama: true,
      force: "Carga intermitente: pagar solo por ejecución, sin servidores ociosos.",
      avoid: "Procesos largos, latencia en frío crítica o estado pesado en memoria.",
      fit: { team: ["small", "mid"], scaleParts: true, domain: "any", consistency: "eventual" } },

    // ---- 2 · ORGANIZACIÓN INTERNA -----------------------------------------
    { n: "05", id: "capas", name: "Capas (N-capas)", family: "interna", scale: "small",
      primary: "limites", hasFicha: true, hasDiagrama: true,
      force: "Separar presentación, lógica y datos sin ceremonia.",
      avoid: "La lógica se filtra entre capas y todo termina dependiendo de la DB.",
      fit: { team: "any", scaleParts: false, domain: "any", consistency: "strong" } },

    { n: "06", id: "hexagonal", name: "Hexagonal", family: "interna", scale: "mid",
      primary: "limites", star: true,
      force: "Aislar el dominio de la infraestructura que cambia debajo.",
      avoid: "CRUD simple donde los puertos y adaptadores son pura ceremonia.",
      fit: { team: ["mid", "large"], scaleParts: false, domain: "stable", consistency: "strong" } },

    { n: "07", id: "clean", name: "Clean · Cebolla", family: "interna", scale: "mid",
      primary: "limites", hasFicha: true, hasDiagrama: true,
      force: "Reglas de negocio que sobreviven a frameworks y bases de datos.",
      avoid: "Equipo sin disciplina para sostener la regla de dependencias.",
      fit: { team: ["mid", "large"], scaleParts: false, domain: "stable", consistency: "strong" } },

    { n: "08", id: "vertical-slices", name: "Vertical Slices", family: "interna", scale: "mid",
      primary: "flujo", hasFicha: true, hasDiagrama: true,
      force: "Organizar por caso de uso completo, no por capa técnica.",
      avoid: "Mucha lógica compartida que la división por feature termina duplicando.",
      fit: { team: ["mid", "large"], scaleParts: false, domain: "exploring", consistency: "any" } },

    { n: "09", id: "microkernel", name: "Microkernel · Plugins", family: "interna", scale: "mid",
      primary: "limites", hasFicha: true, hasDiagrama: true,
      force: "Un núcleo estable con capacidades que entran como extensiones.",
      avoid: "Dominio que aún no estabiliza qué es núcleo y qué es plugin.",
      fit: { team: ["mid", "large"], scaleParts: false, domain: "stable", consistency: "strong" } },

    // ---- 3 · COMUNICACIÓN --------------------------------------------------
    { n: "10", id: "cliente-servidor", name: "Cliente-Servidor", family: "comunicacion", scale: "small",
      primary: "flujo", hasFicha: true, hasDiagrama: true,
      force: "Pedir y responder: el contrato más directo entre dos partes.",
      avoid: "Muchos consumidores acoplados al mismo servicio síncrono.",
      fit: { team: "any", scaleParts: false, domain: "any", consistency: "strong" } },

    { n: "11", id: "api-gateway", name: "API Gateway · BFF", family: "comunicacion", scale: "mid",
      primary: "flujo", hasFicha: true, hasDiagrama: true,
      force: "Una puerta única ante muchos servicios y muchos clientes.",
      avoid: "Un solo cliente y dos servicios: el gateway sobra.",
      fit: { team: ["mid", "large"], scaleParts: true, domain: "stable", consistency: "any" } },

    { n: "12", id: "pub-sub", name: "Publicación-Suscripción", family: "comunicacion", scale: "mid",
      primary: "topologia", hasFicha: true, hasDiagrama: true,
      force: "Desacoplar emisor y receptor: que no necesiten conocerse.",
      avoid: "Flujo que exige respuesta inmediata y orden estricto.",
      fit: { team: ["mid", "large"], scaleParts: true, domain: "any", consistency: "eventual" } },

    { n: "13", id: "eda", name: "Dirigida por eventos", family: "comunicacion", scale: "large",
      primary: "flujo", star: true,
      force: "Reaccionar a hechos ya ocurridos, no orquestar llamadas.",
      avoid: "Equipo sin tooling para depurar flujos asíncronos y reintentos.",
      fit: { team: ["mid", "large"], scaleParts: true, domain: "stable", consistency: "eventual" } },

    { n: "14", id: "pipes-filters", name: "Tubería y filtros", family: "comunicacion", scale: "small",
      primary: "flujo", hasFicha: true, hasDiagrama: true,
      force: "Procesar un flujo en etapas componibles e independientes.",
      avoid: "Pasos con mucho ir y venir de estado entre etapas.",
      fit: { team: "any", scaleParts: false, domain: "any", consistency: "any" } },

    // ---- 4 · DISTRIBUIDOS --------------------------------------------------
    { n: "15", id: "soa", name: "SOA", family: "distribuidos", scale: "mid",
      primary: "limites", hasFicha: true, hasDiagrama: true,
      force: "Servicios de negocio reutilizables a escala de empresa.",
      avoid: "Un bus central que se vuelve el nuevo monolito acoplado.",
      fit: { team: ["large"], scaleParts: true, domain: "stable", consistency: "eventual" } },

    { n: "16", id: "cqrs", name: "CQRS", family: "distribuidos", scale: "mid",
      primary: "flujo", hasFicha: true, hasDiagrama: true,
      force: "Leer y escribir tienen cargas y formas muy distintas.",
      avoid: "CRUD parejo donde separar comando y consulta solo agrega piezas.",
      fit: { team: ["mid", "large"], scaleParts: true, domain: "stable", consistency: "eventual" } },

    { n: "17", id: "event-sourcing", name: "Event Sourcing", family: "distribuidos", scale: "mid",
      primary: "evolucion", hasFicha: true, hasDiagrama: true,
      force: "El historial de cambios ES la fuente de verdad, no el estado actual.",
      avoid: "No se necesita auditoría ni rebobinar: basta el último estado.",
      fit: { team: ["mid", "large"], scaleParts: true, domain: "stable", consistency: "eventual" } },

    { n: "18", id: "saga", name: "Saga", family: "distribuidos", scale: "mid",
      primary: "flujo", hasFicha: true, hasDiagrama: true,
      force: "Transacciones que cruzan servicios sin un commit de dos fases.",
      avoid: "Todo cabe en una sola base: una transacción ACID basta.",
      fit: { team: ["large"], scaleParts: true, domain: "stable", consistency: "eventual" } },

    { n: "19", id: "space-based", name: "Espacio compartido", family: "distribuidos", scale: "large",
      primary: "topologia", hasFicha: true, hasDiagrama: true,
      force: "Picos de carga extremos sin la base de datos como cuello de botella.",
      avoid: "Carga modesta y predecible: la complejidad no se paga sola.",
      fit: { team: ["large"], scaleParts: true, domain: "stable", consistency: "eventual" } },

    // ---- 5 · ORGANIZACIÓN DEL CÓDIGO --------------------------------------
    { n: "20", id: "monorepo", name: "Monorepo", family: "codigo", scale: "mid",
      primary: "limites", hasFicha: true, hasDiagrama: true,
      force: "Un cambio atómico que cruza muchos módulos a la vez.",
      avoid: "Sin tooling de build incremental, todo se vuelve lento.",
      fit: { team: "any", scaleParts: false, domain: "any", consistency: "any" } },

    { n: "21", id: "polyrepo", name: "Polyrepo", family: "codigo", scale: "mid",
      primary: "limites", hasFicha: true, hasDiagrama: true,
      force: "Equipos que liberan en su propio calendario, sin pedir permiso.",
      avoid: "Cambios que cruzan repos y exigen coordinar muchos PRs.",
      fit: { team: ["mid", "large"], scaleParts: true, domain: "stable", consistency: "any" } },
  ];

  // --- Filtro POR PROBLEMA — cada dolor ilumina los estilos que lo atacan ---
  // hits: ids de ARCHS. Los `backticks` marcan término técnico inline.
  const PROBLEMS = [
    { id: "deploy-bloqueo",      label: "Mi equipo se pisa en cada release",       hits: ["monolito-modular", "microservicios", "polyrepo"] },
    { id: "cargas-dispares",     label: "Partes con cargas muy dispares",          hits: ["microservicios", "serverless", "cqrs", "space-based"] },
    { id: "dominio-difuso",      label: "El dominio todavía cambia mucho",         hits: ["monolito", "vertical-slices", "serverless"] },
    { id: "consistencia-fuerte", label: "Necesito consistencia fuerte",            hits: ["monolito", "capas", "hexagonal", "clean"] },
    { id: "aislar-dominio",      label: "Aislar el dominio de la infraestructura", hits: ["hexagonal", "clean", "microkernel"] },
    { id: "picos",               label: "Picos de carga extremos",                 hits: ["serverless", "space-based", "eda", "pub-sub"] },
    { id: "muchos-clientes",     label: "Muchos clientes y canales distintos",     hits: ["api-gateway", "cliente-servidor", "eda"] },
    { id: "desacoplar",          label: "Desacoplar quién habla con quién",        hits: ["pub-sub", "eda", "pipes-filters", "saga"] },
    { id: "auditoria",           label: "Auditoría o rebobinar el tiempo",         hits: ["event-sourcing", "cqrs"] },
    { id: "tx-cruza",            label: "Transacciones que cruzan servicios",      hits: ["saga", "eda"] },
    { id: "cambio-atomico",      label: "Un cambio atómico que cruza módulos",     hits: ["monorepo", "monolito", "monolito-modular"] },
    { id: "equipos-autonomos",   label: "Equipos que liberan a su propio ritmo",   hits: ["microservicios", "polyrepo", "soa"] },
  ];

  // --- Cuadrantes de los dos ejes ORTOGONALES -------------------------------
  // runtime: 'mono' (monolito) | 'micro' (microservicios)
  // repo:    'mono' (monorepo) | 'poly' (polyrepo)
  const QUADRANTS = [
    { runtime: "micro", repo: "mono", title: "Monorepo + Microservicios",
      example: "Muchos servicios, un solo repositorio (estilo Google).",
      note: "Refactor atómico entre servicios; build a escala." },
    { runtime: "micro", repo: "poly", title: "Polyrepo + Microservicios",
      example: "Cada servicio con su propio repositorio.",
      note: "El default mental de «microservicios». Autonomía alta, coordinación cara." },
    { runtime: "mono", repo: "mono", title: "Monorepo + Monolito",
      example: "Un repo, un deploy. El punto de partida clásico.",
      note: "Lo más simple que puede funcionar." },
    { runtime: "mono", repo: "poly", title: "Polyrepo + Monolito",
      example: "Un deploy que consume librerías en repos aparte.",
      note: "Menos común; obliga a versionar librerías compartidas." },
  ];

  // --- Roles de los diagramas (contrato de color de la serie) ---------------
  const ROLES = [
    { key: "actor",   name: "Actor / cliente", note: "externo" },
    { key: "gateway", name: "Borde / gateway", note: "sistema" },
    { key: "service", name: "Servicio",        note: "componente de app" },
    { key: "store",   name: "Almacén de datos", note: "DB · caché" },
    { key: "msg",     name: "Mensajería",       note: "broker · cola · stream" },
    { key: "fail",    name: "Fallo",            note: "degradación" },
  ];

  /* =========================================================================
     COMPARACIONES — «¿Cuál arquitectura usar?»
     Cada comparación pone candidatos que sirven para lo MISMO, lado a lado,
     con el rasgo que inclina la decisión marcado hot:true, y un quiz.
     Para agregar una comparación: copia un bloque y edita title/algos/scenarios.
     ========================================================================= */
  const COMPARISONS = [
    {
      id: "escala-deploy", nav: "Monolito · Modular · Micro",
      title: ["Monolito", "Monolito modular", "Microservicios"],
      same: "Entregar una app de negocio",
      tagline: "Las tres entregan la misma aplicación. Lo que cambia es en cuántas unidades se despliega — y cuánto cuesta esa autonomía.",
      algos: [
        { id: "monolito", name: "Monolito", fam: 1,
          traits: [
            { k: "Unidades de deploy", v: "1", hot: true },
            { k: "Consistencia", v: "fuerte, fácil" },
            { k: "Costo operativo", v: "bajo" },
            { k: "Escala partes", v: "no" },
          ],
          intent: "Un artefacto, un deploy, una base. Máxima simplicidad; la fricción llega cuando muchos equipos comparten el mismo release.",
          pick: "cuando el equipo es chico o el dominio aún cambia — empieza aquí." },
        { id: "monolito-modular", name: "Monolito modular", fam: 1,
          traits: [
            { k: "Unidades de deploy", v: "1" },
            { k: "Fronteras internas", v: "explícitas", hot: true },
            { k: "Consistencia", v: "fuerte" },
            { k: "Escala partes", v: "aún no" },
          ],
          intent: "Sigue siendo un solo deploy, pero con módulos de fronteras nítidas. El paso correcto antes de partir en servicios.",
          pick: "cuando el monolito creció y urgen fronteras, sin dolores de escala todavía." },
        { id: "microservicios", name: "Microservicios", fam: 1,
          traits: [
            { k: "Unidades de deploy", v: "N", hot: true },
            { k: "Consistencia", v: "eventual" },
            { k: "Costo operativo", v: "alto", hot: true },
            { k: "Escala partes", v: "sí" },
          ],
          intent: "Cada servicio se despliega y escala solo. Compra autonomía de equipos a cambio de complejidad operativa y consistencia eventual.",
          pick: "cuando equipos numerosos se bloquean y las partes exigen escalar por separado." },
      ],
      scenarios: [
        { prompt: "Equipo de cuatro, producto aún buscando su forma.", answer: "monolito", why: "Con equipo chico y dominio difuso, el monolito entrega valor sin pagar coordinación." },
        { prompt: "El monolito creció y los módulos se enredan, pero el deploy único no duele todavía.", answer: "monolito-modular", why: "Fronteras internas primero; distribuir sin límites claros solo reparte el enredo." },
        { prompt: "Varios equipos se bloquean en un mismo release y el checkout necesita escalar 10× que el resto.", answer: "microservicios", why: "Deploy y escala independientes justifican el costo operativo extra." },
      ],
    },

    {
      id: "org-interna", nav: "Capas · Hexagonal · Clean",
      title: ["Capas", "Hexagonal", "Clean · Cebolla"],
      same: "Ordenar el código dentro de un servicio",
      tagline: "Las tres separan responsabilidades. La pregunta que decide: ¿cuánto necesitas que el dominio ignore la infraestructura?",
      algos: [
        { id: "capas", name: "Capas (N-capas)", fam: 2,
          traits: [
            { k: "Dependencia", v: "hacia abajo" },
            { k: "Dominio conoce la DB", v: "sí", hot: true },
            { k: "Ceremonia", v: "mínima" },
          ],
          intent: "Presentación → lógica → datos. Directo y familiar, pero la lógica tiende a filtrarse y todo acaba dependiendo de la base.",
          pick: "cuando quieres separación simple y el dominio es modesto." },
        { id: "hexagonal", name: "Hexagonal", fam: 2,
          traits: [
            { k: "Dominio", v: "al centro" },
            { k: "Infra por", v: "puertos / adaptadores", hot: true },
            { k: "Probar sin infra", v: "sí", hot: true },
          ],
          intent: "El dominio expone puertos; la infraestructura entra como adaptador intercambiable. Aísla lo estable de lo que cambia debajo.",
          pick: "cuando la infraestructura cambia y quieres probar el dominio sin ella." },
        { id: "clean", name: "Clean · Cebolla", fam: 2,
          traits: [
            { k: "Forma", v: "círculos concéntricos" },
            { k: "Regla de dependencia", v: "hacia adentro", hot: true },
            { k: "Disciplina", v: "alta", hot: true },
          ],
          intent: "Reglas de negocio en el núcleo, frameworks en el borde; nada de adentro sabe del afuera. Sobrevive a cambios de framework y de base.",
          pick: "cuando las reglas de negocio deben durar más que cualquier tecnología." },
      ],
      scenarios: [
        { prompt: "CRUD sencillo, un equipo, sin planes de cambiar de base.", answer: "capas", why: "Puertos y adaptadores aquí son ceremonia; las capas bastan." },
        { prompt: "El core de dominio es rico y quiero probarlo sin levantar base ni broker.", answer: "hexagonal", why: "Los puertos permiten sustituir la infra por dobles de prueba." },
        { prompt: "Producto de larga vida donde el framework seguro cambiará, pero las reglas no.", answer: "clean", why: "La regla de dependencia hacia adentro protege el negocio del framework." },
      ],
    },

    {
      id: "comunicacion", nav: "Cliente-Servidor · Pub-Sub · Eventos",
      title: ["Cliente-Servidor", "Pub-Sub", "Dirigida por eventos"],
      same: "Hacer que las partes se comuniquen",
      tagline: "Todas conectan partes. Lo que las separa: ¿el emisor espera respuesta y sabe quién le contesta?",
      algos: [
        { id: "cliente-servidor", name: "Cliente-Servidor", fam: 3,
          traits: [
            { k: "Acoplamiento", v: "directo", hot: true },
            { k: "Sincronía", v: "pide y espera", hot: true },
            { k: "Respuesta", v: "inmediata" },
          ],
          intent: "El contrato más directo: pido, esperas, respondes. Simple y predecible, pero acopla al consumidor con el servicio y su disponibilidad.",
          pick: "cuando necesitas una respuesta inmediata de un servicio conocido." },
        { id: "pub-sub", name: "Publicación-Suscripción", fam: 3,
          traits: [
            { k: "Acoplamiento", v: "por tópico" },
            { k: "Sincronía", v: "fire-and-forget" },
            { k: "Emisor conoce receptor", v: "no", hot: true },
          ],
          intent: "El emisor publica a un tópico sin saber quién escucha. Desacopla en tiempo e identidad — a cambio de renunciar a la respuesta inmediata.",
          pick: "cuando emisor y receptor no deben conocerse ni esperarse." },
        { id: "eda", name: "Dirigida por eventos", fam: 3,
          traits: [
            { k: "Dispara", v: "hechos ocurridos", hot: true },
            { k: "Coordinación", v: "coreografía" },
            { k: "Consistencia", v: "eventual", hot: true },
          ],
          intent: "Las partes reaccionan a eventos ya sucedidos en vez de orquestar llamadas. Máximo desacople y escala, a costa de flujos difíciles de rastrear.",
          pick: "cuando el sistema debe reaccionar a hechos y escalar por desacople." },
      ],
      scenarios: [
        { prompt: "El front pide el saldo y necesita el número ahora para pintarlo.", answer: "cliente-servidor", why: "Respuesta inmediata de un servicio conocido: petición-respuesta directa." },
        { prompt: "Al registrarse un usuario, tres subsistemas deben enterarse, y no quiero que el registro los conozca.", answer: "pub-sub", why: "Publicar a un tópico desacopla al emisor de todos los interesados." },
        { prompt: "El sistema entero debe reaccionar en cadena a «pago confirmado» sin un orquestador central.", answer: "eda", why: "La coreografía por eventos deja que cada parte reaccione al hecho." },
      ],
    },

    {
      id: "computo", nav: "Serverless · Contenedor",
      title: ["Serverless · FaaS", "Monolito / contenedor"],
      same: "Decidir dónde corre el cómputo",
      tagline: "Ambos ejecutan tu código. La decisión: ¿la carga es intermitente y sin estado, o constante y con estado?",
      algos: [
        { id: "serverless", name: "Serverless · FaaS", fam: 1,
          traits: [
            { k: "Escala", v: "a cero .. N", hot: true },
            { k: "Costo", v: "por ejecución", hot: true },
            { k: "Estado", v: "efímero" },
            { k: "Arranque en frío", v: "sí" },
          ],
          intent: "Funciones que escalan desde cero y cobran solo por uso. Ideal para carga intermitente; el arranque en frío y el estado pesado son su talón.",
          pick: "cuando la carga llega a ráfagas y no hay estado pesado en memoria." },
        { id: "contenedor", name: "Monolito / contenedor", fam: 1,
          traits: [
            { k: "Escala", v: "instancias vivas" },
            { k: "Costo", v: "por tiempo encendido" },
            { k: "Estado", v: "en memoria ok", hot: true },
            { k: "Latencia", v: "estable", hot: true },
          ],
          intent: "Procesos siempre encendidos: latencia predecible y estado en memoria, pero pagas los servidores aunque estén ociosos.",
          pick: "cuando la carga es constante, hay estado, o la latencia en frío es inaceptable." },
      ],
      scenarios: [
        { prompt: "Un webhook que llega a ráfagas impredecibles: minutos de nada y luego picos.", answer: "serverless", why: "Escalar a cero y pagar por ejecución encaja con la carga intermitente." },
        { prompt: "Un servicio de baja latencia con caché caliente en memoria y tráfico constante.", answer: "contenedor", why: "El estado en memoria y la latencia estable piden procesos encendidos." },
      ],
    },

    {
      id: "lectura-escritura", nav: "CRUD · CQRS",
      title: ["CRUD (un modelo)", "CQRS"],
      same: "Leer y escribir los mismos datos",
      tagline: "Los dos exponen lectura y escritura. La pregunta: ¿sus cargas y formas son tan distintas que conviene separarlas?",
      algos: [
        { id: "crud", name: "CRUD (un modelo)", fam: 2,
          traits: [
            { k: "Modelos", v: "uno solo", hot: true },
            { k: "Complejidad", v: "baja" },
            { k: "Consistencia", v: "inmediata" },
          ],
          intent: "Un mismo modelo sirve para leer y escribir. Lo más simple, y lo correcto la mayoría de las veces.",
          pick: "cuando lectura y escritura tienen cargas y formas parecidas." },
        { id: "cqrs", name: "CQRS", fam: 4,
          traits: [
            { k: "Modelos", v: "lectura / escritura separados", hot: true },
            { k: "Escala", v: "cada lado por su lado", hot: true },
            { k: "Consistencia", v: "eventual entre lados" },
          ],
          intent: "Separa el modelo de comandos del de consultas para optimizar y escalar cada uno. Poder a cambio de más piezas y sincronización.",
          pick: "cuando leer y escribir tienen cargas o formas muy dispares." },
      ],
      scenarios: [
        { prompt: "Un panel administrativo con tráfico parejo de altas y consultas.", answer: "crud", why: "Cargas parejas: un solo modelo evita piezas que no pagan su costo." },
        { prompt: "Lecturas 100× más que escrituras, y con vistas muy distintas al modelo de escritura.", answer: "cqrs", why: "Separar los lados deja optimizar y escalar la lectura por su cuenta." },
      ],
    },

    {
      id: "persistencia", nav: "Estado actual · Event Sourcing",
      title: ["Estado actual (CRUD)", "Event Sourcing"],
      same: "Persistir el estado del sistema",
      tagline: "Ambos guardan el estado. La diferencia: ¿te basta el último valor, o necesitas toda la historia de cómo llegaste a él?",
      algos: [
        { id: "estado", name: "Estado actual (CRUD)", fam: 2,
          traits: [
            { k: "Guarda", v: "último estado", hot: true },
            { k: "Historia", v: "se pierde" },
            { k: "Simplicidad", v: "alta" },
          ],
          intent: "Sobrescribe el estado en su lugar. Simple y suficiente cuando el pasado no importa.",
          pick: "cuando solo necesitas el estado actual, sin auditoría ni rebobinar." },
        { id: "event-sourcing", name: "Event Sourcing", fam: 4,
          traits: [
            { k: "Guarda", v: "log de eventos", hot: true },
            { k: "Historia", v: "completa · rebobinable", hot: true },
            { k: "Reconstruir estado", v: "reproduciendo eventos" },
          ],
          intent: "El registro de hechos ES la verdad; el estado se deriva reproduciéndolo. Da auditoría y viaje en el tiempo, a cambio de complejidad.",
          pick: "cuando el historial, la auditoría o rebobinar el tiempo son requisito." },
      ],
      scenarios: [
        { prompt: "Un catálogo de productos donde solo importa el precio vigente.", answer: "estado", why: "Sin necesidad de historia, guardar el último estado basta." },
        { prompt: "Un libro mayor contable que debe reconstruir el saldo en cualquier fecha pasada.", answer: "event-sourcing", why: "El log de eventos permite reproducir el estado en cualquier momento." },
      ],
    },

    {
      id: "consistencia-distribuida", nav: "ACID · Saga",
      title: ["Transacción ACID", "Saga"],
      same: "Mantener consistencia entre operaciones",
      tagline: "Ambos preservan la integridad. La pregunta que decide: ¿la operación vive en una sola base, o cruza varios servicios?",
      algos: [
        { id: "acid", name: "Transacción ACID", fam: 4,
          traits: [
            { k: "Alcance", v: "una base", hot: true },
            { k: "Garantía", v: "todo o nada" },
            { k: "Consistencia", v: "inmediata", hot: true },
          ],
          intent: "Un commit atómico dentro de una base: o todo ocurre, o nada. La opción correcta mientras la transacción no salga de casa.",
          pick: "cuando toda la operación cabe en una sola base de datos." },
        { id: "saga", name: "Saga", fam: 4,
          traits: [
            { k: "Alcance", v: "varios servicios", hot: true },
            { k: "Garantía", v: "pasos compensables", hot: true },
            { k: "Consistencia", v: "eventual" },
          ],
          intent: "Una secuencia de pasos locales, cada uno con su compensación si algo falla. Consistencia sin bloquear servicios, a cambio de coreografiar reversas.",
          pick: "cuando la transacción cruza servicios y el `2PC` no es opción." },
      ],
      scenarios: [
        { prompt: "Transferir saldo entre dos cuentas de la misma base.", answer: "acid", why: "Una sola base: una transacción ACID lo resuelve de una." },
        { prompt: "Un pedido que reserva inventario, cobra el pago y agenda el envío, cada uno en su servicio.", answer: "saga", why: "Al cruzar servicios, los pasos compensables sostienen la consistencia." },
      ],
    },

    {
      id: "repos", nav: "Monorepo · Polyrepo",
      title: ["Monorepo", "Polyrepo"],
      same: "En cuántos repositorios vive el código",
      tagline: "Es independiente de cómo se despliega (ver «los dos ejes» en el índice). La pregunta: ¿los cambios cruzan módulos, o cada equipo libera a su ritmo?",
      algos: [
        { id: "monorepo", name: "Monorepo", fam: 5,
          traits: [
            { k: "Cambio que cruza módulos", v: "atómico", hot: true },
            { k: "Versionado", v: "único" },
            { k: "Build", v: "exige incremental", hot: true },
          ],
          intent: "Todo el código en un repo: un PR puede cruzar muchos módulos a la vez. Refactor global fácil, pero exige tooling de build serio.",
          pick: "cuando los cambios cruzan módulos y quieres un único punto de verdad." },
        { id: "polyrepo", name: "Polyrepo", fam: 5,
          traits: [
            { k: "Autonomía por equipo", v: "alta", hot: true },
            { k: "Versionado", v: "por repo" },
            { k: "Cambio que cruza repos", v: "caro", hot: true },
          ],
          intent: "Cada componente en su repo: equipos que liberan en su propio calendario sin pedir permiso, al precio de coordinar cambios que cruzan repos.",
          pick: "cuando los equipos deben liberar independientes y los cambios rara vez cruzan repos." },
      ],
      scenarios: [
        { prompt: "Un design system que muchos productos consumen y a menudo se refactoriza en conjunto.", answer: "monorepo", why: "El cambio atómico entre módulos es justo lo que el monorepo premia." },
        { prompt: "Diez equipos con ciclos de release propios y dependencias mínimas entre sí.", answer: "polyrepo", why: "La autonomía de liberar sin coordinar favorece repos separados." },
      ],
    },
  ];

  // Publica el contenido del catálogo en el namespace.
  G.data = {
    META, FAMILIES, VIEWS, SCALE, AXES, PROM, ARCHS,
    PROBLEMS, QUADRANTS, ROLES, COMPARISONS,
  };
  // Contenedor para las fichas profundas por familia (lo llenan los data/fichas-<familia>.js).
  G.fichas = G.fichas || {};
})(window.GUIA = window.GUIA || {});
