# Method

How a run works, what each check reports, its exact rule, and what it can and cannot see. A sentence in quotes is on a saved page of the FOCUS specification or of a cloud's documentation, listed in [rules-and-sources.md](rules-and-sources.md). A conclusion that no page states is called the tool's own, here and in the message of the finding.

## A run

1. The file named on the command line is opened, its type and size are taken from the open file, and it is read whole. A file that is not a regular file, is over the size limit, is Parquet, compressed, UTF-16, holds a control byte or is not valid UTF-8 is an input error (exit code `2`).
2. The text is read by the CSV reader below, one record at a time. Broken CSV or a file over a limit is an input error.
3. The header is checked against the mandatory columns of the saved pages (see "Layouts of the columns"), and the unknown columns are listed.
4. Each record is read once. A row whose `ChargeCategory`, `BillingCurrency`, `EffectiveCost`, `BilledCost`, `ChargePeriodStart` or `ChargePeriodEnd` cannot be read as the saved pages describe is counted by reason and left out of every total. Every other row is added to the totals of its currency.
5. The checks run on the totals. Findings are sorted by the order of the checks in the list below, and within a check by size.

The tool never calls a cloud. It reads the CSV file and nothing else. Parquet is not read: the tool reads CSV only, and a Parquet file is refused with a message that says so.

## The CSV reader

The tool has its own CSV reader, so that it decides for itself what it accepts and what it refuses (see [decisions/0001-own-strict-csv-reader.md](decisions/0001-own-strict-csv-reader.md)). It reads RFC 4180 and nothing more. Accepted: fields separated by commas, records ended by CRLF or LF (a final line end is optional), fields in double quotes with a quote written twice, and commas, quotes and line breaks inside a quoted field. A byte order mark at the start of the file is removed.

Refused, with the line number: a quote inside a field that does not start with a quote, text after the closing quote, a quote that is never closed, a carriage return that is not followed by a line feed, a record with another number of fields than the header, an empty line, and a header with an empty or repeated column name.

Limits, each an input error when it is reached: a file of 128 MB, 1,000,000 records, 500 columns, a field of 65,536 characters, a header of 16,384 characters, 50,000 different service, category or tag-key names and 50 currencies. The reader works on one string and calls a function for each record, so memory does not grow with the number of rows; only the totals by name are kept. The resource IDs that have untagged cost are kept up to 100,000 different ones, and the rest are added to one total.

## Layouts of the columns

Two layouts of the cost and usage columns are saved: the pages of version 1.2 and the pages of version 1.4. The mandatory columns of each are the columns whose saved page says "Feature level: Mandatory", and the overview says what that means: "If the existence of a column is described with MUST with no conditions of when it applies, then the feature level is designated as 'Mandatory'." The two lists are the same except for the provider columns: version 1.2 has `ProviderName` and `PublisherName`, and version 1.4 has `ServiceProviderName` and `HostProviderName`. The page of `ServiceProviderName` says: "Introduced as a replacement for the removed ProviderName column".

The file does not say which version it follows, so the tool reads the header against both lists and takes the one with fewer missing columns; the earlier layout wins a tie. This reading is the tool's own. The report says which layout it used, as "FOCUS 1.0 to 1.2 columns" or "FOCUS 1.3 and later columns". The columns that are mandatory in version 1.2 were all introduced in version 1.0 or before, as their saved pages show, so a file of version 1.0 or 1.1 is read against the same list; the tool does not claim to know the lists of those versions page by page, because those pages are not saved.

A column ID is matched exactly, because "Column IDs MUST use Pascal case." A column that is missing but present with another case is named in the finding.

Columns in the header that are in no saved page and have no `x_` prefix are an info finding: the specification says "Custom columns MUST be prefixed with a consistent x_ prefix to identify them as external, custom columns and distinguish them from FOCUS columns to avoid conflicts in future releases." Such a column can mean a version of FOCUS later than the two that are saved.

## Money

A cost is read from its text into a whole number of units of 10^-18 (a BigInt), and every sum is a sum of whole numbers. There is no binary floating point between the text of the file and the text of the report, so a sum is exact however many rows it has. FOCUS gives no precision for numbers ("The FOCUS specification does not require a specific level of precision for numeric values."), so the tool accepts what the Numeric Format page lists: an integer, a decimal or E notation, with a minus sign for a negative value and no plus sign, no comma and no currency symbol. A value that needs more than 18 decimal places is refused (the row is not valid) and never rounded. Amounts are written with at least two decimal places and no thousands separator, and percentages are rounded half up to one decimal place on the exact values. A limit is compared on the exact values, so a share exactly on the limit is not above it.

The currency is the `BillingCurrency` of the row. Costs in different currencies are never added together. A file with several currencies and no `--currency` option has an error finding and no totals; with `--currency CODE` only the rows in that currency are counted, and a note says how many rows were left out.

## Empty cells

The specification says: "Columns MUST use NULL when there isn't a value that can be specified for a nullable column." It does not say how a CSV file writes NULL, so reading an empty cell and the text `NULL` as no value is the tool's own choice.

## Charge periods

A charge period is the calendar month of `ChargePeriodStart`, taken from the text of the value, in UTC. The specification says "Date/time values MUST be in UTC (Coordinated Universal Time) to avoid ambiguity and ensure consistency across different time zones." and that "ChargePeriodStart MUST be the inclusive start bound of the effective period of the charge." and "ChargePeriodEnd MUST be the exclusive end bound of the effective period of the charge." A value must have the form `YYYY-MM-DDTHH:mm:ssZ`; a value without the seconds is read too, because the page of Microsoft says that some exports leave them out. A row whose end is before its start is not valid. A row that runs past the end of its month is counted in the month it starts, and a note counts such rows. The report lists the charge periods of the file and the number of days of data in each, because a month that is only partly in the file gives a smaller total, and the message of a rise says so when the two periods have a different number of days.

## Which cost

The specification defines two costs. The billed cost "represents a charge serving as the basis for invoicing, inclusive of the impacts of all reduced rates and discounts while excluding the amortization of relevant purchases (one-time or recurring) paid to cover future eligible charges." The effective cost is the amortized cost, and its page says: "Practitioners need to amortize relevant purchases, such as upfront fees, throughout the commitment and distribute them to the appropriate reporting groups (e.g., tags, resources)." and "The Effective Cost is commonly utilized to track and analyze spending trends."

The tool uses `EffectiveCost` for the tag, owner, commitment and spike checks, for this reason: the billed cost of a usage row leaves out the amortized part of a purchase that covers it, and that part stays on the purchase row, which has no resource and no tags; the page says "EffectiveCost MUST be 0 when ChargeCategory is "Purchase" and the purchase is intended to cover future eligible charges." Counting the billed cost would leave the cost of the resources that a commitment pays for out of their rows, and would put the purchase on a row that has no tags. The effective cost is spread over the resources that use the commitment, so each resource shows what it costs. The billed cost is shown beside the effective cost for the categories other than usage, where the two are listed so that the totals can be reconciled with an invoice. This choice is the tool's own, and the specification does name the billed cost for "cost allocation" on a cash basis, so a team that allocates on the invoice basis will see other numbers from its own tool.

## Which rows

The tag, owner, commitment and spike checks use the rows whose `ChargeCategory` is "Usage". The page says of the category: "Positive or negative charges based on the quantity of a service or resource that was consumed over a given period of time including refunds." Purchases, taxes, credits and adjustments are not tags to fix, so they are listed apart by the category check. The rows with the commitment status "Unused" are left out of the tag checks: the unused part of a commitment has no resource that could be tagged, and a note counts them.

## Tags

The `Tags` column holds a serialized JSON object: "Key-Value Format columns MUST contain a serialized JSON string, consistent with the ECMA 404 definition of an object." The tool reads that object with a small reader of its own that accepts a flat object with string, number, `true`, `false` and `null` values, as the page lists them, and refuses a nested value, an array, text after the object and a key that appears twice ("Keys in a key-value pair MUST be unique within an object."). A cell that is refused is counted and left out of the tag checks, never guessed.

A row has no tags at all when its cell is empty, is `NULL`, or is an object with no keys. A row has a tag key when the object has that key with a value that is not `null` and not an empty string: the page says "Tags MAY include tag keys with a null value for a given resource depending on the provider's tag finalization process.", and a key with no value does not tell who owns the cost. Keys are matched exactly, by case and by whole name. No tag value is kept: the reader returns the key and whether it has a value.

## Checks

### `focus-columns-missing`

Error. The file does not have all the mandatory columns of the layout that it was read against. The finding names each missing column and, for the earlier layout, quotes the sentence of the page that says it must be present. When a needed column is missing, the cost checks are not run, and a note says which column.

### `rows-invalid`

Error. Rows that are not valid are listed by reason, with the number of rows and the first lines: a `ChargeCategory` that is not one of the allowed values ("ChargeCategory MUST be one of the allowed values."), a `BillingCurrency` that is not a three-letter code in capitals, a cost that is not a number of the Numeric Format page or needs more than 18 decimal places, and a charge period that is not a valid moment or whose end is before its start. The rows are left out of every total.

### `currency-mixed`

Error. The file has charges in more than one currency and `--currency` was not given. No total is made. Quotes: the page of `BillingCurrency` and "BilledCost MUST be denominated in the BillingCurrency."

### `untagged-cost`

Warning. The share of the usage effective cost that has no tags at all is above `--untagged-max` (default 20). The base is the usage cost of the rows whose Tags cell could be read. The finding lists the services and the resources with the most untagged cost, as many as `--top` says (default 5). A resource ID is shown shortened to its first 16 and last 24 characters when it is longer than 48, and a charge with no resource ID is added to a line of its own. The default limit is the tool's own: the specification gives no figure.

### `tag-key-missing`

Warning. For each key given with `--require-tag`, the share of the usage effective cost whose rows do not have the key (with a value) is above `--untagged-max`. Same lists as the untagged finding.

### `cost-spike`

Warning. For each service (or each category with `--group-by category`), the usage effective cost of a charge period is compared with the charge period before it in the file. A rise is reported when the rise is at least `--spike-min` (default 100, in the currency of the file) and is above `--spike-percent` (default 50) of the earlier amount; when the earlier amount is zero, a rise of at least the minimum is reported as new spend. The defaults are the tool's own. The file must cover two charge periods; with one, an info finding says that spikes were not checked. At most 50 rises are listed, largest first, and a note counts the rest. Quotes: the page of `EffectiveCost` ("The Effective Cost is commonly utilized to track and analyze spending trends."), the page of `ServiceName` and the page of `ChargePeriodStart`.

### `focus-columns-unknown`

Info. Columns that are in no saved page and have no `x_` prefix.

### `tags-column-missing`

Info. The file has no `Tags` column, so the share of untagged cost is not known. The page says: "Tags MUST be present in a FOCUS dataset when the provider supports setting user or provider-defined tags." With `--require-tag`, a file without the column is an input error instead, because the check that was asked for cannot be made.

### `tags-unreadable`

Info. Tags cells that are not a flat JSON object with unique keys. The rows are left out of the tag checks.

### `no-owner-account`

Info. Usage rows that have no `SubAccountId` and no `SubAccountName` (those of the two columns that the file has). The finding is info because the page allows it: "SubAccountId MUST be null when a charge is not related to a sub account." The finding gives the share and the services with the most such cost.

### `commitment-coverage`

Info, and never a judgement. Made only when the file has `CommitmentDiscountId` and `CommitmentDiscountStatus`. The usage effective cost is split into the rows with the status "Used" ("Charges that utilized a specific amount of a commitment discount."), the rows with no commitment ID, and the rows with a commitment ID and another or no status; the share shown is the used cost over the consumed cost (used plus no commitment plus other). The rows with the status "Unused" ("Charges that represent the unused portion of the commitment discount.") are shown as an amount of their own and are not part of the consumed cost. When the columns are not in the file, a note says so.

### `charge-category-total`

Info. One finding for each of Purchase, Tax, Credit and Adjustment that has rows: the number of rows, the sum of `BilledCost` and the sum of `EffectiveCost`. The pages say that these categories are "Positive or negative", so refunds are negative amounts in the categories they belong to. The finding quotes the description of the category. Usage rows with a negative effective cost, which the page of the category calls refunds ("including refunds"), are one more finding of this id, with the number of rows and their total; they stay inside the usage cost.

### `check-not-run`

Info. A check that could not be made, with the reason: the usage cost is not above zero, or the file covers one charge period. Nothing is skipped without a word.

## Severity

The specification gives definitions and no scale, so the severity is the tool's own mapping. An error is a file that cannot be read as a FOCUS cost export or whose totals cannot be trusted. A warning is a share of cost that is hard to own, or a rise from one charge period to the next. Info is a number from the file, or a check that was not made, and it never fails a run.

## Exit codes

`0` no finding at the `--fail-on` level, `1` at least one, `2` a usage or input error. `--fail-on` takes `error` (the default) or `warning`; info never fails the run.
