/* ============================================================
   pipeline.js — Ficha 01 · El pipeline de ejecución
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.pipeline = {
    slug: "pipeline", n: "01", kind: "el mapa", glyph: "◆◇◇", family: "exec",
    navShort: "El pipeline",
    title: "El pipeline de ejecución de Ruby",
    tagline: "Tu texto no se ejecuta directo: viaja por Prism, AST, ISEQ y, si hace falta, el JIT.",
    chips: ["Prism", "AST", "ISEQ", "YARV"],
    eyebrowSub: "del texto al código máquina",
    lede: 'Cuando escribes <code class="ic">puts 1 + 2</code>, tu texto no se ejecuta directamente. Pasa por una cadena de transformaciones hasta convertirse en instrucciones que la máquina virtual entiende. Entender esta cadena es entender <em>dónde vive</em> cada uno de los demás temas.',

    enBreve: [
      { k: "Parser",     v: "Prism → AST" },
      { k: "Compilador", v: "AST → ISEQ" },
      { k: "Ejecuta",    v: "Intérprete YARV" },
      { k: "Acelera",    v: "JIT si está caliente" }
    ],

    fundamento: 'Ruby es un lenguaje <b>interpretado</b>, pero «interpretado» no significa que la máquina lea tu texto letra por letra. Antes de ejecutar nada, Ruby <b>traduce</b> tu código a una forma que su motor entiende rápido. Si esa traducción no existiera, cada línea habría que re-analizarla una y otra vez: lentísimo. El pipeline es esa traducción, en etapas.',

    comoFunciona: 'Cuatro etapas. El <b>código fuente</b> lo lee <b>Prism</b> (el parser por defecto desde Ruby 3.4, que reemplazó al viejo <code class="ic">parse.y</code>) y lo convierte en un <b>AST</b>, un árbol que representa la estructura. El <b>compilador</b> recorre ese árbol y emite <b>ISEQ</b>: el bytecode de la máquina virtual YARV. Ese bytecode lo ejecuta el <b>intérprete</b>; y si un método se ejecuta muchas veces («caliente»), un <b>JIT</b> (YJIT o ZJIT) lo traduce a código máquina nativo.',

    widget: {
      kind: "pipeline",
      title: "Míralo transformarse",
      intro: 'El mismo snippet, <code class="ic">puts 1 + 2</code>, avanzando etapa por etapa. Pulsa <b>siguiente etapa</b> y observa en qué se convierte.',
      stages: [
        { tool: "texto", label: "Código fuente", sub: "lo que escribes",
          title: "Código fuente · .rb",
          code: '<span class="tok-fn">puts</span> <span class="tok-num">1</span> <span class="tok-op">+</span> <span class="tok-num">2</span>',
          note: 'Texto plano. Todavía no hay estructura ni significado: solo caracteres en un archivo <code style="color:var(--code-fg);">.rb</code>.' },
        { tool: "Prism", label: "AST", sub: "árbol sintáctico",
          title: "AST · árbol de Prism",
          code: '<span class="tok-num">CallNode</span> <span class="tok-dim">(:puts)</span>\n<span class="tok-dim">└─</span> arguments\n   <span class="tok-dim">└─</span> <span class="tok-num">CallNode</span> <span class="tok-dim">(:+)</span>\n      <span class="tok-dim">├─</span> receiver: <span class="tok-op">IntegerNode</span> <span class="tok-num">1</span>\n      <span class="tok-dim">└─</span> arguments: <span class="tok-op">IntegerNode</span> <span class="tok-num">2</span>',
          note: '<b>Prism</b> convirtió el texto en un árbol: «llamar a <code style="color:var(--code-fg);">puts</code> con el resultado de <code style="color:var(--code-fg);">1 + 2</code>». Ahora sí hay estructura y precedencia.' },
        { tool: "compile.c", label: "ISEQ", sub: "bytecode YARV",
          title: "ISEQ · bytecode YARV",
          code: '<span class="tok-dim">0000</span> <span class="tok-fn">putself</span>\n<span class="tok-dim">0001</span> <span class="tok-fn">putobject_INT2FIX_1_</span>\n<span class="tok-dim">0002</span> <span class="tok-fn">putobject</span>            <span class="tok-num">2</span>\n<span class="tok-dim">0004</span> <span class="tok-fn">opt_plus</span>\n<span class="tok-dim">0006</span> <span class="tok-fn">opt_send_without_block</span> <span class="tok-op">&lt;:puts&gt;</span>\n<span class="tok-dim">0008</span> <span class="tok-fn">leave</span>',
          note: 'El compilador (<code style="color:var(--code-fg);">compile.c</code>) emitió <b>ISEQ</b>: instrucciones que empujan y sacan valores de una pila. Obtienes esto real con <code style="color:var(--code-fg);">RubyVM::InstructionSequence.compile("puts 1+2").disasm</code>.' },
        { tool: "YJIT / ZJIT", label: "Código máquina", sub: "solo si está caliente",
          title: "Código máquina · nativo (JIT)",
          code: '<span class="tok-dim">; opt_plus, especializado a Integer + Integer</span>\n<span class="tok-fn">mov</span>   rax, <span class="tok-num">0x3</span>        <span class="tok-dim">; 1 (Fixnum)</span>\n<span class="tok-fn">add</span>   rax, <span class="tok-num">0x4</span>        <span class="tok-dim">; +2 destaggeado (tag Fixnum)</span>\n<span class="tok-fn">call</span>  rb_funcall <span class="tok-dim">; puts</span>\n<span class="tok-fn">ret</span>',
          note: '<b>Solo si el método está caliente.</b> El JIT (YJIT / ZJIT) traduce el ISEQ a código máquina nativo, especializado a los tipos observados. El código frío se queda en el intérprete — compilarlo no valdría la pena.' }
      ]
    },

    callout: { tag: "Mito", text: '«Ruby interpreta mi texto tal cual». No: para cuando algo se ejecuta, tu código ya es bytecode. El texto solo existe en la primera etapa.' },

    recursos: [
      { title: "ruby/prism", note: "el parser por defecto de Ruby", url: "https://github.com/ruby/prism" },
      { title: "Ruby Under a Microscope", note: "tokenización, parsing y compilación", url: "https://patshaughnessy.net/ruby-under-a-microscope" },
      { title: "RubyVM::InstructionSequence", note: "inspecciona el ISEQ tú mismo", url: "https://docs.ruby-lang.org/en/master/RubyVM/InstructionSequence.html" }
    ]
  };

})(window.GUIA = window.GUIA || {});
