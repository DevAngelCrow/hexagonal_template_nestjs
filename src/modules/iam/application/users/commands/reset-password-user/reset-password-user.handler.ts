import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@/modules/iam/domain/repositories/user-repository';
import { ResetPasswordUserCommand } from '@/modules/iam/application/users/commands/reset-password-user/reset-password-user.command';
import { UserId } from '@/modules/iam/domain/value-objects/user/user-value-object/user-id';
import { UserPassword } from '@/modules/iam/domain/value-objects/user/user-value-object/user-password';
import { PasswordHasherPort } from '@/modules/iam/domain/ports/password-hasher.port';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(ResetPasswordUserCommand)
export class ResetPasswordUserHandler implements ICommandHandler<ResetPasswordUserCommand> {
  constructor(
    private readonly repository: UserRepository,
    private readonly dispatcher: EventDispatcherPort,
    private readonly passwordHasherPort: PasswordHasherPort,
  ) {}

  async execute(command: ResetPasswordUserCommand): Promise<void> {
    const id = new UserId(command.id);
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException('User', id.value());
    }

    // Check history (throws if not valid)
    await this.repository.checkPasswordHistory(id, command.password);

    const passwordHash = await this.passwordHasherPort.hash(command.password);
    const newPassword = new UserPassword(passwordHash);

    // Save old hash to history before mutating aggregate
    await this.repository.savePasswordHistory(id, user.getPassword().value());

    user.resetPassword(newPassword);

    await this.repository.update(user);
    await this.dispatcher.dispatch(user.getDomainEvents());
    user.clearDomainEvents();
  }
}
