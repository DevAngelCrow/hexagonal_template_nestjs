import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersRoleReadRepository } from '@/modules/iam/application/repositories/user-rol-read.repository';
import { GetUserIdsByRoleIdQuery } from '@/modules/iam/application/security/queries/user-rol/get-user-ids-by-role-id/get-user-ids-by-role-id.query';

@QueryHandler(GetUserIdsByRoleIdQuery)
export class GetUserIdsByRoleIdHandler implements IQueryHandler<GetUserIdsByRoleIdQuery> {
  constructor(private readonly repository: UsersRoleReadRepository) {}

  async execute(query: GetUserIdsByRoleIdQuery): Promise<string[]> {
    return await this.repository.getUserIdsByRoleId(query.id_rol);
  }
}
