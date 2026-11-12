import { IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import { CursorPaginationQueryDto } from '@/shared/infrastructure/http/dtos/cursor-pagination-query.dto';
import {
  ActiveFilterDto,
  FilterStringDto,
  IdCountryFilterDto,
  IdParentFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';

export class GetGeographicDivisionsQueryDto extends IntersectionType(
  PaginationQueryDto,
  FilterStringDto,
  ActiveFilterDto,
  IdCountryFilterDto,
  IdParentFilterDto,
) {
  @IsOptional()
  @IsUUID()
  id_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  level?: number;
}

export class GetPublicGeographicDivisionsQueryDto {
  @IsOptional()
  @IsUUID()
  id_country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  level?: number;
}

export class GetGeographicDivisionsCursorQueryDto extends IntersectionType(
  CursorPaginationQueryDto,
  FilterStringDto,
  ActiveFilterDto,
  IdCountryFilterDto,
  IdParentFilterDto,
) {
  @IsOptional()
  @IsUUID()
  id_type?: string;
}
