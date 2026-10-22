import { IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import {
  ActiveFilterDto,
  FilterStringDto,
  IdCountryFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetGeographicDivisionTypesQueryDto extends IntersectionType(
  PaginationQueryDto,
  FilterStringDto,
  ActiveFilterDto,
  IdCountryFilterDto,
) {}
