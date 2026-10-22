import { IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
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
