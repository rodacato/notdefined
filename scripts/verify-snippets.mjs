// Ejecuta los snippets de una guía contra el runtime que su ancla declara.
// Uso: node scripts/verify-snippets.mjs [slug]
import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));
const LIB = join(RAIZ, 'scripts', 'lib');

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
    // Ruby C1 nombra su namespace `datos` y ordena por bloques.
    adaptar: (G) => {
      const D = G.datos;
      return {
        ancla: D.guia.ancla,
        fichas: D.bloques.flatMap((b) =>
          D.fichas.filter((f) => f.bloque === b.id),
        ),
      };
    },
  },
  'polyglot-javascript-c2': {
    lenguaje: 'javascript',
    datos: [
      'data/meta.js',
      'data/ejecucion.js',
      'data/concurrencia.js',
      'data/memoria.js',
      'data/objetos.js',
      'data/modulos.js',
      'data/catalogo.js',
    ],
    adaptar: (G) => {
      const D = G.data;
      return {
        ancla: D.meta.ancla,
        fichas: D.blocks.flatMap((b) =>
          b.slugs.map((s) => ({ ...D.topics[s], titulo: D.topics[s].title })),
        ),
      };
    },
  },
};

const LENGUAJES = {
  ruby: {
    etiqueta: 'Ruby',
    ext: 'rb',
    doctest: join(LIB, 'ruby-doctest.rb'),
    comoInstalar: (v) => `rbenv install ${v}.0`,
    resolver(version) {
      const candidatos = [
        join(homedir(), '.rbenv', 'versions', `${version}.0`, 'bin', 'ruby'),
        join(homedir(), '.rbenv', 'versions', version, 'bin', 'ruby'),
      ];
      for (const c of candidatos) if (existsSync(c)) return c;
      const global = spawnSync('ruby', ['-e', 'print RUBY_VERSION'], {
        encoding: 'utf8',
      });
      if (global.status === 0 && global.stdout.startsWith(version))
        return 'ruby';
      return null;
    },
    versionDe: (bin) =>
      spawnSync(bin, ['-e', 'print RUBY_VERSION'], { encoding: 'utf8' }).stdout,
    banderas: () => [],
  },
  javascript: {
    etiqueta: 'Node',
    ext: 'mjs',
    doctest: join(LIB, 'js-doctest.mjs'),
    comoInstalar: (v) => `nvm install ${v}`,
    resolver(version) {
      const base = join(homedir(), '.nvm', 'versions', 'node');
      if (existsSync(base)) {
        const dirs = readdirSync(base)
          .filter((d) => d === `v${version}` || d.startsWith(`v${version}.`))
          .sort();
        if (dirs.length)
          return join(base, dirs[dirs.length - 1], 'bin', 'node');
      }
      if (process.versions.node.startsWith(version)) return process.execPath;
      return null;
    },
    versionDe: (bin) =>
      spawnSync(bin, ['-p', 'process.versions.node'], {
        encoding: 'utf8',
      }).stdout.trim(),
    // El snippet declara sus banderas en la primera línea, a la vista del lector.
    banderas(snippet) {
      const m = snippet.match(/^\s*\/\/\s*node\s+(-[^\n]*)/);
      return m ? m[1].trim().split(/\s+/) : [];
    },
  },
};

const slug = process.argv[2] || 'polyglot-ruby-c1';
const conf = GUIAS[slug];
if (!conf) {
  console.error(`✗ «${slug}» no está registrada en verify-snippets.mjs`);
  process.exit(1);
}
const L = LENGUAJES[conf.lenguaje];

const GUIA = join(RAIZ, 'public', 'guias', slug);
const ctx = { window: { GUIA: {} } };
vm.createContext(ctx);
for (const f of conf.datos)
  vm.runInContext(readFileSync(join(GUIA, f), 'utf8'), ctx);
const { ancla, fichas } = conf.adaptar(ctx.window.GUIA);

// El ancla de la guía es el contrato: si no hay un runtime de esa versión, no se
// verifica nada.
const anclada = (String(ancla ?? '').match(/(\d+\.\d+)/) || [])[1];
if (!anclada) {
  console.error(`✗ ${slug}: el ancla «${ancla}» no declara versión`);
  process.exit(1);
}

const BIN = L.resolver(anclada);
if (!BIN) {
  console.error(
    `✗ ${slug}: la guía declara ${L.etiqueta} ${anclada} y no hay ninguno instalado.`,
  );
  console.error(
    `  Instálalo (${L.comoInstalar(anclada)}) o corrige el ancla en data/meta.js.`,
  );
  process.exit(1);
}

const real = L.versionDe(BIN);
if (!real.startsWith(anclada)) {
  console.error(
    `✗ ${slug}: el ancla dice ${anclada} y el ${L.etiqueta.toLowerCase()} resuelto es ${real}`,
  );
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), `snips-${slug}-`));

let fallas = 0;
let sinDeclarar = 0;
let comprobadas = 0;
let sinSnippet = 0;

console.log(`▶ ${slug} · ${conf.lenguaje} ${real} (ancla: ${anclada})\n`);

for (const ficha of fichas) {
  if (!ficha.snippet) {
    sinSnippet++;
    console.log(
      `  · ${ficha.folio} ${ficha.titulo.slice(0, 34).padEnd(34)} sin snippet`,
    );
    continue;
  }

  const archivo = join(dir, `${ficha.slug}.${L.ext}`);
  writeFileSync(archivo, `${ficha.snippet}\n`);

  const reporte = join(dir, `${ficha.slug}.json`);
  const r = spawnSync(
    BIN,
    [...L.banderas(ficha.snippet), L.doctest, archivo, reporte],
    { encoding: 'utf8', timeout: 20000 },
  );
  if (!existsSync(reporte)) {
    console.error(
      `  ✗ ${ficha.folio} ${ficha.titulo}: el doctest murió\n${(r.stderr || '').trim()}`,
    );
    fallas++;
    continue;
  }

  const salida = JSON.parse(readFileSync(reporte, 'utf8'));
  if (!salida.ok) {
    console.error(`  ✗ ${ficha.folio} ${ficha.titulo}: no corrió`);
    for (const e of salida.parse_errors || [salida.fatal])
      console.error(`      ${e}`);
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

const cola = sinSnippet ? ` · ${sinSnippet} ficha(s) sin snippet` : '';
console.log(
  `\n${comprobadas} aserciones comprobadas · ${sinDeclarar} sentencias sin declarar salida · ${fallas} falla(s)${cola}`,
);
process.exit(fallas ? 1 : 0);
