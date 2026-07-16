---
title: 'Ver tu sitio con otros ojos'
description: 'Construí un simulador de condiciones visuales para auditar mi propio blog. Pasó casi todo — y no por virtuoso. Lo único que reprobó fue el consejo que yo mismo di en otro post.'
pubDate: 2026-07-15
tags: ['a11y', 'accesibilidad', 'svg', 'css', 'astro']
draft: true
---

## TL;DR

- Construí [un lab](/lab/a11y) para ver este blog con otros ojos: daltonismo, visión baja, cataratas, glaucoma, degeneración macular, y un modo sin visión con lector de voz.
- La accesibilidad no es un feature que agregas al final. Es una propiedad de haber hecho bien lo básico.
- Mi blog pasó casi todo, y no porque yo lo trabajara. Pasó porque usé HTML semántico y no me puse creativo. Los frameworks son tus amigos.
- Lo que reprobó fue justo el consejo que **yo mismo escribí** en el post de Stitch: "no te escondas detrás de colores". Mi portada se escondía detrás del color. Links a **1.09:1** contra el texto.
- Las matrices de daltonismo que copias de internet están mal. Las buenas son las de Machado et al. (2009) y van en **RGB lineal**.
- De las 4 barreras reales que encontré, **3 ya estaban resueltas en mi propio repo** y nunca las subí a global.

---

## Por qué me metí en esto

<!-- Adrian: este párrafo es tuyo, yo solo dejo el andamio con lo que me diste.
Corrígelo hasta que suene a ti — es la única parte que no puedo escribir.
Lo que me contaste: la vista se desgasta de tanta pantalla, años acumulados,
y eso te llevó a preguntarte cómo sería tu mundo con una condición así. -->

Llevo 17 años viendo pantallas. La vista se desgasta — eso no es noticia para nadie que haga esto. Lo que sí me movió el tapete fue la pregunta que vino después: **¿cómo sería mi mundo si esto no se corrige con lentes?**

Y de ahí, la que de verdad importa: ¿qué diferencia puedo hacer yo, desde lo único que sé hacer?

Así que en vez de leer otra checklist de WCAG, construí algo para **verlo**.

---

## El lab

[`/lab/a11y`](/lab/a11y) carga un sitio en un iframe y le aplica una condición visual encima. Por default carga este post, porque el home de mi blog no tiene suficientes cosas que romper.

Ocho modos: protanomalía, deuteranomalía, tritanomalía, visión baja, cataratas, visión de túnel, degeneración macular, y sin visión.

El slider no dice "60%". Dice **"catarata madura"**, **"glaucoma severo"**, **"deuteranopia"** — porque un porcentaje abstracto no significa nada. Cada condición trae los estadios de una escala clínica publicada: LOCS III para cataratas, Hodapp-Parrish-Anderson para glaucoma, la clasificación de agudeza de la OMS para visión baja, AREDS para mácula. Están todas citadas en el propio lab.

Ojo con esto, que es donde casi meto la pata: quise poner percentiles ("de los que tienen cataratas, tal % está en este nivel"). **Ese dato no existe limpio.** Los estudios reportan prevalencia total, no distribución por estadio. Encontré un número así para glaucoma —25/40/35— y era de un solo estudio de 100 ojos. Inventar el resto habría sido justo el tipo de humo que este lab jura no vender. Donde no hay dato, el lab lo dice.

---

## El playground: cosas rotas a propósito

Lo que sigue está **roto intencionalmente**. No es que se me haya olvidado arreglarlo: son los ejemplos que uso para el simulador. Cada uno describe en texto qué se rompe, porque si estás leyendo esto con un lector de pantalla, la falla visual no te llega — y sería bien irónico que el post sobre ceguera te dejara fuera justo aquí.

### La paleta que se colapsa

Cuatro colores obvios con visión típica. Bajo **deuteranomalía al 100%**, el rojo, el verde y el café se vuelven prácticamente el mismo tono mostaza-café; el naranja apenas se despega.

<div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin:1rem 0;">
  <div style="width:7rem;height:4.5rem;border-radius:0.5rem;background:#e74c3c;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.75rem;padding-bottom:0.4rem;">#e74c3c rojo</div>
  <div style="width:7rem;height:4.5rem;border-radius:0.5rem;background:#27ae60;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.75rem;padding-bottom:0.4rem;">#27ae60 verde</div>
  <div style="width:7rem;height:4.5rem;border-radius:0.5rem;background:#e67e22;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.75rem;padding-bottom:0.4rem;">#e67e22 naranja</div>
  <div style="width:7rem;height:4.5rem;border-radius:0.5rem;background:#795548;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.75rem;padding-bottom:0.4rem;">#795548 café</div>
</div>

### El semáforo de estados

El dashboard clásico que comunica todo con color:

<div style="display:flex;gap:0.6rem;flex-wrap:wrap;margin:1rem 0;">
  <span style="background:#27ae60;color:#fff;border-radius:999px;padding:0.35rem 1rem;font-size:0.8rem;">deploy ok</span>
  <span style="background:#f1c40f;color:#fff;border-radius:999px;padding:0.35rem 1rem;font-size:0.8rem;">tests lentos</span>
  <span style="background:#e74c3c;color:#fff;border-radius:999px;padding:0.35rem 1rem;font-size:0.8rem;">prod caído</span>
</div>

Aquí hice trampa a mi favor: las pastillas llevan texto, así que un lector de pantalla te salva. **El que se jode es el daltónico que ve la pantalla**: bajo protanopia, "deploy ok" y "prod caído" son la misma pastilla parduzca. Si tu dashboard solo tuviera los puntitos de color sin la palabra, ese usuario no tendría nada. Un ícono al lado del color, o la palabra, y ya. Es gratis.

### El link que solo es link por su color

<p style="color:#444;line-height:1.7;">
En este párrafo hay <span style="color:#c0392b;">una liga importante</span> que solo se distingue por el color, sin subrayado. Con visión típica brinca. Con daltonismo rojo-verde es texto normal — desaparece como link.
</p>

Guárdate este, porque en un rato me lo voy a comer yo.

### La gráfica que depende de la leyenda

Cuatro barras que solo el color diferencia. Bajo cualquier daltonismo rojo-verde, "ingresos" y "gastos" son la misma barra: no puedes leerla, y ninguna lupa te ayuda.

<div style="margin:1rem 0;">
  <div style="display:flex;align-items:end;gap:1.25rem;height:9rem;">
    <div style="width:3.5rem;height:85%;background:#27ae60;border-radius:0.3rem 0.3rem 0 0;"></div>
    <div style="width:3.5rem;height:60%;background:#e74c3c;border-radius:0.3rem 0.3rem 0 0;"></div>
    <div style="width:3.5rem;height:45%;background:#f39c12;border-radius:0.3rem 0.3rem 0 0;"></div>
    <div style="width:3.5rem;height:70%;background:#8e6e4e;border-radius:0.3rem 0.3rem 0 0;"></div>
  </div>
  <p style="font-size:0.8rem;color:#666;margin-top:0.5rem;">Leyenda: verde = ingresos · rojo = gastos · naranja = deuda · café = ahorro. Sin patrones, sin etiquetas directas. Suerte.</p>
</div>

### El texto que castiga

<p style="font-size:11px;color:#999;line-height:1.5;">
Este párrafo está en 11px y gris claro sobre blanco: contraste ~2.8:1, cuando WCAG pide 4.5:1. Con visión típica ya es incómodo. Súbele visión baja o cataratas en el lab y desaparece. Así se ven los disclaimers legales, los footers, y —seamos honestos— la mitad de los captions de internet.
</p>

### Y el que no se arregla con contraste

Con **visión de túnel** o **degeneración macular** al máximo, intenta leer este párrafo de arriba a abajo sin perderte. Aquí ninguna regla de contraste te salva: el campo visual que das por hecho es el que organiza la lectura. Sin periferia no sabes dónde sigue la línea; sin centro no hay dónde enfocar. Lo único que ayuda es estructura — headings seguidos, párrafos cortos, una columna. Nada de eso está en un checklist de color.

---

## Lo que midió: mi hipótesis estaba mal

Yo iba con una teoría bien armada: *"mi verde terminal va a reprobar bajo deuteranopia, porque el daltonismo rojo-verde es el más común y ahí va a tronar mi marca"*.

Dos problemas con esa teoría.

El primero: **mi accent no es verde**. Es `oklch(52% 0.22 275)`, o sea `#4c4ee4`, un índigo. Llevaba meses con él en la cara. Debí leer mis propios tokens antes de teorizar.

El segundo: **no reprobó**. Y por una razón que no tiene nada de mérito — el índigo vive en el matiz 275, que no depende de discriminación rojo-verde. A un protán o a un deután el azul-violeta les llega casi igual.

Corrí los tokens a mano: oklch → sRGB lineal, matriz de Machado encima, luminancia, ratio WCAG.

| Par | Normal | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|
| Texto / fondo | 19.83 | 19.80 | 19.84 | 19.82 |
| Texto tenue / fondo | 6.44 | 6.37 | 6.48 | 6.43 |
| Links / fondo | 5.88 | **4.88** | 5.69 | 5.19 |
| Blanco / botón accent | 5.96 | 4.95 | 5.77 | 5.27 |

El daltonismo casi no mueve la aguja. Lo único filoso: los links pasan AA **por un pelo** bajo protanopia — 4.88 contra 4.5 requerido. Un tono más claro y truenan.

O sea: mi color de marca no falla, pero no fue decisión de accesibilidad. Fue suerte con buen gusto.

(Nota de entorno, por honestidad: Lighthouse ni corrió. Node v20.3.1, el mismo Node viejo que me tumba `check:links` desde el post de GA4. No es hallazgo de a11y, es mi máquina.)

---

## La cita que me delató

Aquí está la parte incómoda.

En el post de [Google Stitch](/blog/google-stitch-diseno-para-devs-que-no-son-disenadores/) escribí este consejo, palabras mías:

> *"diseña en escala de grises primero. Te obliga a crear jerarquía con spacing y contraste, no escondiéndote detrás de colores."*

¿Y qué tenía mi portada? Los links del hero en índigo, dentro de un párrafo gris, **sin subrayado**.

Corre los números: el accent y el texto tenue tienen casi la misma luminosidad —52% contra 48%—. Lo único que los separa es el matiz. Contraste entre link y texto: **1.09:1**. WCAG pide 3:1 para links dentro de un bloque de texto, o una pista que no sea color.

En escala de grises, esos links no existen. Para alguien con protanopia, tampoco.

Yo di el consejo. En mi blog. Y no lo seguí en mi propia portada — la primera pantalla que ve cualquiera que llega. Lo peor: ya tenía el patrón bueno en el repo. `.prose a` subraya con `text-decoration-color` desde hace meses. El hero nada más... optó por salirse.

No mames.

---

## Las 4 cosas que los frameworks no te dan gratis

Aquí es donde la tesis se sostiene o se cae, así que vamos con datos.

Audité el sitio completo. Las categorías que suelen doler **pasaron todas**, y no porque yo les hubiera dedicado un sprint:

- Cero `<div onclick>`. Todo lo clickeable es `<button>` o `<a href>`.
- Cero inputs sin label.
- Landmarks reales (`header`, `nav`, `main`, `footer`), no divs disfrazados.
- `lang="es"` puesto.
- Ningún focus ring destruido.
- Los íconos solitarios ya traían `aria-label`.

Eso me lo dio la plataforma. Un `<button>` ya es focusable, ya responde a Enter, ya se anuncia como botón. Los radios del propio lab se navegan con flechas y yo no escribí una línea para eso. **Por eso digo que los frameworks son tus amigos**: cada `<div onclick>` que escribes es reimplementar a mano, y peor, algo que ya tenías.

Pero hay cuatro cosas que ningún default te regala. Y las cuatro pegan justo donde más duele — a alguien que no ve:

**Un skip link.** No tenía. Un usuario de teclado se comía 6 o 7 tabs por el header sticky —marca, buscador, cuatro links de nav— antes de tocar el contenido. En cada navegación. Cada vez.

**Una live region.** El buscador escribía "3 resultados" en un `<p>` mudo. Con lector de pantalla escribías y no pasaba nada: ni el conteo, ni el "nada para «xyz»". El contenido cambiaba abajo en silencio absoluto.

**Una pista que no sea color.** Los links del hero. Ya sabes esa historia.

**Un guard de motion.** El parallax de la landing corría aunque el sistema pidiera `prefers-reduced-motion`. Y el detalle que me dio más pena: el layout **ya calculaba** `reduceMotion` 60 líneas más arriba, para el efecto del konami code. La variable estaba ahí, en scope. El parallax nomás no la usaba.

¿Ves el patrón? De esas cuatro, **tres ya estaban resueltas en mi propio código**: `.prose a` subrayaba, el lab usaba `aria-live`, `BaseLayout` calculaba `reduceMotion`. No era que el sitio fuera inaccesible. Era que los patrones buenos nunca subieron a global.

---

## Simular ceguera me quedó grande

El modo 9 del lab apaga la pantalla y te deja con un lector de voz casero. Recorre el DOM, narra con `speechSynthesis`, y usa las teclas de NVDA: flechas para leer, `H` para saltar encabezados, `K` para enlaces, `Enter` para seguir un link.

Le puse una caption en vivo sobre el negro — muestra lo que se está narrando. La idea es que **un vidente vea lo que un ciego oiría**. Terminó siendo lo más útil del lab.

Dos cosas que el lab confiesa en su propia cara:

**Solo funciona con este sitio.** La Same-Origin Policy sella el DOM de un iframe de otro origen. Los filtros visuales aplican a cualquier URL que cargue —trabajan sobre la caja renderizada, no necesitan el DOM—, pero el lector necesita leer el texto. Con una URL externa, el modo se apaga y te explica por qué.

**No es un screen reader.** NVDA y VoiceOver tienen rotor, modo formularios, verbosidad configurable, décadas de heurísticas encima. Lo mío es una aproximación para que alguien que ve sienta el problema. Ponerle otro nombre sería mentir.

Aquí hay un detalle que me hizo click mientras lo construía: la tecla `H` salta encabezados. Si tu página va de `h1` a `h3`, esa navegación se rompe. **El orden de headings no es cosmético — es la navegación de alguien.** Yo tenía tres saltos así, en el índice de labs, en drafts, y en los resultados del buscador.

<!-- Adrian: aquí va el cierre del arco — probar el blog con VoiceOver real
(macOS, ya lo tienes) y documentar qué tan lejos quedó el lector casero.
Sin ese dato la sección se queda a medias. -->

---

## Las matrices que copias de internet están mal

Si buscas "colorblind simulation css" te vas a encontrar una `feColorMatrix` que alguien copió de alguien que la copió de un blog de 2013. Casi siempre están mal.

Las buenas son las de **Machado, Oliveira & Fernandes (2009)**, que modelan el desplazamiento de sensibilidad de los conos y están validadas contra observadores reales. Vienen por severidad, de 0 a 1 en pasos de 0.1.

Y traen un detalle que la mitad de los simuladores se salta: **operan en RGB lineal**. SVG usa `linearRGB` por default en `feColorMatrix`, pero yo lo dejé explícito porque no quiero depender de un default:

```html
<filter id="cvd" color-interpolation-filters="linearRGB">
  <feColorMatrix id="cvd-matrix" type="matrix" values="..." />
</filter>
```

Aplicarlas en sRGB te da colores plausibles y equivocados. Se ve bonito, miente.

Un caveat que va aquí y no en letra chiquita: **la severidad de Machado no es una medida clínica**. Es un parámetro de renderizado, validado psicofísicamente, pero no equivale al rango de un anomaloscopio. Cuando el slider dice "anómalo moderado", es un mapeo conceptual mío, no un diagnóstico. Lo digo en el lab también.

---

## Qué arreglé

Todo lo de arriba, en un commit:

| Categoría | Qué cambió |
|---|---|
| Bypass (2.4.1) | Skip link al `#main` como primer foco del body |
| Contenido dinámico | `role="status"` + `aria-live` en el conteo del buscador |
| Color como único canal (1.4.1) | Subrayado en los links del hero, igual que `.prose a` |
| Motion (2.2.2) | Guard global de `prefers-reduced-motion`; el parallax ya usa la variable que tenía al lado |
| Foco | `:focus-visible` branded en global, promovido desde el lab |
| Landmarks | `aria-label` en los dos `<nav>` |
| Headings | Tres saltos `h1→h3` corregidos |
| Alt text | Alt redundante fuera del logo, el avatar y los íconos de proyecto |

Ese último merece nota. El logo tenía `alt="notdefined.dev logo"` junto al texto "notdefined". Un lector anunciaba **"notdefined.dev logo notdefined"** en cada página. La palabra "logo" era ruido y la marca se decía dos veces. `alt=""` y listo — el texto de al lado ya la nombra. Alt vacío no es descuido: es decir "esto no aporta, sigue".

Y para que esto no se degrade en tres meses, la accesibilidad quedó escrita como **regla del repo** en `AGENTS.md`, con tabla de verificación. No como buena intención: como cosa que se revisa. Ahí vive la parte que sí hay que hacer a mano — skip link, orden de headings, live regions, contraste de tokens, el color nunca como único canal, y toda animación con su guard.

---

## Lo que me llevo

Empecé esto pensando que iba a encontrar un desastre y a contar la heroica de arreglarlo. Lo que encontré fue: el 90% estaba bien sin que yo hiciera nada especial, y el 10% que faltaba eran cuatro cosas que **la plataforma no puede adivinar por ti**.

Mi blog no pasó porque yo sea accesible. Pasó porque usé `<button>` cuando quería un botón.

Y el único hallazgo con dientes —los links invisibles del hero— no lo agarró ningún linter ni ningún checklist. `axe` no lo marca, Lighthouse tampoco: el contraste contra el fondo estaba perfecto en 5.88. Lo agarró ponerle protanopia encima y no encontrar los links. Por eso construí el simulador y no una checklist más: **el checklist te dice que el contraste pasa; el ojo simulado te enseña que el link no se ve.**

Ah, y si vas a diseñar algo hoy: hazlo en escala de grises primero. Lo dije en 2026 y no me hice caso. Ahora sí.

---

## Nota de caducidad

Todo esto se evaluó a mediados de **2026**: WCAG 2.2, las matrices de Machado 2009, los datos de la OMS 2020, mis tokens de hoy. La accesibilidad caduca más lento que la IA, pero caduca. Si lees esto mucho después, corre el [lab](/lab/a11y) contra tu propio sitio en vez de creerme.

**Fuentes:** están todas en el lab, en la sección de research — Machado et al. (2009), Birch (2012), OMS/ICD-11, LOCS III, Hodapp-Parrish-Anderson, AREDS.
