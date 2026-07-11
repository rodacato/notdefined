/* ============================================================================
   patrones-comportamiento.js — los 11 patrones de comportamiento (13–23)
   ----------------------------------------------------------------------------
   Parte del CONTENIDO del almanaque. Ver data/catalogo.js para la estructura
   completa y cómo agregar un patrón. El orden de carga vive en index.html.
   ========================================================================== */
window.PATRONES.patrones.push(
    {
      id: 'chain-of-responsibility',
      no: '13',
      name: 'Chain of Responsibility',
      freq: 'half',
      primary: 'en-accion',
      intent:
        'Pasar una petición por una cadena de manejadores hasta que uno la atienda.',
      star: 'El eslabón Handler — cada uno decide atender o pasar al siguiente.',
      smell:
        'Varios manejadores posibles y no quieres que el emisor los conozca a todos.',
      realWorld:
        'Pipelines de middleware (Rack, Express), burbujeo de eventos, flujos de aprobación, niveles de logging.',
      whenNot:
        'Si solo hay un manejador, sobra. Y ojo: una petición puede recorrer toda la cadena sin que nadie la atienda — falla en silencio si no pones un eslabón final.',
      relatives:
        'vs Decorator (ambos encadenan; CoR puede DETENER la petición, Decorator siempre la pasa).',
      paradigm:
        'En estilos funcionales suele ser una lista de funciones que se recorre hasta el primer resultado no vacío.',
      diagram: {
        vb: [900, 330],
        nodes: [
          {
            id: 'client',
            x: 24,
            y: 128,
            w: 118,
            h: 66,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'iface',
            x: 330,
            y: 20,
            w: 250,
            h: 54,
            role: 'estrella',
            label: 'Handler',
            sub: 'handle() · next',
          },
          {
            id: 'h1',
            x: 180,
            y: 150,
            w: 150,
            h: 72,
            role: 'impl',
            label: 'AuthHandler',
          },
          {
            id: 'h2',
            x: 372,
            y: 150,
            w: 150,
            h: 72,
            role: 'impl',
            label: 'LogHandler',
          },
          {
            id: 'h3',
            x: 564,
            y: 150,
            w: 150,
            h: 72,
            role: 'impl',
            label: 'RateLimit',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'h1',
            type: 'uses',
            label: 'request',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'h1',
            to: 'h2',
            type: 'uses',
            label: '«next»',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'h2',
            to: 'h3',
            type: 'uses',
            label: '«next»',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'h1',
            to: 'iface',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'h2',
            to: 'iface',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'h3',
            to: 'iface',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'if-else gigante de manejadores',
          code: 'function handle(req) {\n  if (!req.token) return "401";        // auth\n  else if (req.tooMany) return "429";  // rate limit\n  else if (req.bad) return "400";      // validación\n  // el emisor conoce a TODOS los manejadores\n}',
          pain: [1, 2, 3, 4],
        },
        after: {
          label: 'Cadena desacoplada',
          code: 'auth.setNext(rate).setNext(validate);\nauth.handle(req);  // viaja hasta que uno atienda\n// agregar un manejador = un eslabón más',
          good: [0, 1],
        },
        why: [
          'El emisor solo conoce el primer eslabón, no a todos.',
          'Cada manejador decide: atender y detener, o pasar.',
          'Reordenar o insertar pasos no toca al emisor.',
        ],
      },
      action: {
        caption:
          'La petición viaja por la cadena hasta que alguien la atiende.',
        steps: [
          {
            from: 'client',
            to: 'h1',
            label: 'request',
            note: 'El emisor manda la petición al primer eslabón; no sabe quién la atenderá.',
          },
          {
            from: 'h1',
            to: 'h2',
            label: 'no me toca → next',
            note: 'AuthHandler no puede atenderla y la pasa al siguiente.',
          },
          {
            from: 'h2',
            to: 'h3',
            label: 'no me toca → next',
            note: 'LogHandler tampoco; la petición sigue viajando.',
          },
          {
            from: 'h3',
            to: 'client',
            label: 'atendida ✓',
            note: 'RateLimit la atiende y la cadena se detiene aquí.',
          },
        ],
      },
      code: {
        ts: 'type Req = { path: string; token?: string };\n\nabstract class Handler {\n  private next?: Handler;\n  setNext(h: Handler) { this.next = h; return h; }\n  handle(req: Req): string {\n    // si nadie la atiende, sigue la cadena; el final responde 200\n    return this.next ? this.next.handle(req) : "200 ok";\n  }\n}\n\nclass AuthHandler extends Handler {\n  handle(req: Req) {\n    if (!req.token) return "401 sin token";   // atiende y CORTA la cadena\n    return super.handle(req);                 // o la deja pasar\n  }\n}\n\nclass LogHandler extends Handler {\n  handle(req: Req) {\n    console.log(`log: ${req.path}`);   // hace lo suyo y SIEMPRE pasa\n    return super.handle(req);\n  }\n}\n\nconst chain = new AuthHandler();\nchain.setNext(new LogHandler());\n\nconsole.log(chain.handle({ path: "/admin" }));   // => 401 sin token\nconsole.log(chain.handle({ path: "/admin", token: "abc" }));\n// => log: /admin\n// => 200 ok',
        py: '# versión pythónica: la cadena es una lista de funciones;\n# cada handler atiende (devuelve algo) o pasa (devuelve None)\ndef auth(req):\n    if "token" not in req:\n        return "401 sin token"   # atiende y CORTA la cadena\n\ndef log(req):\n    print(f"log: {req[\'path\']}")   # hace lo suyo y SIEMPRE pasa\n\ndef handle(chain, req):\n    for handler in chain:\n        result = handler(req)\n        if result is not None:\n            return result\n    return "200 ok"   # nadie la cortó\n\nchain = [auth, log]\n\nprint(handle(chain, {"path": "/admin"}))  # => 401 sin token\nprint(handle(chain, {"path": "/admin", "token": "abc"}))\n# => log: /admin\n# => 200 ok',
        rb: 'class Handler\n  attr_writer :next\n  # si nadie la atiende, sigue la cadena; el final responde 200\n  def handle(req) = @next ? @next.handle(req) : "200 ok"\nend\n\nclass AuthHandler < Handler\n  def handle(req)\n    return "401 sin token" unless req[:token]   # atiende y CORTA la cadena\n    super                                       # o la deja pasar\n  end\nend\n\nclass LogHandler < Handler\n  def handle(req)\n    puts "log: #{req[:path]}"   # hace lo suyo y SIEMPRE pasa\n    super\n  end\nend\n\nchain = AuthHandler.new\nchain.next = LogHandler.new\n\nputs chain.handle(path: "/admin")   # => 401 sin token\nputs chain.handle(path: "/admin", token: "abc")\n# => log: /admin\n# => 200 ok',
        go: 'package main\n\nimport "fmt"\n\ntype Req struct {\n    Path  string\n    Token string\n}\n\ntype Handler interface{ Handle(r Req) string }\n\n// Atiende y CORTA la cadena, o delega al siguiente.\ntype AuthHandler struct{ next Handler }\n\nfunc (a AuthHandler) Handle(r Req) string {\n    if r.Token == "" {\n        return "401 sin token"\n    }\n    return a.next.Handle(r)\n}\n\n// Hace lo suyo y SIEMPRE pasa.\ntype LogHandler struct{ next Handler }\n\nfunc (l LogHandler) Handle(r Req) string {\n    fmt.Println("log: " + r.Path)\n    return l.next.Handle(r)\n}\n\n// El final de la cadena responde.\ntype OkHandler struct{}\nfunc (OkHandler) Handle(Req) string { return "200 ok" }\n\nfunc main() {\n    chain := AuthHandler{LogHandler{OkHandler{}}}\n\n    fmt.Println(chain.Handle(Req{Path: "/admin"})) // => 401 sin token\n    fmt.Println(chain.Handle(Req{Path: "/admin", Token: "abc"}))\n    // => log: /admin\n    // => 200 ok\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
    {
      id: 'command',
      no: '14',
      name: 'Command',
      freq: 'star',
      primary: 'en-accion',
      intent:
        'Encapsular una petición como un objeto (la acción y sus parámetros).',
      star: 'El objeto comando — lleva la acción y sabe ejecutarla y deshacerla.',
      smell:
        'Necesitas desacoplar al que invoca del que ejecuta, y poder deshacer / encolar / registrar acciones.',
      realWorld:
        'Deshacer/rehacer, acciones de botones/menú, colas de trabajos (jobs en background), operaciones transaccionales, grabar macros.',
      whenNot:
        'Si la acción es directa y no necesitas undo/cola/log, un comando es ceremonia. Una lambda basta.',
      relatives:
        'vs Strategy (Command = una acción a ejecutar/deshacer; Strategy = un algoritmo intercambiable). Se combina con Memento para undo.',
      paradigm:
        'Una lambda/closure es un Command liviano: empaqueta acción + datos sin declarar una clase.',
      diagram: {
        vb: [820, 360],
        nodes: [
          {
            id: 'invoker',
            x: 40,
            y: 60,
            w: 160,
            h: 72,
            role: 'cliente',
            label: 'Button',
            sub: 'invoker',
          },
          {
            id: 'command',
            x: 270,
            y: 40,
            w: 180,
            h: 80,
            role: 'estrella',
            label: 'Command',
            sub: 'execute()\nundo()',
          },
          {
            id: 'concrete',
            x: 270,
            y: 250,
            w: 180,
            h: 76,
            role: 'impl',
            label: 'PasteCommand',
          },
          {
            id: 'receiver',
            x: 560,
            y: 250,
            w: 180,
            h: 76,
            role: 'impl',
            label: 'Document',
            sub: 'receiver',
          },
        ],
        edges: [
          {
            from: 'invoker',
            to: 'command',
            type: 'uses',
            label: 'execute()',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'concrete',
            to: 'command',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'concrete',
            to: 'receiver',
            type: 'uses',
            label: 'actúa sobre',
            fromSide: 'right',
            toSide: 'left',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Invocador atado al receptor',
          code: 'button.onClick = () => document.paste(text); // acoplado\n// no hay forma de deshacer ni encolar',
          pain: [0, 1],
        },
        after: {
          label: 'Acción como objeto',
          code: 'const cmd = new PasteCommand(document, text);\nhistory.run(cmd);   // ejecuta y apila\nhistory.undo();     // deshace',
          good: [0, 1, 2],
        },
        why: [
          'El invocador dispara execute() sin saber qué hace.',
          'La acción se guarda en una pila: deshacer y rehacer salen gratis.',
          'Encolar, registrar o programar la acción es trivial.',
        ],
      },
      action: {
        caption:
          'La acción viaja empaquetada: se ejecuta, se apila y puede deshacerse.',
        steps: [
          {
            from: 'invoker',
            to: 'concrete',
            label: 'execute()',
            note: 'El invocador dispara el comando, sin saber qué hace por dentro.',
          },
          {
            from: 'concrete',
            to: 'receiver',
            label: 'doPaste()',
            note: 'El comando ejecuta la acción real sobre el receptor.',
          },
          {
            from: 'concrete',
            to: 'invoker',
            label: 'push a la pila',
            note: 'El comando se guarda en la pila de undo.',
          },
          {
            from: 'invoker',
            to: 'concrete',
            label: 'undo()',
            note: 'Al deshacer, el comando revierte su efecto en el receptor.',
          },
        ],
      },
      code: {
        ts: 'class TextDocument {\n  text = "";\n  insert(t: string) { this.text += t; }\n  remove(t: string) { this.text = this.text.slice(0, -t.length); }\n}\n\ninterface Command { execute(): void; undo(): void }\n\n// la petición hecha objeto: sabe hacerse y deshacerse\nclass PasteCommand implements Command {\n  constructor(private doc: TextDocument, private text: string) {}\n  execute() { this.doc.insert(this.text); }\n  undo() { this.doc.remove(this.text); }\n}\n\n// el invoker: ejecuta y apila sin saber qué hace cada comando\nclass History {\n  private stack: Command[] = [];\n  run(cmd: Command) { cmd.execute(); this.stack.push(cmd); }\n  undo() { this.stack.pop()?.undo(); }\n}\n\nconst doc = new TextDocument();\nconst history = new History();\nhistory.run(new PasteCommand(doc, "hola"));\nhistory.run(new PasteCommand(doc, " mundo"));\nconsole.log(doc.text); // => hola mundo\nhistory.undo();\nconsole.log(doc.text); // => hola',
        py: 'class Document:\n    def __init__(self): self.text = ""\n    def insert(self, t): self.text += t\n    def remove(self, t): self.text = self.text[:-len(t)]\n\n# versión pythónica: el comando es un par de closures (hacer, deshacer)\ndef paste_command(doc, text):\n    return (lambda: doc.insert(text), lambda: doc.remove(text))\n\nclass History:   # el invoker: ejecuta y apila sin saber qué hace cada comando\n    def __init__(self): self.undo_stack = []\n\n    def run(self, command):\n        execute, undo = command\n        execute()\n        self.undo_stack.append(undo)\n\n    def undo(self): self.undo_stack.pop()()\n\ndoc = Document()\nhistory = History()\nhistory.run(paste_command(doc, "hola"))\nhistory.run(paste_command(doc, " mundo"))\nprint(doc.text)  # => hola mundo\nhistory.undo()\nprint(doc.text)  # => hola',
        rb: 'class Document\n  attr_reader :text\n  def initialize = @text = ""\n  def insert(t) = @text += t\n  def remove(t) = @text = @text[0...-t.length]\nend\n\n# la petición hecha objeto: sabe hacerse y deshacerse\nPasteCommand = Struct.new(:doc, :text) do\n  def execute = doc.insert(text)\n  def undo = doc.remove(text)\nend\n\nclass History   # el invoker: ejecuta y apila sin saber qué hace cada comando\n  def initialize = @stack = []\n\n  def run(command)\n    command.execute\n    @stack << command\n  end\n\n  def undo = @stack.pop&.undo\nend\n\ndoc = Document.new\nhistory = History.new\nhistory.run(PasteCommand.new(doc, "hola"))\nhistory.run(PasteCommand.new(doc, " mundo"))\nputs doc.text  # => hola mundo\nhistory.undo\nputs doc.text  # => hola',
        go: 'package main\n\nimport "fmt"\n\ntype Document struct{ Text string }\n\nfunc (d *Document) Insert(t string) { d.Text += t }\nfunc (d *Document) Remove(t string) { d.Text = d.Text[:len(d.Text)-len(t)] }\n\n// La petición hecha objeto: sabe hacerse y deshacerse.\ntype Command interface {\n    Execute()\n    Undo()\n}\n\ntype PasteCommand struct {\n    doc  *Document\n    text string\n}\n\nfunc (p PasteCommand) Execute() { p.doc.Insert(p.text) }\nfunc (p PasteCommand) Undo()    { p.doc.Remove(p.text) }\n\n// El invoker: ejecuta y apila sin saber qué hace cada comando.\ntype History struct{ stack []Command }\n\nfunc (h *History) Run(c Command) {\n    c.Execute()\n    h.stack = append(h.stack, c)\n}\n\nfunc (h *History) Undo() {\n    last := h.stack[len(h.stack)-1]\n    h.stack = h.stack[:len(h.stack)-1]\n    last.Undo()\n}\n\nfunc main() {\n    doc := &Document{}\n    history := &History{}\n    history.Run(PasteCommand{doc, "hola"})\n    history.Run(PasteCommand{doc, " mundo"})\n    fmt.Println(doc.Text) // => hola mundo\n    history.Undo()\n    fmt.Println(doc.Text) // => hola\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
    {
      id: 'iterator',
      no: '15',
      name: 'Iterator',
      freq: 'star',
      primary: 'en-accion',
      intent: 'Recorrer una colección sin exponer su representación interna.',
      star: 'El cursor — avanza por la colección sin que el cliente sepa cómo está hecha.',
      smell:
        'El cliente acoplado a la estructura interna de la colección (índices, nodos…).',
      realWorld: 'Cada for...of, each, generador. Está en todas partes.',
      whenNot:
        'Casi nunca lo escribes a mano: tu lenguaje ya lo trae y ya te la sabes (for...of, each). Implementarlo manual para una lista es reinventar la rueda.',
      relatives:
        'Pariente de Composite (iterar árboles). Más concepto integrado que código que vayas a teclear.',
      paradigm:
        'Viene INTEGRADO en casi todo lenguaje moderno (Enumerable, __iter__, generadores, iter.Seq de Go). Rara vez se implementa a mano.',
      diagram: {
        vb: [800, 330],
        nodes: [
          {
            id: 'client',
            x: 40,
            y: 128,
            w: 130,
            h: 66,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'iterator',
            x: 270,
            y: 40,
            w: 180,
            h: 80,
            role: 'estrella',
            label: 'Iterator',
            sub: 'next() · hasNext()',
          },
          {
            id: 'collection',
            x: 270,
            y: 210,
            w: 180,
            h: 80,
            role: 'interfaz',
            label: 'Collection',
            sub: '+ iterator()',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'iterator',
            type: 'uses',
            label: 'next()',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'client',
            to: 'collection',
            type: 'uses',
            label: 'iterar',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'collection',
            to: 'iterator',
            type: 'creates',
            label: '«crea»',
            fromSide: 'top',
            toSide: 'bottom',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Cliente atado a la estructura',
          code: 'for (let i = 0; i < list.items.length; i++) {  // asume arreglo\n  use(list.items[i]);\n}\n// si cambia a árbol, este código rompe',
          pain: [0, 1, 3],
        },
        after: {
          label: 'Recorrido uniforme',
          code: 'for (const item of collection) {  // no importa qué hay debajo\n  use(item);\n}',
          good: [0],
        },
        why: [
          'El cliente pide el siguiente, sin conocer la estructura.',
          'Arreglo o árbol: el recorrido se ve igual.',
          'Permite varios recorridos a la vez sobre la misma colección.',
        ],
      },
      action: {
        caption:
          'Un cursor avanza por la colección; el cliente no ve la estructura.',
        steps: [
          {
            from: 'client',
            to: 'iterator',
            label: 'hasNext() · next()',
            note: 'El cliente pide el siguiente elemento al iterador.',
          },
          {
            from: 'iterator',
            to: 'collection',
            label: 'lee posición actual',
            note: 'El iterador conoce la estructura interna; el cliente no.',
          },
          {
            from: 'iterator',
            to: 'client',
            label: 'elemento',
            note: 'Devuelve el elemento y avanza. Se repite hasta que hasNext() es falso.',
          },
        ],
      },
      code: {
        ts: 'class TreeNode {\n  private children: TreeNode[] = [];\n  constructor(public value: number) {}\n\n  add(child: TreeNode) { this.children.push(child); return this; }\n\n  // el iterador esconde el recorrido (DFS); el cliente ni se entera\n  *[Symbol.iterator](): Generator<number> {\n    yield this.value;\n    for (const child of this.children) yield* child;\n  }\n}\n\nconst tree = new TreeNode(1)\n  .add(new TreeNode(2).add(new TreeNode(3)))\n  .add(new TreeNode(4));\n\n// cualquier consumidor estándar funciona: for..of, spread, destructuring\nconsole.log([...tree].join(","));  // => 1,2,3,4',
        py: 'class TreeNode:\n    def __init__(self, value):\n        self.value, self.children = value, []\n\n    def add(self, child):\n        self.children.append(child)\n        return self\n\n    # un generador esconde el recorrido (DFS); el cliente ni se entera\n    def __iter__(self):\n        yield self.value\n        for child in self.children:\n            yield from child\n\ntree = TreeNode(1).add(TreeNode(2).add(TreeNode(3))).add(TreeNode(4))\n\n# cualquier consumidor estándar funciona: for, list, sum...\nprint(list(tree))  # => [1, 2, 3, 4]\nprint(sum(tree))   # => 10',
        rb: 'class TreeNode\n  include Enumerable   # regala map, select, sum... a cambio de each\n\n  attr_reader :value, :children\n\n  def initialize(value)\n    @value, @children = value, []\n  end\n\n  def add(child)\n    @children << child\n    self\n  end\n\n  # each esconde el recorrido (DFS); el cliente ni se entera\n  def each(&block)\n    yield value\n    children.each { |child| child.each(&block) }\n  end\nend\n\ntree = TreeNode.new(1).add(TreeNode.new(2).add(TreeNode.new(3))).add(TreeNode.new(4))\n\nputs tree.to_a.inspect  # => [1, 2, 3, 4]\nputs tree.sum           # => 10',
        go: 'package main\n\nimport (\n    "fmt"\n    "iter"\n)\n\ntype TreeNode struct {\n    value    int\n    children []*TreeNode\n}\n\nfunc (t *TreeNode) Add(child *TreeNode) *TreeNode {\n    t.children = append(t.children, child)\n    return t\n}\n\n// Go 1.23+: el iterador es una función; esconde el recorrido (DFS).\nfunc (t *TreeNode) All() iter.Seq[int] {\n    return func(yield func(int) bool) { t.walk(yield) }\n}\n\nfunc (t *TreeNode) walk(yield func(int) bool) bool {\n    if !yield(t.value) {\n        return false\n    }\n    for _, child := range t.children {\n        if !child.walk(yield) {\n            return false\n        }\n    }\n    return true\n}\n\nfunc main() {\n    tree := (&TreeNode{value: 1}).\n        Add((&TreeNode{value: 2}).Add(&TreeNode{value: 3})).\n        Add(&TreeNode{value: 4})\n\n    total := 0\n    for v := range tree.All() {   // range-over-func estándar\n        total += v\n    }\n    fmt.Println(total) // => 10\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
    {
      id: 'mediator',
      no: '16',
      name: 'Mediator',
      freq: 'half',
      primary: 'antes-despues',
      intent:
        'Centralizar la comunicación compleja entre objetos en un mediador (de muchos-a-muchos a muchos-a-uno).',
      star: 'El mediador — el punto central por el que pasan todas las interacciones.',
      smell:
        'Una telaraña de objetos que se referencian entre sí (acoplamiento spaghetti).',
      realWorld:
        'Una sala de chat (los usuarios hablan vía la sala), un coordinador de formulario (campos que se habilitan entre sí), control de tráfico aéreo.',
      whenNot:
        'Cuidado: el mediador puede volverse un «objeto-dios» que concentra toda la lógica. Para pocos objetos, sobra.',
      relatives:
        'vs Facade (Facade solo expone hacia afuera; Mediator coordina iguales que se hablan) y vs Observer (mecanismo de notificación).',
      paradigm:
        'En sistemas de eventos, el bus de eventos cumple el rol de mediador desacoplado.',
      diagram: {
        vb: [820, 360],
        nodes: [
          {
            id: 'mediator',
            x: 320,
            y: 140,
            w: 180,
            h: 90,
            role: 'estrella',
            label: 'ChatRoom',
            sub: 'mediador',
          },
          {
            id: 'c1',
            x: 60,
            y: 40,
            w: 150,
            h: 62,
            role: 'impl',
            label: 'Alice',
          },
          {
            id: 'c2',
            x: 60,
            y: 260,
            w: 150,
            h: 62,
            role: 'impl',
            label: 'Bob',
          },
          {
            id: 'c3',
            x: 610,
            y: 40,
            w: 150,
            h: 62,
            role: 'impl',
            label: 'Carol',
          },
          {
            id: 'c4',
            x: 610,
            y: 260,
            w: 150,
            h: 62,
            role: 'impl',
            label: 'Dave',
          },
        ],
        edges: [
          {
            from: 'c1',
            to: 'mediator',
            type: 'uses',
            label: '«vía sala»',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'c2',
            to: 'mediator',
            type: 'uses',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'c3',
            to: 'mediator',
            type: 'uses',
            fromSide: 'left',
            toSide: 'right',
          },
          {
            from: 'c4',
            to: 'mediator',
            type: 'uses',
            fromSide: 'left',
            toSide: 'right',
          },
        ],
      },
      beforeAfter: {
        viz: 'mesh-star',
        before: {
          label: 'Telaraña de referencias N×N',
          code: 'checkbox.onChange = () => {\n  input.enable();\n  button.disable();   // cada widget conoce a los demás\n};\ninput.onType = () => button.enable();  // N×N referencias\n// mover un widget = reescribir a todos sus vecinos',
          pain: [1, 2, 4, 5],
        },
        after: {
          label: 'Todos hablan con el mediador',
          code: 'checkbox.onChange = () => dialog.notify(checkbox, "change");\ninput.onType     = () => dialog.notify(input, "type");\n// el diálogo decide a quién tocar; los widgets no se conocen',
          good: [0, 1, 2],
        },
        why: [
          'La maraña de N×N conexiones colapsa en N enlaces a un centro.',
          'Cada objeto solo conoce al mediador, no a sus pares.',
          'Cuidado: la complejidad se muda al mediador — vigílalo.',
        ],
      },
      action: {
        caption: 'Nadie se habla directo: todo pasa por el mediador central.',
        steps: [
          {
            from: 'c1',
            to: 'mediator',
            label: "send('hola')",
            note: 'Alice no conoce a los demás; solo habla con la sala.',
          },
          {
            from: 'mediator',
            to: 'c2',
            label: 'deliver',
            note: 'El mediador reparte el mensaje a los otros participantes.',
          },
          {
            from: 'mediator',
            to: 'c3',
            label: 'deliver',
            note: 'Uno-a-muchos, pero pasando por un solo punto central.',
          },
          {
            from: 'mediator',
            to: 'c4',
            label: 'deliver',
            note: 'Agregar un participante no toca a los demás: solo conoce la sala.',
          },
        ],
      },
      code: {
        ts: 'class User {\n  room?: ChatRoom;\n  constructor(public name: string) {}\n  send(msg: string) { this.room?.broadcast(this, msg); }   // habla vía la sala\n  receive(msg: string) { console.log(`${this.name} recibe: ${msg}`); }\n}\n\n// el mediador: nadie conoce a nadie; todos conocen la sala\nclass ChatRoom {\n  private users: User[] = [];\n  join(user: User) { this.users.push(user); user.room = this; }\n  broadcast(from: User, msg: string) {\n    for (const user of this.users) if (user !== from) user.receive(msg);\n  }\n}\n\nconst room = new ChatRoom();\nconst alice = new User("Alice");\n[alice, new User("Bob"), new User("Carol")].forEach((u) => room.join(u));\n\nalice.send("hola");\n// => Bob recibe: hola\n// => Carol recibe: hola',
        py: 'class User:\n    def __init__(self, name):\n        self.name, self.room = name, None\n\n    def send(self, msg):   # habla vía la sala, no con otros users\n        self.room.broadcast(self, msg)\n\n    def receive(self, msg):\n        print(f"{self.name} recibe: {msg}")\n\nclass ChatRoom:   # el mediador: nadie conoce a nadie; todos conocen la sala\n    def __init__(self): self.users = []\n\n    def join(self, user):\n        self.users.append(user)\n        user.room = self\n\n    def broadcast(self, sender, msg):\n        for user in self.users:\n            if user is not sender:\n                user.receive(msg)\n\nroom = ChatRoom()\nalice = User("Alice")\nfor user in (alice, User("Bob"), User("Carol")):\n    room.join(user)\n\nalice.send("hola")\n# => Bob recibe: hola\n# => Carol recibe: hola',
        rb: 'class User\n  attr_reader :name\n  attr_accessor :room\n\n  def initialize(name) = @name = name\n\n  # habla vía la sala, no con otros users (send a secas es de Object)\n  def send_msg(msg) = room.broadcast(self, msg)\n\n  def receive(msg) = puts("#{name} recibe: #{msg}")\nend\n\nclass ChatRoom   # el mediador: nadie conoce a nadie; todos conocen la sala\n  def initialize = @users = []\n\n  def join(user)\n    @users << user\n    user.room = self\n  end\n\n  def broadcast(sender, msg)\n    @users.reject { _1 == sender }.each { _1.receive(msg) }\n  end\nend\n\nroom = ChatRoom.new\nalice = User.new("Alice")\n[alice, User.new("Bob"), User.new("Carol")].each { room.join(_1) }\n\nalice.send_msg("hola")\n# => Bob recibe: hola\n# => Carol recibe: hola',
        go: 'package main\n\nimport "fmt"\n\ntype User struct {\n    name string\n    room *ChatRoom\n}\n\n// Habla vía la sala, no con otros users.\nfunc (u *User) Send(msg string) { u.room.Broadcast(u, msg) }\n\nfunc (u *User) Receive(msg string) { fmt.Println(u.name + " recibe: " + msg) }\n\n// El mediador: nadie conoce a nadie; todos conocen la sala.\ntype ChatRoom struct{ users []*User }\n\nfunc (c *ChatRoom) Join(u *User) {\n    c.users = append(c.users, u)\n    u.room = c\n}\n\nfunc (c *ChatRoom) Broadcast(from *User, msg string) {\n    for _, u := range c.users {\n        if u != from {\n            u.Receive(msg)\n        }\n    }\n}\n\nfunc main() {\n    room := &ChatRoom{}\n    alice := &User{name: "Alice"}\n    for _, u := range []*User{alice, {name: "Bob"}, {name: "Carol"}} {\n        room.Join(u)\n    }\n\n    alice.Send("hola")\n    // => Bob recibe: hola\n    // => Carol recibe: hola\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
    {
      id: 'memento',
      no: '17',
      name: 'Memento',
      freq: 'open',
      primary: 'en-accion',
      intent:
        'Capturar y restaurar el estado de un objeto sin violar su encapsulación.',
      star: 'El memento — una cápsula sellada de estado que solo el originador sabe leer.',
      smell:
        'Implementar deshacer/snapshots sin exponer las tripas del objeto.',
      realWorld:
        'Deshacer (junto con Command), partidas guardadas, rollback de transacciones, historial de un editor.',
      whenNot:
        'Ojo con el costo de memoria de los snapshots: copiar todo el estado a cada cambio puede ser caro.',
      relatives:
        'Se combina con Command para construir undo/redo. El cuidador guarda mementos pero no los inspecciona.',
      paradigm:
        'Estructuras inmutables lo hacen trivial: el «estado anterior» es solo otra referencia que conservas.',
      diagram: {
        vb: [820, 350],
        nodes: [
          {
            id: 'originator',
            x: 50,
            y: 130,
            w: 180,
            h: 84,
            role: 'impl',
            label: 'Editor',
            sub: 'save() · restore()',
          },
          {
            id: 'memento',
            x: 320,
            y: 40,
            w: 180,
            h: 74,
            role: 'estrella',
            label: 'Memento',
            sub: 'state (sellado)',
          },
          {
            id: 'caretaker',
            x: 320,
            y: 240,
            w: 180,
            h: 82,
            role: 'cliente',
            label: 'History',
            sub: 'stack<Memento>',
          },
        ],
        edges: [
          {
            from: 'originator',
            to: 'memento',
            type: 'creates',
            label: '«crea»',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'caretaker',
            to: 'memento',
            type: 'uses',
            label: 'guarda',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'caretaker',
            to: 'originator',
            type: 'uses',
            label: 'restore(m)',
            fromSide: 'left',
            toSide: 'bottom',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Exponer las tripas para deshacer',
          code: 'const backup = { text: editor.text, sel: editor.sel }; // lee todo\n// el caretaker depende de la estructura interna del editor',
          pain: [0, 1],
        },
        after: {
          label: 'Estado sellado',
          code: 'const m = editor.save();   // el editor decide qué guardar\nhistory.push(m);           // opaco para el caretaker\neditor.restore(history.pop());',
          good: [0, 1, 2],
        },
        why: [
          'El originador decide qué guardar y cómo restaurarlo.',
          'El cuidador conserva el memento sin leer su contenido.',
          'La encapsulación se mantiene: nadie hurga en el estado interno.',
        ],
      },
      action: {
        caption:
          'El editor sella su estado; el cuidador lo guarda sin mirarlo.',
        steps: [
          {
            from: 'originator',
            to: 'memento',
            label: 'save()',
            note: 'El editor crea un memento con su estado actual.',
          },
          {
            from: 'memento',
            to: 'caretaker',
            label: 'push',
            note: 'El cuidador guarda el memento sin mirar su contenido (sellado).',
          },
          {
            from: 'caretaker',
            to: 'originator',
            label: 'restore(m)',
            note: 'Al deshacer, devuelve el último memento y el editor recupera su estado.',
          },
        ],
      },
      code: {
        ts: '// el estado sellado: el caretaker lo guarda pero no lo edita\nclass Memento {\n  constructor(readonly state: string) {}\n}\n\nclass Editor {\n  private text = "";\n  type(t: string) { this.text += t; }\n  get content() { return this.text; }\n  save() { return new Memento(this.text); }        // captura sin exponer internos\n  restore(m: Memento) { this.text = m.state; }\n}\n\nconst editor = new Editor();\nconst history: Memento[] = [];   // el caretaker: apila sin mirar adentro\n\neditor.type("hola");\nhistory.push(editor.save());\neditor.type(" mundo");\nconsole.log(editor.content); // => hola mundo\n\neditor.restore(history.pop()!);\nconsole.log(editor.content); // => hola',
        py: 'from dataclasses import dataclass\n\n@dataclass(frozen=True)   # inmutable: el caretaker lo guarda pero no lo edita\nclass Memento:\n    state: str\n\nclass Editor:\n    def __init__(self): self._text = ""\n\n    def type(self, t): self._text += t\n\n    @property\n    def content(self): return self._text\n\n    def save(self): return Memento(self._text)   # captura sin exponer internos\n\n    def restore(self, memento): self._text = memento.state\n\neditor = Editor()\nhistory = []   # el caretaker: apila sin mirar adentro\n\neditor.type("hola")\nhistory.append(editor.save())\neditor.type(" mundo")\nprint(editor.content)  # => hola mundo\n\neditor.restore(history.pop())\nprint(editor.content)  # => hola',
        rb: 'Memento = Struct.new(:state)   # el caretaker lo guarda pero no lo edita\n# (en Ruby >= 3.2 usarías Data.define(:state), inmutable de fábrica)\n\nclass Editor\n  def initialize = @text = ""\n  def type(t) = @text += t\n  def content = @text\n  def save = Memento.new(@text).freeze   # captura sin exponer internos, y sella\n  def restore(memento) = @text = memento.state\nend\n\neditor = Editor.new\nhistory = []   # el caretaker: apila sin mirar adentro\n\neditor.type("hola")\nhistory << editor.save\neditor.type(" mundo")\nputs editor.content  # => hola mundo\n\neditor.restore(history.pop)\nputs editor.content  # => hola',
        go: 'package main\n\nimport "fmt"\n\n// El campo no exportado sella el estado: solo este package lo lee.\ntype Memento struct{ state string }\n\ntype Editor struct{ text string }\n\nfunc (e *Editor) Type(t string)     { e.text += t }\nfunc (e *Editor) Content() string   { return e.text }\nfunc (e *Editor) Save() Memento     { return Memento{e.text} } // captura sin exponer\nfunc (e *Editor) Restore(m Memento) { e.text = m.state }\n\nfunc main() {\n    editor := &Editor{}\n    history := []Memento{}   // el caretaker: apila sin mirar adentro\n\n    editor.Type("hola")\n    history = append(history, editor.Save())\n    editor.Type(" mundo")\n    fmt.Println(editor.Content()) // => hola mundo\n\n    editor.Restore(history[len(history)-1])\n    fmt.Println(editor.Content()) // => hola\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
    {
      id: 'observer',
      no: '18',
      name: 'Observer',
      freq: 'star',
      primary: 'en-accion',
      intent:
        'Una dependencia uno-a-muchos: cuando un objeto cambia, sus dependientes se notifican solos (pub/sub).',
      star: 'El sujeto — mantiene la lista de suscriptores y dispara el fan-out al cambiar.',
      smell:
        'Objetos que necesitan reaccionar a los cambios de otro sin acoplarse ni hacer polling.',
      realWorld:
        'Listeners de eventos, data-binding de UI, actualizaciones modelo→vista (websockets), estado reactivo, webhooks.',
      whenNot:
        'Cuidado con cascadas de notificaciones difíciles de depurar (A notifica a B que notifica a C…).',
      relatives:
        'vs Mediator (Mediator centraliza interacción bidireccional; Observer es difusión uno-a-muchos).',
      paradigm:
        'A menudo lo reemplazan los eventos del lenguaje o librerías reactivas (RxJS, signals).',
      diagram: {
        vb: [820, 360],
        nodes: [
          {
            id: 'subject',
            x: 50,
            y: 138,
            w: 190,
            h: 90,
            role: 'estrella',
            label: 'Subject',
            sub: 'subscribe()\nnotify()',
          },
          {
            id: 'o1',
            x: 520,
            y: 30,
            w: 170,
            h: 64,
            role: 'impl',
            label: 'EmailObserver',
          },
          {
            id: 'o2',
            x: 520,
            y: 148,
            w: 170,
            h: 64,
            role: 'impl',
            label: 'SmsObserver',
          },
          {
            id: 'o3',
            x: 520,
            y: 266,
            w: 170,
            h: 64,
            role: 'impl',
            label: 'LogObserver',
          },
        ],
        edges: [
          {
            from: 'subject',
            to: 'o1',
            type: 'uses',
            label: 'notify()',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'subject',
            to: 'o2',
            type: 'uses',
            label: 'notify()',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'subject',
            to: 'o3',
            type: 'uses',
            label: 'notify()',
            fromSide: 'right',
            toSide: 'left',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Polling / acoplamiento directo',
          code: 'setInterval(() => {                  // polling\n  if (stock.price !== last) view.update(stock.price);\n}, 100);\n// o stock llama directo a view (acoplado)',
          pain: [0, 1, 3],
        },
        after: {
          label: 'Suscripción',
          code: 'stock.subscribe(price => view.update(price));\nstock.subscribe(price => log.write(price));\nstock.price = 42;  // notifica a todos, en abanico',
          good: [0, 1, 2],
        },
        why: [
          'Los suscriptores reaccionan al cambio sin hacer polling.',
          'El sujeto no conoce a sus observadores en concreto.',
          'Sumar un suscriptor no toca al sujeto ni a los demás.',
        ],
      },
      action: {
        caption:
          'Un cambio en el sujeto se abre en abanico hacia todos los suscriptores.',
        steps: [
          {
            from: 'subject',
            to: 'o1',
            label: 'update(state)',
            note: 'El sujeto cambia y notifica al primer suscriptor.',
          },
          {
            from: 'subject',
            to: 'o2',
            label: 'update(state)',
            note: 'La misma notificación se abre en abanico al segundo…',
          },
          {
            from: 'subject',
            to: 'o3',
            label: 'update(state)',
            note: '…y al tercero. Ninguno hace polling; reaccionan solos.',
          },
        ],
      },
      code: {
        ts: 'interface Observer { update(event: string): void }\n\nclass EmailObserver implements Observer {\n  update(event: string) { console.log(`email: ${event}`); }\n}\nclass SmsObserver implements Observer {\n  update(event: string) { console.log(`sms: ${event}`); }\n}\n\n// el subject mantiene la lista y hace el fan-out solo\nclass Subject {\n  private subscribers: Observer[] = [];\n  subscribe(o: Observer) { this.subscribers.push(o); }\n  notify(event: string) {\n    // avisa sin saber (ni importarle) quién escucha\n    for (const o of this.subscribers) o.update(event);\n  }\n}\n\nconst shipments = new Subject();\nshipments.subscribe(new EmailObserver());\nshipments.subscribe(new SmsObserver());\n\nshipments.notify("pedido enviado");\n// => email: pedido enviado\n// => sms: pedido enviado',
        py: 'class Subject:\n    # el subject mantiene la lista y hace el fan-out solo\n    def __init__(self): self._subscribers = []\n\n    def subscribe(self, callback): self._subscribers.append(callback)\n\n    def notify(self, event):\n        # avisa sin saber (ni importarle) quién escucha\n        for callback in self._subscribers:\n            callback(event)\n\n# en Python cualquier callable sirve de observer\ndef email_observer(event): print(f"email: {event}")\ndef sms_observer(event): print(f"sms: {event}")\n\nshipments = Subject()\nshipments.subscribe(email_observer)\nshipments.subscribe(sms_observer)\n\nshipments.notify("pedido enviado")\n# => email: pedido enviado\n# => sms: pedido enviado',
        rb: 'require "observer"\n\nclass Shipments\n  include Observable   # el subject lleva la lista de suscriptores\n\n  def dispatch(order)\n    changed                   # marca que hubo cambio...\n    notify_observers(order)   # ...y hace el fan-out solo\n  end\nend\n\nclass EmailObserver\n  def update(event) = puts("email: #{event}")\nend\n\nclass SmsObserver\n  def update(event) = puts("sms: #{event}")\nend\n\nshipments = Shipments.new\nshipments.add_observer(EmailObserver.new)\nshipments.add_observer(SmsObserver.new)\n\nshipments.dispatch("pedido enviado")\n# => email: pedido enviado\n# => sms: pedido enviado',
        go: 'package main\n\nimport "fmt"\n\n// En Go el observer natural es una función.\ntype Observer func(event string)\n\n// El subject mantiene la lista y hace el fan-out solo.\ntype Subject struct{ subscribers []Observer }\n\nfunc (s *Subject) Subscribe(o Observer) { s.subscribers = append(s.subscribers, o) }\n\nfunc (s *Subject) Notify(event string) {\n    // avisa sin saber (ni importarle) quién escucha\n    for _, o := range s.subscribers {\n        o(event)\n    }\n}\n\nfunc main() {\n    shipments := &Subject{}\n    shipments.Subscribe(func(e string) { fmt.Println("email: " + e) })\n    shipments.Subscribe(func(e string) { fmt.Println("sms: " + e) })\n\n    shipments.Notify("pedido enviado")\n    // => email: pedido enviado\n    // => sms: pedido enviado\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
    {
      id: 'state',
      no: '19',
      name: 'State',
      freq: 'half',
      primary: 'antes-despues',
      intent:
        'Permitir que un objeto cambie su comportamiento cuando cambia su estado interno (parece cambiar de clase).',
      star: 'El objeto-estado — encapsula el comportamiento de un estado y sus transiciones.',
      smell:
        'Condicionales gigantes sobre una variable de estado, repartidos por toda la clase.',
      realWorld:
        'El ciclo de vida de un pedido (borrador→pagado→despachado), un flujo de documento, un reproductor (reproduciendo/pausado/detenido), los estados de una conexión TCP.',
      whenNot:
        'Para dos estados simples, un booleano basta; la máquina de estados solo paga con varios estados y transiciones.',
      relatives:
        'vs Strategy — MISMA estructura, intención distinta: en State los objetos DISPARAN sus transiciones; en Strategy los eligen desde afuera. (Desambiguación clave.)',
      paradigm:
        'En lenguajes con uniones/enum + pattern matching, una máquina de estados se expresa sin jerarquía de clases.',
      diagram: {
        vb: [820, 360],
        nodes: [
          {
            id: 'context',
            x: 40,
            y: 150,
            w: 160,
            h: 84,
            role: 'cliente',
            label: 'Order',
            sub: '- state\n+ pay() / ship()',
          },
          {
            id: 'state',
            x: 300,
            y: 40,
            w: 180,
            h: 72,
            role: 'estrella',
            label: 'State',
            sub: '+ handle(evt)',
          },
          {
            id: 's1',
            x: 270,
            y: 240,
            w: 140,
            h: 66,
            role: 'impl',
            label: 'Draft',
          },
          {
            id: 's2',
            x: 430,
            y: 240,
            w: 140,
            h: 66,
            role: 'impl',
            label: 'Paid',
          },
          {
            id: 's3',
            x: 590,
            y: 240,
            w: 140,
            h: 66,
            role: 'impl',
            label: 'Shipped',
          },
        ],
        edges: [
          {
            from: 'context',
            to: 'state',
            type: 'uses',
            label: 'delega',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 's1',
            to: 'state',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 's2',
            to: 'state',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 's3',
            to: 'state',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 's1',
            to: 's2',
            type: 'uses',
            label: '«pay»',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 's2',
            to: 's3',
            type: 'uses',
            label: '«ship»',
            fromSide: 'right',
            toSide: 'left',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'switch gigante repartido',
          code: 'function pay(order) {\n  switch (order.status) {            // y este switch se repite\n    case "draft":  order.status = "paid"; break;\n    case "paid":   throw "ya pagado";\n    case "shipped":throw "ya enviado";\n  }\n}',
          pain: [1, 2, 3, 4],
        },
        after: {
          label: 'Máquina de estados',
          code: 'order.state.pay();   // cada estado conoce sus transiciones\n// Draft.pay() → Paid;  Paid.pay() → error\n// añadir un estado no toca a los demás',
          good: [0],
        },
        why: [
          'Cada estado es una clase con su propio comportamiento.',
          'Las transiciones válidas viven en el estado, no en switches sueltos.',
          'Añadir un estado no obliga a tocar los condicionales de toda la clase.',
        ],
      },
      action: {
        caption:
          'El objeto delega en su estado actual, que decide la transición.',
        steps: [
          {
            from: 'context',
            to: 's1',
            label: 'state.handle()',
            note: 'El pedido delega el comportamiento en su estado actual (Draft).',
          },
          {
            from: 's1',
            to: 's2',
            label: 'evento: pagar',
            note: 'El estado decide la transición válida: Draft → Paid.',
          },
          {
            from: 's2',
            to: 's3',
            label: 'evento: despachar',
            note: 'Cada estado conoce sus transiciones y las dispara: Paid → Shipped.',
          },
        ],
      },
      code: {
        ts: 'interface State {\n  pay(order: Order): string;\n  ship(order: Order): string;\n}\n\nclass Draft implements State {\n  pay(order: Order) { order.state = new Paid(); return "pagada"; }   // el estado decide la transición\n  ship(_: Order) { return "no puedes enviar un borrador"; }\n}\nclass Paid implements State {\n  pay(_: Order) { return "ya estaba pagada"; }\n  ship(order: Order) { order.state = new Shipped(); return "enviada"; }\n}\nclass Shipped implements State {\n  pay(_: Order) { return "ya se envió"; }\n  ship(_: Order) { return "ya se envió"; }\n}\n\n// la orden delega: parece cambiar de clase cuando cambia su estado\nclass Order {\n  state: State = new Draft();\n  pay() { return this.state.pay(this); }\n  ship() { return this.state.ship(this); }\n}\n\nconst order = new Order();\nconsole.log(order.ship()); // => no puedes enviar un borrador\nconsole.log(order.pay());  // => pagada\nconsole.log(order.ship()); // => enviada',
        py: 'class Draft:\n    def pay(self, order):\n        order.state = Paid()   # el estado decide la transición\n        return "pagada"\n\n    def ship(self, order): return "no puedes enviar un borrador"\n\nclass Paid:\n    def pay(self, order): return "ya estaba pagada"\n\n    def ship(self, order):\n        order.state = Shipped()\n        return "enviada"\n\nclass Shipped:\n    def pay(self, order): return "ya se envió"\n    def ship(self, order): return "ya se envió"\n\nclass Order:\n    # delega en el estado actual: parece cambiar de clase\n    def __init__(self): self.state = Draft()\n    def pay(self): return self.state.pay(self)\n    def ship(self): return self.state.ship(self)\n\norder = Order()\nprint(order.ship())  # => no puedes enviar un borrador\nprint(order.pay())   # => pagada\nprint(order.ship())  # => enviada',
        rb: 'class Draft\n  def pay(order)\n    order.state = Paid.new   # el estado decide la transición\n    "pagada"\n  end\n\n  def ship(_order) = "no puedes enviar un borrador"\nend\n\nclass Paid\n  def pay(_order) = "ya estaba pagada"\n\n  def ship(order)\n    order.state = Shipped.new\n    "enviada"\n  end\nend\n\nclass Shipped\n  def pay(_order) = "ya se envió"\n  def ship(_order) = "ya se envió"\nend\n\nclass Order\n  attr_accessor :state\n\n  def initialize = @state = Draft.new\n\n  # delega en el estado actual: parece cambiar de clase\n  def pay = state.pay(self)\n  def ship = state.ship(self)\nend\n\norder = Order.new\nputs order.ship  # => no puedes enviar un borrador\nputs order.pay   # => pagada\nputs order.ship  # => enviada',
        go: 'package main\n\nimport "fmt"\n\ntype State interface {\n    Pay(o *Order) string\n    Ship(o *Order) string\n}\n\ntype Draft struct{}\n// el estado decide la transición\nfunc (Draft) Pay(o *Order) string { o.state = Paid{}; return "pagada" }\nfunc (Draft) Ship(*Order) string  { return "no puedes enviar un borrador" }\n\ntype Paid struct{}\nfunc (Paid) Pay(*Order) string    { return "ya estaba pagada" }\nfunc (Paid) Ship(o *Order) string { o.state = Shipped{}; return "enviada" }\n\ntype Shipped struct{}\nfunc (Shipped) Pay(*Order) string  { return "ya se envió" }\nfunc (Shipped) Ship(*Order) string { return "ya se envió" }\n\n// La orden delega: parece cambiar de clase cuando cambia su estado.\ntype Order struct{ state State }\n\nfunc (o *Order) Pay() string  { return o.state.Pay(o) }\nfunc (o *Order) Ship() string { return o.state.Ship(o) }\n\nfunc main() {\n    order := &Order{state: Draft{}}\n    fmt.Println(order.Ship()) // => no puedes enviar un borrador\n    fmt.Println(order.Pay())  // => pagada\n    fmt.Println(order.Ship()) // => enviada\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
    {
      id: 'strategy',
      no: '20',
      name: 'Strategy',
      freq: 'star',
      primary: 'en-accion',
      intent:
        'Definir una familia de algoritmos intercambiables, encapsular cada uno y hacerlos sustituibles.',
      star: 'La estrategia enchufable — el algoritmo que el contexto delega y puede cambiar.',
      smell:
        'Varias maneras de hacer algo elegidas en runtime, resueltas con condicionales.',
      realWorld:
        'Comparadores de ordenamiento, métodos de pago, algoritmos de compresión, planificadores de ruta (auto/caminando/transporte), reglas de precios.',
      whenNot:
        'Para una sola variante o dos triviales, la interfaz extra sobra. En dinámicos, pasar una función suele bastar.',
      relatives:
        'vs State (misma estructura; State dispara transiciones internas), vs Command (acción vs algoritmo), vs Template Method (composición vs herencia).',
      paradigm:
        'En Ruby/Python/JS una estrategia es solo una función/bloque que pasas — a mi forma de verlo, la jerarquía de clases ahí es sobre-diseño.',
      diagram: {
        vb: [820, 340],
        nodes: [
          {
            id: 'context',
            x: 50,
            y: 128,
            w: 180,
            h: 84,
            role: 'cliente',
            label: 'Sorter',
            sub: '- strategy\n+ run()',
          },
          {
            id: 'strategy',
            x: 330,
            y: 40,
            w: 180,
            h: 72,
            role: 'estrella',
            label: 'Strategy',
            sub: '+ sort(data)',
          },
          {
            id: 's1',
            x: 300,
            y: 230,
            w: 150,
            h: 68,
            role: 'impl',
            label: 'QuickSort',
          },
          {
            id: 's2',
            x: 470,
            y: 230,
            w: 150,
            h: 68,
            role: 'impl',
            label: 'MergeSort',
          },
        ],
        edges: [
          {
            from: 'context',
            to: 'strategy',
            type: 'uses',
            label: 'delega',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 's1',
            to: 'strategy',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 's2',
            to: 'strategy',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'switch por algoritmo',
          code: 'function sort(data, algo) {\n  if (algo === "quick") return quickSort(data);\n  else if (algo === "merge") return mergeSort(data);\n}',
          pain: [1, 2],
        },
        after: {
          label: 'Estrategia inyectada',
          code: 'const sorter = new Sorter(new QuickSort()); // enchufas una\nsorter.run(data);\n// otra estrategia = otra clase, sin tocar el contexto',
          good: [0],
        },
        why: [
          'El algoritmo se enchufa en runtime tras una interfaz común.',
          'Añadir una variante no toca al contexto ni a las otras.',
          'Los condicionales por tipo de algoritmo desaparecen.',
        ],
      },
      action: {
        caption:
          'El contexto delega en la estrategia que tenga enchufada en ese momento.',
        steps: [
          {
            from: 'context',
            to: 'strategy',
            label: 'execute(data)',
            note: 'El contexto delega en la estrategia que tenga enchufada ahora.',
          },
          {
            from: 'strategy',
            to: 's1',
            label: 'quickSort()',
            note: 'La estrategia concreta ejecuta SU algoritmo.',
          },
          {
            from: 's1',
            to: 'context',
            label: 'resultado',
            note: 'Cambiar a MergeSort no toca el contexto: solo se enchufa otra estrategia.',
          },
        ],
      },
      code: {
        ts: 'interface Strategy { sort(data: number[]): number[] }\n\nclass QuickSort implements Strategy {\n  sort(data: number[]): number[] {\n    if (data.length <= 1) return data;\n    const [pivot, ...rest] = data;\n    return [...this.sort(rest.filter((n) => n < pivot)), pivot,\n            ...this.sort(rest.filter((n) => n >= pivot))];\n  }\n}\n\nclass MergeSort implements Strategy {\n  sort(data: number[]): number[] {\n    if (data.length <= 1) return data;\n    const left = this.sort(data.slice(0, data.length >> 1));\n    const right = this.sort(data.slice(data.length >> 1));\n    const merged: number[] = [];\n    while (left.length && right.length)\n      merged.push((left[0] <= right[0] ? left : right).shift()!);\n    return [...merged, ...left, ...right];\n  }\n}\n\n// el contexto recibe el algoritmo INYECTADO: cambiarlo no toca al Sorter\nclass Sorter {\n  constructor(private strategy: Strategy) {}\n  run(data: number[]) { return this.strategy.sort(data); }\n}\n\nconsole.log(new Sorter(new QuickSort()).run([3, 1, 2]).join(",")); // => 1,2,3\nconsole.log(new Sorter(new MergeSort()).run([3, 1, 2]).join(",")); // => 1,2,3',
        py: '# en Python la estrategia es simplemente una función que inyectas\ndef quick_sort(data):\n    if len(data) <= 1:\n        return data\n    pivot, *rest = data\n    low = [n for n in rest if n < pivot]\n    high = [n for n in rest if n >= pivot]\n    return quick_sort(low) + [pivot] + quick_sort(high)\n\ndef merge_sort(data):\n    if len(data) <= 1:\n        return data\n    mid = len(data) // 2\n    left, right = merge_sort(data[:mid]), merge_sort(data[mid:])\n    merged = []\n    while left and right:\n        merged.append(left.pop(0) if left[0] <= right[0] else right.pop(0))\n    return merged + left + right\n\nclass Sorter:\n    # el contexto recibe el algoritmo INYECTADO: cambiarlo no lo toca\n    def __init__(self, strategy): self.strategy = strategy\n    def run(self, data): return self.strategy(data)\n\nprint(Sorter(quick_sort).run([3, 1, 2]))  # => [1, 2, 3]\nprint(Sorter(merge_sort).run([3, 1, 2]))  # => [1, 2, 3]',
        rb: '# en Ruby la estrategia entra como lambda (o bloque)\nQUICK_SORT = lambda do |data|\n  next data if data.size <= 1\n  pivot, *rest = data\n  low, high = rest.partition { _1 < pivot }\n  QUICK_SORT.(low) + [pivot] + QUICK_SORT.(high)\nend\n\nMERGE_SORT = lambda do |data|\n  next data if data.size <= 1\n  mid = data.size / 2\n  left, right = MERGE_SORT.(data[...mid]), MERGE_SORT.(data[mid..])\n  merged = []\n  merged << (left.first <= right.first ? left : right).shift while left.any? && right.any?\n  merged + left + right\nend\n\nclass Sorter\n  # el contexto recibe el algoritmo INYECTADO: cambiarlo no lo toca\n  def initialize(strategy) = @strategy = strategy\n  def run(data) = @strategy.call(data)\nend\n\nputs Sorter.new(QUICK_SORT).run([3, 1, 2]).inspect  # => [1, 2, 3]\nputs Sorter.new(MERGE_SORT).run([3, 1, 2]).inspect  # => [1, 2, 3]',
        go: 'package main\n\nimport "fmt"\n\n// La estrategia es un tipo función: se inyecta al contexto.\ntype Strategy func([]int) []int\n\nfunc QuickSort(data []int) []int {\n    if len(data) <= 1 {\n        return data\n    }\n    pivot, rest := data[0], data[1:]\n    var low, high []int\n    for _, n := range rest {\n        if n < pivot {\n            low = append(low, n)\n        } else {\n            high = append(high, n)\n        }\n    }\n    return append(append(QuickSort(low), pivot), QuickSort(high)...)\n}\n\nfunc MergeSort(data []int) []int {\n    if len(data) <= 1 {\n        return data\n    }\n    left, right := MergeSort(data[:len(data)/2]), MergeSort(data[len(data)/2:])\n    merged := []int{}\n    for len(left) > 0 && len(right) > 0 {\n        if left[0] <= right[0] {\n            merged, left = append(merged, left[0]), left[1:]\n        } else {\n            merged, right = append(merged, right[0]), right[1:]\n        }\n    }\n    return append(append(merged, left...), right...)\n}\n\n// El contexto no cambia cuando cambias el algoritmo.\ntype Sorter struct{ sort Strategy }\n\nfunc (s Sorter) Run(data []int) []int { return s.sort(data) }\n\nfunc main() {\n    fmt.Println(Sorter{QuickSort}.Run([]int{3, 1, 2})) // => [1 2 3]\n    fmt.Println(Sorter{MergeSort}.Run([]int{3, 1, 2})) // => [1 2 3]\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
    {
      id: 'template-method',
      no: '21',
      name: 'Template Method',
      freq: 'half',
      primary: 'antes-despues',
      intent:
        'Definir el esqueleto de un algoritmo en un método base y dejar algunos pasos a las subclases.',
      star: 'El método plantilla — fija el orden de los pasos y deja huecos (hooks) sobrescribibles.',
      smell:
        'Varios algoritmos comparten estructura pero difieren en pasos → duplicación.',
      realWorld:
        'Los hook methods de un framework, un pipeline de datos con un paso de parseo sobrescribible, setup/teardown de tests, callbacks del ciclo de vida.',
      whenNot:
        'Si los pasos varían mucho o el orden cambia, la herencia ata demasiado: prefiere Strategy (composición).',
      relatives:
        'vs Strategy — herencia (varía PASOS del esqueleto) vs composición (varía el algoritmo entero).',
      paradigm:
        'En dinámico/funcional pasas los pasos variables como funciones, y converge hacia Strategy.',
      diagram: {
        vb: [780, 370],
        nodes: [
          {
            id: 'client',
            x: 40,
            y: 64,
            w: 130,
            h: 64,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'base',
            x: 250,
            y: 60,
            w: 220,
            h: 100,
            role: 'estrella',
            label: 'DataMiner',
            sub: 'mine() {esqueleto}\nparse · analyze · report',
          },
          {
            id: 'sub1',
            x: 200,
            y: 270,
            w: 180,
            h: 72,
            role: 'impl',
            label: 'PdfMiner',
            sub: 'override parse()',
          },
          {
            id: 'sub2',
            x: 410,
            y: 270,
            w: 180,
            h: 72,
            role: 'impl',
            label: 'CsvMiner',
            sub: 'override parse()',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'base',
            type: 'uses',
            label: 'mine()',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'sub1',
            to: 'base',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'sub2',
            to: 'base',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Algoritmos duplicados',
          code: 'class PdfMiner { mine() { open(); PARSE_PDF(); analyze(); report(); } }\nclass CsvMiner { mine() { open(); PARSE_CSV(); analyze(); report(); } }\n// open / analyze / report idénticos: duplicados',
          pain: [0, 1, 2],
        },
        after: {
          label: 'Esqueleto + hooks',
          code: 'abstract class Miner {\n  mine() { this.open(); this.parse(); this.analyze(); this.report(); }\n  abstract parse(): void;  // solo esto cambia\n}',
          good: [0, 1, 2],
        },
        why: [
          'El esqueleto (orden de pasos) vive una sola vez en la base.',
          'Las subclases solo rellenan el hook que varía (parse).',
          'Cero duplicación de los pasos comunes.',
        ],
      },
      action: {
        caption:
          'El método plantilla fija el orden; la subclase rellena el paso variable.',
        steps: [
          {
            from: 'client',
            to: 'base',
            label: 'mine()',
            note: 'Se llama al método plantilla: el esqueleto del algoritmo.',
          },
          {
            from: 'base',
            to: 'sub1',
            label: 'parse() [hook]',
            note: 'El paso variable lo resuelve la subclase (parse de PDF).',
          },
          {
            from: 'sub1',
            to: 'base',
            label: 'analyze() · report()',
            note: 'Los pasos comunes los aporta la base, sin duplicar.',
          },
        ],
      },
      code: {
        ts: 'abstract class DataMiner {\n  // el método plantilla: fija el ORDEN de los pasos y no se sobreescribe\n  mine(path: string): string {\n    const raw = this.parse(path);     // paso variable (hook)\n    const count = this.analyze(raw);  // paso fijo\n    return this.report(count);        // paso fijo\n  }\n  protected abstract parse(path: string): string[];\n  private analyze(raw: string[]) { return raw.length; }\n  private report(count: number) { return `${count} registros`; }\n}\n\n// las subclases solo llenan el hueco, no tocan el esqueleto\nclass PdfMiner extends DataMiner {\n  protected parse(path: string) { return [`pdf:${path}`, "pagina2"]; }\n}\nclass CsvMiner extends DataMiner {\n  protected parse(path: string) { return `${path},a,b`.split(","); }\n}\n\nconsole.log(new PdfMiner().mine("reporte.pdf")); // => 2 registros\nconsole.log(new CsvMiner().mine("ventas.csv"));  // => 3 registros',
        py: 'class DataMiner:\n    def mine(self, path):\n        # el método plantilla fija el ORDEN; las subclases solo llenan hooks\n        raw = self.parse(path)       # paso variable (hook)\n        count = self.analyze(raw)    # paso fijo\n        return self.report(count)    # paso fijo\n\n    def parse(self, path): raise NotImplementedError\n\n    def analyze(self, raw): return len(raw)\n\n    def report(self, count): return f"{count} registros"\n\n# las subclases solo llenan el hueco, no tocan el esqueleto\nclass PdfMiner(DataMiner):\n    def parse(self, path): return [f"pdf:{path}", "pagina2"]\n\nclass CsvMiner(DataMiner):\n    def parse(self, path): return f"{path},a,b".split(",")\n\nprint(PdfMiner().mine("reporte.pdf"))  # => 2 registros\nprint(CsvMiner().mine("ventas.csv"))   # => 3 registros',
        rb: 'class DataMiner\n  # el método plantilla fija el ORDEN; las subclases solo llenan hooks\n  def mine(path) = report(analyze(parse(path)))\n\n  def parse(path) = raise(NotImplementedError)   # paso variable (hook)\n\n  def analyze(raw) = raw.size                    # paso fijo\n\n  def report(count) = "#{count} registros"       # paso fijo\nend\n\n# las subclases solo llenan el hueco, no tocan el esqueleto\nclass PdfMiner < DataMiner\n  def parse(path) = ["pdf:#{path}", "pagina2"]\nend\n\nclass CsvMiner < DataMiner\n  def parse(path) = "#{path},a,b".split(",")\nend\n\nputs PdfMiner.new.mine("reporte.pdf")  # => 2 registros\nputs CsvMiner.new.mine("ventas.csv")   # => 3 registros',
        go: 'package main\n\nimport (\n    "fmt"\n    "strings"\n)\n\n// Go no tiene herencia: el esqueleto es una función y el paso variable\n// entra como parámetro (aquí Template Method converge a Strategy).\nfunc Mine(path string, parse func(string) []string) string {\n    raw := parse(path)                        // paso variable (hook)\n    count := len(raw)                         // paso fijo\n    return fmt.Sprintf("%d registros", count) // paso fijo\n}\n\nfunc ParsePdf(path string) []string { return []string{"pdf:" + path, "pagina2"} }\nfunc ParseCsv(path string) []string { return strings.Split(path+",a,b", ",") }\n\nfunc main() {\n    fmt.Println(Mine("reporte.pdf", ParsePdf)) // => 2 registros\n    fmt.Println(Mine("ventas.csv", ParseCsv))  // => 3 registros\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
    {
      id: 'visitor',
      no: '22',
      name: 'Visitor',
      freq: 'open',
      primary: 'estructura',
      intent:
        'Separar un algoritmo de la estructura de objetos sobre la que opera; añadir operaciones nuevas sin tocar las clases.',
      star: 'El visitante — reúne una operación nueva para toda la jerarquía en una sola clase.',
      smell:
        'Cada operación nueva te obliga a editar todas las clases de una jerarquía. Todas. Otra vez.',
      realWorld:
        'Recorrer un AST en un compilador (visitante de tipos, de generación de código), exportar un documento (a PDF/HTML), reportes sobre una jerarquía.',
      whenNot:
        'Si la jerarquía cambia seguido, Visitor duele: agregar una clase obliga a tocar todos los visitantes. Avanzado.',
      relatives:
        'Se relaciona con el pattern matching / tipos suma en funcional. El doble despacho es su mecanismo central.',
      paradigm:
        'En lenguajes con pattern matching (tipos suma) un visitante es un simple match por tipo, sin doble despacho.',
      diagram: {
        vb: [860, 400],
        nodes: [
          {
            id: 'client',
            x: 30,
            y: 180,
            w: 120,
            h: 64,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'element',
            x: 300,
            y: 40,
            w: 180,
            h: 72,
            role: 'interfaz',
            label: 'Shape',
            sub: '+ accept(v)',
          },
          {
            id: 'circle',
            x: 250,
            y: 230,
            w: 150,
            h: 68,
            role: 'impl',
            label: 'Circle',
          },
          {
            id: 'square',
            x: 430,
            y: 230,
            w: 150,
            h: 68,
            role: 'impl',
            label: 'Square',
          },
          {
            id: 'visitor',
            x: 640,
            y: 40,
            w: 200,
            h: 84,
            role: 'estrella',
            label: 'Visitor',
            sub: 'visit(Circle)\nvisit(Square)',
          },
          {
            id: 'cVisitor',
            x: 640,
            y: 250,
            w: 200,
            h: 72,
            role: 'impl',
            label: 'AreaVisitor',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'element',
            type: 'uses',
            label: 'accept(v)',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'circle',
            to: 'element',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'square',
            to: 'element',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'cVisitor',
            to: 'visitor',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'element',
            to: 'visitor',
            type: 'uses',
            label: '«doble despacho»',
            fromSide: 'right',
            toSide: 'left',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Operación regada por las clases',
          code: 'class Circle { area() {} export() {} toJson() {} }  // ✗\nclass Square { area() {} export() {} toJson() {} }\n// agregar una operación = editar TODAS las formas',
          pain: [0, 1, 2],
        },
        after: {
          label: 'Operaciones reunidas en visitantes',
          code: 'class AreaVisitor   { visitCircle() {} visitSquare() {} }\nclass ExportVisitor { visitCircle() {} visitSquare() {} }\nshape.accept(new AreaVisitor());  // nueva op sin tocar formas',
          good: [0, 1, 2],
        },
        why: [
          'Cada operación nueva es un visitante nuevo, no un edit en cada clase.',
          'Las formas solo exponen accept(); la lógica vive en el visitante.',
          'El doble despacho elige el método correcto por elemento y por operación.',
        ],
      },
      action: {
        caption:
          'Doble despacho: el elemento elige el método; el visitante, la operación.',
        steps: [
          {
            from: 'client',
            to: 'circle',
            label: 'accept(visitor)',
            note: 'El cliente pasa el visitante al elemento.',
          },
          {
            from: 'circle',
            to: 'visitor',
            label: 'visitor.visit(this)',
            note: 'Primer despacho: el elemento sabe su tipo y llama el método del visitante.',
          },
          {
            from: 'visitor',
            to: 'circle',
            label: 'area()',
            note: 'Segundo despacho: el visitante ejecuta la operación para Circle.',
          },
        ],
      },
      code: {
        ts: 'interface Shape { accept(v: Visitor): number }\n\nclass Circle implements Shape {\n  constructor(public r: number) {}\n  accept(v: Visitor) { return v.visitCircle(this); }   // doble despacho\n}\nclass Square implements Shape {\n  constructor(public side: number) {}\n  accept(v: Visitor) { return v.visitSquare(this); }\n}\n\ninterface Visitor {\n  visitCircle(c: Circle): number;\n  visitSquare(s: Square): number;\n}\n\n// operación nueva sin tocar las formas: solo agregas otro Visitor\nclass AreaVisitor implements Visitor {\n  visitCircle(c: Circle) { return 3.14 * c.r * c.r; }\n  visitSquare(s: Square) { return s.side * s.side; }\n}\n\nconst shapes: Shape[] = [new Circle(2), new Square(3)];\nconst area = new AreaVisitor();\nconsole.log(shapes.map((s) => s.accept(area)).join(" y ")); // => 12.56 y 9',
        py: 'from functools import singledispatch\n\nclass Circle:\n    def __init__(self, r): self.r = r\n\nclass Square:\n    def __init__(self, side): self.side = side\n\n# visitor pythónico: singledispatch despacha por tipo;\n# operación nueva = otra función registrada, sin tocar las clases\n@singledispatch\ndef area(shape):\n    raise TypeError(f"sin visita para {type(shape).__name__}")\n\n@area.register\ndef _(circle: Circle): return 3.14 * circle.r * circle.r\n\n@area.register\ndef _(square: Square): return square.side * square.side\n\nshapes = [Circle(2), Square(3)]\nprint([area(s) for s in shapes])  # => [12.56, 9]',
        rb: 'Circle = Struct.new(:r) do\n  def accept(visitor) = visitor.visit_circle(self)   # doble despacho\nend\n\nSquare = Struct.new(:side) do\n  def accept(visitor) = visitor.visit_square(self)\nend\n\n# operación nueva sin tocar las formas: solo agregas otro visitor\nclass AreaVisitor\n  def visit_circle(circle) = 3.14 * circle.r * circle.r\n  def visit_square(square) = square.side * square.side\nend\n\nshapes = [Circle.new(2), Square.new(3)]\nvisitor = AreaVisitor.new\nputs shapes.map { _1.accept(visitor) }.inspect  # => [12.56, 9]',
        go: 'package main\n\nimport "fmt"\n\ntype Visitor interface {\n    VisitCircle(c Circle) float64\n    VisitSquare(s Square) float64\n}\n\ntype Shape interface{ Accept(v Visitor) float64 }\n\ntype Circle struct{ R float64 }\nfunc (c Circle) Accept(v Visitor) float64 { return v.VisitCircle(c) } // doble despacho\n\ntype Square struct{ Side float64 }\nfunc (s Square) Accept(v Visitor) float64 { return v.VisitSquare(s) }\n\n// Operación nueva sin tocar las formas: solo agregas otro Visitor.\ntype AreaVisitor struct{}\nfunc (AreaVisitor) VisitCircle(c Circle) float64 { return 3.14 * c.R * c.R }\nfunc (AreaVisitor) VisitSquare(s Square) float64 { return s.Side * s.Side }\n\nfunc main() {\n    shapes := []Shape{Circle{2}, Square{3}}\n    visitor := AreaVisitor{}\n    for _, s := range shapes {\n        fmt.Println(s.Accept(visitor))\n    }\n    // => 12.56\n    // => 9\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
    {
      id: 'interpreter',
      no: '23',
      name: 'Interpreter',
      freq: 'open',
      primary: 'estructura',
      intent:
        'Definir una gramática y un intérprete para frases de un pequeño lenguaje.',
      star: 'El nodo de expresión — cada regla de la gramática es una clase que sabe evaluarse.',
      smell:
        'Un problema recurrente que se expresa naturalmente como un mini-lenguaje.',
      realWorld:
        'Motores de reglas/expresiones simples, calculadoras, (conceptualmente) SQL/regex.',
      whenNot:
        'Casi nunca lo escribes a mano: para una gramática real usa un generador de parsers. El más académico de los 23.',
      relatives:
        'Construye un árbol como Composite; lo recorre como Visitor. Para gramáticas reales, usa herramientas de parsing.',
      paradigm:
        'Con pattern matching sobre un árbol (tipos suma), el intérprete es un match recursivo, sin jerarquía de clases.',
      diagram: {
        vb: [820, 400],
        nodes: [
          {
            id: 'client',
            x: 40,
            y: 60,
            w: 120,
            h: 64,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'expr',
            x: 320,
            y: 44,
            w: 180,
            h: 68,
            role: 'interfaz',
            label: 'Expression',
            sub: '+ interpret()',
          },
          {
            id: 'number',
            x: 120,
            y: 230,
            w: 150,
            h: 64,
            role: 'impl',
            label: 'Number',
            sub: 'terminal',
          },
          {
            id: 'plus',
            x: 320,
            y: 230,
            w: 160,
            h: 72,
            role: 'estrella',
            label: 'Add',
            sub: 'left + right',
          },
          {
            id: 'minus',
            x: 520,
            y: 230,
            w: 150,
            h: 72,
            role: 'impl',
            label: 'Sub',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'expr',
            type: 'uses',
            label: 'interpret()',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'number',
            to: 'expr',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'plus',
            to: 'expr',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'minus',
            to: 'expr',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'plus',
            to: 'expr',
            type: 'composition',
            label: '«left / right»',
            fromSide: 'right',
            toSide: 'right',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Parsing ad-hoc con ifs',
          code: 'function evalExpr(s) {\n  if (s.includes("+")) { /* parsea a mano */ }   // frágil\n  else if (s.includes("-")) { /* … */ }\n}',
          pain: [1, 2],
        },
        after: {
          label: 'Gramática como árbol',
          code: 'new Add(new Num(2), new Num(3)).interpret();  // = 5\n// cada regla es una clase de expresión, componible',
          good: [0],
        },
        why: [
          'Cada regla de la gramática es una clase pequeña y componible.',
          'Evaluar es recorrer el árbol recursivamente.',
          'Para lenguajes reales, casi siempre conviene un parser generado.',
        ],
      },
      action: {
        caption:
          'El árbol de expresión se evalúa recursivamente desde la raíz.',
        steps: [
          {
            from: 'client',
            to: 'plus',
            label: 'interpret()',
            note: 'Se evalúa la raíz del árbol de expresión (un Add).',
          },
          {
            from: 'plus',
            to: 'number',
            label: 'interpret() hijos',
            note: 'Cada no-terminal evalúa recursivamente sus subexpresiones.',
          },
          {
            from: 'number',
            to: 'plus',
            label: 'valor',
            note: 'Los terminales devuelven su valor; el nodo combina (suma).',
          },
        ],
      },
      code: {
        ts: 'interface Expr { interpret(): number }\n\n// cada regla de la gramática es un nodo que se interpreta a sí mismo\nclass Num implements Expr {   // terminal\n  constructor(private n: number) {}\n  interpret() { return this.n; }\n}\nclass Add implements Expr {\n  constructor(private left: Expr, private right: Expr) {}\n  interpret() { return this.left.interpret() + this.right.interpret(); }\n}\nclass Sub implements Expr {\n  constructor(private left: Expr, private right: Expr) {}\n  interpret() { return this.left.interpret() - this.right.interpret(); }\n}\n\n// el AST de "(5 - 2) + 4", armado a mano\nconst expr = new Add(new Sub(new Num(5), new Num(2)), new Num(4));\nconsole.log(expr.interpret()); // => 7',
        py: 'from dataclasses import dataclass\n\n# cada regla de la gramática es un nodo que se interpreta a sí mismo\n@dataclass\nclass Num:   # terminal\n    n: int\n    def interpret(self): return self.n\n\n@dataclass\nclass Add:\n    left: object\n    right: object\n    def interpret(self): return self.left.interpret() + self.right.interpret()\n\n@dataclass\nclass Sub:\n    left: object\n    right: object\n    def interpret(self): return self.left.interpret() - self.right.interpret()\n\n# el AST de "(5 - 2) + 4", armado a mano\nexpr = Add(Sub(Num(5), Num(2)), Num(4))\nprint(expr.interpret())  # => 7',
        rb: '# cada regla de la gramática es un nodo que se interpreta a sí mismo\nNum = Struct.new(:n) do\n  def interpret = n   # terminal\nend\n\nAdd = Struct.new(:left, :right) do\n  def interpret = left.interpret + right.interpret\nend\n\nSub = Struct.new(:left, :right) do\n  def interpret = left.interpret - right.interpret\nend\n\n# el AST de "(5 - 2) + 4", armado a mano\nexpr = Add.new(Sub.new(Num.new(5), Num.new(2)), Num.new(4))\nputs expr.interpret  # => 7',
        go: 'package main\n\nimport "fmt"\n\ntype Expr interface{ Interpret() int }\n\n// Cada regla de la gramática es un nodo que se interpreta a sí mismo.\ntype Num struct{ N int }   // terminal\nfunc (n Num) Interpret() int { return n.N }\n\ntype Add struct{ Left, Right Expr }\nfunc (a Add) Interpret() int { return a.Left.Interpret() + a.Right.Interpret() }\n\ntype Sub struct{ Left, Right Expr }\nfunc (s Sub) Interpret() int { return s.Left.Interpret() - s.Right.Interpret() }\n\nfunc main() {\n    // el AST de "(5 - 2) + 4", armado a mano\n    expr := Add{Sub{Num{5}, Num{2}}, Num{4}}\n    fmt.Println(expr.Interpret()) // => 7\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
);
