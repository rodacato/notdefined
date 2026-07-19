// Check de la guía (convención: cada guía trae su check.mjs junto a sus
// datos; `npm run check:guias` los descubre y corre todos).
//
// Python a fondo · Polyglot. Verifica la INTEGRIDAD de los datos y su cruce
// con las vistas: catálogo completo (14 temas · 4 bloques) con folios únicos y
// consecutivos; cada tema en un bloque real y con su familia de color; ficha
// completa por tema, sin huérfanas ni slugs repetidos; cada widget con la
// estructura que su motor espera y con un builder registrado en js/widget.js;
// simulaciones deterministas (sin Math.random); las fuentes que pide el CSS
// existen en disco; y cero requests externos (la guía abre offline). Uso:
//   node public/guias/polyglot-python-c2/check.mjs
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const BLOQUE_FILES = ['compilacion', 'concurrencia', 'memoria', 'objetos'];
const DATA_FILES = ['data/coleccion.js', ...BLOQUE_FILES.map((b) => `data/${b}.js`)];
const PAGE_FILES = ['js/page-indice.js', 'js/page-tema.js'];

// core.js siembra G.data; aquí lo hacemos a mano para cargar solo los datos.
const ctx = { window: { GUIA: { data: { coleccion: null, temas: [] } } } };
vm.createContext(ctx);
for (const f of DATA_FILES)
  vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const G = ctx.window.GUIA;

const errs = [];
const fail = (msg) => errs.push(msg);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isArr = (v) => Array.isArray(v);
const TONOS = ['ok', 'warn', 'bad'];

// --- Colección ----------------------------------------------------------------
const C = G.data.coleccion;
const temas = G.data.temas || [];
if (!C) fail('data.coleccion: falta');
for (const k of ['eyebrow', 'nivel', 'titulo', 'lede', 'contexto', 'bloques', 'colofon'])
  if (C && C[k] == null) fail(`coleccion.${k}: falta`);

if (C) {
  // Identidad Polyglot: nivel C2 y guiño CEFR sin niveles inventados.
  if (!/NIVEL C2$/.test(C.nivel)) fail(`coleccion.nivel: «${C.nivel}» debe terminar en «NIVEL C2»`);
  if (/\bB[12]\b|\bA[12]\b/.test(C.colofon))
    fail('coleccion.colofon: menciona un nivel que no existe en Polyglot (solo C1 y C2)');
  if (!isStr(C.contexto?.titulo) || !isArr(C.contexto?.hechos) || !C.contexto.hechos.length)
    fail('coleccion.contexto: sin titulo o hechos');
  for (const h of C.contexto?.hechos || [])
    if (!isStr(h.html) || typeof h.fam !== 'number') fail('coleccion.contexto.hechos: entrada sin html/fam');
}

const bloques = (C && C.bloques) || [];
if (bloques.length !== 4) fail(`coleccion.bloques: ${bloques.length} bloques, esperaba 4`);
const FAMS = new Set();
for (const b of bloques) {
  const at = `bloques[${b.n}]`;
  for (const k of ['n', 'fam', 'titulo', 'desc']) if (b[k] == null) fail(`${at}: falta ${k}`);
  FAMS.add(b.fam);
}

// --- Catálogo -----------------------------------------------------------------
if (temas.length !== 14) fail(`data.temas: ${temas.length} temas, esperaba 14`);

const slugs = new Set();
const folios = [];
for (const t of temas) {
  const at = `tema[${t.slug || '?'}]`;
  for (const k of ['slug', 'folio', 'bloque', 'fam', 'dificultad', 'cardTitulo', 'titulo',
    'tagline', 'evita', 'lede', 'enBreve', 'fundamento', 'comoFunciona', 'mito', 'recursos', 'widget'])
    if (t[k] == null || t[k] === '') fail(`${at}: falta ${k}`);

  if (slugs.has(t.slug)) fail(`${at}: slug repetido`);
  slugs.add(t.slug);
  folios.push(t.folio);

  const b = bloques.filter((x) => x.n === t.bloque)[0];
  if (!b) fail(`${at}: bloque inexistente «${t.bloque}»`);
  else if (b.fam !== t.fam) fail(`${at}: fam ${t.fam} no coincide con la del bloque ${t.bloque} (${b.fam})`);

  if (!(t.dificultad >= 1 && t.dificultad <= 3)) fail(`${at}: dificultad «${t.dificultad}» fuera de 1..3`);
  if (typeof t.estrella !== 'boolean') fail(`${at}: estrella debe ser boolean`);
  if (t.estrella && !isStr(t.estrellaNota)) fail(`${at}: tema estrella sin estrellaNota`);

  if (!isArr(t.enBreve) || t.enBreve.length !== 4) fail(`${at}: enBreve debe traer 4 datos (trae ${t.enBreve?.length})`);
  for (const d of t.enBreve || []) if (!isStr(d)) fail(`${at}: enBreve con entrada vacía`);

  if (!isStr(t.mito?.mito) || !isStr(t.mito?.realidad)) fail(`${at}: mito incompleto (mito/realidad)`);

  if (!isArr(t.recursos) || t.recursos.length !== 3) fail(`${at}: recursos debe traer 3 (trae ${t.recursos?.length})`);
  for (const r of t.recursos || []) {
    if (!isStr(r.texto)) fail(`${at}: recurso sin texto`);
    if (r.url != null && !/^https?:\/\//.test(r.url)) fail(`${at}: recurso «${r.texto}» con url inválida`);
    if (r.star != null && typeof r.star !== 'boolean') fail(`${at}: recurso «${r.texto}» con star no booleano`);
  }
}

// folios únicos y consecutivos 01..14 en el orden de carga
folios.forEach((n, i) => {
  const esperado = String(i + 1).padStart(2, '0');
  if (n !== esperado) fail(`temas: folio «${n}» rompe la secuencia (esperado ${esperado})`);
});
if (new Set(folios).size !== folios.length) fail('temas: folios repetidos');

// cada bloque declarado tiene al menos un tema
for (const b of bloques)
  if (!temas.some((t) => t.bloque === b.n)) fail(`bloques[${b.n}]: sin temas`);

// --- Widgets: estructura que el motor espera ----------------------------------
const widgetSrc = readFileSync(join(GUIDE, 'js/widget.js'), 'utf8');
const BUILDERS = new Set([...widgetSrc.matchAll(/^\s{4}(\w+):\s*function\s*\(spec\)/gm)].map((m) => m[1]));
if (!BUILDERS.size) fail('js/widget.js: no se detectó ningún builder de pasos');

function checkPasos(pasos, at) {
  if (!isArr(pasos) || !pasos.length) return fail(`${at}: sin pasos`);
  pasos.forEach((p, i) => {
    if (!isStr(p.vis)) fail(`${at}.pasos[${i}]: sin vis`);
    if (!isStr(p.nota)) fail(`${at}.pasos[${i}]: sin narración (nota)`);
    if (p.tone != null && !TONOS.includes(p.tone)) fail(`${at}.pasos[${i}]: tone desconocido «${p.tone}»`);
  });
}

function checkSpec(spec, at) {
  if (spec.tipo) {
    if (!BUILDERS.has(spec.tipo)) return fail(`${at}: tipo «${spec.tipo}» sin builder en js/widget.js`);
    if (spec.tipo === 'etapas') {
      if (!isArr(spec.etapas) || spec.etapas.length < 2) return fail(`${at}: etapas necesita ≥2 etapas`);
      for (const e of spec.etapas)
        if (!isStr(e.k) || !isStr(e.rep) || !isStr(e.nota)) fail(`${at}: etapa incompleta (k/rep/nota)`);
    }
    if (spec.tipo === 'carriles') {
      if (!isArr(spec.lanes) || !spec.lanes.length) return fail(`${at}: carriles sin lanes`);
      if (!isArr(spec.pasos) || !spec.pasos.length) return fail(`${at}: carriles sin pasos`);
      spec.pasos.forEach((p, i) => {
        if (!isStr(p.nota)) fail(`${at}.pasos[${i}]: sin narración`);
        if (!isArr(p.fills) || p.fills.length !== spec.lanes.length)
          fail(`${at}.pasos[${i}]: fills debe traer un valor por carril (${spec.lanes.length})`);
        if (p.tone != null && !TONOS.includes(p.tone)) fail(`${at}.pasos[${i}]: tone desconocido «${p.tone}»`);
      });
    }
    return;
  }
  checkPasos(spec.pasos, at);
}

for (const t of temas) {
  const w = t.widget;
  if (!w) continue;
  const at = `tema[${t.slug}].widget`;
  if (!isStr(w.intro)) fail(`${at}: sin intro`);
  if (!isStr(t.widgetLabel)) fail(`tema[${t.slug}]: sin widgetLabel`);
  if (w.vistas) {
    if (!isArr(w.vistas) || w.vistas.length < 2) fail(`${at}: vistas debe traer ≥2 (si no, usa pasos directo)`);
    const ids = new Set();
    for (const v of w.vistas || []) {
      if (!isStr(v.id) || !isStr(v.label)) fail(`${at}: vista sin id/label`);
      if (ids.has(v.id)) fail(`${at}: id de vista repetido «${v.id}»`);
      ids.add(v.id);
      checkSpec(v, `${at}.vistas[${v.id}]`);
    }
  } else {
    checkSpec(w, at);
  }
}

// --- Determinismo: sin Math.random en los datos --------------------------------
for (const f of DATA_FILES)
  if (/Math\.random\s*\(/.test(readFileSync(join(GUIDE, f), 'utf8')))
    fail(`${f}: usa Math.random — los pasos narrativos deben ser deterministas`);

// --- Cruce con las vistas (js/) ------------------------------------------------
for (const f of PAGE_FILES) {
  const src = readFileSync(join(GUIDE, f), 'utf8');
  if (!src.includes('document.title')) fail(`${f}: no fija document.title por vista`);
}
const routerSrc = readFileSync(join(GUIDE, 'js/router.js'), 'utf8');
for (const fn of ['vistaIndice', 'vistaTema'])
  if (!routerSrc.includes(fn)) fail(`js/router.js: no invoca G.${fn}`);

const indexSrc = readFileSync(join(GUIDE, 'index.html'), 'utf8');
const cargados = [...indexSrc.matchAll(/src="\.\/((?:js|data)\/[\w-]+\.js)"/g)].map((m) => m[1]);
for (const f of [...DATA_FILES, ...PAGE_FILES, 'js/core.js', 'js/components.js', 'js/widget.js', 'js/router.js'])
  if (!cargados.includes(f)) fail(`index.html: no carga ${f}`);
if (cargados.indexOf('js/router.js') !== cargados.length - 1)
  fail('index.html: router.js debe cargar al final');

// --- Portabilidad: fuentes en disco y cero requests externos -------------------
const cssSrc = readFileSync(join(GUIDE, 'styles.css'), 'utf8');
const pedidas = [...new Set([...cssSrc.matchAll(/\.\/fonts\/([\w-]+\.woff2)/g)].map((m) => m[1]))];
const enDisco = existsSync(join(GUIDE, 'fonts')) ? readdirSync(join(GUIDE, 'fonts')) : [];
for (const f of pedidas)
  if (!enDisco.includes(f)) fail(`styles.css pide fonts/${f} y no está en disco`);
for (const f of enDisco.filter((x) => x.endsWith('.woff2')))
  if (!pedidas.includes(f)) fail(`fonts/${f} está en disco pero ningún @font-face lo usa`);

if (/<link[^>]+fonts\.googleapis|<script[^>]+src="https?:/.test(indexSrc))
  fail('index.html: request externo — la guía debe abrir offline');

// --- Identidad de colección: cero rastro del almanaque 1001 --------------------
for (const f of ['index.html', 'styles.css', ...DATA_FILES]) {
  const src = readFileSync(join(GUIDE, f), 'utf8');
  const m = src.match(/\b(1001|101)\b|\bTomo\b|almanaque/i);
  if (m) fail(`${f}: rastro del almanaque «${m[0]}» — esto es Polyglot`);
}

// --- Resultado -----------------------------------------------------------------
if (errs.length) {
  console.error(`✗ polyglot-python-c2: ${errs.length} problema(s)`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
const estrellas = temas.filter((t) => t.estrella).length;
console.log(`✓ polyglot-python-c2: ${temas.length} temas · ${bloques.length} bloques · ${estrellas} estrella · ${BUILDERS.size} builders de widget · ${pedidas.length} fuentes 1:1`);
