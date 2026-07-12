// Check de la guía (convención: cada guía puede traer su check.mjs junto a
// sus datos; `npm run check:guias` los descubre y corre todos).
//
// Esta guía no trae snippets ejecutables: el check verifica la INTEGRIDAD de
// los datos. Catálogo completo (14 métodos, 4 familias) con campos y ejes
// obligatorios; toda semilla tiene ficha y ninguna ficha queda huérfana (con
// «cómo se revoca» presente — es EL criterio del catálogo); las simulaciones
// referencian actores/tracks declarados con estados válidos; y el quiz y la
// desambiguación apuntan a cosas que existen. Uso directo:
//   node public/guias/auth-1001/check.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DATA_FILES = [
  'data/catalogo.js',
  'data/fichas-identidad.js',
  'data/fichas-delegacion.js',
  'data/fichas-maquina.js',
  'data/fichas-autorizacion.js',
  'data/simulaciones.js',
  'data/escenarios.js',
  'data/desambiguacion.js',
];

const ctx = { window: {} };
vm.createContext(ctx);
for (const f of DATA_FILES)
  vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const G = ctx.window.GUIA;

const errs = [];
const fail = (msg) => errs.push(msg);

// --- Colecciones base ---------------------------------------------------------
for (const k of ['familias', 'ejes', 'dolores', 'catalogo', 'fichas', 'simulaciones', 'quizNodos', 'quizVeredictos', 'desambiguaciones'])
  if (!G[k]) fail(`GUIA.${k}: falta`);

if (G.catalogo.length !== 14) fail(`catalogo: ${G.catalogo.length} métodos, esperaba 14`);
if (G.familias.length !== 4) fail(`familias: ${G.familias.length}, esperaba 4`);

const famIds = new Set(G.familias.map((f) => f.id));
const dolorIds = new Set(G.dolores.map((d) => d.id));
const ejeKeys = G.ejes.map((e) => e.key);
if (ejeKeys.length !== 7) fail(`ejes: ${ejeKeys.length}, esperaba 7`);

// --- Semillas del catálogo ------------------------------------------------------
const ids = new Set();
const folios = new Set();
for (const m of G.catalogo) {
  const at = `catalogo[${m.id || m.folio || '?'}]`;
  for (const k of ['id', 'folio', 'familia', 'titulo', 'tipo', 'frecuencia', 'desc', 'tags', 'ejes'])
    if (m[k] == null || m[k] === '') fail(`${at}: falta ${k}`);
  if (ids.has(m.id)) fail(`${at}: id repetido`);
  ids.add(m.id);
  if (folios.has(m.folio)) fail(`${at}: folio repetido (${m.folio})`);
  folios.add(m.folio);
  if (!famIds.has(m.familia)) fail(`${at}: familia inexistente «${m.familia}»`);
  if (!['nucleo', 'medio', 'cola'].includes(m.frecuencia)) fail(`${at}: frecuencia inválida «${m.frecuencia}»`);
  for (const t of m.tags || [])
    if (!dolorIds.has(t)) fail(`${at}: tag de dolor inexistente «${t}»`);
  for (const k of ejeKeys) {
    const v = m.ejes?.[k];
    if (typeof v !== 'number' || v < 1 || v > 7) fail(`${at}: eje ${k} inválido (${v})`);
  }
}

// --- Fichas ⇔ semillas ----------------------------------------------------------
for (const m of G.catalogo)
  if (!G.fichas[m.id]) fail(`${m.id}: semilla sin ficha`);
for (const [id, f] of Object.entries(G.fichas)) {
  const at = `fichas[${id}]`;
  if (!ids.has(id)) { fail(`${at}: huérfana, sin semilla en el catálogo`); continue; }
  for (const k of ['que', 'secreto', 'gana', 'paga', 'cuandoNo', 'revoca', 'parientes', 'sims'])
    if (f[k] == null || f[k] === '') fail(`${at}: falta ${k}`);
  for (const s of f.sims || [])
    if (!G.simulaciones[s]) fail(`${at}: sim inexistente «${s}»`);
}

// --- Simulaciones (los bailes) ---------------------------------------------------
const simsUsadas = new Set(Object.values(G.fichas).flatMap((f) => f.sims || []));
for (const [id, sim] of Object.entries(G.simulaciones)) {
  const at = `simulaciones[${id}]`;
  if (!simsUsadas.has(id)) fail(`${at}: ninguna ficha la referencia`);
  if (sim.tipo === 'secuencia') {
    const actorIds = new Set((sim.actores || []).map((a) => a.id));
    if (actorIds.size !== (sim.actores || []).length) fail(`${at}: actor con id repetido`);
    if (!sim.tabs?.length) fail(`${at}: sin tabs`);
    for (const tab of sim.tabs || []) {
      for (const [i, p] of (tab.pasos || []).entries()) {
        const pat = `${at}.${tab.id}[${i}]`;
        if (!p.narracion) fail(`${pat}: sin narración`);
        for (const a of p.activos || [])
          if (!actorIds.has(a)) fail(`${pat}: activo inexistente «${a}»`);
        if (p.mensaje && p.local) fail(`${pat}: mensaje Y local a la vez (un cambio por paso)`);
        if (p.mensaje) {
          if (!actorIds.has(p.mensaje.de)) fail(`${pat}: mensaje.de inexistente «${p.mensaje.de}»`);
          if (!actorIds.has(p.mensaje.a)) fail(`${pat}: mensaje.a inexistente «${p.mensaje.a}»`);
          if (p.mensaje.tipo && !['ok', 'fail'].includes(p.mensaje.tipo)) fail(`${pat}: mensaje.tipo inválido «${p.mensaje.tipo}»`);
        }
        if (p.local) {
          if (!actorIds.has(p.local.actor)) fail(`${pat}: local.actor inexistente «${p.local.actor}»`);
          if (p.local.tipo && !['ok', 'fail'].includes(p.local.tipo)) fail(`${pat}: local.tipo inválido «${p.local.tipo}»`);
        }
      }
    }
  } else if (sim.tipo === 'logout') {
    const trackIds = (sim.tracks || []).map((t) => t.id);
    if (trackIds.length !== 3) fail(`${at}: ${trackIds.length} tracks, esperaba 3`);
    for (const [i, p] of (sim.pasos || []).entries()) {
      const pat = `${at}.pasos[${i}]`;
      if (!p.narracion) fail(`${pat}: sin narración`);
      for (const tid of trackIds) {
        const s = p.estados?.[tid];
        if (!s) { fail(`${pat}: falta estado del track «${tid}»`); continue; }
        if (!['alive', 'zombie', 'dead'].includes(s.estado)) fail(`${pat}.${tid}: estado inválido «${s.estado}»`);
        if (s.verdict && !['win', 'lose', 'neutral'].includes(s.verdict.tono)) fail(`${pat}.${tid}: verdict.tono inválido «${s.verdict.tono}»`);
      }
      for (const tid of Object.keys(p.estados || {}))
        if (!trackIds.includes(tid)) fail(`${pat}: estado de track inexistente «${tid}»`);
    }
  } else {
    fail(`${at}: tipo inválido «${sim.tipo}»`);
  }
}

// --- Quiz «¿cuál uso?» ------------------------------------------------------------
if (!G.quizNodos.inicio) fail('quizNodos: falta el nodo «inicio»');
const veredictosUsados = new Set();
for (const [nid, nodo] of Object.entries(G.quizNodos)) {
  const at = `quizNodos[${nid}]`;
  if (!nodo.pregunta || !nodo.opciones?.length) fail(`${at}: falta pregunta u opciones`);
  for (const op of nodo.opciones || []) {
    if (!op.nodo && !op.veredicto) fail(`${at}: opción «${op.label}» sin destino`);
    if (op.nodo && !G.quizNodos[op.nodo]) fail(`${at}: nodo destino inexistente «${op.nodo}»`);
    if (op.veredicto) {
      if (!G.quizVeredictos[op.veredicto]) fail(`${at}: veredicto inexistente «${op.veredicto}»`);
      veredictosUsados.add(op.veredicto);
    }
  }
}
for (const [vid, v] of Object.entries(G.quizVeredictos)) {
  const at = `quizVeredictos[${vid}]`;
  if (!veredictosUsados.has(vid)) fail(`${at}: inalcanzable desde el quiz`);
  if (!v.titulo || !v.sub || !v.capas?.length) fail(`${at}: faltan titulo/sub/capas`);
  for (const c of v.capas || []) {
    if (!famIds.has(c.fam)) fail(`${at}: familia inexistente «${c.fam}»`);
    if (c.ficha && !ids.has(c.ficha)) fail(`${at}: ficha inexistente «${c.ficha}»`);
  }
}

// --- Desambiguación ----------------------------------------------------------------
for (const d of G.desambiguaciones) {
  const at = `desambiguaciones[${d.titulo}]`;
  if (!d.sub || !d.veredicto) fail(`${at}: falta sub o veredicto`);
  if (![2, 3].includes(d.cols?.length)) fail(`${at}: ${d.cols?.length} columnas, esperaba 2 o 3`);
  for (const c of d.cols || [])
    if (!c.nombre || !c.def) fail(`${at}: columna incompleta`);
}

// --- Resumen -------------------------------------------------------------------------
const nSims = Object.keys(G.simulaciones).length;
console.log(`métodos: ${G.catalogo.length} · familias: ${G.familias.length} · fichas: ${Object.keys(G.fichas).length} · simulaciones: ${nSims} · veredictos: ${Object.keys(G.quizVeredictos).length} · desambiguaciones: ${G.desambiguaciones.length}`);
if (errs.length) {
  console.error('\n' + errs.join('\n'));
  process.exit(1);
}
console.log('datos íntegros: catálogo, fichas, bailes y referencias internas cuadran');
