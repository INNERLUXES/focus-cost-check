# Limits

## What an export can show

- **It shows an export, not an account.** The tool reads the charges in the file. It does not know which resources exist but have no charge, what a policy adds, or who a person is behind a tag. A finding says what the file shows. A pass is not proof that spend is under control.
- **A finding is a review item.** A share without tags can be correct: the charges of a service that does not support tags, shared costs and support fees have none. The default limits are the tool's own, because the specification gives no figure for them, and a team will set its own.
- **Tags are read as the file gives them.** The specification says tags are finalized by the provider, and that "Tags MAY be null." The tool counts what the file holds. It cannot see a tag that a cloud applies later, a tag policy, or a tag that exists on a resource and did not reach the charge.
- **Only usage is allocated.** Purchases, taxes, credits and adjustments are listed apart, and the unused part of a commitment is left out of the tag checks. A team that allocates every charge, including a tax, to an owner will see a different share.
- **The effective cost is the base.** The billed cost is not used for the share of untagged cost. [method.md](method.md) gives the reason and says that the two costs differ for covered usage.
- **A charge period is a calendar month.** Charge periods are the months of `ChargePeriodStart`, in UTC. A file of hourly or daily rows is added up by month, and a month that is only partly in the file looks smaller than it is. The message of a rise names the number of days of data in each month when they differ. A billing period that is not a calendar month is not used: the columns `BillingPeriodStart` and `BillingPeriodEnd` are not read.
- **A rise is not a cause.** The tool shows which service rose and by how much. It does not say why, and it does not see the resource behind the rise unless you open the rows.
- **Layouts are read from the header.** The file does not say which version of FOCUS it follows, so the tool reads the header against two saved layouts. Another version can have other mandatory columns than those that the saved pages show.
- **Commitments are numbers, not advice.** The share covered by commitment discounts is a division of two sums from the file. It does not say whether the commitments are too large or too small.
- **One currency at a time.** The tool never converts and never adds across currencies.
- **Rows that are not valid are left out.** A row whose cost, date, currency or category cannot be read is counted and not added, so the totals can differ from an invoice by exactly those rows, which the error finding lists.
- **Resource IDs are shortened in reports.** The first 16 and the last 24 characters of an ID longer than 48 are shown, so two IDs that differ only in the middle can look alike.

## Checks that were left out because no saved page supports them

The tool only has a check when a saved page states the fact. These were considered and are not in the tool, with the reason:

- **Tag key and value conventions** (a naming scheme, allowed values, a case rule): the specification says how tags are formatted and finalized, and states no convention for names or values. The tool checks that a key you name is present, and nothing about how it is spelled.
- **Provider-defined tags** (the prefixes that a cloud adds): the saved pages say they have provider-specified prefixes and name none, so the tool does not tell them from tags that a person set. They count as tags like any other.
- **Anomaly detection beyond a rise between two charge periods** (seasonality, a baseline, a forecast): no saved page defines one. The rise rule is simple on purpose, and its limits are the tool's own.
- **Waste** (idle resources, oversized resources, old snapshots): a cost file shows the charge, not the use of the resource, and no saved page gives a rule.
- **Savings estimates and commitment recommendations:** the coverage share is shown as a number only. No saved page says what a good share is.
- **Unit prices, list cost and contracted cost** (`ListCost`, `ContractedCost`, `ListUnitPrice`, `ContractedUnitPrice`): the discount from list or contract price is not reported, because the checks of this tool are about who owns the cost and how it moves, not about the price.
- **Invoices and billing periods** (`InvoiceId`, `BillingPeriodStart`, `BillingPeriodEnd`): matching the file to an invoice needs the invoice, which the tool does not read.
- **Allocated costs and tags of shared resources** (`AllocatedTags`, `AllocatedResourceId`, which only the pages of version 1.4 have): the tag checks read the `Tags` column only.
- **Region and availability zone, capacity reservations, SKU details, consumed quantity:** not read.
- **Currency conversion and virtual currencies:** a file in a virtual currency is read as long as the code is three capital letters; no rate is applied.
- **A check of whether the file follows the whole specification:** only the columns and the values that the checks read are checked, as the findings say. The tool is not a validator of FOCUS.

## What the reader leaves out

Nothing in the file is evaluated: no formula, no expression. A cell that starts with `=` is text. The CSV reader accepts RFC 4180 and nothing more, so a file with another delimiter (a semicolon, a tab) or another quote rule is refused with a line number, and [inputs.md](inputs.md) lists the limits.
