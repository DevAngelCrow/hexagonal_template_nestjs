import { PersonRepository } from '@/modules/iam/domain/repositories/person.repository';
import { DeleteAddressCommand } from '@/modules/iam/application/profile/commands/address/delete-address/delete-address.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(DeleteAddressCommand)
export class DeleteAddressHandler implements ICommandHandler<DeleteAddressCommand> {
  constructor(
    private readonly repository: PersonRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: DeleteAddressCommand): Promise<void> {
    const personEntity = await this.repository.findByAddressId(command.id);

    if (!personEntity) {
      throw new NotFoundException('Address', command.id);
    }

    personEntity.removeAddress(command.id);

    await this.repository.update(personEntity);
    await this.dispatcher.dispatch(personEntity.getDomainEvents());
    personEntity.clearDomainEvents();
  }
}
