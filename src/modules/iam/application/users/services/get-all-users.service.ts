import { Pagination } from '@/shared/domain/value-object/pagination';
import { GetUsersHandler } from '@/modules/iam/application/users/queries/get-users/get-users.handler';
import { GetUsersQuery } from '@/modules/iam/application/users/queries/get-users/get-users.query';
import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';

export class GetAllUsersService {
  constructor(private readonly getAllUsers: GetUsersHandler) {}

  async run(query: GetUsersQuery): Promise<Pagination<UserDto> | UserDto[]> {
    return await this.getAllUsers.execute(query);
  }
}
