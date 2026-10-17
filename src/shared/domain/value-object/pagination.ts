import { EntityList } from '@/shared/domain/value-object/entity-list';
import { Page } from '@/shared/domain/value-object/page';
import { PerPage } from '@/shared/domain/value-object/per-page';
import { TotalItems } from '@/shared/domain/value-object/total-items';
import { TotalPages } from '@/shared/domain/value-object/total-page';

export class Pagination<T> {
  constructor(
    private readonly entity_list: EntityList<T>,
    private readonly page: Page,
    private readonly per_page: PerPage,
    private readonly total_items: TotalItems,
    private readonly total_pages: TotalPages = new TotalPages(
      Math.ceil(this.total_items.value() / this.per_page.value()),
    ),
  ) { }
  getEntityList(): T[] {
    return this.entity_list.value();
  }
  getPage(): number {
    return this.page.value();
  }
  getPerPage(): number {
    return this.per_page.value();
  }

  getTotalItems(): number {
    return this.total_items.value();
  }
  getTotalPages(): number {
    return this.total_pages.value();
  }
}
