import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@/modules/identity-access-management/domain/repositories/user-repository';
import { ResetPasswordUserCommand } from './reset-password-user.command';
import { UserId } from '@/modules/identity-access-management/domain/value-objects/user-value-object/user-id';
import { UserPassword } from '@/modules/identity-access-management/domain/value-objects/user-value-object/user-password';
import { PasswordHasherPort } from '@/modules/identity-access-management/domain/ports/password-hasher.port';
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
