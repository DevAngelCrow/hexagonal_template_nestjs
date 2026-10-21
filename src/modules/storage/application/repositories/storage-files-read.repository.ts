import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { StorageFileListDto } from '@/modules/storage/application/dtos/storage-file-list.dto';

export abstract class StorageFilesReadRepository {
  abstract getAll(
    pagination_params?: PaginationParams,
    id_provider?: string,
  ): Promise<Pagination<StorageFileListDto> | StorageFileListDto[]>;
}
