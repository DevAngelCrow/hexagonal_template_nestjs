import { UserAuthDto } from '@/modules/iam/application/users/dtos/user-auth.dto';
import { AuthReadPort } from '@/modules/iam/application/auth/ports/auth-read.port';

export class TokenGeneratorService {
  constructor(private readonly authReadPort: AuthReadPort) {}
  async run(user: UserAuthDto): Promise<string> {
    return await this.authReadPort.generateToken(user);
  }
}
