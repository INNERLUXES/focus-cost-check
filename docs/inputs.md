# Inputs

The tool reads one file: a cost and usage export in the FinOps Open Cost and Usage Specification (FOCUS) format, as CSV. It reads CSV only. Parquet is not read: a Parquet file is refused with a message that says to export the data as CSV.

## Where the file comes from

The clouds export FOCUS data themselves, and the tool reads what they write. These sentences are on the saved pages of the clouds, listed in [rules-and-sources.md](rules-and-sources.md).

- AWS: "The FOCUS 1.0 with AWS columns table contains your cost and usage data formatted with FinOps Open Cost and Usage Specification (FOCUS) 1.0, along with five additional columns from AWS that contain proprietary billing data." The five columns have the `x_` prefix, which the tool accepts.
- Microsoft: "The FOCUS version of the cost and usage details file uses columns, values, and semantics as they're defined in the FinOps Open Cost and Usage Specification (FOCUS) project." Its export page says "Choose the Format as CSV or Parquet." so choose CSV. The page also says of the dates: "The only difference is the extra ":00" for seconds at the end of the time segment of the ISO formatted date string." The tool reads a date with or without the seconds.
- Google Cloud: "The FOCUS usage cost export is an immutable BigQuery dataset that contains your detailed usage cost data normalized using the FinOps Open Cost and Usage Specification (FOCUS) standards." The export goes to BigQuery, so write the table to a CSV file yourself before you run the tool; the tool does not read BigQuery.

## What the file must look like

- A header line with the column IDs, written as the specification writes them (Pascal case, matched exactly), then one record per line.
- RFC 4180 quoting. A field with a comma, a quote or a line break is in double quotes, and a quote inside it is written twice. The `Tags` column is JSON text, so in a CSV file it is quoted and every quote in it is doubled; the clouds write it that way.
- UTF-8 text, with or without a byte order mark, with LF or CRLF line ends. A UTF-16 file, a file with a control byte, a gzip or zip file and a Parquet file are refused.
- Every record has as many fields as the header. An empty line is refused.
- The mandatory columns of the saved pages, listed in [method.md](method.md). Without them the file is not read as a FOCUS export, and the finding names what is missing.
- Costs as numbers in the Numeric Format of the specification: no thousands separator, no currency symbol, no plus sign. Dates in UTC as `YYYY-MM-DDTHH:mm:ssZ`. A currency as a three-letter code in capitals.

An empty cell, and the text `NULL`, are read as no value.

## Columns that the checks read

`BilledCost`, `EffectiveCost`, `BillingCurrency`, `ChargeCategory`, `ChargePeriodStart` and `ServiceName` are needed; without one of them the cost checks are not run. `ChargePeriodEnd`, `ServiceCategory`, `Tags`, `SubAccountId`, `SubAccountName`, `ResourceId`, `CommitmentDiscountId` and `CommitmentDiscountStatus` are read when the file has them, and a check that needs a column the file does not have is reported as not made, in a finding or a note.

## Limits

Each is an input error when it is reached: a file of 128 MB, 1,000,000 records, 500 columns, a field of 65,536 characters, a header of 16,384 characters, 50,000 different service, category or tag-key names, and 50 currencies. Up to 100,000 different resource IDs with untagged cost are kept, and the cost of the rest is added to one line.

## What is not read

A folder, standard input, a URL, a compressed file, a spreadsheet (xlsx) and Parquet. The tool opens the one file it is given and writes nothing.
