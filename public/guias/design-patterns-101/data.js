/* ============================================================================
   data.js — EL CONTENIDO del almanaque (y solo el contenido)
   ----------------------------------------------------------------------------
   Aquí vive TODO lo editable: patrones, textos, diagramas, código, escenarios.
   La mecánica (render, animaciones, router) está en app.js — no la toques para
   corregir contenido.

   Se expone como un único objeto global: window.PATRONES.

   Estructura:
     .categorias      metadatos de las 3 categorías (nombre, color, blurb)
     .catalogo        la portada: problemas, roles y frecuencia
     .patrones        los 23 patrones (fuente de verdad), ordenados 01..23
     .desambiguacion  6 comparaciones de patrones parecidos

   --------------------------------------------------------------------------
   CÓMO AGREGAR UN PATRÓN NUEVO — copia un objeto de .patrones y ajusta:
     {
       id: "mi-patron",           // slug único (sale en la URL: #/patron/mi-patron)
       no: "24",                  // número de orden
       name: "Mi Patrón",
       category: "creacional",    // creacional | estructural | comportamiento
       categoryName: "Creacional",
       categoryColor: "#A4552E",
       freq: "half",              // star (núcleo) | half (medio) | open (cola rara)
       warn: false,               // true = patrón con advertencia (p. ej. Singleton)
       primary: "antes-despues",  // vista inicial: estructura | antes-despues | en-accion
       intent: "…", star: "…", smell: "…",
       realWorld: "…", whenNot: "…", relatives: "…", paradigm: "…",
       diagram: { vb:[ancho,alto], nodes:[…], edges:[…] },  // coords fijas del SVG
       beforeAfter: { before:{…}, after:{…}, why:[…] },
       action: { caption:"…", steps:[{from,to,label,note}, …] },
       code: { ts:"…", py:"…", rb:"…", go:"…" }
     }
   Para que aparezca en la portada, su id ya queda incluido por su categoría.
   Si quieres que un problema lo ilumine, agrega su id al array "hits" del
   problema correspondiente en .catalogo.problems.
   ============================================================================ */

window.PATRONES = {
  categorias: {
    creacional: {
      key: 'creacional',
      name: 'Creacional',
      blurb:
        'Mecanismos de creación de objetos que aumentan la flexibilidad y desacoplan al cliente de las clases concretas.',
      primaryNote:
        'Vista primaria de la categoría: Antes → Después (cómo cambia la creación).',
      color: '#A4552E',
      varc: '--cat-crea',
    },
    estructural: {
      key: 'estructural',
      name: 'Estructural',
      color: '#2F6A6B',
      count: 7,
      blurb:
        'Cómo ensamblar objetos y clases en estructuras más grandes manteniéndolas flexibles.',
      primaryNote:
        'Vista primaria de la categoría: Estructura (el ensamblaje / el envoltorio).',
      varc: '--cat-estr',
    },
    comportamiento: {
      key: 'comportamiento',
      name: 'De comportamiento',
      color: '#79415F',
      blurb: 'Asignación de responsabilidades y comunicación entre objetos.',
      primaryNote:
        'Vista primaria de la categoría: En acción (el flujo de mensajes en runtime).',
      varc: '--cat-comp',
    },
  },

  catalogo: {
    categories: {
      creacional: {
        name: 'Creacional',
        varc: '--cat-crea',
        desc: 'Cómo nacen los objetos: desacoplar el código del acto de instanciar.',
      },
      estructural: {
        name: 'Estructural',
        varc: '--cat-estr',
        desc: 'Cómo se ensamblan objetos y clases en estructuras más grandes.',
      },
      comportamiento: {
        name: 'De comportamiento',
        varc: '--cat-comp',
        desc: 'Cómo colaboran los objetos y reparten responsabilidades en runtime.',
      },
    },
    problems: [
      {
        id: 'new-acoplados',
        label: 'Demasiados `new` acoplados',
        hits: [
          'factory-method',
          'abstract-factory',
          'builder',
          'prototype',
          'singleton',
        ],
      },
      {
        id: 'condicionales',
        label: 'Explosión de condicionales',
        hits: ['strategy', 'state', 'command', 'visitor', 'factory-method'],
      },
      {
        id: 'subclases',
        label: 'Subclases que se multiplican',
        hits: ['bridge', 'decorator', 'strategy', 'composite'],
      },
      {
        id: 'acoplados',
        label: 'Objetos demasiado acoplados entre sí',
        hits: ['mediator', 'facade', 'observer', 'adapter'],
      },
      {
        id: 'deshacer',
        label: 'Necesito deshacer / rehacer',
        hits: ['command', 'memento'],
      },
      {
        id: 'variar-algoritmo',
        label: 'Variar un algoritmo en runtime',
        hits: ['strategy', 'template-method', 'state'],
      },
      {
        id: 'api-compleja',
        label: 'Una API es demasiado difícil de usar',
        hits: ['facade', 'adapter', 'proxy'],
      },
      {
        id: 'recorrer',
        label: 'Recorrer estructuras sin exponer su interior',
        hits: ['iterator', 'composite', 'visitor'],
      },
    ],
    roles: [
      {
        key: 'cliente',
        label: 'Cliente',
        sub: 'quien usa el patrón',
        varc: '--role-cliente',
        txt: '',
      },
      {
        key: 'interfaz',
        label: 'Interfaz',
        sub: 'el contrato',
        varc: '--role-interfaz',
        txt: '',
      },
      {
        key: 'impl',
        label: 'Implementación',
        sub: 'clase concreta',
        varc: '--role-impl',
        txt: '',
      },
      {
        key: 'estrella',
        label: 'El patrón',
        sub: 'lo que introduce',
        varc: '--role-estrella',
        txt: '',
      },
      {
        key: 'dolor',
        label: 'Dolor',
        sub: 'en el «antes»',
        varc: '--role-dolor',
        txt: '',
        dolor: true,
      },
      {
        key: 'mejora',
        label: 'Mejora',
        sub: 'en el «después»',
        varc: '--role-mejora',
        txt: '✓',
      },
    ],
    freq: {
      glyph: {
        star: '★',
        half: '◐',
        open: '○',
      },
      label: {
        star: 'núcleo cotidiano',
        half: 'uso medio',
        open: 'cola rara',
      },
    },
  },

  patrones: [
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
        'El código está sembrado de new ConcreteX(), atado a clases concretas; agregar un tipo nuevo obliga a tocar muchos sitios.',
      realWorld:
        'Una app de logística que crea Camión o Barco según la subclase; un toolkit de UI que crea el botón propio de cada sistema operativo.',
      whenNot:
        'Si no prevés variación de producto, es sobre-diseño: una jerarquía extra para crear un solo tipo no paga su costo.',
      relatives:
        'Pieza base de Abstract Factory. Suele evolucionar desde un Factory simple; se confunde con él (un disparo vs. costura extensible).',
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
          code: 'function render(os: string) {\n  let btn;\n  if (os === "win")   btn = new WinButton();\n  else if (os==="mac") btn = new MacButton();\n  else                 btn = new LinuxButton();\n  btn.paint();\n  // + un tipo nuevo  ⇒  tocar TODOS estos sitios\n}',
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
        ts: 'abstract class Dialog {\n  abstract createButton(): Button;   // factory method\n  render() {\n    const btn = this.createButton();\n    btn.onClick(() => this.close());\n    return btn.render();\n  }\n}\nclass WindowsDialog extends Dialog {\n  createButton() { return new WindowsButton(); }\n}',
        py: '# A menudo basta una función que elige la clase\ndef make_button(os: str) -> Button:\n    return {\n        "win": WindowsButton,\n        "mac": MacButton,\n    }[os]()',
        rb: 'class Dialog\n  def render = create_button.render   # subclase decide\nend\n\nclass WindowsDialog < Dialog\n  def create_button = WindowsButton.new\nend',
        go: 'type Button interface{ Render() string }\n\n// "factory method" = función que devuelve la interfaz\nfunc NewButton(os string) Button {\n    if os == "win" {\n        return WindowsButton{}\n    }\n    return MacButton{}\n}',
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
        ts: 'interface GUIFactory {\n  createButton(): Button;\n  createCheckbox(): Checkbox;   // familia coherente\n}\nclass WinFactory implements GUIFactory {\n  createButton()   { return new WinButton(); }\n  createCheckbox() { return new WinCheckbox(); }\n}',
        py: '# Un módulo o un dict por familia suele bastar\nWIN = {"button": WinButton, "checkbox": WinCheckbox}\nMAC = {"button": MacButton, "checkbox": MacCheckbox}\n\ndef build_ui(family):\n    return family["button"](), family["checkbox"]()',
        rb: 'class WinFactory\n  def button   = WinButton.new\n  def checkbox = WinCheckbox.new\nend\n\ndef build_ui(factory)\n  [factory.button, factory.checkbox]\nend',
        go: 'type GUIFactory interface {\n    Button() Button\n    Checkbox() Checkbox\n}\ntype WinFactory struct{}\nfunc (WinFactory) Button() Button     { return WinButton{} }\nfunc (WinFactory) Checkbox() Checkbox { return WinCheckbox{} }',
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
        'Constructores telescópicos / listas de parámetros enormes (el smell «Long Parameter List»).',
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
        ts: 'new RequestBuilder("/api/users")\n  .method("POST")\n  .header("Auth", token)\n  .body({ name })\n  .build();   // objeto complejo, paso a paso',
        py: '# Python: argumentos con nombre reemplazan al builder\nRequest(\n    url="/api/users",\n    headers={"Auth": token},\n    body={"name": name},\n)',
        rb: 'Request.build do |r|\n  r.url = "/api/users"\n  r.headers["Auth"] = token\n  r.body = { name: name }\nend',
        go: 'r := NewRequest().\n    URL("/api/users").\n    Header("Auth", token).\n    Body(body).\n    Build()',
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
        'Ojo con copias superficiales vs. profundas: un clone() ingenuo comparte referencias y filtra estado.',
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
        ts: 'class Shape {\n  constructor(public x = 0, public color = "black") {}\n  clone(): Shape {\n    return Object.assign(new Shape(), this);\n  }\n}\nconst copy = base.clone();   // sin conocer la clase concreta',
        py: 'import copy\n\n# Clonado idiomático en Python\nduplicado = copy.deepcopy(original)',
        rb: 'original.dup     # copia superficial\noriginal.clone   # copia + estado congelado (frozen)',
        go: '// Go no tiene clone: copia el struct (valor)\n// y duplica a mano lo que sea puntero/slice\ndup := *original\ndup.Tags = append([]string(nil), original.Tags...)',
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
      realWorld: 'Configuración global, logger, pool de conexiones.',
      whenNot:
        'Es un global encubierto: lastima la testabilidad y esconde dependencias. Casi siempre es mejor crear UNA instancia e inyectarla (DI). Trátalo como patrón con advertencia, no como default.',
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
          code: 'const a = Config.get();\nconst b = Config.get();   // a === b\na.set("theme", "dark");\nb.get("theme");           // "dark"\n// ⚠ pero es estado global: prueba con DI',
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
        ts: 'class Config {\n  private static instance: Config;\n  private constructor() {}\n  static get(): Config {\n    return (Config.instance ??= new Config());\n  }\n}\n// ⚠ global encubierto: prefiere inyectar UNA instancia',
        py: '# A nivel de módulo: el módulo YA es un singleton\n# config.py\nsettings = Settings()   # todos importan la misma instancia',
        rb: 'require "singleton"\n\nclass Config\n  include Singleton\nend\n\nConfig.instance   # siempre la misma',
        go: 'var (\n    once sync.Once\n    cfg  *Config\n)\nfunc Get() *Config {\n    once.Do(func() { cfg = load() })\n    return cfg\n}',
      },
      category: 'creacional',
      categoryName: 'Creacional',
      categoryColor: '#A4552E',
    },
    {
      id: 'adapter',
      no: '06',
      name: 'Adapter',
      freq: 'star',
      primary: 'estructura',
      intent:
        'Hacer que dos interfaces incompatibles trabajen juntas, envolviendo una para traducir sus llamadas.',
      star: 'El adaptador — implementa la interfaz que esperas y traduce hacia la que existe.',
      smell:
        'Una clase que no puedes modificar tiene la interfaz «equivocada» para tu código.',
      realWorld:
        'Un adaptador de enchufe; envolver una API de terceros o legacy a tu interfaz; un adaptador XML→JSON.',
      whenNot:
        'Si controlas ambos lados, mejor arregla la interfaz de raíz. El adaptador es para lo que no puedes tocar.',
      relatives:
        'vs Decorator (Adapter CAMBIA la interfaz; Decorator la mantiene y añade comportamiento); vs Facade (Facade simplifica un subsistema entero).',
      paradigm:
        'Las interfaces implícitas de Go hacen los adaptadores muy livianos; en lenguajes con duck typing a veces basta una función.',
      diagram: {
        vb: [760, 400],
        nodes: [
          {
            id: 'client',
            x: 40,
            y: 158,
            w: 130,
            h: 70,
            role: 'cliente',
            label: 'Client',
            sub: 'espera Target',
          },
          {
            id: 'target',
            x: 262,
            y: 56,
            w: 184,
            h: 78,
            role: 'interfaz',
            label: 'Target',
            sub: '+ request()',
          },
          {
            id: 'adapter',
            x: 262,
            y: 272,
            w: 184,
            h: 84,
            role: 'estrella',
            label: 'Adapter',
            sub: 'request() → traduce',
          },
          {
            id: 'adaptee',
            x: 560,
            y: 272,
            w: 172,
            h: 84,
            role: 'impl',
            label: 'XmlService',
            sub: 'getXml()',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'target',
            type: 'uses',
            label: 'usa',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'adapter',
            to: 'target',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'adapter',
            to: 'adaptee',
            type: 'uses',
            label: '«traduce»',
            fromSide: 'right',
            toSide: 'left',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Interfaz equivocada',
          code: 'const legacy = new XmlService();\nclient.process(legacy);  // espera Target.request()\n// legacy solo tiene getXml(): no encaja',
          pain: [1, 2],
        },
        after: {
          label: 'Un adaptador hace de puente',
          code: 'const adapted = new XmlToJsonAdapter(legacy);\nclient.process(adapted);  // adapted.request() funciona\n// el adaptador traduce getXml() → request()',
          good: [0, 1],
        },
        why: [
          'El adaptador traduce la llamada: el cliente no cambia.',
          'No tocas la clase adaptada (puede ser de terceros).',
          'El cliente depende de Target, no del legacy.',
        ],
      },
      action: {
        caption:
          'El adaptador recibe la llamada esperada y la traduce hacia el adaptado.',
        steps: [
          {
            from: 'client',
            to: 'adapter',
            label: 'request()',
            note: 'El cliente llama la interfaz que espera (Target).',
          },
          {
            from: 'adapter',
            to: 'adaptee',
            label: 'getXml()',
            note: 'El adaptador traduce: invoca el método real del adaptado.',
          },
          {
            from: 'adaptee',
            to: 'client',
            label: 'resultado',
            note: 'La respuesta vuelve traducida al formato que el cliente entiende.',
          },
        ],
      },
      code: {
        ts: 'interface Target { request(): string }\n\nclass XmlToJsonAdapter implements Target {\n  constructor(private legacy: XmlService) {}\n  request() {\n    return toJson(this.legacy.getXml());  // traduce\n  }\n}',
        py: '# Duck typing: a veces basta una función de traducción\ndef request(legacy):\n    return to_json(legacy.get_xml())',
        rb: 'class XmlToJsonAdapter\n  def initialize(legacy) = @legacy = legacy\n  def request = to_json(@legacy.get_xml)\nend',
        go: 'type Target interface{ Request() string }\n\n// Satisface Target envolviendo al legacy\ntype Adapter struct{ legacy *XmlService }\nfunc (a Adapter) Request() string {\n    return toJSON(a.legacy.GetXML())\n}',
      },
      category: 'estructural',
      categoryName: 'Estructural',
      categoryColor: '#2F6A6B',
    },
    {
      id: 'bridge',
      no: '07',
      name: 'Bridge',
      freq: 'open',
      primary: 'antes-despues',
      intent:
        'Separar una abstracción de su implementación para que ambas evolucionen por separado.',
      star: 'El puente — la composición que une dos jerarquías en vez de cruzarlas por herencia.',
      smell:
        'Una jerarquía que se multiplica en producto cartesiano (Figura × Color → CírculoRojo, CuadradoAzul…), explotando en clases.',
      realWorld:
        'Un toolkit gráfico sobre varios SO; un control remoto (abstracción) sobre dispositivos (implementación); figuras × APIs de render.',
      whenNot:
        'Se diseña por adelantado solo cuando prevés variar DOS dimensiones; si no, sobra estructura.',
      relatives:
        'Parecido estructural a Strategy (composición sobre una interfaz), pero Bridge se diseña de antemano para dos ejes.',
      paradigm:
        'En cualquier lenguaje es composición sobre una interfaz; los dinámicos lo hacen sin declarar la interfaz formal.',
      diagram: {
        vb: [824, 452],
        nodes: [
          {
            id: 'client',
            x: 26,
            y: 188,
            w: 120,
            h: 64,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'abstraction',
            x: 196,
            y: 54,
            w: 200,
            h: 88,
            role: 'estrella',
            label: 'RemoteControl',
            sub: '- device: Device\n+ togglePower()',
          },
          {
            id: 'refined',
            x: 196,
            y: 300,
            w: 200,
            h: 78,
            role: 'impl',
            label: 'AdvancedRemote',
          },
          {
            id: 'implementor',
            x: 566,
            y: 54,
            w: 184,
            h: 80,
            role: 'interfaz',
            label: 'Device',
            sub: '+ on() / off()',
          },
          {
            id: 'tv',
            x: 566,
            y: 300,
            w: 120,
            h: 64,
            role: 'impl',
            label: 'TV',
          },
          {
            id: 'radio',
            x: 702,
            y: 300,
            w: 110,
            h: 64,
            role: 'impl',
            label: 'Radio',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'abstraction',
            type: 'uses',
            label: 'usa',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'refined',
            to: 'abstraction',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'abstraction',
            to: 'implementor',
            type: 'composition',
            label: '«puente»',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'tv',
            to: 'implementor',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'radio',
            to: 'implementor',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Producto cartesiano de clases',
          code: 'class RedCircle {}    class BlueCircle {}\nclass RedSquare {}    class BlueSquare {}\nclass RedTriangle {}  class BlueTriangle {}\n// + 1 forma  o  + 1 color  ⇒  explota la jerarquía',
          pain: [0, 1, 2, 3],
        },
        after: {
          label: 'Dos ejes unidos por un puente',
          code: 'class Shape { constructor(protected color: Color) {} }\nclass Circle extends Shape {}    // eje 1: formas\nclass Square extends Shape {}\ninterface Color { apply(): void } // eje 2: colores\nnew Circle(new Red());  // se combinan en runtime',
          good: [0, 3, 4],
        },
        why: [
          'Las dos dimensiones crecen por separado: N + M clases, no N × M.',
          'Forma y color se combinan en runtime por composición.',
          'Añadir un color no toca ninguna forma, y viceversa.',
        ],
      },
      action: {
        caption:
          'La abstracción delega el trabajo concreto en su implementación enlazada.',
        steps: [
          {
            from: 'client',
            to: 'abstraction',
            label: 'togglePower()',
            note: 'El cliente opera la abstracción (el control), sin saber qué dispositivo hay detrás.',
          },
          {
            from: 'abstraction',
            to: 'implementor',
            label: 'device.on()',
            note: 'La abstracción delega en su implementación a través del puente (composición).',
          },
          {
            from: 'implementor',
            to: 'client',
            label: 'ok',
            note: 'El dispositivo concreto ejecuta; ambas jerarquías variaron sin tocarse.',
          },
        ],
      },
      code: {
        ts: 'interface Device { on(): void; off(): void }   // implementación\n\nclass Remote {                                  // abstracción\n  constructor(protected device: Device) {}      // el puente\n  togglePower() { this.device.on(); }\n}\nclass AdvancedRemote extends Remote { mute() {} }',
        py: 'class Remote:                      # abstracción\n    def __init__(self, device):    # composición = puente\n        self.device = device\n    def toggle(self):\n        self.device.on()',
        rb: 'class Remote\n  def initialize(device) = @device = device  # puente\n  def toggle = @device.on\nend',
        go: 'type Device interface{ On(); Off() }\n\ntype Remote struct{ device Device } // puente por composición\nfunc (r Remote) Toggle() { r.device.On() }',
      },
      category: 'estructural',
      categoryName: 'Estructural',
      categoryColor: '#2F6A6B',
    },
    {
      id: 'composite',
      no: '08',
      name: 'Composite',
      freq: 'half',
      primary: 'estructura',
      intent:
        'Componer objetos en árboles y tratar a un objeto individual y a un grupo de forma uniforme.',
      star: 'El compuesto — comparte la interfaz de la hoja y reparte la operación entre sus hijos.',
      smell: 'Código del cliente lleno de «if es hoja… else si es grupo…».',
      realWorld:
        'Sistema de archivos (archivos + carpetas), árboles de componentes de UI, organigramas, menús anidados.',
      whenNot:
        'Si no hay una jerarquía recursiva real, no aplica: forzar el árbol añade indirección inútil.',
      relatives:
        'Pariente recursivo de Decorator (ambos envuelven Components; Decorator añade, Composite agrupa).',
      paradigm:
        'La recursión sobre una interfaz común es natural en todos los lenguajes; los funcionales usan tipos algebraicos (árbol).',
      diagram: {
        vb: [760, 420],
        nodes: [
          {
            id: 'client',
            x: 40,
            y: 176,
            w: 124,
            h: 66,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'component',
            x: 292,
            y: 58,
            w: 176,
            h: 78,
            role: 'interfaz',
            label: 'Node',
            sub: '+ size()',
          },
          {
            id: 'leaf',
            x: 250,
            y: 300,
            w: 160,
            h: 74,
            role: 'impl',
            label: 'File',
            sub: 'size()',
          },
          {
            id: 'composite',
            x: 470,
            y: 300,
            w: 186,
            h: 84,
            role: 'estrella',
            label: 'Folder',
            sub: 'children: Node[]',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'component',
            type: 'uses',
            label: 'usa',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'leaf',
            to: 'component',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'composite',
            to: 'component',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'composite',
            to: 'component',
            type: 'composition',
            label: '«contiene 0..*»',
            fromSide: 'right',
            toSide: 'right',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'if hoja / else rama',
          code: 'function totalSize(node) {\n  if (node.type === "file") return node.bytes;\n  else if (node.type === "folder")\n    return node.items.reduce((s, c) => s + totalSize(c), 0);\n}',
          pain: [1, 2, 3],
        },
        after: {
          label: 'Misma interfaz, sin if',
          code: 'interface Node { size(): number }\n// File.size() y Folder.size() comparten contrato\nfolder.size();  // funciona igual en hoja y en árbol',
          good: [0, 2],
        },
        why: [
          'El cliente llama size() sin preguntar si es hoja o rama.',
          'Los condicionales de tipo desaparecen: el polimorfismo decide.',
          'El árbol crece en profundidad sin tocar al cliente.',
        ],
      },
      action: {
        caption: 'Una sola llamada se propaga recursivamente por el árbol.',
        steps: [
          {
            from: 'client',
            to: 'composite',
            label: 'size()',
            note: 'El cliente pide el tamaño a una carpeta, como si fuera un archivo.',
          },
          {
            from: 'composite',
            to: 'leaf',
            label: 'size()',
            note: 'La carpeta propaga la llamada a cada hijo — misma interfaz.',
          },
          {
            from: 'leaf',
            to: 'composite',
            label: '12 KB',
            note: 'Cada hoja responde su tamaño; la rama los suma.',
          },
          {
            from: 'composite',
            to: 'client',
            label: 'suma total',
            note: 'El cliente recibe el total sin haber recorrido el árbol.',
          },
        ],
      },
      code: {
        ts: 'interface Node { size(): number }\n\nclass File implements Node {\n  size() { return this.bytes; }\n}\nclass Folder implements Node {\n  children: Node[] = [];\n  size() { return this.children.reduce((s, c) => s + c.size(), 0); }\n}',
        py: 'class Folder:\n    def __init__(self): self.children = []\n    def size(self):                    # misma API que File\n        return sum(c.size() for c in self.children)',
        rb: 'class Folder\n  def size = @children.sum(&:size)   # hoja y rama, misma API\nend',
        go: 'type Node interface{ Size() int }\n\ntype Folder struct{ children []Node }\nfunc (f Folder) Size() int {\n    t := 0\n    for _, c := range f.children { t += c.Size() }\n    return t\n}',
      },
      category: 'estructural',
      categoryName: 'Estructural',
      categoryColor: '#2F6A6B',
    },
    {
      id: 'decorator',
      no: '09',
      name: 'Decorator',
      freq: 'star',
      primary: 'en-accion',
      intent:
        'Añadir responsabilidades a un objeto dinámicamente, envolviéndolo en capas.',
      star: 'El envoltorio — comparte la interfaz del objeto, lo guarda dentro y delega añadiendo lo suyo.',
      smell: 'Explosión de subclases para cada combinación de características.',
      realWorld:
        'Streams de I/O (un buffer que envuelve un lector de archivo), middleware, café + condimentos que suman precio, bordes/scroll sobre un widget.',
      whenNot:
        'Muchas capas finas dificultan depurar (¿qué envuelve a qué?). Si el orden no importa y son pocas opciones, basta un flag.',
      relatives:
        'vs Proxy (misma estructura: Proxy CONTROLA acceso, Decorator AÑADE comportamiento); vs Adapter (cambia vs mantiene interfaz); pariente de Composite.',
      paradigm:
        'En funcional es composición de funciones de orden superior; Python tiene azúcar @decorator a nivel de definición.',
      diagram: {
        vb: [824, 420],
        nodes: [
          {
            id: 'client',
            x: 60,
            y: 96,
            w: 150,
            h: 68,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'component',
            x: 300,
            y: 54,
            w: 180,
            h: 76,
            role: 'interfaz',
            label: 'Coffee',
            sub: '+ cost()',
          },
          {
            id: 'concrete',
            x: 70,
            y: 286,
            w: 170,
            h: 76,
            role: 'impl',
            label: 'Espresso',
          },
          {
            id: 'decorator',
            x: 420,
            y: 280,
            w: 204,
            h: 88,
            role: 'estrella',
            label: 'AddOn',
            sub: '- inner: Coffee\n+ cost()',
          },
          {
            id: 'milk',
            x: 684,
            y: 286,
            w: 120,
            h: 76,
            role: 'impl',
            label: 'Milk · Sugar',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'component',
            type: 'uses',
            label: 'usa',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'concrete',
            to: 'component',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'decorator',
            to: 'component',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'milk',
            to: 'decorator',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'decorator',
            to: 'component',
            type: 'composition',
            label: '«envuelve»',
            fromSide: 'left',
            toSide: 'right',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Subclase por combinación',
          code: 'class Coffee {}\nclass CoffeeWithMilk {}\nclass CoffeeWithMilkAndSugar {}\nclass CoffeeWithSugarAndCream {}\n// cada combinación = una subclase nueva (explota)',
          pain: [1, 2, 3],
        },
        after: {
          label: 'Envoltorios apilables',
          code: 'let c: Coffee = new Espresso();\nc = new Milk(c);    // +0.50\nc = new Sugar(c);   // +0.20\nc.cost();  // combinas en runtime, sin subclases',
          good: [1, 2, 3],
        },
        why: [
          'Cada extra es una capa: las combinaciones se apilan, no se enumeran.',
          'Añades o quitas comportamiento en runtime, no en compilación.',
          'Una característica nueva = un decorador nuevo, sin tocar los demás.',
        ],
      },
      action: {
        caption:
          'La llamada baja por las capas y cada una suma lo suyo al volver.',
        steps: [
          {
            from: 'client',
            to: 'milk',
            label: 'cost()',
            note: 'El cliente llama cost() en la capa más externa (Milk).',
          },
          {
            from: 'milk',
            to: 'concrete',
            label: 'inner.cost()',
            note: 'Cada decorador delega hacia adentro antes de añadir lo suyo.',
          },
          {
            from: 'concrete',
            to: 'milk',
            label: '2.00',
            note: 'El componente base (Espresso) devuelve su costo.',
          },
          {
            from: 'milk',
            to: 'client',
            label: '2.50',
            note: 'Al volver, cada capa suma su parte (Milk +0.50).',
          },
        ],
      },
      code: {
        ts: 'interface Coffee { cost(): number }\nclass Espresso implements Coffee { cost() { return 2; } }\n\nclass Milk implements Coffee {\n  constructor(private inner: Coffee) {}      // envuelve\n  cost() { return this.inner.cost() + 0.5; } // delega + añade\n}\nnew Milk(new Sugar(new Espresso())).cost();  // apilable',
        py: '# En Python: funciones de orden superior\ndef with_milk(coffee):\n    return lambda: coffee() + 0.5\n\nwith_milk(with_sugar(espresso))()',
        rb: 'require "delegate"\n\nclass Milk < SimpleDelegator\n  def cost = __getobj__.cost + 0.5   # delega + añade\nend',
        go: 'type Coffee interface{ Cost() float64 }\n\ntype Milk struct{ inner Coffee }       // envuelve\nfunc (m Milk) Cost() float64 {\n    return m.inner.Cost() + 0.5\n}',
      },
      category: 'estructural',
      categoryName: 'Estructural',
      categoryColor: '#2F6A6B',
    },
    {
      id: 'facade',
      no: '10',
      name: 'Facade',
      freq: 'star',
      primary: 'estructura',
      intent: 'Ofrecer una interfaz simple a un subsistema complejo.',
      star: 'La fachada — una sola puerta que coordina la maraña de clases por dentro.',
      smell: 'El cliente se ahoga coordinando muchas clases de un subsistema.',
      realWorld:
        'Un convertirVideo() que esconde una librería multimedia; la fachada de un SDK; una capa de servicios.',
      whenNot:
        'No la conviertas en un dios que todo lo hace. Es una puerta de entrada, no un reemplazo del subsistema.',
      relatives:
        'vs Adapter (Facade simplifica, no traduce uno-a-uno); vs Mediator (Mediator coordina iguales que se hablan, Facade solo expone hacia afuera).',
      paradigm:
        'En cualquier lenguaje suele ser una clase o función fina por encima del subsistema.',
      diagram: {
        vb: [800, 420],
        nodes: [
          {
            id: 'client',
            x: 40,
            y: 178,
            w: 124,
            h: 66,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'facade',
            x: 248,
            y: 168,
            w: 190,
            h: 86,
            role: 'estrella',
            label: 'VideoConverter',
            sub: '+ convert()',
          },
          {
            id: 's1',
            x: 568,
            y: 44,
            w: 184,
            h: 60,
            role: 'impl',
            label: 'CodecFactory',
          },
          {
            id: 's2',
            x: 568,
            y: 134,
            w: 184,
            h: 60,
            role: 'impl',
            label: 'BitrateReader',
          },
          {
            id: 's3',
            x: 568,
            y: 224,
            w: 184,
            h: 60,
            role: 'impl',
            label: 'AudioMixer',
          },
          {
            id: 's4',
            x: 568,
            y: 314,
            w: 184,
            h: 60,
            role: 'impl',
            label: 'VideoFile',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'facade',
            type: 'uses',
            label: 'convert()',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'facade',
            to: 's1',
            type: 'uses',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'facade',
            to: 's2',
            type: 'uses',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'facade',
            to: 's3',
            type: 'uses',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'facade',
            to: 's4',
            type: 'uses',
            fromSide: 'right',
            toSide: 'left',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Cliente cableado al subsistema',
          code: 'const src = new VideoFile(name);\nconst codec = CodecFactory.extract(src);\nconst buf = BitrateReader.read(name, codec);\nconst out = new AudioMixer().fix(buf);  // 4 piezas acopladas',
          pain: [0, 1, 2, 3],
        },
        after: {
          label: 'Solo habla con la fachada',
          code: 'const out = new VideoConverter().convert(name, "mp4");\n// la fachada coordina el subsistema por dentro',
          good: [0],
        },
        why: [
          'El cliente pasa de coordinar 4 clases a llamar 1 método.',
          'El subsistema puede cambiar por dentro sin tocar al cliente.',
          'Reduce el acoplamiento: muchas flechas se vuelven una.',
        ],
      },
      action: {
        caption:
          'La fachada recibe una llamada y orquesta el subsistema por dentro.',
        steps: [
          {
            from: 'client',
            to: 'facade',
            label: 'convert()',
            note: 'El cliente hace una sola llamada simple a la fachada.',
          },
          {
            from: 'facade',
            to: 's1',
            label: 'extract()',
            note: 'La fachada coordina la primera pieza del subsistema.',
          },
          {
            from: 'facade',
            to: 's2',
            label: 'read()',
            note: '…y la siguiente, en el orden correcto.',
          },
          {
            from: 'facade',
            to: 'client',
            label: 'resultado',
            note: 'El cliente recibe el resultado sin haber tocado el subsistema.',
          },
        ],
      },
      code: {
        ts: 'class VideoConverter {                  // fachada\n  convert(file: string, fmt: string) {\n    const src = new VideoFile(file);\n    const codec = CodecFactory.extract(src);\n    const buf = BitrateReader.read(file, codec);\n    return new AudioMixer().fix(buf);     // 4 clases, 1 método\n  }\n}',
        py: 'def convert(file, fmt):        # una función fachada\n    src = VideoFile(file)\n    codec = extract_codec(src)\n    return AudioMixer().fix(read(file, codec))',
        rb: 'class VideoConverter\n  def convert(file, fmt)\n    codec = CodecFactory.extract(VideoFile.new(file))\n    AudioMixer.new.fix(BitrateReader.read(file, codec))\n  end\nend',
        go: 'type Converter struct{}\nfunc (Converter) Convert(file, fmt string) []byte {\n    src := NewVideoFile(file)\n    codec := ExtractCodec(src)\n    return AudioMixer{}.Fix(ReadBitrate(file, codec))\n}',
      },
      category: 'estructural',
      categoryName: 'Estructural',
      categoryColor: '#2F6A6B',
    },
    {
      id: 'flyweight',
      no: '11',
      name: 'Flyweight',
      freq: 'open',
      primary: 'antes-despues',
      intent:
        'Compartir el estado común entre muchísimos objetos para que quepan en memoria: estado intrínseco compartido vs. extrínseco pasado por fuera.',
      star: 'La fábrica de flyweights — devuelve instancias compartidas en vez de crear duplicados.',
      smell: 'Millones de objetos casi idénticos revientan la memoria.',
      realWorld:
        'Los caracteres de un editor (el glifo se comparte, la posición se pasa), partículas o árboles en un juego, marcadores de un mapa.',
      whenNot:
        'Optimización tardía: solo cuando la memoria es el cuello real. Complica el código separando estado intrínseco y extrínseco. Avanzado.',
      relatives:
        'Suele apoyarse en una fábrica (como Factory) para el pool. El estado extrínseco a veces lo gestiona un contexto.',
      paradigm:
        'Memoización / interning idiomático: lru_cache en Python, Hash con bloque por defecto en Ruby, un map de pool en Go.',
      diagram: {
        vb: [800, 420],
        nodes: [
          {
            id: 'client',
            x: 40,
            y: 64,
            w: 120,
            h: 64,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'factory',
            x: 250,
            y: 50,
            w: 196,
            h: 88,
            role: 'estrella',
            label: 'GlyphFactory',
            sub: '- pool: Map\n+ get(char)',
          },
          {
            id: 'flyweight',
            x: 562,
            y: 56,
            w: 188,
            h: 80,
            role: 'impl',
            label: 'Glyph',
            sub: 'intrínseco: forma, font',
          },
          {
            id: 'context',
            x: 250,
            y: 286,
            w: 196,
            h: 80,
            role: 'impl',
            label: 'Character',
            sub: 'extrínseco: x, y',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'factory',
            type: 'uses',
            label: 'get(c)',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'factory',
            to: 'flyweight',
            type: 'creates',
            label: '«comparte»',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'context',
            to: 'flyweight',
            type: 'uses',
            label: 'referencia',
            fromSide: 'right',
            toSide: 'bottom',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Estado completo por objeto',
          code: 'class Tree {\n  constructor(\n    public x: number, public y: number,   // extrínseco\n    public mesh: Mesh, public texture: Tex, // repetido 1M veces\n  ) {}\n}',
          pain: [3],
        },
        after: {
          label: 'Intrínseco compartido, extrínseco fuera',
          code: 'class TreeType {  // flyweight: se comparte\n  constructor(public mesh: Mesh, public tex: Tex) {}\n}\n// 1 TreeType por miles de árboles; la posición se pasa:\nfunction draw(type: TreeType, x: number, y: number) { /* … */ }',
          good: [0, 3, 4],
        },
        meter: {
          before: {
            total: '≈ 2 GB',
            pct: 100,
            label: '1 000 000 × Tree { mesh, texture, x, y }',
          },
          after: {
            total: '≈ 24 MB',
            pct: 9,
            label: '20 TreeType compartidos + 1M posiciones (x, y)',
          },
        },
        why: [
          'El estado pesado (mesh, textura) se guarda una vez y se comparte.',
          'Solo lo que varía (x, y) vive por objeto, o se pasa al dibujar.',
          'La memoria cae de gigabytes a megabytes sin perder objetos.',
        ],
      },
      action: {
        caption:
          'La fábrica devuelve un glifo ya existente en vez de crear otro igual.',
        steps: [
          {
            from: 'client',
            to: 'factory',
            label: "get('a')",
            note: "El cliente pide un glifo para el carácter 'a'.",
          },
          {
            from: 'factory',
            to: 'flyweight',
            label: "pool['a']",
            note: 'La fábrica busca en el pool: si ya existe, no crea nada nuevo.',
          },
          {
            from: 'factory',
            to: 'client',
            label: 'Glyph compartido',
            note: "Devuelve la MISMA instancia que ya usan otros mil caracteres 'a'.",
          },
        ],
      },
      code: {
        ts: 'class GlyphFactory {\n  private pool = new Map<string, Glyph>();\n  get(ch: string): Glyph {                // comparte el intrínseco\n    if (!this.pool.has(ch)) this.pool.set(ch, new Glyph(ch));\n    return this.pool.get(ch)!;\n  }\n}\n// la posición (x, y) se pasa por fuera',
        py: 'from functools import lru_cache\n\n@lru_cache(maxsize=None)        # el pool de flyweights, gratis\ndef glyph(ch: str) -> Glyph:\n    return Glyph(ch)',
        rb: 'GLYPHS = Hash.new { |h, ch| h[ch] = Glyph.new(ch) }  # pool\nGLYPHS["a"]   # comparte la instancia',
        go: 'var pool = map[rune]*Glyph{}\nfunc Get(ch rune) *Glyph {\n    if g, ok := pool[ch]; ok { return g }\n    g := &Glyph{ch}; pool[ch] = g; return g\n}',
      },
      category: 'estructural',
      categoryName: 'Estructural',
      categoryColor: '#2F6A6B',
    },
    {
      id: 'proxy',
      no: '12',
      name: 'Proxy',
      freq: 'half',
      primary: 'estructura',
      intent: 'Poner un sustituto que controla el acceso a otro objeto.',
      star: 'El proxy — comparte la interfaz del sujeto real e intercepta cada llamada.',
      smell:
        'Necesitas controlar el acceso (carga diferida, caché, permisos, logging) sin cambiar el objeto real ni al cliente.',
      realWorld:
        'Carga diferida (las asociaciones lazy de un ORM), proxy de caché, de control de acceso, o un stub remoto (RPC).',
      whenNot:
        'Si no necesitas interceptar, es indirección de más. Demasiados proxies anidados ocultan de dónde sale el comportamiento.',
      relatives:
        'vs Decorator (misma estructura, intención distinta: controlar acceso vs. enriquecer comportamiento).',
      paradigm:
        'Python tiene __getattr__ para proxies dinámicos; Ruby method_missing; Go suele envolver la interfaz a mano.',
      diagram: {
        vb: [800, 420],
        nodes: [
          {
            id: 'client',
            x: 40,
            y: 176,
            w: 124,
            h: 66,
            role: 'cliente',
            label: 'Client',
          },
          {
            id: 'subject',
            x: 286,
            y: 56,
            w: 180,
            h: 78,
            role: 'interfaz',
            label: 'Image',
            sub: '+ display()',
          },
          {
            id: 'proxy',
            x: 286,
            y: 288,
            w: 180,
            h: 84,
            role: 'estrella',
            label: 'ProxyImage',
            sub: '- real: RealImage?',
          },
          {
            id: 'real',
            x: 568,
            y: 288,
            w: 180,
            h: 84,
            role: 'impl',
            label: 'RealImage',
            sub: 'carga del disco',
          },
        ],
        edges: [
          {
            from: 'client',
            to: 'subject',
            type: 'uses',
            label: 'usa',
            fromSide: 'right',
            toSide: 'left',
          },
          {
            from: 'proxy',
            to: 'subject',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'real',
            to: 'subject',
            type: 'implements',
            fromSide: 'top',
            toSide: 'bottom',
          },
          {
            from: 'proxy',
            to: 'real',
            type: 'uses',
            label: '«lazy / caché»',
            fromSide: 'right',
            toSide: 'left',
          },
        ],
      },
      beforeAfter: {
        before: {
          label: 'Carga cara, siempre',
          code: 'const img = new RealImage("8k.raw"); // carga del disco ya\ngallery.add(img);                     // aunque no se muestre',
          pain: [0, 1],
        },
        after: {
          label: 'Un proxy difiere la carga',
          code: 'const img = new ProxyImage("8k.raw"); // barato: no carga aún\ngallery.add(img);\nimg.display();  // recién aquí el proxy carga el real',
          good: [0, 2],
        },
        why: [
          'El proxy intercepta display() y carga solo cuando hace falta.',
          'Mismo interfaz: el cliente no nota que habla con un sustituto.',
          'El objeto real no sabe nada de caché ni permisos.',
        ],
      },
      action: {
        caption:
          'El proxy intercepta: la primera vez reenvía, después responde de caché.',
        steps: [
          {
            from: 'client',
            to: 'proxy',
            label: 'display() · 1ª',
            note: 'Primera llamada: el proxy aún no tiene el objeto real.',
          },
          {
            from: 'proxy',
            to: 'real',
            label: 'load() + display()',
            note: 'El proxy crea y carga el real solo ahora, y le reenvía la llamada.',
          },
          {
            from: 'client',
            to: 'proxy',
            label: 'display() · 2ª',
            note: 'Segunda llamada: el real ya existe en el proxy.',
          },
          {
            from: 'proxy',
            to: 'client',
            label: 'ok (sin reenviar)',
            note: 'El proxy responde directo: ni recarga ni vuelve a crear el real.',
          },
        ],
      },
      code: {
        ts: 'interface Image { display(): void }\n\nclass ProxyImage implements Image {\n  private real?: RealImage;\n  constructor(private file: string) {}\n  display() {                          // carga diferida\n    this.real ??= new RealImage(this.file); // solo la 1ª vez\n    this.real.display();\n  }\n}',
        py: 'class ProxyImage:\n    def __init__(self, file):\n        self.file, self._real = file, None\n    def display(self):\n        if self._real is None:\n            self._real = RealImage(self.file)  # lazy\n        self._real.display()',
        rb: 'class ProxyImage\n  def display\n    @real ||= RealImage.new(@file)   # lazy\n    @real.display\n  end\nend',
        go: 'type ProxyImage struct{ file string; real *RealImage }\nfunc (p *ProxyImage) Display() {\n    if p.real == nil { p.real = NewRealImage(p.file) }\n    p.real.Display()\n}',
      },
      category: 'estructural',
      categoryName: 'Estructural',
      categoryColor: '#2F6A6B',
    },
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
        'Si solo hay un manejador, sobra. Riesgo: una petición puede llegar al final sin que nadie la atienda.',
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
        ts: 'abstract class Handler {\n  next?: Handler;\n  setNext(h: Handler) { this.next = h; return h; }\n  handle(req: Req) { return this.next?.handle(req); }  // pasa\n}\nclass Auth extends Handler {\n  handle(req: Req) {\n    if (!req.token) return "401";   // atiende y detiene\n    return super.handle(req);        // o pasa\n  }\n}',
        py: '# Pipelines: a menudo una lista de funciones\ndef chain(handlers, req):\n    for h in handlers:\n        result = h(req)\n        if result is not None:   # alguien la atendió\n            return result',
        rb: 'class Handler\n  attr_accessor :next\n  def handle(req) = @next&.handle(req)\nend',
        go: 'type Handler interface{ Handle(r Req) string }\n\ntype Auth struct{ next Handler }\nfunc (a Auth) Handle(r Req) string {\n    if r.Token == "" { return "401" }\n    if a.next != nil { return a.next.Handle(r) }\n    return "ok"\n}',
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
        ts: 'interface Command { execute(): void; undo(): void }\n\nclass Paste implements Command {\n  constructor(private doc: Document, private text: string) {}\n  execute() { this.doc.insert(this.text); }\n  undo()    { this.doc.remove(this.text); }\n}\nhistory.run(new Paste(doc, "hola"));  // ejecuta + apila',
        py: '# Una lambda es un Command liviano\nundo_stack.append(lambda: doc.remove(text))\ndoc.insert(text)',
        rb: 'Command = Struct.new(:exec, :undo)\ncmd = Command.new(-> { doc.insert(t) },\n                  -> { doc.remove(t) })\ncmd.exec.call',
        go: 'type Command interface{ Execute(); Undo() }\n\ntype Paste struct{ doc *Document; text string }\nfunc (p Paste) Execute() { p.doc.Insert(p.text) }\nfunc (p Paste) Undo()    { p.doc.Remove(p.text) }',
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
        'Casi nunca lo escribes a mano: tu lenguaje ya lo trae. Hacerlo manual solo para una lista es reinventar la rueda.',
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
        ts: 'interface Iterator<T> { next(): T; hasNext(): boolean }\n\n// Pero en la práctica:\nfor (const item of collection) {  // ya implementado\n  use(item);\n}',
        py: '# Integrado: implementa __iter__ / __next__\nfor item in collection:\n    use(item)\n\n# o un generador:\ndef walk(node):\n    yield node.value\n    for c in node.children: yield from walk(c)',
        rb: 'class Tree\n  include Enumerable          # te da map, select, etc.\n  def each(&blk) = traverse(@root, &blk)\nend\ntree.each { |v| use(v) }',
        go: '// Go 1.23+: iteradores como funciones\nfunc (t *Tree) All() iter.Seq[int] {\n    return func(yield func(int) bool) {\n        t.walk(t.root, yield)\n    }\n}',
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
        ts: 'class ChatRoom {                 // mediador\n  private users: User[] = [];\n  send(from: User, msg: string) {\n    for (const u of this.users)    // todos hablan vía la sala\n      if (u !== from) u.receive(msg);\n  }\n}',
        py: 'class ChatRoom:\n    def __init__(self): self.users = []\n    def send(self, frm, msg):\n        for u in self.users:\n            if u is not frm: u.receive(msg)',
        rb: 'class ChatRoom\n  def send(from:, msg:)\n    @users.reject { _1 == from }.each { _1.receive(msg) }\n  end\nend',
        go: 'type ChatRoom struct{ users []*User }\nfunc (c *ChatRoom) Send(from *User, msg string) {\n    for _, u := range c.users {\n        if u != from { u.Receive(msg) }\n    }\n}',
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
        ts: 'class Editor {\n  private text = "";\n  save(): Memento { return new Memento(this.text); }  // sella\n  restore(m: Memento) { this.text = m.state; }\n}\nhistory.push(editor.save());  // el caretaker no lee el estado',
        py: '# El estado sellado, a menudo un dataclass inmutable\nsnapshot = copy.deepcopy(editor.__dict__)\nhistory.append(snapshot)\neditor.__dict__.update(history.pop())   # restore',
        rb: 'Memento = Data.define(:state)   # inmutable, sellado\nhistory.push(Memento.new(editor.text))\neditor.text = history.pop.state',
        go: 'type Memento struct{ state string }  // campo no exportado\nfunc (e *Editor) Save() Memento { return Memento{e.text} }\nfunc (e *Editor) Restore(m Memento) { e.text = m.state }',
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
        'Listeners de eventos, data-binding de UI, actualizaciones modelo→vista (websockets), estado reactivo, newsletters.',
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
        ts: 'class Subject {\n  private subs: Observer[] = [];\n  subscribe(o: Observer) { this.subs.push(o); }\n  notify(data: Data) {\n    for (const o of this.subs) o.update(data);  // fan-out\n  }\n}',
        py: 'class Subject:\n    def __init__(self): self._subs = []\n    def subscribe(self, fn): self._subs.append(fn)\n    def notify(self, data):\n        for fn in self._subs: fn(data)',
        rb: 'require "observer"\nclass Stock\n  include Observable\n  def price=(p)\n    changed\n    notify_observers(p)\n  end\nend',
        go: 'type Subject struct{ subs []func(Data) }\nfunc (s *Subject) Subscribe(f func(Data)) {\n    s.subs = append(s.subs, f)\n}\nfunc (s *Subject) Notify(d Data) {\n    for _, f := range s.subs { f(d) }\n}',
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
        ts: 'interface State { next(o: Order): State }\nclass Draft implements State {\n  next(o: Order) { return new Paid(); }   // transición\n}\nclass Order {\n  state: State = new Draft();\n  pay() { this.state = this.state.next(this); } // delega\n}',
        py: 'class Draft:\n    def pay(self, order): order.state = Paid()\n\nclass Order:\n    def __init__(self): self.state = Draft()\n    def pay(self): self.state.pay(self)',
        rb: 'class Order\n  def pay = (@state = @state.next)   # el estado decide\nend',
        go: 'type State interface{ Pay(o *Order) State }\ntype Draft struct{}\nfunc (Draft) Pay(o *Order) State { return Paid{} }\nfunc (o *Order) Pay() { o.state = o.state.Pay(o) }',
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
        'En Ruby/Python/JS una estrategia es solo una función/bloque que pasas — la jerarquía de clases suele ser sobre-diseño.',
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
        ts: 'interface Strategy { sort(d: number[]): number[] }\n\nclass Sorter {\n  constructor(private strategy: Strategy) {}   // enchufable\n  run(d: number[]) { return this.strategy.sort(d); }\n}\nnew Sorter(new QuickSort()).run(data);',
        py: '# Una estrategia es solo una función que pasas\ndef sort_with(data, strategy):\n    return strategy(data)\n\nsort_with(data, quicksort)',
        rb: '# Pasa un bloque/lambda como estrategia\ndef sort_with(data, &strategy) = strategy.call(data)\n\nsort_with(data) { |d| quicksort(d) }',
        go: 'type Strategy func([]int) []int\ntype Sorter struct{ sort Strategy }\nfunc (s Sorter) Run(d []int) []int { return s.sort(d) }\n\nSorter{QuickSort}.Run(data)',
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
        ts: 'abstract class DataMiner {\n  mine(path: string) {            // método plantilla\n    const raw = this.parse(path); // ← hook variable\n    const data = this.analyze(raw);   // paso fijo\n    return this.report(data);         // paso fijo\n  }\n  abstract parse(path: string): Raw;\n}\nclass PdfMiner extends DataMiner { parse(p) { /* … */ } }',
        py: 'class DataMiner:\n    def mine(self, path):          # esqueleto fijo\n        raw = self.parse(path)     # hook\n        return self.report(self.analyze(raw))\n    def parse(self, path): raise NotImplementedError',
        rb: 'class DataMiner\n  def mine(path)                 # esqueleto\n    report(analyze(parse(path))) # parse = hook de subclase\n  end\nend',
        go: '// Go no tiene herencia: composición/funciones\nfunc Mine(path string, parse func(string) Raw) Report {\n    return report(analyze(parse(path)))  // converge a Strategy\n}',
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
        'Cada operación nueva te obliga a editar todas las clases de una jerarquía.',
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
        ts: 'interface Shape { accept(v: Visitor): void }\nclass Circle implements Shape {\n  accept(v: Visitor) { v.visitCircle(this); }  // doble despacho\n}\ninterface Visitor { visitCircle(c: Circle): void }\nclass AreaVisitor implements Visitor {\n  visitCircle(c: Circle) { /* área del círculo */ }\n}',
        py: '# A menudo: functools.singledispatch\n@singledispatch\ndef area(shape): ...\n@area.register\ndef _(c: Circle): return 3.14 * c.r ** 2',
        rb: 'def accept(visitor) = visitor.visit(self)\n\n# Ruby suele usar case/in (pattern matching)\ncase shape\nin Circle(r:) then Math::PI * r**2\nend',
        go: 'type Visitor interface{ VisitCircle(Circle); VisitSquare(Square) }\nfunc (c Circle) Accept(v Visitor) { v.VisitCircle(c) }\n// agregar operación = nuevo Visitor, sin tocar las formas',
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
        'Casi siempre conviene un generador de parsers; rara vez se escribe a mano. El más académico de todos.',
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
        ts: 'interface Expr { interpret(): number }\nclass Num implements Expr {\n  constructor(private n: number) {}\n  interpret() { return this.n; }            // terminal\n}\nclass Add implements Expr {\n  constructor(private l: Expr, private r: Expr) {}\n  interpret() { return this.l.interpret() + this.r.interpret(); }\n}',
        py: '# Casi siempre: usa un parser generado, no a mano\ndef interpret(node):\n    if node.kind == "num": return node.value\n    return interpret(node.left) + interpret(node.right)',
        rb: '# Pattern matching expresa bien el intérprete\ndef interpret(node)\n  case node\n  in [:num, n] then n\n  in [:add, l, r] then interpret(l) + interpret(r)\n  end\nend',
        go: 'type Expr interface{ Interpret() int }\ntype Add struct{ l, r Expr }\nfunc (a Add) Interpret() int {\n    return a.l.Interpret() + a.r.Interpret()\n}',
      },
      category: 'comportamiento',
      categoryName: 'De comportamiento',
      categoryColor: '#79415F',
    },
  ],

  desambiguacion: [
    {
      id: 'wrappers',
      title: ['Decorator', 'Proxy', 'Adapter', 'Facade'],
      tagline:
        'Los cuatro envuelven algo. La estructura es casi idéntica — lo que cambia es para qué envuelven.',
      same: 'Client → Envoltorio → Envuelto',
      patterns: [
        {
          id: 'decorator',
          name: 'Decorator',
          cat: 'estructural',
          intent:
            'Mantiene la MISMA interfaz y AÑADE comportamiento. Apilable: cada capa envuelve a la anterior.',
          pick: 'cuando quieres sumar responsabilidades combinables sin tocar la clase.',
          diagram: {
            vb: [540, 210],
            nodes: [
              {
                id: 'c',
                x: 36,
                y: 80,
                w: 96,
                h: 54,
                role: 'cliente',
                label: 'Client',
              },
              {
                id: 'w',
                x: 200,
                y: 66,
                w: 150,
                h: 82,
                role: 'estrella',
                label: 'AddOn',
                sub: 'mismo interfaz',
                hot: true,
              },
              {
                id: 't',
                x: 418,
                y: 80,
                w: 96,
                h: 54,
                role: 'impl',
                label: 'Coffee',
              },
            ],
            edges: [
              {
                from: 'c',
                to: 'w',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'usa',
              },
              {
                from: 'w',
                to: 't',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: '+comportamiento',
                hot: true,
              },
            ],
          },
        },
        {
          id: 'proxy',
          name: 'Proxy',
          cat: 'estructural',
          intent:
            'Mantiene la MISMA interfaz pero CONTROLA el acceso (carga diferida, caché, permisos).',
          pick: 'cuando quieres interceptar el acceso sin cambiar el objeto real ni al cliente.',
          diagram: {
            vb: [540, 210],
            nodes: [
              {
                id: 'c',
                x: 36,
                y: 80,
                w: 96,
                h: 54,
                role: 'cliente',
                label: 'Client',
              },
              {
                id: 'w',
                x: 200,
                y: 66,
                w: 150,
                h: 82,
                role: 'estrella',
                label: 'ProxyImage',
                sub: 'mismo interfaz',
                hot: true,
              },
              {
                id: 't',
                x: 418,
                y: 80,
                w: 96,
                h: 54,
                role: 'impl',
                label: 'RealImage',
              },
            ],
            edges: [
              {
                from: 'c',
                to: 'w',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'usa',
              },
              {
                from: 'w',
                to: 't',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'controla acceso',
                hot: true,
              },
            ],
          },
        },
        {
          id: 'adapter',
          name: 'Adapter',
          cat: 'estructural',
          intent:
            'CAMBIA la interfaz: traduce las llamadas del cliente a las que el objeto real entiende.',
          pick: 'cuando la interfaz que tienes es la «equivocada» y no puedes modificarla.',
          diagram: {
            vb: [540, 210],
            nodes: [
              {
                id: 'c',
                x: 36,
                y: 80,
                w: 96,
                h: 54,
                role: 'cliente',
                label: 'Client',
              },
              {
                id: 'w',
                x: 200,
                y: 66,
                w: 150,
                h: 82,
                role: 'estrella',
                label: 'Adapter',
                sub: 'traduce',
                hot: true,
              },
              {
                id: 't',
                x: 410,
                y: 80,
                w: 114,
                h: 54,
                role: 'impl',
                label: 'XmlService',
                sub: 'interfaz ≠',
              },
            ],
            edges: [
              {
                from: 'c',
                to: 'w',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'request()',
              },
              {
                from: 'w',
                to: 't',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: '≠ traduce',
                hot: true,
              },
            ],
          },
        },
        {
          id: 'facade',
          name: 'Facade',
          cat: 'estructural',
          intent:
            'SIMPLIFICA un subsistema entero: una puerta única ante muchas clases.',
          pick: 'cuando el cliente se ahoga coordinando muchas piezas de un subsistema.',
          diagram: {
            vb: [540, 210],
            nodes: [
              {
                id: 'c',
                x: 36,
                y: 80,
                w: 96,
                h: 54,
                role: 'cliente',
                label: 'Client',
              },
              {
                id: 'w',
                x: 200,
                y: 66,
                w: 150,
                h: 82,
                role: 'estrella',
                label: 'Facade',
                sub: 'convert()',
                hot: true,
              },
              {
                id: 't',
                x: 408,
                y: 80,
                w: 116,
                h: 54,
                role: 'impl',
                label: 'Subsistema',
                sub: '×N clases',
              },
            ],
            edges: [
              {
                from: 'c',
                to: 'w',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: '1 llamada',
              },
              {
                from: 'w',
                to: 't',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'simplifica ×N',
                hot: true,
              },
            ],
          },
        },
      ],
      scenarios: [
        {
          prompt:
            'Tengo una librería de terceros con la interfaz «equivocada» y no puedo modificarla.',
          answer: 'adapter',
          why: 'Adapter traduce esa interfaz a la que tu código espera, sin tocar la librería.',
        },
        {
          prompt:
            'Quiero cargar una imagen pesada solo cuando se muestre por primera vez.',
          answer: 'proxy',
          why: 'Proxy intercepta el acceso (carga diferida) manteniendo la misma interfaz.',
        },
        {
          prompt:
            'Quiero sumar cifrado y compresión a un stream, en cualquier combinación.',
          answer: 'decorator',
          why: 'Decorator apila capas que añaden comportamiento sobre la misma interfaz.',
        },
        {
          prompt:
            'Quiero esconder una librería multimedia tras un único convertir().',
          answer: 'facade',
          why: 'Facade ofrece una puerta simple a un subsistema complejo.',
        },
      ],
    },
    {
      id: 'strategy-state',
      title: ['Strategy', 'State'],
      tagline:
        'Diagrama idéntico. La diferencia es quién decide el cambio: lo eliges desde afuera, o el propio objeto dispara la transición.',
      same: 'Context → Interfaz ← Concretos',
      patterns: [
        {
          id: 'strategy',
          name: 'Strategy',
          cat: 'comportamiento',
          intent:
            'Algoritmos intercambiables elegidos DESDE AFUERA. Las estrategias no se conocen entre sí.',
          pick: 'cuando quieres enchufar un algoritmo distinto en runtime, decidido por el cliente.',
          diagram: {
            vb: [600, 236],
            nodes: [
              {
                id: 'client',
                x: 28,
                y: 96,
                w: 104,
                h: 52,
                role: 'cliente',
                label: 'Client',
              },
              {
                id: 'ctx',
                x: 170,
                y: 92,
                w: 128,
                h: 60,
                role: 'interfaz',
                label: 'Sorter',
              },
              {
                id: 'if',
                x: 336,
                y: 24,
                w: 142,
                h: 50,
                role: 'estrella',
                label: 'Strategy',
              },
              {
                id: 's1',
                x: 316,
                y: 160,
                w: 120,
                h: 52,
                role: 'impl',
                label: 'QuickSort',
              },
              {
                id: 's2',
                x: 454,
                y: 160,
                w: 120,
                h: 52,
                role: 'impl',
                label: 'MergeSort',
              },
            ],
            edges: [
              {
                from: 'client',
                to: 'ctx',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'elige',
                hot: true,
              },
              {
                from: 'ctx',
                to: 'if',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'delega',
              },
              {
                from: 's1',
                to: 'if',
                type: 'implements',
                fromSide: 'top',
                toSide: 'bottom',
              },
              {
                from: 's2',
                to: 'if',
                type: 'implements',
                fromSide: 'top',
                toSide: 'bottom',
              },
            ],
          },
        },
        {
          id: 'state',
          name: 'State',
          cat: 'comportamiento',
          intent:
            'Comportamiento por estado, con transiciones que el PROPIO objeto dispara. Los estados se conocen.',
          pick: 'cuando un objeto cambia de comportamiento según su estado, con un ciclo de vida.',
          diagram: {
            vb: [600, 236],
            nodes: [
              {
                id: 'client',
                x: 28,
                y: 96,
                w: 104,
                h: 52,
                role: 'cliente',
                label: 'Order',
              },
              {
                id: 'ctx',
                x: 170,
                y: 92,
                w: 128,
                h: 60,
                role: 'interfaz',
                label: 'estado actual',
              },
              {
                id: 'if',
                x: 336,
                y: 24,
                w: 142,
                h: 50,
                role: 'estrella',
                label: 'State',
              },
              {
                id: 's1',
                x: 316,
                y: 160,
                w: 120,
                h: 52,
                role: 'impl',
                label: 'Draft',
              },
              {
                id: 's2',
                x: 454,
                y: 160,
                w: 120,
                h: 52,
                role: 'impl',
                label: 'Paid',
              },
            ],
            edges: [
              {
                from: 'client',
                to: 'ctx',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'usa',
              },
              {
                from: 'ctx',
                to: 'if',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'delega',
              },
              {
                from: 's1',
                to: 'if',
                type: 'implements',
                fromSide: 'top',
                toSide: 'bottom',
              },
              {
                from: 's2',
                to: 'if',
                type: 'implements',
                fromSide: 'top',
                toSide: 'bottom',
              },
              {
                from: 's1',
                to: 's2',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'transición',
                hot: true,
              },
            ],
          },
        },
      ],
      scenarios: [
        {
          prompt:
            'Un pedido pasa por borrador → pagado → despachado, y cada estado responde distinto a las mismas acciones.',
          answer: 'state',
          why: 'State: el objeto cambia de comportamiento con su estado y dispara sus propias transiciones.',
        },
        {
          prompt:
            'Quiero intercambiar el algoritmo de ordenamiento (rápido / estable) en runtime.',
          answer: 'strategy',
          why: 'Strategy: algoritmos intercambiables elegidos desde afuera, sin transiciones internas.',
        },
      ],
    },
    {
      id: 'factories',
      title: ['Factory Method', 'Abstract Factory'],
      tagline:
        'Ambos crean sin nombrar la clase concreta. Uno produce UN producto; el otro, FAMILIAS que combinan.',
      same: 'Creador → Producto(s)',
      patterns: [
        {
          id: 'factory-method',
          name: 'Factory Method',
          cat: 'creacional',
          intent:
            'Un solo producto, cuya clase concreta decide la SUBCLASE creadora.',
          pick: 'cuando un método debe crear un objeto pero deja a la subclase elegir cuál.',
          diagram: {
            vb: [520, 210],
            nodes: [
              {
                id: 'cr',
                x: 48,
                y: 78,
                w: 170,
                h: 80,
                role: 'estrella',
                label: 'Dialog',
                sub: 'createButton()',
                hot: true,
              },
              {
                id: 'p',
                x: 330,
                y: 80,
                w: 140,
                h: 56,
                role: 'interfaz',
                label: 'Button',
              },
            ],
            edges: [
              {
                from: 'cr',
                to: 'p',
                type: 'creates',
                fromSide: 'right',
                toSide: 'left',
                label: 'crea 1',
                hot: true,
              },
            ],
          },
        },
        {
          id: 'abstract-factory',
          name: 'Abstract Factory',
          cat: 'creacional',
          intent:
            'FAMILIAS de productos relacionados que se garantizan compatibles entre sí.',
          pick: 'cuando varios productos deben venir siempre del mismo «juego» (tema, plataforma).',
          diagram: {
            vb: [520, 210],
            nodes: [
              {
                id: 'cr',
                x: 48,
                y: 64,
                w: 170,
                h: 96,
                role: 'estrella',
                label: 'GUIFactory',
                sub: 'createButton()\ncreateCheckbox()',
                hot: true,
              },
              {
                id: 'p1',
                x: 330,
                y: 30,
                w: 140,
                h: 52,
                role: 'interfaz',
                label: 'Button',
              },
              {
                id: 'p2',
                x: 330,
                y: 124,
                w: 140,
                h: 52,
                role: 'interfaz',
                label: 'Checkbox',
              },
            ],
            edges: [
              {
                from: 'cr',
                to: 'p1',
                type: 'creates',
                fromSide: 'right',
                toSide: 'left',
                label: 'crea',
                hot: true,
              },
              {
                from: 'cr',
                to: 'p2',
                type: 'creates',
                fromSide: 'right',
                toSide: 'left',
                label: 'familia',
                hot: true,
              },
            ],
          },
        },
      ],
      scenarios: [
        {
          prompt:
            'Necesito crear un botón cuyo tipo concreto decide cada subclase de diálogo.',
          answer: 'factory-method',
          why: 'Factory Method: un producto, la subclase elige la clase concreta.',
        },
        {
          prompt:
            'Necesito que el botón y el checkbox sean SIEMPRE del mismo sistema operativo.',
          answer: 'abstract-factory',
          why: 'Abstract Factory: crea familias coherentes que se garantizan compatibles.',
        },
      ],
    },
    {
      id: 'strategy-template',
      title: ['Strategy', 'Template Method'],
      tagline:
        'Los dos varían parte de un algoritmo. Strategy lo hace por composición (el algoritmo entero); Template Method por herencia (solo unos pasos).',
      same: 'Algoritmo con una parte variable',
      patterns: [
        {
          id: 'strategy',
          name: 'Strategy',
          cat: 'comportamiento',
          intent:
            'COMPOSICIÓN: el contexto tiene-un algoritmo enchufable y lo cambia entero en runtime.',
          pick: 'cuando quieres sustituir el algoritmo completo, decidido desde afuera.',
          diagram: {
            vb: [480, 230],
            nodes: [
              {
                id: 'a',
                x: 150,
                y: 30,
                w: 180,
                h: 66,
                role: 'interfaz',
                label: 'Context',
                sub: 'tiene-un',
              },
              {
                id: 'b',
                x: 150,
                y: 140,
                w: 180,
                h: 66,
                role: 'estrella',
                label: 'Strategy',
                sub: 'algoritmo entero',
                hot: true,
              },
            ],
            edges: [
              {
                from: 'a',
                to: 'b',
                type: 'composition',
                fromSide: 'bottom',
                toSide: 'top',
                label: 'composición',
                hot: true,
              },
            ],
          },
        },
        {
          id: 'template-method',
          name: 'Template Method',
          cat: 'comportamiento',
          intent:
            'HERENCIA: la base fija el esqueleto; la subclase sobrescribe solo algunos pasos (hooks).',
          pick: 'cuando varios algoritmos comparten estructura y difieren en pasos puntuales.',
          diagram: {
            vb: [480, 230],
            nodes: [
              {
                id: 'a',
                x: 150,
                y: 30,
                w: 180,
                h: 66,
                role: 'estrella',
                label: 'Base',
                sub: 'esqueleto fijo',
                hot: true,
              },
              {
                id: 'b',
                x: 150,
                y: 140,
                w: 180,
                h: 66,
                role: 'impl',
                label: 'Subclase',
                sub: 'override paso()',
              },
            ],
            edges: [
              {
                from: 'b',
                to: 'a',
                type: 'implements',
                fromSide: 'top',
                toSide: 'bottom',
                label: 'herencia · es-un',
                hot: true,
              },
            ],
          },
        },
      ],
      scenarios: [
        {
          prompt:
            'Varios mineros de datos comparten el flujo abrir → parsear → analizar, y solo difieren en cómo parsean.',
          answer: 'template-method',
          why: 'Template Method: el esqueleto fijo en la base, el paso variable en la subclase (herencia).',
        },
        {
          prompt:
            'Quiero inyectar la regla de precios COMPLETA desde afuera y poder cambiarla en runtime.',
          answer: 'strategy',
          why: 'Strategy: el algoritmo entero se enchufa por composición, elegido desde afuera.',
        },
      ],
    },
    {
      id: 'command-strategy',
      title: ['Command', 'Strategy'],
      tagline:
        'Ambos encapsulan «algo que hacer» en un objeto. Command es una acción que se ejecuta y se deshace; Strategy es un algoritmo intercambiable.',
      same: 'Objeto que encapsula comportamiento',
      patterns: [
        {
          id: 'command',
          name: 'Command',
          cat: 'comportamiento',
          intent:
            'Una ACCIÓN empaquetada: sabe ejecutarse y DESHACERSE; se puede encolar, registrar, apilar.',
          pick: 'cuando necesitas deshacer/rehacer, colas de trabajos o macros.',
          diagram: {
            vb: [560, 210],
            nodes: [
              {
                id: 'inv',
                x: 30,
                y: 78,
                w: 120,
                h: 56,
                role: 'cliente',
                label: 'Button',
              },
              {
                id: 'cmd',
                x: 188,
                y: 64,
                w: 150,
                h: 84,
                role: 'estrella',
                label: 'Command',
                sub: 'execute() · undo()',
                hot: true,
              },
              {
                id: 'rec',
                x: 392,
                y: 78,
                w: 140,
                h: 56,
                role: 'impl',
                label: 'Document',
              },
            ],
            edges: [
              {
                from: 'inv',
                to: 'cmd',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'execute()',
              },
              {
                from: 'cmd',
                to: 'rec',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'actúa + undo',
                hot: true,
              },
            ],
          },
        },
        {
          id: 'strategy',
          name: 'Strategy',
          cat: 'comportamiento',
          intent:
            'Un ALGORITMO intercambiable tras una interfaz. No se deshace: se sustituye por otro.',
          pick: 'cuando quieres variar CÓMO se hace algo, no registrar QUÉ se hizo.',
          diagram: {
            vb: [560, 210],
            nodes: [
              {
                id: 'inv',
                x: 30,
                y: 78,
                w: 120,
                h: 56,
                role: 'cliente',
                label: 'Sorter',
              },
              {
                id: 'cmd',
                x: 200,
                y: 78,
                w: 150,
                h: 60,
                role: 'estrella',
                label: 'Strategy',
                sub: 'sort()',
                hot: true,
              },
            ],
            edges: [
              {
                from: 'inv',
                to: 'cmd',
                type: 'uses',
                fromSide: 'right',
                toSide: 'left',
                label: 'intercambiable',
                hot: true,
              },
            ],
          },
        },
      ],
      scenarios: [
        {
          prompt:
            'Necesito que cada acción del usuario se pueda deshacer y rehacer.',
          answer: 'command',
          why: 'Command empaqueta la acción con execute()/undo() y la apila.',
        },
        {
          prompt:
            'Quiero cambiar la regla de cálculo de envío (por peso / por zona) en runtime.',
          answer: 'strategy',
          why: 'Strategy intercambia el algoritmo; no necesita deshacerse, se sustituye.',
        },
      ],
    },
    {
      id: 'composite-decorator',
      title: ['Composite', 'Decorator'],
      tagline:
        'Ambos son recursivos y comparten interfaz con lo que contienen. Composite arma un árbol de muchos; Decorator apila una sola cadena.',
      same: 'Component recursivo',
      patterns: [
        {
          id: 'composite',
          name: 'Composite',
          cat: 'estructural',
          intent:
            'Un ÁRBOL: un compuesto contiene MUCHOS hijos (0..*) y reparte la operación entre todos.',
          pick: 'cuando hay una jerarquía todo-parte y quieres tratar hoja y rama igual.',
          diagram: {
            vb: [480, 250],
            nodes: [
              {
                id: 'if',
                x: 160,
                y: 16,
                w: 150,
                h: 48,
                role: 'interfaz',
                label: 'Node',
              },
              {
                id: 'comp',
                x: 160,
                y: 104,
                w: 150,
                h: 56,
                role: 'estrella',
                label: 'Folder',
                hot: true,
              },
              {
                id: 'l1',
                x: 60,
                y: 194,
                w: 120,
                h: 48,
                role: 'impl',
                label: 'File',
              },
              {
                id: 'l2',
                x: 290,
                y: 194,
                w: 120,
                h: 48,
                role: 'impl',
                label: 'File',
              },
            ],
            edges: [
              {
                from: 'comp',
                to: 'if',
                type: 'implements',
                fromSide: 'top',
                toSide: 'bottom',
              },
              {
                from: 'comp',
                to: 'l1',
                type: 'composition',
                fromSide: 'bottom',
                toSide: 'top',
                label: '0..*',
                hot: true,
              },
              {
                from: 'comp',
                to: 'l2',
                type: 'composition',
                fromSide: 'bottom',
                toSide: 'top',
                hot: true,
              },
            ],
          },
        },
        {
          id: 'decorator',
          name: 'Decorator',
          cat: 'estructural',
          intent:
            'Una CADENA: cada capa envuelve a UN solo objeto y le añade comportamiento.',
          pick: 'cuando quieres apilar responsabilidades sobre un único objeto.',
          diagram: {
            vb: [480, 250],
            nodes: [
              {
                id: 'if',
                x: 160,
                y: 16,
                w: 150,
                h: 48,
                role: 'interfaz',
                label: 'Coffee',
              },
              {
                id: 'comp',
                x: 160,
                y: 104,
                w: 150,
                h: 56,
                role: 'estrella',
                label: 'AddOn',
                hot: true,
              },
              {
                id: 'l1',
                x: 160,
                y: 194,
                w: 150,
                h: 48,
                role: 'impl',
                label: 'Espresso',
              },
            ],
            edges: [
              {
                from: 'comp',
                to: 'if',
                type: 'implements',
                fromSide: 'top',
                toSide: 'bottom',
              },
              {
                from: 'comp',
                to: 'l1',
                type: 'composition',
                fromSide: 'bottom',
                toSide: 'top',
                label: 'envuelve 1',
                hot: true,
              },
            ],
          },
        },
      ],
      scenarios: [
        {
          prompt:
            'Quiero tratar archivos y carpetas con la misma operación tamaño(), que se propaga por el árbol.',
          answer: 'composite',
          why: 'Composite: árbol uniforme; un compuesto reparte la operación entre sus hijos.',
        },
        {
          prompt:
            'Quiero apilar bordes y barra de scroll sobre un mismo widget.',
          answer: 'decorator',
          why: 'Decorator: cada capa envuelve un solo objeto y le añade comportamiento.',
        },
      ],
    },
  ],
};
