import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { CHARGE_CATEGORIES, COLUMN_IDS, COMMITMENT_STATUSES, FACTS, FINDINGS, LAYOUTS, NEEDED_COLUMNS, OPTIONAL_COLUMNS, ORDER, REQUIRED_COLUMNS, SOURCES, manualFor, presentSentence, sourceLabel, sourceUrl } from '../src/index.js';

const dir = new URL('../research/sources/', import.meta.url);
const page = async (id) => readFile(new URL(SOURCES.find((s) => s.id === id).file, dir), 'utf8');
const quotes = (t) => t.split(String.fromCharCode(0x2019)).join("'").split(String.fromCharCode(0x2018)).join("'").split(String.fromCharCode(0x201c)).join('"').split(String.fromCharCode(0x201d)).join('"');
// Text compared without line breaks, runs of white space or the typographic quotes.
const flat = (t) => quotes(t).replace(/\s+/g, ' ').trim();
const has = (text, needle) => flat(text).includes(flat(needle));
const column = (version, id) => page(`col-${version}-${id}`);
// The words of a tool that wrote a text, built from pieces so that this file does not hold them.
const WRITTEN = new RegExp(`\\b(?:${['A', 'I'].join('')}|${['cha', 't'].join('')}|${['clau', 'de'].join('')}|${['anthro', 'pic'].join('')}|${['ope', 'nai'].join('')})\\b`, 'i');

test('sources: every saved page has its address on the first line and holds text, and every saved file is listed', async () => {
  for (const s of SOURCES) {
    const text = await page(s.id);
    assert.equal(text.split('\n')[0], `Source: ${s.url}`, s.file);
    assert.ok(text.length > 300, `${s.file} holds the page text`);
  }
  assert.equal(SOURCES.length, new Set(SOURCES.map((s) => s.url)).size);
  assert.equal(SOURCES.length, new Set(SOURCES.map((s) => s.file)).size);
  assert.equal(SOURCES.length, new Set(SOURCES.map((s) => s.id)).size);
  const files = (await readdir(dir)).sort();
  assert.deepEqual(files, SOURCES.map((s) => s.file).sort());
});

test('sources: the pages of the specification are the pages of a released version, at an address that names it', () => {
  for (const s of SOURCES.filter((x) => x.kind !== 'vendor')) {
    assert.match(s.url, new RegExp(`^https://github\\.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v${s.version.replace('.', '\\.')}/specification/`), s.url);
  }
  for (const s of SOURCES.filter((x) => x.kind === 'vendor')) assert.match(s.url, /^https:\/\/(docs\.aws\.amazon\.com|learn\.microsoft\.com|cloud\.google\.com)\//);
});

test('sources: every sentence that the checks quote is on its saved page, word for word', async () => {
  for (const [key, fact] of Object.entries(FACTS)) {
    assert.ok(SOURCES.some((s) => s.id === fact.source), `${key}: source ${fact.source}`);
    assert.ok(has(await page(fact.source), fact.text), `${key}: "${fact.text}"`);
    assert.ok(fact.section.length > 3, key);
  }
  assert.ok(Object.keys(FACTS).length >= 60);
});

test('sources: no quoted sentence holds a year, a mention of a tool that wrote it, or an unfinished quote', () => {
  for (const [key, fact] of Object.entries(FACTS)) {
    assert.doesNotMatch(fact.text, /\b(?:19|20)\d{2}\b/, key);
    assert.doesNotMatch(fact.text, WRITTEN, key);
    assert.ok(/[.:]$|\)$|column$/.test(fact.text), `${key} ends like a sentence`);
  }
});

test('sources: no saved page mentions a tool that wrote it, and none holds a control byte', async () => {
  for (const s of SOURCES) {
    const text = await page(s.id);
    assert.doesNotMatch(text, WRITTEN, s.file);
    assert.doesNotMatch(text, new RegExp(`[${String.fromCharCode(1)}-${String.fromCharCode(8)}]`), s.file);
    assert.ok(!text.includes('\r'), s.file);
  }
});

test('columns: the saved column pages are exactly the column IDs of the list, and each page names its own ID', async () => {
  for (const version of ['1.2', '1.4']) {
    for (const id of COLUMN_IDS[version]) {
      const text = await column(version, id);
      assert.match(text, new RegExp(`\\n## Column ID\\n\\n${id}\\n`), `${version} ${id}`);
    }
    assert.equal(COLUMN_IDS[version].length, new Set(COLUMN_IDS[version]).size);
    assert.equal(SOURCES.filter((s) => s.kind === 'column' && s.version === version).length, COLUMN_IDS[version].length);
  }
});

test('columns: the mandatory columns of each layout are exactly the columns whose saved page says Mandatory', async () => {
  for (const version of ['1.2', '1.4']) {
    const mandatory = [];
    for (const id of COLUMN_IDS[version]) if (/\| Feature level\s*\| Mandatory\s*\|/i.test(await column(version, id))) mandatory.push(id);
    assert.deepEqual([...REQUIRED_COLUMNS[version]].sort(), mandatory.sort(), version);
  }
});

test('columns: the saved overview says what Mandatory means, and the earlier layout has each mandatory column "MUST be present"', async () => {
  assert.ok(has(await page('overview-1.2'), FACTS['mandatory-def'].text));
  assert.ok(has(await page('overview-1.4'), "If the existence of a column is described with `MUST` with no conditions of when it applies, then the feature level is designated as `Mandatory`.".replace(/`/g, '')));
  for (const id of REQUIRED_COLUMNS['1.2']) assert.ok(has(await column('1.2', id), presentSentence(id)), id);
});

test('columns: the two layouts differ in the provider columns only, and the later page says it replaces the earlier column', async () => {
  const early = new Set(REQUIRED_COLUMNS['1.2']);
  const late = new Set(REQUIRED_COLUMNS['1.4']);
  assert.deepEqual([...early].filter((c) => !late.has(c)).sort(), ['ProviderName', 'PublisherName']);
  assert.deepEqual([...late].filter((c) => !early.has(c)).sort(), ['HostProviderName', 'ServiceProviderName']);
  assert.equal(LAYOUTS['1.2'].provider, 'ProviderName');
  assert.equal(LAYOUTS['1.4'].provider, 'ServiceProviderName');
  assert.ok(has(await column('1.4', 'ServiceProviderName'), FACTS['provider-replaced'].text));
});

test('columns: every column that a check reads is in the saved pages of both layouts', () => {
  for (const name of [...NEEDED_COLUMNS, ...OPTIONAL_COLUMNS, 'CommitmentDiscountStatus']) {
    assert.ok(COLUMN_IDS['1.2'].includes(name), `1.2 ${name}`);
    assert.ok(COLUMN_IDS['1.4'].includes(name), `1.4 ${name}`);
  }
});

test('values: the allowed values of ChargeCategory and CommitmentDiscountStatus are those of the saved pages, in both layouts', async () => {
  const allowed = (text) => [...text.matchAll(/^\| ([A-Z][A-Za-z]+)\s+\| (?:Positive|Charges)/gm)].map((m) => m[1]);
  for (const version of ['1.2', '1.4']) {
    assert.deepEqual(allowed(await column(version, 'ChargeCategory')), CHARGE_CATEGORIES, version);
    assert.deepEqual(allowed(await column(version, 'CommitmentDiscountStatus')), COMMITMENT_STATUSES, version);
  }
});

test('values: the attribute pages of the later version state the same rules, in the words of that version', async () => {
  for (const [slug, sentence] of [
    ['datetime-format', 'FOCUS dataset column MUST be expressed in UTC (Coordinated Universal Time) to avoid ambiguity and ensure consistency across different time zones.'],
    ['datetime-format', 'FOCUS dataset column MUST end with the ISO 8601 UTC designator Z.'],
    ['numeric-format', 'FOCUS dataset column MUST NOT include a positive sign (+) for a positive value.'],
    ['numeric-format', 'FOCUS dataset column MUST use a negative sign (-) to indicate a negative value.'],
    ['numeric-format', 'FOCUS dataset column MUST NOT include a positive sign (+) for a positive exponent.'],
    ['numeric-format', 'FOCUS dataset column MUST contain a single numeric value.'],
    ['null-handling', 'FOCUS dataset column MUST use null for absent values when the FOCUS dataset column is defined as nullable.'],
    ['key-value-format', 'FOCUS dataset column MUST be a serialized JSON string, consistent with the ECMA 404 definition of an object.'],
    ['key-value-format', 'Keys in FOCUS dataset column MUST be unique within the object.'],
    ['key-value-format', 'Key values in FOCUS dataset column MUST NOT be objects or arrays.']
  ]) assert.ok(has(await page(`attr-1.4-${slug}`), sentence), sentence);
});

test('values: the column pages of the later version keep the nullability and the use sentences that the checks rely on', async () => {
  for (const [column14, sentence] of [
    ['Tags', 'Tags MAY be null.'],
    ['SubAccountId', 'SubAccountId MUST be null when a charge is not related to a sub account.'],
    ['CommitmentDiscountId', 'CommitmentDiscountId MUST be null when a charge is not related to a commitment discount.'],
    ['ChargePeriodStart', 'ChargePeriodStart MUST be the inclusive start bound'],
    ['ChargePeriodEnd', 'ChargePeriodEnd MUST be the exclusive end bound']
  ]) assert.ok(has(await column('1.4', column14), sentence), `${column14}: ${sentence}`);
});

test('checks: every finding id is unique, has a severity, and every sentence it quotes is a fact of the file', () => {
  assert.equal(FINDINGS.length, new Set(FINDINGS.map((f) => f.id)).size);
  for (const f of FINDINGS) {
    assert.ok(['error', 'warning', 'info'].includes(f.severity), f.id);
    for (const key of f.facts) assert.ok(FACTS[key], `${f.id}: ${key}`);
    assert.equal(manualFor(f.id).length, f.facts.length);
  }
  assert.deepEqual(Object.keys(ORDER), FINDINGS.map((f) => f.id));
  assert.equal(FINDINGS.filter((f) => f.severity === 'error').length, 3);
  assert.equal(FINDINGS.filter((f) => f.severity === 'warning').length, 3);
});

test('checks: a quote carries the label and the address of its page', () => {
  const [first] = manualFor('untagged-cost');
  assert.equal(first.page, sourceLabel('col-1.2-Tags'));
  assert.equal(first.url, sourceUrl('col-1.2-Tags'));
  assert.equal(first.quote, FACTS['tags-use'].text);
  assert.equal(manualFor('charge-category-total', ['cat-credit'])[0].quote, FACTS['cat-credit'].text);
});

test('vendors: the pages of the clouds say that they export FOCUS', async () => {
  for (const key of ['vendor-aws', 'vendor-azure', 'vendor-azure-csv', 'vendor-google', 'vendor-azure-seconds']) assert.ok(has(await page(FACTS[key].source), FACTS[key].text), key);
});
