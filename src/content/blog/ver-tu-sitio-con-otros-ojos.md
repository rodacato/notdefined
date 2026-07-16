---
title: 'Ver tu sitio con otros ojos'
description: 'DRAFT — pendiente. Construí un simulador de condiciones visuales y lo primero que evalué fue mi propio blog. Daltonismo con las matrices correctas, visión baja, cataratas, glaucoma — y un lector casero que me enseñó lo lejos que está de un screen reader real.'
pubDate: 2026-07-15
tags: ['a11y', 'accesibilidad', 'svg', 'css', 'astro']
draft: true
---

## TL;DR

<!-- Adrian: estos bullets se cierran cuando cierres la tesis. Borrador: -->

- Pasamos años desgastando la vista frente a una pantalla, y diseñamos como si todos los ojos fueran los nuestros. Construí [un lab](/lab/a11y) para voltear la cámara: ver este blog (o cualquier sitio embebible) bajo daltonismo, visión baja, cataratas, glaucoma, degeneración macular — y un modo sin visión con lector de voz.
- **La accesibilidad no es un feature que agregas al final. Es parte de hacer una buena página.**
- Medí mis propios tokens bajo daltonismo completo: **el blog pasa**. Pero no por virtuoso — pasa porque el HTML semántico y los defaults hicieron el trabajo. **Los frameworks son tus amigos; no les des la espalda.**
- Los links pasan AA por un pelo bajo protanopia: **4.88 contra 4.5 requerido**. Un tono más claro y reprueban.
- Las matrices de daltonismo que circulan por internet están mal. Las válidas son las de **Machado et al. (2009)** y operan en **RGB lineal** — detalle que la mitad de los simuladores se salta.
- <!-- Adrian: distancia entre el mini-lector casero y VoiceOver real va aquí -->

---

## Por qué me metí en esto

<!-- Adrian: tu motivación real, en tu voz — la vista desgastada por el oficio,
la reflexión de "¿cómo sería mi mundo con una condición así?". Abre el post,
NO lo cierra. -->

---

## No es un feature: es hacer bien la página

<!-- Adrian: TU OPINIÓN, el corazón del post. La idea: la a11y no es un ticket
que agregas en el sprint 12, es una propiedad de haber hecho bien lo básico.

Anclas honestas para no caer en sermón:
- Mi blog pasó, pero no porque yo "trabajé la accesibilidad" — pasó porque usé
  HTML semántico y no me puse creativo. Suerte con buen gusto, no virtud.
- Lo que los frameworks te dan GRATIS: elementos nativos (un <button> ya es
  focusable, ya responde a Enter/Space, ya se anuncia como botón), manejo de
  foco, roles implícitos, navegación por teclado. El <input type="radio"> del
  lab navega con flechas sin que yo escribiera una línea.
- Dónde NO te salvan (esto es lo importante, evita el "úsalo y ya"):
  contraste de tus tokens, color como único canal de información, orden de
  lectura, alt text que de verdad describa.
- El costo de darles la espalda: cada <div onclick> es reimplementar a mano lo
  que ya tenías gratis — y siempre peor.
-->

---

## El playground: ejemplos que se rompen a propósito

Esta sección existe para el [lab](/lab/a11y). Cada bloque está diseñado para
fallar bajo alguna condición — carga este post en el simulador y ve cómo se
desarma.

### La paleta que se colapsa

Rojo, verde, naranja y café se ven obvios con visión típica. Actívale
**deuteranomalía al 100%** y dime cuáles quedan.

<div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin:1rem 0;">
  <div style="width:7rem;height:4.5rem;border-radius:0.5rem;background:#e74c3c;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.75rem;padding-bottom:0.4rem;">#e74c3c rojo</div>
  <div style="width:7rem;height:4.5rem;border-radius:0.5rem;background:#27ae60;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.75rem;padding-bottom:0.4rem;">#27ae60 verde</div>
  <div style="width:7rem;height:4.5rem;border-radius:0.5rem;background:#e67e22;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.75rem;padding-bottom:0.4rem;">#e67e22 naranja</div>
  <div style="width:7rem;height:4.5rem;border-radius:0.5rem;background:#795548;display:flex;align-items:end;justify-content:center;color:#fff;font-size:0.75rem;padding-bottom:0.4rem;">#795548 café</div>
</div>

### El semáforo de estados

El clásico dashboard que comunica TODO con color y nada más:

<div style="display:flex;gap:0.6rem;flex-wrap:wrap;margin:1rem 0;">
  <span style="background:#27ae60;color:#fff;border-radius:999px;padding:0.35rem 1rem;font-size:0.8rem;">deploy ok</span>
  <span style="background:#f1c40f;color:#fff;border-radius:999px;padding:0.35rem 1rem;font-size:0.8rem;">tests lentos</span>
  <span style="background:#e74c3c;color:#fff;border-radius:999px;padding:0.35rem 1rem;font-size:0.8rem;">prod caído</span>
</div>

Bajo protanopia, "prod caído" y "deploy ok" son el mismo badge. El fix es
gratis: un ícono o una palabra junto al color. Aquí no lo puse a propósito.

### El link que solo es link por su color

<p style="color:#444;line-height:1.7;">
En este párrafo hay <span style="color:#c0392b;">una liga importante</span> que
solo se distingue del texto por el color, sin subrayado. Con visión típica
brinca; con daltonismo rojo-verde es texto normal. Por eso WCAG pide más que
color para distinguir un enlace dentro de un párrafo.
</p>

### La gráfica que depende del color

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
Este párrafo está en 11px y gris claro sobre blanco (contraste ~2.8:1, WCAG pide
4.5:1). Con visión típica ya es incómodo. Actívale visión baja al 60% o
cataratas y desaparece por completo. Así se leen los disclaimers legales, los
footers y — seamos honestos — la mitad de los captions de internet.
</p>

### El párrafo para el túnel

Con **visión de túnel** o **degeneración macular** al 100%, intenta leer el
párrafo largo de arriba a abajo sin perderte. El campo visual que das por hecho
es el que organiza la lectura: sin periferia no sabes dónde sigue la línea; sin
centro no hay dónde enfocar. Ninguna regla de contraste te salva de eso — ahí
lo que importa es estructura: headings frecuentes, párrafos cortos, una sola
columna.

---

## Lo que pasó — y lo que no — en mi propio blog

<!-- Adrian: los números medidos. Tabla de contraste de los tokens (normal /
protan / deutan / tritan). El mea culpa: yo esperaba que el "verde terminal"
reprobara... y resulta que el accent nunca fue verde, es índigo #4c4ee4. Pasó
la prueba, pero por las razones equivocadas (defaults sanos, no virtud).
El dato filoso: links 4.88 vs 4.5 requerido bajo protanopia — pasa por un pelo.
Nota de entorno honesta: Lighthouse ni corrió, Node v20.3.1. -->

---

## El plan de mejora (y qué sí arreglé)

<!-- Adrian: esta sección es la PRUEBA de la tesis. No basta con opinar que la
a11y es parte de hacer bien la página: hay que auditar este blog, arreglar lo
que salga, y reportar el delta con números.

Estructura:
1. La auditoría: qué revisé (páginas del sitio, no solo el post) y cómo.
2. Los hallazgos por categoría (contraste / semántica / foco / teclado /
   alt text / orden de lectura / motion).
3. Qué arreglé y qué NO (y por qué — lo que no vale la pena también es opinión).
4. El delta medido: antes → después.
5. Lo que quedó escrito en AGENTS.md para que no se degrade: la a11y como
   regla del repo, no como buena intención. Reportar aquí que gracias a esto
   el blog mejoró en [X categorías].
-->

---

## Las matrices que copias de Stack Overflow están mal

<!-- Adrian: la cicatriz técnica — Machado et al. 2009, severidades 0-1 en
pasos de 0.1, RGB lineal vs sRGB, color-interpolation-filters="linearRGB". -->

---

## Simular ceguera me quedó grande (v2)

<!-- Adrian: el mini-lector con speechSynthesis, los atajos NVDA, la Same-Origin
Policy, y la distancia contra VoiceOver real. Se escribe cuando la v2 exista. -->

---

## Nota de caducidad

<!-- Convención de los labs: fecha de evaluación explícita. Evaluado a mediados
de 2026 — WCAG, soporte de navegadores y herramientas cambian (más lento que la
IA, pero cambian). -->
