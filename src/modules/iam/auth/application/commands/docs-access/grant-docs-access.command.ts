import { Command } from '@nestjs/cqrs';

export class GrantDocsAccessCommand extends Command<{
  cookieToken: string;
  maxAge: number;
}> {
  constructor(public readonly access_token: string) {
    super();
  }
}
