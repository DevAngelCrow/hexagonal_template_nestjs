import { PersonRepository } from '@/modules/iam/domain/repositories/person.repository';
import { DeletePersonCommand } from '@/modules/iam/application/profile/commands/person/delete-person/delete-person.command';
import { PersonId } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-id';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(DeletePersonCommand)
export class DeletePersonHandler implements ICommandHandler<DeletePersonCommand> {
  constructor(private readonly repository: PersonRepository) {}

  async execute(command: DeletePersonCommand): Promise<void> {
    await this.repository.delete(new PersonId(command.id));
  }
}
