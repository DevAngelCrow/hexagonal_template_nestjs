import { IntersectionType } from '@nestjs/swagger';
import { PaginationParamsDto } from '@/shared/application/dtos/pagination.dto';
import {
  ActiveFilterDto,
  IdParentFilterDto,
  NameFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetRoutesQueryDto extends IntersectionType(
  PaginationParamsDto,
  NameFilterDto,
  ActiveFilterDto,
  IdParentFilterDto,
) {}
