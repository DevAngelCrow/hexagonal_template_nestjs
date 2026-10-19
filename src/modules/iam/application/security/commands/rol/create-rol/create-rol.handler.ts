import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RolRepository } from '@/modules/iam/domain/repositories/rol-repository';
import { CreateRolCommand } from '@/modules/iam/application/security/commands/rol/create-rol/create-rol.command';
import { Rol } from '@/modules/iam/domain/entities/rol.entity';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(CreateRolCommand)
export class CreateRolHandler implements ICommandHandler<CreateRolCommand> {
  constructor(
    private readonly repository: RolRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: CreateRolCommand): Promise<void> {
    const rolEntity = Rol.create({
      ...command.rol_dto,
      id_permissions: command.rol_dto.permissions_id,
    });
    rolEntity.created();

    await this.repository.create(rolEntity);
    await this.dispatcher.dispatch(rolEntity.getDomainEvents());
    rolEntity.clearDomainEvents();
  }
}
