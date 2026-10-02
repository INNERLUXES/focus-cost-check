import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINDINGS, USAGE, VERSION, csvCell, mdCell, parseArgs, readCsv, toCsv, toJson, toMarkdown, toText } from '../src/index.js';
import { check, cli, csv, run, tags } from './helpers.js';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const BARE = { cost: '10.00', Tags: '' };
const TAGGED = { cost: '10.00', Tags: tags({ team: 'a' }) };
const FAILING = csv([BARE, BARE, TAGGED, { cost: '5.00', ChargeCategory: 'Credit', Tags: '' }]);

test('text: the file, what was read, the counts, each finding with its fix and sources, the notes and the gate line', () => {
  const text = toText(check(FAILING, {}, { target: 'x.csv', failOn: 'warning' }));
  const lines = text.split('\n');
  assert.equal(lines[0], 'focus-cost-check: x.csv');
  assert.match(lines[1], /^read: 4 rows, 22 columns, FOCUS 1\.0 to 1\.2 columns, currency USD, 1 charge period \(2024-01\)$/);
  assert.match(lines[2], /^usage: 30\.00 USD effective cost in 3 rows$/);
  assert.match(lines[3], /^findings: 0 error, 1 warning, \d info$/);
  assert.ok(text.includes('WARNING  untagged-cost  Tags\n'));
  assert.ok(text.includes('         fix: '));
  assert.ok(text.includes('         source (FOCUS 1.2, column Tags, Description): "Tags are commonly used'));
  assert.ok(text.includes('           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/tags.md\n'));
  assert.ok(text.endsWith('GATE: FAIL - 1 warning\n'));
  assert.ok(!text.includes('\r'));
});

test('text: a run with no finding says so, and shows the gate that was used', () => {
  const text = toText(check(csv([TAGGED], { omit: [] }), { requireTags: ['team'] }, { failOn: 'warning' }));
  assert.match(text, /GATE: PASS \(--fail-on warning\)\n$/);
  const empty = toText({ ...check(csv([TAGGED])), findings: [], notes: [] });
  assert.ok(empty.includes('\nno findings\n'));
});

test('markdown: a table with one row per finding, the sources as links, and a gate line', () => {
  const md = toMarkdown(check(FAILING, {}, { target: 'x.csv', failOn: 'warning' }));
  assert.match(md, /^## focus-cost-check: 0 error, 1 warning, \d info\n\nx\.csv, 4 rows/);
  assert.ok(md.includes('| Severity | Check | About | Message | Details | Fix | Source |'));
  assert.ok(md.includes('| warning | untagged-cost | Tags |'));
  assert.ok(md.includes('[FOCUS 1.2, column Tags, Description](https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/tags.md): "Tags are commonly used'));
  assert.ok(md.endsWith('**Gate failed:** 1 warning.\n'));
});

test('markdown: a pipe, an angle bracket, an ampersand, a backslash and a line break from the file cannot break the table or be read as HTML', () => {
  assert.equal(mdCell('a|b<c>&d\\e\nf'), 'a\\|b&lt;c&gt;&amp;d\\\\e f');
  const rows = [{ cost: '10.00', Tags: '', ServiceName: 'x|<script>alert(1)</script>' }];
  const md = toMarkdown(check(csv(rows)));
  assert.ok(!md.includes('<script>'));
  assert.ok(md.includes('x\\|&lt;script&gt;'));
  for (const line of md.split('\n').filter((l) => l.startsWith('| warning'))) assert.equal(line.replace(/\\\|/g, '').split('|').length - 1, 8);
});

test('json: the whole report, with the input, every finding, the notes, the options and the gate', () => {
  const r = JSON.parse(toJson(check(FAILING, { requireTags: ['team'] }, { target: 'x.csv', version: '9.9.9' })));
  assert.equal(r.tool, 'focus-cost-check');
  assert.equal(r.version, '9.9.9');
  assert.equal(r.input.rows, 4);
  assert.equal(r.input.usage.effective, '30.00');
  assert.deepEqual(r.options.requireTags, ['team']);
  assert.equal(r.gate.pass, true);
  const f = r.findings.find((x) => x.id === 'untagged-cost');
  assert.deepEqual(Object.keys(f).sort(), ['details', 'fix', 'id', 'limit', 'lines', 'manual', 'message', 'severity', 'subject', 'value']);
  assert.ok(f.manual.every((m) => m.page && m.section && m.url && m.quote));
});

test('csv: one row per finding, CRLF line ends as RFC 4180 says, and the report can be read back by the reader of the tool', () => {
  const text = toCsv(check(FAILING, {}, { failOn: 'warning' }));
  assert.ok(text.endsWith('\r\n'));
  assert.ok(!/[^\r]\n/.test(text));
  const records = [];
  readCsv(text, (fields) => records.push(fields));
  assert.deepEqual(records[0], ['severity', 'id', 'subject', 'value', 'limit', 'message', 'fix', 'source_page', 'source_section', 'source_url']);
  assert.ok(records.every((r) => r.length === 10));
  const row = records.find((r) => r[1] === 'untagged-cost');
  assert.equal(row[0], 'warning');
  assert.equal(row[3], '66.7');
  assert.equal(row[4], '20');
  assert.equal(row[7], 'FOCUS 1.2, column Tags');
});

test('csv: a cell that a spreadsheet would run as a formula gets a leading quote, and commas, quotes and line breaks are quoted', () => {
  for (const start of ['=', '+', '-', '@', '\t', '\r']) assert.equal(csvCell(`${start}1+1`).replace(/^"/, '').startsWith("'"), true, JSON.stringify(start));
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('a\nb'), '"a\nb"');
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(5), '5');
  const out = toCsv(check(csv([{ cost: '10.00', Tags: tags({ a: 1 }) }]), { requireTags: ['=SUM(1)'], untaggedMax: '0' }));
  assert.ok(out.includes(",'=SUM(1),"));
});

test('text: control characters and escape sequences from names in the file cannot reach the terminal', async () => {
  const esc = String.fromCharCode(27);
  const rows = [{ cost: '10.00', Tags: '', ServiceName: `Bad${esc}[2JName`, ResourceId: `res${esc}]0;title${String.fromCharCode(7)}` }];
  const out = toText(check(csv(rows)));
  assert.ok(!out.includes(esc));
  assert.ok(!out.includes(String.fromCharCode(7)));
  assert.ok(out.includes('Bad [2JName'));
});

test('cli: --help and --version print and exit with 0, and nothing is written to the error output', async () => {
  const help = await cli(['--help']);
  assert.deepEqual([help.code, help.err], [0, '']);
  assert.equal(help.out, USAGE);
  for (const f of FINDINGS) assert.ok(help.out.includes(f.id), f.id);
  const version = await cli(['--version']);
  assert.deepEqual([version.code, version.out, version.err], [0, `${VERSION}\n`, '']);
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});

test('cli: exit code 0 when no finding is at the level, 1 when one is, and info never fails', async () => {
  const pass = await run({ 'e.csv': csv([TAGGED]) }, ['e.csv']);
  assert.equal(pass.code, 0);
  assert.match(pass.out, /GATE: PASS \(--fail-on error\)/);
  const warn = await run({ 'e.csv': FAILING }, ['e.csv']);
  assert.equal(warn.code, 0, 'a warning does not fail at the default level');
  const failWarn = await run({ 'e.csv': FAILING }, ['e.csv', '--fail-on', 'warning']);
  assert.equal(failWarn.code, 1);
  const err = await run({ 'e.csv': csv([TAGGED], { omit: ['ListCost'] }) }, ['e.csv']);
  assert.equal(err.code, 1);
  const infoOnly = await run({ 'e.csv': csv([{ cost: '10.00' }]) }, ['e.csv', '--fail-on', 'warning']);
  assert.equal(infoOnly.code, 0);
  assert.match(infoOnly.out, /INFO /);
});

test('cli: every option is passed on, and --require-tag can be given more than once', async () => {
  const rows = [{ cost: '10.00', Tags: tags({ a: 1 }) }, { cost: '10.00', Tags: tags({ b: 1 }) }];
  const r = await run({ 'e.csv': csv(rows) }, ['e.csv', '--require-tag', 'a', '--require-tag', 'b', '--untagged-max', '10', '--format', 'json', '--top', '3', '--group-by', 'category', '--spike-percent', '5', '--spike-min', '1']);
  const json = JSON.parse(r.out);
  assert.deepEqual(json.options, { failOn: 'error', requireTags: ['a', 'b'], untaggedMax: '10', spikePercent: '5', spikeMin: '1', groupBy: 'category', currency: null });
  assert.deepEqual(json.findings.filter((f) => f.id === 'tag-key-missing').map((f) => f.subject), ['a', 'b']);
});

test('cli: the formats are text, markdown, json and csv, and a name that is not one is a usage error', async () => {
  for (const [format, start] of [['text', 'focus-cost-check: e.csv'], ['markdown', '## focus-cost-check:'], ['json', '{'], ['csv', 'severity,id,']]) {
    const r = await run({ 'e.csv': FAILING }, ['e.csv', '--format', format]);
    assert.ok(r.out.startsWith(start), format);
  }
  const bad = await run({ 'e.csv': FAILING }, ['e.csv', '--format', 'xml']);
  assert.equal(bad.code, 2);
  assert.match(bad.err, /unknown format xml/);
  assert.equal(bad.out, '');
});

test('cli: a usage error is exit code 2, nothing on standard output, and the usage on the error output', async () => {
  for (const [args, pattern] of [
    [[], /give the path of the CSV file/],
    [['a.csv', 'b.csv'], /give one export file/],
    [['--bogus'], /unknown argument --bogus/],
    [['a.csv', '--format'], /--format needs a value/],
    [['a.csv', '--fail-on', 'info'], /--fail-on takes error or warning, not info/],
    [['a.csv', '--top', 'x'], /--top takes a whole number/],
    [['https://example.invalid/e.csv'], /never fetches a URL/],
    [['-'], /standard input is not supported/]
  ]) {
    const r = await cli(args);
    assert.equal(r.code, 2, args.join(' '));
    assert.equal(r.out, '');
    assert.match(r.err, pattern);
    assert.ok(r.err.includes('Usage: focus-cost-check'));
  }
});

test('cli: a file that cannot be used is exit code 2 with one line on the error output and nothing on standard output', async () => {
  for (const [files, args, pattern] of [
    [{}, ['missing.csv'], /^focus-cost-check: missing\.csv: no such file\n$/],
    [{ 'e.csv': 'a,b\n1\n' }, ['e.csv'], /line 2: 1 fields, but the header has 2/],
    [{ 'e.csv': csv([TAGGED]) }, ['e.csv', '--require-tag', ''], /--require-tag takes a tag key/],
    [{ 'e.csv': csv([{ cost: '1' }]) }, ['e.csv', '--require-tag', 'x'], /has no Tags column/],
    [{ 'e.csv': csv([TAGGED]) }, ['e.csv', '--currency', 'EUR'], /no valid rows in that currency/]
  ]) {
    const r = await run(files, args);
    assert.equal(r.code, 2, args.join(' '));
    assert.equal(r.out, '');
    assert.match(r.err, pattern);
  }
});

test('cli: the report shows the name of the file and never its folder', async () => {
  const r = await run({ 'some folder/inner/e.csv': FAILING }, ['some folder/inner/e.csv']);
  assert.ok(r.out.startsWith('focus-cost-check: e.csv\n'));
  assert.ok(!r.out.includes('some folder'));
});

test('cli: CRLF line ends, LF line ends and a byte order mark give the same report', async () => {
  const lf = await run({ 'e.csv': FAILING }, ['e.csv', '--format', 'json']);
  const crlf = await run({ 'e.csv': FAILING.replace(/\n/g, '\r\n') }, ['e.csv', '--format', 'json']);
  const bom = await run({ 'e.csv': `\uFEFF${FAILING}` }, ['e.csv', '--format', 'json']);
  assert.equal(crlf.out, lf.out);
  assert.equal(bom.out, lf.out);
  assert.equal(lf.code, 0);
});

test('cli: the same file always gives the same report', async () => {
  const a = await run({ 'e.csv': FAILING }, ['e.csv', '--format', 'json']);
  const b = await run({ 'e.csv': FAILING }, ['e.csv', '--format', 'json']);
  assert.equal(a.out, b.out);
});

test('cli: a file that is not text is refused before anything is read as CSV', async () => {
  const r = await run({ 'e.csv': Buffer.from([0x50, 0x41, 0x52, 0x31, 0, 1, 2, 3]) }, ['e.csv']);
  assert.equal(r.code, 2);
  assert.match(r.err, /Parquet file/);
});

test('parse: the arguments are read into one object, and the options of a run are not needed for --help', () => {
  const o = parseArgs(['e.csv', '--format', 'csv', '--currency', 'USD']);
  assert.equal(o.input, 'e.csv');
  assert.equal(o.format, 'csv');
  assert.equal(o.currency, 'USD');
  assert.deepEqual(o.requireTags, []);
  assert.equal(parseArgs(['--help']).help, true);
  assert.equal(parseArgs(['-v']).version, true);
});

test('bin: the command runs as a program, with the exit code of the run', () => {
  const bin = resolve(root, 'bin/focus-cost-check.js');
  const version = spawnSync(process.execPath, [bin, '--version'], { encoding: 'utf8' });
  assert.equal(version.status, 0);
  assert.equal(version.stdout, `${VERSION}\n`);
  const example = spawnSync(process.execPath, [bin, 'examples/acme-shop/export.csv', '--require-tag', 'env', '--fail-on', 'warning'], { encoding: 'utf8', cwd: root });
  assert.equal(example.status, 1);
  assert.match(example.stdout, /GATE: FAIL - 3 warnings/);
  const missing = spawnSync(process.execPath, [bin, 'nothing-here.csv'], { encoding: 'utf8', cwd: root });
  assert.equal(missing.status, 2);
  assert.equal(missing.stdout, '');
});

test('the examples: the saved example output is the output of the tool', async () => {
  const txt = await readFile(resolve(root, 'examples/output/acme-shop.txt'), 'utf8');
  assert.ok(txt.startsWith('focus-cost-check: export.csv\n'));
  const json = JSON.parse(await readFile(resolve(root, 'examples/output/acme-shop.json'), 'utf8'));
  assert.equal(json.counts.warning, 3);
  const csvText = await readFile(resolve(root, 'examples/output/acme-shop.csv'), 'utf8');
  assert.ok(csvText.includes('\r\n'));
});
