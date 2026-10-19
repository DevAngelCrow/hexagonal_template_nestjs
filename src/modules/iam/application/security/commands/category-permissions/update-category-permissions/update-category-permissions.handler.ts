import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CategoryPermissionsRepository } from '@/modules/iam/domain/repositories/category-permissions-repository';
import { UpdateCategoryPermissionsCommand } from '@/modules/iam/application/security/commands/category-permissions/update-category-permissions/update-category-permissions.command';
import { CategoryPermissionsId } from '@/modules/iam/domain/value-objects/security/category-permissions-value-object/category-permissions-id';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { CategoryPermissionsName } from '@/modules/iam/domain/value-objects/security/category-permissions-value-object/category-permissions-name';
import { CategoryPermissionsDescription } from '@/modules/iam/domain/value-objects/security/category-permissions-value-object/category-permissions-description';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(UpdateCategoryPermissionsCommand)
export class UpdateCategoryPermissionsHandler implements ICommandHandler<UpdateCategoryPermissionsCommand> {
  constructor(
    private readonly repository: CategoryPermissionsRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: UpdateCategoryPermissionsCommand): Promise<void> {
    if (!command.category_permissions_dto.id) {
      throw new BadRequestException(
        'El ID de la categoría de permisos es requerido para actualizar',
      );
    }
    const categoryPermissionsEntity = await this.repository.findById(
      new CategoryPermissionsId(command.category_permissions_dto.id),
    );
    if (!categoryPermissionsEntity) {
      throw new NotFoundException(
        'CategoryPermissions',
        command.category_permissions_dto.id,
      );
    }

    categoryPermissionsEntity.update(
      new CategoryPermissionsName(command.category_permissions_dto.name),
      new CategoryPermissionsDescription(
        command.category_permissions_dto.description,
      ),
    );

    await this.repository.update(categoryPermissionsEntity);
    await this.dispatcher.dispatch(categoryPermissionsEntity.getDomainEvents());
    categoryPermissionsEntity.clearDomainEvents();
  }
}
