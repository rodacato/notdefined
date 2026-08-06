/* Widgets del bloque II. */
(function (G) {
  var D = (G.datos = G.datos || {});
  D.widgets = D.widgets || {};

  D.widgets.generacion = {
    titulo: 'define_method vs method_missing, lado a lado',
    encabezado: 'Qué sabe el objeto de sus propios métodos',
    filas: [
      { id: 'lista', texto: 'instance_methods(false)   → []' },
      { id: 'respond', texto: 'respond_to?(:puerto)      → false' },
      { id: 'method', texto: 'method(:puerto)           → NameError' },
      { id: 'cache', texto: 'inline cache de la llamada → vacía' },
      { id: 'ruta', texto: 'ruta de la llamada        → lookup completo ×2' }
    ],
    pasos: [
      {
        nota: 'Clase sin métodos generados. Nada responde <code>puerto</code>.',
        marca: {},
        panel: { titulo: 'Estado', lineas: [{ texto: 'class Config; def initialize(**d); @datos = d; end; end' }] }
      },
      {
        nota: 'Opción A — <code>method_missing</code>: la llamada funciona, pero es lo único que cambia.',
        marca: { ruta: 'pierde' },
        panel: { titulo: 'method_missing', lineas: [{ texto: 'c.puerto  # => 5432', estado: 'ok' }, { texto: 'llegó ahí tras fallar TODA la cadena', estado: 'pierde' }] }
      },
      {
        nota: 'El objeto miente: responde la llamada y dice que no la conoce.',
        marca: { lista: 'pierde', respond: 'pierde', method: 'pierde', cache: 'pierde' },
        panel: { titulo: 'Lo que se rompe', lineas: [{ texto: 'c.respond_to?(:puerto)  # => false', estado: 'pierde' }, { texto: '[c].map(&:puerto)       # => NameError', estado: 'pierde' }] }
      },
      {
        nota: '<code>respond_to_missing?</code> arregla la mentira — pero solo la mentira.',
        marca: { respond: 'ok', method: 'ok', lista: 'pierde', cache: 'pierde', ruta: 'pierde' },
        panel: { titulo: 'Parche mínimo', lineas: [{ texto: 'def respond_to_missing?(n, p = false)' }, { texto: '  CAMPOS.include?(n) || super' }, { texto: 'end' }] }
      },
      {
        nota: 'Opción B — <code>define_method</code> en load-time: métodos reales.',
        marca: { lista: 'ok', respond: 'ok', method: 'ok', cache: 'ok', ruta: 'ok' },
        panel: { titulo: 'define_method', lineas: [{ texto: 'CAMPOS.each { |c| define_method(c) { @datos[c] } }', estado: 'activo' }, { texto: 'instance_methods(false).sort  # => [:host, :puerto, :tls]', estado: 'ok' }] }
      },
      {
        nota: 'Criterio: nombres conocidos → <code>define_method</code>. Conjunto abierto de verdad → catch-all honesto.',
        marca: { ruta: 'ok', cache: 'ok' },
        panel: { titulo: 'Regla', lineas: [{ texto: '¿puedes enumerar los nombres?  → define_method', estado: 'ok' }, { texto: '¿proxy a un backend desconocido? → method_missing + respond_to_missing?', estado: 'activo' }] }
      }
    ]
  };

  D.widgets.self = {
    titulo: 'El mismo bloque, tres receptores',
    encabezado: 'Bloque: { def marca; :aqui; end }  ·  ¿quién es self, dónde cae el def?',
    filas: [
      { id: 'self', texto: 'self dentro del bloque' },
      { id: 'definee', texto: 'default definee (dónde cae el def)' },
      { id: 'locales', texto: 'variables locales del caller' },
      { id: 'args', texto: 'argumentos al bloque' }
    ],
    pasos: [
      {
        nota: 'Punto de partida: <code>caja = Caja.new</code>, y una local <code>nombre</code> en el caller.',
        marca: {},
        panel: { titulo: 'Setup', lineas: [{ texto: 'caja = Caja.new' }, { texto: 'nombre = "desde el caller"' }] }
      },
      {
        nota: '<code>caja.instance_eval</code>: self es el objeto; el <code>def</code> cae en SU singleton class.',
        marca: { self: 'activo', definee: 'activo', locales: 'ok', args: 'pierde' },
        panel: { titulo: 'instance_eval', lineas: [{ texto: 'self     # => #<Caja:0x…>', estado: 'activo' }, { texto: 'definee  # => singleton class de caja', estado: 'activo' }, { texto: 'caja.singleton_methods  # => [:marca]', estado: 'ok' }] }
      },
      {
        nota: '<code>Caja.class_eval</code>: self es la clase y el <code>def</code> cae como método de INSTANCIA.',
        marca: { self: 'gana', definee: 'gana', locales: 'ok', args: 'pierde' },
        panel: { titulo: 'class_eval', lineas: [{ texto: 'self     # => Caja', estado: 'activo' }, { texto: 'definee  # => Caja', estado: 'activo' }, { texto: 'Caja.instance_methods(false)  # => [:marca]', estado: 'ok' }] }
      },
      {
        nota: '<code>Caja.instance_eval</code>: self es la clase, pero el definee es la singleton class → método de CLASE.',
        marca: { self: 'gana', definee: 'nuevo' },
        panel: { titulo: 'instance_eval sobre la clase', lineas: [{ texto: 'self     # => Caja', estado: 'activo' }, { texto: 'definee  # => #<Class:Caja>', estado: 'nuevo' }, { texto: 'Caja.marca  # => :aqui', estado: 'ok' }] }
      },
      {
        nota: '<code>instance_exec</code> = <code>instance_eval</code> + argumentos. Es la única diferencia.',
        marca: { self: 'activo', definee: 'activo', locales: 'ok', args: 'ok' },
        panel: { titulo: 'instance_exec', lineas: [{ texto: 'caja.instance_exec(3) { |n| [self.class, n, nombre] }' }, { texto: '# => [Caja, 3, "desde el caller"]', estado: 'ok' }] }
      },
      {
        nota: 'Lo que NUNCA cambia: el binding. Lo que SÍ se pierde: los métodos del caller (self se fue).',
        marca: { locales: 'ok', self: 'pierde' },
        panel: { titulo: 'El costo del DSL', lineas: [{ texto: 'dentro del bloque: mis_helpers  # => NoMethodError', estado: 'pierde' }, { texto: 'alternativa: yield self  (bloque con argumento)', estado: 'ok' }] }
      }
    ]
  };

  D.widgets.refinements = {
    titulo: 'Hasta dónde llega un refinement',
    encabezado: 'using Gritos  ·  ¿ve el refinement quién llama?',
    filas: [
      { id: 'directo', texto: 'llamada directa en el archivo, después de using' },
      { id: 'antes', texto: 'llamada ANTES de la línea de using' },
      { id: 'metodo', texto: 'método definido en el mismo archivo, llamado desde el scope' },
      { id: 'send', texto: 'send(:upcase) dinámico' },
      { id: 'otro', texto: 'otro archivo / otra gema' },
      { id: 'trace', texto: 'aparece en ancestors / backtrace' }
    ],
    pasos: [
      {
        nota: 'El refinement redefine <code>String#upcase</code> dentro de <code>module Gritos</code>.',
        marca: {},
        panel: { titulo: 'Setup', lineas: [{ texto: 'module Gritos' }, { texto: '  refine String do' }, { texto: '    def upcase; "¡" + super + "!"; end' }, { texto: '  end' }, { texto: 'end' }] }
      },
      {
        nota: 'Con <code>using Gritos</code>, la llamada directa lo ve — y <code>send</code> también: lo que activa el refinement es el <em>scope</em>, no la sintaxis de la llamada.',
        marca: { directo: 'ok', send: 'ok' },
        panel: { titulo: 'Alcance', lineas: [{ texto: '"hola".upcase         # => "¡HOLA!"', estado: 'ok' }, { texto: '"hola".send(:upcase)  # => "¡HOLA!"', estado: 'ok' }] }
      },
      {
        nota: 'El scope arranca en la línea del <code>using</code>: arriba no aplica.',
        marca: { directo: 'ok', antes: 'pierde' },
        panel: { titulo: 'Alcance', lineas: [{ texto: '# arriba del using', estado: 'pierde' }, { texto: '"hola".upcase  # => "HOLA"', estado: 'pierde' }] }
      },
      {
        nota: 'No se propaga: el cuerpo de un método definido fuera del scope refinado NO ve el refinement, aunque lo llames desde dentro.',
        marca: { metodo: 'pierde' },
        panel: { titulo: 'Alcance', lineas: [{ texto: 'def indirecto(s) = s.upcase' }, { texto: 'indirecto("hola")     # => "HOLA"', estado: 'pierde' }, { texto: 'el scope léxico se queda en el archivo, no viaja', estado: 'pierde' }] }
      },
      {
        nota: 'Fuera del archivo, cero. Y no deja rastro auditable en ningún lado.',
        marca: { otro: 'pierde', trace: 'pierde' },
        panel: { titulo: 'Auditoría', lineas: [{ texto: 'String.ancestors  # sin señal del refinement', estado: 'pierde' }] }
      },
      {
        nota: 'La respuesta adulta: un módulo con nombre, prepended, rastreable en <code>ancestors</code> y en <code>owner</code>.',
        marca: { directo: 'ok', antes: 'ok', metodo: 'ok', send: 'ok', otro: 'ok', trace: 'ok' },
        panel: { titulo: 'prepend', lineas: [{ texto: 'String.prepend(TrimSeguro)' }, { texto: 'String.ancestors.first  # => TrimSeguro', estado: 'ok' }, { texto: 'String.instance_method(:strip).owner  # => TrimSeguro', estado: 'ok' }] }
      }
    ]
  };
})(window.GUIA = window.GUIA || {});
