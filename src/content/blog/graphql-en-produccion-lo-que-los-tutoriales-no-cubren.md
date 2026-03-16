---
title: "GraphQL en producción: lo que los tutoriales no cubren"
description: "N+1 es el problema obvio. Pero hay toda una lista de cosas que te muerden tres meses después de lanzar: pagination, schema versioning, rate limiting por complejidad. Acá está el mapa."
pubDate: 2025-07-22
tags: ["graphql", "backend", "api"]
draft: false
---

## TL;DR

- **N+1 es el primer problema** — el DataLoader pattern lo resuelve con batching automático
- **Cursor-based pagination** sobre offset cuando la tabla crece — offset se vuelve lento a escala
- **Schema versioning sin breaking changes**: deprecate fields, nunca los borres de inmediato
- **Rate limiting por complejidad de query** en lugar de por número de requests — un solo query puede ser devastador
- **Introspection desactivada en producción** — tu schema es información sensible

---

Todo equipo que lanza GraphQL pasa por lo mismo: los primeros dos meses todo funciona, el equipo está contento, los queries son flexibles. Luego alguien en el frontend agrega un campo más, otro campo más, y de repente la DB tiene 50,000 queries por request y los pods están en el suelo. Así se ve GraphQL en producción.

Este post es el mapa que nadie te da en el tutorial de intro. Todo lo que te muerde tres meses después de lanzar.

## N+1: el clásico que sigue apareciendo

Si vienes de Rails, ya conoces el N+1. En GraphQL es exactamente igual pero más fácil de cometer sin darte cuenta — porque el cliente define el query, no tú:

```graphql
query {
  users {
    id
    name
    posts {       # ← esto dispara un query por usuario
      title
    }
  }
}
```

Si tienes 100 usuarios, son 101 queries: 1 para usuarios + 100 para los posts de cada uno.

La solución es el **DataLoader pattern**: en lugar de resolver cada `posts` inmediatamente, acumula los IDs y hace un solo query batch:

```javascript
// Sin DataLoader — N+1
const resolvers = {
  User: {
    posts: async (user) => {
      return db.query('SELECT * FROM posts WHERE user_id = $1', [user.id]);
      // Se llama N veces, una por usuario
    }
  }
};

// Con DataLoader — 1 query batch
import DataLoader from 'dataloader';

const postsByUserLoader = new DataLoader(async (userIds) => {
  // Recibe un array de IDs — hace UN solo query
  const posts = await db.query(
    'SELECT * FROM posts WHERE user_id = ANY($1)',
    [userIds]
  );

  // DataLoader requiere que el resultado mantenga el orden de los IDs
  return userIds.map(id => posts.filter(p => p.user_id === id));
});

const resolvers = {
  User: {
    posts: (user) => postsByUserLoader.load(user.id)
    // load() acumula llamadas y hace batch automáticamente
  }
};
```

DataLoader tiene que instanciarse **por request**, no como singleton global — de lo contrario los batches de un request se mezclan con los de otro.

## Pagination: cursor vs offset

Los tutoriales enseñan offset pagination porque es simple:

```graphql
query {
  posts(offset: 20, limit: 10) {
    id
    title
  }
}
```

El problema: `SELECT * FROM posts LIMIT 10 OFFSET 20000` requiere que PostgreSQL cuente y descarte 20,000 filas. Con tablas grandes, eso escala horriblemente.

**Cursor-based pagination** usa el ID del último item como referencia:

```graphql
# Cursor pagination — la forma correcta
query {
  posts(first: 10, after: "cursor_opaco_del_ultimo_item") {
    edges {
      node {
        id
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

```javascript
// Implementación básica con cursor opaco (base64 del ID)
const resolvers = {
  Query: {
    posts: async (_, { first = 10, after }) => {
      let afterId = null;
      if (after) {
        afterId = parseInt(Buffer.from(after, 'base64').toString());
      }

      const query = afterId
        ? 'SELECT * FROM posts WHERE id > $1 ORDER BY id LIMIT $2'
        : 'SELECT * FROM posts ORDER BY id LIMIT $1';

      const params = afterId ? [afterId, first + 1] : [first + 1];
      const posts = await db.query(query, params);

      const hasNextPage = posts.length > first;
      const edges = posts.slice(0, first).map(post => ({
        node: post,
        cursor: Buffer.from(String(post.id)).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges[edges.length - 1]?.cursor,
        },
      };
    }
  }
};
```

La query con cursor usa `WHERE id > last_id` + `LIMIT` — PostgreSQL puede usar el índice directamente sin contar filas. Funciona igual de rápido en la página 1 que en la página 10,000.

## Schema versioning sin breaking changes

GraphQL no tiene versiones de API explícitas — el schema evoluciona. Cuando necesitas cambiar algo, el flujo correcto es:

```graphql
# NUNCA hagas esto — eliminar un campo rompe clientes existentes
type User {
  id: ID!
  # name: String  # ← borraste esto y rompiste todos los que lo usaban
  fullName: String
}

# Haz esto — depreca, no borres
type User {
  id: ID!
  name: String @deprecated(reason: "Usa fullName en su lugar")
  fullName: String
}
```

El flow de deprecación:
1. Agrega el campo nuevo (`fullName`)
2. Depreca el viejo (`name`) con `@deprecated`
3. Comunica a los clientes que tienen N semanas/meses para migrar
4. Monitorea si alguien sigue usando el campo deprecated (los frameworks GraphQL pueden loggear esto)
5. Solo entonces eliminas el campo deprecated

Para cambios más drásticos (renombrar un tipo, cambiar la firma de una query), considera hacer el cambio aditivo primero:

```graphql
# Antes
type Query {
  user(id: ID!): User
}

# Transición segura — agrega el nuevo, depreca el viejo
type Query {
  user(id: ID!): User @deprecated(reason: "Usa userById")
  userById(id: ID!): User
}

# Cuando nadie usa user() → lo eliminas
```

## Rate limiting por complejidad de query

Un solo query de GraphQL puede ser devastador:

```graphql
# Este query puede explotar tu base de datos
query {
  users {           # 10,000 usuarios
    posts {         # × 50 posts por usuario = 500,000
      comments {    # × 100 comentarios por post = 50,000,000
        author {
          posts {   # recursión infinita potencial
            # ...
          }
        }
      }
    }
  }
}
```

Rate limiting por número de requests no ayuda aquí — es un solo request. Necesitas limitar por **complejidad**:

```javascript
import { createComplexityRule, fieldExtensionsEstimator } from 'graphql-query-complexity';

const server = new ApolloServer({
  schema,
  validationRules: [
    createComplexityRule({
      maximumComplexity: 1000,  // límite máximo
      estimators: [
        // Estima la complejidad según el tipo de campo
        fieldExtensionsEstimator(),
        // Por defecto: cada campo suma 1
        (options) => options.childComplexity + 1,
      ],
      onComplete: (complexity) => {
        console.log(`Query complexity: ${complexity}`);
      },
    }),
  ],
});

// También puedes asignar complejidad por campo en el schema
const typeDefs = gql`
  type Query {
    users: [User] @complexity(value: 10, multipliers: ["limit"])
    user(id: ID!): User @complexity(value: 1)
  }
`;
```

Con esto, el query anterior fallaría antes de llegar a tu base de datos.

## Introspection en producción — el regalo que nadie pidió

Por defecto, GraphQL expone un endpoint de introspection que devuelve todo tu schema. Gratis. Para cualquiera que haga el request:

```graphql
# Cualquiera puede hacer esto y ver tu schema completo
query {
  __schema {
    types {
      name
      fields {
        name
        type { name }
      }
    }
  }
}
```

En desarrollo es útil — GraphiQL y Apollo Studio lo usan. En producción es información que no necesitas exponer:

```javascript
// Desactivar introspection en producción
const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
});
```

Si necesitas que herramientas internas usen introspection en producción, hazlo con autenticación:

```javascript
introspection: (request) => {
  return request.headers.get('x-internal-token') === process.env.INTERNAL_TOKEN;
},
```

## Tabla de problemas y soluciones

| Problema | Síntoma | Solución |
|----------|---------|----------|
| N+1 queries | Latencia alta en queries con relaciones | DataLoader con batching |
| Offset pagination lento | Páginas tardas a medida que avanzas | Cursor-based pagination |
| Breaking changes | Clientes se rompen al hacer deploys | @deprecated + migration period |
| Queries abusivos | Una query mata el servidor | Complexity limiting |
| Schema expuesto | Info sensible en producción | Disable introspection |

---

Estas cinco cosas no son edge cases — son el precio de admisión para una API GraphQL que sobrevive más de tres meses en producción. La buena noticia: todas tienen solución bien establecida. La mala: tienes que implementarlas tú, y nadie te va a avisar hasta que algo explote.

Ya lo sabes. Ahora no tienes excusa.
