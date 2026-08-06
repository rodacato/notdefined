/* Bloque I — El modelo de objetos. Tres fichas.
   El "mito" y el "cuándo NO" vienen del catálogo; el "en breve" se compone aquí. */
(function (G) {
  var D = (G.datos = G.datos || {});
  D.fichas = D.fichas || [];

  D.fichas.push({
    slug: 'method-lookup',
    dificultad: 2,
    folio: '01',
    bloque: 'modelo-de-objetos',
    titulo: 'Method lookup',
    subtitulo: 'ancestors, include/prepend, method_missing',
    quees: 'El orden exacto en que Ruby busca un método cuando llamas algo. Ese orden es una lista y la puedes leer: <code>ancestors</code>.',
    enBreve: [
      '<code>ancestors</code> es la respuesta literal: se recorre de izquierda a derecha y gana el primero que responda.',
      '<code>include</code> inserta debajo de la clase; <code>prepend</code> arriba; <code>extend</code> inserta en la singleton class del objeto.',
      'Si nadie responde, Ruby recorre la cadena OTRA VEZ buscando <code>method_missing</code> — el doble recorrido es el costo real.',
      'Cada método resuelto se cachea por (clase, nombre). Redefinir un método o abrir una clase invalida esa caché global.'
    ],
    fundamento: 'Ruby no tiene herencia múltiple, tiene <em>una</em> cadena lineal. Los módulos se linealizan al momento de incluirse y esa linealización es lo que hace que la herencia múltiple no explote: no hay ambigüedad que resolver en tiempo de llamada, solo una lista que recorrer. Por eso <code>ancestors</code> no es un diagnóstico, es <em>el modelo</em>.',
    comoFunciona: 'La posición de inserción es lo único que decide quién gana. Un módulo incluido queda entre la clase y su superclase, así que cualquier método definido en la clase lo pisa. Un módulo prepended queda antes de la clase, así que el módulo corre primero y decide si llama a <code>super</code>.',
    snippet: [
      'module Etiqueta',
      '  def nombre; "módulo"; end',
      'end',
      '',
      'module Encima',
      '  def nombre; "prepend → " + super; end',
      'end',
      '',
      'class Caja',
      '  include Etiqueta',
      '  def nombre; "clase"; end',
      'end',
      '',
      'Caja.ancestors     # => [Caja, Etiqueta, Object, Kernel, BasicObject]',
      'Caja.new.nombre    # => "clase"',
      '',
      'class Caja',
      '  prepend Encima',
      'end',
      '',
      'Caja.ancestors     # => [Encima, Caja, Etiqueta, Object, Kernel, BasicObject]',
      'Caja.new.nombre    # => "prepend → clase"'
    ].join('\n'),
    cuandoNo: 'No uses <code>method_missing</code> para «métodos dinámicos» si conoces los nombres: cada llamada recorre la cadena entera hasta el fondo y rompe los inline caches. Con nombres conocidos, <code>define_method</code> en load-time gana.',
    mito: {
      creencia: '«<code>include</code> mete el módulo ARRIBA de la clase, así que sus métodos ganan.»',
      realidad: 'Falso: <code>include</code> inserta el módulo JUSTO DEBAJO de la clase — gana la clase. El que va arriba y sí pisa a la clase es <code>prepend</code>. Media comunidad usa <code>include</code> esperando override y no entiende por qué su método no corre.'
    },
    widget: 'lookup',
    recursos: [
      { titulo: 'Module#ancestors, #include, #prepend', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Module.html', nota: 'La documentación de inserción es explícita sobre la posición. Léela una vez y ya.' },
      { titulo: 'Metaprogramming Ruby 2, cap. «Object Model»', fuente: 'Paolo Perrotta', nota: 'La explicación canónica del «one step to the right, then up».' },
      { titulo: 'Ruby method cache y inline caches', fuente: 'posts de Aaron Patterson (tenderlove)', url: 'https://tenderlovemaking.com/', nota: 'Por qué invalidar la caché de métodos es un costo global, no local.' }
    ]
  });

  D.fichas.push({
    slug: 'singleton-classes',
    dificultad: 3,
    folio: '02',
    bloque: 'modelo-de-objetos',
    titulo: 'Singleton classes',
    subtitulo: 'eigenclass, métodos de objeto y «métodos de clase»',
    quees: 'Cada objeto puede tener una clase anónima propia, insertada entre él y su clase real. Ahí viven sus métodos exclusivos.',
    enBreve: [
      '<code>obj.singleton_class</code> existe para casi todo; se crea de forma perezosa al primer <code>def obj.algo</code> o <code>extend</code>.',
      'Un «método de clase» es un método de instancia de <code>Klass.singleton_class</code>. Nada más.',
      'La singleton class de una clase hereda de la singleton class de su superclase — por eso los métodos de clase se heredan.',
      '<code>Integer</code>, <code>Symbol</code>, <code>nil</code>/<code>true</code>/<code>false</code> no admiten singleton methods (los tres últimos ya son singletons de <code>NilClass</code> y compañía).'
    ],
    fundamento: 'Ruby quería que todo fuera un objeto y que cualquier objeto pudiera comportarse distinto sin inventar una segunda cosa. La solución fue meter un eslabón invisible en la cadena: si el método está pegado al objeto, va en una clase que solo ese objeto ve. Así el lookup sigue siendo un solo mecanismo.',
    comoFunciona: '<code>def obj.metodo</code> materializa la eigenclass y define ahí. <code>obj.extend(M)</code> incluye M en esa eigenclass. <code>class &lt;&lt; obj</code> abre el mismo lugar. En una clase, <code>def self.metodo</code> y <code>class &lt;&lt; self</code> son el mismo movimiento.',
    snippet: [
      'caja = Object.new',
      'def caja.abrir; "solo yo"; end',
      '',
      'caja.singleton_class                # => #<Class:#<Object:0x...>>',
      'caja.singleton_methods             # => [:abrir]',
      'Object.new.respond_to?(:abrir)     # => false',
      '',
      'class Bodega',
      '  def self.inventario; :aqui; end',
      'end',
      '',
      'Bodega.singleton_class.instance_method(:inventario)',
      '# => #<UnboundMethod: #<Class:Bodega>#inventario>',
      'Bodega.singleton_class.ancestors.first(3)',
      '# => [#<Class:Bodega>, #<Class:Object>, #<Class:BasicObject>]'
    ].join('\n'),
    cuandoNo: 'No le pongas métodos singleton a objetos que creas por miles — cada eigenclass es una clase más que rastrear (lookup, shapes). Comportamiento compartido va en la clase o en un módulo.',
    mito: {
      creencia: '«Un "método de clase" es una categoría aparte de un método de instancia.»',
      realidad: 'Falso: es un método de INSTANCIA de la singleton class de la clase. No son dos mecanismos; es uno (lookup sobre la eigenclass) disfrazado de dos.'
    },
    widget: 'eigenclass',
    recursos: [
      { titulo: 'Object#singleton_class, #extend, #define_singleton_method', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Object.html', nota: 'La API completa cabe en una pantalla.' },
      { titulo: 'Metaprogramming Ruby 2, cap. «Singleton Methods»', fuente: 'Paolo Perrotta', nota: 'Incluye el diagrama de las siete reglas; es el que sí se queda en la cabeza.' },
      { titulo: 'Object Shapes en CRuby', fuente: 'charla RubyKaigi (Jemma Issroff)', url: 'https://rubykaigi.org/', nota: 'Por qué multiplicar eigenclasses tiene precio hoy más que antes.' }
    ]
  });

  D.fichas.push({
    slug: 'constantes-y-autoload',
    dificultad: 2,
    folio: '03',
    bloque: 'modelo-de-objetos',
    titulo: 'Constantes y autoload',
    subtitulo: 'Module.nesting, ancestros, ::X, Zeitwerk',
    quees: 'Las constantes se resuelven por un camino propio: primero léxico, después por herencia. Es el gotcha más caro del modelo de objetos.',
    enBreve: [
      'Orden real: <code>Module.nesting</code> (de dentro hacia fuera) → ancestros del <em>primer</em> elemento del nesting → <code>Object</code> si estás en top-level → <code>const_missing</code>.',
      '<code>module A::B</code> deja nesting <code>[A::B]</code>; <code>module A; module B</code> deja <code>[A::B, A]</code>. Distinto nesting, distinto resultado.',
      '<code>::X</code> salta todo y va a top-level. Un solo <code>::</code> al frente es la única forma de ser explícito.',
      '<code>autoload</code> es del intérprete y sigue vivo para gemas; Zeitwerk es convención de nombres + recarga, y es lo que usa Rails.'
    ],
    fundamento: 'Los métodos se buscan en el objeto: hay un receptor, y el receptor tiene cadena. Una constante no tiene receptor — se escribe en un lugar del archivo. Así que Ruby usa lo único que tiene: el contexto léxico donde apareció. Es coherente, pero es un segundo algoritmo de resolución que la gente asume idéntico al primero.',
    comoFunciona: 'El nesting se congela cuando se abre el cuerpo del módulo, no cuando corre la línea. Por eso reabrir con la forma compacta (<code>module A::B</code>) pierde el eslabón intermedio y una constante de <code>A</code> deja de verse, aunque el archivo de al lado sí la vea.',
    snippet: [
      'X = "top-level"',
      '',
      'module A',
      '  X = "de A"',
      '  module B',
      '    def self.cual; [Module.nesting, X]; end',
      '  end',
      'end',
      '',
      'A::B.cual   # => [[A::B, A], "de A"]',
      '',
      '# misma clase, reabierta con la forma compacta:',
      'module A::B',
      '  def self.cual2; [Module.nesting, X]; end',
      'end',
      '',
      'A::B.cual2  # => [[A::B], "top-level"]   # A ya no está en el nesting',
      'A::B.const_get(:X)  # => "de A"          # por ancestros/lexical parent sí'
    ].join('\n'),
    cuandoNo: 'No armes tu propio <code>autoload</code> a mano para la app — Zeitwerk ya resuelve carga y recarga; el autoload casero se rompe con nombres anidados y bajo threads. <code>autoload</code> queda para el arranque de gemas.',
    mito: {
      creencia: '«Las constantes se buscan igual que los métodos.»',
      realidad: 'Falso: primero es léxico (<code>Module.nesting</code>), después por ancestros. El gotcha: <code>module A; module B</code> vs <code>module A::B</code> cambian el nesting y con él el resultado.'
    },
    widget: 'constantes',
    recursos: [
      { titulo: 'Constant lookup', fuente: 'docs oficiales de Ruby (syntax/modules_and_classes)', url: 'https://docs.ruby-lang.org/en/master/syntax/modules_and_classes_rdoc.html', nota: 'El orden está escrito; casi nadie lo ha leído.' },
      { titulo: 'Zeitwerk — README y modo eager/lazy', fuente: 'Xavier Noria', url: 'https://github.com/fxn/zeitwerk', nota: 'Explica por qué el autoload casero falla justo con nombres anidados.' },
      { titulo: 'Everything you ever wanted to know about constant lookup', fuente: 'Conrad Irwin', nota: 'El artículo de referencia sobre las dos rutas (léxica y de ancestros).' }
    ]
  });
})(window.GUIA = window.GUIA || {});
