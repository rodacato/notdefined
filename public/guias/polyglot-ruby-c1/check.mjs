// Check de la guía (convención: cada guía trae su check.mjs junto a sus datos;
// `npm run check:guias` los descubre y corre todos).
//
// Ruby dominado · Polyglot (C1). Verifica la INTEGRIDAD de los datos y su cruce
// con las vistas: catálogo completo (15 temas · 4 bloques) con folios únicos y
// consecutivos 01..15 en orden de bloque; cada ficha con su guión (slug, folio,
// bloque válido, titulo, quees, enBreve, fundamento, comoFunciona, cuandoNo,
// mito, widget, recursos); cada widget usado tiene su guión en D.widgets; y las
// simulaciones son deterministas (sin Math.random). Uso:
//   node public/guias/polyglot-ruby-c1/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DATA_FILES = [
  'data/meta.js',
  'data/modelo-de-objetos.js',
  'data/metaprogramacion.js',
  'data/lenguaje-expresivo.js',
  'data/robustez-concurrencia.js',
  'data/widgets-modelo-de-objetos.js',
  'data/widgets-metaprogramacion.js',
  'data/widgets-lenguaje-expresivo.js',
  'data/widgets-robustez.js',
];

// Los data files son IIFE puras sobre window.GUIA (sin DOM). Los cargamos en un
// contexto mínimo para inspeccionar el guión sin el motor de render.
const ctx = { window: {} };
ctx.window.GUIA = {};
vm.createContext(ctx);
for (const f of DATA_FILES)
  vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const D = ctx.window.GUIA.datos || {};

const errs = [];
const fail = (msg) => errs.push(msg);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isArr = (v) => Array.isArray(v) && v.length > 0;

// --- Identidad + bloques ------------------------------------------------------
if (!D.guia || !isStr(D.guia.titulo)) fail('D.guia.titulo: falta');
if (D.guia && !/15 temas · 4 bloques/.test(D.guia.conteo || ''))
  fail(`guia.conteo «${D.guia?.conteo}» debe decir «15 temas · 4 bloques»`);
if (D.guia && !/C1/.test(D.guia.lenguaje || '')) fail(`guia.lenguaje «${D.guia?.lenguaje}» debe marcar C1`);
if (D.guia && !isStr(D.guia.ancla)) fail('guia.ancla: falta el ancla de versión');

const bloques = D.bloques || [];
if (bloques.length !== 4) fail(`bloques: ${bloques.length}, esperaba 4`);
const bloqueIds = new Set();
for (const b of bloques) {
  if (!isStr(b.id) || !isStr(b.titulo) || !isStr(b.bajada) || !isStr(b.folio))
    fail(`bloque «${b.id || '?'}»: falta id/titulo/bajada/folio`);
  if (bloqueIds.has(b.id)) fail(`bloque «${b.id}»: id repetido`);
  bloqueIds.add(b.id);
}

// --- Fichas -------------------------------------------------------------------
const fichas = D.fichas || [];
if (fichas.length !== 15) fail(`fichas: ${fichas.length}, esperaba 15`);

const porBloque = {};
const folios = [];
const slugs = new Set();
for (const f of fichas) {
  const at = `ficha «${f.slug || '?'}»`;
  if (!isStr(f.slug)) { fail(`${at}: sin slug`); continue; }
  if (slugs.has(f.slug)) fail(`${at}: slug repetido`);
  slugs.add(f.slug);
  if (!/^[0-9]{2}$/.test(f.folio || '')) fail(`${at}: folio «${f.folio}» debe ser 2 dígitos`);
  folios.push(f.folio);
  if (!bloqueIds.has(f.bloque)) fail(`${at}: bloque «${f.bloque}» no existe`);
  else (porBloque[f.bloque] = porBloque[f.bloque] || []).push(f.folio);
  if (!isStr(f.titulo) || !isStr(f.quees)) fail(`${at}: falta titulo o quees`);
  if (!isArr(f.enBreve)) fail(`${at}: enBreve vacío`);
  if (!isStr(f.fundamento)) fail(`${at}: fundamento vacío`);
  if (!isStr(f.comoFunciona)) fail(`${at}: comoFunciona vacío`);
  if (!isStr(f.cuandoNo)) fail(`${at}: falta cuandoNo`);
  if (!f.mito || !isStr(f.mito.creencia) || !isStr(f.mito.realidad)) fail(`${at}: mito sin creencia/realidad`);
  if (!isStr(f.widget)) fail(`${at}: falta widget (kind)`);
  if (!isArr(f.recursos)) fail(`${at}: recursos vacío`);
  for (const r of f.recursos || [])
    if (!isStr(r.titulo) || !isStr(r.nota)) fail(`${at}: recurso sin titulo/nota`);
}

// folios únicos y consecutivos 01..15 en el orden de las fichas
folios.forEach((n, i) => {
  const esperado = String(i + 1).padStart(2, '0');
  if (n !== esperado) fail(`folio «${n}» rompe la secuencia (esperado ${esperado})`);
});
// cada bloque tiene al menos una ficha
for (const b of bloques)
  if (!porBloque[b.id]) fail(`bloque «${b.id}»: sin fichas`);

// --- Widgets: cada visualización tiene su guión en D.widgets -------------------
const widgets = D.widgets || {};
for (const f of fichas) {
  if (f.widget && !widgets[f.widget])
    fail(`widget «${f.widget}» (ficha ${f.slug}): sin guión en D.widgets`);
}
// sin widgets huérfanos
for (const kind of Object.keys(widgets))
  if (!fichas.some((f) => f.widget === kind)) fail(`D.widgets.${kind}: huérfano, ninguna ficha lo usa`);

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
  console.error(`✗ polyglot-ruby-c1: ${errs.length} problema(s)`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ polyglot-ruby-c1: ${fichas.length} temas · ${bloques.length} bloques · ${Object.keys(widgets).length} widgets`);
