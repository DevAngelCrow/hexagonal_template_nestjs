import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CategoryPermissionsRepository } from '@/modules/security/domain/repositories/category-permissions-repository';
import { DeleteCategoryPermissionsCommand } from './delete-category-permissions.command';
import { CategoryPermissionsId } from '@/modules/security/domain/value-objects/category-permissions-value-object/category-permissions-id';
import { CategoryPermissionsDto } from '../../../dtos/category-permissions.dto';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { CategoryPermissionsActive } from '@/modules/security/domain/value-objects/category-permissions-value-object/category-permissions-active';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(DeleteCategoryPermissionsCommand)
export class DeleteCategoryPermissionsHandler implements ICommandHandler<DeleteCategoryPermissionsCommand> {
  constructor(
    private readonly repository: CategoryPermissionsRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(
    command: DeleteCategoryPermissionsCommand,
  ): Promise<CategoryPermissionsDto> {
    const categoryPermissionsId = new CategoryPermissionsId(command.id);
    const categoryPermissionsEntity = await this.repository.findById(
      categoryPermissionsId,
    );
    if (!categoryPermissionsEntity) {
      throw new NotFoundException('CategoryPermissions', command.id);
    }

    categoryPermissionsEntity.toggleStatus(
      new CategoryPermissionsActive(
        !categoryPermissionsEntity.getActive().value(),
      ),
    );

    await this.repository.update(categoryPermissionsEntity);
    await this.dispatcher.dispatch(categoryPermissionsEntity.getDomainEvents());
    categoryPermissionsEntity.clearDomainEvents();

    return CategoryPermissionsDto.fromEntity(categoryPermissionsEntity);
  }
}
