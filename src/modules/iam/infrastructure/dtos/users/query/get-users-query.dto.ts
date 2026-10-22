import { IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import {
  EmailFilterDto,
  IdStatusFilterDto,
  NameFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetUsersQueryDto extends IntersectionType(
  PaginationQueryDto,
  NameFilterDto,
  EmailFilterDto,
  IdStatusFilterDto,
) {}
