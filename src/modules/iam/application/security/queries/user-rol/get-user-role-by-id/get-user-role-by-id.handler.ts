import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersRoleReadRepository } from '@/modules/iam/application/repositories/user-rol-read.repository';
import { GetUserRoleByIdQuery } from '@/modules/iam/application/security/queries/user-rol/get-user-role-by-id/get-user-role-by-id.query';

@QueryHandler(GetUserRoleByIdQuery)
export class GetUserRoleByIdHandler implements IQueryHandler<GetUserRoleByIdQuery> {
  constructor(private readonly repository: UsersRoleReadRepository) {}
  async execute(query: GetUserRoleByIdQuery) {
    return await this.repository.getUserRole(query.id);
  }
}
