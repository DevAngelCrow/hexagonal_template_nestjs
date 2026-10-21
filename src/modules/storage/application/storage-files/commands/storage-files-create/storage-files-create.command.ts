import { StorageFilesDto } from '@/modules/storage/application/dtos/storage-files.dto';

export class StorageFilesCreateCommand<T> {
  constructor(public readonly storage_file_dto: StorageFilesDto<T>) {}
}
