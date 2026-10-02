# 1. The tool reads CSV with a reader of its own

## Context

Every number in a report comes from a cost export that the tool did not write. The reader decides what the tool sees: a reader that is forgiving can read two different tables from one file, and a reader that is slow or recursive can be made to fail by a file that is built for it. Many CSV readers accept a quote in the middle of a field, text after a closing quote, a record that is too short (filled with empty values), a lone carriage return as a line end, and a blank line; each of these hides a broken export, and a missing field in a cost row changes a total without a word.

## Decision

The tool has a CSV reader of its own that reads RFC 4180 and nothing more, and refuses everything else with the line number. It works on one string and calls a function for each record, so no list of all records is built. It has limits on the number of records and columns and on the length of a field and of the header. The money is read into whole numbers of a small unit, so that no floating point is used.

## Consequences

- A broken export is refused with a message that says where, and the tool does not report numbers from a file it could not read as written.
- A file with another delimiter, another quote rule or a blank line is refused. Fixing the export is the answer, and [inputs.md](../inputs.md) says what the file must look like.
- The reader is small enough to test line by line, and every refusal has a test and a near miss that is accepted.
- The tool does not parse JSON with a general parser: the Tags cell is read by a reader of a flat object, so a cell cannot nest, repeat a key or make the reader recurse.
