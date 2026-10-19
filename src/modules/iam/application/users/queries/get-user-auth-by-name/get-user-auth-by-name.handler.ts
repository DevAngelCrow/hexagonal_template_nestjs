import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserReadRepository } from '@/modules/iam/application/repositories/user-read.repository';
import { GetUserAuthByNameQuery } from '@/modules/iam/application/users/queries/get-user-auth-by-name/get-user-auth-by-name.query';
import { UserAuthDto } from '@/modules/iam/application/users/dtos/user-auth.dto';

@QueryHandler(GetUserAuthByNameQuery)
export class GetUserAuthByNameHandler implements IQueryHandler<GetUserAuthByNameQuery> {
  constructor(private readonly repository: UserReadRepository) {}

  async execute(query: GetUserAuthByNameQuery): Promise<UserAuthDto | null> {
    return await this.repository.getOneByUserNameForAuth(query.user_name);
  }
}
