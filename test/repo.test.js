import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSV_LIMITS, FACTS, FINDINGS, SOURCES, readCsv, checkExport } from '../src/index.js';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const read = (rel) => readFile(resolve(root, rel), 'utf8');
const HOMEPAGE = 'https://innerluxes.dev/software-development/cloud-computing-solutions';

async function names(dir = '.', out = []) {
  for (const entry of await readdir(resolve(root, dir), { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const rel = dir === '.' ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory()) await names(rel, out);
    else out.push(rel);
  }
  return out;
}

async function markdownFiles() {
  const docs = (await readdir(resolve(root, 'docs'), { recursive: true })).filter((f) => f.endsWith('.md')).map((f) => `docs/${f.split('\\').join('/')}`);
  return ['README.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', ...docs];
}

test('package.json: a zero-dependency Node 22 ES module with the bin, the scripts and the homepage', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.name, 'focus-cost-check');
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.engines.node, '>=22');
  assert.equal(pkg.homepage, HOMEPAGE);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.equal(pkg.bin['focus-cost-check'], 'bin/focus-cost-check.js');
  for (const script of ['test', 'check', 'example', 'test:coverage']) assert.ok(pkg.scripts[script], script);
  const lock = JSON.parse(await read('package-lock.json'));
  assert.deepEqual(Object.keys(lock.packages), ['']);
  assert.equal(lock.version, pkg.version);
});

test('README: the closing Background section links to the cloud computing page with the agreed anchor text', async () => {
  const readme = await read('README.md');
  const parts = readme.split(/^## /m);
  const background = parts.find((p) => p.startsWith('Background'));
  assert.ok(background, 'a Background section');
  assert.ok(background.includes(`[cloud computing solutions for business](${HOMEPAGE})`));
  assert.equal(parts.at(-1).split('\n')[0], 'License');
  assert.equal(parts.at(-2).split('\n')[0], 'Background');
});

test('README and documents: no date and no year anywhere', async () => {
  for (const file of await markdownFiles()) {
    const text = await read(file);
    assert.doesNotMatch(text, /\b(?:19|20)\d{2}\b/, file);
    assert.doesNotMatch(text, /\b(?:January|February|March|April|June|July|August|September|October|November|December)\s+\d/, file);
  }
});

test('LICENSE: MIT with the copyright line of INNERLUXES and no year', async () => {
  const license = await read('LICENSE');
  assert.ok(license.startsWith('MIT License\n\nCopyright (c) INNERLUXES\n'));
});

test('SECURITY.md: how to report, and no promise about reply times', async () => {
  const text = await read('SECURITY.md');
  assert.match(text, /info@innerluxes\.dev/);
  assert.doesNotMatch(text, /within\s+\d|\bSLA\b|business days|hours|within a (?:day|week)|\bdays\b|\bweeks\b|\bpromptly\b|\bquickly\b/i);
});

test('the documents carry no company numbers and no promise', async () => {
  for (const file of await markdownFiles()) {
    const text = await read(file);
    assert.doesNotMatch(text, /\b\d[\d,]*\+? (?:clients|customers|projects|engineers|developers)\b/i, file);
    assert.doesNotMatch(text, /\bguarantee[sd]?\b/i, file);
  }
});

test('workflows: every action is pinned to a commit, the CI runs three systems and two Node versions, and the SSDF gate is there', async () => {
  for (const name of ['ci.yml', 'codeql.yml', 'release.yml']) {
    const text = await read(`.github/workflows/${name}`);
    const uses = [...text.matchAll(/^\s*- uses: (\S+)/gm)].map((m) => m[1]);
    assert.ok(uses.length > 0, name);
    for (const u of uses) assert.match(u, /@[0-9a-f]{40}$/, `${name}: ${u}`);
  }
  const ci = await read('.github/workflows/ci.yml');
  assert.match(ci, /os: \[ubuntu-latest, windows-latest, macos-latest\]/);
  assert.match(ci, /node: \[22, 24\]/);
  assert.match(ci, /node \.ssdf\/bin\/ssdf-repo-check\.js repo --format markdown >> "\$GITHUB_STEP_SUMMARY"/);
  assert.match(ci, /node \.ssdf\/bin\/ssdf-repo-check\.js repo --require-all --fail-on-problem/);
  assert.match(ci, /repository: INNERLUXES\/ssdf-repo-check/);
  assert.match(ci, /npm run check/);
  assert.match(ci, /npm run example/);
});

test('workflows: the pinned commits are the ones that the sibling repository uses', async () => {
  const known = new Set([
    'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
    'github/codeql-action/init@2892aa5e19bbd11bc0cff5427e3b750a04d9e3c2',
    'github/codeql-action/analyze@2892aa5e19bbd11bc0cff5427e3b750a04d9e3c2',
    'actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8'
  ]);
  for (const name of ['ci.yml', 'codeql.yml', 'release.yml']) {
    const text = await read(`.github/workflows/${name}`);
    for (const m of text.matchAll(/^\s*- uses: (\S+)/gm)) assert.ok(known.has(m[1]), `${name}: ${m[1]}`);
  }
  assert.match(await read('.github/workflows/ci.yml'), /ref: dfda194a3ed35623b8b420df05e110b66d984586 # v1\.0\.0/);
  for (const m of (await read('README.md')).matchAll(/uses: (\S+)/g)) assert.ok(known.has(m[1]), `README: ${m[1]}`);
});

test('release workflow: a tgz, a CycloneDX SBOM and SHA256SUMS named for this package', async () => {
  const release = await read('.github/workflows/release.yml');
  assert.match(release, /npm pack --pack-destination dist/);
  assert.match(release, /npm sbom --sbom-format cyclonedx > dist\/focus-cost-check\.cdx\.json/);
  assert.match(release, /sha256sum \* > SHA256SUMS/);
  assert.doesNotMatch(release, /tfplan-risk-check/);
});

test('repository files: Dependabot for actions and npm, CodeQL, CODEOWNERS, a pull request template and the line-end rules', async () => {
  const dependabot = await read('.github/dependabot.yml');
  assert.match(dependabot, /package-ecosystem: github-actions/);
  assert.match(dependabot, /package-ecosystem: npm/);
  assert.match(await read('.github/workflows/codeql.yml'), /security-extended/);
  assert.match(await read('.github/CODEOWNERS'), /^\* @innerluxesdev$/m);
  assert.match(await read('.github/pull_request_template.md'), /npm run example/);
  assert.match(await read('.github/pull_request_template.md'), /process\.platform/);
  const attributes = await read('.gitattributes');
  assert.match(attributes, /^\* text=auto eol=lf$/m);
  assert.match(attributes, /^examples\/output\/\*\.csv -text$/m);
});

test('the repository names no other project except its neighbour, and no tool that wrote it', async () => {
  for (const file of ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', '.github/workflows/ci.yml', '.github/workflows/release.yml', '.github/CODEOWNERS', '.github/pull_request_template.md']) {
    const text = await read(file);
    assert.doesNotMatch(text, /sql-migration-check|openapi-security-check|desktop-release-check|pwa-offline-check|k8s-manifest-check|lockfile-check|security-headers-check/i, file);
  }
});

test('docs: every finding id of the tool is described in docs/method.md, in the README table and in the changelog', async () => {
  const method = await read('docs/method.md');
  const readme = await read('README.md');
  const changelog = await read('CHANGELOG.md');
  for (const f of FINDINGS) {
    assert.ok(method.includes(`### \`${f.id}\``), `docs/method.md heading: ${f.id}`);
    assert.ok(readme.includes(`| \`${f.id}\` |`), `README: ${f.id}`);
    assert.ok(changelog.includes(`\`${f.id}\``), `CHANGELOG: ${f.id}`);
  }
});

test('docs: docs/rules-and-sources.md quotes every sentence of src/data.js and lists every saved page', async () => {
  const sources = await read('docs/rules-and-sources.md');
  for (const [key, fact] of Object.entries(FACTS)) {
    assert.ok(sources.includes(fact.text.replace(/\|/g, '\\|')), key);
    assert.ok(sources.includes(`\`${key}\``), key);
  }
  for (const s of SOURCES) {
    assert.ok(sources.includes(s.url), s.url);
    assert.ok(sources.includes(`research/sources/${s.file}`), s.file);
  }
});

test('docs: a sentence that the documents put in quotes and that is longer than a few words is on a saved page, word for word', async () => {
  const quotes = (t) => t.split(String.fromCharCode(0x2019)).join("'");
  const flat = (t) => quotes(t).replace(/\s+/g, ' ').trim();
  const pages = [];
  for (const s of SOURCES) pages.push(flat(await readFile(resolve(root, 'research/sources', s.file), 'utf8')));
  const all = pages.join('\n');
  let checked = 0;
  for (const file of ['README.md', 'docs/method.md', 'docs/limits.md', 'docs/inputs.md']) {
    const text = (await read(file)).split('```').filter((_, i) => i % 2 === 0).join('\n');
    for (const m of text.matchAll(/(?<![\w`])"([A-Z][^"\n]{40,}?[.:])"/g)) {
      const sentence = flat(m[1]);
      if (/^(?:A finding|The tool|It |This )/.test(sentence)) continue;
      assert.ok(all.includes(sentence), `${file}: "${m[1]}"`);
      checked += 1;
    }
  }
  assert.ok(checked >= 10, `${checked} quoted sentences checked`);
});

test('docs: the limits of docs/inputs.md and docs/method.md are the limits of the tool', async () => {
  const inputs = await read('docs/inputs.md');
  const method = await read('docs/method.md');
  const n = (v) => v.toLocaleString('en-US');
  for (const text of ['128 MB', n(CSV_LIMITS.maxRows), `${CSV_LIMITS.maxColumns} columns`, `${n(CSV_LIMITS.maxFieldChars)} characters`, n(CSV_LIMITS.maxHeaderChars), n(CSV_LIMITS.maxGroups), n(CSV_LIMITS.maxResources)]) {
    assert.ok(inputs.includes(text), `inputs: ${text}`);
    assert.ok(method.includes(text), `method: ${text}`);
  }
  assert.equal(CSV_LIMITS.maxFileBytes, 128 * 1048576);
  assert.equal(CSV_LIMITS.maxRows, 1000000);
  assert.ok((await read('docs/secure-defaults.md')).includes('128 MB'));
});

test('docs: docs/limits.md lists the checks that were left out', async () => {
  const limits = await read('docs/limits.md');
  for (const word of ['Checks that were left out because no saved page supports them', 'Waste', 'Provider-defined tags', 'AllocatedTags', 'A charge period is a calendar month']) assert.ok(limits.includes(word), word);
});

test('docs: the defaults in the README and the usage are the defaults of the tool', async () => {
  const readme = await read('README.md');
  for (const text of ['`--untagged-max <pct>` (default 20)', '`--spike-percent <pct>` (default 50)', '`--spike-min <amount>` (default 100)', '`--top <n>` (default 5)']) assert.ok(readme.includes(text), text);
});

test('README: the usage, the options and the exit codes are the ones of the tool', async () => {
  const readme = await read('README.md');
  for (const text of ['--format <name>', '--fail-on warning', 'info never fails the run', '--require-tag', '--currency']) assert.ok(readme.includes(text), text);
  assert.match(readme, /`0` no finding at the `--fail-on` level, `1` at least one such finding/);
  assert.match(readme, /`2` a usage or input error/);
  assert.match(readme, /npm run example/);
  assert.match(readme, /Parquet is not read/);
});

test('the examples: a made-up online shop with problems, a fixed one, and the reports in every format', async () => {
  assert.deepEqual((await readdir(resolve(root, 'examples/acme-shop'))).sort(), ['export.csv']);
  assert.deepEqual((await readdir(resolve(root, 'examples/acme-shop-fixed'))).sort(), ['export.csv']);
  assert.deepEqual((await readdir(resolve(root, 'examples/output'))).sort(), ['acme-shop.csv', 'acme-shop.json', 'acme-shop.md', 'acme-shop.txt']);
  for (const dir of ['acme-shop', 'acme-shop-fixed']) {
    const text = await read(`examples/${dir}/export.csv`);
    let rows = 0;
    const rowsRead = readCsv(text, () => { rows += 1; });
    assert.equal(rowsRead, 26);
    assert.equal(rows, 27);
    assert.ok(!text.includes('\r'));
  }
});

test('the examples: the export with problems has each kind of problem, and the fixed one has none above info', async () => {
  const bad = checkExport(await read('examples/acme-shop/export.csv'), { options: { requireTags: ['env'] } });
  const ids = new Set(bad.findings.map((f) => f.id));
  for (const id of ['untagged-cost', 'tag-key-missing', 'cost-spike', 'no-owner-account', 'commitment-coverage', 'charge-category-total']) assert.ok(ids.has(id), id);
  assert.equal(bad.counts.warning, 3);
  const fixed = checkExport(await read('examples/acme-shop-fixed/export.csv'), { failOn: 'warning', options: { requireTags: ['env'] } });
  assert.equal(fixed.counts.warning, 0);
  assert.equal(fixed.counts.error, 0);
  assert.equal(fixed.gate.pass, true);
});

test('the examples: the made-up export holds no tag value that a report could leak, and no real name', async () => {
  const json = await read('examples/output/acme-shop.json');
  for (const value of ['storefront', 'payments', 'platform']) assert.ok(!json.includes(value), value);
  assert.ok(!json.includes('"team"'));
});

test('src imports no network, process or code evaluation module, and calls none of them', async () => {
  const forbidden = /from 'node:(?:net|http|https|http2|dgram|dns|tls|child_process|worker_threads|cluster|vm|inspector)'|\bfetch\(|XMLHttpRequest|WebSocket|\beval\(|new Function\(|\brequire\(|\bimport\(/;
  for (const file of await readdir(resolve(root, 'src'))) assert.doesNotMatch(await read(`src/${file}`), forbidden, file);
});

test('src reads only what is named: the only imports of the file system are in src/files.js and src/cli.js', async () => {
  for (const file of await readdir(resolve(root, 'src'))) {
    const text = await read(`src/${file}`);
    if (file === 'files.js') assert.match(text, /from 'node:fs\/promises'/);
    else if (file === 'cli.js') assert.match(text, /from 'node:fs'/);
    else assert.doesNotMatch(text, /from 'node:fs/, file);
  }
});

test('src never writes a file', async () => {
  for (const file of await readdir(resolve(root, 'src'))) assert.doesNotMatch(await read(`src/${file}`), /writeFile|appendFile|createWriteStream|mkdir\(|unlink\(|rename\(/, file);
});

test('src holds no amount in a JavaScript number: no parseFloat, no toFixed and no Number() on a cost', async () => {
  for (const file of ['analyze.js', 'check.js', 'decimal.js', 'report.js']) {
    const text = await read(`src/${file}`);
    assert.doesNotMatch(text, /parseFloat|toFixed|Math\.round|Number\(f\[|Number\(effective|Number\(billed/, file);
  }
  const analyze = await read('src/analyze.js');
  assert.match(analyze, /parseDecimal\(f\[col\.EffectiveCost\]\)/);
  assert.match(analyze, /parseDecimal\(f\[col\.BilledCost\]\)/);
});

test('the CSV reader keeps its refusals and its limits', async () => {
  const text = await read('src/csv.js');
  for (const word of ['a quoted field never ends', 'a quote inside a field that does not start with a quote', 'text after the closing quote', 'a carriage return that is not followed by a line feed', 'an empty line', 'but the header has']) assert.ok(text.includes(word), word);
  assert.doesNotMatch(text, /JSON\.parse\(|new RegExp|\.split\(/);
  const data = await read('src/data.js');
  assert.match(data, /maxFileBytes: 128 \* 1024 \* 1024/);
  assert.match(data, /maxColumns: 500/);
  assert.match(data, /maxFieldChars: 65536/);
  assert.match(data, /maxRows: 1000000/);
});

test('the tool never keeps a tag value: the Tags reader returns only keys and whether they have a value', async () => {
  const analyze = await read('src/analyze.js');
  assert.ok(analyze.includes("kind = value === '' ? 'empty' : 'value';"));
  assert.doesNotMatch(analyze, /tags\.set\(key, value\)/);
  const check = await read('src/check.js');
  assert.doesNotMatch(check, /tags\.values|\.values\(\)/);
});

test('the tests that depend on the system are guarded with process.platform', async () => {
  const files = await read('test/files.test.js');
  assert.ok((files.match(/process\.platform/g) ?? []).length >= 5);
  for (const word of ["process.platform === 'win32'", "process.platform !== 'win32'", "process.platform === 'linux'"]) assert.ok(files.includes(word), word);
  assert.ok(files.includes('/dev/null'));
  assert.ok(files.includes('symbolic links'));
});

test('there are at least 60 tests, written in the files of the test folder', async () => {
  let count = 0;
  for (const file of (await readdir(resolve(root, 'test'))).filter((f) => f.endsWith('.test.js'))) count += (await read(`test/${file}`)).match(/^test\(/gm).length;
  assert.ok(count >= 60, `${count} tests`);
});

test('no file holds a control byte (0x01 to 0x08) or a token-shaped string, and text files end with a line end', async () => {
  const all = await names();
  assert.ok(all.length > 60);
  const prefixes = [['g', 'h', 'p', '_'].join(''), ['github', 'pat', ''].join('_'), ['AK', 'IA'].join('')];
  for (const name of all) {
    const text = await read(name);
    assert.doesNotMatch(text, new RegExp(`[${String.fromCharCode(1)}-${String.fromCharCode(8)}]`), name);
    for (const prefix of prefixes) assert.ok(!text.includes(prefix), `${name}: ${prefix}`);
    if (!name.startsWith('research/') && !name.endsWith('.csv')) assert.ok(text === '' || text.endsWith('\n'), `${name}: ends with a line end`);
  }
});

test('no file has carriage returns except the CSV report, so the commit has LF line ends', async () => {
  for (const name of await names()) {
    if (name === 'examples/output/acme-shop.csv') continue;
    assert.ok(!(await read(name)).includes('\r'), `${name} has a carriage return`);
  }
});
