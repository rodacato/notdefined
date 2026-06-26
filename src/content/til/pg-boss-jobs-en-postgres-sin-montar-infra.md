---
title: 'pg-boss: dejé que Postgres fuera mi cola de jobs'
date: 2026-06-13
tags: ['pg-boss', 'postgresql', 'node', 'background-jobs', 'cron']
---

En Encontrol (el backend en Node de Encontrack) tengo varias cosas que correr fuera del request: procesar comunicaciones de los dispositivos, disparar alertas, detectar viajes, y un montón de trabajo de fondo. Venía resolviéndolo con crons, que funcionan hasta que dejan de funcionar — no hay reintentos, no hay visibilidad, y "córrelo cada 5 minutos" no es lo mismo que "córrelo una vez, bien". El pedo es que la alternativa clásica era montar Sidekiq o algo con RabbitMQ + Redis, y a la escala en la que estamos eso no se justifica todavía: más infra que mantener para un problema que aún no la pide.

Mi criterio fue claro: la opción **menos intrusiva**. La que no me obligara a meter infra nueva ni a casarme con la herramienta. Así llegué a [pg-boss](https://github.com/timgit/pg-boss): una cola de jobs que vive **dentro de tu Postgres**. Nada de Redis aparte, nada de un broker dedicado. Y lo que me voló la cabeza fue lo **fácil** que resultó: lo poco que ocupa para echarlo a andar, y cómo se hace cargo de todo —reintentos, scheduling, locking— con la base de datos que ya tenía:

```js
import PgBoss from 'pg-boss';

const boss = new PgBoss(process.env.DATABASE_URL);
await boss.start(); // crea su propio schema en Postgres y queda listo

// el job solo orquesta; la lógica vive en una clase aparte, reusable
await boss.work('detectar-viajes', async ([job]) => {
  await new TripDetector(job.data).run();
});

await boss.send('detectar-viajes', { deviceId });

// y lo que antes era cron, ahora es esto:
await boss.schedule('procesar-alertas', '*/5 * * * *');
```

Una decisión que tomé desde el principio: la lógica de negocio **no** vive dentro del handler. El handler solo orquesta; el trabajo real está en clases (`TripDetector`, etc.) que no saben que existe pg-boss. Si mañana esto crece y sí vale la pena un Sidekiq de verdad, cambio la capa de cola y no toco el dominio.

La caveat honesta: pg-boss se instala en su **propio schema** dentro de tu base (`pgboss`). No es raro y tiene todo el sentido —ahí guarda la cola, el estado, los jobs programados— pero la primera vez que abrí el Postgres y vi tablas que yo no creé fue un pequeño cambio de mentalidad. Tu base de datos ahora también es tu cola, y hay que verla así. Para el punto donde estoy, ese trade —cero infra nueva a cambio de un schema extra— es de los buenos.
