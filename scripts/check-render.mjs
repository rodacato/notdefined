// Abre cada guía en un navegador real y verifica que PINTE algo.
// Los otros checks leen datos; ninguno abre la página — así se coló un <main>
// vacío con los tres gates en verde.
// Uso: node scripts/check-render.mjs [slug]
import {
  readdirSync,
  existsSync,
  writeFileSync,
  mkdtempSync,
  readFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));
const GUIAS = join(RAIZ, 'public', 'guias');

const CHROMES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];
const CHROME =
  CHROMES.find((c) => existsSync(c)) ||
  ['google-chrome', 'chromium'].find(
    (c) => spawnSync('which', [c], { encoding: 'utf8' }).status === 0,
  );

if (!CHROME) {
  console.error(
    '✗ check-render necesita Chrome o Chromium y no encontré ninguno.',
  );
  process.exit(1);
}

const SONDA = `
<script>
  window.__err = null;
  window.addEventListener('error', function (e) { window.__err = String(e.message); });
  window.addEventListener('load', function () {
    setTimeout(function () {
      var raiz = document.getElementById('vista') || document.getElementById('app');
      var rutas = [];
      document.querySelectorAll('a[href^="#/"]').forEach(function (a) {
        var h = a.getAttribute('href');
        if (rutas.indexOf(h) === -1) rutas.push(h);
      });
      var d = document.createElement('div');
      d.id = 'SONDA';
      d.textContent = JSON.stringify({
        hijos: raiz ? raiz.children.length : -1,
        texto: raiz ? raiz.textContent.trim().length : 0,
        error: window.__err,
        rutas: rutas,
      });
      document.body.appendChild(d);
    }, 600);
  });
</script>
`;

function abrir(archivo, ruta) {
  const r = spawnSync(
    CHROME,
    [
      '--headless',
      '--disable-gpu',
      '--dump-dom',
      '--virtual-time-budget=4000',
      `file://${archivo}${ruta}`,
    ],
    { encoding: 'utf8', timeout: 30000, maxBuffer: 40 * 1024 * 1024 },
  );
  const m = (r.stdout || '').match(/id="SONDA">([^<]*)</);
  if (!m) return null;
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
}

const soloSlug = process.argv[2];
const slugs = readdirSync(GUIAS)
  .filter((d) => existsSync(join(GUIAS, d, 'index.html')))
  .filter((d) => !soloSlug || d === soloSlug);

let fallas = 0;
const dir = mkdtempSync(join(tmpdir(), 'render-'));

for (const slug of slugs) {
  const html = readFileSync(join(GUIAS, slug, 'index.html'), 'utf8');
  const sondado = join(GUIAS, slug, '_sonda.html');
  writeFileSync(sondado, html.replace('</body>', `${SONDA}</body>`));

  try {
    const portada = abrir(sondado, '#/');
    if (!portada) {
      console.error(`  ✗ ${slug}: la sonda no respondió`);
      fallas++;
      continue;
    }

    // La portada manda: de ahí salen las rutas que la guía dice tener.
    const rutas = ['#/'].concat(portada.rutas.filter((r) => r !== '#/'));
    let vacias = 0;
    let errores = 0;

    for (const ruta of rutas) {
      const s = ruta === '#/' ? portada : abrir(sondado, ruta);
      if (!s || s.hijos <= 0 || s.texto < 80) {
        console.error(
          `      ${slug}${ruta}: pintó vacío (hijos ${s ? s.hijos : '?'}, ${s ? s.texto : '?'} chars)`,
        );
        vacias++;
      }
      if (s && s.error) {
        console.error(`      ${slug}${ruta}: ${s.error}`);
        errores++;
      }
    }

    fallas += vacias + errores;
    console.log(
      `  ${vacias + errores ? '✗' : '✓'} ${slug.padEnd(24)} ${String(rutas.length).padStart(2)} rutas` +
        (vacias + errores ? ` · ${vacias} vacías · ${errores} con error` : ''),
    );
  } finally {
    spawnSync('rm', ['-f', sondado]);
  }
}

console.log(`\n${slugs.length} guía(s) · ${fallas} falla(s)`);
process.exit(fallas ? 1 : 0);
