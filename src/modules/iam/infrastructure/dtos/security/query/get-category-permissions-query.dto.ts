import { IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import {
  ActiveFilterDto,
  NameFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetCategoryPermissionsQueryDto extends IntersectionType(
  PaginationQueryDto,
  NameFilterDto,
  ActiveFilterDto,
) {}
