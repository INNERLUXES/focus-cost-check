// Shared test helpers: exports written inline as text, files written into a temporary folder that is removed after the
// test, and the command line run with captured output. Paths are built with resolve() from forward-slash names, so the
// same test runs on Linux, macOS and Windows.

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { checkExport, main } from '../src/index.js';

export async function withFiles(files, fn) {
  const dir = await mkdtemp(resolve(tmpdir(), 'focus-cost-check-'));
  try {
    for (const [rel, content] of Object.entries(files)) {
      await mkdir(dirname(resolve(dir, rel)), { recursive: true });
      await writeFile(resolve(dir, rel), content);
    }
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// The mandatory columns of the saved pages of version 1.2, with a value for each. A row overrides what it names.
const DEFAULTS = {
  BilledCost: '10.00',
  BillingAccountId: '111122223333',
  BillingAccountName: 'acme',
  BillingCurrency: 'USD',
  BillingPeriodEnd: '2024-02-01T00:00:00Z',
  BillingPeriodStart: '2024-01-01T00:00:00Z',
  ChargeCategory: 'Usage',
  ChargeClass: '',
  ChargeDescription: 'usage',
  ChargePeriodEnd: '2024-01-02T00:00:00Z',
  ChargePeriodStart: '2024-01-01T00:00:00Z',
  ContractedCost: '10.00',
  EffectiveCost: '10.00',
  InvoiceIssuerName: 'Example Cloud',
  ListCost: '10.00',
  PricingQuantity: '1',
  PricingUnit: 'Hours',
  ProviderName: 'Example Cloud',
  PublisherName: 'Example Cloud',
  ServiceCategory: 'Compute',
  ServiceName: 'Compute Engine'
};

const cell = (value) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

// Writes a CSV export from rows (objects that override the defaults). The columns are the mandatory ones, then every
// other name that a row uses. A row can set a cost with "cost", which sets EffectiveCost and BilledCost together.
// options: omit (column names to leave out), eol (the line end), defaults (other defaults), order (the column order).
export function csv(rows, { omit = [], eol = '\n', defaults = {}, order = null, trailing = true } = {}) {
  const base = { ...DEFAULTS, ...defaults };
  const resolved = rows.map((r) => {
    const { cost, ...rest } = r;
    return cost === undefined ? { ...base, ...rest } : { ...base, EffectiveCost: cost, BilledCost: cost, ...rest };
  });
  const names = order ?? [...new Set([...Object.keys(base), ...resolved.flatMap((r) => Object.keys(r))])].filter((n) => !omit.includes(n));
  const lines = [names.join(','), ...resolved.map((r) => names.map((n) => cell(r[n] ?? '')).join(','))];
  return lines.join(eol) + (trailing ? eol : '');
}

// A tags cell: a JSON object from a plain object.
export const tags = (object) => JSON.stringify(object);

export const ids = (report) => report.findings.map((f) => f.id);
export const find = (report, id) => report.findings.filter((f) => f.id === id);

// Checks the text of an export.
export function check(text, options = {}, extra = {}) {
  return checkExport(text, { options, ...extra });
}

// Writes the files and runs the command line with these arguments (paths relative to the folder).
export async function run(files, args = []) {
  return withFiles(files, async (dir) => {
    let out = '';
    let err = '';
    const code = await main(args, { out: (t) => { out += t; }, err: (t) => { err += t; } }, undefined, dir);
    return { code, out, err };
  });
}

// Runs the command line with exactly these arguments.
export async function cli(argv) {
  let out = '';
  let err = '';
  const code = await main(argv, { out: (t) => { out += t; }, err: (t) => { err += t; } });
  return { code, out, err };
}
