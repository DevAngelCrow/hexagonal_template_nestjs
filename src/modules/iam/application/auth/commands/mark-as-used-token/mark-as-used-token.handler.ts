import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerificationTokenRepository } from '@/modules/iam/domain/repositories/verification-token-repository';
import { MarkAsUsedTokenCommand } from '@/modules/iam/application/auth/commands/mark-as-used-token/mark-as-used-token.command';

@CommandHandler(MarkAsUsedTokenCommand)
export class MarkAsUsedTokenHandler implements ICommandHandler<MarkAsUsedTokenCommand> {
  constructor(private readonly repository: VerificationTokenRepository) {}
  public async execute(command: MarkAsUsedTokenCommand): Promise<void> {
    await this.repository.markAsUsed(command.id);
  }
}
