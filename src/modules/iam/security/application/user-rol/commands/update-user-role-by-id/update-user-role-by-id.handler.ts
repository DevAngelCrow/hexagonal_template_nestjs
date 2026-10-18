import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRoleRepository } from '@/modules/security/domain/repositories/user-rol-repository';
import { UpdateUserRoleByIdCommand } from './update-user-role-by-id.command';
import { UserRoleAggregate } from '@/modules/security/domain/aggregates/user-role.aggregate';
import { CachePort } from '@/modules/security/domain/ports/cache.port';
import { UserRoleIdRol } from '@/modules/security/domain/value-objects/user-role-value-object/user-role-id-rol';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(UpdateUserRoleByIdCommand)
export class UpdateUserRoleByIdHandler implements ICommandHandler<UpdateUserRoleByIdCommand> {
  constructor(
    private readonly repository: UserRoleRepository,
    private readonly cache: CachePort,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: UpdateUserRoleByIdCommand): Promise<void> {
    const userRoleEntity = UserRoleAggregate.create({
      ...command.user_rol_dto,
    });

    const newRoles = command.user_rol_dto.role_id.map(
      (id) => new UserRoleIdRol(id),
    );
    userRoleEntity.updated(newRoles);

    await this.repository.updateOrCreate(userRoleEntity);
    await this.dispatcher.dispatch(userRoleEntity.getDomainEvents());
    userRoleEntity.clearDomainEvents();

    await this.cache.invalidateUserPermissions(command.user_rol_dto.user_id);
  }
}
