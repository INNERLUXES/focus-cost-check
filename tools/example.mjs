// Runs the README examples, checks that they report what the README shows, and writes the reports of the failing
// example to examples/output. CI runs it and then fails if those files changed, so the example output in the
// repository is always the real output.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main, LIMITS } from '../src/index.js';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');

// Runs the tool on files of the repository; the file name shown in the report is the name of the file that is checked.
async function run(argv) {
  let out = '';
  const code = await main(argv, { out: (t) => { out += t; }, err: (t) => process.stderr.write(t) }, LIMITS, root);
  return { code, out };
}

const problems = [];
function expect(name, result, code, expected, unwanted) {
  const missing = expected.filter((e) => !result.out.includes(e));
  const wrong = unwanted.filter((e) => result.out.includes(e));
  if (result.code !== code || missing.length || wrong.length) {
    problems.push(`${name}: unexpected report (exit code ${result.code}, expected ${code}; missing: ${missing.join(' / ') || 'none'}; should not appear: ${wrong.join(' / ') || 'none'})`);
  }
}

const failingArgs = ['examples/acme-shop/export.csv', '--require-tag', 'env', '--fail-on', 'warning'];
const failing = await run(failingArgs);
process.stdout.write(failing.out);
expect('failing export', failing, 1, [
  'read: 26 rows, 28 columns, FOCUS 1.0 to 1.2 columns, currency USD, 2 charge periods (2100-01 to 2100-02)',
  'findings: 0 error, 3 warning, 6 info',
  'WARNING  untagged-cost  Tags',
  'WARNING  tag-key-missing  env',
  'WARNING  cost-spike  AWS Lambda',
  'went from 120.00 USD in 2100-01 to 480.00 USD in 2100-02',
  'INFO     no-owner-account',
  'INFO     commitment-coverage',
  'INFO     charge-category-total  Credit',
  'GATE: FAIL - 3 warnings'
], ['GATE: PASS', 'storefront', 'payments']);

process.stdout.write('\n');
const fixedArgs = ['examples/acme-shop-fixed/export.csv', '--require-tag', 'env', '--fail-on', 'warning'];
const fixed = await run(fixedArgs);
process.stdout.write(fixed.out);
expect('fixed export with --fail-on warning', fixed, 0, [
  'findings: 0 error, 0 warning, 5 info',
  'GATE: PASS (--fail-on warning)'
], ['ERROR', 'WARNING ', 'storefront', 'payments']);

// The README shows the runs as they are printed.
const readme = (await readFile(resolve(root, 'README.md'), 'utf8')).split('\r\n').join('\n');
if (!readme.includes(failing.out)) problems.push('README: the sample output of the failing export differs from a real run');
if (!readme.includes(fixed.out)) problems.push('README: the sample output of the fixed export differs from a real run');

// The same export in the other formats, kept as examples of what each one looks like.
await mkdir(resolve(root, 'examples/output'), { recursive: true });
await writeFile(resolve(root, 'examples/output/acme-shop.txt'), failing.out);
for (const [format, name] of [['markdown', 'acme-shop.md'], ['json', 'acme-shop.json'], ['csv', 'acme-shop.csv']]) {
  const r = await run([...failingArgs, '--format', format]);
  if (r.code !== 1) problems.push(`${format}: exit code ${r.code}, expected 1`);
  if (r.out.includes('storefront') || r.out.includes('payments')) problems.push(`${format}: the report holds a tag value of the export`);
  await writeFile(resolve(root, 'examples/output', name), r.out);
}

if (problems.length) {
  for (const p of problems) console.error(`example: ${p}`);
  process.exit(1);
}
