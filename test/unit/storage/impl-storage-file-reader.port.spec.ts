import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { ImplStorageFileReaderPort } from '@/modules/storage/infrastructure/implementation/impl-storage-file-reader.port';

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
    const r2Url = 'https://pub-733d7b1f7319443b80c87367632b37eb.r2.dev/inventory_img/silla-123.jpg';
    const result = await reader.readFileAsBase64(r2Url);
    expect(result).toBe(r2Url);
    expect(readFile).not.toHaveBeenCalled();
  });

  it('should return data URI as-is without reading from disk', async () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
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

  it('should read local file and return base64 data URI with correct MIME type', async () => {
    const fakeBuffer = Buffer.from('fake-png-content');
    vi.mocked(readFile).mockResolvedValueOnce(fakeBuffer as any);

    const result = await reader.readFileAsBase64('/storage/profile_img/avatar.png');

    expect(readFile).toHaveBeenCalledWith('/storage/profile_img/avatar.png');
    expect(result).toBe(`data:image/png;base64,${fakeBuffer.toString('base64')}`);
  });

  it('should return null when reading local file fails', async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));

    const result = await reader.readFileAsBase64('/nonexistent/path/image.jpg');

    expect(readFile).toHaveBeenCalledWith('/nonexistent/path/image.jpg');
    expect(result).toBeNull();
  });
});
