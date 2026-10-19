import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetRouteByIdQuery } from '@/modules/iam/application/security/queries/route/get-route-by-id/get-route-by-id.query';
import { RouteReadRepository } from '@/modules/iam/application/repositories/route-read.repository';

@QueryHandler(GetRouteByIdQuery)
export class GetRouteByIdHandler implements IQueryHandler<GetRouteByIdQuery> {
  constructor(private readonly repository: RouteReadRepository) {}

  async execute(query: GetRouteByIdQuery) {
    return await this.repository.getById(query.id);
  }
}
