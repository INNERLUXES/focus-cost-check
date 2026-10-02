# Secure defaults

What the tool does and does not do on a machine, so that you can run it on a cost export in a pipeline without a surprise.

- **It reads one file.** The path on the command line. It opens it, takes the type and the size from the open file, and reads it only when it is a regular file under the limit. A symbolic link that you name is followed, as for any program.
- **It writes nothing.** The report goes to standard output, and errors go to standard error. The tool creates no file, no folder and no temporary file.
- **It opens no connection.** There is no network code. It never fetches a URL, and a URL in place of a path is refused. It never calls a cloud, so it needs no credentials.
- **It runs no program.** It starts no process and evaluates nothing from the file: no formula, no script, no JSON beyond the flat tag object that its own reader accepts.
- **It has no dependencies.** The package has no runtime dependencies; Node 22 or newer is all it needs.
- **It prints no tag value and no cost row.** The report holds totals, the names of services, categories and accounts, tag keys that you named with `--require-tag`, and resource IDs shortened to their first 16 and last 24 characters. A tag value is read only to see whether it is empty, and is never kept. The JSON report holds the same.
- **It cleans what it prints.** Names from the file go through a function that replaces control characters, line separators and direction controls with a space and cuts the length. The Markdown report escapes pipes, angle brackets, ampersands, backslashes and line breaks, and the CSV report puts a quote before a cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage return, so a name in the file cannot run as a formula or rewrite a terminal.
- **It has limits.** A file of 128 MB, 1,000,000 records, 500 columns, fields of 65,536 characters and a bounded number of different names, so a file that is not a cost export is refused and does not use the memory of the machine.

## In a pipeline

An export holds the names of your accounts and resources and what they cost. Keep it out of artifacts that others can download. The report holds fewer values than the export, but it still names services and accounts.
