const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const localStorageService = require('../src/services/storage/localStorageService');
const env = require('../src/config/env');

async function cleanup(presentationId) {
  await fs.rm(path.join(env.uploadDir, presentationId), { recursive: true, force: true });
}

describe('localStorageService', () => {
  test('writes the buffer to disk under a presentation-scoped folder', async () => {
    const presentationId = crypto.randomUUID();
    const buffer = Buffer.from('hello world');

    const { filename, storagePath } = await localStorageService.save({
      buffer,
      originalName: 'notes.pdf',
      presentationId,
    });

    expect(filename.endsWith('.pdf')).toBe(true);
    expect(storagePath).toBe(`${presentationId}/${filename}`);

    const written = await fs.readFile(path.join(env.uploadDir, storagePath));
    expect(written.equals(buffer)).toBe(true);
    expect(localStorageService.getUrl(storagePath)).toBe(`/uploads/${storagePath}`);

    await cleanup(presentationId);
  });

  test('two uploads for the same presentation never collide', async () => {
    const presentationId = crypto.randomUUID();

    const a = await localStorageService.save({ buffer: Buffer.from('a'), originalName: 'a.pdf', presentationId });
    const b = await localStorageService.save({ buffer: Buffer.from('b'), originalName: 'b.pdf', presentationId });

    expect(a.filename).not.toBe(b.filename);
    const contentsA = await fs.readFile(path.join(env.uploadDir, a.storagePath), 'utf8');
    const contentsB = await fs.readFile(path.join(env.uploadDir, b.storagePath), 'utf8');
    expect(contentsA).toBe('a');
    expect(contentsB).toBe('b');

    await cleanup(presentationId);
  });

  test('drops an unsafe or malformed extension instead of using it verbatim', async () => {
    const presentationId = crypto.randomUUID();

    const { filename } = await localStorageService.save({
      buffer: Buffer.from('x'),
      originalName: '../evil.sh; rm -rf /',
      presentationId,
    });

    expect(filename).not.toMatch(/[\s;/]/);

    await cleanup(presentationId);
  });
});
