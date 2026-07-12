/* ============================================================================
   data/fichas-autorizacion.js — familia 4: autorización (quién puede qué)
   ----------------------------------------------------------------------------
   Ojo: en esta familia el eje "resistencia a phishing" no aplica directo (la
   autorización asume que ya sabes quién es el usuario). El componente de
   ratings lo aclara con una nota cuando la familia es "autorizacion".
   ========================================================================== */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas["rbac"] = {
    que: "Control de acceso basado en roles. Agrupas permisos en roles (admin, editor, viewer) y asignas roles a las personas. La pregunta «¿puede X hacer Y?» se responde mirando los roles de X. Es el default que resuelve el 80% de los casos.",
    secreto: "No hay secreto criptográfico aquí — la autorización asume que la autenticación ya probó quién eres. Lo que guardas es el mapa usuario → roles → permisos, normalmente en tu base de datos.",
    gana: "Simple de entender, auditar y explicar a negocio. Barato de implementar. Escala bien mientras los roles no exploten en número.",
    paga: "Se vuelve rígido cuando la realidad es más fina que «este rol»: aparece la «explosión de roles» (admin-de-región-norte-solo-lectura-en-finanzas) y el modelo se rompe. No maneja bien permisos que dependen del recurso concreto.",
    cuandoNo: "Cuando el permiso depende de atributos del contexto (hora, ubicación, monto) — ahí quieres ABAC. Cuando depende de la relación con el recurso («soy dueño de ESTE documento») — ahí quieres ReBAC.",
    revoca: "Excelente e instantánea: quitas el rol al usuario y pierde esos permisos en la siguiente evaluación. «Revocar acceso YA» es literalmente un DELETE en la tabla de asignaciones.",
    parientes: "El punto de partida; ABAC (folio 13) y ReBAC (folio 14) son sus evoluciones cuando se queda corto. Se confunde con autenticación todo el tiempo — es LA confusión madre: autenticar es «quién eres», autorizar es «qué te dejo».",
    sims: [],
    ejesNota: true
  };

  G.fichas["abac"] = {
    que: "Control basado en atributos. En vez de roles fijos, escribes políticas que evalúan atributos del usuario, del recurso y del entorno: «un médico puede ver un expediente si está asignado al paciente y es horario laboral». Reglas, no etiquetas.",
    secreto: "Como toda autorización, no hay secreto — asume identidad ya probada. Guardas las políticas (a menudo en un motor tipo OPA/Rego o Cedar) y los atributos que alimentan la decisión.",
    gana: "Expresividad enorme: capturas reglas de negocio finas sin inventar mil roles. Centralizas la lógica de acceso en políticas versionables. Encaja natural en escenarios regulados.",
    paga: "El poder se paga en auditabilidad: «¿por qué este usuario pudo hacer esto?» se vuelve difícil de responder cuando hay decenas de políticas interactuando. Depender de un motor de políticas suma una pieza a operar.",
    cuandoNo: "Cuando RBAC ya alcanza — no metas un motor de políticas para tres roles. Cuando el equipo no puede mantener la disciplina de escribir y probar políticas.",
    revoca: "Cambias la política o el atributo y la decisión cambia en la siguiente evaluación — muy flexible. El reto no es revocar, es entender el efecto en cascada de tocar una política compartida.",
    parientes: "El paso intermedio entre RBAC (folio 12) y ReBAC (folio 14). Se confunde con RBAC: de hecho «roles» no es más que un atributo, así que RBAC es un ABAC degenerado. Cerca de motores como OPA, Cedar y XACML.",
    sims: [],
    ejesNota: true
  };

  G.fichas["rebac"] = {
    que: "Control basado en relaciones, popularizado por el paper Zanzibar de Google (el motor detrás de los permisos de Docs/Drive). El permiso se deriva de un grafo de relaciones: «puedes editar este doc porque eres editor de la carpeta que lo contiene».",
    secreto: "Sin secreto criptográfico. Guardas tuplas de relación («user:ana es editor de doc:42») en un servicio de autorización dedicado (SpiceDB, OpenFGA, la Zanzibar de Google) que resuelve las consultas de acceso.",
    gana: "Modela permisos jerárquicos y compartición estilo Google Drive con naturalidad — herencia por carpetas, grupos, «compartido conmigo». Consistente y rápido a escala planetaria (ese era el punto de Zanzibar).",
    paga: "La infraestructura más pesada de las tres: montar y operar un servicio de autorización aparte. Curva de aprendizaje del modelo de relaciones. Sobredimensionado para permisos simples.",
    cuandoNo: "Cuando no tienes permisos relacionales/jerárquicos de verdad — RBAC o ABAC te sobran. Cuando no puedes justificar operar un servicio de authz dedicado.",
    revoca: "Instantánea y granular: borras la tupla de relación y el acceso derivado desaparece, incluido todo lo que heredaba de ella. Es de lo más limpio del catálogo para «revocar acceso YA» a un recurso concreto.",
    parientes: "La evolución de ABAC (folio 13) hacia el modelo de grafo. Se confunde con «grupos» de RBAC: los grupos son un caso trivial de relación; ReBAC generaliza a cualquier relación entre cualquier par de objetos.",
    sims: [],
    ejesNota: true
  };

})(window.GUIA = window.GUIA || {});
