---
title: "Los R-trees son muñecas rusas de bounding boxes"
date: 2026-04-29
tags: ["data-structures", "rbush", "javascript", "spatial"]
---

Estaba leyendo sobre PostGIS para evaluar si me servía y, entre tantos posts, vi mencionada [`rbush`](https://github.com/mourner/rbush). Pensé *"ah, parece fácil, lo pruebo rápido para descartarlo"*. No lo descarté.

Un R-tree, lo que `rbush` implementa, son muñecas rusas de bounding boxes. Cada nodo padre tiene un bbox que contiene los bboxes de sus hijos — y si tu punto de consulta no cabe en el bbox del padre, ya descartaste todo lo que vive dentro de él, sin abrir las muñecas chicas. Ese es el `O(log n)` del search: no es magia, es no abrir cajas que ya sabes que no te interesan.

```js
import RBush from 'rbush';

const tree = new RBush();
tree.insert({ minX: -99.20, minY: 19.35, maxX: -99.18, maxY: 19.37, id: 'polanco' });
tree.insert({ minX: -99.16, minY: 19.41, maxX: -99.14, maxY: 19.43, id: 'condesa' });

tree.search({ minX: -99.19, minY: 19.36, maxX: -99.19, maxY: 19.36 });
// => [{ ..., id: 'polanco' }]
```

A mi forma de verlo, lo más útil del descubrimiento no fue `rbush` en sí. Fue acordarme que la herramienta "que todos usan" no siempre es la correcta para tu caso. Estuve a un Stack Overflow de meterme a PostGIS con todo el equipaje, cuando lo que necesitaba cabía en una librería de Node con un README de 300 líneas — y en mi caso, un point-in-polygon encima para evaluar las geocercas reales.
