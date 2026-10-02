import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InputError, readOptions } from '../src/index.js';
import { check, csv, find, ids, tags } from './helpers.js';

// Each check is tested with the export written inline, small enough that the result can be worked out by hand, and with
// a near miss that must not be reported. Names are made up.

const jan = (service, cost, extra = {}) => ({ ServiceName: service, cost, ChargePeriodStart: '2024-01-05T00:00:00Z', ChargePeriodEnd: '2024-01-06T00:00:00Z', ...extra });
const feb = (service, cost, extra = {}) => ({ ServiceName: service, cost, ChargePeriodStart: '2024-02-05T00:00:00Z', ChargePeriodEnd: '2024-02-06T00:00:00Z', ...extra });
const many = (n, row) => Array.from({ length: n }, () => ({ ...row }));
const TAGGED = { cost: '10.00', Tags: tags({ team: 'web', env: 'prod' }) };
const BARE = { cost: '10.00', Tags: '' };

test('columns: an export with every mandatory column of the earlier layout has no column finding', () => {
  const r = check(csv([TAGGED]));
  assert.ok(!ids(r).includes('focus-columns-missing'));
  assert.equal(r.input.layout.id, '1.2');
  assert.equal(r.input.columns, 22);
});

test('columns: missing mandatory columns are an error that names each one, and the layout it was read against', () => {
  const r = check(csv([TAGGED], { omit: ['ListCost', 'PublisherName'] }));
  const [f] = find(r, 'focus-columns-missing');
  assert.equal(f.severity, 'error');
  assert.match(f.message, /2 mandatory columns missing \(ListCost, PublisherName\)/);
  assert.match(f.message, /FOCUS 1\.0 to 1\.2 columns/);
  assert.equal(f.manual.at(-1).quote, 'ListCost MUST be present in a FOCUS dataset.');
  assert.equal(r.gate.pass, false);
});

test('columns: a column written with another case is named in the finding, because column IDs are in Pascal case', () => {
  const text = csv([TAGGED]).replace('ServiceName', 'servicename');
  const [f] = find(check(text), 'focus-columns-missing');
  assert.match(f.message, /servicename for ServiceName/);
  assert.match(f.message, /Pascal case/);
});

test('columns: an export that has the columns of version 1.3 and later is read against that layout', () => {
  const r = check(csv([{ ...TAGGED, ServiceProviderName: 'A', HostProviderName: 'B' }], { omit: ['ProviderName', 'PublisherName'] }));
  assert.equal(r.input.layout.id, '1.4');
  assert.ok(!ids(r).includes('focus-columns-missing'));
});

test('columns: a file with another number of missing columns in each layout is read against the nearer one', () => {
  const text = csv([TAGGED], { omit: ['ProviderName', 'PublisherName', 'ServiceCategory'] });
  const r = check(text);
  assert.equal(r.input.layout.id, '1.2');
  assert.match(find(r, 'focus-columns-missing')[0].message, /ProviderName, PublisherName, ServiceCategory/);
});

test('columns: a column that is in no saved page and has no x_ prefix is an info finding, and an x_ column is not', () => {
  const r = check(csv([{ ...TAGGED, MyColumn: 'a', x_Custom: 'b' }]));
  const [f] = find(r, 'focus-columns-unknown');
  assert.equal(f.severity, 'info');
  assert.match(f.message, /\(MyColumn\)/);
  assert.doesNotMatch(f.message, /x_Custom/);
  assert.ok(!ids(check(csv([{ ...TAGGED, x_Custom: 'b' }]))).includes('focus-columns-unknown'));
});

test('columns: without a column that the checks need, the cost checks are not run and a note says which', () => {
  const r = check(csv([TAGGED], { omit: ['EffectiveCost'] }));
  assert.match(r.notes[0], /The cost checks were not run: the file has no EffectiveCost column\./);
  assert.ok(!ids(r).includes('untagged-cost'));
  assert.equal(r.input.usage, null);
});

test('untagged: a share above the limit is a warning with the share, the amounts and the limit', () => {
  const r = check(csv([...many(7, TAGGED), ...many(3, BARE)]));
  const [f] = find(r, 'untagged-cost');
  assert.equal(f.severity, 'warning');
  assert.equal(f.value, '30.0');
  assert.equal(f.limit, '20');
  assert.match(f.message, /30\.0 percent of the usage cost \(30\.00 USD of 100\.00 USD effective cost\) has no tags at all, above the limit of 20 percent/);
});

test('untagged: a share exactly on the limit is not above it, and no share above it is reported for a limit of 100', () => {
  assert.ok(!ids(check(csv([...many(8, TAGGED), ...many(2, BARE)]))).includes('untagged-cost'));
  assert.ok(!ids(check(csv([...many(1, TAGGED), ...many(9, BARE)]), { untaggedMax: '100' })).includes('untagged-cost'));
  assert.ok(ids(check(csv([...many(9, TAGGED), ...many(1, BARE)]), { untaggedMax: '0' })).includes('untagged-cost'));
  assert.ok(!ids(check(csv([...many(9, TAGGED), ...many(1, BARE)]), { untaggedMax: '10' })).includes('untagged-cost'));
});

test('untagged: an empty object, the text NULL and an empty cell are no tags, and an object with a key is tags, even when the value is null', () => {
  const none = ['', 'NULL', '{}', ' { } '].map((t) => ({ cost: '10.00', Tags: t }));
  const r = check(csv(none));
  assert.equal(find(r, 'untagged-cost')[0].value, '100.0');
  const nulls = check(csv(many(4, { cost: '10.00', Tags: tags({ team: null }) })));
  assert.ok(!ids(nulls).includes('untagged-cost'));
});

test('untagged: only usage is counted, so a credit, a tax or a purchase without tags is not untagged cost', () => {
  const r = check(csv([...many(5, TAGGED), { cost: '-100.00', ChargeCategory: 'Credit', Tags: '' }, { cost: '50.00', ChargeCategory: 'Tax', Tags: '' }, { cost: '30.00', ChargeCategory: 'Purchase', EffectiveCost: '0.00', Tags: '' }]));
  assert.ok(!ids(r).includes('untagged-cost'));
  assert.equal(r.input.usage.effective, '50.00');
});

test('untagged: the amounts use the effective cost, so a commitment charge reaches the resources that used it', () => {
  const r = check(csv([{ BilledCost: '0.00', EffectiveCost: '80.00', Tags: '' }, { BilledCost: '0.00', EffectiveCost: '20.00', Tags: tags({ a: 1 }) }]));
  assert.equal(find(r, 'untagged-cost')[0].value, '80.0');
});

test('untagged: the services and resources with the most untagged cost are listed, largest first, as many as --top says', () => {
  const rows = [
    { cost: '30.00', Tags: '', ServiceName: 'Alpha', ResourceId: 'res-a' },
    { cost: '10.00', Tags: '', ServiceName: 'Beta', ResourceId: 'res-b' },
    { cost: '20.00', Tags: '', ServiceName: 'Gamma', ResourceId: 'res-c' },
    { cost: '40.00', Tags: tags({ a: 1 }), ServiceName: 'Alpha', ResourceId: 'res-d' }
  ];
  const [f] = find(check(csv(rows), { top: 2 }), 'untagged-cost');
  assert.deepEqual(f.lines, [
    'service Alpha: 30.00 USD (50.0 percent)',
    'service Gamma: 20.00 USD (33.3 percent)',
    'resource res-a: 30.00 USD (50.0 percent)',
    'resource res-c: 20.00 USD (33.3 percent)'
  ]);
  assert.equal(find(check(csv(rows), { top: 5 }), 'untagged-cost')[0].lines.length, 6);
});

test('untagged: a long resource ID is shortened to its first 16 and last 24 characters, and a charge with no resource is counted apart', () => {
  const long = `arn:aws:ec2:region:123456789012:instance/${'x'.repeat(30)}END`;
  const rows = [{ cost: '10.00', Tags: '', ResourceId: long }, { cost: '10.00', Tags: '', ResourceId: '' }, { cost: '10.00', Tags: tags({ a: 1 }), ResourceId: 'r' }];
  const [f] = find(check(csv(rows)), 'untagged-cost');
  const shown = f.lines.find((l) => l.startsWith('resource '));
  assert.ok(shown.includes(`${long.slice(0, 16)}...${long.slice(-24)}`));
  assert.ok(!shown.includes(long));
  assert.ok(f.lines.some((l) => l.startsWith('no resource ID or not listed: 10.00 USD (50.0 percent)')));
});

test('untagged: no tag value is ever copied into a report, only keys that --require-tag names', () => {
  const rows = [...many(5, { cost: '10.00', Tags: tags({ team: 'secret-team-name', owner: 'jane.doe@example.com' }) }), ...many(5, BARE)];
  const r = check(csv(rows), { requireTags: ['team'] });
  const text = JSON.stringify(r);
  assert.ok(!text.includes('secret-team-name'));
  assert.ok(!text.includes('jane.doe'));
  assert.ok(!text.includes('owner'));
});

test('untagged: a file without a Tags column is an info finding, and not a pass', () => {
  const r = check(csv([{ cost: '10.00' }]));
  const [f] = find(r, 'tags-column-missing');
  assert.equal(f.severity, 'info');
  assert.ok(!ids(r).includes('untagged-cost'));
});

test('untagged: Tags cells that are not an object of keys, or that repeat a key, are info, and are left out of the share', () => {
  const bad = ['not json', '[1,2]', '{"a":{"b":1}}', '{"a":1,"a":2}'].map((t) => ({ cost: '10.00', Tags: t }));
  const r = check(csv([...bad, ...many(6, TAGGED)]));
  const [f] = find(r, 'tags-unreadable');
  assert.equal(f.severity, 'info');
  assert.match(f.message, /^4 usage rows \(40\.00 USD effective cost\) have a Tags cell/);
  assert.ok(!ids(r).includes('untagged-cost'));
});

test('untagged: the unused part of a commitment has no resource to tag, so it is left out of the tag checks and a note says so', () => {
  const rows = [...many(5, TAGGED), { cost: '100.00', Tags: '', CommitmentDiscountId: 'sp-1', CommitmentDiscountStatus: 'Unused' }];
  const r = check(csv(rows));
  assert.ok(!ids(r).includes('untagged-cost'));
  assert.ok(r.notes.some((n) => /1 usage row \(100\.00 USD\) with the status Unused are left out of the tag checks/.test(n)));
});

test('untagged: when no usage cost is above zero the share is not worked out, and a finding says so', () => {
  const r = check(csv([{ cost: '-5.00', ChargeCategory: 'Credit', Tags: '' }]));
  const [f] = find(r, 'check-not-run');
  assert.equal(f.subject, 'untagged-cost');
  assert.match(f.message, /no cost above zero/);
});

test('tag key: the share without the key is a warning for each key, a value of false counts as a value, and an empty value does not', () => {
  const rows = [
    { cost: '10.00', Tags: tags({ team: 'a' }) },
    { cost: '10.00', Tags: tags({ team: 'b' }) },
    { cost: '10.00', Tags: tags({ team: false }) },
    { cost: '10.00', Tags: tags({ team: '' }) },
    { cost: '10.00', Tags: tags({ team: null }) },
    { cost: '10.00', Tags: tags({ other: 'x' }) },
    { cost: '10.00', Tags: tags({ Team: 'x' }) },
    { cost: '10.00', Tags: tags({ team: 'x' }) },
    { cost: '10.00', Tags: tags({ team: 'x' }) },
    { cost: '10.00', Tags: tags({ team: 'x' }) }
  ];
  const r = check(csv(rows), { requireTags: ['team', 'env'] });
  const team = find(r, 'tag-key-missing').find((f) => f.subject === 'team');
  assert.equal(team.value, '40.0');
  assert.match(team.message, /has no value for the tag key "team"/);
  const env = find(r, 'tag-key-missing').find((f) => f.subject === 'env');
  assert.equal(env.value, '100.0');
  assert.ok(!ids(check(csv(rows), { requireTags: ['team'], untaggedMax: '40' })).includes('tag-key-missing'));
});

test('tag key: a key that every row has is not reported, and the key is never matched by case or by prefix', () => {
  const rows = many(5, { cost: '10.00', Tags: tags({ team: 'a', 'team/x': 'b' }) });
  assert.ok(!ids(check(csv(rows), { requireTags: ['team'] })).includes('tag-key-missing'));
  assert.ok(ids(check(csv(rows), { requireTags: ['TEAM'] })).includes('tag-key-missing'));
  assert.ok(ids(check(csv(rows), { requireTags: ['tea'] })).includes('tag-key-missing'));
});

test('owner: charges with neither a sub account ID nor a name are an info finding, with the share and the services', () => {
  const rows = [{ cost: '10.00', SubAccountId: 'acct-1', SubAccountName: 'prod' }, { cost: '30.00', SubAccountId: '', SubAccountName: '', ServiceName: 'Support' }];
  const [f] = find(check(csv(rows)), 'no-owner-account');
  assert.equal(f.severity, 'info');
  assert.equal(f.value, '75.0');
  assert.deepEqual(f.lines, ['service Support: 30.00 USD (100.0 percent)']);
});

test('owner: a charge with only a name, or only an ID, has an owner, and without the columns a note says so', () => {
  const rows = [{ cost: '10.00', SubAccountId: '', SubAccountName: 'prod' }, { cost: '10.00', SubAccountId: 'a', SubAccountName: '' }];
  assert.ok(!ids(check(csv(rows))).includes('no-owner-account'));
  assert.ok(check(csv([{ cost: '10.00' }])).notes.some((n) => /Ownership was not checked/.test(n)));
});

test('spike: a rise above the limit between two charge periods is a warning with both amounts, and a rise on the limit is not', () => {
  const r = check(csv([jan('Alpha', '100.00'), feb('Alpha', '160.00')]), { spikeMin: '0' });
  const [f] = find(r, 'cost-spike');
  assert.equal(f.severity, 'warning');
  assert.equal(f.subject, 'Alpha');
  assert.equal(f.value, '60.0');
  assert.match(f.message, /effective cost went from 100\.00 USD in 2024-01 to 160\.00 USD in 2024-02, a rise of 60\.00 USD \(60\.0 percent, above the limit of 50 percent\)/);
  assert.ok(!ids(check(csv([jan('Alpha', '100.00'), feb('Alpha', '150.00')]), { spikeMin: '0' })).includes('cost-spike'));
  assert.ok(ids(check(csv([jan('Alpha', '100.00'), feb('Alpha', '150.00')]), { spikeMin: '0', spikePercent: '49.9' })).includes('cost-spike'));
});

test('spike: a fall, a rise below the minimum amount and a charge period with no earlier one are not spikes', () => {
  assert.ok(!ids(check(csv([jan('Alpha', '300.00'), feb('Alpha', '100.00')]), { spikeMin: '0' })).includes('cost-spike'));
  assert.ok(!ids(check(csv([jan('Alpha', '10.00'), feb('Alpha', '90.00')]))).includes('cost-spike'), 'a rise of 80 is under the default minimum of 100');
  assert.ok(ids(check(csv([jan('Alpha', '10.00'), feb('Alpha', '110.00')]))).includes('cost-spike'));
  assert.ok(!ids(check(csv([jan('Alpha', '100.00'), feb('Alpha', '140.00')]), { spikeMin: '50', spikePercent: '10' })).includes('cost-spike'));
});

test('spike: a service with no cost in the earlier period is reported as new spend, when the rise reaches the minimum', () => {
  const r = check(csv([jan('Alpha', '10.00'), feb('Alpha', '10.00'), feb('Beta', '80.00')]), { spikeMin: '50' });
  const [f] = find(r, 'cost-spike');
  assert.equal(f.subject, 'Beta');
  assert.match(f.message, /there was no cost in the earlier period/);
  assert.equal(f.value, '');
});

test('spike: with three charge periods each is compared with the one before it, and the largest rise is listed first', () => {
  const rows = [jan('Alpha', '100.00'), feb('Alpha', '100.00'), { ...feb('Alpha', '300.00'), ChargePeriodStart: '2024-03-05T00:00:00Z', ChargePeriodEnd: '2024-03-06T00:00:00Z' }, jan('Beta', '10.00'), feb('Beta', '40.00')];
  const r = check(csv(rows), { spikeMin: '0' });
  assert.deepEqual(find(r, 'cost-spike').map((f) => [f.subject, f.details.from, f.details.to]), [['Alpha', '2024-02', '2024-03'], ['Beta', '2024-01', '2024-02']]);
  assert.equal(r.input.periods.length, 3);
});

test('spike: a file with one charge period says that spikes were not checked, as an info finding', () => {
  const r = check(csv([jan('Alpha', '100.00')]));
  const f = find(r, 'check-not-run').find((x) => x.subject === 'cost-spike');
  assert.match(f.message, /the file covers one charge period \(2024-01\), and a rise needs two/);
  assert.equal(f.severity, 'info');
});

test('spike: periods are the months of ChargePeriodStart, so days of one month are one period', () => {
  const rows = [jan('Alpha', '100.00'), { ...jan('Alpha', '100.00'), ChargePeriodStart: '2024-01-20T00:00:00Z', ChargePeriodEnd: '2024-01-21T00:00:00Z' }];
  const r = check(csv(rows), { spikeMin: '0' });
  assert.deepEqual(r.input.periods, [{ period: '2024-01', days: 2 }]);
  assert.ok(!ids(r).includes('cost-spike'));
});

test('spike: when the two periods have a different number of days of data the message says so', () => {
  const rows = [jan('Alpha', '10.00'), { ...jan('Alpha', '10.00'), ChargePeriodStart: '2024-01-06T00:00:00Z', ChargePeriodEnd: '2024-01-07T00:00:00Z' }, feb('Alpha', '100.00')];
  const [f] = find(check(csv(rows), { spikeMin: '0' }), 'cost-spike');
  assert.match(f.message, /The file has 2 days of data in 2024-01 and 1 day in 2024-02\./);
  assert.equal(f.details.daysFrom, 2);
});

test('spike: --group-by category adds the services of one category together', () => {
  const rows = [jan('A', '50.00', { ServiceCategory: 'Compute' }), jan('B', '50.00', { ServiceCategory: 'Compute' }), feb('A', '60.00', { ServiceCategory: 'Compute' }), feb('B', '140.00', { ServiceCategory: 'Compute' })];
  assert.deepEqual(find(check(csv(rows), { spikeMin: '0', groupBy: 'service' }), 'cost-spike').map((f) => f.subject), ['B']);
  const byCategory = find(check(csv(rows), { spikeMin: '0', groupBy: 'category' }), 'cost-spike');
  assert.deepEqual(byCategory.map((f) => f.subject), ['Compute']);
  assert.equal(byCategory[0].details.rise, '100.00');
});

test('spike: a row that runs past the end of its month is counted in the month it starts, and a note says so', () => {
  const rows = [{ ...jan('Alpha', '10.00'), ChargePeriodEnd: '2024-02-03T00:00:00Z' }, { ...jan('Alpha', '10.00'), ChargePeriodEnd: '2024-02-01T00:00:00Z' }];
  const r = check(csv(rows));
  assert.ok(r.notes.some((n) => /^1 usage row runs past the end of the month in ChargePeriodStart/.test(n)), 'a row that ends at the first moment of the next month does not run past');
});

test('spike: at most 50 rises are listed, and a note counts the rest', () => {
  const rows = [];
  for (let i = 0; i < 60; i += 1) rows.push(jan(`Svc ${String(i).padStart(2, '0')}`, '10.00'), feb(`Svc ${String(i).padStart(2, '0')}`, `${100 + i}.00`));
  const r = check(csv(rows), { spikeMin: '0' });
  assert.equal(find(r, 'cost-spike').length, 50);
  assert.equal(find(r, 'cost-spike')[0].subject, 'Svc 59');
  assert.ok(r.notes.some((n) => /^10 more rises above the limit are not listed; the 50 largest are\./.test(n)));
});

test('commitments: the used part, the part with no commitment and the unused part are shown as numbers and not as a judgement', () => {
  const rows = [
    { cost: '60.00', CommitmentDiscountId: 'sp-1', CommitmentDiscountStatus: 'Used' },
    { cost: '40.00', CommitmentDiscountId: '', CommitmentDiscountStatus: '' },
    { cost: '25.00', CommitmentDiscountId: 'sp-1', CommitmentDiscountStatus: 'Unused' }
  ];
  const [f] = find(check(csv(rows)), 'commitment-coverage');
  assert.equal(f.severity, 'info');
  assert.equal(f.value, '60.0');
  assert.deepEqual([f.details.used, f.details.none, f.details.unused], ['60.00', '40.00', '25.00']);
  assert.match(f.message, /This is a number from the file, not a judgement\./);
});

test('commitments: an ID with another or no status is shown apart, and the check is not made without both columns', () => {
  const rows = [{ cost: '10.00', CommitmentDiscountId: 'sp-1', CommitmentDiscountStatus: '' }, { cost: '10.00', CommitmentDiscountId: '', CommitmentDiscountStatus: '' }];
  const [f] = find(check(csv(rows)), 'commitment-coverage');
  assert.equal(f.details.other, '10.00');
  assert.match(f.message, /that has an id with another or no status/);
  const only = check(csv([{ cost: '10.00', CommitmentDiscountId: 'x' }]));
  assert.ok(!ids(only).includes('commitment-coverage'));
  assert.ok(only.notes.some((n) => /Commitment coverage was not worked out/.test(n)));
});

test('categories: credits, adjustments, taxes and purchases are listed with both costs, and refunds are negative amounts', () => {
  const rows = [
    { cost: '100.00' },
    { cost: '-20.00', ChargeCategory: 'Credit' },
    { cost: '-5.50', ChargeCategory: 'Credit' },
    { cost: '3.00', ChargeCategory: 'Adjustment' },
    { cost: '8.00', ChargeCategory: 'Tax' },
    { BilledCost: '120.00', EffectiveCost: '0.00', ChargeCategory: 'Purchase' }
  ];
  const r = check(csv(rows));
  const byCategory = Object.fromEntries(find(r, 'charge-category-total').map((f) => [f.subject, f.details]));
  assert.deepEqual(Object.keys(byCategory), ['Purchase', 'Tax', 'Credit', 'Adjustment']);
  assert.deepEqual(byCategory.Credit, { category: 'Credit', rows: 2, billed: '-25.50', effective: '-25.50' });
  assert.deepEqual(byCategory.Purchase, { category: 'Purchase', rows: 1, billed: '120.00', effective: '0.00' });
  assert.equal(find(r, 'charge-category-total')[0].severity, 'info');
});

test('categories: refunds inside usage, negative usage rows, are listed with their total, and positive usage has none', () => {
  const r = check(csv([{ cost: '100.00' }, { cost: '-12.25' }, { cost: '-0.75' }]));
  const [f] = find(r, 'charge-category-total');
  assert.equal(f.subject, 'Usage');
  assert.deepEqual(f.details, { category: 'Usage', negativeRows: 2, negative: '-13.00' });
  assert.match(f.message, /Usage: 2 rows have a negative effective cost, -13\.00 USD in all/);
  assert.equal(f.manual[0].quote, 'Positive or negative charges based on the quantity of a service or resource that was consumed over a given period of time including refunds.');
  assert.equal(find(check(csv([{ cost: '100.00' }])), 'charge-category-total').length, 0);
});

test('categories: a category with no rows has no finding, and usage is not one of them', () => {
  const r = check(csv([{ cost: '1.00' }]));
  assert.equal(find(r, 'charge-category-total').length, 0);
});

test('currency: several currencies without --currency are an error and no total is made', () => {
  const r = check(csv([{ cost: '10.00' }, { cost: '10.00', BillingCurrency: 'EUR' }, { cost: '10.00', BillingCurrency: 'EUR' }]));
  const [f] = find(r, 'currency-mixed');
  assert.equal(f.severity, 'error');
  assert.match(f.message, /3 currencies|2 currencies \(EUR: 2 rows, USD: 1 row\)/);
  assert.equal(r.input.currency, null);
  assert.equal(r.input.usage, null);
  assert.deepEqual(r.input.currencies, [{ code: 'EUR', rows: 2 }, { code: 'USD', rows: 1 }]);
  assert.equal(r.gate.pass, false);
});

test('currency: --currency counts one currency, and a note says what was left out', () => {
  const r = check(csv([{ cost: '10.00' }, { cost: '10.00', BillingCurrency: 'EUR' }, { cost: '5.00', BillingCurrency: 'EUR' }]), { currency: 'EUR' });
  assert.ok(!ids(r).includes('currency-mixed'));
  assert.equal(r.input.currency, 'EUR');
  assert.equal(r.input.usage.effective, '15.00');
  assert.ok(r.notes.some((n) => /^Only EUR rows are counted; 1 row in USD are left out\.$/.test(n)));
});

test('currency: --currency for a currency that is not in the file is an input error that lists what is', () => {
  assert.throws(() => check(csv([{ cost: '10.00' }]), { currency: 'JPY' }), (e) => e instanceof InputError && /no valid rows in that currency \(it has USD\)/.test(e.message));
});

test('currency: one currency in the whole file needs no option', () => {
  const r = check(csv([{ cost: '10.00' }, { cost: '10.00' }]));
  assert.equal(r.input.currency, 'USD');
  assert.ok(!ids(r).includes('currency-mixed'));
});

test('rows: a value that is not allowed is an error with the reason, the number of rows and the first lines, and the row is left out', () => {
  const rows = [{ cost: '10.00' }, { EffectiveCost: '1,5' }, { BilledCost: '+3' }, { ChargeCategory: 'usage' }, { BillingCurrency: 'usd' }, { ChargePeriodStart: '2024-02-30T00:00:00Z' }, { cost: '10.00' }];
  const r = check(csv(rows));
  const [f] = find(r, 'rows-invalid');
  assert.equal(f.severity, 'error');
  assert.match(f.message, /^5 rows of 7 cannot be read/);
  assert.equal(f.lines.length, 5);
  assert.match(f.lines.find((l) => l.startsWith('ChargeCategory')), /ChargeCategory is not one of the allowed values: 1 row, first at line 5/);
  assert.equal(r.input.usage.effective, '20.00');
});

test('rows: a charge period that ends before it starts, and one with a bad end, are not valid', () => {
  const r = check(csv([{ cost: '1.00', ChargePeriodStart: '2024-01-05T00:00:00Z', ChargePeriodEnd: '2024-01-04T00:00:00Z' }, { cost: '1.00', ChargePeriodEnd: 'tomorrow' }, { cost: '1.00', ChargePeriodStart: '2024-01-05T00:00:00Z', ChargePeriodEnd: '2024-01-05T00:00:00Z' }]));
  const [f] = find(r, 'rows-invalid');
  assert.deepEqual(f.lines.map((l) => l.replace(/: \d+ rows?, first at line .*$/, '')), ['ChargePeriodEnd is before ChargePeriodStart', 'ChargePeriodEnd is not a moment in the form YYYY-MM-DDTHH:mm:ssZ']);
  assert.equal(r.input.usage.rows, 1);
});

test('rows: scientific notation, a negative value and a time without seconds are valid', () => {
  const r = check(csv([{ cost: '1.5E2' }, { cost: '-2.5E1', ChargePeriodStart: '2024-01-05T00:00Z', ChargePeriodEnd: '2024-01-06T00:00Z' }, { cost: '2e0' }]));
  assert.ok(!ids(r).includes('rows-invalid'));
  assert.equal(r.input.usage.effective, '127.00');
});

test('money: sums are exact, with no drift of floating point, and a total above the safe integer is exact too', () => {
  const r = check(csv([{ cost: '0.1' }, { cost: '0.2' }]));
  assert.equal(r.input.usage.effective, '0.30');
  const big = check(csv([{ cost: '9007199254740993.00' }, { cost: '1.00' }]));
  assert.equal(big.input.usage.effective, '9007199254740994.00');
  const small = check(csv(many(1000, { cost: '0.01' })));
  assert.equal(small.input.usage.effective, '10.00');
});

test('money: a cost with more than 18 decimal places is not rounded, the row is not valid', () => {
  const r = check(csv([{ cost: '1.0000000000000000001' }, { cost: '1.00' }]));
  assert.equal(find(r, 'rows-invalid')[0].details.rows, 1);
  assert.equal(r.input.usage.effective, '1.00');
});

test('gate: info never fails, a warning fails at warning and not at error, and the reason counts what fails', () => {
  const info = check(csv([{ cost: '10.00' }]), {}, { failOn: 'warning' });
  assert.ok(info.counts.info > 0);
  assert.equal(info.gate.pass, true);
  const warn = check(csv([...many(1, TAGGED), ...many(1, BARE)]), {}, { failOn: 'error' });
  assert.equal(warn.counts.warning, 1);
  assert.equal(warn.gate.pass, true);
  const warnFail = check(csv([...many(1, TAGGED), ...many(1, BARE)]), {}, { failOn: 'warning' });
  assert.equal(warnFail.gate.pass, false);
  assert.equal(warnFail.gate.reason, '1 warning');
  const both = check(csv([...many(1, TAGGED), ...many(1, BARE)], { omit: ['ListCost'] }), {}, { failOn: 'warning' });
  assert.equal(both.gate.reason, '1 error and 1 warning');
});

test('gate: every finding has an id of the list, a severity, a message and a fix, and a finding quotes only sentences of the saved pages', () => {
  const rows = [...many(3, TAGGED), ...many(2, BARE), jan('Alpha', '10.00'), feb('Alpha', '900.00')];
  const r = check(csv(rows, { omit: ['ListCost'] }), { requireTags: ['env'], spikeMin: '0' });
  assert.ok(r.findings.length >= 4);
  for (const f of r.findings) {
    assert.ok(['error', 'warning', 'info'].includes(f.severity));
    assert.ok(f.message.length > 10 && f.fix.length > 5, f.id);
    for (const m of f.manual) assert.match(m.url, /^https:\/\//);
  }
});

test('options: every option is checked, and a value that cannot be used is an input error that names it', () => {
  for (const [options, pattern] of [
    [{ untaggedMax: '101' }, /--untagged-max takes a number from 0 to 100, not 101/],
    [{ untaggedMax: '-1' }, /--untagged-max/],
    [{ spikePercent: 'x' }, /--spike-percent/],
    [{ spikeMin: '1e3' }, /--spike-min takes an amount of 0 or more/],
    [{ top: 0 }, /--top takes a whole number from 1 to 20/],
    [{ top: 21 }, /--top/],
    [{ groupBy: 'region' }, /--group-by takes service or category/],
    [{ currency: 'usd' }, /--currency takes a three-letter code in capitals/],
    [{ requireTags: [''] }, /--require-tag takes a tag key of 1 to 128 characters/],
    [{ requireTags: ['a'.repeat(129)] }, /--require-tag/],
    [{ requireTags: Array.from({ length: 21 }, (_, i) => `k${i}`) }, /at most 20 times/]
  ]) {
    assert.throws(() => readOptions(options), (e) => e instanceof InputError && pattern.test(e.message), JSON.stringify(options).slice(0, 40));
  }
  assert.doesNotThrow(() => readOptions({ untaggedMax: '12.5', spikePercent: '1000000', spikeMin: '0', top: 20, groupBy: 'category', currency: 'EUR', requireTags: ['a'] }));
});
