import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CSV_LIMITS, InputError, checkExport, decodeCsv, main, readCsv, readTags } from '../src/index.js';
import { check, csv, find, ids, run, tags } from './helpers.js';

// Hostile input. Each test has a time limit, because the way these inputs fail is by taking very long or by using the
// memory of the machine. A refusal is an InputError with a message; nothing else may be thrown.
const LIMIT = { timeout: 20000 };

function refused(fn, pattern) {
  assert.throws(fn, (e) => e instanceof InputError && pattern.test(e.message), String(pattern));
}

const read = (text, limits = CSV_LIMITS) => readCsv(text, () => {}, limits);

test('hostile: unbalanced quotes at the start, in the middle and at the end of a file are refused', LIMIT, () => {
  refused(() => read('"'), /a quoted field never ends/);
  refused(() => read('a,b\n1,"2\n3,4\n'), /^line 2: a quoted field never ends/);
  refused(() => read('a,b\n1,2"\n'), /a quote inside a field/);
  refused(() => read('a,b\n"1"",2\n'), /a quoted field never ends/);
  refused(() => read(`a,b\n1,"${'x'.repeat(1000)}`), /a quoted field never ends/);
});

test('hostile: a million quotes in a row are read in linear time, and an odd number of them is refused', LIMIT, () => {
  const even = `a\n"${'""'.repeat(500)}"\n`;
  assert.equal(read(even), 1);
  const text = `a\n"${'""'.repeat(250000)}`;
  const start = Date.now();
  refused(() => read(text, { ...CSV_LIMITS, maxFieldChars: 10000000 }), /a quoted field never ends/);
  assert.ok(Date.now() - start < 5000);
});

test('hostile: a field longer than the limit is refused, quoted or not, and the file is not read to its end first', LIMIT, () => {
  refused(() => read(`a\n${'x'.repeat(CSV_LIMITS.maxFieldChars + 1)}\n`), /a field is longer than 65,536 characters/);
  refused(() => read(`a\n"${'x'.repeat(CSV_LIMITS.maxFieldChars + 1)}"\n`), /a field is longer than 65,536 characters/);
  refused(() => read(`a\n"${'x\n'.repeat(CSV_LIMITS.maxFieldChars)}"\n`), /a field is longer than 65,536 characters/);
  assert.equal(read(`a\n${'x'.repeat(CSV_LIMITS.maxFieldChars)}\n`), 1);
});

test('hostile: very many columns are refused, at the header and at a record', LIMIT, () => {
  refused(() => read(`${Array.from({ length: 100000 }, (_, i) => `c${i}`).join(',')}\n`), /more than 500 columns/);
  refused(() => read(`a,b\n${','.repeat(100000)}\n`), /more than 500 columns|2 fields|fields, but the header has 2/);
  assert.equal(read(`${Array.from({ length: 500 }, (_, i) => `c${i}`).join(',')}\n`), 0);
});

test('hostile: a file of very many short records is refused at the record limit and not read further', LIMIT, () => {
  const limits = { ...CSV_LIMITS, maxRows: 1000 };
  refused(() => read(`a\n${'1\n'.repeat(5000)}`, limits), /more than 1,000 records/);
  assert.equal(read(`a\n${'1\n'.repeat(1000)}`, limits), 1000);
});

test('hostile: a file of 100,000 rows is checked in a few seconds', LIMIT, () => {
  const rows = Array.from({ length: 100000 }, (_, i) => ({ cost: '1.25', Tags: i % 3 === 0 ? '' : tags({ team: 't', env: 'p' }), ServiceName: `Service ${i % 50}`, ResourceId: `r-${i}` }));
  const text = csv(rows);
  const start = Date.now();
  const r = check(text, { requireTags: ['team'] });
  assert.ok(Date.now() - start < 15000);
  assert.equal(r.input.usage.effective, '125000.00');
  assert.equal(find(r, 'untagged-cost')[0].value, '33.3');
});

test('hostile: binary bytes are refused as not text, whatever their place in the file', LIMIT, () => {
  refused(() => decodeCsv(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])), /not text/);
  refused(() => decodeCsv(Buffer.concat([Buffer.from('a,b\n1,2\n'), Buffer.from([0x00]), Buffer.from('3,4\n')])), /byte 0x00 at offset 8/);
  const random = Buffer.alloc(4096);
  for (let i = 0; i < random.length; i += 1) random[i] = (i * 131 + 7) % 256;
  refused(() => decodeCsv(random), /not text|not valid UTF-8|compressed|zip|Parquet|UTF-16/);
});

test('hostile: a file with a huge number of control bytes is refused at the first one', LIMIT, () => {
  const buffer = Buffer.alloc(5 * 1024 * 1024, 0x01);
  const start = Date.now();
  refused(() => decodeCsv(buffer), /byte 0x01 at offset 0/);
  assert.ok(Date.now() - start < 2000);
});

test('hostile: a Tags cell nested 100,000 levels deep is unreadable, with no stack overflow', LIMIT, () => {
  const deep = `${'{"a":'.repeat(100000)}1${'}'.repeat(100000)}`;
  assert.equal(readTags(deep), null);
  assert.equal(readTags(`[${'['.repeat(100000)}`), null);
  const limits = { ...CSV_LIMITS, maxFieldChars: 10000000 };
  const r = checkExport(csv([{ cost: '1.00', Tags: deep }]), { limits });
  assert.equal(find(r, 'tags-unreadable')[0].details.rows, 1);
});

test('hostile: a Tags cell with thousands of keys and one with a very long key are read without trouble', LIMIT, () => {
  const object = {};
  for (let i = 0; i < 2000; i += 1) object[`key${i}`] = 'v';
  assert.equal(readTags(JSON.stringify(object)).size, 2000);
  assert.equal(readTags(JSON.stringify({ [`k${'x'.repeat(50000)}`]: 1 })).size, 1);
  assert.equal(readTags(`{"a":"${'\\'.repeat(2)}${'x'.repeat(50000)}`), null);
});

test('hostile: more distinct services than the limit is an input error, and not a slow run or a lost total', LIMIT, () => {
  const limits = { ...CSV_LIMITS, maxGroups: 50 };
  const rows = Array.from({ length: 60 }, (_, i) => ({ cost: '1.00', ServiceName: `s${i}`, Tags: '' }));
  refused(() => checkExport(csv(rows), { limits }), /more than 50 different/);
});

test('hostile: more distinct resources than the limit are counted as not listed, and the totals stay exact', LIMIT, () => {
  const limits = { ...CSV_LIMITS, maxResources: 10 };
  const rows = Array.from({ length: 30 }, (_, i) => ({ cost: '1.00', ResourceId: `r${i}`, Tags: '' }));
  const r = checkExport(csv(rows), { limits });
  const [f] = find(r, 'untagged-cost');
  assert.equal(f.details.untagged, '30.00');
  assert.ok(f.lines.some((l) => l.startsWith('no resource ID or not listed: 20.00 USD')));
  assert.ok(r.notes.some((n) => /More than 10 resource IDs have untagged cost/.test(n)));
});

test('hostile: more than 50 currencies is an input error', LIMIT, () => {
  const codes = Array.from({ length: 60 }, (_, i) => `${String.fromCharCode(65 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}Z`);
  refused(() => checkExport(csv(codes.map((c) => ({ cost: '1.00', BillingCurrency: c })))), /more than 50 different BillingCurrency values/);
});

test('hostile: a header made of cost-like names, a header with a line break and one with a quote are read as names and nothing else', LIMIT, () => {
  const text = 'a,"b\nc","d""e"\n1,2,3\n';
  const names = [];
  readCsv(text, (fields) => names.push(fields), CSV_LIMITS);
  assert.deepEqual(names[0], ['a', 'b\nc', 'd"e']);
  const r = checkExport(text);
  assert.ok(ids(r).includes('focus-columns-missing'));
  assert.ok(ids(r).includes('focus-columns-unknown'));
  assert.ok(r.notes.some((n) => /cost checks were not run/.test(n)));
});

test('hostile: a name that is a prototype key, a formula or a very long text is only a name', LIMIT, () => {
  const rows = [{ cost: '10.00', Tags: '', ServiceName: '__proto__' }, { cost: '10.00', Tags: '', ServiceName: 'constructor' }, { cost: '10.00', Tags: '', ServiceName: `=${'A'.repeat(5000)}` }];
  const r = check(csv(rows));
  const [f] = find(r, 'untagged-cost');
  assert.equal(f.value, '100.0');
  assert.ok(f.lines.every((l) => l.length < 200));
  assert.equal({}.polluted, undefined);
});

test('hostile: standard input, a URL, a device and a folder as the file are refused without reading them', LIMIT, async () => {
  for (const args of [['-'], ['http://example.invalid/e.csv'], ['file:///etc/passwd']]) {
    let out = '';
    const code = await main(args, { out: (t) => { out += t; }, err: () => {} });
    assert.equal(code, 2);
    assert.equal(out, '');
  }
  const folder = await run({ 'sub/x.csv': 'a\n' }, ['sub']);
  assert.equal(folder.code, 2);
  assert.match(folder.err, /is a folder/);
});

test('hostile: a size limit set for the run refuses a file that is over it, from its size', LIMIT, async () => {
  const text = csv([{ cost: '1.00' }]);
  const limits = { ...CSV_LIMITS, maxFileBytes: text.length - 1 };
  let err = '';
  const { withFiles } = await import('./helpers.js');
  const code = await withFiles({ 'e.csv': text }, (dir) => main(['e.csv'], { out: () => {}, err: (t) => { err += t; } }, limits, dir));
  assert.equal(code, 2);
  assert.match(err, /over the .* limit, so it was not read/);
});
