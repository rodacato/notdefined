/* ============================================================================
   data/catalogo.js — EL GUIÓN del catálogo. Solo contenido: manifiesto de
   módulos, índice de temas, filtro de problemas y textos de la portada.
   Ninguna mecánica vive aquí; las simulaciones están en data/sims-*.js por
   familia y la guía de decisión en data/guia.js.

   Criterio de éxito del proyecto: corregir o agregar contenido = tocar SOLO
   la carpeta data/.
   ========================================================================== */
(function (G) {
  "use strict";

  var DATA = (G.DATA = G.DATA || {});
  /* =========================================================================
     Manifiesto de módulos — única fuente de verdad de la navegación.
     Agregar un módulo = una entrada. route: hash interno.
     ========================================================================= */
  DATA.MODULES = [
    { id: "00", short: "Big O",        route: "#/modulo-00", title: "Intuici\u00f3n del crecimiento",
      blurb: "Por qu\u00e9 O(n\u00b2) explota y O(log n) casi no se mueve \u2014 el modelo mental, antes de cualquier f\u00f3rmula.",
      topics: ["Carrera de curvas", "Cajas de trabajo", "Notaci\u00f3n Big O"] },
    { id: "01", short: "B\u00fasquedas",   route: "#/modulo-01", title: "Encontrar un valor",
      blurb: "La l\u00ednea base O(n) y el salto a O(log n) partiendo el problema a la mitad.",
      topics: ["B\u00fasqueda lineal", "B\u00fasqueda binaria"] },
    { id: "02", short: "Ordenamiento", route: "#/modulo-02", title: "Poner en orden",
      blurb: "De selection a merge: por qu\u00e9 unos ordenan en O(n\u00b2) y otros en O(n log n).",
      topics: ["Selection", "Insertion", "Quicksort", "Merge sort"] },
    { id: "03", short: "Recursi\u00f3n",    route: "#/modulo-03", title: "Pensar en recursi\u00f3n",
      blurb: "La pila de llamadas que crece y se desenrolla, el caso base, y la fe recursiva de Torres de Han\u00f3i.",
      topics: ["Call stack", "Torres de Han\u00f3i"] },
    { id: "04", short: "Estructuras",  route: "#/modulo-04", title: "Estructuras de datos",
      blurb: "D\u00f3nde viven los datos y qu\u00e9 cuesta cada operaci\u00f3n: arreglo vs lista, tabla hash, BST y heap.",
      topics: ["Arreglo vs lista", "Tabla hash", "BST", "Heap"] },
    { id: "05", short: "Grafos",       route: "#/modulo-05", title: "Grafos",
      blurb: "Nodos y aristas: c\u00f3mo se guardan y c\u00f3mo se recorren \u2014 BFS, DFS, orden topol\u00f3gico, Dijkstra, A* y \u00e1rbol de expansi\u00f3n m\u00ednima.",
      topics: ["Representaci\u00f3n", "BFS", "DFS", "Topol\u00f3gico", "Dijkstra", "A*", "MST"] },
    { id: "06", short: "Greedy y DP",  route: "#/modulo-06", title: "Greedy y programaci\u00f3n din\u00e1mica",
      blurb: "Elegir lo localmente \u00f3ptimo, y reutilizar subproblemas: selecci\u00f3n de actividades, Fibonacci con memoizaci\u00f3n y la mochila 0/1.",
      topics: ["Greedy", "Fibonacci + memo", "Mochila 0/1"] },
  ];

  /* =========================================================================
     Índice del catálogo — meta por módulo (color + descripción).
     ========================================================================= */
  DATA.MODS = {
    0: { no: "00", name: "Fundamentos",  color: "#5E6B73", desc: "El lenguaje del costo: c\u00f3mo crece el trabajo cuando crecen los datos." },
    1: { no: "01", name: "B\u00fasqueda",    color: "#2F6A6B", desc: "Encontrar un valor: la l\u00ednea base O(n) y el salto a O(log n)." },
    2: { no: "02", name: "Ordenamiento", color: "#A4552E", desc: "Poner en orden: de los O(n\u00b2) simples a los O(n log n)." },
    3: { no: "03", name: "Recursi\u00f3n",   color: "#79415F", desc: "Definir un problema en t\u00e9rminos de s\u00ed mismo; la pila hace el resto." },
    4: { no: "04", name: "Estructuras",  color: "#3E6A8A", desc: "D\u00f3nde viven los datos: qu\u00e9 operaci\u00f3n es barata y cu\u00e1l cara." },
    5: { no: "05", name: "Grafos",       color: "#4F7A43", desc: "Nodos y aristas: c\u00f3mo se guardan y en qu\u00e9 orden se recorren." },
    6: { no: "06", name: "Greedy y DP",  color: "#9A6B1F", desc: "Decisiones secuenciales: comprometerse localmente o explorar subproblemas." },
  };

  /* freq: "star" núcleo cotidiano · "half" uso medio · "open" cola rara.
     mod: módulo al que pertenece. route: a qué módulo/pestaña abre la tarjeta. */
  DATA.ALGOS = [
    { id: "big-o",       no: "01", mod: 0, freq: "star", name: "Big O",                  route: "#/modulo-00",          intent: "La intuici\u00f3n del crecimiento: por qu\u00e9 unos escalan y otros explotan." },
    { id: "lineal",      no: "02", mod: 1, freq: "star", name: "B\u00fasqueda lineal",       route: "#/modulo-01/lineal",   intent: "Recorre elemento por elemento; funciona siempre, nunca es r\u00e1pida." },
    { id: "binaria",     no: "03", mod: 1, freq: "star", name: "B\u00fasqueda binaria",      route: "#/modulo-01/binaria",  intent: "Descarta la mitad en cada paso; exige datos ordenados." },
    { id: "selection",   no: "04", mod: 2, freq: "half", name: "Selection sort",         route: "#/modulo-02/selection",intent: "Trae el m\u00ednimo al frente, pasada tras pasada. M\u00ednimos swaps." },
    { id: "insertion",   no: "05", mod: 2, freq: "half", name: "Insertion sort",         route: "#/modulo-02/insertion",intent: "Inserta cada elemento en su sitio; casi O(n) si ya est\u00e1 ordenado." },
    { id: "quick",       no: "06", mod: 2, freq: "star", name: "Quicksort",              route: "#/modulo-02/quick",    intent: "Particiona alrededor de un pivote; r\u00e1pido en promedio, in-place." },
    { id: "merge",       no: "07", mod: 2, freq: "star", name: "Merge sort",             route: "#/modulo-02/merge",    intent: "Divide y mezcla; O(n log n) garantizado y estable." },
    { id: "recursion",   no: "08", mod: 3, freq: "star", name: "Recursi\u00f3n y la pila",   route: "#/modulo-03/recursion",intent: "Un problema en t\u00e9rminos de una versi\u00f3n m\u00e1s peque\u00f1a de s\u00ed mismo." },
    { id: "hanoi",       no: "09", mod: 3, freq: "open", name: "Torres de Han\u00f3i",        route: "#/modulo-03/hanoi",    intent: "Recursi\u00f3n ramificada: la fe recursiva llevada al extremo." },
    { id: "array-lista", no: "10", mod: 4, freq: "star", name: "Arreglo vs lista",       route: "#/modulo-04/array-lista",intent: "Acceso barato o inserci\u00f3n barata: el trade-off fundamental." },
    { id: "hash",        no: "11", mod: 4, freq: "star", name: "Tabla hash",             route: "#/modulo-04/hash",     intent: "Clave \u2192 cubeta en O(1) promedio; el caballo de batalla." },
    { id: "bst",         no: "12", mod: 4, freq: "half", name: "\u00c1rbol de b\u00fasqueda",    route: "#/modulo-04/bst",      intent: "Orden + b\u00fasqueda O(log n) si se mantiene balanceado." },
    { id: "heap",        no: "13", mod: 4, freq: "half", name: "Heap / prioridad",       route: "#/modulo-04/heap",     intent: "El m\u00ednimo siempre a mano en O(1); inserta y extrae en O(log n)." },
    { id: "grafo-repr",  no: "14", mod: 5, freq: "half", name: "Representaci\u00f3n",         route: "#/modulo-05/grafo-repr",intent: "Matriz vs lista de adyacencia: para grafos densos o dispersos." },
    { id: "bfs",         no: "15", mod: 5, freq: "star", name: "BFS",                    route: "#/modulo-05/bfs",      intent: "Explora por niveles; camino m\u00e1s corto sin pesos." },
    { id: "dfs",         no: "16", mod: 5, freq: "star", name: "DFS",                    route: "#/modulo-05/dfs",      intent: "Se hunde por una rama; base de ciclos y orden topol\u00f3gico." },
    { id: "topo",        no: "17", mod: 5, freq: "half", name: "Orden topol\u00f3gico",       route: "#/modulo-05/topo",     intent: "Ordena tareas respetando sus dependencias (DAG)." },
    { id: "dijkstra",    no: "18", mod: 5, freq: "star", name: "Dijkstra",               route: "#/modulo-05/dijkstra", intent: "Camino m\u00e1s corto con pesos no negativos." },
    { id: "astar",       no: "19", mod: 5, freq: "half", name: "A*",                     route: "#/modulo-05/astar",    intent: "Dijkstra guiado por una heur\u00edstica hacia la meta." },
    { id: "mst",         no: "20", mod: 5, freq: "open", name: "\u00c1rbol de expansi\u00f3n m\u00edn.", route: "#/modulo-05/mst",  intent: "Conecta todo al menor costo total, sin ciclos." },
    { id: "greedy",      no: "21", mod: 6, freq: "half", name: "Greedy",                 route: "#/modulo-06/greedy",   intent: "Elige lo mejor local; \u00f3ptimo solo bajo la estructura adecuada." },
    { id: "fib",         no: "22", mod: 6, freq: "star", name: "Memoizaci\u00f3n",           route: "#/modulo-06/fib",      intent: "Guarda subproblemas resueltos; de O(2\u207f) a O(n)." },
    { id: "knapsack",    no: "23", mod: 6, freq: "half", name: "Mochila 0/1 (DP)",       route: "#/modulo-06/knapsack", intent: "Llena una tabla de decisiones tomar / no tomar." },
  ];

  /* Filtro «Tengo este problema…» — ilumina los algoritmos que lo atacan. */
  DATA.PROBLEMS = [
    { id: "buscar",     label: "Encontrar un valor en una colecci\u00f3n",        hits: ["lineal", "binaria", "hash", "bst"] },
    { id: "ordenar",    label: "Ordenar un mont\u00f3n de datos",                  hits: ["selection", "insertion", "quick", "merge"] },
    { id: "escala",     label: "El c\u00f3digo no escala al crecer los datos",     hits: ["big-o", "binaria", "hash"] },
    { id: "corto",      label: "Encontrar el camino m\u00e1s corto",               hits: ["bfs", "dijkstra", "astar"] },
    { id: "recorrer",   label: "Recorrer un grafo o un \u00e1rbol",                hits: ["bfs", "dfs", "grafo-repr", "recursion"] },
    { id: "minmax",     label: "Recuperar el m\u00ednimo o m\u00e1ximo una y otra vez", hits: ["heap", "bst"] },
    { id: "deps",       label: "Ordenar tareas con dependencias",             hits: ["topo"] },
    { id: "estructura", label: "Elegir la estructura de datos correcta",      hits: ["array-lista", "hash", "bst", "heap"] },
    { id: "optimizar",  label: "Optimizar: m\u00e1ximo valor o m\u00ednimo costo",    hits: ["greedy", "knapsack", "mst"] },
    { id: "recalcular", label: "Evitar recalcular lo mismo una y otra vez",   hits: ["fib", "knapsack"] },
  ];

  /* Textos de la portada. */
  DATA.index = {
    title: "Algoritmos a simple vista",
    lede: "El mapa completo del curso. Pensado para recuperarlos <em>por el problema que resuelven</em>, no por su nombre \u2014 porque rara vez recuerdas c\u00f3mo se llama el algoritmo que necesitas, pero s\u00ed el problema que tienes enfrente.",
    colophon: "Cada m\u00f3dulo comparte el mismo sistema: se aprende moviendo \u2014 predecir, animar, comparar \u2014 con intuici\u00f3n primero y despu\u00e9s el mecanismo, la complejidad y el c\u00f3digo. Esta portada es solo el mapa. Navegable por teclado.",
  };

})(window.GUIA = window.GUIA || {});
