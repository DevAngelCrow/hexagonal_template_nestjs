import { Injectable } from '@nestjs/common';
import { isAbsolute, join } from 'node:path';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Express } from 'express';
import { StorageBackend } from './storage-backend';
import { MIME_TO_EXTENSION } from '@/modules/storage/infrastructure/config/multer-file-filter.config';

@Injectable()
export class LocalStorageBackend extends StorageBackend {
  readonly code = 'LOCAL';
  private readonly diskPath = join(process.cwd(), 'storage');
  private readonly defaultBasePath = 'profile_img';

  async upload(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ path: string }> {
    const ext = MIME_TO_EXTENSION[file?.mimetype] ?? 'bin';
    const filename = randomUUID() + '.' + ext;
    const targetFolder = folder?.trim()
      ? folder.trim().replace(/^\/+|\/+$/g, '')
      : this.defaultBasePath;
    const folderPath = join(this.diskPath, targetFolder);
    await mkdir(folderPath, { recursive: true });
    const fullPath = join(folderPath, filename);
    await writeFile(fullPath, file.buffer);
    return { path: fullPath };
  }

  async delete(pathOrUrl: string): Promise<boolean> {
    if (
      !pathOrUrl ||
      pathOrUrl.startsWith('http://') ||
      pathOrUrl.startsWith('https://') ||
      pathOrUrl.startsWith('data:') ||
      pathOrUrl.startsWith('blob:') ||
      pathOrUrl.startsWith('s3://')
    ) {
      return false;
    }

    try {
      const targetPath = isAbsolute(pathOrUrl)
        ? pathOrUrl
        : join(this.diskPath, pathOrUrl);
      await unlink(targetPath);
      return true;
    } catch {
      return false;
    }
  }
}
