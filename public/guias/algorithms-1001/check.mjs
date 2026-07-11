// Check de la guía (convención: cada guía puede traer su check.mjs junto a
// sus datos; `npm run check:guias` los descubre y corre todos).
//
// Esta guía no trae snippets ejecutables (su código es pseudocódigo de
// pantalla), así que el check verifica estructura y contratos:
//   1. data/ carga en un vm y las referencias cruzadas cierran
//      (ALGOS ↔ MODS/MODULES/sims, PROBLEMS ↔ ALGOS, guía ↔ sims, grafos).
//   2. Toda clave de sims que usa js/ existe en los datos.
//   3. node --check pasa sobre cada archivo de data/ y js/.
//   4. index.html referencia exactamente los archivos de data/ y js/.
//   5. Cero requests externos (funciona offline con doble clic).
//   6. Sin colofón de origen dentro de la guía (ADR 0005, enmienda).
//   7. Las leyendas de estado solo usan claves del contrato o entradas locales.
// Uso directo: node public/guias/algorithms-1001/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DATA_FILES = [
  'data/catalogo.js',
  'data/sims-busqueda.js',
  'data/sims-fundamentos.js',
  'data/sims-ordenamiento.js',
  'data/sims-recursion.js',
  'data/sims-estructuras.js',
  'data/sims-grafos.js',
  'data/sims-greedy-dp.js',
  'data/guia.js',
];
const JS_FILES = readdirSync(join(GUIDE, 'js')).sort().map((f) => 'js/' + f);

const failures = [];
const fail = (msg) => failures.push(msg);

// --- 1 · cargar data/ y validar referencias cruzadas ---
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of DATA_FILES) vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const D = ctx.window.GUIA.DATA;

const modIds = new Set(D.MODULES.map((m) => m.id));
const modRoutes = new Set(D.MODULES.map((m) => m.route));
const simKeys = new Set(Object.keys(D.sims));
const algoIds = new Set(D.ALGOS.map((a) => a.id));

for (const k of Object.keys(D.MODS))
  if (!modIds.has(D.MODS[k].no)) fail(`MODS[${k}].no=${D.MODS[k].no} sin módulo`);
for (const a of D.ALGOS) {
  if (!D.MODS[a.mod]) fail(`ALGOS ${a.id}: mod ${a.mod} no existe en MODS`);
  const [base, sub] = a.route.replace('#/', '').split('/');
  if (!modRoutes.has('#/' + base)) fail(`ALGOS ${a.id}: ruta ${a.route} sin módulo`);
  if (sub && !simKeys.has(sub)) fail(`ALGOS ${a.id}: sub "${sub}" sin sim`);
}
for (const p of D.PROBLEMS)
  for (const h of p.hits)
    if (!algoIds.has(h)) fail(`PROBLEMS ${p.id}: hit "${h}" no es un algoritmo`);
for (const c of D.guia.comparisons) {
  const ids = new Set(c.algos.map((x) => x.id));
  for (const x of c.algos)
    if (!D.MODS[x.mod]) fail(`guia ${c.id}: algo ${x.id} con mod ${x.mod} inexistente`);
  for (const s of c.scenarios)
    if (!ids.has(s.answer)) fail(`guia ${c.id}: answer "${s.answer}" fuera de la comparación`);
}
for (const [name, g] of Object.entries(D.graphs)) {
  const nodeIds = new Set(g.nodes.map((n) => n.id));
  for (const e of g.edges)
    if (!nodeIds.has(e.u) || !nodeIds.has(e.v))
      fail(`graphs.${name}: arista ${e.u}-${e.v} con nodo inexistente`);
}

// --- 2 · claves de sims/graphs usadas por js/ existen ---
const jsSrc = Object.fromEntries(
  JS_FILES.map((f) => [f, readFileSync(join(GUIDE, f), 'utf8')]),
);
for (const [f, src] of Object.entries(jsSrc)) {
  for (const m of src.matchAll(/DATA\.sims(?:\.([A-Za-z_$][\w$]*)|\["([^"]+)"\])/g)) {
    const key = m[1] || m[2];
    if (!simKeys.has(key)) fail(`${f}: DATA.sims.${key} no existe`);
  }
  for (const m of src.matchAll(/DATA\.graphs\.([A-Za-z_$][\w$]*)/g))
    if (!D.graphs[m[1]]) fail(`${f}: DATA.graphs.${m[1]} no existe`);
}

// --- 3 · sintaxis de cada archivo ---
for (const f of [...DATA_FILES, ...JS_FILES]) {
  const r = spawnSync('node', ['--check', join(GUIDE, f)], { encoding: 'utf8' });
  if (r.status !== 0) fail(`${f}: node --check falló\n  ${r.stderr.trim()}`);
}

// --- 4 · index.html referencia exactamente data/ + js/ ---
const html = readFileSync(join(GUIDE, 'index.html'), 'utf8');
const srcs = [...html.matchAll(/<script src="\.\/([^"]+)"/g)].map((m) => m[1]);
const expected = new Set([...DATA_FILES, ...JS_FILES]);
for (const s of srcs) if (!expected.has(s)) fail(`index.html referencia ${s} inexistente`);
for (const f of expected) if (!srcs.includes(f)) fail(`index.html no carga ${f}`);
if (!/<a href="\/">← notdefined\.dev<\/a>|site-home/.test(html + jsSrc['js/components.js']))
  fail('falta el back-link ← notdefined.dev');

// --- 5 · cero requests externos (se permite el namespace SVG) ---
const allFiles = ['index.html', 'styles.css', ...DATA_FILES, ...JS_FILES];
for (const f of allFiles) {
  const src = readFileSync(join(GUIDE, f), 'utf8');
  for (const m of src.matchAll(/https?:\/\/[^\s"'<)]+/g))
    if (!m[0].startsWith('http://www.w3.org/')) fail(`${f}: request externo ${m[0]}`);
}

// --- 6 · sin colofón de origen ---
for (const f of allFiles)
  if (/claude/i.test(readFileSync(join(GUIDE, f), 'utf8')))
    fail(`${f}: menciona el origen (colofón prohibido dentro de la guía)`);

// --- 7 · leyendas: claves string dentro del contrato de STATES ---
const CONTRACT = new Set(['neutral', 'active', 'cand', 'goal', 'done', 'out', 'path']);
for (const [f, src] of Object.entries(jsSrc))
  for (const m of src.matchAll(/stateLegend\(\s*(\[[^\]]*\])/g))
    for (const k of m[1].replace(/\{[^}]*\}/g, '').matchAll(/"([a-z-]+)"/g))
      if (!CONTRACT.has(k[1])) fail(`${f}: stateLegend con clave "${k[1]}" fuera del contrato`);

console.log(
  `data: ${DATA_FILES.length} archivos · js: ${JS_FILES.length} · ` +
  `sims: ${simKeys.size} · algos: ${algoIds.size} · comparaciones: ${D.guia.comparisons.length}`,
);
if (failures.length) {
  console.error('\n' + failures.join('\n'));
  process.exit(1);
}
console.log('estructura, referencias, sintaxis y portabilidad en orden');
