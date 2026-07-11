// Check de la guía (convención: cada guía puede traer su check.mjs junto a
// sus datos; `npm run check:guias` los descubre y corre todos).
//
// Esta guía no trae snippets ejecutables: el check verifica la INTEGRIDAD de
// los datos. Todo estilo del catálogo tiene sus campos obligatorios; todo
// estilo marcado hasFicha/hasDiagrama tiene su ficha real en G.fichas (y al
// revés: ninguna ficha huérfana ni desalineada con su semilla); ids únicos; y
// toda referencia interna (problemas → estilos, escenarios → candidatos,
// familias, roles de diagrama) apunta a algo que existe. Uso directo:
//   node public/guias/architectures-1001/check.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DATA_FILES = [
  'data/catalogo.js',
  'data/fichas-despliegue.js',
  'data/fichas-interna.js',
  'data/fichas-comunicacion.js',
  'data/fichas-distribuidos.js',
  'data/fichas-codigo.js',
];

const ctx = { window: {} };
vm.createContext(ctx);
for (const f of DATA_FILES)
  vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const G = ctx.window.GUIA;
const D = G.data;

const errs = [];
const fail = (msg) => errs.push(msg);

// --- Colecciones base -------------------------------------------------------
for (const k of ['META', 'FAMILIES', 'VIEWS', 'SCALE', 'AXES', 'PROM', 'ARCHS', 'PROBLEMS', 'QUADRANTS', 'ROLES', 'COMPARISONS'])
  if (!D[k]) fail(`data.${k}: falta`);

const famIds = new Set(D.FAMILIES.map((f) => f.id));
const famNums = D.FAMILIES.map((f) => f.numero);
if (new Set(famNums).size !== D.FAMILIES.length) fail('FAMILIES: numero repetido');
const roleKeys = new Set(D.ROLES.map((r) => r.key));
const axisKeys = D.AXES.map((a) => a.key);

// --- Semillas del catálogo ---------------------------------------------------
const archIds = new Set();
const archNs = new Set();
for (const a of D.ARCHS) {
  const at = `ARCHS[${a.id || a.n || '?'}]`;
  for (const k of ['n', 'id', 'name', 'family', 'scale', 'primary', 'force', 'avoid', 'fit'])
    if (a[k] == null || a[k] === '') fail(`${at}: falta ${k}`);
  if (archIds.has(a.id)) fail(`${at}: id repetido`);
  archIds.add(a.id);
  if (archNs.has(a.n)) fail(`${at}: n repetido (${a.n})`);
  archNs.add(a.n);
  if (!famIds.has(a.family)) fail(`${at}: familia inexistente «${a.family}»`);
  if (!D.SCALE[a.scale]) fail(`${at}: scale inválida «${a.scale}»`);
  if (!D.VIEWS[a.primary]) fail(`${at}: vista primaria inválida «${a.primary}»`);
  for (const k of ['team', 'scaleParts', 'domain', 'consistency'])
    if (a.fit?.[k] == null) fail(`${at}: falta fit.${k}`);
}

// --- Fichas profundas ⇔ semillas ---------------------------------------------
const byId = Object.fromEntries(D.ARCHS.map((a) => [a.id, a]));
for (const a of D.ARCHS) {
  const ficha = G.fichas[a.id];
  if (a.hasFicha && !ficha) fail(`${a.id}: hasFicha pero sin ficha en G.fichas`);
  if (!a.hasFicha && ficha) fail(`${a.id}: ficha presente pero sin hasFicha en el catálogo`);
  if (a.hasDiagrama && !ficha?.diagrama?.length) fail(`${a.id}: hasDiagrama pero la ficha no trae diagrama`);
}
for (const [id, f] of Object.entries(G.fichas)) {
  const at = `fichas[${id}]`;
  const seed = byId[id];
  if (!seed) { fail(`${at}: huérfana, sin semilla en el catálogo`); continue; }
  for (const k of ['n', 'id', 'nombre', 'prominencia', 'vistaPrimaria', 'queEs', 'fuerza', 'gana', 'paga', 'cuandoNo', 'parientes', 'ratings'])
    if (f[k] == null || f[k] === '') fail(`${at}: falta ${k}`);
  if (f.id !== id) fail(`${at}: id interno «${f.id}» ≠ clave`);
  if (f.n !== seed.n) fail(`${at}: folio ${f.n} ≠ ${seed.n} del catálogo`);
  if (f.vistaPrimaria !== seed.primary) fail(`${at}: vistaPrimaria «${f.vistaPrimaria}» ≠ «${seed.primary}» del catálogo`);
  if (!D.PROM[f.prominencia]) fail(`${at}: prominencia inválida «${f.prominencia}»`);
  for (const k of axisKeys) {
    const v = f.ratings?.[k];
    if (typeof v !== 'number' || v < 0 || v > 4) fail(`${at}: rating ${k} inválido (${v})`);
  }
  for (const [i, p] of (f.diagrama || []).entries()) {
    if (!['node', 'edge', 'path', 'frame', 'label'].includes(p.t)) fail(`${at}.diagrama[${i}]: t inválido «${p.t}»`);
    if (p.t === 'node' && !roleKeys.has(p.role)) fail(`${at}.diagrama[${i}]: role inexistente «${p.role}»`);
  }
}

// --- Referencias internas ------------------------------------------------------
const probIds = new Set();
for (const p of D.PROBLEMS) {
  if (probIds.has(p.id)) fail(`PROBLEMS[${p.id}]: id repetido`);
  probIds.add(p.id);
  for (const hit of p.hits)
    if (!archIds.has(hit)) fail(`PROBLEMS[${p.id}]: hit inexistente «${hit}»`);
}

const compIds = new Set();
for (const c of D.COMPARISONS) {
  const at = `COMPARISONS[${c.id}]`;
  if (compIds.has(c.id)) fail(`${at}: id repetido`);
  compIds.add(c.id);
  const algoIds = new Set(c.algos.map((a) => a.id));
  for (const a of c.algos) {
    if (!famNums.includes(a.fam)) fail(`${at}.${a.id}: fam ${a.fam} inexistente`);
    if (!a.intent || !a.pick || !a.traits?.length) fail(`${at}.${a.id}: faltan intent/pick/traits`);
  }
  for (const s of c.scenarios)
    if (!algoIds.has(s.answer)) fail(`${at}: escenario con answer inexistente «${s.answer}»`);
}

for (const q of D.QUADRANTS) {
  if (!['mono', 'micro'].includes(q.runtime)) fail(`QUADRANTS[${q.title}]: runtime inválido`);
  if (!['mono', 'poly'].includes(q.repo)) fail(`QUADRANTS[${q.title}]: repo inválido`);
}

// --- Resumen ------------------------------------------------------------------
const deep = Object.keys(G.fichas).length;
console.log(`estilos: ${D.ARCHS.length} · familias: ${D.FAMILIES.length} · fichas profundas: ${deep} · comparaciones: ${D.COMPARISONS.length} · problemas: ${D.PROBLEMS.length}`);
if (errs.length) {
  console.error('\n' + errs.join('\n'));
  process.exit(1);
}
console.log('datos íntegros: semillas, fichas y referencias internas cuadran');
