import { CategoryPermissions } from '../entities/category-permissions';
import { CategoryPermissionsId } from '../value-objects/category-permissions-value-object/category-permissions-id';

export abstract class CategoryPermissionsRepository {
  abstract create(category_permissions: CategoryPermissions): Promise<void>;
  abstract update(category_permissions: CategoryPermissions): Promise<void>;
  abstract findById(
    id: CategoryPermissionsId,
  ): Promise<CategoryPermissions | null>;
}
