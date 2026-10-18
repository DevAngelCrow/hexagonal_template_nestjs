import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PermissionsRepository } from '@/modules/security/domain/repositories/permissions-repository';
import { CreatePermissionsCommand } from './create-permissions.command';
import { Permissions } from '@/modules/security/domain/entities/permissions';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(CreatePermissionsCommand)
export class CreatePermissionsHandler implements ICommandHandler<CreatePermissionsCommand> {
  constructor(
    private readonly repository: PermissionsRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: CreatePermissionsCommand): Promise<void> {
    const permissionsEntity = Permissions.create({
      ...command.permissions_dto,
    });
    permissionsEntity.created();

    await this.repository.create(permissionsEntity);
    await this.dispatcher.dispatch(permissionsEntity.getDomainEvents());
    permissionsEntity.clearDomainEvents();
  }
}
