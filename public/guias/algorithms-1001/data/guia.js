/* ============================================================================
   data/guia.js — EL GUIÓN de la guía de decisión «¿Cuál algoritmo usar?»:
   comparaciones lado a lado, rasgos que inclinan la decisión y escenarios
   del quiz. La mecánica vive en js/page-guia.js.

   Para agregar una comparación: copia una entrada de `comparisons` (título,
   algos con traits/intent/pick, scenarios con answer + why) y ajusta ids.
   ========================================================================== */
(function (G) {
  "use strict";

  var DATA = (G.DATA = G.DATA || {});
  DATA.guia = {
    lede: "Rara vez el problema es no conocer el algoritmo: es <em>dudar entre dos que sirven para lo mismo</em>. Cada comparaci\u00f3n pone los candidatos lado a lado, resalta en \u00e1mbar el rasgo que inclina la decisi\u00f3n, y te deja probar el ojo con un escenario.",
    comparisons: [
      { id: "lineal-binaria", nav: "Lineal \u00b7 Binaria", title: ["B\u00fasqueda lineal", "B\u00fasqueda binaria"], same: "Encontrar un valor en una secuencia",
        tagline: "Las dos encuentran un valor. Lo \u00fanico que las separa es una precondici\u00f3n \u2014 y lo que esa precondici\u00f3n te regala en velocidad.",
        algos: [
          { id: "lineal", name: "B\u00fasqueda lineal", mod: 1, traits: [{ k: "Tiempo", v: "`O(n)`" }, { k: "Espacio", v: "`O(1)`" }, { k: "Requiere", v: "nada", hot: true }],
            intent: "No pide nada a cambio: recorre hasta encontrar. Es la l\u00ednea base universal, la \u00fanica opci\u00f3n cuando los datos no est\u00e1n ordenados.", pick: "cuando los datos no est\u00e1n ordenados, o solo vas a buscar una o dos veces." },
          { id: "binaria", name: "B\u00fasqueda binaria", mod: 1, traits: [{ k: "Tiempo", v: "`O(log n)`", hot: true }, { k: "Espacio", v: "`O(1)`" }, { k: "Requiere", v: "datos ordenados", hot: true }],
            intent: "Descarta la mitad del espacio en cada comparaci\u00f3n \u2014 pero exige que los datos ya est\u00e9n ordenados. Sin orden, descartar mitades es inv\u00e1lido.", pick: "cuando los datos ya est\u00e1n ordenados y vas a buscar muchas veces." },
        ],
        scenarios: [
          { prompt: "Los datos llegan sin ning\u00fan orden y solo necesito buscar una vez.", answer: "lineal", why: "Sin orden previo, la binaria no aplica; ordenar para una sola b\u00fasqueda no se amortiza." },
          { prompt: "Tengo un arreglo ordenado y hago miles de b\u00fasquedas por segundo.", answer: "binaria", why: "El orden ya est\u00e1 pagado; O(log n) por b\u00fasqueda le gana por goleada a O(n)." },
        ] },
      { id: "quick-merge", nav: "Quicksort \u00b7 Merge", title: ["Quicksort", "Merge sort"], same: "Ordenar en O(n log n) con divide y vencer\u00e1s",
        tagline: "Ambos parten el problema a la mitad y ordenan recursivamente. La decisi\u00f3n est\u00e1 en tres rasgos: garant\u00eda, memoria y estabilidad.",
        algos: [
          { id: "quick", name: "Quicksort", mod: 2, traits: [{ k: "Tiempo", v: "prom. `O(n log n)` \u00b7 peor `O(n\u00b2)`" }, { k: "Espacio", v: "prom. `O(log n)` \u00b7 peor `O(n)`", hot: true }, { k: "Estable", v: "no" }, { k: "In-place", v: "s\u00ed", hot: true }],
            intent: "Particiona in-place alrededor de un pivote. Rap\u00eddisimo en la pr\u00e1ctica por su localidad de cach\u00e9, con memoria m\u00ednima.", pick: "cuando quieres la mayor velocidad promedio y memoria m\u00ednima, sin necesitar estabilidad." },
          { id: "merge", name: "Merge sort", mod: 2, traits: [{ k: "Tiempo", v: "`O(n log n)` garantizado", hot: true }, { k: "Espacio", v: "`O(n)`", hot: true }, { k: "Estable", v: "s\u00ed", hot: true }, { k: "In-place", v: "no" }],
            intent: "Garantiza O(n log n) siempre (sin peor caso patol\u00f3gico) y preserva el orden de los elementos iguales \u2014 a cambio de O(n) de memoria extra.", pick: "cuando necesitas estabilidad, una garant\u00eda dura, o vas a ordenar listas enlazadas o datos que no caben en memoria." },
        ],
        scenarios: [
          { prompt: "Necesito una garant\u00eda de O(n log n) y que los registros con la misma clave conserven su orden original.", answer: "merge", why: "Merge sort es estable y garantiza O(n log n); quicksort no da ninguna de las dos." },
          { prompt: "Quiero el sort m\u00e1s r\u00e1pido en memoria, in-place, y la estabilidad me da igual.", answer: "quick", why: "Quicksort ordena in-place y suele ser el m\u00e1s r\u00e1pido en la pr\u00e1ctica." },
        ] },
      { id: "selection-insertion", nav: "Selection \u00b7 Insertion", title: ["Selection sort", "Insertion sort"], same: "Ordenar en O(n\u00b2), simple e in-place",
        tagline: "Los dos son cuadr\u00e1ticos y sencillos. La diferencia es qu\u00e9 minimizan: uno las escrituras, el otro el trabajo cuando ya casi est\u00e1 ordenado.",
        algos: [
          { id: "selection", name: "Selection sort", mod: 2, traits: [{ k: "Tiempo", v: "`O(n\u00b2)` siempre" }, { k: "Escrituras", v: "`O(n)` \u2014 m\u00ednimas", hot: true }, { k: "Adaptativo", v: "no" }, { k: "Estable", v: "no" }],
            intent: "Hace el menor n\u00famero de intercambios posible: un swap por pasada. Las comparaciones siguen siendo cuadr\u00e1ticas.", pick: "cuando escribir en memoria es mucho m\u00e1s caro que comparar." },
          { id: "insertion", name: "Insertion sort", mod: 2, traits: [{ k: "Tiempo", v: "peor `O(n\u00b2)` \u00b7 casi ordenado `O(n)`" }, { k: "Adaptativo", v: "s\u00ed", hot: true }, { k: "Estable", v: "s\u00ed", hot: true }, { k: "En flujo", v: "s\u00ed" }],
            intent: "Es adaptativo: sobre datos casi ordenados hace casi O(n). Por eso vive dentro de los sorts h\u00edbridos, para los subarreglos peque\u00f1os.", pick: "cuando los datos llegan casi ordenados, o en flujo (uno a uno)." },
        ],
        scenarios: [
          { prompt: "Mis datos ya llegan casi ordenados, con solo unos pocos fuera de lugar.", answer: "insertion", why: "Insertion sort es adaptativo: sobre datos casi ordenados hace casi O(n)." },
          { prompt: "Cada escritura a la memoria es car\u00edsima; quiero minimizar los swaps.", answer: "selection", why: "Selection sort hace O(n) intercambios \u2014 casi el m\u00ednimo (el r\u00e9cord exacto lo tiene cycle sort)." },
        ] },
      { id: "bfs-dfs", nav: "BFS \u00b7 DFS", title: ["BFS", "DFS"], same: "Recorrer un grafo, visitando cada nodo y arista una vez",
        tagline: "Mismo costo O(V+E), misma cobertura. Lo \u00fanico que cambia es la estructura que guarda los pendientes \u2014 y con ella, el orden de visita.",
        algos: [
          { id: "bfs", name: "BFS", mod: 5, traits: [{ k: "Tiempo", v: "`O(V+E)`" }, { k: "Estructura", v: "cola (FIFO)", hot: true }, { k: "Orden", v: "por niveles de distancia", hot: true }, { k: "Regala", v: "camino m\u00e1s corto sin pesos" }],
            intent: "Explora en anillos crecientes de distancia: el primer camino que encuentra a cada nodo es el m\u00e1s corto en n\u00famero de aristas.", pick: "cuando quieres el camino m\u00e1s corto sin pesos, o explorar por cercan\u00eda al origen." },
          { id: "dfs", name: "DFS", mod: 5, traits: [{ k: "Tiempo", v: "`O(V+E)`" }, { k: "Estructura", v: "pila (LIFO / recursi\u00f3n)", hot: true }, { k: "Orden", v: "profundidad primero", hot: true }, { k: "Regala", v: "ciclos \u00b7 topol\u00f3gico \u00b7 componentes" }],
            intent: "Se hunde por una rama hasta el fondo y retrocede. No da el camino m\u00e1s corto, pero es la base del orden topol\u00f3gico y la detecci\u00f3n de ciclos.", pick: "cuando quieres detectar ciclos, ordenar dependencias o explorar exhaustivamente." },
        ],
        scenarios: [
          { prompt: "Quiero los grados de separaci\u00f3n (camino con menos saltos) entre dos personas de una red social.", answer: "bfs", why: "BFS expande por niveles: el primer camino a cada nodo es el m\u00e1s corto en saltos." },
          { prompt: "Necesito detectar si hay un ciclo en un grafo de dependencias.", answer: "dfs", why: "DFS detecta ciclos al encontrar una arista de vuelta durante el hundimiento." },
        ] },
      { id: "corto", nav: "BFS \u00b7 Dijkstra \u00b7 A*", title: ["BFS", "Dijkstra", "A*"], same: "Encontrar el camino m\u00e1s corto de un origen a un destino",
        tagline: "Los tres buscan el camino m\u00e1s corto. La elecci\u00f3n depende de dos cosas: \u00bfhay pesos en las aristas?, \u00bftienes una buena estimaci\u00f3n de la meta?",
        algos: [
          { id: "bfs", name: "BFS", mod: 5, traits: [{ k: "Tiempo", v: "`O(V+E)`" }, { k: "Pesos", v: "ninguno", hot: true }, { k: "Heur\u00edstica", v: "\u2014" }],
            intent: "El m\u00e1s simple de los tres \u2014 pero solo cuenta saltos, ignora cualquier peso en las aristas.", pick: "cuando las aristas no tienen peso (o todas pesan igual)." },
          { id: "dijkstra", name: "Dijkstra", mod: 5, traits: [{ k: "Tiempo", v: "`O((V+E) log V)`" }, { k: "Pesos", v: "\u2265 0", hot: true }, { k: "Heur\u00edstica", v: "ninguna" }],
            intent: "Fija el nodo no visitado m\u00e1s cercano y relaja sus aristas. \u00d3ptimo con pesos no negativos, explorando en todas direcciones.", pick: "cuando hay pesos y no tienes una buena estimaci\u00f3n de la distancia a la meta." },
          { id: "astar", name: "A*", mod: 5, traits: [{ k: "Tiempo", v: "\u2264 Dijkstra" }, { k: "Pesos", v: "\u2265 0" }, { k: "Heur\u00edstica", v: "admisible", hot: true }],
            intent: "Una heur\u00edstica que estima el costo restante lo jala hacia la meta: explora muchos menos nodos que Dijkstra. Con heur\u00edstica cero, es Dijkstra.", pick: "cuando tienes una estimaci\u00f3n admisible del costo a la meta (mapas, grillas)." },
        ],
        scenarios: [
          { prompt: "Grafo sin pesos; quiero el camino con la menor cantidad de saltos.", answer: "bfs", why: "Sin pesos, BFS ya da el camino m\u00e1s corto \u2014 no hace falta m\u00e1s maquinaria." },
          { prompt: "Ruta en un mapa, con la distancia en l\u00ednea recta como pista hacia el destino.", answer: "astar", why: "Esa distancia es una heur\u00edstica admisible; A* la usa para no explorar de m\u00e1s." },
          { prompt: "Aristas con peso, pero no tengo ninguna buena estimaci\u00f3n de la meta.", answer: "dijkstra", why: "Sin heur\u00edstica \u00fatil, Dijkstra es la opci\u00f3n correcta con pesos no negativos." },
        ] },
      { id: "array-lista", nav: "Arreglo \u00b7 Lista", title: ["Arreglo", "Lista enlazada"], same: "Guardar una secuencia de elementos",
        tagline: "El trade-off es sim\u00e9trico y exacto: lo que uno hace en O(1), el otro lo hace en O(n), y viceversa. Todo depende de tu patr\u00f3n de acceso.",
        algos: [
          { id: "array", name: "Arreglo", mod: 4, traits: [{ k: "Acceso [i]", v: "`O(1)`", hot: true }, { k: "Insertar", v: "`O(n)` en medio" }, { k: "Memoria", v: "contigua \u00b7 gran localidad", hot: true }],
            intent: "Memoria contigua: acceso instant\u00e1neo por \u00edndice (es aritm\u00e9tica de direcciones), pero insertar o borrar en medio obliga a desplazar.", pick: "cuando lees por \u00edndice mucho m\u00e1s de lo que insertas o borras en medio." },
          { id: "lista", name: "Lista enlazada", mod: 4, traits: [{ k: "Acceso [i]", v: "`O(n)`" }, { k: "Insertar", v: "`O(1)` con el nodo", hot: true }, { k: "Memoria", v: "dispersa \u00b7 poca localidad" }],
            intent: "Nodos dispersos enlazados por punteros: insertar o borrar es trivial si ya tienes el nodo, pero llegar al k-\u00e9simo obliga a caminar.", pick: "cuando insertas y borras por todos lados y rara vez accedes por \u00edndice." },
        ],
        scenarios: [
          { prompt: "Accedo constantemente por \u00edndice y casi nunca inserto en medio.", answer: "array", why: "El acceso O(1) por \u00edndice del arreglo es justo lo que este patr\u00f3n premia." },
          { prompt: "Inserto y borro por todos lados, y normalmente ya tengo el nodo a la mano.", answer: "lista", why: "Con el nodo en mano, insertar y borrar en la lista es O(1)." },
        ] },
      { id: "hash-bst", nav: "Hash \u00b7 \u00c1rbol", title: ["Tabla hash", "\u00c1rbol de b\u00fasqueda"], same: "Buscar un valor por su clave",
        tagline: "Los dos buscan por clave. La pregunta que decide es una sola: \u00bfnecesitas que las claves mantengan un orden?",
        algos: [
          { id: "hash", name: "Tabla hash", mod: 4, traits: [{ k: "Buscar", v: "`O(1)` promedio", hot: true }, { k: "Orden", v: "ninguno", hot: true }, { k: "Rangos", v: "no" }],
            intent: "La funci\u00f3n hash lleva directo a la cubeta: acceso O(1) promedio \u2014 pero pierde por completo cualquier orden entre las claves.", pick: "cuando solo necesitas buscar e insertar por clave, sin recorrer en orden." },
          { id: "bst", name: "\u00c1rbol de b\u00fasqueda", mod: 4, traits: [{ k: "Buscar", v: "`O(log n)` balanceado" }, { k: "Orden", v: "mantiene claves ordenadas", hot: true }, { k: "Rangos", v: "s\u00ed", hot: true }],
            intent: "Mantiene las claves ordenadas por su invariante izquierda<nodo<derecha: permite recorrer en orden, consultar rangos y hallar vecinos.", pick: "cuando necesitas orden, rangos o el vecino m\u00e1s cercano, adem\u00e1s de buscar." },
        ],
        scenarios: [
          { prompt: "Solo necesito buscar por clave lo m\u00e1s r\u00e1pido posible; el orden me da igual.", answer: "hash", why: "La tabla hash da O(1) promedio; el orden que sacrifica no te hace falta." },
          { prompt: "Necesito recorrer las claves en orden ascendente y consultar rangos.", answer: "bst", why: "El \u00e1rbol mantiene el orden; el hash tendr\u00eda que ordenar todo cada vez." },
        ] },
      { id: "greedy-dp", nav: "Greedy \u00b7 DP", title: ["Greedy", "Programaci\u00f3n din\u00e1mica"], same: "Optimizar una secuencia de decisiones",
        tagline: "Ambos optimizan decisiones encadenadas. La diferencia es si te puedes comprometer con la mejor opci\u00f3n de ahora sin arrepentirte despu\u00e9s.",
        algos: [
          { id: "greedy", name: "Greedy", mod: 6, traits: [{ k: "Estrategia", v: "mejor opci\u00f3n local", hot: true }, { k: "Reconsidera", v: "nunca", hot: true }, { k: "Costo", v: "r\u00e1pido \u00b7 `O(n log n)` t\u00edpico" }],
            intent: "Se compromete con la mejor opci\u00f3n local y no vuelve atr\u00e1s. Solo da el \u00f3ptimo global si el problema tiene la propiedad de elecci\u00f3n greedy.", pick: "cuando puedes demostrar que la elecci\u00f3n local lleva al \u00f3ptimo (o basta una aproximaci\u00f3n)." },
          { id: "knapsack", name: "Programaci\u00f3n din\u00e1mica", mod: 6, traits: [{ k: "Estrategia", v: "explora subproblemas", hot: true }, { k: "Reconsidera", v: "s\u00ed \u00b7 reutiliza (tabla)", hot: true }, { k: "Costo", v: "m\u00e1s tiempo y memoria" }],
            intent: "No se compromete: explora los subproblemas solapados y reutiliza sus resultados. Paga con tiempo y memoria la garant\u00eda de optimalidad.", pick: "cuando una elecci\u00f3n local puede arruinar el futuro y hay subproblemas que se repiten." },
        ],
        scenarios: [
          { prompt: "Selecci\u00f3n de actividades: quiero la mayor cantidad de reuniones sin traslape.", answer: "greedy", why: "Tomar siempre la que termina antes es demostrablemente \u00f3ptimo \u2014 caso greedy cl\u00e1sico." },
          { prompt: "Mochila 0/1: maximizar el valor sin pasar la capacidad, donde una mala elecci\u00f3n temprana arruina el total.", answer: "knapsack", why: "Aqu\u00ed greedy falla; la DP explora las combinaciones y garantiza el \u00f3ptimo." },
        ] },
    ],
  };

})(window.GUIA = window.GUIA || {});
