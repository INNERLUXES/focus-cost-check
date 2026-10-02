# Changes

## 1.0.0

First release.

- Reads a cloud cost and usage export in the FinOps Open Cost and Usage Specification (FOCUS) format, as CSV, and reports what makes the spend hard to own or control. Reads one file. Never calls a cloud, never fetches anything, never prints a tag value or a row of the file. Parquet is not read.
- Errors: `focus-columns-missing`, `rows-invalid` and `currency-mixed`.
- Warnings: `untagged-cost`, `tag-key-missing` and `cost-spike`.
- Info findings, which never fail a run: `focus-columns-unknown`, `tags-column-missing`, `tags-unreadable`, `no-owner-account`, `commitment-coverage`, `charge-category-total` and `check-not-run`.
- Every finding names what it is about, gives the numbers and a fix, and quotes the sentences of the FOCUS specification, or of the documentation of a cloud, that it rests on, with the address of the page.
- Money is added as exact decimals, in whole numbers of a small unit, with no floating point. A cost that needs more than 18 decimal places is refused, not rounded. Costs in different currencies are never added; `--currency` picks one.
- Options: `--require-tag` (repeatable), `--untagged-max`, `--spike-percent`, `--spike-min`, `--group-by`, `--currency`, `--top`, `--format` and `--fail-on`.
- A strict CSV reader of its own: RFC 4180 and nothing more, with a line number for every error. A quote inside an unquoted field, text after a closing quote, a quote that is never closed, a short or long record, a lone carriage return and an empty line are refused. The size of the file, the number of records and columns, and the length of a field and of the header are limited.
- A file that is not text (binary, Parquet, gzip, zip, UTF-16) is refused with what to do, and exit code `2`.
- The pages of the specification (versions 1.2 and 1.4, every column page of each) and of the clouds are saved in `research/sources`; a test compares every quoted sentence, every list of mandatory columns and every list of allowed values with the saved text. Checks that no saved page supports are listed in `docs/limits.md` and are not in the tool.
- Reports as text, Markdown, JSON and CSV; `--fail-on` for a pipeline gate; info never fails the run; exit code `2` for a usage or input error.
- Release packages come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
