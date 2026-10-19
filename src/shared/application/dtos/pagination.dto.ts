import { PaginationParams } from '@/shared/domain/value-object/pagination-params';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

export class PaginationParamsDto {
  public page: number = DEFAULT_PAGE;
  public per_page: number = DEFAULT_PER_PAGE;

  constructor(page?: number, per_page?: number) {
    if (page !== undefined) this.page = page;
    if (per_page !== undefined) this.per_page = per_page;
  }

  static fromDomain(pagination: PaginationParams): PaginationParamsDto {
    return new PaginationParamsDto(
      pagination.getPage().value(),
      pagination.getPerPage().value(),
    );
  }
}

