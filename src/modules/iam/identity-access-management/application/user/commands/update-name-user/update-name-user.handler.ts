import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@/modules/identity-access-management/domain/repositories/user-repository';
import { UpdateNameUserCommand } from './update-name-user.command';
import { UserId } from '@/modules/identity-access-management/domain/value-objects/user-value-object/user-id';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(UpdateNameUserCommand)
export class UpdateNameUserHandler implements ICommandHandler<UpdateNameUserCommand> {
  constructor(
    private readonly repository: UserRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: UpdateNameUserCommand): Promise<void> {
    const id = new UserId(command.id.value());
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException('User', id.value());
    }

    user.updateName(command.user_name);

    await this.repository.update(user);
    await this.dispatcher.dispatch(user.getDomainEvents());
    user.clearDomainEvents();
  }
}
