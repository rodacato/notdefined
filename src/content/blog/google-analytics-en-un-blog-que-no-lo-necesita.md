---
title: 'Le puse Google Analytics a un blog que no lo necesita'
description: 'Llevo 17 años implementando tracking para que otros jugaran con los datos. Le metí GA4 a este blog que no lo necesita para que el juguete por fin fuera mío. En 28 días midió un post abierto durante 4 segundos — y de rebote me dijo dónde estoy invirtiendo mal el tiempo.'
pubDate: 2026-08-05
tags: ['google-analytics', 'ga4', 'analytics', 'cloudflare', 'astro', 'privacy']
draft: false
---

## TL;DR

- Llevo **17 años implementando analytics** — los eventos, las vistas, los clicks — sin jamás jugar yo con los datos. Eso era de perfiles especializados.
- Le metí **GA4 con eventos y funnels** a este blog estático. No hay dolor de tráfico que resolver; el objetivo era que el juguete por fin fuera mío.
- Instalarlo fue **una línea**. Lo caro fue todo lo demás: la primera cookie del sitio y el banner que no quería.
- **Consent Mode sin banner** sonaba a la solución limpia. No lo es, y el debugging me llevó por dos pistas falsas antes de entender por qué.
- Un **funnel en un blog no existe**: no hay conversión. Me inventé micro-conversiones, y la que me importa es una sola: ¿alguien termina de leer?
- gtag.js pesa **165 KB** — 15 veces el beacon de Cloudflare que cubría lo básico gratis. Lo elegí igual, a propósito.
- 28 días midiendo: **un post abierto, 4 segundos, cero eventos disparados**. Y aun así el juguete se queda: me contestó una pregunta que no le hice.

---

> Nota de caducidad: esto lo hice a mediados de 2026. GA4, Consent Mode v2 y la cobertura de ad blockers se mueven. Si lees esto en un año, los detalles cambiaron — verifica contra la fuente.

En 17 años de escribir software me ha tocado implementar tracking más veces de las que puedo contar. eCommerce, fintech, marketplaces: yo ponía los eventos, las vistas, los clicks. Pero jamás me tocó el otro lado. Jugar con los datos era de perfiles especializados — los que se llevaban la gloria de encontrar cosas interesantes en los dashboards que yo alimentaba. No lo voy a negar: me daba envidia, y se veía tan divertido hacerlo.

Siempre creí que sin un producto con tráfico de verdad no había con qué jugar. O eso creía. Porque resulta que ya tengo un sitio de experimentaciones — este — y como ya me pasó con [correr Gemma 3n en el navegador](/blog/gemma-3n-en-el-navegador-brutal-como-experimento-malo-como-feature), otra vez le metí algo que no pedía. La diferencia: esta vez no era un modelo de 3 GB, era una línea de JavaScript. Y aun así el costo real no estuvo en instalarlo.

## Instalar fue una línea

El sitio ya tiene un solo `<head>` compartido (un `BaseLayout.astro`), así que el snippet de `gtag.js` entra en un lugar y cubre todo. Nada de tag manager, nada de librería de cookies. Lo envolví en un componente que solo carga en producción (nada de contaminar los datos con `localhost`) y con el Measurement ID hardcodeado — es público de todos modos, cualquiera lo ve en el HTML.

Lo interesante no fue el snippet. Fue la decisión que tomé encima de él.

## La decisión que sonaba lista: cookieless, sin banner

Este blog presume de limpio: cero cookies, cero banners molestos. Así que elegí **Consent Mode v2 con default `denied`**: GA arranca sin permiso de cookies y manda "cookieless pings". Suena perfecto — mides sin ensuciar, sin el banner que todos odiamos.

## "No veo nada en Realtime"

Desplegué, abrí el sitio, y en Realtime: cero. Nada.

Primera sospecha: **ad blocker**. Lógico — media audiencia dev bloquea `google-analytics.com`. Pero no era. Un `curl` a producción mostraba el tag ahí, y en la pestaña Network el request a `/collect` salía con **204**. O sea el dato SÍ se enviaba.

Segunda pista falsa: la **consola** llena de errores rojos. `Cannot redefine property: ethereum`, `ObjectMultiplex — orphaned data`... resultó que eran de mis **extensiones de wallet cripto**, nada que ver con GA. Red herring total.

La causa real era la decisión "lista" de arriba: **Consent Mode denied**. Confirmado a mano: otorgué consentimiento en la consola, mandé un evento de prueba, y **apareció al instante** en Realtime.

> **La lección, si llegaste aquí buscando justo esto:** con `analytics_storage: denied`, GA sí manda los pings — por eso ves el 204 en Network y crees que funciona. Pero a baja escala esos pings no se vuelven datos reportables: el modeling de Google necesita umbrales de tráfico que un blog personal nunca alcanza. **Consent denied sin banner = GA mudo**, y el 204 te miente en la cara mientras pasa.

## El banner que quería evitar

Ahí estaba el pedo: para pasar a `granted` tiene que existir algo que lo pida. Y yo había elegido explícitamente **no** tener banner. O sea, no había forma de aceptar. GA se quedaba mudo por diseño.

Reversa. Metí un banner minimalista — barra abajo, 🍪, "Este sitio usa cookies para mejorar tu experiencia", Aceptar/Rechazar — que persiste la decisión en `localStorage` y el snippet la lee para que el primer `page_view` de quien ya aceptó salga como `granted`.

¿Y no me dolió terminar con el banner que evito en otros sitios? La verdad, no. Transparencia ante todo: está legislado, es normal, y ante la deshonra de medio internet — esos banners oscuros diseñados para que aceptes sin leer, con el "rechazar" escondido en tres submenús — prefiero dar la cara. Mi cookie hace una cosa: me ayuda a experimentar. Si la rechazas, el sitio funciona igual y no te vuelvo a preguntar. No es algo serio.

## Lo que GA no te enseña a tu escala

Hay un límite que sobrevive aunque el visitante acepte la cookie: el ad blocker. Buena parte de la audiencia dev bloquea `google-analytics.com` de fábrica, así que el número que ves nunca es el número real. Siempre estás subcontando y no hay forma de saber por cuánto: puede ser un 10% o puede ser la mitad, y GA no te lo va a decir.

Y el precio en peso, medido con `curl` como lo baja tu browser:

| Script | Transfer | Sin comprimir |
|---|---|---|
| gtag.js (GA4) | **165.6 KB** | 487.6 KB |
| Cloudflare Web Analytics beacon | **11.3 KB** | 31.6 KB |

Aquí viene la parte incómoda de admitir: Cloudflare Web Analytics — que ya tengo enfrente del sitio, el proxy existe desde [el lab de Gemma](/blog/gemma-3n-en-el-navegador-brutal-como-experimento-malo-como-feature) — contestaba "¿me leen? ¿de dónde llegan?" en una línea. Sin cookie, sin banner, sin consent mode, con un script 15 veces más ligero.

Lo sabía antes de empezar. Y elegí GA de todos modos, porque la pregunta básica no era el punto — el punto era el juguete completo: eventos custom, Consent Mode, Explore, el funnel. La herramienta pesada fue a propósito. Lo que no se vale es elegirla y luego contar la historia como si no hubiera alternativa.

## Un funnel en un blog no existe

Quería practicar **funnels**, y ahí choqué con algo obvio en retrospectiva: un funnel necesita una conversión, y un blog personal **no convierte nada**. No hay checkout, no hay signup (a propósito — no hay newsletter aquí).

Así que me inventé micro-conversiones. El funnel de "lector":

`page_view (home) → page_view (post) → read_complete (scroll 90%) → cta_click (proyecto/CV/GitHub)`

`read_complete` lo disparo cuando llevas el 90% del `<article>` — no el scroll genérico de GA, que cuenta cualquier página. `cta_click` clasifica el destino por su `href`. Dos eventos custom, ~30 líneas, todo en `src/components/Analytics.astro` (el banner y su puente a `localStorage` viven aparte, en `src/components/ConsentBanner.astro`).

El corazón es esto:

```js
const article = document.querySelector('article');
let fired = false;

function complete() {
  if (fired) return;
  fired = true;
  gtag('event', 'read_complete', { post: location.pathname });
  window.removeEventListener('scroll', onScroll);
}

function onScroll() {
  const top = article.getBoundingClientRect().top + window.scrollY;
  const seen = window.scrollY + window.innerHeight - top;
  if (seen / article.offsetHeight >= 0.9) complete();
}

// Un artículo que cabe en pantalla cumple el 90% desde el primer frame:
// ahí lo único que separa leer de aterrizar es el tiempo.
if (article.offsetHeight <= window.innerHeight) {
  setTimeout(complete, 15000);
} else {
  window.addEventListener('scroll', onScroll, { passive: true });
}
```

Ese `if` no estaba en la primera versión, y por eso lo dejo aquí: yo llamaba a `onScroll()` una vez al cargar, para cubrir a quien abre algo cortito y no necesita scrollear. En un TIL de tres párrafos abierto en un monitor grande, el artículo entero cabe en pantalla — así que la cuenta daba 90% en el primer frame y `read_complete` disparaba **antes de que el lector moviera un dedo**. Un contador de lectura que contaba aterrizajes. Lo encontré escribiendo este post, no midiendo.

¿Es teatro? Me lo pregunté. Pero no: dudé años en hacer este blog, y ahora que existe hay una pregunta que me importa contestar de verdad — **¿alguien termina de leer lo que escribo?** Eso es `read_complete`. El `cta_click` está ahí porque un funnel de un solo paso no es funnel, pero el dato que voy a estar viendo es el otro.

## Veredicto

Me aventé el numerito completo — Consent Mode, un banner que no quería, dos eventos custom, un funnel de cuatro pasos — para contestar una sola pregunta: **¿alguien termina de leer lo que escribo?**

Lo encendí el 9 de julio. 28 días después: 3 usuarios, 55 vistas, **un** post abierto, **4 segundos**. `read_complete` no disparó ni una vez. Le puse un detector de humo a un cuarto donde no ha entrado nadie.

Y aquí es donde se pone bueno. Mientras el instrumento que me importaba se quedaba mudo, el resto del tablero hablaba solo:

- `/projects/` — **5 minutos** de permanencia.
- `/about/` — 1 minuto 13.
- `/blog/` — **8 segundos**. Abrir la lista y cerrarla.

O sea: quien llega a notdefined.dev no viene a leerme. Viene a ver qué he hecho y quién soy, y se va. Ocho segundos en el blog contra cinco minutos en projects no es una señal débil — es una cachetada.

Antes de que me lo digas: **tres usuarios no son datos**, son una anécdota con dashboard. Y uno de esos tres probablemente soy yo. Aquí no pruebo nada, y el párrafo de arriba donde digo que hay que desconfiar del número me aplica igualito a mí. Lo que sí es cierto es que ocho segundos contra cinco minutos no lo hubiera adivinado sentado — y con tres visitas ya me movió a dónde estoy poniendo las horas. Cuando junte treinta te digo si aguantó.

El pedo es que instrumenté la pregunta que **yo** quería contestar, no la que mis visitantes estaban contestando. Le llené de sensores los posts y la gente se quedó cinco minutos en la única página que no tenía ninguno. Le pasa a todo el que mide algo por primera vez; ahora ya me pasó a mí.

Por eso el funnel vacío no es un fracaso. El juguete no me dijo si me leen — me dijo dónde estoy invirtiendo mal el tiempo, que era una pregunta más cara y ni siquiera se la hice. Esa la contestó gratis, de rebote.

Se queda. No porque el blog lo necesite —quedó clarísimo que no— sino porque ya me dio algo que no tenía cómo conseguir de otro modo. El día que deje de enseñarme cosas lo arranco y el sitio recupera sus cero cookies. Mientras tanto: gracias si aceptaste mi cookie. Fuiste de tres.
