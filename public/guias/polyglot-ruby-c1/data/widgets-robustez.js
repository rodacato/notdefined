/* Widgets del bloque IV. Incluye el único widget de tipo "escenarios". */
(function (G) {
  var D = (G.datos = G.datos || {});
  D.widgets = D.widgets || {};

  D.widgets.jerarquia = {
    titulo: 'De qué hereda tu error y quién lo captura',
    encabezado: 'rescue => e  (pelón) captura StandardError y sus hijos',
    filas: [
      { id: 'exception', texto: 'Exception                       fuera del rescue pelón' },
      { id: 'signal', texto: '├─ SignalException  NoMemoryError   NUNCA los rescates' },
      { id: 'malerror', texto: '├─ MalError  < Exception          tu error mal parido', desde: 2 },
      { id: 'standard', texto: '└─ StandardError                  el default de rescue' },
      { id: 'base', texto: '   └─ Pagos::Error                  tu base por dominio', desde: 4 },
      { id: 'hijos', texto: '      ├─ Pagos::Rechazado  ├─ Pagos::Indisponible', desde: 5 }
    ],
    pasos: [
      {
        nota: 'La frontera del lenguaje: <code>rescue</code> sin clase captura <code>StandardError</code>, no <code>Exception</code>.',
        marca: { standard: 'ok', exception: 'apagado', signal: 'pierde' },
        panel: { titulo: 'El contrato', lineas: [{ texto: 'begin … rescue => e   # == rescue StandardError => e', estado: 'ok' }] }
      },
      {
        nota: 'Heredas de <code>Exception</code> «para que sea de verdad»: tu error queda del lado equivocado.',
        marca: { malerror: 'nuevo', exception: 'activo' },
        panel: { titulo: 'El mito', lineas: [{ texto: 'class MalError < Exception; end', estado: 'activo' }] }
      },
      {
        nota: 'Resultado: se escapa de casi todos los <code>rescue</code> del ecosistema.',
        marca: { malerror: 'pierde' },
        panel: { titulo: 'Consecuencia', lineas: [{ texto: 'begin; raise MalError; rescue => e; "capturado"; end' }, { texto: '# => MalError: invisible   # nadie lo atajó', estado: 'pierde' }] }
      },
      {
        nota: 'Lo correcto: un base error por dominio, bajo <code>StandardError</code>.',
        marca: { malerror: 'apagado', standard: 'ok', base: 'nuevo' },
        panel: { titulo: 'Diseño', lineas: [{ texto: 'module Pagos' }, { texto: '  Error = Class.new(StandardError)', estado: 'ok' }, { texto: 'end' }] }
      },
      {
        nota: 'Y debajo, las especializaciones que el consumidor quiera distinguir. Tres, no quince.',
        marca: { base: 'ok', hijos: 'nuevo' },
        panel: { titulo: 'Uso', lineas: [{ texto: 'rescue Pagos::Error => e   # atrapa todo el dominio', estado: 'ok' }, { texto: 'rescue Pagos::Rechazado    # cuando importa la razón', estado: 'ok' }] }
      },
      {
        nota: 'Al cruzar de capa, envuelves dentro del <code>rescue</code>: <code>cause</code> conserva el original solo.',
        marca: { base: 'ok', hijos: 'ok' },
        panel: { titulo: 'cause', lineas: [{ texto: 'rescue IOError' }, { texto: '  raise Pagos::Indisponible, "gateway sin respuesta"', estado: 'activo' }, { texto: 'e.cause  # => #<IOError: timeout del gateway>', estado: 'ok' }] }
      }
    ]
  };

  D.widgets.ensure = {
    titulo: 'El ensure que se traga la excepción',
    encabezado: 'Excepción en vuelo · qué queda de ella en cada variante',
    filas: [
      { id: 'excepcion', texto: 'la excepción sigue propagando' },
      { id: 'retorno', texto: 'valor de retorno del método' },
      { id: 'limpieza', texto: 'la limpieza corrió' },
      { id: 'log', texto: 'alguien se enteró' }
    ],
    pasos: [
      {
        nota: '<code>raise "algo grave"</code>. La excepción empieza a subir y toca el <code>ensure</code>.',
        marca: { excepcion: 'activo' },
        panel: { titulo: 'Código', lineas: [{ texto: 'def se_traga' }, { texto: '  raise "algo grave"' }, { texto: 'ensure' }, { texto: '  return :todo_bien', estado: 'activo' }, { texto: 'end' }] }
      },
      {
        nota: 'El <code>return</code> dentro del <code>ensure</code> cambia el flujo. Ruby obedece: la excepción se abandona.',
        marca: { excepcion: 'pierde', retorno: 'pierde', limpieza: 'ok', log: 'pierde' },
        panel: { titulo: 'Resultado', lineas: [{ texto: 'se_traga  # => :todo_bien', estado: 'pierde' }, { texto: 'nadie supo del "algo grave"', estado: 'pierde' }] }
      },
      {
        nota: 'Igual de malo con <code>next</code> o <code>break</code> dentro de un <code>ensure</code> en un bloque.',
        marca: { excepcion: 'pierde', log: 'pierde' },
        panel: { titulo: 'Misma trampa', lineas: [{ texto: 'items.each { |i| … ensure next }', estado: 'pierde' }] }
      },
      {
        nota: 'Arreglo: el <code>ensure</code> solo limpia. Nada de decidir el flujo ahí.',
        marca: { excepcion: 'ok', retorno: 'ok', limpieza: 'ok', log: 'ok' },
        panel: { titulo: 'Código correcto', lineas: [{ texto: 'ensure' }, { texto: '  conexion.close   # limpiar, nada más', estado: 'ok' }, { texto: 'end   # la excepción sigue su camino', estado: 'ok' }] }
      },
      {
        nota: 'Segundo tragadero: un <code>rescue</code> que loguea y sigue. Capturar no es manejar.',
        marca: { excepcion: 'pierde', log: 'activo' },
        panel: { titulo: 'Rescue mudo', lineas: [{ texto: 'rescue => e' }, { texto: '  Rails.logger.warn(e.message)   # y sigue como si nada', estado: 'pierde' }] }
      },
      {
        nota: 'Tercero: un thread cuyo error nadie recoge. <code>report_on_exception</code> lo imprime, <code>value</code> lo levanta.',
        marca: { log: 'ok', excepcion: 'ok' },
        panel: { titulo: 'Threads', lineas: [{ texto: 'h = Thread.new { raise "muero solo" }' }, { texto: 'h.value  # => RuntimeError: muero solo', estado: 'ok' }] }
      }
    ]
  };

  D.widgets.freeze = {
    titulo: 'freeze es superficial',
    encabezado: 'a = [[1, 2], [3]].freeze',
    filas: [
      { id: 'ext', texto: 'a          Array exterior' },
      { id: 'in1', texto: 'a[0]       Array [1, 2]' },
      { id: 'in2', texto: 'a[1]       Array [3]' },
      { id: 'str', texto: 'strings literales del archivo' }
    ],
    pasos: [
      {
        nota: 'Congelo el array de afuera. Un bit, una llamada.',
        marca: { ext: 'ok' },
        panel: { titulo: 'Estado', lineas: [{ texto: 'a.frozen?  # => true', estado: 'ok' }] }
      },
      {
        nota: 'Lo de adentro NO se congeló: <code>freeze</code> no recorre el grafo.',
        marca: { ext: 'ok', in1: 'pierde', in2: 'pierde' },
        panel: { titulo: 'Estado', lineas: [{ texto: 'a[0].frozen?  # => false', estado: 'pierde' }] }
      },
      {
        nota: 'Mutar el continente falla; mutar el contenido pasa sin ruido.',
        marca: { ext: 'ok', in1: 'pierde' },
        panel: { titulo: 'La sorpresa', lineas: [{ texto: 'a << [4]   # => FrozenError', estado: 'ok' }, { texto: 'a[0] << 3  # => [1, 2, 3]  ⚠ mutó', estado: 'pierde' }] }
      },
      {
        nota: 'El único freeze profundo de la stdlib: <code>Ractor.make_shareable</code> (existe por los Ractors).',
        marca: { ext: 'ok', in1: 'ok', in2: 'ok' },
        panel: { titulo: 'Profundo', lineas: [{ texto: 'Ractor.make_shareable(b)' }, { texto: 'b[0].frozen?  # => true', estado: 'ok' }] }
      },
      {
        nota: '<code>frozen_string_literal</code> es otra cosa: deduplica literales, ahorra allocations.',
        marca: { str: 'ok' },
        panel: { titulo: 'El pragma', lineas: [{ texto: '# frozen_string_literal: true' }, { texto: '"hola".object_id == "hola".object_id  # => true', estado: 'ok' }] }
      },
      {
        nota: 'Sin pragma y desde 3.4, los literales son «chilled»: avisan a la primera mutación. Sigue sin ser default en 4.0.',
        marca: { str: 'activo' },
        panel: { titulo: 'Chilled', lineas: [{ texto: 's = "hola"; s << "!"' }, { texto: '# warning: literal string will be frozen in the future', estado: 'activo' }] }
      }
    ]
  };

  D.widgets.concurrencia = {
    titulo: 'Selector de escenario',
    tipo: 'escenarios',
    encabezado: 'Elige la carga y te doy el veredicto',
    opciones: [
      {
        id: 'io',
        label: '10 000 requests HTTP',
        elige: 'Fibers + async (o threads, si el stack no es non-blocking)',
        porque: [
          'La carga es 99% espera: el GVL se suelta en I/O, así que el paralelismo real no hace falta.',
          'Con fibers, 10 000 operaciones concurrentes viven en un hilo sin 10 000 stacks de thread.',
          'Sin locks: la cesión de turno es explícita, así que no hay carreras entre pasos.'
        ],
        evitar: 'Ractors (nada que ganar: no es CPU) y procesos (memoria multiplicada por nada).',
        nota: 'Si alguna gema del camino bloquea de verdad (driver C sin scheduler), fibers no ayudan: ahí threads.'
      },
      {
        id: 'cpu',
        label: 'Resize de 5 000 imágenes',
        elige: 'Procesos (y si la librería libera el GVL, threads también sirven)',
        porque: [
          'Es CPU puro: threads en Ruby no escalan aquí porque el GVL serializa el bytecode.',
          'Los procesos dan paralelismo real hoy, sin pelear con aislamiento ni con shareable.',
          'Muchas librerías de imágenes (ImageMagick, libvips vía FFI) liberan el GVL en su código C: ahí los threads sí escalan.'
        ],
        evitar: 'Threads en Ruby puro (cero ganancia) y Ractors si necesitas gemas que no son ractor-safe.',
        nota: 'Los Ractors son el candidato natural a futuro; en 4.0 siguen experimentales y casi ninguna gema los soporta.'
      },
      {
        id: 'jobs',
        label: 'Jobs en background',
        elige: 'Procesos con threads dentro: el modelo Sidekiq',
        porque: [
          'Un job puede ser I/O o CPU; los threads absorben la espera y los procesos dan el paralelismo.',
          'El aislamiento de proceso te salva del job que se fuga de memoria o revienta el intérprete.',
          'Escalar es sumar procesos, que es la operación que tu orquestador ya sabe hacer.'
        ],
        evitar: 'Un solo proceso con 50 threads: un job pesado en CPU frena a los otros 49.',
        nota: 'Cuida la conexión a la base: el pool debe cubrir el número de threads por proceso, o vas a ver timeouts que parecen del job.'
      },
      {
        id: 'web',
        label: 'Servidor web (Puma)',
        elige: 'W procesos × T threads',
        porque: [
          'Los procesos (workers) dan paralelismo de CPU para el render y la serialización.',
          'Los threads por worker absorben la espera de base de datos y de servicios externos.',
          'Es el único punto donde ajustar T tiene efecto medible: sube hasta que la latencia p95 empeore.'
        ],
        evitar: 'Subir T «porque es gratis»: cada thread pelea el GVL en la parte de CPU y agrava la latencia de cola.',
        nota: 'Copy-on-write ayuda con la memoria de los workers, pero solo si precargas la app (preload_app!).'
      }
    ]
  };
})(window.GUIA = window.GUIA || {});
