---
title: "Construí Mi Feria con Expo y el plan gratis me alcanzó"
description: "Llegué de idea a Development Build corriendo en mi celular sin tocar Android Studio, sin pagar suscripciones, y desde un devcontainer donde mi laptop sigue limpia. Esta es la historia de cómo Expo (con sus límites bien marcados) me alcanzó para construir Mi Feria, mi app de finanzas para el sistema mexicano."
pubDate: 2026-04-22
tags: ["expo", "react-native", "mobile", "indie-dev", "mi-feria"]
draft: false
featured: true
---

## TL;DR

- Construí **[Mi Feria](https://mi-feria.notdefined.dev/)**, app de finanzas pensada para el sistema mexicano (quincenales, ciclos de tarjeta, no calendario), usando **Expo** desde un devcontainer en VS Code.
- El plan gratis te da **15 builds de Android y 15 de iOS al mes** con **EAS Build**, más **EAS Update** ilimitado hasta 1,000 MAU. Combinando builds raros con OTA frecuente, no me lo acabé.
- El devcontainer no ve mi celular directo, pero `npx expo start --tunnel` abre un túnel de ngrok público y el dispositivo se conecta a esa URL sin importar la red. (Lo cuento aparte en su [TIL](/til/expo-tunnel-desde-un-devcontainer-me-salvo-el-loop-de-desarrollo/).)
- La cagada: **react-native-reanimated** me obligó a recompilar al agregarlo y mató mi preview de **Expo Web**. Tuve que rehacer mi loop de desarrollo.
- Lo recomiendo si haces side projects, aprendes, o construyes algo propio. **No** lo recomiendo si necesitas mucho custom, hardware específico, o ya tienes equipo grande con CI propio.

---

## El void que llené

Llevo años usando apps de finanzas y todas asumen un mundo que no es el mío. Cortes el día 1 del mes. Salarios mensuales. Tarjetas de crédito con ciclos calendario. Eso no es México. Aquí cobramos quincenal, las tarjetas cortan el día 15 o el 22 o el día que les dio la gana al banco, y el "este mes" del banco no es el mismo que el "este mes" de tu jefe.

Después de revisar opciones y no encontrar nada que se adaptara, pasó lo de siempre cuando un dev tiene un problema personal: *"a huevo, yo lo hago"*. Mi Feria es lo que salió. Cycle-based en lugar de calendar-based. Cortes y fechas de pago como entidades de primera clase. Captura de gasto en 4 segundos. Sin ads, sin vender datos, sin pedirte que conectes tu banco.

El tagline lo dice mejor que yo: *"tu cartera, tu cuenta, tu paso"*. Si vas mal, te lo dice. Sin diplomacia.

Pero el post no es para venderles la app. El post es para contarles cómo la construí sin sufrir.

## Por qué Expo y no las otras opciones

Ya sé React. Ya sé qué quiero. Ya sé el problema. Lo único que me detenía era el *cómo llegar de mi laptop a mi celular* — y ahí es donde la mayoría de los frameworks de mobile pierden a los devs casuales.

| Stack | Lo bueno | Lo que me detenía |
|---|---|---|
| **React Native pelado** | Control total, nada de capas mágicas | Setup de Android Studio, gradle peleándose con tu Java, dependencias derramadas por toda tu máquina |
| **Flutter** | UI consistente, performance bonita | Aprender Dart desde cero por un side project — el pedo es que no me iba a pagar el tiempo |
| **Nativo iOS/Android** | El "correcto" técnicamente | Dos lenguajes, dos IDEs, dos pipelines de build, dos vidas que no tengo |
| **Expo** | React del que ya sé, builds en la nube, hot reload sano | Te obliga al "happy path" — si necesitas algo fuera, duele |

Para mi caso — pet project, ya conozco React, mi limitante es tiempo no skills — Expo era obvio. La pieza que terminó de convencerme fue que corre desde devcontainer en VS Code. Yo no quería tener 30 SDKs de mobile colgando de mi laptop que voy a tocar una vez al mes. Devcontainer significa: si abandono el proyecto seis meses, lo levanto otra vez con `docker compose up` y sigue.

## El plan gratis: hasta dónde me alcanzó

El miedo de todo indie dev es que la herramienta gratis tenga una trampa de cobro escondida. Con Expo me senté a leer la página de pricing antes de comprometerme. Resumen:

**EAS Build (compilaciones en la nube):**
- 15 Android builds al mes.
- 15 iOS builds al mes.
- Cola pública (más lenta que el plan de pago, pero funciona).

**EAS Update (OTA updates):**
- Updates ilimitados.
- 1,000 MAUs al mes — más que suficiente para una beta cerrada.
- 100 GiB de bandwidth, 20 GiB de storage.

La estrategia que sale sola de leer esa lista: **build raro, OTA frecuente**. Mientras estés iterando UI o lógica de JS pura, no necesitas un build nuevo — empujas un EAS Update y tu Development Build instalado en el celular lo recibe en segundos. Solo necesitas builds nuevos cuando agregas un módulo nativo o cambias config del runtime.

¿Me acabé los 15 builds en algún mes? No. Hubo meses con 3-4 builds (semanas de iteración intensa), y meses con 0 builds (solo OTA). El miedo era infundado para mi cadencia de pet project.

## El truco del túnel

Aquí hay una cosa que no era obvia: si corres Metro desde un devcontainer, tu celular no lo ve por LAN porque el devcontainer vive detrás de la red de Docker. Lo intenté con port-forwarding de VS Code Remote, complicado. Después descubrí que Expo trae `--tunnel` — abre un túnel de ngrok público y le da una URL al dev server.

```bash
npx expo start --tunnel
# → Tunnel ready. URL: https://....exp.direct
```

Le pegas esa URL desde el celular (escaneas QR o la metes manual en tu Development Build) y se conecta sin importar dónde estés en la red. Lo cuento con más detalle en su [TIL aparte](/til/expo-tunnel-desde-un-devcontainer-me-salvo-el-loop-de-desarrollo/) — pero el resumen es: devcontainer + tunnel + Development Build + EAS Update OTA = no necesito Android Studio para iterar.

## La cagada: Reanimated

Aquí me topé con la primera muralla seria. Cuando la app se puso "más seria" y quise agregar animaciones de verdad (gestos, transiciones suaves, lo que diferencia una app que se siente *viva* de una que se siente *Bootstrap*), tuve que meter `react-native-reanimated`:

```bash
npx expo install react-native-reanimated
# y, sí, hay que recompilar el dev client después.
```

Y ahí cambió todo:

1. **Necesité recompilar al agregarlo.** Reanimated tiene una parte nativa, no es solo JS. Eso significa que ya no me alcanzaba Expo Go — me forzó a un Development Build.
2. **Dejé de poder usar Expo Web.** Reanimated no soporta web. Lo cual sonó a "ya wey, ¿y qué?" hasta que recordé que mi loop de desarrollo más rápido era abrir el browser y ver mi cambio en 200ms. Eso lo perdí.
3. **Tuve que rediseñar mi flujo.** En lugar de iterar en web y testear en device de vez en cuando, me moví completo a Development Build + OTA. Cada cambio de JS lo pruebo en el celular, no en el browser.

¿Vale la pena? Para los efectos que estoy logrando con Reanimated, sí. Pero no me lo pintaron así de antemano. Si Expo Web es importante para ti, agregar Reanimated te va a doler.

## El veredicto sin hedge

**Lo recomiendo si:**
- Construyes pet projects, MVPs, side businesses, o aprendes mobile.
- Ya sabes React y no quieres aprender Swift/Kotlin/Dart de paso.
- Quieres iterar rápido sin ensuciar tu máquina con SDKs nativos.
- Tu app cabe en el "happy path" — UI, formularios, lógica, llamadas a APIs, animaciones decentes.

**No lo recomiendo si:**
- Necesitas algo muy custom a nivel nativo y no hay un paquete `expo-*` que lo cubra.
- Trabajas con hardware específico (Bluetooth de baja energía con protocolos raros, sensores médicos, NFC con flows custom).
- Tu equipo ya tiene CI custom para builds nativas y meter EAS Build sería un downgrade.
- Sufres cuando un framework te oculta el `gradle`.
- Tu producto va a vivir 5+ años y no quieres atarte al pricing de Expo a largo plazo — EAS Build y EAS Update te atan a su nube, y eso es una decisión que con el tiempo cuesta deshacer.

Como todo framework, Expo te empuja por un carril. Mientras estés ahí, vuelas. Cuando lo necesitas romper, te cuesta. Para Mi Feria, no necesito romperlo.

---

Si te interesa Mi Feria, va a estar pronto en Google Play en beta cerrada para Android, y el [landing](https://mi-feria.notdefined.dev/) tiene los detalles. Si te interesa armar tu propia app y aún tienes el reflejo de pensar *"pero necesito Android Studio"*… no, ya no. Lo intenté así también hace años y juré que nunca más. Expo + devcontainer + tunnel me dio cuatro meses de desarrollo limpio antes de toparme con la primera muralla — y la muralla (Reanimated) la pude rodear.
