import { IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/shared/infrastructure/http/dtos/pagination-query.dto';
import {
  FilterNameDto,
  StatusBooleanFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetDocumentTypesQueryDto extends IntersectionType(
  PaginationQueryDto,
  FilterNameDto,
  StatusBooleanFilterDto,
) {}
