import { CategoryStatusDto } from '@/modules/catalogs/application/dtos/category-status.dto';

export class UpdateCategoryStatusCommand {
  constructor(public readonly category_status_dto: CategoryStatusDto) {}
}
