/* ============================================================
   shapes.js — Ficha 08 · Object Shapes
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.shapes = {
    slug: "shapes", n: "09", kind: "el plano", glyph: "◆◆◇", family: "mem",
    navShort: "Object Shapes",
    title: "Object Shapes",
    tagline: "El «plano» de las variables de instancia que acelera su acceso y ayuda al JIT.",
    chips: ["shape.c", "transiciones"],
    eyebrowSub: "el plano de las ivars",
    lede: 'Cada objeto guarda sus variables de instancia (<code class="ic">@nombre</code>, <code class="ic">@edad</code>). Para acceder rápido, Ruby usa <b>shapes</b>: un «plano» del objeto que describe qué ivars tiene y en qué orden. Por eso el <em>orden</em> importa.',

    enBreve: [
      { k: "Qué es",         v: "El plano de un objeto" },
      { k: "Se organizan en", v: "Árbol de transiciones" },
      { k: "Beneficio",      v: "Acceso a ivars veloz" },
      { k: "Desde",          v: "Ruby 3.2" }
    ],

    fundamento: 'Sin shapes, para leer <code class="ic">@edad</code> Ruby tendría que buscar el nombre «edad» en una tabla, cada vez. Con shapes, todos los objetos con la <b>misma estructura</b> comparten un plano que dice «@edad está en la posición 1». Leerla es ir directo a esa posición — casi gratis, y perfecto para que el <a href="#/jit">JIT</a> lo optimice.',

    comoFunciona: 'Cada vez que añades una ivar nueva, el objeto <b>transiciona</b> a una nueva shape. Las shapes forman un <b>árbol</b>: partiendo de la shape raíz (sin ivars), añadir <code class="ic">@x</code> lleva a una shape, y desde ahí añadir <code class="ic">@y</code> a otra. Dos objetos que añaden las mismas ivars en el mismo orden <b>comparten</b> la rama; en distinto orden, acaban en shapes distintas.',

    widget: {
      kind: "shapes",
      title: "Construye el árbol de shapes",
      intro: 'Añade ivars al objeto y mira crecer el árbol. Prueba los dos presets: mismas ivars, <b>distinto orden</b> → shapes distintas.',
      ivars: ["@x", "@y", "@color"],
      presets: [
        { label: "objeto: @x → @y", seq: ["@x", "@y"] },
        { label: "objeto: @y → @x", seq: ["@y", "@x"] }
      ]
    },

    callout: { tag: "Clave", text: 'Inicializa siempre las ivars en el <b>mismo orden</b> (típicamente en <code class="ic">initialize</code>): así todas tus instancias comparten shape y el acceso se mantiene rápido y cacheable.' },

    recursos: [
      { title: "Implementing Object Shapes in CRuby", note: "Jemma Issroff, RubyKaigi 2022", url: "https://rubykaigi.org/2022/presentations/jemmaissroff.html" },
      { title: "Propuesta de Object Shapes", note: "Feature #18776", url: "https://bugs.ruby-lang.org/issues/18776" },
      { title: "shape.c", note: "la implementación, en ruby/ruby", url: "https://github.com/ruby/ruby/blob/master/shape.c" }
    ]
  };

})(window.GUIA = window.GUIA || {});
