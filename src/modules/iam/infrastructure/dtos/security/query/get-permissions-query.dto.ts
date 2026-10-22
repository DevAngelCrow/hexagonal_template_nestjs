import { IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import {
  ActiveFilterDto,
  NameFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetPermissionsQueryDto extends IntersectionType(
  PaginationQueryDto,
  NameFilterDto,
  ActiveFilterDto,
) {
  @IsOptional()
  @IsUUID()
  category_permission_id?: string;
}
