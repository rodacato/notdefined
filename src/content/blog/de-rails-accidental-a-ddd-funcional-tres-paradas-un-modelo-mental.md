---
title: "De Rails accidental a DDD funcional: tres paradas, un modelo mental"
description: "Diez años modelando dominio en tres empresas: Pay By Group, Invoy y Monato. Cómo pasé de Clean Architecture con chispitas de DDD en Rails, a DDD funcional con dry-rb. Y por qué el approach restrictivo es paradójicamente el más fácil de enseñar a un equipo inexperto."
pubDate: 2026-05-22
tags: ["ddd", "architecture", "ruby", "functional"]
draft: false
series: "DDD funcional"
seriesOrder: 1
---

## TL;DR

- **Pay By Group** fue donde aprendí que la arquitectura por capas no salva si el código no habla el lenguaje del negocio
- En **Invoy**, sin Rails estorbando, `dry-rb` y el approach funcional por fin encajaron
- **Monato** fue donde entendí que el approach funcional es **más fácil de enseñar** que el OOP estilo Blue Book — al revés de lo intuitivo, aunque "más fácil" no fue "rápido": me tomó el doble del tiempo que estimé
- DDD ortodoxo te lleva a **análisis-parálisis**; el balance está en entender conceptos y boundaries, no aplicar el libro como dogma
- El principal contra del approach funcional siempre fue el **boilerplate** — y resulta que es justo el tipo de código que la IA escupe sin enredarse

---

## Pay By Group, 2016 — el monolito que se nos salió

Llegué a Pay By Group cuando la app era un monolito Rails de manual. En su momento, Rails era lo más nuevo y lo más usado para crear apps web, y la app estaba bien construida para sus tres primeros años de vida.

El pedo es que el negocio explotó. Casos de uso nuevos cada semana. Modelos que se cruzaban donde no debían. Y la misma lógica copiada en cinco lugares, siempre con tres diferencias sutiles que nadie recordaba. Lo que empezó como una arquitectura intencional terminó siendo lo que después aprendí a llamar **arquitectura accidental**: funciona, pero agregar cosas se vuelve cada vez más caro.

Por esa misma época apareció React, y el equipo decidió partir el monolito en dos: API en Rails, frontend en React. La idea: avanzar en paralelo, con interfaces y mocks acordados entre las partes para no pisarse los pies.

Aquí fue donde empezó mi viaje hacia DDD. No porque alguien dijera "vamos a hacer DDD" — fue porque el negocio empezó a pedir flexibilidad que la estructura no daba. Aterrizamos en la gema [`interactor`](https://github.com/collectiveidea/interactor) de collectiveidea. Validamos inputs con DTOs. Y separamos más explícito qué cosa vivía dónde: HTTP por su lado, lógica de negocio por otro, y la infraestructura en su propio rincón.

A los meses, el código se veía así (a grandes rasgos):

```
app/
  application/    # interactors, controllers HTTP
  core/           # lógica de negocio, entidades
  infrastructure/ # persistencia, clientes externos
```

A mi forma de verlo, eso no era DDD del libro azul. Era **Clean Architecture con chispitas de DDD**. Capas separadas. Dependencias apuntando hacia adentro. Los interactors hacían el papel de use cases. Reconocible para Uncle Bob, no para Evans.

Y mejoró la mantenibilidad. Pero no resolvió todo mágicamente.

Lo que descubrimos — y esto es la lección importante de PBG — es que la separación técnica no salva si el código no habla el lenguaje del negocio. Producto discutía un flujo y lo llamaba de una forma. El código lo llamaba de otra. Compliance tenía su propio nombre. Y la confusión se acumulaba en silencio cada vez que alguien traducía mal entre los tres mundos.

Por eso entendí finalmente para qué servía la parte de DDD que no es arquitectura: **ubiquitous language**. Mismo vocabulario en producto, en el código, en el daily, en los PRs. No es una práctica estética — es una práctica de mantenibilidad.

Eso fue PBG. Salí con un modelo mental nuevo: capas más lenguaje compartido. No suficiente, pero el primer paso.

## Invoy, 2019 — el giro funcional sin Rails de por medio

Invoy fue otro mundo. Equipo más pequeño, API en Sinatra (no Rails), varios servicios entre sí, apps móviles, back office. El hecho de que no estuviéramos en Rails nos dio el cambio real: **margen para experimentar sin pelearnos con el framework**.

Aquí empezó mi viaje con [dry-rb](https://dry-rb.org/) y su ecosistema. Y déjame ser honesto: al inicio no fue placentero. Las gemas estaban en desarrollo activo. Los breaking changes entre releases te obligaban a reescribir trozos enteros del código. Y la documentación vivía dispersa entre el sitio oficial, issues de GitHub, y blog posts del core team. Había semanas en que más se aprendía leyendo PRs que leyendo docs.

Pero DDD lo hizo todo más manejable. Ahora a los interactors les llamábamos **actions** — distinto nombre, mismo concepto: una regla de negocio encapsulada con un único punto de entrada, sin estado interno, con dependencias inyectadas.

Y Sequel (en vez de ActiveRecord) nos dejó hacer el patrón de **repositorios** sin pelearnos con el ORM, que es lo que siempre te toca cuando intentas el mismo shape sobre AR. Un `UserRepository` con métodos explícitos para cada query. La entity por su lado, sin saber de DB. Un mapper en medio traduciendo entre los dos. El típico shape de DDD táctico que en Rails se siente forzado — acá fluía.

El sweet spot llegó cuando empezamos a tener conversaciones distintas con el equipo de producto. Discutir un flujo era una delicia. Los nombres en código eran los mismos que producto usaba en las daily. Las fronteras entre acciones — claras. Y leer un action se sentía casi como leer prosa de negocio. Cuando producto pedía cambiar la lógica de cobro, la conversación iba directo al action que lo manejaba — no a una sesión de arqueología por callbacks distribuidos en cinco modelos.

El ejemplo concreto que más recuerdo: cuando movimos el billing de **pagos cada 30 días** a **suscripciones mensuales estables**, deprecamos el flujo viejo completo. No lo mantuvimos. No lo "extendimos cuidadosamente". Lo sustituimos. Y pudimos hacerlo porque el flujo viejo estaba bien encapsulado en su use case — no era una telaraña entre callbacks de Active Record, observers, y service objects.

Aún así nos tropezamos. Pero la diferencia con el monolito Rails de antes es que los tropezones vivían dentro de su propio action. No se filtraban a otros tres archivos por callbacks ocultos. Refactorizar uno no requería entender otros dos.

## Monato, 2025 — DDD en Rails, con un equipo nuevo en los conceptos

Después de Invoy, llegué a Monato. Rails otra vez. Pero el reto fue completamente distinto: un equipo sin experiencia previa en DDD, y la tarea de elevar el nivel del equipo al tiempo que les mostraba el approach.

Y aquí está la parte contraintuitiva — la que más me sorprendió a mí mismo.

Para un equipo inexperto, lo **clásico** sería empezar con DDD estilo Evans, OOP, modelos enriquecidos. La razón obvia: es más cercano a lo que el equipo ya conoce de Rails. ActiveRecord son entidades, los modelos pueden tener métodos de negocio, services como wrapper. Es Rails con etiquetas de DDD pegadas.

Yo hice lo opuesto. Me fui directo a DDD funcional con dry-rb. Y la razón es justo lo que esperarías que jugara en contra: el approach funcional es **más restrictivo en dónde va cada cosa**.

Y por eso (sí, justo por eso) es más fácil de enseñar.

Mira: en DDD OOP, "lógica de negocio" puede ir en el modelo, en un service, en un concern, en un policy, en una helper. Cinco lugares válidos. Un equipo inexperto sin disciplina lo distribuye según el día. En tres meses tienes el mismo monolito accidental que tenía PBG en sus peores días.

En DDD funcional con dry-rb, los lugares son explícitos y los nombres son discretos. Cada concepto vive en su carpeta y nada se cruza:

| Concepto | Dónde vive | Para qué sirve |
|---|---|---|
| Domain service | `domain/services/` | Reglas del dominio sin estado, reusables |
| Action (application service) | `application/actions/` | Orquestación de un único caso de uso |
| Aggregate | `domain/aggregates/` | Mantiene invariantes de consistencia |
| Repository | `infrastructure/repositories/` | Persistencia abstracta, sin SQL en el dominio |
| Event | `domain/events/` | Hechos pasados que otras partes escuchan |
| Infrastructure | `infrastructure/` | Todo lo que toca el mundo externo (DB, APIs, queues) |

Cuando le decía a un dev nuevo "esto es una regla de negocio reusable, va en un domain service", no había ambigüedad sobre dónde. Con un par de iteraciones, el siguiente PR del mismo dev ya ponía la regla en el lugar correcto sin que yo lo señalara. La ubicación dejó de ser la pelea — la pelea se mudó a los conceptos, y esa tardó más.

Y aquí entró el libro de [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/) de Scott Wlaschin. La palabra que mejor describe lo que sentí al leerlo es **alivio**. Tenía un lenguaje y una estructura para enseñar lo que en mi cabeza ya estaba pero que no podía articular tan limpio. El libro está en F#, pero el approach se traduce casi 1:1 a dry-rb en Ruby.

Lo más importante de Monato: **alejarme de ActiveRecord y DDD OOP fue lo que hizo el approach claro para el equipo**. No tuvieron que desaprender Rails idiomatic — tuvieron que aprender algo nuevo, lado a lado, con fronteras claras.

Hubo retos, y no eran técnicos: vender la visión, ganarme al equipo, demostrar las ventajas en código real sin sonar a vendedor de aceite de serpiente. Las primeras semanas fueron explicar lo mismo de tres formas distintas hasta que cayó la moneda con dos o tres devs. Después los demás siguieron — el código terminó siendo el mejor argumento, no yo.

Pero seré honesto con el timeline, porque acá la cagué en el estimado. Mi plan era que a los tres meses el equipo estuviera cómodo creando sus propios actions. No pasó. Subestimé cuánto pesa venir del Rails Way: la resistencia fue baja, eso te lo concedo, pero la brecha de experiencia es real y hay conceptos que de plano confunden. El clásico es entities vs models — para alguien que lleva años con ActiveRecord son la misma cosa, hasta que dejan de serlo. No fue un deal breaker. Fue el learning que me llevo: el approach es más fácil de enseñar, pero "más fácil" no es "rápido".

¿Cuándo cayó de verdad? Como al sexto mes. Ahí el equipo ya entendía el modelo, lo platicaba en los dailies con el vocabulario correcto, y armaba sus propios actions bajando el acoplamiento de cada feature nueva. El doble de lo que había prometido. Pero llegó.

## Por qué DDD ortodoxo es un mal consejo

Una cosa que aprendí en estas tres paradas: **DDD aplicado de forma ortodoxa y dogmática te lleva a análisis-parálisis**.

¿Es esto un value object o una entity? ¿Esta operación es un domain service o un application service? ¿Mi aggregate root debería ser este o aquel? Si las respuestas requieren tres reuniones de arquitectura, ya perdiste.

A mi forma de verlo, el balance está en entender los **conceptos** y los **boundaries** — pero usarlos como herramientas, no como check-list. Si el equipo entiende qué es un aggregate y por qué importa, ya tiene el 80% del valor. El otro 20% se va peleando con el dogma del libro que dice "los aggregates deben tener tal y tal propiedad y se implementan así".

Controlar la deuda técnica del approach es parte del trabajo. Algunos lugares no necesitan toda la disciplina. Un endpoint que solo lista cosas no necesita action + domain service + repository + DTO. Un módulo con un método es suficiente. Decidir cuándo aplicar disciplina y cuándo dejarla pasar es la parte difícil — la que el dogma no te enseña.

## El twist que esto vino a tener

Hay un punto que dejé colgado: el contra clásico del approach funcional + DDD siempre fue el **boilerplate**. Tipos, structs, schemas, monads, actions, repositorios — todo declarado explícitamente, todo en su lugar dedicado.

Costo up-front a cambio de mantenibilidad después. Cuando se lo explicabas a alguien que llevaba años haciendo `User.create!`, la primera reacción era "¿todo eso para esto?".

Hmm. Resulta que ese boilerplate es justo lo que los LLMs escupen sin enredarse. Repetitivo. Predecible. Con shape claro. Mientras yo estaba en Invoy, la IA apenas empezaba a ser sólida — pero recuerdo que no le costaba adaptarse a nuestro código. Bastaban referencias mínimas y llegaba al 80% de lo que necesitaba.

Ahí ya vislumbraba el combo. Lo terminé de armar en Monato y lo desarrollo en la **parte 2**: por qué DDD funcional y la IA es la pareja perfecta que no vi venir, qué hace bien la IA con este approach (y qué no), y código lado a lado para que la diferencia se vea.

---

Controlas estas piezas de lego una a la vez. Y la IA te da alas.
