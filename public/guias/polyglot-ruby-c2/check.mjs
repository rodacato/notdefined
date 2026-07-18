// Check de la guía (convención: cada guía trae su check.mjs junto a sus
// datos; `npm run check:guias` los descubre y corre todos).
//
// Ruby a fondo · Polyglot. El check verifica la INTEGRIDAD de los datos y su
// cruce con las vistas: catálogo completo (12 temas · 4 bloques) con folios
// únicos y consecutivos; cada tema aparece en exactamente un bloque y en el
// orden lineal, sin huérfanos; cada tema tiene su ficha y su widget con la
// estructura que su visualización espera (insns/stacks/texts de YARV, pasos y
// stats del GC, árbol de shapes, cadena de lookup, etc.); las simulaciones son
// deterministas (sin Math.random); y los widget.kind que usan las fichas tienen
// un iniciador registrado en js/page-*.js. Uso:
//   node public/guias/polyglot-ruby-c2/check.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const TOPIC_FILES = [
  'pipeline', 'yarv', 'jit', 'gvl', 'ractors', 'fibers',
  'gc', 'shapes', 'heap', 'lookup', 'singleton', 'caches',
];
const DATA_FILES = ['data/catalog.js', ...TOPIC_FILES.map((t) => `data/${t}.js`)];

// core.js siembra G.data; aquí lo hacemos a mano para cargar solo los datos.
const ctx = { window: { GUIA: { data: { topics: {} } } } };
vm.createContext(ctx);
for (const f of DATA_FILES)
  vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const G = ctx.window.GUIA;

const errs = [];
const fail = (msg) => errs.push(msg);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isArr = (v) => Array.isArray(v);

// --- Familias (contrato de la colección: 4 bloques) ---------------------------
const coreSrc = readFileSync(join(GUIDE, 'js/core.js'), 'utf8');
const FAMILIES = new Set([...coreSrc.matchAll(/^\s*(\w+):\s*\{\s*label:/gm)].map((m) => m[1]));
for (const fam of ['exec', 'conc', 'mem', 'obj'])
  if (!FAMILIES.has(fam)) fail(`core.js: falta la familia «${fam}» en G.FAMILIES`);

// --- Catálogo -----------------------------------------------------------------
if (!G.data || !G.data.catalog) fail('G.data.catalog: falta');
if (!G.data || !G.data.topics) fail('G.data.topics: falta');
const cat = G.data.catalog || {};
const topics = G.data.topics || {};

for (const k of ['meta', 'order', 'blocks', 'quote', 'biblio', 'colofon'])
  if (cat[k] == null) fail(`catalog.${k}: falta`);

if (!isArr(cat.order) || cat.order.length !== 12)
  fail(`catalog.order: ${cat.order?.length} temas, esperaba 12`);
if (!isArr(cat.blocks) || cat.blocks.length !== 4)
  fail(`catalog.blocks: ${cat.blocks?.length} bloques, esperaba 4`);

// meta
if (!isStr(cat.meta?.lede)) fail('catalog.meta.lede: falta');
if (!isStr(cat.meta?.count) || !cat.meta.count.includes(String(cat.order.length)))
  fail(`catalog.meta.count: «${cat.meta?.count}» debe reflejar ${cat.order.length} temas`);
for (const f of cat.meta?.facts || [])
  if (!isStr(f.k) || !isStr(f.v)) fail(`catalog.meta.facts: entrada sin k/v (${JSON.stringify(f)})`);

// order ⇔ topics (sin huérfanos en ningún sentido)
for (const slug of cat.order)
  if (!topics[slug]) fail(`catalog.order: «${slug}» no tiene ficha en G.data.topics`);
for (const slug of Object.keys(topics))
  if (!cat.order.includes(slug)) fail(`topics[${slug}]: huérfano, no aparece en catalog.order`);

// bloques: familia válida, temas reales, cada tema en exactamente un bloque
const enBloque = new Set();
for (const b of cat.blocks) {
  const at = `catalog.blocks[${b.family || '?'}]`;
  if (!FAMILIES.has(b.family)) fail(`${at}: familia inexistente «${b.family}»`);
  if (!isStr(b.eyebrow) || !isStr(b.hint)) fail(`${at}: falta eyebrow o hint`);
  if (!isArr(b.topics) || !b.topics.length) fail(`${at}: sin temas`);
  for (const slug of b.topics || []) {
    if (!topics[slug]) { fail(`${at}: tema inexistente «${slug}»`); continue; }
    if (enBloque.has(slug)) fail(`${at}: «${slug}» está en más de un bloque`);
    enBloque.add(slug);
  }
}
for (const slug of cat.order)
  if (!enBloque.has(slug)) fail(`catalog: «${slug}» está en order pero en ningún bloque`);

// quote / biblio / colofon
if (!isStr(cat.quote?.eyebrow) || !isStr(cat.quote?.html)) fail('catalog.quote: falta eyebrow o html');
if (!isStr(cat.colofon)) fail('catalog.colofon: falta');
for (const grp of cat.biblio || []) {
  if (!isStr(grp.title) || !isArr(grp.items) || !grp.items.length)
    fail(`catalog.biblio[${grp.title || '?'}]: sin title o items`);
  for (const r of grp.items || []) {
    if (!isStr(r.title) || !isStr(r.note) || !isStr(r.url)) fail(`biblio «${grp.title}»: item sin title/note/url`);
    if (typeof r.star !== 'boolean') fail(`biblio «${grp.title}»: item «${r.title}» sin star boolean`);
  }
}

// --- Fichas (fuente de verdad de cada tema) -----------------------------------
const GLYPH = /^[◆◇]{3}$/;
const folios = [];
for (const slug of cat.order) {
  const t = topics[slug];
  if (!t) continue;
  const at = `topics[${slug}]`;
  if (t.slug !== slug) fail(`${at}: slug interno «${t.slug}» no coincide con la clave`);
  for (const k of ['n', 'kind', 'glyph', 'family', 'navShort', 'title', 'tagline',
    'eyebrowSub', 'lede', 'fundamento', 'comoFunciona', 'widget', 'callout'])
    if (t[k] == null || t[k] === '') fail(`${at}: falta ${k}`);
  if (!FAMILIES.has(t.family)) fail(`${at}: familia inexistente «${t.family}»`);
  if (!GLYPH.test(t.glyph || '')) fail(`${at}: glyph «${t.glyph}» debe ser 3 de ◆/◇`);
  if (!isArr(t.chips) || !t.chips.length) fail(`${at}: chips vacío`);
  for (const f of t.enBreve || [])
    if (!isStr(f.k) || f.v == null) fail(`${at}: enBreve con k/v incompleto`);
  if (!isArr(t.enBreve) || !t.enBreve.length) fail(`${at}: enBreve vacío`);
  for (const r of t.recursos || [])
    if (!isStr(r.title) || !isStr(r.note) || !isStr(r.url)) fail(`${at}: recurso sin title/note/url`);
  if (!isArr(t.recursos) || !t.recursos.length) fail(`${at}: recursos vacío`);
  if (t.callout && (!isStr(t.callout.tag) || !isStr(t.callout.text))) fail(`${at}: callout incompleto`);
  folios.push(t.n);
}
// folios únicos y consecutivos 01..12 en el orden del catálogo
folios.forEach((n, i) => {
  const esperado = String(i + 1).padStart(2, '0');
  if (n !== esperado) fail(`catalog.order: folio «${n}» rompe la secuencia (esperado ${esperado})`);
});
if (new Set(folios).size !== folios.length) fail('temas: folios repetidos');

// --- Widgets: cada visualización trae las claves que su página espera ----------
const KIND_KEYS = {
  pipeline: (w, at) => {
    if (!isArr(w.stages) || w.stages.length < 2) fail(`${at}: pipeline sin stages`);
    for (const s of w.stages || [])
      if (!isStr(s.tool) || !isStr(s.label) || !isStr(s.title) || !isStr(s.code) || !isStr(s.note))
        fail(`${at}: stage incompleto (tool/label/title/code/note)`);
  },
  yarv: (w, at) => {
    if (!isArr(w.insns) || !w.insns.length) return fail(`${at}: yarv sin insns`);
    for (const ins of w.insns)
      if (!isStr(ins.addr) || !isStr(ins.op)) fail(`${at}: insn sin addr/op`);
    const n = w.insns.length + 1; // pasos = instrucciones + estado final
    if (!isArr(w.stacks) || w.stacks.length !== n) fail(`${at}: stacks debe tener ${n} estados (insns+1)`);
    if (!isArr(w.texts) || w.texts.length !== n) fail(`${at}: texts debe tener ${n} narraciones (insns+1)`);
    for (const s of w.stacks || []) if (!isArr(s)) fail(`${at}: cada stack debe ser un arreglo`);
  },
  jit: (w, at) => { if (typeof w.threshold !== 'number') fail(`${at}: jit sin threshold numérico`); },
  gvl: (w, at) => {
    if (!isArr(w.notes) || w.notes.length !== 2) fail(`${at}: gvl debe traer 2 notes (CPU / I/O)`);
    for (const nt of w.notes || []) if (!isStr(nt.key) || !isStr(nt.text)) fail(`${at}: note sin key/text`);
    if (!isStr(w.code)) fail(`${at}: gvl sin snippet code`);
  },
  ractors: (w, at) => {
    if (!isArr(w.objs) || !w.objs.length) fail(`${at}: ractors sin objs`);
    for (const o of w.objs || []) {
      if (!isStr(o.key) || !isStr(o.label) || !isStr(o.ruby)) fail(`${at}: obj sin key/label/ruby`);
      if (typeof o.shareable !== 'boolean') fail(`${at}: obj «${o.key}» sin shareable boolean`);
    }
    if (!isArr(w.modes) || !w.modes.length) fail(`${at}: ractors sin modes`);
    for (const m of w.modes || []) if (!isStr(m.key) || !isStr(m.verb)) fail(`${at}: mode sin key/verb`);
  },
  fibers: (w, at) => {
    if (!isArr(w.labels) || !w.labels.length) fail(`${at}: fibers sin labels`);
    for (const row of w.labels || []) if (!isArr(row)) fail(`${at}: labels debe ser arreglo de arreglos`);
    if (!isArr(w.notes) || w.notes.length !== 2) fail(`${at}: fibers debe traer 2 notes`);
    if (!isStr(w.code)) fail(`${at}: fibers sin snippet code`);
  },
  gc: (w, at) => {
    if (!isArr(w.steps) || !w.steps.length) return fail(`${at}: gc sin steps`);
    const n = w.steps.length;
    if (!isArr(w.texts) || w.texts.length !== n) fail(`${at}: texts (${w.texts?.length}) debe igualar steps (${n})`);
    if (!isArr(w.roots) || !w.roots.length) fail(`${at}: gc sin roots`);
    if (!isArr(w.objs) || !w.objs.length) fail(`${at}: gc sin objs`);
    for (const o of w.objs || []) {
      if (!isStr(o.id) || !['old', 'young'].includes(o.gen)) fail(`${at}: obj sin id o gen inválido`);
      if (typeof o.reach !== 'boolean') fail(`${at}: obj «${o.id}» sin reach boolean`);
    }
    for (const k of ['live', 'free', 'old']) {
      if (!isArr(w.stats?.[k]) || w.stats[k].length !== n)
        fail(`${at}: stats.${k} debe tener ${n} valores (uno por step)`);
    }
  },
  shapes: (w, at) => {
    if (!isArr(w.ivars) || !w.ivars.length) fail(`${at}: shapes sin ivars`);
    if (!isArr(w.presets) || w.presets.length !== 2) fail(`${at}: shapes debe traer 2 presets`);
    for (const p of w.presets || []) if (!isStr(p.label) || !isArr(p.seq)) fail(`${at}: preset sin label/seq`);
  },
  heap: () => {},
  lookup: (w, at) => {
    if (!w.defs || typeof w.defs !== 'object') return fail(`${at}: lookup sin defs`);
    if (!w.kind_of || typeof w.kind_of !== 'object') return fail(`${at}: lookup sin kind_of`);
    for (const cls of Object.keys(w.defs)) {
      if (!isArr(w.defs[cls])) fail(`${at}: defs[${cls}] no es lista de métodos`);
      if (!w.kind_of[cls]) fail(`${at}: «${cls}» en defs pero no en kind_of`);
    }
    if (!isArr(w.methods) || !w.methods.length) fail(`${at}: lookup sin methods`);
  },
  singleton: () => {},
  caches: () => {},
};

for (const slug of cat.order) {
  const t = topics[slug];
  if (!t || !t.widget) continue;
  const w = t.widget;
  const at = `topics[${slug}].widget`;
  if (!isStr(w.kind)) fail(`${at}: sin kind`);
  if (!isStr(w.title) || !isStr(w.intro)) fail(`${at}: falta title o intro`);
  if (w.kind !== slug) fail(`${at}: kind «${w.kind}» no coincide con el slug «${slug}»`);
  const validate = KIND_KEYS[w.kind];
  if (!validate) fail(`${at}: kind desconocido «${w.kind}»`);
  else validate(w, at);
}

// --- Determinismo: sin Math.random en los datos --------------------------------
for (const f of DATA_FILES)
  if (/Math\.random\s*\(/.test(readFileSync(join(GUIDE, f), 'utf8')))
    fail(`${f}: usa Math.random — los pasos narrativos deben ser deterministas`);

// --- Cruce con las vistas (js/) -----------------------------------------------
const registered = new Set();
for (const t of TOPIC_FILES) {
  const src = readFileSync(join(GUIDE, `js/page-${t}.js`), 'utf8');
  for (const m of src.matchAll(/G\.widgets\.(\w+)\s*=/g)) registered.add(m[1]);
}
for (const slug of cat.order) {
  const kind = topics[slug]?.widget?.kind;
  if (kind && !registered.has(kind)) fail(`widget «${kind}» (tema ${slug}): sin iniciador G.widgets.${kind} en js/page-*.js`);
}
const routerSrc = readFileSync(join(GUIDE, 'js/router.js'), 'utf8');
for (const fn of ['renderIndex', 'renderTopic'])
  if (!routerSrc.includes(fn)) fail(`router.js: no invoca G.${fn}`);
if (!routerSrc.includes('document.title')) fail('router.js: no fija document.title por vista');

// --- Resultado -----------------------------------------------------------------
if (errs.length) {
  console.error(`✗ polyglot-ruby-c2: ${errs.length} problema(s)`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ polyglot-ruby-c2: ${cat.order.length} temas · ${cat.blocks.length} bloques · ${Object.keys(topics).length} fichas · ${registered.size} widgets registrados · ${cat.biblio.length} grupos de bibliografía`);
