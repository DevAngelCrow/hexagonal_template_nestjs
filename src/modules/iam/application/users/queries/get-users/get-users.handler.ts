import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Pagination } from '@/shared/domain/value-object/pagination';
import { UserReadRepository } from '@/modules/iam/application/repositories/user-read.repository';
import { GetUsersQuery } from '@/modules/iam/application/users/queries/get-users/get-users.query';
import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly userRepository: UserReadRepository) {}

  async execute(
    query: GetUsersQuery,
  ): Promise<Pagination<UserDto> | UserDto[]> {
    if (query.pagination_params) {
      const paginationParams = PaginationParams.create({
        ...query.pagination_params,
      });
      return await this.userRepository.getAllUsers(
        paginationParams,
        query.filter,
      );
    }
    return await this.userRepository.getAllUsers(undefined, query.filter);
  }
}
