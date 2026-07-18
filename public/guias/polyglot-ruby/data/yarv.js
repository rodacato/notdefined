/* ============================================================
   yarv.js — Ficha 02 · YARV, la máquina de pila
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.yarv = {
    slug: "yarv", n: "02", kind: "la VM", glyph: "◆◆◇", family: "exec",
    navShort: "YARV",
    title: "YARV: la máquina de pila",
    tagline: "El bytecode que empuja y saca valores de una pila. El modelo mental que da sentido al ISEQ.",
    chips: ["ISEQ", "push / pop", "insns.def"],
    eyebrowSub: "una máquina de pila",
    lede: 'Ruby no ejecuta el AST directamente: lo compila a bytecode que corre sobre <b>YARV</b>, una máquina de <b>pila</b>. Casi toda operación empuja (push) y saca (pop) valores de una pila. Es el modelo mental que hace que el bytecode <em>tenga sentido</em>.',

    enBreve: [
      { k: "Nombre", v: "Yet Another RubyVM" },
      { k: "Modelo", v: "Pila (push / pop)" },
      { k: "Unidad", v: "ISEQ · instrucciones" },
      { k: "Desde",  v: "Ruby 1.9" }
    ],

    fundamento: 'Una <b>máquina de pila</b> es una CPU imaginaria muy simple: no tiene decenas de registros, solo una pila. Para sumar dos números, los pones encima de la pila y ejecutas «suma», que los quita y deja el resultado. Este modelo es fácil de compilar y de interpretar, por eso lo usan muchas VMs (la JVM, Python, WebAssembly). El bytecode de Ruby, el <b>ISEQ</b>, es una lista de estas operaciones.',

    comoFunciona: 'Cada instrucción ISEQ manipula la pila. <code class="ic">putobject</code> empuja un valor; <code class="ic">opt_plus</code> saca dos y empuja su suma; <code class="ic">leave</code> devuelve el tope y termina. Las instrucciones <code class="ic">opt_*</code> son versiones optimizadas para tipos comunes (Integer, Array). Puedes ver el ISEQ real de cualquier código con <code class="ic">RubyVM::InstructionSequence</code>.',

    widget: {
      kind: "yarv",
      title: "La pila, instrucción a instrucción",
      intro: 'El ISEQ real de <code class="ic">2 * (3 + 4)</code>. Ejecuta una instrucción por clic y mira crecer y decrecer la pila.',
      insns: [
        { addr: "0000", op: "putobject", arg: "2", opt: false },
        { addr: "0002", op: "putobject", arg: "3", opt: false },
        { addr: "0004", op: "putobject", arg: "4", opt: false },
        { addr: "0006", op: "opt_plus", arg: "", opt: true },
        { addr: "0008", op: "opt_mult", arg: "", opt: true },
        { addr: "0010", op: "leave", arg: "", opt: false }
      ],
      stacks: [ [], [2], [2, 3], [2, 3, 4], [2, 7], [14], [] ],
      texts: [
        "La pila arranca vacía. La primera instrucción, putobject 2, va a empujar el literal 2.",
        "putobject 2 empujó 2. Ahora hay un valor en la pila.",
        "putobject 3 empujó 3 encima.",
        "putobject 4 empujó 4. Tres literales listos.",
        "opt_plus sacó 4 y 3, y empujó su suma: 7. La pila baja de 3 a 2 elementos.",
        "opt_mult sacó 7 y 2, y empujó su producto: 14. El resultado de (3+4)·2.",
        "leave devolvió el tope (14) y terminó. La pila queda vacía."
      ]
    },

    callout: { tag: "Truco", text: 'En tu consola: <code class="ic">puts RubyVM::InstructionSequence.compile("2 * (3 + 4)").disasm</code> imprime exactamente estas instrucciones.' },

    recursos: [
      { title: "RubyVM::InstructionSequence", note: "#disasm en las docs", url: "https://docs.ruby-lang.org/en/master/RubyVM/InstructionSequence.html" },
      { title: "Ruby Under a Microscope", note: "el capítulo de YARV", url: "https://patshaughnessy.net/ruby-under-a-microscope" },
      { title: "insns.def", note: "todas las instrucciones, en ruby/ruby", url: "https://github.com/ruby/ruby/blob/master/insns.def" }
    ]
  };

})(window.GUIA = window.GUIA || {});
