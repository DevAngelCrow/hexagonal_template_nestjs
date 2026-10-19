import { GetDocumentTypeByIdQuery } from '@/modules/iam/application/profile/queries/document-type/get-document-type-by-id/get-document-type-by-id.query';
import { DocumentTypeReadRepository } from '@/modules/iam/application/repositories/document-type-read.repository';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetDocumentTypeByIdQuery)
export class GetDocumentTypeByIdHandler implements IQueryHandler<GetDocumentTypeByIdQuery> {
  constructor(private readonly repository: DocumentTypeReadRepository) {}
  async execute(query: GetDocumentTypeByIdQuery) {
    return await this.repository.getOneById(query.id);
  }
}
