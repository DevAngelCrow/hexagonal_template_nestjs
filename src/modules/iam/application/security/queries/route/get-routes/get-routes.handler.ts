import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Pagination } from '@/shared/domain/value-object/pagination';
import { GetRoutesQuery } from '@/modules/iam/application/security/queries/route/get-routes/get-routes.query';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { RouteReadRepository } from '@/modules/iam/application/repositories/route-read.repository';
import { RouteDto } from '@/modules/iam/application/security/dtos/route.dto';

@QueryHandler(GetRoutesQuery)
export class GetRoutesHandler implements IQueryHandler<GetRoutesQuery> {
  constructor(private readonly repository: RouteReadRepository) {}
  async execute(
    query: GetRoutesQuery,
  ): Promise<Pagination<RouteDto> | RouteDto[]> {
    if (query.pagination_params) {
      const paginationParams = PaginationParams.create({
        ...query.pagination_params,
      });
      return await this.repository.getAll(
        paginationParams,
        query.filter,
        query.active,
        query.id_parent,
      );
    }
    return await this.repository.getAll(
      undefined,
      query.filter,
      query.active,
      query.id_parent,
    );
  }
}
