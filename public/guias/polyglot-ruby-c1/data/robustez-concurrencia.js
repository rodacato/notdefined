/* Bloque IV — Robustez y concurrencia práctica. Cuatro fichas. */
(function (G) {
  var D = (G.datos = G.datos || {});
  D.fichas = D.fichas || [];

  D.fichas.push({
    slug: 'diseno-de-errores',
    dificultad: 2,
    folio: '12',
    bloque: 'robustez-concurrencia',
    titulo: 'Diseño de errores',
    subtitulo: 'jerarquías, cause, errores-como-valores',
    quees: 'El error es parte de la API pública. Qué clase levantas y de qué hereda decide quién puede manejarlo.',
    enBreve: [
      '<code>rescue</code> sin clase captura <code>StandardError</code>. Todo error tuyo hereda de ahí, sin excepción.',
      'Un base error por dominio (<code>Payments::Error</code>) es la unidad correcta: quien integra rescata uno y ya.',
      '<code>Exception#cause</code> se llena solo al hacer <code>raise</code> dentro de un <code>rescue</code>. No lo pierdas armando el mensaje a mano.',
      '<code>full_message</code> imprime la cadena de <code>cause</code> completa: es lo que quieres en el log, no <code>e.message</code>.'
    ],
    fundamento: 'Ruby separó lo recuperable (<code>StandardError</code>) de lo que no lo es (<code>SignalException</code>, <code>NoMemoryError</code>, <code>SystemExit</code>) y puso el default de <code>rescue</code> en la primera rama. Toda la convención del ecosistema depende de que respetes esa frontera: es un contrato social codificado en la jerarquía.',
    comoFunciona: 'Defines un base error por dominio y especializas debajo. Al cruzar una frontera de capa, envuelves: levantas tu error dentro del <code>rescue</code> y Ruby conserva el original en <code>cause</code>. Para el flujo esperado —«no encontrado», «validación falló»— devuelves un valor.',
    snippet: [
      'module Payments',
      '  Error = Class.new(StandardError)',
      '  Rejected = Class.new(Error)',
      '  Unavailable = Class.new(Error)',
      'end',
      '',
      'def charge',
      '  raise IOError, "gateway timeout"',
      'rescue IOError',
      '  raise Payments::Unavailable, "gateway not responding"   # cause se conserva',
      'end',
      '',
      'begin',
      '  charge',
      'rescue Payments::Error => e',
      '  [e.class, e.message, e.cause.class, e.cause.message]',
      'end',
      '# => [Payments::Unavailable, "gateway not responding", IOError, "gateway timeout"]',
      '',
      '# lo que NO debes hacer',
      'class BadError < Exception; end',
      '',
      'begin',
      '  raise BadError, "invisible"',
      'rescue => e            # rescue pelón = StandardError',
      '  "caught"',
      'end',
      '# => BadError: invisible   # se escapó: no es StandardError',
      '',
      '# flujo esperado como value, no como excepción',
      'Result = Data.define(:ok, :value, :error)',
      '',
      'def find_user(id)',
      '  id == 1 ? Result.new(ok: true, value: "ana", error: nil)',
      '          : Result.new(ok: false, value: nil, error: :not_found)',
      'end',
      '',
      'find_user(9).error   # => :not_found'
    ].join('\n'),
    cuandoNo: 'No diseñes una jerarquía de 15 clases de error antes de tener 3 — la mayoría de apps viven bien con un base error por dominio y poco más. Y no uses excepciones para flujo esperado (un usuario no encontrado no es «excepcional»); ahí un Result comunica mejor la intención.',
    mito: {
      creencia: '«Hereda tus excepciones de <code>Exception</code> para que sean "de verdad".»',
      realidad: 'Falso y peligroso: <code>rescue</code> pelón captura <code>StandardError</code>, no <code>Exception</code> — si heredas de <code>Exception</code>, tu error se escapa de casi todos los <code>rescue</code> del ecosistema (y te pones al nivel de <code>SignalException</code>/<code>NoMemoryError</code>, que NUNCA debes rescatar). Hereda de <code>StandardError</code>.'
    },
    escena: {
      "titulo": "De quién heredas decide quién te atrapa",
      "pasos": [
        {
          "lineas": [
            1,
            11
          ],
          "nota": "Un base error por dominio y dos especializaciones. Al cruzar la frontera de capa, se envuelve: se levanta el error propio <em>dentro</em> del <code>rescue</code>.",
          "salida": "module Payments\n  Error = Class.new(StandardError)\n  Unavailable = Class.new(Error)\nend"
        },
        {
          "lineas": [
            13,
            18
          ],
          "nota": "Envolver dentro del <code>rescue</code> es lo que llena <code>cause</code> solo. Si armas el mensaje a mano concatenando, pierdes el original y con él el backtrace que necesitabas.",
          "salida": "# => [Payments::Unavailable, \"gateway not responding\",\n#     IOError, \"gateway timeout\"]"
        },
        {
          "lineas": [
            20,
            27
          ],
          "nota": "Ahora lo que no debes hacer, y que se ve razonable: heredar de <code>Exception</code> «para que sea un error de verdad».",
          "predice": {
            "pregunta": "El <code>rescue</code> pelón de abajo, ¿lo atrapa?",
            "opciones": [
              "Sí: <code>rescue</code> sin clase atrapa todo",
              "No: se escapa"
            ],
            "correcta": 1,
            "porque": "<code>rescue</code> sin clase captura <code>StandardError</code>, no <code>Exception</code>. Si heredas de <code>Exception</code> te pones al nivel de <code>SignalException</code> y <code>NoMemoryError</code> —que NUNCA debes rescatar— y tu error se escapa de casi todos los <code>rescue</code> del ecosistema."
          }
        },
        {
          "lineas": [
            30,
            38
          ],
          "nota": "Y la otra mitad del criterio: un usuario que no existe no es «excepcional». Para el flujo esperado, un valor comunica mejor la intención que una excepción.",
          "salida": "find_user(9).error  # => :not_found"
        }
      ]
    },

    callout: {
      dice: "La frontera del <code>rescue</code> pelón, en una línea:",
      cmd: "p [NoMemoryError.ancestors.include?(StandardError), ArgumentError.ancestors.include?(StandardError)]",
      sale: "[false, true]"
    },
    recursos: [
      { titulo: 'Exception — jerarquía, #cause, #full_message', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Exception.html', nota: 'El árbol completo de clases built-in está aquí; vale imprimirlo.' },
      { titulo: 'dry-monads — Result', fuente: 'dry-rb', url: 'https://dry-rb.org/gems/dry-monads/', nota: 'La implementación seria de errores-como-valores en Ruby, sin misticismo.' },
      { titulo: 'Exceptional Ruby', fuente: 'Avdi Grimm', nota: 'Sigue siendo el tratado de referencia sobre qué rescatar y qué no.' }
    ]
  });

  D.fichas.push({
    slug: 'gotchas-de-errores',
    dificultad: 1,
    folio: '13',
    bloque: 'robustez-concurrencia',
    titulo: 'Gotchas de manejo de errores',
    subtitulo: 'ensure que se traga excepciones, retry, throw/catch, threads mudos',
    quees: 'Los cuatro lugares donde tu manejo de errores destruye la información que necesitabas.',
    enBreve: [
      'Un <code>return</code>/<code>next</code>/<code>break</code> dentro de <code>ensure</code> descarta la excepción en vuelo. Silenciosamente.',
      '<code>retry</code> sin límite ni jitter es un loop infinito coordinado: todos tus workers reintentan al mismo milisegundo.',
      '<code>throw</code>/<code>catch</code> es salto de flujo no-excepcional (no pasa por <code>rescue</code>) y sí corre los <code>ensure</code>.',
      '<code>Thread.report_on_exception</code> es <code>true</code> por default desde 2.5, pero un thread cuyo error nadie hace <code>join</code>/<code>value</code> muere igual: solo lo loguea.'
    ],
    fundamento: '<code>ensure</code> corre siempre, incluso mientras una excepción va subiendo. Si dentro de ese bloque cambias el flujo, Ruby obedece: el nuevo flujo gana y la excepción se abandona. No es un bug, es la consecuencia de que <code>ensure</code> sea código normal. Por eso la regla es de estilo y absoluta.',
    comoFunciona: '<code>ensure</code> solo limpia (cerrar, liberar, medir). Si necesitas decidir con base en la excepción, usas <code>rescue</code>. Para reintentos, cuentas intentos, duermes con backoff exponencial y jitter, y re-levantas al agotarlos.',
    snippet: [
      'def swallows_it',
      '  raise "something bad"',
      'ensure',
      '  return :all_good      # ⚠️ la excepción desaparece',
      'end',
      '',
      'swallows_it    # => :all_good   # nadie supo del "something bad"',
      '',
      'def cleans_only',
      '  raise "something bad"',
      'ensure',
      '  $log = :closed_resources   # solo limpia, no decide',
      'end',
      '',
      'cleans_only rescue $log   # => :closed_resources   # y la excepción sí propagó',
      '',
      '# retry con techo, backoff y jitter determinista por intento',
      'def with_retries(max: 3)',
      '  attempts = 0',
      '  yield',
      'rescue IOError => e',
      '  attempts += 1',
      '  raise if attempts >= max',
      '  sleep((2**attempts) * 0.1 + (attempts * 0.017))   # jitter sin rand global',
      '  retry',
      'end',
      '',
      '# throw/catch: salto etiquetado, no excepción',
      'found_it = catch(:found) do',
      '  [[1, 2], [3, 42]].each do |row|',
      '    row.each { |n| throw :found, n if n > 40 }',
      '  end',
      '  :none',
      'end',
      '# => 42',
      '',
      'h = Thread.new { raise "dying alone" }',
      'sleep 0.05                # imprime el error en stderr (report_on_exception)',
      'h.value                   # => RuntimeError: muero solo   # aquí sí te enteras'
    ].join('\n'),
    cuandoNo: 'Nunca pongas <code>return</code>/<code>next</code>/<code>break</code> dentro de un <code>ensure</code> — se traga cualquier excepción que estuviera propagándose (y pisa el valor de retorno del método). El <code>ensure</code> es para limpiar, no para decidir el flujo.',
    mito: {
      creencia: '«Con <code>rescue =&gt; e</code> ya estás manejando errores.»',
      realidad: 'Falso: capturar no es manejar. Un <code>rescue</code> que loguea y sigue esconde el fallo; un <code>rescue</code> pelón sin re-raise se traga bugs que no viste venir.'
    },
    escena: {
      titulo: 'El ensure que se traga la excepción',
      pasos: [
        {
          lineas: [1, 5],
          nota: 'Un método que levanta una excepción, y un <code>ensure</code> que hace <code>return</code>. Los dos hechos están a la vista.',
          predice: {
            pregunta: 'Antes de avanzar: ¿qué te regresa <code>swallows_it</code>, y qué pasa con el <code>"something bad"</code>?',
            opciones: [
              'Levanta <code>RuntimeError</code>: el <code>ensure</code> corre pero la excepción sigue subiendo',
              'Regresa <code>:all_good</code> y la excepción desaparece',
              'Regresa <code>nil</code> y loguea el error'
            ],
            correcta: 1,
            porque: 'El <code>ensure</code> corre <em>mientras</em> la excepción va subiendo. Al cambiar el flujo con <code>return</code>, Ruby obedece: el nuevo flujo gana y la excepción se abandona. No es un bug — es la consecuencia de que <code>ensure</code> sea código normal.'
          }
        },
        {
          lineas: [7, 7],
          nota: 'Nadie se enteró del <code>"something bad"</code>. No hay log, no hay backtrace, no hay nada: el método regresó como si todo hubiera salido bien.',
          salida: 'swallows_it  # => :all_good'
        },
        {
          lineas: [9, 13],
          nota: 'El mismo esqueleto, con una sola diferencia: el <code>ensure</code> <em>limpia</em> en vez de <em>decidir</em>. No hay <code>return</code>, <code>next</code> ni <code>break</code>.',
          predice: {
            pregunta: '¿Cambia algo para la excepción?',
            opciones: [
              'No: el <code>ensure</code> siempre se la traga',
              'Sí: ahora la excepción propaga y además <code>$log</code> quedó puesto'
            ],
            correcta: 1,
            porque: 'La regla es de estilo y es absoluta: <code>ensure</code> para limpiar, <code>rescue</code> para decidir. Mientras no cambies el flujo dentro del <code>ensure</code>, la excepción sigue su camino.'
          }
        },
        {
          lineas: [15, 15],
          nota: 'Las dos cosas a la vez: se cerraron los recursos <b>y</b> la excepción llegó a quien tenía que manejarla.',
          salida: 'cleans_only rescue $log  # => :closed_resources'
        }
      ]
    },

    callout: {
      dice: "Míralo tragarse la excepción en tu propia consola:",
      cmd: "def f; raise \"grave\"; ensure; return :ok; end; p f",
      sale: ":ok      # el \"grave\" desapareció"
    },
    recursos: [
      { titulo: 'Exceptions — begin/rescue/ensure/retry', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/syntax/exceptions_rdoc.html', nota: 'La semántica de <code>ensure</code> frente a una excepción en vuelo, escrita.' },
      { titulo: 'Thread#report_on_exception y #abort_on_exception', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Thread.html', nota: 'Qué cambió en 2.5 y por qué antes los threads morían en silencio.' },
      { titulo: 'Exponential backoff and jitter', fuente: 'AWS Architecture Blog', url: 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/', nota: 'La referencia de por qué el jitter no es opcional en flotas.' }
    ]
  });

  D.fichas.push({
    slug: 'inmutabilidad-practica',
    dificultad: 1,
    folio: '14',
    bloque: 'robustez-concurrencia',
    titulo: 'Inmutabilidad práctica',
    subtitulo: 'freeze superficial, frozen_string_literal, Data vs Struct',
    quees: '<code>freeze</code> congela un objeto, no un grafo. Y <code>Data</code> (3.2+) es el value object que Ruby no tenía.',
    enBreve: [
      '<code>freeze</code> es shallow: congela el continente, no el contenido.',
      '<code>frozen_string_literal: true</code> deduplica literales de string; el ahorro es de allocations, no de «congelar cosas».',
      'Desde 3.4, los literales sin pragma son «chilled»: avisan a la PRIMERA mutación. El default sigue pendiente en 4.0.',
      '<code>Data</code>: inmutable, kwargs o posicionales, <code>with</code> para copias. <code>Struct</code>: mutable, indexable, <code>to_a</code> — sigue siendo útil para tuplas internas.'
    ],
    fundamento: 'Congelar profundo requeriría recorrer un grafo arbitrario en cada llamada: caro e imposible de hacer bien con ciclos. Ruby hizo lo predecible y baratísimo (un bit por objeto) y dejó lo profundo a quien lo necesite. <code>Ractor.make_shareable</code> es la versión que sí recorre, y existe justamente porque los Ractors lo exigen.',
    comoFunciona: '<code>freeze</code> pone un flag; mutar levanta <code>FrozenError</code>. <code>Data.define</code> te da una clase sin setters cuyas instancias nacen congeladas en la práctica: la copia se hace con <code>with</code>, que crea otra instancia.',
    snippet: [
      'a = [[1, 2], [3]].freeze',
      '',
      'a.frozen?          # => true',
      'a[0].frozen?       # => false',
      'a << [4]           # => FrozenError: can\'t modify frozen Array',
      'a[0] << 3          # => [1, 2, 3]   # ⚠️ mutó: freeze es superficial',
      '',
      'require "objspace"',
      'Ractor.make_shareable(b = [[1, 2]])',
      'b[0].frozen?       # => true        # este sí recorre el grafo',
      '',
      '# Data (3.2+): value object',
      'Point = Data.define(:x, :y)',
      'p1 = Point.new(x: 1, y: 2)',
      '',
      'p1.x               # => 1',
      'p1.with(y: 9)      # => #<data Point x=1, y=9>',
      'p1 == Point.new(x: 1, y: 2)   # => true    # igualdad por valor',
      'p1.respond_to?(:x=)           # => false   # no hay setters',
      'p1.to_h                       # => {x: 1, y: 2}',
      '',
      '# Struct: mutable e indexable, otro caso de uso',
      'Pair = Struct.new(:a, :b)',
      'pair = Pair.new(1, 2)',
      'pair.a = 10         # => 10',
      'pair[1]             # => 2',
      'pair.to_a           # => [10, 2]'
    ].join('\n'),
    cuandoNo: 'No rocíes <code>.freeze</code> por todos lados por «performance» — el ahorro de <code>frozen_string_literal</code> viene de deduplicar literales de string, no de congelar cada objeto.',
    mito: {
      creencia: '«<code>obj.freeze</code> congela el objeto y todo lo que contiene.»',
      realidad: 'Falso: <code>freeze</code> es superficial (shallow). <code>[[1,2]].freeze</code> congela el array de afuera pero NO los de adentro — <code>arr[0] &lt;&lt; 3</code> sigue mutando. Para profundo, congelas recursivo tú o usas algo que ya lo hace (<code>Data</code>, <code>Ractor.make_shareable</code>).'
    },
    escena: {
      "titulo": "Qué congela freeze, exactamente",
      "pasos": [
        {
          "lineas": [
            1,
            4
          ],
          "nota": "Un array congelado que contiene otros arrays. El contenedor dice <code>frozen? # => true</code>; el primer elemento dice <code>false</code>.",
          "predice": {
            "pregunta": "<code>a[0] &lt;&lt; 3</code> — ¿truena o muta?",
            "opciones": [
              "Truena con <code>FrozenError</code>: el array está congelado",
              "Muta: el elemento nunca se congeló"
            ],
            "correcta": 1,
            "porque": "Congelar profundo requeriría recorrer un grafo arbitrario en cada llamada: caro e imposible de hacer bien con ciclos. Ruby hizo lo predecible y baratísimo —un bit por objeto— y dejó lo profundo a quien lo necesite."
          }
        },
        {
          "lineas": [
            5,
            6
          ],
          "nota": "Las dos líneas juntas: la de arriba sí truena, la de abajo muta feliz. Ese contraste es todo el tema.",
          "salida": "a << [4]    # => FrozenError\na[0] << 3   # => [1, 2, 3]   ← mutó"
        },
        {
          "lineas": [
            8,
            10
          ],
          "nota": "La versión que sí recorre el grafo existe, y existe justamente porque los Ractors la exigen: sin aislamiento profundo no hay paralelismo seguro.",
          "salida": "Ractor.make_shareable(b = [[1, 2]])\nb[0].frozen?  # => true"
        },
        {
          "lineas": [
            12,
            20
          ],
          "nota": "<code>Data</code> (3.2+) es el value object que Ruby no tenía: sin setters, igualdad por valor, y <code>with</code> para derivar en vez de mutar.",
          "predice": {
            "pregunta": "<code>p1 == Point.new(x: 1, y: 2)</code> — ¿son iguales dos instancias distintas?",
            "opciones": [
              "Sí: la igualdad es por valor",
              "No: son objetos distintos"
            ],
            "correcta": 0,
            "porque": "Eso es lo que lo vuelve un <em>value object</em>: dos instancias con los mismos campos son el mismo valor. Es la diferencia con un <code>Struct</code>, que es mutable e indexable y sirve para otra cosa."
          }
        },
        {
          "lineas": [
            22,
            27
          ],
          "nota": "<code>Struct</code> sigue existiendo y no está obsoleto: es mutable, indexable y convertible a array. Otro caso de uso, no una versión vieja de <code>Data</code>.",
          "salida": "pair.a = 10   # => 10\npair.to_a     # => [10, 2]"
        }
      ]
    },

    callout: {
      dice: "El <code>freeze</code> superficial, comprobado:",
      cmd: "p [[1,2]].freeze.then { |a| a[0] << 3; a }",
      sale: "[[1, 2, 3]]"
    },
    recursos: [
      { titulo: 'Data', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Data.html', nota: 'Incluye la comparación explícita con <code>Struct</code>.' },
      { titulo: 'Chilled strings y el camino a frozen_string_literal por default', fuente: 'ruby-lang.org / Feature #20205', url: 'https://bugs.ruby-lang.org/issues/20205', nota: 'La razón por la que el default sigue posponiéndose.' },
      { titulo: 'Ractor.make_shareable y el modelo de objetos compartibles', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Ractor.html', nota: 'El único freeze profundo que trae la stdlib.' }
    ]
  });

  D.fichas.push({
    slug: 'concurrencia-practica',
    dificultad: 2,
    folio: '15',
    bloque: 'robustez-concurrencia',
    titulo: 'Concurrencia práctica',
    subtitulo: 'threads vs fibers/async vs ractors vs procesos',
    quees: 'La ficha de decisión: cuatro modelos, cuatro tipos de carga. El porqué del GVL no vive aquí.',
    enBreve: [
      'Threads: memoria compartida, el GVL se suelta en I/O. La respuesta default para I/O concurrente.',
      'Fibers + async: miles de operaciones de I/O en un hilo, sin locks. Cuesta que todo el stack sea non-blocking.',
      'Ractors: paralelismo de CPU real, aislamiento estricto (solo shareable cruza). Experimentales, también en 4.0.',
      'Procesos: aislamiento total, paralelismo real, memoria multiplicada. Es el modelo de Sidekiq y de Puma en cluster.'
    ],
    fundamento: 'Cada modelo elige qué compartir. Threads comparten todo (rápido de escribir, difícil de razonar). Fibers comparten todo pero se ceden el turno explícitamente (predecible, exige stack cooperativo). Ractors no comparten casi nada (seguro, incómodo). Procesos no comparten nada (aburrido, funciona). Elegir es elegir tu clase de bug.',
    comoFunciona: 'Puma corre W procesos × T threads: los procesos dan paralelismo de CPU, los threads absorben la espera de I/O. Sidekiq corre threads dentro de un proceso por cada job; escalas con más procesos. En ambos casos el paralelismo real lo dan los procesos, no los threads.',
    snippet: [
      'require "benchmark"',
      '',
      'def fake_io = sleep(0.1)',
      'def fake_cpu = 3_000_000.times { |i| i * i }',
      '',
      'Benchmark.bm(14) do |b|',
      '  b.report("io serial")   { 8.times { fake_io } }',
      '  b.report("io threads")  { 8.times.map { Thread.new { fake_io } }.each(&:join) }',
      '  b.report("cpu serial")  { 4.times { fake_cpu } }',
      '  b.report("cpu threads") { 4.times.map { Thread.new { fake_cpu } }.each(&:join) }',
      'end',
      '# ~> io serial     0.803  (real)',
      '# ~> io threads    0.104  (real)   # el GVL se suelta en I/O: 8x',
      '# ~> cpu serial    0.612  (real)',
      '# ~> cpu threads   0.618  (real)   # cero ganancia: CPU con GVL',
      '',
      '# Ractors: paralelismo real, aislamiento estricto (4.0: #value, Port)',
      'rs = 4.times.map { Ractor.new { 3_000_000.times { |i| i * i }; :done } }',
      'rs.map(&:value)     # => [:done, :done, :done, :done]   # sí escala en CPU',
      '',
      'config = { retries: 3 }',
      'Ractor.new(config) { |c| c }.value   # => {retries: 3}   # pasarlo lo COPIA',
      '',
      '# lo que sí truena es capturar la variable del scope, no pasarla:',
      'Ractor.new { config }',
      '# => ArgumentError   # "can not isolate a Proc because it accesses',
      '#                    #  outer variables (config)" — ojo: NO es IsolationError',
      'Ractor.new(Ractor.make_shareable(config)) { |c| c[:retries] }.value  # => 3'
    ].join('\n'),
    cuandoNo: 'No metas Ractors a un app Rails para «acelerar» — la mayoría de tus objetos no son shareable y vas a pelear con el aislamiento más de lo que ganas. Jobs → procesos (Sidekiq); I/O concurrente → threads o fibers/async.',
    mito: {
      creencia: '«Los Ractors ya le quitaron el GVL a Ruby, así que hay paralelismo real para todo.»',
      realidad: 'Medio falso: los Ractors dan paralelismo de CPU real, pero su modelo de aislamiento (solo objetos shareable cruzan, casi todo tiene que ir frozen) los deja fuera de la mayoría del código Rails. En 4.0 maduraron (comunicación por Port, <code>#value</code>/<code>#join</code> en vez de <code>#take</code>) pero siguen experimentales. Para I/O, los threads —con el GVL soltándose en I/O— siguen siendo la respuesta.'
    },
    escena: {
      "titulo": "Qué escala y qué no",
      "pasos": [
        {
          "lineas": [
            1,
            11
          ],
          "nota": "Cuatro mediciones: I/O en serie contra I/O en hilos, y CPU en serie contra CPU en hilos. El mismo trabajo, la misma máquina.",
          "predice": {
            "pregunta": "¿Dónde ganan los hilos de Ruby?",
            "opciones": [
              "En ninguno: el GVL los serializa siempre",
              "En I/O, no en CPU",
              "En los dos: son hilos de sistema"
            ],
            "correcta": 1,
            "porque": "El GVL <b>se suelta</b> en I/O. Medido: 8 esperas de 0.1 s tardan 0.104 s en hilos contra 0.803 s en serie — 8×. En CPU no hay ganancia: 0.618 contra 0.612. La regla es «un hilo por espera», no «un hilo por core»."
          }
        },
        {
          "lineas": [
            12,
            15
          ],
          "nota": "Los números son de una corrida real, no de una estimación. La segunda línea es la que desmiente el mito de que los hilos de Ruby «no sirven».",
          "salida": "io serial     0.803   ·   io threads   0.104   → 8x\ncpu serial    0.612   ·   cpu threads  0.618   → nada"
        },
        {
          "lineas": [
            17,
            19
          ],
          "nota": "Para CPU sí existe paralelismo real: Ractors. Cuatro corriendo a la vez, cada uno con su propio intérprete y sin GVL compartido.",
          "salida": "rs.map(&:value)  # => [:done, :done, :done, :done]"
        },
        {
          "lineas": [
            21,
            24
          ],
          "nota": "Pero el aislamiento cobra. Y el disparador no es el que la gente cree.",
          "predice": {
            "pregunta": "<code>Ractor.new(config) { |c| c }</code> con un hash normal — ¿truena?",
            "opciones": [
              "Sí: el hash no es shareable",
              "No: pasarlo como argumento lo COPIA"
            ],
            "correcta": 1,
            "porque": "Pasar un objeto a un Ractor lo copia, y eso siempre funciona. Lo que truena es <em>capturar</em> una variable del scope dentro del bloque — y con <code>ArgumentError</code>, no con <code>Ractor::IsolationError</code>. Confundir las dos cosas es el error más común al empezar."
          }
        }
      ]
    },

    callout: {
      dice: "Un Ractor de verdad, con su warning de experimental incluido:",
      cmd: "p Ractor.new { 1 + 1 }.value",
      sale: "2"
    },
    recursos: [
      { titulo: 'Ractor — modelo, Port y estado experimental', fuente: 'docs oficiales de Ruby', url: 'https://docs.ruby-lang.org/en/master/Ractor.html', nota: 'La lista de qué es shareable es el criterio de viabilidad real.' },
      { titulo: 'The Async gem y el scheduler de fibers', fuente: 'Samuel Williams (RubyKaigi)', url: 'https://github.com/socketry/async', nota: 'De la persona que metió <code>Fiber::Scheduler</code> al lenguaje.' },
      { titulo: 'The Complete Guide to Rails Performance', fuente: 'Nate Berkopec', url: 'https://www.speedshop.co/', nota: 'La cuenta honesta de procesos × threads en Puma con memoria real.' }
    ]
  });
})(window.GUIA = window.GUIA || {});
