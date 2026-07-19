// Check de la guía (convención: cada guía trae su check.mjs junto a sus
// datos; `npm run check:guias` los descubre y corre todos).
//
// Go a fondo · Polyglot. El check verifica la INTEGRIDAD de los datos y su
// cruce con las vistas: catálogo completo (14 temas · 4 bloques) con folios
// únicos y consecutivos; cada tema pertenece a un bloque registrado y no hay
// huérfanos en ningún sentido; cada ficha trae los campos que la vista de
// detalle lee; cada widget declarado tiene las claves que su page-*.js espera
// y un iniciador G.widgets["<slug>"] registrado; el shortTitle de cada tema
// no repite el de su vecino (el export llegó con la lista corrida una
// posición); y el cromo de la colección está en su lugar (hero Polyglot ·
// NIVEL C2, sin rastro del almanaque 1001). Uso:
//   node public/guias/polyglot-go-c2/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DATA_FILES = ['compilacion', 'concurrencia', 'memoria', 'tipos'].map((d) => `data/${d}.js`);

// core.js siembra los registros; aquí los sembramos a mano para cargar solo
// los datos, sin tocar el DOM.
const ctx = {
  window: {
    GUIA: {
      topics: [],
      blocks: [],
      widgets: {},
      registerBlock(b) { this.blocks.push(b); },
      registerTopics(arr) { arr.forEach((t) => this.topics.push(t)); },
    },
  },
};
vm.createContext(ctx);
for (const f of DATA_FILES) vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const G = ctx.window.GUIA;

const errs = [];
const fail = (msg) => errs.push(msg);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isArr = (v) => Array.isArray(v);

// --- Bloques (contrato de la colección: 4 bloques) ---------------------------
if (G.blocks.length !== 4) fail(`bloques: ${G.blocks.length}, esperaba 4`);
const BLOCK_IDS = new Set(G.blocks.map((b) => b.id));
for (const id of ['compilacion', 'concurrencia', 'memoria', 'tipos'])
  if (!BLOCK_IDS.has(id)) fail(`falta el bloque «${id}»`);
for (const b of G.blocks) {
  const at = `bloque[${b.id || '?'}]`;
  for (const k of ['id', 'label', 'short', 'accent'])
    if (!isStr(b[k])) fail(`${at}: falta ${k}`);
  if (b.accent && !/^var\(--fam-/.test(b.accent))
    fail(`${at}: accent «${b.accent}» debe ser un token --fam-* (cero hex suelto)`);
}

// --- Catálogo ----------------------------------------------------------------
if (G.topics.length !== 14) fail(`temas: ${G.topics.length}, esperaba 14`);

const seenSlug = new Set();
const folios = [];
for (const t of G.topics) {
  const at = `topics[${t.slug || '?'}]`;
  for (const k of ['slug', 'folio', 'block', 'title', 'shortTitle', 'tagline',
    'avoid', 'lede', 'fuerza', 'brief', 'recursos', 'viz'])
    if (t[k] == null || t[k] === '') fail(`${at}: falta ${k}`);
  if (seenSlug.has(t.slug)) fail(`${at}: slug duplicado`);
  seenSlug.add(t.slug);
  if (!BLOCK_IDS.has(t.block)) fail(`${at}: bloque inexistente «${t.block}»`);
  if (![1, 2, 3].includes(t.difficulty))
    fail(`${at}: difficulty «${t.difficulty}» debe ser 1, 2 o 3 (glifo ◆◇◇/◆◆◇/◆◆◆)`);
  if (typeof t.star !== 'boolean') fail(`${at}: star debe ser boolean`);
  // «EVITA» — la línea del malentendido, lo mejor del catálogo: no puede faltar
  if (!isStr(t.avoid)) fail(`${at}: sin línea EVITA`);
  if (!isArr(t.brief) || t.brief.length !== 4)
    fail(`${at}: «en breve» tiene ${t.brief?.length} datos, el formato pide 4`);
  if (!isArr(t.recursos) || t.recursos.length < 2) fail(`${at}: recursos necesita ≥2`);
  for (const r of t.recursos || []) {
    for (const k of ['title', 'desc', 'kind', 'href'])
      if (!isStr(r[k])) fail(`${at}: recurso sin ${k}`);
    if (typeof r.star !== 'boolean') fail(`${at}: recurso «${r.title}» sin star boolean`);
    if (r.href && !/^https:\/\//.test(r.href)) fail(`${at}: recurso «${r.title}» no es https`);
  }
  if (t.mito && (!isStr(t.mito.claim) || !isStr(t.mito.body))) fail(`${at}: mito incompleto`);
  if (t.fuerza && (!isStr(t.fuerza.icon) || !isStr(t.fuerza.html))) fail(`${at}: fuerza incompleta`);
  folios.push(t.folio);
}

// folios únicos y consecutivos 01..14 en el orden de registro
folios.forEach((n, i) => {
  const esperado = String(i + 1).padStart(2, '0');
  if (n !== esperado) fail(`folio «${n}» rompe la secuencia (esperado ${esperado})`);
});
if (new Set(folios).size !== folios.length) fail('temas: folios repetidos');

// El export llegó con los shortTitle corridos una posición (cada tema llevaba
// el nombre del siguiente). Este check lo detecta si vuelve a pasar.
G.topics.forEach((t, i) => {
  const next = G.topics[i + 1];
  if (next && t.shortTitle && t.shortTitle === next.shortTitle)
    fail(`topics[${t.slug}]: shortTitle repetido con el siguiente`);
  if (next && next.shortTitle && t.shortTitle === next.shortTitle)
    fail(`topics[${t.slug}]: shortTitle «${t.shortTitle}» corrido`);
});
// heurística del corrimiento: el shortTitle no debe describir a OTRO tema
const SHORT_BY_SLUG = Object.fromEntries(G.topics.map((t) => [t.slug, t.shortTitle]));
for (const t of G.topics)
  for (const other of G.topics)
    if (other.slug !== t.slug && SHORT_BY_SLUG[t.slug] === SHORT_BY_SLUG[other.slug])
      fail(`topics[${t.slug}]: shortTitle «${t.shortTitle}» colisiona con ${other.slug}`);

// exactamente un tema destacado en portada
const featured = G.topics.filter((t) => t.featured);
if (featured.length !== 1) fail(`featured: ${featured.length} temas destacados, esperaba 1`);
if (featured[0] && !isStr(featured[0].featuredBlurb))
  fail(`topics[${featured[0].slug}]: destacado sin featuredBlurb`);

// --- Widgets: cada visualización trae las claves que su página espera --------
const VIZ_KEYS = {
  'pipeline-aot': (v, at) => {
    if (!isArr(v.stages) || v.stages.length !== 5) fail(`${at}: pipeline necesita 5 stages`);
    for (const s of v.stages || [])
      if (!isStr(s.label) || !isStr(s.sub) || !isStr(s.ev)) fail(`${at}: stage sin label/sub/ev`);
  },
  'ssa-pgo': (v, at) => {
    for (const mode of ['off', 'on']) {
      const ps = v.passes?.[mode];
      if (!isArr(ps) || !ps.length) { fail(`${at}: passes.${mode} vacío`); continue; }
      for (const p of ps) {
        if (!isStr(p.name) || !isStr(p.ev)) fail(`${at}: pase sin name/ev en ${mode}`);
        if (!isArr(p.lines) || !p.lines.length) fail(`${at}: pase «${p.name}» sin lines en ${mode}`);
      }
    }
    // la tesis del widget: con PGO el resultado final es más corto que sin él
    const off = v.passes.off.at(-1)?.lines.length, on = v.passes.on.at(-1)?.lines.length;
    if (!(on < off)) fail(`${at}: con PGO el código final (${on}) debe quedar más corto que sin PGO (${off})`);
  },
  'escape-analysis': (v, at) => {
    if (!isArr(v.options) || v.options.length !== 3) fail(`${at}: necesita 3 casos`);
    for (const o of v.options || []) {
      const c = v.cases?.[o.value];
      if (!c) { fail(`${at}: caso «${o.value}» sin datos`); continue; }
      if (typeof c.escapes !== 'boolean') fail(`${at}: caso «${o.value}» sin escapes boolean`);
      if (!isArr(c.code) || !c.code.length) fail(`${at}: caso «${o.value}» sin code`);
      if (!isStr(c.varName) || !isStr(c.ev)) fail(`${at}: caso «${o.value}» sin varName/ev`);
    }
    // el caso base debe quedarse en la pila y los otros dos escapar
    if (v.cases?.stack?.escapes !== false) fail(`${at}: el caso «stack» debe NO escapar`);
  },
  'defer-panic-recover': () => {},
  'scheduler-gmp': () => {},
  'channels-select': (v, at) => {
    if (!isStr(v.titleA) || !isStr(v.titleB)) fail(`${at}: faltan titleA/titleB (son dos widgets)`);
    if (!isStr(v.selectCode)) fail(`${at}: sin snippet selectCode`);
  },
  'preempcion-netpoller': (v, at) => {
    if (!isArr(v.options) || v.options.length !== 3) fail(`${at}: necesita 3 escenarios`);
    for (const o of v.options || []) {
      const sc = v.scenarios?.[o.value];
      if (!isArr(sc) || sc.length !== 4) fail(`${at}: escenario «${o.value}» debe traer 4 pasos`);
      for (const paso of sc || []) if (!isStr(paso)) fail(`${at}: paso vacío en «${o.value}»`);
    }
  },
  'gc-tricolor': (v, at) => { if (!isStr(v.pacerTitle)) fail(`${at}: sin pacerTitle`); },
  'allocator-mcache': (v, at) => {
    if (!isArr(v.options) || v.options.length !== 3) fail(`${at}: necesita 3 tamaños`);
  },
  'stacks-goroutine': () => {},
  'interfaces-itable': (v, at) => {
    for (const k of ['concreteOptions', 'kindOptions'])
      if (!isArr(v[k]) || v[k].length !== 2) fail(`${at}: ${k} debe traer 2 opciones`);
    for (const o of v.concreteOptions || []) {
      const ty = v.types?.[o.value];
      if (!ty) { fail(`${at}: tipo «${o.value}» sin datos`); continue; }
      if (!isStr(ty.data)) fail(`${at}: tipo «${o.value}» sin data`);
      if (!isArr(ty.methods) || !ty.methods.length) fail(`${at}: tipo «${o.value}» sin methods`);
      for (const m of ty.methods || [])
        if (!isStr(m.name) || !isStr(m.body)) fail(`${at}: método sin name/body en «${o.value}»`);
    }
    // el dispatch se compara entre tipos: ambos deben implementar los mismos métodos
    const [a, b] = (v.concreteOptions || []).map((o) => (v.types?.[o.value]?.methods || []).map((m) => m.name).join(','));
    if (a !== b) fail(`${at}: los tipos concretos deben implementar los mismos métodos (${a} vs ${b})`);
  },
  'slices-strings': (v, at) => {
    if (!isStr(v.titleA) || !isStr(v.titleB)) fail(`${at}: faltan titleA/titleB (son dos widgets)`);
    if (!isStr(v.strCode)) fail(`${at}: sin snippet strCode`);
    for (const o of v.wordOptions || []) {
      const w = v.words?.[o.value];
      if (!isArr(w) || !w.length) { fail(`${at}: palabra «${o.value}» sin desglose`); continue; }
      // el desglose es [carácter, nº de bytes]: debe cuadrar con el UTF-8 real
      for (const [ch, nb] of w) {
        const real = Buffer.from(ch, 'utf8').length;
        if (real !== nb) fail(`${at}: «${ch}» son ${real} bytes en UTF-8, el dato dice ${nb}`);
      }
    }
  },
  'maps-swiss-tables': () => {},
  generics: () => {},
};

for (const t of G.topics) {
  const at = `topics[${t.slug}].viz`;
  const v = t.viz;
  if (!v) { fail(`${at}: sin visualización`); continue; }
  if (!isStr(v.title) && !isStr(v.titleA)) fail(`${at}: sin title (ni titleA)`);
  if (!isArr(v.notes) || !v.notes.length) fail(`${at}: sin notes`);
  for (const n of v.notes || []) if (!isStr(n.html)) fail(`${at}: note sin html`);
  const validate = VIZ_KEYS[t.slug];
  if (!validate) fail(`${at}: tema sin validador declarado en el check`);
  else validate(v, at);
}

// --- Determinismo del guión: sin Math.random en los datos --------------------
for (const f of DATA_FILES)
  if (/Math\.random\s*\(/.test(readFileSync(join(GUIDE, f), 'utf8')))
    fail(`${f}: usa Math.random — el guión debe ser determinista`);

// --- Cruce con las vistas (js/page-*.js) -------------------------------------
const PAGES = readdirSync(join(GUIDE, 'js')).filter((f) => f.startsWith('page-'));
const registered = new Set();
for (const p of PAGES) {
  const src = readFileSync(join(GUIDE, 'js', p), 'utf8');
  for (const m of src.matchAll(/G\.widgets\["([^"]+)"\]\s*=/g)) registered.add(m[1]);
}
for (const t of G.topics) {
  if (!registered.has(t.slug))
    fail(`tema «${t.slug}»: sin iniciador G.widgets["${t.slug}"] en js/page-*.js`);
  if (!PAGES.includes(`page-${t.slug}.js`))
    fail(`tema «${t.slug}»: falta js/page-${t.slug}.js (una vista por archivo)`);
}
for (const slug of registered)
  if (!seenSlug.has(slug)) fail(`js/: widget «${slug}» registrado pero sin tema en data/`);

// index.html debe cargar cada page-*.js, los datos y el router al final
const html = readFileSync(join(GUIDE, 'index.html'), 'utf8');
for (const p of PAGES)
  if (!html.includes(`./js/${p}`)) fail(`index.html: no carga js/${p}`);
for (const f of DATA_FILES)
  if (!html.includes(`./${f}`)) fail(`index.html: no carga ${f}`);
if (html.indexOf('./js/router.js') < html.lastIndexOf('./js/page-'))
  fail('index.html: router.js debe cargar al final');
if (/<script[^>]+type=["']module["']/.test(html))
  fail('index.html: hay un ES module — file:// no los carga');
if (/fonts\.googleapis\.com|https?:\/\/cdn|unpkg|jsdelivr/.test(html))
  fail('index.html: request externo (la guía debe abrir offline)');

const routerSrc = readFileSync(join(GUIDE, 'js/router.js'), 'utf8');
for (const fn of ['renderIndex', 'renderTopic'])
  if (!routerSrc.includes(fn)) fail(`router.js: no invoca G.${fn}`);

// --- Cromo de la colección ---------------------------------------------------
const componentsSrc = readFileSync(join(GUIDE, 'js/components.js'), 'utf8');
const cssSrc = readFileSync(join(GUIDE, 'styles.css'), 'utf8');

// Esto es Polyglot, no el almanaque: ningún rastro del 1001 en las superficies
for (const [label, src] of [['index.html', html], ['components.js', componentsSrc]])
  if (/\b1001\b|\bTomo\b|almanaque/i.test(src))
    fail(`${label}: rastro del almanaque 1001 (esta guía es Polyglot)`);

if (!/Polyglot\s*\\u00B7\s*notdefined|Polyglot · notdefined/.test(componentsSrc))
  fail('components.js: el hero no dice «Polyglot · notdefined»');
if (!/GO\s*\\u00B7\s*NIVEL C2|GO · NIVEL C2/.test(componentsSrc))
  fail('components.js: el hero no declara «GO · NIVEL C2»');
if (!componentsSrc.includes('document.title'))
  fail('components.js: no fija document.title por vista');
if (!/href: "\/guias\/"/.test(componentsSrc))
  fail('components.js: la site-bar no apunta a /guias/');

// El guiño CEFR va UNA sola vez, en la meta description
const wink = /El B1 te lo dio el tutorial/g;
const winks = (html.match(wink) || []).length + (componentsSrc.match(wink) || []).length;
if (winks !== 1) fail(`guiño CEFR: aparece ${winks} veces, debe aparecer exactamente 1 (meta description)`);

// Un solo :root claro + html.dark; el tema arranca en oscuro antes del paint
if (!/html\.dark\s*\{/.test(cssSrc)) fail('styles.css: falta el bloque html.dark');
if (!/localStorage/.test(html) || !/classList/.test(html))
  fail('index.html: falta el script de tema pre-paint');
if (!/name="color-scheme"/.test(html)) fail('index.html: falta meta color-scheme');

// Cero hex de cromo fuera de los tokens: solo :root, html.dark y el bloque de datos
const chrome = cssSrc.replace(/:root\s*\{[\s\S]*?\}/g, '').replace(/html\.dark\s*\{[\s\S]*?\}/g, '')
  .replace(/:root,\s*html\.dark\s*\{[\s\S]*?\}/g, '').replace(/@font-face\s*\{[\s\S]*?\}/g, '');
const looseHex = [...chrome.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
if (looseHex.length) fail(`styles.css: ${looseHex.length} hex fuera de tokens (${looseHex.slice(0, 5).join(', ')})`);

// Las 9 woff2 del trío Polyglot: 1:1 entre el CSS y el disco
const declared = [...cssSrc.matchAll(/url\("\.\/fonts\/([^"]+)"\)/g)].map((m) => m[1]);
const onDisk = readdirSync(join(GUIDE, 'fonts'));
for (const f of new Set(declared))
  if (!onDisk.includes(f)) fail(`fonts/: el CSS pide «${f}» y no está en disco`);
for (const f of onDisk)
  if (!declared.includes(f)) fail(`fonts/: «${f}» está en disco pero ningún @font-face lo usa`);

// --- Resultado ---------------------------------------------------------------
if (errs.length) {
  console.error(`✗ polyglot-go-c2: ${errs.length} problema(s)`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ polyglot-go-c2: ${G.topics.length} temas · ${G.blocks.length} bloques · ` +
    `${registered.size} widgets registrados · ${PAGES.length} vistas · ${new Set(declared).size} fuentes 1:1`
);
