import { CategoryPermissionsDto } from '@/modules/iam/application/security/dtos/category-permissions.dto';

export class CreateCategoryPermissionsCommand {
  constructor(
    public readonly category_permissions_dto: CategoryPermissionsDto,
  ) {}
}
