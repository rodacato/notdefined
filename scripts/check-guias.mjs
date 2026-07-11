// Runs every guide's own check: convention is public/guias/<slug>/check.mjs.
// A guide without check.mjs is reported as skipped, not failed.
import { readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GUIAS = join(dirname(fileURLToPath(import.meta.url)), '../public/guias');
const extraArgs = process.argv.slice(2);

const slugs = readdirSync(GUIAS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let failed = 0;
let ran = 0;
for (const slug of slugs) {
  const check = join(GUIAS, slug, 'check.mjs');
  if (!existsSync(check)) {
    console.log(`— ${slug}: sin check.mjs (skip)`);
    continue;
  }
  console.log(`▶ ${slug}`);
  const r = spawnSync('node', [check, ...extraArgs], { stdio: 'inherit' });
  ran++;
  if (r.status !== 0) failed++;
}

if (!ran) console.log('ninguna guía trae check.mjs todavía');
if (failed) {
  console.error(`\n${failed} guía(s) con checks fallando`);
  process.exit(1);
}
