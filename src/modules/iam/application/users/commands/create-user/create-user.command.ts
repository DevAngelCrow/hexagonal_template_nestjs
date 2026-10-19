import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';

export class CreateUserCommand {
  constructor(public readonly user_dto: UserDto) {}
}
