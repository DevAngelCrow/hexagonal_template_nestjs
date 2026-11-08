export abstract class StorageFileDeleterPort {
  abstract delete(pathOrUrl: string, providerCode?: string): Promise<boolean>;
}

