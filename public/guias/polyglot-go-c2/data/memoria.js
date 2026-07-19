/* data/memoria.js — Bloque 3 · Memoria y runtime. */
(function (G) {
  "use strict";
  G.registerBlock({ id: "memoria", label: "Bloque 3 · Memoria y runtime", short: "Memoria", accent: "var(--fam-mem)" });

  G.registerTopics([
    {
      slug: "gc-tricolor", folio: "08", block: "memoria", difficulty: 3, star: true,
      title: "Garbage Collector tricolor concurrente", shortTitle: "GC",
      tagline: "Marca la basura mientras tu programa sigue corriendo, con write barriers y pacer.",
      avoid: "Esperar un GC generacional o de máximo throughput: aquí manda la latencia.",
      lede: "El GC de Go libera memoria sin detener el mundo: marca la basura <em>mientras tu programa sigue corriendo</em>. Su prioridad no es el throughput, son las pausas cortísimas.",
      fuerza: { icon: "recycle", html: "Un «stop-the-world» que pause tu servidor decenas de milisegundos es inaceptable en producción. El GC tricolor concurrente marca en paralelo con el mutator y solo detiene todo en dos micro-pausas que el runtime mantiene por debajo del milisegundo (en heaps sanos suelen quedar en decenas de&nbsp;µs)." },
      legend: [
        { color: "var(--tri-white)", border: "var(--tri-edge)", html: "<strong>Blanco</strong> — candidato a basura" },
        { color: "var(--tri-gray)", border: "var(--tri-edge)", html: "<strong>Gris</strong> — vivo, pendiente de escanear" },
        { color: "var(--tri-black)", border: "var(--tri-edge)", html: "<strong>Negro</strong> — vivo y ya escaneado" }
      ],
      brief: [
        "Tricolor: blanco (basura) · gris (por escanear) · negro (vivo).",
        "Concurrente: marca a la vez que tu programa corre.",
        "Write barrier: mantiene el invariante durante el marcado.",
        "No es generacional; el pacer (GOGC) decide cuándo arrancar."
      ],
      mito: { claim: "El GC de Go es generacional como el de la JVM, y subirle a GOGC lo hace más rápido.", body: "Dos creencias, ninguna cierta. <strong>No es generacional</strong>: es un mark-and-sweep concurrente tricolor, sin espacios por edad ni copia de sobrevivientes. Lo intentaron y no salió a cuenta — con el <em>escape analysis</em> dejando en la pila los objetos de vida corta, la «generación joven» que la JVM exprime aquí llega medio vacía. Y <code>GOGC</code> no es un acelerador: mueve el trade-off entre RAM y CPU. Subirlo te da menos ciclos a cambio de un heap más grande, y <code>GOGC=off</code> no apaga el costo, apaga el freno: el heap crece hasta donde aguante la máquina. Si lo que quieres es un techo, ese es <code>GOMEMLIMIT</code> (Go 1.19+), no apagar el GC." },
      recursos: [
        { star: true, title: "A Guide to the Go Garbage Collector", desc: "documento oficial — la mejor referencia del GC y el pacer.", kind: "doc", href: "https://go.dev/doc/gc-guide" },
        { star: true, title: "Garbage Collection in Go (I–III)", desc: "Ardan Labs — semántica, latencia y pacing.", kind: "blog", href: "https://www.ardanlabs.com/blog/2018/12/garbage-collection-in-go-part1-semantics.html" },
        { star: false, title: "Getting to Go: The Journey of Go's Garbage Collector", desc: "el keynote de Rick Hudson — tricolor, write barrier y la historia de las pausas.", kind: "blog", href: "https://go.dev/blog/ismmkeynote" }
      ],
      viz: {
        title: "Visualízalo · marca & barrido con write barrier",
        pacerTitle: "El pacer · <code>GOGC</code> decide cuándo arrancar",
        notes: [
          { html: "Las raíces (las pilas de las goroutines y las variables globales) empiezan grises. El GC toma un gris, lo <strong>ennegrece</strong> y pinta grises sus hijos blancos. Al no quedar grises, lo blanco es basura y se barre. <strong>Apaga la write barrier</strong> y observa: si el programa conecta un objeto vivo <em>durante</em> el marcado, el GC no se entera y lo recolecta por error." },
          { html: "El GC arranca cuando el heap ha crecido <code>GOGC%</code> desde el tamaño vivo tras el último ciclo. <strong>Más alto</strong> = menos ciclos, más CPU libre, más RAM. <strong>Más bajo</strong> = GC frecuente, menos RAM. No es generacional: no separa objetos jóvenes de viejos." }
        ]
      }
    },

    {
      slug: "allocator-mcache", folio: "09", block: "memoria", difficulty: 3, star: false,
      title: "El allocator: mcache, mcentral, mheap", shortTitle: "Allocator",
      tagline: "Estilo tcmalloc: cachés por-P para que asignar objetos pequeños sea casi gratis.",
      avoid: "Suponer que cada objeto pide memoria al SO.",
      lede: "Pedir memoria al SO en cada <code>new</code> sería lento. Go tiene su propio allocator estilo tcmalloc, con una caché <em>por-P</em> para que asignar objetos pequeños sea casi gratis.",
      fuerza: { icon: "box", html: "La contención entre goroutines al reservar memoria mataría la escalabilidad. La solución: cada P tiene su propio <strong>mcache</strong> sin locks. Solo cuando ese nivel local se agota se baja al <strong>mcentral</strong> compartido, y solo si ese también, al <strong>mheap</strong> global que pide al SO." },
      brief: [
        "Jerarquía tcmalloc: mcache → mcentral → mheap.",
        "mcache por-P sin locks: el camino rápido escala lineal.",
        "Objetos ≤32 KB se redondean a una size class.",
        "Tiny allocator: junta objetos <16 B sin punteros en un bloque."
      ],
      recursos: [
        { star: true, title: "goperf.dev — Memory & GC patterns", desc: "patrones prácticos para reducir asignaciones.", kind: "guía", href: "https://goperf.dev/01-common-patterns/gc/" },
        { star: false, title: "runtime/malloc.go", desc: "comentario de cabecera: la jerarquía mcache/mcentral/mheap de primera mano.", kind: "código", href: "https://github.com/golang/go/blob/master/src/runtime/malloc.go" }
      ],
      viz: {
        title: "Visualízalo · el camino de una asignación",
        options: [{ value: "small", label: "48 B" }, { value: "medium", label: "2 KB" }, { value: "large", label: ">32 KB" }],
        notes: [
          { html: "Los objetos <strong>pequeños</strong> (≤32 KB) se redondean a una <em>size class</em> (cajones de tamaño fijo) y se sirven del <strong>mcache</strong> local. Si el span de esa clase está vacío, se rellena desde el <strong>mcentral</strong>; si tampoco hay, el <strong>mheap</strong> parte memoria nueva. Los objetos <strong>grandes</strong> saltan directos al mheap." },
          { faint: true, html: "Hay además un <strong>tiny allocator</strong>: los objetos diminutos (&lt;16 B) que no contienen punteros se empaquetan juntos en un mismo bloque del mcache, para no desperdiciar una size class entera por cada uno." },
          { html: "<strong>Por qué importa:</strong> el «camino rápido» (mcache) no toca locks, así que reservar objetos pequeños escala linealmente con los núcleos. Reducir asignaciones —reusando buffers, con <code>sync.Pool</code> o pre-reservando slices— mantiene el trabajo en ese nivel local y aligera además al GC." }
        ]
      }
    },

    {
      slug: "stacks-goroutine", folio: "10", block: "memoria", difficulty: 2, star: false,
      title: "Stacks de goroutine que crecen", shortTitle: "Stacks",
      tagline: "Arrancan con ~2KB y se redimensionan solas: por eso caben millones.",
      avoid: "Confundirlas con las viejas segmented stacks (hot-split).",
      lede: "Cada goroutine arranca con ~2 KB de pila. ¿Y si anida profundo? La pila <em>crece y encoge sola</em> — por eso puedes tener millones de goroutines sin reservar megas para cada una.",
      fuerza: { icon: "stacks", html: "Un hilo del SO reserva 1–8 MB de pila fija: tener un millón sería imposible. Go arranca cada goroutine con una pila diminuta y, al detectar que hace falta más, asigna una pila mayor, copia el contenido y ajusta los punteros. Ese truco es lo que hace viable la concurrencia masiva." },
      infoCards: { layout: 2, items: [
        { kv: "goroutine", big: "~2 KB → crece", accent: "var(--role-service)", body: "Millones caben en memoria; la pila se ajusta a lo que cada una realmente usa." },
        { kv: "hilo del SO", big: "1–8 MB fijos", accent: "var(--fam-comp)", body: "Reservados de golpe. Unos miles y ya comprometes gigas de dirección." }
      ] },
      brief: [
        "Cada goroutine arranca con ~2 KB de pila.",
        "Stack check al entrar: si el marco no cabe, GROW al doble.",
        "Grow = copiar marcos a una pila nueva y reajustar punteros.",
        "Pilas contiguas (adiós segmented stacks y su hot-split)."
      ],
      recursos: [
        { star: true, title: "Why is a goroutine's stack infinite?", desc: "Dave Cheney — el crecimiento de pila explicado con claridad.", kind: "blog", href: "https://dave.cheney.net/2013/06/02/why-is-a-goroutines-stack-infinite" },
        { star: false, title: "A Guide to the Go GC", desc: "menciona el papel de las pilas en el escaneo de raíces.", kind: "doc", href: "https://go.dev/doc/gc-guide" }
      ],
      viz: {
        title: "Visualízalo · grow & copy al entrar en recursión",
        notes: [
          { html: "Al entrar a cada función hay un <strong>stack check</strong>: si el nuevo marco no cabe, el runtime asigna una pila del <strong>doble</strong>, <em>copia</em> los marcos existentes y reescribe los punteros que apuntaban a la pila vieja. Las pilas son <strong>contiguas</strong> (antes eran segmentadas, cambiadas por el «hot split problem»)." }
        ]
      }
    }
  ]);

})(window.GUIA = window.GUIA || {});
