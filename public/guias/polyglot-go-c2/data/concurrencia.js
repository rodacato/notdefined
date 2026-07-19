/* data/concurrencia.js — Bloque 2 · Concurrencia. */
(function (G) {
  "use strict";
  G.registerBlock({ id: "concurrencia", label: "Bloque 2 · Concurrencia", short: "Concurrencia", accent: "var(--fam-conc)" });

  G.registerTopics([
    {
      slug: "scheduler-gmp", folio: "05", block: "concurrencia", difficulty: 3, star: true, featured: true,
      title: "Goroutines y el scheduler GMP", shortTitle: "Scheduler",
      tagline: "El corazón de Go: millones de goroutines multiplexadas sobre pocos hilos, con work-stealing.",
      avoid: "Tratar una goroutine como si fuera un hilo del SO.",
      featuredBlurb: "El corazón de Go: millones de goroutines multiplexadas sobre pocos hilos. Mira las colas de cada <strong>P</strong>, los hilos <strong>M</strong> ejecutando, y el <em>work-stealing</em> repartir la carga — con un slider de <code>GOMAXPROCS</code>.",
      lede: "Una goroutine no es un hilo del SO: arranca con ~2&nbsp;KB y puedes tener millones. El truco es el scheduler <em>M:N</em>, que multiplexa muchas goroutines sobre pocos hilos.",
      fuerza: { icon: "hub", html: "Un hilo del SO cuesta 1–8&nbsp;MB y cambiar de contexto pasa por el kernel. Go pone su propio scheduler <em>en tu binario</em> para repartir goroutines baratísimas sobre esos hilos sin salir a llamar al SO." },
      infoCards: { layout: 3, items: [
        { glyph: "G", accent: "var(--fam-conc)", title: "Goroutine", body: "La tarea. Barata, con su propia pila que crece sola." },
        { glyph: "M", accent: "var(--fam-comp)", title: "Machine", body: "Un hilo real del SO. Necesita un P para ejecutar código Go." },
        { glyph: "P", accent: "var(--role-gateway)", title: "Processor", body: "Recurso lógico (hay <code>GOMAXPROCS</code>) con su cola local de goroutines." }
      ] },
      brief: [
        "Modelo M:N — muchas goroutines sobre pocos hilos (M).",
        "Cada P tiene cola local sin locks; hay GOMAXPROCS P.",
        "Work-stealing: un P ocioso roba la mitad de otro.",
        "La cola global (GRQ) es la red de seguridad."
      ],
      mito: { claim: "Una goroutine es un hilo ligero.", body: "No lo es. Un hilo lo agenda el kernel; una goroutine la agenda el runtime de Go <em>en espacio de usuario</em>, sin cruzar al SO. Por eso lanzar un millón de goroutines es viable y lanzar un millón de hilos, no. El paralelismo real lo pone <code>GOMAXPROCS</code>: tantas goroutines corriendo <em>a la vez</em> como P haya." },
      recursos: [
        { star: true, title: "The Scheduler Saga", desc: "Kavya Joshi (GopherCon 2018) — construye el scheduler GMP desde cero.", kind: "video", href: "https://www.youtube.com/watch?v=YHRO5WQGh0k" },
        { star: true, title: "Scheduling in Go (I–III)", desc: "Bill Kennedy / Ardan Labs — la serie más didáctica.", kind: "blog", href: "https://www.ardanlabs.com/blog/2018/08/scheduling-in-go-part1.html" },
        { star: false, title: "Scalable Go Scheduler Design Doc", desc: "Dmitry Vyukov — la fuente primaria.", kind: "doc", href: "https://golang.org/s/go11sched" }
      ],
      viz: {
        title: "Visualízalo · el scheduler en marcha",
        notes: [
          { html: "Cada <strong>P</strong> ejecuta la goroutine de la cabeza de su cola local (sin locks). Cuando una cola local se vacía, ese P <strong>roba la mitad</strong> de la cola de otro P — <em>work-stealing</em>. La cola global es la red de seguridad. Sube <code>GOMAXPROCS</code> y verás repartirse el trabajo entre más P." },
          { faint: true, html: "Desde Go 1.25 el valor por defecto de <code>GOMAXPROCS</code> es <em>container-aware</em>: respeta el límite de CPU del cgroup en vez de contar todos los núcleos de la máquina." }
        ]
      }
    },

    {
      slug: "channels-select", folio: "06", block: "concurrencia", difficulty: 2, star: true,
      title: "Channels y select (CSP)", shortTitle: "Channels",
      tagline: "Comparte memoria comunicando: tuberías tipadas que sincronizan sin locks explícitos.",
      avoid: "Usar channels donde un simple mutex sería más claro.",
      lede: "No te comuniques compartiendo memoria; comparte memoria comunicando. Un channel es una tubería tipada que pasa datos <em>y</em> sincroniza — sin locks explícitos.",
      fuerza: { icon: "swap", html: "Coordinar goroutines con mutex y variables compartidas es frágil y difícil de razonar. El channel invierte el problema: el <em>dato</em> viaja por la tubería y la sincronización sale gratis del propio envío/recepción." },
      brief: [
        "Un channel pasa datos Y sincroniza a la vez.",
        "cap 0: el envío es una cita (rendezvous) con el receptor.",
        "Con buffer, los envíos caben sin receptor… hasta llenarse.",
        "select con varias ramas listas elige una al azar."
      ],
      recursos: [
        { star: true, title: "Understanding Channels", desc: "Kavya Joshi (GopherCon 2017) — los channels por dentro y su relación con el scheduler.", kind: "video", href: "https://www.youtube.com/watch?v=KBZlN0izeiY" },
        { star: true, title: "Effective Go — Concurrency", desc: "la fuente oficial del modelo CSP en Go.", kind: "doc", href: "https://go.dev/doc/effective_go#concurrency" },
        { star: false, title: "Concurrency in Go", desc: "Katherine Cox-Buday (O'Reilly) — el texto de referencia.", kind: "libro", href: "https://www.oreilly.com/library/view/concurrency-in-go/9781491941294/" }
      ],
      viz: {
        titleA: "Visualízalo · envío, recepción y bloqueo",
        titleB: "Visualízalo · <code>select</code> espera sobre varios a la vez",
        selectCode: "select {\ncase v := &lt;-ch1:\n    use(v)\ncase v := &lt;-ch2:\n    use(v)\ncase ch3 &lt;- x:\n    sent()\ndefault:\n    // nada listo\n}",
        notes: [
          { html: "Con <strong>cap 0</strong> (sin buffer) un envío se <em>bloquea</em> hasta que alguien recibe: es una cita (rendezvous). Sube el buffer y los envíos caben sin receptor… hasta que se llena. El runtime aparca la goroutine bloqueada y la despierta cuando aparece la contraparte." },
          { html: "<code>select</code> se bloquea hasta que <em>alguna</em> rama pueda avanzar. Si varias están listas, elige una <strong>al azar</strong> (para evitar inanición). Con <code>default</code>, no se bloquea: si nada está listo, sigue de largo." }
        ]
      }
    },

    {
      slug: "preempcion-netpoller", folio: "07", block: "concurrencia", difficulty: 3, star: false,
      title: "Preempción, sysmon y netpoller", shortTitle: "Preempción",
      tagline: "Por qué ninguna goroutine acapara un hilo y la I/O de red no bloquea todo.",
      avoid: "Pensar que un <code>for{}</code> puede colgar el scheduler (ya no, desde 1.14).",
      lede: "¿Y si una goroutine hace un <code>for {}</code> infinito, o llama a la red, o bloquea en una syscall? El runtime evita que <em>ninguna</em> acapare un hilo. Sin esto, «millones de goroutines» sería mentira.",
      fuerza: { icon: "shield", html: "Un scheduler cooperativo puro se cuelga si una goroutine nunca cede. Y una syscall o una lectura de red bloqueante congelaría el hilo del SO que la ejecuta, dejando ociosas las demás goroutines. El runtime tiene tres defensas: preempción asíncrona, netpoller y desacople del P en syscalls." },
      brief: [
        "Preempción asíncrona (1.14): sysmon envía SIGURG tras >10 ms.",
        "Netpoller: la I/O de red aparca la goroutine y libera el M.",
        "Syscall bloqueante: el P se desacopla y otro M lo toma.",
        "Sin esto, un for{} o una lectura colgarían un hilo entero."
      ],
      recursos: [
        { star: true, title: "Scheduling in Go, Part II & III", desc: "Ardan Labs — syscalls, netpoller y desacople del P.", kind: "blog", href: "https://www.ardanlabs.com/blog/2018/08/scheduling-in-go-part2.html" },
        { star: false, title: "The Go netpoller", desc: "Morsing — cómo la I/O de red no bloquea el hilo.", kind: "blog", href: "https://morsmachine.dk/netpoller" }
      ],
      viz: {
        title: "Visualízalo · elige el escenario",
        options: [{ value: "preempt", label: "preempción (SIGURG)" }, { value: "net", label: "netpoller" }, { value: "syscall", label: "syscall bloqueante" }],
        scenarios: {
          preempt: [
            "G1 lleva mucho en CPU sobre M1 (bucle sin puntos de cesión).",
            "sysmon detecta >10 ms y envía SIGURG a M1.",
            "La señal interrumpe a G1 en un punto seguro: se aparca y va a la cola.",
            "M1 toma la siguiente goroutine (G2). Ninguna acapara el hilo."
          ],
          net: [
            "G1 hace una lectura de red bloqueante sobre M1.",
            "En vez de bloquear el M: G1 se registra en el netpoller (epoll) y se aparca.",
            "M1 queda LIBRE y toma otra goroutine lista (G2) del P.",
            "Cuando el dato llega, el netpoller marca G1 lista; vuelve a la cola."
          ],
          syscall: [
            "G1 hace una syscall bloqueante (p. ej. leer un archivo) sobre M1.",
            "M1 se bloquea en el kernel con G1.",
            "El runtime DESACOPLA el P de M1 y se lo entrega a otro hilo M2.",
            "M2 sigue ejecutando las demás goroutines del P. Al volver, M1 busca un P."
          ]
        },
        notes: [
          { html: "<strong>Preempción:</strong> desde Go 1.14 <code>sysmon</code> envía <code>SIGURG</code> para cortar goroutines que llevan &gt;10 ms en CPU (antes solo había puntos cooperativos). <strong>Netpoller:</strong> la I/O de red aparca la goroutine y libera el M (epoll/kqueue/IOCP). <strong>Syscall:</strong> si un M se bloquea, su P se desacopla y otro M lo toma para seguir ejecutando goroutines." }
        ]
      }
    }
  ]);

})(window.GUIA = window.GUIA || {});
