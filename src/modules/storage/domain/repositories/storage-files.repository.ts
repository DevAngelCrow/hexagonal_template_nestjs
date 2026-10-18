import { StorageFiles } from '../entities/storage-files';
import { StorageFilesContentFile } from '../value-objects/storage-files-value-object/storage-files-content-file';
import { StorageFilesPath } from '../value-objects/storage-files-value-object/storage-files-path';

export abstract class StorageFilesRepository {
  abstract upload<T>(
    storage_file_content: StorageFilesContentFile<T>,
  ): Promise<{
    content_file: StorageFilesContentFile<T>;
    path: StorageFilesPath;
  }>;
  abstract create<T>(storage_file: StorageFiles<T>): Promise<StorageFiles<T>>;
}
