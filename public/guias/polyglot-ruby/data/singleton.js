/* ============================================================
   singleton.js — Ficha 11 · Singleton classes (eigenclass)
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.singleton = {
    slug: "singleton", n: "11", kind: "eigenclass", glyph: "◆◆◇", family: "obj",
    navShort: "Singleton classes",
    title: "Singleton classes (eigenclass)",
    tagline: "La clase oculta de cada objeto. Explica los «métodos de clase» y los métodos singleton.",
    chips: ["singleton_class", "métodos de clase"],
    eyebrowSub: "la clase oculta",
    lede: 'Cada objeto puede tener métodos que solo le pertenecen a él. Ruby los guarda en una <b>clase oculta</b> propia del objeto: la <em>singleton class</em> (o eigenclass). Es la pieza que explica los «métodos de clase».',

    enBreve: [
      { k: "Qué es",       v: "Clase propia del objeto" },
      { k: "Se accede",    v: "singleton_class" },
      { k: "Va en el lookup", v: "Antes que su clase" },
      { k: "Explica",      v: "Los métodos de clase" }
    ],

    fundamento: 'En Ruby los métodos viven en clases, no en objetos. Pero a veces quieres un método <b>solo para este objeto</b>, sin afectar a los demás de su clase. ¿Dónde ponerlo? Ruby crea, en silencio, una clase intermedia exclusiva de ese objeto —su singleton class— y mete ahí el método. Como nadie más la comparte, el método es único de ese objeto.',

    comoFunciona: '<code class="ic">def obj.saludar</code> define el método en la singleton class de <code class="ic">obj</code>, que se inserta en la cadena de <a href="#/lookup">lookup</a> <b>antes</b> que su clase. Y el gran truco: los «métodos de clase» son en realidad métodos de instancia de la singleton class de <em>la propia clase</em>. Una clase también es un objeto, así que también tiene su eigenclass.',

    widget: {
      kind: "singleton",
      title: "Haz aparecer la eigenclass",
      intro: 'Define un método singleton y mira aparecer la clase oculta, insertándose en la cadena justo antes de <code class="ic">Perro</code>.'
    },

    callout: { tag: "Clave", text: 'La eigenclass se inserta <b>antes</b> que la clase en la cadena, así que sus métodos ganan. Ejecuta <code class="ic">perro.singleton_class.instance_methods(false)</code> para verlos.' },

    recursos: [
      { title: "Metaprogramming Ruby 2", note: "Paolo Perrotta, el capítulo de eigenclasses", url: "https://pragprog.com/titles/ppmetr2/metaprogramming-ruby-2/" },
      { title: "Object#singleton_class", note: "accede a la eigenclass", url: "https://docs.ruby-lang.org/en/master/Object.html#method-i-singleton_class" },
      { title: "Ruby Under a Microscope", note: "clases, metaclases y el objeto", url: "https://patshaughnessy.net/ruby-under-a-microscope" }
    ]
  };

})(window.GUIA = window.GUIA || {});
