/* Widgets del bloque I. Guion puro: pasos, marcas de estado y narración.
   El motor vive en js/components.js — aquí solo se describe qué se ve.
   Estados de fila: base · activo · gana · apagado · nuevo · pierde */
(function (G) {
  var D = (G.datos = G.datos || {});
  D.widgets = D.widgets || {};

  D.widgets.lookup = {
    titulo: 'El recorrido de ancestors',
    encabezado: 'Box.new.name — la cadena, de arriba hacia abajo',
    filas: [
      { id: 'encima', texto: 'Front          def name → super', desde: 3 },
      { id: 'caja', texto: 'Box            def name' },
      { id: 'etiqueta', texto: 'Label        def name   (include)' },
      { id: 'object', texto: 'Object' },
      { id: 'kernel', texto: 'Kernel' },
      { id: 'basic', texto: 'BasicObject' }
    ],
    pasos: [
      {
        nota: 'Punto de partida: <code>include Label</code> deja el módulo DEBAJO de la clase.',
        marca: {},
        panel: { titulo: 'Estado del código', lineas: [{ texto: 'class Box' }, { texto: '  include Label' }, { texto: '  def name; "clase"; end' }, { texto: 'end' }] }
      },
      {
        nota: 'La llamada entra por el primer eslabón: <code>Box</code>.',
        marca: { caja: 'activo' },
        panel: { titulo: 'Cursor del lookup', lineas: [{ texto: 'Box.new.name' }, { texto: '→ reviso Box', estado: 'activo' }] }
      },
      {
        nota: '<code>Box</code> define <code>name</code>: gana ahí mismo. El módulo nunca se consulta.',
        marca: { caja: 'gana', etiqueta: 'pierde' },
        panel: { titulo: 'Resultado', lineas: [{ texto: '# => "clase"', estado: 'ok' }, { texto: 'Label quedó abajo: inalcanzable', estado: 'pierde' }] }
      },
      {
        nota: 'Ahora sí: <code>prepend Front</code> inserta ARRIBA de la clase.',
        marca: { encima: 'nuevo' },
        panel: { titulo: 'Estado del código', lineas: [{ texto: 'class Box' }, { texto: '  prepend Front', estado: 'activo' }, { texto: 'end' }] }
      },
      {
        nota: 'El cursor ahora arranca en <code>Front</code>, no en <code>Box</code>.',
        marca: { encima: 'activo' },
        panel: { titulo: 'Cursor del lookup', lineas: [{ texto: 'Box.ancestors.first  # => Front' }, { texto: '→ reviso Front', estado: 'activo' }] }
      },
      {
        nota: '<code>Front</code> gana y su <code>super</code> continúa la cadena hacia <code>Box</code>.',
        marca: { encima: 'gana', caja: 'activo' },
        panel: { titulo: 'Resultado', lineas: [{ texto: '# => "prepend → clase"', estado: 'ok' }, { texto: 'prepend pisa la clase; include no.', estado: 'activo' }] }
      }
    ]
  };

  D.widgets.eigenclass = {
    titulo: 'La clase que aparece al hacer def box.open_it',
    encabezado: 'box.singleton_class.ancestors — el eslabón invisible',
    filas: [
      { id: 'eigen', texto: '#<Class:#<Object:0x…>>   ← la eigenclass de box', desde: 2 },
      { id: 'object', texto: 'Object' },
      { id: 'kernel', texto: 'Kernel' },
      { id: 'basic', texto: 'BasicObject' }
    ],
    pasos: [
      {
        nota: '<code>box = Object.new</code>. Cadena normal, sin nada propio.',
        marca: {},
        panel: { titulo: 'Estado', lineas: [{ texto: 'box.singleton_methods  # => []' }] }
      },
      {
        nota: 'Llamo <code>box.open_it</code>: nadie en la cadena lo define.',
        marca: { object: 'activo', kernel: 'activo', basic: 'activo' },
        panel: { titulo: 'Resultado', lineas: [{ texto: '# => NoMethodError', estado: 'pierde' }] }
      },
      {
        nota: '<code>def box.open_it</code> materializa la eigenclass y la inserta ANTES de <code>Object</code>.',
        marca: { eigen: 'nuevo' },
        panel: { titulo: 'Estado del código', lineas: [{ texto: 'def box.open_it; "solo yo"; end', estado: 'activo' }] }
      },
      {
        nota: 'Ahora el lookup entra por la eigenclass y encuentra el método ahí.',
        marca: { eigen: 'gana' },
        panel: { titulo: 'Resultado', lineas: [{ texto: 'box.open_it  # => "solo yo"', estado: 'ok' }, { texto: 'box.singleton_methods  # => [:open_it]' }] }
      },
      {
        nota: 'Otro <code>Object.new</code> no tiene esa clase: el método nunca fue de <code>Object</code>.',
        marca: { eigen: 'apagado', object: 'activo' },
        panel: { titulo: 'Contraste', lineas: [{ texto: 'Object.new.respond_to?(:open_it)  # => false', estado: 'pierde' }] }
      },
      {
        nota: 'Lo mismo pasa con un «método de clase»: es instancia de <code>Warehouse.singleton_class</code>.',
        marca: { eigen: 'gana' },
        panel: { titulo: 'El mismo mecanismo', lineas: [{ texto: 'def self.inventory  ==' }, { texto: 'Warehouse.singleton_class.define_method(:inventory)', estado: 'ok' }] }
      }
    ]
  };

  D.widgets.constantes = {
    titulo: 'El mismo X, dos nestings',
    encabezado: 'Resolución de X desde dos formas de abrir A::B',
    filas: [
      { id: 'lex1', texto: 'léxico  · Module.nesting[0] = A::B      ¿X? no' },
      { id: 'lex2', texto: 'léxico  · Module.nesting[1] = A        ¿X? SÍ → "de A"' },
      { id: 'anc', texto: 'ancestros de A::B → Object             ¿X? SÍ → "top-level"' },
      { id: 'top', texto: 'Object (top-level)                     X = "top-level"' }
    ],
    pasos: [
      {
        nota: 'Escenario: <code>X</code> existe en top-level y también dentro de <code>module A</code>.',
        marca: {},
        panel: { titulo: 'Setup', lineas: [{ texto: 'X = "top-level"' }, { texto: 'module A' }, { texto: '  X = "de A"' }, { texto: '  module B … end' }, { texto: 'end' }] }
      },
      {
        nota: 'Forma anidada: el nesting tiene DOS eslabones, <code>A::B</code> y <code>A</code>.',
        marca: { lex1: 'activo', lex2: 'activo' },
        panel: { titulo: 'module A; module B', lineas: [{ texto: 'Module.nesting  # => [A::B, A]', estado: 'activo' }] }
      },
      {
        nota: 'Se busca léxico primero: <code>A::B</code> no tiene <code>X</code>, <code>A</code> sí. Gana <code>"de A"</code>.',
        marca: { lex1: 'apagado', lex2: 'gana', anc: 'pierde' },
        panel: { titulo: 'Resultado', lineas: [{ texto: 'A::B.which  # => "de A"', estado: 'ok' }, { texto: 'los ancestros ni se consultaron', estado: 'pierde' }] }
      },
      {
        nota: 'Ahora reabro con la forma compacta <code>module A::B</code>: el nesting pierde <code>A</code>.',
        marca: { lex2: 'apagado' },
        panel: { titulo: 'module A::B', lineas: [{ texto: 'Module.nesting  # => [A::B]', estado: 'activo' }, { texto: 'A ya no está en la lista', estado: 'pierde' }] }
      },
      {
        nota: 'Sin candidato léxico, se pasa a los ancestros y ahí solo está el <code>X</code> de top-level.',
        marca: { lex1: 'apagado', lex2: 'apagado', anc: 'activo', top: 'gana' },
        panel: { titulo: 'Resultado', lineas: [{ texto: 'A::B.which2  # => "top-level"', estado: 'ok' }, { texto: 'mismo archivo, mismo X escrito igual', estado: 'pierde' }] }
      },
      {
        nota: 'El gotcha: la forma de abrir el módulo cambió el valor. <code>const_get</code> sigue viendo el de <code>A</code>.',
        marca: { anc: 'gana', top: 'gana' },
        panel: { titulo: 'Escape', lineas: [{ texto: 'A::B.const_get(:X)  # => "top-level"', estado: 'pierde' }, { texto: 'A.const_get(:X)     # => "de A"  ← pregúntale a A', estado: 'ok' }, { texto: '::X                 # => "top-level" explícito', estado: 'ok' }] }
      }
    ]
  };
})(window.GUIA = window.GUIA || {});
