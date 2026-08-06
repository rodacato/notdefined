/* Bloque II — Metaprogramación práctica. Tres fichas. */
(function (G) {
  var D = (G.datos = G.datos || {});
  D.fichas = D.fichas || [];

  D.fichas.push({
    slug: 'define-method-vs-method-missing',
    dificultad: 2,
    folio: '04',
    bloque: 'metaprogramacion',
    titulo: 'define_method y method_missing',
    subtitulo: 'cuándo cada uno, respond_to_missing?, el costo real',
    quees: 'Las dos formas de tener métodos que no escribiste a mano. Una genera métodos reales; la otra intercepta lo que ya falló.',
    enBreve: [
      '<code>define_method</code> crea un método real: sale en <code>instance_methods</code>, en <code>respond_to?</code>, en <code>method(:x)</code> y se cachea.',
      '<code>method_missing</code> corre <em>después</em> de que el lookup completo falló: cadena entera, dos veces.',
      'Sin <code>respond_to_missing?</code>, tu objeto miente: responde la llamada pero dice <code>false</code> en <code>respond_to?</code> y rompe <code>method(:x)</code> y <code>to_proc</code>.',
      'El bloque de <code>define_method</code> es un closure: captura el binding del load-time (útil para meter configuración sin variables de clase).'
    ],
    fundamento: 'Ruby distingue «no sé qué es esto» de «esto no existe». <code>method_missing</code> es el hook del primer caso y por diseño está al final del camino — es un manejador de error, no un generador. Cuando lo usas como generador, pagas el camino de error en cada llamada del happy path.',
    comoFunciona: 'Generas en load-time con <code>define_method</code> iterando sobre los nombres que conoces. Si el conjunto es abierto, interceptas con <code>method_missing</code> + <code>respond_to_missing?</code> y, si el nombre se va a repetir, te defines el método sobre la marcha para no volver a pagar el fallo.',
    snippet: [
      'class Config',
      '  FIELDS = %i[host port tls]',
      '',
      '  FIELDS.each do |field|',
      '    define_method(field) { @data[field] }',
      '  end',
      '',
      '  def initialize(**data); @data = data; end',
      'end',
      '',
      'c = Config.new(host: "db.local", port: 5432)',
      'c.port                       # => 5432',
      'c.respond_to?(:port)         # => true',
      'Config.instance_methods(false).sort  # => [:host, :port, :tls]',
      '#   initialize no sale: Ruby lo hace privado solo. Y sin .sort el orden',
      '#   es el de la tabla de métodos, no el de definición.',
      '',
      '# catch-all honesto: define el método al primer uso',
      'class Proxy',
      '  def initialize(target); @target = target; end',
      '',
      '  def method_missing(name, *args, &blk)',
      '    return super unless @target.respond_to?(name)',
      '    self.class.define_method(name) { |*a, &b| @target.public_send(name, *a, &b) }',
      '    public_send(name, *args, &blk)',
      '  end',
      '',
      '  def respond_to_missing?(name, priv = false)',
      '    @target.respond_to?(name, priv) || super',
      '  end',
      'end',
      '',
      'p = Proxy.new([3, 1, 2])',
      'p.sort                         # => [1, 2, 3]   # primera vez: pasa por method_missing',
      'Proxy.instance_methods(false).sort  # => [:method_missing, :sort]',
      '#   respond_to_missing? tampoco sale: Ruby lo hace privado igual que initialize'
    ].join('\n'),
    cuandoNo: 'No uses <code>method_missing</code> si puedes enumerar los nombres. Solo paga cuando el conjunto es abierto de verdad (proxies, delegación a un backend desconocido, DSLs).',
    mito: {
      creencia: '«<code>method_missing</code> es como se hacen los métodos dinámicos en Ruby.»',
      realidad: 'Falso: es el ÚLTIMO recurso. <code>define_method</code> genera métodos reales (salen en <code>respond_to?</code>, se cachean, aparecen en el lookup); <code>method_missing</code> es un catch-all que rompe cachés y MIENTE en <code>respond_to?</code> si no defines <code>respond_to_missing?</code>.'
    },
    escena: {
      titulo: 'Métodos reales contra un portero',
      pasos: [
        {
          lineas: [1, 9],
          nota: 'Tres campos conocidos, generados en load-time. Nada de <code>method_missing</code> aquí — se define un método por nombre.',
          predice: {
            pregunta: '<code>Config.instance_methods(false)</code> — ¿qué sale?',
            opciones: [
              'Los tres campos y <code>initialize</code>: cuatro métodos',
              'Solo los tres campos'
            ],
            correcta: 1,
            porque: 'Ruby hace <code>initialize</code> privado él solo, así que no aparece en <code>instance_methods</code>. Es un detalle chico que delata si generaste métodos de verdad o estás leyendo otra cosa.'
          }
        },
        {
          lineas: [11, 16],
          nota: 'Métodos reales: salen en la lista, contestan <code>respond_to?</code> y se cachean. Y sin <code>.sort</code> el orden es el de la tabla de métodos, no el de definición.',
          salida: 'c.port                               # => 5432\nConfig.instance_methods(false).sort  # => [:host, :port, :tls]'
        },
        {
          lineas: [19, 31],
          nota: 'Ahora el otro camino, cuando el conjunto de nombres <em>sí</em> es abierto: un catch-all que se define el método al primer uso, para no volver a pagar el fallo.',
          predice: {
            pregunta: 'Después de llamar <code>p.sort</code> una vez, ¿qué trae <code>Proxy.instance_methods(false)</code>?',
            opciones: [
              'Los cuatro: <code>sort</code>, <code>initialize</code>, <code>method_missing</code> y <code>respond_to_missing?</code>',
              'Dos: <code>method_missing</code> y el <code>sort</code> recién nacido'
            ],
            correcta: 1,
            porque: '<code>respond_to_missing?</code> también lo hace privado Ruby solo, igual que <code>initialize</code>. Dato que casi nadie tiene y que explica por qué no lo ves donde lo buscas.'
          }
        },
        {
          lineas: [33, 36],
          nota: 'El criterio del bloque, en una línea: si puedes enumerar los nombres, <code>define_method</code>. Si no puedes, catch-all — pero honesto, con <code>respond_to_missing?</code>.',
          salida: 'p.sort                              # => [1, 2, 3]\nProxy.instance_methods(false).sort  # => [:method_missing, :sort]'
        }
      ]
    },

    callout: {
      dice: "Struct genera métodos de verdad, no un catch-all — compruébalo:",
      cmd: "p Struct.new(:a).instance_methods(false).sort",
      sale: "[:a, :a=]"
    },
    widget: 'generacion',
    recursos: [
      { titulo: 'BasicObject#method_missing y Object#respond_to_missing?', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/BasicObject.html', nota: 'La doc dice literalmente que llames a <code>super</code> si no reconoces el nombre.' },
      { titulo: 'Metaprogramming Ruby 2, cap. «Dynamic Methods» / «Ghost Methods»', fuente: 'Paolo Perrotta', nota: 'La distinción dynamic vs ghost method es de aquí.' },
      { titulo: 'Forwardable y Delegator en stdlib', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Forwardable.html', nota: 'Antes de escribir tu proxy: <code>def_delegators</code> genera métodos reales.' }
    ]
  });

  D.fichas.push({
    slug: 'self-movedizo',
    dificultad: 3,
    folio: '05',
    bloque: 'metaprogramacion',
    titulo: 'El self movedizo',
    subtitulo: 'instance_eval, class_eval, instance_exec',
    quees: 'Tres formas de correr un bloque cambiando quién es <code>self</code> — y, por separado, cambiando dónde caen los <code>def</code>.',
    enBreve: [
      'Son dos cosas independientes: el <em>self</em> del bloque y el <em>default definee</em> (dónde aterriza un <code>def</code>).',
      '<code>instance_eval</code>: self = receptor, definee = singleton class del receptor.',
      '<code>class_eval</code> (sobre una clase): self = la clase, definee = la clase → métodos de instancia.',
      '<code>instance_exec</code> = <code>instance_eval</code> con argumentos al bloque. Las variantes <code>*_exec</code> existen solo por eso.'
    ],
    fundamento: 'Un bloque en Ruby carga su binding, pero <em>no</em> carga su self de forma inmutable: el intérprete puede reemplazarlo al invocarlo. De ahí salen todos los DSLs de Ruby. El precio es que el mismo bloque significa cosas distintas según quién lo corra, y eso lo vuelve difícil de leer sin contexto.',
    comoFunciona: 'Dentro del bloque, los métodos sin receptor se despachan contra el nuevo self; las variables locales siguen siendo las del lugar donde escribiste el bloque. Por eso un DSL con <code>instance_eval</code> puede leer tus locales pero no llamar a tus métodos.',
    snippet: [
      'class Box; end',
      'box = Box.new',
      '',
      'box.instance_eval { def lid; :singleton; end }',
      'box.lid                        # => :singleton',
      'box.singleton_methods           # => [:lid]',
      'Box.instance_methods(false)     # => []',
      '',
      'Box.class_eval { def lid2; :instance; end }',
      'Box.new.lid2                   # => :instance',
      'Box.instance_methods(false)     # => [:lid2]',
      '',
      'Box.instance_eval { def factory; :class_method; end }',
      'Box.factory                     # => :class_method',
      '',
      'label = "from the caller"',
      'box.instance_exec(3) { |n| [self.class, n, label] }',
      '# => [Box, 3, "from the caller"]   # self cambió, el binding no'
    ].join('\n'),
    cuandoNo: 'No uses <code>instance_eval</code> con bloque para un DSL si el bloque necesita el scope del caller — al cambiar self, los métodos del objeto que llama desaparecen. Ahí <code>yield self</code> (bloque con argumento) es menos mágico y no rompe el binding.',
    mito: {
      creencia: '«<code>instance_eval</code> y <code>class_eval</code> hacen casi lo mismo.»',
      realidad: 'Falso: <code>instance_eval</code> cambia self y define en la singleton class del receptor; <code>class_eval</code> (sobre una clase) define métodos de INSTANCIA de esa clase. Confundirlos = tu <code>def</code> termina en el lugar equivocado.'
    },
    escena: {
      titulo: 'Dónde cae el def',
      pasos: [
        {
          lineas: [1, 4],
          nota: 'Un <code>def</code> dentro de un bloque que corre con <code>instance_eval</code> sobre una <em>instancia</em>. Son dos cosas independientes: quién es <code>self</code>, y dónde aterriza el <code>def</code>.',
          predice: {
            pregunta: '¿Dónde queda <code>lid</code>?',
            opciones: [
              'Como método de instancia de <code>Box</code>: todas las cajas lo tendrán',
              'En la singleton class de <code>box</code>: solo esa caja'
            ],
            correcta: 1,
            porque: '<code>instance_eval</code> pone <code>self</code> en el receptor <b>y</b> el definee en su singleton class. Por eso el <code>def</code> aterriza pegado al objeto, no a la clase.'
          }
        },
        {
          lineas: [5, 7],
          nota: 'Solo esa caja. <code>Box</code> quedó sin un método nuevo — otra instancia no sabe nada de <code>lid</code>.',
          salida: 'box.singleton_methods        # => [:lid]\nBox.instance_methods(false)  # => []'
        },
        {
          lineas: [9, 11],
          nota: 'Cambio una palabra: <code>class_eval</code> sobre la <em>clase</em>. El bloque es idéntico en forma.',
          predice: {
            pregunta: '¿Y ahora dónde cae?',
            opciones: [
              'También en una singleton class: son casi lo mismo',
              'Como método de instancia de <code>Box</code>'
            ],
            correcta: 1,
            porque: 'Aquí está la diferencia que la gente confunde: <code>class_eval</code> sobre una clase define métodos de INSTANCIA de esa clase. Confundirlos = tu <code>def</code> termina en el lugar equivocado y no entiendes por qué.'
          }
        },
        {
          lineas: [13, 14],
          nota: 'El tercer caso, el que amarra los dos anteriores: <code>instance_eval</code> pero sobre la clase.',
          predice: {
            pregunta: '<code>Box.instance_eval { def factory; end }</code> — ¿qué acabo de definir?',
            opciones: [
              'Un método de instancia más',
              'Un método de CLASE: <code>Box.factory</code>'
            ],
            correcta: 1,
            porque: 'Coherente con el paso 1: <code>instance_eval</code> siempre define en la singleton class del receptor. Si el receptor es una clase, su singleton class es donde viven los métodos de clase. Un solo mecanismo, tres resultados.'
          }
        },
        {
          lineas: [16, 18],
          nota: 'Lo que <em>nunca</em> cambia: el binding. <code>self</code> se movió, pero la local del caller sigue ahí — por eso un DSL con <code>instance_eval</code> puede leer tus variables y no llamar a tus métodos.',
          salida: 'box.instance_exec(3) { |n| [self.class, n, label] }\n# => [Box, 3, "from the caller"]'
        }
      ]
    },

    callout: {
      dice: "Las dos formas cambian dónde CAE el <code>def</code>, no solo quién es <code>self</code>:",
      cmd: "class C; end; C.instance_eval { def a; end }; C.class_eval { def b; end }; p [C.methods(false), C.instance_methods(false)]",
      sale: "[[:a], [:b]]"
    },
    widget: 'self',
    recursos: [
      { titulo: 'BasicObject#instance_eval / #instance_exec, Module#class_eval', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/BasicObject.html', nota: 'La nota sobre el «default definee» está ahí, en letra chica.' },
      { titulo: 'Metaprogramming Ruby 2, cap. «Class Definitions» y «Clean Rooms»', fuente: 'Paolo Perrotta', nota: 'De aquí sale el vocabulario de self / definee que uso arriba.' },
      { titulo: 'Los builders de la stdlib (JSON, ERB) y los DSLs de RSpec/Rake', fuente: 'lectura de código', nota: 'Comparar cuál usa <code>yield self</code> y cuál <code>instance_eval</code> enseña el criterio mejor que un post.' }
    ]
  });

  D.fichas.push({
    slug: 'monkey-patching-con-modales',
    dificultad: 2,
    folio: '06',
    bloque: 'metaprogramacion',
    titulo: 'Monkey-patching con modales',
    subtitulo: 'refinements, sus límites, y prepend como respuesta adulta',
    quees: 'Cómo cambiar código que no es tuyo sin volverte el villano del stack trace.',
    enBreve: [
      '<code>refine</code> + <code>using</code>: activo solo en el archivo/scope léxico donde pusiste <code>using</code>, desde esa línea hasta el final.',
      'No se propaga: un método llamado desde el scope refinado no ve el refinement. <code>send</code>/<code>public_send</code> dinámico tampoco.',
      'Un <code>prepend</code> de módulo nombrado sí aparece en <code>ancestors</code>, sí sale en el stack trace y sí te deja llamar <code>super</code>.',
      'Ruby 4.0 trae <code>Ruby::Box</code> (experimental): aislamiento de parches y defs por namespace.'
    ],
    fundamento: 'El problema del monkey-patching nunca fue «modificar clases ajenas», fue que el cambio es global e invisible. Los refinements intentaron resolverlo con scope léxico y se pasaron de estrictos. <code>prepend</code> no resuelve el aislamiento, pero sí la invisibilidad: deja rastro. Que Ruby 4.0 experimente con namespaces confirma cuál era el problema real.',
    comoFunciona: 'Escribes tu parche como un módulo con nombre propio, con <code>super</code> para delegar al original, y lo prependes explícitamente en un archivo de inicialización. Cuando algo se rompe, <code>ancestors</code> y el backtrace dicen tu nombre.',
    snippet: [
      'module SafeTrim',
      '  def strip',
      '    super.delete("\\u00A0")   # también el non-breaking space',
      '  end',
      'end',
      '',
      'String.prepend(SafeTrim)',
      '',
      '"\\u00A0hey\\u00A0".strip       # => "hey"',
      'String.ancestors.first(2)     # => [SafeTrim, String]',
      'String.instance_method(:strip).owner  # => SafeTrim',
      '',
      '# refinement: el scope no viaja',
      'module Shout',
      '  refine String do',
      '    def upcase; "¡" + super + "!"; end',
      '  end',
      'end',
      '',
      'def indirect(s) = s.upcase',
      '',
      'using Shout',
      '"hey".upcase                 # => "¡HEY!"',
      'indirect("hey")             # => "HEY"     # el método no ve el refinement',
      '"hey".send(:upcase)          # => "¡HEY!"   # send SÍ lo ve: la activación',
      '                              #               es del scope, no de la sintaxis'
    ].join('\n'),
    cuandoNo: 'No hagas monkey-patch del core o de una gema para tapar un bug ajeno en prod — revienta en silencio cuando la gema actualiza. Prepend un módulo tuyo o abre el issue.',
    mito: {
      creencia: '«Los refinements son monkey-patching seguro y con scope.»',
      realidad: 'Medio falso: su scope léxico es tan estricto que casi nunca hace lo que esperas (no se propaga a métodos llamados desde dentro del scope, no viaja con <code>send</code> dinámico) y la comunidad los abandonó. <code>prepend</code> de un módulo nombrado —rastreable en <code>ancestors</code>— es la respuesta adulta.'
    },
    escena: {
      titulo: 'Hasta dónde llega cada parche',
      pasos: [
        {
          lineas: [1, 7],
          nota: 'Monkey-patching con modales: un módulo <b>con nombre</b>, insertado con <code>prepend</code>, que llama a <code>super</code>. Nada de reabrir <code>String</code> y pisar el método.',
          salida: 'String.ancestors.first(2)             # => [SafeTrim, String]\nString.instance_method(:strip).owner  # => SafeTrim'
        },
        {
          lineas: [9, 11],
          nota: 'Esa es toda la diferencia con reabrir la clase: <code>ancestors</code> y el backtrace dicen tu nombre. El parche es auditable — alguien puede encontrarte.',
          salida: '"\\u00A0hey\\u00A0".strip  # => "hey"'
        },
        {
          lineas: [13, 22],
          nota: 'Ahora la alternativa «segura»: un refinement, que promete no filtrarse fuera de su scope léxico. Tres formas de llamar al mismo método, después del <code>using</code>.',
          predice: {
            pregunta: '¿Cuáles de las tres ven el refinement — <code>"hey".upcase</code>, <code>indirect("hey")</code> y <code>"hey".send(:upcase)</code>?',
            opciones: [
              'Solo la directa: ni el método ni <code>send</code> lo ven',
              'La directa y <code>send</code>; el método definido aparte, no',
              'Las tres: estamos dentro del scope'
            ],
            correcta: 1,
            porque: 'Lo que activa un refinement es el <em>scope léxico</em>, no la sintaxis de la llamada. <code>send</code> ocurre en el scope refinado y sí lo ve — el folklore de que «send no ve refinements» es falso desde hace muchas versiones. Lo que no lo ve es el <b>cuerpo</b> de <code>indirect</code>, definido fuera del scope, aunque lo llames desde dentro.'
          }
        },
        {
          lineas: [23, 26],
          nota: 'El scope no viaja con la llamada, se queda en el archivo. Por eso un refinement es más seguro que un monkey-patch — y por eso es más difícil de razonar: el mismo código hace cosas distintas según dónde esté escrito.',
          salida: '"hey".upcase         # => "¡HEY!"\nindirect("hey")      # => "HEY"\n"hey".send(:upcase)  # => "¡HEY!"'
        }
      ]
    },

    callout: {
      dice: "Antes de parchar, mira quién es el dueño actual del método:",
      cmd: "p String.instance_method(:upcase).owner",
      sale: "String"
    },
    widget: 'refinements',
    recursos: [
      { titulo: 'Refinements — spec y limitaciones', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/syntax/refinements_rdoc.html', nota: 'La lista de «no aplica en…» es más larga que la de «aplica».' },
      { titulo: 'Namespace / Ruby::Box', fuente: 'propuesta y charlas de Satoshi Tagomori (RubyKaigi)', url: 'https://bugs.ruby-lang.org/issues/21311', nota: 'El diagnóstico oficial de por qué el aislamiento faltaba.' },
      { titulo: 'Module#prepend y Method#owner', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Module.html', nota: '<code>owner</code> es la herramienta de auditoría que hace rastreable un parche.' }
    ]
  });
})(window.GUIA = window.GUIA || {});
