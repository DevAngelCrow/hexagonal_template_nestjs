import { IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import {
  FilterNameDto,
  StatusBooleanFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetGlobalStatusesQueryDto extends IntersectionType(
  PaginationQueryDto,
  FilterNameDto,
  StatusBooleanFilterDto,
) {
  @IsOptional()
  @IsUUID()
  id_category?: string;

  @IsOptional()
  @IsString()
  code_category?: string;
}
