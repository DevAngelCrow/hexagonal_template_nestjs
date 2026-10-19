import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';
import { GetUserByIdHandler } from '@/modules/iam/application/users/queries/get-user-by-id/get-user-by-id.handler';
import { GetUserByIdQuery } from '@/modules/iam/application/users/queries/get-user-by-id/get-user-by-id.query';
export class FindUserByIdService {
  constructor(private readonly findUserById: GetUserByIdHandler) {}
  async run(id_user: string): Promise<UserDto | null> {
    const query = new GetUserByIdQuery(id_user);
    return await this.findUserById.execute(query);
  }
}
