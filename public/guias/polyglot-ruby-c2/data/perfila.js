/* ============================================================
   perfila.js — Ficha 13 · Perfila el motor
   ============================================================ */
(function (G) {
  "use strict";

  G.data.topics.perfila = {
    slug: "perfila", n: "13", kind: "el taller", glyph: "◆◆◇", family: "taller",
    navShort: "Perfila el motor",
    title: "Perfila el motor",
    tagline: "Cada herramienta de profiling observa una pieza que ya conoces. Este es el mapa.",
    chips: ["stackprof", "GC.stat", "benchmark-ips"],
    eyebrowSub: "medir, no adivinar",
    lede: 'Doce fichas de teoría y ni una sola medición tuya. Esta cierra el ciclo: cada herramienta de profiling en Ruby <b>observa una pieza que ya leíste</b> — el <a href="#/jit">JIT</a>, el <a href="#/gc">GC</a>, el <a href="#/heap">heap</a>. No hay un mundo nuevo que aprender: es el mismo motor, visto con instrumentos.',

    enBreve: [
      { k: "CPU",        v: "stackprof · vernier" },
      { k: "JIT",        v: "runtime_stats" },
      { k: "Memoria",    v: "GC.stat · ObjectSpace" },
      { k: "Disciplina", v: "benchmark-ips" }
    ],

    fundamento: 'Adivinar dónde se va el tiempo tiene un historial terrible: el cuello de botella casi nunca está donde juras que está. Un profiler no opina — <b>muestrea</b> lo que hace tu proceso miles de veces por segundo y te entrega el mapa real. Pero el mapa solo sirve si reconoces el territorio: cuando <code class="ic">stackprof</code> te dice que el 30% del tiempo se va en el GC, la explicación no está en el profiler — está en la ficha del <a href="#/gc">recolector</a>.',

    comoFunciona: 'Cada instrumento apunta a una capa del motor. <b>stackprof</b> (modos <code class="ic">:cpu</code>, <code class="ic">:wall</code>, <code class="ic">:object</code>) y su sucesor <b>vernier</b> muestrean el stack para decirte dónde se va el CPU: los frames que ves son el <a href="#/pipeline">pipeline</a> y la <a href="#/yarv">YARV</a> ejecutando tu código. <b>RubyVM::YJIT.runtime_stats</b> reporta qué compiló el <a href="#/jit">JIT</a> y cuántos side-exits te están costando la especialización. <b>GC.stat</b> cuenta ciclos y slots (<code class="ic">heap_live_slots</code>, <code class="ic">major_gc_count</code>) del <a href="#/gc">recolector</a>, y <code class="ic">GC.compact</code> ataca la fragmentación del <a href="#/heap">heap</a>. <b>ObjectSpace.count_objects</b> y la gema <b>memory_profiler</b> te dicen quién aloca qué — y si tus objetos comparten <a href="#/shapes">shape</a> o estás pagando transiciones de más. La disciplina que amarra todo es <b>benchmark-ips</b>: warmup primero, iteraciones por segundo después, con su desviación. El widget de abajo la muestra cuadro por cuadro.',

    widget: {
      kind: "perfila",
      title: "benchmark-ips, cuadro por cuadro",
      intro: 'Dos formas de armar el mismo String: <code class="ic">+=</code> crea uno nuevo en cada vuelta; <code class="ic">&lt;&lt;</code> muta el que ya existe. Reproduce la corrida y fíjate en el <b>warmup</b>: no es adorno, es la fase donde el <a href="#/jit">JIT</a> compila y las <a href="#/caches">cachés</a> se llenan.',
      code: '<span class="tok-kw">require</span> <span class="tok-str">"benchmark/ips"</span>\n\nBenchmark.<span class="tok-fn">ips</span> <span class="tok-kw">do</span> |x|\n  x.<span class="tok-fn">report</span>(<span class="tok-str">"+="</span>) { s = <span class="tok-str">""</span>; <span class="tok-num">100</span>.times { s += <span class="tok-str">"x"</span> } }\n  x.<span class="tok-fn">report</span>(<span class="tok-str">"&lt;&lt;"</span>) { s = <span class="tok-str">""</span>; <span class="tok-num">100</span>.times { s &lt;&lt; <span class="tok-str">"x"</span> } }\n  x.<span class="tok-fn">compare!</span>\n<span class="tok-kw">end</span>',
      nota: "Los números ilustran el FORMATO de benchmark-ips, no un benchmark real — corre la gema en tu máquina para los tuyos.",
      impls: [
        { key: "concat", label: 's += "x"', sub: "crea un String nuevo por vuelta", ips: 118400, dev: 4.8 },
        { key: "shovel", label: 's << "x"', sub: "muta el mismo String", ips: 892300, dev: 1.9 }
      ],
      steps: [
        { fase: "listo",  text: "Dos reports, el mismo trabajo: armar un String de 100 caracteres. benchmark-ips va a calentar primero y medir después." },
        { fase: "warmup", text: "Warmup, segundo 1: las primeras vueltas corren interpretadas. El JIT apenas está viendo qué código se repite.", vals: [64200, 512800] },
        { fase: "warmup", text: "Warmup, segundo 2: el JIT ya compiló los bloques calientes y los inline caches están llenos. Las vueltas ahora corren en código máquina.", vals: [109800, 843500] },
        { fase: "warmup", text: "Fin del warmup: benchmark-ips descarta todos estos números. Solo sirvieron para que el motor llegara a su estado estable.", vals: [117600, 887100] },
        { fase: "mide",   text: "Medición, segundo 1: ahora sí cuentan. Cada vuelta suma al total de iteraciones por segundo.", vals: [117900, 889400] },
        { fase: "mide",   text: "Medición, segundo 2: << se despega. Mutar el mismo String no aloca nada nuevo; += fabrica un objeto por vuelta y se lo regala al GC.", vals: [118700, 891800] },
        { fase: "mide",   text: "Medición, segundo 3: los números ya casi no se mueven. Esa estabilidad es la señal de que la medición vale.", vals: [118400, 892300] },
        { fase: "fin",    text: "Veredicto: << sale ~7.5 veces más rápido, con desviación chica en ambos. Así se lee un compare! de benchmark-ips." }
      ]
    },

    callout: { tag: "Mito", text: '«Corro el código mil veces, tomo el tiempo, y ya». Sin warmup no mediste tu código: mediste el arranque — el <a href="#/jit">JIT</a> compilando y las <a href="#/caches">cachés</a> llenándose en frío. Por eso benchmark-ips calienta primero y descarta esos números; una medición que no lo hace trae el arranque del motor revuelto en el promedio.' },

    recursos: [
      { title: "stackprof · vernier", note: "profilers de muestreo; vernier es el sucesor moderno", url: "https://github.com/jhawthorn/vernier" },
      { title: "benchmark-ips", note: "el que este widget imita: warmup + iteraciones/seg", url: "https://github.com/evanphx/benchmark-ips" },
      { title: "Docs de YJIT · métricas", note: "RubyVM::YJIT.runtime_stats y qué significa cada llave", url: "https://docs.ruby-lang.org/en/3.4/yjit/yjit_md.html" }
    ]
  };

})(window.GUIA = window.GUIA || {});
