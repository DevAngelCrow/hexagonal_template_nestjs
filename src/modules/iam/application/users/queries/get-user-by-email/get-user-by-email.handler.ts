import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';
import { UserReadRepository } from '@/modules/iam/application/repositories/user-read.repository';
import { GetUserByEmailQuery } from '@/modules/iam/application/users/queries/get-user-by-email/get-user-by-email.query';

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery> {
  constructor(private readonly userRepository: UserReadRepository) {}
  async execute(query: GetUserByEmailQuery): Promise<UserDto | null> {
    return await this.userRepository.getOneUserByEmail(query.email);
  }
}
