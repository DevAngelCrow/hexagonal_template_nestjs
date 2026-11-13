import { Injectable } from '@nestjs/common';
import { join, posix, resolve } from 'node:path';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Express } from 'express';
import { StorageBackend } from './storage-backend';
import { MIME_TO_EXTENSION } from '@/modules/storage/infrastructure/config/multer-file-filter.config';
import {
  resolveConfinedStoragePath,
  sanitizeStorageFolder,
} from '@/modules/storage/infrastructure/utils/storage-path.util';

@Injectable()
export class LocalStorageBackend extends StorageBackend {
  readonly code = 'LOCAL';
  private readonly diskPath = resolve(process.cwd(), 'storage');
  private readonly defaultBasePath = 'profile_img';

  async upload(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ path: string }> {
    const ext = MIME_TO_EXTENSION[file?.mimetype] ?? 'bin';
    const filename = `${randomUUID()}.${ext}`;
    const targetFolder = sanitizeStorageFolder(folder, this.defaultBasePath);
    const relativePath = posix.join(targetFolder, filename);
    const confinedTarget = resolveConfinedStoragePath(
      this.diskPath,
      relativePath,
    );
    if (!confinedTarget) {
      throw new Error('Invalid local storage destination path');
    }

    const folderPath = join(this.diskPath, targetFolder);
    await mkdir(folderPath, { recursive: true });
    await writeFile(confinedTarget, file.buffer);
    return { path: relativePath };
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

    const confinedTarget = resolveConfinedStoragePath(this.diskPath, pathOrUrl);
    if (!confinedTarget) {
      return false;
    }

    try {
      await unlink(confinedTarget);
      return true;
    } catch {
      return false;
    }
  }
}
