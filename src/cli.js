// Command line: focus-cost-check <export.csv> [options]

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CSV_LIMITS, DEFAULTS } from './data.js';
import { FINDINGS, checkExport } from './check.js';
import { InputError, decodeCsv, displayName, readExportFile } from './files.js';
import { safeText } from './rules.js';
import { toText, toMarkdown, toJson, toCsv } from './report.js';

export const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

const FORMATS = { text: toText, markdown: toMarkdown, json: toJson, csv: toCsv };
const THRESHOLDS = ['error', 'warning'];

export const USAGE = `Usage: focus-cost-check <export.csv> [options]

Reads a cloud cost and usage export in the FinOps Open Cost and Usage Specification (FOCUS) format, as CSV, and reports
what makes the spend hard to own or control: cost with no tags, cost without a required tag key, cost with no account
owner, a rise in a service from one charge period to the next, the share covered by commitment discounts, and the credits,
adjustments and taxes that explain the totals. Money is added as exact decimals and never across currencies. It reads that
one file only: it never calls a cloud or opens a connection, and it never shows a tag value or a row of the file.

Options:
  --format <name>          text, markdown, json or csv (default: text)
  --fail-on <level>        exit with 1 when a finding is at this level or above: error or warning
                           (default: error); info never fails the run
  --require-tag <key>      a tag key that every charge should carry; repeat the option for more keys
  --untagged-max <pct>     warn above this percent of usage cost with no tags, or without a required key
                           (default: ${DEFAULTS.untaggedMax})
  --spike-percent <pct>    warn when a service rises by more than this percent from one charge period to the next
                           (default: ${DEFAULTS.spikePercent})
  --spike-min <amount>     ignore a rise smaller than this amount, in the currency of the file (default: ${DEFAULTS.spikeMin})
  --group-by <name>        compare charge periods by service (ServiceName) or category (ServiceCategory)
                           (default: ${DEFAULTS.groupBy})
  --currency <code>        count only the rows in this BillingCurrency; needed when the file has several
  --top <n>                list this many services and resources in a finding, 1 to 20 (default: ${DEFAULTS.top})
  --help                   show this text
  --version                show the version

Checks: ${FINDINGS.map((f) => f.id).join(', ')}

Exit codes: 0 no finding at the --fail-on level, 1 such a finding, 2 usage or input error (a file that is not text, a
file over a limit, broken CSV, an option that cannot be used).
`;

export function parseArgs(argv) {
  const o = { input: null, format: 'text', failOn: 'error', requireTags: [], untaggedMax: undefined, spikePercent: undefined, spikeMin: undefined, groupBy: undefined, currency: undefined, top: undefined, help: false, version: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`);
      i += 1;
      return v;
    };
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--version' || a === '-v') o.version = true;
    else if (a === '--format') o.format = next();
    else if (a === '--fail-on') o.failOn = next();
    else if (a === '--require-tag') o.requireTags.push(next());
    else if (a === '--untagged-max') o.untaggedMax = next();
    else if (a === '--spike-percent') o.spikePercent = next();
    else if (a === '--spike-min') o.spikeMin = next();
    else if (a === '--group-by') o.groupBy = next();
    else if (a === '--currency') o.currency = next();
    else if (a === '--top') {
      const v = next();
      if (!/^\d{1,3}$/.test(v)) throw new Error(`--top takes a whole number from 1 to 20, not ${v}`);
      o.top = Number(v);
    } else if (a === '-') throw new Error('reading from standard input is not supported; write the export to a file and give its path');
    else if (a.startsWith('-')) throw new Error(`unknown argument ${a}`);
    else if (o.input !== null) throw new Error('give one export file');
    else o.input = a;
  }
  if (!o.help && !o.version) {
    if (o.input === null) throw new Error('give the path of the CSV file of the cost and usage export');
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(o.input)) throw new Error('give a local path; the tool never fetches a URL');
    if (!Object.hasOwn(FORMATS, o.format)) throw new Error(`unknown format ${o.format} (text, markdown, json or csv)`);
    if (!THRESHOLDS.includes(o.failOn)) throw new Error(`--fail-on takes error or warning, not ${o.failOn}`);
  }
  return o;
}

const clean = (text) => safeText(text, 1000);

// Exit code: 0 no finding at the --fail-on level, 1 such a finding, 2 usage or input error. base is the folder that a
// relative path is worked out from.
export async function main(argv, io = { out: (t) => process.stdout.write(t), err: (t) => process.stderr.write(t) }, limits = CSV_LIMITS, base = process.cwd()) {
  let o;
  try {
    o = parseArgs(argv);
  } catch (error) {
    io.err(`focus-cost-check: ${clean(error.message)}\n\n${USAGE}`);
    return 2;
  }
  if (o.help) {
    io.out(USAGE);
    return 0;
  }
  if (o.version) {
    io.out(`${VERSION}\n`);
    return 0;
  }
  let report;
  try {
    const path = resolve(base, o.input);
    const buffer = await readExportFile(path, limits);
    const name = displayName(path);
    const options = { requireTags: o.requireTags, untaggedMax: o.untaggedMax, spikePercent: o.spikePercent, spikeMin: o.spikeMin, groupBy: o.groupBy, currency: o.currency, top: o.top };
    report = checkExport(decodeCsv(buffer, name), { target: name, failOn: o.failOn, version: VERSION, options, limits });
  } catch (error) {
    if (!(error instanceof InputError)) throw error;
    io.err(`focus-cost-check: ${clean(error.message)}\n`);
    return 2;
  }
  io.out(FORMATS[o.format](report));
  return report.gate.pass ? 0 : 1;
}
