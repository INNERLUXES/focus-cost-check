// The checks: every finding id, its severity and the sentences of the saved pages that it quotes. docs/method.md gives
// the rule of each one, and docs/rules-and-sources.md lists every sentence. An id, once released, keeps its meaning,
// because pipelines read it from the JSON and CSV reports.
//
// facts: the keys of FACTS in data.js that the finding always quotes. A finding without facts is a conclusion that no
// page states.
//
// Severity is the tool's own mapping, because the specification gives definitions and no scale: an error is a file that
// cannot be read as a FOCUS cost export or whose totals cannot be trusted (columns missing, rows that are not valid,
// several currencies); a warning is a share of cost that is hard to own (untagged cost, a missing tag key) or a rise
// from one charge period to the next; info is a number that the file shows, or a check that was not made, and it never
// fails a run.

export const SEVERITIES = ['error', 'warning', 'info'];
export const RANK = { error: 3, warning: 2, info: 1 };

export const FINDINGS = [
  // ---- errors
  { id: 'focus-columns-missing', severity: 'error', facts: ['mandatory-def', 'column-pascal'] },
  { id: 'rows-invalid', severity: 'error', facts: ['numeric-forms', 'datetime-form', 'cat-allowed'] },
  { id: 'currency-mixed', severity: 'error', facts: ['currency-def', 'currency-grouped', 'billed-currency'] },

  // ---- warnings
  { id: 'untagged-cost', severity: 'warning', facts: ['tags-use', 'eff-distribute', 'tags-null'] },
  { id: 'tag-key-missing', severity: 'warning', facts: ['tags-use', 'tags-null-value'] },
  { id: 'cost-spike', severity: 'warning', facts: ['eff-trends', 'service-name-use', 'period-start'] },

  // ---- info: never fails the run
  { id: 'focus-columns-unknown', severity: 'info', facts: ['custom-prefix', 'provider-replaced'] },
  { id: 'tags-column-missing', severity: 'info', facts: ['tags-present'] },
  { id: 'tags-unreadable', severity: 'info', facts: ['kv-json', 'kv-unique', 'kv-flat', 'kv-values'] },
  { id: 'no-owner-account', severity: 'info', facts: ['subaccount-use', 'subaccount-null'] },
  { id: 'commitment-coverage', severity: 'info', facts: ['commit-status-def', 'commit-used', 'commit-unused'] },
  { id: 'charge-category-total', severity: 'info', facts: [] },
  { id: 'check-not-run', severity: 'info', facts: [] }
];

export const ORDER = Object.fromEntries(FINDINGS.map((f, i) => [f.id, i]));

export const meetsThreshold = (severity, failOn) => RANK[severity] >= RANK[failOn];

// C0 and C1 control characters, line and paragraph separators, and the Unicode direction controls.
const UNSAFE = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f\\u2028\\u2029\\u200e\\u200f\\u202a-\\u202e\\u2066-\\u2069]', 'g');

// Text that comes from a file goes through this before it reaches a message: control, line separator and direction
// characters become a space, and the length is cut.
export function safeText(value, max = 200) {
  const text = String(value).replace(UNSAFE, ' ');
  return text.length > max ? `${text.slice(0, Math.max(0, max - 3))}...` : text;
}

// A resource ID is shown shortened: the first 16 and the last 24 characters when it is longer than 48.
export function shortId(value) {
  const text = safeText(value, 400);
  return text.length > 48 ? `${text.slice(0, 16)}...${text.slice(-24)}` : text;
}
