import { UserName } from '@/modules/iam/domain/value-objects/user/user-value-object/user-name';
import { UpdateNameUserCommand } from '@/modules/iam/application/users/commands/update-name-user/update-name-user.command';
import { UpdateNameUserHandler } from '@/modules/iam/application/users/commands/update-name-user/update-name-user.handler';
import { UserId } from '@/modules/iam/domain/value-objects/user/user-value-object/user-id';

export class UpdateUserNameService {
  constructor(private readonly updateUserName: UpdateNameUserHandler) {}
  async run(user_name: string, id: string): Promise<void> {
    const user = new UpdateNameUserCommand(
      new UserName(user_name),
      new UserId(id),
    );
    return await this.updateUserName.execute(user);
  }
}
