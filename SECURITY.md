# Security

## Reporting a problem

Write to info@innerluxes.dev with the subject line "focus-cost-check security", or use private vulnerability reporting on this repository. Please do not open a public issue for a vulnerability.

Include a small made-up export file that shows the problem, what you expected and what happened. Use made-up names, and no real data, credentials, account numbers, internal addresses or customer information.

## Scope

In scope:

- an input that makes the tool fetch an address, open a network connection, call a cloud, run any program, or open a file other than the one it was given
- an input that makes the tool print a tag value, or any value of the file other than the names listed in docs/secure-defaults.md
- an input that makes the tool hang, take very long, run out of memory, overflow the stack or crash, such as a long run of quotes, a very long field, very many columns, records or distinct names, a deeply nested tags cell, or a path that is not a regular file
- an input that the CSV reader accepts but should refuse (a quote inside an unquoted field, text after a closing quote, a short record, a lone carriage return, an empty line), or that it refuses but docs/method.md says it reads
- text from a name that breaks a Markdown table, injects a formula into a CSV report, or rewrites the terminal through control or direction characters
- a sum that is not exact, a cost that is rounded or guessed instead of refused, or costs in different currencies that are added together
- a finding that docs/method.md says is reported, for an input the tool accepts, that the report leaves out

Out of scope: whether your cloud spend is under control (docs/limits.md lists what a cost file cannot show), the content of the specification and of the documentation pages, the accuracy of the export that a cloud wrote, and how your pipeline stores the export and the reports.

Read [docs/threat-model.md](docs/threat-model.md) for the rest.
