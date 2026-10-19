import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRoleRepository } from '@/modules/iam/domain/repositories/user-rol-repository';
import { CreateUserRoleCommand } from '@/modules/iam/application/security/commands/user-rol/create-user-role/create-user-role.command';
import { UserRoleAggregate } from '@/modules/iam/domain/aggregates/user-role.aggregate';
import { CachePort } from '@/modules/iam/domain/ports/cache.port';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(CreateUserRoleCommand)
export class CreateUserRoleHandler implements ICommandHandler<CreateUserRoleCommand> {
  constructor(
    protected readonly repository: UserRoleRepository,
    protected readonly cache: CachePort,
    protected readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: CreateUserRoleCommand): Promise<void> {
    const userRoleEntity = UserRoleAggregate.create(command.user_role_dto);
    userRoleEntity.created();

    await this.repository.create(userRoleEntity);
    await this.dispatcher.dispatch(userRoleEntity.getDomainEvents());
    userRoleEntity.clearDomainEvents();

    await this.cache.invalidateUserPermissions(command.user_role_dto.user_id);
  }
}
