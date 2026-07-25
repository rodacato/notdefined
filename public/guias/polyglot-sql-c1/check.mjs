// Check de la guía (convención: cada guía trae su check.mjs junto a sus datos;
// `npm run check:guias` los descubre y corre todos).
//
// SQL dominado · Polyglot (C1). Verifica la INTEGRIDAD de los datos y su cruce
// con las vistas: catálogo completo (16 temas · 5 bloques) con folios «b.i»
// consecutivos por bloque y orden lineal sin huérfanos; una sola joya
// (window-functions); cada ficha con su guión (titulo, dificultad 1..3, queEs,
// enBreve, fundamento, comoFunciona, cuandoNo, mito, recursos, widget); cada
// widget (y widgetExtra) usado tiene su iniciador en js/widgets.js; y las
// simulaciones son deterministas (sin Math.random). Uso:
//   node public/guias/polyglot-sql-c1/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const TOPIC_FILES = [
  'window', 'lateral', 'distinct-on', 'keyset',
  'ctes', 'recursivas', 'subqueries',
  'group-by', 'pivot', 'agregados',
  'upsert', 'returning', 'skip-locked',
  'fdw', 'jsonb', 'criterio',
];
const DATA_FILES = ['data/catalog.js', ...TOPIC_FILES.map((t) => `data/${t}.js`)];

// core.js define G.registrarFicha; aquí lo replicamos para cargar solo el guión
// (los data files son IIFE puras sobre window.GUIA, sin DOM).
const ctx = { window: {} };
const G = (ctx.window.GUIA = { fichas: {} });
G.registrarFicha = (f) => { G.fichas[f.slug] = f; };
vm.createContext(ctx);
for (const f of DATA_FILES)
  vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);

const errs = [];
const fail = (msg) => errs.push(msg);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isArr = (v) => Array.isArray(v) && v.length > 0;

// --- Catálogo -----------------------------------------------------------------
if (!G.meta || !isStr(G.meta.titulo)) fail('G.meta.titulo: falta');
if (G.meta && !/16 temas · 5 bloques/.test(G.meta.volumen || ''))
  fail(`meta.volumen «${G.meta?.volumen}» debe decir «16 temas · 5 bloques»`);
if (G.meta && !/C1/.test(G.meta.nivel || '')) fail(`meta.nivel «${G.meta?.nivel}» debe ser C1`);

if (!Array.isArray(G.catalogo)) fail('G.catalogo: falta');
const bloques = G.catalogo || [];
if (bloques.length !== 5) fail(`bloques: ${bloques.length}, esperaba 5`);

const orden = [];
const folioEsperado = {};
for (const b of bloques) {
  const at = `bloque ${b.n}`;
  if (!isStr(b.titulo)) fail(`${at}: sin titulo`);
  if (!b.modelo || !isStr(b.modelo.titulo) || !isStr(b.modelo.texto))
    fail(`${at}: modelo mental incompleto (titulo/texto)`);
  if (!isArr(b.fichas)) fail(`${at}: sin fichas`);
  (b.fichas || []).forEach((slug, i) => {
    orden.push(slug);
    folioEsperado[slug] = `${b.n}.${i + 1}`;
  });
}
if (orden.length !== 16) fail(`temas: ${orden.length}, esperaba 16`);
if (new Set(orden).size !== orden.length) fail('catálogo: slugs repetidos');

// G.orden ⇔ orden derivado del catálogo (mismo orden lineal)
if (!Array.isArray(G.orden) || G.orden.join('|') !== orden.join('|'))
  fail('G.orden no coincide con el aplanado del catálogo');
// G.folio ⇔ folio esperado por bloque/posición
for (const slug of orden) {
  const got = G.folio?.[slug]?.numero;
  if (got !== folioEsperado[slug])
    fail(`folio de «${slug}»: «${got}», esperaba «${folioEsperado[slug]}»`);
}

// catálogo ⇔ archivos de datos (sin huérfanos)
const catSlugs = new Set(orden);
for (const slug of catSlugs)
  if (!G.fichas[slug]) fail(`catálogo: «${slug}» sin ficha registrada (¿data/*.js?)`);
for (const slug of Object.keys(G.fichas))
  if (!catSlugs.has(slug)) fail(`ficha «${slug}»: huérfana, no aparece en el catálogo`);

// --- Fichas (fuente de verdad de cada tema) -----------------------------------
let joyas = 0;
for (const slug of orden) {
  const f = G.fichas[slug];
  const at = `ficha «${slug}»`;
  if (!f) continue;
  if (f.slug !== slug) fail(`${at}: slug interno «${f.slug}» no coincide`);
  if (![1, 2, 3].includes(f.dificultad)) fail(`${at}: dificultad «${f.dificultad}» debe ser 1..3`);
  if (!isStr(f.titulo) || !isStr(f.queEs)) fail(`${at}: falta titulo o queEs`);
  if (!isArr(f.enBreve)) fail(`${at}: enBreve vacío`);
  for (const d of f.enBreve || [])
    if (!isStr(d.k) || !isStr(d.v)) fail(`${at}: enBreve con k/v incompleto`);
  if (!isStr(f.fundamento)) fail(`${at}: fundamento vacío`);
  if (!isArr(f.comoFunciona)) fail(`${at}: comoFunciona vacío`);
  if (!isStr(f.cuandoNo)) fail(`${at}: falta cuandoNo`);
  if (!f.mito || !isStr(f.mito.creencia) || !isStr(f.mito.realidad)) fail(`${at}: mito sin creencia/realidad`);
  if (!isArr(f.recursos)) fail(`${at}: recursos vacío`);
  for (const r of f.recursos || [])
    if (!isStr(r.titulo) || !isStr(r.nota) || !isStr(r.url)) fail(`${at}: recurso sin titulo/nota/url`);
  if (!isStr(f.widget)) fail(`${at}: falta widget (kind)`);
  if (f.esJoya === true) joyas++;
}
if (joyas !== 1) fail(`joyas (esJoya:true): ${joyas}, esperaba exactamente 1`);
const joya = orden.find((s) => G.fichas[s]?.esJoya);
if (joya && joya !== 'window-functions') fail(`la joya debería ser «window-functions», es «${joya}»`);

// --- Widgets: cada visualización tiene su iniciador en js/widgets.js -----------
const widgetsSrc = readFileSync(join(GUIDE, 'js/widgets.js'), 'utf8');
const registered = new Set(
  [...widgetsSrc.matchAll(/G\.widgets\[["']([\w-]+)["']\]\s*=/g)].map((m) => m[1]),
);
for (const slug of orden) {
  const f = G.fichas[slug];
  for (const kind of [f?.widget, f?.widgetExtra].filter(Boolean)) {
    if (!registered.has(kind))
      fail(`widget «${kind}» (tema ${slug}): sin iniciador G.widgets["${kind}"] en js/widgets.js`);
  }
}

// --- Determinismo: sin Math.random en los datos --------------------------------
for (const f of DATA_FILES)
  if (/Math\.random\s*\(/.test(readFileSync(join(GUIDE, f), 'utf8')))
    fail(`${f}: usa Math.random — los pasos narrativos deben ser deterministas`);

// --- Cada vista fija document.title -------------------------------------------
const fijaTitulo = readdirSync(join(GUIDE, 'js'))
  .filter((f) => f.endsWith('.js'))
  .some((f) => readFileSync(join(GUIDE, 'js', f), 'utf8').includes('document.title'));
if (!fijaTitulo) fail('js/: ninguna vista fija document.title');

// --- Resultado -----------------------------------------------------------------
if (errs.length) {
  console.error(`✗ polyglot-sql-c1: ${errs.length} problema(s)`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ polyglot-sql-c1: ${orden.length} temas · ${bloques.length} bloques · ${Object.keys(G.fichas).length} fichas · ${registered.size} widgets registrados · joya: ${joya}`);
