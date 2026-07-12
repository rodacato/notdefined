// Check de la guía (convención: cada guía puede traer su check.mjs junto a
// sus datos; `npm run check:guias` los descubre y corre todos).
//
// Esta guía no trae snippets ejecutables: el check verifica la INTEGRIDAD de
// los datos. Todo tipo del catálogo tiene su ficha (y ninguna ficha es
// huérfana); folios únicos y consecutivos; ratings en los 7 ejes; dolores,
// familias y slugs referencian definiciones reales; los escenarios del
// comparador, el quiz y la desambiguación apuntan a tipos del catálogo; los
// pasos de cada simulador traen claves válidas y narración; y los ids de
// simulador que usan las vistas (page-ficha, sim-renderers, sim-player)
// existen en los datos. Uso directo:
//   node public/guias/databases-1001/check.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DATA_FILES = [
  'data/catalogo.js',
  'data/fichas-oltp.js',
  'data/fichas-escala.js',
  'data/fichas-analitica.js',
  'data/fichas-forma.js',
  'data/simulaciones.js',
  'data/sims-extra.js',
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
for (const k of ['catalogo', 'familias', 'ejes', 'dolores', 'fichas', 'sims', 'escenarios', 'quiz', 'desambiguaciones', 'porSlug'])
  if (!G[k]) fail(`G.${k}: falta`);

const famIds = new Set(G.familias.map((f) => f.id));
const dolorIds = new Set(G.dolores.map((d) => d.id));
const ejeIds = G.ejes.map((e) => e.id);
if (ejeIds.length !== 7) fail(`ejes: deben ser 7, hay ${ejeIds.length}`);

// --- Catálogo (fuente de verdad) ---------------------------------------------
const slugs = new Set();
const folios = [];
for (const t of G.catalogo) {
  const at = `catalogo[${t.slug || '?'}]`;
  for (const k of ['folio', 'familia', 'slug', 'nombre', 'arquetipo', 'tagline'])
    if (t[k] == null || t[k] === '') fail(`${at}: falta ${k}`);
  if (typeof t.estrella !== 'boolean') fail(`${at}: estrella debe ser boolean`);
  if (slugs.has(t.slug)) fail(`${at}: slug repetido`);
  slugs.add(t.slug);
  folios.push(t.folio);
  if (!famIds.has(t.familia)) fail(`${at}: familia inexistente «${t.familia}»`);
}
if (new Set(folios).size !== folios.length) fail('catalogo: folios repetidos');
folios.forEach((f, i) => {
  const esperado = String(i + 1).padStart(2, '0');
  if (f !== esperado) fail(`catalogo: folio ${f} rompe la secuencia (esperado ${esperado})`);
});
for (const fam of G.familias)
  if (!G.catalogo.some((t) => t.familia === fam.id)) fail(`familias[${fam.id}]: sin tipos en el catálogo`);
for (const t of G.catalogo)
  if (G.porSlug[t.slug] !== t) fail(`porSlug[${t.slug}]: no apunta a la entrada del catálogo`);

// --- Fichas ⇔ catálogo --------------------------------------------------------
for (const t of G.catalogo)
  if (!G.fichas[t.slug]) fail(`${t.slug}: en el catálogo pero sin ficha en G.fichas`);
for (const [slug, f] of Object.entries(G.fichas)) {
  const at = `fichas[${slug}]`;
  if (!slugs.has(slug)) { fail(`${at}: huérfana, sin entrada en el catálogo`); continue; }
  for (const k of ['queEs', 'comoGuarda', 'modeloConsulta', 'parientes', 'arquetipo', 'veredicto'])
    if (!f[k]) fail(`${at}: falta ${k}`);
  for (const k of ['gana', 'paga', 'cuandoNo'])
    if (!Array.isArray(f[k]) || !f[k].length) fail(`${at}: ${k} vacío o no es lista`);
  for (const k of ejeIds) {
    const v = f.ratings?.[k];
    if (typeof v !== 'number' || v < 0 || v > 7) fail(`${at}: rating ${k} inválido (${v})`);
  }
  for (const k of Object.keys(f.ratings || {}))
    if (!ejeIds.includes(k)) fail(`${at}: rating de eje inexistente «${k}»`);
  if (!Array.isArray(f.dolores) || !f.dolores.length) fail(`${at}: sin dolores`);
  for (const d of f.dolores || [])
    if (!dolorIds.has(d)) fail(`${at}: dolor inexistente «${d}»`);
}

// --- Simulador row-vs-columnar (motor de layout) -------------------------------
const NARR_KEYS = ['intro', 'rowScan', 'rowDone', 'colScan', 'colDone', 'veredicto'];
const rvc = G.sims['row-vs-columnar'];
if (!rvc) fail('sims[row-vs-columnar]: falta');
else {
  const at = 'sims[row-vs-columnar]';
  for (const c of rvc.columnas)
    if (!(c in rvc.tipos)) fail(`${at}: columna ${c} sin tipo`);
  rvc.filas.forEach((fila, i) => {
    for (const c of rvc.columnas)
      if (!(c in fila)) fail(`${at}.filas[${i}]: falta la columna ${c}`);
  });
  for (const s of rvc.ilustra || [])
    if (!slugs.has(s)) fail(`${at}: ilustra slug inexistente «${s}»`);
  if (!rvc.escenarios?.length) fail(`${at}: sin escenarios`);
  for (const e of rvc.escenarios || []) {
    const eat = `${at}.escenarios[${e.id}]`;
    if (!['aggregation', 'lookup'].includes(e.tipo)) fail(`${eat}: tipo inválido «${e.tipo}»`);
    if (!['row', 'columnar'].includes(e.ganador)) fail(`${eat}: ganador inválido «${e.ganador}»`);
    if (!e.query || !e.etiqueta) fail(`${eat}: falta query o etiqueta`);
    if (e.tipo === 'aggregation') {
      if (!e.columnasUsadas?.length) fail(`${eat}: aggregation sin columnasUsadas`);
      for (const c of e.columnasUsadas || [])
        if (!rvc.columnas.includes(c)) fail(`${eat}: columnaUsada inexistente «${c}»`);
    } else {
      if (!rvc.columnas.includes(e.predicado?.columna)) fail(`${eat}: predicado.columna inexistente`);
      if (!rvc.filas.some((f) => f[e.predicado?.columna] === e.predicado?.valor))
        fail(`${eat}: el predicado no matchea ninguna fila`);
    }
    for (const k of NARR_KEYS)
      if (!e.narracion?.[k]) fail(`${eat}: narracion.${k} falta`);
  }
}

// --- Simuladores del reproductor genérico --------------------------------------
for (const [id, sim] of Object.entries(G.sims)) {
  if (id === 'row-vs-columnar') continue;
  const at = `sims[${id}]`;
  if (!sim.titulo || !sim.subtitulo) fail(`${at}: falta titulo o subtitulo`);
  for (const s of sim.ilustra || [])
    if (!slugs.has(s)) fail(`${at}: ilustra slug inexistente «${s}»`);
  if (!Array.isArray(sim.pasos) || sim.pasos.length < 3) fail(`${at}: menos de 3 pasos`);
  (sim.pasos || []).forEach((p, i) => {
    if (!p.narr) fail(`${at}.pasos[${i}]: sin narración`);
  });
}

// --- Escenarios del comparador --------------------------------------------------
const escIds = new Set();
for (const esc of G.escenarios) {
  const at = `escenarios[${esc.id}]`;
  if (escIds.has(esc.id)) fail(`${at}: id repetido`);
  escIds.add(esc.id);
  for (const k of ['titulo', 'descripcion', 'recomendacion'])
    if (!esc[k]) fail(`${at}: falta ${k}`);
  if (!Array.isArray(esc.candidatos) || esc.candidatos.length < 2)
    fail(`${at}: necesita al menos 2 candidatos`);
  for (const c of esc.candidatos || []) {
    const cat = `${at}.candidatos[${c.slug}]`;
    if (!slugs.has(c.slug)) fail(`${cat}: tipo inexistente en el catálogo`);
    for (const k of ['modela', 'natural', 'sufre'])
      if (!c[k]) fail(`${cat}: falta ${k}`);
  }
}

// --- Quiz -----------------------------------------------------------------------
if (!G.quiz.tesis?.titulo || !G.quiz.tesis?.cuerpo) fail('quiz.tesis: incompleta');
if (!G.quiz.preguntas?.length) fail('quiz: sin preguntas');
G.quiz.preguntas.forEach((p, i) => {
  const at = `quiz.preguntas[${i}]`;
  if (!p.escenario || !p.porque || !p.borde) fail(`${at}: falta escenario, porque o borde`);
  if (!Array.isArray(p.opciones) || p.opciones.length < 2) fail(`${at}: menos de 2 opciones`);
  for (const o of p.opciones || [])
    if (!slugs.has(o)) fail(`${at}: opción inexistente «${o}»`);
  if (!p.opciones?.includes(p.respuesta)) fail(`${at}: la respuesta «${p.respuesta}» no está en las opciones`);
});

// --- Desambiguación ---------------------------------------------------------------
const desIds = new Set();
let madres = 0;
for (const d of G.desambiguaciones) {
  const at = `desambiguaciones[${d.id}]`;
  if (desIds.has(d.id)) fail(`${at}: id repetido`);
  desIds.add(d.id);
  if (d.madre) madres++;
  for (const k of ['titulo', 'gancho', 'clave', 'veredicto'])
    if (!d[k]) fail(`${at}: falta ${k}`);
  for (const lado of ['ladoA', 'ladoB'])
    for (const k of ['nombre', 'ej', 'que', 'workload'])
      if (!d[lado]?.[k]) fail(`${at}.${lado}: falta ${k}`);
}
if (madres !== 1) fail(`desambiguaciones: debe haber exactamente 1 «madre», hay ${madres}`);

// --- Cruces con las vistas (ids de simulador usados en js/) -----------------------
const jsFicha = readFileSync(join(GUIDE, 'js/page-ficha.js'), 'utf8');
for (const m of jsFicha.matchAll(/^\s*'?([\w-]+)'?:\s*'([\w-]+)'\s*,?\s*$/gm)) {
  // pares slug: simId dentro de CON_SIM
  if (slugs.has(m[1]) && !G.sims[m[2]]) fail(`page-ficha CON_SIM[${m[1]}]: sim inexistente «${m[2]}»`);
}
const jsRenderers = readFileSync(join(GUIDE, 'js/sim-renderers.js'), 'utf8');
const rendererIds = new Set([...jsRenderers.matchAll(/G\.simRenderers\['([\w-]+)'\]/g)].map((m) => m[1]));
for (const id of rendererIds)
  if (!G.sims[id]) fail(`sim-renderers[${id}]: sin datos en G.sims`);
for (const id of Object.keys(G.sims))
  if (id !== 'row-vs-columnar' && !rendererIds.has(id)) fail(`sims[${id}]: sin renderer en js/sim-renderers.js`);
const jsPlayer = readFileSync(join(GUIDE, 'js/sim-player.js'), 'utf8');
const ordenMatch = jsPlayer.match(/G\.simsOrden\s*=\s*\[([^\]]+)\]/);
if (!ordenMatch) fail('sim-player: falta G.simsOrden');
else {
  const orden = [...ordenMatch[1].matchAll(/'([\w-]+)'/g)].map((m) => m[1]);
  for (const id of orden)
    if (!G.sims[id]) fail(`simsOrden: sim inexistente «${id}»`);
  for (const id of Object.keys(G.sims))
    if (!orden.includes(id)) fail(`simsOrden: falta «${id}» (no aparece en el hub)`);
}

// --- Resultado --------------------------------------------------------------------
if (errs.length) {
  console.error(`✗ databases-1001: ${errs.length} problema(s)`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ databases-1001: catálogo ${G.catalogo.length} tipos · ${G.familias.length} familias · ${Object.keys(G.fichas).length} fichas · ${Object.keys(G.sims).length} simuladores · ${G.escenarios.length} escenarios · ${G.quiz.preguntas.length} preguntas · ${G.desambiguaciones.length} desambiguaciones`);
