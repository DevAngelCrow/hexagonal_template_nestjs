import { IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';

export class GetStorageFilesQueryDto extends IntersectionType(
  PaginationQueryDto,
) {
  @IsOptional()
  @IsString()
  id_provider?: string;
}
