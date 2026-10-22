import { IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import {
  IdStatusFilterDto,
  NameFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetRolesQueryDto extends IntersectionType(
  PaginationQueryDto,
  NameFilterDto,
  IdStatusFilterDto,
) {}
