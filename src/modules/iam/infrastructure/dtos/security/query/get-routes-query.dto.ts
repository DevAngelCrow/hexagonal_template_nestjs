import { IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import {    
  ActiveFilterDto,
  IdParentFilterDto,
  NameFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetRoutesQueryDto extends IntersectionType(
  PaginationQueryDto,
  NameFilterDto,
  ActiveFilterDto,
  IdParentFilterDto,
) {}
