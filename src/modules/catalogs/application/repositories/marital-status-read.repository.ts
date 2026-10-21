import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { MaritalStatusDto } from '@/modules/catalogs/application/dtos/marital-status.dto';

export abstract class MaritalStatusQueriesRepository {
  abstract getAll(
    pagination_params?: PaginationParams,
    filter?: string,
  ): Promise<Pagination<MaritalStatusDto> | MaritalStatusDto[]>;
  abstract getOneById(id: string): Promise<MaritalStatusDto | null>;
}
