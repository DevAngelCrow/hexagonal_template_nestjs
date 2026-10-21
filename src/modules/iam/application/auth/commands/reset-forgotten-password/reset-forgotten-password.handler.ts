import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MetricsPort } from '@/shared/application/ports/metrics.port';
import { ResetPasswordUserService } from '@/modules/iam/application/users/services/reset-password-user.service';
import { ResetForgottenPasswordCommand } from '@/modules/iam/application/auth/commands/reset-forgotten-password/reset-forgotten-password.command';
import { VerificationTokenRepository } from '@/modules/iam/domain/repositories/verification-token-repository';
import { ApplicationException } from '@/shared/application/exceptions/application.exception';

@CommandHandler(ResetForgottenPasswordCommand)
export class ResetForgottenPasswordHandler implements ICommandHandler<ResetForgottenPasswordCommand> {
  constructor(
    private readonly resetPasswordUserService: ResetPasswordUserService,
    private readonly verifyTokenRepository: VerificationTokenRepository,
    private readonly metrics?: MetricsPort,
  ) {}

  async execute(
    command: ResetForgottenPasswordCommand,
  ): Promise<{ user_id: string }> {
    const tokenVerified = await this.verifyTokenRepository.findByToken(
      command.id,
      command.token,
    );
    if (!tokenVerified) {
      throw new ApplicationException('404', 'Token no encontrado');
    }
    await this.verifyTokenRepository.markAsUsed(tokenVerified.id);
    await this.verifyTokenRepository.deleteByUserId(
      tokenVerified.user_id,
      true,
    );
    await this.resetPasswordUserService.run(
      tokenVerified.user_id.value(),
      command.password,
      command.token,
    );
    this.metrics?.incrementPasswordReset('completed');
    return { user_id: tokenVerified.user_id.value() };
  }
}
