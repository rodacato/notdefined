// Ejecuta los snippets de una guía contra el runtime que su ancla declara.
// Uso: node scripts/verify-snippets.mjs [slug]
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));
const DOCTEST = join(RAIZ, 'scripts', 'lib', 'ruby-doctest.rb');

const GUIAS = {
  'polyglot-ruby-c1': {
    lenguaje: 'ruby',
    datos: [
      'data/meta.js',
      'data/modelo-de-objetos.js',
      'data/metaprogramacion.js',
      'data/lenguaje-expresivo.js',
      'data/robustez-concurrencia.js',
    ],
  },
};

const slug = process.argv[2] || 'polyglot-ruby-c1';
const conf = GUIAS[slug];
if (!conf) {
  console.error(`✗ «${slug}» no está registrada en verify-snippets.mjs`);
  process.exit(1);
}

const GUIA = join(RAIZ, 'public', 'guias', slug);
const ctx = { window: { GUIA: {} } };
vm.createContext(ctx);
for (const f of conf.datos)
  vm.runInContext(readFileSync(join(GUIA, f), 'utf8'), ctx);
const D = ctx.window.GUIA.datos;

// El ancla de la guía es el contrato: si no hay un ruby de esa versión, no se verifica nada.
const anclada = (D.guia.ancla.match(/(\d+\.\d+)/) || [])[1];
if (!anclada) {
  console.error(`✗ ${slug}: el ancla «${D.guia.ancla}» no declara versión`);
  process.exit(1);
}

function rubyDe(version) {
  const candidatos = [
    join(homedir(), '.rbenv', 'versions', `${version}.0`, 'bin', 'ruby'),
    join(homedir(), '.rbenv', 'versions', version, 'bin', 'ruby'),
  ];
  for (const c of candidatos) if (existsSync(c)) return c;
  const global = spawnSync('ruby', ['-e', 'print RUBY_VERSION'], {
    encoding: 'utf8',
  });
  if (global.status === 0 && global.stdout.startsWith(version)) return 'ruby';
  return null;
}

const RUBY = rubyDe(anclada);
if (!RUBY) {
  console.error(
    `✗ ${slug}: la guía declara Ruby ${anclada} y no hay ninguno instalado.`,
  );
  console.error(
    `  Instálalo (rbenv install ${anclada}.0) o corrige el ancla en data/meta.js.`,
  );
  process.exit(1);
}

const real = spawnSync(RUBY, ['-e', 'print RUBY_VERSION'], {
  encoding: 'utf8',
}).stdout;
if (!real.startsWith(anclada)) {
  console.error(
    `✗ ${slug}: el ancla dice ${anclada} y el ruby resuelto es ${real}`,
  );
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), `snips-${slug}-`));
const orden = D.bloques.flatMap((b) =>
  D.fichas.filter((f) => f.bloque === b.id),
);

let fallas = 0;
let sinDeclarar = 0;
let comprobadas = 0;

console.log(`▶ ${slug} · ${conf.lenguaje} ${real} (ancla: ${anclada})\n`);

for (const ficha of orden) {
  const archivo = join(dir, `${ficha.slug}.rb`);
  writeFileSync(archivo, `${ficha.snippet}\n`);

  const reporte = join(dir, `${ficha.slug}.json`);
  const r = spawnSync(RUBY, [DOCTEST, archivo, reporte], {
    encoding: 'utf8',
    timeout: 20000,
  });
  if (r.status !== 0 || !existsSync(reporte)) {
    console.error(
      `  ✗ ${ficha.folio} ${ficha.titulo}: el doctest murió\n${(r.stderr || '').trim()}`,
    );
    fallas++;
    continue;
  }

  const salida = JSON.parse(readFileSync(reporte, 'utf8'));
  if (!salida.ok) {
    console.error(`  ✗ ${ficha.folio} ${ficha.titulo}: no parsea`);
    for (const e of salida.parse_errors) console.error(`      ${e}`);
    fallas++;
    continue;
  }

  const rotas = salida.results.filter((x) => !x.ok);
  const declaradas = salida.results.filter(
    (x) => x.kind === 'valor' || x.kind === 'error',
  );
  const mudas = salida.results.filter((x) => x.kind === 'sin-declarar');
  comprobadas += declaradas.length;
  sinDeclarar += mudas.length;

  const marca = rotas.length ? '✗' : '✓';
  console.log(
    `  ${marca} ${ficha.folio} ${ficha.titulo.slice(0, 34).padEnd(34)} ${String(declaradas.length).padStart(2)} comprobadas · ${String(mudas.length).padStart(2)} sin declarar`,
  );

  for (const x of rotas) {
    fallas++;
    console.error(`      L${x.line}  ${x.code}`);
    console.error(`         esperaba: ${x.expected ?? '(nada, y levantó)'}`);
    console.error(`         obtuvo:   ${x.got}`);
  }
}

console.log(
  `\n${comprobadas} aserciones comprobadas · ${sinDeclarar} sentencias sin declarar salida · ${fallas} falla(s)`,
);
process.exit(fallas ? 1 : 0);
