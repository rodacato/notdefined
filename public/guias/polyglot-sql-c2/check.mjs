// Check de la guía (convención: cada guía trae su check.mjs junto a sus datos;
// `npm run check:guias` los descubre y corre todos).
//
// SQL a fondo · Polyglot (C2). Verifica la INTEGRIDAD de los datos y su cruce
// con las vistas: catálogo completo (14 temas · 4 bloques) con folios únicos y
// consecutivos 01..14 en orden de catálogo; una sola joya (planner/03); cada
// tema con su ficha (queEs, enBreve, fundamento, comoFunciona, cuandoDuele,
// mito, recursos); cada widget usado tiene su iniciador en js/widget-*.js; y
// las simulaciones son deterministas (sin Math.random). Uso:
//   node public/guias/polyglot-sql-c2/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const TOPIC_FILES = [
  'pipeline', 'indices', 'planner', 'estadisticas',
  'mvcc', 'vacuum', 'aislamiento', 'locks',
  'wal', 'paginas', 'toast', 'buffers',
  'conexiones', 'extensibilidad',
];
const DATA_FILES = ['data/catalog.js', ...TOPIC_FILES.map((t) => `data/${t}.js`)];

// Los data files son puros (IIFE sobre window.GUIA, sin DOM). Los cargamos en
// un contexto mínimo para inspeccionar el guión sin el motor de render.
const ctx = { window: {} };
ctx.window.GUIA = {};
vm.createContext(ctx);
for (const f of DATA_FILES)
  vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const G = ctx.window.GUIA;

const errs = [];
const fail = (msg) => errs.push(msg);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isArr = (v) => Array.isArray(v) && v.length > 0;

// --- Catálogo -----------------------------------------------------------------
if (!G.catalog || !Array.isArray(G.catalog.bloques)) fail('G.catalog.bloques: falta');
const cat = G.catalog || {};
const bloques = cat.bloques || [];
if (cat.nivel !== 'C2') fail(`catalog.nivel: «${cat.nivel}», esperaba «C2»`);
if (cat.lengua !== 'SQL') fail(`catalog.lengua: «${cat.lengua}», esperaba «SQL»`);
if (cat.coleccion !== 'Polyglot') fail(`catalog.coleccion: «${cat.coleccion}», esperaba «Polyglot»`);
if (bloques.length !== 4) fail(`bloques: ${bloques.length}, esperaba 4`);

const temas = [];
let jewels = 0;
for (const b of bloques) {
  const at = `bloque ${b.n}`;
  if (!isStr(b.titulo)) fail(`${at}: sin titulo`);
  if (!b.modelo || !isStr(b.modelo.nombre) || !isStr(b.modelo.desc))
    fail(`${at}: modelo mental incompleto (nombre/desc)`);
  if (!isArr(b.temas)) fail(`${at}: sin temas`);
  for (const t of b.temas || []) {
    if (!isStr(t.slug)) { fail(`${at}: tema sin slug`); continue; }
    if (!/^[0-9]{2}$/.test(t.folio || '')) fail(`${t.slug}: folio «${t.folio}» debe ser 2 dígitos`);
    if (![1, 2, 3].includes(t.diff)) fail(`${t.slug}: diff «${t.diff}» debe ser 1..3`);
    if (!isStr(t.titulo) || !isStr(t.queEs)) fail(`${t.slug}: falta titulo o queEs`);
    if (t.jewel === true) jewels++;
    temas.push(t);
  }
}
if (temas.length !== 14) fail(`temas: ${temas.length}, esperaba 14`);
if (jewels !== 1) fail(`joyas (jewel:true): ${jewels}, esperaba exactamente 1`);

// folios únicos y consecutivos 01..14 en el orden del catálogo
temas.forEach((t, i) => {
  const esperado = String(i + 1).padStart(2, '0');
  if (t.folio !== esperado) fail(`folio «${t.folio}» rompe la secuencia (esperado ${esperado}) en «${t.slug}»`);
});
if (new Set(temas.map((t) => t.slug)).size !== temas.length) fail('temas: slugs repetidos');
const joya = temas.find((t) => t.jewel);
if (joya && joya.slug !== 'planner') fail(`la joya debería ser «planner», es «${joya.slug}»`);

// catalog ⇔ archivos de datos (sin huérfanos)
const catSlugs = new Set(temas.map((t) => t.slug));
for (const t of TOPIC_FILES) if (!catSlugs.has(t)) fail(`data/${t}.js: slug «${t}» no aparece en el catálogo`);
for (const slug of catSlugs) if (!TOPIC_FILES.includes(slug)) fail(`catálogo: «${slug}» sin data/${slug}.js`);

// --- Fichas (fuente de verdad de cada tema) -----------------------------------
const fichas = G.fichas || {};
for (const t of temas) {
  const f = fichas[t.slug];
  const at = `ficha «${t.slug}»`;
  if (!f) { fail(`${at}: no existe en G.fichas`); continue; }
  if (f.slug !== t.slug) fail(`${at}: slug interno «${f.slug}» no coincide`);
  if (!isArr(f.queEs)) fail(`${at}: queEs vacío`);
  if (!isArr(f.enBreve)) fail(`${at}: enBreve vacío`);
  if (!isArr(f.fundamento)) fail(`${at}: fundamento vacío`);
  if (!isArr(f.comoFunciona)) fail(`${at}: comoFunciona vacío`);
  if (!f.cuandoDuele || !isArr(f.cuandoDuele.paras)) fail(`${at}: cuandoDuele sin paras`);
  if (!f.mito || !isStr(f.mito.claim) || !isStr(f.mito.truth)) fail(`${at}: mito sin claim/truth`);
  if (!isArr(f.recursos)) fail(`${at}: recursos vacío`);
  for (const r of f.recursos || [])
    if (!isStr(r.title) || !isStr(r.note)) fail(`${at}: recurso sin title/note`);
}
for (const slug of Object.keys(fichas))
  if (!catSlugs.has(slug)) fail(`G.fichas[${slug}]: huérfano, no aparece en el catálogo`);

// --- Widgets: cada visualización tiene su iniciador en js/widget-*.js ----------
const registered = new Set();
for (const f of readdirSync(join(GUIDE, 'js'))) {
  if (!/^widget-.*\.js$/.test(f)) continue;
  const src = readFileSync(join(GUIDE, 'js', f), 'utf8');
  for (const m of src.matchAll(/G\.widgets\.(\w+)\s*=/g)) registered.add(m[1]);
}
let widgetsUsados = 0;
for (const t of temas) {
  const w = fichas[t.slug]?.widget;
  if (!w) continue;
  widgetsUsados++;
  if (!isStr(w.kind)) { fail(`ficha «${t.slug}».widget: sin kind`); continue; }
  if (!registered.has(w.kind))
    fail(`widget «${w.kind}» (tema ${t.slug}): sin iniciador G.widgets.${w.kind} en js/widget-*.js`);
}

// --- Determinismo: sin Math.random en los datos --------------------------------
for (const f of DATA_FILES)
  if (/Math\.random\s*\(/.test(readFileSync(join(GUIDE, f), 'utf8')))
    fail(`${f}: usa Math.random — los pasos narrativos deben ser deterministas`);

// --- Router fija document.title por vista -------------------------------------
const routerSrc = readFileSync(join(GUIDE, 'js/router.js'), 'utf8');
if (!routerSrc.includes('document.title')) fail('router.js: no fija document.title por vista');

// --- Resultado -----------------------------------------------------------------
if (errs.length) {
  console.error(`✗ polyglot-sql-c2: ${errs.length} problema(s)`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ polyglot-sql-c2: ${temas.length} temas · ${bloques.length} bloques · ${Object.keys(fichas).length} fichas · ${widgetsUsados} widgets (${registered.size} registrados) · joya: ${joya?.slug}`);
