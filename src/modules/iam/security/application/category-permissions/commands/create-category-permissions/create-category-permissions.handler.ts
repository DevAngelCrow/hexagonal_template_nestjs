import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CategoryPermissionsRepository } from '@/modules/security/domain/repositories/category-permissions-repository';
import { CreateCategoryPermissionsCommand } from './create-category-permissions.command';
import { CategoryPermissions } from '@/modules/security/domain/entities/category-permissions';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(CreateCategoryPermissionsCommand)
export class CreateCategoryPermissionsHandler implements ICommandHandler<CreateCategoryPermissionsCommand> {
  constructor(
    private readonly repository: CategoryPermissionsRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: CreateCategoryPermissionsCommand): Promise<void> {
    const categoryPermissionsEntity = CategoryPermissions.create({
      ...command.category_permissions_dto,
    });
    categoryPermissionsEntity.created();

    await this.repository.create(categoryPermissionsEntity);
    await this.dispatcher.dispatch(categoryPermissionsEntity.getDomainEvents());
    categoryPermissionsEntity.clearDomainEvents();
  }
}
