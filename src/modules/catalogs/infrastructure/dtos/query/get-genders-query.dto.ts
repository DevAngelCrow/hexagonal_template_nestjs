import { IntersectionType } from '@nestjs/swagger';
import { PaginationParamsDto } from '@/shared/application/dtos/pagination.dto';
import { FilterStringDto } from '@/shared/infrastructure/http/dtos/filters';


export class GetGendersQueryDto extends IntersectionType(
  PaginationParamsDto,
  FilterStringDto,
) {}
