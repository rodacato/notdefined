// Check de la guía (convención: cada guía trae su check.mjs junto a sus
// datos; `npm run check:guias` los descubre y corre todos).
//
// Rust a fondo · Polyglot. Verifica la INTEGRIDAD de los datos y su cruce con
// las vistas: catálogo completo (19 temas · 5 bloques) con folios únicos y
// consecutivos; cada tema en exactamente un bloque y sin fichas huérfanas;
// cada ficha con su estructura fija (lede, 4 datos de «en breve», fundamento,
// mito, recursos); cada widget declarado con un iniciador en js/widgets.js;
// las simulaciones deterministas (sin Math.random); la identidad de colección
// (nivel C2, guiño CEFR sin B2 — ver ADR 0006 —, cero rastro del almanaque
// 1001); y las fuentes self-hosted 1:1 entre @font-face y disco. Uso:
//   node public/guias/polyglot-rust-c2/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DOMAIN_FILES = [
  'coleccion', 'propiedad', 'compilacion', 'memoria', 'concurrencia', 'profundizaciones',
];
const DATA_FILES = DOMAIN_FILES.map((d) => `data/${d}.js`);
const read = (f) => readFileSync(join(GUIDE, f), 'utf8');

// los data/*.js cuelgan de window.GUIA igual que en el navegador
const ctx = { window: {}, console: { warn() {} } };
vm.createContext(ctx);
for (const f of DATA_FILES) vm.runInContext(read(f), ctx);
const G = ctx.window.GUIA || {};

const errs = [];
const fail = (msg) => errs.push(msg);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isArr = (v) => Array.isArray(v);

const ESPERA_TEMAS = 19;
const ESPERA_BLOQUES = 5;

// --- Colección: identidad, hero y nivel -----------------------------------------
const col = G.coleccion;
if (!col) fail('data/coleccion.js: no define G.coleccion');
else {
  for (const k of ['marca', 'metaTop', 'titulo', 'lede', 'nivel', 'bloques', 'cross', 'colofon'])
    if (col[k] == null) fail(`coleccion.${k}: falta`);
  if (col.marca !== 'Polyglot · notdefined')
    fail(`coleccion.marca: «${col.marca}», esperaba «Polyglot · notdefined»`);
  if (col.metaTop !== 'RUST · NIVEL C2')
    fail(`coleccion.metaTop: «${col.metaTop}», esperaba «RUST · NIVEL C2»`);
  if (col.titulo !== 'Rust a fondo')
    fail(`coleccion.titulo: «${col.titulo}», esperaba «Rust a fondo»`);
  if (col.nivel?.code !== 'C2') fail(`coleccion.nivel.code: «${col.nivel?.code}», esperaba C2`);
  // ADR 0006: la escala de Polyglot es solo C1/C2 — B2 se descartó
  if (/\bB2\b/.test(col.nivel?.escala || ''))
    fail('coleccion.nivel.escala: menciona B2, pero Polyglot solo tiene C1 y C2 (ADR 0006)');
  for (const l of ['C1', 'C2'])
    if (!(col.nivel?.escala || '').includes(l)) fail(`coleccion.nivel.escala: no menciona ${l}`);
  if (col.colofon?.locale !== 'rs-VM')
    fail(`coleccion.colofon.locale: «${col.colofon?.locale}», esperaba «rs-VM»`);
  if (!isArr(col.why) || col.why.length !== 3) fail('coleccion.why: esperaba 3 tarjetas');
}

// --- Catálogo: bloques, orden y ausencia de huérfanos ---------------------------
const temas = G.temas || {};
const bloques = col?.bloques || [];
if (bloques.length !== ESPERA_BLOQUES)
  fail(`coleccion.bloques: ${bloques.length} bloques, esperaba ${ESPERA_BLOQUES}`);

const orden = typeof G.ordenPlano === 'function' ? G.ordenPlano() : [];
if (orden.length !== ESPERA_TEMAS)
  fail(`orden del catálogo: ${orden.length} temas, esperaba ${ESPERA_TEMAS}`);
if (new Set(orden).size !== orden.length) fail('orden del catálogo: hay slugs repetidos');

const enBloque = new Set();
for (const b of bloques) {
  const at = `bloques[${b.n}]`;
  if (typeof b.n !== 'number') fail(`${at}: sin número de bloque`);
  if (!isStr(b.label)) fail(`${at}: sin label`);
  if (!/^var\(--fam-\d\)$/.test(b.fam || '')) fail(`${at}: fam «${b.fam}» debe ser var(--fam-N)`);
  if (!isArr(b.temas) || !b.temas.length) fail(`${at}: sin temas`);
  for (const slug of b.temas || []) {
    if (!temas[slug]) { fail(`${at}: tema inexistente «${slug}»`); continue; }
    if (enBloque.has(slug)) fail(`${at}: «${slug}» está en más de un bloque`);
    enBloque.add(slug);
  }
}
for (const slug of Object.keys(temas))
  if (!enBloque.has(slug)) fail(`temas[${slug}]: ficha huérfana, no aparece en ningún bloque`);

// las familias que citan los bloques existen como token en styles.css
const css = read('styles.css');
for (const b of bloques)
  if (b.fam && !css.includes(`${b.fam.slice(4, -1)}:`))
    fail(`bloques[${b.n}]: la familia ${b.fam} no está definida en styles.css`);

// --- Fichas ---------------------------------------------------------------------
for (const slug of orden) {
  const t = temas[slug];
  if (!t) { fail(`orden: «${slug}» no tiene ficha en G.temas`); continue; }
  const at = `temas[${slug}]`;
  if (t.slug !== slug) fail(`${at}: slug interno «${t.slug}» no coincide con la clave`);
  for (const k of ['kicker', 'title', 'tagline', 'avoid', 'lede', 'fundamento', 'mito', 'recursos', 'widget'])
    if (t[k] == null || t[k] === '') fail(`${at}: falta ${k}`);
  if (![1, 2, 3].includes(t.difficulty)) fail(`${at}: difficulty «${t.difficulty}» debe ser 1, 2 o 3`);
  if (typeof t.star !== 'boolean') fail(`${at}: star debe ser boolean`);
  if (!isArr(t.enBreve) || t.enBreve.length !== 4)
    fail(`${at}: «en breve» tiene ${t.enBreve?.length} datos, el formato de la colección pide 4`);
  for (const f of t.enBreve || [])
    if (!isStr(f.k) || !isStr(f.v)) fail(`${at}: enBreve con k/v incompleto`);
  if (!isStr(t.fundamento?.fuerza)) fail(`${at}: fundamento.fuerza vacío`);
  if (!isStr(t.mito?.myth) || !isStr(t.mito?.real)) fail(`${at}: mito sin myth/real`);
  if (!isArr(t.recursos) || t.recursos.length !== 3)
    fail(`${at}: ${t.recursos?.length} recursos, el formato de la colección pide 3`);
  for (const r of t.recursos || []) {
    if (!isStr(r.kind) || !isStr(r.label) || !isStr(r.href)) fail(`${at}: recurso sin kind/label/href`);
    if (r.href && !/^https:\/\//.test(r.href)) fail(`${at}: recurso «${r.label}» no apunta a https`);
  }
  if (t.como && !isArr(t.como.blocks)) fail(`${at}: como.blocks debe ser lista`);
  if (t.sim && (!isStr(t.sim.title) || !isStr(t.sim.intro))) fail(`${at}: sim sin title/intro`);
}

// --- Widgets: cada tema declara uno y existe su iniciador -----------------------
const widgetsSrc = read('js/widgets.js');
const registrados = new Set([
  ...[...widgetsSrc.matchAll(/G\.widgets\.([\w]+)\s*=/g)].map((m) => m[1]),
  ...[...widgetsSrc.matchAll(/G\.widgets\["([^"]+)"\]\s*=/g)].map((m) => m[1]),
]);
for (const slug of orden) {
  const w = temas[slug]?.widget;
  if (!isStr(w)) { fail(`temas[${slug}]: sin widget declarado`); continue; }
  if (w !== slug) fail(`temas[${slug}]: widget «${w}» no coincide con el slug`);
  if (!registrados.has(w)) fail(`widget «${w}»: sin iniciador G.widgets en js/widgets.js`);
}
for (const w of registrados)
  if (!temas[w]) fail(`js/widgets.js: «${w}» no corresponde a ningún tema`);

// --- Determinismo ---------------------------------------------------------------
for (const f of [...DATA_FILES, 'js/widgets.js'])
  if (/Math\.random\s*\(/.test(read(f)))
    fail(`${f}: usa Math.random — las simulaciones deben ser deterministas`);

// --- Cruce con las vistas -------------------------------------------------------
const routerSrc = read('js/router.js');
for (const fn of ['pages.tema', 'pages.catalog'])
  if (!routerSrc.includes(fn)) fail(`js/router.js: no invoca G.${fn}`);
for (const [f, view] of [['js/page-catalog.js', 'catálogo'], ['js/page-tema.js', 'ficha']])
  if (!read(f).includes('document.title')) fail(`${f}: no fija document.title en la vista de ${view}`);
// el folio se deriva de la posición en el catálogo (2 dígitos): con el orden ya
// validado sin huecos ni repetidos, esa fórmula garantiza 01..19 consecutivos
const componentsSrc = read('js/components.js');
if (!/indexOf\(slug\)[\s\S]{0,120}padStart\(2, "0"\)/.test(componentsSrc))
  fail('js/components.js: el folio ya no se deriva de la posición en G.ordenPlano()');
if (!componentsSrc.includes('href: "/guias/"'))
  fail('js/components.js: la site-bar no apunta a /guias/');
if (!componentsSrc.includes('themeToggle')) fail('js/components.js: falta el toggle de tema');

// --- Identidad: nada del almanaque 1001, guiño CEFR una sola vez -----------------
const html = read('index.html');
for (const f of ['index.html', 'styles.css', ...DATA_FILES, 'js/page-catalog.js', 'js/page-tema.js'])
  if (/1001|almanaque|\bTomo\b/i.test(read(f)))
    fail(`${f}: rastro del almanaque 1001 — esta guía es Polyglot`);
if (/generad[oa] con|Claude Design/i.test(html + DATA_FILES.map(read).join('')))
  fail('la guía lleva colofón de generación (va en el índice /guias/, no aquí)');
const guiños = (html.match(/El B1 te lo dio el tutorial/g) || []).length;
if (guiños !== 1) fail(`el guiño CEFR aparece ${guiños} veces en index.html, debe aparecer 1`);
if (!/name="description"[^>]*NIVEL|El B1 te lo dio el tutorial/.test(html))
  fail('index.html: el guiño CEFR debe vivir en la meta description');

// --- Portabilidad: tema pre-paint, fuentes self-hosted 1:1 ----------------------
if (!html.includes('guia-tema')) fail('index.html: falta el script de tema pre-paint');
if (!html.includes('color-scheme')) fail('index.html: falta <meta name="color-scheme">');
if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html + css))
  fail('la guía pide fuentes a Google — deben ser self-hosted en ./fonts/');
const pedidas = new Set([...css.matchAll(/url\("\.\/fonts\/([^"]+)"\)/g)].map((m) => m[1]));
const enDisco = new Set(readdirSync(join(GUIDE, 'fonts')));
for (const f of pedidas) if (!enDisco.has(f)) fail(`fonts: styles.css pide «${f}» y no está en disco`);
for (const f of enDisco) if (!pedidas.has(f)) fail(`fonts: «${f}» está en disco y nadie lo pide`);
if (pedidas.size !== 9) fail(`fonts: ${pedidas.size} @font-face, el trío Polyglot son 9 archivos`);

// --- Resultado ------------------------------------------------------------------
if (errs.length) {
  console.error(`✗ polyglot-rust-c2: ${errs.length} problema(s)`);
  for (const e of errs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ polyglot-rust-c2: ${orden.length} temas · ${bloques.length} bloques · ` +
  `${Object.keys(temas).length} fichas · ${registrados.size} widgets registrados · ${pedidas.size} fuentes 1:1`,
);
