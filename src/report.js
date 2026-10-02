// Report formats: text for a terminal, Markdown for a pull request or job summary, JSON for other tools, CSV for a
// spreadsheet. Findings are listed in the order of the checks, and within a check by size. A finding names the check,
// what it is about, the numbers, a fix, and the sentences of the FOCUS specification or of a cloud's documentation that
// it quotes, with the address of the page. No report holds a tag value or a row of the file.

function plural(count, one, many = `${one}s`) {
  return `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;
}

function countsLine(c) {
  return `${c.error} error, ${c.warning} warning, ${c.info} info`;
}

function gateLine(r) {
  return r.gate.pass ? `GATE: PASS (--fail-on ${r.gate.failOn})` : `GATE: FAIL - ${r.gate.reason}`;
}

// "54 rows, 31 columns, FOCUS 1.0 to 1.2 columns, currency USD, 2 charge periods (2100-01 to 2100-02)"
function inputLine(r) {
  const i = r.input;
  const parts = [plural(i.rows, 'row'), plural(i.columns, 'column'), i.layout.label];
  if (i.currency) parts.push(`currency ${i.currency}`);
  else if (i.currencies.length > 1) parts.push(`currencies ${i.currencies.map((c) => c.code).join(', ')}`);
  if (i.periods.length > 0) parts.push(`${plural(i.periods.length, 'charge period')} (${i.periods.length === 1 ? i.periods[0].period : `${i.periods[0].period} to ${i.periods.at(-1).period}`})`);
  return parts.join(', ');
}

const usageLine = (r) => (r.input.usage ? `usage: ${r.input.usage.effective} ${r.input.currency} effective cost in ${plural(r.input.usage.rows, 'row')}` : null);

export function toText(r) {
  const lines = [`focus-cost-check: ${r.target}`, `read: ${inputLine(r)}`];
  const usage = usageLine(r);
  if (usage) lines.push(usage);
  lines.push(`findings: ${countsLine(r.counts)}`);
  if (!r.findings.length) lines.push('', 'no findings');
  for (const f of r.findings) {
    lines.push('', `${f.severity.toUpperCase().padEnd(7)}  ${f.id}  ${f.subject}`);
    lines.push(`         ${f.message}`);
    for (const l of f.lines) lines.push(`         ${l}`);
    lines.push(`         fix: ${f.fix}`);
    for (const m of f.manual) lines.push(`         source (${m.page}, ${m.section}): "${m.quote}"`, `           ${m.url}`);
  }
  if (r.notes.length) lines.push('');
  for (const note of r.notes) lines.push(`note: ${note}`);
  lines.push('', gateLine(r));
  return lines.join('\n') + '\n';
}

// A Markdown table cell: backslashes and pipes escaped, line breaks flattened, and <, > and & written as entities, so
// text from the file cannot break the table or be read as HTML.
export function mdCell(t) {
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n|\r/g, ' ');
}

export function toMarkdown(r) {
  const lines = [`## focus-cost-check: ${countsLine(r.counts)}`, '', `${mdCell(r.target)}, ${mdCell(inputLine(r))}.`];
  const usage = usageLine(r);
  if (usage) lines.push('', `${mdCell(usage.charAt(0).toUpperCase() + usage.slice(1))}.`);
  if (!r.findings.length) lines.push('', 'No findings.');
  else {
    lines.push('', '| Severity | Check | About | Message | Details | Fix | Source |', '| --- | --- | --- | --- | --- | --- | --- |');
    for (const f of r.findings) {
      const source = f.manual.map((m) => `[${mdCell(`${m.page}, ${m.section}`)}](${m.url}): "${mdCell(m.quote)}"`).join('<br>');
      lines.push(`| ${f.severity} | ${mdCell(f.id)} | ${mdCell(f.subject)} | ${mdCell(f.message)} | ${f.lines.map(mdCell).join('<br>') || '-'} | ${mdCell(f.fix)} | ${source || '-'} |`);
    }
  }
  if (r.notes.length) lines.push('');
  for (const note of r.notes) lines.push(`- ${mdCell(note)}`);
  lines.push('', r.gate.pass ? `**Gate passed** (--fail-on ${r.gate.failOn}).` : `**Gate failed:** ${mdCell(r.gate.reason)}.`);
  return lines.join('\n') + '\n';
}

export function toJson(r) {
  return JSON.stringify(r, null, 2) + '\n';
}

// RFC 4180 quoting, and a leading quote on cells a spreadsheet would read as a formula.
export function csvCell(value) {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// One row per finding. value and limit are percentages when the check has them. source_page, source_section and
// source_url name the first sentence the finding quotes; the JSON report has all of them.
export function toCsv(r) {
  const rows = [['severity', 'id', 'subject', 'value', 'limit', 'message', 'fix', 'source_page', 'source_section', 'source_url']];
  for (const f of r.findings) {
    const m = f.manual[0];
    rows.push([f.severity, f.id, f.subject, f.value, f.limit, f.message, f.fix, m ? m.page : '', m ? m.section : '', m ? m.url : '']);
  }
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
