/* ============================================================
   lookup.js — Ficha 10 · Method lookup (MRO)
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.lookup = {
    slug: "lookup", n: "10", kind: "el lookup", glyph: "◆◆◇", family: "obj",
    navShort: "Method lookup",
    title: "Cómo Ruby encuentra un método",
    tagline: "Al llamar un método, Ruby sube por la cadena de ancestros hasta encontrarlo.",
    chips: ["ancestors", "include", "prepend"],
    eyebrowSub: "la cadena de ancestros",
    lede: 'Cuando llamas <code class="ic">objeto.metodo</code>, Ruby sube por una cadena ordenada de clases y módulos hasta encontrarlo. Ese orden —el <b>MRO</b>, Method Resolution Order— explica la herencia, los mixins y las <em>colisiones</em> de métodos.',

    enBreve: [
      { k: "Recorre",  v: "ancestors" },
      { k: "prepend",  v: "antes de la clase" },
      { k: "include",  v: "reverso de inclusión" },
      { k: "Si no está", v: "method_missing" }
    ],

    fundamento: 'En Ruby los métodos no viven «en el objeto»: viven en su <b>clase</b> y en los <b>módulos</b> mezclados. Al invocar uno, Ruby necesita una regla clara y determinista para decidir <b>cuál</b> ejecutar cuando varios sitios definen el mismo nombre. Esa regla es una lista plana y ordenada: la cadena de ancestros. Se recorre de arriba abajo y gana el primero.',

    comoFunciona: 'Ruby aplana la jerarquía en <code class="ic">objeto.class.ancestors</code>: primero los módulos con <b>prepend</b>, luego la clase, luego los módulos <b>include</b> (en orden inverso al que los incluiste), luego la superclase, y así hasta <code class="ic">BasicObject</code>. Se ejecuta el <b>primer</b> ancestro que defina el método. Si ninguno lo tiene, salta <code class="ic">method_missing</code>.',

    widget: {
      kind: "lookup",
      title: "Recorre la cadena",
      intro: 'Llama un método sobre un <code class="ic">Perro</code> y mira bajar el puntero por sus ancestros. Cambia el <b>orden de los include</b> o quita el <b>prepend</b> y verás cambiar quién gana.',
      defs: {
        Ruidoso: ["hablar"], Perro: ["hablar", "correr"], Nadador: ["nadar", "saludar"],
        Saludable: ["saludar"], Animal: ["hablar", "comer"], Object: ["to_s", "inspect"],
        Kernel: ["puts"], BasicObject: ["equal?"]
      },
      kind_of: { Ruidoso: "prepend", Perro: "class", Nadador: "module", Saludable: "module", Animal: "superclass", Object: "class", Kernel: "module", BasicObject: "class" },
      methods: ["hablar", "nadar", "saludar", "comer", "volar"]
    },

    callout: { tag: "Clave", text: 'Cuando <code class="ic">saludar</code> lo definen dos módulos, gana el que aparezca <b>antes</b> en <code class="ic">ancestors</code> — y eso lo decide el orden de tus <code class="ic">include</code>.' },

    recursos: [
      { title: "Module#ancestors", note: "la cadena, en las docs oficiales", url: "https://docs.ruby-lang.org/en/master/Module.html#method-i-ancestors" },
      { title: "include vs prepend", note: "dónde entra cada módulo", url: "https://docs.ruby-lang.org/en/master/Module.html#method-i-prepend" },
      { title: "Metaprogramming Ruby 2", note: "Paolo Perrotta, el capítulo del lookup", url: "https://pragprog.com/titles/ppmetr2/metaprogramming-ruby-2/" }
    ]
  };

})(window.GUIA = window.GUIA || {});
