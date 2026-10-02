## What changes

<!-- One or two sentences. -->

## Checks

- [ ] `npm test`, `npm run check` and `npm run example` pass, and the files under `examples/output` are the ones `npm run example` wrote
- [ ] A change to a check or to the CSV reader is described in docs/method.md, says what the check can and cannot see, and has a test with the export written inline and a near miss that must not match
- [ ] A change to a quoted sentence, a column ID or a list of values follows the source: the new page text is saved in research/sources, `src/data.js` and docs/rules-and-sources.md match it, and nothing was added from memory
- [ ] A check that no saved page supports is not added; it goes in docs/limits.md
- [ ] A conclusion that no source states (a severity, a default limit, a reading of an empty cell) is worded as the tool's own, in the message and in docs/method.md
- [ ] No tag value and no row of the export is printed, and a resource ID is shown shortened
- [ ] Money is added as exact decimals, no JavaScript number holds an amount, and costs in different currencies are never added
- [ ] The CSV reader still refuses a broken quote, a short record and an empty line, and every size limit still holds
- [ ] The tool still fetches nothing, opens no connection, runs no program, writes no file and never calls a cloud
- [ ] A thing the tool cannot read is reported as a finding or a note, never skipped and never shown as passed
- [ ] A test that depends on the operating system (a path, a backslash, a link, the case of a name, a line end) is guarded with `process.platform` or writes the line end itself
- [ ] No real secret, key or account number in fixtures or examples
- [ ] The commit messages of this pull request follow Conventional Commits
