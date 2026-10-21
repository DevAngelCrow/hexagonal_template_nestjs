import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { GenderDto } from '@/modules/catalogs/application/dtos/gender.dto';
import { GenderId } from '@/modules/catalogs/domain/value-objects/gender-value-object/gender-id';

export abstract class GenderQueriesRepository {
  abstract getAll(
    pagination_params?: PaginationParams,
    filter?: string,
  ): Promise<Pagination<GenderDto> | GenderDto[]>;
  abstract findById(id: GenderId): Promise<GenderDto | null>;
}
