---
title: 'Corrí Gemma 3n en el navegador: brutal como experimento, malo como feature'
description: 'Metí Gemma 3n E2B a correr 100% en el navegador de un blog estático: WebGPU, 3 GB de modelo, cero servidor. Lo que parecía un demo de una tarde se volvió headers que GitHub Pages no deja poner, un modelo gated en R2, un progress bar imposible y un chat armado a mano. Los números reales en una M2 Max, y por qué hoy esto vive mejor en backend o mobile que en la web.'
pubDate: 2026-06-29
tags: ['gemma', 'webgpu', 'llm', 'ai', 'mediapipe', 'cloudflare']
draft: false
featured: true
lab:
  href: /lab/gemma
  title: Córrelo tú en tu navegador
  blurb: 100% local, opt-in, sin servidor. El botón te dice los GB antes de bajar nada — mide el cold start y los tok/s en tu propia máquina.
  meta: '~3 GB de descarga · WebGPU · tus prompts no salen de tu equipo'
  cta: Abrir el lab →
---

## TL;DR

- Metí **Gemma 3n E2B** a correr **100% en el navegador** de este blog (que es estático, GitHub Pages) con **WebGPU**. Sin servidor de inferencia, sin API key, tus prompts no salen de tu máquina. Pruébalo en [/lab/gemma](/lab/gemma).
- Casi nada de esto fue el modelo. Fue **plomería web experimental**: headers que Pages no deja poner, un modelo gated de 3 GB, y APIs de browser que no dan lo que necesitas.
- **No hay barra de progreso honesta** para una descarga de 3 GB, y no es flojera — es un muro de memoria. Lo cuento abajo porque es lo más interesante que aprendí.
- Números reales en una **MacBook Pro M2 Max** con 500 Mb de bajada: **~65s** de cold start (descarga + init), **~12 tok/s** generando.
- El veredicto: como **experimento** está increíble. Como **feature web**, no — el costo no se amortiza. Esto hoy tiene más sentido en **backend** o en **mobile**.

---

> Nota de caducidad: esto lo medí a mediados de 2026. Casi todo lo que toco aquí —WebGPU, MediaPipe, la cobertura de navegadores, el peso del modelo— es **experimental y se mueve rápido**. Si lees esto en un año, asume que los números cambiaron y que alguna API que aquí sufro ya se arregló (o se murió). Verifica contra la fuente.

La idea era boba de lo simple: este blog ya tiene un post sobre [por qué tu feature de IA es más lento de lo que necesita](/blog/llm-context-windows-por-que-tu-feature-de-ia-es-mas-lento-de-lo-que-necesita). Quería algo más: un modelo corriendo **aquí mismo**, en tu pestaña, sin mandar nada a ningún lado. ¿Se puede correr un LLM de verdad en el navegador de un sitio estático? Spoiler: sí. Pero el camino no fue el modelo. Fue todo lo de alrededor.

A mi forma de verlo, los demos bonitos de "IA en el browser" esconden la cuenta. Este post es la cuenta.

## Lo que quería vs lo que me encontré

El plan ingenuo tenía como tres pasos: bajar un modelo chiquito, prenderlo con WebGPU, ponerle un chat. Tres tardes, máximo.

El plan real tuvo otra forma. Cada paso destapó un problema que no era de IA, era de **web**. Y como este sitio vive en GitHub Pages —estático, barato, sin backend— cada problema pegaba más duro porque no tengo un servidor donde esconder la basura.

Vamos por partes.

## GitHub Pages no te deja poner headers (y MediaPipe los exige)

Para correr Gemma elegí **MediaPipe LLM Inference (Web)**. Es el runtime de Google, optimizado justo para Gemma 3n; hay un archivo web-específico (`int4`, con el KV cache acomodado para WebGPU). ¿Por qué no transformers.js o WebLLM, que también corren en el browser? Porque para Gemma específico, MediaPipe vuela: medí ~12 tok/s contra ~2 de transformers.js puro — como 6x. Para otros modelos la cuenta cambia; para este, no había vuelta.

El pedo es que MediaPipe necesita que la página esté **cross-origin isolated**. Eso significa dos headers HTTP:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

Sin ellos, el navegador no te da `SharedArrayBuffer` ni el WASM multihilo, y el init de WebGPU se cae o se degrada. ¿Y sabes qué no puede hacer GitHub Pages? Poner headers HTTP custom. Para nada. Es salida estática y se acabó.

La salida estándar para Pages es un service worker (`coi-serviceworker`) que **finge** los headers desde el cliente. Funciona, pero es un hack origin-wide y me incomodaba meterlo a todo el sitio por una sola página.

Como ya tengo el dominio detrás de **Cloudflare**, hice algo más limpio: una **Transform Rule** que inyecta los headers de verdad, pero **scopeada solo a `/lab/`**:

```text
When  starts_with(http.request.uri.path, "/lab/")
Set   Cross-Origin-Opener-Policy: same-origin
Set   Cross-Origin-Embedder-Policy: credentialless
```

Gratis, headers reales, y el resto del sitio ni se entera. Lo validé en consola: `crossOriginIsolated === true`, pero solo en `/lab`. Primera cicatriz: para correr un modelo en un blog estático ya tuve que meter Cloudflare a fingir lo que el hosting no deja.

## El modelo está gated y pesa 3 GB

Segundo muro. Gemma en Hugging Face y Kaggle está **gated**: tienes que aceptar la licencia con tu cuenta para bajarlo. O sea, no se puede `fetch` anónimo desde el navegador de un visitante. Y Pages tampoco lo puede hostear: el límite por archivo son 100 MB y el `.litertlm` pesa **3.04 GB**.

Así que el modelo lo hosteo yo, en **Cloudflare R2** (el S3 de Cloudflare, con egress gratis dentro de CF). Acepté la licencia una vez, bajé el archivo web `int4`, y lo subí a un bucket con CORS habilitado. Ese URL se vuelve el `MODEL_URL` del lab.

Detalle que me mordió: el dashboard de R2 topa la subida en 300 MB. Para 3 GB tuve que subirlo por la **API S3** con multipart (`aws s3 cp` apuntando al endpoint de R2). Nada del otro mundo, pero otra hora que no estaba en el plan.

## El progress bar imposible (la parte buena)

Esta es la que más me gustó, porque es contraintuitiva.

Quería lo obvio: una barra que diga "45% de 3 GB". Para eso necesitas bajar el archivo **tú** —con `fetch` y un `TransformStream` que cuente bytes— y guardarlo en Cache Storage. Lo armé. Y reventó. Dos veces, con un escueto `Failed to fetch`.

Mi primera teoría fue el CORS, o jsdelivr, o R2. Todas mal. La causa real es de **memoria**, y aquí está el aprendizaje:

MediaPipe te deja cargar el modelo de dos formas. Una es `modelAssetBuffer`: le pasas los 3 GB ya en un `ArrayBuffer` de JavaScript. La otra es `modelAssetPath`: le das el URL y él lo baja solito, por dentro del WASM.

Si yo bajo el modelo para mostrar el progreso, termino con los **3 GB completos en el heap de JS**. Luego se los paso a MediaPipe, que los **copia** a la memoria del WASM y a la GPU. Pico de ~6 GB. El navegador no aguanta y truena. (Bonus trap: una escritura a medias deja una entrada de Cache **corrupta** cuyo header dice "completa" pero que al leerla explota — me costó un rato entender por qué "ya estaba en caché" y aun así fallaba.)

La vía que **sí** funciona es `modelAssetPath`:

```typescript
const genai = await FilesetResolver.forGenAiTasks(WASM_URL);

llm = await LlmInference.createFromOptions(genai, {
  // MediaPipe baja el modelo dentro del WASM, en streaming.
  // Nunca materializa los 3 GB en el heap de JS → no revienta.
  baseOptions: { modelAssetPath: MODEL_URL },
  maxTokens: 1024,
  topK: 40,
  temperature: 0.8,
});
```

Baja en streaming, sin meter el archivo entero a JavaScript. Pero esa vía **no expone progreso** —la descarga ocurre dentro del WASM, no la ves— y la **persistencia la maneja el navegador** (HTTP cache; al recargar no se re-baja, siempre que R2 mande `Cache-Control: immutable`). Por lo mismo, **no hay un "borrar descarga" programático confiable**: se limpia con "datos del sitio", a mano.

Lo intenté de las dos formas. La conclusión, sin adornos: progreso real, persistencia que tú controlas, y un botón de borrar son **un paquete** que exige que tú cargues los 3 GB. Y para un modelo de 3 GB, el navegador no te deja. No mames — ni una barra de progreso honesta puedes dar.

## El chat lo armé a mano

Último detalle que no me esperaba. MediaPipe LLM en web está en **modo mantenimiento** (te empujan a LiteRT-LM). En la práctica eso significa que en web **no expone una API de sesión ni de system prompt**. Te da un `generateResponse(prompt)` y ya. Si quieres memoria multi-turno, te la rascas tú.

Entonces el historial lo guardo en JS y lo paso con el **formato de turnos de Gemma**. Y como Gemma no tiene un rol "system", el system prompt va de prefijo del primer turno del usuario:

```typescript
function buildPrompt(userMsg: string) {
  const turns = [...history, { role: 'user', text: userMsg }];
  let p = '';
  turns.forEach((t, i) => {
    // El system prompt no es un rol aparte en Gemma: se mete como
    // prefijo del primer turno del usuario.
    const content = i === 0 && appliedSystem ? `${appliedSystem}\n\n${t.text}` : t.text;
    p += `<start_of_turn>${t.role}\n${content}<end_of_turn>\n`;
  });
  return p + '<start_of_turn>model\n';
}
```

Funciona. Es la diferencia entre un chat que recuerda lo que le dijiste y uno con amnesia cada mensaje. Pero es plomería que un SDK maduro te daría gratis, y aquí la hice yo.

## Los números, en una máquina de verdad

Todo lo de arriba no sirve si no aterriza en datos. Medido en una **MacBook Pro M2 Max** con internet de 500 Mb, en Chrome:

| Qué | Cuánto |
|---|---|
| Peso de descarga | 3.04 GB (`gemma-3n-E2B-it-int4-Web.litertlm`) |
| Cold start (descarga + init en WebGPU) | ~65s |
| Generación | ~12 tok/s |

Ese ~65s es **corrida fresca**: caché del navegador limpio, bajando los 3 GB de cero. Cuadra con el número — a 500 Mb solo la descarga son ~48s, el resto es el init en WebGPU. Al recargar con el modelo ya cacheado, el arranque baja a segundos.

Y ojo con un detalle que mata la tesis de "córrelo en el browser para ahorrar": el almacenamiento del navegador está **aislado por origen** y el caché está **particionado por sitio**. Lo que cachea `notdefined.dev` solo lo lee `notdefined.dev`. Si mañana otro sitio quiere correr el mismo Gemma, baja **su propia copia** de 3 GB. No hay caché global de modelos en la web. El costo no se amortiza entre sitios: es **por sitio**, cada quien sus 3 GB.

## ¿Entonces vale la pena?

Como **experimento**, brutal. Tener un LLM corriendo en una pestaña, sin servidor, sin que tus prompts salgan de tu máquina, sigue sintiéndose a magia. Y aprendí más de plomería web en este demo que en varios proyectos "serios".

Como **feature web**, no. Pedirle a un visitante que baje 3 GB para usar una funcionalidad es absurdo fuera de un lab opt-in. Y el costo por-sitio lo vuelve un mal patrón general.

¿Dónde sí tiene sentido un modelo local de este tamaño? A mi forma de verlo, hoy:

- **Backend** — tú controlas la máquina, bajas el modelo una vez, y lo amortizas en millones de requests. Ahí un 2B local es barato y privado.
- **Mobile** — la app empaqueta o descarga el modelo una vez, con runtime nativo y control real de memoria y almacenamiento. El usuario entiende que una app pesa; una página web no debería.

La web aún no. Le falta un caché de modelos compartido entre orígenes y APIs que no te obliguen a elegir entre progreso y memoria. Cuando eso llegue, reescribo este post.

## FAQ

**¿Esto manda mis prompts a un servidor?**
No. Una vez que el modelo se descargó, todo corre local en tu GPU vía WebGPU. No hay API key ni llamada de red por cada mensaje. Por eso pesa lo que pesa: el modelo entero vive en tu navegador.

**¿Por qué 3 GB si es un modelo "de 2B"?**
Es la versión web `int4` (cuantizada a 4 bits) con el KV cache optimizado. Aun cuantizado, un 2B-3n ocupa eso. Las variantes sin cuantizar pesan más.

**¿Se queda descargado o lo baja cada vez?**
Se queda, vía HTTP cache del navegador (le puse `Cache-Control: immutable` en R2). Si recargas, no re-baja. Para borrarlo hay que limpiar los datos del sitio a mano — no hay un botón confiable para eso.

**¿Corre en mi teléfono?**
Probablemente mal. WebGPU en móvil es disparejo y 3 GB en RAM es muchísimo para un navegador de celular. Este lab está pensado para desktop.

**¿Safari? ¿Firefox?**
WebGPU ya es mainstream (Chrome, Firefox, Edge y Safari lo traen por default desde finales de 2025, ~83% de cobertura). Aun así, hay equipos y configuraciones donde no está. El lab te avisa si tu navegador no lo expone.

---

Ya tienes el veredicto y ya tienes el costo. Lo que falta es el número en **tu** máquina — y cuando lo abras y lo cierres, vas a saber en carne propia por qué tu navegador no te deja borrar esos 3 GB de un solo click.
