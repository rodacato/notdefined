---
title: 'El ledger de doble entrada tiene que ser aburrido e inmutable'
date: 2026-06-22
tags: ['fintech', 'ledger', 'double-entry', 'architecture']
---

No es la primera vez que me enfrento a la pregunta de si hay errores o fugas de dinero. La viví en Pay By Group, otra vez en Invoy, y para cuando llegué a Monato —una plataforma de bill-payments— era obvio que faltaba la pieza que cierra esa pregunta: un **ledger de doble entrada**. El detonante fue un refactor donde las pérdidas iban a ser reales. No tenía el lujo de esperar a que mis cambios de V2 salieran bien; tenía que **comprobarlo**, y no solo lo mío: también V1 seguía moviendo dinero. Necesitaba una red de seguridad que me dijera, en todo momento, dónde estaba cada peso. La pregunta de fondo era una sola: _"¿estamos perdiendo dinero?"_.

La idea contable tiene siglos y es simple: cada movimiento toca **al menos dos** cuentas, con débitos y créditos que siempre suman lo mismo de los dos lados. Un usuario paga $100 de su adeudo:

| Cuenta                      | Débito | Crédito |
| --------------------------- | ------ | ------- |
| Caja                        | $100   |         |
| Cuenta por cobrar (usuario) |        | $100    |

El **Debe** es igual al **Haber** (los nombres de toda la vida de las dos columnas). El saldo de una cuenta no es un campo que editas — es la **consecuencia** de sumar sus asientos. Por eso cuadra por diseño: si algo no suma cero, algo está mal, y te enteras ahí, no tres semanas después en un reporte.

Pero el aprendizaje real, el que me costó verlo dos veces, es este: **el ledger tiene que ser tonto e inmutable**. Su trabajo es registrar asientos y dejar que el saldo salga de sumarlos — nada más. No es el lugar para tu lógica de negocio. En el momento en que le metes reglas —cómo se cobra, estados de cuenta, "es que para este caso el saldo se calcula distinto"— se ensucia, deja de cuadrar, y pierdes lo único que te daba: la verdad. El saldo contable lo derivas de él; las **reglas** de negocio viven afuera. Lo he visto ensuciarse dos veces, y las dos el síntoma fue el mismo: dejó de cuadrar. Asientos que entran y nunca se editan.

En Monato encajó natural porque el dominio ya tenía actores, cuentas por cobrar y adeudos, y porque pasan cosas síncronas y asíncronas — más razones para tener una fuente de verdad independiente que reconcilie todo. A mi forma de verlo, si trabajas en fintech la pregunta no es _si_ necesitas un ledger de doble entrada, sino cuándo te va a doler no tenerlo. Es la diferencia entre _creer_ que el dinero está bien y poder _demostrarlo_.
