import { CategoryStatus } from '@/modules/catalogs/domain/entities/category-status';
import { CategoryStatusId } from '@/modules/catalogs/domain/value-objects/category-status-value-object/category-status-id';

export abstract class CategoryStatusRepository {
  abstract create(category_status: CategoryStatus): Promise<void>;
  abstract update(category_status: CategoryStatus): Promise<void>;
  abstract toggleStatus(id: CategoryStatusId): Promise<CategoryStatus>;
}
