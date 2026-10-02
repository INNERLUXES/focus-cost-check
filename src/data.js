// Every column name, every allowed value and every quoted sentence that the checks rely on comes from the FinOps Open
// Cost and Usage Specification (FOCUS) or from the documentation of a cloud that says it exports FOCUS. The pages are
// saved as text in research/sources (the address is on the first line; markdown links and emphasis marks of the
// specification are removed and no word is changed), and test/data.test.js compares this file with the saved text.
// Nothing here was written from memory: a sentence that is not on a saved page is not a fact of this file, and a check
// that no saved page supports is not in the tool (docs/limits.md lists them).

const BLOB = 'https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/blob';

// The column IDs of the saved column pages, in the order of the specification. Two layouts of the cost and usage columns
// are saved: the pages of version 1.2 and the pages of version 1.4.
export const COLUMN_IDS = {
  '1.2': ['AvailabilityZone', 'BilledCost', 'BillingAccountId', 'BillingAccountName', 'BillingAccountType', 'BillingCurrency', 'BillingPeriodEnd', 'BillingPeriodStart', 'CapacityReservationId', 'CapacityReservationStatus', 'ChargeCategory', 'ChargeClass', 'ChargeDescription', 'ChargeFrequency', 'ChargePeriodEnd', 'ChargePeriodStart', 'CommitmentDiscountCategory', 'CommitmentDiscountId', 'CommitmentDiscountName', 'CommitmentDiscountQuantity', 'CommitmentDiscountStatus', 'CommitmentDiscountType', 'CommitmentDiscountUnit', 'ConsumedQuantity', 'ConsumedUnit', 'ContractedCost', 'ContractedUnitPrice', 'EffectiveCost', 'InvoiceId', 'InvoiceIssuerName', 'ListCost', 'ListUnitPrice', 'PricingCategory', 'PricingCurrency', 'PricingCurrencyContractedUnitPrice', 'PricingCurrencyEffectiveCost', 'PricingCurrencyListUnitPrice', 'PricingQuantity', 'PricingUnit', 'ProviderName', 'PublisherName', 'RegionId', 'RegionName', 'ResourceId', 'ResourceName', 'ResourceType', 'ServiceCategory', 'ServiceName', 'ServiceSubcategory', 'SkuId', 'SkuMeter', 'SkuPriceDetails', 'SkuPriceId', 'SubAccountId', 'SubAccountName', 'SubAccountType', 'Tags'],
  '1.4': ['AllocatedMethodDetails', 'AllocatedMethodId', 'AllocatedResourceId', 'AllocatedResourceName', 'AllocatedTags', 'AvailabilityZone', 'BilledCost', 'BillingAccountId', 'BillingAccountName', 'BillingAccountType', 'BillingCurrency', 'BillingPeriodEnd', 'BillingPeriodStart', 'CapacityReservationId', 'CapacityReservationStatus', 'ChargeCategory', 'ChargeClass', 'ChargeDescription', 'ChargeFrequency', 'ChargePeriodEnd', 'ChargePeriodStart', 'CommitmentDiscountCategory', 'CommitmentDiscountId', 'CommitmentDiscountName', 'CommitmentDiscountQuantity', 'CommitmentDiscountStatus', 'CommitmentDiscountType', 'CommitmentDiscountUnit', 'CommitmentProgramEligibilityDetails', 'ConsumedQuantity', 'ConsumedUnit', 'ContractApplied', 'ContractedCost', 'ContractedUnitPrice', 'EffectiveCost', 'HostProviderName', 'InvoiceDetailId', 'InvoiceId', 'InvoiceIssuerName', 'ListCost', 'ListUnitPrice', 'PricingCategory', 'PricingCurrency', 'PricingCurrencyContractedUnitPrice', 'PricingCurrencyEffectiveCost', 'PricingCurrencyListUnitPrice', 'PricingQuantity', 'PricingUnit', 'RegionId', 'RegionName', 'ResourceId', 'ResourceName', 'ResourceType', 'ServiceCategory', 'ServiceName', 'ServiceProviderName', 'ServiceSubcategory', 'SkuId', 'SkuMeter', 'SkuPriceDetails', 'SkuPriceId', 'SubAccountId', 'SubAccountName', 'SubAccountType', 'Tags']
};

// The columns whose saved page says "Feature level: Mandatory". test/data.test.js compares these lists with the saved text.
export const REQUIRED_COLUMNS = {
  '1.2': ['BilledCost', 'BillingAccountId', 'BillingAccountName', 'BillingCurrency', 'BillingPeriodEnd', 'BillingPeriodStart', 'ChargeCategory', 'ChargeClass', 'ChargeDescription', 'ChargePeriodEnd', 'ChargePeriodStart', 'ContractedCost', 'EffectiveCost', 'InvoiceIssuerName', 'ListCost', 'PricingQuantity', 'PricingUnit', 'ProviderName', 'PublisherName', 'ServiceCategory', 'ServiceName'],
  '1.4': ['BilledCost', 'BillingAccountId', 'BillingAccountName', 'BillingCurrency', 'BillingPeriodEnd', 'BillingPeriodStart', 'ChargeCategory', 'ChargeClass', 'ChargeDescription', 'ChargePeriodEnd', 'ChargePeriodStart', 'ContractedCost', 'EffectiveCost', 'HostProviderName', 'InvoiceIssuerName', 'ListCost', 'PricingQuantity', 'PricingUnit', 'ServiceCategory', 'ServiceName', 'ServiceProviderName']
};

// The layouts that a file is read against. A file with a ServiceProviderName or HostProviderName column is read as the
// later layout, and any other file as the earlier one; docs/method.md explains this reading, which is the tool's own.
export const LAYOUTS = {
  '1.2': { label: 'FOCUS 1.0 to 1.2 columns', saved: '1.2', provider: 'ProviderName' },
  '1.4': { label: 'FOCUS 1.3 and later columns', saved: '1.4', provider: 'ServiceProviderName' }
};

// The columns that the checks read. A file without one of the first group cannot be checked at all.
export const NEEDED_COLUMNS = ['BilledCost', 'EffectiveCost', 'BillingCurrency', 'ChargeCategory', 'ChargePeriodStart', 'ServiceName'];
export const OPTIONAL_COLUMNS = ['ChargePeriodEnd', 'ServiceCategory', 'Tags', 'SubAccountId', 'SubAccountName', 'ResourceId', 'CommitmentDiscountId', 'CommitmentDiscountStatus'];

// ChargeCategory and CommitmentDiscountStatus allowed values, as the saved pages list them (case matters).
export const CHARGE_CATEGORIES = ['Usage', 'Purchase', 'Tax', 'Credit', 'Adjustment'];
export const COMMITMENT_STATUSES = ['Used', 'Unused'];

// Limits. Each is an input error when it is reached, so a file that is not a cost export is refused and does not use
// the memory of the machine.
export const CSV_LIMITS = {
  maxFileBytes: 128 * 1024 * 1024,
  maxRows: 1000000,
  maxColumns: 500,
  maxFieldChars: 65536,
  maxHeaderChars: 16384,
  maxGroups: 50000,
  maxResources: 100000
};

// Defaults of the options. FOCUS gives no figure for any of them, so each is the tool's own choice (docs/method.md).
export const DEFAULTS = { untaggedMax: '20', spikePercent: '50', spikeMin: '100', top: 5, groupBy: 'service' };

// ---- the saved pages
const ATTRS_12 = [['column-handling', 'column_handling', 'Column Handling'], ['currency-format', 'currency_format', 'Currency Format'], ['datetime-format', 'datetime_format', 'Date/Time Format'], ['key-value-format', 'key_value_format', 'Key-Value Format'], ['null-handling', 'null_handling', 'Null Handling'], ['numeric-format', 'numeric_format', 'Numeric Format']];
const ATTRS_14 = [['focus-column-handling', 'focus_column_handling', 'FOCUS Column Handling'], ['custom-column-handling', 'custom_column_handling', 'Custom Column Handling'], ['currency-format', 'currency_format', 'Currency Format'], ['datetime-format', 'datetime_format', 'Date/Time Format'], ['key-value-format', 'key_value_format', 'Key-Value Format'], ['null-handling', 'null_handling', 'Null Handling'], ['numeric-format', 'numeric_format', 'Numeric Format']];
// In the pages of version 1.2 three columns are in files that carry an older name.
const FILE_NAME_12 = { ProviderName: 'provider', PublisherName: 'publisher', InvoiceIssuerName: 'invoiceissuer' };

export const SOURCES = [];
for (const version of ['1.2', '1.4']) {
  for (const id of COLUMN_IDS[version]) {
    const name = version === '1.2' ? (FILE_NAME_12[id] ?? id.toLowerCase()) : id.toLowerCase();
    const dir = version === '1.2' ? 'specification/columns' : 'specification/datasets/cost_and_usage/columns';
    SOURCES.push({ id: `col-${version}-${id}`, kind: 'column', version, label: `FOCUS ${version}, column ${id}`, url: `${BLOB}/v${version}/${dir}/${name}.md`, file: `focus-${version}-column-${id.toLowerCase()}.txt` });
  }
  for (const [slug, name, label] of version === '1.2' ? ATTRS_12 : ATTRS_14) {
    SOURCES.push({ id: `attr-${version}-${slug}`, kind: 'attribute', version, label: `FOCUS ${version}, attribute ${label}`, url: `${BLOB}/v${version}/specification/attributes/${name}.md`, file: `focus-${version}-attr-${slug}.txt` });
  }
  SOURCES.push({ id: `overview-${version}`, kind: 'overview', version, label: `FOCUS ${version}, Overview`, url: `${BLOB}/v${version}/specification/overview.md`, file: `focus-${version}-overview.txt` });
}
SOURCES.push(
  { id: 'vendor-aws', kind: 'vendor', version: '', label: 'AWS Data Exports, FOCUS 1.0 with AWS columns', url: 'https://docs.aws.amazon.com/cur/latest/userguide/table-dictionary-focus-1-0-aws.html', file: 'vendor-aws-focus-1-0-table.txt' },
  { id: 'vendor-azure-schema', kind: 'vendor', version: '', label: 'Microsoft Learn, FOCUS cost and usage details file schema', url: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/dataset-schema/cost-usage-details-focus', file: 'vendor-azure-focus-file-schema.txt' },
  { id: 'vendor-azure-export', kind: 'vendor', version: '', label: 'Microsoft Learn, Create and manage exported data', url: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-export-acm-data', file: 'vendor-azure-export-data.txt' },
  { id: 'vendor-google', kind: 'vendor', version: '', label: 'Google Cloud, Set up Cloud Billing data export to BigQuery', url: 'https://cloud.google.com/billing/docs/how-to/export-data-bigquery', file: 'vendor-google-bigquery-export.txt' }
);

const BY_SOURCE = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
export const sourceUrl = (id) => BY_SOURCE[id].url;
export const sourceLabel = (id) => BY_SOURCE[id].label;

// ---- the quoted sentences. key: used by the checks; source: the id of the saved page; section: where on the page.
// A sentence is the text of the page, word for word; test/data.test.js looks for it in the saved file.
const F = (source, section, text) => ({ source, section, text });
export const FACTS = {
  'mandatory-def': F('overview-1.2', 'Feature level', "If the existence of a column is described with MUST with no conditions of when it applies, then the feature level is designated as 'Mandatory'."),
  'column-pascal': F('attr-1.2-column-handling', 'Column Names', 'Column IDs MUST use Pascal case.'),
  'custom-prefix': F('attr-1.2-column-handling', 'Column Names', 'Custom columns MUST be prefixed with a consistent x_ prefix to identify them as external, custom columns and distinguish them from FOCUS columns to avoid conflicts in future releases.'),
  'provider-replaced': F('col-1.4-ServiceProviderName', 'Version Introduced', 'Introduced as a replacement for the removed ProviderName column'),
  'service-name-use': F('col-1.2-ServiceName', 'Description', 'The Service Name is commonly used for scenarios like analyzing aggregate cost trends over time and filtering data to investigate anomalies.'),
  'eff-trends': F('col-1.2-EffectiveCost', 'Description', 'The Effective Cost is commonly utilized to track and analyze spending trends.'),
  'eff-distribute': F('col-1.2-EffectiveCost', 'Description', 'Practitioners need to amortize relevant purchases, such as upfront fees, throughout the commitment and distribute them to the appropriate reporting groups (e.g., tags, resources).'),
  'eff-purchase-zero': F('col-1.2-EffectiveCost', 'Requirements', 'EffectiveCost MUST be 0 when ChargeCategory is "Purchase" and the purchase is intended to cover future eligible charges.'),
  'eff-credit-billed': F('col-1.2-EffectiveCost', 'Requirements', 'EffectiveCost of a charge unrelated to other charges (e.g., when the ChargeCategory is "Credit") MUST match the BilledCost.'),
  'eff-currency': F('col-1.2-EffectiveCost', 'Requirements', 'EffectiveCost MUST be denominated in the BillingCurrency.'),
  'billed-basis': F('col-1.2-BilledCost', 'Description', 'The billed cost represents a charge serving as the basis for invoicing, inclusive of the impacts of all reduced rates and discounts while excluding the amortization of relevant purchases (one-time or recurring) paid to cover future eligible charges.'),
  'billed-use': F('col-1.2-BilledCost', 'Description', 'The Billed Cost is commonly used to perform FinOps capabilities that require cash-basis accounting such as cost allocation, budgeting, and invoice reconciliation.'),
  'billed-currency': F('col-1.2-BilledCost', 'Requirements', 'BilledCost MUST be denominated in the BillingCurrency.'),
  'currency-def': F('col-1.2-BillingCurrency', 'Description', 'Billing currency is an identifier that represents the currency that a charge for resources or services was billed in.'),
  'currency-national': F('col-1.2-BillingCurrency', 'Requirements', 'BillingCurrency MUST be expressed in national currency (e.g., USD, EUR).'),
  'currency-grouped': F('col-1.2-BillingCurrency', 'Description', 'Billing Currency is commonly used in scenarios where costs need to be grouped or aggregated.'),
  'cat-not-null': F('col-1.2-ChargeCategory', 'Requirements', 'ChargeCategory MUST NOT be null.'),
  'cat-allowed': F('col-1.2-ChargeCategory', 'Requirements', 'ChargeCategory MUST be one of the allowed values.'),
  'cat-usage': F('col-1.2-ChargeCategory', 'Allowed values, Usage', 'Positive or negative charges based on the quantity of a service or resource that was consumed over a given period of time including refunds.'),
  'cat-purchase': F('col-1.2-ChargeCategory', 'Allowed values, Purchase', 'Positive or negative charges for the acquisition of a service or resource bought upfront or on a recurring basis including refunds.'),
  'cat-tax': F('col-1.2-ChargeCategory', 'Allowed values, Tax', 'Positive or negative applicable taxes that are levied by the relevant authorities including refunds.'),
  'cat-credit': F('col-1.2-ChargeCategory', 'Allowed values, Credit', 'Positive or negative charges granted by the provider for various scenarios e.g promotional credits or corrections to promotional credits.'),
  'cat-adjustment': F('col-1.2-ChargeCategory', 'Allowed values, Adjustment', 'Positive or negative charges the provider applies that do not fall into other category values.'),
  'period-start': F('col-1.2-ChargePeriodStart', 'Requirements', 'ChargePeriodStart MUST be the inclusive start bound of the effective period of the charge.'),
  'period-end': F('col-1.2-ChargePeriodEnd', 'Requirements', 'ChargePeriodEnd MUST be the exclusive end bound of the effective period of the charge.'),
  'period-not-null': F('col-1.2-ChargePeriodStart', 'Requirements', 'ChargePeriodStart MUST NOT be null.'),
  'datetime-utc': F('attr-1.2-datetime-format', 'Requirements', 'Date/time values MUST be in UTC (Coordinated Universal Time) to avoid ambiguity and ensure consistency across different time zones.'),
  'datetime-form': F('attr-1.2-datetime-format', 'Requirements', "Values providing information about a specific moment in time MUST be represented in the extended ISO 8601 format with UTC offset ('YYYY-MM-DDTHH:mm:ssZ') and conform to the following guidelines:"),
  'numeric-forms': F('attr-1.2-numeric-format', 'Requirements', 'Numeric values MUST be expressed as an integer value, a decimal value, or a value expressed in scientific notation. Fractional notation MUST NOT be used.'),
  'numeric-sci': F('attr-1.2-numeric-format', 'Requirements', 'The sign of the exponent MUST only be expressed as part of the exponent value if n is negative.'),
  'numeric-chars': F('attr-1.2-numeric-format', 'Requirements', 'Numeric values MUST NOT contain commas or punctuation marks except for a single decimal point (".") if required to express a decimal value.'),
  'numeric-sign': F('attr-1.2-numeric-format', 'Requirements', 'Numeric values MUST NOT include a character to represent a sign for a positive value. A negative sign (-) MUST indicate a negative value.'),
  'numeric-precision': F('attr-1.2-numeric-format', 'Description', 'The FOCUS specification does not require a specific level of precision for numeric values.'),
  'null-use': F('attr-1.2-null-handling', 'Requirements', "Columns MUST use NULL when there isn't a value that can be specified for a nullable column."),
  'null-no-empty': F('attr-1.2-null-handling', 'Requirements', 'Columns MUST NOT use empty strings or placeholder values such as 0 for numeric columns or "Not Applicable" for string columns to represent a null or not having a value, regardless of whether the column allows nulls or not.'),
  'tags-use': F('col-1.2-Tags', 'Description', 'Tags are commonly used for scenarios like adding business context to cost and usage data to identify and accurately allocate charges.'),
  'tags-present': F('col-1.2-Tags', 'Requirements', 'Tags MUST be present in a FOCUS dataset when the provider supports setting user or provider-defined tags.'),
  'tags-null': F('col-1.2-Tags', 'Requirements', 'Tags MAY be null.'),
  'tags-null-value': F('col-1.2-Tags', 'Requirements', "Tags MAY include tag keys with a null value for a given resource depending on the provider's tag finalization process."),
  'kv-json': F('attr-1.2-key-value-format', 'Requirements', 'Key-Value Format columns MUST contain a serialized JSON string, consistent with the ECMA 404 definition of an object.'),
  'kv-unique': F('attr-1.2-key-value-format', 'Requirements', 'Keys in a key-value pair MUST be unique within an object.'),
  'kv-values': F('attr-1.2-key-value-format', 'Requirements', 'Values in a key-value pair MUST be one of the following types: number, string, true, false, or null.'),
  'kv-flat': F('attr-1.2-key-value-format', 'Requirements', 'Values in a key-value pair MUST NOT be an object or an array.'),
  'resource-use': F('col-1.2-ResourceId', 'Description', 'The Resource ID is commonly used for cost reporting, analysis, and allocation scenarios.'),
  'resource-null': F('col-1.2-ResourceId', 'Requirements', 'ResourceId MUST be null when a charge is not related to a resource.'),
  'subaccount-use': F('col-1.2-SubAccountId', 'Description', 'Sub Account ID is commonly used for scenarios like grouping based on organizational constructs, access management needs, and cost allocation strategies.'),
  'subaccount-present': F('col-1.2-SubAccountId', 'Requirements', 'SubAccountId MUST be present in a FOCUS dataset when the provider supports a sub account construct.'),
  'subaccount-null': F('col-1.2-SubAccountId', 'Requirements', 'SubAccountId MUST be null when a charge is not related to a sub account.'),
  'subaccount-not-null': F('col-1.2-SubAccountId', 'Requirements', 'SubAccountId MUST NOT be null when a charge is related to a sub account.'),
  'subaccount-name-null': F('col-1.2-SubAccountName', 'Requirements', 'SubAccountName MUST be null when SubAccountId is null.'),
  'commit-status-def': F('col-1.2-CommitmentDiscountStatus', 'Description', 'Commitment Discount Status indicates whether the charge corresponds with the consumption of a commitment discount identified in the CommitmentDiscountId column or the unused portion of the committed amount.'),
  'commit-used': F('col-1.2-CommitmentDiscountStatus', 'Allowed values, Used', 'Charges that utilized a specific amount of a commitment discount.'),
  'commit-unused': F('col-1.2-CommitmentDiscountStatus', 'Allowed values, Unused', 'Charges that represent the unused portion of the commitment discount.'),
  'commit-status-null': F('col-1.2-CommitmentDiscountStatus', 'Requirements', 'CommitmentDiscountStatus MUST be null when CommitmentDiscountId is null.'),
  'commit-id-null': F('col-1.2-CommitmentDiscountId', 'Requirements', 'CommitmentDiscountId MUST be null when a charge is not related to a commitment discount.'),
  'commit-id-use': F('col-1.2-CommitmentDiscountId', 'Description', 'Commitment Discount ID is commonly used for scenarios like chargeback for commitments and savings per commitment discount.'),
  'vendor-aws': F('vendor-aws', 'FOCUS 1.0 with AWS columns', 'The FOCUS 1.0 with AWS columns table contains your cost and usage data formatted with FinOps Open Cost and Usage Specification (FOCUS) 1.0, along with five additional columns from AWS that contain proprietary billing data.'),
  'vendor-azure': F('vendor-azure-schema', 'FOCUS cost and usage details file schema', "The FOCUS version of the cost and usage details file uses columns, values, and semantics as they're defined in the FinOps Open Cost and Usage Specification (FOCUS) project."),
  'vendor-azure-seconds': F('vendor-azure-schema', 'Change notes', 'The only difference is the extra ":00" for seconds at the end of the time segment of the ISO formatted date string.'),
  'vendor-azure-csv': F('vendor-azure-export', 'Create a new export', 'Choose the Format as CSV or Parquet.'),
  'vendor-google': F('vendor-google', 'Set up Cloud Billing data export to BigQuery', 'The FOCUS usage cost export is an immutable BigQuery dataset that contains your detailed usage cost data normalized using the FinOps Open Cost and Usage Specification (FOCUS) standards.')
};

// "<Column> MUST be present in a FOCUS dataset." is on the page of every column of version 1.2 that is always present;
// the page of a column of version 1.4 states the feature level in its constraints table instead.
export const presentSentence = (column) => `${column} MUST be present in a FOCUS dataset.`;
