/* Bloque III — El lenguaje expresivo. Cinco fichas. */
(function (G) {
  var D = (G.datos = G.datos || {});
  D.fichas = D.fichas || [];

  D.fichas.push({
    slug: 'bloques-procs-lambdas',
    dificultad: 2,
    folio: '07',
    bloque: 'lenguaje-expresivo',
    titulo: 'Bloques, procs, lambdas y closures',
    subtitulo: 'las cuatro diferencias que muerden',
    quees: 'Tres formas de pasar código como valor, con dos semánticas de control de flujo distintas y un binding que se queda vivo.',
    enBreve: [
      '<code>return</code>: en un proc sale del método que lo creó; en una lambda sale de la lambda. Si el método ya regresó → <code>LocalJumpError</code>.',
      'Arity: la lambda valida y revienta con <code>ArgumentError</code>; el proc rellena con <code>nil</code> y descarta lo que sobra.',
      '<code>lambda?</code> distingue; <code>Method#to_proc</code> produce lambdas; <code>&amp;:simbolo</code> produce un proc-lambda de arity −2.',
      'El closure retiene el <em>binding</em> completo, no solo las variables que menciona: <code>proc.binding.local_variables</code> lo prueba.'
    ],
    fundamento: 'El bloque nació como azúcar de iteración: es un pedazo del método que lo invoca, y por eso su <code>return</code> es el del método. La lambda vino después, como función de primera clase de verdad, y necesitaba <code>return</code> propio. Son dos ideas distintas que comparten la clase <code>Proc</code> por accidente histórico.',
    comoFunciona: 'Un bloque se materializa como <code>Proc</code> con <code>&amp;blk</code> (barato desde 3.x si solo lo reenvías con <code>&amp;</code>). La diferencia de flujo la lleva el objeto, no el sitio de llamada: por eso guardar un proc y llamarlo más tarde es donde aparecen los <code>LocalJumpError</code>.',
    snippet: [
      'def con_proc',
      '  p = Proc.new { return :desde_el_proc }',
      '  p.call',
      '  :nunca_llego',
      'end',
      '',
      'def con_lambda',
      '  l = -> { return :desde_la_lambda }',
      '  l.call',
      '  :si_llego',
      'end',
      '',
      'con_proc     # => :desde_el_proc',
      'con_lambda   # => :si_llego',
      '',
      'proc { |a, b| [a, b] }.call(1)      # => [1, nil]',
      '->(a, b) { [a, b] }.call(1)         # => ArgumentError (given 1, expected 2)',
      '',
      'def fuga',
      '  pesado = "x" * 10_000_000',
      '  contador = 0',
      '  -> { contador += 1 }               # nunca menciona `pesado`...',
      'end',
      '',
      'f = fuga',
      'f.binding.local_variables            # => [:pesado, :contador]   # f vive fuera de fuga',
      'f.binding.local_variable_get(:pesado).bytesize  # => 10000000  # sigue vivo'
    ].join('\n'),
    cuandoNo: 'No guardes un proc de larga vida (constante, registro global, cache) si su binding captura objetos pesados — el closure retiene TODO el binding vivo, no solo las variables que usa. Fuga de memoria clásica.',
    mito: {
      creencia: '«Un proc y una lambda son lo mismo, la lambda solo es más estricta.»',
      realidad: 'Falso en dos ejes que muerden: el <code>return</code> de un proc sale del método que lo creó (<code>LocalJumpError</code> si ese método ya regresó); el de una lambda sale de la lambda. Y la lambda valida arity; el proc rellena con <code>nil</code>. Objetos distintos, semántica de flujo distinta.'
    },
    widget: 'closures',
    recursos: [
      { titulo: 'Proc — lambda? y la tabla de diferencias', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Proc.html', nota: 'La doc de <code>Proc</code> lista las diferencias explícitamente; es corta.' },
      { titulo: 'Binding y local_variables', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Binding.html', nota: 'La herramienta para demostrarle a alguien de dónde sale la fuga.' },
      { titulo: 'Charlas de memory profiling en Ruby (RubyKaigi / RailsConf)', fuente: 'Nate Berkopec, Jean Boussier', nota: 'Los casos reales de retención por closure en apps grandes.' }
    ]
  });

  D.fichas.push({
    slug: 'argumentos-y-forwarding',
    dificultad: 3,
    folio: '08',
    bloque: 'lenguaje-expresivo',
    titulo: 'Argumentos con filo',
    subtitulo: 'forwarding total con ..., la separación de kwargs de 3.0',
    quees: 'La cicatriz que dejó Ruby 3.0 al separar argumentos posicionales de keyword arguments, y cómo se reenvía todo hoy.',
    enBreve: [
      '<code>def wrap(...)</code> reenvía posicionales + kwargs + bloque. Es lo único que reenvía <em>todo</em>.',
      'Desde 3.0 un hash posicional ya no se convierte en kwargs. <code>*args</code> nunca los captura como kwargs.',
      '<code>ruby2_keywords</code> marca el hash final para que sobreviva un <code>*args</code>: es parche de compatibilidad 2.x↔3.x.',
      'Ruby 3.2+ permite forwarding parcial anónimo: <code>def wrap(*, **, &amp;) = real(*, **, &amp;)</code>.'
    ],
    fundamento: 'Hasta 2.7 los kwargs eran un hash disfrazado y la ambigüedad («¿este hash es opciones o es un argumento?») producía bugs imposibles de arreglar en la librería. 3.0 los volvió una categoría real. El costo fue que todos los wrappers escritos con <code>*args</code> quedaron mal — y siguen ahí, en tu código y en gemas.',
    comoFunciona: '<code>...</code> declara «lo que sea» y lo pasa intacto, incluido el bloque. Si necesitas leer algo, puedes combinar: <code>def wrap(primero, ...)</code>. Para prohibir explícitamente, <code>**nil</code> (no acepta keywords) y <code>*nil</code> (no acepta posicionales).',
    snippet: [
      'def real(a, modo: :seco, &blk)',
      '  [a, modo, blk&.call]',
      'end',
      '',
      '# el wrapper de siempre — roto desde 3.0',
      'def viejo(*args, &blk)',
      '  real(*args, &blk)',
      'end',
      '',
      'viejo(1, modo: :humedo) { :b }',
      '# => ArgumentError: wrong number of arguments (given 2, expected 1)',
      '#    el hash de kwargs llegó como segundo posicional',
      '',
      '# forwarding total',
      'def nuevo(...)',
      '  real(...)',
      'end',
      '',
      'nuevo(1, modo: :humedo) { :b }   # => [1, :humedo, :b]',
      '',
      '# forwarding anónimo por categoría (3.2+)',
      'def parcial(*, **, &)',
      '  real(*, **, &)',
      'end',
      '',
      'parcial(1, modo: :humedo) { :b } # => [1, :humedo, :b]',
      '',
      'def estricto(opciones = {}, **nil)   # nunca acepta keywords',
      '  opciones',
      'end',
      'estricto(a: 1)  # => ArgumentError: no keywords accepted'
    ].join('\n'),
    cuandoNo: 'No uses <code>ruby2_keywords</code> en código nuevo — es parche de compatibilidad para gemas que aún soportan Ruby 2.x; en 3.x+ usa <code>...</code> o kwargs explícitos. <code>**nil</code> (no acepta keywords) y <code>*nil</code> (no acepta posicionales; en 4.0 ya ni llama <code>to_a</code>) son para desambiguar el último hash, no decoración.',
    mito: {
      creencia: '«<code>def wrap(*args, &amp;blk); real(*args, &amp;blk); end</code> reenvía todo.»',
      realidad: 'Falso desde Ruby 3.0: la separación posicional/kwargs deja los keyword arguments fuera (o los degrada a un hash posicional). El forwarding completo hoy es <code>def wrap(...); real(...); end</code>. Y <code>ruby2_keywords</code> existe precisamente porque esa separación rompió gemas entre 2.7 y 3.0.'
    },
    widget: 'forwarding',
    recursos: [
      { titulo: 'Separation of positional and keyword arguments in Ruby 3.0', fuente: 'ruby-lang.org, post del core team', url: 'https://www.ruby-lang.org/en/news/2019/12/12/separation-of-positional-and-keyword-arguments-in-ruby-3-0/', nota: 'El documento fundacional. Explica <code>ruby2_keywords</code> desde dentro.' },
      { titulo: 'Method arguments — argument forwarding', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/syntax/methods_rdoc.html', nota: 'Sintaxis exacta de <code>...</code>, <code>*</code>, <code>**</code>, <code>&amp;</code> anónimos.' },
      { titulo: 'Módulo#ruby2_keywords', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Module.html', nota: 'Léelo solo para entender código viejo, no para escribir nuevo.' }
    ]
  });

  D.fichas.push({
    slug: 'pattern-matching',
    dificultad: 2,
    folio: '09',
    bloque: 'lenguaje-expresivo',
    titulo: 'Pattern matching a fondo',
    subtitulo: 'case/in, deconstruct, guards, find pattern, pin',
    quees: 'Destructuring con binding de variables. No es comparación de igualdad y no cae a <code>==</code>.',
    enBreve: [
      '<code>case/in</code> llama <code>deconstruct</code> (array patterns) o <code>deconstruct_keys</code> (hash patterns) sobre tu objeto.',
      'El hash pattern es <em>parcial</em> por diseño: <code>{a:}</code> matchea aunque haya más llaves. El array pattern es exacto.',
      'Si nada matchea, <code>case/in</code> levanta <code>NoMatchingPatternError</code> — no regresa <code>nil</code> como <code>case/when</code>.',
      'El find pattern <code>[*, x, *]</code> sigue emitiendo warning experimental (también en 4.0). <code>case/in</code> es estable desde 3.0.'
    ],
    fundamento: 'Ruby ya tenía destructuring en asignaciones (<code>a, b = arr</code>) y comparación con <code>===</code>. Pattern matching junta las dos ideas y les agrega un protocolo: cualquier objeto puede decidir cómo se desarma. Es la vía para tratar JSON, ASTs y respuestas de API como datos con forma, no como hashes que se navegan a mano.',
    comoFunciona: 'Los patrones se prueban en orden. Un nombre suelto <em>liga</em> (no compara); para comparar contra una variable existente usas el pin: <code>^x</code>. Los guards (<code>if</code>/<code>unless</code>) se evalúan <em>después</em> de que el patrón ligó — y ahí está el filo: si el guard falla, la cláusula no matchea y se pasa a la siguiente <code>in</code>. No se reintenta el patrón. En un find pattern eso significa que el guard NO busca otra posición: la condición tiene que ir dentro del patrón.',
    snippet: [
      'Punto = Struct.new(:x, :y) do',
      '  def deconstruct; [x, y]; end',
      '  def deconstruct_keys(keys); { x: x, y: y }; end',
      'end',
      '',
      'case Punto.new(0, 7)',
      'in [0, y] then "en el eje Y, altura #{y}"      # liga y',
      'in { x:, y: } then "libre #{x},#{y}"',
      'end',
      '# => "en el eje Y, altura 7"',
      '',
      'esperado = 7',
      'case Punto.new(3, 7)',
      'in { y: ^esperado } then "y coincide con la variable"   # pin: compara',
      'in { y: } then "y ligó a #{y}"',
      'end',
      '# => "y coincide con la variable"',
      '',
      'case { estado: "ok", items: [1, 2, 3] }',
      'in { estado: "ok", items: [_, *resto] } if resto.size > 1',
      '  "cola de #{resto.size}"',
      'end',
      '# => "cola de 2"',
      '',
      '# find pattern (warning: experimental, también en 4.0)',
      'case [1, 42, 3, 4]',
      'in [*, Integer => n, *] if n > 40 then n',
      'end',
      '# => NoMatchingPatternError   # el guard NO reintenta las otras posiciones:',
      '#                             # ligó n=1, falló, y ahí se acabó la cláusula',
      '',
      'case [1, 42, 3, 4]',
      'in [*, (41..) => n, *] then n',
      'end',
      '# => 42                       # la condición va DENTRO del patrón',
      '',
      'case 5',
      'in String then :nunca',
      'end',
      '# => NoMatchingPatternError: 5'
    ].join('\n'),
    cuandoNo: 'No uses <code>case/in</code> para dos o tres igualdades simples — ahí <code>case/when</code> o un <code>if</code> es más claro y no arrastra deconstruct. Pattern matching paga cuando destructuras estructura anidada (JSON, ASTs, respuestas de API).',
    mito: {
      creencia: '«Es un switch bonito.»',
      realidad: 'Falso: es destructuring con binding de variables, no comparación de igualdad. <code>case/in</code> no cae a <code>==</code>; llama <code>deconstruct</code>/<code>deconstruct_keys</code> y liga nombres.'
    },
    widget: 'pattern',
    recursos: [
      { titulo: 'Pattern matching — sintaxis completa', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/syntax/pattern_matching_rdoc.html', nota: 'Incluye la tabla de qué patrón llama a qué protocolo.' },
      { titulo: 'Charlas de pattern matching de Kazuki Tsujimoto', fuente: 'RubyKaigi', url: 'https://rubykaigi.org/', nota: 'Del autor de la feature: por qué el find pattern sigue experimental.' },
      { titulo: 'Data#deconstruct / #deconstruct_keys', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Data.html', nota: '<code>Data</code> ya implementa el protocolo: es el par natural del pattern matching.' }
    ]
  });

  D.fichas.push({
    slug: 'enumerables-y-lazy',
    dificultad: 2,
    folio: '10',
    bloque: 'lenguaje-expresivo',
    titulo: 'Enumerables y lazy',
    subtitulo: 'el costo de encadenar, cuándo lazy paga',
    quees: 'Cada eslabón de una cadena <code>Enumerable</code> materializa un array nuevo. <code>lazy</code> cambia esos arrays por overhead por elemento.',
    enBreve: [
      'Cadena estricta: N eslabones = N arrays intermedios, un recorrido completo por eslabón.',
      'Cadena lazy: un solo recorrido, cero arrays intermedios, pero una llamada de Enumerator por elemento por eslabón.',
      'El punto de cruce en la práctica está en decenas de miles de elementos — o en cortar temprano (<code>first</code>, <code>take</code>).',
      '<code>Enumerator</code> externo (<code>#next</code>) usa una fiber por dentro; el <code>Enumerator::Lazy</code> no la necesita.'
    ],
    fundamento: 'Ruby optó por métodos eager y arrays concretos: predecible, fácil de depurar, con costo de memoria proporcional a la cadena. <code>lazy</code> se agregó para lo que eager no puede hacer: secuencias infinitas y cortes tempranos. Es una herramienta de <em>expresividad</em> que a veces también es la rápida — no una optimización general.',
    comoFunciona: 'Cada <code>map</code>/<code>select</code> lazy envuelve al anterior en otro Enumerator. Al llegar el terminal (<code>first</code>, <code>to_a</code>, <code>each</code>) se jala elemento por elemento por toda la torre. Más eslabones = más frames por elemento.',
    snippet: [
      'require "benchmark"',
      '',
      'chico = (1..2_000).to_a',
      '',
      'Benchmark.bm(8) do |b|',
      '  b.report("eager") { 500.times { chico.map { _1 * 2 }.select(&:even?).sum } }',
      '  b.report("lazy")  { 500.times { chico.lazy.map { _1 * 2 }.select(&:even?).sum } }',
      'end',
      '# ~> eager  0.180000',
      '# ~> lazy   0.430000    # ~2.4x más lento: cadena corta, colección chica',
      '',
      '# donde lazy sí es la única respuesta',
      'primos = (2..Float::INFINITY).lazy.select { |n| (2..Math.sqrt(n)).none? { n % _1 == 0 } }',
      'primos.first(5)          # => [2, 3, 5, 7, 11]',
      '',
      '# y donde paga por cortar temprano',
      'grande = (1..5_000_000)',
      'grande.lazy.map { _1 * 3 }.select { _1 % 7 == 0 }.first(3)  # => [21, 42, 63]',
      '# la versión eager recorrería 5M y crearía dos arrays de 5M'
    ].join('\n'),
    cuandoNo: 'No metas <code>.lazy</code> a un pipeline que igual materializas entero (<code>.to_a</code> al final sobre una colección finita chica) — pagas el overhead sin cobrar el beneficio.',
    mito: {
      creencia: '«<code>.lazy</code> siempre es más rápido porque no crea arrays intermedios.»',
      realidad: 'Falso: cambia arrays intermedios por overhead de Enumerator por elemento. En colecciones chicas o cadenas cortas, <code>.lazy</code> es MÁS lento. Paga solo con secuencias grandes/infinitas o cuando cortas temprano (<code>.first(n)</code>, <code>.take</code>).'
    },
    widget: 'lazy',
    recursos: [
      { titulo: 'Enumerator::Lazy', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Enumerator/Lazy.html', nota: 'La lista de métodos que sí son lazy es más corta de lo que la gente cree.' },
      { titulo: 'Enumerator y Fiber', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Enumerator.html', nota: 'El detalle de por qué el enumerador externo cuesta más que el interno.' },
      { titulo: 'Benchmarks de cadenas Enumerable', fuente: 'fast-ruby y posts de Jean Boussier', url: 'https://github.com/fastruby/fast-ruby', nota: 'Úsalos como método, no como verdad: mide tu caso.' }
    ]
  });

  D.fichas.push({
    slug: 'protocolos-de-mixin',
    dificultad: 1,
    folio: '11',
    bloque: 'lenguaje-expresivo',
    titulo: 'Comparable y Enumerable',
    subtitulo: 'el protocolo de mixin: define uno, recibe decenas',
    quees: 'Haz que TU objeto se comporte como un built-in definiendo un solo método y dejando que el módulo derive el resto.',
    enBreve: [
      '<code>include Comparable</code> + <code>&lt;=&gt;</code> te da <code>&lt; &gt; &lt;= &gt;= == between? clamp</code>.',
      '<code>include Enumerable</code> + <code>each</code> te da <code>map select reduce sort min max group_by each_slice to_a lazy</code>… decenas.',
      '<code>&lt;=&gt;</code> devuelve <code>-1/0/1</code> y <code>nil</code> para incomparables. <code>nil</code> hace que <code>&lt;</code> levante <code>ArgumentError</code>, que es lo correcto.',
      '<code>each</code> sin bloque debería devolver un <code>Enumerator</code> (<code>return to_enum(:each) unless block_given?</code>) para que <code>lazy</code> y <code>each_slice</code> funcionen.'
    ],
    fundamento: 'Es duck-typing formalizado: el módulo no describe qué <em>eres</em>, describe qué <em>contrato</em> cumples. Ruby prefiere esto a interfaces porque el contrato es un método, verificable en runtime, y la implementación derivada vive en un solo lugar de la stdlib — probada por todos.',
    comoFunciona: 'Los métodos del módulo están escritos en términos del método que tú defines. <code>sort</code> llama <code>each</code> y luego <code>&lt;=&gt;</code>; <code>clamp</code> llama <code>&lt;=&gt;</code> dos veces. De ahí sale el costo: cada método derivado es un recorrido más.',
    snippet: [
      'class Version',
      '  include Comparable',
      '  attr_reader :partes',
      '',
      '  def initialize(str) = @partes = str.split(".").map(&:to_i)',
      '  def <=>(otra) = otra.is_a?(Version) ? partes <=> otra.partes : nil',
      '  def to_s = partes.join(".")',
      'end',
      '',
      'Version.new("3.4.1") > Version.new("3.4")        # => true',
      'Version.new("3.4.1").between?(Version.new("3.0"), Version.new("4.0"))  # => true',
      'Version.new("3.4.1").clamp(Version.new("3.0"), Version.new("3.2")).to_s # => "3.2"',
      'Version.new("3.4") < "3.5"                        # => ArgumentError',
      '#    comparison of Version with String failed     (correcto: <=> dio nil)',
      '',
      'class Bitacora',
      '  include Enumerable',
      '  def initialize(lineas) = @lineas = lineas',
      '',
      '  def each',
      '    return to_enum(:each) unless block_given?',
      '    @lineas.each { |l| yield l }',
      '  end',
      'end',
      '',
      'b = Bitacora.new(["WARN db", "INFO ok", "ERROR 500"])',
      'b.grep(/ERROR/)                # => ["ERROR 500"]',
      'b.sort.first                   # => "ERROR 500"',
      'b.group_by { _1[0..3] }.keys   # => ["WARN", "INFO", "ERRO"]',
      'b.lazy.map(&:downcase).first   # => "warn db"'
    ].join('\n'),
    cuandoNo: 'No incluyas <code>Enumerable</code> si tu <code>each</code> es caro o tiene efectos secundarios — <code>sort</code>/<code>to_a</code> lo recorren completo y <code>min</code>/<code>include?</code> pueden recorrerlo varias veces. Y <code>&lt;=&gt;</code> debe devolver <code>nil</code> para incomparables, no reventar.',
    mito: {
      creencia: '«Para que mi objeto sea ordenable o iterable tengo que definir <code>&lt;</code>, <code>&gt;</code>, <code>map</code>, <code>select</code>… uno por uno.»',
      realidad: 'Falso: defines UNO y el módulo te da el resto. <code>include Comparable</code> + <code>&lt;=&gt;</code> te da <code>&lt; &gt; &lt;= &gt;= == between? clamp</code>; <code>include Enumerable</code> + <code>each</code> te da <code>map select reduce sort min max to_a</code>… decenas gratis. Duck-typing por módulo — el movimiento senior canónico de Ruby.'
    },
    widget: 'mixin',
    recursos: [
      { titulo: 'Comparable y Enumerable', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Enumerable.html', nota: 'Leer la lista completa de métodos derivados una vez cambia cómo diseñas clases.' },
      { titulo: 'Object#to_enum / Enumerator.new', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Object.html', nota: 'El detalle que hace que tu <code>each</code> sea ciudadano de primera.' },
      { titulo: 'Practical Object-Oriented Design in Ruby, cap. de módulos y duck types', fuente: 'Sandi Metz', nota: 'El criterio de cuándo un rol merece ser módulo.' }
    ]
  });
})(window.GUIA = window.GUIA || {});
