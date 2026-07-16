---
title: 'Ver tu sitio con otros ojos'
description: 'Construí un simulador de condiciones visuales para auditar mi propio blog. Pasó casi todo — y no por virtuoso. Lo único que reprobó fue el consejo que yo mismo di en otro post.'
pubDate: 2026-07-15
tags: ['a11y', 'accesibilidad', 'svg', 'css', 'astro']
draft: true
---

## TL;DR

- Construí [un lab](/lab/a11y) para ver este blog con otros ojos: daltonismo, visión baja, cataratas, glaucoma, degeneración macular, y un modo sin visión con lector de voz.
- La accesibilidad no es un feature que agregas al final. Es una propiedad de haber hecho bien lo básico — y mi blog pasó casi todo sin que yo lo trabajara.
- Lo único que reprobó fue el consejo que **yo mismo escribí** en otro post: "no te escondas detrás de colores". Mi portada se escondía detrás del color.
- De las 4 barreras reales que encontré, **3 ya estaban resueltas en mi repo** y nunca las subí a global.

---

## Por qué me metí en esto

<!-- Adrian: este párrafo es tuyo, yo solo dejo el andamio con lo que me diste.
Corrígelo hasta que suene a ti — es la única parte que no puedo escribir.
Lo que me contaste: la vista se desgasta de tanta pantalla, años acumulados,
y eso te llevó a preguntarte cómo sería tu mundo con una condición así. -->

Llevo 17 años viendo pantallas. La vista se desgasta — eso no es noticia para nadie que haga esto. Lo que sí me movió el tapete fue la pregunta que vino después: **¿cómo sería mi mundo si esto no se corrige con lentes?**

Así que en vez de leer otra checklist de WCAG, construí algo para **verlo**.

---

## Construí un simulador

[`/lab/a11y`](/lab/a11y) carga un sitio en un iframe y le aplica una condición visual encima. Ocho modos: los tres tipos de daltonismo, visión baja, cataratas, visión de túnel, degeneración macular, y sin visión.

El slider no dice "60%". Dice **"catarata madura"**, **"glaucoma severo"**, **"deuteranopia"** — porque un porcentaje abstracto no significa nada. Cada condición trae los estadios de una escala clínica publicada: LOCS III para cataratas, Hodapp-Parrish-Anderson para glaucoma, la clasificación de la OMS para visión baja, AREDS para mácula. Todas citadas en el lab.

Quise ir más lejos y poner percentiles —"de los que tienen cataratas, tal % está en este nivel"—. Ese dato no existe limpio: los estudios reportan prevalencia total, no distribución por estadio. Inventarlo habría sido justo el humo que este lab jura no vender. Donde no hay dato, el lab lo dice.

Una cicatriz técnica, corta: las matrices de daltonismo que copias de internet casi siempre están mal. Las buenas son las de **Machado et al. (2009)**, y operan en **RGB lineal** — aplicarlas en sRGB da colores plausibles y equivocados. SVG usa `linearRGB` por default, pero lo dejé explícito:

```html
<filter id="cvd" color-interpolation-filters="linearRGB">
  <feColorMatrix type="matrix" values="..." />
</filter>
```

---

## Sin visión: el modo que me quedó grande

El modo 9 apaga la pantalla y te deja con un lector de voz casero. Recorre el DOM, narra con `speechSynthesis`, y usa las teclas de NVDA: flechas para leer, `H` para saltar encabezados, `K` para enlaces.

Le puse una caption en vivo sobre el negro, que muestra lo que se está narrando: la idea es que **un vidente vea lo que un ciego oiría**. Terminó siendo lo más útil del lab.

Dos cosas que confiesa en su propia cara. **Solo lee este sitio** — la Same-Origin Policy sella el DOM de un iframe de otro origen, así que con una URL externa el modo se apaga y explica por qué. Y **no es un screen reader**: NVDA y VoiceOver tienen rotor, modo formularios, décadas de heurísticas. Lo mío es una aproximación para que alguien que ve sienta el problema.

Construyéndolo me cayó el veinte de algo: la tecla `H` salta encabezados. Si tu página va de `h1` a `h3`, esa navegación se rompe. **El orden de headings no es cosmético — es la navegación de alguien.**

<!-- Adrian: aquí va el cierre del arco — probar el blog con VoiceOver real
(macOS, ya lo tienes) y documentar qué tan lejos quedó el lector casero.
Sin ese dato la sección se queda a medias. -->

---

## Pruébalo tú

<div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.9rem; padding: 1.25rem 1.5rem 0.5rem; margin: 1.5rem 0;">

<p style="font-size:0.72rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-accent);margin:0 0 1rem;">⚗ Zona de experimento — todo aquí está roto a propósito</p>

Cada bloque se rompe bajo alguna condición. Llevan descripción en texto de qué falla, porque si lees esto con un lector de pantalla la falla visual no te llega — y sería irónico que el post sobre ceguera te dejara fuera justo aquí.

**La paleta que se colapsa.** Bajo deuteranomalía, el rojo, el verde y el café se vuelven el mismo mostaza; el naranja apenas se despega.

<div style="display:flex;gap:0.6rem;flex-wrap:wrap;margin:0.75rem 0 1.25rem;">
  <div style="width:6rem;height:4rem;border-radius:0.5rem;background:#e74c3c;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.72rem;padding-bottom:0.35rem;">rojo</div>
  <div style="width:6rem;height:4rem;border-radius:0.5rem;background:#27ae60;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.72rem;padding-bottom:0.35rem;">verde</div>
  <div style="width:6rem;height:4rem;border-radius:0.5rem;background:#e67e22;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.72rem;padding-bottom:0.35rem;">naranja</div>
  <div style="width:6rem;height:4rem;border-radius:0.5rem;background:#795548;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.72rem;padding-bottom:0.35rem;">café</div>
</div>

**El semáforo solo-color.** Bajo protanopia, "deploy ok" y "prod caído" son la misma pastilla parduzca. Aquí hice trampa a mi favor: llevan texto, así que el lector te salva — el que se jode es el daltónico que ve la pantalla.

<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin:0.75rem 0 1.25rem;">
  <span style="background:#27ae60;color:#fff;border-radius:999px;padding:0.3rem 0.9rem;font-size:0.78rem;">deploy ok</span>
  <span style="background:#f1c40f;color:#fff;border-radius:999px;padding:0.3rem 0.9rem;font-size:0.78rem;">tests lentos</span>
  <span style="background:#e74c3c;color:#fff;border-radius:999px;padding:0.3rem 0.9rem;font-size:0.78rem;">prod caído</span>
</div>

**El link que solo es link por su color.**

<p style="color:#444;line-height:1.7;margin:0.75rem 0 1.25rem;">En este párrafo hay <span style="color:#c0392b;">una liga importante</span> sin subrayado. Con visión típica brinca; con daltonismo rojo-verde es texto normal. Guárdate este, que en un rato me lo como yo.</p>

**El texto que castiga.**

<p style="font-size:11px;color:#999;line-height:1.5;margin:0.75rem 0 1.25rem;">Esto está en 11px gris claro sobre blanco: contraste ~2.8:1 cuando WCAG pide 4.5:1. Súbele visión baja o cataratas y desaparece. Así se ven los disclaimers y la mitad de los captions de internet.</p>

**Y el que no se arregla con contraste.** Con visión de túnel o degeneración macular, ninguna regla de color te salva: sin periferia no sabes dónde sigue la línea, sin centro no hay dónde enfocar. Lo único que ayuda es estructura — headings seguidos, párrafos cortos, una columna.

</div>

---

## Lo apunté a mi propio blog

Iba con una teoría bien armada: mi verde terminal iba a reprobar bajo deuteranopia. Dos problemas — mi accent no es verde (es `#4c4ee4`, un índigo, llevaba meses en mi cara), y no reprobó, porque el índigo vive en un matiz que no depende de discriminación rojo-verde. Corrí los tokens a mano: oklch → sRGB lineal, matriz de Machado encima, ratio WCAG.

| Par | Normal | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|
| Texto / fondo | 19.83 | 19.80 | 19.84 | 19.82 |
| Texto tenue / fondo | 6.44 | 6.37 | 6.48 | 6.43 |
| Links / fondo | 5.88 | **4.88** | 5.69 | 5.19 |

El daltonismo casi no mueve la aguja. Mi color de marca no falla, pero no fue decisión de accesibilidad: fue suerte con buen gusto.

Y las categorías que suelen doler pasaron todas, sin que yo les dedicara un sprint: cero `<div onclick>`, cero inputs sin label, landmarks reales, `lang` puesto, ningún focus ring destruido. Eso me lo dio la plataforma. Un `<button>` ya es focusable, ya responde a Enter, ya se anuncia como botón. **Por eso los frameworks son tus amigos**: cada `<div onclick>` que escribes reimplementa —peor— algo que ya tenías.

Pero cuatro cosas ningún default te las regala, y las cuatro pegan justo donde no ves:

- **Skip link.** No tenía. Con teclado te comías 6 o 7 tabs por el header sticky antes de tocar el contenido. En cada navegación.
- **Live region.** El buscador escribía "3 resultados" en un `<p>` mudo. Con lector de pantalla no oías nada, ni el "nada para «xyz»".
- **Motion guard.** El parallax corría aunque pidieras `prefers-reduced-motion` — y el layout ya calculaba esa variable 60 líneas arriba, para otra cosa.
- **Una pista que no sea color.** Los links del hero. Aquí me como el mío.

Porque en el [post de Google Stitch](/blog/google-stitch-diseno-para-devs-que-no-son-disenadores/) escribí, palabras mías:

> *"diseña en escala de grises primero. Te obliga a crear jerarquía con spacing y contraste, no escondiéndote detrás de colores."*

Los links de mi hero: índigo, dentro de un párrafo gris, sin subrayado. Accent y texto tienen casi la misma luminosidad; lo único que los separa es el matiz. Contraste link contra texto: **1.09:1** cuando WCAG pide 3:1. En escala de grises esos links no existen. Yo di el consejo, en mi blog, y no lo seguí en mi propia portada.

No mames.

De esas cuatro, tres ya estaban resueltas en mi código: `.prose a` subrayaba, el lab usaba `aria-live`, `BaseLayout` calculaba `reduceMotion`. No era que el sitio fuera inaccesible — los patrones buenos nunca subieron a global.

Y aquí está el punto que me quiero clavar, porque es fácil malentenderlo: **el framework hace mucho, pero no lo hace todo, y creerte lo contrario es donde te caes**. Astro me dio los elementos nativos; nadie me dio el criterio de usarlos bien. Mis cuatro barreras no son casos raros, son la lista de siempre — las cosas que ningún framework te resuelve porque dependen de tu contenido y tus decisiones, no de la librería:

- **Alt text que signifique algo.** El framework te da el `<img>`; el texto lo escribes tú, y "logo" no es texto.
- **El contraste de tus tokens.** La librería no elige tu paleta. Ese cálculo es tuyo.
- **El color como único canal.** Un estado, un link, una gráfica que solo se distinguen por color. Nadie te lo marca.
- **Orden de headings y un solo `h1`.** Es la navegación de un lector, no un detalle de maquetación.
- **Skip link y foco tras navegar.** Devolver el foco después de cerrar un modal, saltar al contenido: trabajo manual.
- **Regiones vivas para lo asíncrono.** Todo lo que inyectas con JS y cambia en silencio.
- **Tus animaciones con su `prefers-reduced-motion`.** El framework anima; el guard lo pones tú.
- **`:focus-visible` que tu propio reset no destruya.** Un `outline: none` sin reemplazo y ya rompiste lo que venía gratis.

El valor no está en elegir el framework. Está en la atención al detalle que pones **encima** de él. El framework te sube al 90% sin esfuerzo; ese último 10% es puro criterio, y es justo el que separa un sitio que "compila accesible" de uno que de verdad se puede usar sin ver.

---

## Qué arreglé

| Categoría | Qué cambió |
|---|---|
| Bypass (2.4.1) | Skip link al `#main` como primer foco del body |
| Contenido dinámico | `role="status"` + `aria-live` en el buscador |
| Color como único canal (1.4.1) | Subrayado en los links del hero, igual que `.prose a` |
| Motion (2.2.2) | Guard global de `prefers-reduced-motion` |
| Foco | `:focus-visible` branded, promovido desde el lab |
| Landmarks | `aria-label` en los dos `<nav>` |
| Headings | Tres saltos `h1→h3` corregidos |
| Alt text | Alt redundante fuera del logo, avatar e íconos |

El del alt merece nota: el logo tenía `alt="notdefined.dev logo"` junto al texto "notdefined", así que el lector anunciaba **"notdefined.dev logo notdefined"** en cada página. `alt=""` y listo — el texto de al lado ya la nombra. Alt vacío no es descuido: es decir "esto no aporta, sigue".

Y para que no se degrade en tres meses, la accesibilidad quedó escrita como regla del repo en `AGENTS.md`, con tabla de verificación. No como buena intención: como cosa que se revisa.

---

## Lo que me llevo

Empecé pensando que iba a encontrar un desastre y contar la heroica de arreglarlo. Encontré lo contrario: el 90% estaba bien sin que yo hiciera nada especial, y el 10% que faltaba eran cuatro cosas que la plataforma no puede adivinar por ti.

Mi blog no pasó porque yo sea accesible. Pasó porque usé `<button>` cuando quería un botón.

Y el único hallazgo con dientes —los links invisibles del hero— no lo agarró ningún linter. `axe` no lo marca, Lighthouse tampoco: el contraste contra el fondo estaba perfecto. Lo agarró ponerle protanopia encima y no encontrar los links. Por eso construí un simulador y no una checklist más: **el checklist te dice que el contraste pasa; el ojo simulado te enseña que el link no se ve.**

---

## Nota de caducidad

Todo esto se evaluó a mediados de **2026**: WCAG 2.2, matrices de Machado 2009, datos de la OMS 2020, mis tokens de hoy. La accesibilidad caduca más lento que la IA, pero caduca. Si lees esto mucho después, corre el [lab](/lab/a11y) contra tu propio sitio en vez de creerme. Las fuentes están todas en el lab, en la sección de research.
