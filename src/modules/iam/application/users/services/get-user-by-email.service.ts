import { UserDto } from '@/modules/iam/application/users/dtos/user.dto';
import { GetUserByEmailHandler } from '@/modules/iam/application/users/queries/get-user-by-email/get-user-by-email.handler';
import { GetUserByEmailQuery } from '@/modules/iam/application/users/queries/get-user-by-email/get-user-by-email.query';

export class GetUserByEmailService {
  constructor(private readonly getUserByEmail: GetUserByEmailHandler) {}
  async run(email: string): Promise<UserDto | null> {
    const data = new GetUserByEmailQuery(email);
    return await this.getUserByEmail.execute(data);
  }
}
