import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Pagination } from '@/shared/domain/value-object/pagination';
import { GetPermissionsQuery } from '@/modules/iam/application/security/queries/permissions/get-permissions/get-permissions.query';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { PermissionsReadRepository } from '@/modules/iam/application/repositories/permissions-read.repository';
import { PermissionsDto } from '@/modules/iam/application/security/dtos/permissions.dto';

@QueryHandler(GetPermissionsQuery)
export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery> {
  constructor(private readonly repository: PermissionsReadRepository) {}
  async execute(
    query: GetPermissionsQuery,
  ): Promise<Pagination<PermissionsDto> | PermissionsDto[]> {
    if (query.pagination_params) {
      const paginationParams = PaginationParams.create({
        ...query.pagination_params,
      });
      return await this.repository.getAll(
        paginationParams,
        query.filter,
        query.active,
        query.category_permission_id,
      );
    }
    return await this.repository.getAll(
      undefined,
      query.filter,
      query.active,
      query.category_permission_id,
    );
  }
}
