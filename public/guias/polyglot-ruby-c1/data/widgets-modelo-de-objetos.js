/* Widgets del bloque I. Guion puro: pasos, marcas de estado y narración.
   El motor vive en js/components.js — aquí solo se describe qué se ve.
   Estados de fila: base · activo · gana · apagado · nuevo · pierde */
(function (G) {
  var D = (G.datos = G.datos || {});
  D.widgets = D.widgets || {};

  D.widgets.lookup = {
    titulo: 'El recorrido de ancestors',
    encabezado: 'Caja.new.nombre — la cadena, de arriba hacia abajo',
    filas: [
      { id: 'encima', texto: 'Encima          def nombre → super', desde: 3 },
      { id: 'caja', texto: 'Caja            def nombre' },
      { id: 'etiqueta', texto: 'Etiqueta        def nombre   (include)' },
      { id: 'object', texto: 'Object' },
      { id: 'kernel', texto: 'Kernel' },
      { id: 'basic', texto: 'BasicObject' }
    ],
    pasos: [
      {
        nota: 'Punto de partida: <code>include Etiqueta</code> deja el módulo DEBAJO de la clase.',
        marca: {},
        panel: { titulo: 'Estado del código', lineas: [{ texto: 'class Caja' }, { texto: '  include Etiqueta' }, { texto: '  def nombre; "clase"; end' }, { texto: 'end' }] }
      },
      {
        nota: 'La llamada entra por el primer eslabón: <code>Caja</code>.',
        marca: { caja: 'activo' },
        panel: { titulo: 'Cursor del lookup', lineas: [{ texto: 'Caja.new.nombre' }, { texto: '→ reviso Caja', estado: 'activo' }] }
      },
      {
        nota: '<code>Caja</code> define <code>nombre</code>: gana ahí mismo. El módulo nunca se consulta.',
        marca: { caja: 'gana', etiqueta: 'pierde' },
        panel: { titulo: 'Resultado', lineas: [{ texto: '# => "clase"', estado: 'ok' }, { texto: 'Etiqueta quedó abajo: inalcanzable', estado: 'pierde' }] }
      },
      {
        nota: 'Ahora sí: <code>prepend Encima</code> inserta ARRIBA de la clase.',
        marca: { encima: 'nuevo' },
        panel: { titulo: 'Estado del código', lineas: [{ texto: 'class Caja' }, { texto: '  prepend Encima', estado: 'activo' }, { texto: 'end' }] }
      },
      {
        nota: 'El cursor ahora arranca en <code>Encima</code>, no en <code>Caja</code>.',
        marca: { encima: 'activo' },
        panel: { titulo: 'Cursor del lookup', lineas: [{ texto: 'Caja.ancestors.first  # => Encima' }, { texto: '→ reviso Encima', estado: 'activo' }] }
      },
      {
        nota: '<code>Encima</code> gana y su <code>super</code> continúa la cadena hacia <code>Caja</code>.',
        marca: { encima: 'gana', caja: 'activo' },
        panel: { titulo: 'Resultado', lineas: [{ texto: '# => "prepend → clase"', estado: 'ok' }, { texto: 'prepend pisa la clase; include no.', estado: 'activo' }] }
      }
    ]
  };

  D.widgets.eigenclass = {
    titulo: 'La clase que aparece al hacer def caja.abrir',
    encabezado: 'caja.singleton_class.ancestors — el eslabón invisible',
    filas: [
      { id: 'eigen', texto: '#<Class:#<Object:0x…>>   ← la eigenclass de caja', desde: 2 },
      { id: 'object', texto: 'Object' },
      { id: 'kernel', texto: 'Kernel' },
      { id: 'basic', texto: 'BasicObject' }
    ],
    pasos: [
      {
        nota: '<code>caja = Object.new</code>. Cadena normal, sin nada propio.',
        marca: {},
        panel: { titulo: 'Estado', lineas: [{ texto: 'caja.singleton_methods  # => []' }] }
      },
      {
        nota: 'Llamo <code>caja.abrir</code>: nadie en la cadena lo define.',
        marca: { object: 'activo', kernel: 'activo', basic: 'activo' },
        panel: { titulo: 'Resultado', lineas: [{ texto: '# => NoMethodError', estado: 'pierde' }] }
      },
      {
        nota: '<code>def caja.abrir</code> materializa la eigenclass y la inserta ANTES de <code>Object</code>.',
        marca: { eigen: 'nuevo' },
        panel: { titulo: 'Estado del código', lineas: [{ texto: 'def caja.abrir; "solo yo"; end', estado: 'activo' }] }
      },
      {
        nota: 'Ahora el lookup entra por la eigenclass y encuentra el método ahí.',
        marca: { eigen: 'gana' },
        panel: { titulo: 'Resultado', lineas: [{ texto: 'caja.abrir  # => "solo yo"', estado: 'ok' }, { texto: 'caja.singleton_methods  # => [:abrir]' }] }
      },
      {
        nota: 'Otro <code>Object.new</code> no tiene esa clase: el método nunca fue de <code>Object</code>.',
        marca: { eigen: 'apagado', object: 'activo' },
        panel: { titulo: 'Contraste', lineas: [{ texto: 'Object.new.respond_to?(:abrir)  # => false', estado: 'pierde' }] }
      },
      {
        nota: 'Lo mismo pasa con un «método de clase»: es instancia de <code>Bodega.singleton_class</code>.',
        marca: { eigen: 'gana' },
        panel: { titulo: 'El mismo mecanismo', lineas: [{ texto: 'def self.inventario  ==' }, { texto: 'Bodega.singleton_class.define_method(:inventario)', estado: 'ok' }] }
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
        panel: { titulo: 'Resultado', lineas: [{ texto: 'A::B.cual  # => "de A"', estado: 'ok' }, { texto: 'los ancestros ni se consultaron', estado: 'pierde' }] }
      },
      {
        nota: 'Ahora reabro con la forma compacta <code>module A::B</code>: el nesting pierde <code>A</code>.',
        marca: { lex2: 'apagado' },
        panel: { titulo: 'module A::B', lineas: [{ texto: 'Module.nesting  # => [A::B]', estado: 'activo' }, { texto: 'A ya no está en la lista', estado: 'pierde' }] }
      },
      {
        nota: 'Sin candidato léxico, se pasa a los ancestros y ahí solo está el <code>X</code> de top-level.',
        marca: { lex1: 'apagado', lex2: 'apagado', anc: 'activo', top: 'gana' },
        panel: { titulo: 'Resultado', lineas: [{ texto: 'A::B.cual2  # => "top-level"', estado: 'ok' }, { texto: 'mismo archivo, mismo X escrito igual', estado: 'pierde' }] }
      },
      {
        nota: 'El gotcha: la forma de abrir el módulo cambió el valor. <code>const_get</code> sigue viendo el de <code>A</code>.',
        marca: { anc: 'gana', top: 'gana' },
        panel: { titulo: 'Escape', lineas: [{ texto: 'A::B.const_get(:X)  # => "de A"', estado: 'ok' }, { texto: '::X                 # => "top-level" explícito', estado: 'ok' }] }
      }
    ]
  };
})(window.GUIA = window.GUIA || {});
