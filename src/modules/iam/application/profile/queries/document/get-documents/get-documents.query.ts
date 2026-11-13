import { PaginationParamsDto } from '@/shared/application/dtos/pagination.dto';

export class GetDocumentsQuery {
  constructor(
    public readonly pagination_params?: PaginationParamsDto,
    public readonly filter?: string,
    public readonly id_people?: string,
  ) {}
}
