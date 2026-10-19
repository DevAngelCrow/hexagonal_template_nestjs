import { UserName } from '@/modules/iam/domain/value-objects/user/user-value-object/user-name';
import { UserId } from '@/modules/iam/domain/value-objects/user/user-value-object/user-id';

export class UpdateNameUserCommand {
  constructor(
    public readonly user_name: UserName,
    public readonly id: UserId,
  ) {}
}
