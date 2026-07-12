// Check de la guía (convención: cada guía puede traer su check.mjs junto a
// sus datos; `npm run check:guias` los descubre y corre todos).
//
// Esta guía no trae snippets ejecutables: el check verifica la INTEGRIDAD de
// los datos. Catálogo completo (11 sistemas, 4 familias) con folios únicos y
// consecutivos; cada sistema tiene ficha y ninguna ficha queda huérfana (con
// «semántica de entrega» y «garantías de orden» presentes — son EL criterio
// del tomo); ratings en los 7 ejes; las simulaciones son deterministas y cada
// paso trae narración y tokens con lanes/estados declarados; los escenarios,
// la escalera y la desambiguación cuadran contra el catálogo; y los ids que
// usan las vistas (fichas→sim, simOrden, rutas del router) existen. Uso:
//   node public/guias/messaging-1001/check.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DATA_FILES = [
  'data/catalogo.js',
  'data/fichas-colas.js',
  'data/fichas-logs.js',
  'data/fichas-pubsub.js',
  'data/fichas-gestionada.js',
  'data/simulaciones.js',
  'data/escenarios.js',
];

const ctx = { window: {} };
vm.createContext(ctx);
for (const f of DATA_FILES)
  vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const G = ctx.window.GUIA;

const errs = [];
const fail = (msg) => errs.push(msg);

// --- Colecciones base ---------------------------------------------------------
for (const k of ['familias', 'dolores', 'ejes', 'catalogo', 'fichas', 'simulaciones', 'simOrden', 'escenarios', 'escalera', 'desambiguaciones'])
  if (!G[k]) fail(`G.${k}: falta`);

if (G.catalogo.length !== 11) fail(`catalogo: ${G.catalogo.length} sistemas, esperaba 11`);
if (G.familias.length !== 4) fail(`familias: ${G.familias.length}, esperaba 4`);

const famIds = new Set(G.familias.map((f) => f.id));
const dolorIds = new Set(G.dolores.map((d) => d.id));
const ejeIds = G.ejes.map((e) => e.id);
if (ejeIds.length !== 7) fail(`ejes: deben ser 7, hay ${ejeIds.length}`);

// --- Catálogo (fuente de verdad) -----------------------------------------------
const ids = new Set();
const folios = [];
for (const s of G.catalogo) {
  const at = `catalogo[${s.id || s.folio || '?'}]`;
  for (const k of ['id', 'folio', 'familia', 'nombre', 'modelo', 'una', 'dolores', 'ratings'])
    if (s[k] == null || s[k] === '') fail(`${at}: falta ${k}`);
  if (typeof s.estrella !== 'boolean') fail(`${at}: estrella debe ser boolean`);
  if (ids.has(s.id)) fail(`${at}: id repetido`);
  ids.add(s.id);
  folios.push(s.folio);
  if (!famIds.has(s.familia)) fail(`${at}: familia inexistente «${s.familia}»`);
  if (!Array.isArray(s.dolores) || !s.dolores.length) fail(`${at}: sin dolores`);
  for (const d of s.dolores || [])
    if (!dolorIds.has(d)) fail(`${at}: dolor inexistente «${d}»`);
  for (const k of ejeIds) {
    const v = s.ratings?.[k];
    if (typeof v !== 'number' || v < 0 || v > 7) fail(`${at}: rating ${k} inválido (${v})`);
  }
  for (const k of Object.keys(s.ratings || {}))
    if (!ejeIds.includes(k)) fail(`${at}: rating de eje inexistente «${k}»`);
}
if (new Set(folios).size !== folios.length) fail('catalogo: folios repetidos');
folios.forEach((f, i) => {
  const esperado = String(i + 1).padStart(2, '0');
  if (f !== esperado) fail(`catalogo: folio ${f} rompe la secuencia (esperado ${esperado})`);
});
for (const fam of G.familias)
  if (!G.catalogo.some((s) => s.familia === fam.id)) fail(`familias[${fam.id}]: sin sistemas en el catálogo`);
for (const d of G.dolores)
  if (!G.catalogo.some((s) => s.dolores.includes(d.id))) fail(`dolores[${d.id}]: ningún sistema lo cubre`);

// --- Fichas ⇔ catálogo -----------------------------------------------------------
for (const s of G.catalogo)
  if (!G.fichas[s.id]) fail(`${s.id}: en el catálogo pero sin ficha en G.fichas`);
for (const [id, f] of Object.entries(G.fichas)) {
  const at = `fichas[${id}]`;
  if (!ids.has(id)) { fail(`${at}: huérfana, sin entrada en el catálogo`); continue; }
  for (const k of ['que', 'semantica', 'orden', 'cuandoNo'])
    if (!f[k]) fail(`${at}: falta ${k}`);
  for (const k of ['gana', 'paga'])
    if (!Array.isArray(f[k]) || !f[k].length) fail(`${at}: ${k} vacío o no es lista`);
  if (!Array.isArray(f.parientes) || !f.parientes.length) fail(`${at}: sin parientes`);
  for (const p of f.parientes || [])
    if (!p.label || !p.note) fail(`${at}: pariente incompleto (label + note)`);
  if (f.sim && !G.simulaciones[f.sim]) fail(`${at}: sim inexistente «${f.sim}»`);
  if (f.scar && (!f.scar.tag || !f.scar.text)) fail(`${at}: scar incompleta`);
}

// Verificaciones puntuales del tomo: variantes prometidas en las fichas clave
const kafkaLabels = (G.fichas.kafka?.parientes || []).map((p) => p.label).join(' ');
if (!/Kinesis/.test(kafkaLabels)) fail('fichas[kafka]: falta Kinesis como variante en parientes');
if (!/Redpanda/.test(kafkaLabels)) fail('fichas[kafka]: falta Redpanda como variante en parientes');
if (!/FIFO/.test(`${G.fichas.sqs?.que} ${G.fichas.sqs?.semantica}`)) fail('fichas[sqs]: FIFO no aparece como variante');

// --- Simulaciones -----------------------------------------------------------------
const ST_VALIDOS = new Set(['viaje', 'ok', 'dup', 'perdido', 'veneno', 'retenido', 'ack']);
const simsSrc = readFileSync(join(GUIDE, 'data/simulaciones.js'), 'utf8');
if (/Math\.random\s*\(/.test(simsSrc)) fail('simulaciones: usa Math.random — deben ser deterministas');

for (const [id, sim] of Object.entries(G.simulaciones)) {
  const at = `simulaciones[${id}]`;
  if (!sim.title || !sim.blurb) fail(`${at}: falta title o blurb`);
  const laneIds = new Set((sim.lanes || []).map((l) => l.id));
  if (laneIds.size !== (sim.lanes || []).length) fail(`${at}: lane con id repetido`);
  for (const l of sim.lanes || [])
    if (!['productor', 'broker', 'consumidor', 'neutral'].includes(l.role)) fail(`${at}: lane ${l.id} con role inválido «${l.role}»`);
  if (sim.layout === 'split') {
    if (!sim.columns?.length) fail(`${at}: layout split sin columns`);
    for (const l of sim.lanes || [])
      if (typeof l.col !== 'number' || l.col < 0 || l.col >= (sim.columns || []).length)
        fail(`${at}: lane ${l.id} con col fuera de rango`);
  }
  if (!Array.isArray(sim.steps) || sim.steps.length < 3) fail(`${at}: menos de 3 pasos`);
  (sim.steps || []).forEach((p, i) => {
    const pat = `${at}.steps[${i}]`;
    if (!p.narr) fail(`${pat}: sin narración`);
    if (!Array.isArray(p.tokens)) { fail(`${pat}: sin tokens`); return; }
    const tokIds = new Set();
    for (const t of p.tokens) {
      if (!t.id || !t.lane || !t.st || !t.label) fail(`${pat}: token incompleto (id/lane/st/label)`);
      if (tokIds.has(t.id)) fail(`${pat}: token id repetido «${t.id}»`);
      tokIds.add(t.id);
      if (!laneIds.has(t.lane)) fail(`${pat}: lane inexistente «${t.lane}»`);
      if (!ST_VALIDOS.has(t.st)) fail(`${pat}: estado inválido «${t.st}»`);
      for (const k of Object.keys(t))
        if (!['id', 'lane', 'st', 'label', 'sub'].includes(k)) fail(`${pat}: clave desconocida «${k}» en token`);
    }
  });
}
for (const id of ['el-duplicado', 'cola-vs-log', 'particiones', 'dlq', 'outbox', 'backpressure'])
  if (!G.simulaciones[id]) fail(`simulaciones: falta la pieza obligatoria «${id}»`);
for (const id of G.simOrden)
  if (!G.simulaciones[id]) fail(`simOrden: sim inexistente «${id}»`);
for (const id of Object.keys(G.simulaciones))
  if (!G.simOrden.includes(id)) fail(`simOrden: falta «${id}» (no aparece en la galería)`);

// --- Escenarios del quiz -------------------------------------------------------------
G.escenarios.forEach((e, i) => {
  const at = `escenarios[${i}]`;
  if (!e.q || !e.verdict) fail(`${at}: falta q o verdict`);
  if (!Array.isArray(e.opts) || e.opts.length < 2) fail(`${at}: menos de 2 opciones`);
  const correctas = (e.opts || []).filter((o) => o.correct).length;
  if (correctas !== 1) fail(`${at}: ${correctas} opciones correctas, esperaba 1`);
});

// --- Escalera honesta ------------------------------------------------------------------
if (!G.escalera.titulo || !G.escalera.cierre) fail('escalera: falta titulo o cierre');
if (!Array.isArray(G.escalera.pasos) || G.escalera.pasos.length !== 3)
  fail(`escalera: ${G.escalera.pasos?.length} pasos, esperaba 3 (DB → broker → log)`);
for (const p of G.escalera.pasos || [])
  if (!p.t || !p.d) fail('escalera: paso incompleto (t + d)');

// --- Desambiguación ----------------------------------------------------------------------
G.desambiguaciones.forEach((d, i) => {
  const at = `desambiguaciones[${d.title || i}]`;
  if (!d.title || !d.vs || !d.punch) fail(`${at}: falta title, vs o punch`);
  const n = d.sides?.length;
  if (![2, 3].includes(n)) fail(`${at}: ${n} lados, esperaba 2 o 3`);
  if (n === 3 && !d.tri) fail(`${at}: 3 lados sin marca tri`);
  if (d.tri && n !== 3) fail(`${at}: marcada tri con ${n} lados`);
  for (const s of d.sides || [])
    if (!s.h || !s.body) fail(`${at}: lado incompleto`);
});
if (!G.desambiguaciones.some((d) => /cola/i.test(d.title) && /log/i.test(d.vs)))
  fail('desambiguaciones: falta la estrella «Cola vs Log»');

// --- Cruces con las vistas (js/) ------------------------------------------------------------
const jsRouter = readFileSync(join(GUIDE, 'js/router.js'), 'utf8');
const rutasRouter = new Set([...jsRouter.matchAll(/case "([\w-]+)"/g)].map((m) => m[1]));
const jsComponents = readFileSync(join(GUIDE, 'js/components.js'), 'utf8');
for (const m of jsComponents.matchAll(/ruta: "([\w-]+)"/g))
  if (!rutasRouter.has(m[1])) fail(`sectionNav: ruta «${m[1]}» sin case en el router`);
const jsSims = readFileSync(join(GUIDE, 'js/page-simulaciones.js'), 'utf8');
if (!/G\.simOrden/.test(jsSims)) fail('page-simulaciones: no recorre G.simOrden');
const simsConFicha = new Set(Object.values(G.fichas).map((f) => f.sim).filter(Boolean));
for (const id of simsConFicha)
  if (!G.simulaciones[id]) fail(`fichas→sim: «${id}» no existe`);

// --- Resultado ---------------------------------------------------------------------------------
if (errs.length) {
  console.error(`✗ messaging-1001: ${errs.length} problema(s)`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ messaging-1001: catálogo ${G.catalogo.length} sistemas · ${G.familias.length} familias · ${Object.keys(G.fichas).length} fichas · ${Object.keys(G.simulaciones).length} simulaciones · ${G.escenarios.length} escenarios · ${G.desambiguaciones.length} desambiguaciones`);
