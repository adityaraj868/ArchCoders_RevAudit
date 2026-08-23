const { mockClient } = require('aws-sdk-client-mock');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// s3StorageService validates and reads this config the moment it's
// required, so it must be set before that first require — never real
// credentials, this is a mocked client that never touches the network.
process.env.AWS_ACCESS_KEY = 'test-access-key';
process.env.AWS_SECRET_KEY = 'test-secret-key';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_BUCKET_NAME = 'revaudit-test-bucket';

const s3StorageService = require('../src/services/storage/s3StorageService');

const s3Mock = mockClient(S3Client);
const PRESENTATION_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

beforeEach(() => {
  s3Mock.reset();
});

describe('s3StorageService', () => {
  test('uploads the buffer to the configured bucket under a presentation-scoped key', async () => {
    s3Mock.on(PutObjectCommand).resolves({});

    const buffer = Buffer.from('hello world');
    const { filename, storagePath } = await s3StorageService.save({
      buffer,
      originalName: 'deck.pdf',
      presentationId: PRESENTATION_ID,
      mimeType: 'application/pdf',
    });

    expect(filename.endsWith('.pdf')).toBe(true);
    expect(storagePath).toBe(`${PRESENTATION_ID}/${filename}`);

    const calls = s3Mock.commandCalls(PutObjectCommand);
    expect(calls).toHaveLength(1);
    expect(calls[0].args[0].input).toMatchObject({
      Bucket: 'revaudit-test-bucket',
      Key: storagePath,
      Body: buffer,
      ContentType: 'application/pdf',
    });
    // No ACL is ever set — the bucket stays private; nothing here makes an
    // object world-readable.
    expect(calls[0].args[0].input.ACL).toBeUndefined();
  });

  test('drops an unsafe or malformed extension instead of using it verbatim', async () => {
    s3Mock.on(PutObjectCommand).resolves({});

    const { filename } = await s3StorageService.save({
      buffer: Buffer.from('x'),
      originalName: '../evil.sh; rm -rf /',
      presentationId: PRESENTATION_ID,
      mimeType: 'text/plain',
    });

    expect(filename).not.toMatch(/[\s;/]/);
  });

  test('falls back to a generic content type when the caller does not supply one', async () => {
    s3Mock.on(PutObjectCommand).resolves({});

    await s3StorageService.save({
      buffer: Buffer.from('x'),
      originalName: 'mystery',
      presentationId: PRESENTATION_ID,
    });

    expect(s3Mock.commandCalls(PutObjectCommand)[0].args[0].input.ContentType).toBe('application/octet-stream');
  });

  test('generates a time-limited signed URL rather than a bare bucket URL', async () => {
    const url = await s3StorageService.getUrl('some/key.pdf');

    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain('revaudit-test-bucket');
    expect(url).toContain('X-Amz-Signature');
    expect(url).toContain('X-Amz-Expires=3600');
  });

  test('honors a custom expiry', async () => {
    const url = await s3StorageService.getUrl('some/key.pdf', { expiresInSeconds: 60 });
    expect(url).toContain('X-Amz-Expires=60');
  });
});
