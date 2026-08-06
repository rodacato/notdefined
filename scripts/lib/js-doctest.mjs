// Contrasta cada expresión anotada contra lo que el snippet declara en sus `// =>`.
// Convención y uso: docs/guias/autoria.md
//
// A diferencia del doctest de Ruby, aquí NO se evalúa sentencia por sentencia: el
// programa corre entero y las anotaciones se reescriben como llamadas. Es lo que
// permite verificar orden del event loop y `await`, que es media guía.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { inspect } from 'node:util';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const CLAVE = Symbol.for('guia.doctest');
const ANOTACION = /^(.*?);?\s*\/\/\s*(=>|~>)\s*(.*?)\s*$/;
const CLASE_ERROR = /^[A-Z]\w*Error$/;

const [, , ruta, salida] = process.argv;
const fuente = readFileSync(ruta, 'utf8');
const lineas = fuente.split('\n');

function coincide(obtenido, esperado) {
  if (obtenido === esperado) return true;
  if (!esperado.includes('...')) return false;
  const patron = esperado
    .split('...')
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[\\s\\S]*');
  return new RegExp(`^${patron}$`).test(obtenido);
}

const D = {
  results: [],
  check(line, code, marca, esperado, thunk) {
    const entrada = { line, code, expected: marca === '~>' ? null : esperado };
    let valor;
    let levantado = null;
    try {
      valor = thunk();
    } catch (e) {
      levantado = e;
    }

    const nombre = levantado && (levantado.constructor?.name ?? 'Error');
    const got = levantado
      ? `${nombre}: ${levantado.message}`
      : inspect(valor, { depth: 4, breakLength: Infinity });

    if (marca === '~>') {
      this.results.push({
        ...entrada,
        kind: 'ilustrativa',
        ok: !levantado,
        got,
      });
    } else if (CLASE_ERROR.test(esperado)) {
      this.results.push({
        ...entrada,
        kind: 'error',
        ok: Boolean(levantado) && esNombreDe(levantado, esperado),
        got: levantado ? got : `no levantó (${got})`,
      });
    } else {
      this.results.push({
        ...entrada,
        kind: 'valor',
        ok: !levantado && coincide(got, esperado),
        got,
      });
    }
  },
};

function esNombreDe(error, clase) {
  let proto = error?.constructor;
  while (proto) {
    if (proto.name === clase) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

// Symbol.for y no una propiedad normal: no aparece en Object.keys(globalThis),
// así que un snippet que enumere globales no ve el harness.
globalThis[CLAVE] = D;

const PRELUDIO = `const __D = globalThis[Symbol.for('guia.doctest')];\n`;

const transformadas = lineas.map((linea, i) => {
  const m = linea.match(ANOTACION);
  if (!m) return linea;
  const [, expr, marca, esperado] = m;
  if (!expr.trim() || expr.trim().startsWith('//')) return linea;
  const literal = JSON.stringify(esperado);
  const codigo = JSON.stringify(expr.trim());
  return `__D.check(${i + 1}, ${codigo}, ${JSON.stringify(marca)}, ${literal}, () => (${expr.trim()}));`;
});

const dir = mkdtempSync(join(tmpdir(), 'jsdoc-'));
const archivo = join(dir, basename(ruta));
writeFileSync(archivo, PRELUDIO + transformadas.join('\n'));

let fatal = null;
try {
  await import(pathToFileURL(archivo).href);
} catch (e) {
  fatal = `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? e}`;
}

writeFileSync(
  salida,
  JSON.stringify({
    ok: !fatal,
    node: process.versions.node,
    v8: process.versions.v8,
    fatal,
    results: D.results,
  }),
);
