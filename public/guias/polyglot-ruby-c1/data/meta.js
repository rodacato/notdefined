/* Identidad de la guía y definición de bloques.
   Fuente de verdad del hero, del ancla de versión y del orden de los bloques. */
(function (G) {
  var D = (G.datos = G.datos || {});

  D.guia = {
    coleccion: 'Polyglot · notdefined',
    lenguaje: 'RUBY · NIVEL C1',
    conteo: '15 temas · 4 bloques',
    titulo: 'Ruby dominado',
    lede: 'Lo que un senior hace con Ruby cuando ya no pregunta cómo se escribe. Criterios, trade-offs y el folklore que hay que desmontar — con el código como contenido, no como ejemplo.',
    ancla: 'evaluado con Ruby 4.0 · jul 2026',
    tesis: 'La pregunta de esta guía es «¿qué hago YO con Ruby?». Se consulta por el criterio que necesitas, no por el nombre del feature.',
    camino: 'Si llegas de golpe y no vienes por un tema en particular, arranca por los <b>◆◇◇</b> —<a href="#/tema/protocolos-de-mixin">Comparable y Enumerable</a>, <a href="#/tema/gotchas-de-errores">gotchas de errores</a>, <a href="#/tema/inmutabilidad-practica">inmutabilidad</a> — que son puro payoff. Los <b>◆◆◆</b> (eigenclass, self movedizo, argumentos con filo) déjalos para una segunda sentada: son los que muerden.'
  };

  D.bloques = [
    {
      id: 'modelo-de-objetos',
      folio: 'I',
      titulo: 'El modelo de objetos',
      color: '#5E86CE',
      modelo: 'la fila de casilleros',
      modeloLargo: 'Cada llamada en Ruby es una búsqueda: abre casilleros EN ORDEN (la cadena de ancestros) hasta que uno responde. Una clase no es una categoría — es una posición en esa fila. <code>include</code> mete un casillero justo debajo de la clase; <code>prepend</code> lo mete hasta adelante; la eigenclass es el casillero secreto que cada objeto trae solo para sí. Ver quién gana una llamada = ver en qué orden se abrieron los casilleros.',
      bajada:'Lo que resuelve tus llamadas: quién gana el lookup, dónde viven los métodos de clase, cómo se resuelve una constante.'
    },
    {
      id: 'metaprogramacion',
      folio: 'II',
      titulo: 'Metaprogramación práctica',
      color: '#B368AE',
      modelo: 'editar la fila en caliente',
      modeloLargo: 'Metaprogramación no es magia: es agregar, interceptar o mudar los mismos casilleros del bloque I mientras el programa ya corre. <code>define_method</code> clava un casillero de verdad (sale en el mapa, se cachea, aparece en <code>respond_to?</code>); <code>method_missing</code> es el portero al final del pasillo que atiende lo que nadie más quiso —y miente sobre qué sabe hacer si no le avisas con <code>respond_to_missing?</code>—; <code>instance_eval</code>/<code>class_eval</code> te cambian de cuarto para que tu <code>def</code> caiga en otro casillero. El criterio de todo el bloque: ¿construyo un cuarto real o pongo un portero que finge?',
      bajada:'Con criterio, no con fuegos artificiales. Cuándo generar métodos, cuándo mover self, cuándo parchar y cuándo no.'
    },
    {
      id: 'lenguaje-expresivo',
      folio: 'III',
      titulo: 'El lenguaje expresivo',
      color: '#8F9A3D',
      modelo: 'hablar el idioma de Ruby',
      modeloLargo: 'El bloque tiene dos caras de lo mismo: cómo PASAS comportamiento y argumentos sin que se pierda nada en el camino (bloques, procs, lambdas, forwarding), y cómo te ENGANCHAS a los protocolos que Ruby ya habla (un <code>each</code> te vuelve iterable, un <code>&lt;=&gt;</code> ordenable, un <code>deconstruct</code> destructurable). En las dos defines una pieza chica y el lenguaje te trata como si fueras built-in: hace el resto.',
      bajada:'Closures, argumentos con filo, pattern matching, enumerables y los protocolos de mixin que te dan decenas de métodos gratis.'
    },
    {
      id: 'robustez-concurrencia',
      folio: 'IV',
      titulo: 'Robustez y concurrencia práctica',
      color: '#2FA090',
      modelo: 'criterio bajo falla',
      modeloLargo: 'Aquí no aprendes un mecanismo nuevo: tomas decisiones y esquivas trampas conocidas. ¿El error es un valor o una excepción, y de quién heredas para no escaparte de todos los <code>rescue</code>? ¿Qué congelas de verdad, sabiendo que <code>freeze</code> es superficial? ¿Cuál de las cuatro herramientas de concurrencia agarras para cada trabajo? Poco mecanismo, puro criterio y trampas.',
      bajada:'El error como decisión de diseño, los gotchas que se tragan bugs, inmutabilidad real y qué modelo de concurrencia elegir.'
    }
  ];
})(window.GUIA = window.GUIA || {});
