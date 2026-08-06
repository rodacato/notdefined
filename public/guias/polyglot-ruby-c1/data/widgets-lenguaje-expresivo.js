/* Widgets del bloque III. */
(function (G) {
  var D = (G.datos = G.datos || {});
  D.widgets = D.widgets || {};

  D.widgets.closures = {
    titulo: 'Qué retiene un closure',
    encabezado: 'binding de la lambda devuelta por leak',
    filas: [
      { id: 'pesado', texto: 'heavy    String de 10 MB      ¿la lambda lo menciona? no' },
      { id: 'contador', texto: 'counter  Integer             ¿la lambda lo menciona? sí' },
      { id: 'self', texto: 'self      el objeto que definió el método' }
    ],
    pasos: [
      {
        nota: 'El método declara dos locales y devuelve una lambda que solo usa <code>counter</code>.',
        marca: {},
        panel: { titulo: 'Código', lineas: [{ texto: 'def leak' }, { texto: '  heavy = "x" * 10_000_000' }, { texto: '  counter = 0' }, { texto: '  -> { counter += 1 }' }, { texto: 'end' }] }
      },
      {
        nota: 'La lambda captura el <em>binding</em> completo, no las variables que usa.',
        marca: { pesado: 'activo', contador: 'activo', self: 'activo' },
        panel: { titulo: 'Prueba', lineas: [{ texto: 'f = leak' }, { texto: 'f.binding.local_variables', estado: 'activo' }, { texto: '# => [:heavy, :counter]', estado: 'activo' }] }
      },
      {
        nota: 'Sí: los 10 MB siguen vivos porque el binding los sostiene.',
        marca: { pesado: 'pierde', contador: 'ok' },
        panel: { titulo: 'La fuga', lineas: [{ texto: 'f.binding.local_variable_get(:heavy).bytesize', estado: 'pierde' }, { texto: '# => 10000000', estado: 'pierde' }] }
      },
      {
        nota: '<code>counter</code> es compartido, no copiado: dos llamadas comparten el mismo slot.',
        marca: { contador: 'ok' },
        panel: { titulo: 'Estado compartido', lineas: [{ texto: 'f.call  # => 1' }, { texto: 'f.call  # => 2', estado: 'ok' }] }
      },
      {
        nota: 'Si guardas la lambda en una constante o registro global, esos 10 MB no se liberan nunca.',
        marca: { pesado: 'pierde', self: 'pierde' },
        panel: { titulo: 'Dónde muerde', lineas: [{ texto: 'CALLBACKS = { on_save: leak }', estado: 'pierde' }, { texto: 'y self también queda retenido', estado: 'pierde' }] }
      },
      {
        nota: 'Arreglo: aísla el closure en un scope mínimo, sin nada pesado alrededor.',
        marca: { contador: 'ok', pesado: 'apagado', temp: 'apagado', self: 'apagado' },
        panel: { titulo: 'Arreglo', lineas: [{ texto: 'def clean_counter' }, { texto: '  n = 0' }, { texto: '  -> { n += 1 }     # binding con una sola variable', estado: 'ok' }, { texto: 'end' }] }
      }
    ]
  };

  D.widgets.forwarding = {
    titulo: 'Qué llega al método interno',
    encabezado: 'wrap(1, mode: :wet) { :b }  →  inner(a, mode:, &blk)',
    filas: [
      { id: 'pos', texto: 'posicional a' },
      { id: 'kw', texto: 'keyword mode:' },
      { id: 'blk', texto: 'bloque &blk' },
      { id: 'res', texto: 'resultado de la llamada' }
    ],
    pasos: [
      {
        nota: 'El wrapper clásico: <code>def old_wrap(*args, &amp;blk); real(*args, &amp;blk); end</code>.',
        marca: {},
        panel: { titulo: 'Wrapper', lineas: [{ texto: 'def old_wrap(*args, &blk)' }, { texto: '  inner(*args, &blk)' }, { texto: 'end' }] }
      },
      {
        nota: 'En Ruby 2.6 esto funcionaba: el hash final se convertía en kwargs solo.',
        marca: { pos: 'ok', kw: 'ok', blk: 'ok', res: 'ok' },
        panel: { titulo: 'Ruby 2.6', lineas: [{ texto: 'args  # => [1, {mode: :wet}]' }, { texto: '# => [1, :wet, :b]', estado: 'ok' }] }
      },
      {
        nota: 'Ruby 3.0 separó las categorías: ese hash ya NO se convierte.',
        marca: { pos: 'ok', kw: 'pierde', blk: 'ok', res: 'pierde' },
        panel: { titulo: 'Ruby 3.0+', lineas: [{ texto: 'args  # => [1, {mode: :wet}]   # dos posicionales', estado: 'pierde' }, { texto: '# => ArgumentError (given 2, expected 1)', estado: 'pierde' }] }
      },
      {
        nota: 'El parche de compatibilidad: <code>ruby2_keywords</code> marca el hash para que sobreviva.',
        marca: { pos: 'ok', kw: 'activo', blk: 'ok', res: 'ok' },
        panel: { titulo: 'ruby2_keywords', lineas: [{ texto: 'ruby2_keywords def old_wrap(*args, &blk)', estado: 'activo' }, { texto: '# => [1, :wet, :b]  pero solo para código 2.x', estado: 'activo' }] }
      },
      {
        nota: 'La respuesta de hoy: <code>...</code> reenvía las tres categorías intactas.',
        marca: { pos: 'ok', kw: 'ok', blk: 'ok', res: 'ok' },
        panel: { titulo: 'Forwarding total', lineas: [{ texto: 'def new_wrap(...)' }, { texto: '  inner(...)' }, { texto: 'end' }, { texto: '# => [1, :wet, :b]', estado: 'ok' }] }
      },
      {
        nota: 'Y si quieres declarar las categorías por separado, 3.2+ trae los anónimos.',
        marca: { pos: 'ok', kw: 'ok', blk: 'ok', res: 'ok' },
        panel: { titulo: 'Anónimos (3.2+)', lineas: [{ texto: 'def parcial(*, **, &)' }, { texto: '  inner(*, **, &)', estado: 'ok' }, { texto: 'end' }] }
      }
    ]
  };

  D.widgets.pattern = {
    titulo: 'Un case/in evaluándose patrón por patrón',
    encabezado: 'case { status: "ok", items: [1, 42, 3] }',
    filas: [
      { id: 'p1', texto: 'in Integer' },
      { id: 'p2', texto: 'in { status: "error" }' },
      { id: 'p3', texto: 'in { status: ^expected, items: [] }' },
      { id: 'p4', texto: 'in { status: "ok", items: [*, Integer => n, *] } if n > 40' },
      { id: 'p5', texto: 'in { status: } → liga status' }
    ],
    pasos: [
      {
        nota: 'Sujeto: un hash con dos llaves. <code>expected = "ok"</code> es una local del caller.',
        marca: {},
        panel: { titulo: 'Setup', lineas: [{ texto: 'expected = "ok"' }, { texto: 'sujeto = { status: "ok", items: [1, 42, 3] }' }] }
      },
      {
        nota: 'Primer patrón: un patrón de clase sí usa <code>===</code>. No es un Integer.',
        marca: { p1: 'pierde' },
        panel: { titulo: 'Prueba', lineas: [{ texto: 'Integer === sujeto  # => false', estado: 'pierde' }] }
      },
      {
        nota: 'Segundo: hash pattern → llama <code>deconstruct_keys([:status])</code> y compara el valor literal.',
        marca: { p2: 'pierde' },
        panel: { titulo: 'Protocolo', lineas: [{ texto: 'sujeto.deconstruct_keys([:status])', estado: 'activo' }, { texto: '# => {status: "ok"}  ≠ "error"', estado: 'pierde' }] }
      },
      {
        nota: 'Tercero: el pin <code>^expected</code> COMPARA contra la variable (y sí coincide) pero <code>items: []</code> exige vacío.',
        marca: { p3: 'pierde' },
        panel: { titulo: 'El pin', lineas: [{ texto: '^expected → compara con "ok"  ✓', estado: 'ok' }, { texto: 'items: []  → array pattern exacto ✗', estado: 'pierde' }] }
      },
      {
        nota: 'Cuarto: el find pattern <code>[*, Integer =&gt; n, *]</code> liga en la PRIMERA posición que encaja — <code>n = 1</code> —. El guard corre hasta después de ligar.',
        marca: { p4: 'activo' },
        panel: { titulo: 'Find pattern', lineas: [{ texto: 'items.deconstruct → [1, 42, 3]', estado: 'activo' }, { texto: 'n = 1  (primera posición Integer)', estado: 'activo' }, { texto: '⚠ warning: Find pattern is experimental', estado: 'pierde' }] }
      },
      {
        nota: 'El guard falla con <code>n = 1</code> y ahí se acaba la cláusula: <b>no reintenta con 42</b>. Cae al quinto, que sí liga.',
        marca: { p4: 'pierde', p5: 'gana' },
        panel: { titulo: 'Resultado', lineas: [{ texto: '1 > 40  # => false', estado: 'pierde' }, { texto: 'status  # => "ok"   (ganó el quinto)', estado: 'ok' }, { texto: 'la condición va DENTRO del patrón: (41..) => n', estado: 'ok' }] }
      }
    ]
  };

  D.widgets.lazy = {
    titulo: 'Eager contra lazy, eslabón por eslabón',
    encabezado: 'small.map { _1 * 2 }.select(&:even?).first(3)  ·  2 000 elementos',
    filas: [
      { id: 'arr1', texto: 'array intermedio del map' },
      { id: 'arr2', texto: 'array intermedio del select' },
      { id: 'recorridos', texto: 'recorridos de la colección' },
      { id: 'frames', texto: 'llamadas de Enumerator por elemento' },
      { id: 'veredicto', texto: 'veredicto' }
    ],
    pasos: [
      {
        nota: 'Cadena eager: <code>map</code> recorre los 2 000 y crea un array nuevo.',
        marca: { arr1: 'activo', recorridos: 'activo' },
        panel: { titulo: 'Eager, paso 1', lineas: [{ texto: 'array intermedio: 2 000 elementos', estado: 'activo' }] }
      },
      {
        nota: '<code>select</code> recorre ese array y crea otro. Dos recorridos, dos arrays.',
        marca: { arr1: 'activo', arr2: 'activo', recorridos: 'pierde', frames: 'ok' },
        panel: { titulo: 'Eager, paso 2', lineas: [{ texto: 'recorridos: 2', estado: 'pierde' }, { texto: 'overhead por elemento: ninguno', estado: 'ok' }] }
      },
      {
        nota: 'Con <code>.lazy</code>: cero arrays intermedios, un solo recorrido.',
        marca: { arr1: 'apagado', arr2: 'apagado', recorridos: 'ok', frames: 'pierde' },
        panel: { titulo: 'Lazy', lineas: [{ texto: 'arrays intermedios: 0', estado: 'ok' }, { texto: 'recorridos: 1', estado: 'ok' }, { texto: 'pero: 2 llamadas de Enumerator × 2 000', estado: 'pierde' }] }
      },
      {
        nota: 'En esta colección chica, el overhead por elemento gana: lazy es ~2.4× más lento.',
        marca: { veredicto: 'pierde', frames: 'pierde' },
        panel: { titulo: 'Benchmark', lineas: [{ texto: 'eager  0.180', estado: 'ok' }, { texto: 'lazy   0.430', estado: 'pierde' }] }
      },
      {
        nota: 'Cambio el escenario: 5 000 000 de elementos y corto en el tercero.',
        marca: { arr1: 'pierde', arr2: 'pierde', veredicto: 'activo' },
        panel: { titulo: 'Escenario grande', lineas: [{ texto: 'eager: dos arrays de 5M + 2 recorridos completos', estado: 'pierde' }] }
      },
      {
        nota: 'Ahí lazy no es una optimización: es la única opción sensata (y con infinitos, la única posible).',
        marca: { arr1: 'apagado', arr2: 'apagado', recorridos: 'ok', frames: 'ok', veredicto: 'ok' },
        panel: { titulo: 'Veredicto', lineas: [{ texto: 'lazy paga con: secuencias grandes/infinitas o corte temprano', estado: 'ok' }, { texto: 'estorba con: colección chica que igual materializas', estado: 'pierde' }] }
      }
    ]
  };

  D.widgets.mixin = {
    titulo: 'Defines uno, se encienden los demás',
    encabezado: 'class Version; include Comparable; end',
    filas: [
      { id: 'cmp', texto: '<=>            lo escribes tú' },
      { id: 'menor', texto: '<  >  <=  >=' },
      { id: 'igual', texto: '==' },
      { id: 'between', texto: 'between?  clamp' },
      { id: 'each', texto: 'each           lo escribes tú' },
      { id: 'map', texto: 'map select reject flat_map' },
      { id: 'orden', texto: 'sort sort_by min max min_by' },
      { id: 'agrupa', texto: 'group_by partition each_slice each_cons tally' },
      { id: 'reduce', texto: 'reduce sum count include? find grep zip lazy to_a' }
    ],
    pasos: [
      {
        nota: 'Clase vacía con <code>include Comparable</code>. Todavía nada compara.',
        marca: {},
        panel: { titulo: 'Estado', lineas: [{ texto: 'Version.new("3.4") < Version.new("3.5")' }, { texto: '# => NoMethodError: undefined method <=>', estado: 'pierde' }] }
      },
      {
        nota: 'Defines UN método: <code>&lt;=&gt;</code>.',
        marca: { cmp: 'activo' },
        panel: { titulo: 'Lo único que escribes', lineas: [{ texto: 'def <=>(otra)' }, { texto: '  otra.is_a?(Version) ? partes <=> otra.partes : nil', estado: 'activo' }, { texto: 'end' }] }
      },
      {
        nota: 'Y <code>Comparable</code> te da siete métodos, derivados de ese uno.',
        marca: { cmp: 'ok', menor: 'nuevo', igual: 'nuevo', between: 'nuevo' },
        panel: { titulo: 'Se encienden', lineas: [{ texto: 'v > otra          # => true', estado: 'ok' }, { texto: 'v.between?(a, b)  # => true', estado: 'ok' }, { texto: 'v.clamp(a, b)     # => a', estado: 'ok' }] }
      },
      {
        nota: 'Mismo movimiento con <code>Enumerable</code>: escribes <code>each</code> (con <code>to_enum</code> si no hay bloque).',
        marca: { each: 'activo' },
        panel: { titulo: 'Lo único que escribes', lineas: [{ texto: 'def each' }, { texto: '  return to_enum(:each) unless block_given?', estado: 'activo' }, { texto: '  @lineas.each { |l| yield l }' }, { texto: 'end' }] }
      },
      {
        nota: 'Se encienden decenas: transformación, orden, agrupación, reducción.',
        marca: { each: 'ok', map: 'nuevo', orden: 'nuevo', agrupa: 'nuevo', reduce: 'nuevo' },
        panel: { titulo: 'Se encienden', lineas: [{ texto: 'b.grep(/ERROR/)  # => ["ERROR 500"]', estado: 'ok' }, { texto: 'b.group_by { _1[0..3] }.keys', estado: 'ok' }, { texto: 'b.lazy.map(&:downcase).first', estado: 'ok' }] }
      },
      {
        nota: 'El costo escondido: cada método derivado es un recorrido más de TU <code>each</code>.',
        marca: { each: 'pierde', orden: 'pierde', reduce: 'pierde' },
        panel: { titulo: 'Cuándo NO', lineas: [{ texto: 'sort / to_a  → recorrido completo', estado: 'pierde' }, { texto: 'min / include? → pueden recorrer varias veces', estado: 'pierde' }, { texto: 'si each es caro o tiene efectos: no incluyas Enumerable', estado: 'pierde' }] }
      }
    ]
  };
})(window.GUIA = window.GUIA || {});
