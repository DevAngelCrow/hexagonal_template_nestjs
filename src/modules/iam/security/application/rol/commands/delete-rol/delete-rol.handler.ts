import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RolRepository } from '@/modules/security/domain/repositories/rol-repository';
import { DeleteRolCommand } from './delete-rol.command';
import { RolId } from '@/modules/security/domain/value-objects/rol-value-object/rol-id';
import { RolDto } from '../../../dtos/rol.dto';
import { UsersRoleReadRepository } from '../../../repositories/user-rol-read.repository';
import { CachePort } from '@/modules/security/domain/ports/cache.port';
import { MultipleStatusId } from '@/shared/domain/enums/multiple-status';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { RolIdStatus } from '@/modules/security/domain/value-objects/rol-value-object/rol-id-status';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(DeleteRolCommand)
export class DeleteRolHandler implements ICommandHandler<DeleteRolCommand> {
  constructor(
    private readonly repository: RolRepository,
    private readonly userRoleRepository: UsersRoleReadRepository,
    private readonly cache: CachePort,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: DeleteRolCommand): Promise<RolDto> {
    const rolId = new RolId(command.id);
    const rolEntity = await this.repository.findById(rolId);
    if (!rolEntity) {
      throw new NotFoundException('Role', command.id);
    }

    const newStatus =
      rolEntity.getIdStatus().value() === String(MultipleStatusId.ACTIVE)
        ? MultipleStatusId.INACTIVE
        : MultipleStatusId.ACTIVE;

    rolEntity.toggleStatus(new RolIdStatus(newStatus));

    await this.repository.update(rolEntity);
    await this.dispatcher.dispatch(rolEntity.getDomainEvents());
    rolEntity.clearDomainEvents();

    const userIds: string[] = await this.userRoleRepository.getUserIdsByRoleId(
      command.id,
    );
    await this.cache.invalidateUsersPermissions(userIds);
    return RolDto.fromEntity(rolEntity);
  }
}
