import { Pagination } from '@/shared/domain/value-object/pagination';
import { Document } from '@/modules/iam/domain/entities/document.entity';
import { GetDocumentsQuery } from '@/modules/iam/application/profile/queries/document/get-documents/get-documents.query';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { DocumentReadRepository } from '@/modules/iam/application/repositories/document-read.repository';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetDocumentsQuery)
export class GetDocumentsHandler implements IQueryHandler<GetDocumentsQuery> {
  constructor(private readonly repository: DocumentReadRepository) {}
  async execute(
    query: GetDocumentsQuery,
  ): Promise<Pagination<Document> | Document[]> {
    if (query.pagination_params) {
      const paginationParams = PaginationParams.create({
        ...query.pagination_params,
      });
      return await this.repository.getAll(paginationParams, query.filter);
    }
    return await this.repository.getAll(undefined, query.filter);
  }
}
