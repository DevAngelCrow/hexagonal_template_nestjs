import { CategoryPermissions } from '@/modules/iam/domain/entities/category-permissions.entity';
import { CategoryPermissionsId } from '@/modules/iam/domain/value-objects/security/category-permissions-value-object/category-permissions-id';

export abstract class CategoryPermissionsRepository {
  abstract create(category_permissions: CategoryPermissions): Promise<void>;
  abstract update(category_permissions: CategoryPermissions): Promise<void>;
  abstract findById(
    id: CategoryPermissionsId,
  ): Promise<CategoryPermissions | null>;
}
