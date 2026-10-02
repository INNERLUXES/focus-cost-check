import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, nextMonthStart, readMoment, readTags } from '../src/index.js';
import { csv, tags } from './helpers.js';

test('moment: a UTC time in the form of the Date/Time Format page is read, with or without seconds', () => {
  assert.equal(readMoment('2024-01-01T00:00:00Z'), '2024-01-01T00:00:00Z');
  assert.equal(readMoment('2024-01-01T00:00Z'), '2024-01-01T00:00:00Z');
  assert.equal(readMoment('2024-12-31T23:59:59Z'), '2024-12-31T23:59:59Z');
});

test('moment: a time with an offset, a date alone, a space, a fraction or a lower-case z is refused', () => {
  for (const bad of ['2024-01-01T00:00:00+01:00', '2024-01-01', '2024-01-01 00:00:00Z', '2024-01-01T00:00:00.5Z', '2024-01-01T00:00:00z', '', '24-01-01T00:00:00Z', '2024-1-1T00:00:00Z']) assert.equal(readMoment(bad), null, bad);
});

test('moment: a day that the month does not have, and a time that the clock does not have, are refused', () => {
  assert.equal(readMoment('2024-02-30T00:00:00Z'), null);
  assert.equal(readMoment('2023-02-29T00:00:00Z'), null);
  assert.equal(readMoment('2024-02-29T00:00:00Z'), '2024-02-29T00:00:00Z');
  assert.equal(readMoment('2100-02-29T00:00:00Z'), null);
  assert.equal(readMoment('2000-02-29T00:00:00Z'), '2000-02-29T00:00:00Z');
  assert.equal(readMoment('2024-13-01T00:00:00Z'), null);
  assert.equal(readMoment('2024-00-10T00:00:00Z'), null);
  assert.equal(readMoment('2024-01-01T24:00:00Z'), null);
  assert.equal(readMoment('2024-01-01T00:60:00Z'), null);
  assert.equal(readMoment('2024-01-01T00:00:60Z'), null);
});

test('moment: the first moment of the next month, across the end of a year', () => {
  assert.equal(nextMonthStart('2024-01'), '2024-02-01T00:00:00Z');
  assert.equal(nextMonthStart('2024-12'), '2025-01-01T00:00:00Z');
});

test('tags: a flat object of keys with string, number, true, false and null values is read', () => {
  const t = readTags('{"team":"web","n":3,"x":-1.5e3,"on":true,"off":false,"gone":null,"blank":""}');
  assert.deepEqual([...t], [['team', 'value'], ['n', 'value'], ['x', 'value'], ['on', 'value'], ['off', 'value'], ['gone', 'empty'], ['blank', 'empty']]);
});

test('tags: an empty object, with or without space, has no keys', () => {
  assert.equal(readTags('{}').size, 0);
  assert.equal(readTags(' { } ').size, 0);
});

test('tags: white space, escapes and non-ASCII letters in keys are read', () => {
  const t = readTags(' {\n "a b" : "x" ,\t"\\u00e9": 1, "q\\"uote": 2 } ');
  assert.deepEqual([...t.keys()], ['a b', String.fromCharCode(0xe9), 'q"uote']);
});

test('tags: text that is not a flat object is refused, and so is a key that appears twice', () => {
  for (const bad of ['', 'null', '[]', '"x"', '1', '{', '{"a"}', '{"a":}', '{"a":1,}', '{,}', '{"a":1 "b":2}', '{"a":{"b":1}}', '{"a":[1]}', '{a:1}', "{'a':1}", '{"a":1}x', '{"a":tru}', '{"a":01x}', '{"a":1,"a":2}', '{"a":"x\ny"}', '{"a":"\\x"}']) {
    assert.equal(readTags(bad), null, JSON.stringify(bad));
  }
});

test('tags: a key such as __proto__ is only a key', () => {
  const t = readTags('{"__proto__":"x","constructor":"y"}');
  assert.deepEqual([...t.keys()], ['__proto__', 'constructor']);
  assert.equal({}.polluted, undefined);
});

test('analyze: the header is checked against the mandatory columns of both saved layouts, and the earlier one wins a tie', () => {
  const text = csv([{ cost: '1.00' }]);
  const a = analyze(text);
  assert.equal(a.layout, '1.2');
  assert.deepEqual(a.missing, []);
  const later = csv([{ cost: '1.00', ServiceProviderName: 'X', HostProviderName: 'Y' }], { omit: ['ProviderName', 'PublisherName'] });
  const b = analyze(later);
  assert.equal(b.layout, '1.4');
  assert.deepEqual(b.missing, []);
  const neither = analyze('a,b\n1,2\n');
  assert.equal(neither.layout, '1.2');
  assert.equal(neither.missing.length, 21);
});

test('analyze: a column that appears twice, or has no name, is an input error', () => {
  assert.throws(() => analyze('a,a\n1,2\n'), /the column a appears twice in the header/);
  assert.throws(() => analyze('a,,b\n1,2,3\n'), /column 2 of the header has no name/);
});

test('analyze: --require-tag without a Tags column is an input error, and with one it is fine', () => {
  assert.throws(() => analyze(csv([{ cost: '1' }]), { requireTags: ['env'] }), /--require-tag was given, but the file has no Tags column/);
  assert.doesNotThrow(() => analyze(csv([{ cost: '1', Tags: tags({ env: 'x' }) }]), { requireTags: ['env'] }));
});

test('analyze: a row with a bad value is counted by reason, left out of the totals, and its line is kept (three at most)', () => {
  const rows = [{ cost: '1.00' }, { EffectiveCost: '1,5' }, { EffectiveCost: '+2' }, { EffectiveCost: 'x' }, { EffectiveCost: '' }, { cost: '2.00' }];
  const a = analyze(csv(rows));
  assert.equal(a.rows, 6);
  assert.equal(a.invalidRows, 4);
  const [reason, v] = [...a.invalid][0];
  assert.match(reason, /^EffectiveCost is not a number/);
  assert.equal(v.rows, 4);
  assert.deepEqual(v.lines, [3, 4, 5]);
  assert.equal(a.totals.get('USD').usage.rows, 2);
});
