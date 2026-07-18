/* ============================================================
   jit.js — Ficha 03 · El JIT (MJIT → YJIT → ZJIT)
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.jit = {
    slug: "jit", n: "03", kind: "el JIT", glyph: "◆◆◆", family: "exec",
    navShort: "El JIT",
    title: "El JIT: MJIT → YJIT → ZJIT",
    tagline: "Compilar en caliente solo lo que se repite, bajo suposiciones que pueden romperse.",
    chips: ["YJIT", "ZJIT", "side-exit"],
    eyebrowSub: "compilar en caliente",
    lede: 'Un <b>JIT</b> (Just-In-Time compiler) traduce el bytecode a código máquina <em>mientras el programa corre</em>, y se enfoca solo en el código «caliente»: el que se repite tanto que compilarlo se paga solo. Lo demás no vale la molestia.',

    enBreve: [
      { k: "Historia", v: "MJIT → YJIT → ZJIT" },
      { k: "YJIT", v: "Estable · en Rust" },
      { k: "ZJIT", v: "Optimizador · IR SSA" },
      { k: "Si falla la suposición", v: "side-exit" }
    ],

    fundamento: 'El intérprete es flexible pero lento: para cada operación revisa tipos, busca métodos, comprueba casos. Si un método se ejecuta un millón de veces, esa comprobación se repite un millón de veces. Un JIT gasta un poco de tiempo <b>una vez</b> en generar código máquina especializado, para ganar velocidad <b>en todas</b> las siguientes. Solo tiene sentido para código «caliente»: compilar algo que corre una vez sería tiempo perdido.',

    comoFunciona: '<b>YJIT</b> usa <em>Lazy Basic Block Versioning</em>: compila bloques básicos bajo demanda, especializados según los tipos que realmente observa. <b>ZJIT</b> usa un <em>profiling</em> previo del intérprete más una IR optimizable (SSA/HIR) para generar mejor código. Ambos hacen <b>suposiciones</b> («este método no cambia», «esta variable siempre es Integer»). Si una suposición se rompe, ocurre un <b>side-exit</b>: se abandona el código máquina y se vuelve al intérprete.',

    widget: {
      kind: "jit",
      title: "Caliéntalo y rómpelo",
      intro: 'Llama el método muchas veces para que se caliente y compile. Luego pásale un tipo distinto y mira el <b>side-exit</b>.',
      threshold: 20
    },

    callout: { tag: "Mito", text: '«El JIT compila todo mi programa al arrancar». No: solo compila lo caliente, tras muchas ejecuciones, y puede <b>deshacer</b> esa compilación si tus suposiciones de tipo cambian. El umbral real es mucho mayor que el de esta demo.' },

    recursos: [
      { title: "YJIT: Building a New JIT Compiler for CRuby", note: "Shopify Engineering", url: "https://shopify.engineering/yjit-just-in-time-compiler-cruby" },
      { title: "ZJIT: Building a Next Generation Ruby JIT", note: "equipo YJIT / Shopify", url: "https://www.rubyevents.org/talks/zjit-building-a-next-generation-ruby-jit" },
      { title: "Ruby's JIT Journey: MJIT → YJIT → ZJIT", note: "Codemancers", url: "https://www.codemancers.com/blog/rubys-jit-journey" }
    ]
  };

})(window.GUIA = window.GUIA || {});
