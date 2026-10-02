import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CSV_LIMITS, InputError, readCsv } from '../src/index.js';

// Reads text and returns the records with their line numbers.
function read(text, limits = CSV_LIMITS) {
  const records = [];
  const rows = readCsv(text, (fields, line) => records.push({ fields, line }), limits);
  return { records, rows };
}

const fieldsOf = (text, limits) => read(text, limits).records.map((r) => r.fields);

test('csv: LF line ends, CRLF line ends and no final line end give the same records', () => {
  const expected = [['a', 'b'], ['1', '2'], ['3', '4']];
  assert.deepEqual(fieldsOf('a,b\n1,2\n3,4\n'), expected);
  assert.deepEqual(fieldsOf('a,b\r\n1,2\r\n3,4\r\n'), expected);
  assert.deepEqual(fieldsOf('a,b\n1,2\n3,4'), expected);
  assert.deepEqual(fieldsOf('a,b\r\n1,2\r\n3,4'), expected);
});

test('csv: a quoted field holds commas, quotes written twice, and line breaks of both kinds', () => {
  const text = 'a,b,c\n"x,y","say ""hi""","line1\r\nline2\nline3"\n';
  assert.deepEqual(fieldsOf(text)[1], ['x,y', 'say "hi"', 'line1\r\nline2\nline3']);
});

test('csv: line numbers count the line breaks inside quoted fields', () => {
  const { records } = read('a,b\n"x\ny\nz",1\n2,3\n');
  assert.deepEqual(records.map((r) => r.line), [1, 2, 5]);
  const crlf = read('a,b\r\n"x\r\ny",1\r\n2,3\r\n');
  assert.deepEqual(crlf.records.map((r) => r.line), [1, 2, 4]);
});

test('csv: empty fields at the start, in the middle and at the end of a record are kept', () => {
  assert.deepEqual(fieldsOf('a,b,c\n,,\n1,,3\n,2,\n'), [['a', 'b', 'c'], ['', '', ''], ['1', '', '3'], ['', '2', '']]);
  assert.deepEqual(fieldsOf('a,b\n1,'), [['a', 'b'], ['1', '']]);
});

test('csv: an empty quoted field is an empty field, and spaces are kept', () => {
  assert.deepEqual(fieldsOf('a,b\n"", x \n'), [['a', 'b'], ['', ' x ']]);
});

test('csv: a header of one column and an empty value is a record, a final line break is not', () => {
  assert.deepEqual(fieldsOf('a\n\n1\n'), [['a'], [''], ['1']]);
  assert.deepEqual(fieldsOf('a\n1\n'), [['a'], ['1']]);
});

test('csv: the number of data records is returned, and the header is not one of them', () => {
  assert.equal(read('a,b\n1,2\n3,4\n').rows, 2);
  assert.equal(read('a,b\n').rows, 0);
});

test('csv: a quote that is never closed is refused with the line where it opens', () => {
  assert.throws(() => read('a,b\n1,"never ends\n2,3\n'), (e) => e instanceof InputError && /^line 2: a quoted field never ends/.test(e.message));
  assert.throws(() => read('"a,b\n'), /line 1: a quoted field never ends/);
  assert.throws(() => read('a,b\n"'), /line 2: a quoted field never ends/);
});

test('csv: a quote inside a field that does not start with a quote is refused', () => {
  assert.throws(() => read('a,b\n1,ab"c\n'), (e) => e instanceof InputError && /^line 2: a quote inside a field that does not start with a quote/.test(e.message));
  assert.throws(() => read('a,b\n1, "x"\n'), /a quote inside a field/);
});

test('csv: text after the closing quote is refused', () => {
  assert.throws(() => read('a,b\n"x"y,2\n'), (e) => e instanceof InputError && /^line 2: text after the closing quote/.test(e.message));
  assert.throws(() => read('a,b\n"x" ,2\n'), /text after the closing quote/);
});

test('csv: a carriage return that is not followed by a line feed is refused, in and out of a quoted field it is data', () => {
  assert.throws(() => read('a,b\r1,2\r'), /a carriage return that is not followed by a line feed/);
  assert.deepEqual(fieldsOf('a,b\n"x\ry",2\n')[1], ['x\ry', '2']);
});

test('csv: a record with another number of fields than the header is refused with both numbers', () => {
  assert.throws(() => read('a,b,c\n1,2\n'), (e) => e instanceof InputError && /^line 2: 2 fields, but the header has 3/.test(e.message));
  assert.throws(() => read('a,b\n1,2,3\n'), /3 fields, but the header has 2/);
});

test('csv: an empty line in the middle is refused, and an empty file and an empty first line are refused', () => {
  assert.throws(() => read('a,b\n1,2\n\n3,4\n'), /^line 3: an empty line|line 3: an empty line/);
  assert.throws(() => read(''), /the file is empty/);
  assert.throws(() => read('\na,b\n'), /line 1: the first line is empty/);
});

test('csv: the limits on records, columns, the length of a field and of the header are errors', () => {
  const limits = { ...CSV_LIMITS, maxRows: 2, maxColumns: 3, maxFieldChars: 5, maxHeaderChars: 20 };
  assert.equal(read('a,b\n1,2\n3,4\n', limits).rows, 2);
  assert.throws(() => read('a,b\n1,2\n3,4\n5,6\n', limits), /more than 2 records/);
  assert.throws(() => read('a,b,c,d\n', limits), /more than 3 columns/);
  assert.throws(() => read('a,b\n123456,2\n', limits), /longer than 5 characters/);
  assert.throws(() => read('a,b\n"123456",2\n', limits), /longer than 5 characters/);
  assert.throws(() => read(`${'h'.repeat(21)},b\n`, { ...CSV_LIMITS, maxHeaderChars: 20 }), /the header line is too long/);
});

test('csv: the line separator and paragraph separator characters are data, not line ends', () => {
  const text = `a,b\n1\u2028x,\u20292\n`;
  assert.deepEqual(fieldsOf(text)[1], ['1\u2028x', '\u20292']);
});
