import { Optional } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MetricsPort } from '@/shared/application/ports/metrics.port';
import { GenerateTokenForgottenPasswordCommand } from '@/modules/iam/application/auth/commands/generate-token-forgotten-password/generate-token-forgotten-password.command';
import { VerificationTokenRepository } from '@/modules/iam/domain/repositories/verification-token-repository';
import { GetUserByEmailService } from '@/modules/iam/application/users/services/get-user-by-email.service';
import { UserId } from '@/modules/iam/domain/value-objects/user/user-value-object/user-id';
import { EmailSenderPort } from '@/modules/iam/domain/ports/email-sender.port';
import { PersonEmail } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-email';
import { UserName } from '@/modules/iam/domain/value-objects/user/user-value-object/user-name';

@CommandHandler(GenerateTokenForgottenPasswordCommand)
export class GenerateTokenForgottenPasswordHandler implements ICommandHandler<GenerateTokenForgottenPasswordCommand> {
  constructor(
    private readonly getUserByEmail: GetUserByEmailService,
    private readonly verificationTokenRepository: VerificationTokenRepository,
    private readonly emailSenderPort: EmailSenderPort,
    @Optional()
    private readonly metrics?: MetricsPort,
  ) {}
  async execute(command: GenerateTokenForgottenPasswordCommand): Promise<void> {
    const user = await this.getUserByEmail.run(command.email);

    if (!user || !user.id) {
      // Constant-time guard: mimic the ~email-send latency so callers
      // cannot distinguish registered from unregistered addresses.
      await new Promise<void>((resolve) => setTimeout(resolve, 300));
      return;
    }
    const { token, id } =
      await this.verificationTokenRepository.createTokenForForgottenPassword(
        new UserId(user.id),
      );
    await this.emailSenderPort.sendForgottenPasswordEmail(
      new PersonEmail(user.email!),
      new UserName(user.user_name),
      { token, id },
    );
    this.metrics?.incrementPasswordReset('requested');
  }
}

