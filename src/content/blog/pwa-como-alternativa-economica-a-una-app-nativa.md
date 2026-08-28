---
title: 'PWA como alternativa económica a una app nativa'
description: 'PWA primero; si no alcanza, React Native; nativo solo si la experiencia lo es todo y es custom. Lo que me costó Mi Feria en Expo no fue el precio: fue lo que tienes que invertir al inicio para tener una oportunidad, un loop de desarrollo pesado y un proceso de publicación que me alejó de mi idea. Stockerly 2.0 se queda como PWA con Hotwire.'
pubDate: 2026-08-28
tags: ['pwa', 'expo', 'react-native', 'hotwire', 'rails', 'mobile']
draft: false
---

## TL;DR

- Mi regla: **PWA primero**. Si no es suficiente, migrar a React Native no debería ser tan doloroso. **Nativo solo si la experiencia lo es todo y es custom**
- "Necesidades altas" es algo concreto: comunicación custom con hardware, juegos o animaciones extensas, o una dependencia estrecha del ecosistema de Google o de iOS
- Lo caro de nativo **no es el precio**. Es lo que tienes que invertir al inicio para tener una oportunidad: lo legal, el contenido, las features que te piden, y un loop de desarrollo pesado
- Creía que Mi Feria pesaba **256 MB**. En Play la versión interna pesa **39.9**. Lo pesado era desarrollar en ella
- Stockerly es PWA con Hotwire desde marzo y no toca nada de esa lista. El 2.0 la hace mobile-first y se queda así. Todavía no sé si es lo que prefiero

---

En abril escribí que [construí Mi Feria con Expo y el plan gratis me alcanzó](/blog/construi-mi-feria-con-expo-y-el-plan-gratis-me-alcanzo). Cuatro meses después, con el 2.0 de Stockerly mobile-first enfrente, la pregunta obvia era si hacerle una app nativa. No.

## Mi regla

PWA primero. Si no es suficiente, migrar a React Native no debería ser tan doloroso. Y nativo solo si la experiencia lo es todo y es custom.

¿Cuándo no es suficiente una PWA? Cuando la app tiene necesidades altas, y para mí son tres:

- **Comunicación custom con hardware**
- **Juegos o animaciones extensas**
- **Dependencia estrecha del ecosistema** de Google o de iOS, como sus temas visuales

Stockerly no toca ninguna. Son precios, posiciones y alertas; lo que ocupa del celular es que se instale y abra como app.

## Lo que cuesta nativo

### No es el precio

El registro en Play es un pago único; en iOS es anual. No es el precio. Es lo que necesitas invertir al inicio para tener una oportunidad. Eso solo lo justifico cuando el beneficio es mayor, o cuando dependes de esas audiencias.

Y la inversión no es dinero. Es todo lo demás: tener que pensar y preparar contenido, la parte legal, las features que te piden para publicar. Complejo, aburrido, y no lo puedes acelerar. Con Mi Feria sentía que me alejaba de mi idea y me forzaba cosas. Dejó de ser programar, y la diversión de las features nuevas que yo quería.

Eso fue solo Android. A iOS ni me aventuré, ya era mucha carga.

### El loop

El exceso de configuración, los TOS, los checks de las stores, el review, los ambientes de preview para QA y pruebas, los tiempos de build. Se me hace muy lento. La automatización no es lo que esperaba. Las nuevas versiones, migrarlas.

Expo tiene updates over the air: cambias código, publicas, le llega al teléfono sin pasar por la store. Pero solo para contenido y JS que no ocupe nada nuevo del lado nativo. Si quería agregar un paquete, cambiarlo o nada más probar uno, era un build nuevo. Al principio los hacía en EAS, en la nube. En abril intenté sacarlos a GitHub Actions y lo revertí: 22 a 30 minutos por build, para uno o dos rebuilds nativos al mes, no valía. En mayo terminé compilando en mi máquina.

La forma de desarrollar cambió tres veces. Empecé con Expo Web: preview en el browser, rápido, sin instalar nada. Funcionó al inicio, hasta que las animaciones ya no jalaron ahí. Pasé a la Development Build con el [túnel de ngrok desde el devcontainer](/til/expo-tunnel-desde-un-devcontainer-me-salvo-el-loop-de-desarrollo), y pelearte por un spot no era difícil, pero a ratos era molesto. La mejor experiencia terminó siendo el emulador en mi máquina con updates over the air.

### La máquina

Pero el emulador es otra historia. Android Studio, agregar un emulador que ocupa gigas de disco, la RAM cuando corren el emulador y mi app al mismo tiempo, la compu calentándose todo el rato. Tal vez es un feeling, pero la batería duraba menos. Se notaba.

Yo estaba convencido de que Mi Feria ya iba en 256 MB, desde 80. Para una app simple, demasiado. Revisé Play Console y la versión interna pesa **39.9 MB** para instalaciones nuevas, 32.1 para updates. Casi seguro los 256 eran el build de `development`, el que corro en el emulador. Mi usuario nunca lo baja. Yo sí.

Hmm. Lo pesado no era la app. Era desarrollar en ella.

## Lo que cuesta la PWA

Stockerly es Rails con Turbo, Stimulus e importmap. Sin React, sin bundler de JS. Es PWA desde marzo, desde su primera versión:

- Un manifest con `display: standalone`, `start_url: /dashboard`, orientación vertical y el color de la marca
- Un service worker hecho a mano, 113 líneas en `public/`. Las páginas van network-first con una `offline.html` de respaldo, los assets stale-while-revalidate, y un `CACHE_VERSION` que purga los caches viejos. Va en `v5` porque ya cambié la marca y no quiero logos viejos pegados

El esqueleto de PWA que genera Rails 8 sigue en mi repo, comentado completo y sin rutas. No lo usé.

Instalada, se ve bien y abre como nativa. Versus el esfuerzo de convertirla, parece casi gratis.

**Offline** no lo hice. Stockerly no funcionaría offline, y esos puntos todavía no los he visto. En [mi post de Hotwire](/blog/hotwire-en-2026-el-sueno-rails-sin-js-sigue-vivo) puse en el árbol de decisión "Offline support / PWA → React". Aquí hay una PWA sin React, porque lo que ocupo de la PWA es que se instale, no que funcione sin red.

**Push** tampoco. Lo urgente ya llega por correo y la campana dentro de la app cubre el resto. Y en iOS, Web Push solo llega si la PWA está instalada en la pantalla de inicio. Para algo que ya está resuelto, no quiero un canal que en el celular puede no llegar.

El "casi" es educar al usuario a instalarla. Todavía no le he tenido que explicar a nadie, pero no es algo que se espere de una página web. Que se pueda instalar es un cambio en cómo usas la aplicación. Mi idea es explicarlo en una página del proyecto cuando termine la migración y me sienta contento con cómo se ve en mobile.

## Lado a lado

|                           | Mi Feria (Expo)                                                         | Stockerly (PWA)              |
| ------------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Para publicar             | Registro en Play, contenido, parte legal, features que te piden, review | Un deploy                    |
| Cambio que toca lo nativo | Build nuevo; OTA solo cubre JS y contenido                              | No hay capa nativa           |
| Mi máquina                | Android Studio, emulador de gigas, RAM, calor                           | El devcontainer de siempre   |
| Tamaño                    | 39.9 MB de descarga; el build de desarrollo, unos 256                   | Sin medir                    |
| Instalarla                | Desde la store                                                          | Hay que enseñarle al usuario |
| iOS                       | Ni lo intenté                                                           | El mismo sitio               |

## Lo que sigue

Aún no me ha dado problemas, pero me falta explorar mucho. Quiero usarla más en el celular antes de decir que funciona, y armar un lab con los límites reales de una PWA frente a nativo.

Para Mi Feria sigue abierta otra opción: un bastión con el SDK de Android en el servidor donde ya hago deploy con Kamal. Un servidor propio es una de las condiciones que dejé anotadas en abril para volver a intentar sacar los builds de EAS.

Hay algo que las dos comparten y me gusta: se pueden hospedar por tu cuenta, sin costo obvio para el usuario. Stockerly porque desde el principio lo perfilé como OSS. Mi Feria por la naturaleza de lo que guarda: su éxito depende de que confíes en dónde queda tu información.

Lo que no sé es si PWA es lo que prefiero.
