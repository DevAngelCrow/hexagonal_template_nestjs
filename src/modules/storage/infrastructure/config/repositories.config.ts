import { ProviderStorageRepository } from '@/modules/storage/domain/repositories/provider-storage.repository';
import { StorageFilesRepository } from '@/modules/storage/domain/repositories/storage-files.repository';
import { ImplProviderStorageRepository } from '@/modules/storage/infrastructure/implementation/impl-provider-storage.repository';
import { ImplStorageFilesRepository } from '@/modules/storage/infrastructure/implementation/impl-storage-files.repository';
import { ProviderStorageQueriesRepository } from '@/modules/storage/application/repositories/provider-storage-read.repository';
import { ImplProviderStorageQueriesRepository } from '@/modules/storage/infrastructure/implementation/impl-provider-storage-queries.repository';
import { StorageFileReaderPort } from '@/modules/storage/domain/ports/storage-file-reader.port';
import { ImplStorageFileReaderPort } from '@/modules/storage/infrastructure/implementation/impl-storage-file-reader.port';
import { StorageFilesReadRepository } from '@/modules/storage/application/repositories/storage-files-read.repository';

export const repositories = [
  {
    provide: ProviderStorageRepository,
    useClass: ImplProviderStorageRepository,
  },
  {
    provide: ProviderStorageQueriesRepository,
    useClass: ImplProviderStorageQueriesRepository,
  },
  {
    provide: StorageFilesRepository,
    useClass: ImplStorageFilesRepository,
  },
  {
    provide: StorageFilesReadRepository,
    useClass: ImplStorageFilesRepository,
  },
  {
    provide: StorageFileReaderPort,
    useClass: ImplStorageFileReaderPort,
  },
];
