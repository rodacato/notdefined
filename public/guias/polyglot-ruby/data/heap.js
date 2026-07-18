/* ============================================================
   heap.js — Ficha 09 · Heap pages y slots
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.heap = {
    slug: "heap", n: "09", kind: "el heap", glyph: "◆◇◇", family: "mem",
    navShort: "Heap y slots",
    title: "Cómo se guarda la memoria",
    tagline: "La memoria de objetos vive en páginas divididas en slots de tamaño fijo.",
    chips: ["páginas", "slots", "fragmentación"],
    eyebrowSub: "páginas y slots",
    lede: 'La memoria de objetos de Ruby no es un caos: está organizada en <b>páginas</b> (heap pages) divididas en <b>slots</b> de tamaño fijo. Entender esto explica por qué el <a href="#/gc">GC</a> funciona como funciona y por qué la <em>fragmentación</em> importa.',

    enBreve: [
      { k: "Unidad grande",   v: "Página (heap page)" },
      { k: "Unidad pequeña",  v: "Slot · tamaño fijo" },
      { k: "Un objeto",       v: "Vive en un slot" },
      { k: "Se inspecciona",  v: "GC.stat · ObjectSpace" }
    ],

    fundamento: 'Pedir memoria al sistema operativo objeto por objeto sería lentísimo. En su lugar, Ruby pide bloques grandes —<b>páginas</b>— y los reparte internamente en <b>slots</b> del mismo tamaño. Colocar un objeto es tan simple como ocupar el siguiente slot libre. Cuando una página se llena, Ruby pide otra.',

    comoFunciona: 'Cada objeto vive en un slot; los objetos muy grandes se manejan aparte. El <a href="#/gc">GC</a> recorre páginas y slots para marcar y barrer. Al liberar objetos dispersos quedan <b>huecos</b>: la <b>fragmentación</b>. Hay slots libres, pero repartidos, así que ninguna página se puede devolver al sistema. La <b>compactación</b> reagrupa los objetos vivos para vaciar páginas enteras.',

    widget: {
      kind: "heap",
      title: "Llena, fragmenta, compacta",
      intro: 'Crea objetos y mira ocuparse los slots página a página. Libera algunos dispersos para fragmentar, y compacta para cerrar los huecos y liberar páginas enteras.'
    },

    callout: { tag: "Clave", text: 'Tener muchos <code class="ic">heap_free_slots</code> no siempre es bueno: si están dispersos, la memoria no vuelve al sistema. Compactar los junta y permite liberar páginas enteras.' },

    recursos: [
      { title: "GC.stat y ObjectSpace", note: "mira tus propios slots y páginas", url: "https://docs.ruby-lang.org/en/master/GC.html#method-c-stat" },
      { title: "Defragging Ruby", note: "Aaron Patterson, Brighton Ruby 2019", url: "https://brightonruby.com/2019/defragging-ruby-aaron-patterson/" },
      { title: "Ruby Under a Microscope", note: "cómo Ruby organiza la memoria", url: "https://patshaughnessy.net/ruby-under-a-microscope" }
    ]
  };

})(window.GUIA = window.GUIA || {});
