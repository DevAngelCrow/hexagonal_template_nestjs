import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPermissionsByIdQuery } from '@/modules/iam/application/security/queries/permissions/get-permissions-by-id/get-permissions-by-id.query';
import { PermissionsReadRepository } from '@/modules/iam/application/repositories/permissions-read.repository';

@QueryHandler(GetPermissionsByIdQuery)
export class GetPermissionsByIdHandler implements IQueryHandler<GetPermissionsByIdQuery> {
  constructor(private readonly repository: PermissionsReadRepository) {}

  async execute(query: GetPermissionsByIdQuery) {
    return await this.repository.getOneById(query.id);
  }
}
