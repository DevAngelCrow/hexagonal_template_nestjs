import { IntersectionType } from '@nestjs/swagger';
import { PaginationParamsDto } from '@/shared/application/dtos/pagination.dto';
import {
  EmailFilterDto,
  IdStatusFilterDto,
  NameFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetUsersQueryDto extends IntersectionType(
  PaginationParamsDto,
  NameFilterDto,
  EmailFilterDto,
  IdStatusFilterDto,
) {}
