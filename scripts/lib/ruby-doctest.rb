# Contrasta cada sentencia contra lo que el snippet declara en sus `# =>`.
# Convención y uso: docs/guias/autoria.md
require 'prism'
require 'stringio'

# A mano y no con `require "json"`: la gema inyecta un módulo en Object, que
# aparecería en cualquier snippet que imprima `ancestors`.
module Json
  def self.dump(valor)
    case valor
    when nil then 'null'
    when true, false, Numeric then valor.to_s
    when Array then "[#{valor.map { |v| dump(v) }.join(',')}]"
    when Hash then "{#{valor.map { |k, v| "#{dump(k.to_s)}:#{dump(v)}" }.join(',')}}"
    else texto(valor.to_s)
    end
  end

  def self.texto(str)
    escapado = str.gsub(/["\\\x00-\x1f]/) do |c|
      { '"' => '\\"', '\\' => '\\\\', "\n" => '\\n', "\t" => '\\t', "\r" => '\\r' }
        .fetch(c) { format('\\u%04x', c.ord) }
    end
    "\"#{escapado}\""
  end
end

ruta = ARGV[0]
salida = ARGV[1]
fuente = File.read(ruta)
lineas = fuente.lines
arbol = Prism.parse(fuente)

unless arbol.success?
  File.write(salida, Json.dump(ok: false,
                               parse_errors: arbol.errors.map { |e| "L#{e.location.start_line}: #{e.message}" }))
  exit 0
end

CONSTANTE = /\A[A-Z]\w*(?:::[A-Z]\w*)*/

def expectativa_en(texto)
  m = texto.match(/#\s*=>\s*(.*)$/)
  return nil unless m
  m[1].sub(/\s{2,}#.*$/, '').strip
end

# Vive al final de la sentencia o en los comentarios que siguen; el código corta.
def expectativa_de(lineas, fin)
  propia = expectativa_en(lineas[fin - 1].to_s)
  return propia if propia

  i = fin
  while (linea = lineas[i])
    break unless linea.strip.start_with?('#')
    encontrada = expectativa_en(linea)
    return encontrada if encontrada
    i += 1
  end
  nil
end

def error_esperado?(esperado)
  nombre = esperado[CONSTANTE]
  return false unless nombre
  constante = begin
    Object.const_get(nombre)
  rescue StandardError
    nil
  end
  constante.is_a?(Class) && constante <= Exception
end

def coincide?(obtenido, esperado)
  return true if obtenido == esperado
  return false unless esperado.include?('...')
  patron = esperado.split('...', -1).map { |p| Regexp.escape(p) }.join('.*')
  Regexp.new("\\A#{patron}\\z", Regexp::MULTILINE).match?(obtenido)
end

ambito = TOPLEVEL_BINDING
resultados = []

arbol.value.statements.body.each do |nodo|
  inicio = nodo.location.start_line
  fin = nodo.location.end_line
  codigo = lineas[(inicio - 1)...fin].join
  esperado = expectativa_de(lineas, fin)

  entrada = { line: inicio, code: codigo.strip.lines.first.to_s.strip, expected: esperado }

  valor = nil
  levantado = nil
  # El snippet puede imprimir (puts, Benchmark); su stdout no debe mezclarse.
  consola = $stdout
  $stdout = StringIO.new
  begin
    valor = eval(codigo, ambito, ruta, inicio)
  rescue Exception => e
    levantado = e
  ensure
    impreso = $stdout.string
    $stdout = consola
  end
  entrada[:printed] = impreso unless impreso.empty?

  if esperado.nil?
    resultados << if levantado
                    entrada.merge(kind: 'error-no-declarado', ok: false,
                                  got: "#{levantado.class}: #{levantado.message}")
                  else
                    entrada.merge(kind: 'sin-declarar', ok: true, got: nil)
                  end
  elsif error_esperado?(esperado)
    clase = esperado[CONSTANTE]
    ok = !levantado.nil? && levantado.class.ancestors.map(&:to_s).include?(clase)
    resultados << entrada.merge(kind: 'error', ok: ok,
                                got: levantado ? "#{levantado.class}: #{levantado.message}" : "no levantó (#{valor.inspect})")
  else
    obtenido = levantado ? "#{levantado.class}: #{levantado.message}" : valor.inspect
    resultados << entrada.merge(kind: 'valor', ok: levantado.nil? && coincide?(obtenido, esperado), got: obtenido)
  end
end

File.write(salida, Json.dump(ok: true, ruby: RUBY_VERSION, results: resultados))
