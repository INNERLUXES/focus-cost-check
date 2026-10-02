# focus-cost-check

Reads a cloud cost and usage export in the FinOps Open Cost and Usage Specification (FOCUS) format, as CSV, and reports what makes the spend hard to own or control: cost with no tags, cost without a tag key that you require, cost with no account owner, a service that rose from one charge period to the next, the share that commitment discounts cover, and the credits, taxes and adjustments that explain the totals. You give it the file. For every problem it names what it is about, the numbers, a sentence on how to fix it, and the sentence of the FOCUS specification that the finding rests on, with the address of the page.

Cloud spend is hard to control in quiet ways. A charge with no tags has no owner to ask, and the specification says what tags are for: "Tags are commonly used for scenarios like adding business context to cost and usage data to identify and accurately allocate charges." The billed cost of a charge leaves out the amortized part of a purchase that covers it, and the page of the effective cost says where that part goes: "Practitioners need to amortize relevant purchases, such as upfront fees, throughout the commitment and distribute them to the appropriate reporting groups (e.g., tags, resources)." A rise in one service hides in the total of a month, and the specification names the use of the cost that shows it: "The Effective Cost is commonly utilized to track and analyze spending trends." All of this is in the export that AWS, Microsoft and Google Cloud can write in the FOCUS format. This tool reads it in a second, so the check can run on every export.

- Every finding has an id, a severity (error, warning or info), what it is about, the numbers, a fix and the quoted sentences of the specification with the page address.
- The quotes are quotes. The pages of the specification (two released versions, every column page of each) and of the clouds are saved in [research/sources](research/sources), and a test compares every quoted sentence in [src/data.js](src/data.js), every list of mandatory columns and every list of allowed values with the saved text. Where a finding draws a conclusion that no page states (a severity, a default limit), the message says that it is the tool's own. A check that no saved page supports is not in the tool, and [docs/limits.md](docs/limits.md) lists what was left out.
- Money is exact. Costs are added as decimals in whole numbers of a small unit, with no floating point, a cost that needs more than 18 decimal places is refused and not rounded, and costs in different currencies are never added.
- Nothing is skipped without a word. A row that is not valid, a Tags cell that cannot be read, a column that is missing and a check that cannot be made are findings or notes, never a pass and never a guess.
- It prints no tag value and no row of the file. It shows totals, the names of services and accounts, the tag keys that you named, and resource IDs shortened. It reads one file only. It never calls a cloud, never fetches an address and opens no connection.
- It has its own strict CSV reader, with limits on size, records, columns and the length of a field. A broken quote, a short record and an empty line are refused with the line number. It reads CSV only: Parquet is not read. See [docs/method.md](docs/method.md).
- Reports as text, Markdown, JSON and CSV, with an exit code for a pipeline gate. Info findings never fail the run.
- Plain JavaScript, no dependencies; the same file always gives the same report.

```
npm test
```

```
ℹ tests 191
ℹ pass 187
ℹ fail 0
ℹ skipped 4
```

## Quick start

Requires Node 22 or newer. There is nothing to install.

```
git clone https://github.com/INNERLUXES/focus-cost-check.git
cd focus-cost-check
node bin/focus-cost-check.js examples/acme-shop/export.csv --require-tag env --fail-on warning
```

On your own export, written as CSV by your cloud (see [docs/inputs.md](docs/inputs.md)):

```
npx --yes github:INNERLUXES/focus-cost-check export.csv --require-tag team --require-tag env
```

`examples/` holds the export of a made-up online shop, `acme-shop`, on two charge periods. `examples/acme-shop/export.csv` has problems, wrong on purpose: usage with no tags, an `env` tag that four resources lack, a function whose cost quadruples in the second period, and charges with no account. It also has a commitment, a purchase, a tax, a credit and an adjustment, so that you see the totals explained. `examples/acme-shop-fixed/export.csv` is the same shop with the tags set, the account filled in and no rise, and it passes with `--fail-on warning`. The dates in the examples are made up and are far in the future, so they cannot be taken for real months.

## Usage

```
node bin/focus-cost-check.js examples/acme-shop/export.csv --require-tag env --fail-on warning
```

```
focus-cost-check: export.csv
read: 26 rows, 28 columns, FOCUS 1.0 to 1.2 columns, currency USD, 2 charge periods (2100-01 to 2100-02)
usage: 5353.05 USD effective cost in 18 rows
findings: 0 error, 3 warning, 6 info

WARNING  untagged-cost  Tags
         22.5 percent of the usage cost (1163.45 USD of 5163.05 USD effective cost) has no tags at all, above the limit of 20 percent.
         service Amazon EC2: 849.00 USD (73.0 percent)
         service Amazon S3: 179.50 USD (15.4 percent)
         service Amazon CloudWatch: 134.95 USD (11.6 percent)
         resource arn:aws:ec2:us-e...nce/i-0batch9f8e7d6c5b4a: 849.00 USD (73.0 percent)
         resource arn:aws:s3:::acme-shop-access-logs: 179.50 USD (15.4 percent)
         resource arn:aws:logs:us-...333:log-group:/acme/shop: 134.95 USD (11.6 percent)
         fix: Tag the resources that carry the cost below, or set tags on the account or project so they reach the charges; then export again.
         source (FOCUS 1.2, column Tags, Description): "Tags are commonly used for scenarios like adding business context to cost and usage data to identify and accurately allocate charges."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/tags.md
         source (FOCUS 1.2, column EffectiveCost, Description): "Practitioners need to amortize relevant purchases, such as upfront fees, throughout the commitment and distribute them to the appropriate reporting groups (e.g., tags, resources)."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/effectivecost.md
         source (FOCUS 1.2, column Tags, Requirements): "Tags MAY be null."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/tags.md

WARNING  tag-key-missing  env
         28.6 percent of the usage cost (1477.55 USD of 5163.05 USD effective cost) has no value for the tag key "env", above the limit of 20 percent. A key with no value counts as missing.
         service Amazon EC2: 849.00 USD (57.5 percent)
         service Amazon S3: 493.60 USD (33.4 percent)
         service Amazon CloudWatch: 134.95 USD (9.1 percent)
         resource arn:aws:ec2:us-e...nce/i-0batch9f8e7d6c5b4a: 849.00 USD (57.5 percent)
         resource arn:aws:s3:::acme-shop-assets: 314.10 USD (21.3 percent)
         resource arn:aws:s3:::acme-shop-access-logs: 179.50 USD (12.1 percent)
         resource arn:aws:logs:us-...333:log-group:/acme/shop: 134.95 USD (9.1 percent)
         fix: Set the tag key "env" on the resources below.
         source (FOCUS 1.2, column Tags, Description): "Tags are commonly used for scenarios like adding business context to cost and usage data to identify and accurately allocate charges."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/tags.md
         source (FOCUS 1.2, column Tags, Requirements): "Tags MAY include tag keys with a null value for a given resource depending on the provider's tag finalization process."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/tags.md

WARNING  cost-spike  AWS Lambda
         AWS Lambda: effective cost went from 120.00 USD in 2100-01 to 480.00 USD in 2100-02, a rise of 360.00 USD (300.0 percent, above the limit of 50 percent).
         fix: Open the charges of this service in the later period and find the resource or the change that caused the rise.
         source (FOCUS 1.2, column EffectiveCost, Description): "The Effective Cost is commonly utilized to track and analyze spending trends."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/effectivecost.md
         source (FOCUS 1.2, column ServiceName, Description): "The Service Name is commonly used for scenarios like analyzing aggregate cost trends over time and filtering data to investigate anomalies."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/servicename.md
         source (FOCUS 1.2, column ChargePeriodStart, Requirements): "ChargePeriodStart MUST be the inclusive start bound of the effective period of the charge."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargeperiodstart.md

INFO     no-owner-account  SubAccountId and SubAccountName
         2 usage rows (134.95 USD, 2.5 percent of the usage cost) have no SubAccountId and no SubAccountName. The specification says the ID is null when a charge is not related to a sub account, so this can be correct.
         service Amazon CloudWatch: 134.95 USD (100.0 percent)
         fix: Nothing to fix if these charges belong to the billing account itself; otherwise map them to an account.
         source (FOCUS 1.2, column SubAccountId, Description): "Sub Account ID is commonly used for scenarios like grouping based on organizational constructs, access management needs, and cost allocation strategies."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/subaccountid.md
         source (FOCUS 1.2, column SubAccountId, Requirements): "SubAccountId MUST be null when a charge is not related to a sub account."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/subaccountid.md

INFO     commitment-coverage  CommitmentDiscountId
         Commitment discounts cover 35.0 percent of the consumed usage cost: 1805.50 USD with status Used and 3357.55 USD with no CommitmentDiscountId. The unused part of commitments is 190.00 USD (2 rows). This is a number from the file, not a judgement.
         fix: Nothing to fix; read it with the commitments you hold.
         source (FOCUS 1.2, column CommitmentDiscountStatus, Description): "Commitment Discount Status indicates whether the charge corresponds with the consumption of a commitment discount identified in the CommitmentDiscountId column or the unused portion of the committed amount."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountstatus.md
         source (FOCUS 1.2, column CommitmentDiscountStatus, Allowed values, Used): "Charges that utilized a specific amount of a commitment discount."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountstatus.md
         source (FOCUS 1.2, column CommitmentDiscountStatus, Allowed values, Unused): "Charges that represent the unused portion of the commitment discount."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountstatus.md

INFO     charge-category-total  Purchase
         Purchase: 2 rows, BilledCost 1800.00 USD, EffectiveCost 0.00 USD. These rows are not in the usage cost that the other checks use.
         fix: Nothing to fix; this explains the difference between the usage cost and the invoice total.
         source (FOCUS 1.2, column ChargeCategory, Allowed values, Purchase): "Positive or negative charges for the acquisition of a service or resource bought upfront or on a recurring basis including refunds."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargecategory.md
         source (FOCUS 1.2, column EffectiveCost, Requirements): "EffectiveCost MUST be 0 when ChargeCategory is "Purchase" and the purchase is intended to cover future eligible charges."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/effectivecost.md

INFO     charge-category-total  Tax
         Tax: 2 rows, BilledCost 363.20 USD, EffectiveCost 363.20 USD. These rows are not in the usage cost that the other checks use.
         fix: Nothing to fix; this explains the difference between the usage cost and the invoice total.
         source (FOCUS 1.2, column ChargeCategory, Allowed values, Tax): "Positive or negative applicable taxes that are levied by the relevant authorities including refunds."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargecategory.md

INFO     charge-category-total  Credit
         Credit: 2 rows, BilledCost -350.00 USD, EffectiveCost -350.00 USD. These rows are not in the usage cost that the other checks use.
         fix: Nothing to fix; this explains the difference between the usage cost and the invoice total.
         source (FOCUS 1.2, column ChargeCategory, Allowed values, Credit): "Positive or negative charges granted by the provider for various scenarios e.g promotional credits or corrections to promotional credits."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargecategory.md
         source (FOCUS 1.2, column EffectiveCost, Requirements): "EffectiveCost of a charge unrelated to other charges (e.g., when the ChargeCategory is "Credit") MUST match the BilledCost."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/effectivecost.md

INFO     charge-category-total  Adjustment
         Adjustment: 2 rows, BilledCost 80.00 USD, EffectiveCost 80.00 USD. These rows are not in the usage cost that the other checks use.
         fix: Nothing to fix; this explains the difference between the usage cost and the invoice total.
         source (FOCUS 1.2, column ChargeCategory, Allowed values, Adjustment): "Positive or negative charges the provider applies that do not fall into other category values."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargecategory.md

note: 2 usage rows (190.00 USD) with the status Unused are left out of the tag checks: the unused part of a commitment has no resource to tag.

GATE: FAIL - 3 warnings
```

The same shop, fixed, passes the gate at the stricter level:

```
node bin/focus-cost-check.js examples/acme-shop-fixed/export.csv --require-tag env --fail-on warning
```

```
focus-cost-check: export.csv
read: 26 rows, 28 columns, FOCUS 1.0 to 1.2 columns, currency USD, 2 charge periods (2100-01 to 2100-02)
usage: 5013.05 USD effective cost in 18 rows
findings: 0 error, 0 warning, 5 info

INFO     commitment-coverage  CommitmentDiscountId
         Commitment discounts cover 37.4 percent of the consumed usage cost: 1805.50 USD with status Used and 3017.55 USD with no CommitmentDiscountId. The unused part of commitments is 190.00 USD (2 rows). This is a number from the file, not a judgement.
         fix: Nothing to fix; read it with the commitments you hold.
         source (FOCUS 1.2, column CommitmentDiscountStatus, Description): "Commitment Discount Status indicates whether the charge corresponds with the consumption of a commitment discount identified in the CommitmentDiscountId column or the unused portion of the committed amount."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountstatus.md
         source (FOCUS 1.2, column CommitmentDiscountStatus, Allowed values, Used): "Charges that utilized a specific amount of a commitment discount."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountstatus.md
         source (FOCUS 1.2, column CommitmentDiscountStatus, Allowed values, Unused): "Charges that represent the unused portion of the commitment discount."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/commitmentdiscountstatus.md

INFO     charge-category-total  Purchase
         Purchase: 2 rows, BilledCost 1800.00 USD, EffectiveCost 0.00 USD. These rows are not in the usage cost that the other checks use.
         fix: Nothing to fix; this explains the difference between the usage cost and the invoice total.
         source (FOCUS 1.2, column ChargeCategory, Allowed values, Purchase): "Positive or negative charges for the acquisition of a service or resource bought upfront or on a recurring basis including refunds."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargecategory.md
         source (FOCUS 1.2, column EffectiveCost, Requirements): "EffectiveCost MUST be 0 when ChargeCategory is "Purchase" and the purchase is intended to cover future eligible charges."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/effectivecost.md

INFO     charge-category-total  Tax
         Tax: 2 rows, BilledCost 363.20 USD, EffectiveCost 363.20 USD. These rows are not in the usage cost that the other checks use.
         fix: Nothing to fix; this explains the difference between the usage cost and the invoice total.
         source (FOCUS 1.2, column ChargeCategory, Allowed values, Tax): "Positive or negative applicable taxes that are levied by the relevant authorities including refunds."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargecategory.md

INFO     charge-category-total  Credit
         Credit: 2 rows, BilledCost -350.00 USD, EffectiveCost -350.00 USD. These rows are not in the usage cost that the other checks use.
         fix: Nothing to fix; this explains the difference between the usage cost and the invoice total.
         source (FOCUS 1.2, column ChargeCategory, Allowed values, Credit): "Positive or negative charges granted by the provider for various scenarios e.g promotional credits or corrections to promotional credits."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargecategory.md
         source (FOCUS 1.2, column EffectiveCost, Requirements): "EffectiveCost of a charge unrelated to other charges (e.g., when the ChargeCategory is "Credit") MUST match the BilledCost."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/effectivecost.md

INFO     charge-category-total  Adjustment
         Adjustment: 2 rows, BilledCost 80.00 USD, EffectiveCost 80.00 USD. These rows are not in the usage cost that the other checks use.
         fix: Nothing to fix; this explains the difference between the usage cost and the invoice total.
         source (FOCUS 1.2, column ChargeCategory, Allowed values, Adjustment): "Positive or negative charges the provider applies that do not fall into other category values."
           https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargecategory.md

note: 2 usage rows (190.00 USD) with the status Unused are left out of the tag checks: the unused part of a commitment has no resource to tag.

GATE: PASS (--fail-on warning)
```

Both runs are checked by `npm run example`, which fails when this README shows anything other than what the tool prints, and which writes the report of the first run in every format to `examples/output`.

## What is checked

Columns read: `BilledCost`, `EffectiveCost`, `BillingCurrency`, `ChargeCategory`, `ChargePeriodStart` and `ServiceName` are needed; `ChargePeriodEnd`, `ServiceCategory`, `Tags`, `SubAccountId`, `SubAccountName`, `ResourceId`, `CommitmentDiscountId` and `CommitmentDiscountStatus` are read when the file has them.

| Check | Severity | What it reports |
| --- | --- | --- |
| `focus-columns-missing` | error | the file lacks a mandatory column of the saved pages, and so is not read as a FOCUS export |
| `rows-invalid` | error | rows whose category, currency, cost or charge period cannot be read as the pages describe; they are left out of the totals |
| `currency-mixed` | error | charges in several currencies and no `--currency`; no total is made |
| `untagged-cost` | warning | more than `--untagged-max` percent of usage cost has no tags at all |
| `tag-key-missing` | warning | more than `--untagged-max` percent of usage cost lacks a tag key given with `--require-tag` |
| `cost-spike` | warning | a service rose by more than `--spike-percent` percent from one charge period to the next |
| `focus-columns-unknown` | info | columns in no saved page and without the `x_` prefix |
| `tags-column-missing` | info | no Tags column, so the share without tags is not known |
| `tags-unreadable` | info | Tags cells that are not a JSON object with unique keys, left out of the tag checks |
| `no-owner-account` | info | usage with no SubAccountId and no SubAccountName |
| `commitment-coverage` | info | the share of consumed usage cost that commitment discounts cover, as a number and not a judgement |
| `charge-category-total` | info | purchases, taxes, credits and adjustments, with both costs, and refunds inside usage, so the totals can be understood |
| `check-not-run` | info | a check that could not be made, and why |

[docs/method.md](docs/method.md) gives each check, its exact rule, what it can see and what it cannot. [docs/rules-and-sources.md](docs/rules-and-sources.md) lists every quoted sentence with the saved page it comes from.

### Which cost, and which rows

The tag, owner, commitment and spike checks add up `EffectiveCost` of the rows whose `ChargeCategory` is Usage. The specification defines the two costs, and the effective cost is the amortized one, spread over the resources that use a commitment, so each resource shows what it costs; the billed cost is the basis for invoicing and leaves the amortized purchase out. The billed cost is shown beside the effective cost for purchases, taxes, credits and adjustments. This is the tool's own choice, and [docs/method.md](docs/method.md) gives the reason and what it means for a team that allocates on the invoice basis.

## Severity

The specification gives definitions and no scale, so the severity is the tool's own mapping. An error is a file that cannot be read as a FOCUS cost export or whose totals cannot be trusted. A warning is a share of cost that is hard to own, or a rise from one charge period to the next. Info is a number from the file, or a check that was not made, and it never fails a run. The default limits are the tool's own too: 20 percent for untagged cost, 50 percent and an amount of 100 for a rise.

## Where the facts come from

| Fact | Source |
| --- | --- |
| Column IDs, which columns are mandatory, what Mandatory means | the column pages and the overview of FOCUS 1.2 and 1.4, https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/overview.md and https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.4/specification/overview.md |
| The two costs, the charge categories, tags, sub accounts, commitments | the column pages, for example https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/effectivecost.md and https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/columns/chargecategory.md |
| Numbers, dates, currencies, null values, key-value columns, custom columns | the attribute pages, for example https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob/v1.2/specification/attributes/numeric_format.md |
| That AWS, Microsoft and Google Cloud export FOCUS | https://docs.aws.amazon.com/cur/latest/userguide/table-dictionary-focus-1-0-aws.html, https://learn.microsoft.com/en-us/azure/cost-management-billing/dataset-schema/cost-usage-details-focus, https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-export-acm-data and https://cloud.google.com/billing/docs/how-to/export-data-bigquery |

## Formats

- `text`: for a terminal: the file read, the counts, then each finding with what it is about, the numbers, the fix and the quoted sentences with their addresses.
- `markdown`: the same as a table for a pull request comment or the job summary. Pipes, line breaks and angle brackets from the input are escaped, so a name from the file cannot break the table.
- `json`: the whole report: the input (file name, rows, columns, layout, currency, charge periods with their days of data, usage total), every finding with id, severity, subject, value, limit, message, fix, details and source sentences, the notes, the options and the gate.
- `csv`: one row per finding, quoted as RFC 4180 says. A cell that starts with `=`, `+`, `-` or `@` gets a leading `'`, so a spreadsheet does not run it as a formula.

To put the report in the job summary of a GitHub Actions run:

```yaml
permissions:
  contents: read
steps:
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
  - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
    with:
      node-version: 22
  - name: Cost report
    run: npx --yes github:INNERLUXES/focus-cost-check cost-export.csv --require-tag team --format markdown >> "$GITHUB_STEP_SUMMARY"
  - name: Cost gate
    run: npx --yes github:INNERLUXES/focus-cost-check cost-export.csv --require-tag team --fail-on warning
```

It needs no cloud credentials and no network access of its own: it runs on the CSV file, and getting that file is your step. An export names your accounts, services and resources, so keep it out of artifacts that others can download. Start with the default gate (errors only), and move to `--fail-on warning` when the first report is clean.

## Options and exit codes

`focus-cost-check <export.csv> [options]`.

- `--format <name>` is `text` (the default), `markdown`, `json` or `csv`.
- `--fail-on <level>` is `error` (the default) or `warning`; info never fails the run.
- `--require-tag <key>` names a tag key that every charge should carry; repeat it for more keys.
- `--untagged-max <pct>` (default 20) is the share of usage cost, in percent, above which untagged cost and a missing tag key are warnings.
- `--spike-percent <pct>` (default 50) and `--spike-min <amount>` (default 100) say when a rise from one charge period to the next is a warning.
- `--group-by <name>` compares charge periods by `service` (the default) or by `category`.
- `--currency <code>` counts only the rows in one BillingCurrency, and is needed when the file has several.
- `--top <n>` (default 5) is how many services and resources a finding lists.
- `--help` and `--version` print and exit with `0`.

`0` no finding at the `--fail-on` level, `1` at least one such finding (by default: an error), `2` a usage or input error (a missing file, a folder, a file that is not text, broken CSV, a file over a limit, an unknown option, a URL in place of a path, standard input, `--require-tag` on a file with no Tags column).

A file that cannot be read is exit code `2` and writes nothing to standard output, so a pipeline stops instead of passing on an empty report.

## Limits

The tool reads what an export says, not what a cloud does. It does not see a resource without a charge, a tag that a cloud applies later, or the reason for a rise. A finding says what the file shows. A pass is not proof that spend is under control. The default limits are the tool's own, and so are the reading of an empty cell as no value and the choice of the effective cost. [docs/limits.md](docs/limits.md) lists them and the checks that were left out.

## Related

The tool reads a cost export, after the money is spent. Its neighbour `tfplan-risk-check` reads the JSON of a Terraform plan, before apply, and does not read cost. This tool reads CSV only and does not read Terraform.

## Background

- How cloud computing is planned, bought and run for a business, with checks on cost and ownership like this one in the pipeline: [cloud computing solutions for business](https://innerluxes.dev/software-development/cloud-computing-solutions).

## License

MIT
