import { GetProviderStoragesHandler } from '@/modules/storage/application/provider-storage/queries/get-provider-storages/get-provider-storages.handler';
import { GetProviderStorageHandler } from '@/modules/storage/application/provider-storage/queries/get-provider-storage/get-provider-storage.handler';
import { GetProviderStorageByCodeHandler } from '@/modules/storage/application/provider-storage/queries/get-provider-storage-by-code/get-provider-storage-by-code.handler';
import { GetStorageFilesHandler } from '@/modules/storage/application/storage-files/queries/get-storage-files/get-storage-files.handler';

export const queryHandlerProviders = [
  GetProviderStoragesHandler,
  GetProviderStorageHandler,
  GetProviderStorageByCodeHandler,
  GetStorageFilesHandler,
];
