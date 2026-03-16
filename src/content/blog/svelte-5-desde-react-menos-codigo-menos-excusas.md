---
title: "Svelte 5 desde React: menos código, menos excusas"
description: "Construí el dashboard de Inboxed con Svelte 5 viniendo de años en React. Aquí lo que me sorprendió, lo que me atrapó, y por qué no lo cambiaría para este proyecto."
pubDate: 2026-03-16
tags: ["javascript", "svelte", "frontend", "react"]
draft: false
---

## TL;DR

- **Svelte 5** compila a vanilla JS — no hay runtime, no hay virtual DOM, no hay re-renders de árbol. El bundle es ridículamente pequeño comparado con React.
- La reactividad es por asignación: declaras `$state`, asignas y el DOM se actualiza. Sin `useState`, sin `useEffect`, sin array de dependencias.
- Los **stores globales** son un objeto con getters y `$state` interno. Sin Zustand, sin Redux, sin Context. Vanilla JavaScript con reactividad inyectada por el compilador.
- `$derived` reemplaza `useMemo` y **no necesita dependency array** — sabe qué depende de qué.
- El ecosistema es más chico y se nota. Cuando algo falla en Svelte 5, muchas veces el resultado de Google es un issue abierto en GitHub.
- Para side projects y dashboards donde el performance importa: Svelte sin pensarlo. Para un equipo de 10 devs contratando en el mercado abierto: React sigue siendo la respuesta pragmática.

---

## Por qué Svelte para Inboxed

Estoy construyendo [Inboxed](https://inboxed.dev) — un inbox para desarrollo: catch de emails, webhooks, heartbeats de cron jobs. El dashboard necesitaba ser rápido, el bundle pequeño (se sirve self-hosted en un VPS de €7/mes), y yo quería algo diferente a React para no caer en los mismos patrones automáticos.

Svelte 5 llevaba tiempo en mi radar. Lo había probado en tutoriales, pero nunca en algo real con decisiones reales. Siempre me quedé con la duda de por qué genera tanta polaridad — devs que lo aman sin reservas y devs que lo descartan por ecosistema chico. Quería entenderlo yo mismo.

Inboxed fue la excusa perfecta: proyecto real, decisiones reales, y suficiente complejidad para ver dónde se rompe el framework y dónde brilla.

Lo que sigue son notas de después de construir el dashboard completo: auth, stores, tablas con datos en tiempo real, formularios. No un tutorial — mis impresiones honestas.

## La reactividad que no te hace pensar

El primer componente que escribí fue un `LoginForm`. Venía de este patrón de React:

```tsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await authStore.login(email, password);
  } finally {
    setLoading(false);
  }
};
```

En Svelte 5:

```svelte
<script lang="ts">
  let email = $state('');
  let password = $state('');
  let loading = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    try {
      await authStore.login(email, password);
    } finally {
      loading = false;
    }
  }
</script>
```

La diferencia no es solo sintáctica. En React estás describiendo cómo actualizar el estado. En Svelte simplemente asignas. El compilador sabe qué partes del DOM dependen de esas variables y actualiza exactamente esas — nada más.

Se siente como hacer trampa. Como cuando pasé de SQL raw a ActiveRecord por primera vez — ese momento de "¿en serio es tan simple?".

## Stores sin librerías

El pedo con React es que el estado global tiene fricción. Antes de escribir tu primera línea de negocio ya instalaste Zustand (o Redux, o Jotai, o Context con useReducer si eres de los que disfrutan sufrir).

El store de auth de Inboxed en React hubiera sido algo así:

```typescript
// auth.store.ts (con Zustand)
const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  loading: true,
  checkSession: async () => {
    try {
      const res = await apiClient('/auth/me');
      set({ isAuthenticated: true, user: mapUser(res.data), loading: false });
    } catch {
      set({ isAuthenticated: false, user: null, loading: false });
    }
  }
}));
```

En Svelte 5:

```typescript
// auth.store.svelte.ts
let state = $state<AuthState>({
  isAuthenticated: false,
  user: null,
  loading: true,
});

export const authStore = {
  get isAuthenticated() { return state.isAuthenticated; },
  get user() { return state.user; },
  get isOrgAdmin() {
    return state.user?.role === 'org_admin' || state.user?.role === 'site_admin';
  },
  async checkSession() {
    const res = await apiClient('/auth/me');
    state = { ...state, isAuthenticated: true, user: mapUser(res.data) };
  }
};
```

No hay librería. No hay `create()`, no hay `set()`, no hay provider que envuelva tu app. Un objeto con getters y `$state` internamente. Los getters como `isOrgAdmin` se recalculan automáticamente cuando `state.user` cambia.

Hmm. Me tardé media hora en creerle que esto realmente funciona.

## $derived y el fin de los dependency arrays

Tengo una tabla de headers HTTP en el dashboard. Muestra las headers de cada request capturado, ordenadas alfabéticamente. En React:

```tsx
function HeadersTable({ headers }: { headers: Record<string, string> }) {
  const entries = useMemo(
    () => Object.entries(headers).sort(([a], [b]) => a.localeCompare(b)),
    [headers] // ← si te olvidas esto, bug silencioso
  );
  // ...
}
```

En Svelte 5:

```svelte
<script lang="ts">
  let { headers }: { headers: Record<string, string> } = $props();
  const entries = $derived(
    Object.entries(headers).sort(([a], [b]) => a.localeCompare(b))
  );
</script>

<tbody>
  {#each entries as [key, value] (key)}
    <tr class="border-t border-border hover:bg-surface-2/50">
      <td class="px-4 py-2 font-mono text-text-secondary">{key}</td>
      <td class="px-4 py-2 font-mono text-text-primary">{value}</td>
    </tr>
  {/each}
</tbody>
```

`$derived` sabe que depende de `headers` porque lo lee dentro del bloque. Sin dependency array, sin posibilidad de olvidarlo. El `(key)` al final del `#each` es el equivalente de `key={key}` en React, pero se lee como inglés.

Menos decisiones. Por eso.

## Lo que me atrapó (los gotchas)

El modelo de reactividad por asignación tiene un hoyo que no vi venir: `array.push()` no triggerea updates.

```typescript
// Esto NO actualiza el DOM — viniendo de React, tu cerebro asume que sí
items.push(newItem);

// Esto sí
items = [...items, newItem];
```

Me atrapó varias veces y siempre de la misma forma: agregaba un item, la UI no actualizaba, pasaba 10 minutos buscando el bug en la lógica de negocio, y eventualmente caía en cuenta que era un `push()`. Un bug clásico de hábito React — ahí `setState` es explícito y te fuerza a pensar en la actualización. En Svelte la asignación es tan natural que olvidás que la mutación directa no cuenta.

Tiene sentido una vez que lo entiendes. Pero hay que quemarse con él primero.

## Lo que extrañé

El ecosistema de React, sin rodeos.

Vienes de un mundo donde hay una librería battle-tested para todo — tablas con sorting/filtering, date pickers accesibles, form validation con Zod integrado, lo que sea. En Svelte a veces te toca construirlo o adaptar algo con 300 stars en GitHub y el último commit hace 8 meses.

Y el otro problema: Stack Overflow. Cuando algo falla en Svelte 5, muchas veces el único resultado relevante de Google es un issue abierto en GitHub que alguien cerró por inactividad. Svelte 5 es relativamente nuevo y la base de conocimiento acumulado simplemente no existe todavía al nivel de React.

Similar a lo que pasaba cuando empecé con Rails después de años en PHP — extrañas las baterías incluidas y la comunidad enorme. Con el tiempo se compensa. Por ahora, hay que resolver más cosas por cuenta propia.

## El veredicto después de un dashboard real

El `LoginForm` completo son 113 líneas incluyendo SVG del logo y clases de Tailwind. En React serían ~140, probablemente más si le meto Zustand para el auth state.

Menos código. Menos decisiones de arquitectura de frontend. El compilador te cuida de una clase entera de bugs (stale closures, dependency arrays olvidados, re-renders innecesarios).

Svelte es a React lo que Rails fue a Java EE: una rebelión contra la complejidad innecesaria. Te hace productivo rápido y te hace cuestionar por qué las cosas eran tan complicadas antes.

Pero el ecosistema más chico y el mercado laboral son obstáculos reales. Svelte no reemplazó mi stack — cambió lo que espero de un framework frontend.

Si estás construyendo un side project o algo donde el performance del cliente importa: dale. Si estás armando un equipo de 10 devs en el mercado abierto: React sigue ganando por pragmatismo.

---

*Inboxed está en desarrollo activo. Self-hosteable con `docker compose up`. [Más info aquí.](https://inboxed.dev)*
