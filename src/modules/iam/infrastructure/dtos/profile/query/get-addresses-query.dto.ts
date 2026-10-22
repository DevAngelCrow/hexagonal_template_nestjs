import { IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import { FilterStringDto } from '@/shared/infrastructure/http/dtos/filters';


export class GetAddressesQueryDto extends IntersectionType(
  PaginationQueryDto,
  FilterStringDto,
) {}
