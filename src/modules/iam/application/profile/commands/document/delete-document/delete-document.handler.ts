import { PersonRepository } from '@/modules/iam/domain/repositories/person.repository';
import { DeleteDocumentCommand } from '@/modules/iam/application/profile/commands/document/delete-document/delete-document.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(DeleteDocumentCommand)
export class DeleteDocumentHandler implements ICommandHandler<DeleteDocumentCommand> {
  constructor(
    private readonly repository: PersonRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: DeleteDocumentCommand): Promise<void> {
    const personEntity = await this.repository.findByDocumentId(command.id);

    if (!personEntity) {
      throw new NotFoundException('Document', command.id);
    }

    personEntity.removeDocument(command.id);

    await this.repository.update(personEntity);
    await this.dispatcher.dispatch(personEntity.getDomainEvents());
    personEntity.clearDomainEvents();
  }
}
