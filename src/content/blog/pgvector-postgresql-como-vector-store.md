---
title: "pgvector: usando PostgreSQL como vector store"
description: "pgvector lleva en producción desde 2023 y la mayoría de las apps no necesitan Pinecone ni Weaviate. Cómo instalar la extensión, guardar embeddings, buscar por similitud, y cuándo sí necesitas un vector DB dedicado."
pubDate: 2025-10-07
tags: ["postgresql", "ai", "backend"]
draft: false
---

## TL;DR

- **pgvector** es una extensión de PostgreSQL para guardar y buscar vectores de embeddings
- **Tres operadores de distancia**: L2 (`<->`), cosine (`<=>`), inner product (`<#>`) — cosine es el más común para embeddings de texto
- Para **búsqueda semántica** en una colección de hasta ~1M documentos, pgvector es suficiente sin Pinecone
- El índice **HNSW** (aproximado) es más rápido que IVFFlat para búsquedas; IVFFlat usa menos memoria
- Necesitas un vector DB dedicado cuando tienes **millones de vectores con alta concurrencia** o necesitas **filtros complejos + vector search** juntos sin degradar performance

---

## ¿Por qué no ir directo a Pinecone?

Pinecone, Weaviate, Qdrant — son excelentes herramientas rodeadas de un excelente marketing que quiere que creas que las necesitas desde el día uno. Son una dependencia más: otro servicio, otro costo mensual, otra cosa que puede fallar, otra cuenta que gestionar. Si ya tienes PostgreSQL, pgvector te da búsqueda por similitud sin salir de tu stack existente.

La pregunta correcta no es "¿pgvector o Pinecone?" sino "¿cuántos vectores tengo y qué throughput necesito?" Para la mayoría de las apps: pgvector gana. Por mucho.

## Instalación

```sql
-- En PostgreSQL (requiere pg >= 11)
CREATE EXTENSION vector;
```

```sh
# En Docker
docker run -e POSTGRES_PASSWORD=postgres ankane/pgvector

# En Ubuntu/Debian
sudo apt install postgresql-15-pgvector

# En macOS con Homebrew
brew install pgvector
```

Si usas un managed PostgreSQL (Supabase, Neon, Railway), pgvector ya viene incluido — solo actívalo:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Guardar embeddings

Primero, genera el embedding del texto con un modelo (OpenAI, Cohere, o local con sentence-transformers):

```javascript
// Generar embedding con OpenAI
import OpenAI from 'openai';

const openai = new OpenAI();

async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',  // 1536 dimensiones
    input: text,
  });
  return response.data[0].embedding;  // array de 1536 floats
}
```

```sql
-- Crear tabla con columna vector
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536),  -- dimensiones según el modelo
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

```javascript
// Guardar documento con su embedding
async function storeDocument(content, metadata = {}) {
  const embedding = await getEmbedding(content);

  await db.query(
    `INSERT INTO documents (content, metadata, embedding)
     VALUES ($1, $2, $3)`,
    [content, JSON.stringify(metadata), `[${embedding.join(',')}]`]
  );
}
```

## Los tres operadores de distancia

```sql
-- Distancia L2 (Euclidiana) — <->
-- Mide distancia en espacio vectorial. Sensible a la magnitud del vector.
SELECT content, embedding <-> '[0.1, 0.2, ...]' AS distance
FROM documents
ORDER BY distance
LIMIT 5;

-- Similitud cosine — <=>
-- Mide el ángulo entre vectores. Insensible a la magnitud — el más común para texto.
SELECT content, 1 - (embedding <=> '[0.1, 0.2, ...]') AS similarity
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 5;

-- Inner product — <#>
-- Útil cuando los vectores están normalizados (longitud = 1). Más rápido que cosine.
SELECT content, (embedding <#> '[0.1, 0.2, ...]') * -1 AS score
FROM documents
ORDER BY embedding <#> '[0.1, 0.2, ...]'
LIMIT 5;
```

Para embeddings de texto con `text-embedding-3-small` o similar: **cosine (`<=>`)** es la opción correcta. Los embeddings de texto capturan semántica en la dirección del vector, no en su magnitud.

## Búsqueda semántica en la práctica

```javascript
// Búsqueda semántica completa
async function semanticSearch(query, topK = 5, threshold = 0.7) {
  const queryEmbedding = await getEmbedding(query);

  const result = await db.query(
    `SELECT
       id,
       content,
       metadata,
       1 - (embedding <=> $1) AS similarity
     FROM documents
     WHERE 1 - (embedding <=> $1) > $2  -- filtro de threshold
     ORDER BY embedding <=> $1
     LIMIT $3`,
    [`[${queryEmbedding.join(',')}]`, threshold, topK]
  );

  return result.rows;
}

// Uso
const docs = await semanticSearch('¿cómo configuro autenticación con JWT?');
// => [
//   { content: "Para JWT, primero instala jsonwebtoken...", similarity: 0.92 },
//   { content: "La autenticación basada en tokens...", similarity: 0.87 },
//   ...
// ]
```

## Índices para búsqueda rápida

Sin índice, pgvector hace búsqueda exacta (sequential scan) — precisa pero lenta con muchos vectores. Los índices aproximados sacrifican algo de precisión por velocidad:

```sql
-- HNSW (recomendado para la mayoría de casos)
-- Más rápido en búsqueda, usa más memoria en build
CREATE INDEX ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- IVFFlat (alternativa)
-- Menos memoria, más lento. Requiere saber aproximadamente cuántos vectores tendrás.
CREATE INDEX ON documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- sqrt(número de vectores) como regla de inicio
```

```sql
-- Para búsquedas con HNSW, puedes ajustar ef_search (default 40)
-- Mayor ef_search = más preciso pero más lento
SET hnsw.ef_search = 100;

SELECT content, 1 - (embedding <=> $1) AS similarity
FROM documents
ORDER BY embedding <=> $1
LIMIT 5;
```

## En Ruby con ActiveRecord

```ruby
# Gemfile
gem 'neighbor'  # wrapper de pgvector para ActiveRecord

# db/migrate/20251007000000_create_documents.rb
class CreateDocuments < ActiveRecord::Migration[7.2]
  def change
    create_table :documents do |t|
      t.text :content, null: false
      t.jsonb :metadata, default: {}
      t.vector :embedding, limit: 1536
      t.timestamps
    end

    add_index :documents, :embedding,
      using: :hnsw,
      opclass: :vector_cosine_ops
  end
end

# app/models/document.rb
class Document < ApplicationRecord
  has_neighbors :embedding
end

# Búsqueda
embedding = OpenAIClient.embed(query)
Document.nearest_neighbors(:embedding, embedding, distance: :cosine).limit(5)
```

## Cuándo necesitas un vector DB dedicado

| Escenario | pgvector | Vector DB dedicado |
|-----------|----------|-------------------|
| < 1M documentos | ✓✓ | Overkill |
| 1M–10M documentos | ✓ (con HNSW) | Considera si la latencia importa |
| > 10M documentos | Puede ser lento | ✓ |
| Filtros complejos + vector search | ✓ (con cuidado) | Mejor soporte nativo |
| Alta concurrencia (>1000 búsquedas/s) | Limita según hardware | ✓ |
| Multitenancy con millones de colecciones | Posible | Más simple |
| Actualización frecuente de vectores | ✓ | ✓ |

El indicador real: si tu búsqueda vectorial tiene latencia > 200ms con índice HNSW y has optimizado el query, probablemente estás en el rango donde necesitas una solución dedicada.

---

pgvector es una de esas extensiones que hace exactamente lo que promete sin drama. Para un chatbot sobre tu documentación, búsqueda semántica en tu blog, o recomendaciones basadas en similitud — está más que sobrado.

El vector DB dedicado es para cuando el volumen o los requerimientos de concurrencia superan lo que PostgreSQL puede hacer cómodamente. Y esa barra es significativamente más alta de lo que los vendedores de Pinecone quieren que pienses.

Si tienes menos de 1M documentos: pgvector. Si llegas a ese límite, felicidades — en ese punto tienes un problema bueno que resolver.
