import { Pagination } from '@/shared/domain/value-object/pagination';
import { GetDocumentTypesQuery } from '@/modules/iam/application/profile/queries/document-type/get-document-types/get-document-types.query';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { DocumentTypeReadRepository } from '@/modules/iam/application/repositories/document-type-read.repository';
import { DocumentTypeDto } from '@/modules/iam/application/profile/dtos/document-type.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetDocumentTypesQuery)
export class GetDocumentTypesHandler implements IQueryHandler<GetDocumentTypesQuery> {
  constructor(private readonly repository: DocumentTypeReadRepository) {}
  async execute(
    query: GetDocumentTypesQuery,
  ): Promise<Pagination<DocumentTypeDto> | DocumentTypeDto[]> {
    if (query.pagination_params) {
      const paginationParams = PaginationParams.create({
        ...query.pagination_params,
      });
      return await this.repository.getAll(
        paginationParams,
        query.filter,
        query.active,
      );
    }
    return await this.repository.getAll(undefined, query.filter, query.active);
  }
}
