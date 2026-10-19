import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RolRepository } from '@/modules/iam/domain/repositories/rol-repository';
import { UpdateRolCommand } from '@/modules/iam/application/security/commands/rol/update-rol/update-rol.command';
import { UsersRoleReadRepository } from '@/modules/iam/application/repositories/user-rol-read.repository';
import { CachePort } from '@/modules/iam/domain/ports/cache.port';
import { RolId } from '@/modules/iam/domain/value-objects/security/rol-value-object/rol-id';
import { RolName } from '@/modules/iam/domain/value-objects/security/rol-value-object/rol-name';
import { RolDescription } from '@/modules/iam/domain/value-objects/security/rol-value-object/rol-description';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(UpdateRolCommand)
export class UpdateRolHandler implements ICommandHandler<UpdateRolCommand> {
  constructor(
    private readonly repository: RolRepository,
    private readonly userRoleRepository: UsersRoleReadRepository,
    private readonly cacheManager: CachePort,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: UpdateRolCommand): Promise<void> {
    if (!command.rol_dto.id) {
      throw new BadRequestException('El ID del rol es requerido para actualizar');
    }
    const rolEntity = await this.repository.findById(
      new RolId(command.rol_dto.id),
    );
    if (!rolEntity) {
      throw new NotFoundException('Role', command.rol_dto.id);
    }

    rolEntity.update(
      new RolName(command.rol_dto.name),
      new RolDescription(command.rol_dto.description),
      command.rol_dto.permissions_id,
    );

    await this.repository.update(rolEntity);
    await this.dispatcher.dispatch(rolEntity.getDomainEvents());
    rolEntity.clearDomainEvents();

    const userIds = await this.userRoleRepository.getUserIdsByRoleId(
      command.rol_dto.id,
    );
    await this.cacheManager.invalidateUsersPermissions(userIds);
  }
}
