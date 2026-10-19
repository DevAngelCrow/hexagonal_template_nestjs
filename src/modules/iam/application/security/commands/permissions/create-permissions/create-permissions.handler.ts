import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PermissionsRepository } from '@/modules/iam/domain/repositories/permissions-repository';
import { CreatePermissionsCommand } from '@/modules/iam/application/security/commands/permissions/create-permissions/create-permissions.command';
import { Permissions } from '@/modules/iam/domain/entities/permissions.entity';
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
