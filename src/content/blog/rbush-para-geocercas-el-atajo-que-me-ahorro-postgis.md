---
title: "rbush para geocercas: el atajo que me ahorró PostGIS"
description: "Cómo descarté PostGIS para detectar entrada y salida de geocercas poligonales en un sistema de rastreo vehicular, y por qué un R-tree en memoria con rbush + raycasting terminó siendo más simple, más rápido de leer y suficiente para mi caso real."
pubDate: 2026-05-08
tags: ["nodejs", "geofencing", "rbush", "postgis", "javascript"]
draft: false
---

## TL;DR

- En una app de **rastreo vehicular** se agregó un feature de **valet parking**: el cliente crea una geocerca poligonal y la app le avisa si el carro abandona la zona o excede velocidad.
- Empecé pensando en **PostGIS**. Leyendo por encima encontré que es bueno con geocercas circulares pero se vuelve más retador con polígonos arbitrarios, y todo el procesamiento se va a la base de datos — que es la pieza más cara de escalar.
- Cambié a **`rbush`**: un R-tree en memoria que indexa cada geocerca por su **bounding box**. En cada evento hago `tree.search(bbox del punto)` y solo a los candidatos les corro **raycasting** (point-in-polygon).
- El árbol se rehace cada minuto desde el snapshot de geocercas armadas — coincide con la cadencia a la que los vehículos reportan posición. **10 a 1,000 geocercas se procesan en milisegundos**.
- El gran win no fue performance. Fue **tener el control** — leer el código y saber qué está pasando, en lugar de confiar en el planner de Postgres y los recursos del servidor.

---

## El feature que disparó todo

Trabajo en una app mobile de rastreo vehicular. El dispositivo en el carro reporta posición cada minuto mientras el motor está encendido. Nada raro, lo típico.

Llegó la pieza nueva: **valet parking**. Dejas tu carro con el valet, en la app dibujas una geocerca alrededor del lote donde debe quedarse, y si el carro sale de esa zona o acelera de más, la app te avisa. Útil para gente que no confía 100% en que su valet va a estacionar y se va a sentar en una banca.

Las geocercas no son círculos. Son polígonos de N aristas — un hexágono, un trapecio, lo que el usuario dibuje. Y cada geocerca aplica solo a **el carro del cliente que la armó**, no a todos los carros que pasen por ahí. Si no, una geocerca en el centro de Polanco prendería alertas en cadena cada vez que pasara un Uber.

## Por qué no PostGIS

Antes de escribir una línea me senté a investigar PostGIS. Es lo "estándar" cuando ves "geometrías + base de datos". Lo respeto, lo he visto en producción, pero leyendo más a fondo dos cosas me empezaron a hacer ruido.

La primera: PostGIS es excelente con geocercas circulares (`ST_DWithin`, todo el toolkit clásico), pero con polígonos arbitrarios la cosa se vuelve más cara y verbosa. No imposible — solo más feo.

La segunda fue la que me convenció. El pedo es que todo el procesamiento espacial se ejecuta en la base de datos. Y el servidor de Postgres es justo la pieza más cara y dolorosa de escalar. En mi infra la BD es la cuenta más alta del recibo — punto. Subirle el tier es vertical y caro; agregar otro worker de Node es horizontal y trivial. Para una app que mete eventos cada minuto por vehículo, mover esa carga al backend de aplicación tiene mucho más sentido. Node escala horizontal con un `for` loop; Postgres escala con sufrimiento.

Aterricé las dos opciones en una comparación honesta antes de comprometerme:

| | PostGIS | rbush en Node |
|---|---|---|
| Geocercas circulares | Muy bueno (`ST_DWithin`) | Lo puedes hacer, pero el ecosistema no es su fuerte |
| Polígonos arbitrarios | Funciona, más verboso y caro | Una llamada a `search` + raycasting |
| Dónde corre el cómputo | En la BD (la pieza cara) | En el worker de la app (la pieza barata de escalar) |
| Setup | Extensión, migraciones, deploy | `npm i rbush` |
| Legibilidad del código | SQL con CTEs y `GEOMETRY` casts | JS plano que cualquier dev del equipo puede leer |
| Cuándo brilla | Queries geo complejas, intersecciones, áreas, distancias geodésicas | Point-in-polygon repetido, en memoria, alto volumen |

Para mi caso — un punto, muchos polígonos, evaluado cada minuto — la columna derecha era exactamente lo que necesitaba. Y mientras googleaba aparecieron menciones a `rbush`.

## La pieza clave: `rbush` + bbox + raycasting

[`rbush`](https://github.com/mourner/rbush) es un R-tree de JavaScript, en memoria. Le metes cosas con bounding box (`{minX, minY, maxX, maxY}`) y le pides `search` con otro bounding box: te regresa los candidatos cuyos bboxes intersectan tu query.

Imagínate buscando tu llave en cinco cajones de la casa. El R-tree te dice de entrada *"olvídate de los cuatro de la sala, tu llave no puede estar ahí"* — y ya solo abres el de la cocina. El bbox es eso: la regla rápida que te quita 4 de 5 candidatos sin esfuerzo. Y la regla es barata — comparar números, no abrir cajones.

Mira cómo se ve en su forma más simple:

```js
import RBush from 'rbush';

const tree = new RBush();
tree.insert({ minX: -99.20, minY: 19.35, maxX: -99.18, maxY: 19.37, id: 'fence-polanco' });

const point = { lng: -99.19, lat: 19.36 };
const candidates = tree.search({
  minX: point.lng, minY: point.lat,
  maxX: point.lng, maxY: point.lat,
});
// candidates = [{ ..., id: 'fence-polanco' }]
```

Eso es la mitad del juego. La otra mitad es la evaluación final, que sigue siendo cara: ver si un punto está dentro de un polígono arbitrario. Para eso usé **raycasting** — el algoritmo clásico de point-in-polygon donde lanzas un rayo desde el punto y cuentas cuántas aristas cruza. Si cruza un número impar, el punto está adentro.

El truco completo es:

1. Saco el bbox de cada geocerca y la inserto en el árbol con ese bbox como llave.
2. Cuando llega un evento de posición, hago `tree.search` con un bbox degenerado (el punto mismo). El árbol descarta jerárquicamente todas las geocercas cuyo bbox no contiene el punto.
3. A los pocos candidatos sobrevivientes les aplico raycasting. Solo ahí pago el costo del cómputo de polígono.

¿No me crees que esto importa? Imagínate 500 geocercas activas en CDMX. Sin el pre-filtro de bbox tendría que correr raycasting contra 500 polígonos por cada reporte de cada vehículo cada minuto. Con el bbox como pre-filtro, en el peor caso evalúo dos o tres polígonos — el resto se descarta jerárquicamente con comparaciones de números. Ese es todo el truco. No es magia, es escoger mejor *qué* preguntar.

Esta es la pieza que terminó en producción, sin adornos:

```js
function createGeofencesIndex({ geofenceRepository, logger = console }) {
  let byId = new Map();

  const spatialIndex = createSpatialIndex({
    loadSnapshot: async () => {
      const snapshot = await geofenceRepository.loadArmedSnapshot();
      const next = new Map();
      for (const geofence of snapshot) {
        if (hasValidVertices(geofence)) next.set(geofence.id, geofence);
      }
      byId = next;
      return snapshot;
    },
    projectEntry: (geofence) => {
      if (!hasValidVertices(geofence)) return null;
      const { minLat, maxLat, minLng, maxLng } = bboxOf(geofence.vertices);
      return {
        minX: minLng,
        minY: minLat,
        maxX: maxLng,
        maxY: maxLat,
        payload: geofence,
      };
    },
    logger,
  });

  return {
    reload: () => spatialIndex.reload(),

    findContainingForVehicle({ vehicleId, lat, lng }) {
      const candidates = spatialIndex.search({
        minX: lng,
        minY: lat,
        maxX: lng,
        maxY: lat,
      });
      const hits = [];
      for (const { payload: geofence } of candidates) {
        if (!geofence.watchedVehicleIds.has(vehicleId)) continue;
        if (rayCastingInside({ lat, lng }, geofence.vertices)) {
          hits.push(geofence);
        }
      }
      return hits;
    },

    findById: (id) => byId.get(id) || null,

    get size() {
      return spatialIndex.entryCount;
    },
  };
}
```

Una nota sobre `watchedVehicleIds.has(vehicleId)`: cada geocerca trae el set de vehículos a los que aplica. Si el evento es de un vehículo que esa geocerca no vigila, se descarta antes de raycasting. Es post-filtro, no pre-filtro espacial — pero a estas alturas el candidato ya pasó el bbox-search, así que el costo es trivial.

## Cómo encaja en el worker

Esto vive dentro de un worker de [`pg-boss`](https://github.com/timgit/pg-boss). El worker procesa los eventos de posición y necesita evaluar geocercas en tiempo real, pero esos datos cambian poco — las geocercas se arman y desarman de forma esporádica, no como los eventos que llueven cada minuto.

La estrategia es: **el árbol se rehace completo cada minuto** desde un snapshot fresco de la base de datos. Cuadra exactamente con la cadencia de reporte de los dispositivos, así que un evento nunca va a ver el árbol más viejo de un minuto.

¿Por qué rebuild en lugar de `tree.insert` / `tree.remove` selectivos? Pura honestidad: hmm, fue un *gut feeling*. Mi sospecha era que iterar updates y dejar que el R-tree se rebalancee me iba a meter en complejidad que no necesitaba — y el costo de rehacer 1,000 entradas en memoria es bajísimo. Aquí tengo que ser honesto contigo: **esto puede estar mal**. No corrí un benchmark serio que compare las dos estrategias. Es de los lugares del código donde si la app crece, el primer commit de "optimización real" va a probablemente borrar mi rebuild y poner inserts incrementales. Por ahora, simple gana. Por ahora.

Una cosa más sobre el reload: si la query a la BD falla, no me trago el árbol nuevo. El árbol viejo se queda en memoria, los eventos siguen evaluándose contra geocercas de un minuto atrás, y suelto una alerta al monitoring. Suena obvio pero es la diferencia entre *"mi servicio se cae si la BD parpadea"* y *"mi servicio degrada con gracia mientras alguien revisa la BD"*. Si yo fuera consumidor de la app, prefiero saber que mi carro salió del valet con un retraso de un minuto a no saberlo nunca porque el worker se trabó.

Probé con sets de **10 a 1,000 geocercas** y el procesamiento se queda en milisegundos. No mames, eso es órdenes de magnitud más rápido que cualquier query a una BD remota — y ni siquiera estoy optimizando. Nada de benchmarking exhaustivo de mi parte, solo lo suficiente para confirmar que no estoy construyendo sobre arena.

## El feeling honesto

Al inicio dudaba. PostGIS es lo que "se hace", y siempre que vas contra la opción default sientes que algo te va a estallar más adelante.

Pero conforme fui leyendo la API de `rbush` y armando el servicio, me gustó mucho una cosa: el código de infraestructura quedó separado del código de dominio. El servicio de dominio que evalúa "¿este vehículo se salió de su zona?" no sabe nada de árboles ni de bboxes — solo le pregunta al index. Eso, para mí, vale más que la performance.

Y hay otra cosa más sutil. Leyendo mi propio código sé exactamente qué está pasando: search, filtro de vehículo, raycasting. Tres pasos, los puedo trazar mentalmente. Con PostGIS estaría confiando en que el query planner elige el index correcto y que la BD no se está ahogando. No es desconfianza al producto — es que cuando algo falla en producción, prefiero leer 40 líneas de JS antes que `EXPLAIN ANALYZE` un join espacial.

## Cuándo volvería a PostGIS

No para este caso, probablemente nunca. Pero si en el futuro necesitara cosas que `rbush` no resuelve solo — calcular intersecciones de geometrías, áreas, distancias geodésicas reales con curvatura de la tierra, queries complejas combinando geo con datos relacionales — entonces sí. Para eso PostGIS existe.

Que PostGIS pueda hacer X no significa que deba. Esa confusión cuesta semanas. Mi caso era simple: "¿este punto está adentro de este polígono?" repetido muchas veces. Esa pregunta es chiquita: un índice espacial me descarta candidatos, raycasting evalúa los que sobreviven. Listo.

Si me hubieran dicho hace dos años que iba a estar resolviendo geocercas con un R-tree en memoria en lugar de PostGIS, les habría reído en la cara. Pero las herramientas no son religiones. Son lo que cabe en tu problema, no en el blog post con mejor SEO.
