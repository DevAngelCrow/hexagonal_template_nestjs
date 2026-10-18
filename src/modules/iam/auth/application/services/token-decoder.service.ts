import { AuthReadPort } from '../ports/auth-read.port';

export class TokenDedecoderService<T extends object> {
  constructor(private readonly authReadPort: AuthReadPort) {}
  async run(token: string, isRefreshToken: boolean = false): Promise<T> {
    return await this.authReadPort.decodeToken(token, isRefreshToken);
  }
}
