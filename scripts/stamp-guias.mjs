// Sella los assets de las guías con un hash de contenido, solo en dist/.
// Astro hashea sus bundles; lo de public/ se copia con nombre fijo y Cloudflare
// lo cachea 4 h, así que un cambio de guía tardaba en verse. El HTML es DYNAMIC
// (no lo cachea), así que sellarlo ahí basta. public/ queda intacto: la guía
// sigue abriendo por doble clic sin servidor (ADR 0005).
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));
const GUIAS = join(RAIZ, 'dist', 'guias');

if (!existsSync(GUIAS)) {
  console.error('✗ dist/guias no existe — corre `astro build` antes.');
  process.exit(1);
}

// Con `./` y sin él: polyglot-sql-c1 escribe `src="js/core.js"`.
const REF =
  /(src|href)="((?:\.\/)?(?:js|data)\/[^"?]+\.js|(?:\.\/)?[^"?:]+\.css)"/g;

let sellados = 0;
let guias = 0;

for (const slug of readdirSync(GUIAS)) {
  const indice = join(GUIAS, slug, 'index.html');
  if (!existsSync(indice)) continue;

  let html = readFileSync(indice, 'utf8');
  const antes = html;

  html = html.replace(REF, (todo, attr, ruta) => {
    const archivo = resolve(join(GUIAS, slug), ruta);
    if (!existsSync(archivo)) return todo;
    const hash = createHash('sha1')
      .update(readFileSync(archivo))
      .digest('hex')
      .slice(0, 8);
    sellados++;
    return `${attr}="${ruta}?v=${hash}"`;
  });

  if (html !== antes) {
    writeFileSync(indice, html);
    guias++;
  }
}

console.log(`✓ sellado: ${sellados} assets en ${guias} guía(s)`);
