// One pass over the records of the export. Nothing is kept per row: every number is added to a total (an exact decimal,
// see decimal.js) for the currency of the row, and the lists that a report shows (services, resources, charge periods)
// are totals by name. The checks in check.js read these totals. Tag values are never kept: a tag is read for its key
// and for whether it has a value, and only the key names that the user asked for with --require-tag are counted.

import { CHARGE_CATEGORIES, COLUMN_IDS, CSV_LIMITS, NEEDED_COLUMNS, REQUIRED_COLUMNS } from './data.js';
import { readCsv } from './csv.js';
import { InputError } from './errors.js';
import { parseDecimal } from './decimal.js';

const isNull = (v) => v === '' || v === 'NULL';
const NO_NAME = '(no name)';
const MAX_CURRENCIES = 50;

// ---- dates. A charge period is read as the calendar month of ChargePeriodStart, taken from the text, in UTC, as the
// specification requires the values to be.
const MOMENT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?Z$/;
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// Returns the moment as text with seconds, or null when it is not a valid ISO 8601 UTC moment of the form
// YYYY-MM-DDTHH:mm:ssZ (the seconds may be left out, as some exports do).
export function readMoment(text) {
  const m = MOMENT.exec(text);
  if (m === null) return null;
  const [, year, month, day, hour, minute, second = '00'] = m;
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  if (mo < 1 || mo > 12 || d < 1 || d > DAYS[mo - 1] + (mo === 2 && leap(y) ? 1 : 0)) return null;
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return null;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}

// The first moment of the month after a "YYYY-MM" period.
export function nextMonthStart(period) {
  let y = Number(period.slice(0, 4));
  let m = Number(period.slice(5, 7)) + 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-01T00:00:00Z`;
}

// ---- tags. The Tags column holds a serialized JSON object whose values are numbers, strings, true, false or null. This
// reads that flat object and nothing else: it returns a Map from key to 'value' (a value that says something), 'empty'
// (null or an empty string), or null when the text is not such an object or repeats a key.
const NUMBER = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

export function readTags(text) {
  const n = text.length;
  let i = 0;
  const skip = () => {
    while (i < n && (text[i] === ' ' || text[i] === '\t' || text[i] === '\n' || text[i] === '\r')) i += 1;
  };
  const string = () => {
    if (text[i] !== '"') return null;
    let j = i + 1;
    let escaped = false;
    while (j < n && text[j] !== '"') {
      if (text.charCodeAt(j) < 0x20) return null;
      if (text[j] === '\\') {
        escaped = true;
        j += 1;
      }
      j += 1;
    }
    if (j >= n) return null;
    const raw = text.slice(i, j + 1);
    i = j + 1;
    if (!escaped) return raw.slice(1, -1);
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  const tags = new Map();
  skip();
  if (text[i] !== '{') return null;
  i += 1;
  skip();
  if (text[i] === '}') {
    i += 1;
    skip();
    return i === n ? tags : null;
  }
  for (;;) {
    skip();
    const key = string();
    if (key === null || tags.has(key)) return null;
    skip();
    if (text[i] !== ':') return null;
    i += 1;
    skip();
    let kind;
    if (text[i] === '"') {
      const value = string();
      if (value === null) return null;
      kind = value === '' ? 'empty' : 'value';
    } else if (text.startsWith('null', i)) {
      i += 4;
      kind = 'empty';
    } else if (text.startsWith('true', i)) {
      i += 4;
      kind = 'value';
    } else if (text.startsWith('false', i)) {
      i += 5;
      kind = 'value';
    } else {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(text);
      if (m === null) return null;
      i += m[0].length;
      kind = 'value';
    }
    tags.set(key, kind);
    skip();
    if (text[i] === ',') {
      i += 1;
      continue;
    }
    if (text[i] === '}') {
      i += 1;
      skip();
      return i === n ? tags : null;
    }
    return null;
  }
}

// ---- totals
function addTo(map, key, amount, limits, what) {
  const have = map.get(key);
  if (have !== undefined) map.set(key, have + amount);
  else {
    if (map.size >= limits.maxGroups) throw new InputError(`the file has more than ${limits.maxGroups.toLocaleString('en-US')} different ${what}, so it is not a cost export that this tool reads`);
    map.set(key, amount);
  }
}

function newTotals(requireTags) {
  return {
    rows: 0,
    byCategory: Object.fromEntries(CHARGE_CATEGORIES.map((c) => [c, { rows: 0, billed: 0n, effective: 0n }])),
    usage: { rows: 0, effective: 0n, negativeRows: 0, negative: 0n },
    tags: { rows: 0, effective: 0n, untaggedRows: 0, untagged: 0n, unreadableRows: 0, unreadable: 0n, unusedRows: 0, unused: 0n, services: new Map(), resources: new Map(), resourcesOther: 0n, keys: new Map() },
    keyMissing: new Map(requireTags.map((k) => [k, { rows: 0, amount: 0n, services: new Map(), resources: new Map(), resourcesOther: 0n }])),
    owner: { rows: 0, amount: 0n, services: new Map() },
    commitment: { used: { rows: 0, amount: 0n }, unused: { rows: 0, amount: 0n }, none: { rows: 0, amount: 0n }, other: { rows: 0, amount: 0n } },
    groups: new Map(),
    months: new Map(),
    spanning: 0
  };
}

// Reads the whole text of the export and returns what the checks need. options: requireTags (list of key names),
// groupBy ('service' or 'category'), limits.
export function analyze(text, options = {}) {
  const limits = options.limits ?? CSV_LIMITS;
  const requireTags = options.requireTags ?? [];
  const groupColumn = options.groupBy === 'category' ? 'ServiceCategory' : 'ServiceName';
  const result = {
    columns: [],
    layout: null,
    missing: [],
    caseHints: {},
    unknown: [],
    rows: 0,
    analyzed: false,
    missingNeeded: [],
    invalid: new Map(),
    invalidRows: 0,
    currencies: new Map(),
    totals: new Map(),
    present: {},
    groupColumn,
    firstStart: null,
    lastStart: null
  };
  let col = null;
  let missingNeeded = [];
  const bad = (reason, line) => {
    const have = result.invalid.get(reason);
    if (have === undefined) result.invalid.set(reason, { rows: 1, lines: [line] });
    else {
      have.rows += 1;
      if (have.lines.length < 3) have.lines.push(line);
    }
  };

  function header(names) {
    const seen = new Set();
    for (const [index, name] of names.entries()) {
      if (name === '') throw new InputError(`line 1: column ${index + 1} of the header has no name`);
      if (seen.has(name)) throw new InputError(`line 1: the column ${name.length > 80 ? `${name.slice(0, 77)}...` : name} appears twice in the header`);
      seen.add(name);
    }
    result.columns = names;
    col = Object.fromEntries(names.map((n, i) => [n, i]));
    // The layout with the fewer missing mandatory columns; the earlier one when both miss the same number.
    const missingFor = (v) => REQUIRED_COLUMNS[v].filter((c) => !seen.has(c));
    const m12 = missingFor('1.2');
    const m14 = missingFor('1.4');
    result.layout = m14.length < m12.length ? '1.4' : '1.2';
    result.missing = result.layout === '1.4' ? m14 : m12;
    const lower = new Map(names.map((n) => [n.toLowerCase(), n]));
    for (const c of result.missing) if (lower.has(c.toLowerCase())) result.caseHints[c] = lower.get(c.toLowerCase());
    const known = new Set([...COLUMN_IDS['1.2'], ...COLUMN_IDS['1.4']]);
    result.unknown = names.filter((n) => !known.has(n) && !n.startsWith('x_'));
    for (const name of [...NEEDED_COLUMNS, groupColumn, 'ChargePeriodEnd', 'Tags', 'SubAccountId', 'SubAccountName', 'ResourceId', 'CommitmentDiscountId', 'CommitmentDiscountStatus']) result.present[name] = seen.has(name);
    missingNeeded = NEEDED_COLUMNS.filter((c) => !seen.has(c));
    result.analyzed = missingNeeded.length === 0;
    result.missingNeeded = missingNeeded;
    if (requireTags.length > 0 && !seen.has('Tags')) throw new InputError('--require-tag was given, but the file has no Tags column, so no tag can be checked');
  }

  function row(f, line) {
    result.rows += 1;
    if (!result.analyzed) return;
    const category = f[col.ChargeCategory];
    const currency = f[col.BillingCurrency];
    const effective = parseDecimal(f[col.EffectiveCost]);
    const billed = parseDecimal(f[col.BilledCost]);
    const start = readMoment(f[col.ChargePeriodStart]);
    let fine = true;
    if (!CHARGE_CATEGORIES.includes(category)) { bad('ChargeCategory is not one of the allowed values', line); fine = false; }
    if (!/^[A-Z]{3}$/.test(currency)) { bad('BillingCurrency is not a three-letter code', line); fine = false; }
    if (effective === null) { bad('EffectiveCost is not a number that the Numeric Format page allows, or needs more than 18 decimal places', line); fine = false; }
    if (billed === null) { bad('BilledCost is not a number that the Numeric Format page allows, or needs more than 18 decimal places', line); fine = false; }
    if (start === null) { bad('ChargePeriodStart is not a moment in the form YYYY-MM-DDTHH:mm:ssZ', line); fine = false; }
    let end = null;
    if (col.ChargePeriodEnd !== undefined) {
      end = readMoment(f[col.ChargePeriodEnd]);
      if (end === null) { bad('ChargePeriodEnd is not a moment in the form YYYY-MM-DDTHH:mm:ssZ', line); fine = false; }
      else if (start !== null && end < start) { bad('ChargePeriodEnd is before ChargePeriodStart', line); fine = false; }
    }
    if (!fine) {
      result.invalidRows += 1;
      return;
    }
    let t = result.totals.get(currency);
    if (t === undefined) {
      if (result.totals.size >= MAX_CURRENCIES) throw new InputError(`the file has more than ${MAX_CURRENCIES} different BillingCurrency values, so it is not a cost export`);
      t = newTotals(requireTags);
      result.totals.set(currency, t);
    }
    t.rows += 1;
    const c = t.byCategory[category];
    c.rows += 1;
    c.billed += billed;
    c.effective += effective;
    const month = start.slice(0, 7);
    if (result.firstStart === null || start < result.firstStart) result.firstStart = start;
    if (result.lastStart === null || start > result.lastStart) result.lastStart = start;
    if (category !== 'Usage') return;

    t.usage.rows += 1;
    t.usage.effective += effective;
    if (effective < 0n) {
      t.usage.negativeRows += 1;
      t.usage.negative += effective;
    }
    const service = isNull(f[col.ServiceName]) ? NO_NAME : f[col.ServiceName];

    // Spikes: the cost of each service (or category) in each month of ChargePeriodStart.
    const group = col[groupColumn] === undefined || isNull(f[col[groupColumn]]) ? NO_NAME : f[col[groupColumn]];
    let g = t.groups.get(group);
    if (g === undefined) {
      if (t.groups.size >= limits.maxGroups) throw new InputError(`the file has more than ${limits.maxGroups.toLocaleString('en-US')} different ${groupColumn} values, so it is not a cost export that this tool reads`);
      g = new Map();
      t.groups.set(group, g);
    }
    g.set(month, (g.get(month) ?? 0n) + effective);
    let days = t.months.get(month);
    if (days === undefined) {
      days = new Set();
      t.months.set(month, days);
    }
    days.add(start.slice(8, 10));
    if (end !== null && end > nextMonthStart(month)) t.spanning += 1;

    // Allocation: tags. The unused part of a commitment has no resource to tag, so it is left out and counted.
    const unusedCommitment = col.CommitmentDiscountStatus !== undefined && f[col.CommitmentDiscountStatus] === 'Unused';
    if (unusedCommitment) {
      t.tags.unusedRows += 1;
      t.tags.unused += effective;
    } else if (col.Tags !== undefined) {
      const raw = f[col.Tags];
      const tags = isNull(raw) ? new Map() : readTags(raw);
      const resource = col.ResourceId !== undefined && !isNull(f[col.ResourceId]) ? f[col.ResourceId] : null;
      if (tags === null) {
        t.tags.unreadableRows += 1;
        t.tags.unreadable += effective;
      } else {
        t.tags.rows += 1;
        t.tags.effective += effective;
        for (const key of tags.keys()) if (t.tags.keys.has(key) || t.tags.keys.size < limits.maxGroups) t.tags.keys.set(key, (t.tags.keys.get(key) ?? 0) + 1);
        if (tags.size === 0) {
          t.tags.untaggedRows += 1;
          t.tags.untagged += effective;
          addTo(t.tags.services, service, effective, limits, 'ServiceName values');
          addResource(t.tags, resource, effective, limits);
        }
        for (const [key, m] of t.keyMissing) {
          if (tags.get(key) === 'value') continue;
          m.rows += 1;
          m.amount += effective;
          addTo(m.services, service, effective, limits, 'ServiceName values');
          addResource(m, resource, effective, limits);
        }
      }
    }

    // Ownership: a charge with no sub account.
    const ownerColumns = ['SubAccountId', 'SubAccountName'].filter((n) => col[n] !== undefined);
    if (ownerColumns.length > 0 && ownerColumns.every((n) => isNull(f[col[n]]))) {
      t.owner.rows += 1;
      t.owner.amount += effective;
      addTo(t.owner.services, service, effective, limits, 'ServiceName values');
    }

    // Commitments.
    if (col.CommitmentDiscountId !== undefined && col.CommitmentDiscountStatus !== undefined) {
      const id = f[col.CommitmentDiscountId];
      const status = f[col.CommitmentDiscountStatus];
      const bucket = isNull(id) ? t.commitment.none : status === 'Used' ? t.commitment.used : status === 'Unused' ? t.commitment.unused : t.commitment.other;
      bucket.rows += 1;
      bucket.amount += effective;
    }
  }

  function addResource(target, resource, effective, lim) {
    if (resource === null) {
      target.resourcesOther += effective;
      return;
    }
    if (target.resources.has(resource) || target.resources.size < lim.maxResources) target.resources.set(resource, (target.resources.get(resource) ?? 0n) + effective);
    else target.resourcesOther += effective;
  }

  readCsv(text, (fields, line) => {
    if (col === null) header(fields);
    else row(fields, line);
  }, limits);
  for (const [currency, t] of result.totals) result.currencies.set(currency, t.rows);
  return result;
}
