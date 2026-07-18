/* ============================================================
   caches.js — Ficha 12 · Method cache e inline caches
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.caches = {
    slug: "caches", n: "12", kind: "la caché", glyph: "◆◆◆", family: "obj",
    navShort: "Method cache",
    title: "Method cache e inline caches",
    tagline: "Recordar dónde vive cada método. Las mismas invariantes que vigila el JIT.",
    chips: ["inline cache", "invalidación"],
    eyebrowSub: "recordar dónde vive",
    lede: 'Buscar un método por toda la <a href="#/lookup">cadena de ancestros</a> cada vez sería lento. Ruby <b>cachea</b> el resultado: la segunda llamada es mucho más rápida. Y descansa en la misma apuesta que hace el <a href="#/jit">JIT</a> — recordar algo mientras nadie cambie las reglas.',

    enBreve: [
      { k: "Dónde",     v: "Junto a la llamada" },
      { k: "1ª llamada", v: "Miss · recorre" },
      { k: "Siguientes", v: "Hit · directo" },
      { k: "Si redefines", v: "Se invalida" }
    ],

    fundamento: 'La misma línea de código suele llamar al mismo método una y otra vez: dentro de un bucle, <code class="ic">usuario.nombre</code> resuelve siempre al mismo <code class="ic">nombre</code>. Volver a recorrer la cadena cada vez sería tirar trabajo. Así que Ruby <b>recuerda</b>, en el propio sitio de la llamada, a qué método resolvió — y bajo qué condiciones sigue siendo válido.',

    comoFunciona: 'Ruby guarda en un <b>inline cache</b> (junto a la instrucción de llamada) a qué método se resolvió y una «huella» de las condiciones. Si redefines un método, agregas un módulo, etc., un <b>contador de versión</b> cambia e <b>invalida</b> las cachés afectadas: la próxima llamada vuelve a recorrer la cadena. Esas mismas invariantes son las que <a href="#/jit">YJIT/ZJIT</a> vigilan para no ejecutar código máquina obsoleto. <span style="color:var(--color-fg-faint);">(En Ruby moderno la invalidación es sobre todo <b style="color:var(--color-fg-subtle);">por clase</b>, no un único golpe que borre todas las cachés; aquí lo modelamos como un contador global para que se vea.)</span>',

    widget: {
      kind: "caches",
      title: "Hit, miss e invalidación",
      intro: 'Llama <code class="ic">perro.hablar</code> varias veces y mira la caché pasar de miss a hit. Luego redefine el método y observa la invalidación.'
    },

    callout: { tag: "Conexión", text: 'El JIT compila código máquina bajo la misma suposición («hablar sigue siendo este método»). Cuando la <b>global version</b> cambia, se invalidan a la vez el inline cache <b>y</b> el código JIT que dependía de él.' },

    recursos: [
      { title: "Docs de YJIT · invariants", note: "qué invalida el código compilado", url: "https://docs.ruby-lang.org/en/3.4/yjit/yjit_md.html" },
      { title: "Rails at Scale", note: "posts sobre caché de métodos y performance", url: "https://railsatscale.com/" },
      { title: "vm_method.c", note: "la caché de métodos, en ruby/ruby", url: "https://github.com/ruby/ruby/blob/master/vm_method.c" }
    ]
  };

})(window.GUIA = window.GUIA || {});
