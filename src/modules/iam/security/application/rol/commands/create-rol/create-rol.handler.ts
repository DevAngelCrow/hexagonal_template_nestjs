import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RolRepository } from '@/modules/security/domain/repositories/rol-repository';
import { CreateRolCommand } from './create-rol.command';
import { Rol } from '@/modules/security/domain/entities/rol';
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
