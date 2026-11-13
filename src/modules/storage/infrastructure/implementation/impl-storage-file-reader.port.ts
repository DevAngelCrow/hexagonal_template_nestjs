import { Injectable, Optional } from '@nestjs/common';
import { extname, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { StorageFileReaderPort } from '@/modules/storage/domain/ports/storage-file-reader.port';
import { S3StorageBackend } from '@/modules/storage/infrastructure/backends/s3-storage.backend';
import { MIME_TO_EXTENSION } from '@/modules/storage/infrastructure/config/multer-file-filter.config';
import { resolveConfinedStoragePath } from '@/modules/storage/infrastructure/utils/storage-path.util';

const EXTENSION_TO_MIME: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(MIME_TO_EXTENSION).map(([mime, ext]) => [ext, mime]),
);

@Injectable()
export class ImplStorageFileReaderPort extends StorageFileReaderPort {
  private readonly diskPath = resolve(process.cwd(), 'storage');

  constructor(
    @Optional() private readonly s3StorageBackend?: S3StorageBackend,
  ) {
    super();
  }

  async readFileAsBase64(filePath: string): Promise<string | null> {
    if (!filePath || typeof filePath !== 'string') return null;

    if (
      filePath.startsWith('http://') ||
      filePath.startsWith('https://') ||
      filePath.startsWith('data:') ||
      filePath.startsWith('blob:')
    ) {
      return filePath;
    }

    const confinedPath = resolveConfinedStoragePath(this.diskPath, filePath);
    if (!confinedPath) {
      return null;
    }

    try {
      const buffer = await readFile(confinedPath);
      const ext = extname(confinedPath).slice(1).toLowerCase();
      const mime = EXTENSION_TO_MIME[ext] ?? 'application/octet-stream';
      return `data:${mime};base64,${buffer.toString('base64')}`;
    } catch {
      return null;
    }
  }

  async readFileBuffer(
    filePath: string,
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    if (!filePath || typeof filePath !== 'string') return null;

    const ext = extname(filePath).slice(1).toLowerCase();
    const mimeType = EXTENSION_TO_MIME[ext] ?? 'application/octet-stream';

    if (
      filePath.startsWith('s3://') ||
      filePath.startsWith('http://') ||
      filePath.startsWith('https://')
    ) {
      if (!this.s3StorageBackend) return null;
      const s3Buffer = await this.s3StorageBackend.readBuffer(filePath);
      if (!s3Buffer) return null;
      return { buffer: s3Buffer, mimeType };
    }

    const confinedPath = resolveConfinedStoragePath(this.diskPath, filePath);
    if (!confinedPath) {
      return null;
    }

    try {
      const buffer = await readFile(confinedPath);
      return { buffer, mimeType };
    } catch {
      return null;
    }
  }
}
