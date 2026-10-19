import { UserRolDto } from '@/modules/iam/application/security/dtos/user-rol.dto';
import { CreateUserRoleCommand } from '@/modules/iam/application/security/commands/user-rol/create-user-role/create-user-role.command';
import { CreateUserRoleHandler } from '@/modules/iam/application/security/commands/user-rol/create-user-role/create-user-role.handler';

export class CreateUserRoleService {
  constructor(private readonly userRoleCreate: CreateUserRoleHandler) {}
  async run(user_role_dto: UserRolDto): Promise<void> {
    const command = new CreateUserRoleCommand(user_role_dto);
    return await this.userRoleCreate.execute(command);
  }
}
