import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByUserNameQuery } from '@/modules/iam/application/users/queries/get-user-by-user-name/get-user-by-user-name.query';
import { UserReadRepository } from '@/modules/iam/application/repositories/user-read.repository';

import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';

@QueryHandler(GetUserByUserNameQuery)
export class GetUserByUserNameHandler implements IQueryHandler<GetUserByUserNameQuery> {
  constructor(private readonly repository: UserReadRepository) {}

  async execute(
    query: GetUserByUserNameQuery,
  ): Promise<{ user: UserDto; permissions: string[] } | null> {
    return await this.repository.getOneByUserName(query.user_name);
  }
}
