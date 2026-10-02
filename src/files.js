// Reading the export file. The tool is given one path. It opens that file, takes the type and the size from the open file,
// so they cannot change between the check and the read, and reads it only when it is a regular file under the size limit.
// A symbolic link that the user names is followed, as it is for any program: the user chose that path. Nothing is written
// and nothing is fetched. The report shows the name of the file, never its path, so the report is the same on Linux,
// macOS and Windows and does not depend on what a backslash means there.

import { open, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { CSV_LIMITS } from './data.js';
import { InputError } from './errors.js';
import { safeText } from './rules.js';

export { InputError };

export const sizeText = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toLocaleString('en-US', { maximumFractionDigits: 1 })} MB` : `${bytes.toLocaleString('en-US')} bytes`);

// The name of a file as shown in a report or a message: the last part of the path, cleaned.
export const displayName = (path) => safeText(basename(String(path)), 120);

// Decodes the bytes of the file as UTF-8 text. The tool reads CSV only, so a file that starts like a Parquet, gzip or zip
// file, a UTF-16 file and a file with a NUL or another control byte are refused with a message that says what to do.
export function decodeCsv(buffer, name = 'the file') {
  if (buffer.length >= 4 && buffer.toString('latin1', 0, 4) === 'PAR1') throw new InputError(`${name} is a Parquet file. This tool reads CSV only; export the data as CSV.`);
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) throw new InputError(`${name} is compressed (gzip). Decompress it first; this tool reads plain CSV text.`);
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && (buffer[2] === 3 || buffer[2] === 5) && (buffer[3] === 4 || buffer[3] === 6)) throw new InputError(`${name} is a zip archive. Unpack it first; this tool reads plain CSV text.`);
  if (buffer.length >= 2 && ((buffer[0] === 0xff && buffer[1] === 0xfe) || (buffer[0] === 0xfe && buffer[1] === 0xff))) {
    throw new InputError(`${name} is UTF-16 text. Write the CSV as UTF-8 (in Windows PowerShell, use "Out-File -Encoding utf8").`);
  }
  for (let i = 0; i < buffer.length; i += 1) {
    const b = buffer[i];
    if (b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d) throw new InputError(`${name} is not text: it holds the byte 0x${b.toString(16).padStart(2, '0')} at offset ${i.toLocaleString('en-US')}, which a CSV file does not hold.`);
  }
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer);
  } catch {
    throw new InputError(`${name} is not valid UTF-8 text, so it is not a CSV export.`);
  }
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

// Reads the file from disk and returns its bytes. Throws InputError with a message that names the file.
export async function readExportFile(path, limits = CSV_LIMITS) {
  const name = displayName(path);
  let info;
  try {
    info = await stat(path);
  } catch (error) {
    throw new InputError(`${name}: ${error.code === 'ENOENT' ? 'no such file' : `cannot be read (${error.code ?? error.message})`}`);
  }
  if (info.isDirectory()) throw new InputError(`${name} is a folder. Give the CSV file of the export; the tool reads one file and no folder.`);
  let handle;
  try {
    handle = await open(path, 'r');
  } catch (error) {
    throw new InputError(`${name}: cannot be read (${error.code ?? error.message})`);
  }
  try {
    const opened = await handle.stat();
    if (!opened.isFile()) throw new InputError(`${name} is not a regular file, so it was not read.`);
    if (opened.size > limits.maxFileBytes) throw new InputError(`${name} is ${sizeText(opened.size)}, over the ${sizeText(limits.maxFileBytes)} limit, so it was not read.`);
    const buffer = Buffer.alloc(opened.size);
    let done = 0;
    while (done < opened.size) {
      const { bytesRead } = await handle.read(buffer, done, opened.size - done, done);
      if (bytesRead === 0) break;
      done += bytesRead;
    }
    return buffer.subarray(0, done);
  } finally {
    await handle.close();
  }
}
