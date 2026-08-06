/* ============================================================
   caches.js — Ficha 12 · Method cache e inline caches
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.caches = {
    slug: "caches", n: "10", kind: "la caché", glyph: "◆◆◆", family: "mem",
    navShort: "Method cache",
    title: "Method cache e inline caches",
    tagline: "Recordar dónde vive cada método. Las mismas invariantes que vigila el JIT.",
    chips: ["inline cache", "invalidación"],
    eyebrowSub: "recordar dónde vive",
    lede: 'Buscar un método por toda la <a href="/guias/polyglot-ruby-c1/#/tema/method-lookup">cadena de ancestros</a> (el criterio de USO vive en «Ruby dominado», el C1) cada vez sería lento. Ruby <b>cachea</b> el resultado: la segunda llamada es mucho más rápida. Y descansa en la misma apuesta que hace el <a href="#/jit">JIT</a> — recordar algo mientras nadie cambie las reglas.',

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

    callout: { tag: "Conexión", text: 'El JIT compila código máquina bajo la misma suposición («hablar sigue siendo este método»). Cuando esa versión cambia (en Ruby moderno, la de <b>esa clase</b>), se invalidan a la vez el inline cache <b>y</b> el código JIT que dependía de él.' },

    predice: {
      "pregunta": "El mismo <code class=\"ic\">o.m</code>, una vez siempre con la misma clase y otra viendo cuatro clases distintas. ¿Cuesta igual?",
      "opciones": [
        "Sí: el método cacheado es el mismo",
        "No: el polimórfico es más lento"
      ],
      "correcta": 1,
      "porque": "Medido: <b>1.26×</b> más lento, con el método idéntico. El caché no vive en el método, vive en el <b>call site</b>. Lo que cambia no es qué llamas, es desde dónde."
    },

    cuandoNo: "No conviertas esto en una regla de diseño. «Evita el polimorfismo por los inline caches» es exactamente el consejo que produce código malo y rápido en el lugar equivocado: 1.26× sobre nanosegundos no paga una jerarquía peor.",

    mito: {
      creencia: "«Un método cacheado cuesta lo mismo sin importar quién lo llame.»",
      realidad: "Falso: el caché no vive en el método, vive en el <b>call site</b>. Un <code class=\"ic\">o.m</code> que siempre ve la misma clase acierta siempre; el mismo <code class=\"ic\">o.m</code> viendo cuatro clases distintas falla y vuelve a buscar. Medido en 4.0: <b>1.26×</b> más lento el polimórfico, con el método idéntico. Lo que cambia no es el método, es el lugar desde donde lo llamas."
    },

    recursos: [
      { title: "Docs de YJIT · invariants", note: "qué invalida el código compilado", url: "https://docs.ruby-lang.org/en/3.4/yjit/yjit_md.html" },
      { title: "Rails at Scale", note: "posts sobre caché de métodos y performance", url: "https://railsatscale.com/" },
      { title: "vm_method.c", note: "la caché de métodos, en ruby/ruby", url: "https://github.com/ruby/ruby/blob/master/vm_method.c" }
    ]
  };

})(window.GUIA = window.GUIA || {});
