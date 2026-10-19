import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

/**
 * Query-side pagination DTO for HTTP controllers.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === '' || value === null
      ? DEFAULT_PAGE
      : Number(value),
  )
  @IsInt()
  @IsPositive()
  public page: number = DEFAULT_PAGE;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === '' || value === null
      ? DEFAULT_PER_PAGE
      : Number(value),
  )
  @IsInt()
  @IsPositive()
  @Max(MAX_PER_PAGE)
  public per_page: number = DEFAULT_PER_PAGE;

  constructor(page?: number, per_page?: number) {
    if (page !== undefined) this.page = page;
    if (per_page !== undefined) this.per_page = per_page;
  }

  static fromDomain(pagination: PaginationParams): PaginationQueryDto {
    return new PaginationQueryDto(
      pagination.getPage().value(),
      pagination.getPerPage().value(),
    );
  }
}

export { PaginationQueryDto as PaginationParamsDto };

