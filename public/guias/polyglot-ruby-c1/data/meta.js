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
    tesis: 'La pregunta de esta guía es «¿qué hago YO con Ruby?». Se consulta por el criterio que necesitas, no por el nombre del feature.'
  };

  D.bloques = [
    {
      id: 'modelo-de-objetos',
      folio: 'I',
      titulo: 'El modelo de objetos',
      bajada: 'Lo que resuelve tus llamadas: quién gana el lookup, dónde viven los métodos de clase, cómo se resuelve una constante.'
    },
    {
      id: 'metaprogramacion',
      folio: 'II',
      titulo: 'Metaprogramación práctica',
      bajada: 'Con criterio, no con fuegos artificiales. Cuándo generar métodos, cuándo mover self, cuándo parchar y cuándo no.'
    },
    {
      id: 'lenguaje-expresivo',
      folio: 'III',
      titulo: 'El lenguaje expresivo',
      bajada: 'Closures, argumentos con filo, pattern matching, enumerables y los protocolos de mixin que te dan decenas de métodos gratis.'
    },
    {
      id: 'robustez-concurrencia',
      folio: 'IV',
      titulo: 'Robustez y concurrencia práctica',
      bajada: 'El error como decisión de diseño, los gotchas que se tragan bugs, inmutabilidad real y qué modelo de concurrencia elegir.'
    }
  ];
})(window.GUIA = window.GUIA || {});
