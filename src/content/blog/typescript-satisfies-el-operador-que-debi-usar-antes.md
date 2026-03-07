---
title: "TypeScript `satisfies`: el operador que debí usar antes"
description: "satisfies llegó en TypeScript 4.9 y la mayoría de devs sigue usando as o anotaciones explícitas. La diferencia es sutil pero evita bugs silenciosos que as nunca va a atrapar."
pubDate: 2025-06-03
tags: ["typescript", "javascript"]
draft: false
---

## TL;DR

- **`satisfies`** valida que un valor cumple un tipo sin **widening** — el tipo inferido sigue siendo el específico
- **`as`** fuerza un cast — le dice al compilador "confía en mí" aunque estés mintiendo
- **Las anotaciones explícitas** (`const x: Tipo = ...`) hacen widening — pierdes información de tipos más específicos
- Úsalo en **config objects**, **const maps**, y **discriminated unions** donde quieres validación sin perder precisión
- Si `as` está silenciando un error, probablemente `satisfies` es lo que necesitas

---

Seré honesto: usé `as` por años. "El compilador se queja, le digo que se calle, sigo adelante." Funciona hasta que no funciona, y cuando no funciona el error está a 3 capas de distancia del `as` que lo causó. `satisfies` llegó en TypeScript 4.9 y debí haberlo adoptado antes. Aquí te cuento por qué.

## El problema que satisfies resuelve

Imagina que tienes un mapa de configuración de rutas:

```typescript
type Route = {
  path: string;
  component: string;
  auth?: boolean;
};

// Opción 1: anotación explícita
const routes: Record<string, Route> = {
  home: { path: '/', component: 'HomePage' },
  profile: { path: '/profile', component: 'ProfilePage', auth: true },
};

// TypeScript sabe que routes.home existe, pero...
routes.home.path;        // string ✓
routes.typo.path;        // ✓ TypeScript no te avisa del typo — Record<string, Route> acepta cualquier key
```

El problema: anotaste `Record<string, Route>` y perdiste la información de qué keys existen realmente. TypeScript ahora acepta `routes.typo` sin quejarse.

```typescript
// Opción 2: satisfies
const routes = {
  home: { path: '/', component: 'HomePage' },
  profile: { path: '/profile', component: 'ProfilePage', auth: true },
} satisfies Record<string, Route>;

routes.home.path;        // string ✓
routes.typo.path;        // Error: Property 'typo' does not exist ✓
routes.home.component;   // TypeScript sabe que es string, no string | undefined ✓
```

`satisfies` valida la estructura sin widening: el tipo de `routes` sigue siendo el literal específico con las keys exactas que definiste, no el genérico `Record<string, Route>`.

## `satisfies` vs `as` vs anotación explícita

Vamos con un ejemplo concreto de cada uno para ver la diferencia real:

```typescript
type Color = 'red' | 'green' | 'blue';
type Palette = Record<string, Color | [number, number, number]>;

// as — el más peligroso
const palette = {
  primary: 'red',
  secondary: [0, 255, 128],
  danger: 'oops_this_is_wrong',  // ← TypeScript no dice nada
} as Palette;

// anotación explícita — valida, pero hace widening
const palette: Palette = {
  primary: 'red',
  secondary: [0, 255, 128],
  danger: 'oops_this_is_wrong',  // ← Error ✓ — pero...
};

palette.secondary.map(/* ... */);  // Error: Property 'map' may not exist
// TypeScript ve Color | [number, number, number], no [number, number, number]

// satisfies — valida Y preserva el tipo específico
const palette = {
  primary: 'red',
  secondary: [0, 255, 128],
  danger: 'oops_this_is_wrong',  // ← Error ✓
} satisfies Palette;

palette.secondary.map(/* ... */);  // ✓ TypeScript sabe que es un array
palette.primary.toUpperCase();     // ✓ TypeScript sabe que es string
```

| Operador | Valida estructura | Preserva tipo específico | Puede mentirle al compilador |
|----------|------------------|--------------------------|------------------------------|
| `as` | No | No | Sí |
| Anotación explícita | Sí | No (widening) | No |
| `satisfies` | Sí | Sí | No |

## Casos prácticos donde brilla

### Config objects con keys conocidas

```typescript
type AppConfig = {
  api: { url: string; timeout: number };
  features: Record<string, boolean>;
  theme: 'light' | 'dark';
};

const config = {
  api: { url: 'https://api.example.com', timeout: 5000 },
  features: { darkMode: true, betaUI: false },
  theme: 'light',
} satisfies AppConfig;

// TypeScript sabe que config.theme es 'light', no 'light' | 'dark'
// Útil para lógica condicional sin castear
if (config.theme === 'light') { /* ... */ }

// Y si agregas una key que no existe en AppConfig, error inmediato
const badConfig = {
  api: { url: '...', timeout: 5000 },
  features: {},
  theme: 'light',
  unknownKey: 'boom',  // Error: Object literal may only specify known properties
} satisfies AppConfig;
```

### Discriminated unions

```typescript
type Action =
  | { type: 'increment'; amount: number }
  | { type: 'reset' }
  | { type: 'setUser'; userId: string };

const actions = {
  inc: { type: 'increment', amount: 1 },
  reset: { type: 'reset' },
  login: { type: 'setUser', userId: 'u_123' },
} satisfies Record<string, Action>;

// TypeScript hace narrowing correcto:
actions.inc.amount;    // number ✓ (no undefined)
actions.reset.amount;  // Error: Property 'amount' does not exist on type '{ type: "reset" }' ✓
```

### Funciones que devuelven objetos tipados

```typescript
type HandlerMap = Record<string, (req: Request) => Response>;

const handlers = {
  GET: (req) => new Response('OK'),
  POST: (req) => new Response('Created', { status: 201 }),
  // DELETE: ...,  ← si lo olvidas, no pasa nada — depende de si tu tipo lo requiere
} satisfies Partial<HandlerMap>;

// TypeScript infiere el tipo de req correctamente en cada handler
// sin necesidad de anotar el parámetro manualmente
```

## Cuándo NO usar satisfies

No todo necesita `satisfies`. Si simplemente estás declarando una variable con un tipo conocido y no necesitas preservar las keys específicas, la anotación normal está bien:

```typescript
// Esto está perfectamente bien — no necesitas satisfies aquí
const user: User = await fetchUser(id);

// O cuando sí quieres widening (poco común pero válido)
const status: 'active' | 'inactive' = 'active';
// Quieres que sea el tipo unión, no el literal 'active'
```

La regla práctica: si después de escribir tu objeto vas a acceder a propiedades específicas que deberían estar disponibles, usa `satisfies`. Si solo necesitas que el valor cumpla un contrato y no te importa el tipo exacto más adelante, la anotación normal está bien.

---

`as` le dice a TypeScript "cállate". `satisfies` le dice "valida esto, pero no pierdas información". La próxima vez que escribas `as AlgunTipo` para callar un error, pregúntate si en realidad lo que necesitas es `satisfies`. Probablemente sí.
