// Reads the export, runs the checks and returns one report. The tool reads the one file it is given and opens no
// connection. docs/method.md gives the reason behind every finding. No tag value and no cost row of the file is copied
// into a finding: a finding holds totals, the names of services and tag keys, and resource IDs shortened.

import { CHARGE_CATEGORIES, CSV_LIMITS, DEFAULTS, FACTS, LAYOUTS, presentSentence, sourceLabel, sourceUrl } from './data.js';
import { analyze } from './analyze.js';
import { InputError } from './errors.js';
import { SCALE, exceedsPercent, formatDecimal, formatPercent, parseOption } from './decimal.js';
import { FINDINGS, ORDER, RANK, SEVERITIES, meetsThreshold, safeText, shortId } from './rules.js';

export const LIMITS = { ...CSV_LIMITS };
export { FINDINGS, RANK, SEVERITIES, meetsThreshold, safeText };

const BY_ID = Object.fromEntries(FINDINGS.map((f) => [f.id, f]));
const MAX_SPIKES = 50;

function plural(count, one, many = `${one}s`) {
  return `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;
}

// The sentences of the pages that a finding quotes.
export function manualFor(id, extra = []) {
  return [...BY_ID[id].facts, ...extra].map((key) => {
    const fact = FACTS[key];
    return { page: sourceLabel(fact.source), section: fact.section, url: sourceUrl(fact.source), quote: fact.text };
  });
}

const columnQuote = (column) => ({ page: sourceLabel(`col-1.2-${column}`), section: 'Requirements', url: sourceUrl(`col-1.2-${column}`), quote: presentSentence(column) });

// Checks the options and turns the numbers into exact values. Throws InputError for a value that cannot be used.
export function readOptions(options = {}) {
  const requireTags = options.requireTags ?? [];
  for (const key of requireTags) {
    if (key === '' || key.length > 128 || /[\u0000-\u001f\u007f]/.test(key)) throw new InputError('--require-tag takes a tag key of 1 to 128 characters without control characters');
  }
  if (new Set(requireTags).size > 20) throw new InputError('--require-tag can be given at most 20 times');
  const percent = (name, text, max) => {
    const v = parseOption(String(text), String(max).length);
    if (v === null || v > BigInt(max) * SCALE) throw new InputError(`${name} takes a number from 0 to ${max}, not ${safeText(text, 40)}`);
    return v;
  };
  const spikeMin = parseOption(String(options.spikeMin ?? DEFAULTS.spikeMin));
  if (spikeMin === null) throw new InputError(`--spike-min takes an amount of 0 or more, not ${safeText(options.spikeMin, 40)}`);
  const top = options.top ?? DEFAULTS.top;
  if (!Number.isInteger(top) || top < 1 || top > 20) throw new InputError('--top takes a whole number from 1 to 20');
  const groupBy = options.groupBy ?? DEFAULTS.groupBy;
  if (groupBy !== 'service' && groupBy !== 'category') throw new InputError(`--group-by takes service or category, not ${safeText(groupBy, 40)}`);
  const currency = options.currency ?? null;
  if (currency !== null && !/^[A-Z]{3}$/.test(currency)) throw new InputError(`--currency takes a three-letter code in capitals, such as USD, not ${safeText(currency, 40)}`);
  return {
    requireTags,
    untaggedMax: percent('--untagged-max', options.untaggedMax ?? DEFAULTS.untaggedMax, 100),
    untaggedMaxText: String(options.untaggedMax ?? DEFAULTS.untaggedMax),
    spikePercent: percent('--spike-percent', options.spikePercent ?? DEFAULTS.spikePercent, 1000000),
    spikePercentText: String(options.spikePercent ?? DEFAULTS.spikePercent),
    spikeMin,
    spikeMinText: String(options.spikeMin ?? DEFAULTS.spikeMin),
    top,
    groupBy,
    currency
  };
}

const order = (a, b) => (a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

// "name  amount CUR  share percent of the total" lines for the largest entries of a map.
function topLines(map, total, top, currency, label, shorten = (s) => safeText(s, 80)) {
  const entries = [...map].filter(([, v]) => v > 0n).sort(order).slice(0, top);
  return entries.map(([name, amount]) => `${label} ${shorten(name)}: ${formatDecimal(amount)} ${currency} (${formatPercent(amount, total)} percent)`);
}

function finding(id, subject, message, fix, extra = {}) {
  return { id, severity: BY_ID[id].severity, subject, message, fix, value: extra.value ?? '', limit: extra.limit ?? '', lines: extra.lines ?? [], details: extra.details ?? {}, manual: manualFor(id, extra.facts ?? []).concat(extra.quotes ?? []) };
}

// Reads text of an export and returns the report. options: see readOptions; target is the name shown in the report.
export function checkExport(text, { target = 'export.csv', failOn = 'error', version = '0.0.0', options = {}, limits = CSV_LIMITS } = {}) {
  const o = readOptions(options);
  const a = analyze(text, { requireTags: o.requireTags, groupBy: o.groupBy, limits });
  const findings = [];
  const notes = [];

  // ---- input: the columns
  const layout = LAYOUTS[a.layout];
  if (a.missing.length > 0) {
    const hints = a.missing.filter((c) => a.caseHints[c]).map((c) => `${a.caseHints[c]} for ${c}`);
    findings.push(finding(
      'focus-columns-missing',
      'columns',
      `The file is not a FOCUS cost and usage export: ${plural(a.missing.length, 'mandatory column')} missing (${a.missing.join(', ')}). It was read against the ${layout.label}, as the saved FOCUS ${layout.saved} pages list them.${hints.length ? ` Found with another spelling: ${hints.map((h) => safeText(h, 100)).join(', ')}; column IDs are written in Pascal case.` : ''}`,
      'Export the cost and usage data in the FOCUS format and keep the column names exactly as the specification writes them.',
      { details: { missing: a.missing, layout: a.layout }, quotes: a.layout === '1.2' ? [columnQuote(a.missing[0])] : [] }
    ));
  }
  if (a.unknown.length > 0) {
    findings.push(finding(
      'focus-columns-unknown',
      'columns',
      `${plural(a.unknown.length, 'column')} in the header ${a.unknown.length === 1 ? 'is' : 'are'} in no saved FOCUS page and ${a.unknown.length === 1 ? 'has' : 'have'} no x_ prefix (${a.unknown.slice(0, 10).map((n) => safeText(n, 60)).join(', ')}${a.unknown.length > 10 ? ', ...' : ''}). The file may follow another version of FOCUS than the two that are saved (1.2 and 1.4).`,
      'Nothing to fix for this tool; the columns it reads are read by name.',
      { details: { unknown: a.unknown } }
    ));
  }
  if (!a.analyzed) notes.push(`The cost checks were not run: the file has no ${a.missingNeeded.join(', ')} column${a.missingNeeded.length === 1 ? '' : 's'}.`);

  // ---- rows that are not valid
  if (a.invalid.size > 0) {
    const lines = [...a.invalid].map(([reason, v]) => `${reason}: ${plural(v.rows, 'row')}, first at line ${v.lines.join(', ')}`);
    findings.push(finding(
      'rows-invalid',
      'rows',
      `${plural(a.invalidRows, 'row')} of ${a.rows.toLocaleString('en-US')} cannot be read as the saved pages describe them, and no total includes them.`,
      'Fix the export, or filter these rows out before the check; a cost that cannot be read as a number is not added.',
      { lines, details: { rows: a.invalidRows, reasons: Object.fromEntries([...a.invalid].map(([r, v]) => [r, v.rows])) } }
    ));
  }

  // ---- the currency
  let currency = null;
  let t = null;
  const codes = [...a.currencies.keys()].sort();
  if (a.analyzed && codes.length > 0) {
    if (o.currency !== null) {
      if (!a.totals.has(o.currency)) throw new InputError(`--currency ${o.currency}: the file has no valid rows in that currency (it has ${codes.join(', ')})`);
      currency = o.currency;
      const other = codes.filter((c) => c !== currency);
      if (other.length > 0) notes.push(`Only ${currency} rows are counted; ${other.map((c) => `${plural(a.currencies.get(c), 'row')} in ${c}`).join(' and ')} are left out.`);
    } else if (codes.length === 1) {
      currency = codes[0];
    } else {
      findings.push(finding(
        'currency-mixed',
        'BillingCurrency',
        `The file has charges in ${codes.length} currencies (${codes.map((c) => `${c}: ${plural(a.currencies.get(c), 'row')}`).join(', ')}), and costs in different currencies are never added together.`,
        'Run the tool once for each currency with --currency, for example --currency ' + codes[0] + '.',
        { details: { currencies: Object.fromEntries(codes.map((c) => [c, a.currencies.get(c)])) } }
      ));
    }
    if (currency !== null) t = a.totals.get(currency);
  } else if (a.analyzed && a.rows > 0 && a.invalidRows === a.rows) {
    notes.push('No row could be read, so no total was made.');
  }

  const input = {
    file: target,
    rows: a.rows,
    columns: a.columns.length,
    layout: { id: a.layout, label: layout.label, savedVersion: layout.saved },
    currency,
    currencies: codes.map((c) => ({ code: c, rows: a.currencies.get(c) })),
    firstChargeStart: a.firstStart,
    lastChargeStart: a.lastStart,
    periods: [],
    usage: null,
    invalidRows: a.invalidRows,
    tagKeys: 0
  };

  if (t !== null) {
    const cur = currency;
    const money = (v) => `${formatDecimal(v)} ${cur}`;
    const periods = [...t.months.keys()].sort();
    input.periods = periods.map((p) => ({ period: p, days: t.months.get(p).size }));
    input.usage = { rows: t.usage.rows, effective: formatDecimal(t.usage.effective) };
    input.tagKeys = t.tags.keys.size;
    const usage = t.usage.effective;

    // ---- allocation
    if (!a.present.Tags) {
      findings.push(finding('tags-column-missing', 'Tags', 'The file has no Tags column, so the share of cost without tags is not known. The specification asks for the column only when the provider supports tags.', 'Add the Tags column to the export if your cloud offers it.', { quotes: [] }));
    } else if (t.tags.rows > 0 && t.tags.effective > 0n) {
      const base = t.tags.effective;
      if (exceedsPercent(t.tags.untagged, base, o.untaggedMax)) {
        findings.push(finding(
          'untagged-cost',
          'Tags',
          `${formatPercent(t.tags.untagged, base)} percent of the usage cost (${money(t.tags.untagged)} of ${money(base)} effective cost) has no tags at all, above the limit of ${o.untaggedMaxText} percent.`,
          'Tag the resources that carry the cost below, or set tags on the account or project so they reach the charges; then export again.',
          {
            value: formatPercent(t.tags.untagged, base),
            limit: o.untaggedMaxText,
            lines: [...topLines(t.tags.services, t.tags.untagged, o.top, cur, 'service'), ...topLines(t.tags.resources, t.tags.untagged, o.top, cur, 'resource', shortId), ...(t.tags.resourcesOther > 0n ? [`no resource ID or not listed: ${money(t.tags.resourcesOther)} (${formatPercent(t.tags.resourcesOther, t.tags.untagged)} percent)`] : [])],
            details: { untagged: formatDecimal(t.tags.untagged), base: formatDecimal(base), rows: t.tags.untaggedRows }
          }
        ));
      }
      for (const [key, m] of t.keyMissing) {
        if (!exceedsPercent(m.amount, base, o.untaggedMax)) continue;
        findings.push(finding(
          'tag-key-missing',
          safeText(key, 128),
          `${formatPercent(m.amount, base)} percent of the usage cost (${money(m.amount)} of ${money(base)} effective cost) has no value for the tag key "${safeText(key, 128)}", above the limit of ${o.untaggedMaxText} percent. A key with no value counts as missing.`,
          `Set the tag key "${safeText(key, 128)}" on the resources below.`,
          {
            value: formatPercent(m.amount, base),
            limit: o.untaggedMaxText,
            lines: [...topLines(m.services, m.amount, o.top, cur, 'service'), ...topLines(m.resources, m.amount, o.top, cur, 'resource', shortId), ...(m.resourcesOther > 0n ? [`no resource ID or not listed: ${money(m.resourcesOther)} (${formatPercent(m.resourcesOther, m.amount)} percent)`] : [])],
            details: { key: safeText(key, 128), missing: formatDecimal(m.amount), base: formatDecimal(base), rows: m.rows }
          }
        ));
      }
      if (t.tags.resources.size >= (limits.maxResources ?? CSV_LIMITS.maxResources)) notes.push(`More than ${limits.maxResources.toLocaleString('en-US')} resource IDs have untagged cost; those beyond the first ${limits.maxResources.toLocaleString('en-US')} are counted under "no resource ID or not listed".`);
    } else {
      findings.push(finding('check-not-run', 'untagged-cost', `The share of untagged cost was not worked out: ${t.tags.rows === 0 && t.tags.unreadableRows > 0 ? 'no Tags cell could be read' : 'the usage rows add up to no cost above zero'}.`, 'Check the export.'));
    }
    if (t.tags.unreadableRows > 0) {
      findings.push(finding(
        'tags-unreadable',
        'Tags',
        `${plural(t.tags.unreadableRows, 'usage row')} (${money(t.tags.unreadable)} effective cost) ${t.tags.unreadableRows === 1 ? 'has' : 'have'} a Tags cell that is not a JSON object of keys with number, string, true, false or null values, or that repeats a key. ${t.tags.unreadableRows === 1 ? 'It is' : 'They are'} left out of the tag checks.`,
        'Export the tags as a JSON object, as the Key-Value Format page describes.',
        { details: { rows: t.tags.unreadableRows, amount: formatDecimal(t.tags.unreadable) } }
      ));
    }

    if (t.tags.unusedRows > 0 && a.present.Tags) notes.push(`${plural(t.tags.unusedRows, 'usage row')} (${money(t.tags.unused)}) with the status Unused are left out of the tag checks: the unused part of a commitment has no resource to tag.`);

    // ---- ownership
    const ownerColumns = ['SubAccountId', 'SubAccountName'].filter((n) => a.present[n]);
    if (ownerColumns.length === 0) notes.push('Ownership was not checked: the file has neither a SubAccountId nor a SubAccountName column.');
    else if (t.owner.rows > 0) {
      findings.push(finding(
        'no-owner-account',
        ownerColumns.join(' and '),
        `${plural(t.owner.rows, 'usage row')} (${money(t.owner.amount)}, ${formatPercent(t.owner.amount, usage)} percent of the usage cost) ${t.owner.rows === 1 ? 'has' : 'have'} no ${ownerColumns.join(' and no ')}. The specification says the ID is null when a charge is not related to a sub account, so this can be correct.`,
        'Nothing to fix if these charges belong to the billing account itself; otherwise map them to an account.',
        { value: formatPercent(t.owner.amount, usage), lines: topLines(t.owner.services, t.owner.amount, o.top, cur, 'service'), details: { rows: t.owner.rows, amount: formatDecimal(t.owner.amount) } }
      ));
    }

    // ---- commitments
    if (!a.present.CommitmentDiscountId || !a.present.CommitmentDiscountStatus) notes.push('Commitment coverage was not worked out: the file has no CommitmentDiscountId and CommitmentDiscountStatus columns.');
    else if (usage > 0n) {
      const c = t.commitment;
      const consumed = c.used.amount + c.none.amount + c.other.amount;
      const share = consumed > 0n ? formatPercent(c.used.amount, consumed) : '0.0';
      findings.push(finding(
        'commitment-coverage',
        'CommitmentDiscountId',
        `Commitment discounts cover ${share} percent of the consumed usage cost: ${money(c.used.amount)} with status Used and ${money(c.none.amount)} with no CommitmentDiscountId${c.other.rows > 0 ? `, and ${money(c.other.amount)} that has an id with another or no status` : ''}. The unused part of commitments is ${money(c.unused.amount)} (${plural(c.unused.rows, 'row')}). This is a number from the file, not a judgement.`,
        'Nothing to fix; read it with the commitments you hold.',
        { value: share, details: { used: formatDecimal(c.used.amount), none: formatDecimal(c.none.amount), unused: formatDecimal(c.unused.amount), other: formatDecimal(c.other.amount), usedRows: c.used.rows, noneRows: c.none.rows, unusedRows: c.unused.rows, otherRows: c.other.rows } }
      ));
    }

    // ---- credits, refunds, adjustments and the other categories
    const catFact = { Purchase: ['cat-purchase', 'eff-purchase-zero'], Tax: ['cat-tax'], Credit: ['cat-credit', 'eff-credit-billed'], Adjustment: ['cat-adjustment'] };
    for (const category of CHARGE_CATEGORIES) {
      if (category === 'Usage') continue;
      const c = t.byCategory[category];
      if (c.rows === 0) continue;
      findings.push(finding(
        'charge-category-total',
        category,
        `${category}: ${plural(c.rows, 'row')}, BilledCost ${money(c.billed)}, EffectiveCost ${money(c.effective)}. These rows are not in the usage cost that the other checks use.`,
        'Nothing to fix; this explains the difference between the usage cost and the invoice total.',
        { details: { category, rows: c.rows, billed: formatDecimal(c.billed), effective: formatDecimal(c.effective) }, facts: catFact[category] }
      ));
    }

    if (t.usage.negativeRows > 0) {
      findings.push(finding(
        'charge-category-total',
        'Usage',
        `Usage: ${plural(t.usage.negativeRows, 'row')} ${t.usage.negativeRows === 1 ? 'has' : 'have'} a negative effective cost, ${money(t.usage.negative)} in all. The page says usage charges are positive or negative, "including refunds", so these are refunds or corrections, and they are inside the usage cost that the other checks use.`,
        'Nothing to fix; this shows how much of the usage cost is a refund or a correction.',
        { details: { category: 'Usage', negativeRows: t.usage.negativeRows, negative: formatDecimal(t.usage.negative) }, facts: ['cat-usage'] }
      ));
    }

    // ---- spikes
    if (!a.present[a.groupColumn]) notes.push(`Spikes were not checked: the file has no ${a.groupColumn} column.`);
    else if (periods.length < 2) {
      findings.push(finding('check-not-run', 'cost-spike', `Spikes were not checked: the file covers ${periods.length === 1 ? 'one charge period' : 'no charge period'} (${periods.join(', ') || 'none'}), and a rise needs two.`, 'Export two or more months to see a rise.'));
    } else {
      const found = [];
      for (const [name, byMonth] of t.groups) {
        for (let i = 1; i < periods.length; i += 1) {
          const before = byMonth.get(periods[i - 1]) ?? 0n;
          const now = byMonth.get(periods[i]) ?? 0n;
          const rise = now - before;
          if (rise <= 0n || rise < o.spikeMin) continue;
          if (before > 0n && !(rise * 100n * SCALE > o.spikePercent * before)) continue;
          found.push({ name, from: periods[i - 1], to: periods[i], before, now, rise });
        }
      }
      found.sort((x, y) => (x.rise > y.rise ? -1 : x.rise < y.rise ? 1 : x.name < y.name ? -1 : x.name > y.name ? 1 : x.to < y.to ? -1 : 1));
      for (const s of found.slice(0, MAX_SPIKES)) {
        const daysFrom = t.months.get(s.from).size;
        const daysTo = t.months.get(s.to).size;
        const pct = s.before > 0n ? formatPercent(s.rise, s.before) : '';
        findings.push(finding(
          'cost-spike',
          safeText(s.name, 100),
          `${safeText(s.name, 100)}: effective cost went from ${money(s.before)} in ${s.from} to ${money(s.now)} in ${s.to}, a rise of ${money(s.rise)}${s.before > 0n ? ` (${pct} percent, above the limit of ${o.spikePercentText} percent)` : ' (there was no cost in the earlier period)'}.${daysFrom !== daysTo ? ` The file has ${plural(daysFrom, 'day')} of data in ${s.from} and ${plural(daysTo, 'day')} in ${s.to}.` : ''}`,
          'Open the charges of this service in the later period and find the resource or the change that caused the rise.',
          { value: pct, limit: o.spikePercentText, details: { group: o.groupBy, from: s.from, to: s.to, before: formatDecimal(s.before), now: formatDecimal(s.now), rise: formatDecimal(s.rise), daysFrom, daysTo } }
        ));
      }
      if (found.length > MAX_SPIKES) notes.push(`${plural(found.length - MAX_SPIKES, 'more rise')} above the limit ${found.length - MAX_SPIKES === 1 ? 'is' : 'are'} not listed; the ${MAX_SPIKES} largest are.`);
    }
    if (t.spanning > 0) notes.push(`${plural(t.spanning, 'usage row')} run${t.spanning === 1 ? 's' : ''} past the end of the month in ChargePeriodStart; they are counted in the month of ChargePeriodStart.`);
    if (t.tags.keys.size >= limits.maxGroups) notes.push('The list of tag keys was cut at its limit.');
  }

  findings.sort((x, y) => ORDER[x.id] - ORDER[y.id]);
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s).length]));
  const failing = SEVERITIES.filter((s) => meetsThreshold(s, failOn) && counts[s] > 0);
  const pass = failing.length === 0;
  const reason = failing.map((s) => `${counts[s]} ${counts[s] === 1 ? s : `${s}s`}`).join(' and ');
  return {
    tool: 'focus-cost-check',
    version,
    target,
    input,
    options: { failOn, requireTags: o.requireTags, untaggedMax: o.untaggedMaxText, spikePercent: o.spikePercentText, spikeMin: o.spikeMinText, groupBy: o.groupBy, currency: o.currency },
    findings,
    notes,
    counts,
    gate: { pass, failOn, reason: pass ? '' : reason }
  };
}
