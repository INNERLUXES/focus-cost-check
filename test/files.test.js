import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { symlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { CSV_LIMITS, InputError, decodeCsv, displayName, readExportFile, sizeText } from '../src/index.js';
import { withFiles } from './helpers.js';

const E = String.fromCharCode(0xe9);

// Platform notes for this file. On Windows a backslash separates folders and a name is not case sensitive. On Linux and
// macOS a backslash is an ordinary character in a file name, and a name is case sensitive on Linux. Tests that depend on
// this are guarded with process.platform, and the other tests build every path with resolve() from names with forward
// slashes. The line ends of a file are written in the test itself, never taken from a file in the repository.

test('files: a regular file is read whole, from a path made with resolve', async () => {
  await withFiles({ 'export.csv': 'a,b\n1,2\n' }, async (dir) => {
    const bytes = await readExportFile(resolve(dir, 'export.csv'));
    assert.equal(bytes.toString('utf8'), 'a,b\n1,2\n');
  });
});

test('files: a name with spaces, a folder with spaces and a name with non-ASCII letters are read', async () => {
  await withFiles({ [`my exports/jan ${E}.csv`]: 'a\n1\n' }, async (dir) => {
    assert.equal((await readExportFile(resolve(dir, 'my exports', `jan ${E}.csv`))).length, 4);
  });
});

test('files: a file that does not exist is an input error that names the file and not its folder', async () => {
  await withFiles({}, async (dir) => {
    await assert.rejects(readExportFile(resolve(dir, 'missing.csv')), (e) => e instanceof InputError && /^missing\.csv: no such file$/.test(e.message));
  });
});

test('files: a folder is refused with the way to give the file, and it is not read', async () => {
  await withFiles({ 'sub/export.csv': 'a\n' }, async (dir) => {
    await assert.rejects(readExportFile(resolve(dir, 'sub')), (e) => e instanceof InputError && /is a folder/.test(e.message) && /CSV file/.test(e.message));
  });
});

test('files: a file over the size limit is refused from the size of the open file, before it is read', async () => {
  await withFiles({ 'big.csv': 'x'.repeat(100) }, async (dir) => {
    await assert.rejects(readExportFile(resolve(dir, 'big.csv'), { ...CSV_LIMITS, maxFileBytes: 99 }), (e) => e instanceof InputError && /is 100 bytes, over the 99 bytes limit/.test(e.message));
    assert.equal((await readExportFile(resolve(dir, 'big.csv'), { ...CSV_LIMITS, maxFileBytes: 100 })).length, 100);
  });
});

test('files: the size limit is 128 MB and is written that way', () => {
  assert.equal(CSV_LIMITS.maxFileBytes, 128 * 1024 * 1024);
  assert.equal(sizeText(CSV_LIMITS.maxFileBytes), '128 MB');
  assert.equal(sizeText(1), '1 bytes');
  assert.equal(sizeText(1536), '1,536 bytes');
  assert.equal(sizeText(1572864), '1.5 MB');
});

test('files: a file that is not a regular file is refused (a character device, on systems that have /dev/null)', async (t) => {
  if (process.platform === 'win32' || !existsSync('/dev/null')) {
    t.skip('this system has no /dev/null');
    return;
  }
  await assert.rejects(readExportFile('/dev/null'), (e) => e instanceof InputError && /not a regular file/.test(e.message));
});

test('files: a link that the user names is followed to a regular file, where the system allows links', async (t) => {
  await withFiles({ 'real.csv': 'a\n2\n' }, async (dir) => {
    try {
      await symlink(resolve(dir, 'real.csv'), resolve(dir, 'link.csv'));
    } catch {
      t.skip('this system does not allow symbolic links here');
      return;
    }
    assert.equal((await readExportFile(resolve(dir, 'link.csv'))).toString('utf8'), 'a\n2\n');
  });
});

test('files: a link that leads nowhere is an input error, where the system allows links', async (t) => {
  await withFiles({}, async (dir) => {
    try {
      await symlink(resolve(dir, 'nowhere.csv'), resolve(dir, 'dangling.csv'));
    } catch {
      t.skip('this system does not allow symbolic links here');
      return;
    }
    await assert.rejects(readExportFile(resolve(dir, 'dangling.csv')), (e) => e instanceof InputError && /^dangling\.csv: /.test(e.message));
  });
});

test('files: the name shown is the last part of the path, with control characters cleaned', () => {
  assert.equal(displayName(resolve('/some/folder/export.csv')), 'export.csv');
  assert.equal(displayName(`${resolve('/some/folder')}/a${String.fromCharCode(27)}[31mb.csv`), 'a [31mb.csv');
  assert.equal(displayName(`${resolve('/some/folder')}/${'n'.repeat(300)}.csv`).length, 120);
});

test('files: on Windows a backslash separates folders, so the name is the last part', (t) => {
  if (process.platform !== 'win32') {
    t.skip('a backslash is an ordinary character in a file name on this system');
    return;
  }
  assert.equal(displayName('C:\\data\\exports\\jan.csv'), 'jan.csv');
});

test('files: on Linux and macOS a backslash is part of the file name, and the file is read under that name', async (t) => {
  if (process.platform === 'win32') {
    t.skip('a backslash separates folders on Windows');
    return;
  }
  await withFiles({ 'we\\ird.csv': 'a\n3\n' }, async (dir) => {
    const path = resolve(dir, 'we\\ird.csv');
    assert.equal(displayName(path), 'we\\ird.csv');
    assert.equal((await readExportFile(path)).toString('utf8'), 'a\n3\n');
  });
});

test('files: a name that differs only by case is found where the file system ignores case, and refused on Linux', async (t) => {
  await withFiles({ 'Export.csv': 'a\n4\n' }, async (dir) => {
    if (process.platform === 'linux') {
      await assert.rejects(readExportFile(resolve(dir, 'export.csv')), (e) => e instanceof InputError && /no such file/.test(e.message));
    } else if (process.platform === 'win32') {
      assert.equal((await readExportFile(resolve(dir, 'export.csv'))).length, 4);
    } else {
      t.skip('macOS can be set up either way');
    }
  });
});

test('decode: UTF-8 text is read, and a byte order mark at the start is removed', () => {
  assert.equal(decodeCsv(Buffer.from('a,b\n1,2\n', 'utf8')), 'a,b\n1,2\n');
  assert.equal(decodeCsv(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('a,b\n', 'utf8')])), 'a,b\n');
  assert.equal(decodeCsv(Buffer.from(`${E}\n`, 'utf8')), `${E}\n`);
});

test('decode: tabs, line feeds and carriage returns are text, and no other control byte is', () => {
  assert.equal(decodeCsv(Buffer.from('a\tb\r\nc\n', 'utf8')), 'a\tb\r\nc\n');
  for (const byte of [0x00, 0x01, 0x08, 0x0b, 0x0c, 0x0e, 0x1b, 0x1f]) {
    assert.throws(() => decodeCsv(Buffer.from([0x61, byte, 0x62])), (e) => e instanceof InputError && /is not text/.test(e.message), `0x${byte.toString(16)}`);
  }
});

test('decode: the message names the byte and its offset', () => {
  assert.throws(() => decodeCsv(Buffer.from([0x61, 0x62, 0x00, 0x63]), 'x.csv'), (e) => e.message.startsWith('x.csv is not text: it holds the byte 0x00 at offset 2'));
});

test('decode: Parquet, gzip, zip and UTF-16 files are refused with what to do', () => {
  assert.throws(() => decodeCsv(Buffer.from('PAR1xxxx', 'latin1'), 'a.parquet'), /Parquet file. This tool reads CSV only/);
  assert.throws(() => decodeCsv(Buffer.from([0x1f, 0x8b, 0x08, 0x00])), /compressed \(gzip\)/);
  assert.throws(() => decodeCsv(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14])), /zip archive/);
  assert.throws(() => decodeCsv(Buffer.from([0xff, 0xfe, 0x61, 0x00])), /UTF-16/);
  assert.throws(() => decodeCsv(Buffer.from([0xfe, 0xff, 0x00, 0x61])), /UTF-16/);
});

test('decode: bytes that are not valid UTF-8 are refused', () => {
  assert.throws(() => decodeCsv(Buffer.from([0x61, 0xc3, 0x28, 0x62])), /not valid UTF-8/);
  assert.throws(() => decodeCsv(Buffer.from([0x61, 0xff, 0x62])), /not valid UTF-8/);
});
