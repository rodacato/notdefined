/* ============================================================================
   fichas-interna.js — Fichas profundas · Familia 2 (Organización interna)
   Formato de datos: ver el encabezado de fichas-despliegue.js.
   ========================================================================== */
(function (G) {
  const F = (G.fichas = G.fichas || {});

  F["hexagonal"] = {
    n: "06", id: "hexagonal", nombre: "Hexagonal · Puertos y adaptadores", prominencia: "esencial", vistaPrimaria: "limites",
    queEs: "El dominio al centro hablando solo con contratos (puertos); la infraestructura llega por adaptadores intercambiables.",
    fuerza: "Aislar el dominio de la infraestructura que cambia debajo — y de quién lo consume.",
    gana: "El código queda libre de dependencias y transparente para las interfaces: controlas qué se expone, cómo y a quién por cada puerto — con datos sensibles eso es la diferencia — y cambiar de proveedor es escribir otro adapter, sin tocar el negocio. El test entra por el mismo puerto que producción.",
    paga: "Puertos, adapters y mapeos que en un CRUD se sienten pura burocracia. Y la disciplina hay que enseñarla: el patrón no se sostiene solo, y venderlo al equipo es parte del trabajo.",
    cuandoNo: "Servicios de una sola responsabilidad: un reverse geocoder, un API proxy, cualquier PoC. Ahí el traje completo estorba.",
    parientes: "Capas, clean y hexagonal son el mismo instinto con distinta disciplina. Y aunque no vayas full hexagonal, sus «chispitas» — código coherente con el negocio, responsabilidades separadas — siempre valen: esa base sobrevive aunque no seas estricto con la arquitectura.",
    ratings: { indep: 1, ops: 1, lat: 4, team: 2, cons: 4, scale: 2, change: 4 },
    diagrama: [
      { t: "node", x: 168, y: 106, w: 124, h: 66, role: "gateway", star: true, label: "Dominio", sub: "no sabe quién lo llama" },
      { t: "node", x: 186, y: 20, w: 88, h: 40, role: "service", label: "Adapter HTTP" },
      { t: "node", x: 340, y: 116, w: 92, h: 46, role: "service", label: "Adapter", sub: "proveedor" },
      { t: "node", x: 186, y: 218, w: 88, h: 40, role: "store", label: "Adapter DB" },
      { t: "node", x: 28, y: 116, w: 92, h: 46, role: "service", label: "Tests", sub: "otro adapter más" },
      { t: "edge", x1: 230, y1: 60, x2: 230, y2: 106, arrow: true },
      { t: "edge", x1: 340, y1: 139, x2: 292, y2: 139, arrow: true },
      { t: "edge", x1: 230, y1: 172, x2: 230, y2: 218, arrow: true },
      { t: "edge", x1: 120, y1: 139, x2: 168, y2: 139, arrow: true },
      { t: "label", x: 230, y: 190, text: "puertos = contratos" },
    ],
  };

  F["capas"] = {
    n: "05", id: "capas", nombre: "Capas (N-capas)", prominencia: "esencial", vistaPrimaria: "limites",
    queEs: "El código en capas horizontales — presentación, lógica, datos — donde cada capa solo llama a la de abajo.",
    fuerza: "Separar responsabilidades técnicas sin ceremonia, con el patrón que todo el mundo ya conoce.",
    gana: "Curva de entrada nula, estructura predecible y separación técnica clara.",
    paga: "La lógica se filtra entre capas y todo acaba acoplado al esquema de la DB; un cambio de negocio suele cruzar las tres capas.",
    cuandoNo: "Cuando el dominio es rico y quieres probarlo sin infraestructura: ahí conviene invertir la dependencia (hexagonal / clean).",
    parientes: "Punto de partida del mismo instinto que hexagonal y clean refinan: separar lo que cambia de lo que no. La diferencia entre las tres es quién conoce a quién.",
    ratings: { indep: 0, ops: 1, lat: 3, team: 1, cons: 4, scale: 1, change: 2 },
    diagrama: [
      { t: "node", x: 10, y: 58, w: 58, h: 42, role: "actor", label: "Cliente" },
      { t: "edge", x1: 68, y1: 79, x2: 118, y2: 79, arrow: true },
      { t: "frame", x: 118, y: 24, w: 230, h: 232, label: "Una unidad" },
      { t: "node", x: 142, y: 58, w: 182, h: 42, role: "service", label: "Presentación" },
      { t: "edge", x1: 233, y1: 100, x2: 233, y2: 120, arrow: true },
      { t: "node", x: 142, y: 120, w: 182, h: 42, role: "service", label: "Lógica de negocio" },
      { t: "edge", x1: 233, y1: 162, x2: 233, y2: 182, arrow: true },
      { t: "node", x: 142, y: 182, w: 182, h: 42, role: "service", label: "Acceso a datos" },
      { t: "label", x: 233, y: 240, text: "dependencias solo hacia abajo" },
      { t: "node", x: 376, y: 180, w: 74, h: 46, role: "store", label: "DB" },
      { t: "edge", x1: 324, y1: 203, x2: 376, y2: 203, arrow: true },
    ],
  };

  F["clean"] = {
    n: "07", id: "clean", nombre: "Clean · Cebolla", prominencia: "situacional", vistaPrimaria: "limites",
    queEs: "Círculos concéntricos con las reglas de negocio al centro; toda dependencia apunta hacia adentro y los frameworks viven en el borde.",
    fuerza: "Que las reglas de negocio sobrevivan a cualquier framework, DB o UI.",
    gana: "Dominio testeable sin infra y un negocio que dura más que la tecnología de turno.",
    paga: "Ceremonia: interfaces, mappers y DTOs por todos lados; sin disciplina de equipo, la regla de dependencia se rompe sin que nadie lo note.",
    cuandoNo: "CRUD simple o producto de vida corta: pagas la ceremonia completa y nunca cobras el beneficio.",
    parientes: "Misma idea que hexagonal con más anillos y más reglas; en la práctica la diferencia es de énfasis, no de fondo. Capas es su ancestro con la flecha apuntando al revés.",
    ratings: { indep: 1, ops: 1, lat: 3, team: 2, cons: 4, scale: 1, change: 4 },
    diagrama: [
      { t: "frame", x: 24, y: 22, w: 412, h: 226, label: "Frameworks · UI · DB · infraestructura" },
      { t: "frame", x: 84, y: 64, w: 292, h: 152, label: "Casos de uso" },
      { t: "node", x: 150, y: 118, w: 160, h: 62, role: "service", star: true, label: "Dominio", sub: "entidades · reglas" },
      { t: "edge", x1: 428, y1: 138, x2: 380, y2: 138, arrow: true },
      { t: "edge", x1: 368, y1: 150, x2: 314, y2: 150, arrow: true },
      { t: "label", x: 230, y: 264, text: "la regla: dependencias solo hacia adentro" },
    ],
  };

  F["vertical-slices"] = {
    n: "08", id: "vertical-slices", nombre: "Vertical Slices", prominencia: "situacional", vistaPrimaria: "flujo",
    queEs: "El código organizado por caso de uso completo — cada slice trae su UI, su lógica y su acceso a datos — en vez de por capa técnica.",
    fuerza: "Que un cambio de feature toque UN lugar, no tres capas.",
    gana: "Cohesión por feature y cambios locales: abres la carpeta del caso de uso y está todo.",
    paga: "La lógica compartida se duplica o se vuelve un pleito de dónde vive; sin criterio común, cada slice inventa su propio estilo.",
    cuandoNo: "Cuando hay mucho dominio compartido entre casos de uso: la división por feature lo fragmenta y terminas con N versiones de la misma regla.",
    parientes: "Corta ortogonal a capas / hexagonal / clean: aquéllas parten por rol técnico, ésta por feature. Dentro de un slice complejo puedes seguir usando puertos y adaptadores.",
    ratings: { indep: 1, ops: 1, lat: 3, team: 3, cons: 3, scale: 1, change: 4 },
    diagrama: [
      { t: "node", x: 8, y: 108, w: 60, h: 46, role: "actor", label: "Cliente" },
      { t: "edge", x1: 68, y1: 131, x2: 96, y2: 131, arrow: true },
      { t: "frame", x: 96, y: 22, w: 352, h: 240, label: "Una unidad · un corte por caso de uso" },
      { t: "node", x: 116, y: 58, w: 98, h: 126, role: "service", dashed: true, label: "Crear", sub: "UI·lógica·datos" },
      { t: "node", x: 228, y: 58, w: 98, h: 126, role: "service", dashed: true, label: "Cancelar", sub: "UI·lógica·datos" },
      { t: "node", x: 340, y: 58, w: 92, h: 126, role: "service", dashed: true, label: "Reporte", sub: "UI·lógica·datos" },
      { t: "node", x: 196, y: 206, w: 150, h: 44, role: "store", label: "DB" },
      { t: "edge", x1: 165, y1: 184, x2: 230, y2: 206 },
      { t: "edge", x1: 277, y1: 184, x2: 272, y2: 206 },
      { t: "edge", x1: 386, y1: 184, x2: 314, y2: 206 },
    ],
  };

  F["microkernel"] = {
    n: "09", id: "microkernel", nombre: "Microkernel · Plugins", prominencia: "nicho", vistaPrimaria: "limites",
    queEs: "Un núcleo mínimo + plugins que extienden la funcionalidad.",
    fuerza: "Un producto extensible por terceros o con features opcionales.",
    gana: "Extensibilidad y aislamiento de features.",
    paga: "Diseñar un buen contrato de plugin es difícil.",
    cuandoNo: "Cuando el dominio aún no estabiliza qué es núcleo y qué es plugin.",
    parientes: "Ejemplos claros: IDEs (VS Code), navegadores, sistemas de plugins.",
    ratings: { indep: 1, ops: 2, lat: 3, team: 3, cons: 3, scale: 2, change: 4 },
    diagrama: [
      { t: "node", x: 168, y: 106, w: 124, h: 66, role: "gateway", star: true, label: "Núcleo", sub: "contrato estable" },
      { t: "node", x: 186, y: 20, w: 88, h: 40, role: "service", label: "Plugin A" },
      { t: "node", x: 340, y: 116, w: 92, h: 46, role: "service", label: "Plugin B" },
      { t: "node", x: 186, y: 218, w: 88, h: 40, role: "service", label: "Plugin C" },
      { t: "node", x: 28, y: 116, w: 92, h: 46, role: "service", label: "Plugin D" },
      { t: "edge", x1: 230, y1: 60, x2: 230, y2: 106 },
      { t: "edge", x1: 292, y1: 139, x2: 340, y2: 139 },
      { t: "edge", x1: 230, y1: 172, x2: 230, y2: 218 },
      { t: "edge", x1: 168, y1: 139, x2: 120, y2: 139 },
    ],
  };
})(window.GUIA = window.GUIA || {});
