import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCALE, exceedsPercent, formatDecimal, formatPercent, parseDecimal, parseOption } from '../src/index.js';

const sum = (list) => list.map((t) => parseDecimal(t)).reduce((a, b) => a + b, 0n);

test('decimal: the values that the Numeric Format page lists as meeting the requirements are read', () => {
  assert.equal(parseDecimal('-100.2'), -1002n * SCALE / 10n);
  assert.equal(parseDecimal('-3'), -3n * SCALE);
  assert.equal(parseDecimal('4'), 4n * SCALE);
  assert.equal(parseDecimal('35.2E-7'), 3520000000000n);
  assert.equal(parseDecimal('1.234'), 1234n * SCALE / 1000n);
});

test('decimal: the values that the page lists as not meeting the requirements are refused', () => {
  for (const bad of ['1 1/2', '35.2E+7', '35.24 x 10^7', '[3,5,8]', '[4:5]', '5i + 4', 'sqrt(2)', '2.3^3', '32 GiB', '$32', '3,432,342', '+333', '', ' 1', '1 ', '1.', '.5', '--1', '1e', 'NaN', 'Infinity', '0x10', '1_000']) {
    assert.equal(parseDecimal(bad), null, JSON.stringify(bad));
  }
});

test('decimal: a positive exponent without a sign is a valid E notation', () => {
  assert.equal(parseDecimal('1.5E2'), 150n * SCALE);
  assert.equal(parseDecimal('2e0'), 2n * SCALE);
});

test('decimal: money is added exactly, with none of the drift of binary floating point', () => {
  assert.equal(0.1 + 0.2 === 0.3, false);
  assert.equal(formatDecimal(sum(['0.1', '0.2'])), '0.30');
  assert.equal(formatDecimal(sum(Array.from({ length: 1000 }, () => '0.01'))), '10.00');
  assert.equal(formatDecimal(sum(['9007199254740993.00', '1.00'])), '9007199254740994.00');
  assert.equal(formatDecimal(sum(['0.000000000000000001', '0.000000000000000002'])), '0.000000000000000003');
});

test('decimal: a value that needs more than 18 decimal places is refused, and trailing zeros do not count', () => {
  assert.equal(parseDecimal('0.0000000000000000001'), null);
  assert.equal(formatDecimal(parseDecimal('1.50000000000000000000')), '1.50');
  assert.equal(parseDecimal('1.5E-19'), null);
  assert.ok(parseDecimal('1E-18') !== null);
});

test('decimal: very long numbers are refused and do not use the memory of the machine', () => {
  assert.equal(parseDecimal('1'.repeat(31)), null);
  assert.equal(parseDecimal(`1.${'0'.repeat(61)}`), null);
  assert.equal(parseDecimal('1E999'), null);
  assert.ok(parseDecimal('1E30') !== null);
});

test('decimal: amounts are written with at least two places and no thousands separator', () => {
  assert.equal(formatDecimal(0n), '0.00');
  assert.equal(formatDecimal(parseDecimal('1234567.5')), '1234567.50');
  assert.equal(formatDecimal(parseDecimal('-0.5')), '-0.50');
  assert.equal(formatDecimal(parseDecimal('-0')), '0.00');
  assert.equal(formatDecimal(parseDecimal('0.123')), '0.123');
});

test('decimal: a percentage is rounded half up to one place on the exact values', () => {
  const d = (t) => parseDecimal(t);
  assert.equal(formatPercent(d('1'), d('3')), '33.3');
  assert.equal(formatPercent(d('2'), d('3')), '66.7');
  assert.equal(formatPercent(d('1'), d('8')), '12.5');
  assert.equal(formatPercent(d('1'), d('16')), '6.3');
  assert.equal(formatPercent(d('0'), d('5')), '0.0');
  assert.equal(formatPercent(d('5'), d('5')), '100.0');
  assert.equal(formatPercent(d('-1'), d('4')), '-25.0');
  assert.equal(formatPercent(d('1'), 0n), '0.0');
});

test('decimal: a limit is compared on the exact values, so a share exactly on the limit is not above it', () => {
  const d = (t) => parseDecimal(t);
  assert.equal(exceedsPercent(d('20'), d('100'), d('20')), false);
  assert.equal(exceedsPercent(d('20.00000000000001'), d('100'), d('20')), true);
  assert.equal(exceedsPercent(d('1'), d('3'), d('33.333333')), true);
  assert.equal(exceedsPercent(d('0'), d('3'), d('0')), false);
});

test('decimal: an option is digits with an optional decimal part and nothing else', () => {
  assert.equal(parseOption('20'), 20n * SCALE);
  assert.equal(parseOption('12.5'), 125n * SCALE / 10n);
  for (const bad of ['', '-1', '1e3', '1,5', ' 5', '5 ', 'abc', '1.1234567', '.5']) assert.equal(parseOption(bad), null, JSON.stringify(bad));
  assert.equal(parseOption('1234567', 6), null);
});
