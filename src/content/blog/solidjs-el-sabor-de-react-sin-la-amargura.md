---
title: "SolidJS: el sabor de React sin la amargura"
description: "SolidJS tiene la sintaxis de React, la performance de Svelte, y no tiene virtual DOM. Si ya sabes React, lo aprendes en un día — y probablemente no quieras volver."
pubDate: 2026-03-07
tags: ["javascript", "frontend", "solidjs"]
draft: false
---

## TL;DR

- **SolidJS** usa JSX, camina, habla y se parece mucho a React, pero compila a operaciones del DOM real — sin virtual DOM, sin reconciliación, sin re-renders de árbol.
- La unidad básica es el **signal** (`createSignal`), no el estado por componente — la reactividad es granular, no por árbol.
- Los componentes se ejecutan **una sola vez** — no hay reglas de hooks, no hay closures capturando valores viejos.
- Bundle base de ~7kb vs ~45kb de React. En benchmarks, consistentemente más rápido y con menor uso de memoria.
- DHH tiene razón en algo: frameworks más ligeros dejan más espacio para tu lógica. SolidJS es la versión frontend de esa filosofía.

---

## React, pero sin el dolor de cabeza

Si llevas tiempo en React, ya conoces el ritual: `useState`, `useEffect`, `useContext`, el array de dependencias que siempre olvidas, el re-render que no esperabas, el `useCallback` que agregas porque algo se renderiza de más. Todo funciona, pero cargando peso innecesario.

SolidJS parte de la misma idea — JSX, componentes, props — pero tira el virtual DOM a la basura. En lugar de comparar árboles de elementos en cada render, compila tu JSX a operaciones del DOM reales y solo actualiza exactamente lo que cambió. No más, no menos.

El resultado se siente raro al principio porque esperas que algo se rompa. No se rompe.

## Signals: la reactividad que React nunca tuvo

En React, el estado vive en el componente. Cuando cambia, el componente vuelve a ejecutarse completo y React decide qué actualizar. En Solid, la reactividad es por valor — el componente se ejecuta una sola vez y las partes del DOM que dependen de un signal se actualizan directamente cuando ese signal cambia.

```jsx
// React
function Counter() {
  const [count, setCount] = useState(0); // se re-ejecuta todo en cada cambio
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// SolidJS
function Counter() {
  const [count, setCount] = createSignal(0); // este componente corre UNA vez
  return <button onClick={() => setCount(c => c + 1)}>{count()}</button>;
  //                                                    ^ signal es una función
}
```

La diferencia sutil pero importante: en Solid el signal es una función que llamas — `count()` no `count`. Eso es lo que permite al runtime saber exactamente qué está leyendo ese valor y suscribirse solo a los cambios que importan.

## `createEffect` y `createMemo`: misma idea, sin las trampas

El equivalente de `useEffect` es `createEffect`, pero sin array de dependencias. Solid rastrea automáticamente qué signals lees dentro del efecto y se re-ejecuta solo cuando esos signals cambian.

```jsx
import { createSignal, createEffect, createMemo } from 'solid-js';

function PrecioConDescuento() {
  const [precio, setPrecio] = createSignal(100);
  const [descuento, setDescuento] = createSignal(0.1);

  // Se recalcula solo cuando precio o descuento cambian — sin lista de deps
  const precioFinal = createMemo(() => precio() * (1 - descuento()));

  // Se ejecuta cuando precioFinal cambia
  createEffect(() => {
    console.log(`Precio final: $${precioFinal().toFixed(2)}`);
    // => "Precio final: $90.00"
  });

  return (
    <div>
      <p>Total: ${precioFinal().toFixed(2)}</p>
      <button onClick={() => setDescuento(0.2)}>Aplicar 20% off</button>
    </div>
  );
}
```

¿Notaste que no hay `[]` ni `[precio, descuento]` en ningún lado? El runtime lo sabe porque leyó `precio()` y `descuento()` dentro del memo. Si agregas otro signal, se suscribe automáticamente. Si dejas de leerlo, se desuscribe. Sin memoria de dependencias vieja capturada en un closure.

## Comparativa directa

| | React | SolidJS |
|---|---|---|
| Virtual DOM | Sí | No |
| Reactividad | Por componente (re-render) | Por signal (granular) |
| Componente se ejecuta | En cada render | Una sola vez |
| Array de dependencias | Obligatorio en hooks | No existe |
| Bundle base | ~45kb | ~7kb |
| Sintaxis | JSX | JSX |
| Curva si vienes de React | — | Baja (1–2 días) |
| SSR / hidratación | Sí (Next.js, etc.) | Sí (SolidStart) |

## El ejemplo que lo hace clic: estado de lista con updates granulares

El counter es conveniente para explicar signals, pero donde React realmente empieza a pelar el cobre es con estado de lista + actualizaciones frecuentes. Imagina un carrito de compras donde el usuario cambia cantidades en tiempo real.

En React, cuando actualizas la cantidad de un solo item, todo el componente padre re-renderiza, y cada hijo también — a menos que coloques `React.memo` en cada uno y `useCallback` en cada función que le pasas. Eso es mucho ceremonial para algo que debería ser obvio.

```jsx
// React — carrito con estado complejo
// sin React.memo, TODOS los items re-renderizan cuando cambia uno
function Carrito() {
  const [items, setItems] = useState([
    { id: 1, nombre: 'Laptop', precio: 1200, cantidad: 1 },
    { id: 2, nombre: 'Mouse', precio: 25, cantidad: 2 },
    { id: 3, nombre: 'Teclado', precio: 80, cantidad: 1 },
  ]);

  const total = useMemo(
    () => items.reduce((s, i) => s + i.precio * i.cantidad, 0),
    [items]
  );

  // useCallback para que ItemCarrito no re-renderice por referencia cambiante
  const actualizar = useCallback((id, cantidad) => {
    setItems(prev =>
      prev.map(item => item.id === id ? { ...item, cantidad } : item)
    );
  }, []);

  return (
    <>
      {items.map(item => (
        // React.memo — sin esto, todos re-renderizan cada vez
        <ItemCarrito key={item.id} item={item} onUpdate={actualizar} />
      ))}
      <p>Total: ${total}</p>
    </>
  );
}

const ItemCarrito = React.memo(({ item, onUpdate }) => {
  console.log(`render: ${item.nombre}`); // ocurre más seguido de lo que crees
  return (
    <div>
      <span>{item.nombre} — ${item.precio}</span>
      <input
        type="number"
        value={item.cantidad}
        onChange={e => onUpdate(item.id, Number(e.target.value))}
      />
      <span>Subtotal: ${item.precio * item.cantidad}</span>
    </div>
  );
});
```

En SolidJS, el mismo carrito se escribe sin `React.memo`, sin `useCallback`, y el DOM solo actualiza el nodo exacto que cambió — no el item completo, no el carrito, solo el campo `cantidad` y el subtotal de ese item.

```jsx
// SolidJS — mismo carrito, sin el ceremonial
import { createStore } from 'solid-js/store';
import { createMemo, For } from 'solid-js';

function Carrito() {
  const [items, setItems] = createStore([
    { id: 1, nombre: 'Laptop', precio: 1200, cantidad: 1 },
    { id: 2, nombre: 'Mouse', precio: 25, cantidad: 2 },
    { id: 3, nombre: 'Teclado', precio: 80, cantidad: 1 },
  ]);

  const total = createMemo(() =>
    items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  );

  const actualizar = (id, cantidad) => {
    // actualización quirúrgica: solo ese campo, solo ese item
    setItems(item => item.id === id, 'cantidad', cantidad);
  };

  return (
    <>
      <For each={items}>
        {(item) => {
          console.log(`monta: ${item.nombre}`); // solo una vez por item, nunca más
          return (
            <div>
              <span>{item.nombre} — ${item.precio}</span>
              <input
                type="number"
                value={item.cantidad}
                onInput={e => actualizar(item.id, Number(e.target.value))}
              />
              {/* solo este nodo se toca cuando cambia la cantidad */}
              <span>Subtotal: ${item.precio * item.cantidad}</span>
            </div>
          );
        }}
      </For>
      <p>Total: ${total()}</p>
    </>
  );
}
```

El `console.log` en el item de Solid corre una vez cuando el componente monta. En React corre en cada render que `React.memo` no pudo optimizar. Esa diferencia, multiplicada por cientos de elementos, es la que se ve en los benchmarks.

## El ángulo DHH

DHH lleva años diciendo que el frontend acumuló demasiada complejidad sin necesidad — quien no recuerda JQuery o el UJS, y ahora Hotwire es su respuesta desde Rails. SolidJS no es exactamente la misma filosofía, pero comparte el instinto: ¿para qué cargar 45kb de framework si puedes hacer lo mismo con 7kb y sin virtual DOM?

No es que React esté equivocado — es que muchas apps pagan el costo de React sin realmente necesitar la escala para la que fue diseñado. SolidJS es la apuesta de que puedes tener la DX de React sin el overhead. Y los benchmarks le dan la razón consistentemente.

## El futuro va hacia signals

SolidJS no inventó los signals — Knockout.js los tenía en 2010. Pero los popularizó en el contexto moderno, y ahora están en todos lados: Vue tiene su Composition API basada en refs reactivos, Angular lanzó signals en v17, Svelte 5 reemplazó stores con runes (que son signals con otro nombre). Hasta el equipo de React está explorando un modelo similar internamente.

La tendencia es clara: el virtual DOM fue una solución práctica para un problema de los 2010s. Los signals son la respuesta más elegante para el mismo problema.

## SolidStart: el Next.js que no necesita 300ms para hidratar

Si SolidJS es el React sin virtual DOM, SolidStart es el Next.js sin el peso de React. Mismo modelo: routing basado en archivos, SSR, SSG, API routes, soporte para múltiples destinos de deploy (Vercel, Cloudflare Workers, Node, Deno). La diferencia está en lo que no trae encima.

| | Next.js | SolidStart |
|---|---|---|
| Framework base | React (~45kb) | SolidJS (~7kb) |
| Routing | File-based (app/ dir) | File-based |
| SSR | Sí | Sí |
| SSG | Sí | Sí |
| API routes | Route Handlers | Server Functions |
| Server Components | Sí (RSC) | En desarrollo |
| Hidratación | Completa | Parcial (islands) |
| Tiempo de hidratación | Notable en apps grandes | Significativamente menor |

El punto que más importa en la práctica: hidratación. En Next.js, cuando el HTML llega del servidor, React tiene que "hidratar" toda la página — reconstruir el árbol de componentes en el cliente para hacerlo interactivo. Con Solid, ese paso es mucho más ligero porque el runtime ya sabe exactamente qué signals están suscritos a qué nodos del DOM, sin recorrer todo el árbol.

SolidStart usa [Vinxi](https://vinxi.dev/) bajo el capó — un toolkit para construir meta-frameworks — lo que le da flexibilidad de deploy que Next.js todavía no tiene del todo resuelta fuera de Vercel.

## ¿Cuándo usarlo?

SolidJS brilla en apps interactivas donde el performance importa — dashboards, editores, cualquier cosa con estado complejo y updates frecuentes. Si ya tienes una app React grande, no la migres por migrar. Pero si empiezas algo nuevo y React te parece overkill, dale una oportunidad seria.

El ecosistema es más chico que React pero lo suficientemente maduro para producción. Las librerías más usadas tienen equivalente o wrapper en Solid: routing, forms, query/fetching, animaciones.

Apréndetelo en un fin de semana. Si ya sabes React, la curva es casi plana — mismo JSX, mismos patrones, sin virtual DOM, con signals en lugar de hooks. Lo que cambia es que el código hace exactamente lo que dice que hace, sin renders sorpresa.

---

- [SolidJS — documentación oficial](https://www.solidjs.com/docs/latest/api)
- [SolidStart — documentación](https://start.solidjs.com/)
- [JavaScript Framework Benchmarks — krausest](https://krausest.github.io/js-framework-benchmark/) — aquí están los números reales
- [Ryan Carniato — blog del creador de Solid](https://dev.to/ryansolid) — el más profundo sobre reactividad granular
