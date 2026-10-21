import { CategoryStatusDto } from '@/modules/catalogs/application/dtos/category-status.dto';

export class CreateCategoryStatusCommand {
  constructor(public readonly category_status_dto: CategoryStatusDto) {}
}
