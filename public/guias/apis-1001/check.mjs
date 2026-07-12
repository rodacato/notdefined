// Check de la guía (convención: cada guía puede traer su check.mjs junto a
// sus datos; `npm run check:guias` los descubre y corre todos).
//
// Esta guía no trae snippets ejecutables: el check verifica la INTEGRIDAD de
// los datos. Todo estilo del catálogo tiene su ficha (y ninguna ficha es
// huérfana); folios e ids únicos; familias, dolores, ejes y roles referencian
// definiciones reales; los escenarios del comparador apuntan a estilos del
// catálogo; el quiz tiene `correcta` entre sus opciones; y los links internos
// (#/ficha/:id) de parientes y desambiguación resuelven. Uso directo:
//   node public/guias/apis-1001/check.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DATA_FILES = [
  'data/ejes.js',
  'data/catalogo.js',
  'data/fichas-http.js',
  'data/fichas-rpc.js',
  'data/fichas-consulta.js',
  'data/fichas-tiempo-real.js',
  'data/fichas-eventos.js',
  'data/escenarios.js',
  'data/quiz.js',
  'data/desambiguacion.js',
];

const ctx = { window: {} };
vm.createContext(ctx);
for (const f of DATA_FILES)
  vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const G = ctx.window.GUIA;

const errs = [];
const fail = (msg) => errs.push(msg);

// --- Colecciones base -------------------------------------------------------
for (const k of ['catalogo', 'familias', 'ejes', 'dolores', 'rttPresets', 'fechaEval', 'roleVar', 'fichas', 'escenarios', 'quiz', 'desambiguacion'])
  if (!G[k]) fail(`G.${k}: falta`);

const famIds = new Set(G.familias.map((f) => f.id));
const dolorIds = new Set(G.dolores.map((d) => d.id));
const ejeIds = G.ejes.map((e) => e.id);
const roleKeys = new Set(Object.keys(G.roleVar));
const KINDS = new Set(['req', 'res', 'frame', 'open', 'fail']);
const FREQS = new Set(['nucleo', 'medio', 'cola']);

// --- Catálogo (fuente de verdad) ---------------------------------------------
const ids = new Set();
const folios = new Set();
for (const e of G.catalogo) {
  const at = `catalogo[${e.id || '?'}]`;
  for (const k of ['folio', 'id', 'nombre', 'familia', 'tipo', 'escala', 'oneliner', 'dolores'])
    if (e[k] == null || e[k] === '') fail(`${at}: falta ${k}`);
  if (ids.has(e.id)) fail(`${at}: id repetido`);
  ids.add(e.id);
  if (folios.has(e.folio)) fail(`${at}: folio repetido (${e.folio})`);
  folios.add(e.folio);
  if (!famIds.has(e.familia)) fail(`${at}: familia inexistente «${e.familia}»`);
  if (!FREQS.has(e.escala?.frecuencia)) fail(`${at}: frecuencia inválida «${e.escala?.frecuencia}»`);
  const c = e.escala?.complejidad;
  if (typeof c !== 'number' || c < 1 || c > 3) fail(`${at}: complejidad inválida (${c})`);
  for (const d of e.dolores)
    if (!dolorIds.has(d)) fail(`${at}: dolor inexistente «${d}»`);
}
for (const fam of G.familias)
  if (!G.catalogo.some((e) => e.familia === fam.id)) fail(`familias[${fam.id}]: sin estilos en el catálogo`);

// --- Fichas ⇔ catálogo --------------------------------------------------------
const fichaLinks = [];
for (const e of G.catalogo)
  if (!G.fichas[e.id]) fail(`${e.id}: en el catálogo pero sin ficha en G.fichas`);
for (const [id, f] of Object.entries(G.fichas)) {
  const at = `fichas[${id}]`;
  if (!ids.has(id)) { fail(`${at}: huérfana, sin entrada en el catálogo`); continue; }
  for (const k of ['contratoTag', 'contrato', 'transporte', 'gana', 'paga', 'cuandoNo', 'parientes', 'ratings', 'verdict', 'sim'])
    if (f[k] == null || f[k] === '') fail(`${at}: falta ${k}`);
  for (const k of ejeIds) {
    const v = f.ratings?.[k];
    if (typeof v !== 'number' || v < 0 || v > 7) fail(`${at}: rating ${k} inválido (${v})`);
  }
  for (const [i, p] of (f.parientes || []).entries())
    if (p.link) fichaLinks.push([`${at}.parientes[${i}]`, p.link]);

  // Simulación: actores con rol conocido, pasos deterministas con narración.
  const sim = f.sim || {};
  if (!sim.titulo) fail(`${at}.sim: falta titulo`);
  const actorIds = new Set((sim.actors || []).map((a) => a.id));
  if (!actorIds.size) fail(`${at}.sim: sin actors`);
  for (const a of sim.actors || [])
    if (!roleKeys.has(a.role)) fail(`${at}.sim: role inexistente «${a.role}» (${a.id})`);
  if (!sim.steps?.length) fail(`${at}.sim: sin steps`);
  for (const [i, s] of (sim.steps || []).entries()) {
    const sat = `${at}.sim.steps[${i}]`;
    if (!actorIds.has(s.from)) fail(`${sat}: from inexistente «${s.from}»`);
    if (!actorIds.has(s.to)) fail(`${sat}: to inexistente «${s.to}»`);
    if (!KINDS.has(s.kind)) fail(`${sat}: kind inválido «${s.kind}»`);
    if (!s.narracion) fail(`${sat}: sin narración`);
  }
}

// --- Escenarios del comparador -------------------------------------------------
const presetIds = new Set(G.rttPresets.map((p) => p.id));
const escIds = new Set();
for (const esc of G.escenarios) {
  const at = `escenarios[${esc.id}]`;
  if (escIds.has(esc.id)) fail(`${at}: id repetido`);
  escIds.add(esc.id);
  if (!presetIds.has(esc.rttDefault)) fail(`${at}: rttDefault inexistente «${esc.rttDefault}»`);
  const planes = Object.entries(esc.planes || {});
  if (planes.length < 2) fail(`${at}: necesita al menos 2 planes para comparar`);
  for (const [sid, plan] of planes) {
    const pat = `${at}.planes[${sid}]`;
    if (!ids.has(sid)) fail(`${pat}: estilo inexistente en el catálogo`);
    for (const k of ['setup', 'viajes', 'bytes'])
      if (typeof plan[k] !== 'number' || plan[k] <= 0) fail(`${pat}: ${k} inválido (${plan[k]})`);
    if (!plan.nota) fail(`${pat}: falta nota`);
    if (!plan.trips?.length) fail(`${pat}: sin trips para animar`);
    if (plan.setup > plan.viajes) fail(`${pat}: setup (${plan.setup}) > viajes (${plan.viajes})`);
  }
}

// --- Quiz -----------------------------------------------------------------------
for (const [i, q] of G.quiz.entries()) {
  const at = `quiz[${i}]`;
  if (!q.escenario) fail(`${at}: falta escenario`);
  const optIds = new Set((q.opciones || []).map((o) => o.id));
  if (optIds.size !== (q.opciones || []).length) fail(`${at}: opciones con id repetido`);
  if (!optIds.has(q.correcta)) fail(`${at}: correcta «${q.correcta}» no está en las opciones`);
  if (!q.veredicto?.length) fail(`${at}: sin veredicto`);
}

// --- Desambiguación ---------------------------------------------------------------
for (const [i, d] of G.desambiguacion.entries()) {
  const at = `desambiguacion[${i}]`;
  if (!d.a || !d.b) fail(`${at}: faltan a/b`);
  if ((d.cols || []).length !== 2) fail(`${at}: debe tener exactamente 2 columnas`);
  if (!d.verdict) fail(`${at}: falta verdict`);
}

// --- Links internos #/ficha/:id ------------------------------------------------
const ROUTES = new Set(['#/', '#/comparador', '#/quiz', '#/desambiguacion']);
for (const [at, link] of fichaLinks) {
  const m = link.match(/^#\/ficha\/(.+)$/);
  if (m) { if (!ids.has(m[1])) fail(`${at}: link a ficha inexistente «${m[1]}»`); }
  else if (!ROUTES.has(link)) fail(`${at}: ruta desconocida «${link}»`);
}

// --- Resumen ------------------------------------------------------------------
console.log(`estilos: ${G.catalogo.length} · familias: ${G.familias.length} · fichas: ${Object.keys(G.fichas).length} · escenarios: ${G.escenarios.length} · quiz: ${G.quiz.length} · desambiguaciones: ${G.desambiguacion.length}`);
if (errs.length) {
  console.error('\n' + errs.join('\n'));
  process.exit(1);
}
console.log('datos íntegros: catálogo, fichas, simulaciones, escenarios y links cuadran');
