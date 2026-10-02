// A strict CSV reader of its own. It reads RFC 4180 and nothing more, so the tool decides what it accepts and what it
// refuses. Accepted: fields separated by commas, records ended by CRLF or LF, fields in double quotes with a quote written
// twice, and commas, quotes and line breaks inside a quoted field. Refused, each with a line number: a quote inside a
// field that does not start with a quote, text after the closing quote, a quote that is never closed, a carriage return
// that is not followed by a line feed, a record with another number of fields than the header, and an empty line.
// Limits on the number of records, columns and the length of a field stop a file that is not a cost export.
// The reader works on one string and never builds a list of all records: it calls a function for each record.

import { InputError } from './errors.js';
import { CSV_LIMITS } from './data.js';

const COMMA = 44;
const CR = 13;
const LF = 10;
const QUOTE = 34;

function lineError(line, message) {
  return new InputError(`line ${line.toLocaleString('en-US')}: ${message}`);
}

// Reads text and calls onRecord(fields, line) for every record, the header first. Returns the number of data records.
// A trailing line break after the last record is allowed; nothing else after it is.
export function readCsv(text, onRecord, limits = CSV_LIMITS) {
  const n = text.length;
  let i = 0;
  let line = 1;
  let width = -1;
  let rows = 0;
  while (i < n) {
    const startLine = line;
    const fields = [];
    for (;;) {
      if (fields.length >= limits.maxColumns) throw lineError(startLine, `more than ${limits.maxColumns} columns`);
      if (text.charCodeAt(i) === QUOTE) {
        let j = i + 1;
        let value = '';
        for (;;) {
          const k = text.indexOf('"', j);
          if (k < 0) throw lineError(startLine, 'a quoted field never ends: the quote that opens it has no closing quote');
          value += text.slice(j, k);
          if (value.length > limits.maxFieldChars) throw lineError(startLine, `a field is longer than ${limits.maxFieldChars.toLocaleString('en-US')} characters`);
          if (text.charCodeAt(k + 1) === QUOTE) {
            value += '"';
            j = k + 2;
          } else {
            j = k + 1;
            break;
          }
        }
        for (let at = text.indexOf('\n', i); at >= 0 && at < j; at = text.indexOf('\n', at + 1)) line += 1;
        fields.push(value);
        i = j;
        const c = text.charCodeAt(i);
        if (i < n && c !== COMMA && c !== CR && c !== LF) throw lineError(line, 'text after the closing quote of a field');
      } else {
        let j = i;
        let c = 0;
        while (j < n) {
          c = text.charCodeAt(j);
          if (c === COMMA || c === CR || c === LF) break;
          if (c === QUOTE) throw lineError(line, 'a quote inside a field that does not start with a quote');
          j += 1;
        }
        if (j - i > limits.maxFieldChars) throw lineError(line, `a field is longer than ${limits.maxFieldChars.toLocaleString('en-US')} characters`);
        fields.push(text.slice(i, j));
        i = j;
      }
      const c = text.charCodeAt(i);
      if (i >= n) break;
      if (c === COMMA) {
        i += 1;
        if (i >= n) {
          fields.push('');
          break;
        }
        continue;
      }
      if (c === CR) {
        if (text.charCodeAt(i + 1) !== LF) throw lineError(line, 'a carriage return that is not followed by a line feed');
        i += 2;
      } else {
        i += 1;
      }
      line += 1;
      break;
    }
    if (width < 0) {
      width = fields.length;
      if (width === 1 && fields[0] === '') throw lineError(startLine, 'the first line is empty, so there is no header');
      if (i > limits.maxHeaderChars) throw lineError(startLine, 'the header line is too long');
    } else {
      rows += 1;
      if (rows > limits.maxRows) throw lineError(startLine, `more than ${limits.maxRows.toLocaleString('en-US')} records`);
    }
    if (fields.length !== width) {
      if (fields.length === 1 && fields[0] === '') throw lineError(startLine, 'an empty line');
      throw lineError(startLine, `${fields.length} fields, but the header has ${width}`);
    }
    onRecord(fields, startLine);
  }
  if (width < 0) throw new InputError('the file is empty');
  return rows;
}
