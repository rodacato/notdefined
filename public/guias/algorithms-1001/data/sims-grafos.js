/* ============================================================================
   data/sims-grafos.js — EL GUIÓN de Grafos (módulo 05): representación, BFS, DFS, topológico, Dijkstra, A* y MST.
   Solo contenido: textos, escenarios y complejidades; la mecánica vive en js/.
   ── Cómo agregar una simulación nueva ────────────────────────────────────
   1. Añade su entrada en el sims-*.js de su familia con esta forma:
        miClave: {
          title: "Título visible",
          intro: "Párrafo de introducción (admite <b>, <i>).",
          scenario: { seed: 7, len: 12 },   // parámetros del PRNG
          cx: "<p>Explicación de complejidad en HTML…</p>",
        }
   2. En el módulo correspondiente (js/page-<dominio>.js) referencia esa clave.
   Para corregir un texto o cambiar el arreglo de ejemplo, edita aquí y ya.
   ========================================================================== */
(function (G) {
  "use strict";

  var DATA = (G.DATA = G.DATA || {});
  DATA.sims = DATA.sims || {};

  Object.assign(DATA.sims, {


    /* ---- Módulo 05 · Grafos (7 sims) ---- */
    "grafo-repr": {
      title: "Anatom\u00eda y representaci\u00f3n de un grafo",
      intro: "Un grafo son nodos y aristas. Antes de recorrerlo, hay que guardarlo: la <b>matriz</b> es una tabla de qui\u00e9n-con-qui\u00e9n; la <b>lista</b> es, por cada nodo, su libreta de vecinos. Mismos datos, dos formas.",
    },

    bfs: {
      title: "BFS \u2014 b\u00fasqueda en anchura",
      intro: "Como una onda que se expande desde el origen: visita todos los vecinos a distancia 1, luego los de distancia 2, y as\u00ed. Una <b>cola FIFO</b> mantiene el orden, y al final tienes el camino m\u00e1s corto en saltos.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-cand)\">O(V + E)</b>: cada nodo entra y sale de la cola una vez (V), y cada arista se mira una vez (E).</p>" +
        "<ul class=\"cx-list\"><li>Sobre grafos sin peso, BFS da el <b>camino m\u00e1s corto en n\u00famero de saltos</b>.</li><li>La cola garantiza explorar por anillos: toda la distancia 1 antes que la 2.</li></ul>",
    },

    dfs: {
      title: "DFS \u2014 b\u00fasqueda en profundidad",
      intro: "El contraste de BFS: en vez de expandirse en anillos, se hunde hasta el fondo de una rama y solo entonces retrocede. Una <b>pila LIFO</b> (o la recursi\u00f3n) lleva el rastro de por d\u00f3nde volver.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-cand)\">O(V + E)</b>, igual que BFS: cada nodo y cada arista una vez. Lo que cambia es el <b>orden</b>, no el costo.</p>" +
        "<ul class=\"cx-list\"><li>BFS usa cola (FIFO) y explora cerca primero; DFS usa pila (LIFO) y va lejos primero.</li><li>DFS no da el camino m\u00e1s corto, pero es la base de orden topol\u00f3gico, componentes y ciclos.</li></ul>",
    },

    topo: {
      title: "Orden topol\u00f3gico (Kahn)",
      intro: "Ordenar tareas respetando dependencias \u2014 como prerequisitos de materias o pasos de un build: no puedes hacer algo antes que aquello de lo que depende. Se hace tomando, una y otra vez, un nodo con <b>indegree 0</b>.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-cand)\">O(V + E)</b>: calculamos indegrees mirando cada arista, y cada nodo entra/sale de la cola de listos una vez.</p>" +
        "<ul class=\"cx-list\"><li>Solo los <b>DAG</b> (dirigidos sin ciclos) tienen orden topol\u00f3gico.</li><li>Prueba \u201cintroducir un ciclo\u201d: el algoritmo se atora y as\u00ed <b>detecta el ciclo</b>.</li><li>Cuando hay varios con indegree 0, el orden no es \u00fanico: hay varias soluciones v\u00e1lidas.</li></ul>",
    },

    dijkstra: {
      title: "Dijkstra \u2014 camino m\u00e1s corto con pesos",
      intro: "Cuando las aristas tienen peso, BFS ya no basta: el camino con menos saltos no es el m\u00e1s barato. Dijkstra mantiene una <b>distancia tentativa</b> por nodo y la va <b>relajando</b>, visitando siempre el m\u00e1s cercano.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-cand)\">O((V+E) log V)</b> con una cola de prioridad (un heap, como el del m\u00f3dulo 04): sacar el m\u00ednimo es log V, y relajamos cada arista.</p>" +
        "<ul class=\"cx-list\"><li>\u201cRelajar\u201d = si un camino por el nodo actual es m\u00e1s corto, bajo la etiqueta del vecino.</li><li>Falla con <b>pesos negativos</b>: un nodo ya visitado podr\u00eda mejorarse despu\u00e9s (ah\u00ed se usa Bellman-Ford).</li><li>Con todos los pesos iguales, Dijkstra se reduce a BFS.</li></ul>",
    },

    astar: {
      title: "A* \u2014 b\u00fasqueda informada en una grilla",
      intro: "Dijkstra explora en todas direcciones; A* le suma una <b>heur\u00edstica</b> que estima cu\u00e1nto falta a la meta y \u201cjala\u201d la b\u00fasqueda hacia ella. Misma garant\u00eda de \u00f3ptimo, muchas menos celdas exploradas.",
      cx: "<p>A* es Dijkstra con prioridad <b class=\"mono\">f = g + h</b>. El costo depende de la heur\u00edstica: cuanto mejor estima, menos celdas expande.</p>" +
        "<ul class=\"cx-list\"><li>Con heur\u00edstica <b>cero</b>, f = g y A* se vuelve Dijkstra: explora en todas direcciones. Cambia a \u201ccero\u201d y mira crecer las celdas cerradas.</li><li>La heur\u00edstica debe ser <b>admisible</b> (nunca sobreestimar) para garantizar el camino \u00f3ptimo. Manhattan lo es en una grilla sin diagonales.</li><li>Mueve la meta y mira c\u00f3mo la frontera se \u201cestira\u201d hacia ella.</li></ul>",
    },

    mst: {
      title: "\u00c1rbol de expansi\u00f3n m\u00ednima (MST)",
      intro: "La red m\u00e1s barata que conecta todos los nodos sin ciclos. Dos estrategias greedy distintas \u2014 <b>Kruskal</b> (por aristas) y <b>Prim</b> (haciendo crecer un \u00e1rbol) \u2014 llegan al mismo peso total.",
      cx: "<p><b class=\"tag-mono\" style=\"color:var(--st-cand)\">Kruskal O(E log E)</b> (ordenar aristas + Union-Find casi O(1)); <b class=\"tag-mono\" style=\"color:var(--st-cand)\">Prim O((V+E) log V)</b> con cola de prioridad.</p>" +
        "<ul class=\"cx-list\"><li>Ambos son <b>greedy</b> y dan el mismo peso total, aunque elijan aristas en distinto orden \u2014 prueba los dos.</li><li>Kruskal piensa en aristas globales; Prim hace crecer una sola regi\u00f3n desde un nodo.</li><li>La fusi\u00f3n de componentes de Kruskal es Union-Find: las etiquetas muestran a qu\u00e9 componente pertenece cada nodo.</li></ul>",
    },

  });

  /* --- Datasets de grafo (coordenadas fijas, deterministas) --- */
  DATA.graphs = {
    GRAPH_W: {
      nodes: [
        { id: "A", x: 170, y: 42 }, { id: "B", x: 58, y: 118 }, { id: "C", x: 282, y: 110 },
        { id: "D", x: 124, y: 212 }, { id: "E", x: 250, y: 210 }, { id: "F", x: 350, y: 156 },
      ],
      edges: [
        { u: "A", v: "B", w: 4 }, { u: "A", v: "C", w: 3 }, { u: "B", v: "D", w: 6 },
        { u: "C", v: "D", w: 2 }, { u: "C", v: "E", w: 5 }, { u: "D", v: "E", w: 1 },
        { u: "C", v: "F", w: 7 }, { u: "E", v: "F", w: 3 },
      ],
    },
    DAG: {
      nodes: [
        { id: "A", x: 50, y: 50 }, { id: "B", x: 50, y: 170 }, { id: "C", x: 165, y: 50 },
        { id: "D", x: 165, y: 170 }, { id: "E", x: 280, y: 110 }, { id: "F", x: 370, y: 110 },
      ],
      edges: [
        { u: "A", v: "C" }, { u: "A", v: "D" }, { u: "B", v: "D" },
        { u: "C", v: "E" }, { u: "D", v: "E" }, { u: "D", v: "F" }, { u: "E", v: "F" },
      ],
    },
  };

})(window.GUIA = window.GUIA || {});
