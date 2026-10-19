import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PermissionsRepository } from '@/modules/iam/domain/repositories/permissions-repository';
import { DeletePermissionsCommand } from '@/modules/iam/application/security/commands/permissions/delete-permissions/delete-permissions.command';
import { PermissionsId } from '@/modules/iam/domain/value-objects/security/permissions-value-object/permissions-id';
import { PermissionsDto } from '@/modules/iam/application/security/dtos/permissions.dto';
import { UsersRoleReadRepository } from '@/modules/iam/application/repositories/user-rol-read.repository';
import { CachePort } from '@/modules/iam/domain/ports/cache.port';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { PermissionsActive } from '@/modules/iam/domain/value-objects/security/permissions-value-object/permissions-active';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(DeletePermissionsCommand)
export class DeletePermissionsHandler implements ICommandHandler<DeletePermissionsCommand> {
  constructor(
    private readonly repository: PermissionsRepository,
    private readonly userRoleRepository: UsersRoleReadRepository,
    private readonly cache: CachePort,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: DeletePermissionsCommand): Promise<PermissionsDto> {
    const permissionsId = new PermissionsId(command.id);
    const permissionsEntity = await this.repository.findById(permissionsId);
    if (!permissionsEntity) {
      throw new NotFoundException('Permissions', command.id);
    }

    permissionsEntity.toggleStatus(
      new PermissionsActive(!permissionsEntity.getActive().value()),
    );

    await this.repository.update(permissionsEntity);
    await this.dispatcher.dispatch(permissionsEntity.getDomainEvents());
    permissionsEntity.clearDomainEvents();

    const userIds = await this.userRoleRepository.getUserIdsByPermissionId(
      command.id,
    );
    await this.cache.invalidateUsersPermissions(userIds);
    return PermissionsDto.fromEntity(permissionsEntity);
  }
}
