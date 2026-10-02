# Threat model

The tool is run on a file that someone else may have written or changed: an export that was downloaded, passed through a spreadsheet, or built by a script. What can go wrong, and what the tool does about it.

## What the tool protects

- The machine that runs it: no program is started, nothing is fetched, nothing is written, and memory and time are bounded.
- The person who reads the report: no control sequence reaches the terminal, no HTML or Markdown from the file is active, and no cell of the CSV report runs as a formula.
- The numbers: a sum is exact, a value that cannot be read is counted and not guessed, and costs in different currencies are never added.

## Inputs and the answer to each

| Input | What the tool does |
| --- | --- |
| A file that is not text (binary, Parquet, gzip, zip, UTF-16) | refused before any CSV is read, with what to do; exit code 2 |
| Broken CSV: a quote never closed, text after a quote, a short or long record, an empty line | refused with the line number; exit code 2 |
| A huge field, very many columns, very many records, a very long header | refused at the limit; the file is not read further |
| A long run of quotes | read in a single pass; the time is linear in the size |
| A Tags cell nested very deeply, with thousands of keys, or with a repeated key | read by an iterative reader of a flat object; a cell that is refused is counted as unreadable and never recurses |
| A name that is a prototype key (`__proto__`, `constructor`) | only a name; the totals are kept in maps, and nothing is merged into an object |
| A name with escape sequences, line separators or direction controls | replaced by a space in every report |
| A name that starts with a formula character | a quote is put before it in the CSV report |
| A cost with a plus sign, a comma, a currency symbol, text, or more than 18 decimal places | the row is not valid and is counted; it is never rounded and never added |
| Several currencies | an error finding, and no total |
| A path that is a folder, a device, a very large file | refused from the type and the size of the open file |

## Out of scope

The accuracy of the export that the cloud wrote, what a tag means in your organization, and how your pipeline stores the file and the reports. [limits.md](limits.md) lists what a cost file cannot show, and [secure-defaults.md](secure-defaults.md) lists what the tool does on a machine.
