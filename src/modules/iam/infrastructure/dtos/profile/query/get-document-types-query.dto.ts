import { IntersectionType } from '@nestjs/swagger';
import { PaginationParamsDto } from '@/shared/application/dtos/pagination.dto';
import {
  FilterNameDto,
  StatusBooleanFilterDto,
} from '@/shared/infrastructure/http/dtos/filters';


export class GetDocumentTypesQueryDto extends IntersectionType(
  PaginationParamsDto,
  FilterNameDto,
  StatusBooleanFilterDto,
) {}
