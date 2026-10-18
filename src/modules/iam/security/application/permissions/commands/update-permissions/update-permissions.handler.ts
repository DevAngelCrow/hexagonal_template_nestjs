import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PermissionsRepository } from '@/modules/security/domain/repositories/permissions-repository';
import { UpdatePermissionsCommand } from './update-permissions.command';
import { UsersRoleReadRepository } from '../../../repositories/user-rol-read.repository';
import { CachePort } from '@/modules/security/domain/ports/cache.port';
import { PermissionsId } from '@/modules/security/domain/value-objects/permissions-value-object/permissions-id';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { PermissionsName } from '@/modules/security/domain/value-objects/permissions-value-object/permissions-name';
import { PermissionsDescription } from '@/modules/security/domain/value-objects/permissions-value-object/permissions-description';
import { PermissionsIdCategoryPermissions } from '@/modules/security/domain/value-objects/permissions-value-object/permissions-id-category-permissions';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(UpdatePermissionsCommand)
export class UpdatePermissionsHandler implements ICommandHandler<UpdatePermissionsCommand> {
  constructor(
    private readonly repository: PermissionsRepository,
    private readonly userRoleRepository: UsersRoleReadRepository,
    private readonly cache: CachePort,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: UpdatePermissionsCommand): Promise<void> {
    if (!command.permissions_dto.id) {
      throw new BadRequestException('El ID del permiso es requerido para actualizar');
    }
    const permissionsEntity = await this.repository.findById(
      new PermissionsId(command.permissions_dto.id),
    );
    if (!permissionsEntity) {
      throw new NotFoundException('Permissions', command.permissions_dto.id);
    }

    permissionsEntity.update(
      new PermissionsName(command.permissions_dto.name),
      new PermissionsIdCategoryPermissions(
        command.permissions_dto.id_category_permissions,
      ),
      new PermissionsDescription(command.permissions_dto.description),
    );

    await this.repository.update(permissionsEntity);
    await this.dispatcher.dispatch(permissionsEntity.getDomainEvents());
    permissionsEntity.clearDomainEvents();

    if (command.permissions_dto.id) {
      const userIds = await this.userRoleRepository.getUserIdsByPermissionId(
        command.permissions_dto.id,
      );
      await this.cache.invalidateUsersPermissions(userIds);
    }
  }
}
