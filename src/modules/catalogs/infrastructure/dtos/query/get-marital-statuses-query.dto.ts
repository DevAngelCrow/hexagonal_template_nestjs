import { IntersectionType } from '@nestjs/swagger';
import { PaginationParamsDto } from '@/shared/application/dtos/pagination.dto';
import { FilterStringDto } from '@/shared/infrastructure/http/dtos/filters';


export class GetMaritalStatusesQueryDto extends IntersectionType(
  PaginationParamsDto,
  FilterStringDto,
) {}
