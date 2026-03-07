---
title: "PostgreSQL EXPLAIN ANALYZE: leyendo lo que tus queries realmente hacen"
description: "La mayoría de los devs corren queries sin leer un solo plan de ejecución. Acá te enseño a leer EXPLAIN ANALYZE sin necesitar conocimientos de DBA."
pubDate: 2025-04-08
tags: ["postgresql", "backend", "performance"]
draft: false
---

## TL;DR

- **`EXPLAIN ANALYZE`** ejecuta la query y te muestra el plan real con tiempos — usa `EXPLAIN` si no quieres ejecutarla
- **Seq Scan** = recorre toda la tabla fila por fila. **Index Scan** = usa un índice. La diferencia puede ser 100x
- El **costo** en el plan es relativo (no son milisegundos). Lo que importa es **actual time** y **actual rows**
- Si `actual rows` >> `rows` estimado, las estadísticas de tu tabla están desactualizadas — corre `ANALYZE`
- El patrón más común de slowness: un **Seq Scan en tabla grande** o un **Nested Loop** con muchas iteraciones

---

## Por qué la mayoría de los devs ignora los query plans

Porque nunca nadie les enseñó a leerlos — los DBAs lo saben y no están muy dispuestos a compartir ese conocimiento sin cobrar consultaría. Los planes de ejecución *parecen* criptográficos al principio, pero en realidad son un árbol de operaciones con tres números que importan: `cost`, `actual time`, y `rows`. El resto es ruido hasta que necesitas ir más profundo.

¿No me crees? Mira el output de un plan real y te prometo que en 10 minutos vas a poder leerlo. Vamos.

## EXPLAIN vs EXPLAIN ANALYZE

```sql
-- EXPLAIN — muestra el plan ESTIMADO, no ejecuta la query
EXPLAIN SELECT * FROM orders WHERE user_id = 42;

-- EXPLAIN ANALYZE — EJECUTA la query y muestra el plan real
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42;

-- La versión que más vas a usar en práctica
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT * FROM orders WHERE user_id = 42;
```

Usa `EXPLAIN` cuando no quieras ejecutar la query (DML lento, queries destructivas). Usa `EXPLAIN ANALYZE` para ver qué pasó en realidad. `BUFFERS` agrega información de cache hits — útil para ver si la query está leyendo de disco o de memoria.

## Leyendo el plan paso a paso

```
EXPLAIN ANALYZE SELECT o.*, u.email
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'pending'
  AND o.created_at > NOW() - INTERVAL '30 days';
```

Output típico:

```
Hash Join  (cost=234.50..8921.30 rows=4823 width=152) (actual time=12.4..89.3 rows=5102 loops=1)
  Hash Cond: (o.user_id = u.id)
  ->  Seq Scan on orders o  (cost=0..7823.10 rows=4823 width=120) (actual time=0.04..67.2 rows=5102 loops=1)
        Filter: ((status = 'pending') AND (created_at > (now() - '30 days'::interval)))
        Rows Removed by Filter: 94823
  ->  Hash  (cost=134.50..134.50 rows=8000 width=32) (actual time=11.8..11.8 rows=8000 loops=1)
        Buckets: 8192  Batches: 1  Memory Usage: 486kB
        ->  Seq Scan on users u  (cost=0..134.50 rows=8000 width=32) (actual time=0.03..5.2 rows=8000 loops=1)
Planning Time: 0.8 ms
Execution Time: 89.7 ms
```

### Las partes que importan

**`cost=0..7823.10`** — el número de la izquierda es el costo de startup (antes de devolver el primer row), el de la derecha es el costo total. Son unidades relativas, no milisegundos. Útil para comparar nodos entre sí.

**`actual time=0.04..67.2`** — esto sí son milisegundos. El número de la izquierda es cuándo devolvió el primer row, el de la derecha es cuándo terminó.

**`rows=4823`** (estimado) vs **`rows=5102`** (actual) — si estos números difieren mucho, PostgreSQL está adivinando mal la selectividad de tus filtros. En este caso están razonablemente cerca (5%), pero si ves estimados de 100 vs actuals de 50,000, hay un problema.

**`Rows Removed by Filter: 94823`** — PostgreSQL leyó 94,823 + 5,102 = 99,925 filas para devolverte 5,102. Eso es un Seq Scan ineficiente.

## Seq Scan vs Index Scan: la diferencia más importante

```sql
-- Sin índice en status + created_at: Seq Scan
Seq Scan on orders  (actual time=0.04..67.2 rows=5102)
  Filter: ((status = 'pending') AND (created_at > ...))
  Rows Removed by Filter: 94823  -- leyó 100K filas para devolver 5K

-- Con índice compuesto: Index Scan
Index Scan using idx_orders_status_created on orders  (actual time=0.08..4.3 rows=5102)
  Index Cond: ((status = 'pending') AND (created_at > ...))
  -- leyó ~5K filas directamente
```

La diferencia: 67ms vs 4.3ms. Para una query que se llama miles de veces por hora, eso se convierte en segundos de latencia agregada.

El índice para este caso:

```sql
CREATE INDEX idx_orders_status_created
ON orders (status, created_at)
WHERE status = 'pending';  -- partial index, solo los pending
```

El `WHERE` en el índice es un partial index — más pequeño, más rápido para este caso específico.

## Los nodos de join y cuándo preocuparse

PostgreSQL elige entre tres estrategias de join dependiendo del tamaño de las tablas:

| Join Type | Cuándo aparece | Preocúpate si... |
|-----------|---------------|-----------------|
| **Hash Join** | Tablas medianas/grandes | El hash spills to disk (`Batches > 1`) |
| **Nested Loop** | Tablas pequeñas o con índice | `loops` es muy alto (> 1000) |
| **Merge Join** | Inputs ya ordenados | Raro verlo, generalmente está bien |

El Nested Loop con muchos loops es el que más duele:

```
Nested Loop  (actual time=0.1..8432.0 rows=5102 loops=1)
  ->  Seq Scan on orders o  (actual time=0.04..12.3 rows=5102 loops=1)
  ->  Index Scan using users_pkey on users u  (actual time=1.6..1.6 rows=1 loops=5102)
```

¿Ves el `loops=5102` en el Index Scan? PostgreSQL hizo 5,102 lookups individuales por usuario. Cada uno tarda 1.6ms. Total: 8.4 segundos solo para los lookups.

El fix: asegúrate de que las columnas de join tengan índices, y si el join es grande, considera si puedes reestructurar la query.

## El ejemplo real: de 8 segundos a 80ms

Una query de reporte en un proyecto de e-commerce. Corría bien con 10K órdenes. Con 500K órdenes, tardaba 8 segundos:

```sql
-- La query original
SELECT
  p.name,
  SUM(oi.quantity) as total_sold,
  SUM(oi.quantity * oi.unit_price) as revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'completed'
  AND o.completed_at BETWEEN '2025-01-01' AND '2025-03-31'
GROUP BY p.id, p.name
ORDER BY revenue DESC
LIMIT 50;
```

```
-- Plan original (simplificado)
Sort  (actual time=7823..7823 rows=50)
  ->  HashAggregate  (actual time=7421..7803 rows=8234)
        ->  Hash Join  (actual time=234..6892 rows=892341)
              ->  Seq Scan on order_items  (actual time=0.1..1823 rows=2847392)
              ->  Hash  (actual time=234..234 rows=48923)
                    ->  Seq Scan on orders  (actual time=0.1..212 rows=48923)
                          Filter: (status = 'completed' AND completed_at BETWEEN ...)
                          Rows Removed by Filter: 451077

Execution Time: 8241 ms
```

El problema: Seq Scan en `order_items` con 2.8M filas, y Seq Scan en `orders` filtrando 451K filas.

```sql
-- Índices que faltaban
CREATE INDEX idx_orders_status_completed
ON orders (status, completed_at)
WHERE status = 'completed';

CREATE INDEX idx_order_items_order_id
ON order_items (order_id);
```

```
-- Plan optimizado
Sort  (actual time=78..78 rows=50)
  ->  HashAggregate  (actual time=71..77 rows=8234)
        ->  Hash Join  (actual time=8.3..51 rows=892341)
              ->  Seq Scan on order_items  (actual time=0.1..18 rows=892341)
              ->  Hash  (actual time=8.2..8.2 rows=48923)
                    ->  Index Scan using idx_orders_status_completed on orders
                          (actual time=0.1..4.3 rows=48923)

Execution Time: 81 ms
```

De 8.2 segundos a 81ms. El `order_items` sigue siendo Seq Scan porque la query necesita todos los items de las órdenes filtradas — en ese caso, el Seq Scan está bien.

## Tip: usa explain.dalibo.com para vizualizar

Si el plan en texto te marea, pega el output de `EXPLAIN (ANALYZE, FORMAT JSON)` en [explain.dalibo.com](https://explain.dalibo.com). Te da una visualización del árbol con los nodos más lentos en rojo. Mucho más fácil de leer cuando el plan tiene 30 nodos.

```sql
-- Para obtener el JSON
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) tu_query_aqui;
```

---

No necesitas ser DBA para leer query plans. Necesitas saber que `Seq Scan en tabla grande + Rows Removed by Filter alto` = índice que falta, y que `Nested Loop con loops=N alto` = posiblemente un join sin índice. Con eso resuelves el 80% de los problemas de performance.

De 8.2 segundos a 81ms con dos índices. No está mal para 10 minutos de trabajo. Vámonos.
