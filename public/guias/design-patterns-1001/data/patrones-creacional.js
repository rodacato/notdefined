/* ============================================================================
   patrones-creacional.js — los 5 patrones creacionales (01–05)
   ----------------------------------------------------------------------------
   Parte del CONTENIDO del almanaque. Ver data/catalogo.js para la estructura
   completa y cómo agregar un patrón. El orden de carga vive en index.html.
   ========================================================================== */
window.PATRONES.patrones.push(
    {
      id: 'factory-method',
      no: '01',
      name: 'Factory Method',
      freq: 'star',
      primary: 'antes-despues',
      intent:
        'Definir una operación para crear objetos, dejando que las subclases decidan qué clase instanciar.',
      star: 'El método fábrica — la costura donde el «new» se vuelve un punto de extensión.',
      smell:
        'El código está sembrado de new ConcreteX(), atado a clases concretas; agregar un tipo nuevo significa cazar todos esos sitios uno por uno.',
      fowler: 'refactor: Replace Constructor with Factory Method',
      realWorld:
        'Una app de logística que crea Camión o Barco según la subclase; un toolkit de UI que crea el botón propio de cada sistema operativo.',
      whenNot:
        'Si no prevés variación de producto, es sobre-diseño: una jerarquía extra para crear un solo tipo no paga su costo.',
      relatives:
        'Pieza base de Abstract Factory. Suele evolucionar desde un factory simple, y ahí está la confusión: el simple es una función que elige; este es una costura que las subclases sobrescriben.',
      paradigm:
        'En lenguajes dinámicos suele ser solo una función que devuelve el objeto correcto, sin jerarquía de creadores.',
      diagram: {
        vb: [760, 430],
        nodes: [
          {
            id: 'client',
            x: 40,
            y: 182,
            w: 124,
            h: 66,
            role: 'cliente',
            label: 'Client',
            sub: 'usa Button',
          },
          {
            id: 'creator',
            x: 250,
            y: 58,
            w: 184,
            h: 86,
            role: 'estrella',
            label: 'Dialog',
            sub: '+ createButton()',
            tag: 'factory method',
          },
          {
            id: 'cCreator',
            x: 250,
            y: 292,
            w: 184,
            h: 84,
            role: 'impl',
            label: 'WindowsDialog',
            sub: 'override createButton()',
          },
          {
            id: 'product',
            x: 566,
            y: 64,
            w: 150,
            h: 70,
            role: 'interfaz',
            label: 'Button',
            sub: 'interfaz',
          },
          {
            id: 'cProduct',
            x: 566,
            y: 294,
            w: 150,
            h: 70,
            role: 'impl',
            label: 'WindowsButton',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'creator',
            type: 'uses',
            label: 'usa',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'cCreator',
            to: 'creator',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'cProduct',
            to: 'product',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'creator',
            to: 'product',
            type: 'creates',
            label: '«crea»',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'cCreator',
            to: 'cProduct',
            type: 'creates',
            label: '«crea»',
            fromSide: 'right',
            toSide: 'left',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Acoplado a clases concretas',
          code: 'function render(os: string) {\n  let btn;\n  if (os === "win")      btn = new WinButton();\n  else if (os === "mac") btn = new MacButton();\n  else                   btn = new LinuxButton();\n  btn.paint();\n  // + un tipo nuevo  ⇒  tocar TODOS estos sitios\n}',
          pain: [2, 3, 4, 6],
        },
        after: {
          label: 'El new se esconde tras una costura',
          code: 'abstract class Dialog {\n  abstract createButton(): Button;   // costura\n  render() {\n    const btn = this.createButton(); // sin new disperso\n    btn.paint();\n  }\n}\nclass WinDialog extends Dialog {\n  createButton() { return new WinButton(); } // un solo new\n}',
          good: [1, 3, 8],
        },
        why: [
          'El new disperso desaparece tras un método fábrica: una sola costura.',
          'Agregar un producto = agregar una subclase, sin tocar al cliente.',
          'El cliente depende de la interfaz Button, no de clases concretas.',
        ],
      },
      action: {
        caption: 'El cliente pide un producto sin saber su clase concreta.',
        steps: [
          {
            from: 'client',
            to: 'cCreator',
            label: 'render()',
            note: 'El cliente llama una operación del creador. No sabe qué botón se creará.',
          },
          {
            from: 'cCreator',
            to: 'cProduct',
            label: 'createButton()',
            note: 'El factory method, sobrescrito en la subclase, instancia el ConcreteProduct.',
          },
          {
            from: 'cProduct',
            to: 'client',
            label: 'Button',
            note: 'El cliente recibe un Button (la interfaz). Sigue sin conocer la clase concreta.',
          },
        ],
      },
      code: {
        ts: 'interface Button { render(): string }\nclass WindowsButton implements Button { render() { return "[boton Windows]"; } }\nclass MacButton implements Button { render() { return "[boton Mac]"; } }\n\nabstract class Dialog {\n  abstract createButton(): Button;   // el factory method: la costura\n  render() {\n    // el esqueleto usa el producto sin conocer la clase concreta\n    return `Dialog con ${this.createButton().render()}`;\n  }\n}\nclass WindowsDialog extends Dialog {\n  createButton() { return new WindowsButton(); }   // la subclase decide\n}\nclass MacDialog extends Dialog {\n  createButton() { return new MacButton(); }\n}\n\nconsole.log(new WindowsDialog().render()); // => Dialog con [boton Windows]\nconsole.log(new MacDialog().render());     // => Dialog con [boton Mac]',
        py: 'class WindowsButton:\n    def render(self): return "[boton Windows]"\n\nclass MacButton:\n    def render(self): return "[boton Mac]"\n\nclass Dialog:\n    def create_button(self):   # el factory method: la costura\n        raise NotImplementedError\n\n    def render(self):\n        # el esqueleto usa el producto sin conocer la clase concreta\n        return f"Dialog con {self.create_button().render()}"\n\nclass WindowsDialog(Dialog):\n    def create_button(self): return WindowsButton()   # la subclase decide\n\nclass MacDialog(Dialog):\n    def create_button(self): return MacButton()\n\nprint(WindowsDialog().render())  # => Dialog con [boton Windows]\nprint(MacDialog().render())      # => Dialog con [boton Mac]',
        rb: 'class WindowsButton\n  def render = "[boton Windows]"\nend\n\nclass MacButton\n  def render = "[boton Mac]"\nend\n\nclass Dialog\n  # el esqueleto usa el producto sin conocer la clase concreta\n  def render = "Dialog con #{create_button.render}"\nend\n\nclass WindowsDialog < Dialog\n  def create_button = WindowsButton.new   # la subclase decide\nend\n\nclass MacDialog < Dialog\n  def create_button = MacButton.new\nend\n\nputs WindowsDialog.new.render  # => Dialog con [boton Windows]\nputs MacDialog.new.render      # => Dialog con [boton Mac]',
        go: 'package main\n\nimport "fmt"\n\ntype Button interface{ Render() string }\n\ntype WindowsButton struct{}\nfunc (WindowsButton) Render() string { return "[boton Windows]" }\n\ntype MacButton struct{}\nfunc (MacButton) Render() string { return "[boton Mac]" }\n\n// La costura: cada Dialog concreto decide qué Button instanciar.\ntype Dialog interface{ CreateButton() Button }\n\ntype WindowsDialog struct{}\nfunc (WindowsDialog) CreateButton() Button { return WindowsButton{} }\n\ntype MacDialog struct{}\nfunc (MacDialog) CreateButton() Button { return MacButton{} }\n\n// El cliente usa el producto sin conocer la clase concreta.\nfunc Render(d Dialog) string { return "Dialog con " + d.CreateButton().Render() }\n\nfunc main() {\n    fmt.Println(Render(WindowsDialog{})) // => Dialog con [boton Windows]\n    fmt.Println(Render(MacDialog{}))     // => Dialog con [boton Mac]\n}',
      },
      category: 'creacional',
      categoryName: 'Creacional',
      categoryColor: '#A4552E',
    },
    {
      id: 'abstract-factory',
      no: '02',
      name: 'Abstract Factory',
      freq: 'half',
      primary: 'estructura',
      intent:
        'Crear familias de objetos relacionados sin atarse a sus clases concretas, garantizando que combinen entre sí.',
      star: 'La fábrica abstracta — declara la creación de toda una familia coherente.',
      smell:
        'Se mezclan productos incompatibles: un botón de Windows con un checkbox de Mac.',
      realWorld:
        'Kits de UI multiplataforma; juegos de mobiliario que combinan; temas claro/oscuro coherentes.',
      whenNot:
        'Si solo tienes un producto, basta Factory Method (su pieza base). Agregar un producto NUEVO a la familia obliga a tocar todas las fábricas.',
      relatives:
        'Construido sobre varios Factory Method. Vecino de Builder (familia coherente vs. ensamblado paso a paso).',
      paradigm:
        'A menudo un mapa de constructores o un módulo por familia, sin jerarquía de clases.',
      diagram: {
        vb: [820, 470],
        nodes: [
          {
            id: 'client',
            x: 28,
            y: 198,
            w: 124,
            h: 66,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'factory',
            x: 214,
            y: 56,
            w: 196,
            h: 96,
            role: 'estrella',
            label: 'GUIFactory',
            sub: '+ createButton()\n+ createCheckbox()',
            tag: 'familia',
          },
          {
            id: 'winFactory',
            x: 214,
            y: 318,
            w: 196,
            h: 86,
            role: 'impl',
            label: 'WinFactory',
          },
          {
            id: 'button',
            x: 596,
            y: 44,
            w: 150,
            h: 56,
            role: 'interfaz',
            label: 'Button',
          },
          {
            id: 'checkbox',
            x: 596,
            y: 128,
            w: 150,
            h: 56,
            role: 'interfaz',
            label: 'Checkbox',
          },
          {
            id: 'winButton',
            x: 596,
            y: 300,
            w: 150,
            h: 56,
            role: 'impl',
            label: 'WinButton',
          },
          {
            id: 'winCheck',
            x: 596,
            y: 386,
            w: 150,
            h: 56,
            role: 'impl',
            label: 'WinCheckbox',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'factory',
            type: 'uses',
            label: 'usa',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'winFactory',
            to: 'factory',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'winButton',
            to: 'button',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'winCheck',
            to: 'checkbox',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'winFactory',
            to: 'winButton',
            type: 'creates',
            label: '«crea»',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'winFactory',
            to: 'winCheck',
            type: 'creates',
            label: '«crea»',
            fromSide: 'right',
            toSide: 'left',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Familias que se mezclan',
          code: 'const button   = new WinButton();    // Windows\nconst checkbox = new MacCheckbox();  // ¡Mac! incompatible\n// nada impide combinar piezas de distintas familias\nform.add(button, checkbox);',
          pain: [1, 2],
        },
        after: {
          label: 'Una fábrica garantiza la familia',
          code: 'function buildForm(factory: GUIFactory) {\n  const button   = factory.createButton();\n  const checkbox = factory.createCheckbox();\n  form.add(button, checkbox); // misma familia\n}\nbuildForm(new WinFactory()); // todo Windows, garantizado',
          good: [1, 2, 5],
        },
        why: [
          'Una sola fábrica produce piezas que SIEMPRE combinan.',
          'Cambiar de tema o de SO = cambiar la fábrica, en un punto.',
          'El cliente nunca nombra una clase concreta de producto.',
        ],
      },
      action: {
        caption:
          'Una fábrica concreta produce una familia coherente, pieza por pieza.',
        steps: [
          {
            from: 'client',
            to: 'winFactory',
            label: 'createButton()',
            note: 'El cliente pide a la fábrica concreta una pieza de la familia.',
          },
          {
            from: 'winFactory',
            to: 'winButton',
            label: 'new WinButton',
            note: 'La fábrica crea la pieza correcta de SU familia.',
          },
          {
            from: 'client',
            to: 'winFactory',
            label: 'createCheckbox()',
            note: 'Pide la segunda pieza a la MISMA fábrica.',
          },
          {
            from: 'winFactory',
            to: 'winCheck',
            label: 'new WinCheckbox',
            note: 'Garantizado: ambas piezas son Windows y combinan.',
          },
        ],
      },
      code: {
        ts: 'interface Button { paint(): string }\ninterface Checkbox { paint(): string }\nclass WinButton implements Button { paint() { return "boton Win"; } }\nclass WinCheckbox implements Checkbox { paint() { return "checkbox Win"; } }\nclass MacButton implements Button { paint() { return "boton Mac"; } }\nclass MacCheckbox implements Checkbox { paint() { return "checkbox Mac"; } }\n\n// Una fábrica por FAMILIA: garantiza productos que combinan entre sí\ninterface GUIFactory {\n  createButton(): Button;\n  createCheckbox(): Checkbox;\n}\nclass WinFactory implements GUIFactory {\n  createButton() { return new WinButton(); }\n  createCheckbox() { return new WinCheckbox(); }\n}\nclass MacFactory implements GUIFactory {\n  createButton() { return new MacButton(); }\n  createCheckbox() { return new MacCheckbox(); }\n}\n\n// el cliente depende SOLO de la fábrica abstracta\nfunction buildUI(f: GUIFactory) {\n  return `${f.createButton().paint()} + ${f.createCheckbox().paint()}`;\n}\n\nconsole.log(buildUI(new WinFactory())); // => boton Win + checkbox Win\nconsole.log(buildUI(new MacFactory())); // => boton Mac + checkbox Mac',
        py: 'class WinButton:\n    def paint(self): return "boton Win"\n\nclass WinCheckbox:\n    def paint(self): return "checkbox Win"\n\nclass MacButton:\n    def paint(self): return "boton Mac"\n\nclass MacCheckbox:\n    def paint(self): return "checkbox Mac"\n\n# La fábrica de una FAMILIA puede ser un dict de constructores:\n# cambias de familia en UN lugar y los productos siempre combinan\nWIN = {"button": WinButton, "checkbox": WinCheckbox}\nMAC = {"button": MacButton, "checkbox": MacCheckbox}\n\ndef build_ui(family):   # el cliente depende SOLO de la familia abstracta\n    return f"{family[\'button\']().paint()} + {family[\'checkbox\']().paint()}"\n\nprint(build_ui(WIN))  # => boton Win + checkbox Win\nprint(build_ui(MAC))  # => boton Mac + checkbox Mac',
        rb: 'class WinButton\n  def paint = "boton Win"\nend\n\nclass WinCheckbox\n  def paint = "checkbox Win"\nend\n\nclass MacButton\n  def paint = "boton Mac"\nend\n\nclass MacCheckbox\n  def paint = "checkbox Mac"\nend\n\n# Una fábrica por FAMILIA: garantiza productos que combinan entre sí\nclass WinFactory\n  def button   = WinButton.new\n  def checkbox = WinCheckbox.new\nend\n\nclass MacFactory\n  def button   = MacButton.new\n  def checkbox = MacCheckbox.new\nend\n\n# el cliente depende SOLO de la fábrica que le pasen\ndef build_ui(factory)\n  "#{factory.button.paint} + #{factory.checkbox.paint}"\nend\n\nputs build_ui(WinFactory.new)  # => boton Win + checkbox Win\nputs build_ui(MacFactory.new)  # => boton Mac + checkbox Mac',
        go: 'package main\n\nimport "fmt"\n\ntype Button interface{ Paint() string }\ntype Checkbox interface{ Paint() string }\n\ntype WinButton struct{}\nfunc (WinButton) Paint() string { return "boton Win" }\ntype WinCheckbox struct{}\nfunc (WinCheckbox) Paint() string { return "checkbox Win" }\ntype MacButton struct{}\nfunc (MacButton) Paint() string { return "boton Mac" }\ntype MacCheckbox struct{}\nfunc (MacCheckbox) Paint() string { return "checkbox Mac" }\n\n// Una fábrica por FAMILIA: garantiza productos que combinan entre sí.\ntype GUIFactory interface {\n    Button() Button\n    Checkbox() Checkbox\n}\n\ntype WinFactory struct{}\nfunc (WinFactory) Button() Button     { return WinButton{} }\nfunc (WinFactory) Checkbox() Checkbox { return WinCheckbox{} }\n\ntype MacFactory struct{}\nfunc (MacFactory) Button() Button     { return MacButton{} }\nfunc (MacFactory) Checkbox() Checkbox { return MacCheckbox{} }\n\n// El cliente depende SOLO de la fábrica abstracta.\nfunc BuildUI(f GUIFactory) string {\n    return f.Button().Paint() + " + " + f.Checkbox().Paint()\n}\n\nfunc main() {\n    fmt.Println(BuildUI(WinFactory{})) // => boton Win + checkbox Win\n    fmt.Println(BuildUI(MacFactory{})) // => boton Mac + checkbox Mac\n}',
      },
      category: 'creacional',
      categoryName: 'Creacional',
      categoryColor: '#A4552E',
    },
    {
      id: 'builder',
      no: '03',
      name: 'Builder',
      freq: 'star',
      primary: 'antes-despues',
      intent:
        'Construir objetos complejos paso a paso; el mismo proceso permite distintas representaciones.',
      star: 'El builder — acumula partes y entrega el producto ya ensamblado.',
      smell:
        'Constructores telescópicos / listas de parámetros enormes.',
      fowler: 'smell: Long Parameter List',
      realWorld:
        'Armar una petición HTTP, un query builder de SQL, ensamblar una comida o una casa por partes.',
      whenNot:
        'Para creación de un paso, usa Factory: un builder para 2 campos es ceremonia inútil.',
      relatives:
        'vs Factory (paso a paso complejo vs. un disparo). Vecino de Abstract Factory (ensamblado vs. familia).',
      paradigm:
        'Ruby y Python suelen usar argumentos con nombre o un bloque de configuración en vez de un builder.',
      diagram: {
        vb: [760, 400],
        nodes: [
          {
            id: 'director',
            x: 40,
            y: 158,
            w: 156,
            h: 72,
            role: 'cliente',
            label: 'Director',
            sub: 'construct()',
          },
          {
            id: 'builder',
            x: 278,
            y: 48,
            w: 192,
            h: 92,
            role: 'estrella',
            label: 'Builder',
            sub: '+ addPart()\n+ build()',
          },
          {
            id: 'cBuilder',
            x: 278,
            y: 262,
            w: 192,
            h: 88,
            role: 'impl',
            label: 'RequestBuilder',
          },
          {
            id: 'product',
            x: 588,
            y: 150,
            w: 150,
            h: 84,
            role: 'impl',
            label: 'Request',
            sub: 'producto',
          },
        ],
        edges: [
          {
            from: 'director',
            to: 'builder',
            type: 'uses',
            label: 'usa',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'cBuilder',
            to: 'builder',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'cBuilder',
            to: 'product',
            type: 'creates',
            label: '«construye»',
            fromSide: 'right',
            toSide: 'left',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Long Parameter List / telescópico',
          code: 'new Request(\n  "/api/users", "POST", token, null,\n  true, 30, false, retryPolicy, null, "json"\n);  // ¿qué significa cada argumento?\n// o 6 constructores sobrecargados...',
          pain: [1, 2, 3, 4],
        },
        after: {
          label: 'Ensamblado paso a paso, legible',
          code: 'new RequestBuilder("/api/users")\n  .method("POST")\n  .auth(token)\n  .timeout(30)\n  .retries(retryPolicy)\n  .build();   // el objeto se forma por partes',
          good: [1, 2, 5],
        },
        why: [
          'Cada paso tiene nombre: se acabó adivinar el orden de 10 args.',
          'Partes opcionales sin explotar en N constructores.',
          'El mismo proceso puede producir representaciones distintas.',
        ],
      },
      action: {
        caption:
          'Cada llamada agrega una parte; build() entrega el objeto terminado.',
        steps: [
          {
            from: 'director',
            to: 'cBuilder',
            label: 'url()',
            note: 'El director (o el cliente) pide el primer paso de construcción.',
          },
          {
            from: 'director',
            to: 'cBuilder',
            label: 'header() · body()',
            note: 'Cada llamada agrega una parte al producto en curso.',
          },
          {
            from: 'cBuilder',
            to: 'product',
            label: 'build()',
            note: 'Al final, el builder entrega el objeto ya ensamblado.',
          },
        ],
      },
      code: {
        ts: 'class Request {\n  constructor(\n    public method: string, public url: string,\n    public headers: Record<string, string>, public body: string,\n  ) {}\n  describe() {\n    return `${this.method} ${this.url} headers=${Object.keys(this.headers).length} body=${this.body}`;\n  }\n}\n\n// construye paso a paso; build() entrega el objeto ya completo\nclass RequestBuilder {\n  private verb = "GET";\n  private heads: Record<string, string> = {};\n  private payload = "";\n  constructor(private url: string) {}\n  method(verb: string) { this.verb = verb; return this; }\n  header(key: string, value: string) { this.heads[key] = value; return this; }\n  body(payload: string) { this.payload = payload; return this; }\n  build() { return new Request(this.verb, this.url, this.heads, this.payload); }\n}\n\nconst req = new RequestBuilder("/api/users")\n  .method("POST")\n  .header("Auth", "token-123")\n  .body("name=Ana")\n  .build();\nconsole.log(req.describe()); // => POST /api/users headers=1 body=name=Ana',
        py: 'class Request:\n    def __init__(self, method, url, headers, body):\n        self.method, self.url, self.headers, self.body = method, url, headers, body\n\n    def describe(self):\n        return f"{self.method} {self.url} headers={len(self.headers)} body={self.body}"\n\n# Construye paso a paso; build() entrega el objeto ya completo.\n# (para casos simples en Python bastan kwargs; el builder paga con pasos + validación)\nclass RequestBuilder:\n    def __init__(self, url):\n        self.url, self.method, self.headers, self.body = url, "GET", {}, ""\n\n    def with_method(self, method):\n        self.method = method\n        return self\n\n    def with_header(self, key, value):\n        self.headers[key] = value\n        return self\n\n    def with_body(self, body):\n        self.body = body\n        return self\n\n    def build(self):\n        return Request(self.method, self.url, self.headers, self.body)\n\nreq = (RequestBuilder("/api/users")\n       .with_method("POST")\n       .with_header("Auth", "token-123")\n       .with_body("name=Ana")\n       .build())\nprint(req.describe())  # => POST /api/users headers=1 body=name=Ana',
        rb: 'Request = Struct.new(:verb, :url, :headers, :body) do\n  def describe = "#{verb} #{url} headers=#{headers.size} body=#{body}"\nend\n\nclass RequestBuilder\n  # el bloque configura paso a paso; result entrega el objeto completo\n  def self.build(url)\n    builder = new(url)\n    yield builder\n    builder.result\n  end\n\n  def initialize(url)\n    @url, @verb, @headers, @body = url, "GET", {}, ""\n  end\n\n  attr_writer :verb, :body\n  attr_reader :headers\n\n  def result = Request.new(@verb, @url, @headers, @body)\nend\n\nreq = RequestBuilder.build("/api/users") do |r|\n  r.verb = "POST"\n  r.headers["Auth"] = "token-123"\n  r.body = "name=Ana"\nend\nputs req.describe  # => POST /api/users headers=1 body=name=Ana',
        go: 'package main\n\nimport "fmt"\n\ntype Request struct {\n    Method, URL string\n    Headers     map[string]string\n    Body        string\n}\n\nfunc (r Request) Describe() string {\n    return fmt.Sprintf("%s %s headers=%d body=%s", r.Method, r.URL, len(r.Headers), r.Body)\n}\n\n// Construye paso a paso; Build() entrega el objeto ya completo.\ntype RequestBuilder struct{ req Request }\n\nfunc NewRequest(url string) *RequestBuilder {\n    return &RequestBuilder{Request{Method: "GET", URL: url, Headers: map[string]string{}}}\n}\nfunc (b *RequestBuilder) Method(verb string) *RequestBuilder { b.req.Method = verb; return b }\nfunc (b *RequestBuilder) Header(k, v string) *RequestBuilder { b.req.Headers[k] = v; return b }\nfunc (b *RequestBuilder) Body(body string) *RequestBuilder   { b.req.Body = body; return b }\nfunc (b *RequestBuilder) Build() Request                     { return b.req }\n\nfunc main() {\n    req := NewRequest("/api/users").\n        Method("POST").\n        Header("Auth", "token-123").\n        Body("name=Ana").\n        Build()\n    fmt.Println(req.Describe()) // => POST /api/users headers=1 body=name=Ana\n}',
      },
      category: 'creacional',
      categoryName: 'Creacional',
      categoryColor: '#A4552E',
    },
    {
      id: 'prototype',
      no: '04',
      name: 'Prototype',
      freq: 'half',
      primary: 'en-accion',
      intent:
        'Copiar objetos existentes sin acoplarse a sus clases concretas (clonar).',
      star: 'El método clone() — el objeto sabe duplicarse a sí mismo.',
      smell:
        'Crear una copia cuando no conoces la clase concreta, o cuando construir desde cero es caro.',
      realWorld:
        'Duplicar un objeto ya configurado; spawnear entidades repetidas en un juego.',
      whenNot:
        'Sobra cuando construir es barato y las clases son conocidas: un new directo es más claro. Y ojo con copias superficiales vs. profundas: un clone() ingenuo comparte referencias y filtra estado.',
      relatives:
        'Pariente de Factory (crear sin nombrar la clase). Útil cuando hay muchas variantes ya configuradas.',
      paradigm:
        'JS es prototípico de raíz (Object.create / structuredClone); Ruby dup/clone; Python copy.deepcopy.',
      diagram: {
        vb: [720, 380],
        nodes: [
          {
            id: 'client',
            x: 40,
            y: 150,
            w: 144,
            h: 70,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'proto',
            x: 300,
            y: 58,
            w: 184,
            h: 82,
            role: 'estrella',
            label: 'Prototype',
            sub: '+ clone()',
          },
          {
            id: 'cProto',
            x: 300,
            y: 250,
            w: 184,
            h: 82,
            role: 'impl',
            label: 'Shape',
            sub: 'clone(): Shape',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'proto',
            type: 'uses',
            label: 'usa',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'cProto',
            to: 'proto',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'cProto',
            to: 'cProto',
            type: 'creates',
            label: '«clona»',
            self: true,
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Copiar campo por campo, desde afuera',
          code: 'const copy = new Shape();\ncopy.x = original.x;\ncopy.y = original.y;\ncopy.color = original.color;   // rompe encapsulación\ncopy.style = original.style;   // ¿y los campos privados?',
          pain: [1, 2, 3, 4],
        },
        after: {
          label: 'El objeto se clona a sí mismo',
          code: 'const copy = original.clone();\n// clone() conoce sus campos privados y decide\n// copia profunda vs. superficial',
          good: [0],
        },
        why: [
          'El objeto sabe copiarse: respeta su propia encapsulación.',
          'No necesitas conocer la clase concreta para duplicar.',
          'Útil cuando hay muchas variantes ya configuradas que clonar.',
        ],
      },
      action: {
        caption:
          'El objeto se duplica a sí mismo, sin que el cliente conozca su clase.',
        steps: [
          {
            from: 'client',
            to: 'cProto',
            label: 'clone()',
            note: 'El cliente pide una copia, sin saber la clase concreta.',
          },
          {
            from: 'cProto',
            to: 'cProto',
            label: 'copia campos',
            note: 'El objeto se duplica a sí mismo (decide profundo vs. superficial).',
          },
          {
            from: 'cProto',
            to: 'client',
            label: 'nueva copia',
            note: 'Recibe un objeto idéntico, independiente del original.',
          },
        ],
      },
      code: {
        ts: 'class Shape {\n  constructor(public color = "negro", public tags: string[] = []) {}\n  clone(): this {\n    // copia sin conocer la clase concreta (respeta subclases)\n    const copy = Object.create(Object.getPrototypeOf(this));\n    return Object.assign(copy, this, { tags: [...this.tags] });\n  }\n}\nclass Circle extends Shape {\n  constructor(public r = 1) { super(); }\n}\n\nconst original = new Circle(5);\noriginal.tags.push("plantilla");\n\nconst copia = original.clone();   // el cliente clona sin saber que es Circle\ncopia.tags.push("copia");\n\nconsole.log(copia instanceof Circle);   // => true\nconsole.log(copia.r);                   // => 5\nconsole.log(original.tags.join(","));   // => plantilla',
        py: 'import copy\n\nclass Shape:\n    def __init__(self, color, tags):\n        self.color, self.tags = color, tags\n\nclass Circle(Shape):\n    def __init__(self, r, **kwargs):\n        super().__init__(**kwargs)\n        self.r = r\n\noriginal = Circle(r=5, color="rojo", tags=["plantilla"])\n\n# deepcopy clona sin conocer la clase concreta, con todo y anidados\nduplicado = copy.deepcopy(original)\nduplicado.tags.append("copia")\n\nprint(type(duplicado).__name__)  # => Circle\nprint(duplicado.r)               # => 5\nprint(original.tags)             # => [\'plantilla\']',
        rb: 'class Shape\n  attr_accessor :color, :tags\n\n  def initialize(color:, tags:)\n    @color, @tags = color, tags\n  end\nend\n\nclass Circle < Shape\n  attr_accessor :r\n\n  def initialize(r:, **kwargs)\n    super(**kwargs)\n    @r = r\n  end\nend\n\noriginal = Circle.new(r: 5, color: "rojo", tags: ["plantilla"])\n\ncopia = original.dup             # clona sin conocer la clase concreta\ncopia.tags = original.tags.dup   # dup es superficial: lo anidado se duplica a mano\ncopia.tags << "copia"\n# (clone es igual que dup, pero conserva frozen y singleton class)\n\nputs copia.class            # => Circle\nputs copia.r                # => 5\nputs original.tags.inspect  # => ["plantilla"]',
        go: 'package main\n\nimport "fmt"\n\ntype Shape struct {\n    Color string\n    Tags  []string\n}\n\n// Go no tiene clone: copiar el struct copia los valores,\n// pero slices/maps/punteros se comparten — duplícalos a mano.\nfunc (s *Shape) Clone() *Shape {\n    dup := *s\n    dup.Tags = append([]string(nil), s.Tags...)\n    return &dup\n}\n\nfunc main() {\n    original := &Shape{Color: "rojo", Tags: []string{"plantilla"}}\n\n    copia := original.Clone()\n    copia.Tags = append(copia.Tags, "copia")\n\n    fmt.Println(copia.Color)   // => rojo\n    fmt.Println(copia.Tags)    // => [plantilla copia]\n    fmt.Println(original.Tags) // => [plantilla]\n}',
      },
      category: 'creacional',
      categoryName: 'Creacional',
      categoryColor: '#A4552E',
    },
    {
      id: 'singleton',
      no: '05',
      name: 'Singleton',
      freq: 'half',
      warn: true,
      primary: 'estructura',
      intent:
        'Garantizar una única instancia de una clase, con un punto de acceso global a ella.',
      star: 'La instancia única — constructor cerrado + acceso estático compartido.',
      smell:
        'Un recurso que debe ser único (configuración, pool de conexiones) termina instanciado varias veces.',
      fowler: 'smell: Global Data',
      realWorld: 'Configuración global, logger, pool de conexiones.',
      whenNot:
        'Es un global encubierto: esconde dependencias, y el pedo es que lo notas hasta que intentas testear. Casi siempre es mejor crear UNA instancia e inyectarla (DI). Trátalo como patrón con advertencia, no como default.',
      relatives:
        'Suele combinarse (mal) con todo. Su mejor sustituto no es otro patrón, sino la inyección de dependencias.',
      paradigm:
        'Ruby include Singleton o un módulo; Python a nivel de módulo; Go sync.Once + var de paquete.',
      diagram: {
        vb: [720, 380],
        nodes: [
          {
            id: 'a',
            x: 40,
            y: 68,
            w: 150,
            h: 66,
            role: 'cliente',
            label: 'Service A',
          },
          {
            id: 'b',
            x: 40,
            y: 230,
            w: 150,
            h: 66,
            role: 'cliente',
            label: 'Service B',
          },
          {
            id: 'single',
            x: 350,
            y: 126,
            w: 210,
            h: 116,
            role: 'estrella',
            label: 'Config',
            sub: '- instance: static\n+ getInstance()',
            warn: true,
          },
        ],
        edges: [
          {
            from: 'a',
            to: 'single',
            type: 'uses',
            label: 'getInstance()',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'b',
            to: 'single',
            type: 'uses',
            label: 'getInstance()',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'single',
            to: 'single',
            type: 'creates',
            label: '«única»',
            self: true,
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Instancias sueltas, estado divergente',
          code: 'const a = new Config();\nconst b = new Config();   // ¡dos configs distintas!\na.set("theme", "dark");\nb.get("theme");           // undefined',
          pain: [0, 1, 3],
        },
        after: {
          label: 'Una única instancia compartida',
          code: 'const a = Config.get();\nconst b = Config.get();   // a === b\na.set("theme", "dark");\nb.get("theme");           // "dark"\n// ⚠ sigue siendo estado global: mejor inyéctala (DI)',
          good: [0, 1, 3],
        },
        why: [
          'Un único punto de acceso evita estados divergentes.',
          '⚠ A cambio, acopla a un global y dificulta el testeo.',
          'Considera inyectar UNA instancia en vez de exponerla global.',
        ],
      },
      action: {
        caption:
          'Todas las llamadas a getInstance() devuelven el MISMO objeto.',
        steps: [
          {
            from: 'a',
            to: 'single',
            label: 'getInstance()',
            note: 'El primer cliente pide la instancia: se crea una sola vez.',
          },
          {
            from: 'b',
            to: 'single',
            label: 'getInstance()',
            note: 'Otro cliente pide la instancia: recibe exactamente la misma. ⚠ estado compartido.',
          },
        ],
      },
      code: {
        ts: 'class Config {\n  private static instance: Config;\n  theme = "dark";\n  private constructor() {}   // nadie más puede hacer new\n\n  static get(): Config {\n    return (Config.instance ??= new Config());   // se crea UNA sola vez\n  }\n}\n\nconst a = Config.get();\nconst b = Config.get();\nconsole.log(a === b);  // => true\nconsole.log(a.theme);  // => dark\n// ⚠ global encubierto: dificulta tests; mejor inyecta UNA instancia',
        py: 'class Settings:\n    def __init__(self):\n        self.theme = "dark"\n\n# A nivel de módulo: el módulo YA es un singleton.\n# Quien haga `from config import settings` recibe ESTA misma instancia.\nsettings = Settings()\n\ndef service_a(): return settings\ndef service_b(): return settings\n\nprint(service_a() is service_b())  # => True\nprint(service_a().theme)           # => dark\n# ⚠ global encubierto: dificulta tests; mejor inyecta UNA instancia',
        rb: 'require "singleton"\n\nclass Config\n  include Singleton   # esconde new y expone .instance\n  attr_accessor :theme\n\n  def initialize = @theme = "dark"\nend\n\na = Config.instance\nb = Config.instance\nputs a.equal?(b)  # => true\nputs a.theme      # => dark\n# ⚠ global encubierto: dificulta tests; mejor inyecta UNA instancia',
        go: 'package main\n\nimport (\n    "fmt"\n    "sync"\n)\n\ntype Config struct{ Theme string }\n\nvar (\n    once sync.Once\n    cfg  *Config\n)\n\n// sync.Once garantiza UNA sola inicialización, aun con goroutines.\nfunc Get() *Config {\n    once.Do(func() { cfg = &Config{Theme: "dark"} })\n    return cfg\n}\n\nfunc main() {\n    a, b := Get(), Get()\n    fmt.Println(a == b)  // => true\n    fmt.Println(a.Theme) // => dark\n    // ⚠ global encubierto: dificulta tests; mejor inyecta UNA instancia\n}',
      },
      category: 'creacional',
      categoryName: 'Creacional',
      categoryColor: '#A4552E',
    },
);
