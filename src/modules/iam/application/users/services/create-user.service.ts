import { User } from '@/modules/iam/domain/aggregates/user.aggregate';
import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';
import { CreateUserCommand } from '@/modules/iam/application/users/commands/create-user/create-user.command';
import { CreateUserHandler } from '@/modules/iam/application/users/commands/create-user/create-user.handler';
export class CreateUserService {
  constructor(private readonly createUser: CreateUserHandler) {}
  async run(user_dto: UserDto): Promise<User> {
    const user = new CreateUserCommand(user_dto);
    return await this.createUser.execute(user);
  }
}
