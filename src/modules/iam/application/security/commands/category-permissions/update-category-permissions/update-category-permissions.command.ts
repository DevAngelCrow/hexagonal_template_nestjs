import { CategoryPermissionsDto } from '@/modules/iam/application/security/dtos/category-permissions.dto';

export class UpdateCategoryPermissionsCommand {
  constructor(
    public readonly category_permissions_dto: CategoryPermissionsDto,
  ) {}
}
