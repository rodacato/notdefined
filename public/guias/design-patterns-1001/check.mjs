// Check de la guía (convención: cada guía puede traer su check.mjs junto a
// sus datos; `npm run check:guias` los descubre y corre todos).
//
// Este verifica cada snippet de código por EJECUCIÓN: extrae code.{ts,py,rb,go}
// de data/, corre cada uno con su toolchain, y exige exit 0 más stdout
// coincidiendo con cada comentario "=>" en orden. Uso directo:
//   node public/guias/design-patterns-1001/check.mjs           # los 92
//   node public/guias/design-patterns-1001/check.mjs go        # un lenguaje
//   node public/guias/design-patterns-1001/check.mjs builder   # un patrón
// Necesita toolchains locales: python3, ruby, go, npx (tsx). Fuera de
// `npm run ci` a propósito — los runners de CI no traen go/ruby.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const GUIDE = dirname(fileURLToPath(import.meta.url));
const DATA_FILES = [
  'data/catalogo.js',
  'data/patrones-creacional.js',
  'data/patrones-estructural.js',
  'data/patrones-comportamiento.js',
  'data/desambiguacion.js',
];

const ctx = { window: {} };
vm.createContext(ctx);
for (const f of DATA_FILES)
  vm.runInContext(readFileSync(join(GUIDE, f), 'utf8'), ctx);
const patterns = ctx.window.PATRONES.patrones;

const runners = {
  py: (f) => ['python3', [f]],
  rb: (f) => ['ruby', [f]],
  go: (f) => ['go', ['run', f]],
  ts: (f) => ['npx', ['-y', 'tsx', f]],
};

function expectedLines(src, ext) {
  const marker = ext === 'py' || ext === 'rb' ? '# => ' : '// => ';
  const out = [];
  for (const line of src.split('\n')) {
    const i = line.indexOf(marker);
    if (i >= 0) out.push(line.slice(i + marker.length).trim());
  }
  return out;
}

const only = process.argv.slice(2);
const dir = mkdtempSync(join(tmpdir(), 'guias-snippets-'));
const perLang = {};
const failures = [];

for (const p of patterns) {
  for (const ext of Object.keys(runners)) {
    if (only.length && !only.includes(ext) && !only.includes(p.id)) continue;
    const code = p.code?.[ext];
    if (code == null) {
      failures.push(`${p.id}.${ext}: snippet ausente`);
      continue;
    }
    const file = join(dir, `${p.id}.${ext}`);
    writeFileSync(file, code + '\n');
    const [cmd, args] = runners[ext](file);
    const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 90000 });
    const stdout = (r.stdout || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const exp = expectedLines(code, ext);
    let why = '';
    if (r.status !== 0) why = `exit ${r.status}`;
    else if (exp.length === 0) why = 'sin comentarios "=>"';
    else if (stdout.length !== exp.length)
      why = `imprimió ${stdout.length} líneas, esperaba ${exp.length}`;
    else {
      const i = exp.findIndex((e, k) => stdout[k] !== e);
      if (i >= 0) why = `línea ${i + 1}: "${stdout[i]}" ≠ "${exp[i]}"`;
    }
    perLang[ext] = perLang[ext] || { pass: 0, total: 0 };
    perLang[ext].total++;
    if (why) {
      failures.push(`${p.id}.${ext}: ${why}`);
      if (r.stderr)
        failures.push('  ' + r.stderr.split('\n').slice(0, 3).join('\n  '));
    } else perLang[ext].pass++;
  }
}

for (const [l, s] of Object.entries(perLang))
  console.log(`${l}: ${s.pass}/${s.total}`);
if (failures.length) {
  console.error('\n' + failures.join('\n'));
  process.exit(1);
}
console.log('todos los snippets corren y cumplen su output');
