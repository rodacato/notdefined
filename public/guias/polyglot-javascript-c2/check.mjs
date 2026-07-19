// Check de la guía (convención: cada guía trae su check.mjs junto a sus
// datos; `npm run check:guias` los descubre y corre todos).
//
// JavaScript a fondo · Polyglot. Verifica la INTEGRIDAD de los datos y su
// cruce con las vistas: catálogo completo (13 temas · 4 bloques) con folios
// únicos y consecutivos; cada tema en exactamente un bloque, sin huérfanos en
// ningún sentido; cada ficha con sus secciones (qué es, en breve, fundamento,
// cómo funciona, mito, recursos) y su tag de capa; los widgets con la forma
// que el player espera (variantes, frames, zonas declaradas ⇔ zonas usadas);
// las simulaciones deterministas (sin Math.random); y el cruce con el router.
// Uso:
//   node public/guias/polyglot-javascript-c2/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DOMAIN_FILES = ['meta', 'ejecucion', 'concurrencia', 'memoria', 'objetos', 'modulos'];
// catalogo.js va al final: sólo referencia slugs que los dominios ya sembraron.
const DATA_FILES = [...DOMAIN_FILES.map((d) => `data/${d}.js`), 'data/catalogo.js'];

const ctx = { window: { GUIA: { data: { topics: {} } } } };
vm.createContext(ctx);
for (const f of DATA_FILES) vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const G = ctx.window.GUIA;

const errs = [];
const fail = (msg) => errs.push(msg);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isArr = (v) => Array.isArray(v);

const D = G.data || {};
const topics = D.topics || {};
const blocks = D.blocks || [];
const meta = D.meta || {};

// --- Portada -------------------------------------------------------------
for (const k of ['count', 'lede', 'colophon'])
  if (!isStr(meta[k])) fail(`meta.${k}: falta`);

// --- Catálogo: 13 temas en 4 bloques -------------------------------------
const order = blocks.flatMap((b) => b.slugs || []);
if (blocks.length !== 4) fail(`blocks: ${blocks.length} bloques, esperaba 4`);
if (order.length !== 13) fail(`catálogo: ${order.length} temas, esperaba 13`);
if (isStr(meta.count) && !meta.count.includes(String(order.length)))
  fail(`meta.count: «${meta.count}» debe reflejar ${order.length} temas`);
if (isStr(meta.count) && !meta.count.includes(String(blocks.length)))
  fail(`meta.count: «${meta.count}» debe reflejar ${blocks.length} bloques`);

for (const b of blocks) {
  if (!isStr(b.title)) fail(`blocks: bloque sin title`);
  if (!isArr(b.slugs) || !b.slugs.length) fail(`blocks[${b.title || '?'}]: sin temas`);
}

// cada tema en exactamente un bloque, y sin fichas huérfanas
const seen = new Set();
for (const slug of order) {
  if (!topics[slug]) { fail(`catálogo: «${slug}» no tiene ficha en G.data.topics`); continue; }
  if (seen.has(slug)) fail(`catálogo: «${slug}» aparece en más de un bloque`);
  seen.add(slug);
}
for (const slug of Object.keys(topics))
  if (!seen.has(slug)) fail(`topics[${slug}]: huérfano, no aparece en ningún bloque`);

// --- Fichas ---------------------------------------------------------------
const GLYPH = /^[◆◇]{3}$/; // ◆◇ ×3
const TAGS = new Set(['motor', 'runtime', 'lenguaje']);
const folios = [];

for (const slug of order) {
  const t = topics[slug];
  if (!t) continue;
  const at = `topics[${slug}]`;
  if (t.slug !== slug) fail(`${at}: slug interno «${t.slug}» no coincide con la clave`);
  for (const k of ['folio', 'tag', 'difficulty', 'title', 'tagline', 'avoid',
    'lede', 'quees', 'fundamento', 'mito'])
    if (!isStr(t[k])) fail(`${at}: falta ${k}`);
  if (!TAGS.has(t.tag)) fail(`${at}: tag de capa inválido «${t.tag}» (motor/runtime/lenguaje)`);
  if (!GLYPH.test(t.difficulty || '')) fail(`${at}: difficulty «${t.difficulty}» debe ser 3 de ◆/◇`);

  // "en breve" = 4 datos, como las guías hermanas
  if (!isArr(t.breve) || t.breve.length !== 4)
    fail(`${at}: breve debe traer 4 datos (trae ${t.breve?.length})`);
  for (const f of t.breve || [])
    if (!isStr(f.k) || !isStr(f.v)) fail(`${at}: breve con k/v incompleto`);

  if (!isArr(t.como) || !t.como.length) fail(`${at}: como vacío`);
  if (!isArr(t.recursos) || t.recursos.length < 2) fail(`${at}: recursos necesita ≥2 entradas`);
  for (const r of t.recursos || []) {
    if (!isStr(r.kind) || !isStr(r.title) || !isStr(r.sub) || !isStr(r.href))
      fail(`${at}: recurso sin kind/title/sub/href`);
    if (r.star != null && typeof r.star !== 'boolean') fail(`${at}: recurso «${r.title}» con star no booleano`);
  }
  folios.push(t.folio);
}

// folios únicos y consecutivos 01..13 en el orden del catálogo
folios.forEach((n, i) => {
  const esperado = String(i + 1).padStart(2, '0');
  if (n !== esperado) fail(`catálogo: folio «${n}» rompe la secuencia (esperado ${esperado})`);
});
if (new Set(folios).size !== folios.length) fail('temas: folios repetidos');

// exactamente un tema estrella por bloque como máximo, y al menos uno en la guía
const stars = order.filter((s) => topics[s]?.star);
if (!stars.length) fail('catálogo: ningún tema marcado como estrella (★)');

// --- Widgets: la forma que el player espera -------------------------------
for (const slug of order) {
  const t = topics[slug];
  if (!t || !t.widget) continue;
  const w = t.widget;
  const at = `topics[${slug}].widget`;

  if (!isStr(w.storeKey)) fail(`${at}: sin storeKey (el player persiste por esa clave)`);
  if (!isArr(w.variants) || !w.variants.length) { fail(`${at}: sin variants`); continue; }

  const zoneIds = new Set((w.zones || []).map((z) => z.id));
  for (const z of w.zones || []) {
    if (!isStr(z.id) || !isStr(z.cls)) fail(`${at}: zona sin id/cls`);
    if (z.label == null) fail(`${at}: zona «${z.id}» sin label`);
  }

  for (const v of w.variants) {
    const vat = `${at}.variants[${v.id || '?'}]`;
    if (!isStr(v.id) || !isStr(v.label)) fail(`${vat}: sin id o label`);
    if (!isArr(v.frames) || !v.frames.length) { fail(`${vat}: sin frames`); continue; }
    // el código puede vivir en la variante o por frame, pero tiene que existir
    const codeEnVariante = isArr(v.code);
    for (const [i, fr] of v.frames.entries()) {
      const fat = `${vat}.frames[${i}]`;
      if (!isStr(fr.cap)) fail(`${fat}: sin narración (cap)`);
      if (!codeEnVariante && !isArr(fr.code)) fail(`${fat}: sin code (ni en la variante ni en el frame)`);
      // toda zona que un frame rellena debe estar declarada
      for (const k of Object.keys(fr)) {
        if (['line', 'code', 'codeCap', 'phase', 'cap', 'out'].includes(k)) continue;
        if (!zoneIds.has(k)) fail(`${fat}: rellena «${k}», que no es una zona declarada`);
      }
      // la consola sólo tiene sentido si el widget la pidió
      if (fr.out && !w.console) fail(`${fat}: trae out pero el widget no declara console:true`);
    }
  }
}

// --- Determinismo: sin Math.random en los datos ---------------------------
for (const f of DATA_FILES)
  if (/Math\.random\s*\(/.test(readFileSync(join(GUIDE, f), 'utf8')))
    fail(`${f}: usa Math.random — los pasos narrativos deben ser deterministas`);

// --- Enlaces internos del catálogo (#/tema/<slug>) ------------------------
for (const slug of order)
  for (const r of topics[slug]?.recursos || []) {
    const m = /^#\/tema\/(.+)$/.exec(r.href || '');
    if (m && !topics[m[1]]) fail(`topics[${slug}]: recurso apunta a «${m[1]}», que no existe`);
  }

// --- Cruce con las vistas (js/) -------------------------------------------
const routerSrc = readFileSync(join(GUIDE, 'js/router.js'), 'utf8');
for (const fn of ['G.pages.tema', 'G.pages.index'])
  if (!routerSrc.includes(fn)) fail(`router.js: no invoca ${fn}`);
if (!routerSrc.includes('document.title')) fail('router.js: no fija document.title por vista');

for (const [file, sym] of [['js/page-index.js', 'G.pages.index'], ['js/page-tema.js', 'G.pages.tema']])
  if (!readFileSync(join(GUIDE, file), 'utf8').includes(sym))
    fail(`${file}: no publica ${sym}`);

// el player es el motor de todos los widgets: debe existir y estar publicado
if (!readFileSync(join(GUIDE, 'js/player.js'), 'utf8').includes('G.player'))
  fail('js/player.js: no publica G.player');

// index.html debe cargar cada archivo de datos y de mecánica, en orden clásico
const html = readFileSync(join(GUIDE, 'index.html'), 'utf8');
for (const f of [...DATA_FILES, 'js/core.js', 'js/components.js', 'js/player.js',
  'js/page-index.js', 'js/page-tema.js', 'js/router.js'])
  if (!html.includes(`./${f}`)) fail(`index.html: no carga ${f}`);
if (/type=["']module["']/.test(html)) fail('index.html: usa ES modules (file:// no los carga)');

// --- Fuentes: 1:1 entre los @font-face del CSS y los woff2 en disco -------
const css = readFileSync(join(GUIDE, 'styles.css'), 'utf8');
const pedidas = [...css.matchAll(/url\("\.\/fonts\/([^"]+)"\)/g)].map((m) => m[1]);
const enDisco = new Set(readdirSync(join(GUIDE, 'fonts')));
for (const f of pedidas) if (!enDisco.has(f)) fail(`fonts: el CSS pide «${f}» y no está en disco`);
for (const f of enDisco) if (!pedidas.includes(f)) fail(`fonts: «${f}» está en disco pero ningún @font-face lo usa`);
if (/googleapis|gstatic/.test(css)) fail('styles.css: enlaza fuentes externas (deben ser self-hosted)');

// --- Resultado ------------------------------------------------------------
if (errs.length) {
  console.error(`✗ polyglot-javascript-c2: ${errs.length} problema(s)`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
const widgets = order.filter((s) => topics[s]?.widget).length;
const variantes = order.reduce((n, s) => n + (topics[s]?.widget?.variants?.length || 0), 0);
console.log(`✓ polyglot-javascript-c2: ${order.length} temas · ${blocks.length} bloques · ${widgets} widgets · ${variantes} variantes · ${stars.length} estrella(s)`);
