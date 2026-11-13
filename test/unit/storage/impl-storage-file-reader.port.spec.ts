import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { ImplStorageFileReaderPort } from '@/modules/storage/infrastructure/implementation/impl-storage-file-reader.port';
import { S3StorageBackend } from '@/modules/storage/infrastructure/backends/s3-storage.backend';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('ImplStorageFileReaderPort', () => {
  const reader = new ImplStorageFileReaderPort();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return remote http URL as-is without reading from disk', async () => {
    const url = 'http://example.com/images/sample.jpg';
    const result = await reader.readFileAsBase64(url);
    expect(result).toBe(url);
    expect(readFile).not.toHaveBeenCalled();
  });

  it('should return remote https URL as-is (e.g. Cloudflare R2 / S3 public URL)', async () => {
    const r2Url =
      'https://pub-733d7b1f7319443b80c87367632b37eb.r2.dev/inventory_img/silla-123.jpg';
    const result = await reader.readFileAsBase64(r2Url);
    expect(result).toBe(r2Url);
    expect(readFile).not.toHaveBeenCalled();
  });

  it('should return data URI as-is without reading from disk', async () => {
    const dataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const result = await reader.readFileAsBase64(dataUri);
    expect(result).toBe(dataUri);
    expect(readFile).not.toHaveBeenCalled();
  });

  it('should return blob URL as-is without reading from disk', async () => {
    const blobUrl = 'blob:http://localhost:5174/0b17163c-e87f-4b07-9ba0';
    const result = await reader.readFileAsBase64(blobUrl);
    expect(result).toBe(blobUrl);
    expect(readFile).not.toHaveBeenCalled();
  });

  it('should read local file inside storage root and return base64 data URI with correct MIME type', async () => {
    const fakeBuffer = Buffer.from('fake-png-content');
    vi.mocked(readFile).mockResolvedValueOnce(fakeBuffer as any);

    const expectedPath = resolve(process.cwd(), 'storage', 'profile_img/avatar.png');
    const result = await reader.readFileAsBase64('profile_img/avatar.png');

    expect(readFile).toHaveBeenCalledWith(expectedPath);
    expect(result).toBe(
      `data:image/png;base64,${fakeBuffer.toString('base64')}`,
    );
  });

  it('should reject path traversal and paths outside storage root without calling readFile', async () => {
    const result = await reader.readFileAsBase64('../../etc/passwd');

    expect(readFile).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  describe('readFileBuffer', () => {
    it('reads a local PDF file from storage root with application/pdf mimeType', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n...');
      vi.mocked(readFile).mockResolvedValueOnce(pdfBuffer as any);

      const expectedPath = resolve(process.cwd(), 'storage', 'docs/document.pdf');
      const result = await reader.readFileBuffer('docs/document.pdf');

      expect(readFile).toHaveBeenCalledWith(expectedPath);
      expect(result).toEqual({
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
      });
    });

    it('delegates s3:// and https:// URLs to S3StorageBackend.readBuffer when available', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.7');
      const mockS3Backend = {
        readBuffer: vi.fn().mockResolvedValueOnce(pdfBuffer),
      } as unknown as S3StorageBackend;
      const readerWithS3 = new ImplStorageFileReaderPort(mockS3Backend);

      const result = await readerWithS3.readFileBuffer(
        's3://bucket/docs/sample.pdf',
      );

      expect(mockS3Backend.readBuffer).toHaveBeenCalledWith(
        's3://bucket/docs/sample.pdf',
      );
      expect(result).toEqual({
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
      });
    });

    it('returns null for remote paths when S3StorageBackend is not configured', async () => {
      const result = await reader.readFileBuffer(
        'https://cdn.example.com/a.pdf',
      );
      expect(result).toBeNull();
    });
  });
});
