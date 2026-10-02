# Contributing

Every change goes through a pull request and is reviewed before it is merged. The pipeline runs the tests on Linux, Windows and macOS, the repository checks, CodeQL, and a secure development check of the repository itself.

Commit messages in this repository follow Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `ci:`, with `!` for a breaking change.

## Changing a check

1. Describe the change in docs/method.md first: what the check reports, its severity, what it can see and what it cannot, and the sentence of the page it rests on. Where the tool makes a conclusion of its own (a severity, a default limit, a reading of what an empty cell means), say so and say why, and say it in the message of the finding too.
2. Add a test with the export written inline, small enough that the result can be worked out by hand, and a near miss that must not match. Use made-up names.
3. A value of the file reaches a finding only as the name of what the finding is about (a service, a category, an account, a tag key that the user named) or as a total, and a resource ID only shortened. No tag value is kept or shown. Names from a file go through `safeText`, so control characters are removed.
4. A finding id, once released, keeps its meaning: pipelines and other tools read it from the JSON and CSV reports.
5. A thing the tool cannot read is reported, never skipped. A row that is not valid, a Tags cell that cannot be read, and a check that cannot be made give a finding or a note, and no total is made from a value that was guessed.

## Changing a quoted sentence, a column name or a list of values

The sentences, the column IDs, the lists of mandatory columns and the allowed values in `src/data.js` come from the pages saved in `research/sources`. When a page changes, or a new version of the specification is released, save the new text in `research/sources` (the address on the first line), change `src/data.js` to match, and regenerate docs/rules-and-sources.md. `test/data.test.js` compares every sentence, every column page and every list with the saved text, so changing one without the other fails.

Never add a fact, a requirement or a check from memory or from a blog post. A new check needs the page, opened and saved, and the words of the page that give the sentence. If no page states the fact, the check is not added: it goes in docs/limits.md with the reason. Keep a quoted sentence free of a calendar year, because the documents carry none.

## Changing the CSV reader

The reader in `src/csv.js` is the base of every check.

1. Add a test for every form you add and one for the near miss. Keep the read linear: each character looked at a bounded number of times, no search that starts again from the beginning.
2. Quotes, line ends and field counts stay strict, and the limits on records, columns and the length of a field stay. Add a hostile-input test with a time limit for a new shape.
3. Every error has a line number.

## Money

A cost is a whole number of units of 10^-18 from `src/decimal.js`. Never use a JavaScript number for an amount, and never round an amount to add it. A new sum goes through `parseDecimal`, and a new percentage through `formatPercent` or `exceedsPercent`.

## Paths and platforms

The tool reads one file. A test that depends on the system must say so and be guarded with `process.platform`: a backslash separates folders on Windows and is an ordinary character in a file name on Linux and macOS, a link may not be allowed, a name may or may not be case sensitive, and a device such as `/dev/null` is not there on Windows. Build paths in tests with `resolve()` from names with forward slashes. Write the line ends of a CSV fixture in the test itself (`\n` or `\r\n`), because a file in the repository takes the line ends of the checkout. The report shows the name of the file and never a path.

## Rules for the code

- No runtime dependencies. Node 22 or newer and nothing else.
- The tool reads the file it is given and writes only to the screen. It fetches nothing, opens no network connection, calls no cloud, and runs no program.
- Source files stay ASCII; build any other character from its number.
- Never commit a real secret or key, even as a fixture. `npm run check` fails on anything that looks like a credential.
- The README and the documents carry no dates or years.

## Before you open the pull request

```
npm test
npm run check
npm run example
```
