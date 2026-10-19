import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';
import { GetUserByUserNameHandler } from '@/modules/iam/application/users/queries/get-user-by-user-name/get-user-by-user-name.handler';
import { GetUserByUserNameQuery } from '@/modules/iam/application/users/queries/get-user-by-user-name/get-user-by-user-name.query';
export class FindUserService {
  constructor(private readonly findUserByName: GetUserByUserNameHandler) {}
  async run(
    user_name: string,
  ): Promise<{ user: UserDto; permissions: string[] } | null> {
    const query = new GetUserByUserNameQuery(user_name);
    return await this.findUserByName.execute(query);
  }
}
