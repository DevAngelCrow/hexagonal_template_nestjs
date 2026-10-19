import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';

export class EmailVerificationValidationQuery {
  constructor(public readonly user_dto: UserDto) {}
}
